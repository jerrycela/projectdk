# 配對傳送門系統設計文件

## 概述

配對傳送門系統允許敵人在地圖上進行傳送，從入口傳送門進入後會從配對的出口傳送門出現。此系統取代破牆機制，提供更靈活的地圖設計與敵人路徑控制。

---

## 1. 傳送門配對機制

### 1.1 配對標記系統

使用**字母配對**方式標記傳送門：

| 字元 | 說明 | 範例 |
|------|------|------|
| `A` | A 組傳送門入口 | 敵人進入 A → 從 A' 出現 |
| `a` | A 組傳送門出口 | 與 `A` 配對（小寫 = 出口） |
| `B` | B 組傳送門入口 | 敵人進入 B → 從 B' 出現 |
| `b` | B 組傳送門出口 | 與 `B` 配對 |
| `C`~`Z` | 最多支援 26 組傳送門 | |

**配對規則**：
- **大寫字母** = 入口（Entrance）
- **小寫字母** = 出口（Exit）
- 相同字母（不同大小寫）= 配對關係

**範例地圖**：
```javascript
layout: [
  'OOOOOOOOOOOOOOOOOOOO',
  'OWWWWWWWAWWWWWWWWWWO',  // A 入口 (8,1)
  'OW........WW......WO',
  'OW........WW......WO',
  'OW.......aWW......WO',  // a 出口 (8,4) - 與 A 配對
  'OW........WW......WO',
  'OW........HH......WO',  // 地心 (8,6)
  'OWWWWWWWBWWWWWWWWWWO',  // B 入口 (8,7)
  'OW.b......WW......WO',  // b 出口 (3,8) - 與 B 配對
  'OWWWWWWWWWWWWWWWWWWO',
  'OOOOOOOOOOOOOOOOOOOO',
],
```

**傳送路徑**：
- 敵人從北方進入 `A` → 傳送到中間的 `a` → 繼續前往地心
- 敵人從南方進入 `B` → 傳送到西側的 `b` → 繼續前往地心

### 1.2 特殊配對模式

#### 單向傳送門（預設）
```javascript
'A' → 'a'  // 單向：只能從 A 進入，從 a 出現
```

#### 雙向傳送門（可選）
```javascript
{
  id: 'portal_A',
  char: 'A',
  bidirectional: true,  // 啟用雙向
}
// 敵人可以從 A → a，也可以從 a → A
```

#### 多對一傳送門
```javascript
// 兩個入口，一個出口
'A' → 'a'
'B' → 'a'  // B 也指向 a
```

#### 傳送鏈（連續傳送）
```javascript
'A' → 'a'
'a' 同時也是 'B' 的入口
'B' → 'b'
// 結果：A → a/B → b（連續傳送兩次）
```

---

## 2. 資料結構設計

### 2.1 地圖 layout 格式

**使用字母直接標記**（最簡潔方式）：

```javascript
layout: [
  'OOOOOOOOOOOOOOOOOOOO',
  'OWWWWWWWAWWWWWWWWWWO',
  'OW........WW......WO',
  'OW.......aWW......WO',
  'OW........HH......WO',
  'OWWWWWWWBWWWWWWWWWWO',
  'OW.b......WW......WO',
  'OWWWWWWWWWWWWWWWWWWO',
],
```

### 2.2 關卡配置檔案（portals 陣列）

**完整配置範例**：

```javascript
{
  id: 1,
  name: '傳送門迷宮',
  description: '利用傳送門製造複雜路徑',

  layout: [
    'OOOOOOOOOOOOOOOOOOOO',
    'OWWWWWWWAWWWWWWWWWWO',
    'OW........WW......WO',
    'OW.......aWW......WO',
    'OW........HH......WO',
    'OWWWWWWWBWWWWWWWWWWO',
    'OW.b......WW......WO',
    'OWWWWWWWWWWWWWWWWWWO',
  ],

  portals: [
    {
      id: 'portal_A',
      char: 'A',              // 對應 layout 中的字元
      entrancePos: { col: 8, row: 1 },  // 入口座標
      exitPos: { col: 8, row: 4 },      // 出口座標
      pairedChar: 'a',        // 配對字元（可省略，自動推斷為小寫）
      color: '#44aa44',       // 傳送門顏色（編輯器顯示用）
      visualEffect: 'green',  // 視覺特效類型
      teleportDelay: 300,     // 傳送延遲（毫秒）
      bidirectional: false,   // 是否雙向
    },
    {
      id: 'portal_B',
      char: 'B',
      entrancePos: { col: 8, row: 7 },
      exitPos: { col: 3, row: 8 },
      pairedChar: 'b',
      color: '#4444aa',
      visualEffect: 'blue',
      teleportDelay: 300,
      bidirectional: false,
    },
  ],

  startingGold: 1000,
  dungeonHeartHP: 60,
}
```

