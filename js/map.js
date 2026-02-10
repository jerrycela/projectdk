/**
 * Dungeon Keep - 地圖系統
 * 管理地城佈局、地磚渲染、尋路與地形狀態
 * 以 Dungeon Heart（地心）為核心的開放式地城設計
 */
window.DK = window.DK || {};

DK.Map = {
  // 火把位置（牆壁格上的環境光源）- 24 個均勻分布在 40x26 地圖的 W 格上
  torches: [
    // 外牆角落 W 格
    { col: 2, row: 2 },
    { col: 37, row: 2 },
    { col: 2, row: 23 },
    { col: 37, row: 23 },
    // 北側迷宮（蛇繞走廊入口附近）
    { col: 12, row: 3 },
    { col: 27, row: 3 },
    // 水牢房附近
    { col: 7, row: 7 },
    { col: 12, row: 7 },
    // 熔岩祭壇附近
    { col: 27, row: 6 },
    { col: 33, row: 7 },
    // 西側入口走廊
    { col: 3, row: 8 },
    // 東側入口走廊
    { col: 36, row: 8 },
    // 中央迷宮帶（守衛廳附近）
    { col: 3, row: 12 },
    { col: 13, row: 12 },
    { col: 18, row: 12 },
    { col: 33, row: 12 },
    // 荒草庭院 / 地心附近
    { col: 7, row: 13 },
    { col: 23, row: 13 },
    // 下層迷宮
    { col: 3, row: 16 },
    { col: 36, row: 16 },
    { col: 7, row: 17 },
    { col: 33, row: 17 },
    // 南側蛇繞走廊
    { col: 12, row: 19 },
    { col: 27, row: 19 },
  ],

  // 裝飾物數據（type, variant, col, row, layer）
  // layer: 1=地板, 2=物件, 3=牆壁
  // 水牢區實際範圍: P 格 (8-11, 7-9), W 格周圍, . 格 (6,7), (6-7,8), (3-4,9), (6,9)
  decorations: [
    // 清空：裝飾物系統待重新設計
  ],

  // 地圖佈局: W=牆壁, .=路徑, O=外圍, B=可破壞牆, H=地心, A=深淵, P=水潭, G=草叢, R=軌道
  // 40x26 格（每行精確 40 字元）
  layout: [
    // row 0-1: 全外圍
    'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO', // row 0
    'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO', // row 1
    // row 2: 外牆上邊
    'OOWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWOO', // row 2
    // rows 3-22: 迷宮地城（3-tile buffer + 14×7 迷宮 + 7 主題房間）
    'OOBWWWWWWWW.WWWWWWWWWWWWWWWWWWWWWWWWWBOO', // row 3  N走廊→迷宮入口
    'OOBWWWWWWWW......................WWWWBOO', // row 4  N蛇繞走廊
    'OOBWWWWWWWWWWWWWWWWWWWWWWWWWWWWW.WWWWBOO', // row 5  牆壁分隔層
    'OOBWWW.........W...........W.....WWWWBOO', // row 6  迷宮第1行
    'OOBWWW.WPPPPWW.W.W.WWWWWWW..AA.W.WWWWBOO', // row 7  水牢+熔岩祭壇
    'OOBWWW..PPPP.....W.W.W......AA...WWWWBOO', // row 8  水牢+熔岩
    'OOB..W.WPPPP.WWWWW.W.W.WWWW....W.WW..BOO', // row 9  W/E入口連接
    'OOBW.W...........W.W.......W.....WW.WBOO', // row 10 迷宮中帶
    'OOBW.WWWWWWWWW.W......WWWW.W...W.WW.WBOO', // row 11 守衛廳上方
    'OOBW.W...W...W....W.W....W.W.W.W.WW.WBOO', // row 12 守衛廳+走廊
    'OOBW.W.WWW.W.W.W.......WWW.W.W.WWWW.WBOO', // row 13 迷宮
    'OOBW.W.....W.....WW.WW.W...W.W...WW.WBOO', // row 14 迷宮
    'OOBW.W.WGGGGG.WWWWHHWW.W.WW....W.WW.WBOO', // row 15 庭院+地心北牆
    'OOBW....GGGGGAAAAAHHAW.W.......W....WBOO', // row 16 庭院+深淵橋+地心
    'OOBWWW.WGGG..........W.W.W....WW.WWWWBOO', // row 17 庭院+寶藏室走廊
    'OOBWWW.WGGGGGAAAAAAAAW...........WWWWBOO', // row 18 庭院+深淵南
    'OOBWWW.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWBOO', // row 19 牆壁分隔層
    'OOBWWW.WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWBOO', // row 20 S蛇繞走廊入口
    'OOBWWW....................WWWWWWWWWWWBOO', // row 21 S蛇繞走廊
    'OOBWWWWWWWWWWWWWWWWWWWWWW.WWWWWWWWWWWBOO', // row 22 S走廊→迷宮入口
    // row 23: 外牆下邊
    'OOWBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWOO', // row 23
    // row 24-25: 全外圍
    'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO', // row 24
    'OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO', // row 25
  ],

  // 地磚快取（預渲染提升效能）
  tileCache: {},

  // 路徑航點（已棄用，改用 distanceField）
  path: [],

  // 可放牆壁陷阱的格子
  wallTrapSlots: [],

  // 可放地板陷阱的格子
  floorTrapSlots: [],

  // 草叢狀態管理：key 為 'col,row'，value 為 { state, timer }
  grassState: {},

  // === Dungeon Heart 新增屬性 ===

  // 地心左上角格座標
  heartPos: null,

  // 已開洞口列表
  breachHoles: [],

  // 傳送門列表（Portal System - 關卡編輯器支援）
  // 每個 portal: { id, col, row, type, waves }
  portals: [],

  // 距離場：distanceField[row][col] = 到地心距離 (-1 = 不可達)
  distanceField: null,

  // 路障系統
  barricades: [],

  // 穿透距離場（路障視為可行走，用於封路時導航）
  distanceFieldThrough: null,

  // 路徑預覽快取（每個洞口的路徑座標陣列）
  pathPreviewCache: [],

  init() {
    // 動態載入關卡地圖（如果 LevelManager 有提供）
    if (DK.LevelManager?.currentLevel?.layout &&
        DK.LevelManager.currentLevel.layout !== 'original') {
      this.layout = DK.LevelManager.currentLevel.layout;
    }

    // 自動偵測地圖尺寸並調整 camera（簡化地圖不使用 camera）
    const rows = this.layout.length;
    const cols = this.layout[0].length;
    if (cols === 20 && rows === 13) {
      // 簡化地圖：禁用 camera 移動
      if (DK.Game) DK.Game.camera = { x: 0, y: 0 };
    }

    this.initGrassState();
    this.findHeartPos();
    this.computeDistanceField();
    this.computeDistanceFieldThrough();
    this.barricades = [];
    this.pathPreviewCache = [];
    this.computeTrapSlots();
    this.prerenderTiles();
  },

  /** 找到地心 H 的位置（左上角格座標） */
  findHeartPos() {
    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        if (this.layout[r][c] === 'H') {
          this.heartPos = { col: c, row: r };
          return;
        }
      }
    }
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
    const t = this.getTile(col, row);
    return t === 'W' || t === 'B';
  },

  isPath(col, row) {
    const t = this.getTile(col, row);
    return t === '.' || t === 'E' || t === 'X' || t === 'P' || t === 'G' || t === 'H';
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

  // === Dungeon Heart 新增查詢函式 ===

  /** 回傳 tile 是否為外圍 O */
  isOuter(col, row) {
    return this.getTile(col, row) === 'O';
  },

  /** 回傳 tile 是否為可破壞牆 B */
  isBreakable(col, row) {
    return this.getTile(col, row) === 'B';
  },

  /** 回傳 tile 是否為地心 H */
  isHeart(col, row) {
    return this.getTile(col, row) === 'H';
  },

  /** 檢查該格是否有路障 */
  hasBarricade(col, row) {
    return this.barricades.some(b => b.col === col && b.row === row);
  },

  /** 取得該格的路障物件 */
  getBarricadeAt(col, row) {
    return this.barricades.find(b => b.col === col && b.row === row) || null;
  },

  /** 放置路障 */
  placeBarricade(col, row) {
    if (this.barricades.length >= DK.CONFIG.BARRICADE_MAX) return false;
    if (this.hasBarricade(col, row)) return false;

    const t = this.getTile(col, row);
    if (t !== '.' && t !== 'P' && t !== 'G') return false;
    if (this.isOuter(col, row)) return false;
    if (this.isHeart(col, row)) return false;

    // 檢查不與陷阱重疊
    if (DK.Traps && DK.Traps.getTrapAt && DK.Traps.getTrapAt(col, row)) return false;
    // 檢查不與英雄重疊
    if (DK.Heroes && DK.Heroes.getHeroAt && DK.Heroes.getHeroAt(col, row)) return false;

    const barricade = {
      id: Date.now() + Math.random(),
      col, row,
      hp: DK.CONFIG.BARRICADE_HP,
      maxHp: DK.CONFIG.BARRICADE_HP,
    };

    this.barricades = [...this.barricades, barricade];
    this.recomputeFields();
    return true;
  },

  /** 移除路障（規劃期退回配額） */
  removeBarricade(col, row) {
    const idx = this.barricades.findIndex(b => b.col === col && b.row === row);
    if (idx === -1) return false;
    this.barricades = [...this.barricades.slice(0, idx), ...this.barricades.slice(idx + 1)];
    this.recomputeFields();
    return true;
  },

  /** === Portal System Functions === */

  /** 檢查該格是否有傳送門 */
  hasPortal(col, row) {
    return this.portals.some(p => p.col === col && p.row === row);
  },

  /** 取得該格的傳送門物件 */
  getPortalAt(col, row) {
    return this.portals.find(p => p.col === col && p.row === row) || null;
  },

  /**
   * 驗證該格是否可放置傳送門
   * @returns {valid: boolean, errors: string[]}
   */
  isValidPortalSlot(col, row) {
    const errors = [];

    // 邊界檢查
    const cols = this.layout[0].length;
    const rows = this.layout.length;
    if (col < 0 || col >= cols || row < 0 || row >= rows) {
      errors.push('位置超出地圖範圍');
      return { valid: false, errors };
    }

    // 取得地磚類型
    const tile = this.getTile(col, row);

    // 只能放在地板 (.) 或外圍 (O) 上
    if (tile !== '.' && tile !== 'O') {
      errors.push(`此位置是 "${tile}"，傳送門只能放在地板 (.) 或外圍 (O) 上`);
    }

    // 檢查是否已有傳送門
    if (this.hasPortal(col, row)) {
      errors.push('此位置已有傳送門');
    }

    // 檢查是否與其他物件重疊
    if (this.isHeart(col, row)) {
      errors.push('不能放在地心上');
    }

    if (this.hasBarricade(col, row)) {
      errors.push('此位置已有路障');
    }

    // 檢查陷阱重疊（如果陷阱系統已載入）
    if (DK.Traps && DK.Traps.getTrapAt && DK.Traps.getTrapAt(col, row)) {
      errors.push('此位置已有陷阱');
    }

    return { valid: errors.length === 0, errors };
  },

  /** 對路障造成傷害，回傳 true 表示被摧毀 */
  damageBarricade(col, row, amount) {
    const b = this.getBarricadeAt(col, row);
    if (!b) return false;

    const newHp = Math.max(0, b.hp - amount);
    // 更新 HP（immutable style）
    this.barricades = this.barricades.map(bar =>
      bar.col === col && bar.row === row ? { ...bar, hp: newHp } : bar
    );

    if (newHp <= 0) {
      this.removeBarricade(col, row);
      return true; // destroyed
    }
    return false;
  },

  /** 可放置陷阱的內部地板格（.PGR，排除外圍與牆壁） */
  isInteriorFloor(col, row) {
    const t = this.getTile(col, row);
    if (t === '.' || t === 'P' || t === 'G' || t === 'R') {
      // 確保不在外圍區域
      return !this.isOuter(col, row);
    }
    return false;
  },

  // === Dungeon Heart 核心函式 ===

  /** 破壞牆壁：B -> '.'，加入 breachHoles，重新計算 distanceField */
  breakWall(col, row) {
    if (!this.isBreakable(col, row)) return;

    // 修改 layout（字串轉陣列再轉回）
    const rowStr = this.layout[row];
    const chars = rowStr.split('');
    chars[col] = '.';
    this.layout[row] = chars.join('');

    // 加入 breachHoles
    this.breachHoles = [...this.breachHoles, { col, row }];

    // 重新計算距離場（含穿透距離場與路徑預覽）
    this.recomputeFields();

    // 需要重新預渲染被破壞格的地磚（改為地板）
    // 由呼叫端負責觸發重繪
  },

  /** BFS 從地心出發，建立距離場 */
  computeDistanceField() {
    const rows = this.layout.length;
    const cols = this.layout[0].length;

    // 初始化所有格為 -1（不可達）
    const field = [];
    for (let r = 0; r < rows; r++) {
      field[r] = [];
      for (let c = 0; c < cols; c++) {
        field[r][c] = -1;
      }
    }

    if (!this.heartPos) {
      this.distanceField = field;
      return;
    }

    // 從地心（2x2 的所有 4 格）開始 BFS
    const queue = [];
    const hp = this.heartPos;

    // 地心的 4 格：hp, hp+1col, hp+1row, hp+1col+1row
    const heartCells = [
      { col: hp.col, row: hp.row },
      { col: hp.col + 1, row: hp.row },
      { col: hp.col, row: hp.row + 1 },
      { col: hp.col + 1, row: hp.row + 1 },
    ];

    for (const cell of heartCells) {
      if (cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols) {
        field[cell.row][cell.col] = 0;
        queue.push(cell);
      }
    }

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let head = 0;

    while (head < queue.length) {
      const cur = queue[head];
      head++;
      const curDist = field[cur.row][cur.col];

      for (const [dc, dr] of dirs) {
        const nc = cur.col + dc;
        const nr = cur.row + dr;

        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (field[nr][nc] !== -1) continue;
        if (!this.isPath(nc, nr)) continue;
        if (this.hasBarricade(nc, nr)) continue; // 路障視為牆壁

        field[nr][nc] = curDist + 1;
        queue.push({ col: nc, row: nr });
      }
    }

    this.distanceField = field;
  },

  /** BFS 從地心出發，忽略路障（用於封路時導航） */
  computeDistanceFieldThrough() {
    const rows = this.layout.length;
    const cols = this.layout[0].length;

    const field = [];
    for (let r = 0; r < rows; r++) {
      field[r] = [];
      for (let c = 0; c < cols; c++) {
        field[r][c] = -1;
      }
    }

    if (!this.heartPos) {
      this.distanceFieldThrough = field;
      return;
    }

    const queue = [];
    const hp = this.heartPos;
    const heartCells = [
      { col: hp.col, row: hp.row },
      { col: hp.col + 1, row: hp.row },
      { col: hp.col, row: hp.row + 1 },
      { col: hp.col + 1, row: hp.row + 1 },
    ];

    for (const cell of heartCells) {
      if (cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols) {
        field[cell.row][cell.col] = 0;
        queue.push(cell);
      }
    }

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let head = 0;

    while (head < queue.length) {
      const cur = queue[head];
      head++;
      const curDist = field[cur.row][cur.col];

      for (const [dc, dr] of dirs) {
        const nc = cur.col + dc;
        const nr = cur.row + dr;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        if (field[nr][nc] !== -1) continue;
        if (!this.isPath(nc, nr)) continue;
        // 注意：這裡不檢查路障！

        field[nr][nc] = curDist + 1;
        queue.push({ col: nc, row: nr });
      }
    }

    this.distanceFieldThrough = field;
  },

  /** 回傳鄰格中 distanceField 值最小且 >= 0 的 {col, row}，找不到則回傳 null */
  getNextStep(col, row) {
    if (!this.distanceField) return null;

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let bestCol = -1;
    let bestRow = -1;
    let bestDist = Infinity;

    for (const [dc, dr] of dirs) {
      const nc = col + dc;
      const nr = row + dr;

      if (nr < 0 || nr >= this.layout.length || nc < 0 || nc >= this.layout[0].length) continue;

      const dist = this.distanceField[nr][nc];
      if (dist >= 0 && dist < bestDist) {
        bestDist = dist;
        bestCol = nc;
        bestRow = nr;
      }
    }

    if (bestCol === -1) return null;
    return { col: bestCol, row: bestRow };
  },

  /** 用 distanceFieldThrough 找下一步（封路時用） */
  getNextStepThrough(col, row) {
    if (!this.distanceFieldThrough) return null;

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let bestCol = -1;
    let bestRow = -1;
    let bestDist = Infinity;

    for (const [dc, dr] of dirs) {
      const nc = col + dc;
      const nr = row + dr;
      if (nr < 0 || nr >= this.layout.length || nc < 0 || nc >= this.layout[0].length) continue;

      const dist = this.distanceFieldThrough[nr][nc];
      if (dist >= 0 && dist < bestDist) {
        bestDist = dist;
        bestCol = nc;
        bestRow = nr;
      }
    }

    if (bestCol === -1) return null;
    return { col: bestCol, row: bestRow };
  },

  /** 重算兩個距離場 + 路徑預覽 */
  recomputeFields() {
    this.computeDistanceField();
    this.computeDistanceFieldThrough();
    this.recomputePathPreview();
  },

  /** 重算路徑預覽快取 */
  recomputePathPreview() {
    this.pathPreviewCache = [];
    if (!this.breachHoles || this.breachHoles.length === 0) return;
    if (!this.distanceField || !this.heartPos) return;

    for (const hole of this.breachHoles) {
      const path = [];
      let col = hole.col;
      let row = hole.row;
      let steps = 0;
      const maxSteps = 200;

      // 先嘗試用正常距離場（有路繞道）
      const useThrough = this.distanceField[row] && this.distanceField[row][col] === -1;

      while (steps < maxSteps) {
        const next = useThrough
          ? this.getNextStepThrough(col, row)
          : this.getNextStep(col, row);
        if (!next) break;
        if (this.isHeart(next.col, next.row)) break;

        path.push({
          col: next.col,
          row: next.row,
          blocked: this.hasBarricade(next.col, next.row)
        });

        col = next.col;
        row = next.row;
        steps++;
      }

      this.pathPreviewCache = [...this.pathPreviewCache, { hole, path }];
    }
  },

  /**
   * 取得推力方向：牆壁 -> 路徑 -> 深淵
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

  computeTrapSlots() {
    this.wallTrapSlots = [];
    this.floorTrapSlots = [];

    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        // 跳過外圍區域
        if (this.isOuter(c, r)) continue;

        const tile = this.getTile(c, r);

        if (tile === 'W') {
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
        } else if (this.isInteriorFloor(c, r) && tile !== 'H') {
          // 地板陷阱位（排除地心格）
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

    // 軌道地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
    }

    // 外圍地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawOuterTile(ctx, 0, 0, v);
      this.tileCache[`outer_${v}`] = canvas;
    }

    // 可破壞牆地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawBreakableWallTile(ctx, 0, 0, v);
      this.tileCache[`breakable_${v}`] = canvas;
    }

    // 地心地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawHeartTile(ctx, 0, 0, v);
      this.tileCache[`heart_${v}`] = canvas;
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

  // === 新增地磚繪製函式 ===

  /** 外圍地磚：野外/荒野風格（深綠+棕色泥土） */
  drawOuterTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 179 + 31);

    // 棕色泥土底色
    PA.rect(ctx, x, y, 16, 16, '#2a2218');

    // 泥土色調變化
    for (let i = 0; i < 10; i++) {
      const rx = Math.floor(rng() * 14);
      const ry = Math.floor(rng() * 14);
      const rw = 2 + Math.floor(rng() * 4);
      const rh = 1 + Math.floor(rng() * 3);
      const roll = rng();
      const shade = roll > 0.6 ? '#342a1e' : roll > 0.3 ? '#2e2618' : '#1e1a12';
      PA.rect(ctx, x + rx, y + ry, rw, rh, shade);
    }

    // 深綠色野草
    for (let i = 0; i < 6; i++) {
      const gx = 1 + Math.floor(rng() * 14);
      const gy = 2 + Math.floor(rng() * 12);
      const height = 1 + Math.floor(rng() * 2);
      const shade = rng() > 0.5 ? '#1a3018' : '#243820';
      for (let h = 0; h < height; h++) {
        if (gy - h >= 0) {
          PA.pixel(ctx, x + gx, y + gy - h, shade);
        }
      }
    }

    // 碎石
    for (let i = 0; i < 3; i++) {
      const sx = 1 + Math.floor(rng() * 14);
      const sy = 1 + Math.floor(rng() * 14);
      PA.pixel(ctx, x + sx, y + sy, rng() > 0.5 ? '#3a3428' : '#2a2620');
    }

    // 偶爾較亮的泥土斑點
    if (variant === 1 || variant === 4) {
      PA.pixel(ctx, x + 5, y + 8, '#3a3020');
      PA.pixel(ctx, x + 11, y + 4, '#3a3020');
    }
  },

  /** 可破壞牆地磚：裂紋磚塊，比普通牆亮 */
  drawBreakableWallTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 163 + 53);

    // 稍亮的石磚底色（比普通牆亮）
    PA.rect(ctx, x, y, 16, 16, '#3a3850');

    // 磚塊排列：2 排交錯
    const brickRows = [
      { y: 0, h: 7, offsets: variant % 2 === 0 ? [0, 7] : [0, 5, 11] },
      { y: 8, h: 8, offsets: variant % 2 === 0 ? [0, 5, 11] : [0, 8] },
    ];

    // 灰縫線
    PA.rect(ctx, x, y + 7, 16, 1, '#282638');

    for (const row of brickRows) {
      for (let i = 0; i < row.offsets.length; i++) {
        const bx = x + row.offsets[i];
        const bw = (i < row.offsets.length - 1)
          ? row.offsets[i + 1] - row.offsets[i] - 1
          : 16 - row.offsets[i];
        const by = y + row.y;

        const brickRoll = rng();
        const shade = brickRoll > 0.6 ? '#4a4868' : brickRoll > 0.3 ? '#3e3c58' : '#343248';
        PA.rect(ctx, bx, by, bw, row.h, shade);

        // 高光
        PA.rect(ctx, bx, by, bw, 1, '#5a5878');
        PA.rect(ctx, bx, by, 1, row.h, '#4e4c68');

        // 陰影
        PA.rect(ctx, bx, by + row.h - 1, bw, 1, '#2a2840');
        PA.rect(ctx, bx + bw - 1, by, 1, row.h, '#2a2840');

        // 灰縫
        if (i < row.offsets.length - 1) {
          PA.rect(ctx, bx + bw, by, 1, row.h, '#282638');
        }
      }
    }

    // 裂紋（每個變體 2-3 條裂縫）
    const crackCount = 2 + Math.floor(rng() * 2);
    for (let ci = 0; ci < crackCount; ci++) {
      const startX = 2 + Math.floor(rng() * 10);
      const startY = 2 + Math.floor(rng() * 10);
      const length = 3 + Math.floor(rng() * 4);
      const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      const dirIdx = Math.floor(rng() * 4);
      const [cdx, cdy] = dirs[dirIdx];

      for (let p = 0; p < length; p++) {
        const px = startX + cdx * p;
        const py = startY + cdy * p;
        if (px >= 0 && px < 16 && py >= 0 && py < 16) {
          PA.pixel(ctx, x + px, y + py, '#1a1828');
          // 裂紋旁高光
          if (px + 1 < 16) {
            PA.pixel(ctx, x + px + 1, y + py, '#5a5878');
          }
        }
      }
    }

    // 苔蘚點綴
    if (variant === 2 || variant === 4) {
      PA.pixel(ctx, x + 3, y + 7, C.WALL_MOSS);
      PA.pixel(ctx, x + 4, y + 7, C.WALL_MOSS);
      PA.pixel(ctx, x + 12, y + 7, '#1e3a1e');
    }
  },

  /** 地心地磚：特殊發光石板 */
  drawHeartTile(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 199 + 67);

    // 深紫色基底
    PA.rect(ctx, x, y, 16, 16, '#2a1a3a');

    // 發光石板圖案
    const innerShade = rng() > 0.5 ? '#3a2a4e' : '#342448';
    PA.rect(ctx, x + 1, y + 1, 14, 14, innerShade);

    // 核心發光（增強版：5層漸進式發光）
    PA.rect(ctx, x + 3, y + 3, 10, 10, '#4a2a5e'); // 外層
    PA.rect(ctx, x + 4, y + 4, 8, 8, '#5a3a6e');   // 中外層
    PA.rect(ctx, x + 5, y + 5, 6, 6, '#6a4a80');   // 中層
    PA.rect(ctx, x + 6, y + 6, 4, 4, '#8a6aa0');   // 中內層
    PA.rect(ctx, x + 7, y + 7, 2, 2, '#aa8ac0');   // 核心

    // 中心最亮點（擴大範圍）
    PA.pixel(ctx, x + 7, y + 7, '#ddbbff');
    PA.pixel(ctx, x + 8, y + 8, '#ddbbff');
    PA.pixel(ctx, x + 7, y + 8, '#ccaaee');
    PA.pixel(ctx, x + 8, y + 7, '#ccaaee');

    // 邊緣發光紋路（更明顯）
    for (let i = 2; i < 14; i++) {
      if (rng() > 0.3) {
        PA.pixel(ctx, x + i, y + 1, '#5a4a6e');
      }
      if (rng() > 0.3) {
        PA.pixel(ctx, x + i, y + 14, '#5a4a6e');
      }
      if (rng() > 0.3) {
        PA.pixel(ctx, x + 1, y + i, '#5a4a6e');
      }
      if (rng() > 0.3) {
        PA.pixel(ctx, x + 14, y + i, '#5a4a6e');
      }
    }

    // 角落暗化
    PA.pixel(ctx, x, y, '#1a0e28');
    PA.pixel(ctx, x + 15, y, '#1a0e28');
    PA.pixel(ctx, x, y + 15, '#1a0e28');
    PA.pixel(ctx, x + 15, y + 15, '#1a0e28');

    // 散落的能量粒子（增加數量和亮度）
    for (let i = 0; i < 6; i++) {
      const px = 3 + Math.floor(rng() * 10);
      const py = 3 + Math.floor(rng() * 10);
      const brightness = rng() > 0.5 ? '#aa8ac0' : '#9a7ab0';
      PA.pixel(ctx, x + px, y + py, brightness);
    }
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

  /**
   * 2×2 入口傳送門（綠色漩渦）
   * 尺寸：32×32px（佔據 2×2 格地磚）
   */
  drawEntrancePortal2x2(ctx, x, y, variant = 0) {
    const PA = DK.PixelArt;
    const rng = PA.seededRandom(variant * 197 + 43);

    // 底色：深綠色地板
    PA.rect(ctx, x, y, 32, 32, '#0a1a0a');

    // 外圈漩渦（深綠）
    PA.rect(ctx, x + 4, y + 4, 24, 24, '#1a3820');

    // 中圈漩渦（綠）
    PA.rect(ctx, x + 8, y + 8, 16, 16, '#2a5a30');

    // 內圈（亮綠）
    PA.rect(ctx, x + 11, y + 11, 10, 10, '#44aa44');

    // 核心發光
    PA.rect(ctx, x + 13, y + 13, 6, 6, '#66ff66');
    PA.pixel(ctx, x + 15, y + 15, '#aaffaa');
    PA.pixel(ctx, x + 16, y + 16, '#aaffaa');

    // 螺旋紋理（4 條螺旋臂）
    const spiralPoints = [
      // 北臂
      [15, 5], [16, 6], [17, 7],
      // 東臂
      [26, 15], [25, 16], [24, 17],
      // 南臂
      [15, 26], [16, 25], [17, 24],
      // 西臂
      [5, 15], [6, 16], [7, 17]
    ];

    spiralPoints.forEach(([px, py]) => {
      PA.pixel(ctx, x + px, y + py, '#88ff88');
    });

    // 隨機能量粒子（12 個）
    for (let i = 0; i < 12; i++) {
      const px = 10 + Math.floor(rng() * 12);
      const py = 10 + Math.floor(rng() * 12);
      const brightness = rng() > 0.5 ? '#aaffaa' : '#88ee88';
      PA.pixel(ctx, x + px, y + py, brightness);
    }

    // 邊緣暗化
    for (let i = 0; i < 32; i++) {
      PA.pixel(ctx, x + i, y, '#0a0a0a');
      PA.pixel(ctx, x + i, y + 31, '#0a0a0a');
      PA.pixel(ctx, x, y + i, '#0a0a0a');
      PA.pixel(ctx, x + 31, y + i, '#0a0a0a');
    }
  },

  /**
   * 2×2 出口傳送門（紅色漩渦）
   * 尺寸：32×32px（佔據 2×2 格地磚）
   */
  drawExitPortal2x2(ctx, x, y, variant = 0) {
    const PA = DK.PixelArt;
    const rng = PA.seededRandom(variant * 199 + 47);

    // 底色：深紅色地板
    PA.rect(ctx, x, y, 32, 32, '#1a0a0a');

    // 外圈漩渦（深紅）
    PA.rect(ctx, x + 4, y + 4, 24, 24, '#3a1820');

    // 中圈漩渦（紅）
    PA.rect(ctx, x + 8, y + 8, 16, 16, '#5a2a30');

    // 內圈（亮紅）
    PA.rect(ctx, x + 11, y + 11, 10, 10, '#aa4444');

    // 核心發光
    PA.rect(ctx, x + 13, y + 13, 6, 6, '#ff6666');
    PA.pixel(ctx, x + 15, y + 15, '#ffaaaa');
    PA.pixel(ctx, x + 16, y + 16, '#ffaaaa');

    // 螺旋紋理（4 條螺旋臂）
    const spiralPoints = [
      // 北臂
      [15, 5], [16, 6], [17, 7],
      // 東臂
      [26, 15], [25, 16], [24, 17],
      // 南臂
      [15, 26], [16, 25], [17, 24],
      // 西臂
      [5, 15], [6, 16], [7, 17]
    ];

    spiralPoints.forEach(([px, py]) => {
      PA.pixel(ctx, x + px, y + py, '#ff8888');
    });

    // 隨機能量粒子（12 個，紅色）
    for (let i = 0; i < 12; i++) {
      const px = 10 + Math.floor(rng() * 12);
      const py = 10 + Math.floor(rng() * 12);
      const brightness = rng() > 0.5 ? '#ffaaaa' : '#ff8888';
      PA.pixel(ctx, x + px, y + py, brightness);
    }

    // 邊緣暗化
    for (let i = 0; i < 32; i++) {
      PA.pixel(ctx, x + i, y, '#0a0a0a');
      PA.pixel(ctx, x + i, y + 31, '#0a0a0a');
      PA.pixel(ctx, x, y + i, '#0a0a0a');
      PA.pixel(ctx, x + 31, y + i, '#0a0a0a');
    }
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
        } else if (tile === 'O') {
          const variant = (c * 7 + r * 13) % 6;
          ctx.drawImage(this.tileCache[`outer_${variant}`], x, y);
        } else if (tile === 'B') {
          const variant = (c * 7 + r * 13) % 6;
          ctx.drawImage(this.tileCache[`breakable_${variant}`], x, y);
        } else if (tile === 'H') {
          const variant = (c * 7 + r * 13) % 6;
          ctx.drawImage(this.tileCache[`heart_${variant}`], x, y);
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

    // 第六通道：地心脈動光暈
    this.renderHeartGlow(ctx);

    // 注意：renderVignette 已移至 main.js restore 之後（螢幕空間，不受 camera 影響）
  },

  /** 地心脈動光暈動畫 */
  renderHeartGlow(ctx) {
    const T = DK.CONFIG.TILE_SIZE;
    const timestamp = DK.Game ? DK.Game.time : 0;
    const alpha = 0.12 + 0.08 * Math.sin(timestamp * 0.002);
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.layout[r][c];
        if (tile !== 'H') continue;

        const x = c * T;
        const y = r * T;

        // 3 層同心半透明矩形模擬光暈擴散（由外到內漸亮）
        // 第 3 層（最外層）— 紫色光暈
        ctx.fillStyle = `rgba(120,80,180,${alpha * 0.3})`;
        ctx.fillRect(x - 4, y - 4, T + 8, T + 8);

        // 第 2 層（中層）
        ctx.fillStyle = `rgba(140,100,200,${alpha * 0.5})`;
        ctx.fillRect(x - 2, y - 2, T + 4, T + 4);

        // 第 1 層（內層，最亮）
        ctx.fillStyle = `rgba(160,120,220,${alpha})`;
        ctx.fillRect(x, y, T, T);
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
      // 火焰高度 5->6px：加一個額外頂部像素
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

    // 邊緣暗化營造氛圍（alpha 0.15 -> 0.22）
    ctx.fillStyle = 'rgba(10,8,18,0.22)';
    ctx.fillRect(0, 0, W, T);
    ctx.fillRect(0, H - T, W, T);
    ctx.fillRect(0, 0, T, H);
    ctx.fillRect(W - T, 0, T, H);

    // 角落更深的暗化（alpha 0.1 -> 0.2）
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
  // === 編輯器裝飾地磚 ===

  /** 火把 (T) - 牆上的火把 */
  drawTorchTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawWallTile(ctx, x, y, 0);
    PA.rect(ctx, x + 7, y + 8, 2, 5, '#4a3020');
    PA.pixel(ctx, x + 7, y + 8, '#5a4030');
    PA.pixel(ctx, x + 6, y + 6, '#ff8800');
    PA.pixel(ctx, x + 7, y + 5, '#ffaa00');
    PA.pixel(ctx, x + 8, y + 5, '#ffaa00');
    PA.pixel(ctx, x + 9, y + 6, '#ff8800');
    PA.pixel(ctx, x + 7, y + 6, '#ffcc44');
    PA.pixel(ctx, x + 8, y + 6, '#ffcc44');
    PA.pixel(ctx, x + 7, y + 7, '#ff9922');
    PA.pixel(ctx, x + 8, y + 7, '#ff9922');
  },

  /** 寶箱 (C) - 金幣寶箱 */
  drawChestTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 4, y + 9, 8, 4, '#4a3020');
    PA.rect(ctx, x + 5, y + 10, 6, 2, '#5a4030');
    PA.rect(ctx, x + 4, y + 7, 8, 2, '#6a5040');
    PA.rect(ctx, x + 5, y + 6, 6, 1, '#7a6050');
    PA.pixel(ctx, x + 7, y + 9, '#ffd700');
    PA.pixel(ctx, x + 8, y + 9, '#ffd700');
    PA.pixel(ctx, x + 7, y + 10, '#ffaa00');
    PA.pixel(ctx, x + 8, y + 10, '#ffaa00');
  },

  /** 石柱 (L) - 裝飾石柱 */
  drawPillarTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 5, y + 2, 6, 12, '#5a5a6e');
    PA.rect(ctx, x + 6, y + 3, 4, 10, '#6a6a7e');
    PA.rect(ctx, x + 4, y + 1, 8, 2, '#7a7a8e');
    PA.rect(ctx, x + 5, y + 2, 6, 1, '#8a8a9e');
    PA.rect(ctx, x + 4, y + 13, 8, 2, '#4a4a5e');
    PA.pixel(ctx, x + 6, y + 5, '#9a9aae');
    PA.pixel(ctx, x + 6, y + 7, '#9a9aae');
  },

  /** 骸骨 (S) - 骷髏骨頭 */
  drawSkullTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 6, y + 7, 4, 4, '#d0c8b0');
    PA.rect(ctx, x + 5, y + 8, 6, 2, '#e0d8c0');
    PA.pixel(ctx, x + 6, y + 8, '#1a1a1a');
    PA.pixel(ctx, x + 9, y + 8, '#1a1a1a');
    PA.pixel(ctx, x + 7, y + 9, '#2a2a2a');
    PA.pixel(ctx, x + 8, y + 9, '#2a2a2a');
    PA.rect(ctx, x + 4, y + 11, 3, 1, '#c0b8a0');
    PA.rect(ctx, x + 9, y + 11, 3, 1, '#c0b8a0');
  },

  /** 符文 (U) - 發光符文地板 */
  drawRuneTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.pixel(ctx, x + 8, y + 5, '#44aaff');
    PA.pixel(ctx, x + 7, y + 6, '#44aaff');
    PA.pixel(ctx, x + 8, y + 6, '#66ccff');
    PA.pixel(ctx, x + 9, y + 6, '#44aaff');
    PA.pixel(ctx, x + 6, y + 7, '#44aaff');
    PA.pixel(ctx, x + 8, y + 7, '#66ccff');
    PA.pixel(ctx, x + 10, y + 7, '#44aaff');
    PA.pixel(ctx, x + 7, y + 8, '#44aaff');
    PA.pixel(ctx, x + 8, y + 8, '#88eeff');
    PA.pixel(ctx, x + 9, y + 8, '#44aaff');
    PA.pixel(ctx, x + 8, y + 9, '#44aaff');
    PA.pixel(ctx, x + 6, y + 10, '#2288cc');
    PA.pixel(ctx, x + 10, y + 10, '#2288cc');
  },

  /** 火盆 (F) - 地板火盆 */
  drawFirePitTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 5, y + 10, 6, 3, '#3a3a3a');
    PA.rect(ctx, x + 6, y + 11, 4, 1, '#2a2a2a');
    PA.pixel(ctx, x + 6, y + 8, '#ff8800');
    PA.pixel(ctx, x + 7, y + 7, '#ffaa00');
    PA.pixel(ctx, x + 8, y + 6, '#ffcc44');
    PA.pixel(ctx, x + 9, y + 7, '#ffaa00');
    PA.pixel(ctx, x + 10, y + 8, '#ff8800');
    PA.pixel(ctx, x + 7, y + 9, '#ff9922');
    PA.pixel(ctx, x + 8, y + 9, '#ffbb33');
    PA.pixel(ctx, x + 9, y + 9, '#ff9922');
  },

  /** 水晶 (X) - 發光水晶 */
  drawCrystalTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 7, y + 6, 2, 6, '#aa44ff');
    PA.pixel(ctx, x + 8, y + 5, '#cc66ff');
    PA.pixel(ctx, x + 6, y + 7, '#8833cc');
    PA.pixel(ctx, x + 9, y + 7, '#8833cc');
    PA.pixel(ctx, x + 7, y + 8, '#cc88ff');
    PA.pixel(ctx, x + 8, y + 8, '#ee99ff');
    PA.pixel(ctx, x + 8, y + 6, '#ffaaff');
    PA.pixel(ctx, x + 7, y + 9, '#bb66ee');
    PA.rect(ctx, x + 6, y + 12, 4, 1, '#5a5a6e');
  },

  /** 門 (D) - 木門 */
  drawDoorTile(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 3, y + 2, 10, 12, '#4a4a5e');
    PA.rect(ctx, x + 5, y + 3, 6, 10, '#5a4030');
    PA.rect(ctx, x + 6, y + 4, 4, 8, '#6a5040');
    PA.rect(ctx, x + 5, y + 6, 6, 1, '#4a3020');
    PA.rect(ctx, x + 5, y + 9, 6, 1, '#4a3020');
    PA.pixel(ctx, x + 9, y + 8, '#ffd700');
    PA.pixel(ctx, x + 9, y + 9, '#ffaa00');
  }
};
