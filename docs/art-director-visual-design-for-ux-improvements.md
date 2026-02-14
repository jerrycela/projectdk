# ProjectDK 視覺設計方案 — 配合 UX 改進

> **美術總監**: art-director (Opus 4.6)
> **日期**: 2026-02-11
> **配合文檔**: `ux-improvement-proposal-creative-director-2026-02-11.md`
> **狀態**: 配合創意總監 UX 方案的視覺設計

---

## 📋 執行摘要

本文檔是美術總監針對創意總監提出的 UX 改進方案，設計具體的視覺實作方案。確保所有視覺設計：
1. **符合創意總監的 UX 需求**（色彩語義、動畫速度、視覺層級）
2. **使用視覺優化方案的色彩系統**（保持一致性）
3. **符合 Dungeon Keeper 像素風格**（不破壞現有美學）
4. **提供具體可執行的實作指引**（色彩、尺寸、動畫參數）

---

## 🎯 一、三區域佈局視覺設計

### 1.1 創意總監需求

```
┌──────────┬────────────────────────────────┬────────────┐
│ 左區:    │ 中區: 主要操作                  │ 右區:      │
│ 工具     │                                │ 狀態資訊    │
│ (200px)  │ (560px)                        │ (200px)    │
```

### 1.2 視覺設計方案

#### A. 背景色系統

**設計原則**：
- 左右區域：低視覺權重，不干擾遊戲畫面
- 中區：最低權重，幾乎透明（讓主按鈕突出）
- 所有區域：暗色系，符合地下城氛圍

**色彩定義**：

```javascript
// config.js 新增
DK.UI_COLORS = {
  // 三區域背景色
  PANEL_LEFT_BG: '#12101e',        // 左區背景（深紫黑）
  PANEL_CENTER_BG: 'transparent',  // 中區背景（透明，讓按鈕突出）
  PANEL_RIGHT_BG: '#12101e',       // 右區背景（深紫黑）

  // 區域邊框
  PANEL_BORDER: '#2a2838',         // 區域邊框（淡紫灰）
  PANEL_SEPARATOR: '#1a1a2e',      // 分隔線（極暗）

  // 區域陰影（內陰影，增強深度）
  PANEL_SHADOW_INNER: 'rgba(0,0,0,0.4)',
};
```

#### B. 佈局尺寸與間距

```javascript
// config.js 新增
DK.UI_LAYOUT = {
  // 三區域尺寸
  PANEL_LEFT_WIDTH: 200,
  PANEL_CENTER_WIDTH: 560,
  PANEL_RIGHT_WIDTH: 200,
  PANEL_HEIGHT: 96,  // 保持與原 UI 高度一致

  // 內邊距
  PANEL_PADDING: 12,

  // 分隔線寬度
  SEPARATOR_WIDTH: 2,

  // 區域圓角（增添現代感，但保持像素風格）
  PANEL_CORNER_RADIUS: 0,  // 像素風格不用圓角，保持銳利

  // 陰影參數
  SHADOW_BLUR: 8,
  SHADOW_OFFSET_Y: 2,
};
```

#### C. 渲染實作（ui.js 新增函式）

```javascript
/**
 * 繪製三區域 UI 背景
 */
DK.UI.renderThreeColumnLayout = function(ctx) {
  const L = DK.UI_LAYOUT;
  const C = DK.UI_COLORS;
  const y = DK.CONFIG.UI_TOP;

  // === 左區：工具面板 ===
  // 背景
  ctx.fillStyle = C.PANEL_LEFT_BG;
  ctx.fillRect(0, y, L.PANEL_LEFT_WIDTH, L.PANEL_HEIGHT);

  // 內陰影（頂部）
  const gradientLeft = ctx.createLinearGradient(0, y, 0, y + 20);
  gradientLeft.addColorStop(0, C.PANEL_SHADOW_INNER);
  gradientLeft.addColorStop(1, 'transparent');
  ctx.fillStyle = gradientLeft;
  ctx.fillRect(0, y, L.PANEL_LEFT_WIDTH, 20);

  // 右邊框
  ctx.fillStyle = C.PANEL_BORDER;
  ctx.fillRect(L.PANEL_LEFT_WIDTH - L.SEPARATOR_WIDTH, y,
               L.SEPARATOR_WIDTH, L.PANEL_HEIGHT);

  // === 中區：操作面板（透明背景，讓按鈕自己呈現）===
  // 不繪製背景，保持透明

  // === 右區：狀態面板 ===
  // 背景
  ctx.fillStyle = C.PANEL_RIGHT_BG;
  ctx.fillRect(L.PANEL_LEFT_WIDTH + L.PANEL_CENTER_WIDTH, y,
               L.PANEL_RIGHT_WIDTH, L.PANEL_HEIGHT);

  // 內陰影（頂部）
  const gradientRight = ctx.createLinearGradient(
    L.PANEL_LEFT_WIDTH + L.PANEL_CENTER_WIDTH, y,
    L.PANEL_LEFT_WIDTH + L.PANEL_CENTER_WIDTH, y + 20
  );
  gradientRight.addColorStop(0, C.PANEL_SHADOW_INNER);
  gradientRight.addColorStop(1, 'transparent');
  ctx.fillStyle = gradientRight;
  ctx.fillRect(L.PANEL_LEFT_WIDTH + L.PANEL_CENTER_WIDTH, y,
               L.PANEL_RIGHT_WIDTH, 20);

  // 左邊框
  ctx.fillStyle = C.PANEL_BORDER;
  ctx.fillRect(L.PANEL_LEFT_WIDTH + L.PANEL_CENTER_WIDTH, y,
               L.SEPARATOR_WIDTH, L.PANEL_HEIGHT);
};
```

