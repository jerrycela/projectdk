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

    // Base fill - dark stone
    PA.rect(ctx, x, y, 16, 16, C.WALL_MID);

    // Stone brick pattern - 2 rows of bricks
    // Top row: 2 bricks
    const offset = variant % 2 === 0 ? 0 : 4;

    // Mortar lines (horizontal)
    PA.rect(ctx, x, y + 7, 16, 1, C.WALL_MORTAR);
    PA.rect(ctx, x, y + 15, 16, 1, C.WALL_MORTAR);

    // Mortar lines (vertical) - staggered
    PA.rect(ctx, x + 7 + offset, y, 1, 8, C.WALL_MORTAR);
    PA.rect(ctx, x + 7 - offset + 8, y + 8, 1, 7, C.WALL_MORTAR);

    // Brick shading - top-left highlight, bottom-right shadow
    // Top row bricks
    for (let bx = 0; bx < 2; bx++) {
      const brickX = x + bx * 8 + (bx === 0 ? 0 : offset);
      const brickW = bx === 0 ? 7 + offset : 16 - 7 - offset;

      // Highlight on top edge
      PA.rect(ctx, brickX, y, Math.min(brickW, 16 - brickX + x), 1, C.WALL_LIGHT);
      // Shadow on bottom edge
      PA.rect(ctx, brickX, y + 6, Math.min(brickW, 16 - brickX + x), 1, C.WALL_DARK);
    }

    // Bottom row bricks
    for (let bx = 0; bx < 2; bx++) {
      const brickX = x + bx * 8 + (bx === 0 ? 0 : 8 - offset);
      // Highlight
      PA.rect(ctx, brickX, y + 8, 7, 1, C.WALL_LIGHT);
      // Shadow
      PA.rect(ctx, brickX, y + 14, 7, 1, C.WALL_DARK);
    }

    // Random texture details
    for (let i = 0; i < 6; i++) {
      const px = x + Math.floor(rng() * 14) + 1;
      const py = y + Math.floor(rng() * 14) + 1;
      const shade = rng() > 0.5 ? C.WALL_DARK : C.WALL_HIGHLIGHT;
      PA.pixel(ctx, px, py, shade);
    }

    // Occasional moss
    if (variant === 2) {
      PA.pixel(ctx, x + 3, y + 5, C.WALL_MOSS);
      PA.pixel(ctx, x + 4, y + 5, C.WALL_MOSS);
      PA.pixel(ctx, x + 3, y + 6, '#1e3a1e');
    }
  },

  drawFloorTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 251 + 73);

    // Base fill - sandy/stone floor
    PA.rect(ctx, x, y, 16, 16, C.FLOOR_MID);

    // Flagstone pattern - larger irregular stones
    // Grid lines for flagstones
    const gx = variant % 2 === 0 ? 5 : 7;
    const gy = variant < 2 ? 5 : 8;

    // Subtle grid lines
    for (let i = 0; i < 16; i++) {
      if (i === gx || i === gx + 6) {
        for (let j = 0; j < 16; j++) {
          if (rng() > 0.3) PA.pixel(ctx, x + i, y + j, C.FLOOR_CRACK);
        }
      }
      if (i === gy || i === gy + 6) {
        for (let j = 0; j < 16; j++) {
          if (rng() > 0.3) PA.pixel(ctx, x + j, y + i, C.FLOOR_CRACK);
        }
      }
    }

    // Stone highlights
    PA.pixel(ctx, x + 2, y + 2, C.FLOOR_HIGHLIGHT);
    PA.pixel(ctx, x + 10, y + 3, C.FLOOR_HIGHLIGHT);
    PA.pixel(ctx, x + 4, y + 10, C.FLOOR_HIGHLIGHT);
    PA.pixel(ctx, x + 12, y + 11, C.FLOOR_HIGHLIGHT);

    // Random texture
    for (let i = 0; i < 8; i++) {
      const px = x + Math.floor(rng() * 14) + 1;
      const py = y + Math.floor(rng() * 14) + 1;
      PA.pixel(ctx, px, py, rng() > 0.5 ? C.FLOOR_DARK : C.FLOOR_LIGHT);
    }

    // Subtle directional pattern (tiny pebbles)
    if (variant === 1 || variant === 3) {
      PA.pixel(ctx, x + 7, y + 7, C.FLOOR_DARK);
      PA.pixel(ctx, x + 8, y + 8, C.FLOOR_DARK);
    }
  },

  drawEntranceTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    // Green entrance marker
    PA.rect(ctx, x + 2, y + 6, 2, 4, '#44aa44');
    PA.rect(ctx, x + 1, y + 7, 1, 2, '#44aa44');
    // Arrow pointing right
    PA.pixel(ctx, x + 4, y + 7, '#66cc66');
    PA.pixel(ctx, x + 4, y + 8, '#66cc66');
    PA.pixel(ctx, x + 5, y + 7, '#66cc66');
  },

  drawExitTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    // Red exit marker
    PA.rect(ctx, x + 12, y + 6, 2, 4, '#cc4444');
    PA.rect(ctx, x + 14, y + 7, 1, 2, '#cc4444');
    // Arrow pointing right
    PA.pixel(ctx, x + 11, y + 7, '#ff6666');
    PA.pixel(ctx, x + 11, y + 8, '#ff6666');
  },

  render(ctx) {
    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        const tile = this.layout[r][c];
        const x = c * DK.CONFIG.TILE_SIZE;
        const y = r * DK.CONFIG.TILE_SIZE;

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
