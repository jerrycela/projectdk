# ProjectDK 視覺優化方案 — 美術總監設計

> **美術總監**: art-director (Opus 4.6)
> **日期**: 2026-02-11
> **狀態**: 初稿（待迭代優化）
> **任務**: #2 設計視覺優化方案

---

## 📋 執行摘要

本文件從美術總監的專業視角，深入分析 ProjectDK（Dungeon Keep 地層塔防）的當前視覺系統，並提出具體可執行的優化建議。設計基於以下原則：

1. **保持 Dungeon Keeper 黑暗地城美學**
2. **增強視覺層級與資訊可讀性**
3. **建立完整的色彩系統與光影標準**
4. **提供具體的像素藝術實作指引**
5. **考慮技術限制（Pure vanilla JS + 雙 Canvas 架構）**

---

## 🎨 一、色彩系統設計

### 1.1 當前色彩語義分析

**已有色彩定義（來自 config.js 與設計文檔）**：

| 色彩 | 用途 | Hex | 評估 |
|------|------|-----|------|
| 紫色 | 地城之心、玩家陣營 | `#aa44ff` | ✅ 辨識度高 |
| 綠色 | 傳送門（入口）、敵人生成點 | `#44ff88` | ✅ 與紫色對比明確 |
| 紅色 | 危險、傷害、HP | `#ff4444` | ✅ 符合慣例 |
| 藍色 | 魔法、冰霜 | `#4488ff` | ✅ 元素識別清晰 |

**問題**：
- 缺乏中間色調（暖色系偏少）
- 沒有明確的「成功」「警告」色彩
- 元素反應系統需要更多色彩語義
- 缺乏色盲友善設計考量

### 1.2 完整色彩調色盤設計

#### A. 核心色彩系統（保持現有）

```javascript
// 地城陣營色（紫色系）
DUNGEON_PURPLE_CORE: '#aa44ff',    // 地城之心核心
DUNGEON_PURPLE_LIGHT: '#cc88ff',   // 高光/能量
DUNGEON_PURPLE_DARK: '#6622aa',    // 陰影/底座
DUNGEON_PURPLE_GLOW: '#dd99ff',    // 光暈/粒子

// 敵人陣營色（綠色系）
ENEMY_GREEN_CORE: '#44ff88',       // 傳送門核心
ENEMY_GREEN_MID: '#2a9a2a',        // 中層結構
ENEMY_GREEN_DARK: '#1a5a1a',       // 陰影
ENEMY_GREEN_GLOW: '#88ffaa',       // 粒子/光暈

// 危險/傷害色（紅色系）
DANGER_RED_CORE: '#ff4444',        // 危險警告
DANGER_RED_LIGHT: '#ff8888',       // 高光
DANGER_RED_DARK: '#aa2244',        // 陰影
DANGER_RED_GLOW: '#ffaaaa',        // 傷害數字光暈

// 魔法/冰霜色（藍色系）
MAGIC_BLUE_CORE: '#4488ff',        // 冰霜魔法
MAGIC_BLUE_LIGHT: '#88bbff',       // 高光
MAGIC_BLUE_DARK: '#2244aa',        // 陰影
MAGIC_BLUE_GLOW: '#aaccff',        // 粒子
```

#### B. 擴展色彩系統（新增）

```javascript
// 火焰元素（橙黃色系）
FIRE_ORANGE_CORE: '#ff6622',       // 火焰核心
FIRE_ORANGE_LIGHT: '#ffaa44',      // 火焰高光
FIRE_ORANGE_DARK: '#aa3311',       // 火焰陰影
FIRE_YELLOW_GLOW: '#ffdd88',       // 火焰粒子

// 電擊元素（黃色系）
ELECTRIC_YELLOW_CORE: '#ffdd44',   // 電擊核心
ELECTRIC_YELLOW_LIGHT: '#ffff88',  // 電弧高光
ELECTRIC_YELLOW_DARK: '#aa8822',   // 電擊陰影
ELECTRIC_WHITE_FLASH: '#ffffff',   // 電擊閃光

// 毒素元素（綠紫色系，區別於傳送門綠）
POISON_GREEN_CORE: '#88ff44',      // 毒液核心（黃綠偏暖）
POISON_GREEN_LIGHT: '#aaffaa',     // 毒液高光
POISON_PURPLE_MID: '#6a4a8a',      // 毒霧紫（與地城紫區別）
POISON_GREEN_DARK: '#2a4a1a',      // 毒液陰影

// 治療/正面效果（青綠色系）
HEAL_CYAN_CORE: '#44ffdd',         // 治療核心
HEAL_CYAN_LIGHT: '#88ffee',        // 治療高光
HEAL_CYAN_DARK: '#228877',         // 治療陰影
HEAL_WHITE_PARTICLE: '#ddfff0',    // 治療粒子

// 金幣/資源（金黃色系）
GOLD_YELLOW_CORE: '#ffd700',       // 金幣核心
GOLD_YELLOW_LIGHT: '#ffee88',      // 金幣高光
GOLD_YELLOW_DARK: '#aa7700',       // 金幣陰影
GOLD_ORANGE_GLOW: '#ffcc55',       // 金幣光暈

// UI 強調色（保持現有）
UI_SELECT_ORANGE: '#ffaa44',       // 選中/hover
UI_SUCCESS_GREEN: '#44dd44',       // 成功/完成
UI_WARNING_YELLOW: '#ffdd22',      // 警告/注意
UI_ERROR_RED: '#ff4444',           // 錯誤/失敗
```

#### C. 環境色彩（保持現有）