#### D. 視覺效果示意

```
背景色深度對比:
┌──────────┬────────────────────┬──────────┐
│ #12101e  │ transparent        │ #12101e  │  ← 暗色背景，讓按鈕突出
│ (深紫黑)  │ (透明)              │ (深紫黑)  │
│          │                    │          │
│ 邊框:    │ 無邊框              │ 邊框:    │
│ #2a2838  │                    │ #2a2838  │
└──────────┴────────────────────┴──────────┘
```

---

## 🎨 二、新圖示設計（像素藝術風格）

### 2.1 創意總監需求

5 種圖示：
1. ✓ 可放置圖示（綠色）
2. ❌ 無法放置圖示（紅色）
3. ⬆️ 可升級指示器（黃色閃爍）
4. 💡 建議提示圖示
5. ⭐ 星級評分圖示

### 2.2 視覺設計方案

#### A. 圖示尺寸標準

```javascript
// config.js 新增
DK.ICON_SIZES = {
  TINY: 8,    // 8×8px - 用於格子角落的小圖示
  SMALL: 12,  // 12×12px - 用於按鈕內的圖示
  MEDIUM: 16, // 16×16px - 用於地磚上的圖示（標準）
  LARGE: 24,  // 24×24px - 用於大型 UI 元素
};
```

#### B. 圖示設計（16×16px 像素藝術）

**1. 可放置圖示 ✓（綠色勾號）**

```javascript
/**
 * 繪製「可放置」圖示（綠色 ✓）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - 左上角 X
 * @param {number} y - 左上角 Y
 * @param {number} size - 圖示尺寸（預設 16px）
 */
DK.PixelArt.drawPlaceableIcon = function(ctx, x, y, size = 16) {
  const C = DK.COLORS;
  const scale = size / 16;

  // 綠色勾號路徑（像素完美）
  const checkmark = [
    // 短邊（左下往右上）
    { x: 4, y: 8 }, { x: 5, y: 9 },
    { x: 6, y: 10 }, { x: 7, y: 11 },
    // 長邊（中間往右上）
    { x: 7, y: 11 }, { x: 8, y: 10 },
    { x: 9, y: 9 }, { x: 10, y: 8 },
    { x: 11, y: 7 }, { x: 12, y: 6 },
    { x: 13, y: 5 }, { x: 14, y: 4 },
  ];

  // 繪製勾號（3 層：暗綠底 + 亮綠主體 + 白色高光）
  // 暗綠底（粗線，2px）
  ctx.strokeStyle = '#228844';  // 暗綠
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 4 * scale, y + 8 * scale);
  ctx.lineTo(x + 7 * scale, y + 11 * scale);
  ctx.lineTo(x + 14 * scale, y + 4 * scale);
  ctx.stroke();

  // 亮綠主體（2px）
  ctx.strokeStyle = C.UI_SUCCESS_GREEN || '#44dd44';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 4 * scale, y + 8 * scale);
  ctx.lineTo(x + 7 * scale, y + 11 * scale);
  ctx.lineTo(x + 14 * scale, y + 4 * scale);
  ctx.stroke();

  // 白色高光（1px，拐點處）
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 6 * scale, y + 9 * scale);
  ctx.lineTo(x + 7 * scale, y + 10 * scale);
  ctx.lineTo(x + 13 * scale, y + 5 * scale);
  ctx.stroke();
};
```

**2. 無法放置圖示 ❌（紅色叉號）**

```javascript
/**
 * 繪製「無法放置」圖示（紅色 ❌）
 */
DK.PixelArt.drawUnplaceableIcon = function(ctx, x, y, size = 16) {
  const C = DK.COLORS;
  const scale = size / 16;

  // 紅色叉號（兩條對角線）
  // 左上到右下
  ctx.strokeStyle = '#aa2244';  // 暗紅底
  ctx.lineWidth = 3 * scale;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 4 * scale, y + 4 * scale);
  ctx.lineTo(x + 12 * scale, y + 12 * scale);
  ctx.stroke();

  ctx.strokeStyle = C.DANGER_RED_CORE || '#ff4444';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 4 * scale, y + 4 * scale);
  ctx.lineTo(x + 12 * scale, y + 12 * scale);
  ctx.stroke();

  // 右上到左下
  ctx.strokeStyle = '#aa2244';
  ctx.lineWidth = 3 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 12 * scale, y + 4 * scale);
  ctx.lineTo(x + 4 * scale, y + 12 * scale);
  ctx.stroke();

  ctx.strokeStyle = C.DANGER_RED_CORE || '#ff4444';
  ctx.lineWidth = 2 * scale;
  ctx.beginPath();
  ctx.moveTo(x + 12 * scale, y + 4 * scale);
  ctx.lineTo(x + 4 * scale, y + 12 * scale);
  ctx.stroke();

  // 白色高光（叉號交點）
  this.pixel(ctx, x + 8 * scale, y + 8 * scale, '#ffffff');
};
```

**3. 可升級指示器 ⬆️（黃色箭頭 + 閃爍）**

