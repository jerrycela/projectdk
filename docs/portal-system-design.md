# 傳送門系統設計文件

## 概述

傳送門系統用於取代現有的破牆（breachHoles）生成機制，提供更靈活且可配置的敵人生成點系統。每個傳送門具有獨立的波次配置，支援多入口點的塔防地圖設計。

---

## 1. 數據結構設計

### 1.1 地圖標記

在 `layout` 中使用字元標記：

| 字元 | 說明 |
|------|------|
| `T` | 傳送門 (Teleporter/portal) 入口點 |

**範例地圖**：
```javascript
layout: [
  'OOOOOOOOOOOOOOOOOOOO',
  'OWWWWWWWTWWWWWWWWWWO',  // row 1 有一個傳送門
  'OW........WW......WO',
  'OW........WW......WO',
  'OW........WW......WO',
  'OW........WW......WO',
  'OW........HH......WO',
  'OWWWWWWWWWWWWWWWWWWO',
  'OOOOOOOOOOOOOOOOOOOO',
],
```

### 1.2 傳送門配置陣列

在關卡定義中新增 `portals` 陣列：

```javascript
portals: [
  {
    id: 'north_gate',         // 傳送門 ID（唯一識別符）
    col: 8,                   // 地圖格子座標 X
    row: 1,                   // 地圖格子座標 Y
    type: 'entrance',         // 'entrance'（入口，生成敵人）或 'exit'（出口，僅視覺）
    waves: [                  // 此傳送門的獨立波次配置
      { enemies: [{ type: 'GOBLIN', count: 5 }] },
      { enemies: [{ type: 'SKELETON', count: 3 }] },
    ],
  },
  {
    id: 'south_gate',
    col: 8,
    row: 10,
    type: 'entrance',
    waves: [
      { enemies: [{ type: 'ORC', count: 2 }] },
      { enemies: [{ type: 'GOBLIN', count: 8 }] },
    ],
  },
],
```

**欄位說明**：

| 欄位 | 類型 | 必要 | 說明 |
|------|------|------|------|
| `id` | string | 是 | 唯一識別符，用於調試和編輯器顯示 |
| `col` | number | 是 | 格子 X 座標（對應 layout 中的 'T' 位置） |
| `row` | number | 是 | 格子 Y 座標 |
| `type` | 'entrance' \| 'exit' | 是 | 入口（生成敵人）或出口（僅視覺裝飾） |
| `waves` | Wave[] | type='entrance' 時必要 | 獨立波次配置（與 DK.WAVES 格式相同） |

**Wave 格式**（與現有格式相同）：
```typescript
interface Wave {
  enemies: Array<{ type: EnemyType, count: number }>
}

type EnemyType = 'GOBLIN' | 'SKELETON' | 'ORC' | 'SLIME'
```

### 1.3 完整關卡範例

```javascript
{
  id: 1,
  name: '雙重包夾',
  description: '北方與南方同時來襲，考驗雙線防守',

  layout: [
    'OOOOOOOOOOOOOOOOOOOO',
    'OWWWWWWWTWWWWWWWWWWO',  // 北方傳送門 (8,1)
    'OW........WW......WO',
    'OW........WW......WO',
    'OW........HH......WO',  // 地心 (8,4)
    'OW........WW......WO',
    'OW........WW......WO',
    'OWWWWWWWTWWWWWWWWWWO',  // 南方傳送門 (8,7)
    'OOOOOOOOOOOOOOOOOOOO',
  ],

  portals: [
    {
      id: 'north_portal',
      col: 8,
      row: 1,
      type: 'entrance',
      waves: [
        { enemies: [{ type: 'GOBLIN', count: 5 }] },
        { enemies: [{ type: 'SKELETON', count: 4 }] },
        { enemies: [{ type: 'ORC', count: 2 }, { type: 'GOBLIN', count: 3 }] },
      ],
    },
    {
      id: 'south_portal',
      col: 8,
      row: 7,
      type: 'entrance',
      waves: [
        { enemies: [{ type: 'GOBLIN', count: 6 }] },
        { enemies: [{ type: 'GOBLIN', count: 8 }] },
        { enemies: [{ type: 'SKELETON', count: 5 }, { type: 'ORC', count: 1 }] },
      ],
    },
  ],

  startingGold: 1000,
  dungeonHeartHP: 60,
  tutorial: null,
}
```

