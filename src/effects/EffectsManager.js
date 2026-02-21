/**
 * 特效管理器 - 處理各種視覺特效
 */

export default class EffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];

    // 監聽傷害事件
    scene.events.on('enemyDamaged', this.showDamageNumber, this);
  }

  /**
   * 顯示傷害數字
   */
  showDamageNumber(data) {
    const { x, y, damage } = data;

    // 隨機偏移
    const offsetX = (Math.random() - 0.5) * 20;

    const text = this.scene.add.text(x + offsetX, y, `-${damage}`, {
      fontSize: damage >= 50 ? '18px' : '14px',
      color: damage >= 50 ? '#ff4444' : '#ffaa00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    // 上浮並淡出
    this.scene.tweens.add({
      targets: text,
      y: y - 30,
      alpha: 0,
      scale: damage >= 50 ? 1.3 : 1,
      duration: 600,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  /**
   * 建立血液飛濺效果
   */
  createBloodSplash(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0x8b0000, 1);
      particle.fillCircle(0, 0, 2 + Math.random() * 2);

      particle.x = x;
      particle.y = y;

      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 50;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 30;

      this.scene.tweens.add({
        targets: particle,
        x: x + vx,
        y: y + vy + 30,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * 建立火花效果（用於箭矢命中）
   */
  createSparks(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(0xffaa00, 1);
      particle.fillCircle(0, 0, 1 + Math.random() * 2);

      particle.x = x;
      particle.y = y;

      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 40;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particle,
        x: x + vx,
        y: y + vy,
        alpha: 0,
        scale: 0.5,
        duration: 300,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
  }

  /**
   * 建立尖刺觸發效果
   */
  createSpikeEffect(x, y) {
    // 血液飛濺
    this.createBloodSplash(x, y, 8);

    // 震動效果
    const shakeX = (Math.random() - 0.5) * 4;
    const shakeY = (Math.random() - 0.5) * 4;

    this.scene.cameras.main.shake(100, 0.005);
  }

  /**
   * 建立箭矢命中效果
   */
  createArrowHitEffect(x, y) {
    this.createSparks(x, y, 6);
    this.createBloodSplash(x, y, 3);
  }

  /**
   * 建立死亡爆炸效果
   */
  createDeathEffect(x, y, size = 10, color = 0xc41e3a) {
    // 靈魂飄散效果
    for (let i = 0; i < 8; i++) {
      const ghost = this.scene.add.graphics();
      ghost.fillStyle(color, 0.6);
      ghost.fillCircle(0, 0, size / 3);

      ghost.x = x;
      ghost.y = y;

      const angle = (i / 8) * Math.PI * 2;
      const distance = size * 2;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance - 20;

      this.scene.tweens.add({
        targets: ghost,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: 'Power2',
        onComplete: () => ghost.destroy()
      });
    }

    // 中心爆發
    const burst = this.scene.add.graphics();
    burst.fillStyle(0xffffff, 0.8);
    burst.fillCircle(x, y, size / 2);

    this.scene.tweens.add({
      targets: burst,
      scaleX: 3,
      scaleY: 3,
      alpha: 0,
      duration: 200,
      onComplete: () => burst.destroy()
    });
  }

  /**
   * 建立 Boss 出現效果
   */
  createBossAppearEffect(x, y) {
    // 紫色光環
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(3, 0x9932cc, 1);
      ring.strokeCircle(x, y, 10);

      this.scene.tweens.add({
        targets: ring,
        scaleX: 4 + i,
        scaleY: 4 + i,
        alpha: 0,
        duration: 800,
        delay: i * 200,
        onComplete: () => ring.destroy()
      });
    }

    // 閃電效果
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 0.5);
    flash.fillRect(0, 0, 640, 480);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    });

    // 震動
    this.scene.cameras.main.shake(300, 0.01);
  }

  /**
   * 建立金幣收集效果
   */
  createCoinEffect(x, y, amount) {
    const coinCount = Math.min(amount / 5, 10);

    for (let i = 0; i < coinCount; i++) {
      const coin = this.scene.add.graphics();
      coin.fillStyle(0xffd700, 1);
      coin.fillCircle(0, 0, 4);
      coin.fillStyle(0xb8860b, 1);
      coin.fillCircle(-1, -1, 2);

      coin.x = x + (Math.random() - 0.5) * 20;
      coin.y = y;

      // 金幣彈跳到狀態欄
      this.scene.tweens.add({
        targets: coin,
        x: 45,
        y: 17,
        duration: 600 + i * 100,
        ease: 'Power2',
        onComplete: () => coin.destroy()
      });
    }
  }

  destroy() {
    this.scene.events.off('enemyDamaged', this.showDamageNumber, this);
  }
}
