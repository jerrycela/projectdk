/**
 * 火焰塔（牆壁陷阱）
 * 放置在牆壁（#）上，向範圍內所有敵人噴射火焰
 */

import { GRID, COLORS } from '../config.js';

export default class FireTrap {
  constructor(scene, gridX, gridY) {
    this.scene = scene;
    this.gridX = gridX;
    this.gridY = gridY;
    this.damage = 8;        // 較低傷害但是範圍攻擊
    this.range = 2;         // 較短範圍
    this.cooldown = 1200;   // 較長冷卻
    this.lastAttackTime = 0;
    this.isActive = false;
    this.animTime = 0;

    // 計算像素位置
    this.x = gridX * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    this.y = gridY * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;

    // 繪製陷阱
    this.graphics = scene.add.graphics();
    this.flameGraphics = scene.add.graphics();
    this.draw();
  }

  draw() {
    this.graphics.clear();
    const g = this.graphics;
    const size = GRID.TILE_SIZE;

    // 石頭底座
    g.fillStyle(0x4a4a4a, 1);
    g.fillRect(this.x - size / 2 + 2, this.y - size / 2 + 2, size - 4, size - 4);

    // 石頭紋理
    g.lineStyle(1, 0x3a3a3a, 0.5);
    g.beginPath();
    g.moveTo(this.x - 10, this.y - 5);
    g.lineTo(this.x + 10, this.y - 5);
    g.strokePath();
    g.beginPath();
    g.moveTo(this.x - 10, this.y + 5);
    g.lineTo(this.x + 10, this.y + 5);
    g.strokePath();

    // 火焰噴口（金屬）
    g.fillStyle(0x8b4513, 1);
    g.fillCircle(this.x, this.y, 10);
    g.fillStyle(0x2a2a2a, 1);
    g.fillCircle(this.x, this.y, 6);

    // 火焰核心（持續燃燒效果）
    const flicker = Math.sin(this.animTime * 15) * 0.3 + 0.7;
    g.fillStyle(0xff4500, flicker);
    g.fillCircle(this.x, this.y, 4);
    g.fillStyle(0xffa500, flicker * 0.8);
    g.fillCircle(this.x, this.y - 1, 2);

    // 射程指示
    g.lineStyle(1, 0xff4500, 0.15);
    g.strokeCircle(this.x, this.y, this.range * GRID.TILE_SIZE);

    // 邊框
    g.lineStyle(1, 0x000000, 0.5);
    g.strokeRect(this.x - size / 2 + 2, this.y - size / 2 + 2, size - 4, size - 4);
  }

  update(time, enemies) {
    this.animTime = time / 1000;
    this.draw();

    // 檢查冷卻
    if (time - this.lastAttackTime < this.cooldown) {
      return;
    }

    // 找出範圍內所有敵人
    const targetsInRange = [];

    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      const dx = enemy.x - this.x;
      const dy = enemy.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= this.range * GRID.TILE_SIZE) {
        targetsInRange.push(enemy);
      }
    }

    // 攻擊所有範圍內敵人
    if (targetsInRange.length > 0) {
      this.attack(targetsInRange);
      this.lastAttackTime = time;
    }
  }

  attack(enemies) {
    // 火焰噴發效果
    this.drawFlameEffect();

    // 對所有敵人造成傷害
    for (const enemy of enemies) {
      enemy.takeDamage(this.damage);

      // 火焰特效
      if (this.scene.effectsManager) {
        this.createFireHitEffect(enemy.x, enemy.y);
      }
    }
  }

  drawFlameEffect() {
    const g = this.flameGraphics;
    g.clear();

    // 火焰圓形擴散
    const range = this.range * GRID.TILE_SIZE;

    // 外層火焰
    g.fillStyle(0xff4500, 0.3);
    g.fillCircle(this.x, this.y, range);

    // 中層火焰
    g.fillStyle(0xffa500, 0.4);
    g.fillCircle(this.x, this.y, range * 0.7);

    // 內層火焰
    g.fillStyle(0xffff00, 0.3);
    g.fillCircle(this.x, this.y, range * 0.4);

    // 火焰消失動畫
    this.scene.tweens.add({
      targets: g,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        g.clear();
        g.setAlpha(1);
      }
    });
  }

  createFireHitEffect(x, y) {
    // 火焰粒子
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.graphics();
      const colors = [0xff4500, 0xffa500, 0xffff00];
      particle.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.8);
      particle.fillCircle(0, 0, 3 + Math.random() * 3);

      particle.x = x + (Math.random() - 0.5) * 10;
      particle.y = y;

      this.scene.tweens.add({
        targets: particle,
        y: y - 20 - Math.random() * 20,
        alpha: 0,
        scale: 0.5,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  destroy() {
    this.graphics.destroy();
    this.flameGraphics.destroy();
  }
}