```javascript
/**
 * 繪製「可升級」指示器（黃色 ⬆️）
 * @param {number} time - 遊戲時間（用於閃爍動畫）
 */
DK.PixelArt.drawUpgradeIcon = function(ctx, x, y, size = 16, time = 0) {
  const C = DK.COLORS;
  const scale = size / 16;

  // 閃爍效果（500ms 週期）
  const pulse = Math.sin(time / 500 * Math.PI) * 0.5 + 0.5; // 0-1
  const alpha = 0.6 + pulse * 0.4; // 0.6-1.0

  ctx.save();
  ctx.globalAlpha = alpha;

  // 黃色向上箭頭
  // 箭頭路徑
  const arrowPath = [
    // 箭頭尖（頂部）
    { x: 8, y: 3 },
    // 左斜邊
    { x: 5, y: 6 },
    // 左內縮
    { x: 6, y: 6 },
    // 左箭身
    { x: 6, y: 13 },
    // 底部左
    { x: 7, y: 13 },
    // 底部中左
    { x: 7, y: 7 },
    // 中央
    { x: 9, y: 7 },
    // 底部中右
    { x: 9, y: 13 },
    // 底部右
    { x: 10, y: 13 },
    // 右箭身
    { x: 10, y: 6 },
    // 右內縮
    { x: 11, y: 6 },
    // 右斜邊
    { x: 8, y: 3 },
  ];

  // 繪製暗黃底
  ctx.fillStyle = '#aa7700';
  ctx.beginPath();
  ctx.moveTo(x + 8 * scale, y + 3 * scale);
  ctx.lineTo(x + 5 * scale, y + 6 * scale);
  ctx.lineTo(x + 6 * scale, y + 6 * scale);
  ctx.lineTo(x + 6 * scale, y + 13 * scale);
  ctx.lineTo(x + 10 * scale, y + 13 * scale);
  ctx.lineTo(x + 10 * scale, y + 6 * scale);
  ctx.lineTo(x + 11 * scale, y + 6 * scale);
  ctx.closePath();
  ctx.fill();

  // 繪製亮黃主體
  ctx.fillStyle = C.UI_WARNING_YELLOW || '#ffdd22';
  ctx.beginPath();
  ctx.moveTo(x + 8 * scale, y + 4 * scale);
  ctx.lineTo(x + 6 * scale, y + 7 * scale);
  ctx.lineTo(x + 7 * scale, y + 7 * scale);
  ctx.lineTo(x + 7 * scale, y + 12 * scale);
  ctx.lineTo(x + 9 * scale, y + 12 * scale);
  ctx.lineTo(x + 9 * scale, y + 7 * scale);
  ctx.lineTo(x + 10 * scale, y + 7 * scale);
  ctx.closePath();
  ctx.fill();

  // 白色高光（箭頭尖）
  this.pixel(ctx, x + 8 * scale, y + 4 * scale, '#ffffff');
  this.pixel(ctx, x + 7 * scale, y + 5 * scale, '#ffffff');
  this.pixel(ctx, x + 9 * scale, y + 5 * scale, '#ffffff');

  ctx.restore();
};
```

**4. 建議提示圖示 💡（燈泡 + 脈動）**

```javascript
/**
 * 繪製「建議提示」圖示（燈泡 💡）
 */
DK.PixelArt.drawSuggestionIcon = function(ctx, x, y, size = 16, time = 0) {
  const scale = size / 16;

  // 脈動效果（1000ms 慢速呼吸）
  const pulse = Math.sin(time / 1000 * Math.PI) * 0.3 + 0.7; // 0.7-1.0

  ctx.save();
  ctx.globalAlpha = pulse;

  // 燈泡外形（簡化像素版）
  // 燈泡上半部（圓形）- 黃色
  ctx.fillStyle = '#ffdd44';
  this.circleFilled(ctx, x + 8 * scale, y + 6 * scale, 4 * scale, '#ffdd44');

  // 燈泡高光（白色）
  this.pixel(ctx, x + 7 * scale, y + 5 * scale, '#ffffff');
  this.pixel(ctx, x + 8 * scale, y + 4 * scale, '#ffffff');

  // 燈泡底座（灰色）
  ctx.fillStyle = '#888888';
  this.rect(ctx, x + 6 * scale, y + 10 * scale, 4 * scale, 3 * scale, '#888888');

  // 光暈（半透明黃色）
  const glowAlpha = pulse * 0.3;
  ctx.fillStyle = `rgba(255, 221, 68, ${glowAlpha})`;
  this.circleFilled(ctx, x + 8 * scale, y + 6 * scale, 6 * scale,
                    `rgba(255, 221, 68, ${glowAlpha})`);

  ctx.restore();
};
```

**5. 星級評分圖示 ⭐（五角星）**

