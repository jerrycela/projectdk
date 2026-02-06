/**
 * Dungeon Keep - UI System
 * Renders high-resolution UI overlay with crisp Chinese text
 */
window.DK = window.DK || {};

DK.UI = {
  selectedTrap: null,
  hoveredTile: null,
  buttons: [],
  tooltipText: '',
  showWaveStart: false,
  waveStartTimer: 0,
  messageQueue: [],

  init() {
    this.selectedTrap = null;
    this.hoveredTile = null;
    this.buildButtons();
  },

  buildButtons() {
    this.buttons = [];
    const trapTypes = Object.values(DK.TRAP_TYPES);
    const btnWidth = 120;
    const btnHeight = 70;
    const startX = 20;
    const startY = DK.CONFIG.UI_TOP + 13;
    const gap = 8;

    trapTypes.forEach((trap, i) => {
      this.buttons.push({
        trap,
        x: startX + (btnWidth + gap) * i,
        y: startY,
        width: btnWidth,
        height: btnHeight,
      });
    });

    // Wave start button
    this.buttons.push({
      action: 'start_wave',
      label: '開始波次',
      x: DK.CONFIG.DISPLAY_WIDTH - 140,
      y: startY,
      width: 120,
      height: btnHeight,
    });
  },

  handleClick(mx, my) {
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
          return true;
        }
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
          this.tooltipText = `${btn.trap.name}: ${btn.trap.description}`;
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

    // Trap selection buttons
    for (const btn of this.buttons) {
      this.renderButton(ctx, btn);
    }

    // Top HUD bar
    this.renderHUD(ctx);

    // Hover indicator on game area
    this.renderHoverIndicator(ctx);

    // Selected trap range preview
    if (this.selectedTrap && this.hoveredTile) {
      this.renderPlacementPreview(ctx);
    }

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
    const s = 3; // pixel size for border

    ctx.fillStyle = C.UI_BORDER;
    // Top border
    for (let i = 0; i < w; i += s) {
      ctx.fillRect(x + i, y, s, s);
    }
    // Bottom border
    for (let i = 0; i < w; i += s) {
      ctx.fillRect(x + i, y + h - s, s, s);
    }
    // Inner highlight
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    for (let i = 0; i < w; i += s * 2) {
      ctx.fillRect(x + i, y + s, s, s);
    }
  },

  renderButton(ctx, btn) {
    const C = DK.COLORS;
    const isSelected = btn.trap && this.selectedTrap && btn.trap.id === this.selectedTrap.id;
    const game = DK.Game;
    const canAfford = btn.trap ? (game && game.gold >= btn.trap.cost) : true;

    // Button background
    ctx.fillStyle = isSelected ? '#2a2440' : C.UI_PANEL;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    // Button border
    ctx.strokeStyle = isSelected ? C.UI_SELECTED : C.UI_BORDER;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);

    if (btn.action === 'start_wave') {
      // Wave button
      const isActive = game && game.waveActive;
      ctx.fillStyle = isActive ? C.UI_TEXT_DIM : C.UI_WAVE;
      ctx.font = 'bold 16px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        isActive ? '進行中...' : btn.label,
        btn.x + btn.width / 2,
        btn.y + btn.height / 2 - 8
      );

      // Wave number
      if (game) {
        ctx.fillStyle = C.UI_TEXT_DIM;
        ctx.font = '12px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
        ctx.fillText(
          `第 ${game.currentWave + 1} / ${DK.WAVES.length} 波`,
          btn.x + btn.width / 2,
          btn.y + btn.height / 2 + 12
        );
      }
      return;
    }

    if (!btn.trap) return;

    // Trap type indicator (wall vs floor)
    const typeColor = btn.trap.type === 'wall' ? '#6a5e8e' : '#5e6a4e';
    const typeLabel = btn.trap.type === 'wall' ? '牆壁' : '地板';
    ctx.fillStyle = typeColor;
    ctx.fillRect(btn.x + 2, btn.y + 2, 30, 14);
    ctx.fillStyle = '#e8e0d0';
    ctx.font = 'bold 10px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typeLabel, btn.x + 17, btn.y + 9);

    // Trap name
    ctx.fillStyle = canAfford ? C.UI_TEXT : '#664444';
    ctx.font = 'bold 14px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(btn.trap.name, btn.x + btn.width / 2, btn.y + 30);

    // Cost
    ctx.fillStyle = canAfford ? C.UI_GOLD : '#664400';
    ctx.font = '12px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(`${btn.trap.cost} 金`, btn.x + btn.width / 2, btn.y + 48);

    // Damage info
    if (btn.trap.damage > 0) {
      ctx.fillStyle = C.UI_TEXT_DIM;
      ctx.font = '10px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText(`傷害: ${btn.trap.damage}`, btn.x + btn.width / 2, btn.y + 62);
    } else if (btn.trap.slowAmount) {
      ctx.fillStyle = C.TRAP_ICE;
      ctx.font = '10px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText('減速效果', btn.x + btn.width / 2, btn.y + 62);
    }
  },

  renderHUD(ctx) {
    const C = DK.COLORS;
    const game = DK.Game;
    if (!game) return;

    // Semi-transparent HUD bar at top
    ctx.fillStyle = 'rgba(18,16,30,0.85)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, 36);

    // Bottom border
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(0, 34, DK.CONFIG.DISPLAY_WIDTH, 2);

    // Gold
    ctx.fillStyle = C.UI_GOLD;
    ctx.font = 'bold 18px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`💰 ${game.gold}`, 15, 18);

    // Lives
    ctx.fillStyle = C.UI_HP;
    ctx.fillText(`❤️ ${game.lives}`, 160, 18);

    // Wave
    ctx.fillStyle = C.UI_WAVE;
    ctx.fillText(`🌊 波次 ${game.currentWave + 1}/${DK.WAVES.length}`, 310, 18);

    // Enemies remaining
    if (game.waveActive) {
      ctx.fillStyle = C.UI_TEXT;
      ctx.font = '14px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.fillText(`敵人: ${DK.Enemies.active.filter(e => e.alive).length} 存活`, 520, 18);
    }

    // Game title
    ctx.fillStyle = C.UI_TEXT_DIM;
    ctx.font = '14px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('地層塔防', DK.CONFIG.DISPLAY_WIDTH - 15, 18);
  },

  renderHoverIndicator(ctx) {
    if (!this.hoveredTile || !this.selectedTrap) return;

    const { col, row } = this.hoveredTile;
    const T = DK.CONFIG.DISPLAY_TILE;
    const x = col * T;
    const y = row * T;

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
      ctx.fillStyle = `rgba(255,100,100,${alpha})`;
      ctx.font = 'bold 16px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(msg.text, DK.CONFIG.DISPLAY_WIDTH / 2, y);
      y -= 25;
    }
  },

  renderWaveAnnouncement(ctx) {
    const C = DK.COLORS;
    const alpha = Math.min(1, this.waveStartTimer / 500);
    const game = DK.Game;
    if (!game) return;

    ctx.fillStyle = `rgba(18,16,30,${alpha * 0.7})`;
    ctx.fillRect(0, 250, DK.CONFIG.DISPLAY_WIDTH, 80);

    ctx.fillStyle = `rgba(232,224,208,${alpha})`;
    ctx.font = 'bold 28px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`第 ${game.currentWave + 1} 波`, DK.CONFIG.DISPLAY_WIDTH / 2, 280);

    ctx.fillStyle = `rgba(138,128,112,${alpha})`;
    ctx.font = '16px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText('敵人來襲！', DK.CONFIG.DISPLAY_WIDTH / 2, 310);
  },

  renderGameOver(ctx) {
    const game = DK.Game;
    if (!game) return;

    ctx.fillStyle = 'rgba(10,10,18,0.85)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);

    const isVictory = game.lives > 0;

    ctx.fillStyle = isVictory ? '#44ff44' : '#ff4444';
    ctx.font = 'bold 36px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isVictory ? '勝利！' : '失敗...',
      DK.CONFIG.DISPLAY_WIDTH / 2,
      DK.CONFIG.DISPLAY_HEIGHT / 2 - 30
    );

    ctx.fillStyle = '#e8e0d0';
    ctx.font = '18px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(
      `存活波次: ${game.currentWave + 1}  |  剩餘金幣: ${game.gold}`,
      DK.CONFIG.DISPLAY_WIDTH / 2,
      DK.CONFIG.DISPLAY_HEIGHT / 2 + 20
    );

    ctx.fillStyle = '#8a8070';
    ctx.font = '14px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
    ctx.fillText(
      '點擊任意位置重新開始',
      DK.CONFIG.DISPLAY_WIDTH / 2,
      DK.CONFIG.DISPLAY_HEIGHT / 2 + 55
    );
  },
};
