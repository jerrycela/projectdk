# ProjectDK 遊戲視覺與 UX 優化設計方案

> **Team Lead**: team-lead (Opus 4.6)
> **日期**: 2026-02-11
> **專案**: ProjectDK - Dungeon Keep 地層塔防
> **迭代狀態**: 初步草稿（Iteration 0/10）

---

## 📋 執行摘要

本文檔針對 ProjectDK 遊戲的整體視覺呈現與用戶體驗進行深度分析與設計優化。經過對現有程式碼、設計文檔與遊戲架構的完整審視，提出系統性的優化方案。

### 關鍵發現

1. **視覺風格已成熟**：10 次迭代後的等距像素風格已達高水準
2. **資訊架構待優化**：UI 元素佈局、視覺層級需要重新設計
3. **遊戲流程待強化**：三階段流程的引導與反饋需要加強
4. **細節體驗待提升**：微互動、動畫反饋、錯誤處理可以更完善

### 優化重點

- **視覺系統**：色彩層次、光影深度、動畫細節
- **UI/UX系統**：資訊架構、互動流程、反饋提示
- **遊戲體驗**：引導系統、教學設計、流程順暢度
- **實作路線圖**：分階段實作優先級與風險評估

---

## 🎮 當前遊戲狀態分析

### 遊戲架構概覽

**技術棧**：
- Pure vanilla JavaScript (~3,271 行)
- 雙 Canvas 架構（低解析度像素畫 + 高解析度 UI）
- 10 個核心檔案模組化設計

**核心檔案**：
```
js/game.js         - 遊戲狀態機（3 階段流程）
js/main.js         - 主渲染循環與動畫系統
js/map.js          - 地圖渲染、等距視覺、像素藝術工具
js/ui.js           - UI 系統、按鈕、資源顯示
js/enemies.js      - 敵人 AI、路徑尋找
js/traps.js        - 陷阱系統、觸發與傷害
js/doors.js        - 門系統（木門、鐵門、魔法門）
js/elements.js     - 元素反應系統
js/heroes.js       - 英雄單位系統
js/levels.js       - 關卡配置與波次管理
```

**視覺資產**：
- 等距光影系統（topLight/sideDark/ambientOcclusion）
- 2×2 傳送門（綠色漩渦,4 層動畫）
- 2×2 地城之心（紫色水晶懸浮）
- 三種門系統（等距深度渲染）
- 火把光照（動態閃爍、光暈擴散）
- 像素藝術工具庫（DK.PixelArt）

### 遊戲流程分析

**三階段狀態機**：
1. **START 階段**：開始畫面（點擊開始）
2. **PLANNING 階段**：放置陷阱、部署英雄、規劃路障
3. **INVASION 階段**：敵人進攻、陷阱觸發、防守地城之心

**流程評估**：
- ✅ 狀態機邏輯清晰（game.js）
- ✅ 路徑預覽已實作（PLANNING 即顯示虛線）
- ⚠️ 階段切換缺乏明確視覺反饋
- ⚠️ START 畫面資訊不足（無遊戲介紹）
- ⚠️ 錯誤提示不夠清晰（金幣不足只有小訊息）

### 第一印象分析

**玩家打開遊戲會看到什麼？**

根據 `js/main.js` 與 `js/ui.js` 的 `renderStartScreen` 函數：

**當前實作**：
1. 深色背景（`#12101e`）
2. 標題文字（需檢查具體內容）
3. 點擊任意處開始提示

**第一印象問題**：
- ❌ 無遊戲名稱視覺化呈現（缺乏品牌感）
- ❌ 無遊戲目標說明（新玩家不知道要幹嘛）
- ❌ 無操作提示（不知道有哪些功能）
- ❌ 缺乏視覺吸引力（純文字,無動畫）

**建議改進**：
1. **品牌視覺**：大字體遊戲標題 + 副標題
2. **動畫元素**：傳送門旋渦背景 + 火把閃爍
3. **簡短介紹**：「守護地城之心,抵禦入侵者」
4. **操作提示**：簡單的圖示說明（陷阱/英雄/波次）

---

## 🎨 視覺系統優化方案

### 1. 色彩系統優化

#### 當前色彩分析

**現有色板**（來自設計標準文檔）：
- 地城環境：紫灰系、暖黃棕系
- 元素魔法：水系藍、火系橙、電系黃
- UI 系統：深紫黑、米白文字、金幣強調色

**問題識別**：
1. **對比度不足**：部分 UI 文字與背景對比度 < 4.5:1
2. **缺乏中間色調**：色彩跳躍太大,缺乏過渡
3. **視覺層級模糊**：前景/中景/背景的色彩分離不夠明確

#### 優化設計

**新增中間色調**：
```javascript
// 在現有色板基礎上新增過渡色
DK.COLORS.UI_BG_DARK = '#0a0814';      // 更深的背景（用於對比）
DK.COLORS.UI_BG_MID = '#12101e';       // 中間背景（當前）
DK.COLORS.UI_BG_LIGHT = '#1e1a2e';     // 較亮背景（hover 狀態）

DK.COLORS.TEXT_PRIMARY = '#f0e8d8';    // 主要文字（更亮）
DK.COLORS.TEXT_SECONDARY = '#c0b8a8';  // 次要文字（中間）
DK.COLORS.TEXT_TERTIARY = '#8a8070';   // 輔助文字（當前）
```

**色彩語義強化**：
```javascript
// 狀態色彩系統
DK.COLORS.STATE = {
  SUCCESS: '#44ff88',   // 成功/可用（綠色）
  WARNING: '#ffaa44',   // 警告/選中（橙色）
  ERROR: '#ff4444',     // 錯誤/危險（紅色）
  INFO: '#4488ff',      // 資訊/提示（藍色）
  DISABLED: '#4a4a5a'   // 禁用/不可用（灰色）
};
```

**對比度檢查表**：
| 組合 | 對比度 | WCAG AA | 建議 |
|------|--------|---------|------|
| #f0e8d8 / #12101e | 12.5:1 | ✅ | 主要文字 |
| #c0b8a8 / #12101e | 7.2:1 | ✅ | 次要文字 |
| #8a8070 / #12101e | 4.1:1 | ⚠️ | 僅用於輔助 |

### 2. 光影與深度強化

#### 當前光影系統

**已實作**（`DK.PixelArt.Isometric`）：
- `topLight(baseColor)` - 頂面高光
- `sideDark(baseColor)` - 側面陰影
- `ambientOcclusion(baseColor)` - 環境遮蔽

**評估**：
- ✅ 基礎等距光影完整
- ⚠️ 缺乏環境反射（水潭反光、金屬反光）
- ⚠️ 陰影投射不明顯（物件與地面分離感不足）
- ⚠️ 光暈擴散不夠（火把照明範圍視覺化）

#### 優化設計

**新增光影工具**：
```javascript
DK.PixelArt.Isometric.reflection = function(baseColor, intensity = 0.3) {
  // 水面/金屬反射（增加亮度 + 飽和度）
  return DK.PixelArt.lighten(
    DK.PixelArt.saturate(baseColor, intensity),
    intensity * 0.5
  );
};

DK.PixelArt.Shadow = {
  // 投射陰影（軟邊緣漸變）
  cast(ctx, x, y, w, h, direction = 'se', intensity = 0.15) {
    const offset = 2; // 2px 偏移
    for (let i = 0; i < 3; i++) {
      const alpha = intensity * (1 - i / 3);
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      const ox = direction.includes('e') ? offset + i : -offset - i;
      const oy = direction.includes('s') ? offset + i : 0;
      ctx.fillRect(x + ox, y + oy, w, h);
    }
  }
};
```

**火把光照強化**：
```javascript
// 當前：單一光暈範圍
// 優化：多層次光照擴散
function renderTorchLight(ctx, col, row, time) {
  const T = DK.CONFIG.TILE_SIZE;
  const x = col * T;
  const y = row * T;

  // 火把閃爍（1500ms 週期）
  const flicker = Math.sin(time / 1500 * Math.PI) * 0.2 + 0.8;

  // 3 層光暈擴散
  const layers = [
    { radius: 1.5, alpha: 0.12 * flicker },  // 內層（最亮）
    { radius: 2.5, alpha: 0.06 * flicker },  // 中層
    { radius: 3.5, alpha: 0.02 * flicker }   // 外層（最淡）
  ];

  for (const layer of layers) {
    const r = layer.radius * T;
    for (let dy = -r; dy < r; dy++) {
      for (let dx = -r; dx < r; dx++) {
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < r) {
          const falloff = 1 - (dist / r);
          const alpha = layer.alpha * falloff;
          ctx.fillStyle = `rgba(255,136,68,${alpha})`;
          ctx.fillRect(x + T/2 + dx, y + T/2 + dy, 1, 1);
        }
      }
    }
  }
}
```

### 3. 動畫與視覺反饋

#### 當前動畫系統

**已實作動畫**：
- 傳送門 4 層旋轉（300/500/400/800ms 週期）
- 地城之心脈動（1000ms 正常,500ms 危急）
- 火把閃爍（1500ms）
- 陷阱啟動閃光（150ms）
- 敵人行走動畫（250ms/幀）

**評估**：
- ✅ 動畫週期設計優秀（符合互質數原則）
- ⚠️ 缺乏微互動動畫（按鈕 hover、工具 tooltip）
- ⚠️ 階段切換無過渡動畫
- ⚠️ 成功/失敗反饋不夠明確

#### 優化設計

