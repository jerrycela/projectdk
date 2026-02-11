# 小地圖與導航系統設計

**版本**: 1.0
**日期**: 2026-02-10
**設計者**: UI 開發者
**狀態**: 設計完成

---

## 一、系統概述

### 1.1 設計目標
為 Dungeon Keep 遊戲設計一個高效、直觀的小地圖與導航系統，幫助玩家在大地圖（40×26）中快速定位和移動視野。

### 1.2 核心功能
1. **小地圖顯示**：右上角固定位置顯示整體地圖縮略圖
2. **視野範圍指示**：高亮顯示當前攝影機視野範圍
3. **重要物件標記**：顯示地心、傳送門、英雄、敵人等關鍵物件
4. **快速導航**：點擊小地圖或拖拽視野框快速跳轉
5. **性能優化**：使用離屏 Canvas 快取和按需更新策略

### 1.3 技術約束
- **專案架構**：Pure vanilla JS（不使用框架）
- **Canvas 系統**：雙 canvas 架構（game-canvas + ui-canvas）
- **地圖尺寸**：世界 40×26，視野 20×13
- **像素風格**：保持低解析度像素藝術風格

---

## 二、視覺設計

### 2.1 佈局規格

```
┌─────────────────────────────────────────┐
│                                    ┌───┐│
│    遊戲視野區域 (960×624)            │小 ││
│                                    │地 ││
│                                    │圖 ││
│                                    └───┘│
├─────────────────────────────────────────┤
│              UI 區域 (96px)              │
└─────────────────────────────────────────┘
```

**小地圖位置與尺寸**：
- **位置**：右上角，距離右邊緣 12px，距離上邊緣 12px
- **尺寸**：160×104px（世界 40×26 的 4 倍像素比例）
- **背景**：半透明深色背景 `rgba(18, 16, 30, 0.85)`
- **邊框**：2px 邊框，顏色 `#4a3e6e`

### 2.2 色彩方案

| 元素 | 顏色 | 說明 |
|------|------|------|
| **地面** | `#3a3428` | 可通行路徑（深褐色） |
| **牆壁** | `#1a1828` | 不可通行牆壁（深紫灰） |
| **深淵** | `#050508` | 死亡區域（純黑） |
| **水池** | `#1a2a4a` | 水元素區域（深藍） |
| **草地** | `#1a3a1a` | 草叢區域（深綠） |
| **視野框** | `#ffaa44` | 當前視野範圍（金色半透明） |
| **地心** | `#ff4444` | 地城之心（紅色脈動） |
| **傳送門/洞口** | `#4488ff` | 傳送門與敵人洞口（藍色） |
| **英雄** | `#44ff44` | 部署的英雄（綠色） |
| **敵人** | `#ff6622` | 入侵敵人（橙色，僅在小地圖內顯示） |

### 2.3 圖示設計

#### 地城之心（Dungeon Heart）
- **形狀**：2×2 小方塊（8×8px）
- **效果**：脈動動畫（透明度 0.6 ~ 1.0，週期 1000ms）
- **顏色**：紅色 `#ff4444`

#### 傳送門/洞口（Breach Holes）
- **形狀**：單格小方塊（4×4px）
- **顏色**：藍色 `#4488ff`
- **數量**：根據關卡設計，通常 2-4 個

#### 英雄（Heroes）
- **形狀**：單格圓點（3×3px 圓形）
- **顏色**：綠色 `#44ff44`
- **顯示邏輯**：僅顯示已部署的英雄

#### 敵人（Enemies）
- **形狀**：單格小點（2×2px）
- **顏色**：橙色 `#ff6622`
- **顯示邏輯**：僅顯示在小地圖視野內的敵人（性能優化）

---

## 三、數據結構設計

### 3.1 Minimap 物件