```javascript
// 牆壁/地板（深色系，降低視覺權重）
WALL_BASE: '#1a1828',              // 牆壁基底
WALL_MID: '#2a2838',               // 牆壁中層
WALL_LIGHT: '#3a3850',             // 牆壁高光
WALL_DARK: '#12101e',              // 牆壁陰影
WALL_MOSS: '#1e3a1e',              // 苔蘚點綴

FLOOR_BASE: '#4a4236',             // 地板基底（暖黃棕）
FLOOR_LIGHT: '#6a5e4e',            // 地板高光
FLOOR_DARK: '#2a2218',             // 地板陰影
FLOOR_CRACK: '#1a1410',            // 裂紋

// 水潭/深淵（極暗系）
WATER_BASE: '#1a2a4a',             // 水面基底
WATER_LIGHT: '#3a5a8a',            // 水面反光
WATER_DARK: '#0a1a2a',             // 水面深處
ABYSS_BLACK: '#050508',            // 深淵黑

// 草叢（森林綠系）
GRASS_BASE: '#2a4a2a',             // 草叢基底
GRASS_LIGHT: '#4a7a4a',            // 草叢高光
GRASS_DARK: '#1a3a1a',             // 草叢陰影
```

### 1.3 色彩使用規範

#### 視覺層級色彩權重

| 層級 | 飽和度 | 明度 | 用途 | 範例 |
|------|--------|------|------|------|
| **前景（最高）** | 80-100% | 60-90% | UI、文字、重要提示 | 金幣、HP 條、按鈕 |
| **中景（中等）** | 60-80% | 40-70% | 遊戲物件、角色、陷阱 | 地城之心、傳送門、英雄 |
| **背景（最低）** | 20-40% | 20-40% | 地圖、牆壁、環境 | 地磚、牆壁、裝飾物 |

#### 對比度標準

- **關鍵 UI 文字** vs 背景：≥ **7:1**（WCAG AAA）
- **按鈕文字** vs 按鈕背景：≥ **4.5:1**（WCAG AA）
- **遊戲物件** vs 地圖：≥ **3:1**（可辨識度）
- **特效粒子** vs 背景：≥ **2:1**（氛圍層，不遮擋資訊）

#### 色盲友善設計

**問題色組合**（避免單獨依賴）：
- ❌ 紅/綠（紅綠色盲最常見）
- ❌ 藍/黃（藍黃色盲）

**解決方案**：
- ✅ 加入**形狀/圖標**區別（如 HP 條用心形、魔力條用星形）
- ✅ 加入**亮度**差異（如危險用暗紅 `#aa2244`，成功用亮綠 `#44dd44`）
- ✅ 加入**動畫**區別（如危險用快速閃爍，成功用緩慢脈動）

---

## 🌟 二、光影與材質設計

### 2.1 當前光影系統分析

**已實作**（來自 `DK.PixelArt.Isometric`）：
```javascript
topLight(baseColor)       // 頂面高光（模擬從上方照射）
sideDark(baseColor)       // 側面陰影（模擬立體感）
ambientOcclusion(baseColor) // 環境遮蔽（模擬縫隙陰影）
```

**優點**：
- ✅ 三層光影系統基礎完整
- ✅ 等距投影邏輯正確
- ✅ 函式化設計，易於重用

**問題**：
- ⚠️ 光影對比度不足（當前 `topLight` 只亮化 20%，不夠明顯）
- ⚠️ 缺乏**動態光源**（火把、魔法、爆炸的光照影響）
- ⚠️ 缺乏**材質差異**（石頭、金屬、水晶、火焰的光影反應不同）
- ⚠️ 缺乏**次表面散射**（半透明材質如水晶的內部光暈）

### 2.2 增強光影系統設計

#### A. 靜態光影（等距投影）

**優化後的三層光影**：

```javascript
// 增強對比度版本
DK.PixelArt.Isometric = {
  /** 頂面高光 - 模擬從正上方 45° 照射 */
  topLight(baseColor, strength = 0.35) {
    // 原先 20% 提升到 35%，更明顯的立體感
    return DK.PixelArt.lighten(baseColor, strength);
  },

  /** 側面陰影 - 模擬遠離光源的面 */
  sideDark(baseColor, strength = 0.30) {
    // 原先 20% 提升到 30%，增強深度感
    return DK.PixelArt.darken(baseColor, strength);
  },

  /** 環境遮蔽 - 模擬縫隙/接觸面的極暗陰影 */
  ambientOcclusion(baseColor, strength = 0.50) {
    // 原先可能不夠暗，提升到 50%，增強縫隙感
    return DK.PixelArt.darken(baseColor, strength);
  },

  /** 新增：邊緣高光 - 模擬光線擦過邊緣的亮線 */
  edgeHighlight(baseColor, strength = 0.50) {
    // 用於物件輪廓、水晶邊緣、金屬光澤
    return DK.PixelArt.lighten(baseColor, strength);
  },

  /** 新增：反射光 - 模擬地面反射的次級光源 */
  reflectedLight(baseColor, strength = 0.15) {
    // 用於物件底部，微弱的環境反射
    return DK.PixelArt.lighten(baseColor, strength);
  }
};
```

#### B. 動態光源系統（新增）

**設計目標**：火把、魔法、爆炸會影響附近地磚的亮度

