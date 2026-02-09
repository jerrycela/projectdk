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

  /**
   * Draw decorations (floor, objects, and wall decorations)
   * @param {string} type - Decoration type (crack_small, moss, water_puddle, bloodstain, rock_medium, bone_pile, wall_moss, chain)
   * @param {number} variant - Variant number (0 or 1) for variation
   * @param {number} x - X position in pixels
   * @param {number} y - Y position in pixels
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  drawDecoration(type, variant, x, y, ctx) {
    const C = DK.COLORS;

    // Layer 1: Floor decorations (with transparency)
    if (type === 'crack_small') {
      ctx.globalAlpha = 0.6;
      const darkColor = C.FLOOR_CRACK;

      if (variant === 0) {
        // Variant 0: Diagonal crack
        ctx.fillStyle = darkColor;
        ctx.fillRect(x + 2, y + 1, 1, 1);
        ctx.fillRect(x + 3, y + 2, 1, 1);
        ctx.fillRect(x + 3, y + 3, 1, 1);
        ctx.fillRect(x + 4, y + 4, 1, 1);
      } else {
        // Variant 1: Horizontal crack
        ctx.fillStyle = darkColor;
        ctx.fillRect(x + 1, y + 3, 1, 1);
        ctx.fillRect(x + 2, y + 3, 2, 1);
        ctx.fillRect(x + 4, y + 4, 1, 1);
      }
      ctx.globalAlpha = 1.0;
    }

    else if (type === 'moss') {
      ctx.globalAlpha = 0.6;
      const mossColor = C.WALL_MOSS;
      const mossDark = this.darken(C.WALL_MOSS, 20);

      if (variant === 0) {
        // Variant 0: Scattered moss spots
        ctx.fillStyle = mossColor;
        ctx.fillRect(x + 1, y + 1, 2, 2);
        ctx.fillRect(x + 4, y + 2, 2, 2);
        ctx.fillStyle = mossDark;
        ctx.fillRect(x + 2, y + 4, 2, 1);
      } else {
        // Variant 1: Clustered moss
        ctx.fillStyle = mossColor;
        ctx.fillRect(x + 2, y + 1, 3, 2);
        ctx.fillRect(x + 1, y + 3, 2, 2);
        ctx.fillStyle = mossDark;
        ctx.fillRect(x + 4, y + 3, 2, 2);
      }
      ctx.globalAlpha = 1.0;
    }

    else if (type === 'water_puddle') {
      ctx.globalAlpha = 0.6;
      const waterColor = 'rgba(68, 136, 255, 0.5)'; // ELEMENT_WATER with alpha
      const waterLight = 'rgba(102, 170, 255, 0.3)'; // ELEMENT_WATER_LIGHT with alpha

      if (variant === 0) {
        // Variant 0: Round puddle
        ctx.fillStyle = waterColor;
        ctx.fillRect(x + 2, y + 2, 4, 3);
        ctx.fillRect(x + 1, y + 3, 6, 1);
        ctx.fillStyle = waterLight;
        ctx.fillRect(x + 3, y + 2, 2, 1);
      } else {
        // Variant 1: Elongated puddle
        ctx.fillStyle = waterColor;
        ctx.fillRect(x + 1, y + 2, 6, 3);
        ctx.fillRect(x + 2, y + 5, 4, 1);
        ctx.fillStyle = waterLight;
        ctx.fillRect(x + 2, y + 2, 3, 1);
      }
      ctx.globalAlpha = 1.0;
    }

    else if (type === 'bloodstain') {
      ctx.globalAlpha = 0.6;
      const bloodColor = '#661111';
      const bloodDark = '#440808';

      if (variant === 0) {
        // Variant 0: Splatter pattern
        ctx.fillStyle = bloodColor;
        ctx.fillRect(x + 2, y + 2, 3, 3);
        ctx.fillRect(x + 1, y + 3, 1, 1);
        ctx.fillRect(x + 5, y + 2, 1, 1);
        ctx.fillStyle = bloodDark;
        ctx.fillRect(x + 3, y + 3, 1, 1);
      } else {
        // Variant 1: Drip pattern
        ctx.fillStyle = bloodColor;
        ctx.fillRect(x + 2, y + 1, 4, 2);
        ctx.fillRect(x + 3, y + 3, 2, 3);
        ctx.fillRect(x + 2, y + 6, 1, 1);
        ctx.fillStyle = bloodDark;
        ctx.fillRect(x + 3, y + 4, 1, 1);
      }
      ctx.globalAlpha = 1.0;
    }

    // Layer 2: Small objects (opaque)
    else if (type === 'rock_medium') {
      const rockColor = '#5a5a6e';
      const rockDark = '#3a3a4a';
      const rockLight = '#7a7a8e';

      if (variant === 0) {
        // Variant 0: Round rock
        ctx.fillStyle = rockColor;
        ctx.fillRect(x + 1, y + 2, 5, 4);
        ctx.fillRect(x + 2, y + 1, 3, 1);
        ctx.fillRect(x + 2, y + 6, 3, 1);
        ctx.fillStyle = rockDark;
        ctx.fillRect(x + 1, y + 4, 2, 2);
        ctx.fillStyle = rockLight;
        ctx.fillRect(x + 3, y + 2, 2, 2);
      } else {
        // Variant 1: Angular rock
        ctx.fillStyle = rockColor;
        ctx.fillRect(x + 2, y + 1, 4, 5);
        ctx.fillRect(x + 1, y + 3, 1, 2);
        ctx.fillRect(x + 6, y + 2, 1, 3);
        ctx.fillStyle = rockDark;
        ctx.fillRect(x + 2, y + 4, 2, 2);
        ctx.fillStyle = rockLight;
        ctx.fillRect(x + 4, y + 1, 2, 2);
      }
    }

    else if (type === 'bone_pile') {
      const boneColor = '#e8d8c0';
      const boneDark = '#a89878';

      if (variant === 0) {
        // Variant 0: Crossed bones
        ctx.fillStyle = boneColor;
        ctx.fillRect(x + 1, y + 3, 6, 1);
        ctx.fillRect(x + 3, y + 1, 1, 6);
        ctx.fillRect(x, y + 3, 1, 1);
        ctx.fillRect(x + 7, y + 3, 1, 1);
        ctx.fillRect(x + 3, y, 1, 1);
        ctx.fillRect(x + 3, y + 7, 1, 1);
        ctx.fillStyle = boneDark;
        ctx.fillRect(x + 3, y + 3, 1, 1);
      } else {
        // Variant 1: Pile of bones
        ctx.fillStyle = boneColor;
        ctx.fillRect(x + 1, y + 2, 5, 2);
        ctx.fillRect(x + 2, y + 4, 4, 2);
        ctx.fillRect(x + 1, y + 6, 3, 1);
        ctx.fillStyle = boneDark;
        ctx.fillRect(x + 2, y + 3, 1, 1);
        ctx.fillRect(x + 4, y + 5, 1, 1);
      }
    }

    // Layer 3: Wall decorations
    else if (type === 'wall_moss') {
      const mossColor = C.WALL_MOSS;
      const mossDark = this.darken(C.WALL_MOSS, 30);
      const mossLight = this.lighten(C.WALL_MOSS, 20);

      if (variant === 0) {
        // Variant 0: Dripping moss
        ctx.fillStyle = mossColor;
        ctx.fillRect(x + 2, y, 4, 2);
        ctx.fillRect(x + 3, y + 2, 2, 3);
        ctx.fillRect(x + 4, y + 5, 1, 1);
        ctx.fillStyle = mossDark;
        ctx.fillRect(x + 3, y + 4, 1, 1);
        ctx.fillStyle = mossLight;
        ctx.fillRect(x + 2, y, 2, 1);
      } else {
        // Variant 1: Spreading moss
        ctx.fillStyle = mossColor;
        ctx.fillRect(x + 1, y + 1, 5, 3);
        ctx.fillRect(x, y + 2, 1, 1);
        ctx.fillRect(x + 6, y + 2, 1, 1);
        ctx.fillRect(x + 2, y + 4, 3, 1);
        ctx.fillStyle = mossDark;
        ctx.fillRect(x + 2, y + 3, 2, 1);
        ctx.fillStyle = mossLight;
        ctx.fillRect(x + 1, y + 1, 3, 1);
      }
    }

    else if (type === 'chain') {
      const chainColor = '#5a5a6e';
      const chainDark = '#3a3a4a';

      if (variant === 0) {
        // Variant 0: Vertical chain
        ctx.fillStyle = chainColor;
        for (let i = 0; i < 5; i++) {
          ctx.fillRect(x + 3, y + i * 2, 2, 1);
        }
        ctx.fillStyle = chainDark;
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x + 4, y + i * 2 + 1, 1, 1);
        }
      } else {
        // Variant 1: Hanging chain with hook
        ctx.fillStyle = chainColor;
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(x + 3, y + i * 2, 2, 1);
        }
        // Hook at bottom
        ctx.fillRect(x + 2, y + 8, 4, 1);
        ctx.fillRect(x + 2, y + 9, 1, 1);
        ctx.fillRect(x + 5, y + 9, 1, 1);
        ctx.fillStyle = chainDark;
        ctx.fillRect(x + 4, y + 8, 1, 1);
      }
    }
  },
};