```javascript
DK.Minimap = {
  // === 配置 ===
  x: 0,               // 小地圖左上角 X 座標（螢幕空間）
  y: 0,               // 小地圖左上角 Y 座標
  width: 160,         // 小地圖寬度
  height: 104,        // 小地圖高度
  scale: 4,           // 世界座標到小地圖的縮放比例（40×26 → 160×104）
  padding: 12,        // 距離螢幕邊緣的間距

  // === 快取系統 ===
  _cacheCanvas: null,      // 離屏 Canvas（快取地形）
  _cacheCtx: null,
  _cacheDirty: true,       // 快取失效標記
  _lastUpdateTime: 0,      // 上次更新時間戳
  _updateInterval: 1000,   // 更新間隔（ms）

  // === 互動狀態 ===
  _isDragging: false,      // 是否正在拖拽視野框
  _dragStartX: 0,          // 拖拽起始點
  _dragStartY: 0,

  // === 初始化 ===
  init() {
    // 計算位置
    this.x = DK.CONFIG.DISPLAY_WIDTH - this.width - this.padding;
    this.y = this.padding;

    // 創建快取 Canvas
    this._cacheCanvas = document.createElement('canvas');
    this._cacheCanvas.width = this.width;
    this._cacheCanvas.height = this.height;
    this._cacheCtx = this._cacheCanvas.getContext('2d');
    this._cacheCtx.imageSmoothingEnabled = false;

    this._cacheDirty = true;
    this._lastUpdateTime = 0;
  },

  // === 更新快取 ===
  updateCache() {
    // 實作見 3.2
  },

  // === 渲染 ===
  render(ctx, time) {
    // 實作見 3.3
  },

  // === 互動處理 ===
  handleClick(mx, my) {
    // 實作見 3.4
  },

  handleMouseDown(mx, my) {
    // 實作見 3.5
  },

  handleMouseMove(mx, my) {
    // 實作見 3.6
  },

  handleMouseUp() {
    // 實作見 3.7
  },

  // === 工具方法 ===
  isInside(mx, my) {
    return mx >= this.x && mx <= this.x + this.width &&
           my >= this.y && my <= this.y + this.height;
  },

  screenToWorld(mx, my) {
    // 螢幕座標 → 世界座標
    const localX = mx - this.x;
    const localY = my - this.y;
    return {
      x: localX / this.scale * DK.CONFIG.TILE_SIZE,
      y: localY / this.scale * DK.CONFIG.TILE_SIZE
    };
  },

  worldToMinimap(wx, wy) {
    // 世界座標 → 小地圖座標
    return {
      x: this.x + (wx / DK.CONFIG.TILE_SIZE) * this.scale,
      y: this.y + (wy / DK.CONFIG.TILE_SIZE) * this.scale
    };
  },

  invalidateCache() {
    this._cacheDirty = true;
  }
};
```

### 3.2 快取更新邏輯

```javascript
updateCache() {
  if (!this._cacheDirty) return;

  const ctx = this._cacheCtx;
  const T = DK.CONFIG.TILE_SIZE;
  const layout = DK.Map.layout;

  // 清空畫布
  ctx.clearRect(0, 0, this.width, this.height);

  // 繪製地形
  for (let row = 0; row < DK.CONFIG.WORLD_ROWS; row++) {
    for (let col = 0; col < DK.CONFIG.WORLD_COLS; col++) {
      const tile = layout[row] && layout[row][col];
      const x = col * this.scale;
      const y = row * this.scale;

      // 根據地形類型選擇顏色
      if (tile === '#') {
        ctx.fillStyle = DK.COLORS.WALL_DARK; // 牆壁
      } else if (tile === 'X') {
        ctx.fillStyle = DK.COLORS.ABYSS_DARK; // 深淵
      } else if (tile === 'W') {
        ctx.fillStyle = DK.COLORS.POOL_DARK; // 水池
      } else if (tile === 'G') {
        ctx.fillStyle = DK.COLORS.GRASS_DARK; // 草叢
      } else if (tile === '.' || tile === 'E' || tile === 'H' || tile === 'O' || tile === 'B') {
        ctx.fillStyle = DK.COLORS.FLOOR_DARK; // 地面
      } else {
        ctx.fillStyle = DK.COLORS.WALL_DARK; // 預設（牆壁）
      }

      ctx.fillRect(x, y, this.scale, this.scale);
    }
  }

  this._cacheDirty = false;
  this._lastUpdateTime = Date.now();
}
```

