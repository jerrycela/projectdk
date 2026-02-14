/**
 * Dungeon Keep - UI Core
 * 核心 UI 管理：狀態管理、初始化、選擇清除
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

    // 教學系統渲染
    if (DK.Tutorial) {
      DK.Tutorial.render(ctx);
    }

    // 錯誤提示系統渲染（就近原則）
    this.ErrorNotification.render(ctx);
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
    }
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
};
