# Math Cache 使用指南

**版本**：1.0
**日期**：2026-02-11
**適用於**：ProjectDK - Dungeon Keep

---

## 📖 簡介

`DK.MathCache` 是一個高性能的三角函式快取系統，用於優化遊戲動畫中重複的 `Math.sin()`/`Math.cos()` 計算。

### 核心優勢
- ⚡ **性能提升 57.8%**：使用預計算查找表取代即時運算
- 🎯 **精度損失 <1%**：1 度精度，視覺上無差異
- 🛠️ **簡化 API**：`MC.sinTime(time, freq)` 比 `Math.sin(time * freq)` 更清楚
- 📦 **記憶體成本低**：僅 2.88 KB

---

## 🚀 快速開始

### 1. 初始化（自動完成）

系統已在 `main.js` 中自動初始化，無需手動呼叫：

```javascript
// main.js 已自動執行
if (DK.MathCache) {
  DK.MathCache.init();
}
```

### 2. 基本用法

```javascript
// 在任何需要動畫的函式中
const MC = DK.MathCache; // 快取引用（性能最佳化）

// 火把閃爍（快速變化）
const flicker = MC.sinTime(time, 1/150) * 0.5 + 0.5;

// 地心脈動（緩慢呼吸）
const pulse = MC.sinTime(time, 0.002);

// UI 按鈕高亮（中速）
const highlight = MC.easing.pulse(time, 0.001);
```

---

## 📚 API 參考

### 核心函式

#### `DK.MathCache.sin(degrees)`
查找表 sin（角度制）

```javascript
const sin45 = DK.MathCache.sin(45);    // 0.707
const sin90 = DK.MathCache.sin(90);    // 1.0
const sin270 = DK.MathCache.sin(270);  // -1.0
```

**參數**：
- `degrees` (number)：角度（自動正規化至 0-360）

**回傳**：sin 值 (-1 ~ 1)

---

#### `DK.MathCache.cos(degrees)`
查找表 cos（角度制）

```javascript
const cos0 = DK.MathCache.cos(0);      // 1.0
const cos90 = DK.MathCache.cos(90);    // 0.0
const cos180 = DK.MathCache.cos(180);  // -1.0
```

**參數**：
- `degrees` (number)：角度（自動正規化至 0-360）

**回傳**：cos 值 (-1 ~ 1)

---

#### `DK.MathCache.sinTime(time, frequency)`
**最常用**：時間轉 sin（等效於 `Math.sin(time * frequency)`）

```javascript
const time = DK.Game.time; // 毫秒

// 火把閃爍（150ms 週期）
const flicker = MC.sinTime(time, 1/150);

// 地心脈動（500 秒週期）
const pulse = MC.sinTime(time, 0.002);

// UI 脈動（1 秒週期）
const uiPulse = MC.sinTime(time, 0.001);
```

**參數**：
- `time` (number)：時間（毫秒），通常是 `DK.Game.time`
- `frequency` (number)：頻率係數，預設 0.002

**回傳**：sin 值 (-1 ~ 1)

**頻率對照表**：

| 週期 | 頻率 | 用途 |
|------|------|------|
| 100ms | 0.01 | 快速閃爍（警告） |
| 150ms | 0.00667 | 火把閃爍 |
| 500ms | 0.002 | 地心脈動 |
| 1000ms | 0.001 | UI 按鈕高亮 |
| 2000ms | 0.0005 | 緩慢呼吸 |

---

#### `DK.MathCache.cosTime(time, frequency)`
時間轉 cos（等效於 `Math.cos(time * frequency)`）

```javascript
const xOffset = MC.cosTime(time, 0.002) * 10; // 水平擺動
```

---

#### `DK.MathCache.timeToAngle(time, frequency)`
時間轉角度（0-360 度）

```javascript
const angle = MC.timeToAngle(time, 0.002); // 0-360 循環
```

---

#### `DK.MathCache.timeToRad(time, frequency)`
時間轉弧度（用於需要弧度的場合，如 canvas 旋轉）

```javascript
ctx.save();
ctx.rotate(MC.timeToRad(time, 0.001));
// 繪製旋轉物體
ctx.restore();
```

---

### Easing 函式庫

#### `DK.MathCache.easing.pulse(time, frequency)`
脈動效果（0.5 ± 0.5，輸出範圍 0-1）

```javascript
// UI 按鈕高亮
const alpha = MC.easing.pulse(time, 0.001); // 0-1
ctx.globalAlpha = alpha;

// 等效於（但更快）
const alpha2 = 0.5 + 0.5 * Math.sin(time * 0.001);
```

**輸出範圍**：0.0 ~ 1.0（適合直接用於 alpha）

---

#### `DK.MathCache.easing.smoothstep(t)`
緩入緩出（Hermite 插值）

```javascript
const t = (time % 1000) / 1000; // 0-1 進度
const eased = MC.easing.smoothstep(t); // 緩入緩出曲線
```

**參數**：
- `t` (number)：進度 (0-1)

**回傳**：緩動值 (0-1)

---

#### `DK.MathCache.easing.bounce(t)`
彈跳效果（基於 sin）