### 3.3 渲染邏輯

```javascript
render(ctx, time) {
  // 1. 更新快取（如果需要）
  const now = Date.now();
  if (this._cacheDirty || now - this._lastUpdateTime > this._updateInterval) {
    this.updateCache();
  }

  // 2. 繪製背景
  ctx.fillStyle = 'rgba(18, 16, 30, 0.85)';
  ctx.fillRect(this.x - 4, this.y - 4, this.width + 8, this.height + 8);

  // 3. 繪製邊框
  ctx.strokeStyle = DK.COLORS.UI_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);

  // 4. 繪製快取的地形
  ctx.drawImage(this._cacheCanvas, this.x, this.y);

  // 5. 繪製地城之心（脈動效果）
  if (DK.Map.heartPos) {
    const hp = DK.Map.heartPos;
    const pos = this.worldToMinimap(hp.col * DK.CONFIG.TILE_SIZE, hp.row * DK.CONFIG.TILE_SIZE);
    const pulse = 0.6 + 0.4 * Math.sin(time / 500);
    ctx.fillStyle = `rgba(255, 68, 68, ${pulse})`;
    ctx.fillRect(pos.x, pos.y, 8, 8); // 2×2 格（4px * 2）
  }

  // 6. 繪製傳送門/洞口
  if (DK.Map.breachHoles) {
    ctx.fillStyle = DK.COLORS.ELEMENT_WATER; // #4488ff
    for (const hole of DK.Map.breachHoles) {
      const pos = this.worldToMinimap(hole.col * DK.CONFIG.TILE_SIZE, hole.row * DK.CONFIG.TILE_SIZE);
      ctx.fillRect(pos.x, pos.y, 4, 4);
    }
  }

  // 7. 繪製英雄
  if (DK.Heroes && DK.Heroes.deployed) {
    ctx.fillStyle = DK.COLORS.HERO_SELECTED; // #44ff44
    for (const hero of DK.Heroes.deployed) {
      const pos = this.worldToMinimap(hero.x, hero.y);
      ctx.beginPath();
      ctx.arc(pos.x + 2, pos.y + 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 8. 繪製敵人（僅小地圖範圍內）
  if (DK.Enemies && DK.Enemies.active) {
    ctx.fillStyle = DK.COLORS.ELEMENT_FIRE; // #ff6622
    for (const enemy of DK.Enemies.active) {
      // 性能優化：僅繪製在小地圖範圍內的敵人
      const pos = this.worldToMinimap(enemy.x, enemy.y);
      ctx.fillRect(pos.x, pos.y, 2, 2);
    }
  }

  // 9. 繪製視野框
  const cam = DK.Game.camera;
  const viewportX = (cam.x / DK.CONFIG.TILE_SIZE) * this.scale;
  const viewportY = (cam.y / DK.CONFIG.TILE_SIZE) * this.scale;
  const viewportW = DK.CONFIG.GRID_COLS * this.scale; // 20 * 4 = 80
  const viewportH = DK.CONFIG.GRID_ROWS * this.scale; // 13 * 4 = 52

  // 視野框外部半透明遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(this.x, this.y, this.width, viewportY); // 上
  ctx.fillRect(this.x, this.y + viewportY + viewportH, this.width, this.height - viewportY - viewportH); // 下
  ctx.fillRect(this.x, this.y + viewportY, viewportX, viewportH); // 左
  ctx.fillRect(this.x + viewportX + viewportW, this.y + viewportY, this.width - viewportX - viewportW, viewportH); // 右

  // 視野框邊框（金色高亮）
  ctx.strokeStyle = DK.COLORS.UI_SELECTED; // #ffaa44
  ctx.lineWidth = 1;
  ctx.strokeRect(this.x + viewportX, this.y + viewportY, viewportW, viewportH);

  // 10. 標籤（可選）
  ctx.font = DK.FONTS.body(10);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = DK.COLORS.UI_TEXT_DIM;
  ctx.fillText('地圖', this.x + this.width / 2, this.y + this.height + 6);
}
```

