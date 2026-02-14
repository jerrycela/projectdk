# ProjectDK 全面回歸測試報告

## 執行摘要

- **測試日期**：2026-02-11
- **測試範圍**：核心 gameplay + UI + 視覺 + 最近修改 + 自動化品質檢查
- **發現問題**：3 個 Critical, 3 個 High, 4 個 Medium, 2 個 Low
- **測試方法**：靜態程式碼分析 + 跨檔案引用追蹤 + 語法驗證

---

## Critical 問題（遊戲功能中斷）

### CRIT-001: `DK.ENEMIES` 未定義 - 波次預覽面板崩潰

- **嚴重程度**：Critical
- **影響**：波次預覽面板（Planning 階段顯示）嘗試讀取 `DK.ENEMIES[e.type]` 但此物件從未定義。Config 中定義的是 `DK.ENEMY_TYPES`。
- **位置**：
  - `/js/game.js` 第 467 行：`const enemyType = DK.ENEMIES[enemyGroup.type];`
  - `/js/main.js` 第 363 行：`const enemyType = DK.ENEMIES[enemyGroup.type];`
  - `/js/main.js` 第 407 行：`const enemyType = DK.ENEMIES[e.type];`
- **重現步驟**：進入 Planning 階段，觀察波次預覽面板
- **預期行為**：顯示敵人名稱（劍士、弓手、騎士、盜賊）
- **實際行為**：`DK.ENEMIES` 為 `undefined`，所有敵人名稱顯示為原始類型名（GOBLIN、SKELETON 等），難度計算結果始終為 'easy'（因為 HP 計算回退到預設值 30）
- **修復建議**：將所有 `DK.ENEMIES[e.type]` 改為 `DK.ENEMY_TYPES[e.type]`

### CRIT-002: `DK.FONTS.normal` 未定義 - 波次預覽面板 TypeError

- **嚴重程度**：Critical
- **影響**：波次預覽渲染函式呼叫 `DK.FONTS.normal(14)` 和 `DK.FONTS.normal(12)`，但 `DK.FONTS` 物件中只有 `title`, `body`, `bold`, `heavy`, `pixel` 方法，**沒有 `normal`**。這會拋出 `TypeError: DK.FONTS.normal is not a function`，導致整個波次預覽面板無法渲染。
- **位置**：
  - `/js/main.js` 第 357 行：`ctx.font = DK.FONTS.normal(14);`
  - `/js/main.js` 第 401 行：`ctx.font = DK.FONTS.normal(12);`
- **重現步驟**：進入 Planning 階段，波次預覽面板嘗試渲染時
- **預期行為**：正常顯示文字
- **實際行為**：`TypeError` 中斷渲染，波次預覽面板部分或全部不顯示
- **修復建議**：將 `DK.FONTS.normal(size)` 改為 `DK.FONTS.body(size)`

### CRIT-003: 波次預覽敵人顏色映射表大小寫不匹配

- **嚴重程度**：Critical（與 CRIT-001 連帶問題）
- **影響**：`getEnemyColor()` 函式使用小寫鍵（`goblin`, `orc`, `troll`, `golem`），但 `DK.WAVES` 中的敵人類型名使用大寫（`GOBLIN`, `SKELETON`, `ORC`, `SLIME`）。導致所有敵人顏色都退回預設灰色 `#cccccc`。此外，`SKELETON` 和 `SLIME` 類型完全缺失於映射表中。
- **位置**：`/js/main.js` 第 480-489 行
- **修復建議**：
  ```javascript
  const colorMap = {
    GOBLIN: '#44ff44',
    SKELETON: '#aaddff',
    ORC: '#ff8844',
    SLIME: '#aa88ff',
  };
  ```

---

## High 問題（嚴重影響體驗）

### HIGH-001: 缺少 `cursor-grabbing` CSS 類別 - 拖曳時游標不變化

- **嚴重程度**：High
- **影響**：地圖拖曳平移時，游標應顯示為抓取手勢，但 CSS 中未定義 `.cursor-grabbing` 規則。
- **位置**：
  - 使用處：`/js/ui.js` 第 710-712 行
  - 缺失處：`/css/style.css` 中沒有 `#ui-canvas.cursor-grabbing` 規則
- **修復建議**：在 `style.css` 添加：
  ```css
  #ui-canvas.cursor-grabbing {
    cursor: grabbing;
  }
  ```