**欄位說明**：

| 欄位 | 類型 | 必要 | 預設值 | 說明 |
|------|------|------|--------|------|
| `id` | string | 是 | - | 唯一識別符 |
| `char` | string | 是 | - | 對應 layout 中的字元（大寫 = 入口） |
| `entrancePos` | {col, row} | 是 | - | 入口座標 |
| `exitPos` | {col, row} | 是 | - | 出口座標 |
| `pairedChar` | string | 否 | char.toLowerCase() | 配對字元（自動推斷為小寫） |
| `color` | string | 否 | '#44aa44' | 編輯器顯示顏色 |
| `visualEffect` | string | 否 | 'green' | 視覺特效類型 |
| `teleportDelay` | number | 否 | 300 | 傳送延遲（毫秒） |
| `bidirectional` | boolean | 否 | false | 是否雙向傳送 |

### 2.3 自動推斷配置（簡化版）

**最小配置**（僅使用 layout 字母）：

```javascript
{
  id: 1,
  name: '傳送門迷宮',
  layout: [
    'OWWWWWWWAWWWWWWWWWWO',
    'OW.......aWW......WO',
    'OWWWWWWWBWWWWWWWWWWO',
    'OW.b......WW......WO',
  ],
  // portals 陣列可省略，系統自動偵測 A-a, B-b 配對
}
```

**自動偵測邏輯**（Map.init）：

```javascript
DK.Map.detectPortalPairs() {
  const portals = [];
  const entrances = {};
  const exits = {};

  // 掃描 layout 找出所有傳送門字元
  for (let row = 0; row < this.layout.length; row++) {
    for (let col = 0; col < this.layout[row].length; col++) {
      const char = this.layout[row][col];

      // 大寫字母 = 入口
      if (/[A-Z]/.test(char)) {
        entrances[char] = { col, row };
      }
      // 小寫字母 = 出口
      else if (/[a-z]/.test(char)) {
        exits[char] = { col, row };
      }
    }
  }

  // 配對入口與出口
  for (const [char, entrancePos] of Object.entries(entrances)) {
    const pairedChar = char.toLowerCase();
    const exitPos = exits[pairedChar];

    if (!exitPos) {
      console.warn(`傳送門 ${char} 缺少配對出口 ${pairedChar}`);
      continue;
    }

    portals.push({
      id: `portal_${char}`,
      char: char,
      entrancePos: entrancePos,
      exitPos: exitPos,
      pairedChar: pairedChar,
      color: this.getPortalColor(char),  // 預設配色
      visualEffect: 'default',
      teleportDelay: 300,
      bidirectional: false,
    });
  }

  return portals;
}

// 預設配色（A=綠, B=藍, C=紅, ...）
DK.Map.getPortalColor(char) {
  const colors = {
    'A': '#44aa44',
    'B': '#4444aa',
    'C': '#aa4444',
    'D': '#aaaa44',
    'E': '#aa44aa',
    'F': '#44aaaa',
  };
  return colors[char] || '#888888';
}
```

---

## 3. 敵人傳送邏輯

### 3.1 碰撞檢測（Enemy.update）

```javascript
DK.Enemies.update(dt) {
  for (const enemy of this.active) {
    if (!enemy.alive || enemy.teleporting) continue;

    // 檢查是否踩到傳送門入口
    const currentCol = Math.floor(enemy.x / TILE_SIZE);
    const currentRow = Math.floor(enemy.y / TILE_SIZE);
    const tile = DK.Map.getTile(currentCol, currentRow);

    // 檢查是否為傳送門字元（大寫 = 入口）
    if (/[A-Z]/.test(tile)) {
      const portal = DK.Map.getPortalByChar(tile);
      if (portal && !enemy.teleportCooldown) {
        this.teleportEnemy(enemy, portal);
      }
    }

    // 傳送冷卻遞減（防止重複觸發）
    if (enemy.teleportCooldown > 0) {
      enemy.teleportCooldown -= dt;
    }
  }
}
```

### 3.2 傳送執行邏輯

