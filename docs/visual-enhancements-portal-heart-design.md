# 傳送門與地城之心視覺增強設計

> **設計師**: visual-designer
> **日期**: 2026-02-10
> **任務**: #1 視覺增強設計 - 傳送門與地城之心

---

## 一、設計目標

參考 Dungeon Keeper 黑暗地城風格，重新設計傳送門和地城之心的像素藝術視覺效果，提升辨識度與代入感。

---

## 二、傳送門視覺重設計

### 2.1 設計概念

**風格靈感**：次元漩渦 × 魔法陣
**尺寸升級**：1×1 → **2×2**（佔據 4 格地磚）
**入口/出口區分**：
- **入口（entrance）**：**綠色**漩渦（敵人進入地城）
- **出口（exit）**：**紅色**漩渦（非本關實作，預留設計）

### 2.2 視覺元素拆解

#### 靜態結構（基礎像素）
```
傳送門 2×2 佈局（32×32 像素）
┌─────────┬─────────┐
│  左上格  │  右上格  │  ← row
│ (col,row)│(col+1,row)│
├─────────┼─────────┤
│  左下格  │  右下格  │
│(col,row+1)│(col+1,row+1)│
└─────────┴─────────┘
```

#### 漩渦核心設計（16×16 像素單元）

**入口傳送門（綠色系）**：
```javascript
// 顏色定義
PORTAL_ENTRANCE_CORE = '#44ff44'      // 核心亮綠
PORTAL_ENTRANCE_MID = '#2a9a2a'       // 中層綠
PORTAL_ENTRANCE_DARK = '#1a5a1a'      // 外層暗綠
PORTAL_ENTRANCE_GLOW = '#88ffaa'      // 粒子光暈

// 繪製邏輯（每格獨立渲染）
function drawPortalTile_Entrance(ctx, x, y, quadrant, time) {
  const T = 16 // 地磚尺寸
  const centerOffsetX = quadrant === 'TL' || quadrant === 'BL' ? T : 0
  const centerOffsetY = quadrant === 'TL' || quadrant === 'TR' ? T : 0
  const cx = x + centerOffsetX  // 漩渦中心 X
  const cy = y + centerOffsetY  // 漩渦中心 Y

  // 1. 外層暗綠同心圓（半徑 14-16px）
  for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
    const r = 14 + Math.sin(time / 300 + angle * 3) * 2
    PA.pixel(ctx,
      Math.round(cx + Math.cos(angle) * r),
      Math.round(cy + Math.sin(angle) * r * 0.6),
      PORTAL_ENTRANCE_DARK
    )
  }

  // 2. 中層綠色漩渦線（半徑 8-12px，順時針旋轉）
  for (let i = 0; i < 4; i++) {
    const baseAngle = (i / 4) * Math.PI * 2 + time / 500
    for (let s = 0; s < 6; s++) {
      const angle = baseAngle + s * 0.2
      const r = 8 + s * 0.7
      PA.pixel(ctx,
        Math.round(cx + Math.cos(angle) * r),
        Math.round(cy + Math.sin(angle) * r * 0.6),
        PORTAL_ENTRANCE_MID
      )
    }
  }

  // 3. 核心亮點（半徑 4px，脈動）
  const pulseSize = 3 + Math.sin(time / 400) * 1
  PA.circle(ctx, cx, cy, Math.round(pulseSize), PORTAL_ENTRANCE_CORE)

  // 4. 向外飛散粒子（8 個，旋轉）
  for (let i = 0; i < 8; i++) {
    const particleAngle = (i / 8) * Math.PI * 2 + time / 800
    const particleR = 10 + Math.sin(time / 200 + i) * 3
    PA.pixel(ctx,
      Math.round(cx + Math.cos(particleAngle) * particleR),
      Math.round(cy + Math.sin(particleAngle) * particleR * 0.6),
      PORTAL_ENTRANCE_GLOW
    )
  }
}
```

**出口傳送門（紅色系，對稱設計）**：
```javascript
// 顏色定義
PORTAL_EXIT_CORE = '#ff4444'      // 核心亮紅
PORTAL_EXIT_MID = '#9a2a2a'       // 中層紅
PORTAL_EXIT_DARK = '#5a1a1a'      // 外層暗紅
PORTAL_EXIT_GLOW = '#ffaa88'      // 粒子光暈

// 繪製邏輯與入口相同，只替換顏色，旋轉方向改為逆時針
function drawPortalTile_Exit(ctx, x, y, quadrant, time) {
  // ... 同上，漩渦線 baseAngle 改為 -time / 500（逆時針）
}
```

