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

  // Right click to deselect
  uiCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    DK.UI.selectedTrap = null;
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
    renderEffects(offCtx);

    // Scale pixel art to display canvas
    gameCtx.clearRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);
    disableSmoothing(gameCtx);

    // Fill background
    gameCtx.fillStyle = DK.COLORS.UI_BG;
    gameCtx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);

    // Draw scaled pixel art
    gameCtx.drawImage(
      offscreen,
      0, 0, DK.CONFIG.GAME_WIDTH, DK.CONFIG.GAME_HEIGHT,
      0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.GAME_HEIGHT * DK.CONFIG.SCALE
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

          if (effect.trapType === 'flame_jet') {
            // Fire stream: white core -> orange -> red -> smoke
            PA.pixel(ctx, ipx, ipy, '#ffffff');
            PA.pixel(ctx, ipx + 1, ipy, C.TRAP_FIRE_GLOW);
            PA.pixel(ctx, ipx - 1, ipy, C.TRAP_FIRE_GLOW);
            PA.pixel(ctx, ipx, ipy - 1, C.TRAP_FIRE);
            PA.pixel(ctx, ipx, ipy + 1, C.TRAP_FIRE);
            // Trail
            PA.pixel(ctx, ipx + Math.round(nx * 2), ipy + Math.round(ny * 2), C.TRAP_FIRE);
            PA.pixel(ctx, ipx + Math.round(nx * 3), ipy + Math.round(ny * 3), '#ff4400');
            PA.pixel(ctx, ipx + Math.round(nx * 4), ipy + Math.round(ny * 4), '#882200');
            // Sparks (randomized)
            if (Math.random() > 0.5) {
              PA.pixel(ctx, ipx + Math.round((Math.random() - 0.5) * 3),
                       ipy + Math.round((Math.random() - 0.5) * 3), '#ffcc44');
            }
          } else if (effect.trapType === 'ice_trap') {
            // Ice shard: bright blue crystal shape
            PA.pixel(ctx, ipx, ipy, '#ffffff');
            PA.pixel(ctx, ipx - 1, ipy, C.TRAP_ICE_GLOW);
            PA.pixel(ctx, ipx + 1, ipy, C.TRAP_ICE_GLOW);
            PA.pixel(ctx, ipx, ipy - 1, C.TRAP_ICE);
            PA.pixel(ctx, ipx, ipy + 1, C.TRAP_ICE);
            // Frost trail
            PA.pixel(ctx, ipx + Math.round(nx * 2), ipy + Math.round(ny * 2), C.TRAP_ICE);
            PA.pixel(ctx, ipx + Math.round(nx * 3), ipy + Math.round(ny * 3), '#2266aa');
            // Sparkle
            if (Math.random() > 0.6) {
              PA.pixel(ctx, ipx + Math.round((Math.random() - 0.5) * 2),
                       ipy + Math.round((Math.random() - 0.5) * 2), '#aaddff');
            }
          } else {
            // Arrow: wooden shaft with metal tip
            PA.pixel(ctx, ipx, ipy, C.TRAP_ARROW_TIP);
            PA.pixel(ctx, ipx + Math.round(nx), ipy + Math.round(ny), '#d0d8e0');
            PA.pixel(ctx, ipx + Math.round(nx * 2), ipy + Math.round(ny * 2), C.TRAP_ARROW_WOOD);
            PA.pixel(ctx, ipx + Math.round(nx * 3), ipy + Math.round(ny * 3), C.TRAP_ARROW_WOOD);
            // Fletching
            PA.pixel(ctx, ipx + Math.round(nx * 4), ipy + Math.round(ny * 4) - 1, '#cc4444');
            PA.pixel(ctx, ipx + Math.round(nx * 4), ipy + Math.round(ny * 4) + 1, '#cc4444');
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
              const color = Math.random() > 0.5 ? C.TRAP_FIRE : C.TRAP_FIRE_GLOW;
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

        case 'damage':
        case 'gold': {
          // Rendered on UI canvas at high resolution
          break;
        }
      }
    }
  }

  // Render floating text effects on UI canvas
  DK.renderUIEffects = function(ctx) {
    for (const effect of DK.Game.effects) {
      if (effect.type !== 'damage' && effect.type !== 'gold') continue;

      const progress = effect.timer / effect.duration;
      const alpha = Math.min(1, (1 - progress) * 2); // Fade out in second half
      const offsetY = progress * -25; // Float upward
      const scale = progress < 0.1 ? 0.5 + progress * 5 : 1; // Pop-in

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';

      const screenX = effect.x * DK.CONFIG.SCALE;
      const screenY = effect.y * DK.CONFIG.SCALE + offsetY;

      // Text shadow for readability
      ctx.font = DK.FONTS.bold(Math.round(14 * scale));
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(effect.text, screenX + 1, screenY + 1);

      // Main text
      ctx.fillStyle = effect.color;
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