```javascript
DK.Enemies.teleportEnemy(enemy, portal) {
  // 標記為傳送中（暫停移動）
  enemy.teleporting = true;
  enemy.teleportTimer = 0;
  enemy.teleportDuration = portal.teleportDelay || 300;
  enemy.teleportTarget = portal.exitPos;
  enemy.teleportPortal = portal;

  // 傳送特效（入口消失動畫）
  DK.Game.effects.push({
    type: 'portal_enter',
    x: enemy.x,
    y: enemy.y,
    color: portal.color,
    duration: portal.teleportDelay,
    timer: 0,
  });
}

// 在 update 中處理傳送進度
if (enemy.teleporting) {
  enemy.teleportTimer += dt;

  // 淡出階段（前 50%）
  if (enemy.teleportTimer < enemy.teleportDuration * 0.5) {
    const fadeProgress = enemy.teleportTimer / (enemy.teleportDuration * 0.5);
    enemy.renderAlpha = 1 - fadeProgress;  // 逐漸透明
  }
  // 傳送瞬間（50% 時刻）
  else if (enemy.teleportTimer >= enemy.teleportDuration * 0.5 && !enemy.teleportExecuted) {
    enemy.teleportExecuted = true;

    // 移動到出口座標
    const T = DK.CONFIG.TILE_SIZE;
    enemy.x = enemy.teleportTarget.col * T + T / 2;
    enemy.y = enemy.teleportTarget.row * T + T / 2;

    // 出口特效
    DK.Game.effects.push({
      type: 'portal_exit',
      x: enemy.x,
      y: enemy.y,
      color: enemy.teleportPortal.color,
      duration: enemy.teleportDuration * 0.5,
      timer: 0,
    });
  }
  // 淡入階段（後 50%）
  else {
    const fadeProgress = (enemy.teleportTimer - enemy.teleportDuration * 0.5) / (enemy.teleportDuration * 0.5);
    enemy.renderAlpha = fadeProgress;  // 逐漸顯現
  }

  // 傳送完成
  if (enemy.teleportTimer >= enemy.teleportDuration) {
    enemy.teleporting = false;
    enemy.teleportExecuted = false;
    enemy.renderAlpha = 1;
    enemy.teleportCooldown = 1000;  // 1 秒冷卻（防止重複觸發）

    // 重新計算路徑（從新位置到地心）
    enemy.col = Math.floor(enemy.x / T);
    enemy.row = Math.floor(enemy.y / T);
  }

  continue;  // 跳過正常移動邏輯
}
```

### 3.3 路徑重新計算

傳送後敵人需要重新計算前往地心的路徑：

```javascript
// 傳送完成後
if (enemy.teleportTimer >= enemy.teleportDuration) {
  // ...

  // 更新當前格子座標
  enemy.col = Math.floor(enemy.x / TILE_SIZE);
  enemy.row = Math.floor(enemy.y / TILE_SIZE);

  // 使用 distanceField 重新導航（現有系統自動處理）
  // 敵人會自動朝最近的地心方向移動
}
```

---

## 4. 視覺回饋設計

### 4.1 傳送門地磚渲染

**入口傳送門（大寫字母）**：

```javascript
DK.Map.drawPortalEntranceTile(ctx, x, y, char, color) {
  const PA = DK.PixelArt;

  // 地板底色
  this.drawFloorTile(ctx, x, y, 0);

  // 傳送門框架（使用指定顏色）
  const darkColor = this.darkenColor(color, 0.5);
  const lightColor = this.lightenColor(color, 1.5);

  // 外框（深色）
  PA.rect(ctx, x + 1, y + 4, 4, 8, darkColor);
  // 內核（主色）
  PA.rect(ctx, x + 2, y + 5, 2, 6, color);
  // 高光（亮色）
  PA.pixel(ctx, x + 2, y + 5, lightColor);
  PA.pixel(ctx, x + 3, y + 5, lightColor);
  PA.pixel(ctx, x + 2, y + 10, lightColor);

  // 字母標記（中央顯示 A, B, C...）
  this.drawPortalLabel(ctx, x + 6, y + 7, char, '#ffffff');
}
```

**出口傳送門（小寫字母）**：

```javascript
DK.Map.drawPortalExitTile(ctx, x, y, char, color) {
  const PA = DK.PixelArt;

  // 地板底色
  this.drawFloorTile(ctx, x, y, 0);

  // 與入口相似但鏡像反轉（右側）
  const darkColor = this.darkenColor(color, 0.5);
  const lightColor = this.lightenColor(color, 1.5);

  PA.rect(ctx, x + 11, y + 4, 4, 8, darkColor);
  PA.rect(ctx, x + 12, y + 5, 2, 6, color);
  PA.pixel(ctx, x + 12, y + 5, lightColor);
  PA.pixel(ctx, x + 13, y + 5, lightColor);

  // 小寫字母標記
  this.drawPortalLabel(ctx, x + 6, y + 7, char, '#cccccc');
}
```

