/**
 * ProjectDK 關卡編輯器 - 地圖編輯工具
 * 職責：Tile Palette、工具切換、Undo/Redo
 */

DK.EditorTools = {
  // === Undo/Redo 歷史 ===
  history: {
    stack: [],          // 歷史記錄堆疊
    current: -1,        // 當前指針
    maxSize: 50         // 最大記錄數
  },

  /**
   * 初始化工具系統
   */
  init() {
    console.log('🔧 初始化編輯工具...');

    // 設置工具按鈕事件
    this.setupToolButtons();

    // 設置畫筆大小按鈕
    this.setupBrushButtons();

    // 初始化歷史記錄
    this.saveHistory();

    console.log('✅ 編輯工具初始化完成');
  },

  /**
   * 設置工具按鈕事件
   */
  setupToolButtons() {
    const tools = {
      'toolPaint': 'paint',
      'toolFill': 'fill',
      'toolErase': 'erase',
      'toolPicker': 'picker'
    };

    Object.keys(tools).forEach(btnId => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.addEventListener('click', () => {
          DK.Editor.selectedTool = tools[btnId];
          this.updateToolButtons();
        });
      }
    });
  },

  /**
   * 設置畫筆大小按鈕
   */
  setupBrushButtons() {
    const sizes = [1, 2, 3];
    sizes.forEach(size => {
      const btn = document.getElementById(`brush${size}`);
      if (btn) {
        btn.addEventListener('click', () => {
          DK.Editor.brushSize = size;
          this.updateBrushButtons();
        });
      }
    });
  },

  /**
   * 更新工具按鈕樣式
   */
  updateToolButtons() {
    const tools = ['toolPaint', 'toolFill', 'toolErase', 'toolPicker'];
    const toolNames = {
      'paint': 'toolPaint',
      'fill': 'toolFill',
      'erase': 'toolErase',
      'picker': 'toolPicker'
    };

    tools.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.classList.remove('active');
      }
    });

    const activeBtn = document.getElementById(toolNames[DK.Editor.selectedTool]);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    // 更新 Canvas 游標樣式
    this.updateCanvasCursor();

    // 更新狀態列
    this.updateStatusBar();
  },

  /**
   * 更新 Canvas 游標樣式
   */
  updateCanvasCursor() {
    const canvas = document.getElementById('ui-canvas');
    if (!canvas) return;

    // 移除所有工具類別
    canvas.classList.remove('tool-paint', 'tool-fill', 'tool-erase', 'tool-picker');

    // 根據當前工具添加對應類別
    const tool = DK.Editor.selectedTool;
    if (tool) {
      canvas.classList.add(`tool-${tool}`);
    }
  },

  /**
   * 更新畫筆大小按鈕樣式
   */
  updateBrushButtons() {
    [1, 2, 3].forEach(size => {
      const btn = document.getElementById(`brush${size}`);
      if (btn) {
        btn.classList.toggle('active', DK.Editor.brushSize === size);
      }
    });
  },

  /**
   * 更新狀態列
   */
  updateStatusBar() {
    const toolNames = {
      'paint': `畫筆(${DK.Editor.selectedTile})`,
      'fill': '填充',
      'erase': '橡皮擦',
      'picker': '吸管'
    };

    const statusTool = document.getElementById('statusTool');
    if (statusTool) {
      statusTool.textContent = `當前工具: ${toolNames[DK.Editor.selectedTool]}`;
    }
  },

  /**
   * 填充工具（Flood Fill - BFS）
   */
  floodFill(startCol, startRow, targetTile, replacementTile) {
    // 限制填充範圍（最多 500 格）
    const MAX_CELLS = 500;
    let cellsChanged = 0;

    const queue = [{col: startCol, row: startRow}];
    const visited = new Set();
    const key = (c, r) => `${c},${r}`;

    while (queue.length > 0 && cellsChanged < MAX_CELLS) {
      const {col, row} = queue.shift();
      const k = key(col, row);

      // 跳過已訪問或越界
      if (visited.has(k)) continue;
      if (col < 0 || col >= DK.Editor.cols || row < 0 || row >= DK.Editor.rows) continue;

      // 檢查是否為目標地磚
      const currentTile = DK.Editor.getTile(col, row);
      if (currentTile !== targetTile) continue;

      // 標記已訪問
      visited.add(k);

      // 替換地磚
      DK.Editor.setTile(col, row, replacementTile);
      cellsChanged++;

      // 加入 4 方向鄰格
      queue.push({col: col + 1, row});
      queue.push({col: col - 1, row});
      queue.push({col, row: row + 1});
      queue.push({col, row: row - 1});
    }

    if (cellsChanged >= MAX_CELLS) {
      alert('⚠️ 填充範圍過大，已限制為 500 格');
    }

    return cellsChanged;
  },

  /**
   * 保存歷史記錄（差分快照）
   */
  saveHistory() {
    // 清除當前指針後的所有記錄（分支清除）
    this.history.stack = this.history.stack.slice(0, this.history.current + 1);

    // 保存當前狀態
    const snapshot = {
      layout: [...DK.Editor.layout],
      timestamp: Date.now()
    };

    this.history.stack.push(snapshot);
    this.history.current++;

    // 限制堆疊大小
    if (this.history.stack.length > this.history.maxSize) {
      this.history.stack.shift();
      this.history.current--;
    }
  },

  /**
   * Undo（回退）
   */
  undo() {
    if (this.history.current <= 0) {
      console.log('⚠️ 無法再 Undo');
      return;
    }

    this.history.current--;
    const snapshot = this.history.stack[this.history.current];
    DK.Editor.layout = [...snapshot.layout];
    DK.Editor.markDirty();

    console.log(`↶ Undo 到 ${this.history.current}/${this.history.stack.length - 1}`);
  },

  /**
   * Redo（重做）
   */
  redo() {
    if (this.history.current >= this.history.stack.length - 1) {
      console.log('⚠️ 無法再 Redo');
      return;
    }

    this.history.current++;
    const snapshot = this.history.stack[this.history.current];
    DK.Editor.layout = [...snapshot.layout];
    DK.Editor.markDirty();

    console.log(`↷ Redo 到 ${this.history.current}/${this.history.stack.length - 1}`);
  }
};
