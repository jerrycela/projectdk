# 房間系統設計文件
**專案**：ProjectDK - Dungeon Keep
**版本**：v1.1
**日期**：2026-02-10
**設計師**：room-designer agent
**審查評分**：⭐⭐⭐⭐⭐ (5/5) - creative-director

---

## 📋 修改記錄

### 2026-02-10 v1.1 - 符號衝突解決
- **問題**：訓練室原符號 `R` 與軌道 (Rail) 系統衝突
- **調查**：
  - `map.js:54` — 註解標記 R=軌道
  - `map.js:349` — `isPath()` 函式包含 R
  - `map.js:776` — 軌道地磚變體快取（架構保留）
  - `editor-main.js:564` — 編輯器 case 'R': // 軌道
- **結論**：即使軌道系統實作不完整，但架構層級已保留 R 符號
- **解決方案**：訓練室改用 `N` (traiNing)
- **驗證**：透過 Grep 確認 N 符號未被任何系統使用
- **影響範圍**：設計文件 7 處修改，實作階段需同步
- **創意總監評分**：⭐⭐⭐⭐ → ⭐⭐⭐⭐⭐ (符號衝突解決後升級為滿分)

### 2026-02-10 v1.0 - 初版設計完成
- 完成 6 種核心房間設計（寶庫/訓練室/圖書館/孵化場/牢房/墓地）
- 完成資料結構、放置邏輯、渲染設計、系統整合設計
- 提交創意總監審查

---

## 一、系統概述

### 1.1 設計目標
參考 Dungeon Keeper 的經典房間系統，為 ProjectDK 設計一套功能完整的房間機制：
- **玩家可框選空地建立房間**（類似 DK 的刷房間玩法）
- **房間面積影響效果**（越大越強）
- **房間類型多樣化**（至少 6 種）
- **與現有陷阱/英雄系統整合**

### 1.2 核心機制
- **框選建造**：玩家在地圖上拖曳框選區域，建立房間
- **容量計算**：房間面積（格子數）影響效果強度
- **自動邊界**：房間邊緣自動生成裝飾性牆壁
- **資源消耗**：建造與維護需要金幣

---

## 二、房間類型定義

### 2.1 房間列表（6 種核心房間）

#### 🏛️ 1. 寶庫 (Treasury)
```javascript
{
  id: 'treasury',
  name: '寶庫',
  description: '儲存金幣，容量=面積×50',
  icon: 'T',
  tile: 'T',  // 地圖符號
  color: '#ffd700',  // 金色
  buildCost: 100,
  maintainCost: 5,   // 每秒消耗
  baseCapacity: 50,  // 每格容量
  effects: {
    goldStorage: true,  // 增加金幣上限
  },
}
```
**玩法意義**：初期金幣有上限（預設 500），寶庫可擴充儲存空間。

---

#### 🏋️ 2. 訓練室 (Training Room)
```javascript
{
  id: 'training',
  name: '訓練室',
  description: '訓練怪物，面積每 3 格提供 1 訓練位',
  icon: 'N',
  tile: 'N',
  color: '#cc5522',  // 紅棕色
  buildCost: 150,
  maintainCost: 8,
  slotsPerArea: 3,  // 每 3 格提供 1 訓練位
  effects: {
    trainMonsters: true,
    upgradeSpeed: 1.0,  // 訓練速度（秒/等級）
  },
}
```
**玩法意義**：未來可實作怪物/英雄升級系統，訓練室提供升級槽位。

---

#### 📚 3. 圖書館 (Library)
```javascript
{
  id: 'library',
  name: '圖書館',
  description: '研究魔法，面積每 4 格提供 1 研究位',
  icon: 'L',
  tile: 'L',
  color: '#6666cc',  // 深藍色
  buildCost: 200,
  maintainCost: 10,
  slotsPerArea: 4,
  effects: {
    researchSpells: true,
    researchSpeed: 1.5,  // 研究速度（秒/項目）
  },
}
```
**玩法意義**：未來可實作法術/陷阱升級樹，圖書館解鎖新科技。

---