**配對線條提示（編輯器模式）**：

```javascript
// 在編輯器中顯示配對關係
DK.Map.renderPortalConnections(ctx) {
  for (const portal of this.portals) {
    const T = DK.CONFIG.TILE_SIZE;
    const x1 = portal.entrancePos.col * T + T / 2;
    const y1 = portal.entrancePos.row * T + T / 2;
    const x2 = portal.exitPos.col * T + T / 2;
    const y2 = portal.exitPos.row * T + T / 2;

    // 虛線連接
    ctx.strokeStyle = portal.color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 箭頭指向出口
    this.drawArrow(ctx, x1, y1, x2, y2, portal.color);
  }
}
```

### 4.2 傳送動畫特效

**進入特效（portal_enter）**：

```javascript
function renderPortalEnterEffect(ctx, effect, progress) {
  const PA = DK.PixelArt;
  const x = Math.round(effect.x);
  const y = Math.round(effect.y);

  // 螺旋收縮（敵人被吸入）
  const radius = 8 * (1 - progress);  // 從 8px 縮小到 0
  const spiralCount = 6;

  for (let i = 0; i < spiralCount; i++) {
    const angle = (i / spiralCount) * Math.PI * 2 + progress * Math.PI * 4;
    const r = radius * (1 - i / spiralCount);
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;

    PA.pixel(ctx, Math.round(px), Math.round(py), effect.color);
  }

  // 中心光點
  if (progress > 0.7) {
    const coreAlpha = (progress - 0.7) / 0.3;
    PA.pixel(ctx, x, y, `rgba(255,255,255,${coreAlpha})`);
  }
}
```

**出現特效（portal_exit）**：

```javascript
function renderPortalExitEffect(ctx, effect, progress) {
  const PA = DK.PixelArt;
  const x = Math.round(effect.x);
  const y = Math.round(effect.y);

  // 螺旋擴散（敵人從傳送門出現）
  const radius = 8 * progress;  // 從 0 擴大到 8px
  const spiralCount = 6;

  for (let i = 0; i < spiralCount; i++) {
    const angle = (i / spiralCount) * Math.PI * 2 - progress * Math.PI * 4;
    const r = radius * (i / spiralCount);
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;

    PA.pixel(ctx, Math.round(px), Math.round(py), effect.color);
  }

  // 閃光爆發
  if (progress < 0.3) {
    const flashRadius = Math.round(12 * (1 - progress / 0.3));
    PA.circle(ctx, x, y, flashRadius, `rgba(255,255,255,${0.3 - progress})`);
  }
}
```

**傳送門呼吸光暈（常駐效果）**：

```javascript
// 在 main.js gameLoop 中持續渲染
function renderPortalGlow(ctx, time) {
  for (const portal of DK.Map.portals) {
    const T = DK.CONFIG.TILE_SIZE;

    // 入口光暈
    const ex = portal.entrancePos.col * T;
    const ey = portal.entrancePos.row * T;
    const entrancePulse = 0.3 + Math.sin(time * 0.003) * 0.15;
    ctx.fillStyle = portal.color.replace(')', `,${entrancePulse})`).replace('rgb', 'rgba');
    ctx.fillRect(ex + 6, ey + 6, 4, 4);

    // 出口光暈（相位差 180°）
    const xx = portal.exitPos.col * T;
    const xy = portal.exitPos.row * T;
    const exitPulse = 0.3 - Math.sin(time * 0.003) * 0.15;
    ctx.fillStyle = portal.color.replace(')', `,${exitPulse})`).replace('rgb', 'rgba');
    ctx.fillRect(xx + 6, xy + 6, 4, 4);
  }
}
```

### 4.3 編輯器視覺提示

**選中傳送門時的高亮**：

```javascript
// 點擊傳送門 → 高亮配對的兩個格子
function highlightPortalPair(portalId) {
  const portal = level.portals.find(p => p.id === portalId);
  if (!portal) return;

  // 入口高亮（綠色邊框）
  highlightCell(portal.entrancePos.col, portal.entrancePos.row, '#44ff44');

  // 出口高亮（同色邊框）
  highlightCell(portal.exitPos.col, portal.exitPos.row, portal.color);

  // 顯示連接線
  renderPortalConnection(portal);
}
```

