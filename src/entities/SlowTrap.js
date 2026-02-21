/**
 * 減速陷阱（地面陷阱）
 * 放置在空地（_）上，減慢敵人移動速度
 */

import { GRID, COLORS } from '../config.js';

export default class SlowTrap {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.slowAmount = 0.5;  // 減速 50%
    this.duration = 2000;   // 效果持續 2 秒
    this.cooldown = 500;
    this.lastAttackTime = 0;
    this.isActive = false;
    this.animTime = 0;

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

    // 冰霜底座
    g.fillStyle(0x1a3a5a, 1);
    g.fillRect(this.x - size / 2 + 2, this.y - size / 2 + 2, size - 4, size - 4);

    // 冰霜紋理
    g.lineStyle(1, 0x3a6a9a, 0.6);
    // 六邊形冰晶圖案
    const cx = this.x;
    const cy = this.y;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const nextAngle = ((i + 1) / 6) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(angle) * 10, cy + Math.sin(angle) * 10);
      g.lineTo(cx + Math.cos(nextAngle) * 10, cy + Math.sin(nextAngle) * 10);
      g.strokePath();
    }

    // 中心冰晶
    g.fillStyle(0x87ceeb, 0.8);
    g.fillCircle(this.x, this.y, 6);

    // 激活時的冰霜效果
    if (this.isActive) {
      g.lineStyle(2, 0x87ceeb, 0.8);
      const pulseSize = 8 + Math.sin(this.animTime * 8) * 4;
      g.strokeCircle(this.x, this.y, pulseSize);

      // 冰霜粒子
      g.fillStyle(0xadd8e6, 0.6);
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + this.animTime * 2;
        const px = this.x + Math.cos(angle) * 10;
        const py = this.y + Math.sin(angle) * 10;
        g.fillCircle(px, py, 2);
      }
    }

    // 邊框
    g.lineStyle(1, 0x4a8aba, 0.8);
    g.strokeRect(this.x - size / 2 + 2, this.y - size / 2 + 2, size - 4, size - 4);
  }

  update(time, enemies) {
    this.animTime = time / 1000;

    // 檢查冷卻
    if (time - this.lastAttackTime < this.cooldown) {
      if (this.isActive) this.draw();
      return;
    }

    // 檢查是否有敵人在此格
    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const enemyGrid = enemy.getGridPosition();
      if (enemyGrid.x === this.gridX && enemyGrid.y === this.gridY) {
        // 施加減速效果
        this.applySlowEffect(enemy);
        this.lastAttackTime = time;
        this.activateEffect();
        break;
      }
    }

    if (this.isActive) this.draw();
  }

  applySlowEffect(enemy) {
    // 如果敵人沒有原始速度記錄，記錄下來
    if (!enemy.originalSpeed) {
      enemy.originalSpeed = enemy.speed;
    }

    // 減速
    enemy.speed = enemy.originalSpeed * this.slowAmount;

    // 視覺效果：敵人變藍
    if (enemy.graphics) {
      enemy.graphics.setTint(0x87ceeb);
    }

    // 恢復速度
    this.scene.time.delayedCall(this.duration, () => {
      if (enemy.alive) {
        enemy.speed = enemy.originalSpeed;
        if (enemy.graphics) {
          enemy.graphics.clearTint();
        }
      }
    });
  }

  activateEffect() {
    this.isActive = true;
    this.draw();

    this.scene.time.delayedCall(300, () => {
      this.isActive = false;
      this.draw();
    });
  }

  destroy() {
    this.graphics.destroy();
  }
}
