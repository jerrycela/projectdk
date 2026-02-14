# Map Objects System - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 8 placeable multi-tile map objects (2x2, 3x3, 4x4) with decoration and destructible types to the dungeon level editor and game.

**Architecture:** New `DK.MAP_OBJECTS` config defines object metadata. `DK.MapObjects` module manages runtime instances (HP, state). Map parser detects anchor tiles on init. Renderer draws objects between decorations and traps. Editor extends NxN placement to all sizes.

**Tech Stack:** Vanilla JS, HTML5 Canvas (low-res 320x208 pixel art), single-char tile encoding system.

---

## Critical Design Notes

### Tile Code Assignment

**The layout system uses SINGLE CHARACTERS per tile.** Each character maps to one grid cell.

Already used: `W . O B H A P G R E M X D I Z T C L S U F`

New assignments (digits, completely unused):

| Code | Object | Size | Type |
|------|--------|------|------|
| `1` | Stone Pillar | 2x2 | decoration |
| `2` | Treasure Chest | 2x2 | decoration |
| `3` | Barrel Stack | 2x2 | destructible |
| `4` | Altar | 3x3 | decoration |
| `5` | Crystal Cluster | 3x3 | decoration |
| `6` | Rune Circle | 3x3 | destructible |
| `7` | Dragon Skeleton | 4x4 | decoration |
| `8` | Sealed Gate | 4x4 | destructible |

### Anchor Detection Rule

For any NxN object, the **anchor** is the top-left tile. Detection: a tile is an anchor if neither the tile above it nor the tile to its left shares the same code.

### Rendering Pipeline Insertion

Objects render at **main.js L289** (after `renderDecorations(2)`, before `DK.Traps.render()`). This places them above floor decorations but below game entities.

### Enemy Interaction Pattern

Follow the existing door/barricade attack pattern in `enemies.js` L250-375:
1. Enemy checks `isBlocked` via distance field
2. Gets `nextStep` from `distanceFieldThrough`
3. Checks if `nextStep` contains a destructible map object
4. Attacks with timer-based damage
5. On destroy: convert tiles, recalculate pathfinding

---

## Task 1: Config — MAP_OBJECTS Definitions

**Files:**
- Modify: `js/config/config-data.js` (append after `DK.WAVES`, ~L210)

**Step 1: Add MAP_OBJECTS config**

Insert at end of `config-data.js`:

```javascript
// Map Object definitions (multi-tile placeable objects)
DK.MAP_OBJECTS = {
  '1': {
    id: 'stone_pillar', name: '石柱', size: 2,
    type: 'decoration', walkable: false,
    colors: { base: '#4a4c54', light: '#6a6c74', dark: '#2a2c32', crack: '#3a3d44' },
  },
  '2': {
    id: 'treasure_chest', name: '寶箱', size: 2,
    type: 'decoration', walkable: false,
    colors: { wood: '#544e46', darkWood: '#3c3630', iron: '#5c5e66', gold: '#c8a832', goldLight: '#e8d060' },
  },
  '3': {
    id: 'barrel_stack', name: '木桶堆', size: 2,
    type: 'destructible', walkable: false, hp: 30,
    onDestroy: { effect: 'obj_explosion', radius: 1.5, damage: 40, friendlyFire: true },
    colors: { wood: '#5a4a3a', light: '#7a6a5a', dark: '#3a2a1a', iron: '#5c5e66' },
  },
  '4': {
    id: 'altar', name: '祭壇', size: 3,
    type: 'decoration', walkable: false,
    colors: { stone: '#4a4c54', stoneDark: '#3a3d44', candle: '#cc8800', rune: '#8844aa' },
  },
  '5': {
    id: 'crystal_cluster', name: '水晶簇', size: 3,
    type: 'decoration', walkable: false,
    colors: { base: '#3366aa', mid: '#4488bb', tip: '#6aaaee', sparkle: '#88ccff', shadow: '#1a3355' },
  },
  '6': {
    id: 'rune_circle', name: '符文陣', size: 3,
    type: 'destructible', walkable: false, hp: 120,
    onDestroy: { effect: 'obj_element_burst', radius: 2.0, damage: 60 },
    colors: { circle: '#6644aa', symbol: '#8866cc', stone: '#4a4c54', glow: '#aa88ee' },
  },
  '7': {
    id: 'dragon_skeleton', name: '龍骨遺骸', size: 4,
    type: 'decoration', walkable: false,
    colors: { bone: '#d0c8b0', boneShadow: '#a09880', ground: '#0a0a14', eye: '#44cc44' },
  },
  '8': {
    id: 'sealed_gate', name: '封印之門', size: 4,
    type: 'destructible', walkable: false, hp: 200,
    walkableOnDestroy: true,
    onDestroy: { effect: 'obj_path_change', convertTo: '.' },
    colors: { door: '#3a3d44', doorLight: '#4a4c54', crack: '#5c5e66', chain: '#6a6c74', seal: '#cc4444', glow: '#ffaa44' },
  },
};
```

**Step 2: Verify syntax**

Run: `node -c js/config/config-data.js`
Expected: no output (syntax OK)

**Step 3: Commit**

```bash
git add js/config/config-data.js
git commit -m "feat: add MAP_OBJECTS config definitions for 8 map objects"
```

---

## Task 2: Map Parser — Anchor Detection + Object Instantiation

**Files:**
- Modify: `js/map/map-core.js`

**Step 1: Add `mapObjects` array to DK.Map state**

In `map-core.js`, after `pathPreviewCache: []` (L161), add:

```javascript
  // 地圖物件實例（運行時狀態）
  mapObjects: [],
```

**Step 2: Add `initMapObjects()` method**

After `initGrassState()` method (~L245), add:

```javascript
  /** 掃描 layout 偵測多格地圖物件，建立運行時實例 */
  initMapObjects() {
    this.mapObjects = [];
    if (!DK.MAP_OBJECTS) return;

    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        const tile = this.layout[r][c];
        const def = DK.MAP_OBJECTS[tile];
        if (!def) continue;

        // 錨點偵測：上方和左方都不是同一代碼
        const above = (r > 0) ? this.layout[r - 1][c] : null;
        const left = (c > 0) ? this.layout[r][c - 1] : null;
        if (above === tile || left === tile) continue;

        // 驗證 NxN 完整性
        let valid = true;
        for (let dr = 0; dr < def.size && valid; dr++) {
          for (let dc = 0; dc < def.size && valid; dc++) {
            if (r + dr >= this.layout.length || c + dc >= this.layout[r].length) {
              valid = false;
            } else if (this.layout[r + dr][c + dc] !== tile) {
              valid = false;
            }
          }
        }
        if (!valid) continue;

        const T = DK.CONFIG.TILE_SIZE;
        this.mapObjects.push({
          typeCode: tile,
          id: def.id,
          name: def.name,
          gridX: c,
          gridY: r,
          size: def.size,
          type: def.type,
          hp: def.hp || null,
          maxHp: def.hp || null,
          destroyed: false,
          flashTimer: 0,
          // 像素中心座標
          centerX: (c + def.size / 2) * T,
          centerY: (r + def.size / 2) * T,
        });
      }
    }
  },
```