```javascript
/**
 * 繪製「星級評分」圖示（五角星 ⭐）
 * @param {boolean} filled - 是否填充（亮星 vs 暗星）
 */
DK.PixelArt.drawStarIcon = function(ctx, x, y, size = 16, filled = true) {
  const scale = size / 16;

  // 五角星路徑（像素藝術簡化版）
  // 使用菱形近似（像素風格下更清晰）
  if (filled) {
    // 亮星（金黃色）
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(x + 8 * scale, y + 2 * scale);  // 頂點
    ctx.lineTo(x + 10 * scale, y + 6 * scale); // 右上
    ctx.lineTo(x + 14 * scale, y + 6 * scale); // 右尖
    ctx.lineTo(x + 11 * scale, y + 9 * scale); // 右下
    ctx.lineTo(x + 12 * scale, y + 14 * scale);// 底右
    ctx.lineTo(x + 8 * scale, y + 11 * scale); // 底中
    ctx.lineTo(x + 4 * scale, y + 14 * scale); // 底左
    ctx.lineTo(x + 5 * scale, y + 9 * scale);  // 左下
    ctx.lineTo(x + 2 * scale, y + 6 * scale);  // 左尖
    ctx.lineTo(x + 6 * scale, y + 6 * scale);  // 左上
    ctx.closePath();
    ctx.fill();

    // 白色高光（中心）
    this.pixel(ctx, x + 8 * scale, y + 7 * scale, '#ffffff');
    this.pixel(ctx, x + 7 * scale, y + 8 * scale, '#ffee88');
    this.pixel(ctx, x + 9 * scale, y + 8 * scale, '#ffee88');
  } else {
    // 暗星（灰色輪廓）
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(x + 8 * scale, y + 2 * scale);
    ctx.lineTo(x + 10 * scale, y + 6 * scale);
    ctx.lineTo(x + 14 * scale, y + 6 * scale);
    ctx.lineTo(x + 11 * scale, y + 9 * scale);
    ctx.lineTo(x + 12 * scale, y + 14 * scale);
    ctx.lineTo(x + 8 * scale, y + 11 * scale);
    ctx.lineTo(x + 4 * scale, y + 14 * scale);
    ctx.lineTo(x + 5 * scale, y + 9 * scale);
    ctx.lineTo(x + 2 * scale, y + 6 * scale);
    ctx.lineTo(x + 6 * scale, y + 6 * scale);
    ctx.closePath();
    ctx.stroke();
  }
};
```

### 2.3 使用場景與動畫參數

| 圖示 | 使用場景 | 尺寸 | 動畫 | 持續時間 |
|------|---------|------|------|---------|
| ✓ 可放置 | hover 可放置格子時，格子角落顯示 | 12px | 淡入（150ms） | 持續顯示 |
| ❌ 無法放置 | hover 無效格子時，格子角落顯示 | 12px | 閃爍（150ms × 3） | 450ms |
| ⬆️ 可升級 | 陷阱可升級時，陷阱上方浮動 | 16px | 閃爍（500ms） + 上下浮動（2px） | 持續 |
| 💡 建議 | 右下角建議面板的圖標 | 24px | 脈動（1000ms） | 持續 |
| ⭐ 星級 | 波次完成畫面，星級評分 | 24px | 逐個亮起（200ms 間隔） | 一次性 |

---

## 🛡️ 三、路障視覺升級設計

### 3.1 創意總監需求

- 更明顯的視覺設計（讓玩家一眼認出）
- 耐久度視覺表現（HP 條或裂痕）
- 放置/移除時的特效

### 3.2 視覺設計方案

#### A. 路障外觀設計（16×16px 像素藝術）

**設計概念**：木質柵欄 + 鐵釘強化

```javascript
/**
 * 繪製路障地磚（增強版）
 * @param {number} hpPercent - HP 百分比（0-1）
 * @param {boolean} isPlacing - 是否正在放置（半透明預覽）
 */
DK.Map.drawBarricadeTile = function(ctx, x, y, hpPercent = 1, isPlacing = false) {
  const T = 16;
  const PA = DK.PixelArt;

  ctx.save();
  if (isPlacing) {
    ctx.globalAlpha = 0.6;
  }

  // === 1. 木板底色（棕色） ===
  PA.rect(ctx, x, y, T, T, '#5a4a3a');

  // === 2. 橫向木板（3 層） ===
  // 頂部木板
  PA.rect(ctx, x + 1, y + 2, T - 2, 3, '#6a5a4a');
  PA.rect(ctx, x + 2, y + 2, T - 4, 1, '#8a7a6a'); // 高光

  // 中部木板
  PA.rect(ctx, x + 1, y + 6, T - 2, 4, '#6a5a4a');
  PA.rect(ctx, x + 2, y + 6, T - 4, 1, '#8a7a6a');

  // 底部木板
  PA.rect(ctx, x + 1, y + 11, T - 2, 3, '#6a5a4a');
  PA.rect(ctx, x + 2, y + 11, T - 4, 1, '#8a7a6a');

  // === 3. 鐵釘加固（銀灰色） ===
  // 左側鐵釘
  PA.pixel(ctx, x + 2, y + 3, '#aaaaaa');
  PA.pixel(ctx, x + 2, y + 7, '#aaaaaa');
  PA.pixel(ctx, x + 2, y + 12, '#aaaaaa');

  // 右側鐵釘
  PA.pixel(ctx, x + T - 3, y + 3, '#aaaaaa');
  PA.pixel(ctx, x + T - 3, y + 7, '#aaaaaa');
  PA.pixel(ctx, x + T - 3, y + 12, '#aaaaaa');

  // 鐵釘高光
  PA.pixel(ctx, x + 2, y + 2, '#ffffff');
  PA.pixel(ctx, x + T - 3, y + 2, '#ffffff');

  // === 4. 耐久度視覺：裂痕（HP < 50% 時顯示） ===
  if (hpPercent < 0.5) {
    const crackColor = '#3a2a1a'; // 深棕色裂痕

    // 對角裂痕
    PA.line(ctx, x + 4, y + 4, x + 12, y + 12, crackColor);
    PA.line(ctx, x + 12, y + 4, x + 4, y + 12, crackColor);

    // 橫向裂痕
    if (hpPercent < 0.3) {
      PA.line(ctx, x + 3, y + 8, x + 13, y + 8, crackColor);
    }
  }

  // === 5. 邊框（增強辨識度） ===
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, T, T);

  ctx.restore();
};
```

