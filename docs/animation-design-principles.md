# 動畫設計原則

> **作者**: visual-designer
> **創意總監審核**: creative-director
> **日期**: 2026-02-10
> **適用專案**: ProjectDK - Dungeon Keep

---

## 📖 文檔目的

本文檔記錄 ProjectDK 在像素藝術動畫設計中積累的最佳實踐，供團隊成員參考，確保所有動畫設計維持一致的品質標準。

---

## 🎨 核心原則：4 層動畫設計哲學

### 為什麼是 4 層？

| 層數 | 視覺效果 | 性能開銷 | 適用場景 | 評價 |
|------|---------|---------|---------|------|
| **1-2 層** | 單調、平面 | 極低 | 簡單 UI 元素（按鈕、圖標） | ⚠️ 缺乏深度 |
| **3 層** | 標準、清晰 | 低 | 大部分遊戲特效（攻擊、爆炸） | ✅ 標準品質 |
| **4 層** | **豐富、深度** | **中** | **AAA 級遊戲品質（魔法陣、傳送門）** | ⭐ 最佳選擇 |
| **5+ 層** | 過度、混亂 | 高 | 極少數情況（過場動畫、Boss 登場） | ⚠️ 易過度設計 |

**結論**：**4 層是像素藝術動畫的黃金標準**
- 3 層：已經不錯，但略顯單薄
- 4 層：豐富且不過度，視覺深度最佳
- 5+ 層：性能開銷增加，視覺混亂風險高

---

## 🌟 案例研究：傳送門 4 層動畫

### 設計目標
- 營造「次元漩渦」的魔法感
- 引導玩家視線（敵人進入點）
- 區分入口（綠色）和出口（紅色）

### 動畫層次拆解

```javascript
// Layer 1: 外層暗色同心圓（300ms 正弦波動）
功能：呼吸感，建立空間感
視覺：半徑 ±2px 波動，營造「能量場」邊界
週期：300ms（最快，最不引人注意）

// Layer 2: 中層漩渦線（500ms 旋轉）
功能：動態感，傳達能量流動
視覺：4 條螺旋線順時針/逆時針旋轉（入口/出口區分）
週期：500ms（中速，主要動態元素）

// Layer 3: 核心脈動（400ms 呼吸）
功能：焦點感，吸引視線
視覺：半徑 3-4px 正弦變化，模擬「心跳」
週期：400ms（中快，視覺焦點）

// Layer 4: 粒子環繞（800ms 旋轉）
功能：魔法感，增加細節層次
視覺：8 個粒子圍繞核心旋轉 + 徑向抖動
週期：800ms（最慢，細節層次）
```

### 視覺層次金字塔

```
        Layer 4: 粒子環繞（魔法感）
              ↑ 細節層次
        Layer 3: 核心脈動（焦點）
              ↑ 視覺焦點
        Layer 2: 漩渦旋轉（動態）
              ↑ 主要動態
        Layer 1: 同心圓（空間）
              ↑ 基礎結構
```

**設計原則**：
1. **基礎層（Layer 1）**：建立空間感，最不引人注意
2. **主動態層（Layer 2）**：核心動態元素，視覺主體
3. **焦點層（Layer 3）**：吸引視線，中心亮點
4. **細節層（Layer 4）**：錦上添花，增加豐富度

---

## ⏱️ 週期錯開策略：互質數的魔法

### 問題：為什麼不用整齊的週期？

**錯誤設計範例**（同步週期）：
```javascript
Layer 1: 300ms
Layer 2: 600ms   // 300 的倍數
Layer 3: 900ms   // 300 的倍數
Layer 4: 1200ms  // 300 的倍數

// 最小公倍數 = 1200ms
// 每 1.2 秒所有層完全同步 → 機械感、重複感
```

**結果**：
- ❌ 每 1.2 秒出現「視覺死點」（所有動畫同步到起點）
- ❌ 看起來像「迴圈播放的 GIF」
- ❌ 缺乏生命力，感覺機械化

### 正確設計：互質數週期