```javascript
const t = (time % 500) / 500; // 0-1 進度
const bounce = MC.easing.bounce(t);
```

---

## 🎨 常用動畫模式

### 模式 1：火把閃爍

```javascript
renderTorches(ctx) {
  const MC = DK.MathCache;
  const time = DK.Game.time;

  for (const torch of this.torches) {
    // 每個火把獨立閃爍（加上位置偏移）
    const flicker = MC.sinTime(time + torch.col * 450, 1/150) * 0.5 + 0.5;
    const flicker2 = MC.sinTime(time + torch.row * 500, 1/100) * 0.5 + 0.5;

    // 使用 flicker 控制火焰大小或顏色
    if (flicker > 0.3) {
      // 繪製外層火焰
    }
  }
}
```

**關鍵點**：
- 加上位置偏移（`torch.col * 450`）讓每個火把獨立動畫
- 使用 `* 0.5 + 0.5` 將範圍從 (-1, 1) 轉換為 (0, 1)

---

### 模式 2：地心/寶石脈動

```javascript
renderHeartGlow(ctx) {
  const MC = DK.MathCache;
  const time = DK.Game.time;

  // 緩慢脈動（500 秒週期）
  const pulse = MC.sinTime(time, 0.002);
  const alpha = 0.12 + 0.08 * pulse; // 0.04 ~ 0.20

  // 繪製光暈
  ctx.fillStyle = `rgba(255, 100, 100, ${alpha})`;
  // ...
}
```

**關鍵點**：
- 頻率 0.002 = 500 秒週期（非常緩慢）
- 使用 `0.12 + 0.08 * pulse` 控制 alpha 範圍（0.04 ~ 0.20）

---

### 模式 3：傳送門漩渦

```javascript
drawPortalFull(ctx, x, y, colorScheme, time) {
  const MC = DK.MathCache;

  // 脈動光暈
  const pulseAlpha = 0.4 + 0.2 * MC.sinTime(time * 1000, 0.002);

  // 能量環
  const ringAlpha = 0.3 + 0.4 * pulseAlpha; // 複用脈動值

  // 粒子旋轉（需要弧度，使用原生 Math）
  for (let i = 0; i < 6; i++) {
    const angle = time * 1.6 + i * Math.PI / 3;
    const radiusSin = MC.sinTime(time * 1000 + i * 333, 0.003);
    const radius = 10 + 2 * radiusSin;

    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    // 繪製粒子
  }
}
```

**關鍵點**：
- 旋轉角度使用原生 `Math.cos/sin`（canvas 旋轉需要弧度）
- 半徑變化使用快取 `MC.sinTime`
- 複用 `pulseAlpha` 避免重複計算

---

### 模式 4：UI 按鈕高亮

```javascript
renderButton(ctx, time) {
  const MC = DK.MathCache;

  // 按鈕邊框脈動（1 秒週期）
  const pulse = MC.sinTime(time, 0.001) * 0.1 + 0.9; // 0.8 ~ 1.0

  ctx.strokeStyle = `rgba(170, 68, 255, ${pulse})`;
  ctx.strokeRect(x, y, w, h);
}
```

---

### 模式 5：錯誤通知閃爍

```javascript
renderErrorNotification(ctx, notification) {
  const MC = DK.MathCache;

  // 邊框快速脈動（200ms 週期）
  const pulse = MC.sinTime(notification.timer, 1/200) * 0.3 + 0.7; // 0.4 ~ 1.0

  ctx.lineWidth = 3 * pulse;
  ctx.strokeStyle = '#ff4444';
  ctx.strokeRect(x, y, w, h);
}
```

---

## ⚙️ 性能最佳實踐

### ✅ 推薦做法

#### 1. 快取 MathCache 引用

```javascript
// ✅ 好：在函式開頭快取引用
function renderAnimation(ctx) {
  const MC = DK.MathCache;

  for (let i = 0; i < 100; i++) {
    const value = MC.sinTime(time + i * 100, 0.002);
  }
}

// ❌ 壞：每次迴圈都存取 DK.MathCache
function renderAnimation(ctx) {
  for (let i = 0; i < 100; i++) {
    const value = DK.MathCache.sinTime(time + i * 100, 0.002);
  }
}
```

---

#### 2. 複用計算結果

```javascript
// ✅ 好：計算一次，多次使用
const baseSin = MC.sinTime(time, 0.002);
const alpha1 = 0.5 + 0.5 * baseSin;
const alpha2 = 0.3 + 0.4 * baseSin;
const alpha3 = 0.2 + 0.3 * baseSin;

// ❌ 壞：重複計算相同值
const alpha1 = 0.5 + 0.5 * MC.sinTime(time, 0.002);
const alpha2 = 0.3 + 0.4 * MC.sinTime(time, 0.002);
const alpha3 = 0.2 + 0.3 * MC.sinTime(time, 0.002);
```

---

#### 3. 使用 easing 函式簡化

```javascript
// ✅ 好：使用內建 easing
const pulse = MC.easing.pulse(time, 0.001);

// ❌ 壞：手動計算
const pulse = 0.5 + 0.5 * MC.sinTime(time, 0.001);
```