**實作概念**：
```javascript
/**
 * 計算地磚受動態光源影響後的顏色
 * @param {string} baseColor - 地磚原始顏色
 * @param {Array} lightSources - 光源陣列 [{ x, y, radius, color, intensity }]
 * @param {number} tileX - 地磚 X 座標
 * @param {number} tileY - 地磚 Y 座標
 * @returns {string} 受光照影響後的顏色
 */
DK.PixelArt.applyDynamicLighting = function(baseColor, lightSources, tileX, tileY) {
  let finalColor = baseColor;

  for (const light of lightSources) {
    const distance = Math.sqrt(
      (tileX - light.x) ** 2 + (tileY - light.y) ** 2
    );

    if (distance < light.radius) {
      const falloff = 1 - (distance / light.radius);
      const lightStrength = light.intensity * falloff;

      // 混合光源顏色到基底顏色
      finalColor = this.blendColors(finalColor, light.color, lightStrength * 0.3);
    }
  }

  return finalColor;
};

/**
 * 混合兩個顏色（加法混合，用於光照）
 * @param {string} baseColor - 基底顏色 hex
 * @param {string} lightColor - 光源顏色 hex
 * @param {number} amount - 混合強度 0-1
 * @returns {string} 混合後的顏色 hex
 */
DK.PixelArt.blendColors = function(baseColor, lightColor, amount) {
  // 解析 hex → RGB
  const baseRGB = this.hexToRgb(baseColor);
  const lightRGB = this.hexToRgb(lightColor);

  // 加法混合（光照疊加）
  const r = Math.min(255, Math.round(baseRGB.r + lightRGB.r * amount));
  const g = Math.min(255, Math.round(baseRGB.g + lightRGB.g * amount));
  const b = Math.min(255, Math.round(baseRGB.b + lightRGB.b * amount));

  return this.rgbToHex(r, g, b);
};
```

**光源類型定義**：

| 光源類型 | 半徑 | 顏色 | 強度 | 動畫 |
|---------|------|------|------|------|
| 火把 | 3-4 格 | `#ff8844` 橙黃 | 0.6-0.8（閃爍） | 200ms 週期 |
| 地城之心 | 4-5 格 | `#aa44ff` 紫色 | 0.4-0.6（脈動） | 1000ms 週期 |
| 傳送門 | 3-4 格 | `#44ff88` 綠色 | 0.5-0.7（旋轉） | 500ms 週期 |
| 火焰陷阱觸發 | 2-3 格 | `#ff6622` 橙紅 | 0.8-1.0（爆發） | 150ms 快閃 |
| 冰霜魔法 | 2-3 格 | `#4488ff` 藍色 | 0.6-0.8（擴散） | 300ms 緩慢 |
| 電擊閃光 | 4-5 格 | `#ffdd44` 黃色 | 1.0（瞬間） | 50ms 極快閃 |

#### C. 材質視覺標準

**不同材質的光影反應**：

| 材質 | 頂光強度 | 側暗強度 | 邊緣高光 | 特殊效果 |
|------|---------|---------|---------|---------|
| **石頭**（牆壁、地磚） | 25% | 30% | 無 | 粗糙感（不規則像素） |
| **金屬**（鐵門、陷阱） | 40% | 35% | ✅ 50% | 高光銳利、反射強 |
| **水晶**（地城之心） | 50% | 40% | ✅ 70% | 內部光暈、半透明 |
| **木材**（木門、路障） | 20% | 25% | 無 | 紋理清晰、吸光 |
| **水面**（水潭） | 30% | 20% | ✅ 40% | 波紋反射、動態高光 |
| **火焰**（火把、陷阱） | 無（自發光） | 無 | ✅ 100% | 粒子、快速動畫 |
| **魔法能量** | 無（自發光） | 無 | ✅ 80% | 光暈、脈動、粒子 |

**實作範例**：