**Step 3: Add `isMapObject()` query method**

After `isGrass()` (~L274), add:

```javascript
  /** 檢查某格是否屬於地圖物件 */
  isMapObject(col, row) {
    const tile = this.getTile(col, row);
    return !!(DK.MAP_OBJECTS && DK.MAP_OBJECTS[tile]);
  },

  /** 取得某格所屬的地圖物件實例（若有） */
  getMapObjectAt(col, row) {
    for (const obj of this.mapObjects) {
      if (obj.destroyed) continue;
      if (col >= obj.gridX && col < obj.gridX + obj.size &&
          row >= obj.gridY && row < obj.gridY + obj.size) {
        return obj;
      }
    }
    return null;
  },

  /** 對地圖物件造成傷害，回傳是否被摧毀 */
  damageMapObject(col, row, damage) {
    const obj = this.getMapObjectAt(col, row);
    if (!obj || obj.type !== 'destructible' || obj.destroyed) return false;

    obj.hp -= damage;
    obj.flashTimer = 150;

    if (obj.hp <= 0) {
      obj.hp = 0;
      obj.destroyed = true;
      this._onMapObjectDestroyed(obj);
      return true;
    }
    return false;
  },

  /** 地圖物件被摧毀時的處理 */
  _onMapObjectDestroyed(obj) {
    const def = DK.MAP_OBJECTS[obj.typeCode];
    if (!def || !def.onDestroy) return;

    const T = DK.CONFIG.TILE_SIZE;

    // 觸發摧毀效果
    if (DK.Game && DK.Game.effects) {
      DK.Game.effects.push({
        type: def.onDestroy.effect,
        x: obj.centerX,
        y: obj.centerY,
        radius: (def.onDestroy.radius || 1) * T,
        damage: def.onDestroy.damage || 0,
        friendlyFire: def.onDestroy.friendlyFire || false,
        timer: 0,
        duration: 500,
      });
    }

    // 封印之門特殊處理：改變地磚為可行走
    if (def.walkableOnDestroy) {
      const convertTo = def.onDestroy.convertTo || '.';
      for (let dr = 0; dr < obj.size; dr++) {
        for (let dc = 0; dc < obj.size; dc++) {
          const r = obj.gridY + dr;
          const c = obj.gridX + dc;
          if (r < this.layout.length && c < this.layout[r].length) {
            const chars = this.layout[r].split('');
            chars[c] = convertTo;
            this.layout[r] = chars.join('');
          }
        }
      }
      // 重算路徑
      this.computeDistanceField();
      this.computeDistanceFieldThrough();
      DK.PathCache.invalidate();
      if (this.recomputePathPreview) {
        this.recomputePathPreview();
      }
    }
  },
```

**Step 4: Call `initMapObjects()` in `_initInternal()`**

In `_initInternal()`, after `this.initGrassState();` (L209), add:

```javascript
    this.initMapObjects();
```

**Step 5: Add `updateMapObjects()` for flash timer decay**

```javascript
  /** 更新地圖物件狀態（閃爍計時器等） */
  updateMapObjects(dt) {
    for (const obj of this.mapObjects) {
      if (obj.flashTimer > 0) {
        obj.flashTimer = Math.max(0, obj.flashTimer - dt);
      }
    }
  },
```

**Step 6: Verify syntax**

Run: `node -c js/map/map-core.js`

**Step 7: Commit**

```bash
git add js/map/map-core.js
git commit -m "feat: add map object parser with anchor detection and damage system"
```

---

## Task 3: Pathfinding — Block Object Tiles

**Files:**
- Modify: `js/map/map-pathfinding.js`

**Step 1: Add object tile codes to pathfinding block list**

In `computeDistanceField()` at L57-59, the current walkable check is:
```javascript
if (tile !== '.' && tile !== 'E' && tile !== 'X' && tile !== 'P' && tile !== 'G' && tile !== 'H') continue;
```

This already blocks any tile that isn't in the whitelist. Since object tiles use digits `1`-`8`, they are **automatically blocked** — no code change needed.

**However**, for `computeDistanceFieldThrough()` (穿透距離場), we need destructible objects to be traversable so enemies can plan to attack them. Check the through-field logic and ensure destructible object tiles (`3`, `6`, `8`) are treated as walkable in the through-field.

In `computeDistanceFieldThrough()`, find the walkable check (should be similar pattern) and add destructible object codes:

```javascript
// 原始行（找到類似 computeDistanceField 的 tile 檢查）
// 修改為：可破壞物件在穿透距離場中視為可行走
const isDestructibleObj = DK.MAP_OBJECTS && DK.MAP_OBJECTS[tile] && DK.MAP_OBJECTS[tile].type === 'destructible';
if (tile !== '.' && tile !== 'E' && tile !== 'X' && tile !== 'P' && tile !== 'G' && tile !== 'H' && !isDestructibleObj) continue;
```

**Step 2: Verify syntax**

Run: `node -c js/map/map-pathfinding.js`

**Step 3: Commit**

```bash
git add js/map/map-pathfinding.js
git commit -m "feat: allow destructible objects in through-pathfinding for enemy navigation"
```

---

## Task 4: Rendering — drawMapObject() in pixelart.js

**Files:**
- Create: `js/map/map-tiles-objects.js`

**Why a new file?** Following the existing pattern: `map-tiles-portal.js`, `map-tiles-heart.js`, `map-tiles-special.js`, `map-tiles-basic.js`. Each tile category has its own render file.

**Step 1: Create `map-tiles-objects.js` with all 8 object renderers**

This file attaches render methods to `DK.Map`:

