/**
 * 敵人類別 - 支援多種敵人類型
 */

import { GRID, COLORS } from '../config.js';

// 敵人類型定義
export const ENEMY_TYPES = {
  goblin: {
    name: '哥布林',
    hp: 80,
    speed: 80,
    gold: 5,
    size: 10,
    color: 0xc41e3a,
    outline: 0x8b0000
  },
  orc: {
    name: '獸人',
    hp: 200,
    speed: 50,
    gold: 15,
    size: 14,
    color: 0x2e8b57,
    outline: 0x1a5a3a
  },
  skeleton: {
    name: '骷髏',
    hp: 60,
    speed: 120,
    gold: 8,
    size: 9,
    color: 0xdcdcdc,
    outline: 0x808080
  },
  demon: {
    name: '惡魔',
    hp: 150,
    speed: 70,
    gold: 20,
    size: 12,
    color: 0x8b0000,
    outline: 0x4a0000
  },
  boss: {
    name: '地牢領主',
    hp: 500,
    speed: 40,
    gold: 100,
    size: 18,
    color: 0x4b0082,
    outline: 0x2a0052
  }
};

export default class Enemy {
  constructor(scene, path, type = 'goblin') {
    this.scene = scene;
    this.path = path;
    this.pathIndex = 0;
    this.alive = true;

    // 取得敵人類型配置
    const config = ENEMY_TYPES[type] || ENEMY_TYPES.goblin;
    this.type = type;
    this.speed = config.speed;
    this.size = config.size;
    this.color = config.color;
    this.outline = config.outline;
    this.goldReward = config.gold;

    // 血量系統
    this.maxHp = config.hp;
    this.hp = this.maxHp;

    // 移動方向
    this.direction = { x: 1, y: 0 };

    // 動畫計時
    this.animTime = 0;
    this.hurtFlash = 0;

    // 起始位置
    const start = path[0];
    this.x = start.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    this.y = start.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;

    // 繪製敵人
    this.graphics = scene.add.graphics();
    this.draw();
  }

  draw() {
    this.graphics.clear();
    const g = this.graphics;

    // 動畫偏移
    const wobble = Math.sin(this.animTime * 10) * 1.5;

    // 受傷閃爍
    const flashAlpha = this.hurtFlash > 0 ? 0.5 : 1;

    // 陰影
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(this.x, this.y + this.size, this.size + 4, 6);

    // 根據類型繪製不同外觀
    if (this.type === 'skeleton') {
      this.drawSkeleton(g, wobble, flashAlpha);
    } else if (this.type === 'orc') {
      this.drawOrc(g, wobble, flashAlpha);
    } else if (this.type === 'demon') {
      this.drawDemon(g, wobble, flashAlpha);
    } else if (this.type === 'boss') {
      this.drawBoss(g, wobble, flashAlpha);
    } else {
      this.drawGoblin(g, wobble, flashAlpha);
    }

    // 血條
    this.drawHealthBar(g);
  }

  drawGoblin(g, wobble, alpha) {
    // 身體
    g.fillStyle(this.color, alpha);
    g.fillCircle(this.x, this.y + wobble, this.size);
    g.lineStyle(2, this.outline, alpha);
    g.strokeCircle(this.x, this.y + wobble, this.size);

    // 尖耳朵
    g.fillStyle(this.color, alpha);
    g.fillTriangle(
      this.x - this.size, this.y - this.size / 2 + wobble,
      this.x - this.size + 4, this.y + wobble,
      this.x - this.size / 2, this.y - this.size / 3 + wobble
    );
    g.fillTriangle(
      this.x + this.size, this.y - this.size / 2 + wobble,
      this.x + this.size - 4, this.y + wobble,
      this.x + this.size / 2, this.y - this.size / 3 + wobble
    );

    // 眼睛
    this.drawEyes(g, wobble, 3);
  }

  drawOrc(g, wobble, alpha) {
    // 大型身體
    g.fillStyle(this.color, alpha);
    g.fillCircle(this.x, this.y + wobble, this.size);
    g.lineStyle(2, this.outline, alpha);
    g.strokeCircle(this.x, this.y + wobble, this.size);

    // 獠牙
    g.fillStyle(0xffffff, alpha);
    g.fillTriangle(
      this.x - 4, this.y + 4 + wobble,
      this.x - 2, this.y + 10 + wobble,
      this.x - 6, this.y + 6 + wobble
    );
    g.fillTriangle(
      this.x + 4, this.y + 4 + wobble,
      this.x + 2, this.y + 10 + wobble,
      this.x + 6, this.y + 6 + wobble
    );

    // 眼睛
    this.drawEyes(g, wobble, 4, 0xff0000);
  }

