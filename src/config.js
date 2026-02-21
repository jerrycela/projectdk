/**
 * 遊戲常數配置 - 地牢風格
 */

// 網格設定
export const GRID = {
  COLS: 20,
  ROWS: 15,
  TILE_SIZE: 32
};

// 地圖符號定義
export const TILE_TYPES = {
  '#': 'wall',
  '.': 'path',
  '_': 'ground',
  'S': 'spawn',
  'E': 'exit'
};

// 地牢風格顏色
export const COLORS = {
  // 地形
  wall: 0x2d2d2d,
  wallLight: 0x3d3d3d,
  wallDark: 0x1a1a1a,
  path: 0x4a3728,
  pathLight: 0x5c4433,
  ground: 0x3d5c3d,
  groundLight: 0x4a6b4a,
  spawn: 0x8b4513,
  exit: 0x4169e1,

  // 敵人
  enemy: 0xc41e3a,
  enemyOutline: 0x8b0000,
  enemyHpBg: 0x1a1a1a,
  enemyHpHigh: 0x32cd32,
  enemyHpMid: 0xffa500,
  enemyHpLow: 0xff4444,

  // 陷阱
  spike: 0x708090,
  spikeShine: 0xb0b0b0,
  arrow: 0x654321,
  arrowMetal: 0x808080,
  slow: 0x87ceeb,
  fire: 0xff4500,

  // UI
  uiBg: 0x1a1a1a,
  uiBorder: 0x444444,
  uiText: 0xcccccc,
  gold: 0xffd700,

  // 背景
  background: 0x0d0d0d
};

// 遊戲設定（平衡調整）
export const GAME_CONFIG = {
  initialGold: 150,     // 增加初始金幣
  baseHp: 25,           // 增加基地血量
  waveReward: 75        // 增加波次獎勵
};

// 陷阱設定
export const TRAP_CONFIG = {
  spike: {
    cost: 10,
    damage: 30,         // 提升傷害
    cooldown: 500
  },
  slow: {
    cost: 15,
    slowAmount: 0.4,    // 減速 60%
    duration: 2500,     // 持續 2.5 秒
    cooldown: 500
  },
  arrow: {
    cost: 25,
    damage: 20,         // 提升傷害
    range: 3,
    cooldown: 700       // 縮短冷卻
  },
  fire: {
    cost: 40,
    damage: 12,         // 範圍傷害
    range: 2,
    cooldown: 1000
  }
};

// 敵人設定
export const ENEMY_CONFIG = {
  goblin: {
    hp: 60,
    speed: 85,
    gold: 5
  },
  skeleton: {
    hp: 45,
    speed: 130,
    gold: 8
  },
  orc: {
    hp: 180,
    speed: 55,
    gold: 15
  },
  demon: {
    hp: 120,
    speed: 75,
    gold: 20
  },
  boss: {
    hp: 400,
    speed: 45,
    gold: 100
  }
};
