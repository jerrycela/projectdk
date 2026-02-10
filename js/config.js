/**
 * Dungeon Keep - Configuration
 */
window.DK = window.DK || {};

DK.CONFIG = {
  // Tile sizes
  TILE_SIZE: 16,        // Pixel art tile size
  SCALE: 3,             // Display scale factor
  DISPLAY_TILE: 48,     // TILE_SIZE * SCALE

  // Grid dimensions (viewport)
  GRID_COLS: 20,
  GRID_ROWS: 13,

  // World dimensions (full map)
  WORLD_COLS: 40,
  WORLD_ROWS: 26,
  WORLD_WIDTH: 640,     // 40 * 16
  WORLD_HEIGHT: 416,    // 26 * 16

  // Canvas sizes (viewport)
  GAME_WIDTH: 320,      // 20 * 16
  GAME_HEIGHT: 208,     // 13 * 16
  DISPLAY_WIDTH: 960,   // 320 * 3
  DISPLAY_HEIGHT: 720,  // Includes UI area

  // UI area
  UI_TOP: 624,          // 208 * 3 = 624
  UI_HEIGHT: 96,

  // Game settings
  STARTING_GOLD: 350,
  DUNGEON_HEART_HP: 100,
  WAVE_DELAY: 5000,
  WAVE_AUTO_DELAY: 3000,
  ENEMY_SPAWN_INTERVAL: 500,
  OUTER_PATROL_SPEED: 0.5,

  // FPS
  TARGET_FPS: 60,

  // Barricade
  BARRICADE_HP: 100,
  BARRICADE_MAX: 5,
};

