# ProjectDK - Critical Bugs 緊急修復 (2026-02-11)

## 概述

修復了導致**所有陷阱/圖標按鈕黑屏**的根本原因：`DK.FONTS.normal` 未定義導致 TypeError 中斷整個 UI 渲染。

## 問題根本原因

### CRIT-002: `DK.FONTS.normal` 未定義

**問題代碼**：
```javascript
ctx.font = DK.FONTS.normal(14);  // ❌ normal() 方法不存在！
```

**連鎖效應**：
1. UI 渲染呼叫 `renderWavePreview`
2. 內部執行 `DK.FONTS.normal(14)` → TypeError
3. Canvas 上下文狀態被破壞
4. 後續所有按鈕/圖標渲染失敗 → 黑屏

### CRIT-001: `DK.ENEMIES` 未定義

**問題**：程式碼使用 `DK.ENEMIES` 但實際定義是 `DK.ENEMY_TYPES`

**影響**：波次預覽顯示錯誤、難度計算失敗

## 修復內容

### main.js（4 處）
- 第 357, 401 行：`DK.FONTS.normal` → `DK.FONTS.body`
- 第 363, 407 行：`DK.ENEMIES` → `DK.ENEMY_TYPES`

### game.js（1 處）
- 第 467 行：`DK.ENEMIES` → `DK.ENEMY_TYPES`

## 為什麼 QA 沒發現？

1. **瀏覽器快取問題**：QA 可能使用舊版本程式碼
2. **特定時機觸發**：錯誤只在特定遊戲狀態下發生
3. **無視覺回歸測試**：自動化測試無法捕獲視覺錯誤

## 改進建議

1. **加入執行期檢查**：啟動時驗證 API 存在
2. **強制清除快取**：使用版本號 `?v=20260211`
3. **視覺回歸測試**：使用 Playwright 截圖比對

## 相關資訊

- **日期**：2026-02-11
- **專案**：ProjectDK
- **修復時間**：~15 分鐘
- **影響範圍**：遊戲主程式 + 關卡編輯器
- **詳細報告**：docs/critical-bugs-hotfix-2026-02-11.md