### HIGH-002: `drawTextWithOutline` 3px 圓形描邊性能問題

- **嚴重程度**：High（性能）
- **影響**：`drawTextWithOutline` 使用 7x7 = 49 次迭代加上 `Math.sqrt` 判斷繪製圓形描邊。每個文字呼叫最多繪製約 28 次 `fillText`。該函式在 HUD、按鈕、波次公告等處頻繁呼叫（至少 15+ 次/幀），對低端裝置造成性能壓力。
- **位置**：`/js/ui.js` 第 1425-1438 行
- **建議**：
  1. 減少描邊次數（改為 4 方向或 8 方向）
  2. 或使用 `ctx.strokeText` + `lineWidth` 替代手動像素描邊
  3. 或快取描邊結果到離屏 canvas

### HIGH-003: `ui-core.js` 檔案存在但未被載入

- **嚴重程度**：High（維護風險）
- **影響**：`/js/ui/ui-core.js` 包含與 `/js/ui.js` 完全重複的 DK.FONTS 和 DK.UI 定義。此檔案**未在 `index.html` 中載入**，但如果被誤加載將覆蓋整個 UI 系統。
- **位置**：`/js/ui/ui-core.js`（152 行文件與 ui.js 前段完全重複）
- **修復建議**：刪除此檔案，或將其完成為正式的模組化拆分

---

## Medium 問題（影響但可繞過）

### MED-001: Sound 系統 console.log 未完全包裝在 DEBUG_MODE 中

- **嚴重程度**：Medium
- **影響**：`/js/sound.js` 第 122 行的 `console.log` 在 placeholder 模式下每次播放音效都會輸出，即使 `DK.DEBUG_MODE = false`。雖然有 `this.debugMode` 檢查，但 `debugMode` 預設為 `true`。
- **位置**：`/js/sound.js` 第 118-122 行
- **修復建議**：將 `this.debugMode` 預設改為 `false`，或加上 `DK.DEBUG_MODE` 雙重檢查

### MED-002: Map 模組 console.log 傳送門載入訊息

- **嚴重程度**：Medium
- **影響**：`/js/map/map-core.js` 第 220、230 行的 console.log 雖有 `DK.DEBUG_MODE` 檢查，但使用了 emoji 符號（🌀），可能在某些終端環境下顯示異常。
- **位置**：`/js/map/map-core.js` 第 220、230 行

### MED-003: 門系統初始化未檢查 `levelData` 參數

- **嚴重程度**：Medium
- **影響**：`DK.Doors.init(levelData)` 在第 16 行檢查 `levelData.layout`，但如果 `levelData` 本身為 `null` 或 `undefined`，會拋出 TypeError。
- **位置**：`/js/doors.js` 第 13-16 行
- **修復建議**：加入 `if (!levelData || !levelData.layout) return;`

### MED-004: 波次自動倒數 UI 文字在非戰鬥狀態顯示不準確

- **嚴重程度**：Medium
- **影響**：在 `invasion` 階段，波次按鈕顯示邏輯中，當 `waveAutoTimer > 0` 時顯示倒數，但 `waveActive` 為 `false` 且 `waveAutoTimer <= 0` 時顯示「等待中...」，這個狀態在正常流程中不應出現但缺乏防護。
- **位置**：`/js/ui.js` 第 1073-1086 行

---

## Low 問題（輕微問題）

### LOW-001: `map-core.js` 的 `breakWall()` deprecated 方法仍使用裸 console.warn

- **嚴重程度**：Low
- **影響**：`/js/map/map-core.js` 第 509 行的 `console.warn` 沒有包裝在 `DK.DEBUG_MODE` 中
- **位置**：`/js/map/map-core.js` 第 509 行

### LOW-002: `ui.js.backup` 備份檔案遺留在專案中

- **嚴重程度**：Low
- **影響**：`/js/ui.js.backup-20260211-210757` 是一個 2500+ 行的完整備份檔案，佔用空間且可能造成混淆
- **修復建議**：確認不需要後刪除

---

## 通過的測試項目