---

## 2. 遊戲邏輯更新

### 2.1 初始化流程（Map.init）

**現有流程**：
```javascript
DK.Map.init() {
  this.breachHoles = [];  // 舊系統
  // ...
}
```

**新流程**：
```javascript
DK.Map.init() {
  this.portals = [];  // 新：傳送門列表

  // 從關卡載入傳送門配置
  if (DK.LevelManager?.currentLevel?.portals) {
    this.portals = JSON.parse(JSON.stringify(
      DK.LevelManager.currentLevel.portals
    ));
  }

  // 向後相容：如果沒有 portals 但有 'T' 標記，自動建立傳送門
  if (this.portals.length === 0) {
    this.detectPortalsFromLayout();
  }

  // 計算距離場（從地心到所有傳送門的路徑）
  this.computeDistanceField();
}
```

**自動偵測函式**（向後相容）：
```javascript
DK.Map.detectPortalsFromLayout() {
  for (let row = 0; row < this.layout.length; row++) {
    for (let col = 0; col < this.layout[row].length; col++) {
      if (this.layout[row][col] === 'T') {
        this.portals.push({
          id: `auto_portal_${this.portals.length}`,
          col,
          row,
          type: 'entrance',
          waves: null,  // 使用全域 DK.WAVES
        });
      }
    }
  }
}
```

### 2.2 波次啟動流程（Game.startWave）

**現有流程**：
```javascript
DK.Game.startWave() {
  const wave = DK.WAVES[this.currentWave];  // 使用全域波次
  this.spawnQueue = [];
  for (const group of wave.enemies) {
    for (let i = 0; i < group.count; i++) {
      this.spawnQueue.push(group.type);
    }
  }
  // ...
}
```

**新流程**：
```javascript
DK.Game.startWave() {
  // 為每個入口傳送門建立獨立生成隊列
  this.portalSpawnQueues = [];

  for (const portal of DK.Map.portals) {
    if (portal.type !== 'entrance') continue;

    // 使用傳送門自己的 waves，或 fallback 到全域 DK.WAVES
    const waves = portal.waves || DK.WAVES;
    if (this.currentWave >= waves.length) continue;

    const wave = waves[this.currentWave];
    const queue = [];

    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        queue.push(group.type);
      }
    }

    // 洗牌（輕微隨機）
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }

    this.portalSpawnQueues.push({
      portalId: portal.id,
      col: portal.col,
      row: portal.row,
      queue: queue,
      timer: 0,
    });
  }

  this.waveActive = true;
}
```

### 2.3 敵人生成流程（Game.update）

**現有流程**：
```javascript
if (this.waveActive && this.spawnQueue.length > 0) {
  this.spawnTimer += dt;
  if (this.spawnTimer >= ENEMY_SPAWN_INTERVAL) {
    this.spawnTimer = 0;
    const type = this.spawnQueue.shift();
    const hole = DK.Map.breachHoles[this._spawnHoleIndex];
    DK.Enemies.spawnAt(type, hole.col, hole.row);
    this._spawnHoleIndex = (this._spawnHoleIndex + 1) % DK.Map.breachHoles.length;
  }
}
```

**新流程**：
```javascript
if (this.waveActive && this.portalSpawnQueues.length > 0) {
  for (const pq of this.portalSpawnQueues) {
    if (pq.queue.length === 0) continue;

    pq.timer += dt;
    if (pq.timer >= DK.CONFIG.ENEMY_SPAWN_INTERVAL) {
      pq.timer = 0;
      const type = pq.queue.shift();
      DK.Enemies.spawnAt(type, pq.col, pq.row);
    }
  }

  // 檢查所有隊列是否都空了
  if (this.portalSpawnQueues.every(pq => pq.queue.length === 0)) {
    this.waveActive = false;
    this.currentWave++;
  }
}
```

### 2.4 向後相容處理

**保留 `breachHoles` 系統**（deprecated）：
```javascript
// 在 Map.init() 中：
if (this.portals.length === 0 && this.breachHoles && this.breachHoles.length > 0) {
  // 自動轉換為傳送門格式
  for (const hole of this.breachHoles) {
    this.portals.push({
      id: `legacy_hole_${hole.col}_${hole.row}`,
      col: hole.col,
      row: hole.row,
      type: 'entrance',
      waves: null,  // 使用全域 DK.WAVES
    });
  }
}
```