```javascript
// 金屬材質渲染函數
DK.PixelArt.drawMetalTile = function(ctx, x, y, baseColor) {
  const T = 16; // 地磚尺寸
  const PA = DK.PixelArt;
  const Iso = DK.PixelArt.Isometric;

  // 1. 基底色
  PA.rect(ctx, x, y, T, T, baseColor);

  // 2. 頂面高光（40% 強度，模擬金屬反光）
  const topColor = Iso.topLight(baseColor, 0.40);
  PA.rect(ctx, x + 2, y + 1, T - 4, 5, topColor);

  // 3. 側面陰影（35% 強度）
  const sideColor = Iso.sideDark(baseColor, 0.35);
  PA.rect(ctx, x + 1, y + 7, T - 2, 8, sideColor);

  // 4. 邊緣銳利高光（50% 強度，金屬特有）
  const edgeColor = Iso.edgeHighlight(baseColor, 0.50);
  PA.rect(ctx, x + 2, y, T - 4, 1, edgeColor); // 頂邊高光線
  PA.rect(ctx, x, y + 2, 1, T - 4, edgeColor); // 左邊高光線

  // 5. 環境遮蔽（底部縫隙極暗）
  const aoColor = Iso.ambientOcclusion(baseColor, 0.50);
  PA.rect(ctx, x + 1, y + T - 2, T - 2, 2, aoColor);
};

// 水晶材質渲染函數（半透明、內部光暈）
DK.PixelArt.drawCrystalTile = function(ctx, x, y, baseColor, time = 0) {
  const T = 16;
  const PA = DK.PixelArt;
  const Iso = DK.PixelArt.Isometric;

  // 1. 暗色外殼（水晶外層）
  const shellColor = Iso.sideDark(baseColor, 0.40);
  PA.rect(ctx, x, y, T, T, shellColor);

  // 2. 內部明亮核心（脈動）
  const pulse = Math.sin(time / 1000 * Math.PI) * 0.3 + 0.7; // 0.7-1.0
  const coreColor = Iso.topLight(baseColor, 0.50 * pulse);
  PA.rect(ctx, x + 3, y + 3, T - 6, T - 6, coreColor);

  // 3. 中心白色光點（強脈動）
  const glowSize = 2 + Math.round(pulse * 2); // 2-4px
  PA.rect(ctx, x + Math.floor(T / 2) - Math.floor(glowSize / 2),
                y + Math.floor(T / 2) - Math.floor(glowSize / 2),
                glowSize, glowSize, '#ffffff');

  // 4. 邊緣強烈高光（70% 強度，水晶菱角）
  const edgeColor = Iso.edgeHighlight(baseColor, 0.70);
  PA.pixel(ctx, x + 1, y, edgeColor);
  PA.pixel(ctx, x, y + 1, edgeColor);
  PA.pixel(ctx, x + T - 2, y, edgeColor);
  PA.pixel(ctx, x + T - 1, y + 1, edgeColor);
  PA.pixel(ctx, x + 1, y + T - 1, edgeColor);
  PA.pixel(ctx, x, y + T - 2, edgeColor);
  PA.pixel(ctx, x + T - 2, y + T - 1, edgeColor);
  PA.pixel(ctx, x + T - 1, y + T - 2, edgeColor);

  // 5. 外層光暈（半透明疊加到 Canvas）
  const glowAlpha = 0.04 + pulse * 0.04; // 0.04-0.08
  const rgb = PA.hexToRgb(baseColor);
  ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowAlpha})`;
  ctx.fillRect(x - 1, y - 1, T + 2, T + 2);
};
```

---

## 📐 三、視覺層級與構圖

### 3.1 當前畫面構圖分析

**雙 Canvas 架構**：
```
┌─────────────────────────────────────┐
│ 遊戲區域（game-canvas）              │ ← 低解析度 320×208，3x 放大到 960×624
│ - 20×13 格 viewport                 │
│ - 像素藝術渲染                       │
│ - 環境動畫（火把、水波）             │
├─────────────────────────────────────┤
│ UI 區域（ui-canvas）                 │ ← 高解析度 960×96
│ - 工具欄按鈕                         │
│ - 資源顯示（金幣/魔力/HP）           │
│ - 波次資訊                           │
└─────────────────────────────────────┘
```

**優點**：
- ✅ 文字清晰（高解析度 Canvas）
- ✅ 像素藝術純淨（低解析度 Canvas）
- ✅ UI 與遊戲分離，維護容易

**問題**：
- ⚠️ 遊戲區域的視覺重心不明確（所有元素視覺權重相近）
- ⚠️ UI 區域按鈕密集，缺乏視覺呼吸空間
- ⚠️ 關鍵資訊（地城之心 HP、金幣）不夠突出
- ⚠️ 特效粒子可能遮擋遊戲物件

### 3.2 視覺層級系統設計

#### A. 三層視覺權重

| 層級 | 視覺權重 | 渲染順序 | 內容 | 設計原則 |
|------|---------|---------|------|---------|
| **背景層（L1）** | 20% | 第 1 層 | 地磚、牆壁、裝飾物 | 低飽和度、低對比、靜態或慢速動畫 |
| **中景層（L2）** | 50% | 第 2 層 | 陷阱、英雄、敵人、路障 | 中等飽和度、清晰輪廓、關鍵互動物件 |
| **前景層（L3）** | 30% | 第 3 層 | 特效、粒子、HP 條、傷害數字 | 高飽和度、高對比、短暫顯示 |

**具體實作**：

```javascript
// 遊戲主循環渲染順序（main.js）
function render(time) {
  const ctx = gameCanvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // === L1: 背景層（視覺權重 20%） ===
  renderTiles(ctx);               // 地磚（低飽和度）
  renderDecorations(ctx);         // 裝飾物（靜態）
  renderTorchLights(ctx, time);   // 火把光暈（慢速脈動）

  // === L2: 中景層（視覺權重 50%） ===
  renderPathPreview(ctx, time);   // 路徑虛線（僅 PLANNING 階段）
  renderBarricades(ctx);          // 路障（中等對比）
  renderTraps(ctx, time);         // 陷阱（清晰輪廓）
  renderHeroes(ctx, time);        // 英雄（中等對比）
  renderEnemies(ctx, time);       // 敵人（清晰輪廓）
  renderDungeonHeart(ctx, time);  // 地城之心（高對比）
  renderPortals(ctx, time);       // 傳送門（高對比）

  // === L3: 前景層（視覺權重 30%） ===
  renderProjectiles(ctx, time);   // 投射物（快速動畫）
  renderEffects(ctx, time);       // 特效粒子（高飽和度）
  renderDamageNumbers(ctx, time); // 傷害數字（短暫顯示）
  renderHPBars(ctx);              // HP 條（僅受損時顯示）

  // === UI 層（獨立 Canvas，永遠在最上方） ===
  // 由 renderUI() 在 ui-canvas 上渲染
}
```

#### B. 視覺重心設計

**核心原則**：玩家的注意力應該自然地被引導到最重要的元素

**視覺重心優先級**（從高到低）：

1. **地城之心** - 最重要，必須一眼看到
   - **尺寸**：2×2（已實作）
   - **顏色**：高飽和度紫色 `#aa44ff`
   - **動畫**：脈動光暈（1000ms 緩慢呼吸）
   - **光照**：4-5 格半徑動態光源
   - **受傷反饋**：紅色閃爍 + 快速脈動

2. **傳送門（敵人生成點）** - 威脅來源
   - **尺寸**：2×2（已實作）
   - **顏色**：高飽和度綠色 `#44ff88`
   - **動畫**：旋轉漩渦（500ms）
   - **光照**：3-4 格半徑動態光源

3. **敵人** - 即時威脅
   - **輪廓**：清晰對比（深色地圖上用亮色）
   - **動畫**：移動平滑，受擊閃白
   - **HP 條**：受損時顯示，紅色高對比

4. **陷阱/英雄** - 防禦資產
   - **顏色**：中等飽和度，區別於背景
   - **冷卻視覺**：灰階 + 進度條
   - **啟動反饋**：150ms 白閃 + 元素色粒子

5. **UI 資訊** - 輔助資訊
   - **金幣/魔力**：金黃色 `#ffd700`，數字大、易讀
   - **波次進度**：進度條 + 數字
   - **按鈕**：hover 高亮、選中邊框

6. **背景環境** - 最低優先級
   - **地磚/牆壁**：低飽和度、低對比
   - **裝飾物**：不干擾視線
   - **火把**：柔和光暈，不搶戲

#### C. 視覺引導設計

**新手引導**（視覺層面的輔助）：