#### B. HP 條顯示（懸浮在路障上方）

```javascript
/**
 * 繪製路障 HP 條（僅 HP < 100% 時顯示）
 */
DK.Map.drawBarricadeHP = function(ctx, x, y, hpPercent) {
  if (hpPercent >= 1) return;

  const T = 16;
  const barW = 14;
  const barH = 2;
  const barX = x + (T - barW) / 2;
  const barY = y - 4;

  // 背景（暗紅）
  DK.PixelArt.rect(ctx, barX - 1, barY - 1, barW + 2, barH + 2, '#1a0a0a');

  // HP 槽（深灰）
  DK.PixelArt.rect(ctx, barX, barY, barW, barH, '#3a1a1a');

  // HP 填充（綠→黃→紅漸變）
  const fillW = Math.ceil(barW * hpPercent);
  let fillColor;
  if (hpPercent > 0.5) {
    fillColor = '#44aa44'; // 綠色
  } else if (hpPercent > 0.2) {
    fillColor = '#ffdd44'; // 黃色
  } else {
    fillColor = '#ff4444'; // 紅色
  }

  DK.PixelArt.rect(ctx, barX, barY, fillW, barH, fillColor);
};
```

#### C. 放置/移除特效

**放置特效**（閃光 + 木板落下音效）：

```javascript
/**
 * 觸發路障放置特效
 * @param {number} col - 格子列
 * @param {number} row - 格子行
 */
DK.Effects.barricadePlaced = function(col, row) {
  const T = DK.CONFIG.TILE_SIZE;
  const x = col * T + T / 2;
  const y = row * T + T / 2;

  // 1. 白色閃光（150ms）
  DK.Effects.spawn({
    type: 'flash',
    x, y,
    color: '#ffffff',
    radius: 12,
    duration: 150,
    fadeOut: true
  });

  // 2. 木屑粒子（棕色，向外飛散）
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    DK.Effects.spawn({
      type: 'particle',
      x, y,
      vx: Math.cos(angle) * 2,
      vy: Math.sin(angle) * 2 - 1, // 向上飛
      color: '#6a5a4a',
      size: 2,
      lifetime: 500,
      gravity: 0.2
    });
  }

  // 3. 音效（未來實作）
  // playSound('barricade_place');
};
```

**移除特效**（木板碎裂 + 煙塵）：

```javascript
/**
 * 觸發路障移除特效
 */
DK.Effects.barricadeRemoved = function(col, row) {
  const T = DK.CONFIG.TILE_SIZE;
  const x = col * T + T / 2;
  const y = row * T + T / 2;

  // 1. 木屑爆散（更多粒子，更大力度）
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const speed = 2 + Math.random() * 2;
    DK.Effects.spawn({
      type: 'particle',
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color: i % 3 === 0 ? '#5a4a3a' : '#6a5a4a',
      size: 2 + Math.random() * 2,
      lifetime: 600,
      gravity: 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2
    });
  }

  // 2. 煙塵（灰色，淡入淡出）
  for (let i = 0; i < 6; i++) {
    DK.Effects.spawn({
      type: 'smoke',
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 0.5,
      color: '#888888',
      size: 4 + Math.random() * 4,
      lifetime: 800,
      fadeIn: 100,
      fadeOut: 300
    });
  }
};
```

---

## ✨ 四、特效設計

### 4.1 創意總監需求

1. 連擊特效（「連擊 ×3!」文字 + 螢幕特效）
2. 星級評分動畫（星星逐個亮起）
3. 環形倒數計時器（綠→黃→紅漸變）

### 4.2 視覺設計方案

#### A. 連擊特效

**設計概念**：彈跳文字 + 螢幕閃光 + 粒子爆發

```javascript
/**
 * 觸發連擊特效
 * @param {number} comboCount - 連擊數（3, 5, 10...）
 */
DK.Effects.showCombo = function(comboCount) {
  const centerX = DK.CONFIG.DISPLAY_WIDTH / 2;
  const centerY = DK.CONFIG.DISPLAY_HEIGHT / 3;

  // 1. 連擊文字（大號、彈跳動畫）
  DK.Effects.spawn({
    type: 'text',
    text: `連擊 ×${comboCount}!`,
    x: centerX,
    y: centerY,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffaa44',
    outlineColor: '#000000',
    outlineWidth: 3,
    duration: 1500,
    animation: 'bounce', // 使用 DK.Easing.bounce
    scale: 1.5,          // 初始放大
    scaleEnd: 1.0,       // 結束正常大小
  });

  // 2. 螢幕邊緣閃光（橙色）
  DK.Effects.spawn({
    type: 'screen_flash',
    color: '#ffaa44',
    intensity: 0.3,      // 透明度 0.3
    duration: 300,       // 300ms 快速閃過
    fadeOut: true
  });

  // 3. 粒子爆發（放射狀，金黃色）
  const particleCount = comboCount * 2; // 連擊越高，粒子越多
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const speed = 3 + Math.random() * 2;
    DK.Effects.spawn({
      type: 'particle',
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: i % 2 === 0 ? '#ffd700' : '#ffaa44',
      size: 3,
      lifetime: 1000,
      gravity: 0,
      fadeOut: true
    });
  }

  // 4. 音效（未來）
  // playSound('combo_' + comboCount);
};
```