```javascript
/**
 * Dungeon Keep - Map Object Tile Renderers
 * 8 multi-tile map objects (2x2, 3x3, 4x4)
 */

// === 2x2 Objects ===

/** 石柱 (2x2, 32x32px) */
DK.Map.drawStonePillar = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['1'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T; // 2x2 中心 X
  const cy = y + T; // 2x2 中心 Y

  // 底座（寬矩形）
  PA.rect(ctx, cx - 5, cy + 6, 10, 4, ISO.sideDark(c.base));
  PA.rect(ctx, cx - 5, cy + 5, 10, 1, c.base);

  // 柱身
  PA.rect(ctx, cx - 3, cy - 8, 6, 14, c.base);
  // 高光（左側）
  PA.rect(ctx, cx - 3, cy - 8, 1, 14, c.light);
  // 陰影（右側）
  PA.rect(ctx, cx + 2, cy - 8, 1, 14, c.dark);

  // 裂紋（2-3 條斜線）
  PA.pixel(ctx, cx - 1, cy - 3, c.crack);
  PA.pixel(ctx, cx, cy - 2, c.crack);
  PA.pixel(ctx, cx + 1, cy - 1, c.crack);
  PA.pixel(ctx, cx - 2, cy + 2, c.crack);
  PA.pixel(ctx, cx - 1, cy + 3, c.crack);

  // 頂部（稍寬）
  PA.rect(ctx, cx - 4, cy - 10, 8, 2, ISO.topLight(c.base));
};

/** 寶箱 (2x2, 32x32px) */
DK.Map.drawTreasureChest = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['2'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T;
  const cy = y + T;

  // 箱體（木質）
  PA.rect(ctx, cx - 6, cy - 2, 12, 8, c.wood);
  PA.rect(ctx, cx - 6, cy - 2, 12, 1, ISO.topLight(c.wood));
  PA.rect(ctx, cx - 6, cy + 5, 12, 1, c.darkWood);

  // 箱蓋（微開）
  PA.rect(ctx, cx - 6, cy - 5, 12, 3, ISO.topLight(c.wood));
  PA.rect(ctx, cx - 6, cy - 5, 1, 3, c.darkWood);
  PA.rect(ctx, cx + 5, cy - 5, 1, 3, c.darkWood);

  // 鐵邊框
  PA.rect(ctx, cx - 6, cy - 2, 12, 1, c.iron);
  PA.pixel(ctx, cx - 6, cy + 1, c.iron);
  PA.pixel(ctx, cx + 5, cy + 1, c.iron);

  // 金光（箱蓋縫隙）
  PA.pixel(ctx, cx - 2, cy - 3, c.gold);
  PA.pixel(ctx, cx - 1, cy - 3, c.goldLight);
  PA.pixel(ctx, cx, cy - 3, c.gold);
  PA.pixel(ctx, cx + 1, cy - 3, c.goldLight);

  // 鎖頭
  PA.pixel(ctx, cx, cy - 1, c.iron);
  PA.pixel(ctx, cx, cy, c.gold);
};

/** 木桶堆 (2x2, 32x32px, destructible) */
DK.Map.drawBarrelStack = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['3'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T;
  const cy = y + T;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    PA.rect(ctx, x, y, T * 2, T * 2, '#ffffff');
    ctx.restore();
  }

  // 下層 2 桶
  // 左桶
  PA.rect(ctx, cx - 7, cy - 1, 6, 8, c.wood);
  PA.rect(ctx, cx - 7, cy + 1, 6, 1, c.iron); // 鐵環
  PA.rect(ctx, cx - 7, cy + 4, 6, 1, c.iron);
  PA.rect(ctx, cx - 7, cy - 1, 1, 8, c.dark); // 陰影
  PA.rect(ctx, cx - 2, cy - 1, 1, 8, c.light); // 高光

  // 右桶
  PA.rect(ctx, cx + 1, cy - 1, 6, 8, c.wood);
  PA.rect(ctx, cx + 1, cy + 1, 6, 1, c.iron);
  PA.rect(ctx, cx + 1, cy + 4, 6, 1, c.iron);
  PA.rect(ctx, cx + 1, cy - 1, 1, 8, c.dark);
  PA.rect(ctx, cx + 6, cy - 1, 1, 8, c.light);

  // 上層 1 桶（堆疊）
  PA.rect(ctx, cx - 3, cy - 8, 6, 7, c.wood);
  PA.rect(ctx, cx - 3, cy - 6, 6, 1, c.iron);
  PA.rect(ctx, cx - 3, cy - 3, 6, 1, c.iron);
  PA.rect(ctx, cx - 3, cy - 8, 1, 7, c.dark);
  PA.rect(ctx, cx + 2, cy - 8, 1, 7, c.light);

  // HP 指示條（僅剩餘 HP < maxHP 時顯示）
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = T * 2 - 4;
    const hpRatio = obj.hp / obj.maxHp;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }
};

// === 3x3 Objects ===

/** 祭壇 (3x3, 48x48px) */
DK.Map.drawAltar = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['4'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 1.5; // 3x3 中心
  const cy = y + T * 1.5;

  // 石台基座（3 層等距）
  PA.rect(ctx, cx - 10, cy + 6, 20, 5, ISO.sideDark(c.stone));
  PA.rect(ctx, cx - 8, cy + 2, 16, 4, c.stone);
  PA.rect(ctx, cx - 6, cy - 1, 12, 3, ISO.topLight(c.stone));

  // 兩側燭台
  // 左燭台
  PA.rect(ctx, cx - 9, cy - 6, 2, 5, c.stoneDark);
  PA.pixel(ctx, cx - 9, cy - 7, c.candle);
  PA.pixel(ctx, cx - 8, cy - 7, c.candle);
  PA.pixel(ctx, cx - 9, cy - 8, '#ffcc44'); // 火焰

  // 右燭台
  PA.rect(ctx, cx + 7, cy - 6, 2, 5, c.stoneDark);
  PA.pixel(ctx, cx + 7, cy - 7, c.candle);
  PA.pixel(ctx, cx + 8, cy - 7, c.candle);
  PA.pixel(ctx, cx + 7, cy - 8, '#ffcc44');

  // 符文脈動（呼吸動畫）
  const pulseAlpha = 0.3 + 0.4 * Math.sin((time || 0) * 0.002);
  ctx.save();
  ctx.globalAlpha = pulseAlpha;
  PA.pixel(ctx, cx - 2, cy - 1, c.rune);
  PA.pixel(ctx, cx, cy - 1, c.rune);
  PA.pixel(ctx, cx + 2, cy - 1, c.rune);
  PA.pixel(ctx, cx - 1, cy, c.rune);
  PA.pixel(ctx, cx + 1, cy, c.rune);
  ctx.restore();
};

/** 水晶簇 (3x3, 48x48px) */
DK.Map.drawCrystalCluster = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['5'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 1.5;
  const cy = y + T * 1.5;

  // 底部陰影
  PA.rect(ctx, cx - 8, cy + 6, 16, 3, c.shadow);

  // 7 根水晶（不同高度和角度）
  const crystals = [
    { dx: -6, h: 12, w: 3 },
    { dx: -3, h: 18, w: 3 },
    { dx: 0, h: 22, w: 4 },  // 最高的中央水晶
    { dx: 4, h: 16, w: 3 },
    { dx: 7, h: 10, w: 2 },
    { dx: -8, h: 8, w: 2 },
    { dx: 9, h: 7, w: 2 },
  ];

  for (const cr of crystals) {
    const bx = cx + cr.dx;
    const by = cy + 6 - cr.h;
    // 漸層：base → mid → tip
    const bodyH = Math.floor(cr.h * 0.6);
    const tipH = cr.h - bodyH;
    PA.rect(ctx, bx, by + tipH, cr.w, bodyH, c.base);
    PA.rect(ctx, bx, by, cr.w, tipH, c.mid);
    PA.pixel(ctx, bx + Math.floor(cr.w / 2), by, c.tip); // 尖端
  }

  // 閃爍（隨機像素每 500ms）
  if (time) {
    const sparklePhase = Math.floor(time / 500) % 7;
    const sp = crystals[sparklePhase];
    PA.pixel(ctx, cx + sp.dx + 1, cy + 6 - sp.h + 2, c.sparkle);
  }
};

/** 符文陣 (3x3, 48x48px, destructible) */
DK.Map.drawRuneCircle = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['6'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 1.5;
  const cy = y + T * 1.5;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    PA.rect(ctx, x, y, T * 3, T * 3, '#ff4444');
    ctx.restore();
  }

  // 四角符文石
  const corners = [
    { dx: -10, dy: -10 }, { dx: 8, dy: -10 },
    { dx: -10, dy: 8 }, { dx: 8, dy: 8 },
  ];
  for (const cn of corners) {
    PA.rect(ctx, cx + cn.dx, cy + cn.dy, 3, 3, c.stone);
  }

  // 圓形魔法陣（用像素圓）
  PA.circle(ctx, cx, cy, 9, c.circle);

  // 中心十字符文
  PA.rect(ctx, cx - 3, cy, 7, 1, c.symbol);
  PA.rect(ctx, cx, cy - 3, 1, 7, c.symbol);

  // 旋轉光效（4 個光點繞圓）
  const rotAngle = (time || 0) * 0.001;
  const glowAlpha = 0.4 + 0.3 * Math.sin((time || 0) * 0.003);
  ctx.save();
  ctx.globalAlpha = glowAlpha;
  for (let i = 0; i < 4; i++) {
    const a = rotAngle + (i * Math.PI / 2);
    const gx = Math.round(cx + Math.cos(a) * 7);
    const gy = Math.round(cy + Math.sin(a) * 7);
    PA.pixel(ctx, gx, gy, c.glow);
    PA.pixel(ctx, gx + 1, gy, c.glow);
  }
  ctx.restore();

  // HP bar
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = T * 3 - 4;
    const hpRatio = obj.hp / obj.maxHp;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }
};

// === 4x4 Objects ===

/** 龍骨遺骸 (4x4, 64x64px) */
DK.Map.drawDragonSkeleton = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['7'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 2; // 4x4 中心
  const cy = y + T * 2;

  // 地面暗底
  PA.rect(ctx, x + 2, y + 2, T * 4 - 4, T * 4 - 4, c.ground);

  // 脊椎骨（中央橫線）
  PA.rect(ctx, cx - 14, cy + 2, 28, 2, c.boneShadow);
  PA.rect(ctx, cx - 14, cy, 28, 2, c.bone);

  // 肋骨（5 對）
  for (let i = 0; i < 5; i++) {
    const rx = cx - 10 + i * 5;
    // 上肋
    PA.rect(ctx, rx, cy - 8, 2, 8, c.bone);
    PA.pixel(ctx, rx - 1, cy - 8, c.bone);
    // 下肋
    PA.rect(ctx, rx, cy + 4, 2, 6, c.boneShadow);
    PA.pixel(ctx, rx + 2, cy + 9, c.boneShadow);
  }

  // 頭骨（左上角）
  PA.rect(ctx, x + 4, y + 6, 8, 7, c.bone);
  PA.rect(ctx, x + 3, y + 8, 1, 3, c.bone); // 下顎
  PA.rect(ctx, x + 12, y + 8, 2, 2, c.bone); // 鼻
  // 眼窩
  PA.pixel(ctx, x + 6, y + 8, c.ground);
  PA.pixel(ctx, x + 9, y + 8, c.ground);

  // 眼窩閃爍（10% 機率每 2 秒）
  if (time && Math.floor(time / 2000) % 10 === 0) {
    const flicker = Math.sin(time * 0.01) > 0.5;
    if (flicker) {
      PA.pixel(ctx, x + 6, y + 8, c.eye);
      PA.pixel(ctx, x + 9, y + 8, c.eye);
    }
  }

  // 尾骨（右下延伸）
  PA.rect(ctx, cx + 14, cy + 1, 6, 2, c.boneShadow);
  PA.rect(ctx, cx + 19, cy + 3, 4, 1, c.boneShadow);
  PA.pixel(ctx, cx + 22, cy + 4, c.boneShadow);
};

/** 封印之門 (4x4, 64x64px, destructible) */
DK.Map.drawSealedGate = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['8'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 2;
  const cy = y + T * 2;
  const hpRatio = (obj && obj.maxHp) ? obj.hp / obj.maxHp : 1;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    PA.rect(ctx, x, y, T * 4, T * 4, '#ffffff');
    ctx.restore();
  }

  // 石門框
  PA.rect(ctx, x + 2, y + 2, T * 4 - 4, T * 4 - 4, c.door);
  PA.rect(ctx, x + 4, y + 4, T * 4 - 8, T * 4 - 8, c.doorLight);

  // 門板（中央大矩形）
  PA.rect(ctx, cx - 10, cy - 12, 20, 26, c.door);

  // 鏈條（四角）
  const chains = [
    { dx: -12, dy: -12 }, { dx: 10, dy: -12 },
    { dx: -12, dy: 10 }, { dx: 10, dy: 10 },
  ];
  for (const ch of chains) {
    // 鏈條斷裂視覺（HP < 50% 時鏈條消失）
    if (hpRatio > 0.5) {
      PA.rect(ctx, cx + ch.dx, cy + ch.dy, 3, 3, c.chain);
      PA.pixel(ctx, cx + ch.dx + 1, cy + ch.dy + 1, c.doorLight);
    }
  }

  // 中央封印符文
  if (hpRatio > 0.25) {
    const sealAlpha = 0.5 + 0.3 * Math.sin((time || 0) * 0.002);
    ctx.save();
    ctx.globalAlpha = sealAlpha;
    PA.rect(ctx, cx - 3, cy - 3, 6, 6, c.seal);
    PA.rect(ctx, cx - 1, cy - 5, 2, 10, c.seal);
    PA.rect(ctx, cx - 5, cy - 1, 10, 2, c.seal);
    ctx.restore();
  }

  // 裂縫（HP < 50% 時出現，越來越寬）
  if (hpRatio < 0.5) {
    const crackWidth = hpRatio < 0.25 ? 3 : 1;
    PA.rect(ctx, cx - 1, cy - 10, crackWidth, 22, c.crack);

    // 裂縫發光
    const glowAlpha = (1 - hpRatio) * 0.5;
    ctx.save();
    ctx.globalAlpha = glowAlpha;
    PA.rect(ctx, cx - 2, cy - 8, crackWidth + 2, 18, c.glow);
    ctx.restore();
  }

  // HP bar
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = T * 4 - 4;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }
};

/** 統一渲染入口：根據 typeCode 分派到對應渲染函式 */
DK.Map.renderMapObjects = function(ctx, time) {
  const T = DK.CONFIG.TILE_SIZE;

  for (const obj of this.mapObjects) {
    if (obj.destroyed) continue;

    const x = obj.gridX * T;
    const y = obj.gridY * T;

    switch (obj.typeCode) {
      case '1': this.drawStonePillar(ctx, x, y, time); break;
      case '2': this.drawTreasureChest(ctx, x, y, time); break;
      case '3': this.drawBarrelStack(ctx, x, y, time, obj); break;
      case '4': this.drawAltar(ctx, x, y, time); break;
      case '5': this.drawCrystalCluster(ctx, x, y, time); break;
      case '6': this.drawRuneCircle(ctx, x, y, time, obj); break;
      case '7': this.drawDragonSkeleton(ctx, x, y, time); break;
      case '8': this.drawSealedGate(ctx, x, y, time, obj); break;
    }
  }
};
```