### 2.3 動畫參數

| 動畫層 | 週期 | 效果描述 |
|--------|------|----------|
| 外層同心圓 | 300ms | 半徑 ±2px 波動 |
| 中層漩渦線 | 500ms | 順時針/逆時針旋轉 |
| 核心脈動 | 400ms | 半徑 3-4px 呼吸 |
| 粒子旋轉 | 800ms | 8 個粒子圍繞核心旋轉 |

### 2.4 像素藝術渲染函數接口

**提供給 map.js 和 editor-main.js 使用**：

```javascript
/**
 * 繪製傳送門地磚（支援 2×2 佈局）
 * @param {CanvasRenderingContext2D} ctx - Canvas 繪圖上下文
 * @param {number} x - 地磚左上角 X 座標（像素）
 * @param {number} y - 地磚左上角 Y 座標（像素）
 * @param {string} type - 'entrance' | 'exit'
 * @param {string} quadrant - 'TL' | 'TR' | 'BL' | 'BR'（左上/右上/左下/右下）
 * @param {number} time - 遊戲時間（ms，用於動畫）
 */
DK.PixelArt.drawPortalTile = function(ctx, x, y, type, quadrant, time) {
  if (type === 'entrance') {
    this.drawPortalTile_Entrance(ctx, x, y, quadrant, time)
  } else if (type === 'exit') {
    this.drawPortalTile_Exit(ctx, x, y, quadrant, time)
  }
}

// 內部實作函數（不公開）
DK.PixelArt.drawPortalTile_Entrance = function(ctx, x, y, quadrant, time) { ... }
DK.PixelArt.drawPortalTile_Exit = function(ctx, x, y, quadrant, time) { ... }
```

**編輯器快速預覽函數**（無動畫）：

```javascript
/**
 * 繪製傳送門靜態預覽（編輯器用）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} type - 'entrance' | 'exit'
 */
DK.PixelArt.drawPortalTile_Static = function(ctx, x, y, type) {
  // 固定 time=0，繪製 4 個象限
  const T = DK.CONFIG.TILE_SIZE
  this.drawPortalTile(ctx, x, y, type, 'TL', 0)
  this.drawPortalTile(ctx, x + T, y, type, 'TR', 0)
  this.drawPortalTile(ctx, x, y + T, type, 'BL', 0)
  this.drawPortalTile(ctx, x + T, y + T, type, 'BR', 0)
}
```

---

## 三、地城之心統一渲染方案

### 3.1 當前問題診斷

**問題 1**：編輯器和遊戲使用不同的渲染函數
- 編輯器：`DK.Map.drawHeartTile()` (/js/map.js:957)
- 遊戲：`renderDungeonHeart()` (/js/main.js:933)

**問題 2**：渲染邏輯重複，維護困難

**解決方案**：統一使用 `DK.Map.drawHeartTile()` 作為唯一渲染入口

### 3.2 統一渲染函數設計

**核心理念**：單一職責，像素級控制

