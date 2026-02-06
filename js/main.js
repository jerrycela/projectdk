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

    for (const effect of DK.Game.effects) {
      const progress = effect.timer / effect.duration;

      switch (effect.type) {
        case 'projectile': {
          const t = Math.min(1, progress * 3);
          const px = effect.x + (effect.targetX - effect.x) * t;
          const py = effect.y + (effect.targetY - effect.y) * t;

          if (effect.trapType === 'flame_jet') {
            // Fire projectile
            PA.pixel(ctx, Math.round(px), Math.round(py), DK.COLORS.TRAP_FIRE);
            PA.pixel(ctx, Math.round(px) + 1, Math.round(py), DK.COLORS.TRAP_FIRE_GLOW);
            PA.pixel(ctx, Math.round(px) - 1, Math.round(py), '#ff4400');
          } else if (effect.trapType === 'ice_trap') {
            // Ice projectile
            PA.pixel(ctx, Math.round(px), Math.round(py), DK.COLORS.TRAP_ICE);
            PA.pixel(ctx, Math.round(px), Math.round(py) - 1, DK.COLORS.TRAP_ICE_GLOW);
          } else {
            // Arrow projectile
            PA.pixel(ctx, Math.round(px), Math.round(py), DK.COLORS.TRAP_ARROW_TIP);
            PA.pixel(ctx, Math.round(px) - 1, Math.round(py), DK.COLORS.TRAP_ARROW_WOOD);
          }
          break;
        }
        case 'explosion': {
          const radius = effect.radius * progress;
          const alpha = 1 - progress;
          // Draw expanding circle
          for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
            const r = radius * (0.8 + Math.random() * 0.4);
            const px = Math.round(effect.x + Math.cos(angle) * r);
            const py = Math.round(effect.y + Math.sin(angle) * r);
            const color = progress < 0.3 ? '#ffffff' :
                         progress < 0.6 ? DK.COLORS.TRAP_FIRE :
                         DK.COLORS.TRAP_FIRE_GLOW;
            PA.pixel(ctx, px, py, color);
          }
          // Center flash
          if (progress < 0.3) {
            PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#ffffff');
          }
          break;
        }
        case 'damage':
        case 'gold': {
          // Text effects are rendered on UI canvas at high resolution
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
      const alpha = 1 - progress;
      const offsetY = progress * -20;

      ctx.fillStyle = effect.color;
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 14px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        effect.text,
        effect.x * DK.CONFIG.SCALE,
        effect.y * DK.CONFIG.SCALE + offsetY
      );
      ctx.globalAlpha = 1;
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
