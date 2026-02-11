# 波次配置與參數設定 UI 設計文件

## 一、設計概述

本設計文件定義關卡編輯器中的「波次配置」與「全局參數設定」介面，使用者可透過此介面為每個傳送門（Portal）配置敵人波次，並設定關卡的起始金幣、地心生命值等全局參數。

## 二、UI 架構選擇：Side Panel

### 選擇理由

經過評估，**選擇 Side Panel（側邊欄）方案**，理由如下：

1. **即時性**：編輯波次時可同時檢視地圖，確認傳送門位置與路徑關係
2. **空間利用**：右側留白區域適合放置編輯面板（寬度 300-350px）
3. **符合現有設計**：與 DK 遊戲本體的 UI 佈局一致（下方工具欄 + 右側資訊欄）
4. **操作流暢度**：減少 modal 切換，適合頻繁修改波次的工作流程

### Modal 作為補充方案

對於複雜配置（如批量匯入、JSON 編輯），可彈出 modal 作為補充介面。

---

## 三、UI 佈局設計

### 3.1 整體佈局（1280x720）

```
┌─────────────────────────────────────────────────────────┐
│ [標題列] 關卡編輯器 - Level 1 破牆試煉          [儲存] │
├─────────────────────────────────┬───────────────────────┤
│                                 │                       │
│                                 │                       │
│      地圖編輯區域               │    側邊欄面板         │
│      (Map Canvas)               │    (Side Panel)       │
│                                 │                       │
│      960 x 624px                │    320 x 624px        │
│                                 │                       │
│                                 │                       │
├─────────────────────────────────┴───────────────────────┤
│ [工具欄] 畫筆工具 | 傳送門 | 地心 | ...       [測試]   │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Side Panel 結構（可捲動）

```
┌─────────────────────────────────┐
│ [Tab: 波次配置] [全局參數]      │  ← Tabs
├─────────────────────────────────┤
│                                 │
│  ▼ 傳送門 #1 (2, 5)             │  ← Portal 折疊區塊
│     [編輯波次] [複製] [刪除]    │
│                                 │
│  ▼ 傳送門 #2 (15, 8)            │
│     Wave 1: 5x 劍士             │  ← 波次摘要
│     Wave 2: 3x 騎士             │
│     [編輯波次] [複製] [刪除]    │
│                                 │
│  + 新增傳送門                   │
│                                 │
│ ─────────────────────────       │
│ [批量匯入 JSON]                 │  ← 進階功能
│ [匯出配置]                      │
│                                 │
└─────────────────────────────────┘
```

---

## 四、功能設計細節

### 4.1 Tab: 波次配置

#### 4.1.1 傳送門清單

**展示內容：**
- Portal ID（自動編號）
- Portal 座標 (x, y)
- 波次數量摘要（例如：「3 waves」）
- 操作按鈕：[編輯波次] [複製] [刪除]

**折疊展開：**
- 點擊 Portal 標題可折疊/展開詳細波次
- 展開時顯示每個 Wave 的敵人組成摘要

**範例：**
```
▼ 傳送門 #1 (2, 5)               [編輯] [複製] [刪除]
  Wave 1: 10x 劍士
  Wave 2: 6x 弓手, 4x 劍士
  Wave 3: 3x 騎士, 5x 盜賊