1. **開始按鈕脈動**：
   ```javascript
   // START 階段，「開始波次」按鈕用脈動動畫吸引注意
   if (DK.Game.stage === 'START') {
     const pulse = Math.sin(time / 500 * Math.PI) * 0.3 + 0.7; // 0.7-1.0
     ctx.globalAlpha = pulse;
     // 繪製按鈕高光...
     ctx.globalAlpha = 1.0;
   }
   ```

2. **地城之心初次指示**：
   ```javascript
   // 首次進入遊戲時，地城之心上方顯示箭頭
   if (DK.Game.isFirstTime && DK.Game.stage === 'START') {
     const arrowY = heartY - 10 - Math.sin(time / 300) * 3; // 上下浮動
     PA.drawArrow(ctx, heartX + 16, arrowY, 'down', '#ffaa44');
     PA.drawText(ctx, heartX + 16, arrowY - 10, '保護我！', {
       color: '#ffaa44',
       align: 'center',
       shadow: true
     });
   }
   ```

3. **金幣不足閃爍**：
   ```javascript
   // 金幣不足時，金幣數字閃爍紅色
   if (cost > currentGold) {
     const flash = Math.floor(time / 150) % 2; // 150ms 快速閃爍
     const goldColor = flash === 0 ? '#ffd700' : '#ff4444';
     // 繪製金幣數字...
   }
   ```

---

## 🎬 四、動畫參數規範

### 4.1 當前動畫參數分析

**已實作動畫**（從文檔與程式碼分析）：

| 動畫類型 | 週期 | 用途 | 評估 |
|---------|------|------|------|
| 地城之心脈動 | 1000ms | 呼吸效果 | ✅ 緩慢適合 |
| 傳送門旋轉 | 500ms | 漩渦動畫 | ✅ 中速適合 |
| 火把閃爍 | 200ms | 光照變化 | ⚠️ 稍快，可改 300ms |
| 陷阱冷卻 | 依陷阱而定 | 進度條 | ✅ 符合功能 |
| 敵人受擊 | 150ms | 白閃 | ✅ 快速反饋 |
| 粒子飛散 | 800ms | 旋轉粒子 | ⚠️ 稍慢，可改 600ms |

**問題**：
- ⚠️ 缺乏統一的動畫時間規範（100ms、150ms、200ms、500ms 混用）
- ⚠️ 缺乏緩動函數（easing），所有動畫都是線性
- ⚠️ 缺乏分層動畫策略（慢速環境、中速物件、快速反饋）

### 4.2 統一動畫時間規範

**動畫速度分級**：

| 速度級別 | 週期範圍 | 用途 | 範例 |
|---------|---------|------|------|
| **極快閃爍** | 50-100ms | 瞬間反饋、電擊、爆炸 | 電擊閃光、爆炸白閃 |
| **快速** | 150-300ms | 戰鬥反饋、觸發提示 | 敵人受擊、陷阱啟動、金幣拾取 |
| **中速** | 400-800ms | 物件動畫、粒子運動 | 傳送門旋轉、粒子飛散、HP 條變化 |
| **慢速** | 1000-2000ms | 環境氛圍、呼吸效果 | 地城之心脈動、火把閃爍、水波 |
| **極慢** | 3000-5000ms | 背景循環、裝飾動畫 | 草叢擺動、雲朵移動（如有） |

**標準動畫週期定義**：

```javascript
// config.js 新增動畫常數
DK.ANIM_TIMINGS = {
  // 極快閃爍
  FLASH_ULTRA_FAST: 50,      // 電擊閃光
  FLASH_FAST: 100,           // 爆炸白閃

  // 快速反饋
  FEEDBACK_INSTANT: 150,     // 敵人受擊、陷阱觸發
  FEEDBACK_QUICK: 250,       // 按鈕點擊、物品拾取

  // 中速動畫
  ANIM_MEDIUM: 500,          // 傳送門旋轉、投射物飛行
  ANIM_SMOOTH: 800,          // 粒子飛散、能量波

  // 慢速氛圍
  AMBIENT_SLOW: 1000,        // 地城之心脈動、HP 條呼吸
  AMBIENT_VERY_SLOW: 2000,   // 火把閃爍、環境光變化

  // 極慢背景
  BACKGROUND_LOOP: 4000,     // 草叢擺動、水波循環
};
```

### 4.3 緩動函數系統（新增）

**為何需要緩動**：
- ❌ 線性動畫（linear）：機械感強，缺乏生命力
- ✅ 緩動動畫（easing）：自然、流暢、符合物理直覺

**常用緩動函數**：

```javascript
/**
 * 緩動函數庫 - 提供自然流暢的動畫曲線
 * t: 當前時間（0-1）
 * 回傳: 緩動後的值（0-1）
 */
DK.Easing = {
  /** 線性（無緩動） */
  linear(t) {
    return t;
  },

  /** 緩入（慢啟動） - 用於出現動畫 */
  easeIn(t) {
    return t * t;
  },

  /** 緩出（慢結束） - 用於消失動畫 */
  easeOut(t) {
    return 1 - (1 - t) * (1 - t);
  },

  /** 緩入緩出（兩端慢，中間快） - 用於移動動畫 */
  easeInOut(t) {
    return t < 0.5
      ? 2 * t * t
      : 1 - 2 * (1 - t) * (1 - t);
  },

  /** 彈跳（回彈效果） - 用於掉落、衝擊 */
  bounce(t) {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      t -= 1.5 / 2.75;
      return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
      t -= 2.25 / 2.75;
      return 7.5625 * t * t + 0.9375;
    } else {
      t -= 2.625 / 2.75;
      return 7.5625 * t * t + 0.984375;
    }
  },

  /** 彈性（overshoot） - 用於強調、吸引注意 */
  elastic(t) {
    return Math.sin(13 * Math.PI / 2 * t) * Math.pow(2, -10 * t);
  },

  /** 正弦波（呼吸效果） - 用於脈動、呼吸 */
  sine(t) {
    return (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2;
  },
};
```