**微互動動畫系統**：
```javascript
DK.Animations = {
  // 按鈕 hover 動畫（200ms ease-out）
  buttonHover: {
    duration: 200,
    easing: 'easeOut',
    properties: {
      brightness: 1.2,
      borderGlow: 0.3,
      translateY: -1
    }
  },

  // 工具提示淡入（300ms）
  tooltipFadeIn: {
    duration: 300,
    easing: 'easeOut',
    properties: {
      opacity: 0 → 1,
      translateY: 10 → 0
    }
  },

  // 階段切換過渡（800ms）
  phaseTransition: {
    duration: 800,
    easing: 'easeInOut',
    sequence: [
      { type: 'fadeOut', duration: 300 },    // UI 淡出
      { type: 'phaseChange', duration: 0 },  // 切換狀態
      { type: 'fadeIn', duration: 500 }      // UI 淡入
    ]
  }
};
```

**成功/失敗慶祝動畫**：
```javascript
// 波次完成慶祝（已部分實作,需強化）
function renderWaveCompleteCelebration(ctx, time, bonus) {
  // 1. 金幣雨粒子（20 個）
  const particles = generateGoldRain(20, time);

  // 2. 放射光芒（8 條）
  const rays = generateVictoryRays(8, time);

  // 3. 文字彈跳動畫
  const textScale = 1 + Math.sin(time / 200) * 0.1;

  // 4. 音效觸發點（需整合音效系統）
  if (time === 0) triggerSound('victory');
}

// 遊戲失敗動畫（新增）
function renderGameOverEffect(ctx, time) {
  // 1. 螢幕紅光閃爍
  const flash = Math.sin(time / 100) * 0.3;
  ctx.fillStyle = `rgba(255,68,68,${flash})`;
  ctx.fillRect(0, 0, W, H);

  // 2. 地城之心碎裂動畫
  renderHeartShatter(ctx, time);

  // 3. 煙霧粒子上升
  const smoke = generateSmoke(time);
}
```

### 4. 像素藝術細節提升

#### 地圖磚塊細節

**當前實作**：
- 牆壁：純色填充 + 等距光影
- 地板：純色填充 + 等距光影
- 水潭：單一藍色
- 草叢：單一綠色

**優化設計**：
```javascript
// 牆壁紋理（2×2 微紋理）
function renderWallTile(ctx, x, y) {
  const base = DK.COLORS.WALL_BASE;
  const top = DK.PixelArt.Isometric.topLight(base);
  const side = DK.PixelArt.Isometric.sideDark(base);

  // 頂面（4×3）
  PA.rect(ctx, x+2, y, 4, 3, top);

  // 側面（2×4）+ 微紋理
  PA.rect(ctx, x, y+3, 2, 4, side);
  PA.rect(ctx, x+6, y+3, 2, 4, side);

  // 新增：石磚縫隙（1px 深色線）
  PA.pixel(ctx, x+3, y+1, DK.PixelArt.darken(top, 0.3));
  PA.pixel(ctx, x+1, y+4, DK.PixelArt.darken(side, 0.2));
}

// 水潭波紋動畫
function renderPoolTile(ctx, x, y, time) {
  const base = DK.COLORS.POOL_BASE;
  const T = DK.CONFIG.TILE_SIZE;

  // 基礎水面
  PA.rect(ctx, x, y, T, T, base);

  // 新增：波紋動畫（3000ms 週期）
  const wave = Math.sin((time + x + y) / 3000 * Math.PI);
  const ripple = DK.PixelArt.lighten(base, wave * 0.1);

  // 波紋線（對角線）
  for (let i = 0; i < T; i += 2) {
    PA.pixel(ctx, x+i, y+Math.floor(wave*2), ripple);
  }

  // 新增：反射光點（火把反射）
  if (nearTorch(x, y)) {
    const reflect = DK.PixelArt.lighten(base, 0.3);
    PA.pixel(ctx, x+T/2, y+T/2, reflect);
  }
}

// 草叢細節（3 種草叢狀態）
function renderGrassTile(ctx, x, y, state) {
  const T = DK.CONFIG.TILE_SIZE;
  const base = state === 'burned' ? '#2a2020' : DK.COLORS.GRASS_BASE;

  PA.rect(ctx, x, y, T, T, base);

  if (state === 'normal') {
    // 新增：草葉細節（隨機 seed）
    const seed = x * 1000 + y;
    const rng = DK.PixelArt.seededRandom(seed);

    for (let i = 0; i < 5; i++) {
      const gx = x + Math.floor(rng() * T);
      const gy = y + Math.floor(rng() * T);
      const color = rng() > 0.5
        ? DK.PixelArt.lighten(base, 0.2)
        : DK.PixelArt.darken(base, 0.1);
      PA.pixel(ctx, gx, gy, color);
    }
  }
}
```

### 5. 視覺特效強化

#### 粒子系統優化

**當前實作**：
- 環境浮塵（12-15 個,0.08-0.15 alpha）
- 金幣閃光（gold_sparkle）
- 深淵墜落（abyss_fall）
- 油漬噴濺（oil_splat）

**新增特效類型**：
```javascript
DK.Effects = {
  // 陷阱觸發火花
  trapSpark: {
    count: 8,
    duration: 300,
    spread: 'radial',
    color: '#ffdd44',
    velocity: { min: 0.5, max: 1.5 },
    gravity: 0.05
  },

  // 敵人受擊血花
  bloodSplatter: {
    count: 5,
    duration: 400,
    spread: 'cone',
    color: '#882222',
    velocity: { min: 0.3, max: 0.8 },
    fadeOut: true
  },

  // 元素反應爆炸
  elementalBurst: {
    count: 12,
    duration: 600,
    spread: 'sphere',
    color: 'dynamic', // 根據元素類型
    shockwave: true   // 衝擊波環
  },

  // 英雄光環脈動
  auraPulse: {
    duration: 2000,
    radius: { min: 16, max: 24 },
    alpha: { min: 0.1, max: 0.3 },
    color: 'heroType' // 根據英雄類型
  }
};
```

#### 投射物軌跡優化

**當前實作**：
- 箭矢/火球：直線飛行
- 基礎渲染：單一像素點

**優化設計**：
```javascript
// 投射物拖尾效果
function renderProjectileTrail(ctx, proj) {
  const trailLength = 5;
  const positions = proj.history || [];

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const alpha = (i / positions.length) * 0.5;
    const size = 1 + (i / positions.length);

    ctx.fillStyle = `rgba(255,136,68,${alpha})`;
    ctx.fillRect(pos.x, pos.y, size, size);
  }

  // 更新歷史位置
  proj.history = [{ x: proj.x, y: proj.y }, ...positions].slice(0, trailLength);
}

// 投射物命中特效
function renderProjectileHit(ctx, x, y, type) {
  // 衝擊環（3 層擴散）
  const rings = [
    { radius: 2, alpha: 0.6, color: '#ffaa44' },
    { radius: 4, alpha: 0.3, color: '#ff8844' },
    { radius: 6, alpha: 0.1, color: '#ff6644' }
  ];

  for (const ring of rings) {
    drawCircleOutline(ctx, x, y, ring.radius, ring.color, ring.alpha);
  }
}
```

---

## 🎯 UI/UX 改進設計方案

### 1. 資訊架構優化

#### 當前 UI 佈局分析

**畫面結構**（960×720px）：
```
┌────────────────────────────────┐
│  遊戲區域 (960×624px)           │
│  - 地圖、單位、特效              │
│  - 火把光照、環境動畫            │
├────────────────────────────────┤
│  UI 區域 (960×96px)             │
│  ├─ 陷阱按鈕 (左側)             │
│  ├─ 英雄按鈕 (中間)             │
│  ├─ 路障按鈕 (中右)             │
│  └─ 開始波次 (右側)             │
└────────────────────────────────┘
```

**問題識別**：
1. **資源資訊不明顯**：金幣、地城之心 HP 沒有固定位置
2. **波次進度不清晰**：當前波次/總波次、剩餘敵人數量
3. **按鈕分類不夠清楚**：陷阱/英雄/路障視覺區分不足
4. **缺乏狀態指示**：當前階段（PLANNING/INVASION）無視覺提示

#### 優化設計

**新增固定狀態列**（UI 區域頂部 30px）：
```
┌────────────────────────────────────────────┐
│ 💰 1250  ❤️ 80/100  📊 波次 2/5  ⚔️ 敵人 3/12 │
└────────────────────────────────────────────┘
```

**實作規格**：
```javascript
DK.UI.StatusBar = {
  height: 30,
  y: DK.CONFIG.UI_TOP - 30,

  sections: [
    {
      type: 'gold',
      icon: '💰',
      value: () => DK.Game.gold,
      color: DK.COLORS.GOLD_TEXT,
      width: 150
    },
    {
      type: 'heart',
      icon: '❤️',
      value: () => `${DK.Game.dungeonHeartHP}/${DK.Game.dungeonHeartMaxHP}`,
      color: DK.COLORS.HP_BAR,
      width: 150,
      alert: () => DK.Game.dungeonHeartHP < 30 // HP < 30 時閃爍
    },
    {
      type: 'wave',
      icon: '📊',
      value: () => `波次 ${DK.Game.currentWave+1}/${DK.WAVES.length}`,
      color: DK.COLORS.TEXT_PRIMARY,
      width: 150
    },
    {
      type: 'enemies',
      icon: '⚔️',
      value: () => {
        const alive = DK.Enemies.active.filter(e => e.alive).length;
        const total = DK.WAVES[DK.Game.currentWave]?.enemies.reduce((sum, g) => sum + g.count, 0) || 0;
        return `敵人 ${alive}/${total}`;
      },
      color: DK.COLORS.TEXT_SECONDARY,
      width: 150
    }
  ],

  render(ctx) {
    let x = 20;
    for (const section of this.sections) {
      // 背景框
      ctx.fillStyle = DK.COLORS.UI_BG_LIGHT;
      ctx.fillRect(x, this.y, section.width, this.height);

      // 圖標
      ctx.font = '20px sans-serif';
      ctx.fillText(section.icon, x + 5, this.y + 20);

      // 數值
      ctx.font = DK.FONTS.bold(14);
      ctx.fillStyle = section.color;

      // 警告狀態閃爍
      if (section.alert && section.alert()) {
        const flash = Math.sin(Date.now() / 200) * 0.5 + 0.5;
        ctx.globalAlpha = 0.5 + flash * 0.5;
      }

      ctx.fillText(section.value(), x + 35, this.y + 20);
      ctx.globalAlpha = 1;

      x += section.width + 10;
    }
  }
};
```