```

---

#### 4.1.2 編輯波次 Modal

點擊 [編輯波次] 後彈出 Modal，尺寸約 600x500px。

**Modal 標題：**
```
編輯傳送門 #1 波次配置
```

**內容結構：**

```
┌────────────────────────────────────────────────────┐
│ 編輯傳送門 #1 波次配置                    [× 關閉] │
├────────────────────────────────────────────────────┤
│                                                    │
│ ▼ Wave 1                         [↑] [↓] [刪除]   │ ← 波次順序調整
│   ┌──────────────────────────────────────┐       │
│   │ 敵人類型      數量    間隔(ms)  獎勵  │       │
│   ├──────────────────────────────────────┤       │
│   │ [劍士▾]      [ 10]   [ 500]   [10]  │ [×]  │ ← 每行一個敵人定義
│   │ [弓手▾]      [ 5 ]   [ 800]   [15]  │ [×]  │
│   │ + 新增敵人                            │       │
│   └──────────────────────────────────────┘       │
│                                                    │
│ ▼ Wave 2                         [↑] [↓] [刪除]   │
│   ┌──────────────────────────────────────┐       │
│   │ 敵人類型      數量    間隔(ms)  獎勵  │       │
│   ├──────────────────────────────────────┤       │
│   │ [騎士▾]      [ 3 ]   [1000]   [25]  │ [×]  │
│   │ + 新增敵人                            │       │
│   └──────────────────────────────────────┘       │
│                                                    │
│ [+ 新增 Wave]                                      │
│                                                    │
│ ────────────────────────────────────────────────  │
│                                 [取消] [儲存變更]  │
└────────────────────────────────────────────────────┘
```

**欄位說明：**

| 欄位 | 類型 | 說明 | 預設值 | 驗證規則 |
|------|------|------|--------|----------|
| 敵人類型 | Dropdown | 選擇敵人種類 | 劍士 | 必填 |
| 數量 | Number | 敵人數量 | 1 | 1-99 |
| 間隔 | Number | 生成間隔（毫秒） | 500 | 100-5000 |
| 獎勵 | Number | 擊殺金幣 | 依敵人預設 | 0-999 |

**敵人類型選項（來自 `DK.ENEMY_TYPES`）：**
- 劍士 (GOBLIN)
- 弓手 (SKELETON)
- 騎士 (ORC)
- 盜賊 (SLIME)

---

#### 4.1.3 複製與刪除功能

**[複製]：**
- 複製整個 Portal 的波次配置到新的 Portal
- 彈出提示：「請在地圖上點選新傳送門的位置」
- 點選後自動生成新 Portal 並套用波次

**[刪除]：**
- 確認對話框：「確定要刪除傳送門 #1 及其所有波次嗎？」
- 刪除後同步移除地圖上的傳送門標記（'E' tile）

---

#### 4.1.4 波次順序調整

在 Wave 標題旁提供 [↑] [↓] 按鈕，支援拖曳排序（可選實作）。

---

#### 4.1.5 批量匯入/匯出

**[匯入 JSON]：**
- 彈出 textarea，貼上 JSON 格式的波次配置
- 格式範例：
```json
{
  "portals": [
    {
      "x": 2,
      "y": 5,
      "waves": [
        {
          "enemies": [
            { "type": "GOBLIN", "count": 10, "interval": 500, "gold": 10 }
          ]
        }
      ]
    }
  ]
}
```
- 驗證後合併到現有配置

**[匯出配置]：**
- 生成 JSON 格式並顯示在 modal 中，可複製或下載

---

### 4.2 Tab: 全局參數

**佈局：**

```
┌─────────────────────────────────┐
│ [Tab: 波次配置] [全局參數]      │
├─────────────────────────────────┤
│                                 │
│ 關卡基本設定                    │
│ ───────────────────────         │
│                                 │
│ 關卡名稱                        │
│ [破牆試煉________________]      │
│                                 │
│ 關卡描述                        │
│ [學習破除路障與埋設障礙物...]   │
│ [                              ] │
│                                 │
│ ───────────────────────         │
│                                 │
│ 起始金幣                        │
│ [1000_______] G                 │
│ (建議: 300-2000)                │
│                                 │
│ 地心生命值                      │
│ [100________] HP                │
│ (建議: 50-200)                  │
│                                 │
│ 波次延遲                        │
│ [5000_______] ms                │
│ (建議: 3000-10000)              │
│                                 │
│ 自動波次延遲                    │
│ [3000_______] ms                │
│                                 │
│ ───────────────────────         │
│                                 │
│ [重設為預設值]                  │
│                                 │
└─────────────────────────────────┘
```

**參數定義：**

| 參數 | 類型 | 預設值 | 驗證規則 | 說明 |
|------|------|--------|----------|------|
| 關卡名稱 | Text | "New Level" | 1-20 字元 | 顯示在關卡選單 |
| 關卡描述 | Textarea | "" | 0-100 字元 | 關卡簡介 |
| startingGold | Number | 1000 | 100-9999 | 玩家初始金幣 |
| dungeonHeartHP | Number | 100 | 50-500 | 地心生命值 |
| WAVE_DELAY | Number | 5000 | 1000-30000 | 手動開始波次後的延遲 |
| WAVE_AUTO_DELAY | Number | 3000 | 1000-30000 | 波次完成後自動開始延遲 |

**即時提示：**
- 輸入框旁顯示「建議範圍」提示
- 超出範圍顯示警告（黃色邊框）但不阻擋輸入

---

## 五、表單驗證與錯誤處理

### 5.1 驗證時機

1. **即時驗證（onChange）：**
   - 數字欄位範圍檢查
   - 文字長度限制
   - 顯示警告邊框但不阻擋輸入

2. **提交驗證（儲存時）：**
   - 必填欄位檢查
   - 邏輯一致性檢查（例如：至少有一個 Portal 有波次）
   - 通過後才允許儲存

### 5.2 錯誤訊息設計

**位置：**
- 欄位下方顯示紅色小字提示
- 嚴重錯誤在 Side Panel 頂部顯示紅色橫幅

**錯誤範例：**
```
❌ 敵人數量必須在 1-99 之間
❌ 傳送門 #1 沒有任何波次配置
❌ 關卡名稱不可為空
```

### 5.3 資料完整性檢查

**儲存前檢查清單：**
- [ ] 至少有一個傳送門
- [ ] 每個傳送門至少有一個 Wave
- [ ] 每個 Wave 至少有一個敵人
- [ ] 所有數字欄位在合理範圍內
- [ ] 傳送門座標在地圖範圍內（0-19, 0-12）

---

## 六、配置預覽功能

### 6.1 波次總覽（在 Side Panel 頂部）

```
┌─────────────────────────────────┐
│ 📊 關卡總覽                      │
│ ─────────────────────────       │
│ 傳送門數量: 2                   │
│ 總波次數: 7                     │
│ 總敵人數: 145                   │
│ 預估難度: ★★★☆☆               │
│ ─────────────────────────       │
└─────────────────────────────────┘
```

**預估難度計算公式（簡化版）：**
```javascript
difficulty = (totalEnemies * avgEnemyHP + totalEliteCount * 100) / startingGold
// 1-2星: 簡單
// 3星: 中等
// 4-5星: 困難
```

### 6.2 波次時間軸預覽（可選功能）

在 Modal 中點擊 [預覽時間軸] 顯示：

```
Portal #1:
├─ Wave 1 (0s-5s): 10x 劍士
├─ Wave 2 (8s-15s): 6x 弓手, 4x 劍士
└─ Wave 3 (18s-30s): 3x 騎士, 5x 盜賊