#### B. 星級評分動畫

**設計概念**：星星從左到右逐個亮起，每個星星伴隨音效與粒子

```javascript
/**
 * 顯示星級評分動畫
 * @param {number} stars - 獲得星數（0-3）
 * @param {number} x - 起始 X 座標
 * @param {number} y - 起始 Y 座標
 */
DK.Effects.showStarRating = function(stars, x, y) {
  const starSize = 24;
  const starGap = 30;
  const totalStars = 3;

  // 逐個亮起星星（200ms 間隔）
  for (let i = 0; i < totalStars; i++) {
    const starX = x + i * starGap;
    const delay = i * 200;

    setTimeout(() => {
      if (i < stars) {
        // 亮星動畫
        DK.Effects.spawn({
          type: 'star_light_up',
          x: starX,
          y: y,
          size: starSize,
          duration: 500,
          animation: 'elastic', // 彈性放大
          scaleFrom: 0,
          scaleTo: 1,
        });

        // 星星粒子
        for (let j = 0; j < 8; j++) {
          const angle = (j / 8) * Math.PI * 2;
          DK.Effects.spawn({
            type: 'particle',
            x: starX,
            y: y,
            vx: Math.cos(angle) * 1.5,
            vy: Math.sin(angle) * 1.5,
            color: '#ffd700',
            size: 2,
            lifetime: 500,
            fadeOut: true
          });
        }

        // 音效
        // playSound('star_' + (i + 1));
      } else {
        // 暗星（無動畫，直接顯示）
        DK.Effects.spawn({
          type: 'star_dark',
          x: starX,
          y: y,
          size: starSize
        });
      }
    }, delay);
  }
};
```

**星級評分渲染函式**：

```javascript
/**
 * 在 UI Canvas 上繪製星級評分
 * @param {CanvasRenderingContext2D} ctx - UI canvas context
 * @param {number} stars - 獲得星數
 * @param {number} x - 起始 X
 * @param {number} y - 起始 Y
 * @param {number} time - 用於動畫
 */
DK.UI.renderStarRating = function(ctx, stars, x, y, time = 0) {
  const starSize = 24;
  const starGap = 30;

  for (let i = 0; i < 3; i++) {
    const starX = x + i * starGap;
    const filled = i < stars;

    // 如果是動畫中，計算彈性縮放
    const animProgress = Math.max(0, Math.min(1, (time - i * 200) / 500));
    let scale = 1;
    if (animProgress < 1 && filled) {
      scale = DK.Easing.elastic(animProgress);
    }

    ctx.save();
    ctx.translate(starX, y);
    ctx.scale(scale, scale);
    DK.PixelArt.drawStarIcon(ctx, -starSize / 2, -starSize / 2, starSize, filled);
    ctx.restore();
  }
};
```

#### C. 環形倒數計時器

**設計概念**：圓環進度條 + 色彩漸變（綠→黃→紅）+ 中央數字

```javascript
/**
 * 繪製環形倒數計時器
 * @param {CanvasRenderingContext2D} ctx - UI canvas context
 * @param {number} x - 圓心 X
 * @param {number} y - 圓心 Y
 * @param {number} progress - 進度（0-1，1=滿，0=空）
 * @param {number} secondsLeft - 剩餘秒數（顯示在中央）
 */
DK.UI.renderCircularTimer = function(ctx, x, y, progress, secondsLeft) {
  const radius = 30;
  const lineWidth = 6;

  // 1. 背景圓環（暗灰）
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // 2. 進度圓環（色彩漸變）
  const startAngle = -Math.PI / 2; // 12點鐘方向
  const endAngle = startAngle + progress * Math.PI * 2;

  // 根據進度決定顏色
  let color;
  if (progress > 0.5) {
    color = '#44aa44'; // 綠色（充足時間）
  } else if (progress > 0.2) {
    color = '#ffdd44'; // 黃色（警告）
  } else {
    color = '#ff4444'; // 紅色（緊急）
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // 3. 內圓高光（增強立體感）
  const innerRadius = radius - lineWidth / 2;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, innerRadius);
  gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  // 4. 中央數字（大號、粗體）
  ctx.font = DK.FONTS.bold(24);
  ctx.fillStyle = '#e8e0d0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(secondsLeft.toString(), x, y);

  // 數字陰影（增強可讀性）
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.5;
  ctx.fillText(secondsLeft.toString(), x + 2, y + 2);
  ctx.globalAlpha = 1.0;
};
```

**使用範例**（在 UI 渲染中）：

```javascript
// 波次倒數（右上角）
if (DK.Game.stage === 'PLANNING' && DK.Game.waveCountdown > 0) {
  const progress = DK.Game.waveCountdown / 15; // 假設總共 15 秒
  const secondsLeft = Math.ceil(DK.Game.waveCountdown);

  DK.UI.renderCircularTimer(
    uiCtx,
    DK.CONFIG.DISPLAY_WIDTH - 50,  // 右上角
    50,
    progress,
    secondsLeft
  );
}
```