---

## 5. 地圖編輯器 UI 設計

### 5.1 傳送門工具列

**畫筆工具新增**：

```
┌────────────────────────────────────┐
│ 畫筆工具                            │
├────────────────────────────────────┤
│ [牆壁] [地板] [地心] [深淵]        │
│ [水潭] [草叢]                       │
│                                     │
│ === 傳送門工具 ===                  │
│ [A-a] [B-b] [C-c] [D-d] [E-e]      │  ← 預設 5 組傳送門
│ [自訂傳送門...]                     │
└────────────────────────────────────┘
```

**點擊 `[A-a]` 按鈕後**：

1. 滑鼠變成傳送門游標（顯示 "A" 標記）
2. 點擊地圖第 1 次 → 放置 `A`（入口）
3. 點擊地圖第 2 次 → 放置 `a`（出口）
4. 自動在 `portals` 陣列中建立配對：

```javascript
{
  id: 'portal_A',
  char: 'A',
  entrancePos: { col: clickX1, row: clickY1 },
  exitPos: { col: clickX2, row: clickY2 },
  pairedChar: 'a',
  color: '#44aa44',
  visualEffect: 'green',
  teleportDelay: 300,
  bidirectional: false,
}
```

### 5.2 傳送門配置面板

**右側面板顯示**：

```
┌─────────────────────────────────────┐
│ 傳送門列表                           │
├─────────────────────────────────────┤
│ • Portal A (綠色)                   │  ← 點擊展開
│   入口: (8, 1)                       │
│   出口: (8, 4)                       │
│   [編輯屬性] [刪除] [測試傳送]       │
│                                      │
│ • Portal B (藍色)                   │
│   入口: (8, 7)                       │
│   出口: (3, 8)                       │
│   [編輯屬性] [刪除] [測試傳送]       │
│                                      │
│ [新增傳送門]                         │
└─────────────────────────────────────┘
```

**點擊 `[編輯屬性]` 彈窗**：

```
┌─────────────────────────────────────┐
│ 編輯傳送門 A                         │
├─────────────────────────────────────┤
│ 字母標記: [A▼]  (自動配對: a)       │
│ 顏色:     [🎨 #44aa44]              │
│ 傳送延遲: [300] 毫秒                 │
│ 視覺特效: [綠色螺旋▼]                │
│                                      │
│ ☐ 雙向傳送（敵人可反向穿越）         │
│                                      │
│ === 入口位置 ===                     │
│ X: [8]  Y: [1]  [從地圖選取]        │
│                                      │
│ === 出口位置 ===                     │
│ X: [8]  Y: [4]  [從地圖選取]        │
│                                      │
│ [確定] [取消] [預覽傳送動畫]         │
└─────────────────────────────────────┘
```

### 5.3 設定流程

**流程 1：快速放置**

1. 點擊工具列 `[A-a]`
2. 點擊地圖放置入口 `A`
3. 點擊地圖放置出口 `a`
4. 自動建立配對，使用預設參數

**流程 2：進階設定**

1. 快速放置後，點擊 `[編輯屬性]`
2. 調整顏色、延遲、特效
3. 勾選「雙向傳送」
4. 點擊 `[預覽傳送動畫]` 測試

**流程 3：自訂字母**

1. 點擊 `[自訂傳送門...]`
2. 輸入字母（F-Z 或特殊符號）
3. 選擇顏色
4. 放置入口與出口

### 5.4 自動驗證

**載入地圖時檢查**：

```javascript
function validatePortals(level) {
  const errors = [];

  for (const portal of level.portals) {
    // 檢查入口座標是否為大寫字母
    const entranceTile = level.layout[portal.entrancePos.row][portal.entrancePos.col];
    if (entranceTile !== portal.char) {
      errors.push(`傳送門 ${portal.id} 入口座標 (${portal.entrancePos.col}, ${portal.entrancePos.row}) 不是 '${portal.char}'`);
    }

    // 檢查出口座標是否為小寫字母
    const exitTile = level.layout[portal.exitPos.row][portal.exitPos.col];
    if (exitTile !== portal.pairedChar) {
      errors.push(`傳送門 ${portal.id} 出口座標 (${portal.exitPos.col}, ${portal.exitPos.row}) 不是 '${portal.pairedChar}'`);
    }

    // 檢查是否有孤兒傳送門（只有入口沒有出口）
    if (!level.portals.some(p => p.char === portal.pairedChar)) {
      errors.push(`傳送門 ${portal.char} 缺少配對出口 ${portal.pairedChar}`);
    }
  }

  return errors;
}
```