### 3.4 點擊處理

```javascript
handleClick(mx, my) {
  if (!this.isInside(mx, my)) return false;

  // 將點擊位置轉換為世界座標
  const world = this.screenToWorld(mx, my);

  // 計算新的攝影機位置（視野中心對齊點擊位置）
  const newCamX = world.x - (DK.CONFIG.GRID_COLS * DK.CONFIG.TILE_SIZE) / 2;
  const newCamY = world.y - (DK.CONFIG.GRID_ROWS * DK.CONFIG.TILE_SIZE) / 2;

  // 更新攝影機位置
  DK.Game.camera.x = newCamX;
  DK.Game.camera.y = newCamY;
  DK.Game.clampCamera();

  return true;
}
```

### 3.5 拖拽開始

```javascript
handleMouseDown(mx, my) {
  if (!this.isInside(mx, my)) return false;

  // 檢查是否點擊在視野框內
  const cam = DK.Game.camera;
  const viewportX = this.x + (cam.x / DK.CONFIG.TILE_SIZE) * this.scale;
  const viewportY = this.y + (cam.y / DK.CONFIG.TILE_SIZE) * this.scale;
  const viewportW = DK.CONFIG.GRID_COLS * this.scale;
  const viewportH = DK.CONFIG.GRID_ROWS * this.scale;

  if (mx >= viewportX && mx <= viewportX + viewportW &&
      my >= viewportY && my <= viewportY + viewportH) {
    this._isDragging = true;
    this._dragStartX = mx;
    this._dragStartY = my;
    return true;
  }

  // 否則視為點擊跳轉
  return this.handleClick(mx, my);
}
```

### 3.6 拖拽移動

```javascript
handleMouseMove(mx, my) {
  if (!this._isDragging) return false;

  const dx = (mx - this._dragStartX) / this.scale * DK.CONFIG.TILE_SIZE;
  const dy = (my - this._dragStartY) / this.scale * DK.CONFIG.TILE_SIZE;

  DK.Game.camera.x += dx;
  DK.Game.camera.y += dy;
  DK.Game.clampCamera();

  this._dragStartX = mx;
  this._dragStartY = my;

  return true;
}
```

### 3.7 拖拽結束

```javascript
handleMouseUp() {
  if (this._isDragging) {
    this._isDragging = false;
    return true;
  }
  return false;
}
```

---

## 四、整合方案

### 4.1 初始化流程

**在 `js/main.js` 中初始化**：

```javascript
// 在 DK.Game.init() 之後
if (DK.Minimap) DK.Minimap.init();
```

### 4.2 渲染流程

**在 `js/main.js` 的 render loop 中**：

```javascript
// 在 DK.UI.render(uiCtx) 之後
if (DK.Minimap) DK.Minimap.render(uiCtx, DK.Game.time);
```

### 4.3 輸入處理

**在 `js/main.js` 的 input handlers 中**：

#### mousedown 事件
```javascript
uiCanvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  const rect = uiCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 優先處理 Minimap
  if (DK.Minimap && DK.Minimap.handleMouseDown(mx, my)) {
    return;
  }

  // 原有的 UI 處理
  DK.UI.handleMouseDown(mx, my);
});
```

#### mousemove 事件
```javascript
uiCanvas.addEventListener('mousemove', (e) => {
  const rect = uiCanvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 優先處理 Minimap 拖拽
  if (DK.Minimap && DK.Minimap.handleMouseMove(mx, my)) {
    return;
  }

  // 原有的 UI 處理
  DK.UI.handleMouseMove(mx, my);
});
```

#### mouseup 事件
```javascript
uiCanvas.addEventListener('mouseup', (e) => {
  if (e.button !== 0) return;

  // 處理 Minimap 拖拽結束
  if (DK.Minimap && DK.Minimap.handleMouseUp()) {
    return;
  }

  // ... 原有的 Start/GameOver 處理 ...

  DK.UI.handleMouseUp(mx, my);
});
```