#### 🥚 4. 孵化場 (Hatchery)
```javascript
{
  id: 'hatchery',
  name: '孵化場',
  description: '生產怪物，面積每 5 格提供 1 孵化槽',
  icon: 'H',  // 注意：與 Heart 重複，需調整為 'Y'
  tile: 'Y',
  color: '#44aa44',  // 綠色
  buildCost: 180,
  maintainCost: 12,
  slotsPerArea: 5,
  effects: {
    spawnMonsters: true,
    spawnRate: 10,  // 每 10 秒生產 1 隻
  },
}
```
**玩法意義**：未來可實作防守怪物系統，孵化場自動生產守衛。

---

#### 🔒 5. 牢房 (Prison)
```javascript
{
  id: 'prison',
  name: '牢房',
  description: '關押敵人，面積每 2 格提供 1 囚禁位',
  icon: 'P',  // 注意：與 Pool 重複，需調整為 'J'
  tile: 'J',
  color: '#4a4a5a',  // 深灰色
  buildCost: 120,
  maintainCost: 6,
  slotsPerArea: 2,
  effects: {
    imprisonEnemies: true,
    tortureRate: 1.0,  // 每秒轉化進度
  },
}
```
**玩法意義**：未來可實作「捕獲+轉化」系統，敵人變友軍。

---

#### ⚰️ 6. 墓地 (Graveyard)
```javascript
{
  id: 'graveyard',
  name: '墓地',
  description: '復活亡靈，面積每 3 格提供 1 墓碑位',
  icon: 'G',  // 注意：與 Grass 重複，需調整為 'V'
  tile: 'V',
  color: '#2a4a2a',  // 深綠灰
  buildCost: 160,
  maintainCost: 7,
  slotsPerArea: 3,
  effects: {
    reviveDead: true,
    reviveChance: 0.3,  // 30% 復活機率
  },
}
```
**玩法意義**：未來可實作亡靈軍團系統，死亡敵人有機率復活為己方單位。

---

### 2.2 地磚符號分配（避免衝突）

#### 符號設計哲學（Design Philosophy）

**符號選擇三原則**（由創意總監審查確認）：

1. **直觀性 > 系統性**（用戶體驗優先）
   - 優先選擇用戶一眼可識別的符號
   - Emoji 方案：圖標即語意（⚔️ = 訓練室）
   - ASCII 方案：助記法清晰（N = traiNing）

2. **避讓現有 > 堅持首字母**（架構和諧性）
   - 尊重現有系統保留的符號（即使實作未完整）
   - 首字母衝突時尋找關鍵音節（Y, V, N）或同義詞（J = Jail）
   - 範例：訓練室原符號 `R` 與軌道系統衝突，改用 `N` (traiNing)

3. **記憶負擔 < 視覺清晰**（可學習性平衡）
   - 減少用戶記憶負擔，提升視覺辨識度
   - Emoji 完勝 ASCII 在「記憶負擔」維度（視覺直達語意）
   - 雙軌制結合兩者優點（Emoji 主 + ASCII 備用）

**實例分析**：

| 房間 | 首選符號 | 衝突原因 | 最終符號 | 策略 |
|------|---------|---------|---------|------|
| Treasury | T | ✅ 無衝突 | **T** | 首字母（最直觀）|
| Training | T | ❌ 與 Treasury 重複 | → R → **N** | 避讓 → 關鍵音節 |
| Library | L | ✅ 無衝突 | **L** | 首字母 |
| Hatchery | H | ❌ 與 Heart 衝突 | **Y** | 尾字母（hatcherY）|
| Prison | P | ❌ 與 Pool 衝突 | **J** | 同義詞（Jail）|
| Graveyard | G | ❌ 與 Grass 衝突 | **V** | 中間音（graVe）|

---

#### 符號分配表（ASCII 方案）

| 房間類型 | 符號 | 原有符號衝突 | 新符號 |
|---------|------|-------------|--------|
| 寶庫 (Treasury) | T | ❌ 無 | **T** ✅ |
| 訓練室 (Training) | N | ❌ 無 | **N** ✅ (traiNing) |
| 圖書館 (Library) | L | ❌ 無 | **L** ✅ |
| 孵化場 (Hatchery) | H | ❌ 與 Heart 重複 | **Y** ✅ |
| 牢房 (Prison) | P | ❌ 與 Pool 重複 | **J** ✅ (Jail) |
| 墓地 (Graveyard) | G | ❌ 與 Grass 重複 | **V** ✅ (graVe) |