**即時提示**：

```javascript
// 放置傳送門時即時檢查
function onPlacePortalEntrance(col, row, char) {
  // 檢查是否已有相同字母
  if (hasPortalChar(char)) {
    showWarning(`已存在傳送門 ${char}，請選擇其他字母`);
    return false;
  }

  // 檢查座標是否合法（不能在牆壁上）
  const tile = level.layout[row][col];
  if (tile === 'W' || tile === 'O') {
    showWarning('無法在牆壁或外圍放置傳送門');
    return false;
  }

  return true;
}
```

---

## 6. 遊戲邏輯整合

### 6.1 地圖初始化（Map.init）

```javascript
DK.Map.init() {
  // 載入傳送門配置
  if (DK.LevelManager?.currentLevel?.portals) {
    this.portals = JSON.parse(JSON.stringify(
      DK.LevelManager.currentLevel.portals
    ));
  } else {
    // 自動偵測 layout 中的傳送門字母
    this.portals = this.detectPortalPairs();
  }

  // 建立傳送門快速查詢表（char → portal）
  this.portalMap = {};
  for (const portal of this.portals) {
    this.portalMap[portal.char] = portal;
    this.portalMap[portal.pairedChar] = portal;  // 雙向查詢
  }

  // 預渲染傳送門地磚到 tileCache
  this.prerenderPortalTiles();
}

DK.Map.prerenderPortalTiles() {
  for (const portal of this.portals) {
    // 入口地磚
    const entranceCanvas = document.createElement('canvas');
    entranceCanvas.width = TILE_SIZE;
    entranceCanvas.height = TILE_SIZE;
    const ectx = entranceCanvas.getContext('2d');
    this.drawPortalEntranceTile(ectx, 0, 0, portal.char, portal.color);
    this.tileCache[`portal_${portal.char}`] = entranceCanvas;

    // 出口地磚
    const exitCanvas = document.createElement('canvas');
    exitCanvas.width = TILE_SIZE;
    exitCanvas.height = TILE_SIZE;
    const xctx = exitCanvas.getContext('2d');
    this.drawPortalExitTile(xctx, 0, 0, portal.pairedChar, portal.color);
    this.tileCache[`portal_${portal.pairedChar}`] = exitCanvas;
  }
}
```

### 6.2 地圖渲染（Map.render）

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

      // 傳送門渲染
      else if (/[A-Za-z]/.test(tile)) {
        const cacheKey = `portal_${tile}`;
        if (this.tileCache[cacheKey]) {
          ctx.drawImage(this.tileCache[cacheKey], x, y);
        } else {
          // fallback：預設地板
          this.drawFloorTile(ctx, x, y, 0);
        }
      }
    }
  }
}
```

### 6.3 輔助函式

```javascript
DK.Map.getPortalByChar(char) {
  return this.portalMap[char] || null;
}

DK.Map.isPortalEntrance(char) {
  return /[A-Z]/.test(char);
}

DK.Map.isPortalExit(char) {
  return /[a-z]/.test(char);
}

