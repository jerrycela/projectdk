/**
 * 遊戲常數配置
 */

// 網格設定
export const GRID = {
  COLS: 20,
  ROWS: 15,
  TILE_SIZE: 32
};

// 地圖符號定義
export const TILE_TYPES = {
  '#': 'wall',      // 牆壁 - 可放牆壁陷阱
  '.': 'path',      // 路徑 - 敵人行走
  '_': 'ground',    // 空地 - 可放地面陷阱
  'S': 'spawn',     // 敵人出生點
  'E': 'exit'       // 終點（基地）
};

// 顏色定義（臨時美術）
export const COLORS = {
  wall: 0x333333,       // 深灰 - 牆壁
  path: 0x8B4513,       // 棕色 - 路徑
  ground: 0x228B22,     // 綠色 - 可建造
  spawn: 0xFF6600,      // 橙色 - 出生點
  exit: 0x0066FF,       // 藍色 - 終點
  enemy: 0xFF0000,      // 紅色 - 敵人
  spike: 0xC0C0C0,      // 銀色 - 尖刺
  arrow: 0x8B0000       // 暗紅 - 箭塔
};