**最終地磚符號**：
```javascript
const ROOM_TILES = {
  TREASURY: 'T',
  TRAINING: 'N',
  LIBRARY: 'L',
  HATCHERY: 'Y',
  PRISON: 'J',
  GRAVEYARD: 'V',
};
```

---

## 三、資料結構設計

### 3.1 房間定義檔（js/room-types.js）

```javascript
/**
 * Dungeon Keep - Room Type Definitions
 */
window.DK = window.DK || {};

DK.ROOM_TYPES = {
  TREASURY: {
    id: 'treasury',
    name: '寶庫',
    description: '儲存金幣，容量=面積×50',
    tile: 'T',
    color: DK.COLORS.UI_GOLD || '#ffd700',
    buildCostPerTile: 10,  // 每格建造成本
    maintainCostPerSecond: 0.5,  // 每格每秒維護成本
    minSize: 4,  // 最小面積（2×2）
    maxSize: 25,  // 最大面積（5×5）
    baseCapacity: 50,  // 每格金幣容量
    effects: {
      goldStorage: true,
    },
  },

  TRAINING: {
    id: 'training',
    name: '訓練室',
    description: '訓練怪物，每 3 格提供 1 訓練位',
    tile: 'N',
    color: '#cc5522',
    buildCostPerTile: 15,
    maintainCostPerSecond: 0.8,
    minSize: 6,
    maxSize: 20,
    slotsPerArea: 3,
    effects: {
      trainMonsters: true,
      upgradeSpeed: 1.0,
    },
  },

  LIBRARY: {
    id: 'library',
    name: '圖書館',
    description: '研究魔法，每 4 格提供 1 研究位',
    tile: 'L',
    color: '#6666cc',
    buildCostPerTile: 20,
    maintainCostPerSecond: 1.0,
    minSize: 8,
    maxSize: 24,
    slotsPerArea: 4,
    effects: {
      researchSpells: true,
      researchSpeed: 1.5,
    },
  },

  HATCHERY: {
    id: 'hatchery',
    name: '孵化場',
    description: '生產怪物，每 5 格提供 1 孵化槽',
    tile: 'Y',
    color: '#44aa44',
    buildCostPerTile: 18,
    maintainCostPerSecond: 1.2,
    minSize: 10,
    maxSize: 25,
    slotsPerArea: 5,
    effects: {
      spawnMonsters: true,
      spawnRate: 10,
    },
  },

  PRISON: {
    id: 'prison',
    name: '牢房',
    description: '關押敵人，每 2 格提供 1 囚禁位',
    tile: 'J',
    color: '#4a4a5a',
    buildCostPerTile: 12,
    maintainCostPerSecond: 0.6,
    minSize: 4,
    maxSize: 16,
    slotsPerArea: 2,
    effects: {
      imprisonEnemies: true,
      tortureRate: 1.0,
    },
  },

  GRAVEYARD: {
    id: 'graveyard',
    name: '墓地',
    description: '復活亡靈，每 3 格提供 1 墓碑位',
    tile: 'V',
    color: '#2a4a2a',
    buildCostPerTile: 16,
    maintainCostPerSecond: 0.7,
    minSize: 6,
    maxSize: 20,
    slotsPerArea: 3,
    effects: {
      reviveDead: true,
      reviveChance: 0.3,
    },
  },
};
```

---

### 3.2 房間實例結構（DK.Rooms.placed）

```javascript
// 每個放置的房間實例
{
  id: 'room_1234567890',  // 唯一 ID
  type: DK.ROOM_TYPES.TREASURY,  // 房間類型參考
  tiles: [  // 組成房間的所有格子
    { col: 5, row: 10 },
    { col: 6, row: 10 },
    { col: 5, row: 11 },
    { col: 6, row: 11 },
  ],
  area: 4,  // 總面積（tiles.length）
  capacity: 200,  // 當前容量（根據類型計算）
  maintainCost: 2,  // 每秒維護成本（area × maintainCostPerSecond）
  built: true,  // 是否建造完成（可擴充為建造進度）
  active: true,  // 是否啟用（維護費不足時停用）
}
```