### 4.4 快取失效觸發

**在 `js/map.js` 中觸發快取更新**：

```javascript
// 當地圖結構改變時（例如打破牆壁）
breakWall(col, row) {
  // ... 原有邏輯 ...

  // 通知 Minimap 快取失效
  if (DK.Minimap) DK.Minimap.invalidateCache();
}
```

**在 `js/game.js` 中觸發關卡切換**：

```javascript
startGame() {
  this.state = 'planning';
  this.init();

  // 通知 Minimap 快取失效
  if (DK.Minimap) DK.Minimap.invalidateCache();
}
```

---

## 五、性能優化策略

### 5.1 快取系統

**離屏 Canvas 快取**：
- 地形資料（牆壁、地面、深淵等）使用離屏 Canvas 快取
- 僅在地圖結構改變時重新繪製（例如打破牆壁）
- 每次渲染僅需 `drawImage()` 複製快取，無需重繪所有地塊

### 5.2 更新頻率限制

**時間戳判斷**：
- 設定最小更新間隔（預設 1000ms）
- 使用 `_lastUpdateTime` 追蹤上次更新時間
- 避免每幀都重繪快取

### 5.3 物件剔除

**敵人顯示優化**：
- 僅顯示在小地圖範圍內的敵人
- 如果敵人數量 > 100，考慮進一步剔除（例如僅顯示視野附近）

**條件渲染**：
```javascript
// 僅在 invasion 階段顯示敵人
if (DK.Game.state === 'invasion' && DK.Enemies.active) {
  // ... 繪製敵人 ...
}
```

### 5.4 記憶體管理

**Canvas 複用**：
- 使用單一離屏 Canvas 快取地形
- 避免每幀創建新的 Canvas 物件

**事件監聽器**：
- 事件監聽器註冊在主 Canvas 上，由 `DK.Minimap` 內部判斷是否處理
- 避免為 Minimap 單獨添加事件監聽器

---

## 六、擴展功能（可選）

### 6.1 縮放控制

**功能描述**：
- 滑鼠滾輪在小地圖上滾動時，調整小地圖顯示比例
- 支援 2x、4x、8x 三種縮放級別

**實作方案**：
```javascript
handleWheel(deltaY) {
  const scales = [2, 4, 8];
  let currentIndex = scales.indexOf(this.scale);

  if (deltaY > 0) {
    currentIndex = Math.min(scales.length - 1, currentIndex + 1);
  } else {
    currentIndex = Math.max(0, currentIndex - 1);
  }

  this.scale = scales[currentIndex];
  this.width = DK.CONFIG.WORLD_COLS * this.scale;
  this.height = DK.CONFIG.WORLD_ROWS * this.scale;
  this.invalidateCache();
}
```

### 6.2 霧戰效果

**功能描述**：
- 僅顯示玩家探索過的區域
- 未探索區域顯示為半透明黑色遮罩

**實作方案**：
```javascript
// 在 DK.Map 中添加探索記錄
explored: Array(WORLD_ROWS).fill(null).map(() => Array(WORLD_COLS).fill(false)),

// 在 updateCache 中繪製遮罩
for (let row = 0; row < DK.CONFIG.WORLD_ROWS; row++) {
  for (let col = 0; col < DK.CONFIG.WORLD_COLS; col++) {
    if (!DK.Map.explored[row][col]) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(col * this.scale, row * this.scale, this.scale, this.scale);
    }
  }
}
```

### 6.3 陷阱標記

**功能描述**：
- 在小地圖上顯示已放置的陷阱位置
- 使用小圓點標記，顏色區分陷阱類型

**實作方案**：
```javascript
// 在 render() 中添加
if (DK.Traps && DK.Traps.placed) {
  for (const trap of DK.Traps.placed) {
    const pos = this.worldToMinimap(trap.col * DK.CONFIG.TILE_SIZE, trap.row * DK.CONFIG.TILE_SIZE);
    ctx.fillStyle = trap.element === 'electric' ? '#ffdd44' : '#7888a0';
    ctx.fillRect(pos.x + 1, pos.y + 1, 2, 2);
  }
}
```