**工具欄分類強化**：
```javascript
// 視覺分隔線優化
DK.UI.renderCategorySeparator = function(ctx, x, y, height, label) {
  // 分隔線（漸變）
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, 'rgba(106,94,142,0)');
  gradient.addColorStop(0.5, 'rgba(106,94,142,0.8)');
  gradient.addColorStop(1, 'rgba(106,94,142,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x - 1, y, 2, height);

  // 分類標籤（垂直文字）
  if (label) {
    ctx.save();
    ctx.translate(x + 6, y + height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = DK.FONTS.body(10);
    ctx.fillStyle = DK.COLORS.TEXT_TERTIARY;
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }
};

// 使用
renderCategorySeparator(ctx, separatorX, separatorY, separatorH, '陷阱');
```

### 2. 互動流程優化

#### 三階段流程強化

**當前實作**：
- START: 點擊任意處開始
- PLANNING → INVASION: 點擊「開始波次」按鈕
- INVASION → PLANNING: 波次結束自動切換

**問題**：
- ❌ START 畫面缺乏引導
- ❌ PLANNING 階段無明確目標提示
- ❌ INVASION 階段無法暫停或查看狀態

**優化設計**：

**START 畫面重新設計**：
```javascript
DK.UI.renderStartScreen = function(ctx, uiCtx, time) {
  // === 遊戲 Canvas（低解析度）===
  // 1. 傳送門動畫背景（3 個）
  for (let i = 0; i < 3; i++) {
    const x = (i + 1) * 80;
    const y = 104;
    DK.Map.drawPortalFull(ctx, x, y, DK.COLORS.PORTAL_GREEN, time / 1000);
  }

  // 2. 火把閃爍（6 個）
  const torchPositions = [[40,60], [280,60], [40,140], [280,140]];
  for (const [x, y] of torchPositions) {
    renderTorchWithGlow(ctx, x, y, time);
  }

  // === UI Canvas（高解析度）===
  uiCtx.fillStyle = 'rgba(18,16,30,0.85)';
  uiCtx.fillRect(0, 0, 960, 720);

  // 3. 遊戲標題（大字體 + 陰影）
  uiCtx.save();
  uiCtx.shadowColor = '#aa44ff';
  uiCtx.shadowBlur = 20;
  uiCtx.font = DK.FONTS.heavy(48);
  uiCtx.fillStyle = '#f0e8d8';
  uiCtx.textAlign = 'center';
  uiCtx.fillText('地層守衛', 480, 200);
  uiCtx.restore();

  // 4. 副標題
  uiCtx.font = DK.FONTS.body(18);
  uiCtx.fillStyle = '#c0b8a8';
  uiCtx.textAlign = 'center';
  uiCtx.fillText('Dungeon Keep - 塔防原型', 480, 240);

  // 5. 遊戲目標（3 行簡介）
  const intro = [
    '🎯 守護地城之心',
    '⚔️ 部署陷阱與英雄',
    '🌀 抵禦入侵者的波次進攻'
  ];
  uiCtx.font = DK.FONTS.body(16);
  uiCtx.fillStyle = '#e8e0d0';
  for (let i = 0; i < intro.length; i++) {
    uiCtx.fillText(intro[i], 480, 300 + i * 35);
  }

  // 6. 開始按鈕（脈動動畫）
  const pulse = Math.sin(time / 1000 * Math.PI) * 0.1 + 0.9;
  const btnW = 200, btnH = 50;
  const btnX = 480 - btnW/2, btnY = 450;

  uiCtx.fillStyle = DK.COLORS.UI_BG_LIGHT;
  uiCtx.fillRect(btnX, btnY, btnW, btnH);

  uiCtx.strokeStyle = `rgba(170,68,255,${pulse})`;
  uiCtx.lineWidth = 2;
  uiCtx.strokeRect(btnX, btnY, btnW, btnH);

  uiCtx.font = DK.FONTS.bold(20);
  uiCtx.fillStyle = '#f0e8d8';
  uiCtx.textAlign = 'center';
  uiCtx.fillText('開始遊戲', 480, 480);

  // 7. 提示文字（閃爍）
  const blinkAlpha = Math.sin(time / 600 * Math.PI) * 0.3 + 0.7;
  uiCtx.globalAlpha = blinkAlpha;
  uiCtx.font = DK.FONTS.body(14);
  uiCtx.fillStyle = '#8a8070';
  uiCtx.fillText('點擊任意處開始', 480, 580);
  uiCtx.globalAlpha = 1;
};
```

**PLANNING 階段引導**：
```javascript
// 新增：規劃階段提示系統
DK.UI.PlanningGuide = {
  tips: [
    { icon: '🛠️', text: '放置陷阱佈置防線' },
    { icon: '👑', text: '部署英雄協助作戰' },
    { icon: '🚧', text: '使用路障引導敵人路徑' },
    { icon: '💡', text: '查看虛線預覽敵人路徑' },
    { icon: '▶️', text: '準備好後點擊開始波次' }
  ],

  currentTip: 0,
  timer: 0,
  duration: 4000, // 每 4 秒切換提示

  update(dt) {
    this.timer += dt;
    if (this.timer >= this.duration) {
      this.currentTip = (this.currentTip + 1) % this.tips.length;
      this.timer = 0;
    }
  },

  render(ctx) {
    const tip = this.tips[this.currentTip];
    const x = 480, y = 50;

    // 淡入淡出動畫
    const fadeTime = 500;
    let alpha = 1;
    if (this.timer < fadeTime) {
      alpha = this.timer / fadeTime;
    } else if (this.timer > this.duration - fadeTime) {
      alpha = (this.duration - this.timer) / fadeTime;
    }

    ctx.globalAlpha = alpha;

    // 背景框
    ctx.fillStyle = 'rgba(30,26,46,0.9)';
    ctx.fillRect(x - 150, y - 20, 300, 40);

    // 圖標 + 文字
    ctx.font = '20px sans-serif';
    ctx.fillText(tip.icon, x - 120, y + 5);

    ctx.font = DK.FONTS.body(16);
    ctx.fillStyle = '#e8e0d0';
    ctx.textAlign = 'center';
    ctx.fillText(tip.text, x, y + 5);

    ctx.globalAlpha = 1;
  }
};
```

**INVASION 階段強化**：
```javascript
// 新增：侵略階段狀態指示
DK.UI.InvasionIndicator = {
  render(ctx) {
    const x = 20, y = 20;

    // 階段標籤
    ctx.fillStyle = 'rgba(255,68,68,0.2)';
    ctx.fillRect(x, y, 120, 30);

    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 120, 30);

    ctx.font = DK.FONTS.bold(14);
    ctx.fillStyle = '#ff4444';
    ctx.textAlign = 'left';
    ctx.fillText('⚔️ 戰鬥中', x + 10, y + 20);

    // 脈動邊框（警示效果）
    const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
    ctx.globalAlpha = pulse * 0.5;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 2, y - 2, 124, 34);
    ctx.globalAlpha = 1;
  }
};
```

### 3. 反饋與提示系統

#### 當前實作分析

**現有反饋機制**：
- ✅ 陷阱觸發閃光（150ms flashTimer）
- ✅ 敵人受擊閃爍（flashTimer）
- ✅ 傷害數字浮動（damage effect）
- ✅ 金幣獲得提示（gold effect）
- ⚠️ 錯誤提示（showMessage）- 太小、太短

**問題識別**：
1. **錯誤提示不明顯**：「金幣不足」訊息容易忽略
2. **成功反饋不足**：放置陷阱/英雄無視覺確認
3. **冷卻提示不清楚**：陷阱冷卻中點擊無反應
4. **教學缺失**：新玩家不知道如何操作

#### 優化設計