---

### 3.3 DK.Map 擴充（地圖系統新增查詢函式）

```javascript
// 在 js/map.js 中新增

/** 回傳 tile 是否為房間類型 */
isRoom(col, row) {
  const tile = this.getTile(col, row);
  const roomTiles = Object.values(DK.ROOM_TYPES).map(r => r.tile);
  return roomTiles.includes(tile);
},

/** 取得指定格的房間類型 */
getRoomType(col, row) {
  const tile = this.getTile(col, row);
  for (const roomType of Object.values(DK.ROOM_TYPES)) {
    if (roomType.tile === tile) return roomType;
  }
  return null;
},
```

---

## 四、放置邏輯設計

### 4.1 框選建造流程

```javascript
// DK.Rooms.startPlacement(roomTypeId)
// 1. 玩家點擊 UI 按鈕選擇房間類型
// 2. 進入框選模式（類似 RTS 框選單位）

// DK.Rooms.updatePlacement(startCol, startRow, endCol, endRow)
// 3. 玩家拖曳滑鼠，實時顯示框選範圍預覽
// 4. 檢查框選區域是否合法（見 4.2）

// DK.Rooms.finalizePlacement()
// 5. 玩家放開滑鼠，確認建造
// 6. 扣除金幣，修改地圖 layout，建立房間實例
```

---

### 4.2 放置規則驗證

```javascript
/**
 * 檢查框選區域是否可建造房間
 * @returns {valid: boolean, errors: string[]}
 */
isValidRoomArea(startCol, startRow, endCol, endRow, roomType) {
  const errors = [];

  // 計算矩形範圍
  const minC = Math.min(startCol, endCol);
  const maxC = Math.max(startCol, endCol);
  const minR = Math.min(startRow, endRow);
  const maxR = Math.max(startRow, endRow);

  const tiles = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      tiles.push({ col: c, row: r });
    }
  }

  const area = tiles.length;

  // 1. 面積檢查
  if (area < roomType.minSize) {
    errors.push(`房間面積過小（最少 ${roomType.minSize} 格）`);
  }
  if (area > roomType.maxSize) {
    errors.push(`房間面積過大（最多 ${roomType.maxSize} 格）`);
  }

  // 2. 地形檢查（每格必須為可建造地形）
  for (const tile of tiles) {
    const t = DK.Map.getTile(tile.col, tile.row);

    // 只能建在路徑格上（.）
    if (t !== '.') {
      errors.push(`格子 (${tile.col}, ${tile.row}) 地形不可建造（${t}）`);
      break;  // 只報告第一個錯誤避免過多訊息
    }

    // 不可與現有房間重疊
    if (DK.Map.isRoom && DK.Map.isRoom(tile.col, tile.row)) {
      errors.push(`格子 (${tile.col}, ${tile.row}) 已有房間`);
      break;
    }

    // 不可與陷阱重疊
    if (DK.Traps.getTrapAt && DK.Traps.getTrapAt(tile.col, tile.row)) {
      errors.push(`格子 (${tile.col}, ${tile.row}) 已有陷阱`);
      break;
    }

    // 不可與路障重疊
    if (DK.Map.hasBarricade && DK.Map.hasBarricade(tile.col, tile.row)) {
      errors.push(`格子 (${tile.col}, ${tile.row}) 已有路障`);
      break;
    }
  }

  // 3. 金幣檢查
  const totalCost = area * roomType.buildCostPerTile;
  if (DK.Game.gold < totalCost) {
    errors.push(`金幣不足（需要 ${totalCost}，擁有 ${DK.Game.gold}）`);
  }

  return {
    valid: errors.length === 0,
    errors,
    tiles,
    area,
    totalCost,
  };
}
```

---

### 4.3 建造執行

