/**
 * ProjectDK 關卡編輯器 - UI 渲染
 * 職責：網格線、Hover 高亮、Tile Palette、座標顯示
 */

DK.EditorUI = {
  /**
   * HTML 跳脫函式（防止 XSS）
   */
  escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // === Tile 定義 ===
  tiles: [
    { id: 'W', name: '牆壁', color: '#2d2d44' },
    { id: '.', name: '地板', color: '#5e5648' },
    { id: 'O', name: '外圍', color: '#050508' },
    { id: 'H', name: '地心', color: '#ff4444' },
    { id: 'E', name: '入口傳送門', color: '#44aa44' },
    { id: 'M', name: '出口傳送門', color: '#ff4444' },
    { id: 'B', name: '路障', color: '#5a5a6e' },
    { id: 'P', name: '水潭', color: '#2a4a7a' },
    { id: 'A', name: '深淵', color: '#050508' },
    { id: 'G', name: '草叢', color: '#2a5a2a' },
    { id: 'T', name: '火把', color: '#ff8800' },
    { id: 'C', name: '寶箱', color: '#ffd700' },
    { id: 'L', name: '石柱', color: '#7a7a8e' },
    { id: 'S', name: '骸骨', color: '#d0c8b0' },
    { id: 'U', name: '符文', color: '#44aaff' },
    { id: 'F', name: '火盆', color: '#ff9922' },
    { id: 'X', name: '水晶', color: '#aa44ff' },
    { id: 'D', name: '木門', color: '#6a5040' },
    { id: 'I', name: '鐵門', color: '#5a5a6e' },
    { id: 'Z', name: '魔法門', color: '#aa44ff' },
    // Multi-tile map objects
    { id: '1', name: '石柱 2x2', color: '#4a4c54' },
    { id: '2', name: '寶箱 2x2', color: '#c8a832' },
    { id: '3', name: '木桶堆 2x2', color: '#5a4a3a' },
    { id: '4', name: '祭壇 3x3', color: '#8844aa' },
    { id: '5', name: '水晶簇 3x3', color: '#4488bb' },
    { id: '6', name: '符文陣 3x3', color: '#6644aa' },
    { id: '7', name: '龍骨 4x4', color: '#d0c8b0' },
    { id: '8', name: '封印門 4x4', color: '#cc4444' }
  ],

  // === 分類工具欄結構 ===
  categories: [
    {
      id: 'terrain',
      icon: '🟫',
      name: '基礎地形',
      expanded: true,
      tiles: ['W', '.', 'O', 'B', 'A']
    },
    {
      id: 'room',
      icon: '🏠',
      name: '房間設施',
      expanded: true,
      tiles: ['H', 'E', 'M']
    },
    {
      id: 'portal',
      icon: '🚪',
      name: '傳送路徑',
      expanded: false,
      tiles: ['E', 'M', 'D', 'I', 'Z']
    },
    {
      id: 'decoration',
      icon: '✨',
      name: '裝飾物件',
      expanded: false,
      tiles: ['T', 'C', 'L', 'S', 'U', 'F', 'X']
    },
    {
      id: 'special',
      icon: '🌊',
      name: '特殊地形',
      expanded: false,
      tiles: ['P', 'G']
    },
    {
      id: 'defense',
      icon: '🛡️',
      name: '防禦設施',
      expanded: false,
      tiles: ['D', 'I', 'Z']
    },
    {
      id: 'objects',
      icon: '🏛️',
      name: '地圖物件',
      expanded: true,
      tiles: ['1', '2', '3', '4', '5', '6', '7', '8']
    }
  ],

  // === 分類展開狀態儲存 ===
  categoryStates: {},

  /**
   * 初始化 UI 系統
   */
  init() {
    // 1. 初始化分類狀態
    this.initCategoryStates();

    // 2. 渲染分類工具欄
    this.renderCategoryToolbar();

    // 3. 設置 Tab 切換
    this.setupTabs();

    // 4. 設置參數輸入事件
    this.setupParamInputs();
  },

  /**
   * 初始化分類展開狀態（從 localStorage 讀取或使用預設值）
   */
  initCategoryStates() {
    const saved = localStorage.getItem('dk_editor_category_states');
    if (saved) {
      try {
        this.categoryStates = JSON.parse(saved);
      } catch (e) {
        if (DK.ErrorHandler) DK.ErrorHandler.log('warning', '無法讀取分類狀態，使用預設值');
        this.categoryStates = {};
      }
    }

    // 套用預設展開狀態
    this.categories.forEach(cat => {
      if (this.categoryStates[cat.id] === undefined) {
        this.categoryStates[cat.id] = cat.expanded;
      }
    });
  },

  /**
   * 儲存分類展開狀態
   */
  saveCategoryStates() {
    localStorage.setItem('dk_editor_category_states', JSON.stringify(this.categoryStates));
  },

  /**
   * 渲染分類工具欄（替代原 renderTilePalette）
   */
  renderCategoryToolbar() {
    const container = document.getElementById('tilePalette');
    if (!container) return;

    container.innerHTML = '';
    container.className = 'category-toolbar';

    // 建立 Tile ID → Tile 物件的快速查找表
    const tileMap = {};
    this.tiles.forEach(tile => {
      tileMap[tile.id] = tile;
    });

    // 渲染每個分類
    this.categories.forEach(category => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'category-panel';
      categoryDiv.dataset.categoryId = category.id;

      // 分類標題（可折疊）
      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <span class="category-icon">${category.icon}</span>
        <span class="category-name">${category.name}</span>
        <span class="category-toggle">${this.categoryStates[category.id] ? '▼' : '▶'}</span>
      `;

      // 點擊標題折疊/展開
      header.addEventListener('click', () => {
        this.toggleCategory(category.id);
      });

      categoryDiv.appendChild(header);

      // 工具按鈕容器
      const tilesContainer = document.createElement('div');
      tilesContainer.className = 'category-tiles';
      if (!this.categoryStates[category.id]) {
        tilesContainer.style.display = 'none';
      }

      // 渲染該分類的所有地磚
      category.tiles.forEach(tileId => {
        const tile = tileMap[tileId];
        if (!tile) return;

        const btn = document.createElement('button');
        btn.className = 'tile-btn';
        btn.dataset.tile = tile.id;
        btn.title = tile.name;

        // 創建 canvas 預覽
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        canvas.className = 'tile-preview';
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // 繪製真實地磚預覽（根據物件尺寸自動縮放）
        if (DK.Editor && DK.Editor.renderTile) {
          const N = (DK.Editor._getMultiTileSize)
            ? DK.Editor._getMultiTileSize(tile.id)
            : 1;
          const scale = 32 / (N * 16); // 1x1→2x, 2x2→1x, 3x3→0.67x, 4x4→0.5x
          ctx.save();
          ctx.scale(scale, scale);
          DK.Editor.renderTile.call(DK.Editor, ctx, tile.id, 0, 0);
          ctx.restore();
        }

        btn.appendChild(canvas);

        // 名稱和符號
        const label = document.createElement('div');
        label.className = 'tile-label';
        label.innerHTML = `<strong>${this.escapeHTML(tile.id)}</strong><br><small>${this.escapeHTML(tile.name)}</small>`;
        btn.appendChild(label);

        // 點擊事件
        btn.addEventListener('click', () => {
          DK.Editor.selectedTile = tile.id;
          DK.Editor.selectedTool = 'paint';
          this.updateTilePalette();
          if (DK.EditorTools && DK.EditorTools.updateToolButtons) {
            DK.EditorTools.updateToolButtons();
          }
        });

        tilesContainer.appendChild(btn);
      });

      categoryDiv.appendChild(tilesContainer);
      container.appendChild(categoryDiv);
    });

    this.updateTilePalette();
  },

  /**
   * 切換分類展開/折疊
   */
  toggleCategory(categoryId) {
    // 更新狀態
    this.categoryStates[categoryId] = !this.categoryStates[categoryId];
    this.saveCategoryStates();

    // 更新 UI
    const categoryDiv = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (!categoryDiv) return;

    const tilesContainer = categoryDiv.querySelector('.category-tiles');
    const toggle = categoryDiv.querySelector('.category-toggle');

    if (this.categoryStates[categoryId]) {
      tilesContainer.style.display = 'grid';
      toggle.textContent = '▼';
    } else {
      tilesContainer.style.display = 'none';
      toggle.textContent = '▶';
    }
  },

  /**
   * 渲染 Tile Palette（舊版，保留為向後兼容）
   */
  renderTilePalette() {
    // 已被 renderCategoryToolbar 替代
    this.renderCategoryToolbar();
  },

  /**
   * 更新 Tile Palette 選中狀態
   */
  updateTilePalette() {
    const buttons = document.querySelectorAll('.tile-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tile === DK.Editor.selectedTile);
    });
  },

  /**
   * 設置 Tab 切換
   */
  setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        // 更新 Tab 按鈕樣式
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // 更新 Tab 內容
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(`tab${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`)?.classList.add('active');
      });
    });
  },

  /**
   * 設置參數輸入事件
   */
  setupParamInputs() {
    // 關卡名稱
    document.getElementById('inputLevelName')?.addEventListener('input', (e) => {
      DK.Editor.currentLevel.name = e.target.value;
      document.getElementById('levelName').textContent = e.target.value || '新關卡';
      DK.Editor.markDirty();
    });

    // 起始金幣
    document.getElementById('inputGold')?.addEventListener('input', (e) => {
      DK.Editor.currentLevel.startingGold = parseInt(e.target.value) || 1000;
      DK.Editor.markDirty();
    });

    // 地心生命值
    document.getElementById('inputHeartHP')?.addEventListener('input', (e) => {
      DK.Editor.currentLevel.dungeonHeartHP = parseInt(e.target.value) || 100;
      DK.Editor.markDirty();
    });

    // 地圖尺寸
    document.getElementById('selectMapSize')?.addEventListener('change', (e) => {
      const value = e.target.value;
      const customInputs = document.getElementById('customSizeInputs');

      if (value === 'custom') {
        customInputs.style.display = 'block';
      } else {
        customInputs.style.display = 'none';

        if (value === '20x13') {
          DK.Editor.cols = 20;
          DK.Editor.rows = 13;
        } else if (value === '40x26') {
          DK.Editor.cols = 40;
          DK.Editor.rows = 26;
        }

        this.resizeMap();
      }
    });

    // 自訂尺寸
    document.getElementById('inputCols')?.addEventListener('change', (e) => {
      DK.Editor.cols = parseInt(e.target.value) || 20;
      this.resizeMap();
    });

    document.getElementById('inputRows')?.addEventListener('change', (e) => {
      DK.Editor.rows = parseInt(e.target.value) || 13;
      this.resizeMap();
    });
  },

  /**
   * 調整地圖尺寸
   */
  resizeMap() {
    if (!confirm('調整地圖尺寸會清空現有內容，確定要繼續嗎？')) return;
    DK.Editor.createEmptyLevel();
  },

  /**
   * 渲染 UI（網格線、Hover 高亮）
   */
  render() {
    const ctx = DK.Editor.uiCtx;
    const tileSize = 64; // DISPLAY_TILE (16 * 4)

    // 1. 渲染網格線
    this.renderGrid(ctx, tileSize);

    // 2. 渲染 Hover 高亮
    this.renderHover(ctx, tileSize);

    // 3. 更新座標顯示
    this.updateCoordDisplay();
  },

  /**
   * 渲染網格線
   */
  renderGrid(ctx, tileSize) {
    ctx.strokeStyle = '#4a3e6e';
    ctx.lineWidth = 1;

    // 垂直線
    for (let col = 0; col <= DK.Editor.cols; col++) {
      const x = col * tileSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, DK.Editor.rows * tileSize);
      ctx.stroke();
    }

    // 水平線
    for (let row = 0; row <= DK.Editor.rows; row++) {
      const y = row * tileSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(DK.Editor.cols * tileSize, y);
      ctx.stroke();
    }
  },

  /**
   * 渲染 Hover 高亮（含實際地磚預覽，支援 NxN 多格物件）
   */
  renderHover(ctx, tileSize) {
    const { col, row } = DK.Editor.mouse;

    // 邊界檢查
    if (col < 0 || col >= DK.Editor.cols || row < 0 || row >= DK.Editor.rows) {
      this.removeHoverPreview();
      return;
    }

    // 取得選中物件的 NxN 尺寸
    const N = (DK.Editor && DK.Editor._getMultiTileSize)
      ? DK.Editor._getMultiTileSize(DK.Editor.selectedTile)
      : 1;

    // 半透明高亮
    ctx.fillStyle = 'rgba(255, 170, 68, 0.3)'; // UI_SELECTED with alpha

    if (DK.Editor.brushSize === 1) {
      if (N > 1 && DK.Editor.selectedTool === 'paint') {
        // NxN 多格物件：高亮整個 NxN 區域
        const fits = (col + N <= DK.Editor.cols) && (row + N <= DK.Editor.rows);
        const highlightColor = fits ? 'rgba(255, 170, 68, 0.3)' : 'rgba(255, 68, 68, 0.3)';
        ctx.fillStyle = highlightColor;
        for (let dr = 0; dr < N; dr++) {
          for (let dc = 0; dc < N; dc++) {
            const c = col + dc;
            const r = row + dr;
            if (c < DK.Editor.cols && r < DK.Editor.rows) {
              ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
            }
          }
        }
        this.showTilePreview(col, row, tileSize);
      } else {
        // 一般 1x1 地磚
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

        if (DK.Editor.selectedTool === 'paint') {
          this.showTilePreview(col, row, tileSize);
        } else {
          this.removeHoverPreview();
        }
      }
    } else {
      // 多格畫筆高亮
      const halfSize = Math.floor(DK.Editor.brushSize / 2);
      for (let dy = -halfSize; dy <= halfSize; dy++) {
        for (let dx = -halfSize; dx <= halfSize; dx++) {
          const c = col + dx;
          const r = row + dy;
          if (c >= 0 && c < DK.Editor.cols && r >= 0 && r < DK.Editor.rows) {
            ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
          }
        }
      }
      this.removeHoverPreview();
    }

    // 邊框（NxN 時包圍整個區域）
    ctx.strokeStyle = '#ffaa44'; // UI_SELECTED
    ctx.lineWidth = 2;
    if (N > 1 && DK.Editor.selectedTool === 'paint') {
      const w = Math.min(N, DK.Editor.cols - col);
      const h = Math.min(N, DK.Editor.rows - row);
      ctx.strokeRect(col * tileSize, row * tileSize, w * tileSize, h * tileSize);
    } else {
      ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
    }
  },

  /**
   * 顯示實際地磚預覽（Hover 時）
   */
  showTilePreview(col, row, tileSize) {
    // 移除舊的預覽
    this.removeHoverPreview();

    // 創建預覽容器
    const preview = document.createElement('div');
    preview.className = 'tile-hover-preview';
    preview.id = 'tileHoverPreview';

    // 創建預覽 canvas（顯示 64x64 像素，實際繪製 16x16 後放大 4 倍）
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const previewCtx = canvas.getContext('2d');
    previewCtx.imageSmoothingEnabled = false;

    // 繪製地磚預覽（放大 4 倍）
    if (DK.Editor && DK.Editor.renderTile) {
      previewCtx.save();
      previewCtx.scale(4, 4);
      DK.Editor.renderTile.call(DK.Editor, previewCtx, DK.Editor.selectedTile, 0, 0);
      previewCtx.restore();
    }

    // 加入標籤（含 NxN 尺寸資訊）
    const label = document.createElement('div');
    label.className = 'tile-hover-preview-label';
    const tileName = this.getTileName(DK.Editor.selectedTile);
    const N = (DK.Editor && DK.Editor._getMultiTileSize)
      ? DK.Editor._getMultiTileSize(DK.Editor.selectedTile)
      : 1;
    const sizeTag = N > 1 ? ` [${N}x${N}]` : '';
    label.textContent = `${DK.Editor.selectedTile} - ${tileName}${sizeTag}`;

    preview.appendChild(canvas);
    preview.appendChild(label);

    // 計算位置（相對於 UI canvas）
    const uiCanvas = document.getElementById('ui-canvas');

    // 預覽框位置：滑鼠游標右側
    const x = col * tileSize + tileSize + 12; // 相對於 canvas 的 X
    const y = row * tileSize + 8; // 相對於 canvas 的 Y

    preview.style.position = 'absolute';
    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;

    // 添加到 canvas 容器
    const container = uiCanvas.parentElement;
    container.appendChild(preview);
  },

  /**
   * 移除 Hover 預覽
   */
  removeHoverPreview() {
    const preview = document.getElementById('tileHoverPreview');
    if (preview) {
      preview.remove();
    }
  },

  /**
   * 取得地磚名稱
   */
  getTileName(tileId) {
    const tile = this.tiles.find(t => t.id === tileId);
    return tile ? tile.name : '未知';
  },

  /**
   * 更新座標顯示
   */
  updateCoordDisplay() {
    const statusCoord = document.getElementById('statusCoord');
    if (!statusCoord) return;

    const { col, row } = DK.Editor.mouse;
    if (col >= 0 && col < DK.Editor.cols && row >= 0 && row < DK.Editor.rows) {
      statusCoord.textContent = `座標: (${col}, ${row})`;
    } else {
      statusCoord.textContent = `座標: --`;
    }
  },

  /**
   * 更新畫筆大小顯示（由 editor-main.js 調用）
   */
  updateBrushSize() {
    if (DK.EditorTools && DK.EditorTools.updateBrushButtons) {
      DK.EditorTools.updateBrushButtons();
    }
  },

  /**
   * 更新工具按鈕顯示（由 editor-main.js 調用）
   */
  updateToolButtons() {
    if (DK.EditorTools && DK.EditorTools.updateToolButtons) {
      DK.EditorTools.updateToolButtons();
    }
  }
};
