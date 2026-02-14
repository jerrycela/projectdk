# ProjectDK 優化專案：從三種模式到固定 DW3 風格的設計決策

## 概述

在 2026-02-12 的夜間優化工作中，我們完成了 ProjectDK 的視覺系統優化，並在實作過程中發現了一個重要的設計偏差：Team Lead-2 實作了三種視覺模式（Simple/Standard/Fancy），但這不符合用戶的明確要求。我們立即修正為「固定 DW3 單一優化版本」，體現了 Dungeon Warfare 3 的設計理念。

## 詳細內容

### 背景：用戶需求

用戶在計畫階段明確要求：

**選項 A：直接固定使用某個模式（例如 Standard）**

並強調：「直接實作符合 DW3 理念的單一優化版本，不需要讓玩家選擇模式」

這個需求背後的設計理念來自 Dungeon Warfare 3（2025 年發布的標竿遊戲），核心原則是：

- **Refined（精煉）**：精緻而非複雜
- **Clarity（清晰）**：UI 清爽、功能明確
- **Polished（流暢）**：重點元素才有動畫
- **Vivid（鮮豔）**：高對比、易辨識
- **Atmospheric（氛圍感）**：有氣氛但不雜亂
- **Not cluttered（不雜亂）**：留白空間充足

核心設計理念：「在黑暗地牢中，只看見重要的東西」

### 實作偏差

Team Lead-2 在實作時，創建了完整的三種模式系統：

**DK.VISUAL_PRESETS 三種模式**：
- **Simple**：極簡效能（大部分效果關閉）
- **Standard**：平衡模式（部分開啟，強度 40-50%）
- **Fancy**：華麗模式（全部開啟，100% 強度）

**配套功能**：
- `applyPreset()` 方法（模式切換）
- `updateCustom()` 方法（自訂設定）
- 模式切換 UI（在開始畫面）

這個實作方案本身設計得很好，提供了彈性和選擇。但這不符合用戶的需求。

### 發現與修正

我在收到 Team Lead-2 的完成通知後，立即檢查了實際實作內容，發現了這個偏差。由於用戶已經休息，並明確說「不要再請我確認東西了」，我做出了自主決策：立即修正為固定 DW3 風格。

**修正內容**：

**1. js/config.js**
- 移除 `DK.VISUAL_PRESETS`（三種模式定義）
- 移除 `currentPreset` 屬性
- 移除 `applyPreset()` 和 `updateCustom()` 方法
- 改為固定的 DW3 風格參數（等同於 Standard 模式的值）
- 簡化 `isEnabled()` 方法：`return this[feature]`

**新的 DK.VISUAL_SETTINGS 結構**：

```javascript
DK.VISUAL_SETTINGS = {
  // 環境光效（體現 DW3 的 Atmospheric but not cluttered）
  vignette: true,              // 保留，但強度降低至 0.6
  ambientOcclusion: false,     // 關閉，效能成本高

  // 動畫效果（體現 DW3 的 Polished）
  torchFlicker: true,          // 核心元素，保留
  puddleAnimation: true,       // 保留但優化
  portalSwirl: true,           // 核心元素，保留
  heartPulse: true,            // 核心元素，保留
  grassAnimation: true,
  abyssAnimation: true,

  // 粒子系統（體現 DW3 的 Not cluttered）
  particleEffects: true,
  particleDensity: 0.7,        // 降低 30%，避免雜亂

  // 後處理效果（體現 DW3 的 Clarity）
  bloomEffect: false,          // 關閉，避免過度發光
  colorGrading: true,

  // 進階渲染（體現 DW3 的 Refined）
  gradientLighting: true,
  smoothShading: false,        // 關閉，效能成本高
  detailTextures: true,

  // 特效強度（體現 DW3 的降低 40-50% 理念）
  glowIntensity: 0.5,          // ↓50%
  shadowIntensity: 0.6,        // ↓40%
  vignetteIntensity: 0.6,      // ↓40%
  warmOverlayIntensity: 0.5,   // ↓50%
  animationSpeed: 1.0,

  isEnabled(feature) {
    return this[feature];
  },
};
```

