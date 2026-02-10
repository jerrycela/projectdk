/**
 * ProjectDK 關卡編輯器 - 主控制器
 * 職責：初始化、狀態管理、主渲染循環
 */

// 確保 DK namespace 存在
if (typeof DK === 'undefined') {
  window.DK = {};
}

DK.Editor = {
  // === 狀態 ===
  currentLevel: null,      // 正在編輯的關卡
  mode: 'tiles',           // 'tiles' | 'portals' | 'waves'
  selectedTool: 'paint',   // 'paint' | 'fill' | 'erase' | 'picker'
  selectedTile: 'W',       // 當前選中的地磚類型
  brushSize: 1,            // 1, 2, 3
  isDirty: false,          // 是否有未儲存變更

  // === Canvas ===
  gameCanvas: null,
  gameCtx: null,
  uiCanvas: null,
  uiCtx: null,

  // === 地圖資料 ===
  layout: [],              // 地圖陣列 [row][col]
  cols: 20,
  rows: 13,

  // === 滑鼠狀態 ===
  mouse: {
    col: -1,
    row: -1,
    isDown: false,
    lastPaintedCol: -1,
    lastPaintedRow: -1
  },

  // === 渲染 ===
  animationFrame: null,

  /**
   * 初始化編輯器
   */
  init() {
    console.log('🎮 初始化關卡編輯器...');

    // 1. 初始化 Canvas
    this.initCanvas();

    // 2. 創建空白地圖
    this.createEmptyLevel();

    // 3. 初始化 UI（由 editor-ui.js 處理）
    if (DK.EditorUI && DK.EditorUI.init) {
      DK.EditorUI.init();
    }

    // 4. 初始化工具（由 editor-tools.js 處理）
    if (DK.EditorTools && DK.EditorTools.init) {
      DK.EditorTools.init();
    }

    // 5. 初始化存儲（由 editor-storage.js 處理）
    if (DK.EditorStorage && DK.EditorStorage.init) {
      DK.EditorStorage.init();
    }

    // 6. 初始化傳送門系統（由 editor-portal.js 處理）
    if (DK.EditorPortal && DK.EditorPortal.init) {
      DK.EditorPortal.init();
    }

    // 7. 初始化波次編輯器（由 editor-wave.js 處理）
    if (DK.EditorWave && DK.EditorWave.init) {
      DK.EditorWave.init();
    }

    // 8. 設置事件監聽
    this.setupEventListeners();

    // 9. 啟動渲染循環
    this.startRenderLoop();

    console.log('✅ 編輯器初始化完成');
  },

  /**
   * 初始化 Canvas
   */
  initCanvas() {
    // 低解析度地圖 Canvas
    this.gameCanvas = document.getElementById('game-canvas');
    this.gameCtx = this.gameCanvas.getContext('2d');
    this.gameCtx.imageSmoothingEnabled = false;

    // 高解析度 UI Canvas
    this.uiCanvas = document.getElementById('ui-canvas');
    this.uiCtx = this.uiCanvas.getContext('2d');
    this.uiCtx.imageSmoothingEnabled = false;

    // 設置 Canvas 樣式（4x 縮放）
    const scale = 4;
    this.gameCanvas.style.width = `${this.gameCanvas.width * scale}px`;
    this.gameCanvas.style.height = `${this.gameCanvas.height * scale}px`;
    this.uiCanvas.style.width = `${this.uiCanvas.width}px`;
    this.uiCanvas.style.height = `${this.uiCanvas.height}px`;

    console.log('✅ Canvas 初始化完成');
  },

  /**
   * 創建空白關卡
   */
  createEmptyLevel() {
    this.cols = 40;
    this.rows = 26;
    this.layout = [];

    // 創建空白地圖（全部填充地板）
    for (let row = 0; row < this.rows; row++) {
      let rowStr = '';
      for (let col = 0; col < this.cols; col++) {
        // 邊界填充外圍 'O'
        if (row === 0 || row === this.rows - 1 || col === 0 || col === this.cols - 1) {
          rowStr += 'O';
        } else {
          rowStr += '.';
        }
      }
      this.layout.push(rowStr);
    }

    // 在中心放置地心（2x2）
    const heartRow = Math.floor(this.rows / 2);
    const heartCol = Math.floor(this.cols / 2);
    this.setTile(heartCol, heartRow, 'H');
    this.setTile(heartCol + 1, heartRow, 'H');
    this.setTile(heartCol, heartRow + 1, 'H');
    this.setTile(heartCol + 1, heartRow + 1, 'H');

    this.currentLevel = {
      id: null,
      name: '新關卡',
      layout: [...this.layout],
      portals: [],
      startingGold: 1000,
      dungeonHeartHP: 100
    };

    this.isDirty = false;
    console.log('✅ 空白關卡創建完成');
  },

  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    // Canvas 滑鼠事件
    this.uiCanvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.uiCanvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.uiCanvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.uiCanvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));

    // 鍵盤快捷鍵
    document.addEventListener('keydown', this.onKeyDown.bind(this));

    // 按鈕事件
    document.getElementById('btnSave')?.addEventListener('click', () => this.save());
    document.getElementById('btnExport')?.addEventListener('click', () => this.exportJSON());
    document.getElementById('btnTest')?.addEventListener('click', () => this.testLevel());
    document.getElementById('btnClear')?.addEventListener('click', () => this.clearMap());

    console.log('✅ 事件監聽設置完成');
  },

  /**
   * 滑鼠按下
   */
  onMouseDown(e) {
    this.mouse.isDown = true;
    this.updateMousePosition(e);
    this.handlePaint();
  },

  /**
   * 滑鼠移動
   */
  onMouseMove(e) {
    this.updateMousePosition(e);
    if (this.mouse.isDown) {
      this.handlePaint();
    }
  },

  /**
   * 滑鼠放開
   */
  onMouseUp(e) {
    this.mouse.isDown = false;
    this.mouse.lastPaintedCol = -1;
    this.mouse.lastPaintedRow = -1;
  },

  /**
   * 滑鼠離開
   */
  onMouseLeave(e) {
    this.mouse.col = -1;
    this.mouse.row = -1;
    this.mouse.isDown = false;
  },

  /**
   * 更新滑鼠位置（轉換為地磚座標）
   */
  updateMousePosition(e) {
    const rect = this.uiCanvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // 計算地磚座標（64px per tile = 16px * 4 scale）
    const tileSize = 64; // DISPLAY_TILE
    this.mouse.col = Math.floor(canvasX / tileSize);
    this.mouse.row = Math.floor(canvasY / tileSize);
  },

  /**
   * 處理繪製
   */
  handlePaint() {
    const { col, row } = this.mouse;

    // 邊界檢查
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

    // 避免重複繪製同一格
    if (col === this.mouse.lastPaintedCol && row === this.mouse.lastPaintedRow) return;

    // 根據工具類型處理
    if (this.selectedTool === 'paint') {
      this.paintTile(col, row);
    } else if (this.selectedTool === 'erase') {
      this.setTile(col, row, '.');
    } else if (this.selectedTool === 'picker') {
      this.pickTile(col, row);
    } else if (this.selectedTool === 'portal-place') {
      // 傳送門放置
      if (DK.EditorPortal && DK.EditorPortal.placePortal) {
        DK.EditorPortal.placePortal(col, row);
        // 放置後恢復畫筆工具
        this.selectedTool = 'paint';
        document.getElementById('statusTool').textContent = '當前工具: 畫筆';
      }
      return; // 不需要記錄 lastPaintedCol/Row
    }

    this.mouse.lastPaintedCol = col;
    this.mouse.lastPaintedRow = row;
    this.markDirty();
  },

  /**
   * 繪製地磚
   */
  paintTile(col, row) {
    // 特殊處理：2×2 傳送門自動放置
    if (this.selectedTile === 'E' || this.selectedTile === 'M') {
      // 驗證是否有足夠空間放置 2×2
      if (col + 1 >= this.cols || row + 1 >= this.rows) {
        console.warn('⚠️ 傳送門需要 2×2 空間，位置超出地圖邊界');
        return;
      }

      // 自動放置 2×2 傳送門
      this.setTile(col, row, this.selectedTile);
      this.setTile(col + 1, row, this.selectedTile);
      this.setTile(col, row + 1, this.selectedTile);
      this.setTile(col + 1, row + 1, this.selectedTile);
      return;
    }

    // 一般地磚繪製邏輯
    if (this.brushSize === 1) {
      this.setTile(col, row, this.selectedTile);
    } else {
      // 多格畫筆（中心對齊）
      const halfSize = Math.floor(this.brushSize / 2);
      for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
          this.setTile(col + dx, row + dy, this.selectedTile);
        }
      }
    }
  },

  /**
   * 吸管工具
   */
  pickTile(col, row) {
    const tile = this.getTile(col, row);
    if (tile && tile !== 'O') {
      this.selectedTile = tile;
      this.selectedTool = 'paint';

      // 更新 UI（由 editor-ui.js 處理）
      if (DK.EditorUI && DK.EditorUI.updateTilePalette) {
        DK.EditorUI.updateTilePalette();
      }
    }
  },

  /**
   * 設置地磚
   */
  setTile(col, row, tile) {
    // 邊界檢查
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

    // 字串轉陣列 → 修改 → 陣列轉字串
    const chars = this.layout[row].split('');
    chars[col] = tile;
    this.layout[row] = chars.join('');
  },

  /**
   * 取得地磚
   */
  getTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
    return this.layout[row][col];
  },

  /**
   * 鍵盤快捷鍵
   */
  onKeyDown(e) {
    // Ctrl+S - 儲存
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      this.save();
    }
    // Ctrl+T - 測試
    else if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      this.testLevel();
    }
    // Ctrl+Z - Undo
    else if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      if (DK.EditorTools && DK.EditorTools.undo) {
        DK.EditorTools.undo();
      }
    }
    // Ctrl+Y - Redo
    else if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      if (DK.EditorTools && DK.EditorTools.redo) {
        DK.EditorTools.redo();
      }
    }
    // 數字鍵 1-3 - 畫筆大小
    else if (e.key >= '1' && e.key <= '3') {
      this.brushSize = parseInt(e.key);
      if (DK.EditorUI && DK.EditorUI.updateBrushSize) {
        DK.EditorUI.updateBrushSize();
      }
    }
    // P - 畫筆
    else if (e.key === 'p' || e.key === 'P') {
      this.selectedTool = 'paint';
      if (DK.EditorUI && DK.EditorUI.updateToolButtons) {
        DK.EditorUI.updateToolButtons();
      }
    }
    // F - 填充
    else if (e.key === 'f' || e.key === 'F') {
      this.selectedTool = 'fill';
      if (DK.EditorUI && DK.EditorUI.updateToolButtons) {
        DK.EditorUI.updateToolButtons();
      }
    }
    // Q - 吸管
    else if (e.key === 'q' || e.key === 'Q') {
      this.selectedTool = 'picker';
      if (DK.EditorUI && DK.EditorUI.updateToolButtons) {
        DK.EditorUI.updateToolButtons();
      }
    }
  },

  /**
   * 標記為未儲存
   */
  markDirty() {
    this.isDirty = true;
    document.getElementById('statusDirty').style.display = 'inline';
  },

  /**
   * 清空地圖
   */
  clearMap() {
    if (!confirm('確定要清空地圖嗎？此操作無法復原。')) return;
    this.createEmptyLevel();
  },

  /**
   * 儲存（使用 localStorage）
   */
  save() {
    if (DK.EditorStorage && DK.EditorStorage.save) {
      DK.EditorStorage.save();
      this.isDirty = false;
      document.getElementById('statusDirty').style.display = 'none';
      alert('✅ 儲存成功');
    }
  },

  /**
   * 匯出 JSON
   */
  exportJSON() {
    if (DK.EditorStorage && DK.EditorStorage.exportJSON) {
      DK.EditorStorage.exportJSON();
    }
  },

  /**
   * 測試關卡
   */
  testLevel() {
    console.log('🧪 準備測試關卡...');

    // 1. 取得當前關卡資料
    const level = DK.EditorStorage.getCurrentLevelData();

    // 2. 使用測試專用驗證
    const validation = DK.EditorStorage.validateForTesting(level);

    // 顯示錯誤（阻止測試）
    if (!validation.valid) {
      alert(`❌ 無法測試關卡：\n\n${validation.errors.join('\n')}\n\n請修正後再試。`);
      return;
    }

    // 顯示警告（不阻止測試）
    if (validation.warnings && validation.warnings.length > 0) {
      const warningMsg = `⚠️ 關卡警告：\n\n${validation.warnings.join('\n')}\n\n仍要繼續測試嗎？`;
      if (!confirm(warningMsg)) {
        return;
      }
    }

    // 3. 統計資訊
    const totalWaves = level.portals.reduce((sum, p) => sum + (p.waves?.length || 0), 0);
    const totalEnemies = level.portals.reduce((sum, p) => {
      return sum + (p.waves || []).reduce((wSum, w) => {
        return wSum + (w.enemies || []).reduce((eSum, e) => eSum + (e.count || 0), 0);
      }, 0);
    }, 0);

    // 4. 確認對話框
    const confirmMsg = `🧪 測試關卡配置：

關卡名稱: ${level.name}
傳送門: ${level.portals.length} 個
總波次: ${totalWaves} 波
總敵人: ${totalEnemies} 個
起始金幣: ${level.startingGold}
地心生命: ${level.dungeonHeartHP}

確定要開始測試嗎？`;

    if (!confirm(confirmMsg)) {
      return;
    }

    // 6. 儲存到 localStorage
    try {
      localStorage.setItem('dk_test_level', JSON.stringify(level));
      console.log('✅ 測試關卡已儲存到 localStorage');
    } catch (e) {
      alert(`❌ 無法儲存測試關卡：${e.message}`);
      return;
    }

    // 7. 開啟遊戲測試視窗
    const gameUrl = 'index.html?test=1';
    const testWindow = window.open(gameUrl, '_blank', 'width=1200,height=800');

    if (!testWindow) {
      alert('❌ 無法開啟測試視窗\n\n請允許瀏覽器彈出視窗，或手動開啟 index.html?test=1');
    } else {
      console.log('✅ 測試視窗已開啟');
    }
  },

  /**
   * 渲染循環
   */
  startRenderLoop() {
    const render = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(render);
    };
    render();
  },

  /**
   * 主渲染函式
   */
  render() {
    // 清空 Canvas
    this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
    this.uiCtx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);

    // 1. 渲染地圖（使用 PixelArt API）
    this.renderMap();

    // 2. 渲染 UI（網格線、Hover 高亮）
    if (DK.EditorUI && DK.EditorUI.render) {
      DK.EditorUI.render();
    }
  },

  /**
   * 渲染地圖
   */
  renderMap() {
    const ctx = this.gameCtx;
    const tileSize = 16; // 原始地磚大小

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.getTile(col, row);
        const x = col * tileSize;
        const y = row * tileSize;

        // 根據地磚類型繪製
        this.renderTile(ctx, tile, x, y);
      }
    }
  },

  /**
   * 渲染單個地磚（使用遊戲真實的像素藝術風格）
   */
  renderTile(ctx, tile, x, y) {
    if (!DK.Map) return;

    // 使用固定 variant 0 (編輯器不需要動畫變體)
    const variant = 0;

    switch (tile) {
      case 'W': // 牆壁
        DK.Map.drawWallTile(ctx, x, y, variant);
        break;
      case '.': // 地板
        DK.Map.drawFloorTile(ctx, x, y, variant);
        break;
      case 'O': // 外圍
        DK.Map.drawOuterTile(ctx, x, y, variant);
        break;
      case 'H': // 地心
        DK.Map.drawHeartTile(ctx, x, y, 2); // 使用 variant=2 確保與遊戲內一致
        break;
      case 'E': // 入口傳送門 (2×2 漩渦)
        DK.Map.drawEntrancePortal2x2(ctx, x, y, variant);
        break;
      case 'M': // 出口傳送門 (2×2 漩渦)
        DK.Map.drawExitPortal2x2(ctx, x, y, variant);
        break;
      case 'P': // 水潭
        DK.Map.drawPoolTile(ctx, x, y, variant);
        break;
      case 'A': // 深淵
        DK.Map.drawAbyssTile(ctx, x, y, variant);
        break;
      case 'G': // 草叢
        DK.Map.drawGrassTile(ctx, x, y, variant);
        break;
      case 'R': // 軌道
        // 軌道暫時用地板代替
        DK.Map.drawFloorTile(ctx, x, y, variant);
        break;
      case 'B': // 路障
        DK.Map.drawBreakableWallTile(ctx, x, y, variant);
        break;
      case 'T': // 火把（使用座標為基礎的變體）
        DK.Map.drawTorchTile(ctx, x, y, (x / 16 + y / 16 * 13) % 3);
        break;
      case 'C': // 寶箱（使用座標為基礎的變體）
        DK.Map.drawChestTile(ctx, x, y, (x / 16 + y / 16 * 13) % 3);
        break;
      case 'L': // 石柱（使用座標為基礎的變體）
        DK.Map.drawPillarTile(ctx, x, y, (x / 16 + y / 16 * 13) % 3);
        break;
      case 'S': // 骸骨（使用座標為基礎的變體）
        DK.Map.drawSkullTile(ctx, x, y, (x / 16 + y / 16 * 13) % 3);
        break;
      case 'U': // 符文
        DK.Map.drawRuneTile(ctx, x, y);
        break;
      case 'F': // 火盆
        DK.Map.drawFirePitTile(ctx, x, y);
        break;
      case 'X': // 水晶
        DK.Map.drawCrystalTile(ctx, x, y);
        break;
      case 'D': // 門
        DK.Map.drawDoorTile(ctx, x, y);
        break;
      default:
        // 預設使用地板
        DK.Map.drawFloorTile(ctx, x, y, variant);
    }
  }
};
