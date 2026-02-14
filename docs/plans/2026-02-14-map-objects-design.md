# Map Objects System Design

**Date**: 2026-02-14
**Status**: Approved

---

## Overview

Add 8 placeable map objects (decorative + destructible) in 3 size categories to enrich dungeon level design. Objects integrate with the existing tile system, pathfinding, and level editor.

## Object Definitions

### 2x2 (32x32 px)

| Code | ID | Name | Type | HP | Walkable | Notes |
|------|----|------|------|----|----------|-------|
| `SP` | stone_pillar | Stone Pillar | decoration | - | false | Cracked pillar with wide base |
| `TC` | treasure_chest | Treasure Chest | decoration | - | false | Wooden chest with iron trim, gold gleam |
| `BS` | barrel_stack | Barrel Stack | destructible | 30 | false | Explosive barrels, AoE on destroy |

### 3x3 (48x48 px)

| Code | ID | Name | Type | HP | Walkable | Notes |
|------|----|------|------|----|----------|-------|
| `AL` | altar | Altar | decoration | - | false | Stone altar with purple rune glow |
| `CR` | crystal_cluster | Crystal Cluster | decoration | - | false | 5-7 glowing crystals from floor |
| `RC` | rune_circle | Rune Circle | destructible | 120 | false | Ground magic circle, elemental burst on destroy |

### 4x4 (64x64 px)

| Code | ID | Name | Type | HP | Walkable | Notes |
|------|----|------|------|----|----------|-------|
| `DG` | dragon_skeleton | Dragon Skeleton | decoration | - | false | Giant ribcage + skull, green eye socket glow |
| `SG` | sealed_gate | Sealed Gate | destructible | 200 | false | Becomes walkable path on destroy, triggers pathfinding recalc |

## Data Structure

```javascript
DK.MAP_OBJECTS = {
  SP: {
    id: 'stone_pillar', name: '石柱',
    size: 2, type: 'decoration',
    walkable: false,
    description: '支撐天花板的殘破石柱',
  },
  TC: {
    id: 'treasure_chest', name: '寶箱',
    size: 2, type: 'decoration',
    walkable: false,
    description: '鐵框木箱，隱約閃爍金光',
  },
  BS: {
    id: 'barrel_stack', name: '木桶堆',
    size: 2, type: 'destructible',
    walkable: false,
    hp: 30,
    onDestroy: {
      effect: 'explosion',
      radius: 1.5,
      damage: 40,
      friendlyFire: true,
    },
    description: '堆疊的火藥桶，攻擊後爆炸',
  },
  AL: {
    id: 'altar', name: '祭壇',
    size: 3, type: 'decoration',
    walkable: false,
    description: '石製獻祭台，刻有古老符文',
  },
  CR: {
    id: 'crystal_cluster', name: '水晶簇',
    size: 3, type: 'decoration',
    walkable: false,
    description: '從地面長出的發光水晶群',
  },
  RC: {
    id: 'rune_circle', name: '符文陣',
    size: 3, type: 'destructible',
    walkable: false,
    hp: 120,
    onDestroy: {
      effect: 'element_burst',
      radius: 2.0,
      damage: 60,
    },
    description: '地面魔法陣，摧毀時釋放元素爆發',
  },
  DG: {
    id: 'dragon_skeleton', name: '龍骨遺骸',
    size: 4, type: 'decoration',
    walkable: false,
    description: '巨大的龍骨化石，眼窩偶爾閃爍綠光',
  },
  SG: {
    id: 'sealed_gate', name: '封印之門',
    size: 4, type: 'destructible',
    walkable: false,
    walkableOnDestroy: true,
    hp: 200,
    onDestroy: {
      effect: 'path_change',
      convertTo: '.',
      recalcPathfinding: true,
    },
    description: '古老封印巨門，摧毀後開啟新路徑',
  },
};
```

## Map Encoding

Uses existing 2-char-per-tile convention (GRID_COLS=20, 40 chars per row).

### Examples

```
2x2 stone pillar:       3x3 altar:              4x4 sealed gate:
WW SP SP WW ..          WW AL AL AL ..          WW SG SG SG SG WW
WW SP SP WW ..          WW AL AL AL ..          WW SG SG SG SG WW
                        WW AL AL AL ..          WW SG SG SG SG WW
                                                WW SG SG SG SG WW
```

### Parser Logic

Anchor detection: a tile is the top-left anchor if neither the tile above nor the tile to the left shares the same code.

```javascript
if (MAP_OBJECTS[tileCode]) {
  const isAnchor = (col === 0 || getTile(row, col-1) !== tileCode)
                && (row === 0 || getTile(row-1, col) !== tileCode);
  if (isAnchor) {
    mapObjects.push({
      typeCode: tileCode,
      gridX: col, gridY: row,
      ...MAP_OBJECTS[tileCode],
      currentHP: MAP_OBJECTS[tileCode].hp || null,
    });
  }
  // Mark tile as occupied by this object for collision
  tileGrid[row][col].objectRef = mapObjects[mapObjects.length - 1];
}
```

