/**
 * Dungeon Keep - Utility Functions
 * 色彩工具、繪圖工具、緩動函式、動畫工具
 */

// ========================================
// 色彩工具函式（Color Utilities）
// ========================================
DK.ColorUtils = {
  /**
   * 將 hex 轉為 RGB 物件
   * @param {string} hex - 十六進位色碼 (如 '#ff0000')
   * @returns {{r: number, g: number, b: number}|null}
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  },

  /**
   * 將 RGB 物件轉為 hex
   * @param {number} r - 紅色 (0-255)
   * @param {number} g - 綠色 (0-255)
   * @param {number} b - 藍色 (0-255)
   * @returns {string} - 十六進位色碼
   */
  rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  },

  /**
   * 調整顏色亮度
   * @param {string} color - 十六進位色碼
   * @param {number} percent - 調整百分比 (-100 到 100)
   * @returns {string} - 調整後的十六進位色碼
   */
  adjustBrightness(color, percent) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const adjust = (value) => {
      const adjusted = value + (value * percent / 100);
      return Math.max(0, Math.min(255, Math.round(adjusted)));
    };

    return this.rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
  },

  /**
   * 取得相對亮度（WCAG 標準）
   * @param {string} color - 十六進位色碼
   * @returns {number} - 相對亮度 (0-1)
   */
  getLuminance(color) {
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  },

  /**
   * 計算對比度（WCAG 標準）
   * @param {string} color1 - 第一個顏色
   * @param {string} color2 - 第二個顏色
   * @returns {number} - 對比度 (1-21)
   */
  getContrastRatio(color1, color2) {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },

  /**
   * 檢查對比度是否符合 WCAG AA 標準
   * @param {string} foreground - 前景色
   * @param {string} background - 背景色
   * @returns {{pass: boolean, ratio: string, level: string}}
   */
  checkContrast(foreground, background) {
    const ratio = this.getContrastRatio(foreground, background);
    return {
      pass: ratio >= 4.5,
      ratio: ratio.toFixed(2),
      level: ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : 'Fail',
    };
  },

  /**
   * 取得對比色（黑或白）
   * @param {string} color - 十六進位色碼
   * @returns {string} - '#000000' 或 '#ffffff'
   */
  getContrastColor(color) {
    const luminance = this.getLuminance(color);
    return luminance > 0.5 ? '#000000' : '#ffffff';
  },

  /**
   * 混合兩個顏色
   * @param {string} color1 - 第一個顏色
   * @param {string} color2 - 第二個顏色
   * @param {number} ratio - 混合比例 (0-1, 0=全部color1, 1=全部color2)
   * @returns {string} - 混合後的顏色
   */
  mixColors(color1, color2, ratio = 0.5) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    if (!rgb1 || !rgb2) return color1;

    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

    return this.rgbToHex(r, g, b);
  },

  /**
   * Alpha 值轉十六進位（帶補零）
   * @param {number} alpha - Alpha 值 (0-255)
   * @returns {string} - 十六進位字串（如 '4d'）
   */
  alphaToHex(alpha) {
    return Math.floor(alpha).toString(16).padStart(2, '0');
  },

  /**
   * 顏色 + Alpha 值合併為帶透明度的十六進位色碼
   * @param {string} color - 十六進位色碼（如 '#ff0000'）
   * @param {number} alpha - Alpha 值 (0-255)
   * @returns {string} - 帶透明度的色碼（如 '#ff00004d'）
   */
  withAlpha(color, alpha) {
    return color + this.alphaToHex(alpha);
  },
};