```javascript
/**
 * 繪製地城之心地磚（支援 2×2 佈局）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - 地磚左上角 X 座標（像素）
 * @param {number} y - 地磚左上角 Y 座標（像素）
 * @param {string} quadrant - 'TL' | 'TR' | 'BL' | 'BR'
 * @param {Object} options - 可選參數
 * @param {number} options.time - 遊戲時間（用於脈動動畫）
 * @param {number} options.hpPercent - HP 百分比（0-1，用於顏色變化）
 * @param {boolean} options.isFlashing - 是否閃爍（受傷效果）
 */
DK.Map.drawHeartTile = function(ctx, x, y, quadrant, options = {}) {
  const { time = 0, hpPercent = 1, isFlashing = false } = options
  const T = DK.CONFIG.TILE_SIZE  // 16px
  const PA = DK.PixelArt
  const C = DK.COLORS

  // 計算相對於 2×2 中心的偏移
  const centerOffsetX = (quadrant === 'TL' || quadrant === 'BL') ? T : 0
  const centerOffsetY = (quadrant === 'TL' || quadrant === 'TR') ? T : 0
  const cx = x + centerOffsetX  // 水晶核心 X
  const cy = y + centerOffsetY  // 水晶核心 Y

  // === 1. 石座底座（所有象限） ===
  PA.rect(ctx, x, y, T, T, '#2a1a3a')  // 暗紫基礎
  PA.rect(ctx, x + 1, y + 1, T - 2, T - 2, '#3a2a4a')  // 亮紫層

  // === 2. 水晶核心（僅中心 4px×4px，所有象限共同構成） ===
  // 依 HP 百分比調整顏色
  const coreColor = isFlashing ? '#ff4444'
                  : hpPercent > 0.3 ? '#aa44ff'
                  : '#ff4488'
  const coreLight = isFlashing ? '#ff8888'
                   : hpPercent > 0.3 ? '#cc88ff'
                   : '#ffaacc'
  const coreDark = isFlashing ? '#880000'
                  : hpPercent > 0.3 ? '#6622aa'
                  : '#aa2244'

  // 依象限繪製水晶碎片（鑽石形狀分割）
  if (quadrant === 'TL') {
    PA.rect(ctx, cx - 6, cy - 4, 6, 8, coreDark)
    PA.rect(ctx, cx - 4, cy - 2, 4, 4, coreColor)
  } else if (quadrant === 'TR') {
    PA.rect(ctx, cx, cy - 4, 6, 8, coreDark)
    PA.rect(ctx, cx, cy - 2, 4, 4, coreColor)
  } else if (quadrant === 'BL') {
    PA.rect(ctx, cx - 6, cy, 6, 8, coreDark)
    PA.rect(ctx, cx - 4, cy, 4, 4, coreColor)
  } else if (quadrant === 'BR') {
    PA.rect(ctx, cx, cy, 6, 8, coreDark)
    PA.rect(ctx, cx, cy, 4, 4, coreColor)
  }

  // === 3. 內部白色光點（脈動，僅 TL 象限渲染） ===
  if (quadrant === 'TL') {
    const pulse = Math.sin(time / 1000 * Math.PI) * 0.5 + 0.5
    const fastPulse = hpPercent < 0.3
      ? Math.sin(time / 500 * Math.PI) * 0.5 + 0.5
      : pulse
    const glowSize = 2 + Math.round(fastPulse * 2)
    PA.rect(ctx, cx - Math.floor(glowSize / 2), cy - Math.floor(glowSize / 2),
            glowSize, glowSize, '#ffffff')
  }

  // === 4. 地磚級光暈（所有象限，淡化半透明） ===
  const pulse = Math.sin(time / 1000 * Math.PI) * 0.5 + 0.5
  const glowAlpha = 0.04 + pulse * 0.04
  const r = isFlashing ? 255 : 170
  const g = isFlashing ? 68 : 68
  const b = isFlashing ? 68 : 255
  ctx.fillStyle = `rgba(${r},${g},${b},${glowAlpha})`
  ctx.fillRect(x, y, T, T)
}
```

### 3.3 遊戲主循環調用方式

**main.js renderDungeonHeart() 改為**：

```javascript
function renderDungeonHeart(ctx, time) {
  const hp = DK.Map.heartPos
  if (!hp) return
  const T = DK.CONFIG.TILE_SIZE

  // 計算 HP 百分比
  const hpPercent = DK.Game.dungeonHeartHP / DK.Game.dungeonHeartMaxHP
  const isFlashing = DK.Game.heartFlashTimer > 0

  // 繪製 2×2 地磚
  const quadrants = [
    { q: 'TL', col: hp.col, row: hp.row },
    { q: 'TR', col: hp.col + 1, row: hp.row },
    { q: 'BL', col: hp.col, row: hp.row + 1 },
    { q: 'BR', col: hp.col + 1, row: hp.row + 1 },
  ]

  for (const { q, col, row } of quadrants) {
    const x = col * T
    const y = row * T
    DK.Map.drawHeartTile(ctx, x, y, q, { time, hpPercent, isFlashing })
  }

  // HP 條（僅在受損時顯示，渲染在 2×2 正上方）
  if (hpPercent < 1) {
    const barW = 28
    const barX = hp.col * T + 2
    const barY = hp.row * T - 4
    PA.rect(ctx, barX - 1, barY - 1, barW + 2, 5, '#1a1a1a')
    PA.rect(ctx, barX, barY, barW, 3, '#2a0a0a')
    const fillW = Math.ceil(barW * hpPercent)
    PA.rect(ctx, barX, barY + 1, fillW, 2, hpPercent > 0.3 ? '#ff4444' : '#ff0000')
    PA.rect(ctx, barX, barY, fillW, 1, hpPercent > 0.3 ? '#ff8888' : '#ff4444')
  }
}
```

