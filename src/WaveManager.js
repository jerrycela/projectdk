/**
 * 波次管理器 - 進階波次設計
 */

// 波次配置：8 波漸進難度
const WAVES = [
  {
    name: '偵查小隊',
    enemies: [
      { type: 'goblin', count: 4 }
    ],
    interval: 2200
  },
  {
    name: '骷髏先鋒',
    enemies: [
      { type: 'goblin', count: 3 },
      { type: 'skeleton', count: 4 }
    ],
    interval: 2000
  },
  {
    name: '哥布林大軍',
    enemies: [
      { type: 'goblin', count: 8 },
      { type: 'skeleton', count: 3 }
    ],
    interval: 1800
  },
  {
    name: '獸人先頭部隊',
    enemies: [
      { type: 'skeleton', count: 5 },
      { type: 'orc', count: 2 },
      { type: 'goblin', count: 4 }
    ],
    interval: 1600
  },
  {
    name: '骷髏狂潮',
    enemies: [
      { type: 'skeleton', count: 12 },
      { type: 'orc', count: 2 }
    ],
    interval: 1400
  },
  {
    name: '惡魔覺醒',
    enemies: [
      { type: 'demon', count: 3 },
      { type: 'orc', count: 4 },
      { type: 'skeleton', count: 5 }
    ],
    interval: 1200
  },
  {
    name: '黑暗軍團',
    enemies: [
      { type: 'demon', count: 5 },
      { type: 'orc', count: 4 },
      { type: 'skeleton', count: 8 },
      { type: 'goblin', count: 6 }
    ],
    interval: 1000
  },
  {
    name: '地牢領主降臨',
    enemies: [
      { type: 'demon', count: 4 },
      { type: 'orc', count: 5 },
      { type: 'skeleton', count: 6 },
      { type: 'boss', count: 1 }
    ],
    interval: 900
  }
];

export default class WaveManager {
  constructor(scene) {
    this.scene = scene;
    this.currentWave = 0;
    this.enemiesSpawned = 0;
    this.totalEnemies = 0;
    this.enemiesRemaining = 0;
    this.isWaveActive = false;
    this.spawnTimer = null;
    this.spawnQueue = [];
  }

  startWave() {
    if (this.currentWave >= WAVES.length) {
      this.scene.events.emit('allWavesComplete');
      return;
    }

    const wave = WAVES[this.currentWave];

    // 建立生成佇列
    this.spawnQueue = [];
    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push(group.type);
      }
    }

    // 打亂順序（Boss 最後出現）
    const bossIndex = this.spawnQueue.findIndex(t => t === 'boss');
    let bossType = null;
    if (bossIndex !== -1) {
      bossType = this.spawnQueue.splice(bossIndex, 1)[0];
    }
    this.shuffleArray(this.spawnQueue);
    if (bossType) {
      this.spawnQueue.push(bossType);
    }

    this.enemiesSpawned = 0;
    this.totalEnemies = this.spawnQueue.length;
    this.enemiesRemaining = this.totalEnemies;
    this.isWaveActive = true;

    console.log(`波次 ${this.currentWave + 1}: ${wave.name} 開始！敵人數量: ${this.totalEnemies}`);

    // 顯示波次名稱
    this.scene.showWaveAnnouncement(wave.name);

    // Boss 波次特效
    if (bossType) {
      this.scene.time.delayedCall(500, () => {
        if (this.scene.effectsManager) {
          const start = this.scene.path[0];
          this.scene.effectsManager.createBossAppearEffect(
            start.x * 32 + 16,
            start.y * 32 + 16
          );
        }
      });
    }

    // 立即生成第一隻敵人
    this.doSpawnEnemy();

    // 設定定時生成
    if (this.totalEnemies > 1) {
      this.spawnTimer = this.scene.time.addEvent({
        delay: wave.interval,
        callback: () => {
          this.doSpawnEnemy();
        },
        callbackScope: this,
        repeat: this.totalEnemies - 2
      });
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  doSpawnEnemy() {
    if (!this.isWaveActive) return;
    if (this.enemiesSpawned >= this.totalEnemies) return;

    const enemyType = this.spawnQueue[this.enemiesSpawned];
    console.log(`生成敵人 ${this.enemiesSpawned + 1}/${this.totalEnemies}: ${enemyType}`);

    this.scene.spawnEnemy(enemyType);
    this.enemiesSpawned++;
  }

  onEnemyDefeated() {
    this.enemiesRemaining--;
    console.log(`敵人被消滅，剩餘: ${this.enemiesRemaining}`);

    if (this.enemiesRemaining <= 0) {
      this.endWave();
    }
  }

  endWave() {
    this.isWaveActive = false;

    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }

    this.currentWave++;
    console.log(`波次結束！下一波: ${this.currentWave + 1}`);

    if (this.currentWave >= WAVES.length) {
      this.scene.events.emit('allWavesComplete');
    } else {
      this.scene.events.emit('waveEnd', this.currentWave);
    }
  }

  getCurrentWave() {
    return this.currentWave + 1;
  }

  getTotalWaves() {
    return WAVES.length;
  }

  getWaveName() {
    if (this.currentWave < WAVES.length) {
      return WAVES[this.currentWave].name;
    }
    return '';
  }

  isComplete() {
    return this.currentWave >= WAVES.length;
  }
}
