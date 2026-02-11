# 地圖編輯器設計文件（Tile Palette + 畫筆工具）

## 一、整體架構

### 1.1 核心組件

```
DK.LevelEditor.MapEditor = {
  // 狀態管理
  state: {
    selectedTile: '.',           // 當前選中的地磚類型
    brushSize: 1,                // 畫筆大小（1=單格, 2=2x2, 3=3x3）
    mode: 'paint',               // 模式：paint/fill/erase
    isPainting: false,           // 是否正在繪製
    gridVisible: true,           // 網格線顯示
    hoverCell: null,             // 當前 hover 的格子 {col, row}
  },

  // Tile palette
  tilePalette: {...},

  // 畫筆工具
  brush: {...},

  // 網格渲染
  grid: {...},

  // Undo/Redo 系統
  history: {...},

  // 地圖預覽與導航
  minimap: {...},
}
```

---

## 二、Tile Palette（地磚選擇器）

### 2.1 視覺設計（完整版含入口/出口/傳送門）

```
┌─────────────────────────────────────────────────────────────────┐
│   地磚工具列                                                     │
├─────────────────────────────────────────────────────────────────┤
│  基礎地形                                                        │
│  [W] 牆壁    [.] 地板    [O] 外圍    [B] 路障                   │
│                                                                  │
│  核心設施                                                        │
│  [H] 地心    [S] 入口    [E] 出口    [T] 傳送門                 │
│                                                                  │
│  環境元素                                                        │
│  [P] 水潭    [A] 深淵    [G] 草叢    [R] 軌道                   │
├─────────────────────────────────────────────────────────────────┤
│  筆刷模式                                                        │
│  [🖌️ 單點] [🪣 填充] [▭ 矩形] [🧹 橡皮擦]                        │
│                                                                  │
│  畫筆大小: [1] [2] [3] [5]                                      │
│                                                                  │
│  [✓] 顯示網格線  [✓] 顯示座標                                   │
│                                                                  │
│  當前座標: (X: 12, Y: 8)  ← 滑鼠即時位置                        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 實作細節（擴展版）

```javascript
tilePalette: {
  // 可用地磚定義（分類組織）
  tiles: {
    // 基礎地形
    'W': { name: '牆壁', color: '#2d2d44', icon: '🧱', category: 'terrain' },
    '.': { name: '地板', color: '#5e5648', icon: '⬜', category: 'terrain' },
    'O': { name: '外圍', color: '#050508', icon: '🌑', category: 'terrain' },
    'B': { name: '路障', color: '#5a5a6e', icon: '🚧', category: 'terrain' },

    // 核心設施
    'H': { name: '地心', color: '#ff4444', icon: '❤️', category: 'facility' },
    'S': { name: '入口', color: '#44ff44', icon: '🚪', category: 'facility' },
    'E': { name: '出口', color: '#4444ff', icon: '🏁', category: 'facility' },
    'T': { name: '傳送門', color: '#ff44ff', icon: '🌀', category: 'facility' },

    // 環境元素
    'P': { name: '水潭', color: '#2a4a7a', icon: '💧', category: 'environment' },
    'A': { name: '深淵', color: '#050508', icon: '🕳️', category: 'environment' },
    'G': { name: '草叢', color: '#2a5a2a', icon: '🌿', category: 'environment' },
    'R': { name: '軌道', color: '#7a7a8e', icon: '🛤️', category: 'environment' },
  },

  // 分類標籤
  categories: {
    terrain: { name: '基礎地形', order: 1 },
    facility: { name: '核心設施', order: 2 },
    environment: { name: '環境元素', order: 3 },
  },

  // 渲染 palette UI（分類顯示版本）
  render(ctx, x, y) {
    const tileSize = 40;
    const gap = 8;
    const labelHeight = 20;
    let currentY = y;

    // 繪製背景面板
    ctx.fillStyle = DK.COLORS.UI_PANEL;
    ctx.fillRect(x - 10, y - 10, 960, 140);

    // 繪製邊框
    ctx.strokeStyle = DK.COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 10, y - 10, 960, 140);

    // 按分類渲染
    const categoriesOrdered = Object.entries(this.categories)
      .sort((a, b) => a[1].order - b[1].order);

    for (const [catKey, catInfo] of categoriesOrdered) {
      // 分類標題
      ctx.fillStyle = DK.COLORS.UI_TEXT_DIM;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(catInfo.name, x, currentY + 12);
      currentY += labelHeight;

      // 該分類的地磚
      let offsetX = x;
      const tilesInCategory = Object.entries(this.tiles)
        .filter(([key, tile]) => tile.category === catKey);

      for (const [key, tile] of tilesInCategory) {
        // 繪製地磚預覽（帶像素風格邊框）
        ctx.fillStyle = tile.color;
        ctx.fillRect(offsetX, currentY, tileSize, tileSize);

        // 地磚邊框
        ctx.strokeStyle = DK.COLORS.UI_BORDER_LIGHT;
        ctx.lineWidth = 1;
        ctx.strokeRect(offsetX, currentY, tileSize, tileSize);

        // 選中狀態（發光邊框）
        if (key === DK.LevelEditor.MapEditor.state.selectedTile) {
          ctx.strokeStyle = DK.COLORS.UI_SELECTED;
          ctx.lineWidth = 3;
          ctx.strokeRect(offsetX - 2, currentY - 2, tileSize + 4, tileSize + 4);

          // 內部高亮
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(offsetX + 2, currentY + 2, tileSize - 4, tileSize - 4);
        }

        // Icon + 文字標籤
        ctx.fillStyle = DK.COLORS.UI_TEXT;
        ctx.font = '10px monospace';
        ctx.fillText(`${key}`, offsetX + tileSize / 2 - 4, currentY + tileSize / 2 + 3);

        // 名稱標籤（懸停時顯示，此處簡化為全顯示）
        ctx.font = '10px monospace';
        ctx.fillText(tile.name, offsetX, currentY + tileSize + 10);

        offsetX += tileSize + gap;
      }

      currentY += tileSize + 20;
    }

    // 渲染筆刷模式選擇器
    this.renderBrushModes(ctx, x, currentY);

    // 渲染座標顯示
    this.renderCoordinateDisplay(ctx, x + 500, currentY);
  },

  // 渲染筆刷模式按鈕
  renderBrushModes(ctx, x, y) {
    const modes = [
      { id: 'paint', name: '單點', icon: '🖌️' },
      { id: 'fill', name: '填充', icon: '🪣' },
      { id: 'rect', name: '矩形', icon: '▭' },
      { id: 'erase', name: '橡皮擦', icon: '🧹' },
    ];

    const btnWidth = 80;
    const btnHeight = 30;
    const gap = 10;
    let offsetX = x;

    ctx.font = '12px monospace';

    for (const mode of modes) {
      const isSelected = DK.LevelEditor.MapEditor.state.mode === mode.id;

      // 按鈕背景
      ctx.fillStyle = isSelected ? DK.COLORS.UI_SELECTED : DK.COLORS.UI_PANEL;
      ctx.fillRect(offsetX, y, btnWidth, btnHeight);

      // 按鈕邊框
      ctx.strokeStyle = isSelected ? DK.COLORS.UI_SELECTED : DK.COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(offsetX, y, btnWidth, btnHeight);

      // 按鈕文字
      ctx.fillStyle = isSelected ? '#000000' : DK.COLORS.UI_TEXT;
      ctx.fillText(`${mode.icon} ${mode.name}`, offsetX + 8, y + 20);

      offsetX += btnWidth + gap;
    }

    // 畫筆大小按鈕
    const sizes = [1, 2, 3, 5];
    offsetX += 20;

    ctx.fillStyle = DK.COLORS.UI_TEXT_DIM;
    ctx.fillText('畫筆大小:', offsetX, y + 20);
    offsetX += 80;

    for (const size of sizes) {
      const isSelected = DK.LevelEditor.MapEditor.state.brushSize === size;
      const btnSize = 28;

      ctx.fillStyle = isSelected ? DK.COLORS.UI_SELECTED : DK.COLORS.UI_PANEL;
      ctx.fillRect(offsetX, y, btnSize, btnSize);

      ctx.strokeStyle = isSelected ? DK.COLORS.UI_SELECTED : DK.COLORS.UI_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(offsetX, y, btnSize, btnSize);

      ctx.fillStyle = isSelected ? '#000000' : DK.COLORS.UI_TEXT;
      ctx.fillText(`${size}`, offsetX + 10, y + 20);

      offsetX += btnSize + 5;
    }
  },

  // 渲染座標顯示
  renderCoordinateDisplay(ctx, x, y) {
    const hoverCell = DK.LevelEditor.MapEditor.state.hoverCell;

    ctx.fillStyle = DK.COLORS.UI_TEXT;
    ctx.font = '14px monospace';

    if (hoverCell) {
      ctx.fillText(`當前座標: (X: ${hoverCell.col}, Y: ${hoverCell.row})`, x, y + 20);

      // 顯示當前格子的地磚類型
      const currentLevel = DK.LevelEditor.state.currentLevel;
      if (hoverCell.row >= 0 && hoverCell.row < currentLevel.layout.length &&
          hoverCell.col >= 0 && hoverCell.col < currentLevel.layout[0].length) {
        const tileType = currentLevel.layout[hoverCell.row][hoverCell.col];
        const tileName = this.tiles[tileType]?.name || '未知';
        ctx.fillText(`當前地磚: [${tileType}] ${tileName}`, x, y + 40);
      }
    } else {
      ctx.fillText('當前座標: (---, ---)', x, y + 20);
    }
  },

  // 點擊處理
  handleClick(mouseX, mouseY, paletteX, paletteY) {
    // 計算點擊了哪個地磚
    const tileSize = 48;
    const gap = 4;
    let offsetX = paletteX, offsetY = paletteY;

    for (const key of Object.keys(this.tiles)) {
      if (mouseX >= offsetX && mouseX <= offsetX + tileSize &&
          mouseY >= offsetY && mouseY <= offsetY + tileSize) {
        DK.LevelEditor.MapEditor.state.selectedTile = key;
        return true;
      }

      offsetX += tileSize + gap + 120;
      if (offsetX > paletteX + 600) {
        offsetX = paletteX;
        offsetY += tileSize + gap;
      }
    }
    return false;
  },
},
```

---

## 三、畫筆工具（Brush Tool）

### 3.1 功能清單（完整四種模式）

1. **單點模式**（paint）：點擊放置單個地磚，支援畫筆大小（1/2/3/5）
2. **填充模式**（fill）：點擊填充相同類型的連續區域（flood fill）
3. **矩形模式**（rect）：拖曳繪製矩形區域
4. **橡皮擦模式**（erase）：清除地磚（設為預設地板 '.'）

### 3.2 實作細節

```javascript
brush: {
  // 單格繪製
  paintCell(col, row, tileType) {
    if (!this.isValidCell(col, row)) return;

    // 保存到 undo history
    DK.LevelEditor.MapEditor.history.save();

    // 修改地圖
    const currentLevel = DK.LevelEditor.state.currentLevel;
    const layoutRow = currentLevel.layout[row];
    currentLevel.layout[row] =
      layoutRow.substring(0, col) + tileType + layoutRow.substring(col + 1);
  },

  // 多格畫筆（根據 brushSize）
  paintArea(centerCol, centerRow, tileType, brushSize) {
    const radius = Math.floor(brushSize / 2);
    for (let r = -radius; r <= radius; r++) {
      for (let c = -radius; c <= radius; c++) {
        this.paintCell(centerCol + c, centerRow + r, tileType);
      }
    }
  },

  // 填充工具（Flood Fill）
  floodFill(startCol, startRow, targetTile, replacementTile) {
    if (targetTile === replacementTile) return;

    const currentLevel = DK.LevelEditor.state.currentLevel;
    const rows = currentLevel.layout.length;
    const cols = currentLevel.layout[0].length;

    // BFS flood fill
    const queue = [{col: startCol, row: startRow}];
    const visited = new Set();

    while (queue.length > 0) {
      const {col, row} = queue.shift();
      const key = `${col},${row}`;

      if (visited.has(key)) continue;
      if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

      const current = currentLevel.layout[row][col];
      if (current !== targetTile) continue;

      visited.add(key);
      this.paintCell(col, row, replacementTile);

      // 加入鄰居
      queue.push({col: col - 1, row});
      queue.push({col: col + 1, row});
      queue.push({col, row: row - 1});
      queue.push({col, row: row + 1});
    }
  },

  // 矩形繪製（拖曳模式）
  paintRect(startCol, startRow, endCol, endRow, tileType) {
    const minCol = Math.min(startCol, endCol);
    const maxCol = Math.max(startCol, endCol);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);

    // 保存到 undo history（只在最後一次保存）
    DK.LevelEditor.MapEditor.history.save();

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        if (this.isValidCell(col, row)) {
          const currentLevel = DK.LevelEditor.state.currentLevel;
          const layoutRow = currentLevel.layout[row];
          currentLevel.layout[row] =
            layoutRow.substring(0, col) + tileType + layoutRow.substring(col + 1);
        }
      }
    }
  },

  // 橡皮擦
  erase(col, row, brushSize) {
    this.paintArea(col, row, '.', brushSize);
  },

  // 驗證格子是否合法
  isValidCell(col, row) {
    const currentLevel = DK.LevelEditor.state.currentLevel;
    return row >= 0 && row < currentLevel.layout.length &&
           col >= 0 && col < currentLevel.layout[0].length;
  },
},
```

---

## 四、網格線渲染與格子高亮

### 4.1 視覺設計

```
網格線：半透明灰色（#666666, alpha 0.3）
Hover 高亮：黃色邊框（#ffaa44, 2px）
畫筆範圍預覽：虛線框（顯示 brushSize 的作用範圍）
```

### 4.2 實作細節

```javascript
grid: {
  // 渲染網格線（在 displayCanvas 上）
  renderGrid(ctx) {
    if (!DK.LevelEditor.MapEditor.state.gridVisible) return;

    const cfg = DK.CONFIG;
    const level = DK.LevelEditor.state.currentLevel;
    const cols = level.layout[0].length;
    const rows = level.layout.length;

    ctx.strokeStyle = 'rgba(102, 102, 102, 0.3)';
    ctx.lineWidth = 1;

    // 垂直線
    for (let col = 0; col <= cols; col++) {
      const x = col * cfg.DISPLAY_TILE;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rows * cfg.DISPLAY_TILE);
      ctx.stroke();
    }

    // 水平線
    for (let row = 0; row <= rows; row++) {
      const y = row * cfg.DISPLAY_TILE;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(cols * cfg.DISPLAY_TILE, y);
      ctx.stroke();
    }
  },

  // 渲染 hover 高亮（支援矩形預覽）
  renderHover(ctx) {
    const hoverCell = DK.LevelEditor.MapEditor.state.hoverCell;
    if (!hoverCell) return;

    const cfg = DK.CONFIG;
    const state = DK.LevelEditor.MapEditor.state;
    const selectedTile = state.selectedTile;
    const tileColor = DK.LevelEditor.MapEditor.tilePalette.tiles[selectedTile].color;

    // 矩形模式：顯示拖曳預覽
    if (state.mode === 'rect' && state.isPainting && state.rectStart) {
      const minCol = Math.min(state.rectStart.col, hoverCell.col);
      const maxCol = Math.max(state.rectStart.col, hoverCell.col);
      const minRow = Math.min(state.rectStart.row, hoverCell.row);
      const maxRow = Math.max(state.rectStart.row, hoverCell.row);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const x = col * cfg.DISPLAY_TILE;
          const y = row * cfg.DISPLAY_TILE;

          // 半透明填充
          ctx.fillStyle = tileColor + '60'; // alpha 40%
          ctx.fillRect(x, y, cfg.DISPLAY_TILE, cfg.DISPLAY_TILE);

          // 虛線邊框
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = DK.COLORS.UI_SELECTED;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cfg.DISPLAY_TILE, cfg.DISPLAY_TILE);
          ctx.setLineDash([]);
        }
      }

      // 顯示尺寸提示
      const width = maxCol - minCol + 1;
      const height = maxRow - minRow + 1;
      const centerX = (minCol + maxCol + 1) * cfg.DISPLAY_TILE / 2;
      const centerY = (minRow + maxRow + 1) * cfg.DISPLAY_TILE / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(centerX - 30, centerY - 12, 60, 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${width}×${height}`, centerX, centerY + 5);
      ctx.textAlign = 'left';

    } else {
      // 單點/填充/橡皮擦模式：顯示畫筆範圍
      const brushSize = state.brushSize;
      const radius = Math.floor(brushSize / 2);

      for (let r = -radius; r <= radius; r++) {
        for (let c = -radius; c <= radius; c++) {
          const col = hoverCell.col + c;
          const row = hoverCell.row + r;

          const x = col * cfg.DISPLAY_TILE;
          const y = row * cfg.DISPLAY_TILE;

          // 外框
          ctx.strokeStyle = DK.COLORS.UI_SELECTED;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cfg.DISPLAY_TILE, cfg.DISPLAY_TILE);

          // 半透明填充（預覽顏色）
          ctx.fillStyle = tileColor + '40'; // alpha 25%
          ctx.fillRect(x, y, cfg.DISPLAY_TILE, cfg.DISPLAY_TILE);
        }
      }
    }

    // 顯示當前格子座標（在格子內）
    if (state.gridVisible) {
      const x = hoverCell.col * cfg.DISPLAY_TILE + 2;
      const y = hoverCell.row * cfg.DISPLAY_TILE + 12;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(x, y - 10, 40, 14);

      ctx.fillStyle = '#ffff00';
      ctx.font = '10px monospace';
      ctx.fillText(`${hoverCell.col},${hoverCell.row}`, x + 2, y);
    }
  },
},
```

---

## 五、地圖預覽與導航（Minimap）

### 5.1 視覺設計

```
┌─────────────────┐
│   地圖預覽      │  ← 右上角小地圖（200x150px）
│  ┌───────────┐  │
│  │ [▓▓▓▓▓▓] │  │  ▓ = 牆壁
│  │ [▓....▓] │  │  . = 地板
│  │ [▓..H.▓] │  │  H = 地心
│  │ [▓▓▓▓▓▓] │  │  □ = 當前視窗
│  └───────────┘  │
│  點擊跳轉位置    │
└─────────────────┘
```

### 5.2 實作細節

```javascript
minimap: {
  width: 200,
  height: 150,
  x: 960 - 220,  // 右上角
  y: 20,

  // 渲染小地圖
  render(ctx) {
    const level = DK.LevelEditor.state.currentLevel;
    const cols = level.layout[0].length;
    const rows = level.layout.length;

    // 計算縮放比例
    const scaleX = this.width / cols;
    const scaleY = this.height / rows;
    const scale = Math.min(scaleX, scaleY);

    // 繪製背景
    ctx.fillStyle = DK.COLORS.UI_PANEL;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 繪製地圖
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = level.layout[row][col];
        const tileColor = DK.LevelEditor.MapEditor.tilePalette.tiles[tile]?.color || '#000000';

        ctx.fillStyle = tileColor;
        ctx.fillRect(
          this.x + col * scale,
          this.y + row * scale,
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }

    // 繪製當前視窗框（viewport indicator）
    const camera = DK.LevelEditor.state.camera;
    ctx.strokeStyle = DK.COLORS.UI_SELECTED;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.x + camera.x * scale,
      this.y + camera.y * scale,
      camera.width * scale,
      camera.height * scale
    );

    // 邊框
    ctx.strokeStyle = DK.COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
  },

  // 點擊跳轉
  handleClick(mouseX, mouseY) {
    if (mouseX < this.x || mouseX > this.x + this.width ||
        mouseY < this.y || mouseY > this.y + this.height) {
      return false;
    }

    const level = DK.LevelEditor.state.currentLevel;
    const cols = level.layout[0].length;
    const rows = level.layout.length;
    const scale = Math.min(this.width / cols, this.height / rows);

    // 計算點擊的地圖位置
    const clickCol = Math.floor((mouseX - this.x) / scale);
    const clickRow = Math.floor((mouseY - this.y) / scale);

    // 移動攝影機到該位置
    DK.LevelEditor.state.camera.x = clickCol;
    DK.LevelEditor.state.camera.y = clickRow;

    return true;
  },
},
```

---

## 六、Undo/Redo 機制

### 6.1 數據結構

```javascript
history: {
  stack: [],          // 歷史記錄堆疊
  current: -1,        // 當前指針
  maxSize: 50,        // 最大記錄數

  // 保存當前狀態
  save() {
    const level = DK.LevelEditor.state.currentLevel;
    const snapshot = {
      layout: level.layout.map(row => row), // 深拷貝
      timestamp: Date.now(),
    };

    // 清除 redo 分支
    this.stack = this.stack.slice(0, this.current + 1);

    // 加入新記錄
    this.stack.push(snapshot);
    if (this.stack.length > this.maxSize) {
      this.stack.shift();
    } else {
      this.current++;
    }
  },

  // Undo
  undo() {
    if (this.current <= 0) return false;

    this.current--;
    const snapshot = this.stack[this.current];
    DK.LevelEditor.state.currentLevel.layout = snapshot.layout.map(row => row);
    return true;
  },

  // Redo
  redo() {
    if (this.current >= this.stack.length - 1) return false;

    this.current++;
    const snapshot = this.stack[this.current];
    DK.LevelEditor.state.currentLevel.layout = snapshot.layout.map(row => row);
    return true;
  },

  // 清空歷史
  clear() {
    this.stack = [];
    this.current = -1;
  },
},
```

---

## 七、鍵盤快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `1/2/3` | 切換畫筆大小 |
| `W` | 選擇牆壁 |
| `.` | 選擇地板 |
| `P` | 畫筆模式 |
| `F` | 填充模式 |
| `E` | 橡皮擦模式 |
| `G` | 切換網格線顯示 |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Space + 拖曳` | 平移視角 |

---

## 八、事件處理整合

### 8.1 滑鼠事件

```javascript
// 在 DK.UI 中整合（支援四種模式）
DK.UI.handleMapEditorMouseDown = function(worldX, worldY, button) {
  const cfg = DK.CONFIG;
  const col = Math.floor(worldX / cfg.TILE_SIZE);
  const row = Math.floor(worldY / cfg.TILE_SIZE);

  const state = DK.LevelEditor.MapEditor.state;
  state.isPainting = true;

  // 根據模式執行
  if (state.mode === 'paint') {
    // 單點模式：立即繪製
    DK.LevelEditor.MapEditor.brush.paintArea(col, row, state.selectedTile, state.brushSize);

  } else if (state.mode === 'fill') {
    // 填充模式：Flood Fill
    const targetTile = DK.LevelEditor.state.currentLevel.layout[row][col];
    DK.LevelEditor.MapEditor.brush.floodFill(col, row, targetTile, state.selectedTile);

  } else if (state.mode === 'rect') {
    // 矩形模式：記錄起點
    state.rectStart = { col, row };

  } else if (state.mode === 'erase') {
    // 橡皮擦模式：立即擦除
    DK.LevelEditor.MapEditor.brush.erase(col, row, state.brushSize);
  }
};

DK.UI.handleMapEditorMouseMove = function(worldX, worldY) {
  const cfg = DK.CONFIG;
  const col = Math.floor(worldX / cfg.TILE_SIZE);
  const row = Math.floor(worldY / cfg.TILE_SIZE);

  DK.LevelEditor.MapEditor.state.hoverCell = { col, row };

  // 拖曳繪製（僅單點和橡皮擦模式）
  if (DK.LevelEditor.MapEditor.state.isPainting) {
    const state = DK.LevelEditor.MapEditor.state;

    if (state.mode === 'paint') {
      DK.LevelEditor.MapEditor.brush.paintArea(col, row, state.selectedTile, state.brushSize);
    } else if (state.mode === 'erase') {
      DK.LevelEditor.MapEditor.brush.erase(col, row, state.brushSize);
    }
    // 矩形模式在 move 時只更新預覽，不實際繪製
  }
};

DK.UI.handleMapEditorMouseUp = function(worldX, worldY) {
  const state = DK.LevelEditor.MapEditor.state;

  // 矩形模式：鬆開時繪製矩形
  if (state.mode === 'rect' && state.isPainting && state.rectStart) {
    const cfg = DK.CONFIG;
    const col = Math.floor(worldX / cfg.TILE_SIZE);
    const row = Math.floor(worldY / cfg.TILE_SIZE);

    DK.LevelEditor.MapEditor.brush.paintRect(
      state.rectStart.col,
      state.rectStart.row,
      col,
      row,
      state.selectedTile
    );

    state.rectStart = null;
  }

  state.isPainting = false;
};
```

---

## 九、即時預覽效果系統

### 9.1 預覽效果類型

```javascript
preview: {
  // 狀態
  enabled: true,
  lastPreviewTile: null,

  // 渲染即時預覽（半透明覆蓋層）
  render(ctx) {
    if (!this.enabled) return;

    const state = DK.LevelEditor.MapEditor.state;
    const hoverCell = state.hoverCell;
    if (!hoverCell) return;

    const cfg = DK.CONFIG;
    const selectedTile = state.selectedTile;
    const tileInfo = DK.LevelEditor.MapEditor.tilePalette.tiles[selectedTile];

    // 使用 DK.Map.renderTile() 的預覽版本
    this.renderTilePreview(ctx, hoverCell.col, hoverCell.row, selectedTile, tileInfo);

    // 顯示工具提示（Tooltip）
    this.renderTooltip(ctx, hoverCell);
  },

  // 渲染地磚預覽（使用實際渲染邏輯）
  renderTilePreview(ctx, col, row, tileType, tileInfo) {
    const cfg = DK.CONFIG;
    const x = col * cfg.TILE_SIZE;
    const y = row * cfg.TILE_SIZE;

    // 保存當前 alpha
    const originalAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0.6;

    // 使用 DK.Map 的渲染邏輯（簡化版）
    if (tileType === 'W') {
      DK.PixelArt.rect(ctx, x, y, cfg.TILE_SIZE, cfg.TILE_SIZE, tileInfo.color);
    } else if (tileType === '.') {
      DK.PixelArt.rect(ctx, x, y, cfg.TILE_SIZE, cfg.TILE_SIZE, tileInfo.color);
    } else if (tileType === 'H') {
      // 地心預覽（紅色心形）
      DK.PixelArt.circle(ctx, x + cfg.TILE_SIZE / 2, y + cfg.TILE_SIZE / 2, 6, tileInfo.color);
    } else if (tileType === 'S' || tileType === 'E') {
      // 入口/出口預覽（箭頭）
      DK.PixelArt.rect(ctx, x, y, cfg.TILE_SIZE, cfg.TILE_SIZE, tileInfo.color);
      // 繪製箭頭
      const arrowColor = tileType === 'S' ? '#44ff44' : '#4444ff';
      DK.PixelArt.line(ctx, x + 4, y + 8, x + 12, y + 8, arrowColor);
      DK.PixelArt.line(ctx, x + 12, y + 8, x + 10, y + 6, arrowColor);
      DK.PixelArt.line(ctx, x + 12, y + 8, x + 10, y + 10, arrowColor);
    } else if (tileType === 'T') {
      // 傳送門預覽（螺旋）
      DK.PixelArt.circle(ctx, x + cfg.TILE_SIZE / 2, y + cfg.TILE_SIZE / 2, 7, tileInfo.color);
      DK.PixelArt.circle(ctx, x + cfg.TILE_SIZE / 2, y + cfg.TILE_SIZE / 2, 4, '#ffffff');
    } else {
      // 其他地磚
      DK.PixelArt.rect(ctx, x, y, cfg.TILE_SIZE, cfg.TILE_SIZE, tileInfo.color);
    }

    ctx.globalAlpha = originalAlpha;
  },

  // 渲染工具提示
  renderTooltip(ctx, hoverCell) {
    const state = DK.LevelEditor.MapEditor.state;
    const cfg = DK.CONFIG;

    const selectedTile = state.selectedTile;
    const tileInfo = DK.LevelEditor.MapEditor.tilePalette.tiles[selectedTile];

    // Tooltip 位置（跟隨滑鼠，稍微偏移）
    const tooltipX = (hoverCell.col + 1) * cfg.DISPLAY_TILE + 10;
    const tooltipY = hoverCell.row * cfg.DISPLAY_TILE;

    // Tooltip 內容
    const lines = [
      `地磚: [${selectedTile}] ${tileInfo.name}`,
      `模式: ${this.getModeName(state.mode)}`,
      `大小: ${state.brushSize}×${state.brushSize}`,
    ];

    // 背景
    const padding = 8;
    const lineHeight = 16;
    const width = 180;
    const height = lines.length * lineHeight + padding * 2;

    ctx.fillStyle = 'rgba(30, 26, 46, 0.95)';
    ctx.fillRect(tooltipX, tooltipY, width, height);

    ctx.strokeStyle = DK.COLORS.UI_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(tooltipX, tooltipY, width, height);

    // 文字
    ctx.fillStyle = DK.COLORS.UI_TEXT;
    ctx.font = '12px monospace';

    lines.forEach((line, i) => {
      ctx.fillText(line, tooltipX + padding, tooltipY + padding + (i + 1) * lineHeight);
    });
  },

  // 模式名稱轉換
  getModeName(mode) {
    const names = {
      paint: '🖌️ 單點',
      fill: '🪣 填充',
      rect: '▭ 矩形',
      erase: '🧹 橡皮擦',
    };
    return names[mode] || mode;
  },
},
```

### 9.2 預覽動畫效果

```javascript
// 在 state 中新增
state: {
  // ... 其他狀態
  previewAnimation: {
    time: 0,              // 動畫時間（用於呼吸效果）
    pulseSpeed: 0.05,     // 脈衝速度
  },
},

// 在 render 中更新動畫
updatePreviewAnimation(deltaTime) {
  this.state.previewAnimation.time += deltaTime * this.state.previewAnimation.pulseSpeed;

  // 計算呼吸效果 alpha（0.3 ~ 0.7）
  const pulse = Math.sin(this.state.previewAnimation.time) * 0.2 + 0.5;
  return pulse;
},
```

---

## 十、完整 UI 互動邏輯流程圖

```
使用者操作流程：

1. 選擇地磚類型
   ├─ 點擊 Palette 中的地磚
   └─ 或使用鍵盤快捷鍵（W/./ 等）

2. 選擇筆刷模式
   ├─ 單點：連續拖曳繪製
   ├─ 填充：點擊一次填充區域
   ├─ 矩形：拖曳繪製矩形
   └─ 橡皮擦：連續拖曳擦除

3. 調整畫筆大小
   ├─ 點擊大小按鈕（1/2/3/5）
   └─ 或使用鍵盤快捷鍵（1/2/3/5）

4. 在地圖上操作
   ├─ 滑鼠移動 → 更新 hover 高亮 + 座標顯示
   ├─ 按下滑鼠 → 開始繪製
   ├─ 拖曳滑鼠 → 連續繪製（單點/橡皮擦）或預覽（矩形）
   └─ 鬆開滑鼠 → 完成繪製

5. Undo/Redo
   ├─ Ctrl+Z → 撤銷上一步
   └─ Ctrl+Shift+Z → 重做

6. 小地圖導航
   └─ 點擊小地圖 → 跳轉到對應位置

7. 切換顯示選項
   ├─ G → 切換網格線
   └─ C → 切換座標顯示
```

### 10.1 狀態管理完整版

```javascript
state: {
  // 工具選擇
  selectedTile: '.',           // 當前選中的地磚類型
  brushSize: 1,                // 畫筆大小（1/2/3/5）
  mode: 'paint',               // 模式：paint/fill/rect/erase

  // 繪製狀態
  isPainting: false,           // 是否正在繪製
  rectStart: null,             // 矩形起點 {col, row}
  lastPaintedCell: null,       // 上次繪製的格子（避免重複繪製）

  // 顯示選項
  gridVisible: true,           // 網格線顯示
  coordVisible: true,          // 座標顯示
  tooltipVisible: true,        // 工具提示顯示
  previewEnabled: true,        // 即時預覽

  // 互動狀態
  hoverCell: null,             // 當前 hover 的格子 {col, row}
  hoveredButton: null,         // 當前 hover 的按鈕 ID

  // 攝影機（用於小地圖）
  camera: {
    x: 0,                      // 視窗左上角 X（格子單位）
    y: 0,                      // 視窗左上角 Y（格子單位）
    width: 20,                 // 視窗寬度（格子單位）
    height: 13,                // 視窗高度（格子單位）
  },

  // 動畫
  previewAnimation: {
    time: 0,
    pulseSpeed: 0.05,
  },
},
```

### 10.2 按鈕點擊處理

```javascript
// 處理 UI 按鈕點擊
handleButtonClick(mouseX, mouseY) {
  // 檢查 Tile Palette
  if (this.tilePalette.handleClick(mouseX, mouseY, 20, 640)) {
    return true;
  }

  // 檢查筆刷模式按鈕
  if (this.handleBrushModeClick(mouseX, mouseY)) {
    return true;
  }

  // 檢查畫筆大小按鈕
  if (this.handleBrushSizeClick(mouseX, mouseY)) {
    return true;
  }

  // 檢查小地圖
  if (this.minimap.handleClick(mouseX, mouseY)) {
    return true;
  }

  return false;
},

// 處理筆刷模式按鈕點擊
handleBrushModeClick(mouseX, mouseY) {
  const modes = ['paint', 'fill', 'rect', 'erase'];
  const btnWidth = 80;
  const btnHeight = 30;
  const gap = 10;
  const startX = 20;
  const startY = 760; // 假設工具列在 Y=760

  for (let i = 0; i < modes.length; i++) {
    const x = startX + i * (btnWidth + gap);
    if (mouseX >= x && mouseX <= x + btnWidth &&
        mouseY >= startY && mouseY <= startY + btnHeight) {
      this.state.mode = modes[i];
      return true;
    }
  }

  return false;
},

// 處理畫筆大小按鈕點擊
handleBrushSizeClick(mouseX, mouseY) {
  const sizes = [1, 2, 3, 5];
  const btnSize = 28;
  const gap = 5;
  const startX = 480; // 假設在模式按鈕右側
  const startY = 760;

  for (let i = 0; i < sizes.length; i++) {
    const x = startX + i * (btnSize + gap);
    if (mouseX >= x && mouseX <= x + btnSize &&
        mouseY >= startY && mouseY <= startY + btnSize) {
      this.state.brushSize = sizes[i];
      return true;
    }
  }

  return false;
},
```

---

## 十一、整合建議

### 9.1 檔案結構

```
js/
  level-editor/
    map-editor.js       ← 本設計的實作
    portal-editor.js    ← 傳送門系統（Task #3）
    wave-editor.js      ← 波次設定（Task #4）
    storage.js          ← 存儲系統（Task #5）
  level-editor-main.js  ← 總控制器（Task #1）
```

### 9.2 渲染流程

```
1. DK.LevelEditor.MapEditor.grid.renderGrid(displayCtx)
2. DK.Map.render(gameCtx) // 地圖本身
3. DK.LevelEditor.MapEditor.grid.renderHover(displayCtx)
4. DK.LevelEditor.MapEditor.minimap.render(displayCtx)
5. DK.LevelEditor.MapEditor.tilePalette.render(displayCtx, 20, 640)
```

---

## 十、測試要點

1. **畫筆功能**
   - 單格繪製正確
   - 2x2/3x3 多格繪製正確
   - 拖曳繪製流暢
   - 邊界不越界

2. **填充工具**
   - 相同類型連續區域填充正確
   - 不會越過不同類型的邊界
   - 大面積填充效能可接受

3. **Undo/Redo**
   - 可正確回退/重做
   - Redo 分支正確清除
   - 最大記錄數限制生效

4. **網格與高亮**
   - 網格線顯示正確
   - Hover 高亮響應靈敏
   - 畫筆範圍預覽準確

5. **小地圖**
   - 地圖顏色正確
   - 點擊跳轉正確
   - Viewport 框正確顯示

---

## 十一、效能優化建議

1. **地圖渲染快取**：修改地圖時僅重繪變動區域
2. **Flood Fill 優化**：限制填充範圍或使用 Web Worker
3. **Throttle/Debounce**：滑鼠移動事件使用 throttle（16ms）
4. **Canvas 分層**：Grid、Hover、Palette 使用獨立 canvas

---

## 十二、視覺風格一致性

所有 UI 元素使用 `DK.COLORS` 中的配色：

- 背景：`UI_PANEL` (#1e1a2e)
- 邊框：`UI_BORDER` (#4a3e6e)
- 文字：`UI_TEXT` (#e8e0d0)
- 選中：`UI_SELECTED` (#ffaa44)
- 按鈕高亮：`UI_BORDER_LIGHT` (#6a5e8e)

---

## 十三、完整 UI 佈局示意圖

```
┌────────────────────────────────────────────────────────────────────────────┐
│  地圖編輯器 - Dungeon Keep Level Editor                         [X] 關閉  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────┐  ┌──────────────────────┐   │
│  │                                          │  │   小地圖 (Minimap)   │   │
│  │                                          │  │  ┌────────────────┐ │   │
│  │         主地圖編輯區域                   │  │  │ [▓▓▓▓▓▓▓▓▓▓]  │ │   │
│  │         (40×26 格，網格顯示)             │  │  │ [▓........▓]  │ │   │
│  │                                          │  │  │ [▓...H....▓]  │ │   │
│  │   座標 (12, 8) → [W] 牆壁                │  │  │ [▓▓▓▓▓▓▓▓▓▓]  │ │   │
│  │   ┌─┬─┬─┬─┬─┐                            │  │  │     ↑         │ │   │
│  │   │W│W│W│W│W│  ← 網格線                  │  │  │  當前視窗     │ │   │
│  │   ├─┼─┼─┼─┼─┤                            │  │  └────────────────┘ │   │
│  │   │W│.│.│.│W│  ← Hover 高亮 (黃框)       │  │  點擊跳轉位置       │   │
│  │   ├─┼─┼─┼─┼─┤                            │  └──────────────────────┘   │
│  │   │W│.│H│.│W│  ← H=地心 (紅色心形)       │                             │
│  │   ├─┼─┼─┼─┼─┤                            │  ┌──────────────────────┐   │
│  │   │W│W│W│W│W│                            │  │   圖層管理           │   │
│  │   └─┴─┴─┴─┴─┘                            │  │  [✓] 地形層          │   │
│  │                                          │  │  [✓] 裝飾層          │   │
│  │   即時預覽：半透明地磚覆蓋                │  │  [ ] 路徑預覽        │   │
│  │                                          │  └──────────────────────┘   │
│  └─────────────────────────────────────────┘                             │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│  地磚工具列 (Tile Palette)                                                 │
├────────────────────────────────────────────────────────────────────────────┤
│  基礎地形                                                                   │
│  [🧱W] 牆壁  [⬜.] 地板  [🌑O] 外圍  [🚧B] 路障                            │
│                                                                             │
│  核心設施                                                                   │
│  [❤️H] 地心  [🚪S] 入口  [🏁E] 出口  [🌀T] 傳送門                          │
│                                                                             │
│  環境元素                                                                   │
│  [💧P] 水潭  [🕳️A] 深淵  [🌿G] 草叢  [🛤️R] 軌道                            │
├────────────────────────────────────────────────────────────────────────────┤
│  筆刷模式                                                                   │
│  [🖌️ 單點] [🪣 填充] [▭ 矩形] [🧹 橡皮擦]  ← 當前選中：單點             │
│                                                                             │
│  畫筆大小: [1] [2] [3] [5]  ← 當前選中：1                                 │
│                                                                             │
│  [✓] 顯示網格線  [✓] 顯示座標  [✓] 即時預覽                               │
│                                                                             │
│  當前座標: (X: 12, Y: 8)  |  當前地磚: [W] 牆壁                            │
│                                                                             │
│  快捷鍵: 1/2/3/5=大小  W/.=地磚  P/F/R/E=模式  G=網格  Ctrl+Z=Undo        │
├────────────────────────────────────────────────────────────────────────────┤
│  操作按鈕                                                                   │
│  [↶ Undo] [↷ Redo] [🗑️ 清空] [💾 儲存] [📥 載入] [📤 匯出JSON]         │
└────────────────────────────────────────────────────────────────────────────┘
```

### 13.1 顏色與視覺層次

```
層次 1: 地圖背景
  └─ 使用 DK.COLORS 中的實際地磚顏色
  └─ 網格線：rgba(102, 102, 102, 0.3)

層次 2: 即時預覽（半透明覆蓋）
  └─ Alpha 0.6 的地磚顏色
  └─ 脈衝動畫（0.3 ~ 0.7 呼吸效果）

層次 3: Hover 高亮
  └─ 黃色邊框 (#ffaa44, 2px)
  └─ 座標標籤（黑底黃字）

層次 4: UI 工具列
  └─ 背景：UI_PANEL (#1e1a2e)
  └─ 邊框：UI_BORDER (#4a3e6e)
  └─ 選中：UI_SELECTED (#ffaa44)

層次 5: 工具提示 (Tooltip)
  └─ 半透明黑底 rgba(30, 26, 46, 0.95)
  └─ 白色文字 (#e8e0d0)
```

### 13.2 響應式設計考量

```javascript
// 自適應佈局（支援不同螢幕尺寸）
layout: {
  // 基礎尺寸（960×720）
  base: { width: 960, height: 720 },

  // 工具列高度
  paletteHeight: 160,

  // 小地圖尺寸
  minimapWidth: 200,
  minimapHeight: 150,

  // 計算主地圖區域
  getMapArea() {
    return {
      x: 0,
      y: 0,
      width: this.base.width - this.minimapWidth - 20,
      height: this.base.height - this.paletteHeight - 20,
    };
  },
},
```

---

## 十四、完整功能檢查清單

### 必備功能 (Must Have)

- [x] 12 種地磚類型選擇（含入口/出口/傳送門）
- [x] 4 種筆刷模式（單點/填充/矩形/橡皮擦）
- [x] 畫筆大小調整（1/2/3/5）
- [x] 網格線顯示/隱藏
- [x] 座標即時顯示
- [x] Hover 高亮與預覽
- [x] Undo/Redo 機制（50 層）
- [x] 小地圖導航
- [x] 鍵盤快捷鍵

### 進階功能 (Should Have)

- [x] 即時預覽效果（半透明覆蓋）
- [x] 工具提示 (Tooltip)
- [x] 矩形拖曳預覽（虛線框 + 尺寸標籤）
- [x] 呼吸動畫效果
- [x] 分類組織的 Palette
- [x] 按鈕點擊回饋

### 未來擴展 (Nice to Have)

- [ ] 圖層管理（地形/裝飾/特效）
- [ ] 複製/貼上區域
- [ ] 地圖旋轉/鏡像
- [ ] 筆刷形狀（圓形/菱形）
- [ ] 自訂調色盤
- [ ] 歷史記錄瀏覽器

---

**設計完成！**

完整的地圖編輯器設計文件已完成，包含：
- ✅ 完整的 Tile Palette UI（含入口/出口/傳送門）
- ✅ 四種筆刷模式實作細節（單點/填充/矩形/橡皮擦）
- ✅ 網格顯示與座標提示系統
- ✅ 即時預覽效果與動畫
- ✅ 完整的 UI 互動邏輯流程
- ✅ 視覺設計示意圖與配色方案

**接下來請 architect-1 審核架構，然後由 coder-1 實作。**