**Step 2: Add script tag to index.html**

Find the map script section and add after `map-tiles-special.js`:
```html
<script src="js/map/map-tiles-objects.js"></script>
```

**Step 3: Verify syntax**

Run: `node -c js/map/map-tiles-objects.js`

**Step 4: Commit**

```bash
git add js/map/map-tiles-objects.js index.html
git commit -m "feat: add pixel art renderers for all 8 map objects"
```

---

## Task 5: Game Integration — Render + Update in Main Loop

**Files:**
- Modify: `js/main.js` (~L289)
- Modify: `js/game.js` (~L308)

**Step 1: Add render call in main.js**

At `main.js` L289, after `renderDecorations(2);`, add:

```javascript
    // Map objects (between decorations and traps)
    if (DK.Map.renderMapObjects) {
      DK.Map.renderMapObjects(offCtx, DK.Game.time);
    }
```

**Step 2: Add update call in game.js**

At `game.js`, after the grass update block (~L310), add:

```javascript
    // Update map objects (flash timers etc.)
    if (DK.Map.updateMapObjects) {
      DK.Map.updateMapObjects(dt);
    }
```

**Step 3: Verify syntax**

Run: `node -c js/main.js && node -c js/game.js`

**Step 4: Commit**

```bash
git add js/main.js js/game.js
git commit -m "feat: integrate map object render and update into game loop"
```

