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

  // Cache canvas rect to avoid triggering reflow on every mouse event
  let canvasRect = uiCanvas.getBoundingClientRect();

  // Update cached rect on window resize
  function updateCanvasRect() {
    canvasRect = uiCanvas.getBoundingClientRect();
  }
  window.addEventListener('resize', updateCanvasRect);

  // Input handling - mousedown/mouseup for drag-to-scroll camera
  uiCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Left button only
    const mx = e.clientX - canvasRect.left;
    const my = e.clientY - canvasRect.top;
    DK.UI.handleMouseDown(mx, my);
  });

  uiCanvas.addEventListener('mouseup', (e) => {
    if (e.button !== 0) return;
    const mx = e.clientX - canvasRect.left;
    const my = e.clientY - canvasRect.top;

    // Start screen: 啟動遊戲
    // 註：視覺模式選擇已移除，固定使用 DW3 優化風格（standard 模式）
    if (DK.Game.state === 'start') {
      /*
      // 檢查是否點擊視覺模式按鈕（已停用）
      if (DK.UI._presetButtons) {
        for (const btn of DK.UI._presetButtons) {
          if (mx >= btn.x && mx <= btn.x + btn.w &&
              my >= btn.y && my <= btn.y + btn.h) {
            // 點擊了視覺模式按鈕
            DK.VISUAL_SETTINGS.applyPreset(btn.preset);

            // 保存到 localStorage
            try {
              localStorage.setItem('dk_visual_preset', btn.preset);
            } catch (err) {
              console.warn('Failed to save visual preset:', err);
            }

            DK.UI._mouseDown = false;
            DK.UI._isDragging = false;
            return; // 不啟動遊戲
          }
        }
      }
      */

      // 檢查是否點擊教學按鈕
      if (DK.UI._tutorialButton) {
        const tb = DK.UI._tutorialButton;
        if (mx >= tb.x && mx <= tb.x + tb.w && my >= tb.y && my <= tb.y + tb.h) {
          DK.Game.tutorialRequested = true;
          DK.Game.startGame();
          DK.UI._mouseDown = false;
          DK.UI._isDragging = false;
          return;
        }
      }

      // 直接啟動遊戲（不含教學）
      DK.Game.tutorialRequested = false;
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
    const mx = e.clientX - canvasRect.left;
    const my = e.clientY - canvasRect.top;
    DK.UI.handleMouseMove(mx, my);
  });

  // Right click to deselect everything
  uiCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    DK.UI.clearSelection();
  });

  // 鍵盤導航（無障礙功能）
  document.addEventListener('keydown', (e) => {
    // ESC 快捷鍵：暫停/繼續
    if (e.key === 'Escape') {
      e.preventDefault();
      if (DK.Game && DK.Game.togglePause) {
        DK.Game.togglePause();
      }
      return;
    }

    // F3 快捷鍵：切換 FPS 監控
    if (e.key === 'F3') {
      e.preventDefault();
      if (DK.Debug) {
        const enabled = DK.Debug.toggle();
        if (DK.DEBUG_MODE) {
          console.log(`FPS 監控已${enabled ? '開啟' : '關閉'}`);
        }
      }
      return;
    }

    // Ctrl+Z / Cmd+Z 快捷鍵：撤銷操作
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();

      // 僅在 PLANNING 階段可撤銷
      if (DK.Game.state === 'planning') {
        if (DK.UndoSystem) {
          const success = DK.UndoSystem.undo();
          if (success && DK.SoundSystem) {
            DK.SoundSystem.play('ui_click', 0.7);
          }
        }
      } else {
        // 非 PLANNING 階段，顯示提示
        if (DK.UI && DK.UI.ErrorNotification) {
          DK.UI.ErrorNotification.show('只能在準備階段撤銷操作', 'warning');
        }
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
    DK.WorldRenderer.dungeonHeart(offCtx, DK.Game.time);

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
      DK.WorldRenderer.pathPreview(offCtx);
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

    // Map objects (between decorations and traps)
    if (DK.Map.renderMapObjects) {
      DK.Map.renderMapObjects(offCtx, DK.Game.time);
    }

    DK.Traps.render(offCtx);
    DK.WorldRenderer.barricades(offCtx, DK.Game.time);
    if (DK.Doors) DK.Doors.render(offCtx);
    DK.Enemies.render(offCtx, DK.Game.time);
    if (DK.Heroes) DK.Heroes.render(offCtx, DK.Game.time);
    DK.EffectRenderer.render(offCtx);

    // Layer 3 裝飾（牆壁前景裝飾）
    renderDecorations(3);

    offCtx.restore();
    // === Camera offset end ===

    // Screen-space rendering (not affected by camera)
    // Vignette (screen-space, stays at screen edges)
    if (DK.VISUAL_SETTINGS.isEnabled('vignette')) {
      DK.Map.renderVignette(offCtx);
    }

    // Global warm tone overlay
    if (DK.VISUAL_SETTINGS.isEnabled('colorGrading')) {
      const warmAlpha = 0.06 * (DK.VISUAL_SETTINGS.warmOverlayIntensity || 0.5);
      offCtx.fillStyle = `rgba(255,180,120,${warmAlpha})`;
      offCtx.fillRect(0, 0, DK.CONFIG.GAME_WIDTH, DK.CONFIG.GAME_HEIGHT);
    }

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
    DK.UI.render(uiCtx); // renderWavePreview 已在 DK.UI.render() 內部呼叫 (line 830)

    // Render FPS monitor (顯示在最上層)
    if (DK.Debug) {
      DK.Debug.render(uiCtx);
    }

    requestAnimationFrame(gameLoop);
  }

  // === Decoration Renderer (uses offCtx closure) ===

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

  // Patch UI render to include effects and tooltip
  const originalUIRender = DK.UI.render.bind(DK.UI);
  DK.UI.render = function(ctx) {
    originalUIRender(ctx);
    DK.renderUIEffects(ctx);

    // Render tooltip system (on top of everything)
    if (DK.Tooltip) {
      DK.Tooltip.render(ctx, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);
    }
  };

  // Initialize Math Cache (pre-compute sin/cos lookup tables)
  if (DK.MathCache) {
    DK.MathCache.init();
  }

  // Initialize Sound System
  if (DK.SoundSystem) {
    DK.SoundSystem.init();
  }

  // Load visual preset from localStorage（已停用 - 固定使用 DW3 優化風格）
  // 註：已改為固定使用 'standard' 模式，不再從 localStorage 載入
  /*
  try {
    const savedPreset = localStorage.getItem('dk_visual_preset');
    if (savedPreset && DK.VISUAL_SETTINGS) {
      DK.VISUAL_SETTINGS.applyPreset(savedPreset);
    }
  } catch (err) {
    console.warn('Failed to load visual preset from localStorage:', err);
  }
  */

  // Start!
  requestAnimationFrame(gameLoop);
})();
