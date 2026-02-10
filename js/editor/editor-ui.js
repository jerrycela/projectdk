/**
 * ProjectDK 關卡編輯器 - UI 渲染
 * 職責：網格線、Hover 高亮、Tile Palette、座標顯示
 */

DK.EditorUI = {
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
    { id: 'Z', name: '魔法門', color: '#aa44ff' }
  ],

  /**
   * 初始化 UI 系統
   */
  init() {
    console.log('🎨 初始化編輯器 UI...');

    // 1. 渲染 Tile Palette
    this.renderTilePalette();

    // 2. 設置 Tab 切換
    this.setupTabs();

    // 3. 設置參數輸入事件
    this.setupParamInputs();

    console.log('✅ 編輯器 UI 初始化完成');
  },

  /**
   * 渲染 Tile Palette（使用真實地磚預覽）
   */
  renderTilePalette() {
    const container = document.getElementById('tilePalette');
    if (!container) return;

    container.innerHTML = '';

    this.tiles.forEach(tile => {
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

      // 繪製真實地磚預覽（2倍大小）
      if (DK.Editor && DK.Editor.renderTile) {
        ctx.save();
        ctx.scale(2, 2);
        DK.Editor.renderTile.call(DK.Editor, ctx, tile.id, 0, 0);
        ctx.restore();
      }

      btn.appendChild(canvas);

      // 名稱和符號
      const label = document.createElement('div');
      label.className = 'tile-label';
      label.innerHTML = `<strong>${tile.id}</strong><br><small>${tile.name}</small>`;
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

      container.appendChild(btn);
    });

    this.updateTilePalette();
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
   * 渲染 Hover 高亮
   */
  renderHover(ctx, tileSize) {
    const { col, row } = DK.Editor.mouse;

    // 邊界檢查
    if (col < 0 || col >= DK.Editor.cols || row < 0 || row >= DK.Editor.rows) return;

    // 半透明高亮
    ctx.fillStyle = 'rgba(255, 170, 68, 0.3)'; // UI_SELECTED with alpha

    if (DK.Editor.brushSize === 1) {
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
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
    }

    // 邊框
    ctx.strokeStyle = '#ffaa44'; // UI_SELECTED
    ctx.lineWidth = 2;
    ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);
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