---

## Task 6: Destroy Effects — Explosion, Element Burst, Debris

**Files:**
- Modify: `js/main-effects.js`

**Step 1: Add 3 new effect types to the switch case**

In `main-effects.js`, after the `door_shatter` case block (~L42-60), add:

```javascript
        case 'obj_explosion': this._objExplosion(ctx, PA, effect, progress); break;
        case 'obj_element_burst': this._objElementBurst(ctx, PA, effect, progress); break;
        case 'obj_path_change': this._objPathChange(ctx, PA, effect, progress); break;
```

**Step 2: Implement `_objExplosion` (barrel stack)**

At the bottom of the `DK.EffectRenderer` object, add:

```javascript
  /** 木桶堆爆炸（橘紅火焰 + 碎片） */
  _objExplosion(ctx, PA, effect, progress) {
    if (progress > 1) return;
    const cx = effect.x;
    const cy = effect.y;
    const maxR = effect.radius || 24;

    // Phase 1: 白色閃光 (0-15%)
    if (progress < 0.15) {
      const flashR = maxR * (progress / 0.15) * 0.5;
      ctx.save();
      ctx.globalAlpha = 1 - (progress / 0.15);
      PA.circle(ctx, cx, cy, flashR, '#ffffff');
      ctx.restore();
    }

    // Phase 2: 火焰環 (10-60%)
    if (progress > 0.1 && progress < 0.6) {
      const ringProgress = (progress - 0.1) / 0.5;
      const ringR = maxR * ringProgress;
      const alpha = 1 - ringProgress;
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const px = Math.round(cx + Math.cos(angle) * ringR);
        const py = Math.round(cy + Math.sin(angle) * ringR);
        PA.pixel(ctx, px, py, '#ff5500');
        PA.pixel(ctx, px + 1, py, '#ff8800');
      }
      ctx.restore();
    }

    // Phase 3: 碎片飛散 (5-100%)
    if (progress > 0.05) {
      const fragProgress = (progress - 0.05) / 0.95;
      const alpha = 1 - fragProgress;
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + 0.5;
        const dist = maxR * 0.3 + maxR * 0.7 * fragProgress;
        const fx = Math.round(cx + Math.cos(angle) * dist);
        const fy = Math.round(cy + Math.sin(angle) * dist - 4 * (1 - fragProgress));
        PA.pixel(ctx, fx, fy, i % 2 === 0 ? '#5a4a3a' : '#3a2a1a');
      }
      ctx.restore();
    }

    // 爆炸傷害邏輯（僅在首幀觸發）
    if (effect.timer < 16 && effect.damage) {
      this._applyAreaDamage(effect);
    }
  },

  /** 符文陣元素爆發（紫色能量波 + 符文散射） */
  _objElementBurst(ctx, PA, effect, progress) {
    if (progress > 1) return;
    const cx = effect.x;
    const cy = effect.y;
    const maxR = effect.radius || 32;

    // 能量波圈
    const waveR = maxR * progress;
    const alpha = (1 - progress) * 0.7;
    ctx.save();
    ctx.globalAlpha = alpha;
    PA.circle(ctx, cx, cy, waveR, '#8866cc');
    PA.circle(ctx, cx, cy, waveR * 0.7, '#aa88ee');
    ctx.restore();

    // 符文碎片
    if (progress < 0.7) {
      const fragAlpha = 1 - (progress / 0.7);
      ctx.save();
      ctx.globalAlpha = fragAlpha;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + progress * 3;
        const dist = maxR * 0.5 * progress;
        const fx = Math.round(cx + Math.cos(angle) * dist);
        const fy = Math.round(cy + Math.sin(angle) * dist);
        PA.pixel(ctx, fx, fy, '#aa88ee');
      }
      ctx.restore();
    }

    // 傷害（首幀）
    if (effect.timer < 16 && effect.damage) {
      this._applyAreaDamage(effect);
    }
  },

  /** 封印之門碎裂（石塊崩塌 + 光柱） */
  _objPathChange(ctx, PA, effect, progress) {
    if (progress > 1) return;
    const cx = effect.x;
    const cy = effect.y;

    // Phase 1: 光柱 (0-40%)
    if (progress < 0.4) {
      const beamAlpha = (1 - progress / 0.4) * 0.6;
      ctx.save();
      ctx.globalAlpha = beamAlpha;
      PA.rect(ctx, cx - 4, cy - 30, 8, 60, '#ffaa44');
      PA.rect(ctx, cx - 2, cy - 30, 4, 60, '#ffffff');
      ctx.restore();
    }

    // Phase 2: 石塊崩塌 (10-100%)
    if (progress > 0.1) {
      const fallProgress = (progress - 0.1) / 0.9;
      const alpha = 1 - fallProgress;
      ctx.save();
      ctx.globalAlpha = alpha;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const dist = 10 + 20 * fallProgress;
        const gravity = 15 * fallProgress * fallProgress;
        const fx = Math.round(cx + Math.cos(angle) * dist);
        const fy = Math.round(cy + Math.sin(angle) * dist + gravity);
        PA.rect(ctx, fx, fy, 2 + (i % 2), 2 + (i % 2), i % 3 === 0 ? '#4a4c54' : '#3a3d44');
      }
      ctx.restore();
    }
  },

  /** 範圍傷害通用邏輯（木桶堆、符文陣共用） */
  _applyAreaDamage(effect) {
    const T = DK.CONFIG.TILE_SIZE;
    const radius = effect.radius || 24;
    const damage = effect.damage || 0;

    // 對敵人造成傷害
    if (DK.Enemies && DK.Enemies.active) {
      for (const enemy of DK.Enemies.active) {
        if (!enemy.alive) continue;
        const dx = enemy.x - effect.x;
        const dy = enemy.y - effect.y;
        if (Math.sqrt(dx * dx + dy * dy) <= radius) {
          enemy.hp -= damage;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            DK.Game.gold += enemy.type.reward || 0;
          }
        }
      }
    }

    // friendlyFire：也對英雄造成傷害
    if (effect.friendlyFire && DK.Heroes && DK.Heroes.active) {
      for (const hero of DK.Heroes.active) {
        if (!hero.alive) continue;
        const dx = hero.x - effect.x;
        const dy = hero.y - effect.y;
        if (Math.sqrt(dx * dx + dy * dy) <= radius) {
          hero.hp -= damage;
          if (hero.hp <= 0) hero.alive = false;
        }
      }
    }
  },
```