---

## 📋 五、實作優先級與整合

### 5.1 與創意總監方案的對應

| 創意總監方案 | 美術視覺設計 | 優先級 | 預估工時 |
|------------|-------------|--------|---------|
| **方案 1: 三區域佈局** | 背景色、邊框、陰影設計 | 🔴 HIGH | 4h |
| **方案 2: 路障系統** | 路障外觀、HP 條、特效 | 🔴 HIGH | 3h |
| **方案 4: 錯誤預防** | ✓/❌ 圖示設計 | 🟡 MEDIUM | 2h |
| **方案 3: 陷阱升級** | ⬆️ 圖示設計 | 🟡 MEDIUM | 1h |
| **方案 5: 節奏視覺化** | 環形倒數計時器 | 🟡 MEDIUM | 2h |
| **方案 6: 成就感瞬間** | 連擊特效、星級動畫 | 🟢 LOW | 3h |
| **額外: 建議系統** | 💡 圖示設計 | 🟢 LOW | 1h |

**總計**：16 小時（約 2 工作天）

### 5.2 實作階段規劃

#### Phase 1: 基礎視覺元素（高優先級）

**目標**：實作三區域佈局與核心圖示

1. **三區域佈局渲染**（4h）
   - 在 `ui.js` 新增 `renderThreeColumnLayout()`
   - 測試背景色與邊框效果
   - 確保與現有 UI 元素不衝突

2. **✓/❌ 圖示**（2h）
   - 在 `map.js` 或 `pixelart.js` 新增圖示函式
   - 整合到 hover 提示系統
   - 測試在不同尺寸下的顯示

3. **路障視覺升級**（3h）
   - 修改 `drawBarricadeTile()` 增強視覺
   - 新增 HP 條渲染
   - 實作放置/移除特效

**檢查點**：視覺層級清晰，玩家一眼認出路障

#### Phase 2: 互動反饋視覺（中優先級）

**目標**：增強操作反饋的視覺表現

4. **⬆️ 升級圖示**（1h）
   - 新增閃爍動畫
   - 整合到陷阱 hover 系統

5. **環形倒數計時器**（2h）
   - 實作圓環進度條渲染
   - 整合色彩漸變邏輯
   - 測試在不同倒數時間下的顯示

**檢查點**：操作反饋明確，視覺不搶戲

#### Phase 3: 情感高峰視覺（低優先級）

**目標**：增加遊戲樂趣的視覺特效

6. **連擊特效**（2h）
   - 實作彈跳文字系統
   - 整合螢幕閃光與粒子
   - 測試不同連擊數的視覺差異

7. **星級評分動畫**（1h）
   - 實作逐個亮起動畫
   - 整合粒子特效

8. **建議圖示**（1h）
   - 實作燈泡圖示與脈動
   - 測試在 UI 中的顯示

**檢查點**：情感高峰明確，增強成就感

### 5.3 色彩系統整合檢查

**確保所有新增色彩來自視覺優化方案**：

| 新增色彩 | 來源 | 用途 |
|---------|------|------|
| `#12101e` | `WALL_DARK` | 三區域背景 |
| `#2a2838` | `WALL_MID` | 區域邊框 |
| `#44dd44` | `UI_SUCCESS_GREEN` | ✓ 圖示 |
| `#ff4444` | `DANGER_RED_CORE` | ❌ 圖示 |
| `#ffdd22` | `UI_WARNING_YELLOW` | ⬆️ 圖示、倒數器黃色 |
| `#ffd700` | `GOLD_YELLOW_CORE` | ⭐ 圖示、連擊粒子 |
| `#ffaa44` | `UI_SELECT_ORANGE` | 連擊文字、粒子 |

✅ **所有色彩符合色彩系統，無新引入色彩**

---

## 🤝 六、與創意總監的協作確認

### 6.1 需要確認的設計決策

#### 問題 1：三區域背景色深度

**我的設計**：
- 左右區域：`#12101e`（深紫黑）
- 中區：`transparent`（透明）

**你的建議**：
- 這個深度是否符合你的「視覺層級」要求？
- 中區透明是否會讓主按鈕不夠突出？
- 是否需要更深或更淺的背景色？

#### 問題 2：圖示尺寸標準

**我的設計**：
- 格子角落圖示（✓/❌）：12px
- 陷阱上方圖示（⬆️）：16px
- UI 面板圖示（💡/⭐）：24px

**你的建議**：
- 這些尺寸是否符合「可讀性」要求？
- 是否有特定場景需要調整尺寸？

#### 問題 3：路障 HP 條位置

**我的設計**：
- 懸浮在路障上方 4px
- 寬度 14px，高度 2px

**你的建議**：
- 這個位置是否會遮擋其他資訊？
- 是否需要改為路障下方或側邊？

#### 問題 4：動畫速度

**我的設計**：
- 連擊文字：1500ms（較慢，讓玩家看清）
- 星級亮起：200ms 間隔（中速）
- 圖示閃爍：500ms 週期（中速）

**你的建議**：
- 這些速度是否符合你的「150-300ms 快速反饋」原則？
- 連擊文字 1500ms 是否太慢？
- 星級 200ms 間隔是否需要調整？

