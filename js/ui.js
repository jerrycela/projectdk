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
  hoveredTile: null,
  buttons: [],
  tooltipText: '',
  showWaveStart: false,
  waveStartTimer: 0,
  messageQueue: [],
  fontsReady: false,

  init() {
    this.selectedTrap = null;
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
      case 'arrow_tower':
        // Crossbow icon
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(x + hs - 1, y + 4, 2, s - 8);
        ctx.fillStyle = '#6b5010';
        ctx.fillRect(x + 2, y + 6, s - 4, 2);
        ctx.fillStyle = '#aaa888';
        ctx.fillRect(x + 2, y + 9, 1, 1);
        ctx.fillRect(x + s - 3, y + 9, 1, 1);
        ctx.fillStyle = '#c0c8d0';
        ctx.fillRect(x + hs - 1, y + s - 6, 2, 3);
        break;

      case 'flame_jet':
        // Fire icon
        ctx.fillStyle = '#aa6830';
        ctx.fillRect(x + hs - 3, y + 2, 6, 6);
        ctx.fillStyle = '#ff6622';
        ctx.fillRect(x + hs - 2, y + 10, 4, 4);
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(x + hs - 1, y + 12, 2, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + hs - 1, y + 14, 2, 2);
        break;

      case 'ice_trap':
        // Crystal icon
        ctx.fillStyle = '#44aaff';
        ctx.fillRect(x + hs - 1, y + 2, 2, s - 4);
        ctx.fillRect(x + 4, y + hs - 1, s - 8, 2);
        ctx.fillStyle = '#88ccff';
        ctx.fillRect(x + hs - 1, y + hs - 1, 2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + hs, y + hs, 1, 1);
        break;

      case 'floor_spikes':
        // Spike icon
        ctx.fillStyle = '#3a3428';
        ctx.fillRect(x + 2, y + s - 6, s - 4, 4);
        ctx.fillStyle = '#a0a8b8';
        for (let i = 0; i < 3; i++) {
          const sx = x + 5 + i * 5;
          ctx.fillRect(sx, y + 6, 2, s - 12);
          ctx.fillStyle = '#d0d8e0';
          ctx.fillRect(sx, y + 4, 2, 2);
          ctx.fillStyle = '#a0a8b8';
        }
        break;

      case 'tar_trap':
        // Tar pool icon
        ctx.fillStyle = '#1a1a2a';
        ctx.beginPath();
        ctx.ellipse(x + hs, y + hs + 2, hs - 4, hs - 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(x + hs - 2, y + hs - 1, 4, 2);
        break;

      case 'bomb_trap':
        // Bomb icon
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.arc(x + hs, y + hs + 2, hs - 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#5a5a5a';
        ctx.beginPath();
        ctx.arc(x + hs, y + hs + 2, hs - 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#c8a050';
        ctx.fillRect(x + hs, y + 3, 1, 4);
        ctx.fillRect(x + hs + 1, y + 2, 2, 1);
        ctx.fillStyle = '#ffdd66';
        ctx.fillRect(x + hs + 3, y + 1, 2, 2);
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
    if (btn.trap.damage > 0 && btn.trap.slowAmount) {
      ctx.fillStyle = '#cc8888';
      ctx.fillText(`傷害:${btn.trap.damage}`, btn.x + btn.width / 2 - 20, btn.y + 62);
      ctx.fillStyle = C.TRAP_ICE;
      ctx.fillText('減速', btn.x + btn.width / 2 + 25, btn.y + 62);
    } else if (btn.trap.damage > 0) {
      ctx.fillStyle = '#cc8888';
      ctx.fillText(`傷害: ${btn.trap.damage}`, btn.x + btn.width / 2, btn.y + 62);
    } else if (btn.trap.slowAmount) {
      ctx.fillStyle = C.TRAP_ICE;
      ctx.fillText(`減速: ${Math.round(btn.trap.slowAmount * 100)}%`, btn.x + btn.width / 2, btn.y + 62);
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

  renderTooltip(ctx) {
    // Show placement hint when a trap is selected
    if (this.selectedTrap && !DK.Game.gameOver) {
      const C = DK.COLORS;
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
};