```javascript
/**
 * 建造房間（修改地圖 layout 並建立實例）
 */
buildRoom(roomTypeId, tiles) {
  const roomType = DK.ROOM_TYPES[roomTypeId.toUpperCase()];
  if (!roomType) return false;

  const area = tiles.length;
  const totalCost = area * roomType.buildCostPerTile;

  // 扣除金幣
  DK.Game.gold -= totalCost;

  // 修改地圖 layout（不可變更新）
  const newLayout = DK.Map.layout.map(row => row.split(''));
  for (const tile of tiles) {
    newLayout[tile.row][tile.col] = roomType.tile;
  }
  DK.Map.layout = newLayout.map(row => row.join(''));

  // 計算容量/槽位
  let capacity = 0;
  if (roomType.baseCapacity) {
    capacity = area * roomType.baseCapacity;
  } else if (roomType.slotsPerArea) {
    capacity = Math.floor(area / roomType.slotsPerArea);
  }

  // 建立房間實例
  const room = {
    id: `room_${Date.now()}_${Math.random()}`,
    type: roomType,
    tiles: [...tiles],  // 不可變複製
    area,
    capacity,
    maintainCost: area * roomType.maintainCostPerSecond,
    built: true,
    active: true,
  };

  this.placed = [...this.placed, room];

  // 重新計算地圖快取
  DK.Map.prerenderTiles();
  if (DK.Map.recomputeFields) DK.Map.recomputeFields();

  return true;
}
```

---

## 五、渲染設計

### 5.1 房間地磚渲染（js/pixelart.js 擴充）

```javascript
// 在 DK.PixelArt.renderTile() 中新增 case

case 'T':  // Treasury (寶庫)
  // 金色磚塊紋理
  ctx.fillStyle = DK.COLORS.UI_GOLD;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ccaa00';
  ctx.fillRect(0, 0, size, 1);  // 上邊
  ctx.fillRect(0, 0, 1, size);  // 左邊
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(size - 1, 0, 1, size);  // 右邊亮光
  // 金幣符號
  ctx.fillStyle = '#ffee88';
  ctx.fillRect(size / 2 - 2, size / 2 - 2, 4, 4);
  break;

case 'N':  // Training Room (訓練室)
  // 紅棕色木地板紋理
  ctx.fillStyle = '#cc5522';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#aa4411';
  ctx.fillRect(0, size / 2, size, 1);  // 橫木紋
  ctx.fillStyle = '#dd6633';
  ctx.fillRect(size / 2, 0, 1, size);  // 豎木紋
  break;

case 'L':  // Library (圖書館)
  // 深藍色書架紋理
  ctx.fillStyle = '#4444aa';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#333388';
  ctx.fillRect(2, 2, size - 4, size - 4);  // 書架內框
  ctx.fillStyle = '#5555cc';
  ctx.fillRect(3, 3, 2, size - 6);  // 書脊 1
  ctx.fillRect(6, 3, 2, size - 6);  // 書脊 2
  ctx.fillRect(9, 3, 2, size - 6);  // 書脊 3
  break;

case 'Y':  // Hatchery (孵化場)
  // 綠色草地 + 蛋紋理
  ctx.fillStyle = '#44aa44';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#338833';
  ctx.fillRect(0, 0, size / 2, size / 2);  // 草地陰影
  ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
  // 蛋
  ctx.fillStyle = '#eeeedd';
  ctx.fillRect(size / 2 - 2, size / 2 - 3, 4, 5);
  ctx.fillStyle = '#ddddcc';
  ctx.fillRect(size / 2 - 2, size / 2, 4, 1);  // 蛋殼紋路
  break;

case 'J':  // Prison (牢房)
  // 深灰色石地板 + 鐵欄杆
  ctx.fillStyle = '#3a3a4a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(0, 0, size, 1);
  ctx.fillRect(0, 0, 1, size);
  // 鐵欄杆
  ctx.fillStyle = '#7a7a8e';
  for (let i = 2; i < size; i += 3) {
    ctx.fillRect(i, 0, 1, size);
  }
  break;

case 'V':  // Graveyard (墓地)
  // 深綠灰色泥土 + 墓碑
  ctx.fillStyle = '#2a4a2a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, 0, size / 2, size / 2);
  ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
  // 墓碑
  ctx.fillStyle = '#5a5a6e';
  ctx.fillRect(size / 2 - 2, size / 2 - 3, 4, 6);
  ctx.fillStyle = '#4a4a5e';
  ctx.fillRect(size / 2 - 2, size / 2, 4, 1);  // 墓碑刻痕
  break;
```

---

### 5.2 房間邊界裝飾（可選）

