/**
 * Dungeon Keep - Game Data Definitions
 * 陷阱、進化、敵人、門、波次定義
 */

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
    igniteDamageBonus: 0.25,
    igniteDotBonus: 0.25,
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
  TROLL: {
    id: 'troll',
    name: '巨魔',
    hp: 350,
    speed: 0.35,
    reward: 40,
    size: 1.2,
    mass: 4,
    heartDamage: 35,
  },
  DARK_KNIGHT: {
    id: 'dark_knight',
    name: '暗騎士',
    hp: 500,
    speed: 0.4,
    reward: 60,
    size: 1.1,
    mass: 3,
    heartDamage: 50,
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
    lockColor: '#4a3020',
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

// Map Object definitions (multi-tile placeable objects)
// Tile codes: digits 1-8 (single char per tile in layout)
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
