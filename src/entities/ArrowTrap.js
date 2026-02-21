/**
 * 箭塔陷阱（牆壁陷阱）- 地牢風格
 * 放置在牆壁（#）上，向範圍內敵人射箭
 */

import { GRID, COLORS } from '../config.js';

export default class ArrowTrap {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.damage = 15;
    this.range = 3;
    this.cooldown = 800;
    this.lastAttackTime = 0;
    this.targetAngle = 0;  // 瞄準角度

    // 計算像素位置
    this.x = gridX * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    this.y = gridY * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;

    // 繪製陷阱
    this.graphics = scene.add.graphics();
    this.arrowGraphics = scene.add.graphics();
    this.draw();
  }

  draw() {
    this.graphics.clear();
    const g = this.graphics;
    const size = GRID.TILE_SIZE;

    // 木質底座
    g.fillStyle(COLORS.arrow, 1);
    g.fillRect(this.x - size / 2 + 2, this.y - size / 2 + 2, size - 4, size - 4);

    // 木紋
    g.lineStyle(1, 0x4a3520, 0.5);
    g.beginPath();
    g.moveTo(this.x - 10, this.y - 8);
    g.lineTo(this.x + 10, this.y - 8);
    g.strokePath();
    g.beginPath();
    g.moveTo(this.x - 10, this.y);
    g.lineTo(this.x + 10, this.y);
    g.strokePath();
    g.beginPath();
    g.moveTo(this.x - 10, this.y + 8);
    g.lineTo(this.x + 10, this.y + 8);
    g.strokePath();

    // 金屬底盤
    g.fillStyle(COLORS.arrowMetal, 1);
    g.fillCircle(this.x, this.y, 8);

    // 金屬邊框
    g.lineStyle(2, 0x505050, 1);
    g.strokeCircle(this.x, this.y, 8);

    // 弩砲/發射器（指向目標方向）
    const dx = Math.cos(this.targetAngle) * 6;
    const dy = Math.sin(this.targetAngle) * 6;

    g.fillStyle(0x404040, 1);
    g.fillRect(this.x - 3 + dx * 0.5, this.y - 6 + dy * 0.5, 6, 4);

    // 中心瞄準點（紅色發光）
    g.fillStyle(0xff4444, 0.8);
    g.fillCircle(this.x, this.y, 3);

    // 射程指示（hover 時顯示，這裡只顯示淡淡的）
    g.lineStyle(1, 0xff4444, 0.1);
    g.strokeCircle(this.x, this.y, this.range * GRID.TILE_SIZE);

    // 邊框
    g.lineStyle(1, 0x000000, 0.5);
    g.strokeRect(this.x - size / 2 + 2, this.y - size / 2 + 2, size - 4, size - 4);
  }

  update(time, enemies) {
    // 檢查冷卻
    if (time - this.lastAttackTime < this.cooldown) {
      return;
    }

    // 找出範圍內最近的敵人
    let target = null;
    let minDist = Infinity;

    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.range * GRID.TILE_SIZE && dist < minDist) {
        minDist = dist;
        target = enemy;
      }
    }

    // 攻擊目標
    if (target) {
      // 更新瞄準角度
      this.targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
      this.draw();

      this.attack(target);
      this.lastAttackTime = time;
    }
  }

  attack(enemy) {
    // 造成傷害
    enemy.takeDamage(this.damage);

    // 繪製箭矢飛行效果
    this.drawArrow(enemy.x, enemy.y);

    // 命中特效
    if (this.scene.effectsManager) {
      this.scene.effectsManager.createArrowHitEffect(enemy.x, enemy.y);
    }
  }

  drawArrow(targetX, targetY) {
    const g = this.arrowGraphics;
    g.clear();

    // 計算箭矢角度
    const angle = Math.atan2(targetY - this.y, targetX - this.x);

    // 箭矢軌跡（漸層線）
    g.lineStyle(1, 0xcccccc, 0.3);
    g.beginPath();
    g.moveTo(this.x, this.y);
    g.lineTo(targetX, targetY);
    g.strokePath();

    // 箭矢本體
    const arrowLength = 12;
    const arrowX = targetX - Math.cos(angle) * arrowLength / 2;
    const arrowY = targetY - Math.sin(angle) * arrowLength / 2;

    // 箭桿
    g.lineStyle(2, 0x8b4513, 1);
    g.beginPath();
    g.moveTo(arrowX - Math.cos(angle) * arrowLength, arrowY - Math.sin(angle) * arrowLength);
    g.lineTo(arrowX, arrowY);
    g.strokePath();

    // 箭頭
    g.fillStyle(0xaaaaaa, 1);
    const headSize = 4;
    g.beginPath();
    g.moveTo(targetX, targetY);
    g.lineTo(
      targetX - Math.cos(angle - 0.4) * headSize * 2,
      targetY - Math.sin(angle - 0.4) * headSize * 2
    );
    g.lineTo(
      targetX - Math.cos(angle + 0.4) * headSize * 2,
      targetY - Math.sin(angle + 0.4) * headSize * 2
    );
    g.closePath();
    g.fillPath();

    // 箭矢消失
    this.scene.time.delayedCall(150, () => {
      g.clear();
    });
  }

  destroy() {
    this.graphics.destroy();
    this.arrowGraphics.destroy();
  }
}
