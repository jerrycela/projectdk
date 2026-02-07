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
  STARTING_LIVES: 20,
  WAVE_DELAY: 5000,
  ENEMY_SPAWN_INTERVAL: 500,

  // FPS
  TARGET_FPS: 60,
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

  // Enemies
  GOBLIN_SKIN: '#44aa44',
  GOBLIN_DARK: '#2a7a2a',
  GOBLIN_EYE: '#ff4444',
  SKELETON_BONE: '#d8d0c0',
  SKELETON_DARK: '#a89880',
  SKELETON_EYE: '#ff2200',
  ORC_SKIN: '#8a6040',
  ORC_DARK: '#6a4020',
  ORC_ARMOR: '#606870',
  SLIME_BODY: '#4488cc',
  SLIME_LIGHT: '#66aaee',
  SLIME_DARK: '#2266aa',
  SLIME_EYE: '#ffffff',

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

  // Heroes
  HERO_ROBE: '#2244aa',
  HERO_ROBE_DARK: '#1a3388',
  HERO_ROBE_LIGHT: '#3355cc',
  HERO_SKIN: '#e8d0b0',
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

  // Blast trap
  TRAP_BLAST_BODY: '#5a3020',
  TRAP_BLAST_CORE: '#aa4422',
  TRAP_BLAST_GLOW: '#ff6633',
  TRAP_BLAST_FUSE: '#cc8844',

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

  // Fire element
  ELEMENT_FIRE: '#ff6622',
  ELEMENT_FIRE_LIGHT: '#ffaa44',

  // Ice element
  ELEMENT_ICE: '#88ccff',
  ELEMENT_ICE_LIGHT: '#aaddff',
  ELEMENT_ICE_DARK: '#4488cc',

  // Heroes - Fire mage
  HERO_FIRE_ROBE: '#aa3322',
  HERO_FIRE_ROBE_DARK: '#882211',
  HERO_FIRE_ROBE_LIGHT: '#cc4433',

  // Heroes - Ice mage
  HERO_ICE_ROBE: '#4488aa',
  HERO_ICE_ROBE_DARK: '#336688',
  HERO_ICE_ROBE_LIGHT: '#55aacc',
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
  BLAST_TRAP: {
    id: 'blast_trap',
    name: '爆破陷阱',
    description: '踩到時爆炸，灼印敵人觸發烈焰引爆',
    cost: 60,
    damage: 40,
    range: 1.5,
    cooldown: 3000,
    type: 'floor',
    element: 'fire',
    icon: 'blast_trap',
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
  seismic_blast_trap: {
    baseTrap: 'blast_trap',
    name: '震爆陷阱',
    cost: 80,
    requiredHeroElement: 'fire',
    description: '擊退2格、1秒眩暈波、範圍+30%',
    knockbackTiles: 2,
    stunDuration: 1000,
    rangeBonus: 0.3,
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
  fire: 'blast_trap',
  ice: 'wind_trap',
};

// Enemy wave definitions
DK.ENEMY_TYPES = {
  GOBLIN: {
    id: 'goblin',
    name: '哥布林',
    hp: 60,
    speed: 1.2,
    reward: 10,
    size: 0.7,
    mass: 1,
  },
  SKELETON: {
    id: 'skeleton',
    name: '骷髏',
    hp: 100,
    speed: 0.8,
    reward: 15,
    size: 0.85,
    mass: 2,
  },
  ORC: {
    id: 'orc',
    name: '獸人',
    hp: 200,
    speed: 0.5,
    reward: 25,
    size: 1.0,
    mass: 3,
  },
  SLIME: {
    id: 'slime',
    name: '史萊姆',
    hp: 80,
    speed: 0.9,
    reward: 12,
    size: 0.65,
    mass: 1,
    splits: true,
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
