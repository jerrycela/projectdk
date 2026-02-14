# 緊急修復報告：電擊陷阱按鈕黑色問題

**日期**：2026-02-11
**優先級**：Critical Gameplay Blocking Bug
**狀態**：診斷中

---

## 問題描述

用戶報告：進入遊戲後，左下角第一個陷阱按鈕（電擊陷阱/推力陷阱）**完全是黑色的**，無法點擊選擇。其他陷阱按鈕（油漬、風壓）顯示正常。

---

## 診斷步驟

### 1. 程式碼檢查 ✅

已完成以下檢查：

- ✅ **語法檢查**：`ui.js` 語法正確，無語法錯誤
- ✅ **陷阱定義完整性**：`DK.TRAP_TYPES` 包含 4 個陷阱，定義完整
  - SHOCK_PLATE (id: 'shock_plate') - 電擊板
  - PUSH_TRAP (id: 'push_trap') - 推力陷阱
  - OIL_TRAP (id: 'oil_trap') - 油漬陷阱
  - WIND_TRAP (id: 'wind_trap') - 風壓陷阱
- ✅ **drawTrapIcon 函式**：包含所有 4 個 case，現已添加 default case
- ✅ **按鈕初始化**：`buildButtons()` 正確使用 `Object.values(DK.TRAP_TYPES)`
- ✅ **按鈕渲染邏輯**：`renderButton()` 正確呼叫 `drawTrapIcon()`

### 2. 可能的原因分析

#### 原因 A：瀏覽器快取（最可能）

**症狀**：用戶可能載入了舊版本的 `ui.js`，其中 `drawTrapIcon` 函式不完整或有錯誤。

**解決方案**：強制刷新瀏覽器（Cmd+Shift+R 或 Ctrl+Shift+R）

#### 原因 B：JavaScript 執行錯誤

**症狀**：某個 JavaScript 錯誤導致按鈕渲染中斷。

**診斷方法**：檢查 Console 是否有錯誤訊息。

#### 原因 C：Canvas 上下文狀態問題

**症狀**：Canvas 上下文被破壞，導致 fillStyle 無效。

**影響**：最近修改的 `getBoundingClientRect` 快取不應影響渲染，但需要驗證。

#### 原因 D：陷阱 ID 不匹配

**症狀**：`btn.trap.id` 與 switch case 不匹配，導致沒有執行任何 case。

**修復**：已添加 default case 繪製紅色警告框。

---

## 已實施的修復

### 1. 添加 default case（預防性修復）

**檔案**：`js/ui.js`
**行數**：1027-1039

```javascript
default:
  // 未知陷阱 ID：繪製紅色警告框
  if (DK.DEBUG_MODE) {
    console.error(`[UI] 未知的陷阱 ID: ${trapId}`);
  }
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('?', x + hs, y + hs + 3);
  break;
```

**效果**：如果陷阱 ID 不匹配任何 case，會繪製紅色方框和問號，便於識別。

### 2. 添加診斷日誌（DEBUG_MODE）

**檔案**：`js/ui.js`

**位置 1**：`renderButton()` 開頭（行 1033-1036）
```javascript
if (DK.DEBUG_MODE && btn.trap) {
  console.log(`[UI] renderButton: ${btn.trap.name} (id: ${btn.trap.id}), trap object:`, btn.trap);
}
```

**位置 2**：呼叫 `drawTrapIcon` 之前（行 1345-1348）
```javascript
if (DK.DEBUG_MODE) {
  console.log(`[UI] 渲染陷阱圖標: ${btn.trap.name} (id: ${btn.trap.id}) at (${btn.x + btn.width - 28}, ${btn.y + 2})`);
}
```

**位置 3**：`drawTrapIcon` 函式內 shock_plate case（行 963-965）
```javascript
if (DK.DEBUG_MODE) {
  console.log(`[UI] 繪製 shock_plate 圖標: x=${x}, y=${y}, size=${s}`);
}
```

**效果**：在 Console 中顯示詳細的渲染資訊，幫助診斷問題。

### 3. 創建診斷工具

**檔案**：`emergency-diag.html`

**功能**：
- 測試 1：基本圖標渲染（4 個陷阱圖標）
- 測試 2：完整按鈕渲染（模擬實際遊戲）
- 測試 3：Canvas 狀態測試（save/translate/restore）

**使用方法**：
1. 在瀏覽器中開啟 `http://localhost:8001/emergency-diag.html`
2. 點擊按鈕執行各項測試
3. 檢查 Canvas 和日誌輸出

---

## 測試驗證

### 步驟 1：清除快取並重新載入

1. 開啟遊戲：`http://localhost:8001/index.html`
2. 開啟 DevTools（Cmd+Option+I 或 F12）
3. 強制刷新（Cmd+Shift+R 或 Ctrl+Shift+R）
4. 檢查 Console 是否有錯誤或診斷日誌

