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
  // (Game init will be called by startGame() after user clicks Start button)

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

  // 鍵盤導航（無障礙功能）
  document.addEventListener('keydown', (e) => {
    // F3 快捷鍵：切換 FPS 監控
    if (e.key === 'F3') {
      e.preventDefault();
      if (DK.Debug) {
        const enabled = DK.Debug.toggle();
        console.log(`FPS 監控已${enabled ? '開啟' : '關閉'}`);
      }
      return;
    }

    if (DK.UI && DK.UI.handleKeyboard) {
      DK.UI.handleKeyboard(e);
    }
  });

  // Game loop
  let lastTime = performance.now();

  function gameLoop(timestamp) {
    const dt = Math.min(timestamp - lastTime, 50); // Cap delta time
    lastTime = timestamp;

    // Update
    DK.Game.update(dt);

    // Update error notification system
    if (DK.UI && DK.UI.ErrorNotification) {
      DK.UI.ErrorNotification.update(dt);
    }

    // Update test toolbar stats
    if (DK.TestToolbar && DK.TestToolbar.updateStats) {
      DK.TestToolbar.updateStats();
    }

    // Update FPS monitor
    if (DK.Debug) {
      DK.Debug.update(dt);
    }

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

    // Render Dungeon Heart (2x2 pulsating crystal)
    renderDungeonHeart(offCtx, DK.Game.time);

    // Render Portals (2x2 vortex) in planning/invasion phase
    if (DK.Game.state === 'planning' || DK.Game.state === 'invasion') {
      if (DK.Map.portals && DK.Map.portals.length > 0) {
        const T = DK.CONFIG.TILE_SIZE;

        // 傳送門顏色配置
        const portalColors = {
          green: {
            glow: '#44ff88',
            bright: '#88ffaa',
            dark: '#226644'
          },
          red: {
            glow: '#ff4444',
            bright: '#ff8888',
            dark: '#662222'
          },
          blue: {
            glow: '#4488ff',
            bright: '#88aaff',
            dark: '#224466'
          }
        };

        for (const portal of DK.Map.portals) {
          // 支援新格式（entrance）和舊格式（col/row）
          const portalCol = portal.entrance ? portal.entrance.x : portal.col;
          const portalRow = portal.entrance ? portal.entrance.y : portal.row;
          const x = portalCol * T;
          const y = portalRow * T;
          const portalType = portal.type || 'green';
          const colorScheme = portalColors[portalType] || portalColors.green;
          // time 參數需要秒數（DK.Game.time 是毫秒）
          DK.Map.drawPortalFull(offCtx, x, y, colorScheme, DK.Game.time / 1000);
        }
      }
    }

    // Planning/Invasion 階段：顯示路徑預覽（從傳送門到地心）
    if (DK.Game.state === 'planning' || DK.Game.state === 'invasion') {
      renderPathPreview(offCtx);
    }

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

    // Layer 1+2 裝飾（地面/牆壁基礎裝飾）
    renderDecorations(2);

    DK.Traps.render(offCtx);
    renderBarricades(offCtx, DK.Game.time);
    if (DK.Doors) DK.Doors.render(offCtx);
    DK.Enemies.render(offCtx, DK.Game.time);
    if (DK.Heroes) DK.Heroes.render(offCtx, DK.Game.time);
    renderEffects(offCtx);

    // Layer 3 裝飾（牆壁前景裝飾）
    renderDecorations(3);

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

    // Render FPS monitor (顯示在最上層)
    if (DK.Debug) {
      DK.Debug.render(uiCtx);
    }

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

  function renderOilSplat(ctx, PA, effect, progress) {
    // 油漬噴灑 — 深褐色油滴從中心向外濺射
    const splatR = (effect.radius || 8) * progress;
    const splatFade = 1 - progress;

    if (splatFade > 0.1) {
      // 中心油漬擴散
      if (progress < 0.5) {
        const coreR = splatR * 0.6;
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                 Math.max(1, Math.round(coreR)), '#2a2010');
      }

      // 4-6 個油滴粒子向外飛濺
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + progress * 1.5;
        const r = splatR * (0.6 + Math.random() * 0.4);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r);
        const color = Math.random() > 0.5 ? '#3a2810' : '#5a4020';
        PA.pixel(ctx, spx, spy, color);
        // 油滴拖尾
        if (progress < 0.6) {
          const trailR = r * 0.5;
          PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * trailR),
                   Math.round(effect.y + Math.sin(angle) * trailR), '#2a2010');
        }
      }

      // 油光閃爍
      if (progress < 0.3) {
        PA.pixel(ctx, Math.round(effect.x + 1), Math.round(effect.y - 1), '#5a5030');
      }
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

  function renderOilIgniteBurst(ctx, PA, effect, progress) {
    // 油燃引爆 — 橘紅色火焰從中心爆發
    const burstMaxR = (effect.radius || 16) * 1.2;
    const burstExpand = Math.min(1, progress * 2.5);
    const burstFade = Math.max(0, (progress - 0.3) / 0.7);

    // Phase 1：白色閃光核心（0-12%）
    if (progress < 0.12) {
      const flashR = burstMaxR * progress * 5;
      PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
               Math.max(2, Math.round(flashR)), '#ffffff');
    }

    // Phase 2：橘紅火焰環擴散（8-50%）
    if (progress > 0.08 && progress < 0.5) {
      const ringR = burstMaxR * burstExpand;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.22) {
        const r = ringR * (0.7 + Math.random() * 0.3);
        const epx = Math.round(effect.x + Math.cos(angle) * r);
        const epy = Math.round(effect.y + Math.sin(angle) * r);
        const color = Math.random() > 0.4 ? '#ff5500' : '#ffaa22';
        PA.pixel(ctx, epx, epy, color);
        // 內層火焰
        const ir = r * 0.5;
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * ir),
                 Math.round(effect.y + Math.sin(angle) * ir),
                 Math.random() > 0.5 ? '#ffdd44' : '#ff8822');
      }
    }

    // Phase 3：黑煙+油燃餘燼（30-100%）
    if (progress > 0.3) {
      const smokeR = burstMaxR * 1.2;
      const smokeColors = ['#1a1008', '#2a1a10', '#3a2810'];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + progress * 2;
        const r = smokeR * (0.5 + Math.random() * 0.5) * (1 - burstFade * 0.5);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r - burstFade * 4);
        PA.pixel(ctx, spx, spy, smokeColors[Math.floor(Math.random() * 3)]);
        // 油燃火星
        if (Math.random() > 0.6) {
          PA.pixel(ctx, spx + 1, spy - 1, '#ff5500');
        }
      }
    }

    // 焦痕
    if (progress > 0.5) {
      PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#0a0804');
      PA.pixel(ctx, Math.round(effect.x) + 1, Math.round(effect.y), '#0a0804');
    }
  }

  function renderOilSplash(ctx, PA, effect, progress) {
    // 油污飛濺 — 首次掛上 oiled 時的視覺效果
    const oilSplashP = progress;
    const oilSplashR = 2 + oilSplashP * 4;
    const oilSplashFade = 1 - oilSplashP;

    if (oilSplashFade > 0.1) {
      // 擴散的油環
      for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
        const r = oilSplashR * (0.8 + Math.random() * 0.2);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r * 0.5);
        const color = Math.random() > 0.5 ? '#5a4020' : '#3a2810';
        PA.pixel(ctx, spx, spy, color);
      }
      // 中心油核
      if (oilSplashP < 0.3) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#2a2010');
      }
      // 下墜油滴
      for (let i = 0; i < 3; i++) {
        const dAngle = (i / 3) * Math.PI * 2 + oilSplashP * 2;
        const dR = oilSplashR * 0.5;
        const dpy = Math.round(effect.y + oilSplashP * 4 + Math.sin(dAngle) * 2);
        const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
        PA.pixel(ctx, dpx, dpy, '#3a2810');
      }
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

  // === Dungeon Heart Renderer ===

  function renderDungeonHeart(ctx, time) {
    const hp = DK.Map.heartPos;
    if (!hp) return;
    const T = DK.CONFIG.TILE_SIZE;
    const x = hp.col * T;
    const y = hp.row * T;
    const PA = DK.PixelArt;
    const ISO = PA.Isometric;

    // Hurt flash
    const isFlashing = DK.Game.heartFlashTimer > 0;

    // Pulse (2000ms cycle)
    const pulse = Math.sin(time / 1000 * Math.PI) * 0.5 + 0.5;
    const hpPercent = DK.Game.dungeonHeartHP / DK.Game.dungeonHeartMaxHP;

    // HP < 30%: faster pulse
    const fastPulse = hpPercent < 0.3 ? Math.sin(time / 500 * Math.PI) * 0.5 + 0.5 : pulse;

    // Center point of 2×2 area (32×32 pixels)
    const cx = x + 16;
    const cy = y + 16;

    // Crystal colors (HP-based)
    const coreColor = isFlashing ? '#ff4444' : '#aa44ff';
    const hpColor = hpPercent > 0.3 ? coreColor : (isFlashing ? '#ff4444' : '#ff4488');

    // === 1. Ground Shadow (ellipse, alpha 0.15, crystal color) ===
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // === 2. Isometric Stone Pedestal (3 layers, compact) ===
    const stoneBase = '#3a2a4a';

    // Bottom layer (base, darkest) - 14×6
    PA.rect(ctx, cx - 7, cy + 8, 14, 6, ISO.sideDark(stoneBase));

    // Front face (medium) - 12×4
    PA.rect(ctx, cx - 6, cy + 4, 12, 4, stoneBase);

    // Top face (brightest) - 10×3
    PA.rect(ctx, cx - 5, cy + 1, 10, 3, ISO.topLight(stoneBase));

    // Right side dark edge (enhance 3D effect) - 1px width
    PA.rect(ctx, cx + 6, cy + 4, 1, 10, ISO.ambientOcclusion(stoneBase));

    // === 3. Hovering Crystal (4 layers, 3px gap above pedestal) ===
    // Crystal bottom (cy - 2) is 3px above pedestal top (cy + 1)

    // Layer 1: Bottom (darkest, largest) - 8×8
    PA.rect(ctx, cx - 4, cy - 2, 8, 8, ISO.ambientOcclusion(hpColor));

    // Layer 2: Middle (medium) - 6×12
    PA.rect(ctx, cx - 3, cy - 5, 6, 12, ISO.sideDark(hpColor));

    // Layer 3: Top (bright) - 4×8
    PA.rect(ctx, cx - 2, cy - 7, 4, 8, hpColor);

    // Layer 4: Tip (brightest) - 2×2
    PA.rect(ctx, cx - 1, cy - 8, 2, 2, ISO.topLight(hpColor));

    // === 4. Inner glow point (pulsating, at crystal center) ===
    const glowSize = 2 + Math.round(fastPulse * 2);
    PA.rect(ctx, cx - Math.floor(glowSize / 2), cy - 5 - Math.floor(glowSize / 2),
            glowSize, glowSize, '#ffffff');

    // === 5. Glow effect (tile-based halo) ===
    const glowAlpha = 0.08 + fastPulse * 0.08;
    const glowRadius = 3 + fastPulse * 0.5;
    for (let gr = -glowRadius; gr <= glowRadius; gr++) {
      for (let gc = -glowRadius; gc <= glowRadius; gc++) {
        const dist = Math.sqrt(gr * gr + gc * gc);
        if (dist > glowRadius) continue;
        const falloff = 1 - dist / glowRadius;
        const alpha = glowAlpha * falloff * falloff;
        if (alpha < 0.01) continue;
        const gx = (hp.col + 1) * T + gc * T;
        const gy = (hp.row + 1) * T + gr * T;
        const r = isFlashing ? 255 : 170;
        const g = isFlashing ? 68 : 68;
        const b = isFlashing ? 68 : 255;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(gx, gy, T, T);
      }
    }

    // === 6. HP bar (above heart) - only show when damaged ===
    if (hpPercent < 1) {
      const barW = 28;
      const barX = x + 2;
      const barY = y - 4;
      PA.rect(ctx, barX - 1, barY - 1, barW + 2, 5, '#1a1a1a');
      PA.rect(ctx, barX, barY, barW, 3, '#2a0a0a');
      const fillW = Math.ceil(barW * hpPercent);
      PA.rect(ctx, barX, barY + 1, fillW, 2, hpPercent > 0.3 ? '#ff4444' : '#ff0000');
      PA.rect(ctx, barX, barY, fillW, 1, hpPercent > 0.3 ? '#ff8888' : '#ff4444');
    }
  }

  // === Decoration Renderer ===

  function renderDecorations(layerFilter = null) {
    if (!DK.Map.decorations) return;

    const camera = DK.Game.camera || { x: 0, y: 0 };

    // 按 layer 排序（1 → 2 → 3）
    const sorted = [...DK.Map.decorations].sort((a, b) => a.layer - b.layer);

    for (const deco of sorted) {
      // Layer 過濾：
      // layerFilter = 2 → 只渲染 layer 1 和 2
      // layerFilter = 3 → 只渲染 layer 3
      if (layerFilter !== null) {
        if (layerFilter === 2 && deco.layer > 2) continue;
        if (layerFilter === 3 && deco.layer !== 3) continue;
      }

      const screenX = deco.col * DK.CONFIG.TILE_SIZE - camera.x;
      const screenY = deco.row * DK.CONFIG.TILE_SIZE - camera.y;

      // 只渲染 viewport 內的
      if (screenX < -DK.CONFIG.TILE_SIZE || screenX > DK.CONFIG.GAME_WIDTH ||
          screenY < -DK.CONFIG.TILE_SIZE || screenY > DK.CONFIG.GAME_HEIGHT) {
        continue;
      }

      DK.PixelArt.drawDecoration(deco.type, deco.variant, screenX, screenY, offCtx);
    }
  }

  // === Wall Break Effect ===

  function renderWallBreak(ctx, PA, effect, progress) {
    // Wall debris particles
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + progress * 2;
      const dist = progress * 12;
      const px = Math.round(effect.x + Math.cos(angle) * dist);
      const py = Math.round(effect.y + Math.sin(angle) * dist);
      if (progress < 0.7) {
        const colors = ['#3e3e5a', '#2d2d44', '#565470'];
        PA.pixel(ctx, px, py, colors[i % 3]);
      }
    }
    // Dust cloud
    if (progress < 0.4) {
      const dustR = progress * 8;
      for (let a = 0; a < 6; a++) {
        const angle = (a / 6) * Math.PI * 2;
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * dustR),
                 Math.round(effect.y + Math.sin(angle) * dustR), '#888888');
      }
    }
  }

  // === Breakable Wall Highlight (breach phase) ===
  // @deprecated BREACH 階段已移除，保留函式以避免錯誤

  function renderBreakableWallHighlight(ctx, time) {
    // 不再使用，保留空函式
    return;
    const T = DK.CONFIG.TILE_SIZE;
    const pulse = Math.sin(time / 500) * 0.15 + 0.25;
    const range = DK.Map.getVisibleRange ? DK.Map.getVisibleRange() : null;
    if (!range) return;
    const { startCol, startRow, endCol, endRow } = range;

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (!DK.Map.isBreakable || !DK.Map.isBreakable(c, r)) continue;
        ctx.fillStyle = `rgba(255,200,100,${pulse})`;
        ctx.fillRect(c * T, r * T, T, T);
      }
    }
  }

  // === 路障渲染 ===

  function renderBarricades(ctx, time) {
    if (!DK.Map.barricades) return;
    const T = DK.CONFIG.TILE_SIZE;

    for (const b of DK.Map.barricades) {
      const x = b.col * T;
      const y = b.row * T;

      // 受擊晃動
      let shakeX = 0;
      if (b.hp < b.maxHp) {
        const shakeCycle = Math.sin(time * 0.04) * 1;
        if (b.hp < b.maxHp * 0.5) shakeX = Math.round(shakeCycle);
      }

      const bx = x + shakeX;

      // 石磚底座（10px 高）
      ctx.fillStyle = DK.COLORS.BARRICADE_STONE || '#5a5a6e';
      ctx.fillRect(bx + 1, y + 4, T - 2, 10);

      // 頂部深色邊緣（2px）
      ctx.fillStyle = DK.COLORS.BARRICADE_STONE_DARK || '#2a2a3a';
      ctx.fillRect(bx + 1, y + 2, T - 2, 2);

      // 左上光源 — 左側高光
      ctx.fillStyle = DK.COLORS.BARRICADE_STONE_LIGHT || '#7a7a8e';
      ctx.fillRect(bx + 1, y + 4, 1, 10);
      ctx.fillRect(bx + 1, y + 4, T - 2, 1);

      // 右側和底部陰影
      ctx.fillStyle = DK.COLORS.BARRICADE_STONE_DARK || '#2a2a3a';
      ctx.fillRect(bx + T - 2, y + 4, 1, 10);
      ctx.fillRect(bx + 1, y + 13, T - 2, 1);

      // 灰縫（中間分隔線）
      ctx.fillStyle = DK.COLORS.BARRICADE_MORTAR || '#3a3a4a';
      ctx.fillRect(bx + 1, y + 9, T - 2, 1);
      // 垂直灰縫
      ctx.fillRect(bx + T / 2, y + 4, 1, 5);
      ctx.fillRect(bx + T / 4, y + 10, 1, 4);
      ctx.fillRect(bx + T * 3 / 4, y + 10, 1, 4);

      // 裂痕（HP < 50%）
      if (b.hp < b.maxHp * 0.5) {
        ctx.fillStyle = DK.COLORS.BARRICADE_CRACK || '#1a1a2a';
        ctx.fillRect(bx + 4, y + 5, 1, 3);
        ctx.fillRect(bx + 5, y + 7, 1, 2);
        if (b.hp < b.maxHp * 0.25) {
          ctx.fillRect(bx + 10, y + 6, 1, 4);
          ctx.fillRect(bx + 11, y + 9, 1, 2);
        }
      }

      // HP 條（受損時顯示）
      if (b.hp < b.maxHp) {
        const barW = T - 4;
        const hpRatio = b.hp / b.maxHp;
        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx + 2, y, barW, 2);
        // 血量
        ctx.fillStyle = hpRatio > 0.5 ? '#44aa44' : hpRatio > 0.25 ? '#aaaa44' : '#aa4444';
        ctx.fillRect(bx + 2, y, Math.round(barW * hpRatio), 2);
      }
    }

    // 路障懸停預覽（planning 階段 + 路障模式）
    if (DK.Game.state === 'planning' && DK.UI.selectedBarricadeMode && DK.UI.hoveredTile) {
      const hc = DK.UI.hoveredTile.col;
      const hr = DK.UI.hoveredTile.row;
      const tile = DK.Map.getTile ? DK.Map.getTile(hc, hr) : null;
      if (tile && (tile === '.' || tile === 'P' || tile === 'G') && !(DK.Map.hasBarricade && DK.Map.hasBarricade(hc, hr))) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = DK.COLORS.BARRICADE_STONE || '#5a5a6e';
        ctx.fillRect(hc * T + 1, hr * T + 4, T - 2, 10);
        ctx.fillStyle = DK.COLORS.BARRICADE_STONE_DARK || '#2a2a3a';
        ctx.fillRect(hc * T + 1, hr * T + 2, T - 2, 2);
        ctx.globalAlpha = 1.0;
      }
    }
  }

  // === Path Preview (breach phase) ===

  function renderPathPreview(ctx) {
    // 優先使用路徑預覽快取（支援路障標記）
    if (DK.Map.pathPreviewCache && DK.Map.pathPreviewCache.length > 0) {
      const T = DK.CONFIG.TILE_SIZE;
      const time = DK.Game.time || 0;

      // 動態流動偏移（螞蟻行軍效果，快速流動）
      const dashOffset = -(time * 0.008) % 8;

      for (const { hole, path } of DK.Map.pathPreviewCache) {
        if (path.length === 0) continue;

        // 從洞口開始畫
        let prevX = hole.col * T + T / 2;
        let prevY = hole.row * T + T / 2;

        for (const step of path) {
          const curX = step.col * T + T / 2;
          const curY = step.row * T + T / 2;

          // 高對比色：正常路段亮青色，路障路段亮橙色
          const color = step.blocked
            ? 'rgba(255,180,40,0.7)'
            : 'rgba(40,255,200,0.6)';

          // 底層暗色描邊增加可見度
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.lineDashOffset = dashOffset;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(curX, curY);
          ctx.stroke();

          // 上層亮色主線
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(curX, curY);
          ctx.stroke();

          prevX = curX;
          prevY = curY;
        }

        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }
      return;
    }

    // 回退：無快取時使用舊邏輯（現在支援 planning/invasion）
    if (!DK.Map.distanceField || !DK.Map.heartPos) return;
    if (!DK.Map.breachHoles || DK.Map.breachHoles.length === 0) return;
    const T = DK.CONFIG.TILE_SIZE;

    for (const hole of DK.Map.breachHoles) {
      let col = hole.col;
      let row = hole.row;
      let steps = 0;
      const maxSteps = 200;

      while (steps < maxSteps) {
        const next = DK.Map.getNextStep ? DK.Map.getNextStep(col, row) : null;
        if (!next) break;
        if (DK.Map.isHeart && DK.Map.isHeart(next.col, next.row)) break;

        ctx.fillStyle = 'rgba(255,200,100,0.15)';
        ctx.fillRect(next.col * T + 4, next.row * T + 4, T - 8, T - 8);

        col = next.col;
        row = next.row;
        steps++;
      }
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
        case 'oil_splat': renderOilSplat(ctx, PA, effect, progress); break;
        case 'electrocute_burst': renderElectrocuteBurst(ctx, PA, effect, progress); break;
        case 'chain_lightning': renderChainLightning(ctx, PA, effect, progress); break;
        case 'water_nova': renderWaterNova(ctx, PA, effect, progress); break;
        case 'water_splash': renderWaterSplash(ctx, PA, effect, progress); break;
        case 'push_wave': renderPushWave(ctx, PA, effect, progress); break;
        case 'abyss_fall': renderAbyssFall(ctx, PA, effect, progress); break;
        case 'oil_ignite_burst': renderOilIgniteBurst(ctx, PA, effect, progress); break;
        case 'oil_splash': renderOilSplash(ctx, PA, effect, progress); break;
        case 'fire_splash': renderFireSplash(ctx, PA, effect, progress); break;
        case 'fire_nova': renderFireNova(ctx, PA, effect, progress); break;
        case 'burn_status': renderBurnStatus(ctx, PA, effect, progress); break;
        case 'blizzard_zone': renderBlizzardZone(ctx, PA, effect, progress); break;
        case 'evolution_burst': renderEvolutionBurst(ctx, PA, effect, progress); break;
        case 'stun_wave': renderStunWave(ctx, PA, effect, progress); break;
        case 'gold_sparkle': renderGoldSparkle(ctx, PA, effect, progress); break;
        case 'hero_deploy': renderHeroDeploy(ctx, PA, effect, progress); break;
        case 'hero_recall': renderHeroRecall(ctx, PA, effect, progress); break;
        case 'wall_break': renderWallBreak(ctx, PA, effect, progress); break;
        case 'barricade_shatter': {
          if (progress > 1) break;

          // 4-6 個石磚碎片飛散
          const bsFragments = [
            { dx: -3, dy: -4, r: 0.3 },
            { dx: 4, dy: -3, r: 0.5 },
            { dx: -2, dy: 3, r: 0.7 },
            { dx: 3, dy: 2, r: 0.4 },
            { dx: -5, dy: 0, r: 0.6 },
            { dx: 1, dy: -5, r: 0.2 },
          ];

          const bsAlpha = 1 - progress;
          for (const frag of bsFragments) {
            const fx = effect.x + frag.dx * progress * 8;
            const fy = effect.y + frag.dy * progress * 8 + progress * progress * 4; // 重力
            ctx.fillStyle = `rgba(90,90,110,${bsAlpha})`;
            ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 2, 2);
            // 較亮碎片
            ctx.fillStyle = `rgba(122,122,142,${bsAlpha * 0.7})`;
            ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
          }
          break;
        }
        case 'door_shatter': {
          if (progress > 1) break;

          // 6-8 個門碎片飛散（門比路障碎片更多更大）
          const dsFragments = [
            { dx: -4, dy: -5, r: 0.3 },
            { dx: 5, dy: -4, r: 0.5 },
            { dx: -3, dy: 4, r: 0.7 },
            { dx: 4, dy: 3, r: 0.4 },
            { dx: -6, dy: -1, r: 0.6 },
            { dx: 2, dy: -6, r: 0.2 },
            { dx: -2, dy: 2, r: 0.8 },
            { dx: 1, dy: 5, r: 0.35 },
          ];

          const dsAlpha = 1 - progress;
          for (const frag of dsFragments) {
            const fx = effect.x + frag.dx * progress * 10;
            const fy = effect.y + frag.dy * progress * 10 + progress * progress * 5; // 重力

            // 門碎片：混合木質、金屬、魔法顏色
            // 主色（褐色木質）
            ctx.fillStyle = `rgba(106,80,64,${dsAlpha})`;
            ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 3);
            // 高光（金屬/魔法光澤）
            ctx.fillStyle = `rgba(170,68,255,${dsAlpha * 0.5})`;
            ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
          }
          break;
        }
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
