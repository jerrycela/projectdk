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

  // === 視角控制 ===
  camera: {
    x: 0,              // 視角偏移 X（格數）
    y: 0,              // 視角偏移 Y（格數）
    zoom: 1.0,         // 縮放倍率（0.5 - 2.0）
    isDragging: false, // 是否正在拖曳
    dragStartX: 0,     // 拖曳起始點 X（螢幕座標）
    dragStartY: 0,     // 拖曳起始點 Y（螢幕座標）
    dragStartCameraX: 0,
    dragStartCameraY: 0
  },

  // === 渲染 ===
  tileCache: null,         // 地磚快取（預渲染的 canvas）
  animationFrame: null,
  spacePressed: false,     // 空白鍵是否按下

  /**
   * 初始化編輯器
   */
  init() {
    // 1. 初始化 Canvas
    this.initCanvas();

    // 2. 創建空白地圖
    this.createEmptyLevel();

    // 3. 初始化地磚快取
    this.initTileCache();

    // 4. 初始化 UI（由 editor-ui.js 處理）
    if (DK.EditorUI && DK.EditorUI.init) {
      DK.EditorUI.init();
    }

    // 5. 初始化工具（由 editor-tools.js 處理）
    if (DK.EditorTools && DK.EditorTools.init) {
      DK.EditorTools.init();
    }

    // 6. 初始化存儲（由 editor-storage.js 處理）
    if (DK.EditorStorage && DK.EditorStorage.init) {
      DK.EditorStorage.init();
    }

    // 7. 初始化傳送門系統（由 editor-portal.js 處理）
    if (DK.EditorPortal && DK.EditorPortal.init) {
      DK.EditorPortal.init();
    }

    // 8. 初始化波次編輯器（由 editor-wave.js 處理）
    if (DK.EditorWave && DK.EditorWave.init) {
      DK.EditorWave.init();
    }

    // 9. 初始化小地圖（由 editor-minimap.js 處理）
    if (DK.EditorMinimap && DK.EditorMinimap.init) {
      DK.EditorMinimap.init();
    }

    // 10. 設置事件監聽
    this.setupEventListeners();

    // 11. 設置視角控制
    this.setupCameraControls();

    // 12. 啟動渲染循環
    this.startRenderLoop();
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

    // Canvas 樣式現在由 CSS 處理（響應式縮放）
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

    // 重建地磚快取（如果已初始化）
    if (this.tileCache !== null) {
      this.clearTileCache();
      this.initTileCache();
    }

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
    document.addEventListener('keyup', this.onKeyUp.bind(this));

    // 按鈕事件
    document.getElementById('btnSave')?.addEventListener('click', () => this.save());
    document.getElementById('btnExport')?.addEventListener('click', () => this.exportJSON());
    document.getElementById('btnTest')?.addEventListener('click', () => this.testLevel());
    document.getElementById('btnClear')?.addEventListener('click', () => this.clearMap());

  },

  /**
   * 設置視角控制
   */
  setupCameraControls() {
    // 滑鼠滾輪縮放
    this.uiCanvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });

  },

  /**
   * 滑鼠按下
   */
  onMouseDown(e) {
    // 檢查是否為視角拖曳（中鍵 或 空白鍵+左鍵）
    const isMiddleButton = e.button === 1;
    const isSpaceLeftClick = e.button === 0 && this.spacePressed;

    if (isMiddleButton || isSpaceLeftClick) {
      e.preventDefault();
      this.camera.isDragging = true;
      this.camera.dragStartX = e.clientX;
      this.camera.dragStartY = e.clientY;
      this.camera.dragStartCameraX = this.camera.x;
      this.camera.dragStartCameraY = this.camera.y;
      this.uiCanvas.style.cursor = 'grabbing';
      return;
    }

    this.mouse.isDown = true;
    this.updateMousePosition(e);
    this.handlePaint();
  },

  /**
   * 滑鼠移動
   */
  onMouseMove(e) {
    // 處理視角拖曳
    if (this.camera.isDragging) {
      const deltaX = e.clientX - this.camera.dragStartX;
      const deltaY = e.clientY - this.camera.dragStartY;

      // 計算實際顯示比例
      const rect = this.uiCanvas.getBoundingClientRect();
      const scaleX = this.uiCanvas.width / rect.width;
      const scaleY = this.uiCanvas.height / rect.height;

      // 計算新的 camera 位置（考慮縮放和實際顯示比例）
      const tileSize = 16; // 原始地磚大小
      const tilesPerCanvasUnit = 1 / (tileSize * 4); // ui canvas 是 4x scale

      this.camera.x = this.camera.dragStartCameraX - (deltaX * scaleX * tilesPerCanvasUnit) / this.camera.zoom;
      this.camera.y = this.camera.dragStartCameraY - (deltaY * scaleY * tilesPerCanvasUnit) / this.camera.zoom;

      // 邊界限制（計算當前視野可顯示的地磚數量）
      const viewportCols = this.gameCanvas.width / tileSize / this.camera.zoom;
      const viewportRows = this.gameCanvas.height / tileSize / this.camera.zoom;

      this.camera.x = Math.max(0, Math.min(this.camera.x, this.cols - viewportCols));
      this.camera.y = Math.max(0, Math.min(this.camera.y, this.rows - viewportRows));

      return;
    }

    this.updateMousePosition(e);
    if (this.mouse.isDown) {
      this.handlePaint();
    }
  },

  /**
   * 滑鼠放開
   */
  onMouseUp(e) {
    // 結束視角拖曳
    if (this.camera.isDragging) {
      this.camera.isDragging = false;
      this.uiCanvas.style.cursor = this.spacePressed ? 'grab' : 'default';
      return;
    }

    // 如果滑鼠在繪製狀態，保存歷史記錄
    if (this.mouse.isDown) {
      if (DK.EditorTools && DK.EditorTools.saveHistory) {
        DK.EditorTools.saveHistory();
      }
    }

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
    this.camera.isDragging = false;
    this.uiCanvas.style.cursor = 'default';
  },

  /**
   * 更新滑鼠位置（轉換為地磚座標）
   */
  updateMousePosition(e) {
    const rect = this.uiCanvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // 計算實際顯示比例（響應式 canvas）
    const scaleX = this.uiCanvas.width / rect.width;
    const scaleY = this.uiCanvas.height / rect.height;

    // 轉換為 canvas 內部座標
    const internalX = canvasX * scaleX;
    const internalY = canvasY * scaleY;

    // 轉換為地磚座標（考慮 camera 偏移和 zoom）
    const tileSize = 16; // 原始地磚大小
    const tilesPerCanvasUnit = 1 / (tileSize * 4); // ui canvas 是 4x scale

    this.mouse.col = Math.floor((internalX * tilesPerCanvasUnit) / this.camera.zoom + this.camera.x);
    this.mouse.row = Math.floor((internalY * tilesPerCanvasUnit) / this.camera.zoom + this.camera.y);
  },

  /**
   * 滑鼠滾輪（縮放）
   */
  onWheel(e) {
    e.preventDefault();

    // 計算縮放變化
    const deltaZoom = e.deltaY > 0 ? -0.1 : 0.1;
    const oldZoom = this.camera.zoom;
    this.camera.zoom = Math.max(0.5, Math.min(2.0, this.camera.zoom + deltaZoom));

    // 如果縮放倍率有變化，調整 camera 位置使滑鼠位置保持不變
    if (this.camera.zoom !== oldZoom) {
      const rect = this.uiCanvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // 計算實際顯示比例
      const scaleX = this.uiCanvas.width / rect.width;
      const scaleY = this.uiCanvas.height / rect.height;

      const tileSize = 16;
      const tilesPerCanvasUnit = 1 / (tileSize * 4);

      // 轉換為 canvas 內部座標
      const internalX = mouseX * scaleX;
      const internalY = mouseY * scaleY;

      // 計算滑鼠在地圖上的位置（縮放前）
      const mapX = (internalX * tilesPerCanvasUnit) / oldZoom + this.camera.x;
      const mapY = (internalY * tilesPerCanvasUnit) / oldZoom + this.camera.y;

      // 調整 camera 使滑鼠位置不變
      this.camera.x = mapX - (internalX * tilesPerCanvasUnit) / this.camera.zoom;
      this.camera.y = mapY - (internalY * tilesPerCanvasUnit) / this.camera.zoom;

      // 邊界限制
      const viewportCols = this.gameCanvas.width / tileSize / this.camera.zoom;
      const viewportRows = this.gameCanvas.height / tileSize / this.camera.zoom;
      this.camera.x = Math.max(0, Math.min(this.camera.x, this.cols - viewportCols));
      this.camera.y = Math.max(0, Math.min(this.camera.y, this.rows - viewportRows));
    }
  },

  /**
   * 鍵盤按鍵放開
   */
  onKeyUp(e) {
    if (e.code === 'Space') {
      this.spacePressed = false;
      if (!this.camera.isDragging) {
        this.uiCanvas.style.cursor = 'default';
      }
    }
  },

  /**
   * 處理繪製
   */
  handlePaint() {
    const { col, row } = this.mouse;

    // 邊界檢查
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

    // 避免重複繪製（包含多格物件範圍檢查）
    if (this.selectedTool === 'paint') {
      const N = this._getMultiTileSize(this.selectedTile);

      if (N > 1) {
        // 對於多格物件，檢查是否在上次放置的 NxN 範圍內
        const lastCol = this.mouse.lastPaintedCol;
        const lastRow = this.mouse.lastPaintedRow;

        if (lastCol >= 0 && lastRow >= 0) {
          // 計算上次放置的左上角座標（lastPainted 記錄的是右下角）
          const lastLeftCol = lastCol - (N - 1);
          const lastTopRow = lastRow - (N - 1);

          if (col >= lastLeftCol && col <= lastCol &&
              row >= lastTopRow && row <= lastRow) {
            return; // 在上次放置的 NxN 範圍內，跳過
          }
        }
      } else {
        // 普通地磚，檢查是否是同一格
        if (col === this.mouse.lastPaintedCol && row === this.mouse.lastPaintedRow) return;
      }
    }

    // 根據工具類型處理
    if (this.selectedTool === 'paint') {
      this.paintTile(col, row);
    } else if (this.selectedTool === 'fill') {
      // 填充工具
      this.fillTile(col, row);
    } else if (this.selectedTool === 'erase') {
      this.eraseTile(col, row);
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
    // 判斷是否為多格物件
    const multiTileSize = this._getMultiTileSize(this.selectedTile);
    const isMultiTileObject = multiTileSize > 1;

    if (isMultiTileObject) {
      const N = multiTileSize;

      // 驗證是否有足夠空間
      if (col + N - 1 >= this.cols || row + N - 1 >= this.rows) {
        const tileDef = DK.EditorUI.tiles.find(t => t.id === this.selectedTile);
        const name = tileDef ? tileDef.name : this.selectedTile;
        console.warn(`${name} 需要 ${N}x${N} 空間，位置超出地圖邊界`);
        return;
      }

      // 檢查 NxN 區域是否可用（多格物件只允許放在地板上，防止重疊）
      for (let dy = 0; dy < N; dy++) {
        for (let dx = 0; dx < N; dx++) {
          const existingTile = this.getTile(col + dx, row + dy);
          if (existingTile !== '.') {
            console.warn(`放置失敗：(${col + dx}, ${row + dy}) 已被 '${existingTile}' 佔用`);
            return;
          }
        }
      }

      // 放置 NxN 物件
      for (let dy = 0; dy < N; dy++) {
        for (let dx = 0; dx < N; dx++) {
          this.setTile(col + dx, row + dy, this.selectedTile);
        }
      }

      // 更新 lastPainted 為右下角座標
      this.mouse.lastPaintedCol = col + N - 1;
      this.mouse.lastPaintedRow = row + N - 1;
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
   * 刪除地磚（智能處理 2×2 物件：地城之心、傳送門）
   */
  eraseTile(col, row) {
    const tile = this.getTile(col, row);

    // 檢查是否為多格物件
    const multiTileSize = this._getMultiTileSize(tile);
    const isMultiTileObject = multiTileSize > 1;

    if (isMultiTileObject) {
      const N = multiTileSize;
      const anchor = this._findNxNAnchor(col, row, tile, N);

      if (anchor) {
        // 刪除整個 NxN 物件
        for (let dy = 0; dy < N; dy++) {
          for (let dx = 0; dx < N; dx++) {
            this.setTile(anchor.col + dx, anchor.row + dy, '.');
          }
        }
      } else {
        this.setTile(col, row, '.');
      }
    } else {
      // 一般地磚刪除
      this.setTile(col, row, '.');
    }
  },

  /**
   * 尋找 NxN 物件錨點（左上角）
   * 通用版：支援 2x2, 3x3, 4x4
   */
  _findNxNAnchor(col, row, objectType, N) {
    // 搜尋所有可能的錨點位置
    for (let dr = 0; dr < N; dr++) {
      for (let dc = 0; dc < N; dc++) {
        const anchorCol = col - dc;
        const anchorRow = row - dr;

        // 邊界檢查
        if (anchorCol < 0 || anchorRow < 0 ||
            anchorCol + N - 1 >= this.cols || anchorRow + N - 1 >= this.rows) {
          continue;
        }

        // 驗證 NxN 區域全部為同一 tile
        let valid = true;
        for (let dy = 0; dy < N && valid; dy++) {
          for (let dx = 0; dx < N && valid; dx++) {
            if (this.getTile(anchorCol + dx, anchorRow + dy) !== objectType) {
              valid = false;
            }
          }
        }

        if (valid) return { col: anchorCol, row: anchorRow };
      }
    }
    return null;
  },

  /**
   * 向後相容：2x2 錨點搜尋
   */
  find2x2Anchor(col, row, objectType) {
    return this._findNxNAnchor(col, row, objectType, 2);
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
   * 取得多格物件的尺寸（1=普通地磚）
   */
  _getMultiTileSize(tile) {
    // 內建 2x2 物件
    if (tile === 'H' || tile === 'E' || tile === 'M') return 2;
    // MAP_OBJECTS 定義的物件
    if (DK.MAP_OBJECTS && DK.MAP_OBJECTS[tile]) return DK.MAP_OBJECTS[tile].size;
    return 1;
  },

  /**
   * 填充工具（Flood Fill）
   */
  fillTile(col, row) {
    const targetTile = this.getTile(col, row);
    const replacementTile = this.selectedTile;

    // 如果目標地磚與替換地磚相同，無需填充
    if (targetTile === replacementTile) {
      return;
    }

    // 不允許填充外圍（'O'）
    if (targetTile === 'O') {
      console.warn('⚠️ 無法填充外圍區域');
      return;
    }

    // 在填充前保存歷史記錄
    if (DK.EditorTools && DK.EditorTools.saveHistory) {
      DK.EditorTools.saveHistory();
    }

    // 呼叫 EditorTools 的 floodFill 方法
    if (DK.EditorTools && DK.EditorTools.floodFill) {
      const cellsChanged = DK.EditorTools.floodFill(col, row, targetTile, replacementTile);

      if (cellsChanged > 0) {
        // 填充完成後標記為已修改
        this.markDirty();
      }
    } else {
      console.error('❌ EditorTools.floodFill not found');
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

    // 通知小地圖更新快取
    if (DK.EditorMinimap && DK.EditorMinimap.invalidateCache) {
      DK.EditorMinimap.invalidateCache();
    }
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
    // 空白鍵 - 啟用拖曳模式
    if (e.code === 'Space' && !this.spacePressed) {
      e.preventDefault();
      this.spacePressed = true;
      if (!this.camera.isDragging) {
        this.uiCanvas.style.cursor = 'grab';
      }
      return;
    }

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

    // 3. 渲染小地圖
    if (DK.EditorMinimap && DK.EditorMinimap.render) {
      DK.EditorMinimap.render();
    }
  },

  /**
   * 初始化地磚快取系統（預渲染常用地磚）
   */
  initTileCache() {
    if (!DK.Map) return;

    this.tileCache = {};
    const T = 16; // 原始地磚大小

    // 快取所有基本地磚類型（使用 variant 0）
    // 注意：'H'（地城之心）和 'E'/'M'（傳送門）是 2×2 物件，不加入快取
    const basicTiles = ['W', '.', 'O', 'B', 'A', 'P', 'G', 'D'];

    basicTiles.forEach(tileId => {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      // 使用 renderTile() 繪製到快取 canvas
      this.renderTile(ctx, tileId, 0, 0);
      this.tileCache[tileId] = canvas;
    });

  },

  /**
   * 清空地磚快取（地圖尺寸變更時）
   */
  clearTileCache() {
    this.tileCache = null;
  },

  /**
   * 渲染地圖
   */
  renderMap() {
    const ctx = this.gameCtx;
    const tileSize = 16; // 原始地磚大小
    const { x: camX, y: camY, zoom } = this.camera;

    // 計算可見範圍
    const startCol = Math.floor(camX);
    const startRow = Math.floor(camY);
    const viewportCols = Math.ceil(this.gameCanvas.width / tileSize / zoom);
    const viewportRows = Math.ceil(this.gameCanvas.height / tileSize / zoom);
    const endCol = Math.min(this.cols, startCol + viewportCols + 1);
    const endRow = Math.min(this.rows, startRow + viewportRows + 1);

    // 儲存原始狀態
    ctx.save();

    // 應用縮放和平移
    ctx.scale(zoom, zoom);
    ctx.translate(-camX * tileSize, -camY * tileSize);

    // 只渲染可見地磚
    // claimed Set 追蹤已由錨點認領的多格物件格子，避免重複渲染
    const claimed = new Set();

    for (let row = startRow; row < endRow; row++) {
      for (let col = startCol; col < endCol; col++) {
        const tile = this.getTile(col, row);
        const x = col * tileSize;
        const y = row * tileSize;

        // === 多格物件檢查（使用 claimed Set 正確處理相鄰同類型物件）===
        const tileSize2 = this._getMultiTileSize(tile);
        if (tileSize2 > 1) {
          const cellKey = row * this.cols + col;
          if (claimed.has(cellKey)) {
            continue; // 已被其他錨點認領，跳過
          }

          // 驗證以 (col, row) 為錨點的 NxN 區塊是否完整
          let isValidAnchor = (col + tileSize2 <= this.cols && row + tileSize2 <= this.rows);
          if (isValidAnchor) {
            for (let dy = 0; dy < tileSize2 && isValidAnchor; dy++) {
              for (let dx = 0; dx < tileSize2 && isValidAnchor; dx++) {
                if (this.getTile(col + dx, row + dy) !== tile) {
                  isValidAnchor = false;
                }
              }
            }
          }

          if (!isValidAnchor) {
            continue; // 不完整的區塊（孤立格或殘留），跳過
          }

          // 認領整個 NxN 區塊
          for (let dy = 0; dy < tileSize2; dy++) {
            for (let dx = 0; dx < tileSize2; dx++) {
              claimed.add((row + dy) * this.cols + (col + dx));
            }
          }
          // 落入下方渲染邏輯
        }

        // 優先使用快取（基本地磚類型）
        if (this.tileCache && this.tileCache[tile]) {
          ctx.drawImage(this.tileCache[tile], x, y);
        } else {
          // 裝飾物和特殊地磚每次重新繪製（因為有變體）
          this.renderTile(ctx, tile, x, y);
        }
      }
    }

    // 恢復狀態
    ctx.restore();
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
      case 'H': // 地城之心 (2×2 等距水晶)
        DK.Map.drawDungeonHeart2x2(ctx, x, y, variant);
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
      case 'D': // 木門
        DK.Map.drawDoorTile(ctx, x, y, 'wooden', true);
        break;
      case 'I': // 鐵門
        DK.Map.drawDoorTile(ctx, x, y, 'iron', true);
        break;
      case 'Z': // 魔法門
        DK.Map.drawDoorTile(ctx, x, y, 'magic', true);
        break;
      case '1': // 石柱 (2x2)
        if (DK.Map.drawStonePillar) DK.Map.drawStonePillar(ctx, x, y, 0);
        break;
      case '2': // 寶箱 (2x2)
        if (DK.Map.drawTreasureChest) DK.Map.drawTreasureChest(ctx, x, y, 0);
        break;
      case '3': // 木桶堆 (2x2)
        if (DK.Map.drawBarrelStack) DK.Map.drawBarrelStack(ctx, x, y, 0, null);
        break;
      case '4': // 祭壇 (3x3)
        if (DK.Map.drawAltar) DK.Map.drawAltar(ctx, x, y, 0);
        break;
      case '5': // 水晶簇 (3x3)
        if (DK.Map.drawCrystalCluster) DK.Map.drawCrystalCluster(ctx, x, y, 0);
        break;
      case '6': // 符文陣 (3x3)
        if (DK.Map.drawRuneCircle) DK.Map.drawRuneCircle(ctx, x, y, 0, null);
        break;
      case '7': // 龍骨遺骸 (4x4)
        if (DK.Map.drawDragonSkeleton) DK.Map.drawDragonSkeleton(ctx, x, y, 0);
        break;
      case '8': // 封印之門 (4x4)
        if (DK.Map.drawSealedGate) DK.Map.drawSealedGate(ctx, x, y, 0, null);
        break;
      default:
        // 預設使用地板
        DK.Map.drawFloorTile(ctx, x, y, variant);
    }
  }
};
