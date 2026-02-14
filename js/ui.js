/**
 * Dungeon Keep - UI System
 * Renders high-resolution UI overlay with crisp Chinese text
 */
window.DK = window.DK || {};

// Font definitions for crisp Chinese rendering
DK.FONTS = {
  // Chinese text font stack (high quality, fallbacks for all platforms)
  CN: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", "Hiragino Sans GB", sans-serif',
  // Pixel art accent font (for English labels/numbers)
  PIXEL: '"Press Start 2P", monospace',

  // Pre-built font strings for common sizes
  title(size) { return `bold ${size}px ${this.CN}`; },
  body(size) { return `${size}px ${this.CN}`; },
  bold(size) { return `bold ${size}px ${this.CN}`; },
  heavy(size) { return `900 ${size}px ${this.CN}`; },
  pixel(size) { return `${size}px ${this.PIXEL}`; },
};

DK.UI = {
  selectedTrap: null,
  selectedHeroType: null, // Hero type to deploy
  selectedPlacedTrap: null, // Currently selected placed trap (for info panel)
  hoveredTile: null,
  hoveredButton: null, // Currently hovered button for highlight effect
  buttons: [],
  tooltipText: '',
  mouseX: 0,
  mouseY: 0,
  _isDragging: false,
  _dragStartX: 0,
  _dragStartY: 0,
  _lastDragX: 0,
  _lastDragY: 0,
  _mouseDown: false,
  showWaveStart: false,
  waveStartTimer: 0,
  showWaveComplete: false,
  waveCompleteTimer: 0,
  waveCompleteBonus: 0,
  messageQueue: [],
  fontsReady: false,
  _evolveButtonRect: null, // Cached evolve button hit area
  _recallButtonRect: null, // { x, y, w, h } 回收按鈕區域
  selectedBarricadeMode: false, // 路障放置模式

  // === 無障礙功能：鍵盤導航 ===
  keyboardFocusIndex: -1, // 當前鍵盤焦點按鈕索引（-1 = 無焦點）
  keyboardNavigationEnabled: false, // Tab 鍵導航是否啟用

  // 按鈕狀態系統（5 種狀態）
  ButtonStates: {
    NORMAL: 'normal',
    HOVER: 'hover',
    SELECTED: 'selected',
    DISABLED: 'disabled',
    COOLDOWN: 'cooldown'
  },

  /**
   * 取得按鈕狀態（優先級：禁用 > 冷卻 > 選中 > 懸停 > 正常）
   */
  getButtonState(btn) {
    const game = DK.Game;

    // 禁用狀態：金幣不足
    if (btn.trap && game && game.gold < btn.trap.cost) {
      return this.ButtonStates.DISABLED;
    }
    if (btn.hero && game && game.gold < btn.hero.cost) {
      return this.ButtonStates.DISABLED;
    }

    // 選中狀態
    if (btn.trap && this.selectedTrap && btn.trap.id === this.selectedTrap.id) {
      return this.ButtonStates.SELECTED;
    }
    if (btn.hero && this.selectedHeroType && this.selectedHeroType.id === btn.hero.id) {
      return this.ButtonStates.SELECTED;
    }
    if (btn.barricade && this.selectedBarricadeMode) {
      return this.ButtonStates.SELECTED;
    }

    // 懸停狀態
    if (this.hoveredButton === btn) {
      return this.ButtonStates.HOVER;
    }

    // 正常狀態
    return this.ButtonStates.NORMAL;
  },


  init() {
    this.selectedTrap = null;
    this.selectedHeroType = null;
    this.selectedPlacedTrap = null;
    this._evolveButtonRect = null;
    this._recallButtonRect = null;
    this.selectedBarricadeMode = false;
    this.hoveredTile = null;
    this.keyboardFocusIndex = -1;
    this.keyboardNavigationEnabled = false;
    this.buildButtons();
    this.checkFonts();
  },

  // === 無障礙功能：形狀語言對應（色盲友善）===
  getShapeForType(type, id) {
    // 陷阱形狀
    if (type === 'trap') {
      if (id === 'shock_plate') return '●'; // 圓形（電擊）
      if (id === 'push_trap') return '▲'; // 三角形（推力）
      if (id === 'oil_trap') return '■'; // 正方形（油漬）
      if (id === 'wind_trap') return '◆'; // 菱形（風壓）
    }
    // 英雄形狀
    if (type === 'hero') {
      if (id === 'leviathan') return '●'; // 圓形（水）
      if (id === 'baal') return '▲'; // 三角形（火）
    }
    return '●'; // 預設圓形
  },

  // === 無障礙功能：鍵盤導航 - 下一個按鈕 ===
  focusNextButton() {
    if (this.buttons.length === 0) return;

    this.keyboardNavigationEnabled = true;
    this.keyboardFocusIndex = (this.keyboardFocusIndex + 1) % this.buttons.length;

    // 跳過波次按鈕（波次未開始時不可用）
    const btn = this.buttons[this.keyboardFocusIndex];
    if (btn.action === 'start_wave' && DK.Game.state !== 'planning') {
      this.focusNextButton(); // 遞迴跳過
    }
  },

  // === 無障礙功能：鍵盤導航 - 上一個按鈕 ===
  focusPrevButton() {
    if (this.buttons.length === 0) return;

    this.keyboardNavigationEnabled = true;
    this.keyboardFocusIndex--;
    if (this.keyboardFocusIndex < 0) {
      this.keyboardFocusIndex = this.buttons.length - 1;
    }

    // 跳過波次按鈕
    const btn = this.buttons[this.keyboardFocusIndex];
    if (btn.action === 'start_wave' && DK.Game.state !== 'planning') {
      this.focusPrevButton();
    }
  },

  // === 無障礙功能：鍵盤導航 - 激活當前按鈕 ===
  activateFocusedButton() {
    if (this.keyboardFocusIndex < 0 || this.keyboardFocusIndex >= this.buttons.length) return;

    const btn = this.buttons[this.keyboardFocusIndex];

    // 模擬點擊按鈕中心
    const clickX = btn.x + btn.width / 2;
    const clickY = btn.y + btn.height / 2;
    this.handleClick(clickX, clickY);
  },

  // === 無障礙功能：鍵盤導航 - 清除選擇 ===
  clearSelectionViaKeyboard() {
    this.clearSelection();
    this.keyboardFocusIndex = -1;
    this.keyboardNavigationEnabled = false;
  },

  // === 無障礙功能：鍵盤處理 ===
  handleKeyboard(e) {
    // 遊戲未開始或遊戲結束時不處理
    if (!DK.Game || DK.Game.state === 'start' || DK.Game.gameOver) return;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          this.focusPrevButton(); // Shift+Tab: 上一個
        } else {
          this.focusNextButton(); // Tab: 下一個
        }
        break;

      case 'Enter':
        e.preventDefault();
        this.activateFocusedButton(); // Enter: 激活當前焦點按鈕
        break;

      case 'Escape':
        e.preventDefault();
        this.clearSelectionViaKeyboard(); // Esc: 清除選擇
        break;

      case 'r':
      case 'R':
        // R: 快速重新開始（遊戲結束時）
        if (DK.Game.gameOver) {
          e.preventDefault();
          DK.Game.restart();
        }
        break;

      // 方向鍵：移動攝影機
      case 'ArrowUp':
        e.preventDefault();
        if (DK.Game.camera) {
          DK.Game.camera.y = Math.max(0, DK.Game.camera.y - DK.CONFIG.TILE_SIZE * 2);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (DK.Game.camera) {
          const maxY = (DK.CONFIG.WORLD_ROWS - DK.CONFIG.GRID_ROWS) * DK.CONFIG.TILE_SIZE;
          DK.Game.camera.y = Math.min(maxY, DK.Game.camera.y + DK.CONFIG.TILE_SIZE * 2);
        }
        break;

      case 'ArrowLeft':
        e.preventDefault();
        if (DK.Game.camera) {
          DK.Game.camera.x = Math.max(0, DK.Game.camera.x - DK.CONFIG.TILE_SIZE * 2);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (DK.Game.camera) {
          const maxX = (DK.CONFIG.WORLD_COLS - DK.CONFIG.GRID_COLS) * DK.CONFIG.TILE_SIZE;
          DK.Game.camera.x = Math.min(maxX, DK.Game.camera.x + DK.CONFIG.TILE_SIZE * 2);
        }
        break;

      // 數字鍵 1-9：快速選擇陷阱/英雄
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < this.buttons.length) {
          const btn = this.buttons[index];
          if (btn.action !== 'start_wave') {
            this.keyboardFocusIndex = index;
            this.keyboardNavigationEnabled = true;
            this.activateFocusedButton();
          }
        }
        break;
    }
  },

  checkFonts() {
    // Ensure fonts are loaded before rendering text
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        this.fontsReady = true;
      });
    } else {
      this.fontsReady = true;
    }
  },

  buildButtons() {
    this.buttons = [];
    const trapTypes = Object.values(DK.TRAP_TYPES);
    const heroTypes = Object.values(DK.HERO_TYPES);
    // 總按鈕數：陷阱 + 英雄 + 路障
    const totalItems = trapTypes.length + heroTypes.length + 1;
    const separatorGap = 14; // Gap between sections

    // Dynamic button sizing — 多一個路障按鈕和分隔間距
    const waveButtonWidth = 100;
    const waveGap = 12;
    const availableWidth = DK.CONFIG.DISPLAY_WIDTH - 20 - waveButtonWidth - waveGap - 20 - separatorGap * 2;
    const gap = 6;
    const btnWidth = Math.min(120, Math.floor((availableWidth - gap * (totalItems - 1)) / totalItems));
    const btnHeight = 70;
    const startX = 12;
    const startY = DK.CONFIG.UI_TOP + 13;

    // Left side: trap buttons
    trapTypes.forEach((trap, i) => {
      this.buttons.push({
        trap,
        x: startX + (btnWidth + gap) * i,
        y: startY,
        width: btnWidth,
        height: btnHeight,
      });
    });

    // Middle separator gap, then hero buttons
    const heroStartX = startX + (btnWidth + gap) * trapTypes.length + separatorGap;
    heroTypes.forEach((hero, i) => {
      this.buttons.push({
        hero,
        x: heroStartX + (btnWidth + gap) * i,
        y: startY,
        width: btnWidth,
        height: btnHeight,
      });
    });

    // 路障按鈕（英雄按鈕之後）
    const barricadeStartX = heroStartX + (btnWidth + gap) * heroTypes.length + separatorGap;
    this.buttons.push({
      barricade: true,
      x: barricadeStartX,
      y: startY,
      width: btnWidth,
      height: btnHeight,
    });

    // Store layout info for separator and labels
    const trapEndX = startX + (btnWidth + gap) * trapTypes.length - gap;
    this._sectionLayout = {
      separatorX: Math.floor(trapEndX + separatorGap / 2),
      separatorY: startY,
      separatorH: btnHeight,
      trapLabelX: startX + (trapEndX - startX) / 2,
      heroLabelX: heroStartX + ((btnWidth + gap) * heroTypes.length - gap) / 2,
      labelY: startY - 2,
      // 路障區分隔線
      barricadeSeparatorX: Math.floor(heroStartX + (btnWidth + gap) * heroTypes.length + separatorGap / 2 - gap / 2),
    };

    // Wave start button (always far right)
    this.buttons.push({
      action: 'start_wave',
      label: '開始波次',
      x: DK.CONFIG.DISPLAY_WIDTH - waveButtonWidth - 12,
      y: startY,
      width: waveButtonWidth,
      height: btnHeight,
    });
  },

  /**
   * 更新按鈕狀態（根據遊戲階段啟用/禁用）
   * 在狀態轉換時呼叫此方法以同步 UI
   */
  updateButtonStates() {
    if (!DK.Game) return;

    // 目前此方法主要用於確保狀態同步
    // 按鈕的啟用/禁用邏輯已在 getButtonState() 中處理
    // 未來可以在這裡添加更多狀態同步邏輯
  },

  handleMouseDown(mx, my) {
    // Only start drag tracking in game area
    if (my < DK.CONFIG.UI_TOP) {
      this._mouseDown = true;
      this._isDragging = false;
      this._dragStartX = mx;
      this._dragStartY = my;
      this._lastDragX = mx;
      this._lastDragY = my;
    }
  },

  handleMouseUp(mx, my) {
    const wasDragging = this._isDragging;
    this._mouseDown = false;
    this._isDragging = false;
    if (!wasDragging) {
      // Not a drag, treat as click
      this.handleClick(mx, my);
    }
  },

  handleClick(mx, my) {
    // Check evolve button click (before anything else)
    if (this.selectedPlacedTrap && this._evolveButtonRect) {
      const eb = this._evolveButtonRect;
      if (mx >= eb.x && mx <= eb.x + eb.w && my >= eb.y && my <= eb.y + eb.h) {
        const trap = this.selectedPlacedTrap;
        const evo = DK.Traps.getEvolutionForTrap(trap);
        if (evo && DK.Game && DK.Game.gold >= evo.cost) {
          DK.Game.gold -= evo.cost;
          DK.Traps.evolveTrap(trap, evo.id);
          this.selectedPlacedTrap = null;
          this._evolveButtonRect = null;
          return true;
        } else if (evo && DK.Game && DK.Game.gold < evo.cost) {
          // 使用可操作錯誤訊息
          if (DK.ErrorHandler) {
            DK.ErrorHandler.showError('insufficient_gold', { required: evo.cost, current: DK.Game.gold });
          }
          return true;
        }
      }
    }

    // Check recall button click
    if (DK.Heroes && DK.Heroes.selectedHero && this._recallButtonRect) {
      const rb = this._recallButtonRect;
      if (mx >= rb.x && mx <= rb.x + rb.w && my >= rb.y && my <= rb.y + rb.h) {
        DK.Heroes.recall(DK.Heroes.selectedHero);
        this._recallButtonRect = null;
        return true;
      }
    }

    // Check UI buttons
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.width &&
          my >= btn.y && my <= btn.y + btn.height) {
        if (btn.action === 'start_wave') {
          if (DK.Game) {
            if (DK.Game.state === 'planning') {
              // 播放 UI 點擊音效
              if (DK.SoundSystem) {
                DK.SoundSystem.play('ui_click');
              }
              // PLANNING → INVASION（直接開始入侵）
              DK.Game.startInvasion();
              // 教學系統：檢測波次開始
              if (DK.Tutorial) {
                DK.Tutorial.checkCondition('waveStarted', { wave: DK.Game.currentWave + 1 });
              }
            }
          }
          return true;
        }
        if (btn.trap) {
          // 播放 UI 點擊音效
          if (DK.SoundSystem) {
            DK.SoundSystem.play('ui_click');
          }
          this.selectedTrap = btn.trap;
          this.selectedHeroType = null;
          this.selectedPlacedTrap = null;
          this._evolveButtonRect = null;
          this.selectedBarricadeMode = false;
          if (DK.Heroes) DK.Heroes.selectedHero = null;
          return true;
        }
        if (btn.hero) {
          // 播放 UI 點擊音效
          if (DK.SoundSystem) {
            DK.SoundSystem.play('ui_click');
          }
          this.selectedHeroType = btn.hero;
          this.selectedTrap = null;
          this.selectedPlacedTrap = null;
          this._evolveButtonRect = null;
          this.selectedBarricadeMode = false;
          if (DK.Heroes) DK.Heroes.selectedHero = null;
          return true;
        }
        if (btn.barricade) {
          this.selectedBarricadeMode = !this.selectedBarricadeMode;
          this.selectedTrap = null;
          this.selectedHeroType = null;
          this.selectedPlacedTrap = null;
          this._evolveButtonRect = null;
          if (DK.Heroes) DK.Heroes.selectedHero = null;
          return true;
        }
      }
    }

    // Check game area clicks (apply camera offset)
    if (my < DK.CONFIG.UI_TOP && DK.Game) {
      const col = Math.floor((mx / DK.CONFIG.SCALE + DK.Game.camera.x) / DK.CONFIG.TILE_SIZE);
      const row = Math.floor((my / DK.CONFIG.SCALE + DK.Game.camera.y) / DK.CONFIG.TILE_SIZE);

      // 路障放置（planning 階段）
      if (DK.Game.state === 'planning' && this.selectedBarricadeMode) {
        // 點擊已有路障 → 移除
        if (DK.Map.hasBarricade && DK.Map.hasBarricade(col, row)) {
          DK.Map.removeBarricade(col, row);
          return true;
        }
        // 點擊空地 → 放置
        if (DK.Map.placeBarricade && DK.Map.placeBarricade(col, row)) {
          // 教學系統：檢測路障放置
          if (DK.Tutorial && DK.Map.barricades) {
            DK.Tutorial.checkCondition('barricadePlaced', { count: DK.Map.barricades.length });
          }
          return true;
        }
        return true;
      }

      // Priority 1: Click on existing hero to select it
      if (DK.Heroes) {
        const pixelX = mx / DK.CONFIG.SCALE + DK.Game.camera.x;
        const pixelY = my / DK.CONFIG.SCALE + DK.Game.camera.y;
        const clickedHero = DK.Heroes.getHeroNear(pixelX, pixelY);
        if (clickedHero) {
          DK.Heroes.selectedHero = clickedHero;
          this.selectedTrap = null;
          this.selectedHeroType = null;
          this.selectedPlacedTrap = null;
          this._evolveButtonRect = null;
          return true;
        }
      }

      // Priority 1.5: Click on placed trap to inspect it
      if (DK.Traps) {
        const clickedTrap = DK.Traps.getTrapAt(col, row);
        if (clickedTrap) {
          this.selectedPlacedTrap = clickedTrap;
          this.selectedTrap = null;
          this.selectedHeroType = null;
          if (DK.Heroes) DK.Heroes.selectedHero = null;
          return true;
        }
      }

      // Priority 2: Deploy hero (was Priority 3, hero movement removed for patrol AI)
      if (this.selectedHeroType) {
        const heroTile = DK.Map.layout[row] && DK.Map.layout[row][col];
        const heroTileValid = DK.Map.isPath(col, row) &&
          heroTile !== 'E' && heroTile !== 'X' &&
          heroTile !== 'O' && heroTile !== 'B' && heroTile !== 'H' &&
          !(DK.Map.isOuter && DK.Map.isOuter(col, row)) &&
          !(DK.Map.isHeart && DK.Map.isHeart(col, row));
        if (heroTileValid) {
          if (DK.Game.gold >= this.selectedHeroType.cost) {
            if (DK.Heroes && DK.Heroes.deploy(this.selectedHeroType.id, col, row)) {
              // 播放英雄召喚音效
              if (DK.SoundSystem) {
                DK.SoundSystem.play('hero_summon');
              }
              DK.Game.gold -= this.selectedHeroType.cost;
              return true;
            }
          } else {
            // 使用可操作錯誤訊息
            if (DK.ErrorHandler) {
              DK.ErrorHandler.showError('insufficient_gold', { required: this.selectedHeroType.cost, current: DK.Game.gold });
            }
          }
        }
        return true;
      }
    }

    // Check game area click (place trap) - apply camera offset
    // Allow trap placement in planning and invasion phases
    if (my < DK.CONFIG.UI_TOP && this.selectedTrap && DK.Game &&
        (DK.Game.state === 'planning' || DK.Game.state === 'invasion')) {
      const col = Math.floor((mx / DK.CONFIG.SCALE + DK.Game.camera.x) / DK.CONFIG.TILE_SIZE);
      const row = Math.floor((my / DK.CONFIG.SCALE + DK.Game.camera.y) / DK.CONFIG.TILE_SIZE);

      // Exclude outer walls and heart tiles from trap placement
      if ((DK.Map.isOuter && DK.Map.isOuter(col, row)) ||
          (DK.Map.isHeart && DK.Map.isHeart(col, row))) {
        return false;
      }

      if (this.selectedTrap.type === 'wall' && DK.Map.isValidWallTrapSlot(col, row)) {
        if (DK.Game.gold >= this.selectedTrap.cost) {
          if (DK.Traps.place(this.selectedTrap.id, col, row)) {
            // 播放陷阱放置音效
            if (DK.SoundSystem) {
              DK.SoundSystem.play('trap_place');
            }
            DK.Game.gold -= this.selectedTrap.cost;
            // 教學系統：檢測陷阱放置
            if (DK.Tutorial && DK.Traps.placed) {
              DK.Tutorial.checkCondition('trapPlaced', { count: DK.Traps.placed.length });
            }
            return true;
          }
        } else {
          // 使用可操作錯誤訊息
          if (DK.ErrorHandler) {
            DK.ErrorHandler.showError('insufficient_gold', { required: this.selectedTrap.cost, current: DK.Game.gold });
          }
        }
      } else if (this.selectedTrap.type === 'floor' && DK.Map.isValidFloorTrapSlot(col, row)) {
        if (DK.Game.gold >= this.selectedTrap.cost) {
          if (DK.Traps.place(this.selectedTrap.id, col, row)) {
            // 播放陷阱放置音效
            if (DK.SoundSystem) {
              DK.SoundSystem.play('trap_place');
            }
            DK.Game.gold -= this.selectedTrap.cost;
            // 教學系統：檢測陷阱放置
            if (DK.Tutorial && DK.Traps.placed) {
              DK.Tutorial.checkCondition('trapPlaced', { count: DK.Traps.placed.length });
            }
            return true;
          }
        } else {
          // 使用可操作錯誤訊息
          if (DK.ErrorHandler) {
            DK.ErrorHandler.showError('insufficient_gold', { required: this.selectedTrap.cost, current: DK.Game.gold });
          }
        }
      }
    }

    return false;
  },

  handleMouseMove(mx, my) {
    this.mouseX = mx;
    this.mouseY = my;

    // Drag detection and camera scrolling (game area only)
    if (this._mouseDown && my < DK.CONFIG.UI_TOP) {
      const dx = mx - this._dragStartX;
      const dy = my - this._dragStartY;
      if (!this._isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        this._isDragging = true;
      }
      if (this._isDragging) {
        const moveDx = mx - this._lastDragX;
        const moveDy = my - this._lastDragY;
        DK.Game.camera.x -= moveDx / DK.CONFIG.SCALE;
        DK.Game.camera.y -= moveDy / DK.CONFIG.SCALE;
        DK.Game.clampCamera();
        this._lastDragX = mx;
        this._lastDragY = my;
        return; // While dragging, skip hover logic
      }
    }

    // Hover tile with camera offset
    if (my < DK.CONFIG.UI_TOP) {
      const col = Math.floor((mx / DK.CONFIG.SCALE + DK.Game.camera.x) / DK.CONFIG.TILE_SIZE);
      const row = Math.floor((my / DK.CONFIG.SCALE + DK.Game.camera.y) / DK.CONFIG.TILE_SIZE);
      this.hoveredTile = { col, row };
    } else {
      this.hoveredTile = null;
    }

    // Update tooltip and hovered button
    this.tooltipText = '';
    this.hoveredButton = null;
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.width &&
          my >= btn.y && my <= btn.y + btn.height) {
        this.hoveredButton = btn;
        if (btn.trap) {
          this.tooltipText = `${btn.trap.name}: ${btn.trap.description} (點擊選取)`;
        } else if (btn.hero) {
          this.tooltipText = `${btn.hero.name}: ${btn.hero.description} (點擊部署)`;
        }
        break;
      }
    }

    // === Tooltip System Integration ===
    if (DK.Tooltip && !this._isDragging) {
      // 優先級：已放置陷阱 > 英雄 > 敵人 > UI 按鈕
      let tooltipShown = false;

      // 1. 檢查是否懸停在已放置的陷阱上
      if (this.hoveredTile && DK.Traps && DK.Game && !DK.Game.gameOver) {
        const { col, row } = this.hoveredTile;
        const hoveredTrap = DK.Traps.placed.find(t => t.col === col && t.row === row);
        if (hoveredTrap) {
          DK.Tooltip.show('trap', hoveredTrap, mx, my);
          tooltipShown = true;
        }
      }

      // 2. 檢查是否懸停在英雄上
      if (!tooltipShown && this.hoveredTile && DK.Heroes && DK.Heroes.active && DK.Game && !DK.Game.gameOver) {
        const { col, row } = this.hoveredTile;
        const hoveredHero = DK.Heroes.active.find(h =>
          Math.floor(h.col) === col && Math.floor(h.row) === row
        );
        if (hoveredHero) {
          DK.Tooltip.show('hero', hoveredHero, mx, my);
          tooltipShown = true;
        }
      }

      // 3. 檢查是否懸停在敵人上
      if (!tooltipShown && this.hoveredTile && DK.Enemies && DK.Enemies.active && DK.Game && !DK.Game.gameOver) {
        const { col, row } = this.hoveredTile;
        const T = DK.CONFIG.TILE_SIZE;
        const hoveredEnemy = DK.Enemies.active.find(e => {
          if (!e.alive) return false;
          const eCol = Math.floor(e.x / T);
          const eRow = Math.floor(e.y / T);
          return eCol === col && eRow === row;
        });
        if (hoveredEnemy) {
          DK.Tooltip.show('enemy', hoveredEnemy, mx, my);
          tooltipShown = true;
        }
      }

      // 4. 檢查是否懸停在 UI 按鈕上（只有當按鈕有 description 時才顯示）
      if (!tooltipShown && this.hoveredButton && this.hoveredButton.description) {
        DK.Tooltip.show('button', this.hoveredButton, mx, my);
        tooltipShown = true;
      }

      // 如果沒有任何 tooltip，隱藏
      if (!tooltipShown) {
        DK.Tooltip.hide();
      }
    }

    // Update cursor style based on state
    const uiCanvas = document.getElementById('ui-canvas');
    uiCanvas.classList.remove('cursor-pointer', 'cursor-crosshair', 'cursor-grabbing');
    if (this._isDragging) {
      uiCanvas.classList.add('cursor-grabbing');
    } else if (this.hoveredButton) {
      uiCanvas.classList.add('cursor-pointer');
    } else if (this.selectedTrap || this.selectedHeroType) {
      uiCanvas.classList.add('cursor-crosshair');
    }
  },

  showMessage(text) {
    this.messageQueue.push({
      text,
      timer: 2000,
    });
  },

  update(dt) {
    // Update messages
    for (const msg of this.messageQueue) {
      msg.timer -= dt;
    }
    this.messageQueue = this.messageQueue.filter(m => m.timer > 0);

    // Wave start display
    if (this.showWaveStart) {
      this.waveStartTimer -= dt;
      if (this.waveStartTimer <= 0) {
        this.showWaveStart = false;
      }
    }

    // 波次完成慶祝顯示
    if (this.showWaveComplete) {
      this.waveCompleteTimer -= dt;
      if (this.waveCompleteTimer <= 0) {
        this.showWaveComplete = false;
      }
    }

    // 波次開始過渡顯示
    if (this.showWaveStart) {
      this.waveStartTimer -= dt;
      if (this.waveStartTimer <= 0) {
        this.showWaveStart = false;
      }
    }

    // 更新按鈕 hover 動畫進度（緩動過渡）
    for (const btn of this.buttons) {
      // 初始化 hoverProgress（首次）
      if (btn.hoverProgress === undefined) {
        btn.hoverProgress = 0;
      }

      // 根據 hover 狀態更新進度
      const isHovered = this.hoveredButton === btn;
      const targetProgress = isHovered ? 1 : 0;
      const speed = 0.15; // 每幀變化量（約 6-7 幀完成過渡）

      if (btn.hoverProgress < targetProgress) {
        btn.hoverProgress = Math.min(1, btn.hoverProgress + speed);
      } else if (btn.hoverProgress > targetProgress) {
        btn.hoverProgress = Math.max(0, btn.hoverProgress - speed);
      }
    }
  },

  render(ctx) {
    const C = DK.COLORS;
    const W = DK.CONFIG.DISPLAY_WIDTH;
    const game = DK.Game;

    // UI Background panel
    ctx.fillStyle = C.UI_BG;
    ctx.fillRect(0, DK.CONFIG.UI_TOP, W, DK.CONFIG.UI_HEIGHT);

    // Top border line (decorative)
    this.drawPixelBorder(ctx, 0, DK.CONFIG.UI_TOP, W, DK.CONFIG.UI_HEIGHT);

    // Section labels and separator
    if (this._sectionLayout) {
      const sl = this._sectionLayout;
      // Separator line between trap and hero sections
      ctx.fillStyle = C.UI_BORDER;
      ctx.fillRect(sl.separatorX, sl.separatorY, 1, sl.separatorH);
      // 路障區分隔線
      if (sl.barricadeSeparatorX) {
        ctx.fillRect(sl.barricadeSeparatorX, sl.separatorY, 1, sl.separatorH);
      }
      // "陷阱" label
      ctx.font = DK.FONTS.body(10);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = C.UI_TEXT_DIM;
      ctx.fillText('陷阱', sl.trapLabelX, sl.labelY);
      // "英雄" label
      ctx.fillText('英雄', sl.heroLabelX, sl.labelY);
    }

    // Trap selection buttons
    for (const btn of this.buttons) {
      this.renderButton(ctx, btn);
    }

    // Top HUD bar
    this.renderHUD(ctx);

    // Hero recall button (when hero is selected)
    if (DK.Heroes && DK.Heroes.selectedHero) {
      this.renderHeroRecallButton(ctx);
    }

    // Hover indicator on game area
    this.renderHoverIndicator(ctx);

    // Selected placed trap info panel
    this.renderSelectedTrapInfo(ctx);

    // Selected trap range preview
    if (this.selectedTrap && this.hoveredTile) {
      this.renderPlacementPreview(ctx);
    }

    // Tooltip / placement hint
    this.renderTooltip(ctx);

    // Wave preview (next wave composition)
    this.renderWavePreview(ctx);

    // Messages
    this.renderMessages(ctx);

    // Wave announcement
    if (this.showWaveStart) {
      this.renderWaveAnnouncement(ctx);
    }

    // 波次完成慶祝特效
    if (this.showWaveComplete) {
      this.renderWaveComplete(ctx);
    }

    // Phase hints
    this.renderPhaseHint(ctx);

    // Game over / Victory
    if (game && game.gameOver) {
      this.renderGameOver(ctx);
    }

    // 暫停畫面
    if (game && game.paused) {
      this.renderPauseScreen(ctx);
    }

    // 教學系統渲染
    if (DK.Tutorial) {
      DK.Tutorial.render(ctx);
    }

    // 錯誤提示系統渲染（就近原則）
    if (DK.UI.ErrorNotification) {
      DK.UI.ErrorNotification.render(ctx);
    }
  },

  clearSelection() {
    this.selectedTrap = null;
    this.selectedHeroType = null;
    this.selectedPlacedTrap = null;
    this._evolveButtonRect = null;
    this._recallButtonRect = null;
    this.selectedBarricadeMode = false;
    this.tooltipText = '';
    if (DK.Heroes) DK.Heroes.selectedHero = null;
  }
};

