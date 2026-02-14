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

    // 教學系統渲染
    if (DK.Tutorial) {
      DK.Tutorial.render(ctx);
    }

    // 錯誤提示系統渲染（就近原則）
    if (DK.UI.ErrorNotification) {
      DK.UI.ErrorNotification.render(ctx);
    }
  },

  renderPhaseHint(ctx) {
    const game = DK.Game;
    if (!game || game.gameOver) return;

    let hintText = '';
    let hintColor = '#aaa090';

    if (game.state === 'planning') {
      hintText = '部署陷阱和英雄 → 點擊右側按鈕開始入侵';
      hintColor = '#88ddff';
    } else if (game.state === 'invasion' && game.waveAutoTimer > 0) {
      hintText = `下一波倒數 ${Math.ceil(game.waveAutoTimer / 1000)} 秒`;
      hintColor = '#88ddff';
    }

    if (!hintText) return;

    const panelY = 46;
    const panelH = 24;

    ctx.save();
    ctx.font = DK.FONTS.body(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(hintText);
    const panelW = metrics.width + 28;
    const panelX = DK.CONFIG.DISPLAY_WIDTH / 2 - panelW / 2;

    ctx.fillStyle = 'rgba(18,16,30,0.85)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(74,62,110,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 4);
    ctx.stroke();

    ctx.fillStyle = hintColor;
    ctx.fillText(hintText, DK.CONFIG.DISPLAY_WIDTH / 2, panelY + panelH / 2);

    ctx.restore();
  },

  drawPixelBorder(ctx, x, y, w, h) {
    const C = DK.COLORS;
    const s = 3; // pixel size for border segments

    // Outer border
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(x, y, w, s);
    ctx.fillRect(x, y + h - s, w, s);
    ctx.fillRect(x, y, s, h);
    ctx.fillRect(x + w - s, y, s, h);

    // Inner highlight (top and left)
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    ctx.fillRect(x + s, y + s, w - s * 2, 1);
    ctx.fillRect(x + s, y + s, 1, h - s * 2);

    // Inner shadow (bottom and right)
    ctx.fillStyle = '#1a1630';
    ctx.fillRect(x + s, y + h - s - 1, w - s * 2, 1);
    ctx.fillRect(x + w - s - 1, y + s, 1, h - s * 2);

    // Corner decorations (pixel art diamonds)
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    // Top-left corner
    ctx.fillRect(x + s, y + s, 2, 2);
    // Top-right corner
    ctx.fillRect(x + w - s - 2, y + s, 2, 2);
    // Bottom-left corner
    ctx.fillRect(x + s, y + h - s - 2, 2, 2);
    // Bottom-right corner
    ctx.fillRect(x + w - s - 2, y + h - s - 2, 2, 2);
  },

  /**
   * Draw a small pixel art icon representing a trap type
   */
  drawTrapIcon(ctx, x, y, trapId, size) {
    ctx.save(); // 保護 Canvas 狀態

    const s = size || 24;
    const hs = s / 2;

    switch (trapId) {
      case 'shock_plate':
        // Lightning bolt icon
        if (DK.DEBUG_MODE) {
          console.log(`[UI] 繪製 shock_plate 圖標: x=${x}, y=${y}, size=${s}`);
        }

        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(x + hs, y + 3, 2, 3);
        ctx.fillRect(x + hs - 2, y + 6, 5, 2);
        ctx.fillRect(x + hs, y + 8, 2, 3);
        ctx.fillRect(x + hs - 1, y + 11, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + hs, y + 6, 1, 1);
        break;

      case 'push_trap':
        // Piston/ram icon
        ctx.fillStyle = '#5a5060';
        ctx.fillRect(x + 4, y + 3, s - 8, 6);
        ctx.fillStyle = '#8a8090';
        ctx.fillRect(x + 5, y + 4, s - 10, 4);
        // Ram plate
        ctx.fillStyle = '#aaa0b0';
        ctx.fillRect(x + 4, y + s - 8, s - 8, 3);
        ctx.fillStyle = '#bbb0c0';
        ctx.fillRect(x + 4, y + s - 8, s - 8, 1);
        // Charge glow
        ctx.fillStyle = '#ff6622';
        ctx.fillRect(x + hs - 1, y + 6, 2, 2);
        // Direction arrow
        ctx.fillStyle = '#ff8844';
        ctx.fillRect(x + hs - 1, y + s - 4, 2, 2);
        ctx.fillRect(x + hs, y + s - 3, 1, 2);
        break;

      case 'oil_trap':
        // 油漬陷阱圖標
        ctx.fillStyle = '#3a3020';
        ctx.beginPath();
        ctx.arc(x + hs, y + hs + 2, hs - 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a2010';
        ctx.beginPath();
        ctx.arc(x + hs, y + hs + 2, hs - 8, 0, Math.PI * 2);
        ctx.fill();
        // 油光反射
        ctx.fillStyle = '#5a5030';
        ctx.fillRect(x + hs - 2, y + hs - 1, 3, 1);
        // 油滴
        ctx.fillStyle = '#3a2810';
        ctx.fillRect(x + hs - 1, y + hs + 3, 2, 2);
        ctx.fillRect(x + hs + 2, y + hs + 1, 1, 2);
        // 噴嘴
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(x + hs - 3, y + hs, 1, 1);
        ctx.fillRect(x + hs + 3, y + hs, 1, 1);
        break;

      case 'wind_trap':
        // 風壓裝置圖標
        ctx.fillStyle = '#2a3448';
        ctx.fillRect(x + 3, y + 2, s - 6, s - 4);
        ctx.fillStyle = '#88aacc';
        // 風扇葉片 (X 形)
        ctx.fillRect(x + hs - 1, y + 4, 2, s - 8);
        ctx.fillRect(x + 4, y + hs - 1, s - 8, 2);
        // 中心軸
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(x + hs - 1, y + hs - 1, 2, 2);
        break;

      default:
        // 未知陷阱 ID：繪製紅色警告框
        if (DK.DEBUG_MODE) {
          console.error(`[UI] 未知的陷阱 ID: ${trapId}`);
        }
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', x + hs, y + hs + 3);
        break;
    }

    ctx.restore(); // 恢復 Canvas 狀態
  },

  renderButton(ctx, btn) {
    // 診斷：記錄按鈕類型
    if (DK.DEBUG_MODE && btn.trap) {
      console.log(`[UI] renderButton: ${btn.trap.name} (id: ${btn.trap.id}), trap object:`, btn.trap);
    }

    const C = DK.COLORS;
    const isSelected = btn.trap && this.selectedTrap && btn.trap.id === this.selectedTrap.id;
    const game = DK.Game;
    const canAfford = btn.trap ? (game && game.gold >= btn.trap.cost) : true;

    // 計算按鈕狀態
    const btnState = this.getButtonState(btn);
    const isHovered = btnState === this.ButtonStates.HOVER;

    // 緩動過渡：使用 DK.MathCache.easing.smoothstep 實現流暢 hover 動畫
    const hoverProgress = btn.hoverProgress || 0;
    const easedProgress = DK.MathCache.easing.smoothstep(hoverProgress);

    // HOVER 狀態：上浮效果（-2px），使用緩動過渡
    const offsetY = -2 * easedProgress;

    // Alpha 過渡（懸停時高亮疊加層 alpha 提升）
    const hoverAlpha = 0.08 * easedProgress;

    // 儲存 canvas 狀態，套用位移
    ctx.save();
    ctx.translate(0, offsetY);

    // Button background with gradient
    const grad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
    if (isSelected) {
      grad.addColorStop(0, '#302850');
      grad.addColorStop(1, '#1e1838');
    } else {
      grad.addColorStop(0, '#241e36');
      grad.addColorStop(1, '#181430');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    // Pixel art border
    ctx.strokeStyle = isSelected ? C.UI_SELECTED : C.UI_BORDER;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);

    // Inner highlight (top edge)
    ctx.fillStyle = isSelected ? 'rgba(255,170,68,0.2)' : 'rgba(106,94,142,0.3)';
    ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, 1);

    if (btn.action === 'start_wave') {
      // Phase-dependent wave/breach button
      let buttonText = '';
      let buttonColor = '#88ddff';
      let isEnabled = true;
      let subText = '';

      if (game && game.state === 'planning') {
        buttonText = '開始入侵';
        buttonColor = '#ff6644';
        subText = '部署完成後點擊';
      } else if (game && game.state === 'invasion') {
        if (game.waveAutoTimer > 0) {
          buttonText = `下一波 ${Math.ceil(game.waveAutoTimer / 1000)}秒`;
          buttonColor = '#88ddff';
        } else if (game.waveActive) {
          buttonText = '戰鬥中...';
          buttonColor = C.UI_TEXT_DIM;
        } else {
          buttonText = '等待中...';
          buttonColor = C.UI_TEXT_DIM;
        }
        isEnabled = false;
        subText = `第 ${game.currentWave + 1} / ${DK.WAVES.length} 波`;
      }

      // Pulsing border when actionable
      if (isEnabled && game && !game.gameOver) {
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(68,170,255,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
      }

      ctx.font = DK.FONTS.bold(16);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.drawTextWithOutline(ctx,
        buttonText,
        btn.x + btn.width / 2,
        btn.y + btn.height / 2 - 10,
        buttonColor
      );

      // Sub text
      if (subText) {
        ctx.font = DK.FONTS.body(11);
        ctx.fillStyle = C.UI_TEXT_DIM;
        ctx.fillText(subText, btn.x + btn.width / 2, btn.y + btn.height / 2 + 10);
      }

      // Hover highlight overlay - 使用緩動 alpha
      if (hoverAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${hoverAlpha})`;
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

      // 鍵盤焦點高亮（無障礙）
      const btnIndex1 = this.buttons.indexOf(btn);
      if (this.keyboardNavigationEnabled && this.keyboardFocusIndex === btnIndex1) {
        const focusPulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,255,0,${focusPulse})`; // 黃色焦點邊框
        ctx.lineWidth = 3;
        ctx.strokeRect(btn.x - 1.5, btn.y - 1.5, btn.width + 3, btn.height + 3);
      }

      ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
      return;
    }

    // 路障按鈕渲染
    if (btn.barricade) {
      const isBarricadeSelected = DK.UI.selectedBarricadeMode;
      ctx.fillStyle = isBarricadeSelected ? '#4a3e6e' : '#1e1a2e';
      ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
      ctx.strokeStyle = isBarricadeSelected ? '#ffaa44' : '#4a3e6e';
      ctx.lineWidth = isBarricadeSelected ? 2 : 1;
      ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);

      // 石磚圖示（小型）
      const iconX = btn.x + btn.width / 2 - 8;
      const iconY = btn.y + 12;
      ctx.fillStyle = '#5a5a6e';
      ctx.fillRect(iconX, iconY, 16, 10);
      ctx.fillStyle = '#7a7a8e';
      ctx.fillRect(iconX, iconY, 16, 1);
      ctx.fillRect(iconX, iconY, 1, 10);
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(iconX, iconY + 5, 16, 1);

      // 文字（路障 + 數量）
      const count = DK.Map.barricades ? DK.Map.barricades.length : 0;
      const max = DK.CONFIG.BARRICADE_MAX || 5;
      ctx.fillStyle = '#e8e0d0';
      ctx.font = DK.FONTS.body(11);
      ctx.textAlign = 'center';
      ctx.fillText('路障', btn.x + btn.width / 2, btn.y + 40);
      ctx.fillStyle = count >= max ? '#ff4444' : '#8a8070';
      ctx.font = DK.FONTS.body(10);
      ctx.fillText(`${count}/${max}`, btn.x + btn.width / 2, btn.y + 55);
      ctx.textAlign = 'left';

      // 選取中脈衝邊框
      if (isBarricadeSelected) {
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,170,68,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
      }

      // 懸停高亮 - 使用緩動 alpha
      if (hoverAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${hoverAlpha})`;
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

      // 鍵盤焦點高亮（無障礙）
      const btnIndex2 = this.buttons.indexOf(btn);
      if (this.keyboardNavigationEnabled && this.keyboardFocusIndex === btnIndex2) {
        const focusPulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,255,0,${focusPulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(btn.x - 1.5, btn.y - 1.5, btn.width + 3, btn.height + 3);
      }

      ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
      return;
    }

    // Hero button rendering
    if (btn.hero) {
      const heroType = btn.hero;
      const isHeroSelected = this.selectedHeroType && this.selectedHeroType.id === heroType.id;
      const heroCanAfford = game && game.gold >= heroType.cost;

      // 根據元素決定配色
      const elementColors = {
        water: { badge: '#1a3388', border: '#3355cc', icon: '#4488ff', iconLight: '#88ccff', selected: '#4488ff' },
        fire:  { badge: '#882211', border: '#cc4433', icon: '#ff6622', iconLight: '#ffaa44', selected: '#ff6622' },
      };
      const ec = elementColors[heroType.element] || elementColors.water;

      // Button background
      const grad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
      if (isHeroSelected) {
        grad.addColorStop(0, '#1a2850');
        grad.addColorStop(1, '#102040');
      } else {
        grad.addColorStop(0, '#1a2236');
        grad.addColorStop(1, '#101830');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

      // Border
      ctx.strokeStyle = isHeroSelected ? ec.selected : C.UI_BORDER;
      ctx.lineWidth = isHeroSelected ? 2 : 1;
      ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);

      // Hero badge（根據元素配色）
      ctx.fillStyle = ec.badge;
      ctx.fillRect(btn.x + 3, btn.y + 3, 20, 16);
      ctx.strokeStyle = ec.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(btn.x + 3.5, btn.y + 3.5, 19, 15);
      ctx.fillStyle = '#e8e0d0';
      ctx.font = DK.FONTS.bold(12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('英', btn.x + 13, btn.y + 11);

      // Mini element icon（根據元素配色）
      ctx.fillStyle = ec.icon;
      ctx.beginPath();
      ctx.arc(btn.x + btn.width - 16, btn.y + 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ec.iconLight;
      ctx.beginPath();
      ctx.arc(btn.x + btn.width - 17, btn.y + 11, 2, 0, Math.PI * 2);
      ctx.fill();

      // Hero name + 形狀標記（色盲友善）
      ctx.fillStyle = heroCanAfford ? C.UI_TEXT : '#444488';
      ctx.font = DK.FONTS.bold(15);
      ctx.textAlign = 'center';
      const heroShape = this.getShapeForType('hero', heroType.id);
      ctx.fillText(`${heroShape} ${heroType.name}`, btn.x + btn.width / 2, btn.y + 32);

      // Cost
      ctx.font = DK.FONTS.bold(13);
      ctx.fillStyle = heroCanAfford ? C.UI_GOLD : '#664400';
      ctx.fillText(`⚙ ${heroType.cost} 金`, btn.x + btn.width / 2, btn.y + 48);

      // Stats
      ctx.font = DK.FONTS.body(11);
      ctx.fillStyle = '#8888cc';
      ctx.fillText(`傷害:${heroType.damage} 射程:${heroType.range}`, btn.x + btn.width / 2, btn.y + 62);

      // Cannot afford overlay
      if (!heroCanAfford) {
        ctx.fillStyle = 'rgba(10,8,20,0.45)';
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

      // Selected hero button pulsing border
      if (isHeroSelected) {
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(68,136,255,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
      }

      // Hover highlight overlay - 使用緩動 alpha
      if (hoverAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${hoverAlpha})`;
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

      // 鍵盤焦點高亮（無障礙）
      const btnIndex3 = this.buttons.indexOf(btn);
      if (this.keyboardNavigationEnabled && this.keyboardFocusIndex === btnIndex3) {
        const focusPulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,255,0,${focusPulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(btn.x - 1.5, btn.y - 1.5, btn.width + 3, btn.height + 3);
      }

      ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
      return;
    }

    if (!btn.trap) {
      ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
      return;
    }

    // === Trap type badge (wall vs floor) ===
    const isWall = btn.trap.type === 'wall';
    const badgeColor = isWall ? '#4a3e6e' : '#3e5a3e';
    const badgeBorder = isWall ? '#6a5e8e' : '#5e7a5e';
    const badgeText = isWall ? '牆' : '地';

    // Badge background
    ctx.fillStyle = badgeColor;
    ctx.fillRect(btn.x + 3, btn.y + 3, 20, 16);
    ctx.strokeStyle = badgeBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x + 3.5, btn.y + 3.5, 19, 15);

    // Badge text
    ctx.fillStyle = '#e8e0d0';
    ctx.font = DK.FONTS.bold(12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, btn.x + 13, btn.y + 11);

    // Mini trap icon (right side of badge area)
    if (DK.DEBUG_MODE) {
      console.log(`[UI] 渲染陷阱圖標: ${btn.trap.name} (id: ${btn.trap.id}) at (${btn.x + btn.width - 28}, ${btn.y + 2})`);
    }
    this.drawTrapIcon(ctx, btn.x + btn.width - 28, btn.y + 2, btn.trap.id, 22);

    // Trap name (large, centered) + 形狀標記（色盲友善）
    ctx.fillStyle = canAfford ? C.UI_TEXT : '#664444';
    ctx.font = DK.FONTS.bold(15);
    ctx.textAlign = 'center';
    const trapShape = this.getShapeForType('trap', btn.trap.id);
    ctx.fillText(`${trapShape} ${btn.trap.name}`, btn.x + btn.width / 2, btn.y + 32);

    // Cost with gold icon
    ctx.font = DK.FONTS.bold(13);
    ctx.fillStyle = canAfford ? C.UI_GOLD : '#664400';
    ctx.fillText(`⚙ ${btn.trap.cost} 金`, btn.x + btn.width / 2, btn.y + 48);

    // Stats row
    ctx.font = DK.FONTS.body(11);
    const statsY = btn.y + 62;
    const statsCX = btn.x + btn.width / 2;
    if (btn.trap.damage > 0 && btn.trap.element === 'electric') {
      // shock_plate: 傷害 + 雷電
      ctx.fillStyle = '#cc8888';
      ctx.fillText(`傷害:${btn.trap.damage}`, statsCX - 18, statsY);
      ctx.fillStyle = C.TRAP_ELECTRIC;
      ctx.fillText('⚡', statsCX + 20, statsY);
    } else if (btn.trap.id === 'oil_trap') {
      // oil_trap: 緩速
      ctx.fillStyle = '#8a6030';
      ctx.fillText('緩速60%', statsCX - 10, statsY);
      ctx.fillText('🛢', statsCX + 24, statsY);
    } else if (btn.trap.damage === 0 && btn.trap.pushForce) {
      // push_trap: 推力 + 方向箭頭
      ctx.fillStyle = '#aaa0b0';
      ctx.fillText(`推力:${btn.trap.pushForce}`, statsCX - 8, statsY);
      ctx.fillStyle = '#ff8844';
      ctx.fillText('\u2192', statsCX + 22, statsY);
    } else if (btn.trap.damage > 0) {
      // fallback: 只有傷害
      ctx.fillStyle = '#cc8888';
      ctx.fillText(`傷害:${btn.trap.damage}`, statsCX, statsY);
    }

    // Cannot afford overlay
    if (!canAfford) {
      ctx.fillStyle = 'rgba(10,8,20,0.45)';
      ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
    }

    // Selected button pulsing border
    if (isSelected) {
      const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255,170,68,${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
    }

    // Hover highlight overlay - 使用緩動 alpha
    if (hoverAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${hoverAlpha})`;
      ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
    }

    // 鍵盤焦點高亮（無障礙）
    const btnIndex4 = this.buttons.indexOf(btn);
    if (this.keyboardNavigationEnabled && this.keyboardFocusIndex === btnIndex4) {
      const focusPulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255,255,0,${focusPulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(btn.x - 1.5, btn.y - 1.5, btn.width + 3, btn.height + 3);
    }

    // 已放置陷阱數量徽章（僅限陷阱按鈕，數量 > 0 時顯示）
    if (btn.trap && DK.Traps && DK.Traps.placed) {
      const placedCount = DK.Traps.placed.filter(t => t.type && t.type.name === btn.trap.name).length;
      if (placedCount > 0) {
        const badgeR = 9;
        const badgeCX = btn.x + btn.width - 3 - badgeR;
        const badgeCY = btn.y + 3 + badgeR;

        // 深色圓底
        ctx.fillStyle = 'rgba(10,8,20,0.85)';
        ctx.beginPath();
        ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
        ctx.fill();

        // 邊框
        ctx.strokeStyle = 'rgba(138,128,112,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
        ctx.stroke();

        // 白色數字
        ctx.font = DK.FONTS.bold(11);
        ctx.fillStyle = '#e8e0d0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${placedCount}`, badgeCX, badgeCY);
      }
    }

    ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
  },

  /**
   * Draw text with outline for readability (無障礙：3px 黑色描邊)
   */
  drawTextWithOutline(ctx, text, x, y, fillColor, outlineColor) {
    ctx.fillStyle = outlineColor || 'rgba(0,0,0,0.9)';
    // 3px 描邊（無障礙增強）
    for (let ox = -3; ox <= 3; ox++) {
      for (let oy = -3; oy <= 3; oy++) {
        if (ox === 0 && oy === 0) continue;
        // 只繪製距離 <= 3 的點（圓形描邊）
        if (Math.sqrt(ox * ox + oy * oy) <= 3) {
          ctx.fillText(text, x + ox, y + oy);
        }
      }
    }
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  },

  renderHUD(ctx) {
    const C = DK.COLORS;
    const game = DK.Game;
    if (!game) return;

    // 浮動半透明狀態列（優化後的背景透明度）
    ctx.fillStyle = 'rgba(30,26,46,0.8)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, 40);

    // Bottom border (decorative pixel line)
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(0, 38, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    for (let i = 0; i < DK.CONFIG.DISPLAY_WIDTH; i += 6) {
      ctx.fillRect(i, 37, 3, 1);
    }

    ctx.textBaseline = 'middle';

    // HP 低於 30% 時閃爍警告
    const heartPct = Math.ceil((game.dungeonHeartHP / game.dungeonHeartMaxHP) * 100);
    const lowHP = heartPct < 30;
    let originalAlpha = 1;
    if (lowHP) {
      originalAlpha = ctx.globalAlpha;
      const flash = Math.sin(Date.now() / 200) * 0.5 + 0.5; // 0.5 ~ 1.0 脈動
      ctx.globalAlpha = 0.6 + flash * 0.4;
    }

    // 💰 金幣
    ctx.textAlign = 'left';
    ctx.font = DK.FONTS.bold(16);
    this.drawTextWithOutline(ctx, '💰', 15, 20, C.UI_TEXT);
    ctx.font = DK.FONTS.heavy(18);
    this.drawTextWithOutline(ctx, `${game.gold}`, 42, 20, C.UI_GOLD);

    // ❤️ 地城之心 HP（顯示為 當前/最大 格式）
    ctx.font = DK.FONTS.bold(16);
    this.drawTextWithOutline(ctx, '❤️', 130, 20, '#ff6666');
    ctx.font = DK.FONTS.heavy(18);
    this.drawTextWithOutline(ctx, `${game.dungeonHeartHP}/${game.dungeonHeartMaxHP}`, 157, 20, '#ff6666');

    // 恢復原始透明度
    if (lowHP) {
      ctx.globalAlpha = originalAlpha;
    }

    // 📊 波次
    ctx.font = DK.FONTS.bold(16);
    this.drawTextWithOutline(ctx, '📊', 300, 20, C.UI_WAVE);
    ctx.font = DK.FONTS.heavy(18);
    this.drawTextWithOutline(ctx, `${game.currentWave + 1}/${DK.WAVES.length}`, 327, 20, '#66bbff');

    // ⚔️ 敵人（顯示為 存活/總數 格式）
    if (game.waveActive) {
      ctx.font = DK.FONTS.bold(16);
      const aliveCount = DK.Enemies.active.filter(e => e.alive).length;
      const totalCount = DK.Enemies.active.length;
      this.drawTextWithOutline(ctx, '⚔️', 450, 20, C.UI_TEXT);
      ctx.font = DK.FONTS.heavy(18);
      this.drawTextWithOutline(ctx, `${aliveCount}/${totalCount}`, 477, 20, C.UI_TEXT);
    }

    // 遊戲標題
    ctx.textAlign = 'right';
    ctx.font = DK.FONTS.pixel(12);
    this.drawTextWithOutline(ctx, 'PROJECT DK', DK.CONFIG.DISPLAY_WIDTH - 15, 20, C.UI_TEXT_DIM);
  },

  renderHoverIndicator(ctx) {
    if (!this.hoveredTile) return;
    if (DK.Game && DK.Game.gameOver) return;

    const { col, row } = this.hoveredTile;
    const T = DK.CONFIG.DISPLAY_TILE;
    const cam = DK.Game.camera;
    const x = (col * DK.CONFIG.TILE_SIZE - cam.x) * DK.CONFIG.SCALE;
    const y = (row * DK.CONFIG.TILE_SIZE - cam.y) * DK.CONFIG.SCALE;

    // 移除 BREACH 階段的牆壁高亮（已廢除）
    // Planning 階段：無需高亮牆壁

    // Hero deployment hover
    if (this.selectedHeroType) {
      const validFloor = DK.Map.isPath(col, row) &&
                         DK.Map.layout[row] && DK.Map.layout[row][col] !== 'E' &&
                         DK.Map.layout[row][col] !== 'X';
      const notOccupied = !DK.Traps.placed.some(t => t.col === col && t.row === row) &&
                          !(DK.Heroes && DK.Heroes.active.some(h => h.col === col && h.row === row));
      const valid = validFloor && notOccupied;

      ctx.strokeStyle = valid ? 'rgba(68,136,255,0.7)' : 'rgba(255,100,100,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);
      if (valid) {
        ctx.fillStyle = 'rgba(68,136,255,0.15)';
        ctx.fillRect(x, y, T, T);
      }
      return;
    }

    // Trap placement hover
    if (!this.selectedTrap) return;

    let valid = false;
    if (this.selectedTrap.type === 'wall') {
      valid = DK.Map.isValidWallTrapSlot(col, row);
    } else {
      valid = DK.Map.isValidFloorTrapSlot(col, row);
    }

    // Check if already occupied
    if (DK.Traps.placed.some(t => t.col === col && t.row === row)) {
      valid = false;
    }

    ctx.strokeStyle = valid ? 'rgba(100,255,100,0.6)' : 'rgba(255,100,100,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);

    if (valid) {
      ctx.fillStyle = 'rgba(100,255,100,0.15)';
      ctx.fillRect(x, y, T, T);
    }
  },

  renderPlacementPreview(ctx) {
    if (!this.hoveredTile || !this.selectedTrap) return;

    const { col, row } = this.hoveredTile;
    const T = DK.CONFIG.DISPLAY_TILE;
    const cam = DK.Game.camera;
    const range = this.selectedTrap.range * T;

    // 判斷位置有效性
    let valid = false;
    if (this.selectedTrap.type === 'wall') {
      valid = DK.Map.isValidWallTrapSlot(col, row);
    } else {
      valid = DK.Map.isValidFloorTrapSlot(col, row);
    }

    // 檢查是否已佔用
    const occupied = DK.Traps.placed.some(t => t.col === col && t.row === row);
    if (occupied) valid = false;

    // 檢查是否為次佳位置（邊緣位置 - 接近外牆）
    const isEdge = col <= 1 || col >= DK.CONFIG.WORLD_COLS - 2 ||
                   row <= 1 || row >= DK.CONFIG.WORLD_ROWS - 2;

    // 顏色編碼
    let previewColor, rangeColor;
    if (!valid) {
      previewColor = 'rgba(255,100,100,0.5)'; // 紅色 - 不可放置
      rangeColor = 'rgba(255,100,100,0.3)';
    } else if (isEdge && this.selectedTrap.type === 'floor') {
      previewColor = 'rgba(255,220,100,0.5)'; // 黃色 - 次佳位置
      rangeColor = 'rgba(255,220,100,0.3)';
    } else {
      previewColor = 'rgba(100,255,100,0.5)'; // 綠色 - 可放置
      rangeColor = 'rgba(100,255,100,0.3)';
    }

    const cx = (col * DK.CONFIG.TILE_SIZE - cam.x) * DK.CONFIG.SCALE + T / 2;
    const cy = (row * DK.CONFIG.TILE_SIZE - cam.y) * DK.CONFIG.SCALE + T / 2;

    // 繪製範圍圈（虛線）
    if (range > 0) {
      ctx.strokeStyle = rangeColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = rangeColor.replace('0.3', '0.1');
      ctx.fill();
    }

    // 繪製半透明陷阱圖示
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = previewColor;
    const iconSize = T * 0.6;
    const iconX = cx - iconSize / 2;
    const iconY = cy - iconSize / 2;

    // 根據陷阱類型繪製不同圖示
    if (this.selectedTrap.element === 'electric') {
      // 電擊板 - 閃電符號
      ctx.strokeStyle = '#ffff44';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - iconSize / 3);
      ctx.lineTo(cx - iconSize / 4, cy);
      ctx.lineTo(cx + iconSize / 6, cy);
      ctx.lineTo(cx, cy + iconSize / 3);
      ctx.stroke();
    } else if (this.selectedTrap.id === 'push_trap' || this.selectedTrap.id === 'wind_trap') {
      // 推力/風壓 - 箭頭
      ctx.fillStyle = '#ffaa44';
      ctx.beginPath();
      ctx.moveTo(cx + iconSize / 2, cy);
      ctx.lineTo(cx - iconSize / 3, cy - iconSize / 3);
      ctx.lineTo(cx - iconSize / 3, cy + iconSize / 3);
      ctx.closePath();
      ctx.fill();
    } else if (this.selectedTrap.id === 'oil_trap') {
      // 油漬 - 水滴形狀
      ctx.fillStyle = '#8a6030';
      ctx.beginPath();
      ctx.arc(cx, cy + iconSize / 6, iconSize / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - iconSize / 3);
      ctx.lineTo(cx - iconSize / 4, cy + iconSize / 6);
      ctx.lineTo(cx + iconSize / 4, cy + iconSize / 6);
      ctx.closePath();
      ctx.fill();
    } else {
      // 預設 - 方形
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
    }

    ctx.restore();

    // 繪製狀態文字
    ctx.font = DK.FONTS.body(10);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const statusText = !valid ? '無效位置' : (isEdge && this.selectedTrap.type === 'floor') ? '次佳位置' : '可放置';
    const statusColor = !valid ? '#ff8888' : (isEdge && this.selectedTrap.type === 'floor') ? '#ffdd88' : '#88ff88';

    // 文字陰影
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(statusText, cx + 1, cy + T / 2 + 6);
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, cx, cy + T / 2 + 5);
  },

  renderMessages(ctx) {
    const C = DK.COLORS;
    let y = DK.CONFIG.UI_TOP - 30;

    for (const msg of this.messageQueue) {
      const alpha = Math.min(1, msg.timer / 500);
      ctx.save();
      ctx.globalAlpha = alpha;

      // Message background
      ctx.font = DK.FONTS.bold(16);
      const metrics = ctx.measureText(msg.text);
      const msgW = metrics.width + 24;
      const msgX = DK.CONFIG.DISPLAY_WIDTH / 2 - msgW / 2;

      ctx.fillStyle = 'rgba(80,20,20,0.9)';
      ctx.fillRect(msgX, y - 12, msgW, 24);
      ctx.strokeStyle = '#cc4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(msgX, y - 12, msgW, 24);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff8888';
      ctx.fillText(msg.text, DK.CONFIG.DISPLAY_WIDTH / 2, y);

      ctx.restore();
      y -= 30;
    }
  },

  renderHeroRecallButton(ctx) {
    if (!DK.Heroes || !DK.Heroes.selectedHero) {
      this._recallButtonRect = null;
      return;
    }

    const hero = DK.Heroes.selectedHero;
    const cam = DK.Game.camera;
    const screenX = (hero.x - cam.x) * DK.CONFIG.SCALE;
    const screenY = (hero.y - cam.y) * DK.CONFIG.SCALE;

    // 按鈕位置：英雄上方
    const btnW = 60;
    const btnH = 24;
    const btnX = screenX - btnW / 2;
    const btnY = screenY - 60; // 英雄上方

    // 邊界檢查：確保按鈕不超出畫面
    const clampedX = Math.max(4, Math.min(DK.CONFIG.DISPLAY_WIDTH - btnW - 4, btnX));
    const clampedY = Math.max(44, btnY); // 不蓋住 HUD bar

    // 儲存點擊區域
    this._recallButtonRect = { x: clampedX, y: clampedY, w: btnW, h: btnH };

    // 背景
    ctx.fillStyle = 'rgba(18,16,30,0.9)';
    ctx.beginPath();
    ctx.roundRect(clampedX, clampedY, btnW, btnH, 4);
    ctx.fill();

    // 邊框
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(clampedX, clampedY, btnW, btnH, 4);
    ctx.stroke();

    // 文字
    ctx.font = DK.FONTS.bold(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.drawTextWithOutline(ctx, '回收', clampedX + btnW / 2, clampedY + btnH / 2, '#ffaa44');

    // 金幣退還提示
    ctx.font = DK.FONTS.body(10);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`+${hero.type.cost}金`, clampedX + btnW / 2, clampedY + btnH + 10);
  },

  /**
   * 共用提示框渲染輔助函式
   * 在遊戲區域底部中央繪製帶背景的提示文字
   */
  drawHintBox(ctx, text, textColor) {
    ctx.font = DK.FONTS.body(12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(text);
    const tw = metrics.width + 16;
    const hx = DK.CONFIG.DISPLAY_WIDTH / 2 - tw / 2;
    const hy = DK.CONFIG.UI_TOP - 22;

    // 背景圓角矩形
    ctx.fillStyle = 'rgba(18,16,30,0.8)';
    ctx.beginPath();
    ctx.roundRect(hx, hy, tw, 18, 3);
    ctx.fill();

    // 邊框
    ctx.strokeStyle = 'rgba(74,62,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hx, hy, tw, 18, 3);
    ctx.stroke();

    // 文字
    ctx.fillStyle = textColor;
    ctx.fillText(text, DK.CONFIG.DISPLAY_WIDTH / 2, DK.CONFIG.UI_TOP - 13);
  },

  renderTooltip(ctx) {
    const C = DK.COLORS;

    // Show hint for placed trap inspection
    if (this.selectedPlacedTrap && !DK.Game.gameOver) {
      this.drawHintBox(ctx, '點擊其他陷阱查看  |  右鍵取消選擇', '#ccaa44');
      return;
    }

    // Show hint for hero deployment
    if (this.selectedHeroType && !DK.Game.gameOver) {
      this.drawHintBox(ctx, '點擊地板放置英雄  |  右鍵取消選擇', '#6688cc');
      return;
    }

    // Show hint for selected hero
    if (DK.Heroes && DK.Heroes.selectedHero && !DK.Game.gameOver) {
      this.drawHintBox(ctx, '點擊回收按鈕收回英雄  |  右鍵取消選擇', '#ffaa44');
      return;
    }

    // Show placement hint when a trap is selected
    if (this.selectedTrap && !DK.Game.gameOver) {
      const hintText = this.selectedTrap.type === 'wall'
        ? '點擊紫色牆壁放置  |  右鍵取消選擇'
        : '點擊地板路徑放置  |  右鍵取消選擇';
      this.drawHintBox(ctx, hintText, C.UI_TEXT_DIM);
    }

    // 增強型陷阱 tooltip（懸停在按鈕上）
    if (this.hoveredButton && this.hoveredButton.trap) {
      this.renderTrapTooltip(ctx, this.hoveredButton.trap);
      return;
    }

    // 升級對比 tooltip（懸停在已放置的陷阱上）
    if (this.hoveredTile && !this.selectedTrap && DK.Game) {
      const { col, row } = this.hoveredTile;
      const hoveredTrap = DK.Traps.placed.find(t => t.col === col && t.row === row);
      if (hoveredTrap && DK.Game.state === 'planning') {
        this.renderUpgradePreview(ctx, hoveredTrap);
        return;
      }
    }

    // Render tooltipText near mouse cursor (fallback)
    if (this.tooltipText) {
      ctx.font = DK.FONTS.body(12);
      const tipMetrics = ctx.measureText(this.tooltipText);
      const padX = 6;
      const padY = 4;
      const tipW = tipMetrics.width + padX * 2;
      const tipH = 12 + padY * 2;
      let tipX = this.mouseX + 15;
      const tipY = this.mouseY - 10;

      // If overflows right edge, show on left side of cursor
      if (tipX + tipW > DK.CONFIG.DISPLAY_WIDTH) {
        tipX = this.mouseX - tipW - 5;
      }

      ctx.fillStyle = 'rgba(18,16,30,0.92)';
      ctx.fillRect(tipX, tipY, tipW, tipH);
      ctx.strokeStyle = '#4a3e6e';
      ctx.lineWidth = 1;
      ctx.strokeRect(tipX + 0.5, tipY + 0.5, tipW - 1, tipH - 1);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e8e0d0';
      ctx.fillText(this.tooltipText, tipX + padX, tipY + tipH / 2);
    }
  },

  /**
   * 渲染增強型陷阱 tooltip（卡片式）
   * 顯示陷阱名稱、類型、效果範圍、數值
   */
  renderTrapTooltip(ctx, trap) {
    const padX = 12;
    const padY = 10;
    const lineHeight = 16;
    const titleHeight = 20;

    let tipX = this.mouseX + 15;
    let tipY = this.mouseY + 15;

    // 構建 tooltip 內容
    const lines = [];
    lines.push({ text: trap.name, font: DK.FONTS.bold(14), color: '#ffd966' });
    lines.push({ text: `類型：${trap.type === 'floor' ? '地板陷阱' : '牆壁陷阱'}`, font: DK.FONTS.body(11), color: '#c0b090' });
    lines.push({ text: `花費：${trap.cost} 金幣`, font: DK.FONTS.body(11), color: '#ffcc44' });

    if (trap.damage > 0) {
      lines.push({ text: `傷害：${trap.damage}`, font: DK.FONTS.body(11), color: '#ff8866' });
    }

    if (trap.range > 0) {
      lines.push({ text: `範圍：${trap.range} 格`, font: DK.FONTS.body(11), color: '#88ccff' });
    }

    if (trap.element) {
      const elementName = { electric: '電擊', fire: '火焰', ice: '寒冰', water: '水' }[trap.element] || trap.element;
      lines.push({ text: `元素：${elementName}`, font: DK.FONTS.body(11), color: '#aa88ff' });
    }

    if (trap.pushForce) {
      lines.push({ text: `推力：${trap.pushForce}`, font: DK.FONTS.body(11), color: '#ffaa66' });
    }

    lines.push({ text: trap.description, font: DK.FONTS.body(10), color: '#a0a090', italic: true });

    // 計算 tooltip 尺寸
    const maxWidth = Math.max(...lines.map(line => {
      ctx.font = line.font;
      return ctx.measureText(line.text).width;
    }));
    const tipW = maxWidth + padX * 2;
    const tipH = titleHeight + (lines.length - 1) * lineHeight + padY * 2;

    // 邊界檢測
    if (tipX + tipW > DK.CONFIG.DISPLAY_WIDTH) {
      tipX = this.mouseX - tipW - 5;
    }
    if (tipY + tipH > DK.CONFIG.DISPLAY_HEIGHT) {
      tipY = this.mouseY - tipH - 5;
    }

    // 繪製卡片背景
    ctx.fillStyle = 'rgba(18,16,30,0.95)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = '#6a5a8a';
    ctx.lineWidth = 2;
    ctx.strokeRect(tipX + 1, tipY + 1, tipW - 2, tipH - 2);

    // 繪製標題底色
    ctx.fillStyle = 'rgba(80,60,100,0.4)';
    ctx.fillRect(tipX + 2, tipY + 2, tipW - 4, titleHeight);

    // 繪製文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let currentY = tipY + padY;
    lines.forEach((line, i) => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, tipX + padX, currentY);
      currentY += i === 0 ? titleHeight : lineHeight;
    });
  },

  /**
   * 渲染升級對比預覽
   * 顯示當前等級與升級後數值變化
   */
  renderUpgradePreview(ctx, trap) {
    if (trap.evolved) return; // 已升級，不顯示

    // 查找對應的升級類型
    const baseTrapId = trap.type.id;
    const evolutionType = Object.keys(DK.EVOLUTION_TYPES).find(key =>
      DK.EVOLUTION_TYPES[key].baseTrap === baseTrapId
    );

    if (!evolutionType) return;

    const evo = DK.EVOLUTION_TYPES[evolutionType];
    const canAfford = DK.Game.gold >= evo.cost;

    const padX = 12;
    const padY = 10;
    const lineHeight = 16;

    let tipX = this.mouseX + 15;
    let tipY = this.mouseY + 15;

    // 構建內容
    const lines = [];
    lines.push({ text: `${trap.type.name} → ${evo.name}`, font: DK.FONTS.bold(13), color: '#ffd966' });
    lines.push({ text: `升級成本：${evo.cost} 金幣`, font: DK.FONTS.body(11), color: canAfford ? '#88ff88' : '#ff8888' });
    lines.push({ text: evo.description, font: DK.FONTS.body(10), color: '#c0b090' });
    lines.push({ text: `需要：${evo.requiredHeroElement === 'water' ? '水' : evo.requiredHeroElement === 'fire' ? '火' : '冰'} 元素英雄光環`, font: DK.FONTS.body(10), color: '#aa88ff' });

    if (canAfford) {
      lines.push({ text: '（點擊陷阱查看詳情）', font: DK.FONTS.body(9), color: '#88cc88' });
    } else {
      lines.push({ text: '（金幣不足）', font: DK.FONTS.body(9), color: '#ff6666' });
    }

    // 計算尺寸
    const maxWidth = Math.max(...lines.map(line => {
      ctx.font = line.font;
      return ctx.measureText(line.text).width;
    }));
    const tipW = maxWidth + padX * 2;
    const tipH = lines.length * lineHeight + padY * 2;

    // 邊界檢測
    if (tipX + tipW > DK.CONFIG.DISPLAY_WIDTH) {
      tipX = this.mouseX - tipW - 5;
    }
    if (tipY + tipH > DK.CONFIG.DISPLAY_HEIGHT) {
      tipY = this.mouseY - tipH - 5;
    }

    // 繪製背景
    ctx.fillStyle = 'rgba(18,16,30,0.95)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = canAfford ? '#88cc88' : '#cc8888';
    ctx.lineWidth = 2;
    ctx.strokeRect(tipX + 1, tipY + 1, tipW - 2, tipH - 2);

    // 繪製文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let currentY = tipY + padY;
    lines.forEach(line => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, tipX + padX, currentY);
      currentY += lineHeight;
    });
  },

  /** 波次預告提示：在波次未開始時顯示下一波敵人組成 */
  renderWavePreview(ctx) {
    const game = DK.Game;
    if (!game || game.gameOver) return;
    if (game.state !== 'invasion') return;
    if (game.waveActive) return;
    if (game.currentWave >= DK.WAVES.length) return;

    const wave = DK.WAVES[game.currentWave];
    if (!wave || !wave.enemies) return;

    // 組合預告文字
    const parts = wave.enemies.map(e => {
      const typeDef = DK.ENEMY_TYPES[e.type];
      const name = typeDef ? typeDef.name : e.type;
      return `${name} x${e.count}`;
    });
    const previewText = `下一波：${parts.join('、')}`;

    // 淡入淡出脈動 - 使用快取的三角函式
    const timestamp = game.time || 0;
    const MC = DK.MathCache;
    const pulse = 0.6 + 0.2 * MC.sinTime(timestamp, 0.002);

    ctx.save();
    ctx.globalAlpha = pulse;

    // 面板尺寸與位置
    ctx.font = DK.FONTS.body(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(previewText);
    const panelW = metrics.width + 28;
    const panelH = 24;
    const panelX = DK.CONFIG.DISPLAY_WIDTH / 2 - panelW / 2;
    const panelY = 46;

    // 半透明背景
    ctx.fillStyle = 'rgba(18,16,30,0.85)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 4);
    ctx.fill();

    // 邊框
    ctx.strokeStyle = 'rgba(74,62,110,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 4);
    ctx.stroke();

    // 文字
    ctx.fillStyle = '#aaa090';
    ctx.fillText(previewText, DK.CONFIG.DISPLAY_WIDTH / 2, panelY + panelH / 2);

    ctx.restore();
  },

  renderWaveAnnouncement(ctx) {
    const C = DK.COLORS;
    const game = DK.Game;
    if (!game) return;

    const progress = 1 - this.waveStartTimer / 2000;
    const alpha = progress < 0.2 ? progress * 5 :
                  progress > 0.75 ? (1 - progress) * 4 : 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Dark overlay band
    ctx.fillStyle = 'rgba(18,16,30,0.85)';
    ctx.fillRect(0, 240, DK.CONFIG.DISPLAY_WIDTH, 100);

    // Top and bottom borders
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(0, 240, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillRect(0, 338, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    for (let i = 0; i < DK.CONFIG.DISPLAY_WIDTH; i += 6) {
      ctx.fillRect(i, 241, 3, 1);
      ctx.fillRect(i, 337, 3, 1);
    }

    // Wave number (large)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = DK.FONTS.heavy(34);
    this.drawTextWithOutline(ctx,
      `第 ${game.currentWave + 1} 波`,
      DK.CONFIG.DISPLAY_WIDTH / 2, 275,
      '#e8e0d0', 'rgba(0,0,0,0.8)');

    // Subtitle
    ctx.font = DK.FONTS.bold(16);
    ctx.fillStyle = '#ff8866';
    ctx.fillText('敵人來襲！準備防禦！', DK.CONFIG.DISPLAY_WIDTH / 2, 310);

    // Enemy preview (which types in this wave)
    if (DK.WAVES[game.currentWave]) {
      const wave = DK.WAVES[game.currentWave];
      const enemyNames = wave.enemies.map(e => {
        const type = DK.ENEMY_TYPES[e.type];
        return type ? `${type.name} x${e.count}` : '';
      }).join('  |  ');
      ctx.font = DK.FONTS.body(12);
      ctx.fillStyle = C.UI_TEXT_DIM;
      ctx.fillText(enemyNames, DK.CONFIG.DISPLAY_WIDTH / 2, 328);
    }

    ctx.restore();
  },

  /**
   * 波次完成慶祝特效 — 金色文字 + 放大縮小動畫 + 淡出
   */
  renderWaveComplete(ctx) {
    const game = DK.Game;
    if (!game) return;

    const totalDuration = 2000;
    const elapsed = totalDuration - this.waveCompleteTimer;
    const progress = elapsed / totalDuration;

    // 計算 alpha：最後 500ms 淡出
    const fadeStart = 1500; // 開始淡出的時間點
    let alpha = 1;
    if (elapsed > fadeStart) {
      alpha = 1 - (elapsed - fadeStart) / 500;
    }
    alpha = Math.max(0, Math.min(1, alpha));

    // 放大→縮小動畫：前 200ms 放大到 1.2，之後回到 1.0
    let scale = 1;
    if (elapsed < 200) {
      scale = 1 + 0.2 * (elapsed / 200);
    } else if (elapsed < 400) {
      scale = 1.2 - 0.2 * ((elapsed - 200) / 200);
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = DK.CONFIG.DISPLAY_WIDTH / 2;
    const cy = 180;

    // 半透明背景條
    ctx.fillStyle = 'rgba(18,16,30,0.75)';
    ctx.fillRect(0, cy - 40, DK.CONFIG.DISPLAY_WIDTH, 80);

    // 上下裝飾邊線
    const C = DK.COLORS;
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(0, cy - 40, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillRect(0, cy + 38, DK.CONFIG.DISPLAY_WIDTH, 2);

    // 主標題文字：「波次完成！」
    const fontSize = Math.round(30 * scale);
    ctx.font = DK.FONTS.heavy(fontSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.drawTextWithOutline(ctx, '波次完成！', cx, cy - 8, '#ffd700', 'rgba(0,0,0,0.8)');

    // 金幣獎勵文字
    if (this.waveCompleteBonus > 0) {
      ctx.font = DK.FONTS.bold(16);
      ctx.fillStyle = '#ffe880';
      ctx.fillText(`獎勵金幣 +${this.waveCompleteBonus}`, cx, cy + 22);
    }

    ctx.restore();
  },

  renderGameOver(ctx) {
    const game = DK.Game;
    if (!game) return;

    // Full-screen overlay
    ctx.fillStyle = 'rgba(10,10,18,0.9)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);

    const isVictory = game.dungeonHeartHP > 0;
    const cx = DK.CONFIG.DISPLAY_WIDTH / 2;
    const cy = DK.CONFIG.DISPLAY_HEIGHT / 2 - 30;
    const C = DK.COLORS;

    // Panel dimensions (taller to fit more stats)
    const panelW = 440;
    const panelH = 280;
    const panelX = cx - panelW / 2;
    const panelY = cy - 100;

    // Result panel background
    ctx.fillStyle = 'rgba(30,26,46,0.95)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    this.drawPixelBorder(ctx, panelX, panelY, panelW, panelH);

    // Title with thematic text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = DK.FONTS.heavy(36);
    const titleText = isVictory ? '防守成功！' : '地心毀滅...';
    const titleColor = isVictory ? '#44ff44' : '#ff4444';
    this.drawTextWithOutline(ctx, titleText, cx, panelY + 42, titleColor, 'rgba(0,0,0,0.8)');

    // Subtitle
    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = isVictory ? '#88cc88' : '#cc8888';
    const subtitle = isVictory
      ? '所有入侵者已被擊退！地心安全了！'
      : '地心被入侵者摧毀了...防守失敗。';
    ctx.fillText(subtitle, cx, panelY + 70);

    // Divider line
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(panelX + 20, panelY + 85, panelW - 40, 2);
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    for (let i = panelX + 20; i < panelX + panelW - 20; i += 6) {
      ctx.fillRect(i, panelY + 86, 3, 1);
    }

    // Stats area with pixel border
    const statsX = panelX + 20;
    const statsY = panelY + 95;
    const statsW = panelW - 40;
    const statsH = 110;
    ctx.fillStyle = 'rgba(18,16,30,0.6)';
    ctx.fillRect(statsX, statsY, statsW, statsH);
    ctx.strokeStyle = C.UI_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(statsX + 0.5, statsY + 0.5, statsW - 1, statsH - 1);

    // Stats grid (2 columns, 2 rows)
    const leftCol = cx - 90;
    const rightCol = cx + 90;
    let rowY = statsY + 22;

    // Row 1: Wave progress + Kills
    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = C.UI_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.fillText('存活波數', leftCol, rowY);
    ctx.fillText('擊殺數', rightCol, rowY);

    ctx.font = DK.FONTS.heavy(20);
    this.drawTextWithOutline(ctx, `${game.currentWave} / ${DK.WAVES.length}`, leftCol, rowY + 20, C.UI_WAVE);
    this.drawTextWithOutline(ctx, `${game.enemiesKilled}`, rightCol, rowY + 20, '#ff8866');

    rowY += 56;

    // Row 2: Gold + Lives
    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = C.UI_TEXT_DIM;
    ctx.fillText('剩餘金幣', leftCol, rowY);
    ctx.fillText('地心 HP', rightCol, rowY);

    ctx.font = DK.FONTS.heavy(20);
    this.drawTextWithOutline(ctx, `${game.gold}`, leftCol, rowY + 20, C.UI_GOLD);
    const endPct = Math.ceil((game.dungeonHeartHP / game.dungeonHeartMaxHP) * 100);
    this.drawTextWithOutline(ctx, `${endPct}%`, rightCol, rowY + 20, game.dungeonHeartHP > 0 ? '#ff6666' : '#882222');

    // Bottom divider
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(panelX + 20, panelY + statsH + 100, panelW - 40, 1);

    // Restart hint (pulsing)
    const pulse = Math.sin(Date.now() / 600) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.font = DK.FONTS.bold(14);
    ctx.fillStyle = '#8a8070';
    ctx.fillText('點擊任意位置重新開始', cx, panelY + panelH - 25);
    ctx.globalAlpha = 1;
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
  },

  renderSelectedTrapInfo(ctx) {
    // Clear evolve button rect if no trap selected
    if (!this.selectedPlacedTrap) {
      this._evolveButtonRect = null;
      return;
    }

    const trap = this.selectedPlacedTrap;
    const T = DK.CONFIG.DISPLAY_TILE;
    const cam = DK.Game.camera;
    const trapScreenX = (trap.col * DK.CONFIG.TILE_SIZE - cam.x) * DK.CONFIG.SCALE;
    const trapScreenY = (trap.row * DK.CONFIG.TILE_SIZE - cam.y) * DK.CONFIG.SCALE;
    const trapCX = trapScreenX + T / 2;

    // Draw highlight around selected trap
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 2;
    ctx.strokeRect(trapScreenX + 1, trapScreenY + 1, T - 2, T - 2);
    // Inner glow
    const glowAlpha = Math.sin(Date.now() / 400) * 0.15 + 0.2;
    ctx.fillStyle = `rgba(255,204,68,${glowAlpha})`;
    ctx.fillRect(trapScreenX, trapScreenY, T, T);

    // Determine trap info
    const trapDef = trap.type || {};
    const isEvolved = !!trap.evolved;
    const evoInfo = (!isEvolved && DK.Traps) ? DK.Traps.getEvolutionForTrap(trap) : null;
    const auraHero = (!isEvolved && DK.Traps) ? DK.Traps.getAuraHeroForTrap(trap) : null;
    const canEvolve = !!evoInfo && !!auraHero;
    const hasEvolutionPath = !!evoInfo; // Has evolution but may lack aura

    // Panel dimensions
    const panelW = 220;
    const lineH = 18;
    let contentLines = 3; // name + stats + element
    if (isEvolved) contentLines += 2; // evolved name + description
    if (canEvolve) contentLines += 2; // evolve button + description preview
    if (!isEvolved && hasEvolutionPath && !canEvolve) contentLines += 1; // aura hint
    const panelH = 16 + contentLines * lineH + (canEvolve ? 30 : 8);

    // Position: above the trap, or below if not enough room
    let panelX = trapCX - panelW / 2;
    let panelY = trapScreenY - panelH - 8;
    if (panelY < 42) {
      panelY = trapScreenY + T + 8;
    }
    // Clamp horizontal
    if (panelX < 4) panelX = 4;
    if (panelX + panelW > DK.CONFIG.DISPLAY_WIDTH - 4) {
      panelX = DK.CONFIG.DISPLAY_WIDTH - panelW - 4;
    }

    // Panel background
    ctx.fillStyle = 'rgba(18,16,30,0.95)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    this.drawPixelBorder(ctx, panelX, panelY, panelW, panelH);

    // Content rendering
    let curY = panelY + 14;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = panelX + panelW / 2;

    // Trap name (gold if evolved, white otherwise)
    ctx.font = DK.FONTS.bold(16);
    const nameColor = isEvolved ? '#ffcc44' : '#e8e0d0';
    this.drawTextWithOutline(ctx, trapDef.name || trapDef.id || '陷阱', centerX, curY, nameColor);
    curY += lineH;

    // Evolved name + description
    if (isEvolved && trap.evolutionType) {
      const evoType = DK.EVOLUTION_TYPES ? DK.EVOLUTION_TYPES[trap.evolutionType] : null;
      const evoName = evoType ? evoType.name : trap.evolutionType;
      ctx.font = DK.FONTS.bold(14);
      this.drawTextWithOutline(ctx, `★ ${evoName}`, centerX, curY, '#ffcc44');
      curY += lineH;

      // Evolution description
      if (evoType && evoType.description) {
        ctx.font = DK.FONTS.body(11);
        this.drawTextWithOutline(ctx, evoType.description, centerX, curY, '#ccaa66');
        curY += lineH;
      }
    }

    // Stats: damage / cooldown (adapt for push traps)
    ctx.font = DK.FONTS.body(13);
    const damage = trapDef.damage || 0;
    const cooldown = trapDef.cooldown || 0;
    let statsText;
    if (damage === 0 && trapDef.pushForce) {
      statsText = `推力: ${trapDef.pushForce}  冷卻: ${(cooldown / 1000).toFixed(1)}s`;
    } else {
      statsText = `傷害: ${damage}  冷卻: ${(cooldown / 1000).toFixed(1)}s`;
    }
    this.drawTextWithOutline(ctx, statsText, centerX, curY, '#ccbbaa');
    curY += lineH;

    // Element info
    const element = trapDef.element || '';
    const elementNames = {
      electric: '雷電',
      fire: '火焰',
      wind: '風',
      physical: '物理',
    };
    const elementColors = {
      electric: '#ffdd44',
      fire: '#ff6622',
      wind: '#88aacc',
      physical: '#ccbbaa',
    };
    if (element) {
      ctx.font = DK.FONTS.body(12);
      const eName = elementNames[element] || element;
      const eColor = elementColors[element] || '#ccbbaa';
      this.drawTextWithOutline(ctx, `元素: ${eName}`, centerX, curY, eColor);
      curY += lineH;
    }

    // Evolve section
    if (canEvolve && evoInfo) {
      // Evolution effect preview
      if (evoInfo.description) {
        ctx.font = DK.FONTS.body(11);
        this.drawTextWithOutline(ctx, evoInfo.description, centerX, curY, '#aabb88');
        curY += lineH;
      }

      // Evolve button
      const btnW = panelW - 20;
      const btnH = 24;
      const btnX = panelX + 10;
      const btnY = curY + 2;
      const canAfford = DK.Game && DK.Game.gold >= evoInfo.cost;

      // Store for click detection
      this._evolveButtonRect = { x: btnX, y: btnY, w: btnW, h: btnH };

      // Button background
      const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
      if (canAfford) {
        grad.addColorStop(0, '#4a3e10');
        grad.addColorStop(1, '#3a2e08');
      } else {
        grad.addColorStop(0, '#3a3030');
        grad.addColorStop(1, '#2a2020');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(btnX, btnY, btnW, btnH);

      // Button border (pulsing if affordable)
      if (canAfford) {
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,204,68,${pulse})`;
      } else {
        ctx.strokeStyle = '#665533';
      }
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);

      // Button text
      const evoName = evoInfo.name || evoInfo.id;
      const evoCost = evoInfo.cost;
      ctx.font = DK.FONTS.bold(13);
      ctx.textAlign = 'center';
      const btnText = `進化 → ${evoName} (${evoCost}金)`;
      this.drawTextWithOutline(ctx, btnText, btnX + btnW / 2, btnY + btnH / 2,
        canAfford ? '#ffdd66' : '#887744');
    } else if (!isEvolved && hasEvolutionPath && !canEvolve) {
      // Has evolution path but not in aura range
      ctx.font = DK.FONTS.body(11);
      this.drawTextWithOutline(ctx, '需要對應英雄光環才能進化', centerX, curY, '#666060');
      curY += lineH;
      this._evolveButtonRect = null;
    } else {
      this._evolveButtonRect = null;
    }
  },

  /**
   * 渲染開始畫面 (MVP 簡化版本)
   * gameCtx: 主 canvas context (960×720)
   * uiCtx: UI overlay canvas context (960×720)
   * time: 經過時間 (ms)
   */
  renderStartScreen(gameCtx, uiCtx, time) {
    const W = DK.CONFIG.DISPLAY_WIDTH;
    const H = DK.CONFIG.DISPLAY_HEIGHT;
    const cx = W / 2;

    // === 低解析度 Canvas（遊戲 Canvas）===

    // 1. 深色背景
    gameCtx.fillStyle = '#06060c';
    gameCtx.fillRect(0, 0, W, H);

    // 2. 傳送門動畫背景（3 個）
    if (DK.Map && DK.Map.drawPortalFull) {
      const portalY = 104;
      const portalColors = { glow: '#44ff88', bright: '#88ffaa', dark: '#226644' };
      for (let i = 0; i < 3; i++) {
        const portalX = (i + 1) * 80;
        DK.Map.drawPortalFull(gameCtx, portalX, portalY, portalColors, time / 1000);
      }
    }

    // === 高解析度 Canvas（UI Canvas）===

    // 4. 半透明遮罩層
    uiCtx.fillStyle = 'rgba(18,16,30,0.85)';
    uiCtx.fillRect(0, 0, W, H);

    uiCtx.save();

    // 5. 遊戲標題（大字體 + 陰影）
    uiCtx.shadowColor = '#aa44ff';
    uiCtx.shadowBlur = 20;
    uiCtx.font = DK.FONTS.heavy(48);
    uiCtx.fillStyle = '#f0e8d8';
    uiCtx.textAlign = 'center';
    uiCtx.textBaseline = 'middle';
    uiCtx.fillText('地層守衛', cx, 200);

    uiCtx.restore();

    // 6. 副標題
    uiCtx.font = DK.FONTS.body(18);
    uiCtx.fillStyle = '#c0b8a8';
    uiCtx.textAlign = 'center';
    uiCtx.textBaseline = 'middle';
    uiCtx.fillText('Dungeon Keep - 塔防原型', cx, 240);

    // 7. 遊戲目標（3 行簡介）
    const intro = [
      '🎯 守護地城之心',
      '⚔️ 部署陷阱與英雄',
      '🌀 抵禦入侵者的波次進攻'
    ];
    uiCtx.font = DK.FONTS.body(16);
    uiCtx.fillStyle = '#e8e0d0';
    for (let i = 0; i < intro.length; i++) {
      uiCtx.fillText(intro[i], cx, 300 + i * 35);
    }

    // 7.5. 視覺模式選擇（已移除 - 固定使用 DW3 優化風格）
    // 註：已改為固定使用 'standard' 模式（符合 Dungeon Warfare 3 設計理念）
    // 不再提供模式切換 UI
    /*
    const currentPreset = DK.VISUAL_SETTINGS.currentPreset;
    const presetY = 410;

    // 標題
    uiCtx.font = DK.FONTS.body(14);
    uiCtx.fillStyle = '#8a8070';
    uiCtx.fillText('視覺模式:', cx, presetY - 20);

    // 三個模式按鈕
    const presets = [
      { name: 'simple', label: '簡單', desc: '最大效能' },
      { name: 'standard', label: '標準', desc: '平衡' },
      { name: 'fancy', label: '華麗', desc: '最佳視覺' }
    ];

    const presetBtnW = 80, presetBtnH = 40;
    const presetSpacing = 20;
    const totalWidth = presets.length * presetBtnW + (presets.length - 1) * presetSpacing;
    const startX = cx - totalWidth / 2;

    for (let i = 0; i < presets.length; i++) {
      const preset = presets[i];
      const btnX = startX + i * (presetBtnW + presetSpacing);
      const btnY = presetY;
      const isSelected = currentPreset === preset.name;

      // 按鈕背景
      uiCtx.fillStyle = isSelected ? '#3a344a' : '#2a2438';
      uiCtx.fillRect(btnX, btnY, presetBtnW, presetBtnH);

      // 按鈕邊框
      uiCtx.strokeStyle = isSelected ? '#aa44ff' : '#4a3e6e';
      uiCtx.lineWidth = isSelected ? 2 : 1;
      uiCtx.strokeRect(btnX, btnY, presetBtnW, presetBtnH);

      // 按鈕文字（標籤）
      uiCtx.font = DK.FONTS.bold(14);
      uiCtx.fillStyle = isSelected ? '#f0e8d8' : '#c0b8a8';
      uiCtx.fillText(preset.label, btnX + presetBtnW / 2, btnY + 14);

      // 按鈕文字（描述）
      uiCtx.font = DK.FONTS.body(10);
      uiCtx.fillStyle = '#8a8070';
      uiCtx.fillText(preset.desc, btnX + presetBtnW / 2, btnY + 30);

      // 儲存按鈕位置（用於點擊檢測）
      if (!this._presetButtons) this._presetButtons = [];
      this._presetButtons[i] = {
        x: btnX,
        y: btnY,
        w: presetBtnW,
        h: presetBtnH,
        preset: preset.name
      };
    }
    */

    // 8. 開始按鈕（脈動動畫）- 使用快取的三角函式
    const MC = DK.MathCache;
    const pulse = MC.sinTime(time, 0.001) * 0.1 + 0.9; // time/1000 * PI = time * PI/1000 ≈ 0.00314
    const btnW = 200, btnH = 50;
    const btnX = cx - btnW / 2, btnY = 480;

    uiCtx.fillStyle = '#2a2438';
    uiCtx.fillRect(btnX, btnY, btnW, btnH);

    uiCtx.strokeStyle = `rgba(170,68,255,${pulse})`;
    uiCtx.lineWidth = 2;
    uiCtx.strokeRect(btnX, btnY, btnW, btnH);

    uiCtx.font = DK.FONTS.bold(20);
    uiCtx.fillStyle = '#f0e8d8';
    uiCtx.fillText('開始遊戲', cx, btnY + btnH / 2);

    // 9. 提示文字（閃爍）- 使用快取的三角函式
    const blinkAlpha = MC.sinTime(time, 0.00167) * 0.3 + 0.7; // time/600 * PI ≈ 0.00524
    uiCtx.globalAlpha = blinkAlpha;
    uiCtx.font = DK.FONTS.body(14);
    uiCtx.fillStyle = '#8a8070';
    uiCtx.fillText('點擊任意處開始', cx, 580);
    uiCtx.globalAlpha = 1;
  },



  // (舊版精緻開始畫面程式碼已移除，保留 MVP 簡化版本)
};

