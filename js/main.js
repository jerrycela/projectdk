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

  // Input handling - mousedown/mouseup for drag-to-scroll camera
  uiCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Left button only
    const rect = uiCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    DK.UI.handleMouseDown(mx, my);
  });

  uiCanvas.addEventListener('mouseup', (e) => {
    if (e.button !== 0) return;
    const rect = uiCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Start screen and game over: click to proceed
    if (DK.Game.state === 'start') {
      DK.Game.startGame();
      DK.UI._mouseDown = false;
      DK.UI._isDragging = false;
      return;
    }

    if (DK.Game.gameOver) {
      DK.Game.restart();
      DK.UI._mouseDown = false;
      DK.UI._isDragging = false;
      return;
    }

    DK.UI.handleMouseUp(mx, my);
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

    // 開始畫面：只渲染標題畫面
    if (DK.Game.state === 'start') {
      gameCtx.clearRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);
      uiCtx.clearRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);
      DK.UI.renderStartScreen(gameCtx, uiCtx, DK.Game.time);
      requestAnimationFrame(gameLoop);
      return;
    }

    // Render game world (low-res pixel art)
    offCtx.clearRect(0, 0, DK.CONFIG.GAME_WIDTH, DK.CONFIG.GAME_HEIGHT);

    // === Camera offset (world-space rendering) ===
    const cam = DK.Game.camera || { x: 0, y: 0 };
    offCtx.save();
    offCtx.translate(-cam.x, -cam.y);

    DK.Map.render(offCtx);

    // Render environment particles
    if (DK.Game.particles) {
      const worldW = DK.CONFIG.WORLD_WIDTH || DK.CONFIG.GAME_WIDTH;
      const worldH = DK.CONFIG.WORLD_HEIGHT || DK.CONFIG.GAME_HEIGHT;
      for (const p of DK.Game.particles) {
        if (p.life < 0) continue;
        const alpha = Math.min(1, p.life / p.maxLife) * (p.type === 'dust' ? 0.12 : 0.7);
        offCtx.fillStyle = p.type === 'dust'
          ? `rgba(200,180,160,${alpha})`
          : p.color || `rgba(255,136,68,${alpha})`;
        offCtx.fillRect(
          Math.round(p.x * worldW),
          Math.round(p.y * worldH),
          p.size || 1, p.size || 1
        );
      }
    }

    DK.Traps.render(offCtx);
    renderMinecarts(offCtx);
    DK.Enemies.render(offCtx, DK.Game.time);
    if (DK.Heroes) DK.Heroes.render(offCtx, DK.Game.time);
    renderEffects(offCtx);

    offCtx.restore();
    // === Camera offset end ===

    // Screen-space rendering (not affected by camera)
    // Vignette (screen-space, stays at screen edges)
    DK.Map.renderVignette(offCtx);

    // Global warm tone overlay (simulates torch-dominated lighting)
    offCtx.fillStyle = 'rgba(255,180,120,0.03)';
    offCtx.fillRect(0, 0, DK.CONFIG.GAME_WIDTH, DK.CONFIG.GAME_HEIGHT);

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

  // === Effect Sub-Renderers (extracted from renderEffects) ===

  function renderProjectile(ctx, PA, C, effect, progress) {
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
      // Fire trail - 5 pixels with decay
      const trailColors = ['#ff6622', '#cc4400', '#882200', '#551100', '#330800'];
      for (let i = 2; i < 7; i++) {
        PA.pixel(ctx, ipx + Math.round(nx * i), ipy + Math.round(ny * i),
                 trailColors[Math.min(i - 2, 4)]);
      }
      // Sparks
      if (Math.random() > 0.4) {
        PA.pixel(ctx, ipx + Math.round((Math.random() - 0.5) * 3),
                 ipy + Math.round((Math.random() - 0.5) * 3), '#ffcc44');
      }
      // Impact micro-burst at arrival
      if (t >= 1) {
        for (let i = 0; i < 3; i++) {
          const sa = Math.random() * Math.PI * 2;
          const sd = 1 + Math.random() * 2;
          PA.pixel(ctx, ipx + Math.round(Math.cos(sa) * sd),
                   ipy + Math.round(Math.sin(sa) * sd),
                   i === 0 ? '#ffcc44' : '#ff6622');
        }
      }
    } else if (effect.trapType === 'water_bolt') {
      // Water bolt: blue water sphere
      PA.pixel(ctx, ipx, ipy, '#ffffff');
      PA.pixel(ctx, ipx - 1, ipy, '#66aaff');
      PA.pixel(ctx, ipx + 1, ipy, '#66aaff');
      PA.pixel(ctx, ipx, ipy - 1, '#4488ff');
      PA.pixel(ctx, ipx, ipy + 1, '#4488ff');
      // Water trail - teardrop shape (wide to narrow)
      for (let i = 2; i < 5; i++) {
        const tx = ipx + Math.round(nx * i);
        const ty = ipy + Math.round(ny * i);
        PA.pixel(ctx, tx, ty, i < 3 ? '#4488ff' : '#2266cc');
        if (i < 3) {
          PA.pixel(ctx, tx + Math.round(ny), ty + Math.round(-nx), '#3377dd');
        }
      }
      // Splash sparkle
      if (Math.random() > 0.5) {
        PA.pixel(ctx, ipx + Math.round((Math.random() - 0.5) * 3),
                 ipy + Math.round((Math.random() - 0.5) * 3), '#88ccff');
      }
      // Impact micro-burst at arrival
      if (t >= 1) {
        for (let i = 0; i < 2; i++) {
          const sa = Math.random() * Math.PI * 2;
          const sd = 1 + Math.random() * 2;
          PA.pixel(ctx, ipx + Math.round(Math.cos(sa) * sd),
                   ipy + Math.round(Math.sin(sa) * sd), '#88ccff');
        }
      }
    } else {
      // Generic projectile: metal bolt
      PA.pixel(ctx, ipx, ipy, '#d0d8e0');
      PA.pixel(ctx, ipx + Math.round(nx), ipy + Math.round(ny), C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, ipx + Math.round(nx * 2), ipy + Math.round(ny * 2), C.TRAP_METAL);
      PA.pixel(ctx, ipx + Math.round(nx * 3), ipy + Math.round(ny * 3), C.TRAP_METAL_DARK);
    }
  }

  function renderExplosion(ctx, PA, C, effect, progress) {
    const maxR = effect.radius;
    const expandProgress = Math.min(1, progress * 2);
    const fadeProgress = Math.max(0, (progress - 0.3) / 0.7);

    // Phase 1: White flash (0-20%) - radius at least 3
    if (progress < 0.2) {
      const flashR = Math.max(3, Math.round(maxR * progress * 3));
      PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
               flashR, '#ffffff');
    }

    // Phase 2: Fire ring expanding (10-60%) - 4-color gradient
    if (progress > 0.1 && progress < 0.6) {
      const ringR = maxR * expandProgress;
      const ringColors = ['#ffffff', '#ffcc44', '#ff6622', '#cc2200'];
      for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
        const r = ringR * (0.7 + Math.random() * 0.3);
        const epx = Math.round(effect.x + Math.cos(angle) * r);
        const epy = Math.round(effect.y + Math.sin(angle) * r);
        const colorIdx = Math.min(3, Math.floor((r / ringR) * 4));
        PA.pixel(ctx, epx, epy, ringColors[colorIdx]);
        // Inner fire
        const ir = r * 0.6;
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * ir),
                 Math.round(effect.y + Math.sin(angle) * ir),
                 Math.random() > 0.5 ? '#ffcc44' : '#ff8822');
      }
    }

    // Phase 3: Smoke and embers (30-100%) - 7 particles, multi-gray
    if (progress > 0.3) {
      const smokeR = maxR * 1.2;
      const smokeColors = ['#443322', '#3a3020', '#332a1a'];
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2 + progress * 2;
        const r = smokeR * (0.5 + Math.random() * 0.5) * (1 - fadeProgress * 0.5);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r - fadeProgress * 3);
        PA.pixel(ctx, spx, spy, smokeColors[Math.floor(Math.random() * 3)]);
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
  }

  function renderElectrocuteBurst(ctx, PA, effect, progress) {
    // Lightning burst at enemy position (subtle)
    const burstProgress = progress;
    const burstRadius = 2 + burstProgress * 4;
    const burstAlpha = 1 - burstProgress;

    // White flash (shorter)
    if (burstProgress < 0.1) {
      PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#ffffff');
    }

    // Lightning arcs radiating outward (fewer, smaller)
    if (burstAlpha > 0.2) {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + burstProgress * 4;
        const r = burstRadius * (0.6 + Math.random() * 0.4);
        const epx = Math.round(effect.x + Math.cos(angle) * r);
        const epy = Math.round(effect.y + Math.sin(angle) * r);
        const color = Math.random() > 0.5 ? '#ffffff' : '#ffff44';
        PA.pixel(ctx, epx, epy, color);
      }
    }
  }

  function renderChainLightning(ctx, PA, effect, progress) {
    // Lightning arc between two points - upgraded with 8 steps + branch
    const chainAlpha = 1 - progress;
    if (chainAlpha < 0.15) return;

    const dx = effect.targetX - effect.x;
    const dy = effect.targetY - effect.y;
    const steps = 8;
    const totalLen = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / totalLen;
    const perpY = dx / totalLen;

    let prevPx = effect.x;
    let prevPy = effect.y;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let lpx = effect.x + dx * t;
      let lpy = effect.y + dy * t;
      // Jagged offset (reduced)
      if (i > 0 && i < steps) {
        const offset = (Math.random() - 0.5) * 2.5;
        lpx += perpX * offset;
        lpy += perpY * offset;
      }
      // Brightness: center brightest, ends dimmer
      const brightness = 1 - Math.abs(t - 0.5) * 1.2;
      const color = brightness > 0.6
        ? (Math.random() > 0.3 ? '#ffffff' : '#ffff44')
        : (Math.random() > 0.3 ? '#ffff44' : '#cccc22');
      PA.pixel(ctx, Math.round(lpx), Math.round(lpy), color);

      // 30% chance to spawn a branch at mid-segment nodes
      if (i >= 2 && i <= 6 && Math.random() < 0.3) {
        const branchDir = Math.random() > 0.5 ? 1 : -1;
        for (let b = 1; b <= 2 + Math.floor(Math.random() * 2); b++) {
          PA.pixel(ctx,
            Math.round(lpx + perpX * branchDir * b),
            Math.round(lpy + perpY * branchDir * b),
            '#ffff44');
        }
      }

      prevPx = lpx;
      prevPy = lpy;
    }
  }

  function renderWaterNova(ctx, PA, effect, progress) {
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
      // Water droplets flying outward - 8 particles
      for (let i = 0; i < 8; i++) {
        const dAngle = (i / 8) * Math.PI * 2 + novaProgress * 2;
        const dR = novaR * 1.1;
        const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
        const dpy = Math.round(effect.y + Math.sin(dAngle) * dR * 0.6 - novaProgress * 3);
        PA.pixel(ctx, dpx, dpy, '#88ccff');
      }
    }
  }

  function renderWaterSplash(ctx, PA, effect, progress) {
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
      // Landing ripples at base
      if (splashProgress > 0.4) {
        const rippleR = splashR * 0.5;
        PA.pixel(ctx, Math.round(effect.x - rippleR), Math.round(effect.y + 2), '#4488ff');
        PA.pixel(ctx, Math.round(effect.x + rippleR), Math.round(effect.y + 2), '#4488ff');
      }
    }
  }

  function renderPushWave(ctx, PA, effect, progress) {
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
  }

  function renderAbyssFall(ctx, PA, effect, progress) {
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
  }

  function renderIceRay(ctx, PA, effect, progress) {
    // 直線冰霜射線 - upgraded to 15 steps + progressive width + endpoint crystals
    const rayProgress = Math.min(1, progress * 2);
    const dx = effect.targetX - effect.x;
    const dy = effect.targetY - effect.y;
    const totalLen = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / totalLen;
    const perpY = dx / totalLen;
    const steps = 15;
    const maxStep = Math.round(steps * rayProgress);

    for (let i = 0; i <= maxStep; i++) {
      const t = i / steps;
      const rpx = Math.round(effect.x + dx * t);
      const rpy = Math.round(effect.y + dy * t);
      const color = Math.random() > 0.3 ? '#88ccff' : '#aaddff';
      PA.pixel(ctx, rpx, rpy, color);
      // Progressive width ice crystals: wider as i increases
      const spreadRange = Math.floor(i / 4) + 1;
      if (i % 2 === 0 && Math.random() > 0.4) {
        const sOff = Math.round((Math.random() - 0.5) * spreadRange * 2);
        PA.pixel(ctx, rpx + Math.round(perpX * sOff),
                 rpy + Math.round(perpY * sOff), '#ffffff');
      }
    }
    // Endpoint ice crystal condensation
    if (rayProgress > 0.7) {
      const endX = Math.round(effect.x + dx);
      const endY = Math.round(effect.y + dy);
      PA.pixel(ctx, endX, endY, '#ffffff');
      PA.pixel(ctx, endX + 1, endY - 1, '#aaddff');
      PA.pixel(ctx, endX - 1, endY + 1, '#88ccff');
    }
    // 起點光暈
    if (rayProgress < 0.5) {
      PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#ffffff');
    }
  }

  function renderBlazeExplosion(ctx, PA, effect, progress) {
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

    // Phase 2：橘紅火焰環（10-50%）+ 雙層衝擊波環
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
      // 外層衝擊波環 - thickened to 2px (outer + inner ring)
      const shockR = ringR * 1.4;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.35) {
        const sr = shockR * (0.95 + Math.random() * 0.05);
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * sr),
                 Math.round(effect.y + Math.sin(angle) * sr), '#ff6633');
        // Inner shock ring for thickness
        const sr2 = sr * 0.92;
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * sr2),
                 Math.round(effect.y + Math.sin(angle) * sr2), '#ff4422');
      }
    }

    // Phase 3：煙霧和餘燼（30-100%）- 9 particles (7 fire debris)
    if (progress > 0.3) {
      const smokeR = blazeMaxR * 1.3;
      for (let i = 0; i < 9; i++) {
        const angle = (i / 9) * Math.PI * 2 + progress * 2;
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
  }

  function renderFireSplash(ctx, PA, effect, progress) {
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
  }

  function renderIceSplash(ctx, PA, effect, progress) {
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
  }

  function renderFireNova(ctx, PA, effect, progress) {
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
  }

  function renderBurnStatus(ctx, PA, effect, progress) {
    // 燃燒狀態持續視覺（地面火焰殘留）- 4-color progressive flames
    const burnFade = 1 - progress;
    if (burnFade > 0.1) {
      const flameColors = ['#ffdd44', '#ffaa22', '#ff6622', '#cc2200'];
      // 地面小火焰閃爍 - different sway frequencies per layer
      const flickerBase = Math.sin(effect.timer / 80) * 0.5;
      const flameH = 2 + flickerBase;

      // Layer 0 (top): brightest, fast sway
      const sway0 = Math.sin(effect.timer / 50) * 0.8;
      PA.pixel(ctx, Math.round(effect.x + sway0), Math.round(effect.y - flameH - 1), flameColors[0]);
      // Layer 1: medium sway
      const sway1 = Math.sin(effect.timer / 70) * 0.5;
      PA.pixel(ctx, Math.round(effect.x + sway1), Math.round(effect.y - flameH), flameColors[1]);
      // Layer 2: slow sway
      const sway2 = Math.sin(effect.timer / 100) * 0.3;
      PA.pixel(ctx, Math.round(effect.x + sway2), Math.round(effect.y - flameH + 1), flameColors[2]);
      // Layer 3 (base): minimal sway
      PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), flameColors[3]);

      // 左右小火舌
      if (Math.random() > 0.3) {
        PA.pixel(ctx, Math.round(effect.x - 1), Math.round(effect.y - flameH * 0.5), flameColors[2]);
        PA.pixel(ctx, Math.round(effect.x + 1), Math.round(effect.y - flameH * 0.7), flameColors[0]);
      }
      // 隨機火花
      if (Math.random() > 0.7) {
        PA.pixel(ctx, Math.round(effect.x + (Math.random() - 0.5) * 3),
                 Math.round(effect.y - 2 - Math.random() * 3), '#ffdd66');
      }
      // 地面焦痕
      PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y + 1), '#1a0808');
    }
  }

  function renderBlizzardZone(ctx, PA, effect, progress) {
    // 持續性減速區域（像素風格渲染）
    const zoneRadius = (effect.radius || 24);
    const zoneFade = 1 - progress;
    if (zoneFade > 0.1) {
      // 像素化橢圓底座：4px height with scanline interval 1
      const cx = Math.round(effect.x);
      const cy = Math.round(effect.y);
      const ry = Math.round(zoneRadius * 0.6);
      const baseColor = `rgba(100,170,238,${zoneFade * 0.15})`;
      for (let sdy = -ry; sdy <= ry; sdy += 1) {
        const yRatio = sdy / ry;
        const halfW = Math.round(zoneRadius * Math.sqrt(Math.max(0, 1 - yRatio * yRatio)));
        if (halfW > 0) {
          PA.rect(ctx, cx - halfW, cy + sdy, halfW * 2, 1, baseColor);
        }
      }
      // 飛舞的冰晶粒子 - 10 particles in 2-3 height layers
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + progress * 4;
        const r = zoneRadius * (0.3 + Math.random() * 0.7);
        const heightLayer = (i % 3) * 2; // 0, 2, or 4 pixels above
        const ppx = Math.round(effect.x + Math.cos(angle) * r);
        const ppy = Math.round(effect.y + Math.sin(angle) * r * 0.6 - heightLayer - Math.random() * 2);
        PA.pixel(ctx, ppx, ppy, Math.random() > 0.5 ? '#aaddff' : '#88ccff');
      }
      // 邊緣冰霜像素點
      for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const r = zoneRadius * (0.9 + Math.random() * 0.1);
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * r),
                 Math.round(effect.y + Math.sin(angle) * r * 0.6),
                 '#88ccff');
      }
    }
  }

  function renderEvolutionBurst(ctx, PA, effect, progress) {
    // 進化爆發光效 - thicker gold halo
    const evoProgress = progress;
    const evoR = 4 + evoProgress * 12;
    const evoFade = 1 - evoProgress;

    if (evoFade > 0.05) {
      // 金色光環擴散 - step 0.15 for thicker ring
      for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
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
  }

  function renderStunWave(ctx, PA, effect, progress) {
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
        for (let sdy = -sry; sdy <= sry; sdy += 2) {
          const yRatio = sdy / sry;
          const halfW = Math.round(stunR * Math.sqrt(Math.max(0, 1 - yRatio * yRatio)));
          if (halfW > 0) {
            PA.rect(ctx, scx - halfW, scy + sdy, halfW * 2, 2, fillColor);
          }
        }
      }
    }
  }

  function renderGoldSparkle(ctx, PA, effect, progress) {
    // 金幣獲取閃光粒子 — 3-5 個金色小方塊向外擴散並上漂
    const sparkleProgress = progress;
    const sparkleFade = 1 - sparkleProgress;

    if (sparkleFade > 0.05) {
      const particleCount = 4;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + effect.timer * 0.008;
        const dist = sparkleProgress * 8;
        const gpx = Math.round(effect.x + Math.cos(angle) * dist);
        const gpy = Math.round(effect.y + Math.sin(angle) * dist - sparkleProgress * 6);
        const size = sparkleProgress < 0.5 ? 2 : 1;

        // 金色小方塊
        const color = i % 2 === 0 ? '#ffd700' : '#ffaa00';
        PA.rect(ctx, gpx, gpy, size, size, color);
      }
      // 中心亮點（早期閃光）
      if (sparkleProgress < 0.3) {
        PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#ffffff');
      }
    }
  }

  function renderHeroDeploy(ctx, PA, effect, progress) {
    // 英雄部署出場特效 — 圓環擴張 + 向外飛散粒子
    const deployProgress = progress;
    const deployFade = 1 - deployProgress;

    // 根據 element 決定顏色
    const elementColorMap = {
      water: { r: 68, g: 136, b: 255 },
      fire:  { r: 255, g: 102, b: 34 },
      ice:   { r: 136, g: 204, b: 255 },
    };
    const ec = elementColorMap[effect.element] || elementColorMap.water;
    const ringColor = `rgba(${ec.r},${ec.g},${ec.b},${deployFade})`;

    // 圓環半徑隨時間擴張到 24px
    const ringR = deployProgress * 24;
    // 線寬從 2px 過渡到 1px
    const lineW = deployProgress < 0.5 ? 2 : 1;

    if (deployFade > 0.05) {
      // 畫圓環（像素點模擬）
      const ringSteps = Math.max(16, Math.round(ringR * 2));
      for (let i = 0; i < ringSteps; i++) {
        const angle = (i / ringSteps) * Math.PI * 2;
        const rpx = Math.round(effect.x + Math.cos(angle) * ringR);
        const rpy = Math.round(effect.y + Math.sin(angle) * ringR);
        PA.pixel(ctx, rpx, rpy, ringColor);
        // 線寬 2 時多畫一層
        if (lineW === 2) {
          const rpx2 = Math.round(effect.x + Math.cos(angle) * (ringR - 1));
          const rpy2 = Math.round(effect.y + Math.sin(angle) * (ringR - 1));
          PA.pixel(ctx, rpx2, rpy2, ringColor);
        }
      }

      // 8 個向外飛散的小粒子 (upgraded from 4)
      for (let i = 0; i < 8; i++) {
        const pAngle = (i / 8) * Math.PI * 2 + deployProgress * 2;
        const pDist = ringR * 1.3;
        const ppx = Math.round(effect.x + Math.cos(pAngle) * pDist);
        const ppy = Math.round(effect.y + Math.sin(pAngle) * pDist);
        const brightColor = `rgba(${Math.min(255, ec.r + 80)},${Math.min(255, ec.g + 80)},${Math.min(255, ec.b + 80)},${deployFade})`;
        PA.pixel(ctx, ppx, ppy, brightColor);
      }

      // 中心白色閃光（早期）
      if (deployProgress < 0.2) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                  Math.round(2 - deployProgress * 8), '#ffffff');
      }
    }
  }

  function renderHeroRecall(ctx, PA, effect, progress) {
    // 回收特效：向內收縮的圓環 + 向上飛散粒子
    const fade = 1 - progress;

    const elementColorMap = {
      water: { r: 68, g: 136, b: 255 },
      fire:  { r: 255, g: 102, b: 34 },
      ice:   { r: 136, g: 204, b: 255 },
    };
    const ec = elementColorMap[effect.element] || elementColorMap.water;
    const ringColor = `rgba(${ec.r},${ec.g},${ec.b},${fade})`;

    // 圓環從大到小收縮
    const ringR = (1 - progress) * 20;

    if (fade > 0.05) {
      const ringSteps = Math.max(12, Math.round(ringR * 2));
      for (let i = 0; i < ringSteps; i++) {
        const angle = (i / ringSteps) * Math.PI * 2;
        const rpx = Math.round(effect.x + Math.cos(angle) * ringR);
        const rpy = Math.round(effect.y + Math.sin(angle) * ringR);
        PA.pixel(ctx, rpx, rpy, ringColor);
      }
    }

    // 向上飛散粒子
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + progress * 3;
      const dist = progress * 12;
      const px = Math.round(effect.x + Math.cos(angle) * dist * 0.5);
      const py = Math.round(effect.y - progress * 16 + Math.sin(angle) * dist * 0.3);
      const pAlpha = fade * 0.8;
      if (pAlpha > 0.05) {
        PA.pixel(ctx, px, py, `rgba(${ec.r},${ec.g},${ec.b},${pAlpha})`);
      }
    }
  }

  // === Minecart Renderer ===

  function renderMinecarts(ctx) {
    if (!DK.Game.minecarts) return;

    for (const cart of DK.Game.minecarts) {
      const x = Math.round(cart.x);
      const y = Math.round(cart.y);

      // 礦車車體（約 12x10 像素，像素風格）
      // 車斗底部（深棕）
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(x - 6, y - 3, 12, 6);

      // 車斗側板（棕色）
      ctx.fillStyle = '#5a3820';
      ctx.fillRect(x - 6, y - 5, 12, 2);  // 上邊
      ctx.fillRect(x - 7, y - 5, 1, 8);   // 左邊
      ctx.fillRect(x + 6, y - 5, 1, 8);   // 右邊

      // 車斗高光（左上光源）
      ctx.fillStyle = '#7a5838';
      ctx.fillRect(x - 5, y - 5, 4, 1);   // 上邊高光
      ctx.fillRect(x - 6, y - 4, 1, 3);   // 左邊高光

      // 礦石內容（灰色石頭，略微凸出車斗）
      ctx.fillStyle = '#555566';
      ctx.fillRect(x - 4, y - 6, 3, 2);
      ctx.fillStyle = '#666677';
      ctx.fillRect(x, y - 7, 3, 3);
      ctx.fillStyle = '#444455';
      ctx.fillRect(x + 2, y - 5, 2, 1);

      // 車輪（2 個）
      ctx.fillStyle = '#222233';
      ctx.fillRect(x - 5, y + 3, 3, 3);   // 左輪
      ctx.fillRect(x + 2, y + 3, 3, 3);   // 右輪
      // 輪軸高光
      ctx.fillStyle = '#444455';
      ctx.fillRect(x - 4, y + 4, 1, 1);
      ctx.fillRect(x + 3, y + 4, 1, 1);
    }
  }

  function renderMinecartHit(ctx, PA, effect, progress) {
    const alpha = 1 - progress;
    const radius = 4 + progress * 8;

    // 碰撞火花
    ctx.fillStyle = `rgba(255,200,100,${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 碎石飛散
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + progress * 2;
      const dist = progress * 12;
      const px = effect.x + Math.cos(angle) * dist;
      const py = effect.y + Math.sin(angle) * dist;
      ctx.fillStyle = `rgba(150,120,80,${alpha})`;
      ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
    }
  }

  // === Main renderEffects dispatcher ===

  function renderEffects(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;

    for (const effect of DK.Game.effects) {
      const progress = effect.timer / effect.duration;

      switch (effect.type) {
        case 'projectile': renderProjectile(ctx, PA, C, effect, progress); break;
        case 'explosion': renderExplosion(ctx, PA, C, effect, progress); break;
        case 'electrocute_burst': renderElectrocuteBurst(ctx, PA, effect, progress); break;
        case 'chain_lightning': renderChainLightning(ctx, PA, effect, progress); break;
        case 'water_nova': renderWaterNova(ctx, PA, effect, progress); break;
        case 'water_splash': renderWaterSplash(ctx, PA, effect, progress); break;
        case 'push_wave': renderPushWave(ctx, PA, effect, progress); break;
        case 'abyss_fall': renderAbyssFall(ctx, PA, effect, progress); break;
        case 'ice_ray': renderIceRay(ctx, PA, effect, progress); break;
        case 'blaze_explosion': renderBlazeExplosion(ctx, PA, effect, progress); break;
        case 'fire_splash': renderFireSplash(ctx, PA, effect, progress); break;
        case 'ice_splash': renderIceSplash(ctx, PA, effect, progress); break;
        case 'fire_nova': renderFireNova(ctx, PA, effect, progress); break;
        case 'burn_status': renderBurnStatus(ctx, PA, effect, progress); break;
        case 'blizzard_zone': renderBlizzardZone(ctx, PA, effect, progress); break;
        case 'evolution_burst': renderEvolutionBurst(ctx, PA, effect, progress); break;
        case 'stun_wave': renderStunWave(ctx, PA, effect, progress); break;
        case 'gold_sparkle': renderGoldSparkle(ctx, PA, effect, progress); break;
        case 'hero_deploy': renderHeroDeploy(ctx, PA, effect, progress); break;
        case 'hero_recall': renderHeroRecall(ctx, PA, effect, progress); break;
        case 'minecart_hit': renderMinecartHit(ctx, PA, effect, progress); break;
        case 'damage':
        case 'gold':
        case 'float_text':
        case 'reaction_text':
          break; // Rendered on UI canvas
      }
    }
  }

  // Render floating text effects on UI canvas
  DK.renderUIEffects = function(ctx) {
    for (const effect of DK.Game.effects) {
      if (effect.type !== 'damage' && effect.type !== 'gold' && effect.type !== 'reaction_text' && effect.type !== 'float_text') continue;

      const progress = effect.timer / effect.duration;
      const alpha = Math.min(1, (1 - progress) * 2); // Fade out in second half
      const offsetY = progress * -25; // Float upward
      const scale = progress < 0.1 ? 0.5 + progress * 5 : 1; // Pop-in

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';

      const uiCam = DK.Game.camera || { x: 0, y: 0 };
      const screenX = (effect.x - uiCam.x) * DK.CONFIG.SCALE;
      const screenY = (effect.y - uiCam.y) * DK.CONFIG.SCALE + offsetY;

      // Reaction text is bigger and bolder
      const isReaction = effect.type === 'reaction_text';
      const fontSize = isReaction ? Math.round(20 * scale) : Math.round(14 * scale);

      // Text setup
      ctx.font = DK.FONTS.bold(fontSize);

      // Reaction text: semi-transparent background rectangle
      if (isReaction) {
        const metrics = ctx.measureText(effect.text);
        const bgW = metrics.width + 8;
        const bgH = fontSize + 4;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(screenX - bgW / 2, screenY - bgH + 2, bgW, bgH);
      }

      // 1px black stroke outline for all text
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.strokeText(effect.text, screenX, screenY);

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