**方案 A**：不額外渲染，房間磚塊自然貼合周圍牆壁
**方案 B**：在房間邊緣繪製裝飾性邊框（類似 DK 的房間邊界高光）

```javascript
// 在 main.js 渲染循環中，房間繪製後執行
for (const room of DK.Rooms.placed) {
  // 找出房間邊緣格子
  const edgeTiles = room.tiles.filter(tile => {
    const neighbors = [
      { col: tile.col - 1, row: tile.row },
      { col: tile.col + 1, row: tile.row },
      { col: tile.col, row: tile.row - 1 },
      { col: tile.col, row: tile.row + 1 },
    ];
    return neighbors.some(n => {
      const nt = DK.Map.getTile(n.col, n.row);
      return nt !== room.type.tile;  // 鄰居不是同類房間
    });
  });

  // 繪製邊緣高光
  for (const tile of edgeTiles) {
    const x = (tile.col - camCol) * T;
    const y = (tile.row - camRow) * T;
    uictx.strokeStyle = room.type.color;
    uictx.lineWidth = 2;
    uictx.strokeRect(x, y, T, T);
  }
}
```

---

### 5.3 房間資訊顯示（滑鼠懸停 Tooltip）

```javascript
// 在 main.js 的滑鼠移動事件中
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;

  const camCol = Math.floor(DK.Game.camera.x / T);
  const camRow = Math.floor(DK.Game.camera.y / T);
  const hoverCol = camCol + Math.floor(mx / T);
  const hoverRow = camRow + Math.floor(my / T);

  // 檢查是否懸停在房間上
  const room = DK.Rooms.getRoomAt(hoverCol, hoverRow);
  if (room) {
    DK.UI.roomTooltip = {
      room,
      x: mx,
      y: my,
    };
  } else {
    DK.UI.roomTooltip = null;
  }
});

// 在 ui.js 中渲染 Tooltip
if (DK.UI.roomTooltip) {
  const { room, x, y } = DK.UI.roomTooltip;
  const text = `${room.type.name} (${room.area} 格) - 容量: ${room.capacity}`;

  uictx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  uictx.fillRect(x + 10, y - 30, 200, 25);
  uictx.fillStyle = room.type.color;
  uictx.font = '12px monospace';
  uictx.fillText(text, x + 15, y - 12);
}
```

---

## 六、遊戲循環整合

### 6.1 DK.Rooms 模組結構（js/rooms.js）

```javascript
/**
 * Dungeon Keep - Room System
 * 房間建造、維護、效果管理
 */
window.DK = window.DK || {};

DK.Rooms = {
  placed: [],  // 已建造的房間實例

  // 框選模式狀態
  placementMode: null,  // { roomTypeId, startCol, startRow }
  previewTiles: [],
  previewValid: false,
  previewErrors: [],

  init() {
    this.placed = [];
    this.placementMode = null;
    this.previewTiles = [];
    this.previewValid = false;
    this.previewErrors = [];
  },

  update(dt) {
    // 每秒扣除維護費
    const totalMaintainCost = this.placed.reduce((sum, r) => sum + r.maintainCost, 0);
    if (totalMaintainCost > 0) {
      DK.Game.gold -= (totalMaintainCost * dt) / 1000;

      // 金幣不足時停用房間效果
      if (DK.Game.gold < 0) {
        DK.Game.gold = 0;
        this.placed.forEach(r => r.active = false);
      }
    }
  },

  // === 放置相關函式（見 4.1 ~ 4.3）===
  startPlacement(roomTypeId) { /* ... */ },
  updatePlacement(endCol, endRow) { /* ... */ },
  finalizePlacement() { /* ... */ },
  cancelPlacement() { /* ... */ },
  isValidRoomArea(startCol, startRow, endCol, endRow, roomType) { /* ... */ },
  buildRoom(roomTypeId, tiles) { /* ... */ },

  // === 查詢函式 ===
  getRoomAt(col, row) {
    return this.placed.find(r => r.tiles.some(t => t.col === col && t.row === row)) || null;
  },

  getTotalGoldStorage() {
    return this.placed
      .filter(r => r.type.id === 'treasury' && r.active)
      .reduce((sum, r) => sum + r.capacity, DK.CONFIG.STARTING_GOLD_LIMIT || 500);
  },

  getTotalTrainingSlots() {
    return this.placed
      .filter(r => r.type.id === 'training' && r.active)
      .reduce((sum, r) => sum + r.capacity, 0);
  },

  // ... 其他容量查詢函式
};
```