Portal #2:
├─ Wave 1 (0s-8s): 12x 劍士
└─ Wave 2 (11s-20s): 5x 騎士
```

---

## 七、技術實作建議

### 7.1 資料結構（Level 定義）

```javascript
{
  id: 1,
  name: '破牆試煉',
  description: '學習破除路障與埋設障礙物的基礎技能',
  layout: [...],  // 地圖 layout (2D string array)

  portals: [  // 新增：取代單一 waves 陣列
    {
      id: 1,
      x: 2,
      y: 5,
      waves: [
        {
          enemies: [
            { type: 'GOBLIN', count: 10, interval: 500, gold: 10 }
          ]
        }
      ]
    },
    {
      id: 2,
      x: 15,
      y: 8,
      waves: [...]
    }
  ],

  startingGold: 1000,
  dungeonHeartHP: 100,
  waveDelay: 5000,
  waveAutoDelay: 3000,
}
```

### 7.2 UI 狀態管理（DK.LevelEditor）

```javascript
DK.LevelEditor = {
  // 狀態
  currentLevel: null,  // 正在編輯的關卡物件
  selectedPortal: null,  // 當前選中的傳送門
  sidePanelTab: 'waves',  // 'waves' | 'params'
  isDirty: false,  // 是否有未儲存變更

  // UI 更新
  render() {
    this.renderSidePanel();
    this.renderMapCanvas();
  },

  renderSidePanel() {
    if (this.sidePanelTab === 'waves') {
      this.renderWavesTab();
    } else {
      this.renderParamsTab();
    }
  },

  // 波次編輯
  openWaveEditor(portalId) {
    // 彈出 Modal
  },

  addWave(portalId) {
    // 新增空白 Wave
  },

  deleteWave(portalId, waveIndex) {
    // 刪除 Wave
  },

  // 儲存與驗證
  validate() {
    // 執行所有驗證檢查
    return { valid: true, errors: [] };
  },

  save() {
    const validation = this.validate();
    if (!validation.valid) {
      this.showErrors(validation.errors);
      return;
    }
    // 儲存到 localStorage 或匯出 JSON
  }
};
```

### 7.3 Modal 實作

使用原生 DOM 或輕量級 modal 庫，避免依賴大型框架。

**HTML 結構：**
```html
<div id="wave-editor-modal" class="dk-modal" style="display:none;">
  <div class="dk-modal-overlay"></div>
  <div class="dk-modal-content">
    <div class="dk-modal-header">
      <h3>編輯傳送門 #1 波次配置</h3>
      <button class="dk-modal-close">×</button>
    </div>
    <div class="dk-modal-body">
      <!-- Wave 編輯表單 -->
    </div>
    <div class="dk-modal-footer">
      <button class="btn-cancel">取消</button>
      <button class="btn-save">儲存變更</button>
    </div>
  </div>
</div>
```

**CSS 樣式：**
```css
.dk-modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  z-index: 9999;
}

.dk-modal-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7);
}