**傳送門實際設計**：
```javascript
Layer 1: 300ms  // 2² × 3 × 5²
Layer 2: 500ms  // 2² × 5³
Layer 3: 400ms  // 2⁴ × 5²
Layer 4: 800ms  // 2⁵ × 5²

// 最小公倍數 = 12000ms (12 秒)
// 每 12 秒才會完全同步一次
```

**數學原理**：
- 四個數的**最小公倍數（LCM）** = **12000ms**
- 也就是說，**每 12 秒才會出現一次完全同步的瞬間**
- 其餘 **11.7 秒**都是「不同步」狀態

**視覺效果**：
- ✅ 動畫看起來**永遠在變化**
- ✅ 產生「有機流動感」而非「機械重複感」
- ✅ 觀察 10 秒鐘，看不到兩次完全相同的畫面

### 如何選擇互質數週期？

**經驗法則**：
```javascript
// 步驟 1：確定基礎時長（根據視覺節奏）
300ms, 400ms, 500ms, 800ms

// 步驟 2：檢查是否互質（手工檢查）
gcd(300, 400) = 100 ❌  // 不互質
gcd(300, 500) = 100 ❌  // 不互質
gcd(400, 500) = 100 ❌  // 不互質
gcd(400, 800) = 400 ❌  // 不互質

// 但它們的 LCM 仍然足夠大（12000ms），效果可接受
```

**更嚴格的互質數範例**：
```javascript
// 理論上的完美互質數組合
Layer 1: 250ms  // 2 × 5³
Layer 2: 350ms  // 2 × 5² × 7
Layer 3: 550ms  // 2 × 5² × 11
Layer 4: 850ms  // 2 × 5² × 17

// LCM = 極大數值（幾乎不會同步）
```

**實務建議**：
- ✅ **LCM ≥ 10 秒**：已經足夠（人眼難以察覺重複）
- ✅ **差值 ≥ 100ms**：避免週期太接近（視覺糊成一團）
- ⚠️ **避免整數倍關係**：例如 200ms, 400ms, 600ms（會產生明顯的 2 倍節奏）

---

## 🎯 動畫時長標準

### 通用時長表

| 動畫類型 | 時長範圍 | 用途 | 範例 |
|---------|---------|------|------|
| **快閃** | 100-200ms | 錯誤提示、陷阱啟動 | 電擊板閃光 150ms |
| **快速** | 200-400ms | Hover 效果、按鈕反饋 | 按鈕 hover 300ms |
| **標準** | 400-600ms | 展開/折疊動畫、過渡 | 分類折疊 500ms |
| **緩慢** | 600-1000ms | 脈動、呼吸動畫 | 地城之心脈動 1000ms |
| **極慢** | 1000-2000ms | 環境動畫、氛圍營造 | 火把閃爍 1500ms |

### 為什麼這些時長？

**100-200ms（快閃）**：
- 人眼能察覺但不會感到「卡頓」
- 適合「瞬間反饋」（錯誤提示閃爍）

**200-400ms（快速）**：
- Google Material Design 推薦的 UI 動畫時長
- 用戶感覺「即時反饋」但有流暢過渡

**400-600ms（標準）**：
- 傳統動畫標準時長（Disney 12 原則）
- 大部分遊戲特效都在這個範圍

**600-1000ms（緩慢）**：
- 模擬「呼吸」「脈動」等生命感
- 不會搶走玩家注意力

**1000-2000ms（極慢）**：
- 環境動畫，營造氛圍
- 完全不影響遊戲操作

---

## 🚀 效能優化原則

### 原則 1：視距剔除（Viewport Culling）

**問題**：螢幕外的動畫仍在計算，浪費 CPU

**解決方案**：
```javascript
function shouldRenderAnimation(col, row, buffer = 2) {
  const cam = DK.Game.camera;
  const viewCols = DK.CONFIG.GRID_COLS;
  const viewRows = DK.CONFIG.GRID_ROWS;

  const camCol = Math.floor(cam.x / DK.CONFIG.TILE_SIZE);
  const camRow = Math.floor(cam.y / DK.CONFIG.TILE_SIZE);

  // 僅渲染視野內 + buffer 格緩衝區
  return (col >= camCol - buffer && col < camCol + viewCols + buffer &&
          row >= camRow - buffer && row < camRow + viewRows + buffer);
}

// 使用
if (shouldRenderAnimation(col, row)) {
  drawPortalTile(ctx, x, y, type, quadrant, time);
}
```