DK.Map.getPortalPair(char) {
  const portal = this.getPortalByChar(char);
  if (!portal) return null;

  return {
    entrance: portal.entrancePos,
    exit: portal.exitPos,
    color: portal.color,
  };
}
```

---

## 7. JSON 存儲格式

### 7.1 完整關卡檔案

```json
{
  "id": 2,
  "name": "傳送門試煉",
  "description": "利用傳送門製造迷宮路徑",
  "layout": [
    "OOOOOOOOOOOOOOOOOOOO",
    "OWWWWWWWAWWWWWWWWWWO",
    "OW........WW......WO",
    "OW.......aWW......WO",
    "OW........HH......WO",
    "OWWWWWWWBWWWWWWWWWWO",
    "OW.b......WW......WO",
    "OWWWWWWWWWWWWWWWWWWO"
  ],
  "portals": [
    {
      "id": "portal_A",
      "char": "A",
      "entrancePos": { "col": 8, "row": 1 },
      "exitPos": { "col": 8, "row": 3 },
      "pairedChar": "a",
      "color": "#44aa44",
      "visualEffect": "green",
      "teleportDelay": 300,
      "bidirectional": false
    },
    {
      "id": "portal_B",
      "char": "B",
      "entrancePos": { "col": 8, "row": 5 },
      "exitPos": { "col": 3, "row": 6 },
      "pairedChar": "b",
      "color": "#4444aa",
      "visualEffect": "blue",
      "teleportDelay": 300,
      "bidirectional": false
    }
  ],
  "startingGold": 1200,
  "dungeonHeartHP": 70
}
```

### 7.2 匯入/匯出功能

**匯出按鈕**：

```javascript
function exportLevel() {
  const levelData = {
    id: level.id,
    name: level.name,
    description: level.description,
    layout: level.layout,
    portals: level.portals,
    startingGold: level.startingGold,
    dungeonHeartHP: level.dungeonHeartHP,
  };

  const json = JSON.stringify(levelData, null, 2);
  downloadFile(`level_${level.id}.json`, json);
}
```

**匯入按鈕**：

```javascript
function importLevel(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const levelData = JSON.parse(e.target.result);

      // 驗證格式
      const errors = validateLevel(levelData);
      if (errors.length > 0) {
        showErrors(errors);
        return;
      }

      // 載入關卡
      loadLevel(levelData);
      showSuccess('關卡載入成功！');
    } catch (err) {
      showError('JSON 格式錯誤：' + err.message);
    }
  };
  reader.readAsText(file);
}
```

---

## 8. 向後相容與遷移

### 8.1 與破牆機制共存

**保留舊系統**（階段 1）：

```javascript
// 在 Map.init() 中：
if (this.portals.length === 0 && this.breachHoles && this.breachHoles.length > 0) {
  // 舊系統：使用破牆生成
  console.warn('使用舊的 breachHoles 系統（已棄用）');
} else {
  // 新系統：使用傳送門
  this.initPortals();
}
```

**逐步遷移**（階段 2）：

- 新關卡一律使用傳送門
- 舊關卡加上 `deprecated: true` 標記
- 編輯器顯示「升級到傳送門系統」按鈕

**完全移除**（階段 3）：

- 刪除 `breachHoles` 相關程式碼
- 所有關卡強制使用 `portals`

### 8.2 自動升級工具

```javascript
function upgradeToPortalSystem(oldLevel) {
  // 將 breachHoles 轉換為傳送門
  const portals = [];

  for (let i = 0; i < oldLevel.breachHoles.length; i++) {
    const hole = oldLevel.breachHoles[i];
    const char = String.fromCharCode(65 + i);  // A, B, C...

    // 找到最近的 '.' 格子作為出口（簡化版）
    const exitPos = findNearestWalkable(hole.col, hole.row);

    portals.push({
      id: `auto_portal_${char}`,
      char: char,
      entrancePos: { col: hole.col, row: hole.row },
      exitPos: exitPos,
      pairedChar: char.toLowerCase(),
      color: DK.Map.getPortalColor(char),
      visualEffect: 'default',
      teleportDelay: 300,
      bidirectional: false,
    });

    // 更新 layout
    oldLevel.layout[hole.row] = replaceCharAt(
      oldLevel.layout[hole.row],
      hole.col,
      char
    );
    oldLevel.layout[exitPos.row] = replaceCharAt(
      oldLevel.layout[exitPos.row],
      exitPos.col,
      char.toLowerCase()
    );
  }

  oldLevel.portals = portals;
  delete oldLevel.breachHoles;  // 移除舊資料
  return oldLevel;
}
```

---

## 9. 測試計畫

### 9.1 單元測試

- [ ] 傳送門自動偵測（layout 字母 → portals 陣列）
- [ ] 配對驗證（A-a, B-b 正確配對）
- [ ] 碰撞檢測（敵人踩到入口觸發傳送）
- [ ] 座標轉換（傳送前後座標正確）
- [ ] 冷卻機制（防止重複觸發）

### 9.2 整合測試

- [ ] 單傳送門關卡（A-a）
- [ ] 雙傳送門關卡（A-a, B-b 同時運作）
- [ ] 傳送鏈（A→a/B→b 連續傳送）
- [ ] 雙向傳送門（敵人可反向穿越）
- [ ] 多對一傳送（A→a, B→a）

### 9.3 編輯器測試

- [ ] 快速放置（點擊兩次完成配對）
- [ ] 屬性編輯（顏色、延遲、雙向）
- [ ] 刪除傳送門（同時刪除 layout 字母與 portals 配置）
- [ ] JSON 匯出/匯入（往返無損）
- [ ] 自動驗證（錯誤提示正確）

### 9.4 視覺測試

- [ ] 入口/出口地磚正確顯示
- [ ] 配對連線（編輯器模式）
- [ ] 傳送動畫（螺旋收縮/擴散）
- [ ] 呼吸光暈（持續脈動）
- [ ] 敵人淡出/淡入

---

## 10. 實作優先順序

### P0（核心功能）
1. ✅ 數據結構設計（portals 陣列 + layout 字母）
2. 自動偵測邏輯（`detectPortalPairs()`）
3. 碰撞檢測（敵人踩到入口）
4. 傳送執行（座標移動 + 動畫）
5. 地磚渲染（入口/出口視覺）

### P1（編輯器）
6. 傳送門放置工具（兩次點擊完成配對）
7. 傳送門列表面板（顯示所有配對）
8. 屬性編輯彈窗（顏色、延遲、雙向）
9. 自動驗證（layout vs portals 一致性）

### P2（視覺優化）
10. 傳送動畫特效（螺旋收縮/擴散）
11. 呼吸光暈（持續脈動）
12. 配對連線（編輯器顯示）
13. 預覽功能（測試傳送動畫）

### P3（進階功能）
14. 雙向傳送門
15. 傳送鏈（連續傳送）
16. 多對一傳送
17. 自訂視覺特效（火焰、冰霜、閃電）

---

## 11. 設計決策理由

### 為何使用字母配對而非 ID？

**優點**：
- ✅ 直觀：layout 中直接看到配對關係（A-a, B-b）
- ✅ 編輯方便：手動編輯 layout 時容易理解
- ✅ 視覺提示：字母本身就是標記，無需額外 UI

**缺點**：
- ❌ 限制數量：最多 26 組（A-Z）
- ❌ 大小寫敏感：容易打錯

**解決方案**：
- 26 組對大多數地圖已足夠
- 編輯器自動處理大小寫（工具列點擊自動配對）

### 為何區分入口/出口？

**理由**：
- 單向傳送為預設（符合大多數塔防遊戲）
- 視覺區分：入口 = 大寫 = 左側，出口 = 小寫 = 右側
- 可選雙向：進階功能，勾選即可啟用

### 為何使用延遲傳送而非瞬間？

**理由**：
- 視覺回饋：玩家看到傳送動畫（螺旋收縮/擴散）
- 遊戲性：給予玩家反應時間（可在傳送前攻擊敵人）
- 防止卡頓：分段渲染（淡出 → 移動 → 淡入）

---

## 12. 未來擴展方向

### 12.1 傳送門升級系統

```javascript
{
  id: 'portal_A',
  char: 'A',
  // ...
  upgrades: {
    slow: true,          // 傳送時附加緩速
    damage: 10,          // 傳送時造成傷害
    stun: 500,           // 傳送後眩暈 0.5 秒
    teleportCost: 5,     // 消耗金幣才能傳送（敵人付費）
  },
}
```

### 12.2 條件觸發傳送門

```javascript
{
  id: 'boss_portal',
  char: 'Z',
  // ...
  activateWhen: {
    wave: 5,             // 第 5 波開始啟用
    enemyType: 'ORC',    // 只有獸人可傳送
    hpThreshold: 0.5,    // HP < 50% 才能進入（逃生門）
  },
}
```

### 12.3 隨機傳送門

```javascript
{
  id: 'random_portal',
  char: 'R',
  entrancePos: { col: 10, row: 5 },
  exitPos: 'random',     // 隨機傳送到任意 '.' 格
  // 或
  exitOptions: [        // 隨機選擇其中一個出口
    { col: 3, row: 2 },
    { col: 15, row: 8 },
    { col: 7, row: 12 },
  ],
}
```

---

## 13. 總結

配對傳送門系統提供了靈活的地圖設計工具，核心特色：

1. **字母配對**：直觀的 A-a, B-b 配對方式
2. **自動偵測**：layout 字母自動建立 portals 配置
3. **視覺回饋**：螺旋動畫 + 呼吸光暈 + 配對連線
4. **編輯器友善**：兩次點擊完成配對，屬性面板調整細節
5. **向後相容**：保留破牆系統，逐步遷移

**實作建議**：
- 先完成 P0 核心功能（自動偵測 + 傳送邏輯 + 基礎渲染）
- 再開發 P1 編輯器 UI（放置工具 + 屬性面板）
- 最後優化 P2 視覺效果（動畫 + 光暈）

所有設計細節、程式碼範例、UI mockup 已完整記錄，可直接作為實作指南！