**Step 3: Verify syntax**

Run: `node -c js/main-effects.js`

**Step 4: Commit**

```bash
git add js/main-effects.js
git commit -m "feat: add explosion, element burst, and path change destroy effects"
```

---

## Task 7: Enemy AI — Attack Destructible Map Objects

**Files:**
- Modify: `js/enemies.js`

**Step 1: Add object attack state cleanup**

In `enemies.js`, after the door attack cleanup block (~L221-227), add:

```javascript
      // 防禦性檢查：清除已摧毀的地圖物件攻擊狀態
      if (enemy._attackingMapObject) {
        const targetObj = DK.Map.getMapObjectAt(
          enemy._attackingMapObject.col, enemy._attackingMapObject.row
        );
        if (!targetObj || targetObj.destroyed) {
          enemy._attackingMapObject = null;
          enemy._mapObjectAttackTimer = 0;
        }
      }
```

**Step 2: Add object attack logic in blocked path**

In the blocked path section, after the barricade attack block (~L308-357) and before the `// 下一步不是路障` comment (~L359), add:

```javascript
        // 下一步是可破壞地圖物件 → 停下攻擊
        if (nextStep && DK.Map.getMapObjectAt) {
          const mapObj = DK.Map.getMapObjectAt(nextStep.col, nextStep.row);
          if (mapObj && mapObj.type === 'destructible' && !mapObj.destroyed) {
            if (!enemy._attackingMapObject) {
              enemy._attackingMapObject = { col: nextStep.col, row: nextStep.row };
              enemy._mapObjectAttackTimer = 0;
            }

            enemy._mapObjectAttackTimer = (enemy._mapObjectAttackTimer || 0) + dt;
            const attackInterval = DK.CONFIG.ATTACK_INTERVAL;

            if (enemy._mapObjectAttackTimer >= attackInterval) {
              enemy._mapObjectAttackTimer -= attackInterval;
              const damage = enemy.type.heartDamage || 10;
              const destroyed = DK.Map.damageMapObject(nextStep.col, nextStep.row, damage);

              // 傷害數字特效
              if (DK.Game.effects) {
                DK.Game.effects.push({
                  type: 'damage',
                  x: mapObj.centerX,
                  y: mapObj.gridY * T - 4,
                  text: `-${damage}`,
                  color: '#ffaa44',
                  duration: 600,
                  timer: 0,
                });
              }

              if (destroyed) {
                enemy._attackingMapObject = null;
                enemy._mapObjectAttackTimer = 0;
                // 物件摧毀後不 continue，讓敵人重新尋路
              } else {
                continue; // 物件還在，繼續攻擊不移動
              }
            } else {
              continue; // 攻擊冷卻中
            }
          }
        }
```

**Step 3: Verify syntax**

Run: `node -c js/enemies.js`

**Step 4: Commit**

```bash
git add js/enemies.js
git commit -m "feat: enable enemies to attack destructible map objects blocking their path"
```

---

## Task 8: Editor — Add Object Tile Definitions

**Files:**
- Modify: `js/editor/editor-ui.js`

**Step 1: Add 8 new tile definitions to `tiles` array**

In `editor-ui.js`, after the last tile `{ id: 'Z', name: '魔法門', color: '#aa44ff' }` (L38), add:

```javascript
    // Multi-tile map objects
    { id: '1', name: '石柱 2x2', color: '#4a4c54' },
    { id: '2', name: '寶箱 2x2', color: '#c8a832' },
    { id: '3', name: '木桶堆 2x2', color: '#5a4a3a' },
    { id: '4', name: '祭壇 3x3', color: '#8844aa' },
    { id: '5', name: '水晶簇 3x3', color: '#4488bb' },
    { id: '6', name: '符文陣 3x3', color: '#6644aa' },
    { id: '7', name: '龍骨 4x4', color: '#d0c8b0' },
    { id: '8', name: '封印門 4x4', color: '#cc4444' },
```

**Step 2: Add new category for map objects**

In the `categories` array, after the `defense` category (L78-84), add:

```javascript
    {
      id: 'objects',
      icon: '🏛️',
      name: '地圖物件',
      expanded: true,
      tiles: ['1', '2', '3', '4', '5', '6', '7', '8']
    },
```

**Step 3: Verify syntax**

Run: `node -c js/editor/editor-ui.js`

**Step 4: Commit**

```bash
git add js/editor/editor-ui.js
git commit -m "feat: add map object tiles and category to editor UI"
```

---

## Task 9: Editor — NxN Placement and Deletion

**Files:**
- Modify: `js/editor/editor-main.js`

**Step 1: Update `paintTile()` to handle NxN objects**

In `editor-main.js`, replace the 2x2 check at L448:

```javascript
    const is2x2Object = this.selectedTile === 'H' || this.selectedTile === 'E' || this.selectedTile === 'M';
```

With a generalized NxN check:

```javascript
    // 判斷是否為多格物件
    const multiTileSize = this._getMultiTileSize(this.selectedTile);
    const isMultiTileObject = multiTileSize > 1;
```

Then replace the entire `if (is2x2Object) { ... }` block (L450-487) with:

```javascript
    if (isMultiTileObject) {
      const N = multiTileSize;

      // 驗證是否有足夠空間
      if (col + N - 1 >= this.cols || row + N - 1 >= this.rows) {
        const tileDef = DK.EditorUI.tiles.find(t => t.id === this.selectedTile);
        const name = tileDef ? tileDef.name : this.selectedTile;
        console.warn(`${name} 需要 ${N}x${N} 空間，位置超出地圖邊界`);
        return;
      }

      // 檢查 NxN 區域是否可用
      for (let dy = 0; dy < N; dy++) {
        for (let dx = 0; dx < N; dx++) {
          const existingTile = this.getTile(col + dx, row + dy);
          if (existingTile !== '.' && existingTile !== this.selectedTile) {
            console.warn(`放置失敗：(${col + dx}, ${row + dy}) 已被 '${existingTile}' 佔用`);
            return;
          }
        }
      }

      // 放置 NxN 物件
      for (let dy = 0; dy < N; dy++) {
        for (let dx = 0; dx < N; dx++) {
          this.setTile(col + dx, row + dy, this.selectedTile);
        }
      }

      // 更新 lastPainted 為右下角座標
      this.mouse.lastPaintedCol = col + N - 1;
      this.mouse.lastPaintedRow = row + N - 1;
      return;
    }
```

**Step 2: Add `_getMultiTileSize()` helper**

After the `pickTile()` method (~L580), add:

```javascript
  /**
   * 取得多格物件的尺寸（1=普通地磚）
   */
  _getMultiTileSize(tile) {
    // 內建 2x2 物件
    if (tile === 'H' || tile === 'E' || tile === 'M') return 2;
    // MAP_OBJECTS 定義的物件
    if (DK.MAP_OBJECTS && DK.MAP_OBJECTS[tile]) return DK.MAP_OBJECTS[tile].size;
    return 1;
  },
```

**Step 3: Update `eraseTile()` to handle NxN**

Replace the 2x2 check at L510:
```javascript
    const is2x2Object = tile === 'H' || tile === 'E' || tile === 'M';
```

With:
```javascript
    const multiTileSize = this._getMultiTileSize(tile);
    const isMultiTileObject = multiTileSize > 1;
```

Replace `if (is2x2Object) { ... }` block (L512-528) with:

```javascript
    if (isMultiTileObject) {
      const N = multiTileSize;
      const anchor = this._findNxNAnchor(col, row, tile, N);

      if (anchor) {
        // 刪除整個 NxN 物件
        for (let dy = 0; dy < N; dy++) {
          for (let dx = 0; dx < N; dx++) {
            this.setTile(anchor.col + dx, anchor.row + dy, '.');
          }
        }
      } else {
        this.setTile(col, row, '.');
      }
    } else {
```

**Step 4: Add `_findNxNAnchor()` helper**

Replace the existing `find2x2Anchor()` method (L539-565) with a generalized version:

```javascript
  /**
   * 尋找 NxN 物件錨點（左上角）
   * 通用版：支援 2x2, 3x3, 4x4
   */
  _findNxNAnchor(col, row, objectType, N) {
    // 搜尋所有可能的錨點位置
    for (let dr = 0; dr < N; dr++) {
      for (let dc = 0; dc < N; dc++) {
        const anchorCol = col - dc;
        const anchorRow = row - dr;

        // 邊界檢查
        if (anchorCol < 0 || anchorRow < 0 ||
            anchorCol + N - 1 >= this.cols || anchorRow + N - 1 >= this.rows) {
          continue;
        }

        // 驗證 NxN 區域全部為同一 tile
        let valid = true;
        for (let dy = 0; dy < N && valid; dy++) {
          for (let dx = 0; dx < N && valid; dx++) {
            if (this.getTile(anchorCol + dx, anchorRow + dy) !== objectType) {
              valid = false;
            }
          }
        }

        if (valid) return { col: anchorCol, row: anchorRow };
      }
    }
    return null;
  },
```

Keep the old `find2x2Anchor` as an alias for backward compatibility:
```javascript
  find2x2Anchor(col, row, objectType) {
    return this._findNxNAnchor(col, row, objectType, 2);
  },
```

**Step 5: Verify syntax**

Run: `node -c js/editor/editor-main.js`

**Step 6: Commit**

```bash
git add js/editor/editor-main.js
git commit -m "feat: generalize editor placement/deletion for NxN map objects"
```

---

## Task 10: Editor — Hover Preview for NxN Objects

**Files:**
- Modify: `js/editor/editor-ui.js`

**Step 1: Update hover highlight rendering**

Find the hover highlight render function in `editor-ui.js` (search for `renderHoverHighlight` or similar function that draws the cursor preview). The highlight should show the full NxN area:

```javascript
  // 在繪製 hover 高亮時，檢查多格物件尺寸
  renderHoverHighlight(ctx, col, row, tileSize, zoom) {
    const N = DK.Editor._getMultiTileSize
      ? DK.Editor._getMultiTileSize(DK.Editor.selectedTile)
      : 1;

    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(
      col * tileSize * zoom,
      row * tileSize * zoom,
      N * tileSize * zoom,
      N * tileSize * zoom
    );

    // 半透明填色預覽
    const tileDef = this.tiles.find(t => t.id === DK.Editor.selectedTile);
    if (tileDef) {
      ctx.fillStyle = tileDef.color;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(
        col * tileSize * zoom,
        row * tileSize * zoom,
        N * tileSize * zoom,
        N * tileSize * zoom
      );
    }
    ctx.restore();
  },
```

**NOTE:** The exact location and function name depends on the actual editor rendering code. The implementer should search for where the mouse cursor highlight is drawn and extend it to show NxN preview.

**Step 2: Verify syntax**

Run: `node -c js/editor/editor-ui.js`

**Step 3: Commit**

```bash
git add js/editor/editor-ui.js
git commit -m "feat: show NxN preview highlight for multi-tile objects in editor"
```

---

## Task 11: Integration Test — Place Objects in Test Level

**Files:**
- Modify: `js/map/map-core.js` (default layout only, for testing)
- Create: `verify-map-objects.cjs` (Puppeteer test)

**Step 1: Add test objects to default layout**

Temporarily modify the default layout in `map-core.js` to include test objects. Find an open area (e.g., rows 6-10, cols 5-15) and place one of each size:

Example: Add a `1` (stone pillar 2x2) at position (5,6):
```
Row 6: change '.........W' area to include '11' at suitable position
Row 7: matching '11' below
```

**IMPORTANT:** This is a temporary test. The default layout should be reverted after verification. Objects will primarily be placed via the editor.

**Step 2: Create Puppeteer verification script**