// Color Palette - Dungeon Theme
DK.COLORS = {
  // Walls
  WALL_DARK: '#1a1828',
  WALL_MID: '#2d2d44',
  WALL_LIGHT: '#3e3e5a',
  WALL_HIGHLIGHT: '#565470',
  WALL_MORTAR: '#140e24',
  WALL_MOSS: '#2a4a2a',
  WALL_DARK_MID: '#242236',
  WALL_MID_LIGHT: '#484660',
  WALL_WARM: '#3a3248',

  // Floors
  FLOOR_DARK: '#4a4236',
  FLOOR_MID: '#5e5648',
  FLOOR_LIGHT: '#72695a',
  FLOOR_HIGHLIGHT: '#8a806e',
  FLOOR_CRACK: '#3a3428',
  FLOOR_DARK_MID: '#524a3e',
  FLOOR_MID_LIGHT: '#685e50',

  // Path markers
  PATH_ARROW: '#6e6655',

  // Traps - Wall mounted
  TRAP_METAL: '#7888a0',
  TRAP_METAL_LIGHT: '#98a8c0',
  TRAP_METAL_DARK: '#586878',

  // Enemies (Human Adventurers)
  GOBLIN_SKIN: '#e8c8a0',      // 劍士膚色（人類膚色）
  GOBLIN_DARK: '#c8a878',      // 劍士膚色暗面
  GOBLIN_EYE: '#4466aa',       // 劍士藍眼
  SKELETON_BONE: '#c8b898',    // 弓手皮革色
  SKELETON_DARK: '#a89070',    // 弓手皮革暗色
  SKELETON_EYE: '#44aa44',     // 弓手綠眼
  ORC_SKIN: '#e0c0a0',        // 騎士膚色
  ORC_DARK: '#c0a080',        // 騎士膚色暗面
  ORC_ARMOR: '#7080a0',       // 騎士銀甲
  SLIME_BODY: '#4a4a5a',      // 盜賊暗色衣
  SLIME_LIGHT: '#6a6a7a',     // 盜賊衣服亮面
  SLIME_DARK: '#2a2a3a',      // 盜賊衣服暗面
  SLIME_EYE: '#ffffff',       // 盜賊眼白

  // UI
  UI_BG: '#12101e',
  UI_PANEL: '#1e1a2e',
  UI_BORDER: '#4a3e6e',
  UI_BORDER_LIGHT: '#6a5e8e',
  UI_TEXT: '#e8e0d0',
  UI_TEXT_DIM: '#8a8070',
  UI_GOLD: '#ffd700',
  UI_HP: '#ff4444',
  UI_HP_BG: '#441111',
  UI_WAVE: '#44aaff',
  UI_SELECTED: '#ffaa44',

  // Effects
  DAMAGE_TEXT: '#ff4444',
  GOLD_TEXT: '#ffd700',
  HEAL_TEXT: '#44ff44',

  // Elements
  ELEMENT_WATER: '#4488ff',
  ELEMENT_WATER_LIGHT: '#66aaff',
  ELEMENT_ELECTRIC: '#ffdd44',
  ELEMENT_ELECTRIC_LIGHT: '#ffff88',
  ELEMENT_REACTION: '#ffffff',

  // Heroes (Dungeon Deities - Female) - 金髮魔王女神風格
  // === 金髮漸層（兩位英雄共用）===
  HERO_HAIR_DARK: '#aa8844',    // 金髮陰影
  HERO_HAIR_MID: '#ddaa55',     // 金髮主色
  HERO_HAIR_LIGHT: '#ffcc77',   // 金髮高光

  // === 皇冠（金色 + 紅寶石）===
  HERO_CROWN_GOLD: '#ffcc00',   // 金色皇冠
  HERO_CROWN_GEM: '#cc0000',    // 紅寶石

  // === 利維坦（水法師）深藍紫禮服 ===
  HERO_ROBE: '#3a4a8a',         // 深藍紫禮服主色
  HERO_ROBE_DARK: '#2a3a6a',    // 深藍紫陰影
  HERO_ROBE_LIGHT: '#5a6aaa',   // 深藍紫高光

  // === 通用裝飾 ===
  HERO_SKIN: '#f0dcc8',         // 女神膚色（白皙）
  HERO_GEM_WATER: '#88ccff',    // 利維坦水晶寶石
  HERO_PEARL: '#ffffff',        // 利維坦珍珠
  HERO_SILVER: '#aaccee',       // 利維坦銀飾
  HERO_GOLD: '#ffd700',         // 金色裝飾
  HERO_FUR_WHITE: '#ffffff',    // 白色毛皮
  HERO_SELECTED: '#44ff44',

  // Electric trap
  TRAP_ELECTRIC: '#ffdd44',
  TRAP_ELECTRIC_LIGHT: '#ffff88',
  TRAP_ELECTRIC_DARK: '#aa8800',
  TRAP_ELECTRIC_PLATE: '#4a4a5a',

  // Push trap
  TRAP_PUSH_HOUSING: '#5a5060',
  TRAP_PUSH_PISTON: '#8a8090',
  TRAP_PUSH_CHARGE: '#ff6622',
  TRAP_PUSH_GLOW: '#ffaa44',

  // Oil trap
  TRAP_OIL_BODY: '#3a3020',
  TRAP_OIL_PUDDLE: '#2a2010',
  TRAP_OIL_SHEEN: '#5a5030',
  TRAP_OIL_DARK: '#1a1808',

  // Wind trap
  TRAP_WIND_HOUSING: '#2a3448',
  TRAP_WIND_FAN: '#88aacc',
  TRAP_WIND_GLOW: '#aaddff',

  // Abyss (replaces lava)
  ABYSS_DARK: '#050508',
  ABYSS_EDGE: '#1a1a2a',
  ABYSS_CRACK: '#0a0a14',
  ABYSS_ROCK: '#2a2838',
  ABYSS_MID: '#0e0e18',

  // Water pool
  POOL_DARK: '#1a2a4a',
  POOL_MID: '#2a4a7a',
  POOL_LIGHT: '#3a6aaa',
  POOL_HIGHLIGHT: '#5a8acc',
  POOL_RIPPLE: '#6aaaee',

  // Grassland
  GRASS_DARK: '#1a3a1a',
  GRASS_MID: '#2a5a2a',
  GRASS_LIGHT: '#3a7a3a',
  GRASS_HIGHLIGHT: '#4a9a4a',
  GRASS_BURNING: '#cc5522',
  GRASS_SCORCHED: '#2a2420',

  // Barricade
  BARRICADE_STONE: '#5a5a6e',
  BARRICADE_STONE_DARK: '#2a2a3a',
  BARRICADE_STONE_LIGHT: '#7a7a8e',
  BARRICADE_MORTAR: '#3a3a4a',
  BARRICADE_CRACK: '#1a1a2a',

  // Fire element
  ELEMENT_FIRE: '#ff6622',
  ELEMENT_FIRE_LIGHT: '#ffaa44',

  // === 巴爾（火法師）深紅紫禮服 ===
  HERO_FIRE_ROBE: '#6a3a5a',     // 深紅紫禮服主色（魔王風格）
  HERO_FIRE_ROBE_DARK: '#4a2a3a',// 深紅紫陰影
  HERO_FIRE_ROBE_LIGHT: '#8a5a7a',// 深紅紫高光
  HERO_GEM_FIRE: '#ffaa44',      // 巴爾火焰寶石
};

