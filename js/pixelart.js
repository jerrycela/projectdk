/**
 * Dungeon Keep - Pixel Art Drawing Utilities
 * Provides functions to draw pixel art sprites on canvas
 */
window.DK = window.DK || {};

DK.PixelArt = {
  /**
   * Draw a single pixel on the game (low-res) canvas
   */
  pixel(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  },

  /**
   * Draw a rectangle of pixels
   */
  rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  },

  /**
   * Draw pixels from a 2D pattern array
   * Pattern is an array of strings where each char maps to a color
   * '.' = transparent
   */
  drawSprite(ctx, x, y, pattern, colorMap) {
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        const ch = pattern[row][col];
        if (ch !== '.' && ch !== ' ' && colorMap[ch]) {
          ctx.fillStyle = colorMap[ch];
          ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }
  },

  /**
   * Draw a circle (in pixel art style)
   */
  circle(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
        }
      }
    }
  },

  /**
   * Draw a line (Bresenham's)
   */
  line(ctx, x0, y0, x1, y1, color) {
    ctx.fillStyle = color;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  },

  /**
   * Create a seeded random number for consistent tile variation
   */
  seededRandom(seed) {
    let s = seed;
    return function() {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  },

  /**
   * Lighten a hex color
   */
  lighten(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    let r = Math.min(255, ((num >> 16) & 0xFF) + amount);
    let g = Math.min(255, ((num >> 8) & 0xFF) + amount);
    let b = Math.min(255, (num & 0xFF) + amount);
    return `rgb(${r},${g},${b})`;
  },

  /**
   * Darken a hex color
   */
  darken(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    let r = Math.max(0, ((num >> 16) & 0xFF) - amount);
    let g = Math.max(0, ((num >> 8) & 0xFF) - amount);
    let b = Math.max(0, (num & 0xFF) - amount);
    return `rgb(${r},${g},${b})`;
  },

  /**
   * Mix two hex colors
   */
  mix(hex1, hex2, t) {
    const n1 = parseInt(hex1.slice(1), 16);
    const n2 = parseInt(hex2.slice(1), 16);
    const r = Math.round(((n1 >> 16) & 0xFF) * (1 - t) + ((n2 >> 16) & 0xFF) * t);
    const g = Math.round(((n1 >> 8) & 0xFF) * (1 - t) + ((n2 >> 8) & 0xFF) * t);
    const b = Math.round((n1 & 0xFF) * (1 - t) + (n2 & 0xFF) * t);
    return `rgb(${r},${g},${b})`;
  },
};