---

## 3. 視覺渲染整合

### 3.1 現有視覺資產

- `DK.Map.drawEntranceTile(ctx, x, y)` — 綠色入口傳送門（已存在）
- `DK.Map.drawExitTile(ctx, x, y)` — 紅色出口傳送門（已存在）
- 已預渲染到 `tileCache['entrance']` 和 `tileCache['exit']`

### 3.2 渲染邏輯（Map.render）

**在地圖渲染函式中**：

```javascript
DK.Map.render(ctx) {
  for (let row = 0; row < this.layout.length; row++) {
    for (let col = 0; col < this.layout[row].length; col++) {
      const tile = this.layout[row][col];
      const x = col * T;
      const y = row * T;

      // 現有地磚渲染...
      if (tile === 'W') { /* ... */ }
      else if (tile === '.') { /* ... */ }
      // ...

      // 新增：'T' 標記自動渲染對應傳送門
      else if (tile === 'T') {
        const portal = this.portals.find(p => p.col === col && p.row === row);
        if (portal) {
          const cacheKey = portal.type === 'entrance' ? 'entrance' : 'exit';
          ctx.drawImage(this.tileCache[cacheKey], x, y);
        } else {
          // fallback：沒有配置就顯示入口
          ctx.drawImage(this.tileCache['entrance'], x, y);
        }
      }
    }
  }
}
```

### 3.3 動態視覺效果（可選）

**傳送門閃爍動畫**（在 main.js 中）：

```javascript
// 在 gameLoop() 渲染層加入
function renderPortalGlow(ctx, time) {
  for (const portal of DK.Map.portals) {
    const T = DK.CONFIG.TILE_SIZE;
    const x = portal.col * T;
    const y = portal.row * T;

    // 呼吸光暈（週期 2 秒）
    const pulse = 0.5 + Math.sin(time * 0.003) * 0.2;
    const color = portal.type === 'entrance'
      ? `rgba(68,170,68,${pulse})`
      : `rgba(204,68,68,${pulse})`;

    ctx.fillStyle = color;
    ctx.fillRect(x + 6, y + 6, 4, 4);
  }
}
```

---

## 4. 編輯器功能設計

### 4.1 傳送門放置工具

**工具列新增按鈕**：

| 按鈕 | 功能 | 圖示 |
|------|------|------|
| 入口傳送門 | 放置 'T' 並建立入口傳送門配置 | 綠色方塊 |
| 出口傳送門 | 放置 'T' 並建立出口傳送門配置 | 紅色方塊 |

**點擊行為**：
1. 在地圖上點擊 → 將該格設為 'T'
2. 自動在 `portals` 陣列中新增條目：
   ```javascript
   {
     id: `portal_${Date.now()}`,  // 自動生成 ID
     col: clickedCol,
     row: clickedRow,
     type: '入口' or '出口',
     waves: type === 'entrance' ? [] : undefined,
   }
   ```

### 4.2 傳送門配置面板

**右側面板顯示**：

```
┌─────────────────────────────────┐
│ 傳送門列表                       │
├─────────────────────────────────┤
│ • north_portal (8, 1) [入口]    │  ← 點擊展開
│   - 第 1 波: 5 劍士              │
│   - 第 2 波: 4 弓手              │
│   [編輯波次]                     │
│                                  │
│ • south_portal (8, 7) [入口]    │
│   - 第 1 波: 6 劍士              │
│   [編輯波次]                     │
│                                  │
│ [新增傳送門]                     │
└─────────────────────────────────┘
```

**編輯波次彈窗**：

```
┌─────────────────────────────────┐
│ 編輯 north_portal 的波次         │
├─────────────────────────────────┤
│ 第 1 波:                         │
│   劍士 [5] ▲▼  弓手 [0] ▲▼      │
│   騎士 [0] ▲▼  盜賊 [0] ▲▼      │
│                                  │
│ 第 2 波:                         │
│   劍士 [0] ▲▼  弓手 [4] ▲▼      │
│   騎士 [0] ▲▼  盜賊 [0] ▲▼      │
│                                  │
│ [新增波次] [刪除波次]            │
│                                  │
│ [確定] [取消]                    │
└─────────────────────────────────┘
```

**實作細節**：

