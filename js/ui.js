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

  init() {
    this.selectedTrap = null;
    this.selectedHeroType = null;
    this.selectedPlacedTrap = null;
    this._evolveButtonRect = null;
    this._recallButtonRect = null;
    this.selectedBarricadeMode = false;
    this.hoveredTile = null;
    this.buildButtons();
    this.checkFonts();
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
          this.showMessage('金幣不足！');
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
              DK.Game.startBreach();
            } else if (DK.Game.state === 'breach' && DK.Map.breachHoles && DK.Map.breachHoles.length > 0) {
              DK.Game.startInvasion();
            }
          }
          return true;
        }
        if (btn.trap) {
          this.selectedTrap = btn.trap;
          this.selectedHeroType = null;
          this.selectedPlacedTrap = null;
          this._evolveButtonRect = null;
          this.selectedBarricadeMode = false;
          if (DK.Heroes) DK.Heroes.selectedHero = null;
          return true;
        }
        if (btn.hero) {
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

      // Priority 0: Breach phase wall-breaking
      if (DK.Game.state === 'breach') {
        if (DK.Map.isBreakable && DK.Map.isBreakable(col, row)) {
          DK.Map.breakWall(col, row);
          if (DK.Game.effects) {
            DK.Game.effects.push({
              type: 'wall_break',
              x: col * DK.CONFIG.TILE_SIZE + DK.CONFIG.TILE_SIZE / 2,
              y: row * DK.CONFIG.TILE_SIZE + DK.CONFIG.TILE_SIZE / 2,
              timer: 0, duration: 500,
            });
          }
          return true;
        }

        // 路障放置（breach 階段）
        if (this.selectedBarricadeMode) {
          // 點擊已有路障 → 移除
          if (DK.Map.hasBarricade && DK.Map.hasBarricade(col, row)) {
            DK.Map.removeBarricade(col, row);
            return true;
          }
          // 點擊空地 → 放置
          if (DK.Map.placeBarricade && DK.Map.placeBarricade(col, row)) {
            return true;
          }
          return true;
        }
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
              DK.Game.gold -= this.selectedHeroType.cost;
              return true;
            }
          } else {
            this.showMessage('金幣不足！');
          }
        }
        return true;
      }
    }

    // Check game area click (place trap) - apply camera offset
    // Only allow trap placement in planning or invasion phases
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
            DK.Game.gold -= this.selectedTrap.cost;
            return true;
          }
        } else {
          this.showMessage('金幣不足！');
        }
      } else if (this.selectedTrap.type === 'floor' && DK.Map.isValidFloorTrapSlot(col, row)) {
        if (DK.Game.gold >= this.selectedTrap.cost) {
          if (DK.Traps.place(this.selectedTrap.id, col, row)) {
            DK.Game.gold -= this.selectedTrap.cost;
            return true;
          }
        } else {
          this.showMessage('金幣不足！');
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
  },

  renderPhaseHint(ctx) {
    const game = DK.Game;
    if (!game || game.gameOver) return;

    let hintText = '';
    let hintColor = '#aaa090';

    if (game.state === 'planning') {
      hintText = '部署陷阱和英雄 → 點擊右側按鈕開始破牆';
      hintColor = '#88ddff';
    } else if (game.state === 'breach') {
      const holeCount = DK.Map.breachHoles ? DK.Map.breachHoles.length : 0;
      hintText = `點擊外牆開洞 → 已開 ${holeCount} 個洞 → 點擊右側開始入侵`;
      hintColor = '#ffaa44';
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
    const s = size || 24;
    const hs = s / 2;

    switch (trapId) {
      case 'shock_plate':
        // Lightning bolt icon
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

      case 'blast_trap':
        // 爆破裝置圖標
        ctx.fillStyle = '#5a3020';
        ctx.beginPath();
        ctx.arc(x + hs, y + hs + 2, hs - 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#aa4422';
        ctx.beginPath();
        ctx.arc(x + hs, y + hs + 2, hs - 8, 0, Math.PI * 2);
        ctx.fill();
        // 火焰紋路
        ctx.fillStyle = '#ff6633';
        ctx.fillRect(x + hs - 1, y + hs, 2, 3);
        ctx.fillRect(x + hs - 2, y + hs + 1, 4, 1);
        // 引信
        ctx.fillStyle = '#cc8844';
        ctx.fillRect(x + hs, y + 3, 1, 4);
        ctx.fillStyle = '#ffdd66';
        ctx.fillRect(x + hs, y + 2, 2, 2);
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
    }
  },

  renderButton(ctx, btn) {
    const C = DK.COLORS;
    const isSelected = btn.trap && this.selectedTrap && btn.trap.id === this.selectedTrap.id;
    const game = DK.Game;
    const canAfford = btn.trap ? (game && game.gold >= btn.trap.cost) : true;

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
        buttonText = '開始破牆';
        buttonColor = '#ffaa44';
        subText = '部署完成後點擊';
      } else if (game && game.state === 'breach') {
        const holeCount = DK.Map.breachHoles ? DK.Map.breachHoles.length : 0;
        buttonText = '開始入侵';
        buttonColor = holeCount > 0 ? '#ff6644' : C.UI_TEXT_DIM;
        isEnabled = holeCount > 0;
        subText = `已開 ${holeCount} 個洞`;
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

      // Hover highlight overlay
      if (btn === this.hoveredButton) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }
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

      // 懸停高亮
      if (btn === this.hoveredButton) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

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
        ice:   { badge: '#336688', border: '#55aacc', icon: '#88ccff', iconLight: '#aaddff', selected: '#88ccff' },
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

      // Hero name
      ctx.fillStyle = heroCanAfford ? C.UI_TEXT : '#444488';
      ctx.font = DK.FONTS.bold(15);
      ctx.textAlign = 'center';
      ctx.fillText(heroType.name, btn.x + btn.width / 2, btn.y + 32);

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

      // Hover highlight overlay
      if (btn === this.hoveredButton) {
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

      return;
    }

    if (!btn.trap) return;

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
    this.drawTrapIcon(ctx, btn.x + btn.width - 28, btn.y + 2, btn.trap.id, 22);

    // Trap name (large, centered)
    ctx.fillStyle = canAfford ? C.UI_TEXT : '#664444';
    ctx.font = DK.FONTS.bold(15);
    ctx.textAlign = 'center';
    ctx.fillText(btn.trap.name, btn.x + btn.width / 2, btn.y + 32);

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
    } else if (btn.trap.damage > 0 && btn.trap.element === 'fire') {
      // blast_trap: 傷害 + 火焰
      ctx.fillStyle = '#cc8888';
      ctx.fillText(`傷害:${btn.trap.damage}`, statsCX - 18, statsY);
      ctx.fillStyle = '#ff6622';
      ctx.fillText('🔥', statsCX + 20, statsY);
    } else if (btn.trap.damage === 0 && btn.trap.element === 'ice') {
      // wind_trap: 推力 + 冰
      ctx.fillStyle = C.ELEMENT_ICE;
      ctx.fillText('推力+冰❄', statsCX, statsY);
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

    // Hover highlight overlay
    if (btn === this.hoveredButton) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
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
  },

  /**
   * Draw text with outline for readability
   */
  drawTextWithOutline(ctx, text, x, y, fillColor, outlineColor) {
    ctx.fillStyle = outlineColor || 'rgba(0,0,0,0.6)';
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        if (ox === 0 && oy === 0) continue;
        ctx.fillText(text, x + ox, y + oy);
      }
    }
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  },

  renderHUD(ctx) {
    const C = DK.COLORS;
    const game = DK.Game;
    if (!game) return;

    // Semi-transparent HUD bar at top
    ctx.fillStyle = 'rgba(18,16,30,0.9)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, 40);

    // Bottom border (decorative pixel line)
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(0, 38, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    for (let i = 0; i < DK.CONFIG.DISPLAY_WIDTH; i += 6) {
      ctx.fillRect(i, 37, 3, 1);
    }

    ctx.textBaseline = 'middle';

    // Gold icon + text
    ctx.textAlign = 'left';
    ctx.font = DK.FONTS.bold(18);
    this.drawTextWithOutline(ctx, '金幣', 15, 20, C.UI_GOLD);
    ctx.font = DK.FONTS.heavy(20);
    this.drawTextWithOutline(ctx, `${game.gold}`, 70, 20, '#ffe040');

    // Dungeon Heart HP
    ctx.font = DK.FONTS.bold(18);
    this.drawTextWithOutline(ctx, '地心', 160, 20, '#ff6666');
    ctx.font = DK.FONTS.heavy(20);
    const heartPct = Math.ceil((game.dungeonHeartHP / game.dungeonHeartMaxHP) * 100);
    this.drawTextWithOutline(ctx, `${heartPct}%`, 215, 20, '#ff6666');

    // Wave info
    ctx.font = DK.FONTS.bold(18);
    this.drawTextWithOutline(ctx, '波次', 310, 20, C.UI_WAVE);
    ctx.font = DK.FONTS.heavy(20);
    this.drawTextWithOutline(ctx, `${game.currentWave + 1}/${DK.WAVES.length}`, 365, 20, '#66bbff');

    // Enemies remaining
    if (game.waveActive) {
      ctx.font = DK.FONTS.bold(16);
      const aliveCount = DK.Enemies.active.filter(e => e.alive).length;
      this.drawTextWithOutline(ctx, `存活敵人: ${aliveCount}`, 480, 20, C.UI_TEXT);
    }

    // Game title
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

    // Breach phase: highlight breakable walls
    if (DK.Game && DK.Game.state === 'breach' && DK.Map.isBreakable && DK.Map.isBreakable(col, row)) {
      ctx.strokeStyle = 'rgba(255,200,100,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);
      ctx.fillStyle = 'rgba(255,200,100,0.2)';
      ctx.fillRect(x, y, T, T);
      return;
    }

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

    if (range > 0) {
      const cx = (col * DK.CONFIG.TILE_SIZE - cam.x) * DK.CONFIG.SCALE + T / 2;
      const cy = (row * DK.CONFIG.TILE_SIZE - cam.y) * DK.CONFIG.SCALE + T / 2;
      ctx.strokeStyle = 'rgba(255,255,100,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, range, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,100,0.05)';
      ctx.fill();
    }
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

    // Render tooltipText near mouse cursor
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

    // 淡入淡出脈動
    const timestamp = game.time || 0;
    const pulse = 0.6 + 0.2 * Math.sin(timestamp * 0.002);

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
      ice: '冰霜',
      wind: '風',
      physical: '物理',
    };
    const elementColors = {
      electric: '#ffdd44',
      fire: '#ff6622',
      ice: '#88ccff',
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
   * 渲染開始畫面
   * gameCtx: 主 canvas context (960×720)
   * uiCtx: UI overlay canvas context (960×720)
   * time: 經過時間 (ms)
   */
  renderStartScreen(gameCtx, uiCtx, time) {
    const W = DK.CONFIG.DISPLAY_WIDTH;
    const H = DK.CONFIG.DISPLAY_HEIGHT;
    const cx = W / 2;
    const cy = H / 2;

    // === 背景層 (gameCtx) ===

    // 深色地牢背景
    gameCtx.fillStyle = '#06060c';
    gameCtx.fillRect(0, 0, W, H);

    // 裝飾性磚牆紋理 — 整除磚塊大小避免切割
    const brickW = 48;
    const brickH = 32;
    for (let row = 0; row < H; row += brickH) {
      const rowIdx = Math.floor(row / brickH);
      const offset = (rowIdx % 2) * (brickW / 2);
      for (let col = -brickW; col < W + brickW; col += brickW) {
        const bx = col + offset;
        const seed = ((rowIdx * 31 + Math.floor(col / brickW) * 17) & 7);
        const shades = ['#0c0c14', '#0a0a12', '#0e0e18', '#0b0b15', '#0d0d16', '#0c0c16', '#0b0b14', '#0d0d18'];
        gameCtx.fillStyle = shades[seed];
        gameCtx.fillRect(bx + 1, row + 1, brickW - 2, brickH - 2);
        // 磚縫
        gameCtx.fillStyle = '#040408';
        gameCtx.fillRect(bx, row, brickW, 1);
        gameCtx.fillRect(bx, row, 1, brickH);
        // 左上高光
        gameCtx.fillStyle = '#141420';
        gameCtx.fillRect(bx + 1, row + 1, brickW - 2, 1);
        gameCtx.fillRect(bx + 1, row + 1, 1, brickH - 2);
        // 右下陰影
        gameCtx.fillStyle = '#050509';
        gameCtx.fillRect(bx + brickW - 2, row + 1, 1, brickH - 2);
        gameCtx.fillRect(bx + 1, row + brickH - 2, brickW - 2, 1);
        // 裂痕 / 苔蘚
        if (seed === 2 || seed === 5) {
          gameCtx.fillStyle = '#080810';
          gameCtx.fillRect(bx + 12 + seed * 2, row + 6, 1, brickH - 12);
        }
        if (seed === 1 || seed === 6) {
          gameCtx.fillStyle = '#182418';
          gameCtx.fillRect(bx + 6 + seed, row + brickH - 5, 4, 2);
        }
        // 偶爾加紋理點
        if (seed === 3) {
          gameCtx.fillStyle = '#101018';
          gameCtx.fillRect(bx + 20, row + 10, 2, 1);
          gameCtx.fillRect(bx + 30, row + 18, 1, 2);
        }
      }
    }

    // 石拱門框架
    const archTop = H * 0.10;
    const archBottom = H * 0.52;
    const archLeft = cx - 220;
    const archRight = cx + 220;

    // 拱門柱子（帶磚紋理）
    const pillarW = 10;
    for (let py = archTop + 20; py < archBottom; py += 6) {
      const fade = 1 - (py - archTop) / (archBottom - archTop) * 0.4;
      const brickInPillar = Math.floor((py - archTop) / 12) % 2;
      const base = brickInPillar === 0 ? 38 : 34;
      const r = Math.round(base * fade);
      const g = Math.round((base - 5) * fade);
      const b = Math.round((base + 12) * fade);
      gameCtx.fillStyle = `rgb(${r},${g},${b})`;
      gameCtx.fillRect(archLeft - pillarW, py, pillarW - 1, 5);
      gameCtx.fillRect(archRight + 1, py, pillarW - 1, 5);
      // 高光面
      gameCtx.fillStyle = `rgba(255,255,255,${0.03 * fade})`;
      gameCtx.fillRect(archLeft - pillarW, py, 1, 5);
      gameCtx.fillRect(archRight + 1, py, 1, 5);
    }

    // 柱頭（寬於柱身）
    gameCtx.fillStyle = '#2e2c40';
    gameCtx.fillRect(archLeft - pillarW - 4, archTop + 14, pillarW + 8, 8);
    gameCtx.fillRect(archRight - 3, archTop + 14, pillarW + 8, 8);
    gameCtx.fillStyle = '#3e3a55';
    gameCtx.fillRect(archLeft - pillarW - 2, archTop + 16, pillarW + 4, 2);
    gameCtx.fillRect(archRight - 1, archTop + 16, pillarW + 4, 2);
    // 柱腳
    gameCtx.fillStyle = '#2e2c40';
    gameCtx.fillRect(archLeft - pillarW - 2, archBottom - 2, pillarW + 4, 6);
    gameCtx.fillRect(archRight - 1, archBottom - 2, pillarW + 4, 6);

    // 拱頂弧形（雙層）
    const archCy = archTop + 10;
    for (let a = -Math.PI; a < 0; a += 0.04) {
      const ax = cx + Math.cos(a) * 225;
      const ay = archCy + Math.sin(a) * 30 + 30;
      // 外層
      gameCtx.fillStyle = '#22203a';
      gameCtx.fillRect(Math.round(ax) - 3, Math.round(ay) - 3, 7, 6);
      // 內層
      gameCtx.fillStyle = '#2e2c44';
      gameCtx.fillRect(Math.round(ax) - 2, Math.round(ay) - 2, 5, 4);
      // 高光
      gameCtx.fillStyle = '#3a3855';
      gameCtx.fillRect(Math.round(ax) - 1, Math.round(ay) - 2, 3, 1);
    }
    // 拱頂頂部裝飾石
    gameCtx.fillStyle = '#3e3a55';
    gameCtx.fillRect(cx - 6, archCy - 4, 12, 8);
    gameCtx.fillStyle = '#4a4665';
    gameCtx.fillRect(cx - 4, archCy - 2, 8, 4);

    // 鎖鏈（從拱頂垂掛，鏈環形狀更清晰）
    const chainDraw = (chainX, startCY, links) => {
      for (let i = 0; i < links; i++) {
        const linkY = startCY + i * 14;
        const sway = Math.sin(time * 0.0015 + i * 0.9 + chainX * 0.01) * 1.5;
        const sx = Math.round(chainX + sway);
        // 鏈環外框
        gameCtx.fillStyle = '#36344a';
        gameCtx.fillRect(sx - 2, linkY, 5, 10);
        // 鏈環內空
        gameCtx.fillStyle = i % 2 === 0 ? '#0e0e18' : '#101020';
        gameCtx.fillRect(sx - 1, linkY + 2, 3, 6);
        // 高光
        gameCtx.fillStyle = '#4a4860';
        gameCtx.fillRect(sx - 2, linkY, 1, 3);
      }
    };
    chainDraw(archLeft + 40, archTop + 22, 5);
    chainDraw(archRight - 40, archTop + 22, 5);
    chainDraw(archLeft + 80, archTop + 28, 3);
    chainDraw(archRight - 80, archTop + 28, 3);

    // 中央聚光（雙重暖光）
    const breathe = Math.sin(time * 0.0015) * 0.03;
    const spotGrad = gameCtx.createRadialGradient(cx, H * 0.34, 20, cx, H * 0.34, 360);
    spotGrad.addColorStop(0, `rgba(110,80,35,${0.22 + breathe})`);
    spotGrad.addColorStop(0.25, `rgba(70,50,20,${0.14 + breathe})`);
    spotGrad.addColorStop(0.6, `rgba(30,20,8,${0.06})`);
    spotGrad.addColorStop(1, 'rgba(0,0,0,0)');
    gameCtx.fillStyle = spotGrad;
    gameCtx.fillRect(0, 0, W, H);

    // 火把渲染（4 個）
    const drawTorch = (tx, ty, phase) => {
      const fl = Math.sin(time * 0.009 + phase) * 0.3 + 0.7;
      const fl2 = Math.sin(time * 0.013 + phase + 2) * 0.2 + 0.8;
      // 光暈
      const gR = 65 + fl * 25;
      const tGrad = gameCtx.createRadialGradient(tx, ty - 8, 2, tx, ty - 8, gR);
      tGrad.addColorStop(0, `rgba(255,140,40,${0.20 * fl})`);
      tGrad.addColorStop(0.35, `rgba(255,100,20,${0.10 * fl})`);
      tGrad.addColorStop(1, 'rgba(0,0,0,0)');
      gameCtx.fillStyle = tGrad;
      gameCtx.fillRect(tx - gR, ty - 8 - gR, gR * 2, gR * 2);
      // 壁掛托架
      gameCtx.fillStyle = '#1e1408';
      gameCtx.fillRect(tx - 3, ty + 2, 7, 3);
      // 火把桿
      gameCtx.fillStyle = '#2a1808';
      gameCtx.fillRect(tx - 1, ty - 2, 3, 18);
      gameCtx.fillStyle = '#3a2810';
      gameCtx.fillRect(tx - 2, ty + 14, 5, 3);
      // 火焰分層
      const fh = Math.round(9 + fl * 5);
      // 外焰（最大最暗）
      gameCtx.fillStyle = '#cc3300';
      gameCtx.fillRect(tx - 4, ty - fh + 8, 9, fh - 8);
      // 中焰
      gameCtx.fillStyle = '#ff6611';
      gameCtx.fillRect(tx - 3, ty - fh + 6, 7, fh - 6);
      // 內焰
      gameCtx.fillStyle = '#ffaa33';
      gameCtx.fillRect(tx - 2, ty - fh + 4, 5, fh - 4);
      // 核心
      gameCtx.fillStyle = '#ffdd66';
      gameCtx.fillRect(tx - 1, ty - fh + 2, 3, fh - 4);
      // 白色尖端
      gameCtx.fillStyle = '#ffffcc';
      gameCtx.fillRect(tx, ty - fh + 1, 1, 3);
      // 外焰飄動
      const swL = Math.round(Math.sin(time * 0.014 + phase) * 2);
      const swR = Math.round(Math.cos(time * 0.011 + phase) * 2);
      gameCtx.fillStyle = `rgba(255,80,10,${0.5 * fl2})`;
      gameCtx.fillRect(tx - 4 + swL, ty - fh + 7, 2, 4);
      gameCtx.fillRect(tx + 3 + swR, ty - fh + 6, 2, 5);
      // 火星上升
      for (let s = 0; s < 4; s++) {
        const sT = ((time * 0.0025 + phase * 0.7 + s * 0.9) % 1.5);
        if (sT < 1) {
          const sparkX = tx + Math.sin(sT * 5 + s * 2.5) * 10;
          const sparkY = ty - fh - sT * 25 - 3;
          const sparkA = (1 - sT) * 0.7;
          const sparkColors = ['rgba(255,200,80,', 'rgba(255,160,40,', 'rgba(255,120,30,', 'rgba(255,100,20,'];
          gameCtx.fillStyle = `${sparkColors[s]}${sparkA})`;
          gameCtx.fillRect(Math.round(sparkX), Math.round(sparkY), 1, 1);
        }
      }
    };
    drawTorch(cx - 195, H * 0.27, 0);
    drawTorch(cx + 195, H * 0.27, 1.5);
    drawTorch(cx - 155, H * 0.60, 3.0);
    drawTorch(cx + 155, H * 0.60, 4.5);

    // 中間區域像素裝飾：交叉劍圖示（gameCtx）
    const iconY = H * 0.52;
    const drawCrossedSwords = (ix, iy) => {
      // 左劍（\方向）
      gameCtx.fillStyle = '#3a3850';
      for (let d = -8; d <= 8; d++) {
        gameCtx.fillRect(ix + d, iy + d, 2, 2);
      }
      // 右劍（/方向）
      for (let d = -8; d <= 8; d++) {
        gameCtx.fillRect(ix - d, iy + d, 2, 2);
      }
      // 劍刃高光
      gameCtx.fillStyle = '#5a5870';
      for (let d = -6; d <= -2; d++) {
        gameCtx.fillRect(ix + d, iy + d, 1, 1);
        gameCtx.fillRect(ix - d, iy + d, 1, 1);
      }
      // 護手
      gameCtx.fillStyle = '#665530';
      gameCtx.fillRect(ix - 4, iy + 4, 8, 2);
      // 劍柄
      gameCtx.fillStyle = '#4a3820';
      gameCtx.fillRect(ix - 1, iy + 6, 2, 5);
      gameCtx.fillRect(ix - 1, iy - 7, 2, 2);
    };
    drawCrossedSwords(cx, iconY);

    // 水平裝飾線（連接劍圖示兩側）
    gameCtx.fillStyle = '#1e1c30';
    gameCtx.fillRect(cx - 120, iconY, 95, 1);
    gameCtx.fillRect(cx + 25, iconY, 95, 1);
    // 線端鑽石
    for (const dx of [-120, 120]) {
      gameCtx.fillStyle = '#2e2c44';
      gameCtx.fillRect(cx + dx - 2, iconY - 2, 4, 4);
      gameCtx.fillStyle = '#3a3855';
      gameCtx.fillRect(cx + dx - 1, iconY - 1, 2, 2);
    }

    // 飄浮粒子
    for (let i = 0; i < 28; i++) {
      const seed = i * 137.5;
      const px = (seed * 7.3 + time * 0.007 * (0.4 + (i % 4) * 0.2)) % W;
      const py = (seed * 3.7 + Math.sin(time * 0.0008 + i) * 25 + time * 0.003) % H;
      const alpha = 0.06 + Math.sin(time * 0.0018 + i * 0.5) * 0.04;
      if (i < 20) {
        gameCtx.fillStyle = `rgba(180,160,130,${alpha})`;
        gameCtx.fillRect(Math.round(px), Math.round(py), 1, 1);
      } else {
        // 火星
        gameCtx.fillStyle = `rgba(255,150,50,${alpha + 0.1})`;
        gameCtx.fillRect(Math.round(px), Math.round(py), 1, 1);
      }
    }

    // 底部石板地面
    const groundY = H * 0.86;
    // 地面漸層過渡
    for (let gy = 0; gy < 8; gy++) {
      const ga = gy / 8 * 0.4;
      gameCtx.fillStyle = `rgba(10,10,16,${ga})`;
      gameCtx.fillRect(0, groundY - 8 + gy, W, 1);
    }
    gameCtx.fillStyle = '#0e0e16';
    gameCtx.fillRect(0, groundY, W, H - groundY);
    // 石板縫
    for (let gx = 0; gx < W; gx += 60) {
      gameCtx.fillStyle = '#080810';
      gameCtx.fillRect(gx, groundY, 1, H - groundY);
      gameCtx.fillStyle = '#141420';
      gameCtx.fillRect(gx + 1, groundY, 1, H - groundY);
    }
    // 碎石散落
    for (let i = 0; i < 20; i++) {
      const rx = (i * 47.3 + 20) % W;
      const ry = groundY + 3 + (i * 5.7 % (H - groundY - 10));
      const sc = ['#1a1a26', '#161620', '#1e1e2a', '#141420'];
      gameCtx.fillStyle = sc[i & 3];
      gameCtx.fillRect(Math.round(rx), Math.round(ry), 2 + (i & 1), 1 + (i >> 1 & 1));
    }

    // 暗角
    const vigGrad = gameCtx.createRadialGradient(cx, H * 0.38, H * 0.25, cx, H * 0.38, H * 0.95);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
    vigGrad.addColorStop(0.8, 'rgba(0,0,0,0.35)');
    vigGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
    gameCtx.fillStyle = vigGrad;
    gameCtx.fillRect(0, 0, W, H);

    // 邊框（雙層 + 角落裝飾）
    gameCtx.strokeStyle = '#2a2844';
    gameCtx.lineWidth = 2;
    gameCtx.strokeRect(6, 6, W - 12, H - 12);
    gameCtx.strokeStyle = '#1a1834';
    gameCtx.lineWidth = 1;
    gameCtx.strokeRect(10, 10, W - 20, H - 20);
    // 角落 L 形裝飾
    const cS = 20;
    const cPairs = [[10, 10, 1, 1], [W - 10 - cS, 10, -1, 1], [10, H - 10 - cS, 1, -1], [W - 10 - cS, H - 10 - cS, -1, -1]];
    for (const [cornX, cornY] of cPairs) {
      gameCtx.fillStyle = '#3a3858';
      gameCtx.fillRect(cornX, cornY, cS, 2);
      gameCtx.fillRect(cornX, cornY, 2, cS);
      gameCtx.fillStyle = '#2a2840';
      gameCtx.fillRect(cornX + cS - 2, cornY, 2, cS);
      gameCtx.fillRect(cornX, cornY + cS - 2, cS, 2);
      // 角落鑽石
      gameCtx.fillStyle = '#4a4868';
      gameCtx.fillRect(cornX + 2, cornY + 2, 3, 3);
    }

    // === 文字層 (uiCtx) ===
    uiCtx.save();
    uiCtx.textAlign = 'center';
    uiCtx.textBaseline = 'middle';

    // 標題：PROJECT DK
    const titleY = H * 0.27;

    // 陰影（先畫，無 glow）
    uiCtx.font = DK.FONTS.pixel(48);
    uiCtx.fillStyle = 'rgba(0,0,0,0.8)';
    uiCtx.fillText('PROJECT DK', cx + 3, titleY + 4);

    // 標題主體（金色漸層 + 光暈）
    const titleGrad = uiCtx.createLinearGradient(cx - 200, titleY - 25, cx + 200, titleY + 25);
    titleGrad.addColorStop(0, '#b8882a');
    titleGrad.addColorStop(0.15, '#ddaa44');
    titleGrad.addColorStop(0.35, '#ffd700');
    titleGrad.addColorStop(0.5, '#fff4b0');
    titleGrad.addColorStop(0.65, '#ffd700');
    titleGrad.addColorStop(0.85, '#ddaa44');
    titleGrad.addColorStop(1, '#b8882a');
    uiCtx.fillStyle = titleGrad;
    uiCtx.shadowColor = 'rgba(255,200,80,0.5)';
    uiCtx.shadowBlur = 18;
    uiCtx.fillText('PROJECT DK', cx, titleY);
    uiCtx.shadowBlur = 0;

    // 裝飾框 — 上下對稱
    const ornW = 310;
    const ornGap = 36;
    const drawOrnament = (ly, dir) => {
      // 主線
      uiCtx.fillStyle = '#665528';
      uiCtx.fillRect(cx - ornW / 2, ly, ornW, 1);
      // 副線
      uiCtx.fillStyle = '#4a3a18';
      uiCtx.fillRect(cx - ornW / 2 + 25, ly + dir * 4, ornW - 50, 1);
      // 端點
      uiCtx.fillStyle = '#aa8840';
      uiCtx.fillRect(cx - ornW / 2, ly - 2, 3, 5);
      uiCtx.fillRect(cx + ornW / 2 - 3, ly - 2, 3, 5);
      // 中央鑽石
      uiCtx.fillStyle = '#ccaa44';
      uiCtx.fillRect(cx, ly - 3, 1, 7);
      uiCtx.fillRect(cx - 1, ly - 2, 3, 5);
      uiCtx.fillRect(cx - 2, ly - 1, 5, 3);
      // 1/4 和 3/4 位置小點
      uiCtx.fillStyle = '#887730';
      uiCtx.fillRect(cx - ornW / 4, ly - 1, 2, 3);
      uiCtx.fillRect(cx + ornW / 4 - 2, ly - 1, 2, 3);
    };
    drawOrnament(titleY - ornGap, -1);
    drawOrnament(titleY + ornGap, 1);

    // 副標題
    const subY = titleY + ornGap + 22;
    uiCtx.font = DK.FONTS.pixel(11);
    uiCtx.fillStyle = 'rgba(0,0,0,0.5)';
    uiCtx.fillText('DUNGEON  DEFENSE', cx + 1, subY + 1);
    uiCtx.fillStyle = '#887755';
    uiCtx.fillText('DUNGEON  DEFENSE', cx, subY);

    // PROTOTYPE 標籤
    const protoY = subY + 24;
    const protoW = 100;
    const protoH = 16;
    // 標籤背景
    uiCtx.fillStyle = 'rgba(180,60,30,0.15)';
    uiCtx.fillRect(cx - protoW / 2, protoY - protoH / 2, protoW, protoH);
    uiCtx.strokeStyle = 'rgba(200,80,40,0.3)';
    uiCtx.lineWidth = 1;
    uiCtx.strokeRect(cx - protoW / 2, protoY - protoH / 2, protoW, protoH);
    // 標籤文字
    uiCtx.font = DK.FONTS.pixel(8);
    uiCtx.fillStyle = '#cc6644';
    uiCtx.fillText('PROTOTYPE', cx, protoY + 1);

    // 開發者
    const devY = H * 0.62;
    uiCtx.font = DK.FONTS.pixel(8);
    uiCtx.fillStyle = '#44403a';
    uiCtx.fillText('DEVELOPED  BY', cx, devY);
    uiCtx.font = DK.FONTS.bold(15);
    uiCtx.fillStyle = '#887766';
    uiCtx.fillText('Jerry Lee', cx, devY + 20);

    // 點擊開始
    const startY = H * 0.78;
    const blinkAlpha = Math.sin(time * 0.004) * 0.3 + 0.7;
    const pulseScale = 1 + Math.sin(time * 0.003) * 0.02;
    // 陰影
    uiCtx.font = DK.FONTS.pixel(14);
    uiCtx.fillStyle = `rgba(0,0,0,${blinkAlpha * 0.6})`;
    uiCtx.fillText('CLICK  TO  START', cx + 1, startY + 2);
    // 主文字 + 光暈
    uiCtx.fillStyle = `rgba(255,220,150,${blinkAlpha})`;
    uiCtx.shadowColor = `rgba(255,200,100,${blinkAlpha * 0.4})`;
    uiCtx.shadowBlur = 15;
    uiCtx.fillText('CLICK  TO  START', cx, startY);
    uiCtx.shadowBlur = 0;
    // 脈動側線
    const sideLen = 35 + Math.sin(time * 0.003) * 15;
    uiCtx.fillStyle = `rgba(140,120,70,${blinkAlpha * 0.35})`;
    uiCtx.fillRect(cx - sideLen - 110, startY - 1, sideLen, 1);
    uiCtx.fillRect(cx + 110, startY - 1, sideLen, 1);

    // 底部版本
    uiCtx.font = DK.FONTS.pixel(8);
    uiCtx.fillStyle = '#222224';
    uiCtx.fillText('v0.1  //  HTML5 CANVAS', cx, H - 16);

    uiCtx.restore();
  },
};
