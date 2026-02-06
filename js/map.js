/**
 * Dungeon Keep - Map System
 * Handles dungeon layout, tile rendering, and pathfinding
 */
window.DK = window.DK || {};

DK.Map = {
  // Map layout: W=wall, .=path, E=entrance, X=exit
  layout: [
    'WWWWWWWWWWWWWWWWWWWW',
    'E.................WW',
    'WWWWWWWWWWWWWWWW..WW',
    'WW................WW',
    'WW..WWWWWWWWWWWWWWWW',
    'WW................WW',
    'WWWWWWWWWWWWWWWW..WW',
    'WW................WW',
    'WW..WWWWWWWWWWWWWWWW',
    'WW................WW',
    'WWWWWWWWWWWWWWWW..WW',
    'WW.................X',
    'WWWWWWWWWWWWWWWWWWWW',
  ],

  // Tile cache for performance
  tileCache: {},

  // Path waypoints (computed from layout)
  path: [],

  // Which tiles are adjacent to path (for wall traps)
  wallTrapSlots: [],

  // Which tiles are path (for floor traps)
  floorTrapSlots: [],

  init() {
    this.computePath();
    this.computeTrapSlots();
    this.prerenderTiles();
  },

  getTile(col, row) {
    if (row < 0 || row >= this.layout.length || col < 0 || col >= this.layout[0].length) {
      return 'W';
    }
    return this.layout[row][col];
  },

  isWall(col, row) {
    return this.getTile(col, row) === 'W';
  },

  isPath(col, row) {
    const t = this.getTile(col, row);
    return t === '.' || t === 'E' || t === 'X';
  },

  computePath() {
    // BFS to find path from E to X
    let start = null;
    let end = null;

    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        if (this.layout[r][c] === 'E') start = { col: c, row: r };
        if (this.layout[r][c] === 'X') end = { col: c, row: r };
      }
    }

    if (!start || !end) return;

    const visited = new Set();
    const queue = [[start]];
    visited.add(`${start.col},${start.row}`);

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.col === end.col && current.row === end.row) {
        // Convert to pixel positions (center of tiles)
        this.path = path.map(p => ({
          x: p.col * DK.CONFIG.TILE_SIZE + DK.CONFIG.TILE_SIZE / 2,
          y: p.row * DK.CONFIG.TILE_SIZE + DK.CONFIG.TILE_SIZE / 2,
          col: p.col,
          row: p.row,
        }));
        return;
      }

      for (const [dc, dr] of dirs) {
        const nc = current.col + dc;
        const nr = current.row + dr;
        const key = `${nc},${nr}`;

        if (!visited.has(key) && this.isPath(nc, nr)) {
          visited.add(key);
          queue.push([...path, { col: nc, row: nr }]);
        }
      }
    }
  },

  computeTrapSlots() {
    this.wallTrapSlots = [];
    this.floorTrapSlots = [];

    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        if (this.isWall(c, r)) {
          // Check if adjacent to path (wall trap slot)
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          let adjacentToPath = false;
          let facing = null;

          for (const [dc, dr] of dirs) {
            if (this.isPath(c + dc, r + dr)) {
              adjacentToPath = true;
              facing = { dc, dr };
              break;
            }
          }

          if (adjacentToPath) {
            this.wallTrapSlots.push({ col: c, row: r, facing });
          }
        } else if (this.isPath(c, r) && this.layout[r][c] !== 'E' && this.layout[r][c] !== 'X') {
          // Floor trap slot
          this.floorTrapSlots.push({ col: c, row: r });
        }
      }
    }
  },

  prerenderTiles() {
    // Pre-render wall and floor tile variations
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const T = DK.CONFIG.TILE_SIZE;

    // Create wall tile variations
    for (let v = 0; v < 4; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawWallTile(ctx, 0, 0, v);
      this.tileCache[`wall_${v}`] = canvas;
    }

    // Create floor tile variations
    for (let v = 0; v < 4; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawFloorTile(ctx, 0, 0, v);
      this.tileCache[`floor_${v}`] = canvas;
    }

    // Entrance and exit tiles
    const entranceCanvas = document.createElement('canvas');
    entranceCanvas.width = T;
    entranceCanvas.height = T;
    const ectx = entranceCanvas.getContext('2d');
    this.drawEntranceTile(ectx, 0, 0);
    this.tileCache['entrance'] = entranceCanvas;

    const exitCanvas = document.createElement('canvas');
    exitCanvas.width = T;
    exitCanvas.height = T;
    const xctx = exitCanvas.getContext('2d');
    this.drawExitTile(xctx, 0, 0);
    this.tileCache['exit'] = exitCanvas;
  },

  drawWallTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 137 + 42);

    // === DARK STONE BRICK WALL ===
    // Very distinct from floor: deep purple-grey stone bricks with clear mortar
    PA.rect(ctx, x, y, 16, 16, C.WALL_DARK);

    // Brick layout: 3 rows of staggered bricks
    const brickRows = [
      { y: 0, h: 5, offsets: variant % 2 === 0 ? [0, 6, 12] : [0, 8] },
      { y: 6, h: 4, offsets: variant % 2 === 0 ? [0, 8] : [0, 5, 11] },
      { y: 11, h: 5, offsets: variant % 2 === 0 ? [0, 6, 12] : [0, 8] },
    ];

    // Draw mortar grid first (dark lines between bricks)
    PA.rect(ctx, x, y + 5, 16, 1, C.WALL_MORTAR);
    PA.rect(ctx, x, y + 10, 16, 1, C.WALL_MORTAR);

    // Draw each brick row
    for (const row of brickRows) {
      for (let i = 0; i < row.offsets.length; i++) {
        const bx = x + row.offsets[i];
        const bw = (i < row.offsets.length - 1)
          ? row.offsets[i + 1] - row.offsets[i] - 1
          : 16 - row.offsets[i];
        const by = y + row.y;

        // Brick body - vary color per brick
        const brickShade = rng() > 0.5 ? C.WALL_MID : C.WALL_LIGHT;
        PA.rect(ctx, bx, by, bw, row.h, brickShade);

        // Top-left highlight (light catches top edge)
        PA.rect(ctx, bx, by, bw, 1, C.WALL_HIGHLIGHT);
        PA.rect(ctx, bx, by, 1, row.h, PA.lighten(brickShade, 12));

        // Bottom-right shadow
        PA.rect(ctx, bx, by + row.h - 1, bw, 1, C.WALL_DARK);
        PA.rect(ctx, bx + bw - 1, by, 1, row.h, C.WALL_DARK);

        // Vertical mortar between bricks
        if (i < row.offsets.length - 1) {
          PA.rect(ctx, bx + bw, by, 1, row.h, C.WALL_MORTAR);
        }

        // Texture noise on brick face
        for (let t = 0; t < 3; t++) {
          const tx = bx + 1 + Math.floor(rng() * Math.max(1, bw - 2));
          const ty = by + 1 + Math.floor(rng() * Math.max(1, row.h - 2));
          PA.pixel(ctx, tx, ty, rng() > 0.5 ? C.WALL_DARK : C.WALL_HIGHLIGHT);
        }
      }
    }

    // Moss / cracks (variant-dependent character)
    if (variant === 2) {
      // Moss growing in mortar
      PA.pixel(ctx, x + 2, y + 5, C.WALL_MOSS);
      PA.pixel(ctx, x + 3, y + 5, C.WALL_MOSS);
      PA.pixel(ctx, x + 3, y + 4, '#2a5a2a');
      PA.pixel(ctx, x + 11, y + 10, C.WALL_MOSS);
      PA.pixel(ctx, x + 12, y + 10, '#1e3a1e');
    }
    if (variant === 3) {
      // Crack in brick
      PA.pixel(ctx, x + 9, y + 2, C.WALL_MORTAR);
      PA.pixel(ctx, x + 10, y + 3, C.WALL_MORTAR);
      PA.pixel(ctx, x + 10, y + 4, C.WALL_MORTAR);
    }

    // Subtle dark vignette at edges (depth cue)
    PA.pixel(ctx, x, y, C.WALL_MORTAR);
    PA.pixel(ctx, x + 15, y, C.WALL_MORTAR);
    PA.pixel(ctx, x, y + 15, C.WALL_MORTAR);
    PA.pixel(ctx, x + 15, y + 15, C.WALL_MORTAR);
  },

  drawFloorTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 251 + 73);

    // === WARM SANDSTONE FLOOR ===
    // Very distinct from walls: warm brown/tan with clear flagstone pattern
    PA.rect(ctx, x, y, 16, 16, C.FLOOR_MID);

    // Large flagstone pattern (2x2 grid of stones with gaps)
    const stones = [
      { sx: 0, sy: 0, sw: 7, sh: 7 },
      { sx: 8, sy: 0, sw: 8, sh: 7 },
      { sx: 0, sy: 8, sw: 8, sh: 8 },
      { sx: 9, sy: 8, sw: 7, sh: 8 },
    ];

    if (variant === 1) {
      // Alternate pattern
      stones[0] = { sx: 0, sy: 0, sw: 9, sh: 8 };
      stones[1] = { sx: 10, sy: 0, sw: 6, sh: 6 };
      stones[2] = { sx: 0, sy: 9, sw: 6, sh: 7 };
      stones[3] = { sx: 7, sy: 7, sw: 9, sh: 9 };
    } else if (variant === 2) {
      stones[0] = { sx: 0, sy: 0, sw: 10, sh: 6 };
      stones[1] = { sx: 11, sy: 0, sw: 5, sh: 8 };
      stones[2] = { sx: 0, sy: 7, sw: 7, sh: 9 };
      stones[3] = { sx: 8, sy: 9, sw: 8, sh: 7 };
    }

    // Draw each flagstone
    for (const stone of stones) {
      const sx = x + stone.sx;
      const sy = y + stone.sy;
      const shade = rng() > 0.5 ? C.FLOOR_MID : C.FLOOR_LIGHT;

      // Stone body
      PA.rect(ctx, sx, sy, stone.sw, stone.sh, shade);

      // Top-left highlight (warm light from above)
      PA.rect(ctx, sx, sy, stone.sw, 1, C.FLOOR_HIGHLIGHT);
      PA.rect(ctx, sx, sy, 1, stone.sh, C.FLOOR_HIGHLIGHT);

      // Bottom-right shadow
      PA.rect(ctx, sx, sy + stone.sh - 1, stone.sw, 1, C.FLOOR_DARK);
      PA.rect(ctx, sx + stone.sw - 1, sy, 1, stone.sh, C.FLOOR_DARK);

      // Interior texture (tiny pebbles and grain)
      for (let t = 0; t < 4; t++) {
        const tx = sx + 1 + Math.floor(rng() * Math.max(1, stone.sw - 3));
        const ty = sy + 1 + Math.floor(rng() * Math.max(1, stone.sh - 3));
        PA.pixel(ctx, tx, ty, rng() > 0.6 ? C.FLOOR_LIGHT : C.FLOOR_DARK);
      }

      // Warm highlight spot (light reflection)
      const hx = sx + 1 + Math.floor(rng() * Math.max(1, stone.sw - 3));
      const hy = sy + 1 + Math.floor(rng() * Math.max(1, stone.sh - 3));
      PA.pixel(ctx, hx, hy, '#9a9080');
    }

    // Mortar/gap between stones (dark cracks)
    // Horizontal gap
    const gy = variant < 2 ? 7 : 8;
    for (let i = 0; i < 16; i++) {
      PA.pixel(ctx, x + i, y + gy, C.FLOOR_CRACK);
    }
    // Vertical gap
    const gx = variant % 2 === 0 ? 7 : 9;
    for (let i = 0; i < gy; i++) {
      PA.pixel(ctx, x + gx, y + i, C.FLOOR_CRACK);
    }
    const gx2 = variant % 2 === 0 ? 8 : 7;
    for (let i = gy + 1; i < 16; i++) {
      PA.pixel(ctx, x + gx2, y + i, C.FLOOR_CRACK);
    }

    // Scattered dust / sand particles
    if (variant === 1 || variant === 3) {
      PA.pixel(ctx, x + 3, y + 12, '#8a8070');
      PA.pixel(ctx, x + 12, y + 4, '#7a7060');
    }
  },

  drawEntranceTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);

    // Green glowing entrance portal
    PA.rect(ctx, x + 1, y + 4, 4, 8, '#22662a');
    PA.rect(ctx, x + 2, y + 5, 2, 6, '#44aa44');
    // Glow effect
    PA.pixel(ctx, x + 2, y + 4, '#66cc66');
    PA.pixel(ctx, x + 3, y + 4, '#66cc66');
    PA.pixel(ctx, x + 2, y + 11, '#66cc66');
    PA.pixel(ctx, x + 3, y + 11, '#66cc66');
    // Arrow indicator pointing right
    PA.pixel(ctx, x + 5, y + 7, '#88ee88');
    PA.pixel(ctx, x + 5, y + 8, '#88ee88');
    PA.pixel(ctx, x + 6, y + 8, '#66cc66');
    // Bright center
    PA.pixel(ctx, x + 2, y + 7, '#aaffaa');
    PA.pixel(ctx, x + 3, y + 8, '#aaffaa');
  },

  drawExitTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);

    // Red glowing exit portal
    PA.rect(ctx, x + 11, y + 4, 4, 8, '#662222');
    PA.rect(ctx, x + 12, y + 5, 2, 6, '#cc4444');
    // Glow effect
    PA.pixel(ctx, x + 12, y + 4, '#ff6666');
    PA.pixel(ctx, x + 13, y + 4, '#ff6666');
    PA.pixel(ctx, x + 12, y + 11, '#ff6666');
    PA.pixel(ctx, x + 13, y + 11, '#ff6666');
    // Arrow indicator
    PA.pixel(ctx, x + 10, y + 7, '#ff8888');
    PA.pixel(ctx, x + 10, y + 8, '#ff8888');
    // Bright center
    PA.pixel(ctx, x + 12, y + 7, '#ffaaaa');
    PA.pixel(ctx, x + 13, y + 8, '#ffaaaa');
    // Warning symbol
    PA.pixel(ctx, x + 7, y + 7, '#ff4444');
    PA.pixel(ctx, x + 8, y + 7, '#ff4444');
    PA.pixel(ctx, x + 7, y + 8, '#ff4444');
    PA.pixel(ctx, x + 8, y + 8, '#ff4444');
  },

  render(ctx) {
    const PA = DK.PixelArt;
    const T = DK.CONFIG.TILE_SIZE;

    // First pass: draw all tiles
    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        const tile = this.layout[r][c];
        const x = c * T;
        const y = r * T;

        if (tile === 'W') {
          const variant = (c * 7 + r * 13) % 4;
          ctx.drawImage(this.tileCache[`wall_${variant}`], x, y);
        } else if (tile === 'E') {
          ctx.drawImage(this.tileCache['entrance'], x, y);
        } else if (tile === 'X') {
          ctx.drawImage(this.tileCache['exit'], x, y);
        } else {
          const variant = (c * 11 + r * 17) % 4;
          ctx.drawImage(this.tileCache[`floor_${variant}`], x, y);
        }
      }
    }

    // Second pass: draw wall shadows on adjacent floor tiles (depth effect)
    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        if (!this.isPath(c, r)) continue;
        const x = c * T;
        const y = r * T;

        // Shadow from wall above
        if (this.isWall(c, r - 1)) {
          PA.rect(ctx, x, y, T, 2, 'rgba(10,8,20,0.4)');
          PA.rect(ctx, x, y, T, 1, 'rgba(10,8,20,0.3)');
        }
        // Shadow from wall to the left
        if (this.isWall(c - 1, r)) {
          PA.rect(ctx, x, y, 2, T, 'rgba(10,8,20,0.3)');
          PA.rect(ctx, x, y, 1, T, 'rgba(10,8,20,0.2)');
        }
        // Light edge from wall below (slight highlight)
        if (this.isWall(c, r + 1)) {
          PA.rect(ctx, x, y + T - 1, T, 1, 'rgba(100,90,70,0.15)');
        }
        // Light edge from wall to the right
        if (this.isWall(c + 1, r)) {
          PA.rect(ctx, x + T - 1, y, 1, T, 'rgba(100,90,70,0.1)');
        }
      }
    }
  },

  /**
   * Check if a wall tile is a valid wall trap placement
   */
  isValidWallTrapSlot(col, row) {
    return this.wallTrapSlots.some(s => s.col === col && s.row === row);
  },

  /**
   * Check if a floor tile is a valid floor trap placement
   */
  isValidFloorTrapSlot(col, row) {
    return this.floorTrapSlots.some(s => s.col === col && s.row === row);
  },

  /**
   * Get wall trap facing direction
   */
  getWallFacing(col, row) {
    const slot = this.wallTrapSlots.find(s => s.col === col && s.row === row);
    return slot ? slot.facing : null;
  },
};