### 陷阱系統
- [x] **所有 4 種陷阱類型定義完整**（shock_plate, push_trap, oil_trap, wind_trap）
- [x] **陷阱按鈕渲染邏輯正確** - `drawTrapIcon()` 為每種陷阱繪製獨特圖示
- [x] **陷阱放置邏輯完整** - 包含金幣檢查、位置驗證、重複放置檢查
- [x] **陷阱觸發邏輯正確** - 冷卻計時、傷害計算、元素效果
- [x] **油漬區域系統正確** - 區域型觸發、時間限制、油污狀態
- [x] **風壓陷阱推力系統正確** - 質量檢查、深淵秒殺、抵抗動畫
- [x] **陷阱進化系統完整** - 光環配對、進化條件、視覺效果
- [x] **陷阱光暈效果系統完整** - 依元素類型顏色、進化態增強

### 英雄系統
- [x] **英雄類型定義完整**（水法師利維坦、火法師巴爾）
- [x] **英雄按鈕渲染正確** - 元素配色、名稱、費用、屬性顯示
- [x] **英雄部署邏輯正確** - 位置驗證、金幣扣除
- [x] **英雄回收按鈕存在** - `renderHeroRecallButton` 和 `_recallButtonRect`

### UI 系統
- [x] **按鈕系統完整** - 5 種狀態（Normal, Hover, Selected, Disabled, Cooldown）
- [x] **金幣、生命值、波次 HUD 顯示正確**
- [x] **Tooltip 系統整合完整** - 陷阱、英雄、敵人、按鈕四層優先級
- [x] **錯誤通知系統完整** - 彈跳進場動畫、自動消失
- [x] **鍵盤導航完整** - Tab/Shift+Tab 切換、Enter 啟動、Esc 清除、數字鍵快速選擇
- [x] **拖曳平移相機正確** - mouseDown/mouseUp/mouseMove 流程
- [x] **路障放置系統正確** - 選擇模式切換、數量限制顯示
- [x] **撤銷系統整合** - 陷阱放置、進化操作記錄

### 視覺渲染
- [x] **雙 Canvas 架構正確** - 低解析度像素畫 + 高解析度 UI 文字
- [x] **相機偏移正確應用** - 世界空間渲染 + 螢幕空間 vignette
- [x] **傳送門渲染正確** - 2x2 全彩旋渦效果
- [x] **地城之心渲染正確** - 獨立渲染函式
- [x] **粒子效果系統完整** - 浮塵、火焰、閃電等
- [x] **所有效果渲染器完整** - 19+ 種效果類型全部有對應渲染器
- [x] **裝飾物三層渲染系統** - Layer 1/2（地面/牆壁）+ Layer 3（前景）
- [x] **畫面震動效果** - screenShake 系統

### 遊戲流程
- [x] **遊戲狀態機正確** - start → planning → invasion
- [x] **波次生成系統正確** - 10 波定義、混合敵人類型
- [x] **勝利/失敗邏輯正確** - 地城之心 HP 歸零 = 失敗、所有波次通過 = 勝利
- [x] **波次完成獎勵** - 基礎 50 + 波次 * 10
- [x] **自動下一波倒數** - 3 秒後自動開始
- [x] **關卡管理器** - 多關卡支援、下一關自動載入

### 程式碼品質
- [x] **所有 17 個 JS 檔案語法正確** - `node -c` 通過
- [x] **console.log 大部分包裝在 DEBUG_MODE 中**
- [x] **錯誤處理覆蓋度良好** - ErrorHandler 整合到主要流程
- [x] **XSS 防護** - 編輯器使用 `escapeHTML()` 處理用戶輸入
- [x] **getBoundingClientRect 快取正確** - resize 事件更新快取

### 最近修改驗證
- [x] **getBoundingClientRect 快取** - 使用 `let canvasRect` 變數快取，resize 事件更新
- [x] **滑鼠座標計算正確** - 三個事件處理器一致使用 `e.clientX - canvasRect.left`
- [x] **編輯器 XSS 修復** - `escapeHTML()` 已應用到所有用戶輸入的 innerHTML
- [x] **console.log 清理** - 大部分已包裝在條件檢查中

---

## 根本原因分析

### 為什麼之前的 QA 沒有發現這些問題？

1. **CRIT-001/002/003（波次預覽）**：這些問題只在 Planning 階段的波次預覽面板中出現。由於 `DK.FONTS.normal` TypeError 會中斷該特定渲染函式但不會影響主遊戲迴圈（因為 error 被 requestAnimationFrame 的下一幀覆蓋），所以遊戲本身仍可玩，只是波次預覽面板靜默失敗。之前的 QA 可能沒有仔細查看 Console 錯誤訊息。