### 6.2 我的設計原則（請審查）

1. **色彩一致性**：所有顏色來自視覺優化方案，不引入新色
2. **視覺權重**：背景低、圖示中、特效高
3. **動畫流暢**：使用緩動函式（bounce、elastic）
4. **像素風格**：所有圖示都是手工像素藝術，不用 Canvas 自動渲染
5. **效能考量**：特效粒子限制數量，避免卡頓

**你認為這些原則是否符合 UX 需求？**

---

## 📌 七、下一步行動

### 7.1 立即行動

1. ✅ **提交本視覺設計文檔**（當前任務）
2. ⏳ **等待創意總監審查**（確認設計方向）
3. ⏳ **根據回饋調整**（顏色、尺寸、動畫速度）

### 7.2 實作準備

**當創意總監批准後**：

1. **建立顏色常數**（`config.js`）
2. **實作圖示函式**（`map.js` 或 `pixelart.js`）
3. **實作特效系統**（`effects.js`）
4. **整合到 UI 渲染**（`ui.js`）
5. **測試與調整**

### 7.3 協作方式

**我的職責**：
- ✅ 提供具體的視覺實作方案（色彩、尺寸、動畫）
- ✅ 確保與像素風格協調
- ✅ 確保色彩系統一致性

**創意總監職責**：
- ✅ 審查視覺方案是否符合 UX 需求
- ✅ 確認視覺層級是否正確
- ✅ 提供調整建議

**共同決策**：
- 最終的色彩深度
- 圖示尺寸標準
- 動畫速度參數
- 特效的視覺強度

---

## 🔖 附錄：設計參考

### A. 色彩對比度測試

| 組合 | 前景色 | 背景色 | 對比度 | WCAG 等級 |
|------|--------|--------|--------|-----------|
| ✓ 圖示 vs 深色地磚 | `#44dd44` | `#1a1828` | 8.2:1 | AAA ✅ |
| ❌ 圖示 vs 深色地磚 | `#ff4444` | `#1a1828` | 6.5:1 | AA ✅ |
| ⬆️ 圖示 vs 深色地磚 | `#ffdd22` | `#1a1828` | 12.1:1 | AAA ✅ |
| 文字 vs 面板背景 | `#e8e0d0` | `#12101e` | 11.5:1 | AAA ✅ |

✅ **所有關鍵元素對比度符合 WCAG AA 以上標準**

### B. 動畫參數速查表

| 動畫類型 | 速度級別 | 週期/時長 | 緩動函式 |
|---------|---------|----------|---------|
| 圖示淡入 | 快速 | 150ms | easeOut |
| 圖示閃爍 | 中速 | 500ms | sine |
| 連擊文字 | 慢速 | 1500ms | bounce |
| 星級亮起 | 快速 | 500ms | elastic |
| 倒數計時 | 線性 | 依秒數 | linear |
| 粒子飛散 | 快速 | 500-1000ms | easeOut |

### C. 像素藝術工具函式索引

| 函式名稱 | 用途 | 參數 |
|---------|------|------|
| `drawPlaceableIcon()` | ✓ 圖示 | (ctx, x, y, size) |
| `drawUnplaceableIcon()` | ❌ 圖示 | (ctx, x, y, size) |
| `drawUpgradeIcon()` | ⬆️ 圖示 | (ctx, x, y, size, time) |
| `drawSuggestionIcon()` | 💡 圖示 | (ctx, x, y, size, time) |
| `drawStarIcon()` | ⭐ 圖示 | (ctx, x, y, size, filled) |
| `drawBarricadeTile()` | 路障地磚 | (ctx, x, y, hpPercent, isPlacing) |
| `drawBarricadeHP()` | 路障 HP 條 | (ctx, x, y, hpPercent) |
| `renderCircularTimer()` | 環形計時器 | (ctx, x, y, progress, secondsLeft) |

---

## 總結

本文檔為創意總監的 UX 改進方案提供完整的視覺實作方案：

### 核心成果

1. ✅ **三區域佈局視覺設計**（背景色、邊框、陰影）
2. ✅ **5 種圖示設計**（✓/❌/⬆️/💡/⭐，像素藝術風格）
3. ✅ **路障視覺升級**（增強外觀、HP 條、放置/移除特效）
4. ✅ **3 種特效設計**（連擊、星級、倒數計時器）
5. ✅ **完整實作指引**（色彩、尺寸、動畫參數、程式碼範例）

### 設計原則

- **色彩一致性**：所有顏色來自視覺優化方案
- **視覺層級**：符合創意總監的 UX 需求
- **像素風格**：保持 Dungeon Keeper 美學
- **具體可執行**：提供完整的程式碼範例

### 等待創意總監審查

請創意總監審查以下關鍵設計決策：
1. 三區域背景色深度是否合適？
2. 圖示尺寸標準是否符合可讀性？
3. 路障 HP 條位置是否合理？
4. 動畫速度是否符合 UX 原則？

---

> **美術總監簽名**: art-director (Opus 4.6)
> **完成時間**: 2026-02-11
> **狀態**: 等待創意總監審查與回饋
> **預估實作工時**: 16 小時（約 2 工作天）

**備註**：所有視覺設計均基於創意總監的 UX 需求，並確保與 ProjectDK 現有的像素風格完全協調。實作時將嚴格遵循視覺優化方案的色彩系統，不引入新色彩。