---

## 七、檔案結構

### 7.1 新增檔案

**`js/minimap.js`**（約 300-400 行）

```
專案根目錄
├── js/
│   ├── minimap.js          【新增】小地圖系統
│   ├── main.js             【修改】整合 Minimap 初始化與渲染
│   ├── game.js             【修改】關卡切換時通知快取失效
│   ├── map.js              【修改】地圖變更時通知快取失效
│   └── ui.js               【無修改】
└── index.html              【修改】引入 minimap.js
```

### 7.2 引入方式

**在 `index.html` 中**：

```html
<!-- 在 ui.js 之後引入 -->
<script src="js/ui.js"></script>
<script src="js/minimap.js"></script>
<script src="js/main.js"></script>
```

---

## 八、測試方案

### 8.1 功能測試

| 測試項目 | 測試步驟 | 預期結果 |
|---------|---------|---------|
| **小地圖顯示** | 啟動遊戲 | 小地圖出現在右上角，顯示完整地圖 |
| **視野框同步** | 拖拽遊戲畫面 | 小地圖上的視野框同步移動 |
| **點擊跳轉** | 點擊小地圖任意位置 | 遊戲視野跳轉到對應位置 |
| **拖拽視野框** | 在小地圖上拖拽視野框 | 遊戲視野跟隨移動 |
| **地心顯示** | 觀察小地圖 | 地心以紅色脈動方塊顯示 |
| **傳送門顯示** | 進入 breach 階段 | 洞口以藍色方塊顯示 |
| **英雄顯示** | 部署英雄 | 英雄以綠色圓點顯示 |
| **敵人顯示** | 波次開始 | 敵人以橙色小點顯示 |
| **牆壁打破** | 打破牆壁 | 小地圖立即更新地形 |

### 8.2 性能測試

| 測試項目 | 測試條件 | 性能目標 |
|---------|---------|---------|
| **FPS 影響** | 敵人 50+ 時 | FPS 下降 < 5% |
| **記憶體佔用** | 遊玩 10 分鐘 | 記憶體增長 < 5MB |
| **快取更新頻率** | 打破 10 面牆 | 僅觸發 10 次快取更新 |

### 8.3 相容性測試

| 瀏覽器 | 版本 | 測試結果 |
|--------|------|---------|
| Chrome | 最新版 | ✓ |
| Firefox | 最新版 | ✓ |
| Safari | 最新版 | ✓ |
| Edge | 最新版 | ✓ |

---

## 九、實作優先級

### Phase 1：核心功能（必須）
1. ✅ 小地圖基礎渲染（地形、視野框）
2. ✅ 點擊跳轉功能
3. ✅ 視野框拖拽功能
4. ✅ 地城之心與傳送門標記
5. ✅ 快取系統與性能優化

### Phase 2：進階功能（建議）
6. ⏸️ 英雄與敵人標記
7. ⏸️ 地圖變更時快取更新

### Phase 3：擴展功能（可選）
8. ⏸️ 陷阱標記
9. ⏸️ 縮放控制
10. ⏸️ 霧戰效果

---

## 十、潛在風險與解決方案

### 10.1 性能風險

**風險**：大量敵人時繪製小地圖上的敵人點可能影響 FPS

**解決方案**：
1. 設定敵人顯示上限（例如最多顯示 100 個敵人）
2. 使用空間分割（僅顯示視野附近的敵人）
3. 降低敵人更新頻率（例如每 2 幀更新一次）

### 10.2 UI 衝突風險

**風險**：小地圖可能遮擋遊戲畫面上的重要資訊

**解決方案**：
1. 提供半透明背景（已實作）
2. 允許玩家切換小地圖顯示/隱藏（快捷鍵 `M`）
3. 提供移動小地圖位置的選項（左上/右上/左下/右下）

### 10.3 記憶體風險

**風險**：離屏 Canvas 快取可能佔用過多記憶體

