/**
 * Dungeon Keep - 地圖核心系統
 * 管理地城佈局、地磚數據、路徑快取
 */
window.DK = window.DK || {};

/**
 * DK.PathCache - 路徑快取系統
 * 快取 BFS 路徑計算結果，避免重複計算相同起終點的路徑
 * 當地圖變化時（陷阱放置、牆壁破壞）自動清除快取
 */
DK.PathCache = {
  cache: new Map(),
  hits: 0,
  misses: 0,

  /**
   * 生成快取鍵
   */
  getCacheKey(startCol, startRow, endCol, endRow) {
    return `${startCol},${startRow}-${endCol},${endRow}`;
  },

  /**
   * 取得快取的路徑
   * @returns {Array|null} 快取的路徑或 null
   */
  getPath(startCol, startRow, endCol, endRow) {
    const key = this.getCacheKey(startCol, startRow, endCol, endRow);
    const cached = this.cache.get(key);
    if (cached) {
      this.hits++;
      return cached;
    }
    this.misses++;
    return null;
  },

  /**
   * 儲存路徑到快取
   */
  setPath(startCol, startRow, endCol, endRow, path) {
    const key = this.getCacheKey(startCol, startRow, endCol, endRow);
    this.cache.set(key, path);
  },

  /**
   * 清除所有快取（地圖變化時調用）
   */
  invalidate() {
    this.cache.clear();
    // 保留統計數據以便觀察快取效果
  },

  /**
   * 取得快取統計資訊
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : 0;
    return {
      hits: this.hits,
      misses: this.misses,
      total: total,
      hitRate: hitRate + '%',
      cacheSize: this.cache.size,
    };
  },

  /**
   * 重置統計數據
   */
  resetStats() {
    this.hits = 0;
    this.misses = 0;
  },
};

DK.Map = {

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
    // 使用錯誤處理包裝初始化流程
    if (DK.ErrorHandler) {
      return DK.ErrorHandler.wrapSync(() => this._initInternal(), 'Failed to initialize map');
    }
    // 降級處理：無錯誤處理器時直接執行
    return this._initInternal();
  },

  _initInternal() {
    // 動態載入關卡地圖（如果 LevelManager 有提供）
    if (DK.LevelManager?.currentLevel?.layout &&
        DK.LevelManager.currentLevel.layout !== 'original') {
      this.layout = DK.LevelManager.currentLevel.layout;
    }

    // 載入傳送門配置（新地圖）或自動掃描（舊地圖）
    if (DK.LevelManager?.currentLevel?.portals) {
      this.portals = DK.LevelManager.currentLevel.portals;
      if (DK.DEBUG_MODE) {
        console.log(`🌀 載入 ${this.portals.length} 個傳送門（來自關卡配置）`);
      }
      if (DK.ErrorHandler) {
        DK.ErrorHandler.log('info', `Loaded ${this.portals.length} portals from level config`);
      }
    } else {
      // 向後相容：舊地圖無 portals metadata,自動掃描 'E' 標記
      this.scanPortalsFromLayout();
      if (this.portals && this.portals.length > 0) {
        if (DK.DEBUG_MODE) {
          console.log(`🌀 掃描到 ${this.portals.length} 個傳送門（來自 layout 'E' 標記）`);
        }
        if (DK.ErrorHandler) {
          DK.ErrorHandler.log('info', `Scanned ${this.portals.length} portals from layout`);
        }
      }
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
    // 計算路徑預覽快取（從傳送門到地心的動線）
    if (this.recomputePathPreview) {
      this.recomputePathPreview();
    }
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

  /**
   * 自動掃描 layout 中的 'E' 標記，生成預設 portals
   * 向後相容：舊地圖無 portals metadata 時自動呼叫
   */
  scanPortalsFromLayout() {
    if (this.portals && this.portals.length > 0) {
      // 已有 portals，不覆蓋
      return;
    }

    const entrances = [];
    // 掃描所有 'E' tile
    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        if (this.layout[r][c] === 'E') {
          entrances.push({ x: c, y: r });
        }
      }
    }

    // 生成預設 portals（entrance = E 位置，exit = 地圖中心偏移）
    this.portals = entrances.map((ent, idx) => {
      const mapCenterX = Math.floor(this.layout[0].length / 2);
      const mapCenterY = Math.floor(this.layout.length / 2);
      return {
        id: idx + 1,
        entrance: ent,
        exit: {
          x: mapCenterX + (idx % 3) - 1, // 簡單偏移避免重疊
          y: mapCenterY + Math.floor(idx / 3) - 1
        }
      };
    });
  },

  /** 檢查該格是否有傳送門（2×2 檢查） */
  hasPortal(col, row) {
    return this.portals.some(p => {
      const ex = p.entrance ? p.entrance.x : p.col;
      const ey = p.entrance ? p.entrance.y : p.row;
      // 檢查 (col, row) 是否在 2×2 範圍內
      return col >= ex && col < ex + 2 && row >= ey && row < ey + 2;
    });
  },

  /** 取得該格的傳送門物件（2×2 檢查） */
  getPortalAt(col, row) {
    return this.portals.find(p => {
      const ex = p.entrance ? p.entrance.x : p.col;
      const ey = p.entrance ? p.entrance.y : p.row;
      return col >= ex && col < ex + 2 && row >= ey && row < ey + 2;
    }) || null;
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

  /**
   * @deprecated BREACH 階段已移除，改用預配置的 portals
   * 保留向後相容但不再使用
   */
  breakWall(col, row) {
    console.warn('[Deprecated] breakWall() - 請使用 portals 系統');
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
};