.dk-modal-content {
  position: relative;
  width: 600px;
  max-height: 80vh;
  margin: 5vh auto;
  background: #1e1a2e;
  border: 2px solid #4a3e6e;
  border-radius: 8px;
  overflow-y: auto;
}
```

### 7.4 驗證函式庫

```javascript
DK.LevelValidator = {
  validateLevel(level) {
    const errors = [];

    // 基本欄位
    if (!level.name || level.name.trim() === '') {
      errors.push('關卡名稱不可為空');
    }

    // 傳送門檢查
    if (!level.portals || level.portals.length === 0) {
      errors.push('至少需要一個傳送門');
    }

    // 波次檢查
    level.portals?.forEach((portal, i) => {
      if (!portal.waves || portal.waves.length === 0) {
        errors.push(`傳送門 #${i+1} 沒有任何波次配置`);
      }

      portal.waves?.forEach((wave, j) => {
        if (!wave.enemies || wave.enemies.length === 0) {
          errors.push(`傳送門 #${i+1} Wave ${j+1} 沒有敵人`);
        }

        wave.enemies?.forEach((enemy, k) => {
          if (enemy.count < 1 || enemy.count > 99) {
            errors.push(`傳送門 #${i+1} Wave ${j+1} 敵人 ${k+1} 數量超出範圍`);
          }
        });
      });
    });

    // 參數範圍
    if (level.startingGold < 100 || level.startingGold > 9999) {
      errors.push('起始金幣必須在 100-9999 之間');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};
```

---

## 八、UI 樣式指引（配合 DK 風格）

### 8.1 色彩規範（來自 `DK.COLORS`）

| 元素 | 顏色變數 | Hex 值 |
|------|---------|--------|
| 背景 | UI_BG | #12101e |
| 面板 | UI_PANEL | #1e1a2e |
| 邊框 | UI_BORDER | #4a3e6e |
| 文字 | UI_TEXT | #e8e0d0 |
| 文字暗色 | UI_TEXT_DIM | #8a8070 |
| 金幣 | UI_GOLD | #ffd700 |
| 危險/刪除 | UI_HP | #ff4444 |
| 選中 | UI_SELECTED | #ffaa44 |

### 8.2 字型（來自 `DK.FONTS`）

```javascript
// 標題
font: DK.FONTS.bold(18)  // "bold 18px Noto Sans TC, ..."

// 內文
font: DK.FONTS.body(14)

// 按鈕
font: DK.FONTS.body(16)

// 數字輸入框
font: DK.FONTS.pixel(12)  // "12px Press Start 2P, monospace"
```

### 8.3 按鈕樣式

**主要按鈕（儲存、確定）：**
```css
background: linear-gradient(180deg, #6a5e8e 0%, #4a3e6e 100%);
border: 2px solid #8a7eae;
color: #e8e0d0;
padding: 8px 16px;
border-radius: 4px;
cursor: pointer;
```

**危險按鈕（刪除）：**
```css
background: linear-gradient(180deg, #cc5544 0%, #aa3322 100%);
border: 2px solid #ee6655;
```

**次要按鈕（取消）：**
```css
background: transparent;
border: 2px solid #4a3e6e;
color: #8a8070;
```

### 8.4 輸入框樣式

```css
input[type="text"],
input[type="number"],
textarea,
select {
  background: #12101e;
  border: 2px solid #4a3e6e;
  color: #e8e0d0;
  padding: 6px 10px;
  border-radius: 4px;
  font-family: "Noto Sans TC", sans-serif;
}

input:focus {
  outline: none;
  border-color: #6a5e8e;
  box-shadow: 0 0 0 2px rgba(106, 94, 142, 0.3);
}

input.error {
  border-color: #ff4444;
}
```

---

## 九、互動流程範例

### 9.1 新增傳送門並配置波次

**步驟：**
1. 使用者在地圖編輯器中放置傳送門標記（'E' tile）於 (2, 5)
2. Side Panel 自動新增「傳送門 #1 (2, 5)」條目
3. 使用者點擊 [編輯波次]
4. 彈出 Wave Editor Modal
5. 點擊 [+ 新增 Wave] 建立 Wave 1
6. 在 Wave 1 中點擊 [+ 新增敵人]
7. 選擇「劍士」、數量 10、間隔 500、獎勵 10
8. 點擊 [儲存變更]
9. Modal 關閉，Side Panel 顯示「Wave 1: 10x 劍士」

### 9.2 複製傳送門波次

**步驟：**
1. 使用者點擊傳送門 #1 的 [複製] 按鈕
2. 系統提示：「請在地圖上點選新傳送門的位置」
3. 使用者點擊地圖上的 (15, 8)
4. 系統自動：
   - 在 (15, 8) 放置 'E' tile
   - 建立「傳送門 #2 (15, 8)」
   - 複製傳送門 #1 的所有波次配置到傳送門 #2
5. Side Panel 更新顯示傳送門 #2

### 9.3 匯入 JSON 配置

**步驟：**
1. 使用者點擊 [批量匯入 JSON]
2. 彈出 Modal 顯示 textarea
3. 使用者貼上 JSON 配置
4. 系統驗證 JSON 格式與內容
5. 若驗證通過：
   - 合併到現有配置（或選擇「覆蓋」）
   - Side Panel 更新顯示所有傳送門
6. 若驗證失敗：
   - 顯示錯誤訊息（例如：「JSON 格式錯誤：第 5 行語法錯誤」）

---

## 十、設計迭代檢查清單

根據專案規定，本設計將經過 **10 次迭代優化**。以下是每次迭代的檢查重點：

### 迭代 1：核心功能設計 ✅
- [x] 定義 UI 架構（Side Panel）
- [x] 設計 Portal 清單介面
- [x] 設計 Wave Editor Modal
- [x] 定義資料結構
- [x] 設計敵人路徑預覽系統
- [x] 設計陷阱放置預覽系統

### 迭代 2：表單與驗證完善 ✅
- [x] 補充所有表單欄位的驗證規則
- [x] 設計錯誤訊息呈現方式
- [x] 新增即時提示與建議範圍
- [x] 設計陷阱有效性檢查邏輯
- [x] 設計路徑計算與驗證

### 迭代 3：進階功能設計 ✅
- [x] 設計批量匯入/匯出功能
- [x] 新增配置預覽與總覽
- [x] 設計波次順序調整（拖曳排序）
- [x] 設計多傳送門路徑顯示
- [x] 設計陷阱效率分析

### 迭代 4：視覺與互動優化 ✅
- [x] 統一配色與字型（符合 DK 風格）
- [x] 設計 hover、focus、active 狀態
- [x] 新增動畫效果（展開/折疊、Modal 淡入）
- [x] 設計路徑預覽視覺效果（虛線、箭頭、節點）
- [x] 設計陷阱放置視覺回饋（綠/黃/紅邊框）

### 迭代 5：測試模式設計 ✅
- [x] 設計「測試關卡」功能
- [x] 設計陷阱效果測試報告
- [x] 設計批量陷阱放置測試流程
- [x] 設計陷阱觸發統計面板

### 迭代 6：易用性改善（規劃中）
- [ ] 新增鍵盤快捷鍵（Esc 關閉 Modal、Enter 儲存）
- [ ] 設計未儲存提醒（isDirty 狀態）
- [ ] 新增操作歷史記錄（Undo/Redo）
- [ ] 設計快速複製波次配置功能

### 迭代 7-10：預留優化空間
- [ ] 效能優化（Web Worker 路徑計算）
- [ ] 無障礙設計（鍵盤導航、ARIA 標籤）
- [ ] 多語言支援（i18n）
- [ ] 匯出為圖片/PDF（關卡設計文件）

---

## 十一、敵人路徑預覽系統

### 11.1 功能概述

在關卡編輯器中，使用者可**即時預覽敵人從傳送門到地心的行走路線**，確保地圖設計合理、路徑通暢。

### 11.2 UI 設計

#### 預覽觸發方式

**方式 1：Side Panel 按鈕**
```
▼ 傳送門 #1 (2, 5)
  [編輯波次] [複製] [刪除] [👁 預覽路徑]  ← 新增按鈕
```

**方式 2：地圖上的傳送門標記**
- Hover 傳送門標記時，自動顯示半透明路徑
- 點擊傳送門標記，切換路徑預覽開/關

#### 路徑渲染樣式

**Canvas 疊加層（Overlay）：**
```javascript
// 在地圖 canvas 上繪製半透明路徑
ctx.strokeStyle = 'rgba(255, 170, 68, 0.6)';  // UI_SELECTED 半透明
ctx.lineWidth = 3;
ctx.setLineDash([8, 4]);  // 虛線效果
ctx.lineCap = 'round';
ctx.lineJoin = 'round';

// 繪製路徑線條（bezier curve 平滑效果）
ctx.beginPath();
ctx.moveTo(startX, startY);
for (let i = 1; i < pathPoints.length; i++) {
  const prev = pathPoints[i-1];
  const curr = pathPoints[i];
  const cpX = (prev.x + curr.x) / 2;
  const cpY = (prev.y + curr.y) / 2;
  ctx.quadraticCurveTo(prev.x, prev.y, cpX, cpY);
}
ctx.stroke();

// 繪製路徑節點（小圓點）
pathPoints.forEach((p, i) => {
  ctx.fillStyle = 'rgba(255, 170, 68, 0.8)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
  ctx.fill();
});

// 繪製方向箭頭（每隔 3 格）
for (let i = 3; i < pathPoints.length; i += 3) {
  this.drawArrow(ctx, pathPoints[i-1], pathPoints[i]);
}
```

**路徑狀態標示：**
- ✅ **綠色路徑**：可通行，敵人可到達地心
- ⚠️ **黃色路徑**：路徑過長（>50 tiles），可能造成遊戲性問題
- ❌ **紅色虛線**：路徑不通，傳送門無法到達地心

### 11.3 路徑計算（使用現有 BFS）

**複用 `DK.Heroes.findPath()` 邏輯：**

```javascript
DK.LevelEditor.PathPreview = {
  currentPaths: new Map(),  // portalId -> pathData

  calculatePath(portalCol, portalRow) {
    // 找到地心位置
    const heartTiles = this.findHeartTiles();
    if (heartTiles.length === 0) {
      return { valid: false, error: '地圖上沒有地心 (H)' };
    }

    // BFS 尋找最短路徑到任一地心 tile
    const targetHeart = heartTiles[0];
    const path = this.bfsPath(portalCol, portalRow, targetHeart.col, targetHeart.row);

    if (!path || path.length === 0) {
      return { valid: false, error: '傳送門無法到達地心' };
    }

    return {
      valid: true,
      path: path,
      length: path.length,
      warning: path.length > 50 ? '路徑過長，建議優化地圖佈局' : null
    };
  },

  bfsPath(startCol, startRow, endCol, endRow) {
    // 複製自 DK.Heroes.findPath，但適配編輯器環境
    const visited = new Set();
    const queue = [[{ col: startCol, row: startRow }]];
    visited.add(`${startCol},${endRow}`);

    while (queue.length > 0) {
      const path = queue.shift();
      const { col, row } = path[path.length - 1];

      if (col === endCol && row === endRow) {
        return path;
      }

      const dirs = [[0,-1],[1,0],[0,1],[-1,0]];
      for (const [dc, dr] of dirs) {
        const nc = col + dc;
        const nr = row + dr;
        const key = `${nc},${nr}`;

        if (visited.has(key)) continue;
        if (!this.isWalkable(nc, nr)) continue;

        visited.add(key);
        queue.push([...path, { col: nc, row: nr }]);
      }
    }

    return null;  // 無法到達
  },

  isWalkable(col, row) {
    // 檢查是否為可行走的 tile
    if (col < 0 || row < 0 || col >= DK.CONFIG.GRID_COLS || row >= DK.CONFIG.GRID_ROWS) {
      return false;
    }
    const tile = this.currentLayout[row][col];
    // 可行走：地板 (.), 地心 (H), 傳送門 (E), 水池 (P), 草地 (G), 陷阱放置處
    return ['.', 'H', 'E', 'P', 'G', 'T'].includes(tile);
  },

  findHeartTiles() {
    const hearts = [];
    for (let r = 0; r < this.currentLayout.length; r++) {
      for (let c = 0; c < this.currentLayout[r].length; c++) {
        if (this.currentLayout[r][c] === 'H') {
          hearts.push({ col: c, row: r });
        }
      }
    }
    return hearts;
  }
};
```

### 11.4 即時更新機制

**觸發路徑重新計算的時機：**
1. 使用者移動傳送門位置
2. 使用者修改地圖 layout（新增/刪除牆壁）
3. 使用者移動地心位置
4. 切換到「預覽模式」時

**Debounce 優化：**
```javascript
let pathUpdateTimer = null;

function schedulePathUpdate(portalId) {
  clearTimeout(pathUpdateTimer);
  pathUpdateTimer = setTimeout(() => {
    DK.LevelEditor.PathPreview.updatePath(portalId);
  }, 200);  // 200ms debounce
}
```

### 11.5 多傳送門路徑顯示

**同時顯示多條路徑：**
- 使用不同顏色區分（橘色、藍色、綠色、紫色）
- 路徑交叉處使用混合模式避免重疊遮蔽

```javascript
const portalColors = [
  'rgba(255, 170, 68, 0.6)',  // 橘色
  'rgba(68, 170, 255, 0.6)',  // 藍色
  'rgba(68, 255, 170, 0.6)',  // 綠色
  'rgba(170, 68, 255, 0.6)',  // 紫色
];

function getPortalColor(portalIndex) {
  return portalColors[portalIndex % portalColors.length];
}
```

### 11.6 路徑資訊面板（Side Panel）

**顯示路徑統計：**
```
┌─────────────────────────────────┐
│ 📍 傳送門 #1 路徑資訊            │
│ ─────────────────────────       │
│ 狀態: ✅ 可通行                  │
│ 路徑長度: 28 格                 │
│ 預估行走時間: 14 秒             │
│ 經過陷阱位置: 5 個              │
│ 經過特殊地形: 水池 x2, 草地 x1  │
│ ─────────────────────────       │
│ [隱藏路徑] [優化建議]           │
└─────────────────────────────────┘
```

---

## 十二、陷阱放置預覽系統

### 12.1 功能概述

在地圖編輯器中，使用者放置陷阱標記時，**即時預覽陷阱是否有效**，並顯示陷阱的覆蓋範圍、影響路徑等資訊。

### 12.2 UI 設計

#### 陷阱有效性檢查

**視覺回饋（Hover 狀態）：**
- ✅ **綠色邊框**：可放置，位置有效
- ⚠️ **黃色邊框**：可放置，但效率不佳（例如：陷阱不在敵人路徑上）
- ❌ **紅色邊框**：無法放置（例如：牆壁上、超出地圖範圍）

**放置規則：**
| 陷阱類型 | 可放置位置 | 無效位置 |
|---------|-----------|---------|
| 電擊板 (floor) | 地板 (.), 水池 (P), 草地 (G) | 牆壁 (W), 深淵 (O), 地心 (H) |
| 推力陷阱 (wall) | 牆壁 (W) 且相鄰至少一個地板 | 孤立牆壁、地圖邊緣 |
| 油漬陷阱 (floor) | 地板 (.), 草地 (G) | 水池 (P), 牆壁 (W) |
| 風壓陷阱 (wall) | 牆壁 (W) 且相鄰至少一個地板 | 孤立牆壁、地圖邊緣 |

#### 陷阱覆蓋範圍預覽

**地板陷阱（如電擊板）：**
```javascript
// 繪製陷阱影響範圍（1x1 單格）
ctx.fillStyle = 'rgba(255, 221, 68, 0.3)';  // ELEMENT_ELECTRIC 半透明
ctx.fillRect(col * T, row * T, T, T);

// 繪製陷阱圖示（中央）
ctx.drawImage(trapIconSprite, col * T + 2, row * T + 2);
```

**牆壁陷阱（如推力陷阱）：**
```javascript
// 繪製推力方向箭頭
const direction = this.calculatePushDirection(col, row);
ctx.strokeStyle = 'rgba(255, 102, 34, 0.8)';  // TRAP_PUSH_CHARGE
ctx.lineWidth = 3;
this.drawPushArrow(ctx, col, row, direction);

// 繪製推力影響範圍（2 格推力距離）
const [targetCol, targetRow] = this.calculatePushTarget(col, row, direction, 2);
ctx.fillStyle = 'rgba(255, 102, 34, 0.2)';
ctx.fillRect(targetCol * T, targetRow * T, T, T);
```

### 12.3 陷阱效率分析

**在 Side Panel 顯示陷阱評估：**

```
┌─────────────────────────────────┐
│ 🔧 陷阱放置評估                  │
│ ─────────────────────────       │
│ 位置: (5, 8)                    │
│ 類型: 電擊板                    │
│                                 │
│ ✅ 位置有效                      │
│ ✅ 在敵人路徑上 (傳送門 #1)      │
│ ⚠️ 附近無水池（無法觸發感電）    │
│                                 │
│ 預估效果:                       │
│ • 每波觸發次數: 8-12 次         │
│ • 預估總傷害: 180-240           │
│ • 建議: 在前方放置水池以觸發感電 │
│ ─────────────────────────       │
│ [放置陷阱] [取消]               │
└─────────────────────────────────┘
```

### 12.4 陷阱放置驗證邏輯

```javascript
DK.LevelEditor.TrapValidator = {
  validatePlacement(trapType, col, row) {
    const result = {
      valid: false,
      warning: null,
      error: null,
      efficiency: 0,  // 0-100 效率評分
      suggestions: []
    };

    // 1. 基本位置檢查
    if (!this.isInBounds(col, row)) {
      result.error = '超出地圖範圍';
      return result;
    }

    const tile = this.currentLayout[row][col];
    const trapDef = DK.TRAP_TYPES[trapType];

    // 2. 地形類型檢查
    if (trapDef.type === 'floor') {
      if (!this.isFloorTile(tile)) {
        result.error = '地板陷阱只能放在地板、水池或草地上';
        return result;
      }
    } else if (trapDef.type === 'wall') {
      if (tile !== 'W') {
        result.error = '牆壁陷阱只能放在牆壁上';
        return result;
      }
      if (!this.hasAdjacentFloor(col, row)) {
        result.error = '牆壁陷阱必須相鄰至少一個地板格';
        return result;
      }
    }

    // 3. 通過基本檢查
    result.valid = true;

    // 4. 效率分析
    const onEnemyPath = this.isOnAnyEnemyPath(col, row);
    if (!onEnemyPath) {
      result.warning = '陷阱不在任何敵人路徑上，效果可能有限';
      result.efficiency = 20;
    } else {
      result.efficiency = 80;
    }

    // 5. 元素反應檢查（電擊板 + 水池）
    if (trapType === 'shock_plate') {
      const nearbyWater = this.hasNearbyWater(col, row, 2);
      if (!nearbyWater) {
        result.suggestions.push('在附近放置水池以觸發「感電」效果');
        result.efficiency -= 10;
      } else {
        result.efficiency += 15;
      }
    }

    // 6. 油漬陷阱 + 火元素英雄
    if (trapType === 'oil_trap') {
      const hasFireHero = this.levelHasFireHero();
      if (hasFireHero) {
        result.suggestions.push('已配置火元素英雄，可升級為「油焰陷阱」');
        result.efficiency += 20;
      }
    }

    // 7. 推力陷阱 + 深淵
    if (trapType === 'push_trap') {
      const pushDirection = this.calculatePushDirection(col, row);
      const pushTarget = this.calculatePushTarget(col, row, pushDirection, 2);
      if (this.currentLayout[pushTarget.row][pushTarget.col] === 'O') {
        result.suggestions.push('推力方向為深淵，可直接秒殺敵人！');
        result.efficiency = 100;
      }
    }

    return result;
  },

  isOnAnyEnemyPath(col, row) {
    // 檢查 (col, row) 是否在任一傳送門的路徑上
    for (const [portalId, pathData] of DK.LevelEditor.PathPreview.currentPaths) {
      if (pathData.path.some(p => p.col === col && p.row === row)) {
        return true;
      }
    }
    return false;
  },

  hasNearbyWater(col, row, range) {
    for (let dr = -range; dr <= range; dr++) {
      for (let dc = -range; dc <= range; dc++) {
        const nc = col + dc;
        const nr = row + dr;
        if (this.isInBounds(nc, nr) && this.currentLayout[nr][nc] === 'P') {
          return true;
        }
      }
    }
    return false;
  },

  calculatePushDirection(col, row) {
    // 根據相鄰地板位置計算推力方向
    const dirs = [
      { dc: 0, dr: -1, name: 'up' },
      { dc: 1, dr: 0, name: 'right' },
      { dc: 0, dr: 1, name: 'down' },
      { dc: -1, dr: 0, name: 'left' },
    ];

    for (const dir of dirs) {
      const nc = col + dir.dc;
      const nr = row + dir.dr;
      if (this.isInBounds(nc, nr) && this.isFloorTile(this.currentLayout[nr][nc])) {
        return dir.name;
      }
    }

    return 'none';
  }
};
```

### 12.5 陷阱放置模式

**工具欄新增「陷阱放置模式」：**

```
[工具欄]
├─ 畫筆工具（地圖編輯）
├─ 傳送門放置
├─ 地心放置
├─ 🔧 陷阱預覽模式  ← 新增
└─ [測試關卡]
```

**進入陷阱預覽模式後：**
1. 地圖上所有傳送門路徑自動顯示
2. 使用者選擇陷阱類型（下拉選單）
3. Hover 地圖時顯示陷阱放置預覽（綠/黃/紅邊框）
4. 點擊放置陷阱標記（'T' tile 或自訂標記）
5. Side Panel 即時更新陷阱評估資訊

### 12.6 批量陷阱放置測試

**「測試模式」功能：**
- 點擊工具欄的 [測試關卡] 按鈕
- 系統自動：
  1. 載入當前關卡配置
  2. 生成所有傳送門的波次
  3. 顯示陷阱實際觸發效果（highlight 觸發的陷阱）
  4. 統計每個陷阱的觸發次數、總傷害
- 測試結束後顯示報告：

```
┌─────────────────────────────────────┐
│ 📊 陷阱效果測試報告                  │
│ ───────────────────────────         │
│ 測試波次: 3 波 (共 45 敵人)          │
│                                     │
│ 陷阱統計:                           │
│ • 電擊板 (5, 8): 觸發 12 次, 216 傷害│
│ • 推力陷阱 (8, 4): 推入深淵 3 次    │
│ • 油漬陷阱 (10, 9): 觸發 8 次       │
│                                     │
│ 建議:                               │
│ ⚠️ 電擊板 (12, 10) 未觸發，建議移除 │
│ ✅ 推力陷阱配置完美，保持現狀        │
│ ───────────────────────────         │
│ [重新測試] [關閉]                   │
└─────────────────────────────────────┘
```

---

## 十三、技術注意事項

### 13.1 與現有系統整合

- **相容性**：與現有 `DK.LEVELS` 資料結構相容，新增 `portals` 欄位
- **向下相容**：如果 level 中沒有 `portals`，則從 `waves` 轉換為單一 Portal
- **Canvas 渲染**：在地圖上渲染傳送門標記（'E' tile）、陷阱預覽疊加層

### 13.2 效能考量

- **大量 Portal**：若單一關卡有 >10 個 Portal，考慮虛擬滾動
- **即時驗證**：使用 debounce (300ms) 避免頻繁驗證
- **路徑計算**：使用 Web Worker 避免阻塞 UI（針對複雜地圖）
- **Canvas 分層**：地圖層、路徑預覽層、陷阱預覽層分離，減少重繪

### 13.3 瀏覽器相容性

- **目標瀏覽器**：Chrome 90+, Firefox 88+, Safari 14+
- **Canvas API**：使用標準 2D context，避免實驗性 API
- **CSS**：避免使用 CSS Grid 的進階特性（IE 不支援）

---

## 十二、附錄：JSON 格式範例

### 完整關卡配置範例

```json
{
  "id": 1,
  "name": "破牆試煉",
  "description": "學習破除路障與埋設障礙物的基礎技能",
  "layout": [
    "OOOOOOOOOOOOOOOOOOOO",
    "OWWWWWWWBBWWWWWWWWWO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........WW......WO",
    "OW........HH......WO",
    "OW........WW......WO",
    "OWWWWWWWWWWWWWWWWWWO",
    "OOOOOOOOOOOOOOOOOOOO"
  ],
  "portals": [
    {
      "id": 1,
      "x": 2,
      "y": 5,
      "waves": [
        {
          "enemies": [
            { "type": "GOBLIN", "count": 10, "interval": 500, "gold": 10 }
          ]
        },
        {
          "enemies": [
            { "type": "GOBLIN", "count": 8, "interval": 500, "gold": 10 },
            { "type": "SKELETON", "count": 6, "interval": 800, "gold": 15 }
          ]
        }
      ]
    }
  ],
  "startingGold": 1000,
  "dungeonHeartHP": 50,
  "waveDelay": 5000,
  "waveAutoDelay": 3000
}
```

---

## 設計完成

本設計文件已完成 **第 1-5 次迭代**，涵蓋：

### 核心功能（迭代 1）
✅ UI 架構選擇（Side Panel + Modal）
✅ 完整的 Portal 與 Wave 編輯流程
✅ 雙 Tab 設計（波次配置 + 全局參數）
✅ 技術實作建議（資料結構、狀態管理、驗證函式）

### 表單驗證（迭代 2）
✅ 即時驗證與提交驗證
✅ 錯誤訊息設計
✅ 資料完整性檢查
✅ 陷阱有效性檢查邏輯

### 進階功能（迭代 3）
✅ 批量匯入/匯出 JSON 配置
✅ 配置預覽與總覽（總敵人數、預估難度）
✅ 波次順序調整（拖曳排序）
✅ 多傳送門路徑顯示
✅ 陷阱效率分析

### 視覺設計（迭代 4）
✅ 統一配色與字型（符合 DK.COLORS 與 DK.FONTS）
✅ Hover、Focus、Active 狀態設計
✅ 動畫效果（展開/折疊、Modal 淡入）
✅ 路徑預覽視覺效果（虛線、箭頭、節點、顏色編碼）
✅ 陷阱放置視覺回饋（綠/黃/紅邊框）

### 預覽系統（迭代 5）
✅ **敵人路徑預覽系統**
  - BFS 路徑計算（複用 DK.Heroes.findPath 邏輯）
  - 即時路徑渲染（Canvas 疊加層）
  - 路徑狀態標示（綠/黃/紅）
  - 多傳送門路徑顯示（不同顏色）
  - 路徑資訊面板（長度、行走時間、經過地形）

✅ **陷阱放置預覽系統**
  - 陷阱有效性檢查（位置、地形類型、相鄰條件）
  - 陷阱覆蓋範圍預覽（地板陷阱、牆壁陷阱）
  - 陷阱效率分析（是否在敵人路徑上、元素反應檢查）
  - 陷阱放置模式（工具欄整合）
  - 測試模式（批量陷阱放置測試、效果報告）

### 技術細節
✅ UI 樣式指引（按鈕、輸入框、Modal CSS）
✅ 互動流程範例（新增傳送門、複製波次、匯入 JSON）
✅ JSON 格式範例
✅ 效能優化建議（debounce、Web Worker、Canvas 分層）

### 後續迭代規劃（迭代 6-10）
- 易用性改善（鍵盤快捷鍵、Undo/Redo）
- 效能優化（Web Worker 路徑計算）
- 無障礙設計（ARIA 標籤）
- 多語言支援
- 匯出為圖片/PDF

---

## 設計交付物

**主要文件：**
- `/docs/level-editor/wave-config-ui-design.md`（本文件）

**核心功能：**
1. 波次配置 UI（Portal 清單、Wave Editor Modal）
2. 全局參數設定 UI（起始金幣、地心 HP 等）
3. 敵人路徑預覽系統（BFS 路徑計算、Canvas 渲染）
4. 陷阱放置預覽系統（有效性檢查、效率分析、測試模式）
5. 表單驗證與錯誤處理

**技術實作清單：**
- `DK.LevelEditor`：主要狀態管理物件
- `DK.LevelEditor.PathPreview`：路徑預覽模組
- `DK.LevelEditor.TrapValidator`：陷阱驗證模組
- `DK.LevelValidator`：關卡驗證函式庫
- Modal 實作（原生 DOM）
- Canvas 分層渲染（地圖層、路徑層、陷阱層）

---

**設計者：** ui-designer-2
**版本：** v2.0 (第 1-5 次迭代完成)
**日期：** 2026-02-10
**專案：** ProjectDK - Dungeon Keep 關卡編輯器

**狀態：** ✅ 設計完成，可進入實作階段