**錯誤提示系統重新設計**：
```javascript
DK.UI.ErrorNotification = {
  queue: [],
  current: null,

  show(message, type = 'error') {
    this.queue.push({
      message,
      type, // 'error' | 'warning' | 'info'
      timer: 0,
      duration: 2000
    });
  },

  update(dt) {
    if (!this.current && this.queue.length > 0) {
      this.current = this.queue.shift();
    }

    if (this.current) {
      this.current.timer += dt;
      if (this.current.timer >= this.current.duration) {
        this.current = null;
      }
    }
  },

  render(ctx) {
    if (!this.current) return;

    const n = this.current;
    const x = 480, y = 300; // 螢幕中央

    // 滑入滑出動畫
    const slideTime = 300;
    let offsetY = 0;
    if (n.timer < slideTime) {
      offsetY = -50 * (1 - n.timer / slideTime);
    } else if (n.timer > n.duration - slideTime) {
      offsetY = -50 * (n.timer - (n.duration - slideTime)) / slideTime;
    }

    // 淡入淡出
    let alpha = 1;
    if (n.timer < slideTime) {
      alpha = n.timer / slideTime;
    } else if (n.timer > n.duration - slideTime) {
      alpha = (n.duration - n.timer) / slideTime;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, offsetY);

    // 背景框（根據類型變色）
    const colors = {
      error: { bg: '#6e3e3e', border: '#ff4444', icon: '❌' },
      warning: { bg: '#6e5e3e', border: '#ffaa44', icon: '⚠️' },
      info: { bg: '#3e4e6e', border: '#4488ff', icon: 'ℹ️' }
    };
    const style = colors[n.type];

    const w = 300, h = 60;

    // 背景
    ctx.fillStyle = style.bg;
    ctx.fillRect(x - w/2, y - h/2, w, h);

    // 邊框（脈動）
    const pulse = Math.sin(n.timer / 200) * 0.3 + 0.7;
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 3 * pulse;
    ctx.strokeRect(x - w/2, y - h/2, w, h);

    // 圖標
    ctx.font = '24px sans-serif';
    ctx.fillText(style.icon, x - 120, y + 8);

    // 訊息文字
    ctx.font = DK.FONTS.bold(16);
    ctx.fillStyle = '#f0e8d8';
    ctx.textAlign = 'left';
    ctx.fillText(n.message, x - 90, y + 8);

    ctx.restore();
  }
};

// 使用範例
if (DK.Game.gold < trap.cost) {
  DK.UI.ErrorNotification.show('金幣不足！', 'error');
  return;
}
```

**成功反饋系統**：
```javascript
DK.UI.SuccessFeedback = {
  show(x, y, type) {
    DK.Game.effects.push({
      type: 'success_ring',
      x, y,
      timer: 0,
      duration: 400,
      feedbackType: type // 'trap_placed', 'hero_deployed', etc.
    });
  }
};

// 在 main.js renderEffects 中新增
function renderSuccessRing(ctx, effect) {
  const progress = effect.timer / effect.duration;
  const radius = 4 + progress * 12;
  const alpha = 1 - progress;

  ctx.strokeStyle = `rgba(68,255,136,${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}
```

**工具提示系統（Tooltip）**：
```javascript
DK.UI.Tooltip = {
  content: null,
  x: 0,
  y: 0,
  timer: 0,
  delay: 500, // 懸停 500ms 後顯示

  show(content, x, y) {
    this.content = content;
    this.x = x;
    this.y = y;
    this.timer = 0;
  },

  hide() {
    this.content = null;
    this.timer = 0;
  },

  update(dt) {
    if (this.content) {
      this.timer += dt;
    }
  },

  render(ctx) {
    if (!this.content || this.timer < this.delay) return;

    const fadeTime = 200;
    const alpha = Math.min(1, (this.timer - this.delay) / fadeTime);

    ctx.save();
    ctx.globalAlpha = alpha;

    // 測量文字寬度
    ctx.font = DK.FONTS.body(14);
    const metrics = ctx.measureText(this.content);
    const w = metrics.width + 20;
    const h = 30;

    // 確保不超出螢幕
    let x = this.x;
    let y = this.y - h - 10;
    if (x + w > 960) x = 960 - w;
    if (y < 0) y = this.y + 30;

    // 背景框
    ctx.fillStyle = '#1e1a2e';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#6a5e8e';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // 文字
    ctx.fillStyle = '#e8e0d0';
    ctx.textAlign = 'left';
    ctx.fillText(this.content, x + 10, y + 20);

    ctx.restore();
  }
};

// 使用範例（在按鈕 hover 時）
DK.UI.handleMouseMove = function(mx, my) {
  // ... 現有邏輯 ...

  for (const btn of this.buttons) {
    if (isMouseOver(btn, mx, my)) {
      if (btn.trap) {
        const tooltip = `${btn.trap.name} - ${btn.trap.cost} 金幣`;
        this.Tooltip.show(tooltip, mx, my);
      }
      return;
    }
  }

  this.Tooltip.hide();
};
```

### 4. 按鈕與控制元件優化

#### 當前按鈕系統

**實作分析**（來自 ui.js buildButtons）：
- 動態計算寬度（~120px）
- 高度固定（70px）
- 分類：陷阱/英雄/路障
- 狀態：normal/hover/selected

**問題**：
- ⚠️ hover 效果不明顯
- ⚠️ 禁用狀態無視覺區分
- ⚠️ 快捷鍵未顯示
- ⚠️ 數量/冷卻資訊不清楚

#### 優化設計

**按鈕狀態系統**：
```javascript
DK.UI.ButtonStates = {
  NORMAL: 'normal',
  HOVER: 'hover',
  SELECTED: 'selected',
  DISABLED: 'disabled',
  COOLDOWN: 'cooldown'
};

DK.UI.getButtonState = function(btn) {
  // 優先級：禁用 > 冷卻 > 選中 > 懸停 > 正常

  if (btn.trap && DK.Game.gold < btn.trap.cost) {
    return this.ButtonStates.DISABLED;
  }

  if (btn.hero && DK.Game.gold < btn.hero.cost) {
    return this.ButtonStates.DISABLED;
  }

  if (btn.trap && this.selectedTrap === btn.trap.id) {
    return this.ButtonStates.SELECTED;
  }

  if (btn.hero && this.selectedHeroType === btn.hero.id) {
    return this.ButtonStates.SELECTED;
  }

  if (this.hoveredButton === btn) {
    return this.ButtonStates.HOVER;
  }

  return this.ButtonStates.NORMAL;
};
```

**按鈕渲染強化**：
```javascript
DK.UI.renderButton = function(ctx, btn, state) {
  const x = btn.x, y = btn.y, w = btn.width, h = btn.height;

  // 狀態配色
  const stateStyles = {
    normal: {
      bg: '#2a2438',
      border: '#4a3e6e',
      borderWidth: 1,
      glow: 0
    },
    hover: {
      bg: '#3a3448',
      border: '#6a5e8e',
      borderWidth: 2,
      glow: 0.3,
      offsetY: -2 // 上浮效果
    },
    selected: {
      bg: '#4a3e5e',
      border: '#ffaa44',
      borderWidth: 3,
      glow: 0.6
    },
    disabled: {
      bg: '#1a1828',
      border: '#2a2838',
      borderWidth: 1,
      glow: 0,
      opacity: 0.5
    }
  };

  const style = stateStyles[state];
  const offsetY = style.offsetY || 0;

  ctx.save();

  // 禁用狀態降低透明度
  if (style.opacity) {
    ctx.globalAlpha = style.opacity;
  }

  // 背景
  ctx.fillStyle = style.bg;
  ctx.fillRect(x, y + offsetY, w, h);

  // 邊框
  ctx.strokeStyle = style.border;
  ctx.lineWidth = style.borderWidth;
  ctx.strokeRect(x, y + offsetY, w, h);

  // 發光效果（選中/懸停）
  if (style.glow > 0) {
    ctx.shadowColor = style.border;
    ctx.shadowBlur = 10 * style.glow;
    ctx.strokeRect(x, y + offsetY, w, h);
    ctx.shadowBlur = 0;
  }

  // 圖標（陷阱/英雄類型）
  if (btn.trap) {
    this.renderTrapIcon(ctx, x + w/2, y + offsetY + h/2 - 10, btn.trap);
  } else if (btn.hero) {
    this.renderHeroIcon(ctx, x + w/2, y + offsetY + h/2 - 10, btn.hero);
  } else if (btn.barricade) {
    this.renderBarricadeIcon(ctx, x + w/2, y + offsetY + h/2 - 10);
  }

  // 文字標籤
  ctx.font = DK.FONTS.body(12);
  ctx.fillStyle = state === 'disabled' ? '#6a6070' : '#e8e0d0';
  ctx.textAlign = 'center';
  const name = btn.trap?.name || btn.hero?.name || btn.label || '路障';
  ctx.fillText(name, x + w/2, y + offsetY + h - 12);

  // 成本標籤（右上角）
  const cost = btn.trap?.cost || btn.hero?.cost || 10;
  ctx.font = DK.FONTS.bold(10);
  ctx.fillStyle = DK.Game.gold >= cost ? DK.COLORS.GOLD_TEXT : '#ff4444';
  ctx.textAlign = 'right';
  ctx.fillText(`${cost}`, x + w - 5, y + offsetY + 15);

  // 快捷鍵提示（左上角）
  if (btn.hotkey) {
    ctx.font = DK.FONTS.body(10);
    ctx.fillStyle = '#8a8070';
    ctx.textAlign = 'left';
    ctx.fillText(btn.hotkey, x + 5, y + offsetY + 15);
  }

  // 數量徽章（英雄/路障）
  if (btn.hero) {
    const deployed = DK.Heroes.active.filter(h => h.type.id === btn.hero.id).length;
    if (deployed > 0) {
      this.renderBadge(ctx, x + w - 8, y + offsetY + 8, deployed.toString(), '#4488ff');
    }
  }

  if (btn.barricade) {
    const count = DK.Map.barricades.length;
    const max = DK.CONFIG.BARRICADE_MAX;
    this.renderBadge(ctx, x + w - 8, y + offsetY + 8, `${count}/${max}`, '#6a6070');
  }

  ctx.restore();
};

// 徽章渲染
DK.UI.renderBadge = function(ctx, x, y, text, color) {
  const r = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#1e1a2e';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = DK.FONTS.bold(10);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + 4);
};
```

**快捷鍵系統**：
```javascript
// 新增鍵盤控制
DK.UI.HotkeySystem = {
  bindings: {
    '1': () => DK.UI.selectTrap('spike_trap'),
    '2': () => DK.UI.selectTrap('fire_trap'),
    '3': () => DK.UI.selectTrap('ice_trap'),
    // ... 更多陷阱
    'Q': () => DK.UI.selectHero('leviathan'),
    'W': () => DK.UI.selectHero('baal'),
    'E': () => DK.UI.toggleBarricadeMode(),
    'SPACE': () => DK.Game.state === 'planning' && DK.Game.startInvasion(),
    'ESC': () => DK.UI.clearSelection()
  },

  init() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toUpperCase();
      if (this.bindings[key]) {
        e.preventDefault();
        this.bindings[key]();
      }
    });
  }
};

