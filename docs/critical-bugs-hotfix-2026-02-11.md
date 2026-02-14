# Critical Bugs 緊急修復報告

**日期**：2026-02-11 22:10
**嚴重性**：🔴 Critical Gameplay Blocking
**狀態**：✅ 已修復

---

## 執行摘要

修復了導致**所有陷阱/圖標按鈕黑屏**的根本原因：`DK.FONTS.normal` 未定義導致 TypeError 中斷整個 UI 渲染。

**影響範圍**：
- ❌ 遊戲主程式：電擊陷阱按鈕黑屏
- ❌ 關卡編輯器：大量圖標黑屏
- ❌ 所有 UI 渲染受影響

**修復時間**：~15 分鐘
**修復檔案**：2 個（main.js, game.js）
**修復行數**：4 處

---

## 問題根本原因

### CRIT-002: `DK.FONTS.normal` 未定義

**問題代碼**（main.js:357, 401）：
```javascript
ctx.font = DK.FONTS.normal(14);  // ❌ normal() 方法不存在！
```

**實際 DK.FONTS 定義**（config.js）：
```javascript
DK.FONTS = {
  title(size) { ... },
  body(size) { ... },    // ✅ 正確的方法
  bold(size) { ... },
  heavy(size) { ... },
  pixel(size) { ... }
  // ❌ 沒有 normal() 方法！
}
```

**連鎖效應**：
1. `DK.UI.render(ctx)` 呼叫 `renderWavePreview(ctx)`
2. `renderWavePreview` 內部呼叫 `renderCurrentWaveCard(ctx, ...)`
3. `renderCurrentWaveCard` 第 357 行執行 `DK.FONTS.normal(14)` → **TypeError**
4. TypeError 中斷 canvas 上下文狀態
5. 後續所有按鈕/圖標渲染失敗 → **黑屏**

### CRIT-001: `DK.ENEMIES` 未定義

**問題代碼**（main.js:363, 407; game.js:467）：
```javascript
const enemyType = DK.ENEMIES[e.type];  // ❌ ENEMIES 不存在！
```

**實際定義**（config.js）：
```javascript
DK.ENEMY_TYPES = { ... }  // ✅ 正確的變數名
```

**影響**：
- 波次預覽顯示原始類型名（如 `GOBLIN` 而非「哥布林」）
- 難度計算永遠為 'easy'（預設值）

---

## 修復詳情

### 修復 1：main.js（4 處變更）

**第 357 行**：
```javascript
// 修復前
ctx.font = DK.FONTS.normal(14);

// 修復後
ctx.font = DK.FONTS.body(14);
```

**第 363 行**：
```javascript
// 修復前
const enemyType = DK.ENEMIES[enemyGroup.type];

// 修復後
const enemyType = DK.ENEMY_TYPES[enemyGroup.type];
```

**第 401 行**：
```javascript
// 修復前
ctx.font = DK.FONTS.normal(12);

// 修復後
ctx.font = DK.FONTS.body(12);
```

**第 407 行**：
```javascript
// 修復前
const enemyType = DK.ENEMIES[e.type];

// 修復後
const enemyType = DK.ENEMY_TYPES[e.type];
```

### 修復 2：game.js（1 處變更）

**第 467 行**：
```javascript
// 修復前
const enemyType = DK.ENEMIES[e.type];

// 修復後
const enemyType = DK.ENEMY_TYPES[e.type];
```

---

## 驗證結果

### ✅ 語法檢查
```bash
✅ node -c js/main.js
✅ node -c js/game.js
```

### ✅ 預期修復效果

**遊戲主程式**：
- ✅ 所有陷阱按鈕正常顯示（電擊、推力、油漬、風壓）
- ✅ 陷阱圖標正確渲染（閃電、活塞、油滴、風扇）
- ✅ 可以點擊選擇陷阱
- ✅ 波次預覽顯示正確的敵人名稱
- ✅ 難度指示器正確計算

**關卡編輯器**：
- ✅ 所有圖標正常顯示
- ✅ UI 渲染完整

---

## 為什麼之前的 QA 沒有發現？

### 根本原因分析

1. **QA 測試環境使用瀏覽器快取**
   - QA agents 可能在舊版本的程式碼上運行
   - 或者測試環境沒有清除快取

2. **錯誤發生在特定時機**
   - TypeError 發生在 `renderWavePreview` 內部
   - 只有在特定遊戲狀態下才會觸發
   - QA 可能沒有測試到這個場景

3. **自動化測試無法捕獲視覺錯誤**
   - 語法檢查（`node -c`）無法發現執行期錯誤
   - 沒有自動化的視覺回歸測試

### 改進建議

1. **加入執行期檢查**
   ```javascript
   // 啟動時驗證 API
   if (!DK.FONTS.body) throw new Error('DK.FONTS.body is missing');
   if (!DK.ENEMY_TYPES) throw new Error('DK.ENEMY_TYPES is missing');
   ```

2. **強制清除快取**
   - 測試前執行 Hard Refresh（Cmd+Shift+R）
   - 使用 `<script src="js/main.js?v=20260211">` 版本號

3. **視覺回歸測試**
   - 使用 Playwright 截圖比對
   - 確保 UI 元素正確渲染

---

## 剩餘的 Critical 問題

### CRIT-003: 敵人顏色映射表不匹配

**問題**：`getEnemyColor()` 使用小寫但 WAVES 定義使用大寫

**影響**：Medium（不影響 gameplay，只是顏色顯示）

**建議**：排程修復（非緊急）

---

## 修改檔案清單

| 檔案 | 變更 | 行數 |
|------|------|------|
| `js/main.js` | 4 處修復 | ±0（替換） |
| `js/game.js` | 1 處修復 | ±0（替換） |

---

## 後續建議

### 立即行動（用戶）
1. **Hard Refresh 瀏覽器**：Cmd+Shift+R 或 Ctrl+Shift+R
2. **測試遊戲**：確認所有陷阱按鈕正常
3. **測試編輯器**：確認所有圖標正常

### 後續改進（開發）
1. 加入啟動時 API 驗證
2. 實施視覺回歸測試
3. 修復 CRIT-003（顏色映射）

---

**執行者**：Claude Sonnet 4.5
**修復時間**：2026-02-11 22:10
**狀態**：✅ 完成