2. **HIGH-001（cursor-grabbing）**：拖曳功能本身正常運作，只是視覺游標不變化，容易忽略。

3. **MED-003（門系統）**：如果當前關卡有正確的 `layout`，此問題不會觸發。只在特殊邊界條件下出現。

### 電擊陷阱按鈕黑屏問題分析

根據程式碼分析，電擊陷阱按鈕（shock_plate）的渲染邏輯位於 `/js/ui.js` 的 `renderButton()` 方法中（第 1017-1441 行）。按鈕渲染流程：

1. **背景漸層** - 正確：`#241e36` → `#181430`（深紫色漸層）
2. **邊框** - 正確：使用 `C.UI_BORDER`
3. **類型徽章** - 正確：`地` 字（floor type）
4. **陷阱圖示** - 正確：`drawTrapIcon()` 繪製閃電符號（黃色 `#ffdd44`）
5. **名稱文字** - 正確：使用 `C.UI_TEXT`（`#e8e0d0`）
6. **費用文字** - 正確：使用 `C.UI_GOLD`（`#ffd700`）
7. **屬性行** - 正確：傷害 + 雷電符號

**靜態分析未發現按鈕渲染邏輯本身有缺陷。** 如果電擊陷阱按鈕確實顯示全黑，可能的原因有：

- **Canvas 上下文狀態汙染**：某個前序操作（如波次預覽的 TypeError）導致 canvas 上下文進入異常狀態
- **CRIT-002 連鎖效應**：`DK.FONTS.normal is not a function` TypeError 在波次預覽渲染時拋出，可能中斷了後續的 UI 渲染流程
- **按鈕寬度計算問題**：當視窗寬度特殊時，`btnWidth` 計算可能導致按鈕過小

**最可能的原因是 CRIT-002**：波次預覽面板的 TypeError 在 `renderWavePreview` 函式中拋出，如果此函式在 `DK.UI.render()` 之後呼叫（main.js 第 293-295 行確實如此），則不會影響按鈕渲染。但如果在 `DK.UI.render()` 內部呼叫的 `this.renderWavePreview(ctx)`（ui.js 第 830 行）先觸發了錯誤，則會中斷後續所有 UI 渲染。

**需要在瀏覽器中實際測試以確認根本原因。**

---

## 修復優先級建議

### 立即修復（阻礙正常遊戲）

| 優先級 | 問題 | 預估工時 |
|--------|------|----------|
| P0 | CRIT-001: `DK.ENEMIES` → `DK.ENEMY_TYPES` | 5 分鐘 |
| P0 | CRIT-002: `DK.FONTS.normal` → `DK.FONTS.body` | 2 分鐘 |
| P0 | CRIT-003: 敵人顏色映射表大小寫修復 | 5 分鐘 |

### 24 小時內修復

| 優先級 | 問題 | 預估工時 |
|--------|------|----------|
| P1 | HIGH-001: 添加 cursor-grabbing CSS | 2 分鐘 |
| P1 | HIGH-002: drawTextWithOutline 性能優化 | 30 分鐘 |
| P1 | HIGH-003: 刪除或整合 ui-core.js | 10 分鐘 |

### 排程修復

| 優先級 | 問題 | 預估工時 |
|--------|------|----------|
| P2 | MED-001: Sound debugMode 預設值 | 5 分鐘 |
| P2 | MED-002: Map console.log emoji | 2 分鐘 |
| P2 | MED-003: 門系統 null 檢查 | 2 分鐘 |
| P2 | MED-004: 波次按鈕狀態防護 | 5 分鐘 |
| P3 | LOW-001: deprecated breakWall console.warn | 1 分鐘 |
| P3 | LOW-002: 刪除 ui.js.backup 檔案 | 1 分鐘 |

---

## 測試環境

- **平台**：macOS Darwin 24.3.0
- **專案分支**：feat/dungeon-keeper-visual-prototype
- **測試工具**：靜態程式碼分析、Node.js 語法檢查、跨檔案引用追蹤
- **檔案數量**：17 個核心 JS 檔案 + 8 個 Map 模組 + 5 個 Editor 模組