```javascript
// 編輯器狀態
editorState = {
  selectedPortalId: null,  // 當前選中的傳送門
  editingWaves: false,     // 是否正在編輯波次
  waveEditor: {            // 波次編輯器狀態
    portalId: null,
    waves: [],
  },
};

// 點擊傳送門列表項目 → 高亮對應格子
function selectPortal(portalId) {
  editorState.selectedPortalId = portalId;
  const portal = level.portals.find(p => p.id === portalId);
  highlightCell(portal.col, portal.row);
}

// 開啟波次編輯器
function editPortalWaves(portalId) {
  const portal = level.portals.find(p => p.id === portalId);
  editorState.editingWaves = true;
  editorState.waveEditor = {
    portalId: portalId,
    waves: JSON.parse(JSON.stringify(portal.waves || [])),
  };
  showWaveEditorModal();
}

// 儲存波次配置
function saveWaveConfig() {
  const portal = level.portals.find(p => p.id === editorState.waveEditor.portalId);
  portal.waves = editorState.waveEditor.waves;
  closeWaveEditorModal();
}
```

### 4.3 自動驗證

**編輯器載入時檢查**：

```javascript
function validateLevel(level) {
  const errors = [];

  // 檢查 layout 中的 'T' 是否都有對應 portal 配置
  for (let row = 0; row < level.layout.length; row++) {
    for (let col = 0; col < level.layout[row].length; col++) {
      if (level.layout[row][col] === 'T') {
        const hasPortal = level.portals.some(p => p.col === col && p.row === row);
        if (!hasPortal) {
          errors.push(`座標 (${col}, ${row}) 的 'T' 缺少傳送門配置`);
        }
      }
    }
  }

  // 檢查入口傳送門是否有波次配置
  for (const portal of level.portals) {
    if (portal.type === 'entrance' && (!portal.waves || portal.waves.length === 0)) {
      errors.push(`傳送門 ${portal.id} 缺少波次配置`);
    }
  }

  return errors;
}
```

---

## 5. 存儲格式（JSON）

### 5.1 匯出格式

```json
{
  "id": 1,
  "name": "雙重包夾",
  "description": "北方與南方同時來襲",
  "layout": [
    "OOOOOOOOOOOOOOOOOOOO",
    "OWWWWWWWTWWWWWWWWWWO",
    "OW........WW......WO",
    "OW........HH......WO",
    "OW........WW......WO",
    "OWWWWWWWTWWWWWWWWWWO",
    "OOOOOOOOOOOOOOOOOOOO"
  ],
  "portals": [
    {
      "id": "north_portal",
      "col": 8,
      "row": 1,
      "type": "entrance",
      "waves": [
        { "enemies": [{ "type": "GOBLIN", "count": 5 }] },
        { "enemies": [{ "type": "SKELETON", "count": 4 }] }
      ]
    },
    {
      "id": "south_portal",
      "col": 8,
      "row": 6,
      "type": "entrance",
      "waves": [
        { "enemies": [{ "type": "GOBLIN", "count": 6 }] }
      ]
    }
  ],
  "startingGold": 1000,
  "dungeonHeartHP": 60
}
```

### 5.2 載入邏輯

```javascript
function loadLevelFromJSON(json) {
  const level = JSON.parse(json);

  // 驗證必要欄位
  if (!level.layout) throw new Error('缺少 layout');
  if (!level.portals) level.portals = [];

  // 載入到遊戲
  DK.LevelManager.currentLevel = level;
  DK.Map.init();
  DK.Game.init();
}
```

---

## 6. 遷移計畫

### 6.1 向後相容策略

**階段 1**（不破壞現有功能）：
- 保留 `breachHoles` 系統
- 新增 `portals` 系統
- `Map.init()` 自動轉換：`breachHoles` → `portals`
- 現有關卡繼續使用 `DK.WAVES`

**階段 2**（逐步替換）：
- 新關卡使用 `portals` + 獨立 `waves`
- 編輯器預設使用新系統
- 舊關卡標記為 `deprecated`

**階段 3**（完全移除）：
- 刪除 `breachHoles` 相關程式碼
- 所有關卡強制使用 `portals`

### 6.2 測試清單