// Trap definitions
DK.TRAP_TYPES = {
  // Floor traps
  SHOCK_PLATE: {
    id: 'shock_plate',
    name: '電擊板',
    description: '電擊敵人，潮濕時觸發感電',
    cost: 45,
    damage: 18,
    range: 0,
    cooldown: 1200,
    type: 'floor',
    element: 'electric',
    icon: 'shock_plate',
  },
  PUSH_TRAP: {
    id: 'push_trap',
    name: '推力陷阱',
    description: '定時推動敵人，可推入深淵秒殺',
    cost: 35,
    damage: 0,
    range: 0,
    cooldown: 3000,
    type: 'wall',
    pushForce: 2,
    icon: 'push_trap',
  },
  OIL_TRAP: {
    id: 'oil_trap',
    name: '油漬陷阱',
    description: '踩到時噴灑油漬，大幅緩速並附加油污',
    cost: 50,
    damage: 0,
    range: 0,
    cooldown: 4000,
    type: 'floor',
    element: null,
    oilDuration: 2000,
    oilSlowAmount: 0.4,
    icon: 'oil_trap',
  },
  WIND_TRAP: {
    id: 'wind_trap',
    name: '風壓陷阱',
    description: '釋放風壓推動敵人，冰凍印記觸發暴風雪',
    cost: 45,
    damage: 0,
    range: 0,
    cooldown: 3000,
    type: 'wall',
    pushForce: 1,
    element: 'ice',
    icon: 'wind_trap',
  },
};

// Evolution definitions (aura upgrade system)
DK.EVOLUTION_TYPES = {
  thunder_shock_plate: {
    baseTrap: 'shock_plate',
    name: '雷暴電擊板',
    cost: 60,
    requiredHeroElement: 'water',
    description: '連鎖範圍+2格、感電範圍+50%',
    chainRangeBonus: 2,
    electrocuteRangeBonus: 0.5,
  },
  inferno_oil_trap: {
    baseTrap: 'oil_trap',
    name: '油焰陷阱',
    cost: 80,
    requiredHeroElement: 'fire',
    description: '九宮格油沼、5秒持續、75%緩速、引爆眩暈1秒',
    oilDuration: 5000,
    oilSlowAmount: 0.25,
    igniteDamageBonus: 0.4,
    igniteDotBonus: 0.4,
    igniteRangeBonus: 0.5,
    stunDuration: 1000,
  },
  glacial_wind_trap: {
    baseTrap: 'wind_trap',
    name: '極寒風壓',
    cost: 70,
    requiredHeroElement: 'ice',
    description: '暴風雪×1.5、凍結+1秒、可推中型敵',
    blizzardMultiplier: 1.5,
    freezeBonus: 1000,
    pushMassBonus: 1,
  },
};

DK.AURA_PAIRS = {
  water: 'shock_plate',
  fire: 'oil_trap',
  ice: 'wind_trap',
};

// Enemy wave definitions
DK.ENEMY_TYPES = {
  GOBLIN: {
    id: 'goblin',
    name: '劍士',
    hp: 60,
    speed: 1.0,
    reward: 10,
    size: 0.7,
    mass: 1,
    heartDamage: 10,
  },
  SKELETON: {
    id: 'skeleton',
    name: '弓手',
    hp: 100,
    speed: 0.8,
    reward: 15,
    size: 0.85,
    mass: 2,
    heartDamage: 15,
  },
  ORC: {
    id: 'orc',
    name: '騎士',
    hp: 200,
    speed: 0.5,
    reward: 25,
    size: 1.0,
    mass: 3,
    heartDamage: 25,
  },
  SLIME: {
    id: 'slime',
    name: '盜賊',
    hp: 80,
    speed: 0.9,
    reward: 12,
    size: 0.65,
    mass: 1,
    splits: true,
    heartDamage: 5,
  },
};

// Door types
DK.DOOR_TYPES = {
  wooden: {
    name: '木門',
    maxHp: 100,
    defense: 5,
    cost: 50,
    color: '#6a5040',
    lockColor: '#4a3020', // 鎖定狀態顏色
  },
  iron: {
    name: '鐵門',
    maxHp: 300,
    defense: 15,
    cost: 150,
    color: '#5a5a6e',
    lockColor: '#3a3a4e',
  },
  magic: {
    name: '魔法門',
    maxHp: 500,
    defense: 30,
    cost: 300,
    color: '#aa44ff',
    lockColor: '#7a2acc',
  },
};

// Wave definitions
DK.WAVES = [
  { enemies: [{ type: 'GOBLIN', count: 10 }] },
  { enemies: [{ type: 'GOBLIN', count: 14 }] },
  { enemies: [{ type: 'GOBLIN', count: 8 }, { type: 'SKELETON', count: 6 }] },
  { enemies: [{ type: 'SKELETON', count: 10 }, { type: 'GOBLIN', count: 8 }] },
  { enemies: [{ type: 'ORC', count: 6 }, { type: 'GOBLIN', count: 10 }] },
  { enemies: [{ type: 'SLIME', count: 14 }] },
  { enemies: [{ type: 'ORC', count: 8 }, { type: 'SKELETON', count: 8 }] },
  { enemies: [{ type: 'GOBLIN', count: 15 }, { type: 'ORC', count: 6 }, { type: 'SLIME', count: 8 }] },
  { enemies: [{ type: 'SKELETON', count: 12 }, { type: 'ORC', count: 10 }] },
  { enemies: [{ type: 'ORC', count: 12 }, { type: 'SLIME', count: 12 }, { type: 'SKELETON', count: 8 }] },
];