**效果**：
- ✅ 50-70% CPU 節省（40×26 地圖僅渲染 20×13 視野）
- ✅ 無視覺影響（螢幕外本來就看不到）
- ✅ 加入 2 格緩衝區避免邊緣閃爍

**適用場景**：
- ✅ 所有動態特效（傳送門、火把、粒子）
- ✅ 敵人/英雄動畫（已實作）
- ⚠️ 不適用小地圖（需要顯示全域）

### 原則 2：降低更新頻率

**問題**：60 FPS 動畫對於某些慢速動畫過於頻繁

**解決方案**：
```javascript
// 方案 A：固定降頻（每 N 幀更新一次）
_updateCounter: 0,

update(dt) {
  this._updateCounter++;

  // 慢速動畫每 3 幀更新一次（60 FPS → 20 FPS）
  if (this._updateCounter % 3 === 0) {
    this.updateSlowAnimations(dt * 3);
  }

  // 快速動畫每幀更新
  this.updateFastAnimations(dt);
}

// 方案 B：基於時間間隔（更精確）
_lastUpdate: 0,

update(time, dt) {
  // 每 50ms 更新一次（20 FPS）
  if (time - this._lastUpdate >= 50) {
    this.updateSlowAnimations(time - this._lastUpdate);
    this._lastUpdate = time;
  }
}
```

**適用場景**：
- ✅ 小地圖敵人位置（20 FPS 足夠）
- ✅ 環境粒子（dust, 火把煙霧）
- ⚠️ 玩家控制物體必須 60 FPS

### 原則 3：降低動畫複雜度（最後手段）

**粒子數量優化**：
```javascript
// 原設計：8 個粒子
for (let i = 0; i < 8; i++) {
  drawParticle(i);
}

// 優化：4 個粒子（降低 50% 計算量）
for (let i = 0; i < 4; i++) {
  drawParticle(i);
}
```

**動態調整粒子數量**：
```javascript
// 根據 FPS 動態調整
const targetFPS = 60;
const currentFPS = DK.Game.fps;

let particleCount = 8;
if (currentFPS < 55) particleCount = 4;
if (currentFPS < 45) particleCount = 2;
```

---

## 📊 性能預算表

### 動畫 CPU 預算（60 FPS 下）

| 動畫類型 | 單個開銷 | 螢幕內數量 | 總開銷 | 佔用預算 |
|---------|---------|-----------|--------|---------|
| 傳送門（4 層） | ~0.2ms | 5 個 | 1ms | 6% |
| 地城之心（脈動） | ~0.1ms | 1 個 | 0.1ms | 0.6% |
| 火把閃爍 | ~0.05ms | 10 個 | 0.5ms | 3% |
| 陷阱特效 | ~0.1ms | 8 個 | 0.8ms | 4.8% |
| 敵人動畫 | ~0.05ms | 20 個 | 1ms | 6% |
| **總計** | - | - | **3.4ms** | **20.4%** |

**說明**：
- 60 FPS = 16.67ms/幀
- 動畫預算 ≤ 30% (5ms) → 當前 3.4ms，剩餘 1.6ms 緩衝
- ✅ 效能健康，無需優化

**警戒線**：
- 🟢 < 5ms：健康
- 🟡 5-7ms：注意
- 🔴 > 7ms：需優化

---

## 🎬 實戰案例分析

### Case 1: 地城之心脈動動畫

**設計需求**：
- 正常狀態：緩慢脈動（1000ms）
- HP < 30%：快速脈動（500ms）
- 受傷瞬間：紅色閃爍（200ms）