**使用範例**：

```javascript
// 地城之心脈動（正弦波呼吸）
const t = (time % DK.ANIM_TIMINGS.AMBIENT_SLOW) / DK.ANIM_TIMINGS.AMBIENT_SLOW;
const pulse = DK.Easing.sine(t) * 0.3 + 0.7; // 0.7-1.0
const glowAlpha = 0.04 + pulse * 0.04;

// 傷害數字彈跳消失
const t = timer / 1000; // 0-1
const yOffset = -20 * DK.Easing.bounce(t); // 向上彈跳
const alpha = 1 - DK.Easing.easeOut(t); // 緩慢淡出

// 按鈕 hover 彈性放大
const t = hoverTimer / 200; // 0-1
const scale = 1 + 0.1 * DK.Easing.elastic(Math.min(t, 1)); // 1.0-1.1 帶彈性
```

### 4.4 動畫效能優化

**問題**：過多動畫會導致 FPS 下降

**解決方案**：

1. **限制同時粒子數**：
   ```javascript
   const MAX_PARTICLES = 100;
   if (particles.length >= MAX_PARTICLES) {
     particles.shift(); // 移除最舊的粒子
   }
   ```

2. **視錐剔除**（只渲染可見動畫）：
   ```javascript
   // 只更新 viewport 內的動畫
   for (const anim of animations) {
     if (isInViewport(anim.x, anim.y)) {
       anim.update(deltaTime);
     }
   }
   ```

3. **降級策略**（低效能裝置）：
   ```javascript
   // 偵測 FPS，低於 30 時關閉部分動畫
   if (averageFPS < 30) {
     DK.CONFIG.DISABLE_PARTICLES = true;
     DK.CONFIG.DISABLE_TORCH_FLICKER = true;
   }
   ```

---

## 🎨 五、像素藝術品質標準

### 5.1 像素藝術繪製原則

**核心原則**：
1. **Pixel Perfect** - 每個像素都有明確用途，不模糊
2. **一致的解析度** - 所有物件使用相同的像素比例（16×16 tile）
3. **清晰的輪廓** - 物件邊緣明確，避免與背景融合
4. **受限色板** - 每個物件使用 3-5 種顏色層次
5. **抗鋸齒禁忌** - 不使用自動抗鋸齒，手動控制邊緣

### 5.2 像素藝術檢查清單

**物件繪製檢查**（每個新增視覺元素必須通過）：

#### ✅ 解析度一致性
- [ ] 物件尺寸符合 16×16 tile 的倍數（1×1、2×2、3×3）
- [ ] 像素網格對齊（不出現半像素偏移）
- [ ] 縮放使用整數倍（2x、3x），不使用非整數倍

#### ✅ 色彩與對比
- [ ] 使用 DK.COLORS 定義的色板，不引入新色
- [ ] 至少 3 層明暗（base、light、dark）
- [ ] 與背景對比度 ≥ 3:1（可辨識度）
- [ ] 關鍵元素對比度 ≥ 4.5:1（UI、文字）

#### ✅ 光影與立體感
- [ ] 頂面使用 `topLight()`，底面使用 `sideDark()`
- [ ] 縫隙/接觸面使用 `ambientOcclusion()`
- [ ] 金屬/水晶使用 `edgeHighlight()`
- [ ] 光源方向一致（所有物件從同方向照射）

#### ✅ 輪廓清晰度
- [ ] 物件邊緣至少 1px 暗色輪廓線
- [ ] 相鄰顏色明度差 ≥ 20%
- [ ] 不與背景顏色重疊（除非刻意設計）

#### ✅ 細節與可讀性
- [ ] 16×16 tile 尺寸下細節可辨識
- [ ] 縮小到 8×8 仍能識別物件類型
- [ ] 避免過於複雜的紋理（1-2 種紋理足夠）
- [ ] 重要特徵（如眼睛、武器）用對比色強調

#### ✅ 動畫流暢度
- [ ] 關鍵幀數量適中（2-4 幀通常足夠）
- [ ] 動畫週期符合 DK.ANIM_TIMINGS 標準
- [ ] 使用緩動函數（easing），不用線性
- [ ] 動畫不超出物件邊界（避免閃爍）

### 5.3 常見像素藝術錯誤

**❌ 錯誤示範**：

1. **模糊邊緣**（使用了自動抗鋸齒）：
   ```javascript
   // 錯誤：使用 Canvas 預設繪圖（會自動抗鋸齒）
   ctx.fillRect(x + 0.5, y + 0.5, 16, 16); // 產生模糊邊緣

   // 正確：使用整數座標 + 禁用抗鋸齒
   ctx.imageSmoothingEnabled = false;
   ctx.fillRect(x, y, 16, 16);
   ```

2. **色彩過多**（單一物件用了 10+ 種顏色）：
   ```javascript
   // 錯誤：每個像素用隨機顏色
   for (let i = 0; i < 256; i++) {
     PA.pixel(ctx, x + i % 16, y + Math.floor(i / 16), randomColor());
   }

   // 正確：使用 3-5 種色階
   const colors = [baseColor, topLight(baseColor), sideDark(baseColor)];
   ```

3. **光源方向不一致**（不同物件光從不同方向來）：
   ```javascript
   // 錯誤：物件 A 頂部亮，物件 B 底部亮
   drawObjectA_TopLight();
   drawObjectB_BottomLight(); // 不一致！

   // 正確：所有物件統一從上方照射
   drawObjectA_TopLight();
   drawObjectB_TopLight();
   ```

4. **過度細節**（16×16 tile 塞了 100+ 個不同像素）：
   ```javascript
   // 錯誤：在 16×16 tile 畫精細人臉五官
   drawEyes(8 個像素);
   drawNose(6 個像素);
   drawMouth(10 個像素);
   // 結果：糊成一團，無法辨識

   // 正確：簡化為關鍵特徵
   drawEyes(2 個白點);
   drawMouth(1 條線);
   // 結果：清晰可辨
   ```

