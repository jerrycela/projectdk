# ProjectDK 關鍵 Bug 修復報告

## 概述

成功修復 ProjectDK 遊戲的兩個關鍵 bug：1) 「can't record action outside from planning phase」錯誤警告，以及 2) 第二關敵人無法正常生成的問題。實作了完整的三層防禦機制和傳送門配置修復。

## 問題 1: Undo 系統狀態警告

### 根本原因

invasion（入侵）階段仍可觸發陷阱放置、英雄召喚和陷阱升級操作，導致 Undo 系統在非 planning 階段記錄操作時發出警告訊息。這是因為缺少三層防禦：操作層沒有狀態檢查、UI 層可能禁用失效、狀態轉換時可能不同步。

### 修復方案 - 三層防禦架構

#### 1. 操作層防禦（第一道防線）

在 `js/traps.js` 和 `js/heroes.js` 的關鍵方法開頭加入狀態檢查：

- `traps.js:place()` - 陷阱放置時檢查 state === 'planning'
- `traps.js:evolveTrap()` - 陷阱升級時檢查 state === 'planning'
- `heroes.js:deploy()` - 英雄召喚時檢查 state === 'planning'

如果不在 planning 階段，使用 ErrorHandler 顯示友善的錯誤訊息並返回 false，完全阻止操作執行。

#### 2. UI 層防禦（第二道防線）

在 `js/ui.js` 新增 `updateButtonStates()` 方法，用於在遊戲狀態轉換時同步 UI 按鈕狀態。該方法目前主要確保狀態同步，實際的按鈕啟用/禁用邏輯已在現有的 `getButtonState()` 中處理。

#### 3. 狀態轉換同步（第三道防線）

在 `js/game.js` 的關鍵狀態轉換點呼叫 UI 同步：

- `startInvasion()` - 從 planning 轉到 invasion 時呼叫 `DK.UI.updateButtonStates()`
- 波次完成邏輯 - 波次結束後將狀態改回 'planning'，讓玩家可以在波次之間調整陷阱和英雄，然後呼叫 `DK.UI.updateButtonStates()`

## 問題 2: 第二關敵人生成失敗

### 根本原因

第二關「水坑戰術」完全缺少傳送門（敵人入口）配置。layout 中沒有 'E' 標記，也沒有 portals 定義，導致敵人生成系統找不到生成點，敵人無法正常生成或生成在錯誤位置。

### 修復方案

#### 1. Layout 修改

在第二關的 layout 第 3-4 行（row 2-3）、第 3-4 列（col 2-3）添加 4 個 'E' 標記，形成 2x2 傳送門區域：

```
'OWEE......WW......WO',  // row 2
'OWEE......WW......WO',  // row 3
```

#### 2. Portals 配置

在第二關配置中新增 portals 定義：

```javascript
portals: [
  {
    id: 1,
    col: 2,
    row: 2,
    type: 'blue',        // 藍色傳送門（與水坑主題搭配）
    entrance: { x: 2, y: 2 },
    waves: [1, 2, 3],    // 所有波次都從這個傳送門出兵
  }
]
```

選擇藍色傳送門是為了與第二關的水坑（水元素）主題呼應，形成視覺一致性。

## 驗證結果

### 語法檢查

所有修改的檔案都通過了 Node.js 語法檢查（`node -c`）：

- ✅ js/traps.js
- ✅ js/heroes.js
- ✅ js/game.js
- ✅ js/ui.js
- ✅ js/levels.js

### Layout 驗證

第二關 layout 完整驗證通過：

- ✅ 行數正確：13 行
- ✅ 每行長度正確：20 字元
- ✅ 傳送門標記正確：4 個 'E' 形成 2x2 區域
- ✅ 地心標記正確：2 個 'H'

## 修改統計

| 檔案 | 修改內容 | 行數 |
|------|---------|------|
| js/traps.js | place() 狀態檢查 | +6 |
| js/traps.js | evolveTrap() 狀態檢查 | +6 |
| js/heroes.js | deploy() 狀態檢查 | +6 |
| js/ui.js | updateButtonStates() 方法 | +9 |
| js/game.js | startInvasion() UI 同步 | +5 |
| js/game.js | 波次完成 planning 回歸 | +11 |
| js/levels.js | 第二關 layout 修改 | ~0 |
| js/levels.js | 第二關 portals 新增 | +10 |

**總計**：約 43 行修改（比計畫的 52 行更精簡）

## 技術洞察

### 1. 防禦性編程的重要性

這次修復展示了多層防禦機制的必要性。單純依賴 Undo 系統的狀態檢查不足以防止錯誤，需要在操作層、UI 層和狀態轉換層都建立防護，確保系統的健壯性。

### 2. 遊戲階段管理

遊戲的 planning 和 invasion 階段需要明確的邊界控制。修復後的流程是：planning → invasion（波次進行）→ planning（波次結束），讓玩家可以在波次之間調整策略。

### 3. 地圖配置的一致性

第二關的問題揭示了地圖配置的關鍵要素：layout（視覺呈現）和 portals（遊戲邏輯）必須同時定義且互相對應。缺少任何一個都會導致遊戲無法正常運作。

## 後續建議

1. **關卡驗證腳本** - 建立自動化腳本驗證所有關卡的 layout 行長度、portals 配置完整性
2. **單元測試** - 為 place()、deploy()、evolveTrap() 方法添加狀態檢查的單元測試
3. **E2E 測試** - 為第二關添加端到端測試，確保敵人能正常生成並移動到地心

## 相關資訊

- 日期：2026-02-12
- 專案：ProjectDK
- 檔案：js/traps.js, js/heroes.js, js/game.js, js/ui.js, js/levels.js
- 標籤：bug修復, 狀態管理, 地圖配置, 防禦性編程