## Rendering

### Color Palettes

**Stone Pillar** (wall grey family):
- Base: `#4a4c54`, Highlight: `#6a6c74`, Shadow: `#2a2c32`
- Crack lines: `#3a3d44`

**Treasure Chest** (floor brown + gold):
- Wood: `#544e46`, Dark wood: `#3c3630`, Iron: `#5c5e66`
- Gold gleam: `#c8a832`, Gold highlight: `#e8d060`

**Barrel Stack** (warm brown):
- Wood: `#5a4a3a`, Highlight: `#7a6a5a`, Shadow: `#3a2a1a`
- Iron bands: `#5c5e66`

**Altar** (wall grey + purple magic):
- Stone: `#4a4c54`/`#3a3d44`, Candle flame: `#cc8800`
- Rune glow: `#8844aa`, Rune pulse: alpha oscillation 0.3-0.7

**Crystal Cluster** (pool blue gradient):
- Crystal body: `#3366aa` -> `#6aaaee` gradient
- Sparkle: `#88ccff`, Base shadow: `#1a3355`

**Rune Circle** (magic purple-blue):
- Circle line: `#6644aa`, Symbol: `#8866cc`
- Corner stones: `#4a4c54`, Active glow: `#aa88ee`

**Dragon Skeleton** (bone white on dark):
- Bone: `#d0c8b0`, Bone shadow: `#a09880`
- Ground: abyss `#0a0a14`, Eye socket glow: `#44cc44` (intermittent)

**Sealed Gate** (heavy stone + chain):
- Stone door: `#3a3d44`/`#4a4c54`, Crack: `#5c5e66`
- Chain: `#6a6c74`, Seal rune: `#cc4444`
- Damaged state (<50% HP): crack widens, glow `#ffaa44`

### Animation Effects

| Object | Animation | Method |
|--------|-----------|--------|
| Altar rune | Pulse glow | `sin(time * 0.002) * 0.2 + 0.5` alpha |
| Crystal | Sparkle | Random pixel flash every 500ms |
| Dragon eye | Intermittent glow | 10% chance per 2s tick |
| Sealed Gate | Chain break on damage | Visual state change at HP thresholds |
| Rune Circle | Slow rotation | Rotate symbols via frame offset |

## Interaction System

### Damage Rules

- Enemies attack blocking destructible objects in their path
- Player traps do NOT target objects (only enemies)
- Heroes CAN be ordered to attack objects (manual command)
- Explosion (barrel) damages all units in radius (friendlyFire: true)

### Destroy Effects

| Object | Effect | Detail |
|--------|--------|--------|
| Barrel Stack | explosion | 40 dmg, 1.5 tile radius, hits enemies + heroes |
| Rune Circle | element_burst | 60 dmg, 2.0 tile radius, elemental particles |
| Sealed Gate | path_change | Convert 4x4 tiles to walkable, recalc pathfinding |

### Debris

All destroyed objects spawn debris particles using existing effect system:
- Stone objects: grey particle scatter
- Wood objects: brown splinter particles
- Magic objects: colored energy dissipation

## Editor Integration

### UI

New "Objects" tab in editor toolbar:

```
[Terrain] [Objects] [Waves]
            |
   ┌────────┴────────┐
   │  2x2  │  3x3  │  4x4  │
   │ SP TC BS │ AL CR RC │ DG SG │
   └─────────────────┘
```

### Placement

1. Select object from palette
2. Mouse hover shows semi-transparent preview at grid-snapped position
3. Click to place (fills NxN tiles with object code)
4. Collision check: cannot overlap existing objects, portals, or dungeon heart
5. Right-click to remove (clears all occupied tiles)

### Validation

- Objects must fit within map bounds
- Objects cannot block ALL paths (at least one route must exist from portal to heart)
- Destructible objects on paths are allowed (enemies will attack to pass)

## Implementation Order

1. **Config**: `DK.MAP_OBJECTS` definitions in `config-data.js`
2. **Parser**: Anchor detection + object instantiation in `map-core.js`
3. **Rendering**: `drawMapObject()` in `pixelart.js` (all 8 objects)
4. **Collision**: Object walkability in pathfinding
5. **Interaction**: Damage/destroy logic in `game.js`
6. **Effects**: Explosion, element burst, debris in `main-effects.js`
7. **Editor**: Object palette + placement UI
8. **Testing**: Place objects in test level, verify rendering + interaction

## Files Modified

| File | Changes |
|------|---------|
| `js/config/config-data.js` | Add `DK.MAP_OBJECTS` definitions |
| `js/map/map-core.js` | Object anchor detection, tile marking |
| `js/pixelart.js` | `drawMapObject()` rendering for all 8 types |
| `js/game.js` | `damageMapObject()`, `destroyMapObject()` |
| `js/main-effects.js` | Explosion, element burst, debris effects |
| `js/main.js` | Render map objects in draw loop |
| `js/enemies.js` | Enemy pathfinding around/through objects |
| `js/editor/` | Object palette tab, placement, removal |