- [ ] 單傳送門關卡（與舊系統行為一致）
- [ ] 雙傳送門關卡（同時生成敵人）
- [ ] 每個傳送門獨立波次配置
- [ ] 出口傳送門僅視覺渲染，不生成敵人
- [ ] 編輯器新增/刪除傳送門
- [ ] 編輯器編輯波次配置
- [ ] JSON 匯出/匯入
- [ ] 向後相容：舊關卡仍能正常執行

---

## 7. 實作優先順序

### P0（核心功能）
1. ✅ 數據結構設計（portals 陣列格式）
2. ✅ 地圖初始化邏輯（`Map.init` 載入 portals）
3. ✅ 波次啟動邏輯（`Game.startWave` 多隊列生成）
4. ✅ 敵人生成邏輯（`Game.update` 並行生成）
5. ✅ 視覺渲染整合（'T' 標記渲染入口/出口）

### P1（編輯器）
6. ⬜ 傳送門放置工具（畫筆模式）
7. ⬜ 傳送門列表面板（右側 UI）
8. ⬜ 波次編輯器彈窗（編輯獨立波次）
9. ⬜ 自動驗證（layout vs portals 一致性）

### P2（進階功能）
10. ⬜ 傳送門動態效果（呼吸光暈）
11. ⬜ 多傳送門平衡調整工具（顯示各傳送門總敵人數）
12. ⬜ 波次預覽（播放動畫預覽敵人生成流程）

---

## 8. 設計決策與理由

### 為何使用獨立 `waves` 而非共享？

**優點**：
- ✅ 每個入口點可配置不同難度（例如：北門精英、南門雜兵）
- ✅ 支援不對稱地圖設計（左弱右強）
- ✅ 易於調整單一入口點的難度曲線

**缺點**：
- ❌ 配置複雜度增加（需編輯多個 waves 陣列）
- ❌ 儲存體積增大（每個傳送門都有完整 waves）

**解決方案**：
- 編輯器提供「複製波次配置」按鈕
- 支援「全域波次模板」功能（從模板快速套用）

### 為何使用 'T' 標記而非直接用座標？

**理由**：
- 與現有地圖系統一致（W、H、P、G 都是字元標記）
- 視覺化編輯時更直觀（直接看到傳送門位置）
- 支援未來擴展（例如：'I' 表示單向傳送門）

### 為何區分入口/出口？

**理由**：
- 出口可作為視覺提示（「敵人要去的地方」）
- 未來可擴展「逃脫模式」（敵人從出口逃離地城）
- 對稱美學（綠色入口 ↔ 紅色出口）

---

## 9. 未來擴展方向

### 9.1 傳送門進階屬性

```javascript
{
  id: 'elite_portal',
  col: 8,
  row: 1,
  type: 'entrance',
  waves: [...],
  // 新增屬性：
  spawnInterval: 300,      // 覆寫全域生成間隔（更快或更慢）
  spawnEffect: 'lightning',// 生成特效（雷電、火焰、冰霜）
  difficulty: 1.5,         // 敵人難度倍率（HP × 1.5）
  allowedEnemies: ['ORC', 'SKELETON'],  // 限制敵人類型
}
```

### 9.2 傳送門聯動機制

```javascript
{
  id: 'boss_portal',
  col: 10,
  row: 5,
  type: 'entrance',
  waves: [...],
  // 觸發條件：
  activateWhen: {
    wave: 5,               // 第 5 波開始啟用
    otherPortalCleared: 'north_portal',  // 北門清完後啟用
  },
}
```

### 9.3 雙向傳送門

```javascript
{
  id: 'portal_pair_A',
  col: 5,
  row: 3,
  type: 'bidirectional',
  linkedTo: 'portal_pair_B',  // 雙向連接
  waves: null,                 // 不生成敵人，僅作為傳送點
}
```

---

## 10. 總結

傳送門系統提供了比破牆機制更靈活且可擴展的敵人生成架構。核心設計理念：

1. **數據驅動**：所有配置存於 JSON，易於編輯與分享
2. **獨立波次**：每個傳送門擁有自己的敵人配置，支援不對稱設計
3. **向後相容**：保留舊系統作為 fallback，逐步遷移
4. **視覺一致**：重用現有的 `drawEntranceTile` / `drawExitTile` 視覺資產
5. **編輯器友善**：直觀的 UI 讓關卡設計師輕鬆配置多入口點地圖

**下一步實作**：從 P0 功能開始，優先完成核心邏輯（數據結構 + 生成系統 + 渲染），再擴展編輯器 UI。
