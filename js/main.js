/**
 * Dungeon Keep - Main Entry Point
 * Canvas setup, input handling, and render loop
 */
window.DK = window.DK || {};

(function() {
  // Canvas elements
  const gameCanvas = document.getElementById('game-canvas');
  const uiCanvas = document.getElementById('ui-canvas');
  const gameCtx = gameCanvas.getContext('2d');
  const uiCtx = uiCanvas.getContext('2d');

  // Set canvas sizes
  gameCanvas.width = DK.CONFIG.DISPLAY_WIDTH;
  gameCanvas.height = DK.CONFIG.DISPLAY_HEIGHT;
  uiCanvas.width = DK.CONFIG.DISPLAY_WIDTH;
  uiCanvas.height = DK.CONFIG.DISPLAY_HEIGHT;

  // Create offscreen canvas for pixel art (low resolution)
  const offscreen = document.createElement('canvas');
  offscreen.width = DK.CONFIG.GAME_WIDTH;
  offscreen.height = DK.CONFIG.GAME_HEIGHT;
  const offCtx = offscreen.getContext('2d');

  // Disable image smoothing for pixel-perfect rendering
  function disableSmoothing(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
  }

  disableSmoothing(gameCtx);
  disableSmoothing(offCtx);

  // Initialize game
  DK.Game.init();

  // Input handling
  uiCanvas.addEventListener('click', (e) => {
    const rect = uiCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (DK.Game.gameOver) {
      DK.Game.restart();
      return;
    }

    DK.UI.handleClick(mx, my);
  });

  uiCanvas.addEventListener('mousemove', (e) => {
    const rect = uiCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    DK.UI.handleMouseMove(mx, my);
  });

  // Right click to deselect everything
  uiCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    DK.UI.clearSelection();
  });

  // Game loop
  let lastTime = performance.now();

  function gameLoop(timestamp) {
    const dt = Math.min(timestamp - lastTime, 50); // Cap delta time
    lastTime = timestamp;

    // Update
    DK.Game.update(dt);

    // Render game world (low-res pixel art)
    offCtx.clearRect(0, 0, DK.CONFIG.GAME_WIDTH, DK.CONFIG.GAME_HEIGHT);
    DK.Map.render(offCtx);
    DK.Traps.render(offCtx);
    DK.Enemies.render(offCtx, DK.Game.time);
    if (DK.Heroes) DK.Heroes.render(offCtx, DK.Game.time);
    renderEffects(offCtx);

    // Scale pixel art to display canvas
    gameCtx.clearRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);
    disableSmoothing(gameCtx);

    // Fill background
    gameCtx.fillStyle = DK.COLORS.UI_BG;
    gameCtx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);

    // Draw scaled pixel art (with screen shake)
    let shakeX = 0;
    let shakeY = 0;
    if (DK.Game.screenShake && DK.Game.screenShake.timer > 0) {
      const intensity = DK.Game.screenShake.intensity *
        (DK.Game.screenShake.timer / 300);
      shakeX = Math.round((Math.random() - 0.5) * intensity * 2);
      shakeY = Math.round((Math.random() - 0.5) * intensity * 2);
    }

    gameCtx.drawImage(
      offscreen,
      0, 0, DK.CONFIG.GAME_WIDTH, DK.CONFIG.GAME_HEIGHT,
      shakeX, shakeY, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.GAME_HEIGHT * DK.CONFIG.SCALE
    );

    // Render UI overlay (high-res for crisp text)
    uiCtx.clearRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);
    DK.UI.render(uiCtx);

    requestAnimationFrame(gameLoop);
  }

  function renderEffects(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;

    for (const effect of DK.Game.effects) {
      const progress = effect.timer / effect.duration;

      switch (effect.type) {
        case 'projectile': {
          const t = Math.min(1, progress * 3);
          const px = effect.x + (effect.targetX - effect.x) * t;
          const py = effect.y + (effect.targetY - effect.y) * t;
          const ipx = Math.round(px);
          const ipy = Math.round(py);

          // Direction for trail
          const dx = effect.targetX - effect.x;
          const dy = effect.targetY - effect.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dx / len;
          const ny = -dy / len;

          if (effect.trapType === 'fire_bolt') {
            // Fire bolt from fire mage: orange-red fireball
            PA.pixel(ctx, ipx, ipy, '#ffffff');
            PA.pixel(ctx, ipx + 1, ipy, '#ffaa44');
            PA.pixel(ctx, ipx - 1, ipy, '#ffaa44');
            PA.pixel(ctx, ipx, ipy - 1, '#ff6622');
            PA.pixel(ctx, ipx, ipy + 1, '#ff6622');
            // Fire trail
            for (let i = 2; i < 5; i++) {
              PA.pixel(ctx, ipx + Math.round(nx * i), ipy + Math.round(ny * i),
                       i < 3 ? '#ff6622' : '#882200');
            }
            // Sparks
            if (Math.random() > 0.4) {
              PA.pixel(ctx, ipx + Math.round((Math.random() - 0.5) * 3),
                       ipy + Math.round((Math.random() - 0.5) * 3), '#ffcc44');
            }
          } else if (effect.trapType === 'water_bolt') {
            // Water bolt: blue water sphere
            PA.pixel(ctx, ipx, ipy, '#ffffff');
            PA.pixel(ctx, ipx - 1, ipy, '#66aaff');
            PA.pixel(ctx, ipx + 1, ipy, '#66aaff');
            PA.pixel(ctx, ipx, ipy - 1, '#4488ff');
            PA.pixel(ctx, ipx, ipy + 1, '#4488ff');
            // Trail (water droplets)
            PA.pixel(ctx, ipx + Math.round(nx * 2), ipy + Math.round(ny * 2), '#4488ff');
            PA.pixel(ctx, ipx + Math.round(nx * 3), ipy + Math.round(ny * 3), '#2266cc');
            // Splash sparkle
            if (Math.random() > 0.5) {
              PA.pixel(ctx, ipx + Math.round((Math.random() - 0.5) * 3),
                       ipy + Math.round((Math.random() - 0.5) * 3), '#88ccff');
            }
          } else {
            // Generic projectile: metal bolt
            PA.pixel(ctx, ipx, ipy, '#d0d8e0');
            PA.pixel(ctx, ipx + Math.round(nx), ipy + Math.round(ny), C.TRAP_METAL_LIGHT);
            PA.pixel(ctx, ipx + Math.round(nx * 2), ipy + Math.round(ny * 2), C.TRAP_METAL);
            PA.pixel(ctx, ipx + Math.round(nx * 3), ipy + Math.round(ny * 3), C.TRAP_METAL_DARK);
          }
          break;
        }

        case 'explosion': {
          const maxR = effect.radius;
          const expandProgress = Math.min(1, progress * 2);
          const fadeProgress = Math.max(0, (progress - 0.3) / 0.7);

          // Phase 1: White flash (0-20%)
          if (progress < 0.2) {
            const flashR = maxR * progress * 3;
            PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                     Math.round(flashR), '#ffffff');
          }

          // Phase 2: Fire ring expanding (10-60%)
          if (progress > 0.1 && progress < 0.6) {
            const ringR = maxR * expandProgress;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
              const r = ringR * (0.7 + Math.random() * 0.3);
              const epx = Math.round(effect.x + Math.cos(angle) * r);
              const epy = Math.round(effect.y + Math.sin(angle) * r);
              const color = Math.random() > 0.5 ? '#ff6622' : '#ffaa44';
              PA.pixel(ctx, epx, epy, color);
              // Inner fire
              const ir = r * 0.6;
              PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * ir),
                       Math.round(effect.y + Math.sin(angle) * ir),
                       Math.random() > 0.5 ? '#ffcc44' : '#ff8822');
            }
          }

          // Phase 3: Smoke and embers (30-100%)
          if (progress > 0.3) {
            const smokeR = maxR * 1.2;
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2 + progress * 2;
              const r = smokeR * (0.5 + Math.random() * 0.5) * (1 - fadeProgress * 0.5);
              const spx = Math.round(effect.x + Math.cos(angle) * r);
              const spy = Math.round(effect.y + Math.sin(angle) * r - fadeProgress * 3);
              PA.pixel(ctx, spx, spy, '#443322');
              // Embers
              if (Math.random() > 0.7) {
                PA.pixel(ctx, spx + 1, spy - 1, '#ff6622');
              }
            }
          }

          // Scorch mark at center (persists)
          if (progress > 0.4) {
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#1a1008');
            PA.pixel(ctx, Math.round(effect.x) + 1, Math.round(effect.y), '#1a1008');
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y) + 1, '#1a1008');
          }
          break;
        }

        case 'electrocute_burst': {
          // Lightning burst at enemy position
          const burstProgress = progress;
          const burstRadius = 3 + burstProgress * 8;
          const burstAlpha = 1 - burstProgress;

          // White flash
          if (burstProgress < 0.15) {
            PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 3, '#ffffff');
          }

          // Lightning arcs radiating outward
          if (burstAlpha > 0.1) {
            for (let i = 0; i < 6; i++) {
              const angle = (i / 6) * Math.PI * 2 + burstProgress * 4;
              const r = burstRadius * (0.6 + Math.random() * 0.4);
              const epx = Math.round(effect.x + Math.cos(angle) * r);
              const epy = Math.round(effect.y + Math.sin(angle) * r);
              const color = Math.random() > 0.5 ? '#ffffff' : '#ffff44';
              PA.pixel(ctx, epx, epy, color);
              // Mid-point spark
              const mr = r * 0.5;
              PA.pixel(ctx, Math.round(effect.x + Math.cos(angle + 0.3) * mr),
                       Math.round(effect.y + Math.sin(angle + 0.3) * mr), '#ffdd44');
            }
          }
          break;
        }

        case 'chain_lightning': {
          // Lightning arc between two points
          const chainAlpha = 1 - progress;
          if (chainAlpha < 0.1) break;

          const dx = effect.targetX - effect.x;
          const dy = effect.targetY - effect.y;
          const steps = 8;

          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            // Base position along the line
            let px = effect.x + dx * t;
            let py = effect.y + dy * t;
            // Add jagged offset (perpendicular to line)
            if (i > 0 && i < steps) {
              const perpX = -dy;
              const perpY = dx;
              const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
              const offset = (Math.random() - 0.5) * 4;
              px += (perpX / len) * offset;
              py += (perpY / len) * offset;
            }
            const color = Math.random() > 0.3 ? '#ffff44' : '#ffffff';
            PA.pixel(ctx, Math.round(px), Math.round(py), color);
          }
          break;
        }

        case 'water_nova': {
          // AoE water burst - expanding blue ring showing AoE radius
          const novaProgress = progress;
          const novaR = (effect.radius || 16) * novaProgress;
          const novaFade = 1 - novaProgress;

          if (novaFade > 0.1) {
            // Expanding blue ring (flattened for perspective)
            for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
              const r = novaR * (0.9 + Math.random() * 0.1);
              const npx = Math.round(effect.x + Math.cos(angle) * r);
              const npy = Math.round(effect.y + Math.sin(angle) * r * 0.6);
              const color = Math.random() > 0.4 ? '#66aaff' : '#aaddff';
              PA.pixel(ctx, npx, npy, color);
              // Inner water fill (early phase)
              if (novaProgress < 0.5) {
                const ir = r * 0.6;
                PA.pixel(ctx, Math.round(effect.x + Math.cos(angle + 0.1) * ir),
                         Math.round(effect.y + Math.sin(angle + 0.1) * ir * 0.6),
                         'rgba(68,136,255,0.3)');
              }
            }
            // Center bright flash
            if (novaProgress < 0.2) {
              PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                        Math.round(2 + novaProgress * 4), '#aaddff');
            }
            // Water droplets flying outward
            for (let i = 0; i < 8; i++) {
              const dAngle = (i / 8) * Math.PI * 2 + novaProgress * 2;
              const dR = novaR * 1.1;
              const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
              const dpy = Math.round(effect.y + Math.sin(dAngle) * dR * 0.6 - novaProgress * 3);
              PA.pixel(ctx, dpx, dpy, '#88ccff');
            }
          }
          break;
        }

        case 'water_splash': {
          // Expanding water ring when wet status first applied
          const splashProgress = progress;
          const splashR = 2 + splashProgress * 6;
          const splashFade = 1 - splashProgress;

          if (splashFade > 0.1) {
            // Expanding water ring (flattened for perspective)
            for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
              const r = splashR * (0.8 + Math.random() * 0.2);
              const spx = Math.round(effect.x + Math.cos(angle) * r);
              const spy = Math.round(effect.y + Math.sin(angle) * r * 0.5);
              const color = Math.random() > 0.5 ? '#66aaff' : '#4488ff';
              PA.pixel(ctx, spx, spy, color);
            }
            // Bright center burst
            if (splashProgress < 0.3) {
              PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#aaddff');
            }
            // Rising droplets
            for (let i = 0; i < 4; i++) {
              const dAngle = (i / 4) * Math.PI * 2 + splashProgress * 3;
              const dR = splashR * 0.6;
              const dpy = Math.round(effect.y - splashProgress * 6 + Math.sin(dAngle) * 2);
              const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
              PA.pixel(ctx, dpx, dpy, '#88ccff');
            }
          }
          break;
        }

        case 'push_wave': {
          // Directional force wave from push trap
          const pushProgress = progress;
          const pushFade = 1 - pushProgress;

          if (pushFade > 0.1) {
            const dx = effect.dx || 0;
            const dy = effect.dy || 0;

            // Expanding wind lines in push direction
            for (let i = 0; i < 6; i++) {
              const spread = (i - 2.5) * 2;
              const dist = pushProgress * 16;
              const px = Math.round(effect.x + dx * dist + (dy !== 0 ? spread : 0));
              const py = Math.round(effect.y + dy * dist + (dx !== 0 ? spread : 0));
              const color = Math.random() > 0.5 ? '#ffaa44' : '#ff8822';
              PA.pixel(ctx, px, py, color);

              // Trail particles
              const tdist = dist * 0.6;
              PA.pixel(ctx, Math.round(effect.x + dx * tdist + (dy !== 0 ? spread * 0.7 : 0)),
                       Math.round(effect.y + dy * tdist + (dx !== 0 ? spread * 0.7 : 0)),
                       '#ff6622');
            }

            // Central force line (bright)
            if (pushProgress < 0.5) {
              const cDist = pushProgress * 20;
              PA.pixel(ctx, Math.round(effect.x + dx * cDist),
                       Math.round(effect.y + dy * cDist), '#ffffff');
              PA.pixel(ctx, Math.round(effect.x + dx * cDist * 0.7),
                       Math.round(effect.y + dy * cDist * 0.7), '#ffcc66');
            }
          }
          break;
        }

        case 'abyss_fall': {
          // 敵人消失入深淵
          const fallProgress = progress;
          const fallFade = 1 - fallProgress;

          if (fallFade > 0.05) {
            // 黑暗漩渦（而非熔岩飛濺）
            const vortexR = 2 + fallProgress * 4;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
              const r = vortexR * (0.8 + Math.random() * 0.2);
              const spin = angle + fallProgress * 6; // 旋轉效果
              const spx = Math.round(effect.x + Math.cos(spin) * r);
              const spy = Math.round(effect.y + Math.sin(spin) * r * 0.5);
              PA.pixel(ctx, spx, spy, '#1a1a2a');
            }

            // 碎石掉落
            if (fallProgress < 0.6) {
              for (let i = 0; i < 3; i++) {
                const rx = Math.round(effect.x + (Math.random() - 0.5) * 6);
                const ry = Math.round(effect.y + fallProgress * 4 + Math.random() * 2);
                PA.pixel(ctx, rx, ry, Math.random() > 0.5 ? '#2a2838' : '#1a1a2a');
              }
            }

            // 中心暗點（深淵入口）
            if (fallProgress < 0.4) {
              PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                        Math.round(2 - fallProgress * 3), '#050508');
            }
          }
          break;
        }

        case 'fire_bolt': {
          // 火球投射物
          const t = Math.min(1, progress * 3);
          const px = effect.x + (effect.targetX - effect.x) * t;
          const py = effect.y + (effect.targetY - effect.y) * t;
          const ipx = Math.round(px);
          const ipy = Math.round(py);
          // 方向
          const dx = effect.targetX - effect.x;
          const dy = effect.targetY - effect.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const nx = -dx / len;
          const ny = -dy / len;
          // 火球核心（白→橘→紅）
          PA.pixel(ctx, ipx, ipy, '#ffffff');
          PA.pixel(ctx, ipx + 1, ipy, '#ffaa44');
          PA.pixel(ctx, ipx - 1, ipy, '#ffaa44');
          PA.pixel(ctx, ipx, ipy - 1, '#ff6622');
          PA.pixel(ctx, ipx, ipy + 1, '#ff6622');
          PA.pixel(ctx, ipx + 1, ipy + 1, '#ff6622');
          PA.pixel(ctx, ipx - 1, ipy - 1, '#ff6622');
          // 火尾跡
          for (let i = 2; i < 5; i++) {
            PA.pixel(ctx, ipx + Math.round(nx * i), ipy + Math.round(ny * i),
                     i < 3 ? '#ff6622' : '#882200');
          }
          // 火花
          if (Math.random() > 0.4) {
            PA.pixel(ctx, ipx + Math.round((Math.random()-0.5)*3),
                     ipy + Math.round((Math.random()-0.5)*3), '#ffcc44');
          }
          break;
        }

        case 'ice_ray': {
          // 直線冰霜射線
          const rayProgress = Math.min(1, progress * 2);
          const dx = effect.targetX - effect.x;
          const dy = effect.targetY - effect.y;
          const steps = 12;
          for (let i = 0; i <= Math.round(steps * rayProgress); i++) {
            const t = i / steps;
            const px = Math.round(effect.x + dx * t);
            const py = Math.round(effect.y + dy * t);
            const color = Math.random() > 0.3 ? '#88ccff' : '#aaddff';
            PA.pixel(ctx, px, py, color);
            // 散開的冰晶
            if (i % 3 === 0 && Math.random() > 0.5) {
              PA.pixel(ctx, px + Math.round((Math.random()-0.5)*2),
                       py + Math.round((Math.random()-0.5)*2), '#ffffff');
            }
          }
          // 起點光暈
          if (rayProgress < 0.5) {
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#ffffff');
          }
          break;
        }

        case 'blaze_explosion': {
          // 烈焰引爆 - 比普通 explosion 更大更紅
          const blazeMaxR = (effect.radius || 6) * 1.3;
          const blazeExpand = Math.min(1, progress * 2);
          const blazeFade = Math.max(0, (progress - 0.3) / 0.7);

          // Phase 1：白色閃光（0-15%）半徑更大
          if (progress < 0.15) {
            const flashR = blazeMaxR * progress * 4;
            PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                     Math.round(flashR), '#ffffff');
          }

          // Phase 2：橘紅火焰環（10-50%）+ 外層衝擊波環
          if (progress > 0.1 && progress < 0.5) {
            const ringR = blazeMaxR * blazeExpand;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
              const r = ringR * (0.7 + Math.random() * 0.3);
              const epx = Math.round(effect.x + Math.cos(angle) * r);
              const epy = Math.round(effect.y + Math.sin(angle) * r);
              const color = Math.random() > 0.5 ? '#ff4400' : '#ff6622';
              PA.pixel(ctx, epx, epy, color);
              // 內層火焰
              const ir = r * 0.6;
              PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * ir),
                       Math.round(effect.y + Math.sin(angle) * ir),
                       Math.random() > 0.5 ? '#ffcc44' : '#ffaa22');
            }
            // 外層衝擊波環
            const shockR = ringR * 1.4;
            for (let angle = 0; angle < Math.PI * 2; angle += 0.35) {
              const sr = shockR * (0.95 + Math.random() * 0.05);
              PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * sr),
                       Math.round(effect.y + Math.sin(angle) * sr), '#ff6633');
            }
          }

          // Phase 3：煙霧和餘燼（30-100%）
          if (progress > 0.3) {
            const smokeR = blazeMaxR * 1.3;
            for (let i = 0; i < 8; i++) {
              const angle = (i / 8) * Math.PI * 2 + progress * 2;
              const r = smokeR * (0.5 + Math.random() * 0.5) * (1 - blazeFade * 0.5);
              const spx = Math.round(effect.x + Math.cos(angle) * r);
              const spy = Math.round(effect.y + Math.sin(angle) * r - blazeFade * 4);
              PA.pixel(ctx, spx, spy, '#443322');
              // 餘燼
              if (Math.random() > 0.6) {
                PA.pixel(ctx, spx + 1, spy - 1, '#ff6622');
              }
            }
          }

          // 焦痕
          if (progress > 0.4) {
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#1a0808');
            PA.pixel(ctx, Math.round(effect.x) + 1, Math.round(effect.y), '#1a0808');
            PA.pixel(ctx, Math.round(effect.x) - 1, Math.round(effect.y), '#1a0808');
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y) + 1, '#1a0808');
          }
          break;
        }

        case 'fire_splash': {
          // 火焰飛濺 - 首次掛上 burning 時的視覺效果
          const fireSplashP = progress;
          const fireSplashR = 2 + fireSplashP * 5;
          const fireSplashFade = 1 - fireSplashP;

          if (fireSplashFade > 0.1) {
            // 擴散的火焰環
            for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
              const r = fireSplashR * (0.8 + Math.random() * 0.2);
              const spx = Math.round(effect.x + Math.cos(angle) * r);
              const spy = Math.round(effect.y + Math.sin(angle) * r * 0.5);
              const color = Math.random() > 0.5 ? '#ffaa44' : '#ff6622';
              PA.pixel(ctx, spx, spy, color);
            }
            // 中心閃光
            if (fireSplashP < 0.3) {
              PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#ffffff');
            }
            // 上升火花
            for (let i = 0; i < 3; i++) {
              const dAngle = (i / 3) * Math.PI * 2 + fireSplashP * 4;
              const dR = fireSplashR * 0.5;
              const dpy = Math.round(effect.y - fireSplashP * 5 + Math.sin(dAngle) * 2);
              const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
              PA.pixel(ctx, dpx, dpy, '#ffcc44');
            }
          }
          break;
        }

        case 'ice_splash': {
          // 冰霜飛濺 - 首次掛上 frozen_mark 時的視覺效果
          const iceSplashP = progress;
          const iceSplashR = 2 + iceSplashP * 5;
          const iceSplashFade = 1 - iceSplashP;

          if (iceSplashFade > 0.1) {
            // 擴散的冰晶環
            for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
              const r = iceSplashR * (0.8 + Math.random() * 0.2);
              const spx = Math.round(effect.x + Math.cos(angle) * r);
              const spy = Math.round(effect.y + Math.sin(angle) * r * 0.5);
              const color = Math.random() > 0.5 ? '#88ccff' : '#aaddff';
              PA.pixel(ctx, spx, spy, color);
            }
            // 中心冰核
            if (iceSplashP < 0.3) {
              PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#ffffff');
            }
            // 飄散冰晶
            for (let i = 0; i < 4; i++) {
              const dAngle = (i / 4) * Math.PI * 2 + iceSplashP * 3;
              const dR = iceSplashR * 0.6;
              const dpy = Math.round(effect.y - iceSplashP * 4 + Math.sin(dAngle) * 2);
              const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
              PA.pixel(ctx, dpx, dpy, '#ccddff');
            }
          }
          break;
        }

        case 'fire_nova': {
          // 火法師 AoE 爆發 - 擴散的火焰圈
          const novaR = (effect.radius || 16) * progress;
          const novaFade = 1 - progress;

          if (novaFade > 0.1) {
            // 擴散的火焰環
            for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
              const r = novaR * (0.9 + Math.random() * 0.1);
              const npx = Math.round(effect.x + Math.cos(angle) * r);
              const npy = Math.round(effect.y + Math.sin(angle) * r * 0.6);
              const color = Math.random() > 0.4 ? '#ff6622' : '#ffaa44';
              PA.pixel(ctx, npx, npy, color);
              // 內層火焰填充（早期階段）
              if (progress < 0.5) {
                const ir = r * 0.6;
                PA.pixel(ctx, Math.round(effect.x + Math.cos(angle + 0.1) * ir),
                         Math.round(effect.y + Math.sin(angle + 0.1) * ir * 0.6),
                         Math.random() > 0.5 ? '#ffcc44' : '#ff8822');
              }
            }
            // 中心火核（早期閃光）
            if (progress < 0.2) {
              PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                       Math.round(3 - progress * 10), '#ffffff');
            }
          }
          break;
        }

        case 'burn_status': {
          // 燃燒狀態持續視覺（地面火焰殘留）
          const burnFade = 1 - progress;
          if (burnFade > 0.1) {
            // 地面小火焰閃爍
            const flickerOffset = Math.sin(effect.timer / 80) * 0.5;
            const flameH = 2 + flickerOffset;
            // 中心火焰
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y - flameH), '#ffaa44');
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y - flameH + 1), '#ff6622');
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#882200');
            // 左右小火舌
            if (Math.random() > 0.3) {
              PA.pixel(ctx, Math.round(effect.x - 1), Math.round(effect.y - flameH * 0.5), '#ff6622');
              PA.pixel(ctx, Math.round(effect.x + 1), Math.round(effect.y - flameH * 0.7), '#ffcc44');
            }
            // 隨機火花
            if (Math.random() > 0.7) {
              PA.pixel(ctx, Math.round(effect.x + (Math.random() - 0.5) * 3),
                       Math.round(effect.y - 2 - Math.random() * 3), '#ffdd66');
            }
            // 地面焦痕
            PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y + 1), '#1a0808');
          }
          break;
        }

        case 'blizzard_zone': {
          // 持續性減速區域（像素風格渲染）
          const zoneRadius = (effect.radius || 24);
          const zoneFade = 1 - progress;
          if (zoneFade > 0.1) {
            // 像素化橢圓底座：用水平掃描線模擬
            const cx = Math.round(effect.x);
            const cy = Math.round(effect.y);
            const ry = Math.round(zoneRadius * 0.6);
            const baseColor = `rgba(100,170,238,${zoneFade * 0.15})`;
            for (let dy = -ry; dy <= ry; dy += 2) {
              const yRatio = dy / ry;
              const halfW = Math.round(zoneRadius * Math.sqrt(Math.max(0, 1 - yRatio * yRatio)));
              if (halfW > 0) {
                PA.rect(ctx, cx - halfW, cy + dy, halfW * 2, 2, baseColor);
              }
            }
            // 飛舞的冰晶粒子
            for (let i = 0; i < 8; i++) {
              const angle = (i/8)*Math.PI*2 + progress*4;
              const r = zoneRadius * (0.3 + Math.random()*0.7);
              const px = Math.round(effect.x + Math.cos(angle) * r);
              const py = Math.round(effect.y + Math.sin(angle) * r * 0.6 - Math.random()*3);
              PA.pixel(ctx, px, py, Math.random() > 0.5 ? '#aaddff' : '#88ccff');
            }
            // 邊緣冰霜像素點
            for (let angle = 0; angle < Math.PI*2; angle += 0.3) {
              const r = zoneRadius * (0.9 + Math.random()*0.1);
              PA.pixel(ctx, Math.round(effect.x + Math.cos(angle)*r),
                       Math.round(effect.y + Math.sin(angle)*r*0.6),
                       '#88ccff');
            }
          }
          break;
        }

        case 'evolution_burst': {
          // 進化爆發光效
          const evoProgress = progress;
          const evoR = 4 + evoProgress * 12;
          const evoFade = 1 - evoProgress;

          if (evoFade > 0.05) {
            // 金色光環擴散
            for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
              const r = evoR * (0.8 + Math.random() * 0.2);
              const epx = Math.round(effect.x + Math.cos(angle) * r);
              const epy = Math.round(effect.y + Math.sin(angle) * r * 0.6);
              const color = Math.random() > 0.5 ? '#ffd700' : '#ffaa00';
              PA.pixel(ctx, epx, epy, color);
            }
            // 中心白色閃光
            if (evoProgress < 0.3) {
              PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                        Math.round(3 - evoProgress * 8), '#ffffff');
            }
            // 上升金色粒子
            for (let i = 0; i < 6; i++) {
              const pAngle = (i / 6) * Math.PI * 2 + evoProgress * 3;
              const pr = evoR * 0.5;
              const ppx = Math.round(effect.x + Math.cos(pAngle) * pr);
              const ppy = Math.round(effect.y - evoProgress * 8 + Math.sin(pAngle) * 2);
              PA.pixel(ctx, ppx, ppy, '#ffdd44');
            }
          }
          break;
        }

        case 'stun_wave': {
          // 眩暈衝擊波 - 擴散的白色環（像素風格渲染）
          const stunProgress = progress;
          const stunR = (effect.radius || 16) * stunProgress;
          const stunFade = 1 - stunProgress;

          if (stunFade > 0.1) {
            for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
              const r = stunR * (0.95 + Math.random() * 0.05);
              const spx = Math.round(effect.x + Math.cos(angle) * r);
              const spy = Math.round(effect.y + Math.sin(angle) * r * 0.6);
              PA.pixel(ctx, spx, spy, Math.random() > 0.5 ? '#ffffff' : '#ffddaa');
            }
            // 像素化內部填充
            if (stunProgress < 0.4) {
              const scx = Math.round(effect.x);
              const scy = Math.round(effect.y);
              const sry = Math.round(stunR * 0.6);
              const fillColor = `rgba(255,255,255,${stunFade * 0.1})`;
              for (let dy = -sry; dy <= sry; dy += 2) {
                const yRatio = dy / sry;
                const halfW = Math.round(stunR * Math.sqrt(Math.max(0, 1 - yRatio * yRatio)));
                if (halfW > 0) {
                  PA.rect(ctx, scx - halfW, scy + dy, halfW * 2, 2, fillColor);
                }
              }
            }
          }
          break;
        }

        case 'damage':
        case 'gold':
        case 'reaction_text': {
          // Rendered on UI canvas at high resolution
          break;
        }
      }
    }
  }

  // Render floating text effects on UI canvas
  DK.renderUIEffects = function(ctx) {
    for (const effect of DK.Game.effects) {
      if (effect.type !== 'damage' && effect.type !== 'gold' && effect.type !== 'reaction_text') continue;

      const progress = effect.timer / effect.duration;
      const alpha = Math.min(1, (1 - progress) * 2); // Fade out in second half
      const offsetY = progress * -25; // Float upward
      const scale = progress < 0.1 ? 0.5 + progress * 5 : 1; // Pop-in

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';

      const screenX = effect.x * DK.CONFIG.SCALE;
      const screenY = effect.y * DK.CONFIG.SCALE + offsetY;

      // Reaction text is bigger and bolder
      const isReaction = effect.type === 'reaction_text';
      const fontSize = isReaction ? Math.round(20 * scale) : Math.round(14 * scale);

      // Text shadow for readability
      ctx.font = DK.FONTS.bold(fontSize);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(effect.text, screenX + 1, screenY + 1);
      if (isReaction) {
        ctx.fillText(effect.text, screenX + 2, screenY + 2);
      }

      // Main text (reaction text flickers)
      if (isReaction) {
        const flicker = Math.sin(effect.timer / 40) > 0 ? effect.color : '#ffffff';
        ctx.fillStyle = flicker;
      } else {
        ctx.fillStyle = effect.color;
      }
      ctx.fillText(effect.text, screenX, screenY);

      ctx.restore();
    }
  };

  // Patch UI render to include effects
  const originalUIRender = DK.UI.render.bind(DK.UI);
  DK.UI.render = function(ctx) {
    originalUIRender(ctx);
    DK.renderUIEffects(ctx);
  };

  // Start!
  requestAnimationFrame(gameLoop);
})();