  drawSkeleton(g, wobble, alpha) {
    // 頭顱
    g.fillStyle(this.color, alpha);
    g.fillCircle(this.x, this.y + wobble, this.size);
    g.lineStyle(1, this.outline, alpha);
    g.strokeCircle(this.x, this.y + wobble, this.size);

    // 骷髏眼眶（黑洞）
    g.fillStyle(0x000000, alpha);
    g.fillCircle(this.x - 3, this.y - 1 + wobble, 3);
    g.fillCircle(this.x + 3, this.y - 1 + wobble, 3);

    // 眼中紅光
    g.fillStyle(0xff0000, alpha * 0.8);
    g.fillCircle(this.x - 3, this.y - 1 + wobble, 1);
    g.fillCircle(this.x + 3, this.y - 1 + wobble, 1);

    // 鼻子（三角形洞）
    g.fillStyle(0x000000, alpha);
    g.fillTriangle(
      this.x, this.y + 2 + wobble,
      this.x - 2, this.y + 5 + wobble,
      this.x + 2, this.y + 5 + wobble
    );

    // 牙齒
    g.lineStyle(1, 0x000000, alpha);
    for (let i = -3; i <= 3; i += 2) {
      g.beginPath();
      g.moveTo(this.x + i, this.y + 6 + wobble);
      g.lineTo(this.x + i, this.y + 8 + wobble);
      g.strokePath();
    }
  }

  drawDemon(g, wobble, alpha) {
    // 身體
    g.fillStyle(this.color, alpha);
    g.fillCircle(this.x, this.y + wobble, this.size);
    g.lineStyle(2, this.outline, alpha);
    g.strokeCircle(this.x, this.y + wobble, this.size);

    // 角
    g.fillStyle(0x2a0000, alpha);
    g.fillTriangle(
      this.x - 6, this.y - this.size + wobble,
      this.x - 4, this.y - this.size - 8 + wobble,
      this.x - 2, this.y - this.size + 2 + wobble
    );
    g.fillTriangle(
      this.x + 6, this.y - this.size + wobble,
      this.x + 4, this.y - this.size - 8 + wobble,
      this.x + 2, this.y - this.size + 2 + wobble
    );

    // 發光眼睛
    g.fillStyle(0xffff00, alpha);
    g.fillCircle(this.x - 4, this.y - 2 + wobble, 3);
    g.fillCircle(this.x + 4, this.y - 2 + wobble, 3);
    g.fillStyle(0xff0000, alpha);
    g.fillCircle(this.x - 4, this.y - 2 + wobble, 1.5);
    g.fillCircle(this.x + 4, this.y - 2 + wobble, 1.5);
  }

  drawBoss(g, wobble, alpha) {
    // 光環效果
    const pulse = Math.sin(this.animTime * 5) * 0.3 + 0.7;
    g.lineStyle(3, 0x9932cc, alpha * pulse * 0.5);
    g.strokeCircle(this.x, this.y + wobble, this.size + 6);

    // 大型身體
    g.fillStyle(this.color, alpha);
    g.fillCircle(this.x, this.y + wobble, this.size);
    g.lineStyle(3, this.outline, alpha);
    g.strokeCircle(this.x, this.y + wobble, this.size);

    // 皇冠
    g.fillStyle(0xffd700, alpha);
    g.fillRect(this.x - 8, this.y - this.size - 4 + wobble, 16, 6);
    g.fillTriangle(
      this.x - 8, this.y - this.size - 4 + wobble,
      this.x - 6, this.y - this.size - 10 + wobble,
      this.x - 4, this.y - this.size - 4 + wobble
    );
    g.fillTriangle(
      this.x - 2, this.y - this.size - 4 + wobble,
      this.x, this.y - this.size - 12 + wobble,
      this.x + 2, this.y - this.size - 4 + wobble
    );
    g.fillTriangle(
      this.x + 4, this.y - this.size - 4 + wobble,
      this.x + 6, this.y - this.size - 10 + wobble,
      this.x + 8, this.y - this.size - 4 + wobble
    );

    // 寶石
    g.fillStyle(0xff0000, alpha);
    g.fillCircle(this.x, this.y - this.size - 8 + wobble, 2);

    // 邪惡眼睛
    g.fillStyle(0xff0000, alpha);
    g.fillCircle(this.x - 5, this.y - 3 + wobble, 4);
    g.fillCircle(this.x + 5, this.y - 3 + wobble, 4);
    g.fillStyle(0xffff00, alpha);
    g.fillCircle(this.x - 5, this.y - 3 + wobble, 2);
    g.fillCircle(this.x + 5, this.y - 3 + wobble, 2);
  }