**解決方案**：
1. 使用低解析度快取（已實作：4 倍縮放）
2. 僅快取地形，不快取動態物件
3. 定期檢查記憶體佔用（開發工具監控）

---

## 十一、技術細節與注意事項

### 11.1 座標轉換

**三種座標系統**：
1. **螢幕座標**：Canvas 畫布上的像素座標（0~960, 0~720）
2. **世界座標**：遊戲世界的像素座標（0~640, 0~416）
3. **小地圖座標**：小地圖上的像素座標（相對於小地圖左上角）

**轉換公式**：
```javascript
// 螢幕座標 → 世界座標
worldX = (screenX - minimap.x) / minimap.scale * TILE_SIZE
worldY = (screenY - minimap.y) / minimap.scale * TILE_SIZE

// 世界座標 → 小地圖座標
minimapX = minimap.x + (worldX / TILE_SIZE) * minimap.scale
minimapY = minimap.y + (worldY / TILE_SIZE) * minimap.scale
```

### 11.2 快取失效時機

**必須觸發快取更新的事件**：
1. 關卡切換（`DK.Game.startGame()`）
2. 牆壁打破（`DK.Map.breakWall()`）
3. 地圖載入（`DK.Map.init()`）

**不需要觸發快取更新的事件**：
1. 陷阱放置/移除（動態物件，每幀繪製）
2. 敵人/英雄移動（動態物件，每幀繪製）
3. 視野移動（不影響地形快取）

### 11.3 渲染順序

**小地圖渲染層級**（從下到上）：
1. 背景與邊框
2. 快取的地形
3. 視野框外遮罩
4. 地城之心（脈動）
5. 傳送門/洞口
6. 陷阱（可選）
7. 英雄
8. 敵人
9. 視野框邊框

### 11.4 互動優先級

**事件處理優先順序**：
1. **Minimap 互動**（最高優先級）
   - 拖拽視野框
   - 點擊跳轉
2. **UI 按鈕互動**
   - 陷阱選擇
   - 波次開始
3. **遊戲區域互動**
   - 陷阱放置
   - 英雄部署
   - 攝影機拖拽

---

## 十二、迭代優化建議

### Iteration 1：基礎實作
- 完成核心功能（Phase 1）
- 測試基本互動

### Iteration 2：性能優化
- 實作快取系統
- 測試大量敵人時的性能

### Iteration 3：視覺優化
- 調整顏色與透明度
- 添加平滑過渡動畫

### Iteration 4：互動優化
- 優化拖拽手感
- 添加音效反饋

### Iteration 5：擴展功能
- 實作陷阱標記
- 實作縮放控制

---

## 十三、參考資源

### 13.1 類似遊戲案例
- **StarCraft II**：小地圖顯示單位與建築，視野框可拖拽
- **Dota 2**：小地圖顯示英雄、敵人、建築，點擊跳轉
- **Kingdom Rush**：塔防遊戲，小地圖顯示敵人路徑與塔位

### 13.2 技術文件
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Canvas 性能優化指南](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

---

## 十四、總結

本設計文件提供了完整的小地圖與導航系統實作方案，涵蓋：
- ✅ 視覺設計與色彩方案
- ✅ 數據結構與核心邏輯
- ✅ 整合方案與檔案結構
- ✅ 性能優化策略
- ✅ 測試方案與風險評估

**核心優勢**：
1. **高效能**：離屏 Canvas 快取 + 按需更新
2. **直觀操作**：點擊跳轉 + 拖拽視野框
3. **清晰標記**：地心、傳送門、英雄、敵人一目了然
4. **易於擴展**：模組化設計，支援未來功能擴充

**實作建議**：
- **優先實作 Phase 1 核心功能**，確保基本可用
- **測試驅動開發**，每個功能完成後立即測試
- **性能監控**，使用 Chrome DevTools 追蹤 FPS 與記憶體

---

**設計完成時間**: 2026-02-10
**預計實作時間**: 4-6 小時（Phase 1 核心功能）
**文件版本**: 1.0
**狀態**: ✅ 設計完成，待實作