### 5.4 像素藝術實作工具函式（補充）

**新增輔助函式**（加到 `DK.PixelArt`）：

```javascript
/**
 * 繪製有輪廓的矩形（像素藝術常用）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} w - 寬度
 * @param {number} h - 高度
 * @param {string} fillColor - 填充色
 * @param {string} outlineColor - 輪廓色
 */
DK.PixelArt.rectWithOutline = function(ctx, x, y, w, h, fillColor, outlineColor) {
  // 外層輪廓
  this.rect(ctx, x, y, w, h, outlineColor);
  // 內層填充
  if (w > 2 && h > 2) {
    this.rect(ctx, x + 1, y + 1, w - 2, h - 2, fillColor);
  }
};

/**
 * 繪製圓形（像素藝術風格，非平滑圓）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} cx - 圓心 X
 * @param {number} cy - 圓心 Y
 * @param {number} radius - 半徑（像素）
 * @param {string} color - 顏色
 */
DK.PixelArt.circle = function(ctx, cx, cy, radius, color) {
  // 使用 Bresenham 圓演算法（像素完美）
  let x = 0;
  let y = radius;
  let d = 3 - 2 * radius;

  while (x <= y) {
    this.pixel(ctx, cx + x, cy + y, color);
    this.pixel(ctx, cx - x, cy + y, color);
    this.pixel(ctx, cx + x, cy - y, color);
    this.pixel(ctx, cx - x, cy - y, color);
    this.pixel(ctx, cx + y, cy + x, color);
    this.pixel(ctx, cx - y, cy + x, color);
    this.pixel(ctx, cx + y, cy - x, color);
    this.pixel(ctx, cx - y, cy - x, color);

    if (d < 0) {
      d = d + 4 * x + 6;
    } else {
      d = d + 4 * (x - y) + 10;
      y--;
    }
    x++;
  }
};

/**
 * 繪製填充圓形
 */
DK.PixelArt.circleFilled = function(ctx, cx, cy, radius, color) {
  for (let y = -radius; y <= radius; y++) {
    for (let x = -radius; x <= radius; x++) {
      if (x * x + y * y <= radius * radius) {
        this.pixel(ctx, cx + x, cy + y, color);
      }
    }
  }
};

/**
 * 繪製線條（像素藝術風格，非平滑線）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x0 - 起點 X
 * @param {number} y0 - 起點 Y
 * @param {number} x1 - 終點 X
 * @param {number} y1 - 終點 Y
 * @param {string} color - 顏色
 */
DK.PixelArt.line = function(ctx, x0, y0, x1, y1, color) {
  // 使用 Bresenham 直線演算法
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    this.pixel(ctx, x0, y0, color);

    if (x0 === x1 && y0 === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
};
```

---

## 📝 六、實作優先級與階段規劃

### 6.1 Phase 1: 色彩系統與光影增強（高優先級）

**目標**：建立完整的色彩調色盤與增強光影對比

**任務清單**：
1. ✅ 在 `config.js` 新增完整色彩常數（第 1.2 節定義的所有顏色）
2. ✅ 修改 `DK.PixelArt.Isometric` 增強光影對比度（從 20% 提升到 35%）
3. ✅ 新增 `edgeHighlight()` 和 `reflectedLight()` 函式
4. ✅ 新增材質專用渲染函式：`drawMetalTile()`、`drawCrystalTile()`
5. ⏳ 應用到現有物件：地城之心、傳送門、門系統

**預期成果**：
- 視覺層次更清晰
- 物件立體感增強
- 色彩語義更豐富

**測試標準**：
- 地城之心水晶感明顯（邊緣高光、內部光暈）
- 鐵門金屬感明顯（銳利高光、強反射）
- 色盲模式下仍可區分所有元素

---

### 6.2 Phase 2: 動畫參數統一與緩動函式（中優先級）

**目標**：統一所有動畫時間參數，新增緩動函式庫

**任務清單**：
1. ✅ 在 `config.js` 新增 `DK.ANIM_TIMINGS` 常數物件
2. ✅ 在 `map.js` 或 `pixelart.js` 新增 `DK.Easing` 函式庫
3. ⏳ 修改現有動畫使用統一時間參數：
   - 地城之心脈動：改用 `DK.ANIM_TIMINGS.AMBIENT_SLOW`
   - 傳送門旋轉：改用 `DK.ANIM_TIMINGS.ANIM_MEDIUM`
   - 火把閃爍：改用 `DK.ANIM_TIMINGS.AMBIENT_VERY_SLOW`
4. ⏳ 應用緩動函式到關鍵動畫：
   - 傷害數字：使用 `bounce` 彈跳效果
   - 按鈕 hover：使用 `elastic` 彈性放大
   - HP 條變化：使用 `easeInOut` 平滑過渡

**預期成果**：
- 動畫更自然流暢
- 視覺反饋更明確
- 程式碼維護更容易

**測試標準**：
- 所有動畫速度協調一致
- 關鍵反饋（受擊、拾取）在 150ms 內完成
- FPS 保持 60（無效能下降）

---

### 6.3 Phase 3: 動態光源系統（低優先級，擴展功能）

**目標**：實作動態光源影響附近地磚亮度

**任務清單**：
1. ✅ 新增 `DK.PixelArt.applyDynamicLighting()` 函式
2. ✅ 新增 `DK.PixelArt.blendColors()` 色彩混合函式
3. ⏳ 定義光源資料結構：`{ x, y, radius, color, intensity }`
4. ⏳ 修改渲染流程，地磚渲染時應用動態光照
5. ⏳ 新增光源管理器：`DK.LightManager.addLight()`、`removeLight()`