```javascript
/**
 * ProjectDK - Map Objects 驗證腳本
 */
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const results = [];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-web-security', '--allow-file-access-from-files'],
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(err.message));

    const filePath = `file://${path.resolve(__dirname, 'index.html')}`;
    await page.goto(filePath, { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForFunction(() => typeof DK !== 'undefined' && DK.Game, { timeout: 10000 });

    // Test 1: MAP_OBJECTS 定義存在
    const t1 = await page.evaluate(() => {
      return {
        exists: !!DK.MAP_OBJECTS,
        count: DK.MAP_OBJECTS ? Object.keys(DK.MAP_OBJECTS).length : 0,
        codes: DK.MAP_OBJECTS ? Object.keys(DK.MAP_OBJECTS) : [],
      };
    });
    results.push({
      test: 'MAP_OBJECTS 定義存在且有 8 個物件',
      pass: t1.exists && t1.count === 8,
      detail: `${t1.count} objects: ${t1.codes.join(', ')}`,
    });

    // Test 2: 各物件定義完整性
    const t2 = await page.evaluate(() => {
      const issues = [];
      for (const [code, def] of Object.entries(DK.MAP_OBJECTS || {})) {
        if (!def.id) issues.push(`${code}: missing id`);
        if (!def.name) issues.push(`${code}: missing name`);
        if (!def.size) issues.push(`${code}: missing size`);
        if (!def.type) issues.push(`${code}: missing type`);
        if (def.type === 'destructible' && !def.hp) issues.push(`${code}: destructible but no hp`);
        if (!def.colors) issues.push(`${code}: missing colors`);
      }
      return { issues };
    });
    results.push({
      test: '所有物件定義完整（id, name, size, type, colors）',
      pass: t2.issues.length === 0,
      detail: t2.issues.length === 0 ? '全部合格' : t2.issues.join('; '),
    });

    // Test 3: Map 物件系統方法存在
    const t3 = await page.evaluate(() => ({
      initMapObjects: typeof DK.Map.initMapObjects === 'function',
      isMapObject: typeof DK.Map.isMapObject === 'function',
      getMapObjectAt: typeof DK.Map.getMapObjectAt === 'function',
      damageMapObject: typeof DK.Map.damageMapObject === 'function',
      renderMapObjects: typeof DK.Map.renderMapObjects === 'function',
      updateMapObjects: typeof DK.Map.updateMapObjects === 'function',
    }));
    results.push({
      test: 'Map 物件系統方法全部存在',
      pass: Object.values(t3).every(v => v),
      detail: Object.entries(t3).map(([k, v]) => `${k}=${v}`).join(', '),
    });

    // Test 4: Effect renderer 有新效果類型
    const t4 = await page.evaluate(() => ({
      objExplosion: typeof DK.EffectRenderer._objExplosion === 'function',
      objElementBurst: typeof DK.EffectRenderer._objElementBurst === 'function',
      objPathChange: typeof DK.EffectRenderer._objPathChange === 'function',
    }));
    results.push({
      test: '3 種摧毀效果渲染器存在',
      pass: Object.values(t4).every(v => v),
      detail: Object.entries(t4).map(([k, v]) => `${k}=${v}`).join(', '),
    });

    // Test 5: Editor tile 定義包含新物件
    const t5 = await page.evaluate(() => {
      if (!DK.EditorUI) return { exists: false };
      const objectTiles = DK.EditorUI.tiles.filter(t => '12345678'.includes(t.id));
      const objectCategory = DK.EditorUI.categories.find(c => c.id === 'objects');
      return {
        exists: true,
        tileCount: objectTiles.length,
        categoryExists: !!objectCategory,
        categoryTiles: objectCategory ? objectCategory.tiles.length : 0,
      };
    });
    results.push({
      test: 'Editor 包含 8 個物件 tile 和物件分類',
      pass: t5.tileCount === 8 && t5.categoryExists && t5.categoryTiles === 8,
      detail: `tiles=${t5.tileCount}, category=${t5.categoryExists}, categoryTiles=${t5.categoryTiles}`,
    });

    // Test 6: 無 JS 錯誤
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('sounds/') && !e.includes('ERR_FILE_NOT_FOUND')
    );
    results.push({
      test: '無 JS 錯誤',
      pass: criticalErrors.length === 0,
      detail: criticalErrors.length === 0 ? '零錯誤' : criticalErrors.slice(0, 3).join('; '),
    });

    // Output
    console.log('\n========================================');
    console.log('  Map Objects System 驗證報告');
    console.log('========================================\n');

    let passCount = 0, failCount = 0;
    for (const r of results) {
      const icon = r.pass ? '✅' : '❌';
      console.log(`${icon} ${r.test}`);
      console.log(`   ${r.detail}`);
      if (r.pass) passCount++; else failCount++;
    }

    console.log(`\n========================================`);
    console.log(`  結果: ${passCount} 通過 / ${failCount} 失敗 / ${results.length} 總計`);
    console.log(`========================================\n`);

    if (failCount > 0) process.exitCode = 1;

  } catch (err) {
    console.error('測試執行失敗:', err.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
```

**Step 3: Run verification**

Run: `node verify-map-objects.cjs`
Expected: 6/6 pass

**Step 4: Commit**

```bash
git add verify-map-objects.cjs
git commit -m "test: add map objects system verification script"
```

---

## Task 12: Final — Revert Test Layout + Syntax Check + Final Commit

**Step 1: Revert any temporary layout changes** (if made in Task 11 Step 1)

**Step 2: Full syntax check**

```bash
node -c js/config/config-data.js && \
node -c js/map/map-core.js && \
node -c js/map/map-pathfinding.js && \
node -c js/map/map-tiles-objects.js && \
node -c js/main.js && \
node -c js/main-effects.js && \
node -c js/game.js && \
node -c js/enemies.js && \
node -c js/editor/editor-ui.js && \
node -c js/editor/editor-main.js
```

**Step 3: Run Puppeteer test**

Run: `node verify-map-objects.cjs`

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete map objects system — 8 multi-tile objects with editor support"
```

---

## Files Modified Summary

| # | File | Action | Task |
|---|------|--------|------|
| 1 | `js/config/config-data.js` | Modify | T1: Add MAP_OBJECTS |
| 2 | `js/map/map-core.js` | Modify | T2: Parser + damage system |
| 3 | `js/map/map-pathfinding.js` | Modify | T3: Through-field for destructibles |
| 4 | `js/map/map-tiles-objects.js` | **Create** | T4: 8 object renderers |
| 5 | `index.html` | Modify | T4: Add script tag |
| 6 | `js/main.js` | Modify | T5: Render call |
| 7 | `js/game.js` | Modify | T5: Update call |
| 8 | `js/main-effects.js` | Modify | T6: 3 destroy effects |
| 9 | `js/enemies.js` | Modify | T7: Attack destructibles |
| 10 | `js/editor/editor-ui.js` | Modify | T8+T10: Tiles + hover preview |
| 11 | `js/editor/editor-main.js` | Modify | T9: NxN placement/deletion |
| 12 | `verify-map-objects.cjs` | **Create** | T11: Test script |

## Dependency Graph

```
T1 (config) ──→ T2 (parser) ──→ T3 (pathfinding)
                     │                   │
                     ├──→ T4 (render) ──→ T5 (main loop) ──→ T11 (test)
                     │                                           ↑
                     ├──→ T6 (effects) ──────────────────────────┤
                     │                                           │
                     ├──→ T7 (enemy AI) ─────────────────────────┤
                     │                                           │
                     └──→ T8 (editor UI) → T9 (editor NxN) → T10 (hover) ─→ T12 (final)
```

**Critical path:** T1 → T2 → T3 → T5 → T11
**Parallelizable:** T4, T6, T7, T8 can run concurrently after T2
