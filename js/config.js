/**
 * Dungeon Keep - Configuration
 */
window.DK = window.DK || {};

DK.CONFIG = {
  // Tile sizes
  TILE_SIZE: 16,        // Pixel art tile size
  SCALE: 3,             // Display scale factor
  DISPLAY_TILE: 48,     // TILE_SIZE * SCALE

  // Grid dimensions
  GRID_COLS: 20,
  GRID_ROWS: 13,

  // Canvas sizes
  GAME_WIDTH: 320,      // 20 * 16
  GAME_HEIGHT: 208,     // 13 * 16
  DISPLAY_WIDTH: 960,   // 320 * 3
  DISPLAY_HEIGHT: 720,  // Includes UI area

  // UI area
  UI_TOP: 624,          // 208 * 3 = 624
  UI_HEIGHT: 96,

  // Game settings
  STARTING_GOLD: 150,
  STARTING_LIVES: 20,
  WAVE_DELAY: 5000,
  ENEMY_SPAWN_INTERVAL: 800,

  // FPS
  TARGET_FPS: 60,
};

// Color Palette - Dungeon Theme
DK.COLORS = {
  // Walls
  WALL_DARK: '#1e1633',
  WALL_MID: '#2d2447',
  WALL_LIGHT: '#3f345e',
  WALL_HIGHLIGHT: '#574b78',
  WALL_MORTAR: '#140e24',
  WALL_MOSS: '#2a4a2a',

  // Floors
  FLOOR_DARK: '#4a4236',
  FLOOR_MID: '#5e5648',
  FLOOR_LIGHT: '#72695a',
  FLOOR_HIGHLIGHT: '#8a806e',
  FLOOR_CRACK: '#3a3428',

  // Path markers
  PATH_ARROW: '#6e6655',

  // Traps - Wall mounted
  TRAP_METAL: '#7888a0',
  TRAP_METAL_LIGHT: '#98a8c0',
  TRAP_METAL_DARK: '#586878',
  TRAP_FIRE: '#ff6622',
  TRAP_FIRE_GLOW: '#ffaa44',
  TRAP_ICE: '#44aaff',
  TRAP_ICE_GLOW: '#88ccff',
  TRAP_ARROW_WOOD: '#8b6914',
  TRAP_ARROW_TIP: '#c0c8d0',

  // Traps - Floor
  TRAP_SPIKE: '#a0a8b8',
  TRAP_SPIKE_TIP: '#d0d8e0',
  TRAP_TAR: '#1a1a2a',
  TRAP_TAR_HIGHLIGHT: '#2a2a3a',
  TRAP_BOMB_BODY: '#4a4a4a',
  TRAP_BOMB_FUSE: '#c8a050',
  TRAP_BOMB_SPARK: '#ffdd66',

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
};

// Trap definitions
DK.TRAP_TYPES = {
  // Wall-mounted traps
  ARROW_TOWER: {
    id: 'arrow_tower',
    name: '箭塔',
    description: '發射箭矢攻擊敵人',
    cost: 30,
    damage: 15,
    range: 3,
    cooldown: 1000,
    type: 'wall',
    icon: 'arrow',
  },
  FLAME_JET: {
    id: 'flame_jet',
    name: '火焰噴射',
    description: '噴射火焰造成範圍傷害',
    cost: 50,
    damage: 25,
    range: 2,
    cooldown: 2000,
    type: 'wall',
    icon: 'flame',
  },
  ICE_TRAP: {
    id: 'ice_trap',
    name: '冰凍陷阱',
    description: '減緩敵人移動速度',
    cost: 40,
    damage: 5,
    range: 2,
    cooldown: 1500,
    type: 'wall',
    slowAmount: 0.5,
    slowDuration: 2000,
    icon: 'ice',
  },
  // Floor traps
  FLOOR_SPIKES: {
    id: 'floor_spikes',
    name: '地刺',
    description: '對經過的敵人造成傷害',
    cost: 20,
    damage: 20,
    range: 0,
    cooldown: 800,
    type: 'floor',
    icon: 'spike',
  },
  TAR_TRAP: {
    id: 'tar_trap',
    name: '焦油陷阱',
    description: '大幅減緩敵人速度',
    cost: 25,
    damage: 0,
    range: 0,
    cooldown: 500,
    type: 'floor',
    slowAmount: 0.3,
    slowDuration: 3000,
    icon: 'tar',
  },
  BOMB_TRAP: {
    id: 'bomb_trap',
    name: '炸彈',
    description: '爆炸造成大範圍傷害',
    cost: 60,
    damage: 50,
    range: 1.5,
    cooldown: 3000,
    type: 'floor',
    icon: 'bomb',
  },
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
  },
  SKELETON: {
    id: 'skeleton',
    name: '骷髏',
    hp: 100,
    speed: 0.8,
    reward: 15,
    size: 0.85,
  },
  ORC: {
    id: 'orc',
    name: '獸人',
    hp: 200,
    speed: 0.5,
    reward: 25,
    size: 1.0,
  },
  SLIME: {
    id: 'slime',
    name: '史萊姆',
    hp: 80,
    speed: 0.9,
    reward: 12,
    size: 0.65,
    splits: true,
  },
};

// Wave definitions
DK.WAVES = [
  { enemies: [{ type: 'GOBLIN', count: 5 }] },
  { enemies: [{ type: 'GOBLIN', count: 8 }] },
  { enemies: [{ type: 'GOBLIN', count: 5 }, { type: 'SKELETON', count: 3 }] },
  { enemies: [{ type: 'SKELETON', count: 6 }, { type: 'GOBLIN', count: 4 }] },
  { enemies: [{ type: 'ORC', count: 3 }, { type: 'GOBLIN', count: 6 }] },
  { enemies: [{ type: 'SLIME', count: 8 }] },
  { enemies: [{ type: 'ORC', count: 5 }, { type: 'SKELETON', count: 5 }] },
  { enemies: [{ type: 'GOBLIN', count: 10 }, { type: 'ORC', count: 3 }, { type: 'SLIME', count: 5 }] },
  { enemies: [{ type: 'SKELETON', count: 8 }, { type: 'ORC', count: 6 }] },
  { enemies: [{ type: 'ORC', count: 8 }, { type: 'SLIME', count: 8 }, { type: 'SKELETON', count: 5 }] },
];