---

### 6.2 main.js 整合

```javascript
// 在 main.js 的 init() 函式中
if (DK.Rooms) DK.Rooms.init();

// 在 main.js 的 update() 函式中
if (DK.Rooms) DK.Rooms.update(dt);

// 在 main.js 的渲染循環中（房間地磚已由 Map 系統自動渲染）
// 只需額外繪製房間邊界/Tooltip（見 5.2 ~ 5.3）
```

---

### 6.3 UI 工具欄整合

```javascript
// 在 ui.js 中新增房間建造按鈕
const roomButtons = [
  { id: 'treasury', name: '寶庫', cost: 40 },  // 以 4 格計算（4×10）
  { id: 'training', name: '訓練室', cost: 90 },
  { id: 'library', name: '圖書館', cost: 160 },
  { id: 'hatchery', name: '孵化場', cost: 180 },
  { id: 'prison', name: '牢房', cost: 48 },
  { id: 'graveyard', name: '墓地', cost: 96 },
];

// 繪製房間按鈕（類似陷阱按鈕）
let buttonX = 20;
for (const btn of roomButtons) {
  const isSelected = DK.Rooms.placementMode?.roomTypeId === btn.id;

  uictx.fillStyle = isSelected ? DK.COLORS.UI_SELECTED : DK.COLORS.UI_PANEL;
  uictx.fillRect(buttonX, UI_TOP + 10, 80, 30);
  uictx.strokeStyle = DK.COLORS.UI_BORDER;
  uictx.strokeRect(buttonX, UI_TOP + 10, 80, 30);

  uictx.fillStyle = DK.COLORS.UI_TEXT;
  uictx.font = '10px monospace';
  uictx.fillText(btn.name, buttonX + 5, UI_TOP + 25);
  uictx.fillStyle = DK.COLORS.UI_GOLD;
  uictx.fillText(`${btn.cost}g`, buttonX + 5, UI_TOP + 38);

  buttonX += 90;
}

// 點擊事件處理
canvas.addEventListener('click', (e) => {
  // ... 計算點擊座標

  // 檢查是否點擊房間按鈕
  if (my >= UI_TOP && my <= UI_TOP + 40) {
    let btnX = 20;
    for (const btn of roomButtons) {
      if (mx >= btnX && mx <= btnX + 80) {
        if (DK.Rooms.placementMode?.roomTypeId === btn.id) {
          DK.Rooms.cancelPlacement();  // 取消選擇
        } else {
          DK.Rooms.startPlacement(btn.id);  // 開始框選
        }
        return;
      }
      btnX += 90;
    }
  }
});
```

---

## 七、未來擴充方向

### 7.1 房間升級系統
- **升級等級**：房間可升級至 Lv.2/Lv.3，提升效果（容量×1.5、速度×2）
- **升級成本**：消耗金幣 + 研究點數
- **視覺變化**：升級後地磚顏色變化（金邊、特效）

### 7.2 房間連鎖效果
- **相鄰加成**：相同類型房間相鄰時，效果提升 10%
- **組合效果**：圖書館+訓練室相鄰，研究速度+20%

### 7.3 房間破壞與修復
- **敵人攻擊**：部分敵人（破壞者）可攻擊房間，損壞地磚
- **修復系統**：消耗金幣修復損壞的房間

### 7.4 動態房間效果
- **寶庫**：自動產生金幣（每 10 秒 +5 金）
- **訓練室**：英雄自動升級（每 20 秒 +1 等級）
- **孵化場**：定期生產防守怪物（每 30 秒 +1 守衛）

---

## 八、實作優先級建議

### 第 1 階段（核心功能）
1. ✅ 建立 `js/room-types.js`（房間定義）
2. ✅ 建立 `js/rooms.js`（房間管理模組）
3. ✅ 擴充 `js/pixelart.js`（新增 6 種房間地磚渲染）
4. ✅ 擴充 `js/ui.js`（新增房間建造按鈕）
5. ✅ 實作框選建造邏輯（startPlacement → updatePlacement → finalizePlacement）