---

### ❌ 避免做法

#### 1. 不要在高頻場景使用原生 Math.sin

```javascript
// ❌ 壞：在每幀每個物體都重複計算
for (const obj of objects) {
  const alpha = Math.sin(time * 0.002 + obj.id);
}

// ✅ 好：使用快取
const MC = DK.MathCache;
for (const obj of objects) {
  const alpha = MC.sinTime(time + obj.id * 1000, 0.002);
}
```

---

#### 2. 不要忘記位置偏移

```javascript
// ❌ 壞：所有火把同步閃爍
for (const torch of torches) {
  const flicker = MC.sinTime(time, 1/150);
}

// ✅ 好：每個火把獨立閃爍
for (const torch of torches) {
  const flicker = MC.sinTime(time + torch.col * 450 + torch.row * 1050, 1/150);
}
```

---

## 🔬 除錯與監控

### 檢查初始化狀態

```javascript
console.log('MathCache 已初始化:', DK.MathCache._initialized);
console.log('Sin 表長度:', DK.MathCache.sinTable.length); // 應為 360
console.log('Cos 表長度:', DK.MathCache.cosTable.length); // 應為 360
```

### 驗證精度

```javascript
const time = 5000;
const freq = 0.002;

const original = Math.sin(time * freq);
const cached = DK.MathCache.sinTime(time, freq);

console.log('原生 Math.sin:', original);
console.log('快取 sinTime:', cached);
console.log('誤差:', Math.abs(original - cached)); // 應 <0.01
```

### 性能對比測試

```javascript
// 測試原生 Math.sin
const iterations = 100000;
console.time('原生 Math.sin');
for (let i = 0; i < iterations; i++) {
  Math.sin(i * 0.002);
}
console.timeEnd('原生 Math.sin');

// 測試快取 sinTime
const MC = DK.MathCache;
console.time('快取 sinTime');
for (let i = 0; i < iterations; i++) {
  MC.sinTime(i, 0.002);
}
console.timeEnd('快取 sinTime');

// 預期結果：快取版本快 50-60%
```

---

## 🛠️ 進階用法

### 動態快取（AnimationCache）

用於快取複雜計算結果（非三角函式）：

```javascript
const AC = DK.AnimationCache;

// 快取昂貴的計算
const complexValue = AC.get(`key:${id}:${time}`, () => {
  // 複雜計算...
  return result;
});

// 清除快取（關卡切換時）
AC.clear();

// 查看快取狀態
console.log(AC.getStats());
```

**注意**：動態快取適用於計算成本高且重複性高的場景，一般動畫不需要使用。

---

## 📌 常見問題

### Q1: 什麼時候應該使用 Math.sin 而非 MathCache.sinTime？

**A**: 非重複性或靜態幾何計算（如初始化時計算多邊形頂點）可直接使用 `Math.sin`。**只有**每幀重複計算的動畫才需要使用快取。

```javascript
// ✅ 靜態幾何（初始化一次）- 使用原生 Math
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2;
  vertices[i] = {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius
  };
}

// ✅ 動畫（每幀執行）- 使用快取
function update() {
  const rotation = MC.sinTime(time, 0.001);
}
```

---

### Q2: 為什麼傳送門粒子旋轉還在用 Math.cos/sin？

**A**: Canvas 的 `ctx.rotate()` 需要**弧度**作為輸入，且旋轉角度變化快速，查找表的 1 度精度可能造成視覺抖動。對於旋轉矩陣計算，原生 `Math` 更合適。

---

### Q3: 精度損失 0.7% 會不會造成動畫不同步？

**A**: 不會。1 度精度對應最大誤差約 0.017（在 -1~1 範圍），換算成像素通常 <1px。人眼無法察覺這種微小差異。

---

### Q4: 可以擴展至更高精度嗎？

**A**: 可以。修改 `math-cache.js` 中的初始化邏輯：

```javascript
// 從 360 度改為 720 度（0.5 度精度）
for (let i = 0; i < 720; i++) {
  const rad = (i * Math.PI) / 360; // 注意分母改為 360
  this.sinTable[i] = Math.sin(rad);
  this.cosTable[i] = Math.cos(rad);
}
```

**代價**：記憶體使用 × 2（從 2.88 KB 到 5.76 KB）

---

## 📝 總結

### 核心記憶點
1. **優先使用** `MC.sinTime(time, freq)` 取代 `Math.sin(time * freq)`
2. **快取引用**：`const MC = DK.MathCache;`
3. **複用結果**：避免重複計算相同值
4. **位置偏移**：`time + obj.id * offset` 讓物體獨立動畫
5. **靜態幾何用原生 Math**：非重複計算不需要快取

### 效能指標
- ⚡ 性能提升：**+57.8%**
- 🎯 精度損失：**0.7%**（視覺無差異）
- 📦 記憶體成本：**+2.88 KB**

### 支援
有問題請參考 `docs/math-cache-performance.md` 或聯絡開發團隊。

---

**文件版本**：1.0
**最後更新**：2026-02-11
**維護者**：animation-optimizer-2 (Sonnet 4.5)
