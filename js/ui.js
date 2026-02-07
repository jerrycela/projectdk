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
  buttons: [],
  tooltipText: '',
  showWaveStart: false,
  waveStartTimer: 0,
  messageQueue: [],
  fontsReady: false,
  _evolveButtonRect: null, // Cached evolve button hit area

  init() {
    this.selectedTrap = null;
    this.selectedHeroType = null;
    this.selectedPlacedTrap = null;
    this._evolveButtonRect = null;
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
    const totalItems = trapTypes.length + heroTypes.length;
    const separatorGap = 14; // Gap between trap and hero sections

    // Dynamic button sizing — now only 4+3 items, more room
    const waveButtonWidth = 100;
    const waveGap = 12;
    const availableWidth = DK.CONFIG.DISPLAY_WIDTH - 20 - waveButtonWidth - waveGap - 20 - separatorGap;
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

    // Store layout info for separator and labels
    const trapEndX = startX + (btnWidth + gap) * trapTypes.length - gap;
    this._sectionLayout = {
      separatorX: Math.floor(trapEndX + separatorGap / 2),
      separatorY: startY,
      separatorH: btnHeight,
      trapLabelX: startX + (trapEndX - startX) / 2,
      heroLabelX: heroStartX + ((btnWidth + gap) * heroTypes.length - gap) / 2,
      labelY: startY - 2,
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

    // Check UI buttons
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.width &&
          my >= btn.y && my <= btn.y + btn.height) {
        if (btn.action === 'start_wave') {
          if (DK.Game && !DK.Game.waveActive) {
            DK.Game.startWave();
          }
          return true;
        }
        if (btn.trap) {
          this.selectedTrap = btn.trap;
          this.selectedHeroType = null;
          this.selectedPlacedTrap = null;
          this._evolveButtonRect = null;
          if (DK.Heroes) DK.Heroes.selectedHero = null;
          return true;
        }
        if (btn.hero) {
          this.selectedHeroType = btn.hero;
          this.selectedTrap = null;
          this.selectedPlacedTrap = null;
          this._evolveButtonRect = null;
          if (DK.Heroes) DK.Heroes.selectedHero = null;
          return true;
        }
      }
    }

    // Check game area clicks
    if (my < DK.CONFIG.UI_TOP && DK.Game) {
      const col = Math.floor(mx / DK.CONFIG.DISPLAY_TILE);
      const row = Math.floor(my / DK.CONFIG.DISPLAY_TILE);

      // Priority 1: Click on existing hero to select it
      if (DK.Heroes) {
        const pixelX = mx / DK.CONFIG.SCALE;
        const pixelY = my / DK.CONFIG.SCALE;
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

      // Priority 2: Move selected hero
      if (DK.Heroes && DK.Heroes.selectedHero) {
        if (DK.Map.isPath(col, row) && DK.Map.layout[row][col] !== 'E' && DK.Map.layout[row][col] !== 'X') {
          DK.Heroes.commandMove(DK.Heroes.selectedHero, col, row);
          return true;
        }
      }

      // Priority 3: Deploy hero
      if (this.selectedHeroType) {
        if (DK.Map.isPath(col, row) && DK.Map.layout[row][col] !== 'E' && DK.Map.layout[row][col] !== 'X') {
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

    // Check game area click (place trap)
    if (my < DK.CONFIG.UI_TOP && this.selectedTrap && DK.Game) {
      const col = Math.floor(mx / DK.CONFIG.DISPLAY_TILE);
      const row = Math.floor(my / DK.CONFIG.DISPLAY_TILE);

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
    if (my < DK.CONFIG.UI_TOP) {
      const col = Math.floor(mx / DK.CONFIG.DISPLAY_TILE);
      const row = Math.floor(my / DK.CONFIG.DISPLAY_TILE);
      this.hoveredTile = { col, row };
    } else {
      this.hoveredTile = null;
    }

    // Update tooltip
    this.tooltipText = '';
    for (const btn of this.buttons) {
      if (mx >= btn.x && mx <= btn.x + btn.width &&
          my >= btn.y && my <= btn.y + btn.height) {
        if (btn.trap) {
          this.tooltipText = `${btn.trap.name}: ${btn.trap.description} (點擊選取)`;
        } else if (btn.hero) {
          this.tooltipText = `${btn.hero.name}: ${btn.hero.description} (點擊部署)`;
        }
        break;
      }
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

    // Hero move target indicator
    if (DK.Heroes && DK.Heroes.selectedHero && this.hoveredTile) {
      this.renderHeroMoveIndicator(ctx);
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

    // Messages
    this.renderMessages(ctx);

    // Wave announcement
    if (this.showWaveStart) {
      this.renderWaveAnnouncement(ctx);
    }

    // Game over / Victory
    if (game && game.gameOver) {
      this.renderGameOver(ctx);
    }
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
      // Wave start button
      const isActive = game && game.waveActive;

      // Pulsing border when available
      if (!isActive && game && !game.gameOver) {
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(68,170,255,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
      }

      // Icon (sword or hourglass)
      ctx.fillStyle = isActive ? C.UI_TEXT_DIM : '#66bbff';
      ctx.font = DK.FONTS.bold(18);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.drawTextWithOutline(ctx,
        isActive ? '進行中...' : btn.label,
        btn.x + btn.width / 2,
        btn.y + btn.height / 2 - 10,
        isActive ? C.UI_TEXT_DIM : '#88ddff'
      );

      // Wave counter
      if (game) {
        ctx.font = DK.FONTS.body(12);
        ctx.fillStyle = C.UI_TEXT_DIM;
        ctx.fillText(
          `第 ${game.currentWave + 1} / ${DK.WAVES.length} 波`,
          btn.x + btn.width / 2,
          btn.y + btn.height / 2 + 10
        );
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

    // Lives icon + text
    ctx.font = DK.FONTS.bold(18);
    this.drawTextWithOutline(ctx, '生命', 160, 20, C.UI_HP);
    ctx.font = DK.FONTS.heavy(20);
    this.drawTextWithOutline(ctx, `${game.lives}`, 215, 20, '#ff6666');

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
    ctx.font = DK.FONTS.heavy(16);
    this.drawTextWithOutline(ctx, '地層塔防', DK.CONFIG.DISPLAY_WIDTH - 15, 20, C.UI_TEXT_DIM);
  },

  renderHoverIndicator(ctx) {
    if (!this.hoveredTile) return;
    if (DK.Game && DK.Game.gameOver) return;

    const { col, row } = this.hoveredTile;
    const T = DK.CONFIG.DISPLAY_TILE;
    const x = col * T;
    const y = row * T;

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
    const range = this.selectedTrap.range * T;

    if (range > 0) {
      const cx = col * T + T / 2;
      const cy = row * T + T / 2;
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

  renderHeroMoveIndicator(ctx) {
    if (!DK.Heroes || !DK.Heroes.selectedHero || !this.hoveredTile) return;

    const { col, row } = this.hoveredTile;
    const T = DK.CONFIG.DISPLAY_TILE;
    const x = col * T;
    const y = row * T;

    const valid = DK.Map.isPath(col, row) &&
                  DK.Map.layout[row][col] !== 'E' &&
                  DK.Map.layout[row][col] !== 'X';

    if (valid) {
      ctx.strokeStyle = 'rgba(68,255,68,0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);
      ctx.fillStyle = 'rgba(68,255,68,0.1)';
      ctx.fillRect(x, y, T, T);
    }
  },

  renderTooltip(ctx) {
    // Show hint for placed trap inspection
    if (this.selectedPlacedTrap && !DK.Game.gameOver) {
      const hintText = '點擊其他陷阱查看  |  右鍵取消選擇';

      ctx.font = DK.FONTS.body(12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(18,16,30,0.8)';
      const metrics = ctx.measureText(hintText);
      const tw = metrics.width + 16;
      ctx.fillRect(DK.CONFIG.DISPLAY_WIDTH / 2 - tw / 2, DK.CONFIG.UI_TOP - 22, tw, 18);
      ctx.fillStyle = '#ccaa44';
      ctx.fillText(hintText, DK.CONFIG.DISPLAY_WIDTH / 2, DK.CONFIG.UI_TOP - 13);
      return;
    }

    // Show hint for hero deployment
    if (this.selectedHeroType && !DK.Game.gameOver) {
      const hintText = '點擊地板放置英雄  |  右鍵取消選擇';

      ctx.font = DK.FONTS.body(12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(18,16,30,0.8)';
      const metrics = ctx.measureText(hintText);
      const tw = metrics.width + 16;
      ctx.fillRect(DK.CONFIG.DISPLAY_WIDTH / 2 - tw / 2, DK.CONFIG.UI_TOP - 22, tw, 18);
      ctx.fillStyle = '#6688cc';
      ctx.fillText(hintText, DK.CONFIG.DISPLAY_WIDTH / 2, DK.CONFIG.UI_TOP - 13);
      return;
    }

    // Show hint for hero movement
    if (DK.Heroes && DK.Heroes.selectedHero && !DK.Game.gameOver) {
      const hintText = '點擊地板移動英雄  |  右鍵取消選擇';

      ctx.font = DK.FONTS.body(12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(18,16,30,0.8)';
      const metrics = ctx.measureText(hintText);
      const tw = metrics.width + 16;
      ctx.fillRect(DK.CONFIG.DISPLAY_WIDTH / 2 - tw / 2, DK.CONFIG.UI_TOP - 22, tw, 18);
      ctx.fillStyle = '#66cc66';
      ctx.fillText(hintText, DK.CONFIG.DISPLAY_WIDTH / 2, DK.CONFIG.UI_TOP - 13);
      return;
    }

    // Show placement hint when a trap is selected
    if (this.selectedTrap && !DK.Game.gameOver) {
      const hintText = this.selectedTrap.type === 'wall'
        ? '點擊紫色牆壁放置  |  右鍵取消選擇'
        : '點擊地板路徑放置  |  右鍵取消選擇';

      ctx.font = DK.FONTS.body(12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(18,16,30,0.8)';
      const metrics = ctx.measureText(hintText);
      const tw = metrics.width + 16;
      ctx.fillRect(DK.CONFIG.DISPLAY_WIDTH / 2 - tw / 2, DK.CONFIG.UI_TOP - 22, tw, 18);
      ctx.fillStyle = C.UI_TEXT_DIM;
      ctx.fillText(hintText, DK.CONFIG.DISPLAY_WIDTH / 2, DK.CONFIG.UI_TOP - 13);
    }
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

  renderGameOver(ctx) {
    const game = DK.Game;
    if (!game) return;

    // Full-screen overlay
    ctx.fillStyle = 'rgba(10,10,18,0.9)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);

    const isVictory = game.lives > 0;
    const cx = DK.CONFIG.DISPLAY_WIDTH / 2;
    const cy = DK.CONFIG.DISPLAY_HEIGHT / 2 - 20;

    // Result panel
    ctx.fillStyle = 'rgba(30,26,46,0.95)';
    ctx.fillRect(cx - 200, cy - 80, 400, 200);
    this.drawPixelBorder(ctx, cx - 200, cy - 80, 400, 200);

    // Title
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = DK.FONTS.heavy(40);
    this.drawTextWithOutline(ctx,
      isVictory ? '勝 利 ！' : '失 敗 ...',
      cx, cy - 40,
      isVictory ? '#44ff44' : '#ff4444',
      'rgba(0,0,0,0.8)');

    // Stats
    ctx.font = DK.FONTS.bold(18);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillText(`完成波次: ${game.currentWave}/${DK.WAVES.length}`, cx, cy + 10);

    ctx.font = DK.FONTS.body(16);
    ctx.fillStyle = DK.COLORS.UI_GOLD;
    ctx.fillText(`剩餘金幣: ${game.gold}`, cx - 70, cy + 40);
    ctx.fillStyle = DK.COLORS.UI_HP;
    ctx.fillText(`剩餘生命: ${game.lives}`, cx + 70, cy + 40);

    // Restart hint (pulsing)
    const pulse = Math.sin(Date.now() / 600) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.font = DK.FONTS.bold(14);
    ctx.fillStyle = '#8a8070';
    ctx.fillText('點擊任意位置重新開始', cx, cy + 80);
    ctx.globalAlpha = 1;
  },

  clearSelection() {
    this.selectedTrap = null;
    this.selectedHeroType = null;
    this.selectedPlacedTrap = null;
    this._evolveButtonRect = null;
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
    const trapCX = trap.col * T + T / 2;

    // Draw highlight around selected trap
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 2;
    ctx.strokeRect(trap.col * T + 1, trap.row * T + 1, T - 2, T - 2);
    // Inner glow
    const glowAlpha = Math.sin(Date.now() / 400) * 0.15 + 0.2;
    ctx.fillStyle = `rgba(255,204,68,${glowAlpha})`;
    ctx.fillRect(trap.col * T, trap.row * T, T, T);

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
    let panelY = trap.row * T - panelH - 8;
    if (panelY < 42) {
      panelY = (trap.row + 1) * T + 8;
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
};