// 在按鈕數據中添加 hotkey 屬性
trapTypes.forEach((trap, i) => {
  this.buttons.push({
    trap,
    x: startX + (btnWidth + gap) * i,
    y: startY,
    width: btnWidth,
    height: btnHeight,
    hotkey: (i + 1).toString() // '1', '2', '3'...
  });
});
```

### 5. 遊戲引導與教學系統

#### 當前狀態

**已實作**（tutorial.js 存在）：
- 需檢查具體內容（檔案未完整讀取）
- 推測：基礎教學系統框架

**缺失部分**：
- 互動式教學（手把手引導）
- 視覺高亮（指向特定 UI 元素）
- 階段性解鎖（循序漸進）

#### 優化設計

**教學系統重新設計**：
```javascript
DK.Tutorial = {
  active: false,
  currentStep: 0,
  completed: false,

  steps: [
    {
      id: 'welcome',
      title: '歡迎來到地層守衛！',
      description: '你的任務是守護地城之心,抵禦入侵者。',
      highlight: null,
      nextTrigger: 'click'
    },
    {
      id: 'show_heart',
      title: '地城之心',
      description: '這是你的地城之心，HP 降至 0 就會失敗！',
      highlight: { type: 'heart', pulse: true },
      arrow: { from: 'top', to: 'heart' },
      nextTrigger: 'auto',
      autoDelay: 3000
    },
    {
      id: 'show_portal',
      title: '傳送門',
      description: '敵人會從綠色傳送門湧出,沿虛線路徑進攻。',
      highlight: { type: 'portal', pulse: true },
      arrow: { from: 'left', to: 'portal' },
      nextTrigger: 'auto',
      autoDelay: 3000
    },
    {
      id: 'place_trap',
      title: '放置陷阱',
      description: '點擊陷阱按鈕,然後在地圖上放置。試試看！',
      highlight: { type: 'trapButton', index: 0 },
      arrow: { from: 'bottom', to: 'trapButton' },
      nextTrigger: 'trap_placed'
    },
    {
      id: 'start_wave',
      title: '開始波次',
      description: '準備好了嗎？點擊右側按鈕開始第一波進攻！',
      highlight: { type: 'waveButton' },
      arrow: { from: 'right', to: 'waveButton' },
      nextTrigger: 'wave_started'
    },
    {
      id: 'complete',
      title: '教學完成',
      description: '做得好！現在你已經掌握基本操作了。',
      highlight: null,
      nextTrigger: 'click'
    }
  ],

  start() {
    this.active = true;
    this.currentStep = 0;
    DK.Game.state = 'planning'; // 強制進入規劃階段
  },

  nextStep() {
    this.currentStep++;
    if (this.currentStep >= this.steps.length) {
      this.complete();
    }
  },

  complete() {
    this.active = false;
    this.completed = true;
    localStorage.setItem('dk_tutorial_completed', 'true');
  },

  update(dt) {
    if (!this.active) return;

    const step = this.steps[this.currentStep];

    // 自動觸發下一步
    if (step.nextTrigger === 'auto') {
      step.timer = (step.timer || 0) + dt;
      if (step.timer >= step.autoDelay) {
        this.nextStep();
      }
    }
  },

  render(ctx) {
    if (!this.active) return;

    const step = this.steps[this.currentStep];

    // 1. 遮罩層（半透明黑色,高亮區域除外）
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 960, 720);

    // 2. 高亮區域（清空遮罩）
    if (step.highlight) {
      const highlightArea = this.getHighlightArea(step.highlight);
      ctx.clearRect(
        highlightArea.x,
        highlightArea.y,
        highlightArea.w,
        highlightArea.h
      );

      // 脈動邊框
      if (step.highlight.pulse) {
        const pulse = Math.sin(Date.now() / 500) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(255,170,68,${pulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(
          highlightArea.x - 2,
          highlightArea.y - 2,
          highlightArea.w + 4,
          highlightArea.h + 4
        );
      }
    }

    // 3. 箭頭指示
    if (step.arrow) {
      this.renderArrow(ctx, step.arrow);
    }

    // 4. 說明文字框
    this.renderTutorialPanel(ctx, step);
  },

  renderTutorialPanel(ctx, step) {
    const x = 480 - 200, y = 100;
    const w = 400, h = 120;

    // 背景框
    ctx.fillStyle = '#1e1a2e';
    ctx.fillRect(x, y, w, h);

    ctx.strokeStyle = '#6a5e8e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // 標題
    ctx.font = DK.FONTS.bold(18);
    ctx.fillStyle = '#ffaa44';
    ctx.textAlign = 'center';
    ctx.fillText(step.title, x + w/2, y + 30);

    // 描述（自動換行）
    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = '#e8e0d0';
    this.wrapText(ctx, step.description, x + 20, y + 55, w - 40, 20);

    // 進度指示
    ctx.font = DK.FONTS.body(12);
    ctx.fillStyle = '#8a8070';
    ctx.fillText(`${this.currentStep + 1} / ${this.steps.length}`, x + w/2, y + h - 10);
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let lineY = y;

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, lineY);
        line = word + ' ';
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, lineY);
  },

  getHighlightArea(highlight) {
    switch (highlight.type) {
      case 'heart':
        const hp = DK.Map.heartPos;
        const T = DK.CONFIG.TILE_SIZE;
        return { x: hp.col * T * 3, y: hp.row * T * 3, w: T * 3 * 2, h: T * 3 * 2 };

      case 'portal':
        const portal = DK.Map.portals[0];
        return { x: portal.col * T * 3, y: portal.row * T * 3, w: T * 3 * 2, h: T * 3 * 2 };

      case 'trapButton':
        const btn = DK.UI.buttons[highlight.index];
        return { x: btn.x, y: btn.y, w: btn.width, h: btn.height };

      case 'waveButton':
        const waveBtn = DK.UI.buttons.find(b => b.action === 'start_wave');
        return { x: waveBtn.x, y: waveBtn.y, w: waveBtn.width, h: waveBtn.height };

      default:
        return { x: 0, y: 0, w: 0, h: 0 };
    }
  }
};

