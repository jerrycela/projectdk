/**
 * Dungeon Keep - 地圖系統
 * 管理地城佈局、地磚渲染、尋路與地形狀態
 */
window.DK = window.DK || {};

DK.Map = {
  // 火把位置（牆壁格上的環境光源）- 24 個均勻分布在 40×26 地圖
  torches: [
    { col: 13, row: 0 },
    { col: 30, row: 0 },
    { col: 38, row: 2 },
    { col: 20, row: 4 },
    { col: 20, row: 5 },
    { col: 10, row: 6 },
    { col: 32, row: 6 },
    { col: 3, row: 8 },
    { col: 13, row: 8 },
    { col: 4, row: 10 },
    { col: 17, row: 10 },
    { col: 16, row: 12 },
    { col: 35, row: 12 },
    { col: 3, row: 14 },
    { col: 29, row: 14 },
    { col: 20, row: 16 },
    { col: 20, row: 17 },
    { col: 10, row: 18 },
    { col: 32, row: 18 },
    { col: 3, row: 20 },
    { col: 13, row: 20 },
    { col: 17, row: 22 },
    { col: 30, row: 22 },
    { col: 37, row: 24 },
  ],

  // 地圖佈局: W=牆壁, .=路徑, E=入口, X=出口, A=深淵, P=水潭, G=草叢
  // 40×26 格（每行精確 40 字元）
  layout: [
    'WWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWW', // row 0
    'E.PP..GGG......PP...GGG.......PP..GG..WW', // row 1
    'WWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWWAWWW.WW', // row 2
    'WWWWWWWWWWWWWWWWWWWWW....PP.GGG..PP...WW', // row 3
    'WWWWWAWWWWWWAWWWWWWWW.WWWWWWAWWWWWWAWWWW', // row 4
    'WWWWWWWWWWWWWWWWWWWWW....PP.GGG..PP...WW', // row 5
    'WWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWWAWWW.WW', // row 6
    'WW....PP..GGG..PP...GGG..PP...GGG.....WW', // row 7
    'WW.WWAWWWWWWAWWWWWWWWWWWWWAWWWWWWAWWWWWW', // row 8
    'WW....PP..GGG..PP..WWWWWWWWWWWWWWWWWWWWW', // row 9
    'WWWWWAWWWWWWAWWWWW.WWWWWWWAWWWWWWAWWWWWW', // row 10
    'WW....PP..GGG..PP..WWWWWWWWWWWWWWWWWWWWW', // row 11
    'WW.WWAWWWWWWAWWWWWWWWWWWWWAWWWWWWAWWWWWW', // row 12
    'WW....GGG.PP...GGG..PP......GGG..PP...WW', // row 13
    'WWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWWAWWW.WW', // row 14
    'WWWWWWWWWWWWWWWWWWWWW....PP.GGG..PP...WW', // row 15
    'WWWWWAWWWWWWAWWWWWWWW.WWWWWWAWWWWWWAWWWW', // row 16
    'WWWWWWWWWWWWWWWWWWWWW....PP.GGG..PP...WW', // row 17
    'WWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWWAWWW.WW', // row 18
    'WW....PP..GGG..PP...GGG..PP...GGG.....WW', // row 19
    'WW.WWAWWWWWWAWWWWWWWWWWWWWAWWWWWWAWWWWWW', // row 20
    'WW....PP..GGG..PP..WWWWWWWWWWWWWWWWWWWWW', // row 21
    'WWWWWAWWWWWWAWWWWW.WWWWWWWAWWWWWWAWWWWWW', // row 22
    'WWWWWWWWWWWWWWWWWW....PP..GGG....PP....W', // row 23
    'WWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWWAWWWW.X', // row 24
    'WWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWWAWWWWWW', // row 25
  ],

  // 地磚快取（預渲染提升效能）
  tileCache: {},

  // 路徑航點（由佈局計算）
  path: [],

  // 可放牆壁陷阱的格子
  wallTrapSlots: [],

  // 可放地板陷阱的格子
  floorTrapSlots: [],

  // 草叢狀態管理：key 為 'col,row'，value 為 { state, timer }
  grassState: {},

  init() {
    this.initGrassState();
    this.computePath();
    this.computeTrapSlots();
    this.prerenderTiles();
  },

  /** 初始化所有草叢格為 normal 狀態 */
  initGrassState() {
    this.grassState = {};
    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        if (this.layout[r][c] === 'G') {
          this.grassState[`${c},${r}`] = { state: 'normal', timer: 0 };
        }
      }
    }
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
    return t === '.' || t === 'E' || t === 'X' || t === 'P' || t === 'G';
  },

  isAbyss(col, row) {
    return this.getTile(col, row) === 'A';
  },

  isPool(col, row) {
    return this.getTile(col, row) === 'P';
  },

  isGrass(col, row) {
    return this.getTile(col, row) === 'G';
  },

  /**
   * 取得推力方向：牆壁 → 路徑 → 深淵
   */
  getPushDirection(col, row) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dc, dr] of dirs) {
      const pathCol = col + dc;
      const pathRow = row + dr;
      if (this.isPath(pathCol, pathRow)) {
        const targetCol = pathCol + dc;
        const targetRow = pathRow + dr;
        if (this.isAbyss(targetCol, targetRow)) {
          return { dc, dr };
        }
      }
    }
    return null;
  },

  // === 草叢狀態管理 ===

  /** 查詢草叢狀態 */
  getGrassState(col, row) {
    const key = `${col},${row}`;
    return this.grassState[key] || null;
  },

  /** 點燃草叢（flood fill 擴散到所有相連的 normal 草叢） */
  igniteGrass(col, row) {
    const key = `${col},${row}`;
    const state = this.grassState[key];
    if (!state || state.state !== 'normal') return;

    // BFS flood fill
    const queue = [{ col, row }];
    const visited = new Set();
    visited.add(key);

    while (queue.length > 0) {
      const cur = queue.shift();
      const curKey = `${cur.col},${cur.row}`;
      const curState = this.grassState[curKey];
      if (curState && curState.state === 'normal') {
        this.grassState[curKey] = { state: 'burning', timer: 0 };

        // 擴散到四個方向的相鄰草叢
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dc, dr] of dirs) {
          const nc = cur.col + dc;
          const nr = cur.row + dr;
          const nk = `${nc},${nr}`;
          if (!visited.has(nk)) {
            visited.add(nk);
            const ns = this.grassState[nk];
            if (ns && ns.state === 'normal') {
              queue.push({ col: nc, row: nr });
            }
          }
        }
      }
    }
  },

  /** 更新草叢燃燒計時器，20 秒後轉為 scorched */
  updateGrass(dt) {
    const BURN_DURATION = 20000; // 20 秒
    const keys = Object.keys(this.grassState);
    for (const key of keys) {
      const gs = this.grassState[key];
      if (gs.state === 'burning') {
        const newTimer = gs.timer + dt;
        if (newTimer >= BURN_DURATION) {
          this.grassState[key] = { state: 'scorched', timer: 0 };
        } else {
          this.grassState[key] = { state: 'burning', timer: newTimer };
        }
      }
    }
  },

  computePath() {
    // BFS 尋找從 E 到 X 的路徑
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
        // 轉換為像素座標（格子中心）
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
          // 檢查是否鄰接路徑（牆壁陷阱位）
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
          // 地板陷阱位（包含 .、P、G）
          this.floorTrapSlots.push({ col: c, row: r });
        }
      }
    }
  },

  prerenderTiles() {
    const T = DK.CONFIG.TILE_SIZE;

    // 牆壁地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawWallTile(ctx, 0, 0, v);
      this.tileCache[`wall_${v}`] = canvas;
    }

    // 地板地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawFloorTile(ctx, 0, 0, v);
      this.tileCache[`floor_${v}`] = canvas;
    }

    // 深淵地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawAbyssTile(ctx, 0, 0, v);
      this.tileCache[`abyss_${v}`] = canvas;
    }

    // 水潭地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawPoolTile(ctx, 0, 0, v);
      this.tileCache[`pool_${v}`] = canvas;
    }

    // 草叢地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawGrassTile(ctx, 0, 0, v);
      this.tileCache[`grass_${v}`] = canvas;
    }

    // 焦黑草叢地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawGrassScorchedTile(ctx, 0, 0, v);
      this.tileCache[`grass_scorched_${v}`] = canvas;
    }

    // 入口地磚
    const entranceCanvas = document.createElement('canvas');
    entranceCanvas.width = T;
    entranceCanvas.height = T;
    const ectx = entranceCanvas.getContext('2d');
    this.drawEntranceTile(ectx, 0, 0);
    this.tileCache['entrance'] = entranceCanvas;

    // 出口地磚
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

    // === 深色石磚牆 ===
    PA.rect(ctx, x, y, 16, 16, C.WALL_DARK);

    // 磚塊排列：3 排交錯磚塊
    const brickRows = [
      { y: 0, h: 5, offsets: variant % 2 === 0 ? [0, 6, 12] : [0, 8] },
      { y: 6, h: 4, offsets: variant % 2 === 0 ? [0, 8] : [0, 5, 11] },
      { y: 11, h: 5, offsets: variant % 2 === 0 ? [0, 6, 12] : [0, 8] },
    ];

    // 灰縫線
    PA.rect(ctx, x, y + 5, 16, 1, C.WALL_MORTAR);
    PA.rect(ctx, x, y + 10, 16, 1, C.WALL_MORTAR);

    // 繪製每排磚塊
    for (const row of brickRows) {
      for (let i = 0; i < row.offsets.length; i++) {
        const bx = x + row.offsets[i];
        const bw = (i < row.offsets.length - 1)
          ? row.offsets[i + 1] - row.offsets[i] - 1
          : 16 - row.offsets[i];
        const by = y + row.y;

        // 磚塊本體（使用新過渡色增加層次）
        const brickRoll = rng();
        const brickShade = brickRoll > 0.7 ? C.WALL_LIGHT
          : brickRoll > 0.4 ? C.WALL_MID
          : brickRoll > 0.15 ? C.WALL_WARM
          : C.WALL_DARK_MID;
        PA.rect(ctx, bx, by, bw, row.h, brickShade);

        // 左上高光
        PA.rect(ctx, bx, by, bw, 1, C.WALL_HIGHLIGHT);
        PA.rect(ctx, bx, by, 1, row.h, PA.lighten(brickShade, 12));

        // 右下陰影
        PA.rect(ctx, bx, by + row.h - 1, bw, 1, C.WALL_DARK);
        PA.rect(ctx, bx + bw - 1, by, 1, row.h, C.WALL_DARK);

        // 磚塊間灰縫
        if (i < row.offsets.length - 1) {
          PA.rect(ctx, bx + bw, by, 1, row.h, C.WALL_MORTAR);
        }

        // 紋理噪點（增至 5 個，使用過渡色階）
        for (let t = 0; t < 5; t++) {
          const tx = bx + 1 + Math.floor(rng() * Math.max(1, bw - 2));
          const ty = by + 1 + Math.floor(rng() * Math.max(1, row.h - 2));
          const r2 = rng();
          const noiseColor = r2 > 0.7 ? C.WALL_HIGHLIGHT
            : r2 > 0.4 ? C.WALL_MID_LIGHT
            : r2 > 0.2 ? C.WALL_DARK_MID
            : C.WALL_DARK;
          PA.pixel(ctx, tx, ty, noiseColor);
        }
      }
    }

    // 灰縫深色裂線（在磚塊之上疊加）
    const mortarDeep = PA.darken(C.WALL_MORTAR, 8);
    for (let mx = 0; mx < 16; mx += 3) {
      PA.pixel(ctx, x + mx, y + 5, mortarDeep);
      PA.pixel(ctx, x + mx + 1, y + 10, mortarDeep);
    }

    // 苔蘚/裂紋（依變體）
    if (variant === 2) {
      // 苔蘚區擴大至 4-6px，混合 WALL_DARK_MID / WALL_MID_LIGHT
      PA.pixel(ctx, x + 2, y + 5, C.WALL_MOSS);
      PA.pixel(ctx, x + 3, y + 5, C.WALL_MOSS);
      PA.pixel(ctx, x + 3, y + 4, '#2a5a2a');
      PA.pixel(ctx, x + 4, y + 5, C.WALL_DARK_MID);
      PA.pixel(ctx, x + 4, y + 4, C.WALL_MID_LIGHT);
      PA.pixel(ctx, x + 11, y + 10, C.WALL_MOSS);
      PA.pixel(ctx, x + 12, y + 10, '#1e3a1e');
      PA.pixel(ctx, x + 12, y + 9, C.WALL_DARK_MID);
      PA.pixel(ctx, x + 13, y + 10, C.WALL_MID_LIGHT);
    }
    if (variant === 3) {
      PA.pixel(ctx, x + 9, y + 2, C.WALL_MORTAR);
      PA.pixel(ctx, x + 10, y + 3, C.WALL_MORTAR);
      PA.pixel(ctx, x + 10, y + 4, C.WALL_MORTAR);
    }

    // 邊角暗角
    PA.pixel(ctx, x, y, C.WALL_MORTAR);
    PA.pixel(ctx, x + 15, y, C.WALL_MORTAR);
    PA.pixel(ctx, x, y + 15, C.WALL_MORTAR);
    PA.pixel(ctx, x + 15, y + 15, C.WALL_MORTAR);
  },

  drawFloorTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 251 + 73);

    // === 暖色砂岩地板 ===
    PA.rect(ctx, x, y, 16, 16, C.FLOOR_MID);

    // 大石板圖案（2x2 格的石板與間隙）
    const stones = [
      { sx: 0, sy: 0, sw: 7, sh: 7 },
      { sx: 8, sy: 0, sw: 8, sh: 7 },
      { sx: 0, sy: 8, sw: 8, sh: 8 },
      { sx: 9, sy: 8, sw: 7, sh: 8 },
    ];

    if (variant === 1) {
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

    // 繪製每塊石板
    for (const stone of stones) {
      const sx = x + stone.sx;
      const sy = y + stone.sy;
      const shade = rng() > 0.5 ? C.FLOOR_MID : C.FLOOR_LIGHT;

      PA.rect(ctx, sx, sy, stone.sw, stone.sh, shade);

      // 左上高光
      PA.rect(ctx, sx, sy, stone.sw, 1, C.FLOOR_HIGHLIGHT);
      PA.rect(ctx, sx, sy, 1, stone.sh, C.FLOOR_HIGHLIGHT);

      // 右下陰影（用 FLOOR_DARK_MID 增加過渡）
      PA.rect(ctx, sx, sy + stone.sh - 1, stone.sw, 1, C.FLOOR_DARK_MID);
      PA.rect(ctx, sx + stone.sw - 1, sy, 1, stone.sh, C.FLOOR_DARK_MID);

      // 內部紋理（增加色階過渡）
      for (let t = 0; t < 4; t++) {
        const tx = sx + 1 + Math.floor(rng() * Math.max(1, stone.sw - 3));
        const ty = sy + 1 + Math.floor(rng() * Math.max(1, stone.sh - 3));
        const floorR = rng();
        const texColor = floorR > 0.7 ? C.FLOOR_MID_LIGHT
          : floorR > 0.4 ? C.FLOOR_LIGHT
          : floorR > 0.2 ? C.FLOOR_DARK_MID
          : C.FLOOR_DARK;
        PA.pixel(ctx, tx, ty, texColor);
      }

      // 暖色反光點
      const hx = sx + 1 + Math.floor(rng() * Math.max(1, stone.sw - 3));
      const hy = sy + 1 + Math.floor(rng() * Math.max(1, stone.sh - 3));
      PA.pixel(ctx, hx, hy, '#9a9080');
    }

    // 石板間隙（暗色裂縫）
    const gy = variant < 2 ? 7 : 8;
    for (let i = 0; i < 16; i++) {
      PA.pixel(ctx, x + i, y + gy, C.FLOOR_CRACK);
    }
    const gx = variant % 2 === 0 ? 7 : 9;
    for (let i = 0; i < gy; i++) {
      PA.pixel(ctx, x + gx, y + i, C.FLOOR_CRACK);
    }
    const gx2 = variant % 2 === 0 ? 8 : 7;
    for (let i = gy + 1; i < 16; i++) {
      PA.pixel(ctx, x + gx2, y + i, C.FLOOR_CRACK);
    }

    // 散落的沙塵（增至 4 個 + 更多變體）
    if (variant === 1 || variant === 3) {
      PA.pixel(ctx, x + 3, y + 12, '#8a8070');
      PA.pixel(ctx, x + 12, y + 4, '#7a7060');
      PA.pixel(ctx, x + 7, y + 13, C.FLOOR_DARK_MID);
      PA.pixel(ctx, x + 14, y + 9, C.FLOOR_MID_LIGHT);
    }
    if (variant === 0 || variant === 2) {
      PA.pixel(ctx, x + 5, y + 11, '#8a8070');
      PA.pixel(ctx, x + 10, y + 3, C.FLOOR_DARK_MID);
    }

    // 地板裂痕裝飾（15% 機率，2 色裂痕：中心 FLOOR_CRACK + 旁邊 FLOOR_DARK_MID）
    if (rng() < 0.15) {
      const crackCount = 1 + Math.floor(rng() * 2); // 1-2 條裂痕
      for (let ci = 0; ci < crackCount; ci++) {
        const startX = 2 + Math.floor(rng() * 11);
        const startY = 2 + Math.floor(rng() * 11);
        const length = 2 + Math.floor(rng() * 3); // 2-4px 長
        const dirIdx = Math.floor(rng() * 4);
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        const [cdx, cdy] = dirs[dirIdx];
        for (let p = 0; p < length; p++) {
          const px = startX + cdx * p;
          const py = startY + cdy * p;
          if (px >= 1 && px < 15 && py >= 1 && py < 15) {
            // 裂痕中心用 FLOOR_CRACK，邊緣用 FLOOR_DARK_MID
            PA.pixel(ctx, x + px, y + py, C.FLOOR_CRACK);
            // 旁邊像素用較淺的 FLOOR_DARK_MID 做過渡
            if (py + 1 < 15) {
              PA.pixel(ctx, x + px, y + py + 1, C.FLOOR_DARK_MID);
            }
          }
        }
      }
    }
  },

  drawEntranceTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);

    // 綠色入口傳送門（核心增加 1 層漸變）
    PA.rect(ctx, x + 1, y + 4, 4, 8, '#22662a');
    PA.rect(ctx, x + 2, y + 5, 2, 6, '#44aa44');
    // 外圈漸變層
    PA.pixel(ctx, x + 1, y + 6, '#338833');
    PA.pixel(ctx, x + 1, y + 9, '#338833');
    PA.pixel(ctx, x + 4, y + 6, '#338833');
    PA.pixel(ctx, x + 4, y + 9, '#338833');
    PA.pixel(ctx, x + 2, y + 4, '#66cc66');
    PA.pixel(ctx, x + 3, y + 4, '#66cc66');
    PA.pixel(ctx, x + 2, y + 11, '#66cc66');
    PA.pixel(ctx, x + 3, y + 11, '#66cc66');
    PA.pixel(ctx, x + 5, y + 7, '#88ee88');
    PA.pixel(ctx, x + 5, y + 8, '#88ee88');
    PA.pixel(ctx, x + 6, y + 8, '#66cc66');
    PA.pixel(ctx, x + 2, y + 7, '#aaffaa');
    PA.pixel(ctx, x + 3, y + 8, '#aaffaa');
  },

  drawExitTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);

    // 紅色出口傳送門（核心增加 1 層漸變）
    PA.rect(ctx, x + 11, y + 4, 4, 8, '#662222');
    PA.rect(ctx, x + 12, y + 5, 2, 6, '#cc4444');
    // 外圈漸變層
    PA.pixel(ctx, x + 11, y + 6, '#883333');
    PA.pixel(ctx, x + 11, y + 9, '#883333');
    PA.pixel(ctx, x + 14, y + 6, '#883333');
    PA.pixel(ctx, x + 14, y + 9, '#883333');
    PA.pixel(ctx, x + 12, y + 4, '#ff6666');
    PA.pixel(ctx, x + 13, y + 4, '#ff6666');
    PA.pixel(ctx, x + 12, y + 11, '#ff6666');
    PA.pixel(ctx, x + 13, y + 11, '#ff6666');
    PA.pixel(ctx, x + 10, y + 7, '#ff8888');
    PA.pixel(ctx, x + 10, y + 8, '#ff8888');
    PA.pixel(ctx, x + 12, y + 7, '#ffaaaa');
    PA.pixel(ctx, x + 13, y + 8, '#ffaaaa');
    PA.pixel(ctx, x + 7, y + 7, '#ff4444');
    PA.pixel(ctx, x + 8, y + 7, '#ff4444');
    PA.pixel(ctx, x + 7, y + 8, '#ff4444');
    PA.pixel(ctx, x + 8, y + 8, '#ff4444');
  },

  /** 深淵地磚：純黑深洞 + 邊緣岩石碎裂紋理 */
  drawAbyssTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 193 + 59);

    // 純黑深洞底色
    PA.rect(ctx, x, y, 16, 16, C.ABYSS_DARK);

    // 中心加入 ABYSS_MID 色區域增加深度漸層
    for (let i = 4; i < 12; i++) {
      for (let j = 4; j < 12; j++) {
        if (rng() > 0.6) {
          PA.pixel(ctx, x + i, y + j, C.ABYSS_MID);
        }
      }
    }

    // 邊緣岩層改為 2 層漸變：外層 ABYSS_EDGE，內層 ABYSS_MID
    // 上邊緣
    for (let i = 0; i < 16; i++) {
      const depth = Math.floor(rng() * 3);
      for (let d = 0; d < depth; d++) {
        const edgeColor = d === 0 ? (rng() > 0.5 ? C.ABYSS_EDGE : C.ABYSS_ROCK) : C.ABYSS_MID;
        PA.pixel(ctx, x + i, y + d, edgeColor);
      }
    }
    // 下邊緣
    for (let i = 0; i < 16; i++) {
      const depth = Math.floor(rng() * 3);
      for (let d = 0; d < depth; d++) {
        const edgeColor = d === 0 ? (rng() > 0.5 ? C.ABYSS_EDGE : C.ABYSS_ROCK) : C.ABYSS_MID;
        PA.pixel(ctx, x + i, y + 15 - d, edgeColor);
      }
    }
    // 左邊緣
    for (let i = 2; i < 14; i++) {
      const depth = Math.floor(rng() * 2);
      for (let d = 0; d < depth; d++) {
        const edgeColor = d === 0 ? (rng() > 0.4 ? C.ABYSS_EDGE : C.ABYSS_CRACK) : C.ABYSS_MID;
        PA.pixel(ctx, x + d, y + i, edgeColor);
      }
    }
    // 右邊緣
    for (let i = 2; i < 14; i++) {
      const depth = Math.floor(rng() * 2);
      for (let d = 0; d < depth; d++) {
        const edgeColor = d === 0 ? (rng() > 0.4 ? C.ABYSS_EDGE : C.ABYSS_CRACK) : C.ABYSS_MID;
        PA.pixel(ctx, x + 15 - d, y + i, edgeColor);
      }
    }

    // 內部碎裂紋路（從邊緣延伸的裂縫）
    for (let i = 0; i < 3; i++) {
      const cx = 3 + Math.floor(rng() * 10);
      const cy = 3 + Math.floor(rng() * 10);
      const len = 2 + Math.floor(rng() * 3);
      for (let j = 0; j < len; j++) {
        const dx = cx + (rng() > 0.5 ? j : 0);
        const dy = cy + (rng() > 0.5 ? j : 0);
        if (dx >= 0 && dx < 16 && dy >= 0 && dy < 16) {
          PA.pixel(ctx, x + dx, y + dy, C.ABYSS_CRACK);
        }
      }
    }

    // 碎石散落（增至 4 個 + 混合多色）
    if (variant === 1 || variant === 3) {
      PA.pixel(ctx, x + 4, y + 3, C.ABYSS_ROCK);
      PA.pixel(ctx, x + 11, y + 12, C.ABYSS_ROCK);
      PA.pixel(ctx, x + 6, y + 5, C.ABYSS_MID);
      PA.pixel(ctx, x + 13, y + 8, C.ABYSS_EDGE);
    }
    if (variant === 0 || variant === 2) {
      PA.pixel(ctx, x + 7, y + 4, C.ABYSS_EDGE);
      PA.pixel(ctx, x + 12, y + 5, C.ABYSS_ROCK);
      PA.pixel(ctx, x + 3, y + 11, C.ABYSS_MID);
      PA.pixel(ctx, x + 9, y + 13, C.ABYSS_EDGE);
    }
  },

  /** 水潭地磚：深藍色水面 + 像素風格波紋紋理 */
  drawPoolTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 311 + 87);

    // 深藍水底
    PA.rect(ctx, x, y, 16, 16, C.POOL_DARK);

    // 中間色調水面
    for (let i = 0; i < 6; i++) {
      const rx = Math.floor(rng() * 14);
      const ry = Math.floor(rng() * 14);
      const rw = 2 + Math.floor(rng() * 4);
      const rh = 1 + Math.floor(rng() * 2);
      PA.rect(ctx, x + rx, y + ry, rw, rh, C.POOL_MID);
    }

    // 波紋線條（水平線）
    const waveY1 = 3 + (variant % 3);
    const waveY2 = 9 + (variant % 3);
    for (let i = 1; i < 15; i++) {
      if (rng() > 0.3) {
        PA.pixel(ctx, x + i, y + waveY1, C.POOL_LIGHT);
      }
      if (rng() > 0.4) {
        PA.pixel(ctx, x + i, y + waveY2, C.POOL_LIGHT);
      }
    }

    // 高光反射點（增至 4 個）
    for (let i = 0; i < 4; i++) {
      const hx = 2 + Math.floor(rng() * 12);
      const hy = 2 + Math.floor(rng() * 12);
      PA.pixel(ctx, x + hx, y + hy, C.POOL_HIGHLIGHT);
    }

    // 邊緣暗化改為 2 層漸變：外圈 darken 10、內圈 darken 6
    for (let i = 0; i < 16; i++) {
      // 外圈（最邊緣）
      PA.pixel(ctx, x + i, y, PA.darken(C.POOL_DARK, 10));
      PA.pixel(ctx, x + i, y + 15, PA.darken(C.POOL_DARK, 10));
      PA.pixel(ctx, x, y + i, PA.darken(C.POOL_DARK, 10));
      PA.pixel(ctx, x + 15, y + i, PA.darken(C.POOL_DARK, 10));
      // 內圈（次邊緣）
      PA.pixel(ctx, x + i, y + 1, PA.darken(C.POOL_DARK, 6));
      PA.pixel(ctx, x + i, y + 14, PA.darken(C.POOL_DARK, 6));
      PA.pixel(ctx, x + 1, y + i, PA.darken(C.POOL_DARK, 6));
      PA.pixel(ctx, x + 14, y + i, PA.darken(C.POOL_DARK, 6));
    }

    // 水底卵石（增至 4 個 + 多色）
    if (variant === 0 || variant === 2) {
      PA.pixel(ctx, x + 5, y + 10, '#1a2838');
      PA.pixel(ctx, x + 6, y + 10, '#1a2838');
      PA.pixel(ctx, x + 10, y + 6, '#1a2838');
      PA.pixel(ctx, x + 3, y + 7, '#1a3040');
    }
    if (variant === 1 || variant === 3) {
      PA.pixel(ctx, x + 8, y + 11, '#1a2838');
      PA.pixel(ctx, x + 4, y + 5, '#1a3040');
      PA.pixel(ctx, x + 12, y + 9, '#142030');
      PA.pixel(ctx, x + 7, y + 3, '#1a2838');
    }
  },

  /** 草叢地磚：深綠色草地 + 像素風格草葉紋理 */
  drawGrassTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 277 + 113);

    // 深綠底色（泥土+草）
    PA.rect(ctx, x, y, 16, 16, C.GRASS_DARK);

    // 中間色調草地
    for (let i = 0; i < 8; i++) {
      const rx = Math.floor(rng() * 14);
      const ry = Math.floor(rng() * 14);
      const rw = 2 + Math.floor(rng() * 3);
      const rh = 1 + Math.floor(rng() * 2);
      PA.rect(ctx, x + rx, y + ry, rw, rh, C.GRASS_MID);
    }

    // 草葉紋理（方向多樣化：一半向上、一半左傾，4 色混合）
    for (let i = 0; i < 10; i++) {
      const gx = 1 + Math.floor(rng() * 14);
      const gy = 2 + Math.floor(rng() * 12);
      const height = 2 + Math.floor(rng() * 2);
      const leanLeft = rng() > 0.5; // 一半左傾
      const colorRoll = rng();
      const shade = colorRoll > 0.75 ? C.GRASS_HIGHLIGHT
        : colorRoll > 0.5 ? C.GRASS_LIGHT
        : colorRoll > 0.25 ? C.GRASS_MID
        : C.GRASS_DARK;
      for (let h = 0; h < height; h++) {
        const lx = leanLeft ? gx - Math.floor(h / 2) : gx;
        if (lx >= 0 && lx < 16 && gy - h >= 0) {
          PA.pixel(ctx, x + lx, y + gy - h, shade);
        }
      }
    }

    // 高光草尖（增至 5 個）
    for (let i = 0; i < 5; i++) {
      const hx = 2 + Math.floor(rng() * 12);
      const hy = 1 + Math.floor(rng() * 6);
      PA.pixel(ctx, x + hx, y + hy, C.GRASS_HIGHLIGHT);
    }

    // 底部泥土色（地面部分）
    for (let i = 0; i < 16; i++) {
      if (rng() > 0.5) {
        PA.pixel(ctx, x + i, y + 15, '#2a2a1a');
        PA.pixel(ctx, x + i, y + 14, '#2a2a1a');
      }
    }

    // 偶爾小花或小石（依變體）
    if (variant === 1) {
      PA.pixel(ctx, x + 6, y + 5, '#aa8844');
      PA.pixel(ctx, x + 6, y + 4, '#ccaa55');
    }
    if (variant === 3) {
      PA.pixel(ctx, x + 11, y + 8, '#777766');
      PA.pixel(ctx, x + 12, y + 8, '#666655');
    }
  },

  /** 焦黑草叢地磚：暗色燒焦地面 */
  drawGrassScorchedTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 353 + 97);

    // 焦黑底色
    PA.rect(ctx, x, y, 16, 16, C.GRASS_SCORCHED);

    // 灰燼紋理
    for (let i = 0; i < 6; i++) {
      const rx = Math.floor(rng() * 14);
      const ry = Math.floor(rng() * 14);
      const rw = 1 + Math.floor(rng() * 3);
      PA.rect(ctx, x + rx, y + ry, rw, 1, '#1a1a14');
    }

    // 殘餘碳化草梗
    for (let i = 0; i < 4; i++) {
      const gx = 2 + Math.floor(rng() * 12);
      const gy = 4 + Math.floor(rng() * 10);
      PA.pixel(ctx, x + gx, y + gy, '#1a1810');
      PA.pixel(ctx, x + gx, y + gy - 1, '#1a1810');
    }

    // 灰塵散落
    for (let i = 0; i < 3; i++) {
      const dx = 1 + Math.floor(rng() * 14);
      const dy = 1 + Math.floor(rng() * 14);
      PA.pixel(ctx, x + dx, y + dy, '#3a3630');
    }
  },

  /** 計算可見範圍（以格子為單位），向後相容無 camera 場景 */
  getVisibleRange() {
    const T = DK.CONFIG.TILE_SIZE;
    const cam = DK.Game ? DK.Game.camera : null;
    if (cam) {
      const startCol = Math.max(0, Math.floor(cam.x / T) - 1);
      const startRow = Math.max(0, Math.floor(cam.y / T) - 1);
      const endCol = Math.min(this.layout[0].length - 1, Math.ceil((cam.x + DK.CONFIG.GAME_WIDTH) / T) + 1);
      const endRow = Math.min(this.layout.length - 1, Math.ceil((cam.y + DK.CONFIG.GAME_HEIGHT) / T) + 1);
      return { startCol, startRow, endCol, endRow };
    }
    return {
      startCol: 0,
      startRow: 0,
      endCol: this.layout[0].length - 1,
      endRow: this.layout.length - 1,
    };
  },

  render(ctx) {
    const PA = DK.PixelArt;
    const T = DK.CONFIG.TILE_SIZE;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    // 第一通道：繪製所有地磚（僅可見範圍）
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.layout[r][c];
        const x = c * T;
        const y = r * T;

        if (tile === 'W') {
          const variant = (c * 7 + r * 13) % 6;
          ctx.drawImage(this.tileCache[`wall_${variant}`], x, y);
        } else if (tile === 'E') {
          ctx.drawImage(this.tileCache['entrance'], x, y);
        } else if (tile === 'X') {
          ctx.drawImage(this.tileCache['exit'], x, y);
        } else if (tile === 'A') {
          const variant = (c * 11 + r * 17) % 6;
          ctx.drawImage(this.tileCache[`abyss_${variant}`], x, y);
        } else if (tile === 'P') {
          const variant = (c * 11 + r * 17) % 6;
          ctx.drawImage(this.tileCache[`pool_${variant}`], x, y);
        } else if (tile === 'G') {
          const variant = (c * 11 + r * 17) % 6;
          const gs = this.getGrassState(c, r);
          if (gs && gs.state === 'scorched') {
            ctx.drawImage(this.tileCache[`grass_scorched_${variant}`], x, y);
          } else {
            ctx.drawImage(this.tileCache[`grass_${variant}`], x, y);
          }
        } else {
          const variant = (c * 11 + r * 17) % 6;
          ctx.drawImage(this.tileCache[`floor_${variant}`], x, y);
        }
      }
    }

    // 第二通道：牆壁陰影投射到相鄰地板（僅可見範圍）
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (!this.isPath(c, r)) continue;
        const x = c * T;
        const y = r * T;

        // 上方牆壁投射的陰影
        if (this.isWall(c, r - 1)) {
          PA.rect(ctx, x, y, T, 2, 'rgba(10,8,20,0.4)');
          PA.rect(ctx, x, y, T, 1, 'rgba(10,8,20,0.3)');
        }
        // 左方牆壁投射的陰影
        if (this.isWall(c - 1, r)) {
          PA.rect(ctx, x, y, 2, T, 'rgba(10,8,20,0.3)');
          PA.rect(ctx, x, y, 1, T, 'rgba(10,8,20,0.2)');
        }
        // 下方牆壁的反光邊
        if (this.isWall(c, r + 1)) {
          PA.rect(ctx, x, y + T - 1, T, 1, 'rgba(100,90,70,0.15)');
        }
        // 右方牆壁的反光邊
        if (this.isWall(c + 1, r)) {
          PA.rect(ctx, x + T - 1, y, 1, T, 'rgba(100,90,70,0.1)');
        }
      }
    }

    // 第三通道：火把與環境光暈
    this.renderTorches(ctx);

    // 第四通道：深淵動畫效果
    this.renderAbyssAnimation(ctx);

    // 第五通道：水潭與草叢動畫
    this.renderPoolAnimation(ctx);
    this.renderGrassAnimation(ctx);

    // 第六通道：入口與出口傳送門脈動光暈
    this.renderPortalGlow(ctx);

    // 注意：renderVignette 已移至 main.js restore 之後（螢幕空間，不受 camera 影響）
  },

  /** 入口與出口傳送門脈動光暈動畫 */
  renderPortalGlow(ctx) {
    const T = DK.CONFIG.TILE_SIZE;
    const timestamp = DK.Game ? DK.Game.time : 0;
    const alpha = 0.1 + 0.08 * Math.sin(timestamp * 0.003);
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.layout[r][c];
        if (tile !== 'E' && tile !== 'X') continue;

        const x = c * T;
        const y = r * T;
        const isEntrance = tile === 'E';
        const baseR = isEntrance ? 68 : 255;
        const baseG = isEntrance ? 255 : 68;
        const baseB = isEntrance ? 68 : 68;

        // 3 層同心半透明矩形模擬光暈擴散（由外到內漸亮）
        // 第 3 層（最外層）
        ctx.fillStyle = `rgba(${baseR},${baseG},${baseB},${alpha * 0.4})`;
        ctx.fillRect(x - 3, y - 3, T + 6, T + 6);

        // 第 2 層（中層）
        ctx.fillStyle = `rgba(${baseR},${baseG},${baseB},${alpha * 0.7})`;
        ctx.fillRect(x - 1, y - 1, T + 2, T + 2);

        // 第 1 層（內層，最亮）
        ctx.fillStyle = `rgba(${baseR},${baseG},${baseB},${alpha})`;
        ctx.fillRect(x + 1, y + 1, T - 2, T - 2);
      }
    }
  },

  renderTorches(ctx) {
    const PA = DK.PixelArt;
    const T = DK.CONFIG.TILE_SIZE;
    const time = DK.Game ? DK.Game.time : 0;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (const torch of this.torches) {
      // 跳過不在可見範圍內的火把（含光暈半徑 3 格）
      if (torch.col < startCol - 3 || torch.col > endCol + 3 ||
          torch.row < startRow - 3 || torch.row > endRow + 3) continue;
      const tx = torch.col * T;
      const ty = torch.row * T;

      // 火把支架（金屬）
      PA.rect(ctx, tx + 6, ty + 3, 4, 2, '#586878');
      PA.rect(ctx, tx + 7, ty + 5, 2, 4, '#6b5010');

      // 火焰（動畫）
      const flicker = Math.sin(time / 150 + torch.col * 3 + torch.row * 7) * 0.5 + 0.5;
      const flicker2 = Math.sin(time / 100 + torch.col * 5) * 0.5 + 0.5;

      // 火焰核心
      PA.pixel(ctx, tx + 7, ty + 2, '#ffffff');
      PA.pixel(ctx, tx + 8, ty + 2, '#ffffaa');
      // 中層火焰
      PA.pixel(ctx, tx + 7, ty + 1, '#ffcc44');
      PA.pixel(ctx, tx + 8, ty + 1, '#ffaa22');
      // 火焰高度 5→6px：加一個額外頂部像素
      PA.pixel(ctx, tx + 7, ty, '#ffaa22');
      // 外層火焰（增至 4 個不規則點）
      if (flicker > 0.3) {
        PA.pixel(ctx, tx + 6, ty + 2, '#ff6622');
        PA.pixel(ctx, tx + 9, ty + 2, '#ff6622');
      }
      if (flicker2 > 0.5) {
        PA.pixel(ctx, tx + 8, ty, '#ff8844');
      }
      if (flicker > 0.6) {
        PA.pixel(ctx, tx + 6, ty + 1, '#ff4400');
      }
      if (flicker2 > 0.7) {
        PA.pixel(ctx, tx + 9, ty + 1, '#ff6622');
      }

      // 火把餘燼生成（2% 機率推入 DK.Game.particles）
      if (DK.Game && DK.Game.particles && DK.Game.particles.length < 40 && Math.random() < 0.02) {
        DK.Game.particles.push({
          type: 'ember',
          x: (tx + 7) / (DK.CONFIG.WORLD_WIDTH || DK.CONFIG.GAME_WIDTH),
          y: ty / (DK.CONFIG.WORLD_HEIGHT || DK.CONFIG.GAME_HEIGHT),
          vx: (Math.random() - 0.5) * 0.004,
          vy: -0.02,
          life: 0,
          maxLife: 600,
          color: Math.random() > 0.5 ? '#ff8844' : '#ffaa44',
          size: 1,
        });
      }

      // 周圍格子的環境光暈（暖橘色）- 升級光暈參數
      const glowRadius = 2.8 + flicker * 0.5;
      const glowIntensity = 0.12 + flicker * 0.08;
      for (let gr = -glowRadius; gr <= glowRadius; gr++) {
        for (let gc = -glowRadius; gc <= glowRadius; gc++) {
          const dist = Math.sqrt(gr * gr + gc * gc);
          if (dist > glowRadius) continue;
          const nr = torch.row + gr;
          const nc = torch.col + gc;
          if (nr < 0 || nr >= this.layout.length || nc < 0 || nc >= this.layout[0].length) continue;

          const falloff = 1 - dist / glowRadius;
          const alpha = glowIntensity * falloff * falloff * falloff;
          if (alpha < 0.01) continue;

          const gx = nc * T;
          const gy = nr * T;
          ctx.fillStyle = `rgba(255,180,80,${alpha})`;
          ctx.fillRect(gx, gy, T, T);
        }
      }
    }
  },

  renderVignette(ctx) {
    const T = DK.CONFIG.TILE_SIZE;
    const W = DK.CONFIG.WORLD_WIDTH || DK.CONFIG.GAME_WIDTH;
    const H = DK.CONFIG.WORLD_HEIGHT || DK.CONFIG.GAME_HEIGHT;

    // 第三層最外圍：T*3 範圍、alpha 0.05
    ctx.fillStyle = 'rgba(10,8,18,0.05)';
    ctx.fillRect(0, 0, W, T * 3);
    ctx.fillRect(0, H - T * 3, W, T * 3);
    ctx.fillRect(0, 0, T * 3, H);
    ctx.fillRect(W - T * 3, 0, T * 3, H);

    // 邊緣暗化營造氛圍（alpha 0.15 → 0.22）
    ctx.fillStyle = 'rgba(10,8,18,0.22)';
    ctx.fillRect(0, 0, W, T);
    ctx.fillRect(0, H - T, W, T);
    ctx.fillRect(0, 0, T, H);
    ctx.fillRect(W - T, 0, T, H);

    // 角落更深的暗化（alpha 0.1 → 0.2）
    ctx.fillStyle = 'rgba(10,8,18,0.2)';
    ctx.fillRect(0, 0, T * 2, T * 2);
    ctx.fillRect(W - T * 2, 0, T * 2, T * 2);
    ctx.fillRect(0, H - T * 2, T * 2, T * 2);
    ctx.fillRect(W - T * 2, H - T * 2, T * 2, T * 2);
  },

  /** 深淵動畫：偶爾小石子掉落粒子 */
  renderAbyssAnimation(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const T = DK.CONFIG.TILE_SIZE;
    const time = DK.Game ? DK.Game.time : 0;
    const t = time / 1000;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.layout[r][c] !== 'A') continue;

        const x = c * T;
        const y = r * T;

        // 偶爾掉落的小石子粒子（稀疏、非持續性）
        const seed1 = Math.sin(t * 0.8 + c * 5.3 + r * 3.7);
        if (seed1 > 0.6) {
          // 石子位置隨時間緩慢下落
          const fallProgress = (t * 2 + c * 1.7) % 4; // 0~4秒循環
          if (fallProgress < 2) {
            const px = x + 3 + Math.round(((c * 7 + r * 3) % 10));
            const py = y + 2 + Math.round(fallProgress * 6);
            if (py < y + 14) {
              // 石子（逐漸變暗=越掉越深）
              const fadeAlpha = 1 - fallProgress / 2;
              const shade = Math.round(40 * fadeAlpha);
              PA.pixel(ctx, px, py, `rgb(${shade},${shade},${Math.round(shade * 0.8)})`);
            }
          }
        }

        // 第二顆石子（不同相位）
        const seed2 = Math.sin(t * 1.2 + c * 3.1 + r * 7.3);
        if (seed2 > 0.7) {
          const fallProgress2 = (t * 1.5 + c * 2.3 + r * 1.1) % 5;
          if (fallProgress2 < 2.5) {
            const px2 = x + 8 + Math.round(((c * 3 + r * 11) % 4));
            const py2 = y + 1 + Math.round(fallProgress2 * 5);
            if (py2 < y + 14) {
              const fadeAlpha2 = 1 - fallProgress2 / 2.5;
              const shade2 = Math.round(35 * fadeAlpha2);
              PA.pixel(ctx, px2, py2, `rgb(${shade2},${shade2},${Math.round(shade2 * 0.7)})`);
            }
          }
        }

        // 深淵邊緣微光（與相鄰路徑格的邊界微弱暗光）
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dc, dr] of dirs) {
          const nc = c + dc;
          const nr = r + dr;
          if (nr >= 0 && nr < this.layout.length && nc >= 0 && nc < this.layout[0].length) {
            if (this.isPath(nc, nr)) {
              ctx.fillStyle = 'rgba(5,5,10,0.08)';
              ctx.fillRect(nc * T, nr * T, T, T);
            }
          }
        }
      }
    }
  },

  /** 水潭動畫：微波紋效果 */
  renderPoolAnimation(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const T = DK.CONFIG.TILE_SIZE;
    const time = DK.Game ? DK.Game.time : 0;
    const t = time / 1000;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.layout[r][c] !== 'P') continue;

        const x = c * T;
        const y = r * T;

        // 水平波紋線（隨時間緩慢移動）
        const waveOffset = Math.round(Math.sin(t * 1.5 + c * 2) * 2);
        const waveY = (Math.round(t * 2 + r * 3) % 14) + 1;
        for (let i = 2; i < 14; i++) {
          const wx = x + i + Math.round(Math.sin(t + i * 0.5) * 0.5);
          if (wx >= x && wx < x + 16) {
            PA.pixel(ctx, wx, y + waveY, C.POOL_RIPPLE);
          }
        }

        // 閃爍高光點（水面光線反射）
        const sparkle = Math.sin(t * 3 + c * 4.7 + r * 2.3);
        if (sparkle > 0.5) {
          const sx = x + 4 + Math.round(Math.sin(t * 0.7 + c) * 4);
          const sy = y + 4 + Math.round(Math.cos(t * 0.9 + r) * 4);
          if (sx >= x + 1 && sx < x + 15 && sy >= y + 1 && sy < y + 15) {
            PA.pixel(ctx, sx, sy, C.POOL_HIGHLIGHT);
          }
        }

        // 第二個高光
        const sparkle2 = Math.sin(t * 2.5 + c * 2.1 + r * 5.7);
        if (sparkle2 > 0.6) {
          const sx2 = x + 10 + Math.round(Math.sin(t * 1.1 + r) * 3);
          const sy2 = y + 8 + Math.round(Math.cos(t * 0.8 + c) * 3);
          if (sx2 >= x + 1 && sx2 < x + 15 && sy2 >= y + 1 && sy2 < y + 15) {
            PA.pixel(ctx, sx2, sy2, '#8accff');
          }
        }
      }
    }
  },

  /** 草叢動畫：根據 grassState 渲染不同效果 */
  renderGrassAnimation(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const T = DK.CONFIG.TILE_SIZE;
    const time = DK.Game ? DK.Game.time : 0;
    const t = time / 1000;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.layout[r][c] !== 'G') continue;

        const gs = this.getGrassState(c, r);
        if (!gs) continue;

        const x = c * T;
        const y = r * T;

        if (gs.state === 'normal') {
          // 搖擺動畫：草尖隨時間輕微搖擺
          const sway = Math.sin(t * 2 + c * 1.7 + r * 2.3);
          const swayOffset = Math.round(sway);

          // 幾根搖擺的草葉
          for (let i = 0; i < 3; i++) {
            const gx = 3 + i * 5 + Math.round(Math.sin(t + i * 2.1) * 0.5);
            const gy = 3 + Math.round(Math.sin(t * 1.5 + i * 3.3 + c) * 1);
            const tipX = gx + swayOffset;
            if (tipX >= 0 && tipX < 16) {
              PA.pixel(ctx, x + tipX, y + gy, C.GRASS_HIGHLIGHT);
            }
          }

        } else if (gs.state === 'burning') {
          // 火焰效果：閃爍的橘紅色火焰 + 上方煙霧
          const burnProgress = gs.timer / 20000; // 0~1
          const flicker = Math.sin(t * 8 + c * 3 + r * 5) * 0.5 + 0.5;
          const flicker2 = Math.sin(t * 12 + c * 7 + r * 2) * 0.5 + 0.5;

          // 火焰底部（橘紅）
          for (let i = 0; i < 4; i++) {
            const fx = 2 + i * 3 + Math.round(Math.sin(t * 6 + i * 2) * 1);
            const fy = 8 + Math.round(flicker * 2);
            PA.pixel(ctx, x + fx, y + fy, C.GRASS_BURNING);
            PA.pixel(ctx, x + fx, y + fy - 1, '#ee6633');
          }

          // 火焰頂部（亮黃）
          if (flicker > 0.3) {
            for (let i = 0; i < 3; i++) {
              const fx = 3 + i * 4 + Math.round(Math.sin(t * 10 + i * 3) * 1);
              const fy = 4 + Math.round(flicker2 * 2);
              PA.pixel(ctx, x + fx, y + fy, '#ffaa22');
              PA.pixel(ctx, x + fx, y + fy - 1, '#ffcc44');
            }
          }

          // 煙霧粒子（灰色，向上飄）
          const smokeY = Math.round((t * 4 + c * 2) % 4);
          if (smokeY < 4) {
            const smokeX = 7 + Math.round(Math.sin(t * 2 + r) * 2);
            const smokeAlpha = (1 - smokeY / 4) * 0.3 * (1 - burnProgress * 0.5);
            ctx.fillStyle = `rgba(80,70,60,${smokeAlpha})`;
            ctx.fillRect(x + smokeX, y + smokeY, 2, 1);
          }

          // 整體火光（讓整格有橘色光暈）
          const glowAlpha = 0.1 + flicker * 0.05;
          ctx.fillStyle = `rgba(255,100,30,${glowAlpha * (1 - burnProgress * 0.7)})`;
          ctx.fillRect(x, y, T, T);

        }
        // scorched 狀態由靜態地磚處理，不需額外動畫
      }
    }
  },

  /**
   * 檢查牆壁格是否為有效的牆壁陷阱位置
   */
  isValidWallTrapSlot(col, row) {
    return this.wallTrapSlots.some(s => s.col === col && s.row === row);
  },

  /**
   * 檢查地板格是否為有效的地板陷阱位置
   */
  isValidFloorTrapSlot(col, row) {
    return this.floorTrapSlots.some(s => s.col === col && s.row === row);
  },

  /**
   * 取得牆壁陷阱朝向
   */
  getWallFacing(col, row) {
    const slot = this.wallTrapSlots.find(s => s.col === col && s.row === row);
    return slot ? slot.facing : null;
  },
};