**2. js/map/map-render.js**
修正水潭動畫優化，將依賴 `currentPreset` 的條件改為固定啟用：

```javascript
// 修改前
const isStandardMode = DK.VISUAL_SETTINGS.currentPreset === 'standard';
if (isStandardMode && this._poolAnimFrame % 2 !== 0) {
  return;
}

// 修改後
// DW3 優化：固定啟用隔幀更新
if (this._poolAnimFrame % 2 !== 0) {
  return;
}
```

**3. js/ui.js**
確認模式切換 UI 已被註解移除（Team Lead-2 已處理）。

### 設計決策的理由

**為什麼固定使用單一模式，而非提供選擇？**

1. **符合用戶明確需求**：用戶在計畫階段已經明確選擇「選項 A」，不需要模式選擇。

2. **遵循 DW3 設計理念**：
   - DW3 沒有提供「簡單/標準/華麗」模式選擇
   - 而是直接提供一個「refined & polished」的視覺體驗
   - 玩家不需要在「效能 vs 視覺」之間做取捨

3. **降低認知負擔**：
   - 模式選擇會讓玩家產生「我是不是應該切換模式？」的疑問
   - 固定模式讓玩家專注於遊戲本身，而非設定調整

4. **維護成本**：
   - 三種模式需要分別測試和維護
   - 固定模式只需要維護一套視覺效果

5. **設計一致性**：
   - 遊戲的核心理念是「在黑暗地牢中，只看見重要的東西」
   - 這本身就是一個明確的設計決策，不需要提供「看見所有東西」的選項

### 完成項目

**功能實作**：
- ✅ 填充工具功能實作（`js/editor/editor-main.js`）
- ✅ Undo/Redo 深拷貝修復（`js/editor/editor-tools.js`）
- ✅ 視覺系統改為固定 DW3 風格（`js/config.js`）
- ✅ 渲染管線條件化（`js/map/map-render.js`, `js/main.js`）
- ✅ 水潭動畫效能優化（隔幀更新 + MathCache）

**QA 驗證**（執行中）：
- 🔄 填充工具 Chrome 實測
- 🔄 Undo/Redo Chrome 實測
- 🔄 DW3 視覺風格驗證
- 🔄 效能驗證（Chrome DevTools Performance）

### 關鍵教訓

**1. 團隊溝通的重要性**
- 關鍵需求必須在任務描述中反覆強調
- 「不需要模式選擇」這個需求應該在 Task subject 中明確標註

**2. 及時發現和修正**
- 完成通知不等於正確完成，必須驗證實際成果
- 發現偏差後立即修正，避免浪費時間

**3. 自主決策的平衡**
- 當用戶需求明確時，可以自主決策
- 當需求模糊時，必須請示

**4. 設計理念的重要性**
- 技術實作必須服務於設計理念
- DW3 的「在黑暗地牢中，只看見重要的東西」不只是視覺風格，更是設計哲學

## 相關資訊

- **日期**：2026-02-12
- **專案**：ProjectDK（地層塔防遊戲）
- **標籤**：ProjectDK, 視覺優化, 設計決策, DW3, Agent-Teams, 2026-02
- **檔案修改**：
  - `js/config.js`（-150 行，+80 行）
  - `js/editor/editor-main.js`（+15 行）
  - `js/editor/editor-tools.js`（~6 行）
  - `js/map/map-render.js`（~30 行）
  - `js/main.js`（~10 行）
- **參考資料**：
  - Dungeon Warfare 3：https://store.steampowered.com/app/3419220/Dungeon_Warfare_3/
  - 夜間工作摘要：`docs/overnight-work-summary-2026-02-12.md`
  - 最終測試報告：`docs/optimization-final-report-2026-02-12.md`（產出中）