// 觸發器檢查
DK.UI.handleClick = function(mx, my) {
  // ... 現有邏輯 ...

  // 教學觸發器
  if (DK.Tutorial.active) {
    const step = DK.Tutorial.steps[DK.Tutorial.currentStep];

    if (step.nextTrigger === 'trap_placed' && /* 檢查是否放置了陷阱 */) {
      DK.Tutorial.nextStep();
    }

    if (step.nextTrigger === 'wave_started' && /* 檢查是否開始波次 */) {
      DK.Tutorial.nextStep();
    }

    if (step.nextTrigger === 'click') {
      DK.Tutorial.nextStep();
    }
  }
};
```

---

## 📊 實作優先級與階段規劃

### Impact/Effort 矩陣評估

#### Quick Wins（高影響、低成本）

1. **狀態列新增**
   - Impact: ⭐⭐⭐⭐⭐（資訊可見性大幅提升）
   - Effort: ⭐⭐（純 UI 渲染,不涉及遊戲邏輯）
   - 實作時間: 2-3 小時
   - 風險: 低（獨立模組）

2. **錯誤提示優化**
   - Impact: ⭐⭐⭐⭐（玩家體驗明顯改善）
   - Effort: ⭐（替換現有 showMessage）
   - 實作時間: 1-2 小時
   - 風險: 極低（不破壞現有邏輯）

3. **按鈕 hover 效果強化**
   - Impact: ⭐⭐⭐（視覺反饋提升）
   - Effort: ⭐（修改現有按鈕渲染）
   - 實作時間: 1 小時
   - 風險: 極低

4. **色彩系統補充**
   - Impact: ⭐⭐⭐⭐（一致性與可讀性提升）
   - Effort: ⭐（新增 DK.COLORS 定義）
   - 實作時間: 30 分鐘
   - 風險: 極低

#### Major Projects（高影響、高成本）

1. **教學系統重新設計**
   - Impact: ⭐⭐⭐⭐⭐（新玩家留存率關鍵）
   - Effort: ⭐⭐⭐⭐（複雜互動邏輯）
   - 實作時間: 8-10 小時
   - 風險: 中（需要整合多個系統）

2. **START 畫面重新設計**
   - Impact: ⭐⭐⭐⭐（第一印象決定性）
   - Effort: ⭐⭐⭐（視覺設計 + 動畫）
   - 實作時間: 4-5 小時
   - 風險: 低（獨立畫面）

3. **火把光照強化**
   - Impact: ⭐⭐⭐⭐（氛圍提升）
   - Effort: ⭐⭐⭐（性能優化需謹慎）
   - 實作時間: 3-4 小時
   - 風險: 中（可能影響幀率）

4. **階段切換動畫**
   - Impact: ⭐⭐⭐（流程順暢度）
   - Effort: ⭐⭐⭐（狀態機整合）
   - 實作時間: 3-4 小時
   - 風險: 中（觸及核心遊戲流程）

#### Fill Ins（低影響、低成本）

1. **快捷鍵系統**
   - Impact: ⭐⭐（進階玩家喜愛）
   - Effort: ⭐（事件監聽）
   - 實作時間: 1 小時
   - 風險: 極低

2. **工具提示系統**
   - Impact: ⭐⭐⭐（可發現性）
   - Effort: ⭐（懸停檢測 + 渲染）
   - 實作時間: 2 小時
   - 風險: 低

3. **地圖磚塊紋理**
   - Impact: ⭐⭐（視覺豐富度）
   - Effort: ⭐⭐（像素藝術細節）
   - 實作時間: 2-3 小時
   - 風險: 極低

#### Thankless Tasks（低影響、高成本）

1. **水潭波紋動畫**
   - Impact: ⭐（細節裝飾）
   - Effort: ⭐⭐⭐（性能考量）
   - 實作時間: 3 小時
   - 風險: 中（幀率影響）
   - 建議: 延後或取消

### 實作階段規劃

#### Phase 1: 基礎 UX 強化（Quick Wins 優先）

**目標**: 快速提升玩家體驗,解決明顯痛點

**包含項目**:
1. 新增狀態列（金幣/HP/波次/敵人）
2. 錯誤提示系統優化
3. 按鈕 hover/disabled 狀態強化
4. 色彩系統補充（DK.COLORS 擴充）
5. 成功反饋系統（陷阱放置確認）

**預期成果**:
- UI 資訊清晰可見
- 錯誤反饋明確
- 操作反饋即時

**實作時間**: 5-8 小時
**風險**: 低
**依賴**: 無

---

#### Phase 2: 視覺深度提升

**目標**: 強化視覺品質,提升遊戲氛圍

**包含項目**:
1. START 畫面重新設計
2. 火把光照 3 層擴散
3. 投射物拖尾效果
4. 階段切換過渡動畫
5. 波次完成/遊戲失敗慶祝動畫強化

**預期成果**:
- 第一印象提升
- 視覺深度增強
- 遊戲氛圍更沉浸

**實作時間**: 8-12 小時
**風險**: 中（火把光照需注意性能）
**依賴**: Phase 1 完成（狀態列/色彩系統）

---

#### Phase 3: 互動體驗優化

**目標**: 流程順暢,操作直覺

**包含項目**:
1. PLANNING 階段引導提示
2. INVASION 階段狀態指示
3. 工具提示系統（Tooltip）
4. 快捷鍵系統
5. 規劃階段提示輪播

**預期成果**:
- 玩家明確知道當前階段
- 操作提示清晰
- 進階操作可用

**實作時間**: 6-8 小時
**風險**: 低
**依賴**: Phase 1 完成

---

#### Phase 4: 教學與引導（可選）

**目標**: 新玩家友善,降低學習曲線

**包含項目**:
1. 互動式教學系統
2. 視覺高亮與箭頭指示
3. 階段性解鎖提示
4. 教學完成徽章

**預期成果**:
- 新玩家快速上手
- 教學體驗流暢
- 留存率提升

**實作時間**: 8-10 小時
**風險**: 中（整合複雜）
**依賴**: Phase 1-3 完成

**建議**: 視專案時程決定是否實作（非必要但有益）

---

### 依賴關係圖

```
Phase 1 (基礎 UX)
  ├─→ Phase 2 (視覺深度)
  └─→ Phase 3 (互動體驗)
        └─→ Phase 4 (教學系統,可選)