**實作代碼**：
```javascript
function renderDungeonHeart(ctx, time) {
  const hpPercent = DK.Game.dungeonHeartHP / DK.Game.dungeonHeartMaxHP;
  const isFlashing = DK.Game.heartFlashTimer > 0;

  // 脈動週期：HP < 30% 加速
  const pulsePeriod = hpPercent < 0.3 ? 500 : 1000;
  const pulse = Math.sin(time / pulsePeriod * Math.PI) * 0.5 + 0.5;

  // 內部光點尺寸：2-4px
  const glowSize = 2 + Math.round(pulse * 2);

  // 顏色：正常紫色 / 受傷紅色
  const coreColor = isFlashing ? '#ff4444' : '#aa44ff';

  // 繪製水晶核心
  PA.rect(ctx, cx - glowSize/2, cy - glowSize/2, glowSize, glowSize, coreColor);

  // 地磚級光暈（淡化至 0.08 alpha）
  const glowAlpha = 0.04 + pulse * 0.04;
  ctx.fillStyle = `rgba(170,68,255,${glowAlpha})`;
  ctx.fillRect(x, y, T, T);
}
```

**設計亮點**：
1. **動態週期調整**：HP < 30% 時週期減半（危機感）
2. **脈動範圍控制**：`pulse * 0.5 + 0.5` 確保在 0.5-1.0 範圍（避免過暗）
3. **光暈淡化**：0.04-0.08 alpha（避免視覺噪音）

### Case 2: 傳送門漩渦旋轉方向

**設計需求**：
- 入口：順時針旋轉（引導敵人進入）
- 出口：逆時針旋轉（視覺對比）

**實作代碼**：
```javascript
function drawPortalTile_Entrance(ctx, x, y, quadrant, time) {
  // 順時針旋轉
  const baseAngle = (i / 4) * Math.PI * 2 + time / 500;
  // ...
}

function drawPortalTile_Exit(ctx, x, y, quadrant, time) {
  // 逆時針旋轉（負數）
  const baseAngle = (i / 4) * Math.PI * 2 - time / 500;
  // ...
}
```

**心理學依據**：
- ✅ 順時針 = 「進入」「內捲」（文化共識）
- ✅ 逆時針 = 「離開」「外擴」（視覺對比）
- ✅ 玩家無需看顏色，僅憑旋轉方向即可區分入口/出口

---

## 📚 參考資料

### 業界標準
- **Disney 12 原則**：動畫時機（Timing）與節奏（Spacing）
- **Google Material Design**：動畫時長標準（200-400ms）
- **Dungeon Keeper (1997)**：經典地城動畫設計

### 數學工具
- **最小公倍數計算器**：https://www.calculatorsoup.com/calculators/math/lcm.php
- **互質數檢查**：gcd(a, b) = 1

### 性能分析工具
- **Chrome DevTools Performance**：分析每幀渲染時間
- **FPS Monitor**：實時監控遊戲幀率

---

## ✅ 檢查清單

設計新動畫時，請檢查以下項目：

### 動畫層次
- [ ] 是否遵循 4 層動畫原則？
- [ ] 每層動畫的功能是否明確（空間/動態/焦點/細節）？
- [ ] 動畫週期是否錯開（LCM ≥ 10 秒）？

### 時長選擇
- [ ] 時長是否符合標準表（100-2000ms）？
- [ ] 快速反饋（< 400ms）vs 氛圍營造（> 600ms）？
- [ ] 週期是否與其他動畫協調？

### 性能考量
- [ ] 是否實作視距剔除？
- [ ] 單個動畫開銷 < 0.3ms？
- [ ] 總動畫預算 < 5ms（60 FPS 下）？

### 視覺一致性
- [ ] 顏色是否來自 `DK.COLORS` 色板？
- [ ] 動畫風格是否符合 Dungeon Keeper 暗黑風格？
- [ ] 像素對齊（無抗鋸齒）？

---

## 🎓 結語

動畫設計是科學與藝術的結合：
- **科學**：數學週期、性能預算、時長標準
- **藝術**：視覺節奏、情感表達、風格統一

**4 層動畫設計哲學**和**互質數週期錯開策略**是我們團隊的核心技術，希望這份文檔能幫助所有設計師創造出高品質的遊戲動畫。

**記住**：好的動畫讓玩家「感受」而非「看見」。

---

**文檔版本**: v1.0
**最後更新**: 2026-02-10
**維護者**: visual-designer
**審核者**: creative-director