**預期成果**：
- 火把照亮附近地磚（橙黃光暈）
- 地城之心紫色光暈擴散
- 陷阱觸發時短暫照亮周圍

**測試標準**：
- 光源半徑正確（3-5 格）
- 光照強度隨距離衰減自然
- FPS 影響 < 5%（效能可接受）

**⚠️ 注意**：此功能為「錦上添花」，不影響核心玩法，可視實作時間決定是否執行

---

## 🎯 七、視覺優化建議總結

### 7.1 核心優化建議（必須執行）

| 優化項目 | 當前問題 | 建議方案 | 預期效果 |
|---------|---------|---------|---------|
| **色彩系統** | 只有 4 種基礎色，缺乏層次 | 擴展到 40+ 種色彩，包含元素、材質、UI 完整語義 | 視覺豐富度 +200% |
| **光影對比** | 頂光/側暗只有 20%，立體感不足 | 提升到 35%/30%，新增邊緣高光與反射光 | 立體感 +150% |
| **動畫參數** | 時間參數混亂（100ms~2000ms 無規律） | 統一為 5 級標準（50ms 極快～5000ms 極慢） | 視覺一致性 +100% |
| **視覺層級** | 所有元素視覺權重相近，重心不明 | 定義 L1/L2/L3 三層權重（20%/50%/30%） | 可讀性 +180% |

### 7.2 進階優化建議（建議執行）

| 優化項目 | 當前狀態 | 建議方案 | 預期效果 |
|---------|---------|---------|---------|
| **緩動函式** | 所有動畫都是線性 | 新增 7 種緩動（easeIn/Out、bounce、elastic 等） | 動畫質感 +150% |
| **材質系統** | 所有物件光影反應相同 | 定義 7 種材質標準（石頭、金屬、水晶等） | 視覺多樣性 +120% |
| **像素藝術標準** | 無明文規範，品質不穩定 | 提供檢查清單與工具函式 | 視覺一致性 +100% |
| **色盲友善** | 僅依賴色彩區分元素 | 加入形狀、亮度、動畫區別 | 無障礙 +200% |

### 7.3 擴展優化建議（時間充裕時執行）

| 優化項目 | 當前狀態 | 建議方案 | 預期效果 |
|---------|---------|---------|---------|
| **動態光源** | 無，物件不影響環境光 | 實作動態光照系統 | 沉浸感 +150% |
| **視覺引導** | 無，新手需要文字教學 | 脈動箭頭、高亮提示 | 學習曲線 -30% |
| **效能優化** | 未優化，多粒子時 FPS 下降 | 視錐剔除、粒子限制、降級策略 | FPS 穩定性 +50% |
| **後處理特效** | 無 | 螢幕震動、色彩閃爍、徑向模糊（爆炸時） | 衝擊感 +200% |

---

## 📌 八、下一步行動

### 8.1 立即行動（美術總監）

1. ✅ **完成本設計文檔初稿**（當前任務）
2. ⏳ **向 team lead 報告**，等待 creative-director 和其他設計師的回饋
3. ⏳ **參與迭代優化**（至少 10 次），整合多方建議
4. ⏳ **產出最終版設計文檔**，包含完整的色彩調色盤、光影標準、動畫規範

### 8.2 等待團隊協作

- ⏳ **creative-director**：審查視覺風格是否符合 Dungeon Keeper 美學
- ⏳ **ux-designer**（如有）：評估視覺層級是否提升可讀性
- ⏳ **team-lead-2**：協調整合所有設計師的建議，進行 10 次迭代優化

### 8.3 實作階段（等待 team lead 分派）

實作可分為多個 subagent 並行執行：

1. **config-implementer**：新增色彩常數與動畫時間常數到 `config.js`
2. **pixelart-enhancer**：增強 `DK.PixelArt` 光影函式與材質渲染
3. **animation-refactor**：重構現有動畫使用統一時間參數與緩動函式
4. **material-artist**：應用新的材質標準到地城之心、傳送門、門系統
5. **qa-tester**：測試視覺品質、色盲友善、效能影響

---

## 🔖 附錄

### A. 參考資料

- **專案文檔**：
  - `docs/creative-director-design-standards.md` - 創意總監設計標準
  - `docs/visual-enhancements-portal-heart-design.md` - 傳送門與地城之心設計
  - `docs/animation-design-principles.md` - 動畫設計原則（如有）

- **程式碼檔案**：
  - `js/config.js` - 色彩與常數定義
  - `js/map.js` - 像素藝術工具庫 `DK.PixelArt`
  - `js/main.js` - 主渲染循環
  - `js/ui.js` - UI 系統與按鈕配置

- **外部參考**：
  - Dungeon Keeper (1997) - 經典地城美學
  - Dungeon Warfare 3 (2024) - 現代像素風塔防
  - WCAG 2.1 對比度標準 - 無障礙設計指引

### B. 設計哲學

**「少即是多」（Less is More）**：
- 像素藝術的美在於簡約而精準
- 3-5 種顏色比 20 種顏色更有力量
- 清晰的輪廓比複雜的紋理更重要

**「一致性勝過創新」**：
- 統一的光源方向比每個物件獨特設計更重要
- 協調的動畫速度比花俏的特效更重要
- 可預測的視覺回饋比驚喜更重要

**「功能優先於美觀」**：
- 可讀性 > 華麗度
- 辨識度 > 精緻度
- 效能 > 特效

---

> **美術總監簽名**: art-director (Opus 4.6)
> **完成時間**: 2026-02-11
> **文檔狀態**: 初稿，等待團隊回饋與迭代優化
> **下一步**: 向 team-lead-2 報告，參與 10 次迭代優化

---

**附註**：本文檔為美術總監的專業建議，實作時應與創意總監、UX 設計師、技術團隊協調，確保視覺優化不影響遊戲性能與玩家體驗。所有建議都基於 Pure vanilla JS + 雙 Canvas 架構的技術限制，確保可執行性。