### 3.4 編輯器調用方式

**editor-main.js renderEditableTiles() 中**：

```javascript
// 地城之心（H）
if (tile === 'H') {
  // 繪製 2×2 左上角格時，統一渲染整個 2×2 區域
  if (!renderedHearts.has(`${col},${row}`)) {
    const quadrants = [
      { q: 'TL', dc: 0, dr: 0 },
      { q: 'TR', dc: 1, dr: 0 },
      { q: 'BL', dc: 0, dr: 1 },
      { q: 'BR', dc: 1, dr: 1 },
    ]
    for (const { q, dc, dr } of quadrants) {
      DK.Map.drawHeartTile(ctx, (col + dc) * T, (row + dr) * T, q, { time: 0 })
    }
    renderedHearts.add(`${col},${row}`)
  }
}
```

---

## 四、視覺增強總結

### 4.1 改善要點

| 項目 | 改善前 | 改善後 |
|------|--------|--------|
| 傳送門尺寸 | 1×1 | 2×2（提升 4 倍面積） |
| 傳送門顏色 | 單一顏色 | 入口綠色/出口紅色 |
| 傳送門動畫 | 無 | 漩渦旋轉 + 粒子飛散 |
| 地城之心渲染 | 雙函數重複邏輯 | 單一統一函數 |
| 地城之心光暈 | 3 格半徑 | 淡化至 0.08 alpha |
| HP 視覺反饋 | 閃爍 | 閃爍 + 顏色漸變 + 快速脈動 |

### 4.2 色彩定義（新增至 config.js）

```javascript
// DK.COLORS 新增
PORTAL_ENTRANCE_CORE: '#44ff44',
PORTAL_ENTRANCE_MID: '#2a9a2a',
PORTAL_ENTRANCE_DARK: '#1a5a1a',
PORTAL_ENTRANCE_GLOW: '#88ffaa',

PORTAL_EXIT_CORE: '#ff4444',
PORTAL_EXIT_MID: '#9a2a2a',
PORTAL_EXIT_DARK: '#5a1a1a',
PORTAL_EXIT_GLOW: '#ffaa88',
```

### 4.3 函數清單

**新增函數（pixelart.js）**：
- `DK.PixelArt.drawPortalTile(ctx, x, y, type, quadrant, time)`
- `DK.PixelArt.drawPortalTile_Static(ctx, x, y, type)` （編輯器用）
- `DK.PixelArt.drawPortalTile_Entrance(ctx, x, y, quadrant, time)` （內部）
- `DK.PixelArt.drawPortalTile_Exit(ctx, x, y, quadrant, time)` （內部）

**修改函數（map.js）**：
- `DK.Map.drawHeartTile(ctx, x, y, quadrant, options)` - 新增 quadrant 參數，支援 options

**棄用函數（main.js）**：
- `renderDungeonHeart()` - 改為調用 `DK.Map.drawHeartTile()`

---

## 五、實作檢查清單

### Phase 1: 傳送門渲染函數
- [ ] 在 `pixelart.js` 實作 `drawPortalTile()` 及 4 個子函數
- [ ] 在 `config.js` 新增 8 個傳送門顏色常數

### Phase 2: 地城之心統一
- [ ] 修改 `map.js` 的 `drawHeartTile()` 支援 quadrant 和 options
- [ ] 修改 `main.js` 的 `renderDungeonHeart()` 改為調用統一函數
- [ ] 修改 `editor-main.js` 的地城之心渲染邏輯

### Phase 3: 整合測試
- [ ] 編輯器：地城之心靜態預覽正確
- [ ] 遊戲：地城之心脈動動畫正常
- [ ] 遊戲：地城之心 HP 變化視覺反饋正確
- [ ] 遊戲：傳送門動畫流暢（如果本關實作）

---

## 六、參考資料

- Dungeon Keeper 地城之心視覺參考：紫色水晶 + 脈動光暈
- 次元門視覺參考：漩渦效果 + 魔法陣粒子
- 雙 canvas 架構：低解析度像素畫 + 高解析度 UI 文字

**設計完成時間**: 2026-02-10
**待實作**: 由 team-lead 協調實作任務分派