  drawEyes(g, wobble, eyeSize = 3, pupilColor = 0x000000) {
    const eyeOffsetX = this.direction.x * 3;
    const eyeOffsetY = this.direction.y * 2;

    // 眼白
    g.fillStyle(0xFFFFFF, 1);
    g.fillCircle(this.x - 3 + eyeOffsetX, this.y - 2 + wobble + eyeOffsetY, eyeSize);
    g.fillCircle(this.x + 3 + eyeOffsetX, this.y - 2 + wobble + eyeOffsetY, eyeSize);

    // 瞳孔
    g.fillStyle(pupilColor, 1);
    g.fillCircle(this.x - 3 + eyeOffsetX * 1.5, this.y - 2 + wobble + eyeOffsetY, eyeSize * 0.5);
    g.fillCircle(this.x + 3 + eyeOffsetX * 1.5, this.y - 2 + wobble + eyeOffsetY, eyeSize * 0.5);
  }

  drawHealthBar(g) {
    const barWidth = Math.max(24, this.size * 2);
    const barY = this.y - this.size - 12;

    // 血條背景
    g.fillStyle(COLORS.enemyHpBg, 1);
    g.fillRect(this.x - barWidth / 2, barY, barWidth, 5);

    // 血條邊框
    g.lineStyle(1, 0x000000, 0.5);
    g.strokeRect(this.x - barWidth / 2, barY, barWidth, 5);

    // 血條
    const hpPercent = this.hp / this.maxHp;
    let hpColor;
    if (hpPercent > 0.5) {
      hpColor = COLORS.enemyHpHigh;
    } else if (hpPercent > 0.25) {
      hpColor = COLORS.enemyHpMid;
    } else {
      hpColor = COLORS.enemyHpLow;
    }

    g.fillStyle(hpColor, 1);
    g.fillRect(this.x - barWidth / 2 + 1, barY + 1, (barWidth - 2) * hpPercent, 3);

    // Boss 顯示名稱
    if (this.type === 'boss') {
      // 名稱會由場景另外處理
    }
  }

  takeDamage(amount) {
    if (!this.alive) return;

    this.hp -= amount;
    this.hurtFlash = 0.1;

    // 發送傷害事件（用於顯示傷害數字）
    this.scene.events.emit('enemyDamaged', {
      x: this.x,
      y: this.y - this.size,
      damage: amount
    });

    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    } else {
      this.draw();
    }
  }

  die() {
    this.alive = false;

    // 死亡動畫效果
    this.scene.tweens.add({
      targets: this.graphics,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 0.5,
      duration: 200,
      onComplete: () => {
        this.graphics.destroy();
      }
    });

    // 傳遞金幣獎勵
    this.scene.events.emit('enemyDied', this, this.goldReward);
  }

  update(delta) {
    if (!this.alive) return;

    // 更新動畫計時
    this.animTime += delta / 1000;

    // 更新受傷閃爍
    if (this.hurtFlash > 0) {
      this.hurtFlash -= delta / 1000;
    }

    // 已到達終點
    if (this.pathIndex >= this.path.length - 1) {
      this.reachEnd();
      return;
    }

    // 取得目標點
    const target = this.path[this.pathIndex + 1];
    const targetX = target.x * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;
    const targetY = target.y * GRID.TILE_SIZE + GRID.TILE_SIZE / 2;

    // 計算移動
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 更新朝向
    if (dist > 0) {
      this.direction.x = dx / dist;
      this.direction.y = dy / dist;
    }

    if (dist < 2) {
      this.pathIndex++;
      this.x = targetX;
      this.y = targetY;
    } else {
      const moveSpeed = this.speed * (delta / 1000);
      this.x += (dx / dist) * moveSpeed;
      this.y += (dy / dist) * moveSpeed;
    }

    this.draw();
  }

  reachEnd() {
    this.alive = false;
    this.graphics.destroy();
    this.scene.events.emit('enemyReachedEnd', this);
  }

  destroy() {
    this.alive = false;
    if (this.graphics) {
      this.graphics.destroy();
    }
  }

  getGridPosition() {
    return {
      x: Math.floor(this.x / GRID.TILE_SIZE),
      y: Math.floor(this.y / GRID.TILE_SIZE)
    };
  }
}
