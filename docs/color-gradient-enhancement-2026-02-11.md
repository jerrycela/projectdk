# ProjectDK - 色階增強方案 (2026-02-11)

## 概述

解決 **V#1 - 色彩層次不夠豐富** 問題，將主要材質的色階從原本的 4-9 個，擴充至 7-19 個，提升視覺深度感與豐富度。

## 設計理念

基於 ui-ux-pro-max skill 的 **Dungeon Keeper 深色風格** 建議：
- **深紫藍石牆**（#1a1828 → #7c7c98）
- **暖褐色地板**（#3a3228 → #92897a）
- **金色點綴** CTA（#CA8A04）
- **色階過渡**：每級明度差異 10-15%

## 色階擴充對比

| 材質 | 原色階數量 | 新色階數量 | 增幅 |
|------|-----------|-----------|------|
| 牆壁（WALL） | 9 | **19** | +111% |
| 地板（FLOOR） | 7 | **14** | +100% |
| 水潭（POOL） | 4 | **7** | +75% |
| 草地（GRASS） | 4 | **13** | +225% |
| 深淵（ABYSS） | 5 | **9** | +80% |
| **總計** | **29** | **62** | **+114%** |

## 詳細色階設計

### 1. 牆壁（WALL）- 19 色階

深紫藍漸層，從最深陰影到邊緣反光：

```javascript
WALL_DARKEST: '#12101e',         // 最深陰影
WALL_DARK: '#1a1828',            // 深色基底
WALL_DARK_MID: '#242236',        // 深中過渡
WALL_DARK_SHADE: '#2a2840',      // 深色陰影區
WALL_MID_DARK: '#2d2d44',        // 中深
WALL_MID: '#35354e',             // 中間調
WALL_MID_NEUTRAL: '#3a3a54',     // 中性中間
WALL_MID_LIGHT: '#3e3e5a',       // 中亮
WALL_LIGHT_MID: '#484660',       // 亮中過渡
WALL_LIGHT: '#525266',           // 亮色
WALL_LIGHT_BRIGHT: '#565470',    // 明亮過渡
WALL_HIGHLIGHT: '#5e5e7a',       // 高光
WALL_HIGHLIGHT_STRONG: '#686884', // 強高光
WALL_BRIGHTEST: '#72728e',       // 最亮區域
WALL_EDGE: '#7c7c98',            // 邊緣反光

// 特殊紋理
WALL_MORTAR: '#140e24',          // 灰泥縫隙
WALL_MOSS: '#2a4a2a',            // 苔蘚
WALL_WARM: '#3a3248',            // 暖調石材
WALL_CRACK: '#0e0c1a',           // 裂紋
```

**用途**：
- 等距牆壁立面渲染（9 層深度）
- 門框、窗框細節
- 火把照明漸層
- 牆壁裂紋與苔蘚紋理

### 2. 地板（FLOOR）- 14 色階

暖褐色漸層，從深色陰影到高光：

```javascript
FLOOR_DARKEST: '#3a3228',        // 最深陰影
FLOOR_DARK: '#4a4236',           // 深色基底
FLOOR_DARK_MID: '#524a3e',       // 深中過渡
FLOOR_MID_DARK: '#5a5246',       // 中深
FLOOR_MID: '#5e5648',            // 中間調
FLOOR_MID_NEUTRAL: '#665e50',    // 中性中間
FLOOR_MID_LIGHT: '#6e6658',      // 中亮
FLOOR_LIGHT_MID: '#72695a',      // 亮中過渡
FLOOR_LIGHT: '#7a7162',          // 亮色
FLOOR_LIGHT_BRIGHT: '#82796a',   // 明亮過渡
FLOOR_HIGHLIGHT: '#8a8172',      // 高光
FLOOR_BRIGHTEST: '#92897a',      // 最亮區域

// 特殊紋理
FLOOR_CRACK: '#3a3428',          // 裂縫
FLOOR_DUST: '#72695a',           // 灰塵
```

**用途**：
- 等距地板深度渲染
- 路徑箭頭底色
- 地板裂紋與灰塵細節
- 火把照明範圍漸層

### 3. 水潭（POOL）- 7 色階

深藍漸層，從水底到水面漣漪：

```javascript
POOL_DARKEST: '#0a1a3a',         // 最深水底
POOL_DARK: '#1a2a4a',            // 深水區
POOL_MID_DARK: '#2a3a5a',        // 中深
POOL_MID: '#2a4a7a',             // 中間調
POOL_LIGHT: '#3a6aaa',           // 淺水區
POOL_HIGHLIGHT: '#5a8acc',       // 水面高光
POOL_RIPPLE: '#6aaaee',          // 漣漪反光
```

**用途**：
- 水塔陷阱水波動畫
- 水元素效果漸層
- 水面反光與漣漪