### 步驟 2：檢查電擊陷阱按鈕

預期結果：
- ✅ 電擊陷阱按鈕顯示深紫色背景（#241e36 到 #181430 漸變）
- ✅ 左上角顯示「地」徽章（綠色背景 #3e5a3e）
- ✅ 右上角顯示閃電圖標（黃色 #ffdd44）
- ✅ 中間顯示「● 電擊板」文字
- ✅ 下方顯示「⚙ 45 金」和「傷害:18 ⚡」
- ⚠️ **臨時測試**：圖標周圍有洋紅色邊框（#ff00ff）

### 步驟 3：檢查 Console 日誌

預期日誌（DEBUG_MODE = true）：
```
[UI] renderButton: 電擊板 (id: shock_plate), trap object: {id: 'shock_plate', ...}
[UI] 渲染陷阱圖標: 電擊板 (id: shock_plate) at (94, 15)
[UI] 繪製 shock_plate 圖標: x=94, y=15, size=22
```

### 步驟 4：使用診斷工具

如果遊戲中仍有問題，請使用診斷工具：

1. 開啟 `http://localhost:8001/emergency-diag.html`
2. 執行測試 1、2、3
3. 檢查 Canvas 是否正確顯示所有陷阱圖標
4. 檢查日誌是否有錯誤訊息

---

## 如果問題仍然存在

### 情境 A：所有測試工具都正常，但遊戲中仍是黑色

**可能原因**：
1. 其他 JavaScript 檔案衝突
2. CSS 覆蓋了 Canvas
3. Canvas 層級問題（被其他元素遮擋）

**進一步診斷**：
- 檢查 `main.js` 中的 `canvasRect` 快取是否影響渲染
- 檢查 `index.html` 中的 Canvas 結構
- 檢查 CSS 是否有 `pointer-events: none` 或 `z-index` 問題

### 情境 B：診斷工具也顯示黑色或沒有圖標

**可能原因**：
1. `DK.TRAP_TYPES` 未正確載入
2. `drawTrapIcon` 函式執行時 Canvas 上下文無效
3. 瀏覽器 Canvas API 問題

**進一步診斷**：
- 檢查 `js/config.js` 是否在 `js/ui.js` 之前載入
- 檢查 `index.html` 中的 `<script>` 標籤順序
- 嘗試不同瀏覽器（Chrome、Firefox、Safari）

---

## 清理修復（完成後）

當問題解決後，需要清理臨時的診斷代碼：

### 1. 移除洋紅色邊框測試

**檔案**：`js/ui.js`
**行數**：965-968

移除或註解掉：
```javascript
// 測試：繪製一個明亮的邊框確認函式被呼叫
ctx.strokeStyle = '#ff00ff'; // 洋紅色
ctx.lineWidth = 2;
ctx.strokeRect(x, y, s, s);
```

### 2. 可選：移除或保留診斷日誌

診斷日誌已包裹在 `if (DK.DEBUG_MODE)` 中，可以選擇：
- **保留**：方便未來診斷問題
- **移除**：減少代碼量（但不建議）

建議：**保留診斷日誌**，因為它們不會影響正常運行（DEBUG_MODE = false 時不執行）。

### 3. 可選：移除診斷工具檔案

如果不再需要，可以刪除：
- `emergency-diag.html`
- `test-button-render.html`
- `test-icon-render.html`
- `check-ui-errors.cjs`

---

## 總結

### 已完成

- ✅ 添加 default case 到 `drawTrapIcon()`
- ✅ 添加詳細的診斷日誌
- ✅ 創建獨立的診斷工具
- ✅ 檢查所有相關代碼的完整性

### 等待驗證

- ⏳ 用戶清除快取並重新載入遊戲
- ⏳ 確認電擊陷阱按鈕是否正常顯示
- ⏳ 檢查 Console 日誌

### 下一步

如果用戶報告問題仍然存在：
1. 請用戶提供 Console 錯誤訊息的截圖
2. 請用戶執行診斷工具並提供結果
3. 請用戶提供瀏覽器和操作系統資訊
4. 根據診斷結果進行進一步修復

---

## 檔案修改清單

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `js/ui.js` | 已修改 | 添加 default case、診斷日誌、臨時測試代碼 |
| `emergency-diag.html` | 新建 | 完整的診斷工具 |
| `test-button-render.html` | 新建 | 按鈕渲染測試 |
| `test-icon-render.html` | 新建 | 圖標渲染測試 |
| `check-ui-errors.cjs` | 新建 | Node.js 診斷腳本 |
| `docs/emergency-trap-button-fix.md` | 新建 | 本報告 |

---

**報告完成時間**：2026-02-11
**下次更新**：等待用戶驗證結果
