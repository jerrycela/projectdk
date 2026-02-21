/**
 * 主遊戲場景
 */

import { GRID, COLORS, TILE_TYPES } from '../config.js';
import { LEVEL_1, findSpawnPoint, findExitPoint } from '../map/level1.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    // 繪製地圖
    this.drawMap();

    // 顯示起點和終點資訊
    const spawn = findSpawnPoint(LEVEL_1);
    const exit = findExitPoint(LEVEL_1);
    console.log('起點:', spawn);
    console.log('終點:', exit);
  }

  drawMap() {
    const map = LEVEL_1;

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const char = map[y][x];
        const tileType = TILE_TYPES[char];
        const color = COLORS[tileType] || 0x000000;

        // 繪製格子
        const graphics = this.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillRect(
          x * GRID.TILE_SIZE,
          y * GRID.TILE_SIZE,
          GRID.TILE_SIZE,
          GRID.TILE_SIZE
        );

        // 繪製格線
        graphics.lineStyle(1, 0x000000, 0.3);
        graphics.strokeRect(
          x * GRID.TILE_SIZE,
          y * GRID.TILE_SIZE,
          GRID.TILE_SIZE,
          GRID.TILE_SIZE
        );
      }
    }
  }

  update() {
    // 遊戲迴圈（目前為空）
  }
}