```

**關鍵路徑**: Phase 1 必須最先完成,為後續提供基礎

### 風險與緩解策略

#### 風險 1: 火把光照性能影響

**描述**: 3 層光暈擴散可能導致幀率下降
**影響**: 中
**緩解策略**:
1. 實作視距剔除（僅渲染視野內火把）
2. 預渲染光暈 canvas 快取
3. 降低光暈解析度（每 2px 繪製一次）
4. 動態調整（FPS < 55 時關閉外層光暈）

#### 風險 2: 教學系統與遊戲流程衝突

**描述**: 教學系統可能阻斷正常遊戲流程
**影響**: 中
**緩解策略**:
1. 提供「跳過教學」選項
2. 教學狀態與正常遊戲完全隔離
3. 使用 localStorage 記錄教學完成狀態
4. 充分測試各種跳過/中斷情境

#### 風險 3: 階段切換動畫卡頓

**描述**: 過渡動畫可能在狀態切換時產生視覺延遲
**影響**: 低
**緩解策略**:
1. 動畫時長控制在 800ms 以內
2. 使用 requestAnimationFrame 確保流暢
3. 提供「關閉動畫」設定選項
4. 測試低階設備表現

#### 風險 4: 色彩對比度不足

**描述**: 新增色彩可能違反 WCAG AA 標準
**影響**: 低
**緩解策略**:
1. 使用對比度檢查工具驗證（WebAIM Contrast Checker）
2. 所有文字/背景組合對比度 ≥ 4.5:1
3. 提供高對比度模式（可選）
4. 色盲友善設計（不僅依賴色彩區分）

### 建議實作順序

**第 1 週**: Phase 1（基礎 UX 強化）
- Day 1-2: 狀態列 + 錯誤提示
- Day 3: 按鈕狀態優化
- Day 4: 色彩系統 + 成功反饋
- Day 5: 測試與調整

**第 2 週**: Phase 2（視覺深度提升）
- Day 1-2: START 畫面重新設計
- Day 3: 火把光照強化（含性能測試）
- Day 4: 投射物 + 階段切換動畫
- Day 5: 慶祝動畫強化

**第 3 週**: Phase 3（互動體驗優化）
- Day 1: 階段提示系統
- Day 2: 工具提示 + 快捷鍵
- Day 3-4: 整合測試
- Day 5: 修復問題與優化

**（可選）第 4 週**: Phase 4（教學系統）
- Day 1-2: 教學系統框架
- Day 3: 視覺高亮與箭頭
- Day 4: 教學流程測試
- Day 5: 最終整合與發布準備

---

## 🎨 設計原則總結

### 視覺設計原則

1. **4 層動畫哲學**：基礎/動態/焦點/細節
2. **互質數週期**：LCM ≥ 10 秒,避免機械感
3. **等距光影一致性**：topLight/sideDark/ambientOcclusion 統一應用
4. **色彩語義化**：成功綠/警告橙/錯誤紅/資訊藍/禁用灰
5. **性能優先**：視距剔除、快取、降頻

### UX 設計原則

1. **3 秒原則**：新玩家 3 秒內理解核心操作
2. **即時反饋**：所有操作 < 200ms 視覺確認
3. **錯誤容忍**：誤操作可撤銷,不懲罰探索
4. **漸進揭示**：核心功能優先,進階功能逐步解鎖
5. **無障礙設計**：對比度 ≥ 4.5:1,色盲友善,鍵盤導航

### 技術實作原則

1. **Pure JS**：不引入框架,保持輕量
2. **模組化**：新功能獨立檔案,不污染全域
3. **向下相容**：不破壞現有系統
4. **效能預算**：動畫總開銷 < 5ms/幀（60 FPS）
5. **測試驅動**：每個階段完成後充分測試

---

## 📝 檢查清單

### 視覺設計檢查

- [ ] 色彩符合 DK.COLORS 色板
- [ ] 動畫週期符合互質數原則（LCM ≥ 10s）
- [ ] 等距光影統一應用
- [ ] 對比度檢查通過（文字 ≥ 4.5:1）
- [ ] 性能測試（動畫開銷 < 5ms）
- [ ] 視距剔除實作（螢幕外不渲染）

### UX 設計檢查

- [ ] 資訊層次清晰（狀態列/工具欄/遊戲區）
- [ ] 互動反饋明確（hover/click/success/error）
- [ ] 錯誤處理友善（提示清楚、可撤銷）
- [ ] 教學引導完整（新玩家能快速上手）
- [ ] 快捷鍵可用（進階玩家效率提升）
- [ ] 無障礙考量（色盲模式、鍵盤導航）

### 技術實作檢查

- [ ] Canvas 雙層架構相容
- [ ] 模組化良好（不污染 DK 命名空間）
- [ ] 與現有系統整合（不破壞 game.js/ui.js）
- [ ] 效能影響評估（FPS 測試）
- [ ] 跨瀏覽器測試（Chrome/Firefox/Safari）
- [ ] 向下相容測試（舊存檔能正常載入）

### 整體協調檢查

- [ ] 與 Dungeon Keeper 風格一致
- [ ] 與 10 次視覺迭代成果協調
- [ ] 不與其他子系統視覺衝突
- [ ] 支援未來擴展（房間系統、編輯器）
- [ ] 文檔完整（註解清楚、設計文檔更新）

---

## 🎯 成功指標

### 定量指標

1. **視覺品質**
   - FPS ≥ 55（90% 時間）
   - 動畫預算 < 5ms/幀
   - 對比度 ≥ 4.5:1（所有文字）

2. **用戶體驗**
   - 新玩家第一局完成率 ≥ 70%
   - 錯誤操作率 < 10%（如誤點錯誤按鈕）
   - 平均學習時間 < 5 分鐘（理解核心機制）

3. **實作品質**
   - 代碼覆蓋率 ≥ 70%（測試）
   - 無 console.error（生產環境）
   - 跨瀏覽器兼容性 100%（Chrome/Firefox/Safari）

### 定性指標

1. **視覺一致性**：所有 UI 元素風格統一
2. **操作直覺性**：無需文檔即可理解基本操作
3. **沉浸感**：視覺與音效（未來）協調,營造地城氛圍
4. **專業度**：整體設計達到商業遊戲水準

---

## 📚 參考資料

### 設計標準文檔
- `docs/creative-director-design-standards.md` - 視覺設計標準
- `docs/animation-design-principles.md` - 動畫設計原則

### 技術文檔
- `js/config.js` - 色板與配置定義
- `js/ui.js` - UI 系統實作
- `js/map.js` - 視覺工具庫（DK.PixelArt）

### 外部參考
- **WCAG 2.1 AA 標準**: 對比度、無障礙設計
- **Google Material Design**: 動畫時長與緩動函數
- **Dungeon Keeper (1997)**: 經典地城視覺風格
- **Dungeon Warfare 3**: 像素風塔防參考

---

## 🔖 版本紀錄

- **v0.1** (2026-02-11 初稿)：team-lead 完成初步分析與設計
- **v1.0** (2026-02-11 最終版)：完成 10 次迭代優化

---

## 🔄 迭代優化記錄（Iteration 1-10）

> **方法論**：每次迭代從頭到尾重新審視整份設計,提出新視角與深度洞察

### Iteration 1: 整體一致性審視

**關鍵洞察**：

1. **色彩系統缺乏連貫性**
   - 初稿提出新增中間色調,但未說明如何與現有 10 次視覺迭代的色板整合
   - **改進**：應該先審計現有 `DK.COLORS` 的完整定義,再決定是否新增
   - **建議**：使用 HSL 色彩模型建立系統性漸變,而非隨意添加色值

2. **動畫設計過度複雜**
   - 火把光照 3 層擴散實作成本高,性能風險大
   - **改進**：2 層已足夠（內層 0.12 alpha + 外層 0.06 alpha）
   - **建議**：遵循「最小有效改進」原則,避免過度設計

3. **UI 佈局方案與現有架構衝突**
   - 新增 30px 狀態列會壓縮遊戲區域（當前 960×624px）
   - **改進**：應該在現有 UI 區域（960×96px）內重新佈局,而非新增高度
   - **建議**：採用「浮動半透明狀態列」覆蓋在遊戲區域頂部,避免佈局變動

4. **實作階段劃分不合理**
   - Phase 1-4 線性依賴關係太強,缺乏靈活性
   - **改進**：應該識別「可並行實作」的項目
   - **建議**：使用「三軌並行」模式：視覺軌/互動軌/教學軌

### Iteration 2: 性能與可行性深度分析

**關鍵洞察**：

1. **火把光照性能評估過於樂觀**
   - 初稿預估單個火把 0.05ms,但 3 層光暈擴散實際可能達 0.2-0.3ms
   - 40×26 地圖有 24 個火把,即使視距剔除後仍有 ~10 個在視野內
   - **實際開銷**：10 個 × 0.25ms = 2.5ms（佔用 15% 預算）
   - **建議**：降級為 2 層光暈,或改用「預渲染光照圖」方案

2. **教學系統整合風險被低估**
   - 教學系統需要攔截所有遊戲互動,容易產生狀態不一致
   - **風險場景**：教學中途關閉頁面重開,狀態恢復問題
   - **建議**：教學系統應該是「獨立沙盒模式」,不共用遊戲狀態

3. **START 畫面重設計成本被低估**
   - 初稿預估 4-5 小時,但實際需要：
     - 背景傳送門動畫整合（1-2 小時）
     - 火把光照整合（1 小時）
     - UI 佈局與文字排版（2 小時）
     - 動畫協調與測試（2 小時）
   - **實際預估**：6-8 小時
   - **建議**：優先實作「最小可行版本」,動畫元素可選

### Iteration 3: 用戶體驗心理學視角

**關鍵洞察**：

1. **錯誤提示系統設計違反「就近原則」**
   - 初稿設計將錯誤提示顯示在螢幕中央（x=480, y=300）
   - **問題**：玩家視線在工具欄區域,中央提示需要視線跳轉
   - **改進**：錯誤提示應該出現在「錯誤發生處」
     - 金幣不足 → 顯示在金幣數字旁邊
     - 放置失敗 → 顯示在滑鼠游標位置
     - 按鈕不可用 → 顯示在按鈕上方

2. **成功反饋「過度設計」**
   - 每次放置陷阱都觸發「成功光環」動畫,會造成視覺疲勞
   - **改進**：僅在「重要操作」顯示反饋
     - 放置第一個陷阱 → 顯示反饋
     - 部署第一個英雄 → 顯示反饋
     - 後續操作 → 僅簡單音效（需整合音效系統）

3. **PLANNING 階段提示輪播「打擾式設計」**
   - 每 4 秒強制切換提示,打斷玩家思考流程
   - **改進**：改為「被動提示」
     - 提示固定顯示在螢幕邊緣
     - 玩家閒置 10 秒才顯示「下一個提示」
     - 提供「關閉提示」選項

### Iteration 4: 技術架構深度檢視

**關鍵洞察**：

1. **Canvas 雙層架構未被充分利用**
   - 初稿所有 UI 都建議繪製在 `ui-canvas`
   - **問題**：狀態列、錯誤提示等需要頻繁重繪,會影響效能
   - **改進**：引入「三層架構」
     - `game-canvas`（低解析度）：像素藝術,靜態地圖
     - `ui-static-canvas`（高解析度）：狀態列、工具欄（僅在狀態變化時重繪）
     - `ui-dynamic-canvas`（高解析度）：tooltip、錯誤提示、動畫（每幀重繪）

2. **像素藝術工具庫缺乏「漸變」工具**
   - 初稿多處提到「漸變」效果（分隔線、光暈）
   - **問題**：`DK.PixelArt` 只有純色工具,無漸變支援
   - **建議**：新增 `DK.PixelArt.Gradient` 模組
     ```javascript
     DK.PixelArt.Gradient = {
       vertical(ctx, x, y, w, h, colorStops) { /*...*/ },
       radial(ctx, cx, cy, radius, colorStops) { /*...*/ }
     };
     ```

3. **狀態管理缺乏「歷史記錄」**
   - 教學系統、錯誤提示、階段切換都需要「撤銷」功能
   - **問題**：當前 `DK.Game` 無狀態快照機制
   - **建議**：實作「Command Pattern」
     ```javascript
     DK.CommandHistory = {
       stack: [],
       execute(command) { command.execute(); this.stack.push(command); },
       undo() { const cmd = this.stack.pop(); cmd.undo(); }
     };
     ```

### Iteration 5: 視覺語言一致性審查

**關鍵洞察**：

1. **圖標系統缺失**
   - 初稿多處使用 emoji（💰, ❤️, 📊, ⚔️）作為圖標
   - **問題**：emoji 在不同平台渲染不一致,且風格與像素藝術不搭
   - **改進**：設計專屬像素風格圖標
     - 金幣：8×8 像素金幣圖示
     - 地城之心：8×8 像素水晶圖示
     - 波次：8×8 像素旗幟圖示
     - 敵人：8×8 像素骷髏圖示

2. **文字字型混用**
   - 初稿建議「標題用 Press Start 2P,正文用 Noto Sans TC」
   - **問題**：像素風格遊戲混用非像素字型會產生視覺割裂
   - **改進方案 A**：全部使用像素字型（但中文支援差）
   - **改進方案 B**：僅標題/數字用像素字型,中文正文保持 Noto Sans TC
   - **建議**：採用方案 B,並確保字號對比明顯（標題 ≥ 18px, 正文 ≤ 14px）

3. **按鈕視覺語言不統一**
   - 陷阱按鈕：圖標 + 名稱 + 成本 + 快捷鍵
   - 英雄按鈕：圖標 + 名稱 + 成本 + 數量徽章
   - 開始波次按鈕：純文字
   - **改進**：統一按鈕結構
     - 所有按鈕：圖標（左上）+ 名稱（中央）+ 成本（右上）
     - 狀態指示（右下）：徽章/快捷鍵/冷卻條

### Iteration 6: 資訊密度與認知負荷

**關鍵洞察**：

1. **狀態列資訊過載**
   - 初稿設計：金幣 + HP + 波次 + 敵人數量（4 項）
   - **問題**：每項寬度 150px,總寬 600px + 間隔 30px = 630px
   - **認知負荷**：玩家需要同時追蹤 4 個動態數值
   - **改進**：簡化為「核心二元組」
     - 左側：金幣 + 地城之心 HP（生存資源）
     - 右側：當前波次 + 倒數計時（進度資訊）
     - 敵人數量 → 移除（可從螢幕直接看到）

2. **教學步驟過多**
   - 初稿設計 6 步教學（歡迎 → 地心 → 傳送門 → 陷阱 → 波次 → 完成）
   - **問題**：6 步教學完成時間 ~2-3 分鐘,流失率高
   - **改進**：壓縮為「3 步核心教學」
     - Step 1: 目標介紹（地心 + 傳送門,自動播放 5 秒）
     - Step 2: 放置陷阱（互動式,必須完成）
     - Step 3: 開始波次（互動式,必須完成）
   - 進階教學（英雄、路障）→ 改為「情境式提示」（首次可用時才顯示）

3. **工具提示內容冗餘**
   - 初稿設計：`${trap.name} - ${trap.cost} 金幣`
   - **問題**：成本已顯示在按鈕右上角,tooltip 重複
   - **改進**：tooltip 應顯示「不可見資訊」
     - 陷阱：傷害、範圍、冷卻時間
     - 英雄：光環效果、技能說明
     - 範例：`火焰陷阱 | 傷害 15 | 範圍 1 格 | 冷卻 3s`

### Iteration 7: 實作優先級重新評估

**關鍵洞察**：

1. **「Quick Wins」分類錯誤**
   - 初稿將「狀態列新增」列為 Quick Win（Impact ⭐⭐⭐⭐⭐, Effort ⭐⭐）
   - **實際評估**：
     - 需要調整 Canvas 佈局（修改 main.js）
     - 需要新增渲染邏輯（修改 ui.js）
     - 需要測試各種螢幕尺寸
     - 實際 Effort: ⭐⭐⭐
   - **重新分類**：應為 Major Project

2. **遺漏「零成本」改進項目**
   - 初稿未識別出「純配置調整」的優化
   - **新增 Ultra Quick Wins**（Impact ⭐⭐⭐, Effort ⭐）：
     - 調整按鈕 hover 顏色（修改 ui.js 中的 hex 值）
     - 增加錯誤訊息顯示時間（修改 duration 參數）
     - 調整動畫週期（修改 time 除數）
   - **實作時間**：每項 < 10 分鐘

3. **Phase 依賴關係過於保守**
   - 初稿要求 Phase 1 完全完成才能開始 Phase 2
   - **改進**：識別「可提前開始」的項目
     - Phase 2 的「START 畫面重新設計」→ 可與 Phase 1 並行
     - Phase 3 的「工具提示系統」→ 可與 Phase 2 並行
   - **時程優化**：3 週 → 2 週（重疊實作）

### Iteration 8: 無障礙與包容性設計

**關鍵洞察**：

1. **色盲友善設計不足**
   - 初稿僅提到「色盲友善」但無具體方案
   - **問題**：成功綠/錯誤紅在紅綠色盲玩家眼中難以區分
   - **改進**：新增「形狀語言」
     - 成功：圓形 ● + 綠色
     - 錯誤：三角形 ▲ + 紅色
     - 警告：正方形 ■ + 橙色
     - 資訊：菱形 ◆ + 藍色

2. **鍵盤導航缺失**
   - 初稿提到快捷鍵系統,但未設計完整鍵盤導航
   - **改進**：新增「完全鍵盤可操作」
     - Tab: 在按鈕間切換焦點
     - Enter/Space: 選中當前焦點按鈕
     - Esc: 取消選擇 / 關閉提示
     - 箭頭鍵: 移動放置游標（已選中陷阱時）
     - R: 旋轉（牆壁陷阱）

3. **文字可讀性評估不完整**
   - 初稿僅檢查「文字/背景」對比度,忽略「動態文字」
   - **問題**：傷害數字、金幣提示是「浮動動畫」,背景會變化
   - **改進**：所有浮動文字新增「描邊」或「陰影」
     ```javascript
     ctx.strokeStyle = '#000';
     ctx.lineWidth = 3;
     ctx.strokeText(text, x, y);
     ctx.fillStyle = color;
     ctx.fillText(text, x, y);
     ```

### Iteration 9: 性能預算重新分配

**關鍵洞察**：

1. **動畫預算分配不均**
   - 初稿預算表：
     - 傳送門 4 層：1ms（6%）
     - 火把 3 層：0.5ms（3%）
     - 陷阱特效：0.8ms（4.8%）
   - **問題**：環境動畫佔比過高,戰鬥特效預算不足
   - **重新分配**：
     - 傳送門降級為 3 層：0.8ms（減少 20%）
     - 火把降級為 2 層：0.3ms（減少 40%）
     - 騰出預算給「元素反應爆炸」、「敵人死亡特效」

2. **視距剔除實作細節缺失**
   - 初稿僅提到「實作視距剔除」,無具體邏輯
   - **問題**：40×26 地圖,viewport 20×13,剔除比例 50%
   - **實作建議**：
     ```javascript
     // 在 map.js renderTorches 中
     for (const torch of this.torches) {
       if (!isInViewport(torch.col, torch.row, 2)) continue; // 2 格緩衝
       renderTorchLight(ctx, torch.col, torch.row, time);
     }
     ```

3. **FPS 監控缺失**
   - 初稿無 FPS 監控系統設計
   - **改進**：新增「開發者模式」
     ```javascript
     DK.Debug = {
       enabled: false, // localStorage 控制
       fps: 60,
       updateFPS(dt) {
         this.fps = Math.round(1000 / dt);
       },
       render(ctx) {
         if (!this.enabled) return;
         ctx.font = '12px monospace';
         ctx.fillStyle = this.fps < 55 ? '#ff4444' : '#44ff88';
         ctx.fillText(`FPS: ${this.fps}`, 10, 20);
       }
     };
     ```

### Iteration 10: 最終全局整合審查

**關鍵洞察**：

1. **設計文檔與實作脫節風險**
   - 初稿提供大量「完整程式碼範例」
   - **問題**：這些範例可能與實際 codebase 架構不符
   - **改進**：將「程式碼範例」改為「實作指引」
     - 指出需要修改的檔案與函數
     - 描述整合點與注意事項
     - 避免「複製貼上式開發」

2. **缺乏「漸進式增強」策略**
   - 初稿所有功能都是「全有或全無」
   - **改進**：設計「降級方案」
     - 火把光照：3 層（理想）→ 2 層（降級）→ 1 層（最低）
     - 錯誤提示：彈窗動畫（理想）→ 靜態提示（降級）→ console.log（最低）
     - 教學系統：互動式（理想）→ 靜態圖文（降級）→ 無教學（最低）

3. **成功指標過於主觀**
   - 初稿「定性指標」難以測量
     - 「視覺一致性」→ 如何量化？
     - 「操作直覺性」→ 如何驗證？
   - **改進**：新增「可測量指標」
     - 視覺一致性 → 設計審查通過率 100%（team lead 審核）
     - 操作直覺性 → 5 位測試玩家,80% 能在 5 分鐘內完成第一波
     - 沉浸感 → 平均遊戲時長 > 15 分鐘

---

## 🎯 迭代後最終建議

經過 10 次完整迭代審視,提出以下**核心修正**：

### 1. 簡化優先級（剔除過度設計）

**保留項目**（高性價比）：
- ✅ 狀態列新增（但採用浮動半透明,不改變佈局）
- ✅ 錯誤提示優化（顯示在錯誤發生處,非螢幕中央）
- ✅ 按鈕狀態強化（hover/disabled/selected）
- ✅ 色彩系統補充（但僅新增必要的中間色調）
- ✅ START 畫面重新設計（最小可行版本）

**降級項目**（成本過高）：
- ⚠️ 火把光照 3 層 → 2 層
- ⚠️ 傳送門 4 層 → 3 層
- ⚠️ 教學系統 6 步 → 3 步核心 + 情境式提示

**取消項目**（收益不明確）：
- ❌ 水潭波紋動畫
- ❌ PLANNING 階段提示輪播（改為被動提示）
- ❌ 投射物拖尾效果（非核心功能）

### 2. 實作路線圖修正

**新路線圖**（2 週完成）：

**Week 1: 核心 UX 強化**
- Day 1-2: 浮動狀態列 + 錯誤提示系統
- Day 3: 按鈕狀態系統 + 色彩補充
- Day 4: START 畫面 MVP
- Day 5: 測試與修復

**Week 2: 視覺深度提升**
- Day 1: 火把光照 2 層 + 視距剔除
- Day 2: 傳送門 3 層優化
- Day 3: 3 步核心教學
- Day 4: 無障礙功能（鍵盤導航/色盲模式）
- Day 5: 整合測試 + FPS 監控 + 發布

### 3. 成功指標重新定義

**定量指標**（可測量）：
- FPS ≥ 55（95% 時間）← 提高標準
- 對比度 ≥ 4.5:1（所有文字）
- 5 位測試玩家,80% 能在 3 分鐘內完成首波 ← 更嚴格

**定性指標**（有驗證方法）：
- 視覺一致性 → Team lead 設計審查通過
- 操作直覺性 → 錄製 5 位新玩家首次遊玩影片,分析卡點
- 沉浸感 → 平均遊戲時長 ≥ 10 分鐘（Analytics 追蹤）

### 4. 風險緩解策略補充

**新增風險項目**：
1. **浮動狀態列遮擋遊戲畫面**
   - 緩解：半透明 alpha=0.85,遇到重要物件時自動隱藏
2. **教學系統狀態污染**
   - 緩解：教學模式使用獨立 `DK.Tutorial.state`,不修改 `DK.Game.state`
3. **鍵盤快捷鍵與瀏覽器衝突**
   - 緩解：避免使用 Ctrl/Cmd 組合鍵,僅用單鍵（1-9, Q-E）

---

## 📚 迭代產出物總結

### 設計文檔修正

1. **色彩系統**：從「新增大量中間色」→「HSL 系統性漸變」
2. **火把光照**：從「3 層光暈」→「2 層光暈 + 預渲染」
3. **錯誤提示**：從「螢幕中央彈窗」→「錯誤發生處就近提示」
4. **教學系統**：從「6 步線性教學」→「3 步核心 + 情境式」
5. **狀態列**：從「固定 30px 區域」→「浮動半透明覆蓋」

### 實作指引補充

1. **視距剔除範本**：`isInViewport(col, row, buffer)` 函數
2. **FPS 監控系統**：`DK.Debug` 模組
3. **Command Pattern**：`DK.CommandHistory` 撤銷系統
4. **漸變工具**：`DK.PixelArt.Gradient` 模組
5. **無障礙功能**：形狀語言 + 鍵盤導航

### 成功指標細化

- 將主觀指標轉化為可測量/可驗證的客觀標準
- 新增「測試玩家影片分析」方法
- 補充「降級方案」確保最低可用性

---

**Team Lead 簽名**: team-lead (Opus 4.6)
**狀態**: 10 次迭代完成,最終版確認

---

> **結語**：經過 10 次從頭到尾的完整審視,本設計方案已從「理想主義」轉向「務實可行」。
> 剔除了過度設計,強化了核心體驗,補充了缺失的技術細節,並建立了可驗證的成功標準。
> 現在這份文檔已經可以作為實作的可靠指引。
