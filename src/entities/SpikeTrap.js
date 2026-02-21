/**
 * 尖刺陷阱（地面陷阱）- 地牢風格
 * 放置在空地（_）上，敵人經過時造成傷害
 */

import { GRID, COLORS } from '../config.js';

export default class SpikeTrap {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.damage = 25;
    this.cooldown = 500;
    this.lastAttackTime = 0;
    this.isActive = false;  // 動畫狀態

    // 計算像素位置
    this.x = gridX * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    this.y = gridY * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;

    // 繪製陷阱
    this.graphics = scene.add.graphics();
    this.draw();
  }

  draw() {
    this.graphics.clear();
    const g = this.graphics;
    const size = GRID.TILE_SIZE;

    // 底座（金屬板）
    g.fillStyle(0x3a3a3a, 1);
    g.fillRect(this.x - size / 2 + 2, this.y - size / 2 + 2, size - 4, size - 4);

    // 底座邊框
    g.lineStyle(1, 0x2a2a2a, 1);
    g.strokeRect(this.x - size / 2 + 2, this.y - size / 2 + 2, size - 4, size - 4);

    // 尖刺位置（3x3 格子）
    const spikePositions = [
      { dx: -8, dy: -8 }, { dx: 0, dy: -8 }, { dx: 8, dy: -8 },
      { dx: -8, dy: 0 },  { dx: 0, dy: 0 },  { dx: 8, dy: 0 },
      { dx: -8, dy: 8 },  { dx: 0, dy: 8 },  { dx: 8, dy: 8 }
    ];

    // 尖刺高度（動畫時更高）
    const spikeHeight = this.isActive ? 10 : 6;

    for (const pos of spikePositions) {
      const cx = this.x + pos.dx;
      const cy = this.y + pos.dy;

      // 尖刺主體（金屬灰）
      g.fillStyle(COLORS.spike, 1);
      g.beginPath();
      g.moveTo(cx, cy - spikeHeight);
      g.lineTo(cx - 3, cy + 2);
      g.lineTo(cx + 3, cy + 2);
      g.closePath();
      g.fillPath();

      // 尖刺高光（左邊）
      g.fillStyle(COLORS.spikeShine, 0.6);
      g.beginPath();
      g.moveTo(cx, cy - spikeHeight);
      g.lineTo(cx - 3, cy + 2);
      g.lineTo(cx - 1, cy + 1);
      g.lineTo(cx, cy - spikeHeight + 2);
      g.closePath();
      g.fillPath();
    }

    // 如果激活狀態，繪製血跡效果
    if (this.isActive) {
      g.fillStyle(0x8b0000, 0.6);
      g.fillCircle(this.x - 5, this.y + 3, 3);
      g.fillCircle(this.x + 6, this.y - 2, 2);
    }
  }

  update(time, enemies) {
    // 檢查冷卻
    if (time - this.lastAttackTime < this.cooldown) {
      return;
    }

    // 檢查是否有敵人在此格
    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const enemyGrid = enemy.getGridPosition();
      if (enemyGrid.x === this.gridX && enemyGrid.y === this.gridY) {
        // 造成傷害
        enemy.takeDamage(this.damage);
        this.lastAttackTime = time;

        // 攻擊視覺效果
        this.activateEffect();
        break;
      }
    }
  }

  activateEffect() {
    // 尖刺彈出效果
    this.isActive = true;
    this.draw();

    // 觸發特效
    if (this.scene.effectsManager) {
      this.scene.effectsManager.createSpikeEffect(this.x, this.y);
    }

    // 恢復正常狀態
    this.scene.time.delayedCall(200, () => {
      this.isActive = false;
      this.draw();
    });
  }

  destroy() {
    this.graphics.destroy();
  }
}