// ========================================
// 繪圖工具函式庫（Drawing Utilities）
// ========================================
// 抽離重複的繪圖邏輯，提升程式碼可維護性
DK.DrawUtils = {
  /**
   * 繪製等距菱形地磚（四邊形）
   */
  drawIsometricTile(ctx, x, y, width, height, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width / 2, y + height / 2);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x - width / 2, y + height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  /**
   * 繪製等距矩形（帶頂面和側面）
   */
  drawIsometricRect(ctx, x, y, width, height, baseColor, options = {}) {
    const { showTop = true, showLeft = true, showRight = true } = options;
    const PA = DK.PixelArt;
    const ISO = PA.Isometric;

    const topColor = ISO.topLight(baseColor);
    const sideColor = ISO.sideDark(baseColor);
    const lightColor = PA.lighten(baseColor, 10);

    if (showTop) {
      PA.rect(ctx, x, y, width, 1, topColor);
    }
    if (showLeft) {
      PA.rect(ctx, x, y + 1, 1, height - 1, sideColor);
    }
    PA.rect(ctx, x + 1, y + 1, width - 2, height - 1, baseColor);
    if (showRight) {
      PA.rect(ctx, x + width - 1, y + 1, 1, height - 1, lightColor);
    }
  },

  /**
   * 繪製像素風格邊框（單像素）
   */
  drawPixelBorder(ctx, x, y, width, height, color) {
    const PA = DK.PixelArt;
    PA.rect(ctx, x, y, width, 1, color);
    PA.rect(ctx, x, y + height - 1, width, 1, color);
    PA.rect(ctx, x, y + 1, 1, height - 2, color);
    PA.rect(ctx, x + width - 1, y + 1, 1, height - 2, color);
  },

  /**
   * 繪製帶陰影的矩形（上下左右四邊陰影）
   */
  drawShadowedRect(ctx, x, y, width, height, baseColor, shadowAmount = 20) {
    const PA = DK.PixelArt;
    PA.rect(ctx, x, y, width, height, baseColor);
    const shadowColor = PA.darken(baseColor, shadowAmount);
    PA.rect(ctx, x, y, width, 1, shadowColor);
    PA.rect(ctx, x, y + height - 1, width, 1, shadowColor);
    PA.rect(ctx, x, y, 1, height, shadowColor);
    PA.rect(ctx, x + width - 1, y, 1, height, shadowColor);
  },
};

// ========================================
// 緩動函式庫（Easing Functions）
// ========================================
// 消除線性 Math.sin 動畫的機械感，提供自然流暢的緩動曲線
// 基於 Robert Penner's Easing Functions 與現代 CSS easing 標準

DK.Easing = {
  // Linear
  linear: (t) => t,

  // Quadratic
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  // Cubic
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quartic
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Sine
  easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Exponential
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },

  // Elastic
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 :
      -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeInOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0 ? 0 : t === 1 ? 1 : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Bounce
  easeOutBounce: (t) => {
    const n1 = 7.5625, d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInBounce: (t) => 1 - DK.Easing.easeOutBounce(1 - t),
  easeInOutBounce: (t) => t < 0.5
    ? (1 - DK.Easing.easeOutBounce(1 - 2 * t)) / 2
    : (1 + DK.Easing.easeOutBounce(2 * t - 1)) / 2,

  // Back
  easeOutBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158, c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Circ
  easeInCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t) => t < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
};

// ========================================
// 動畫工具函式（Animation Utilities）
// ========================================
DK.AnimationUtils = {
  lerp: (start, end, t) => start + (end - start) * t,

  easedLerp: (start, end, t, easingFn = DK.Easing.easeInOutQuad) => {
    return DK.AnimationUtils.lerp(start, end, easingFn(t));
  },

  pingPong: (t) => {
    t = t % 2;
    return t > 1 ? 2 - t : t;
  },

  easedPingPong: (t, easingFn = DK.Easing.easeInOutSine) => {
    return easingFn(DK.AnimationUtils.pingPong(t));
  },

  smoothStep: (edge0, edge1, x) => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  },

  smootherStep: (edge0, edge1, x) => {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * t * (t * (t * 6 - 15) + 10);
  },

  normalize: (elapsed, duration) => {
    return Math.max(0, Math.min(1, elapsed / duration));
  },

  pulse: (time, period = 1000, min = 0, max = 1, easingFn = DK.Easing.easeInOutSine) => {
    const t = (time % period) / period;
    const eased = DK.AnimationUtils.easedPingPong(t * 2, easingFn);
    return min + (max - min) * eased;
  },

  wave: (time, period, phase = 0, amplitude = 1) => {
    const t = ((time / period) + phase) % 1;
    return (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2 * amplitude * 2 - amplitude;
  },
};