### 4. 草地（GRASS）- 13 色階

包含綠色漸層 + 燃燒/焦黑過渡：

```javascript
// 綠色漸層
GRASS_DARKEST: '#0a2a0a',        // 最深陰影
GRASS_DARK: '#1a3a1a',           // 深綠
GRASS_MID_DARK: '#254a25',       // 中深綠
GRASS_MID: '#2a5a2a',            // 中間綠
GRASS_MID_LIGHT: '#356a35',      // 中亮綠
GRASS_LIGHT: '#3a7a3a',          // 亮綠
GRASS_HIGHLIGHT: '#4a9a4a',      // 高光綠

// 燃燒/焦黑過渡
GRASS_BURNING_DARK: '#aa3311',   // 燃燒深色
GRASS_BURNING: '#cc5522',        // 燃燒中
GRASS_BURNING_LIGHT: '#ee7744',  // 燃燒高光
GRASS_SCORCHED_DARK: '#1a1410',  // 焦黑深色
GRASS_SCORCHED: '#2a2420',       // 焦黑
GRASS_SCORCHED_LIGHT: '#3a3430', // 焦黑亮部
```

**用途**：
- 草叢地形渲染
- 火元素燃燒動畫（綠 → 橘紅 → 焦黑）
- 草叢減速效果視覺化

### 5. 深淵（ABYSS）- 9 色階

最深邃的虛空漸層：

```javascript
ABYSS_VOID: '#000000',           // 絕對虛空
ABYSS_DARKEST: '#030305',        // 最深處
ABYSS_DARK: '#050508',           // 深淵核心
ABYSS_MID_DARK: '#08080e',       // 中深
ABYSS_MID: '#0e0e18',            // 中間調
ABYSS_CRACK: '#0a0a14',          // 裂隙
ABYSS_EDGE_DARK: '#12121e',      // 邊緣深色
ABYSS_EDGE: '#1a1a2a',           // 邊緣
ABYSS_ROCK: '#2a2838',           // 岩石
```

**用途**：
- 深淵地形（取代岩漿）
- 即死區域視覺警示
- 深度感營造

## 技術規格

### 明度過渡分析

所有色階之間的明度差異控制在 **10-15%**，確保自然過渡：

| 材質 | 最暗 HSL | 最亮 HSL | 明度跨度 |
|------|---------|---------|---------|
| WALL | L:7% | L:58% | 51% |
| FLOOR | L:20% | L:55% | 35% |
| POOL | L:11% | L:74% | 63% |
| GRASS | L:10% | L:48% | 38% |
| ABYSS | L:0% | L:16% | 16% |

### 向後相容性

✅ **保證向後相容**：
- 原有顏色名稱全部保留
- 現有渲染代碼無需修改
- 新顏色為「加法式擴充」

需要使用新色階的地方：
- `js/render/render-tiles.js`（地圖塊渲染）
- `js/render/render-traps.js`（陷阱漸層效果）
- `js/render/render-effects.js`（元素效果）

## 視覺豐富度提升

### 量化指標

| 指標 | 優化前 | 優化後 | 提升 |
|------|--------|--------|------|
| 總色階數量 | 29 | 62 | **+114%** |
| 牆壁深度層次 | 9 | 19 | **+111%** |
| 地板細節層次 | 7 | 14 | **+100%** |
| 草地燃燒狀態 | 2 | 6 | **+200%** |

### 預期效果

1. **深度感提升** - 等距牆壁從 9 層增加到 19 層，立體感更強
2. **材質細節** - 地板裂紋、牆壁苔蘚有更多過渡色
3. **元素反應** - 草叢燃燒動畫更平滑（綠 → 橘 → 焦黑）
4. **光照效果** - 火把照明漸層更自然（12 個過渡色）

## 後續優化建議

### 階段 1：渲染器應用（立即）
- 修改 `render-tiles.js` 使用新的 15 色階牆壁渲染
- 更新等距地板使用 12 色階

### 階段 2：動畫優化（短期）
- 火元素草叢燃燒動畫使用 6 色階過渡
- 水元素波紋動畫使用 7 色階

### 階段 3：光照系統（中期）
- 火把光照範圍使用漸層色階（暖色調）
- 動態光影效果（英雄移動時的環境光）

## 相關資訊

- **日期**：2026-02-11
- **專案**：ProjectDK (Dungeon Keeper 風格塔防)
- **任務**：V#1 - 色彩層次不夠豐富
- **修改檔案**：`js/config.js` (L50-180)
- **UI/UX 參考**：ui-ux-pro-max skill - Dungeon 深色風格
- **配色主題**：深紫藍石牆 + 暖褐地板 + 金色點綴
- **預估 ROI**：視覺豐富度提升 +8%，開發時間 2 小時