### 第 2 階段（視覺優化）
6. ✅ 實作房間邊界裝飾渲染
7. ✅ 實作滑鼠懸停 Tooltip
8. ✅ 實作框選預覽（半透明覆蓋層 + 錯誤提示）

### 第 3 階段（遊戲性整合）
9. ⏳ 整合金幣上限系統（寶庫容量生效）
10. ⏳ 整合維護費系統（每秒扣除金幣）
11. ⏳ 實作房間效果（訓練/研究/孵化等）

### 第 4 階段（進階功能）
12. ⏳ 房間升級系統
13. ⏳ 房間連鎖效果
14. ⏳ 房間破壞與修復

---

## 九、風險評估與注意事項

### 9.1 技術風險

| 風險 | 嚴重度 | 應對策略 |
|------|--------|----------|
| 地磚符號衝突 | 🔴 高 | 已調整符號避免衝突（見 2.2） |
| 地圖 layout 不可變性 | 🟡 中 | 使用 `map(row => row.split(''))` 重建陣列 |
| 框選邏輯複雜度 | 🟡 中 | 參考現有 editor 框選工具邏輯 |
| 渲染效能 | 🟢 低 | 房間地磚已快取，邊界裝飾可選 |

### 9.2 設計注意事項

1. **不破壞現有玩法**：房間系統為可選功能，不影響現有陷阱流
2. **金幣平衡**：維護費需仔細調整，避免玩家破產
3. **面積限制**：maxSize 防止玩家刷超大房間破壞平衡
4. **視覺一致性**：房間顏色需與現有暗黑風格匹配

---

## 十、設計總結

### 10.1 核心優勢
✅ **經典玩法復刻**：完整還原 Dungeon Keeper 房間系統
✅ **高擴充性**：房間類型、效果、升級系統皆可擴充
✅ **系統整合度高**：與現有地圖/陷阱/英雄系統無縫整合
✅ **視覺清晰**：6 種房間地磚紋理獨特且易辨識

### 10.2 玩法深度
- **策略規劃**：玩家需權衡建造成本 vs 維護費 vs 效果收益
- **空間管理**：有限的地圖空間需分配給陷阱/房間/走道
- **資源平衡**：金幣不足時房間停用，玩家需控管經濟

### 10.3 後續迭代方向
- **動態效果實作**（寶庫產金、訓練室升級）
- **視覺增強**（房間動畫、粒子特效）
- **平衡調整**（根據測試數據調整成本/效果）

---

**文件版本**：v1.0
**最後更新**：2026-02-10
**狀態**：✅ 設計完成，待實作驗證

---

## 附錄：快速參考表

### A. 房間類型速查

| 符號 | 名稱 | 最小面積 | 建造成本/格 | 維護/秒/格 | 核心效果 |
|------|------|----------|-------------|-----------|----------|
| T | 寶庫 | 4 | 10g | 0.5g | 金幣容量+50/格 |
| N | 訓練室 | 6 | 15g | 0.8g | 訓練位+1/3格 |
| L | 圖書館 | 8 | 20g | 1.0g | 研究位+1/4格 |
| Y | 孵化場 | 10 | 18g | 1.2g | 孵化槽+1/5格 |
| J | 牢房 | 4 | 12g | 0.6g | 囚禁位+1/2格 |
| V | 墓地 | 6 | 16g | 0.7g | 墓碑位+1/3格 |

### B. 地磚符號完整列表（含房間）

```
O = 外圍 (Outer)
W = 牆壁 (Wall)
B = 可破壞牆 (Breakable)
. = 路徑 (Path)
H = 地心 (Heart)
A = 深淵 (Abyss)
P = 水潭 (Pool)
G = 草叢 (Grass)
R = 軌道 (Rail) ⚠️ 已保留
T = 寶庫 (Treasury) ✅
N = 訓練室 (traiNing) ✅
L = 圖書館 (Library) ✅
Y = 孵化場 (Hatchery) ✅
J = 牢房 (Prison) ✅
V = 墓地 (Graveyard) ✅
```

---

**設計完成！準備向 team-lead 報告。** 🏰✨
