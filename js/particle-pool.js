/**
 * Dungeon Keep - Particle Pool Management System
 * 集中式粒子池系統，優化陷阱效果粒子的記憶體分配與回收機制
 */
window.DK = window.DK || {};

DK.ParticlePool = {
  pools: {
    trap: [],        // 陷阱粒子池
    effect: [],      // 特效粒子池
    projectile: [],  // 投射物粒子池
    text: [],        // 文字粒子池
  },

  poolStats: {
    trap: { acquired: 0, released: 0, created: 0 },
    effect: { acquired: 0, released: 0, created: 0 },
    projectile: { acquired: 0, released: 0, created: 0 },
    text: { acquired: 0, released: 0, created: 0 },
  },

  init() {
    // 清空所有池
    this.pools.trap = [];
    this.pools.effect = [];
    this.pools.projectile = [];
    this.pools.text = [];

    // 重置統計
    for (const type in this.poolStats) {
      this.poolStats[type] = { acquired: 0, released: 0, created: 0 };
    }

    // 預熱：預先創建常用粒子
    this.prewarm('trap', 20);
    this.prewarm('effect', 30);
    this.prewarm('projectile', 15);
    this.prewarm('text', 25);
  },

  /**
   * 從池中取得粒子
   * @param {string} type - 粒子類型 (trap/effect/projectile/text)
   * @returns {Object} 乾淨的粒子物件
   */
  acquire(type) {
    const pool = this.pools[type];
    this.poolStats[type].acquired++;

    if (pool && pool.length > 0) {
      // 從池中取得現有粒子
      return pool.pop();
    } else {
      // 池為空，創建新粒子
      this.poolStats[type].created++;
      return this.createParticle(type);
    }
  },

  /**
   * 歸還粒子到池中
   * @param {Object} particle - 要歸還的粒子
   * @param {string} type - 粒子類型
   */
  release(particle, type) {
    if (!particle || !type) return;

    const pool = this.pools[type];
    if (!pool) return;

    // 重置粒子狀態
    this.reset(particle);

    // 限制池大小（避免無限增長）
    const maxPoolSize = 100;
    if (pool.length < maxPoolSize) {
      pool.push(particle);
      this.poolStats[type].released++;
    }
  },

  /**
   * 預熱：預先創建粒子
   * @param {string} type - 粒子類型
   * @param {number} count - 創建數量
   */
  prewarm(type, count) {
    const pool = this.pools[type];
    if (!pool) return;

    for (let i = 0; i < count; i++) {
      const particle = this.createParticle(type);
      pool.push(particle);
      this.poolStats[type].created++;
    }
  },

  /**
   * 創建新粒子（基礎結構）
   * @param {string} type - 粒子類型
   * @returns {Object} 新粒子物件
   */
  createParticle(type) {
    // 所有粒子共用的基礎屬性
    const particle = {
      type: '',
      x: 0,
      y: 0,
      timer: 0,
      duration: 0,
      color: '#ffffff',
      alive: true,
      _poolType: type, // 標記粒子類型，方便歸還
    };

    // 根據類型初始化不同屬性
    switch (type) {
      case 'trap':
        particle.trapType = '';
        particle.animFrame = 0;
        break;

      case 'effect':
        particle.radius = 0;
        particle.alpha = 1;
        break;

      case 'projectile':
        particle.targetX = 0;
        particle.targetY = 0;
        particle.trapType = '';
        break;

      case 'text':
        particle.text = '';
        particle.vx = 0;
        particle.vy = 0;
        break;
    }

    return particle;
  },

  /**
   * 重置粒子狀態（歸還前清理）
   * @param {Object} particle - 要重置的粒子
   */
  reset(particle) {
    particle.type = '';
    particle.x = 0;
    particle.y = 0;
    particle.timer = 0;
    particle.duration = 0;
    particle.color = '#ffffff';
    particle.alive = true;

    // 清理擴展屬性
    particle.targetX = 0;
    particle.targetY = 0;
    particle.trapType = '';
    particle.radius = 0;
    particle.alpha = 1;
    particle.text = '';
    particle.vx = 0;
    particle.vy = 0;
    particle.animFrame = 0;

    // 清理其他可能的屬性
    delete particle.dx;
    delete particle.dy;
    delete particle.enemyRef;
    delete particle._offsetApplied;
  },

  /**
   * 獲取池統計資訊
   * @returns {Object} 統計資訊
   */
  getStats() {
    const stats = {};
    for (const type in this.poolStats) {
      const s = this.poolStats[type];
      stats[type] = {
        poolSize: this.pools[type].length,
        acquired: s.acquired,
        released: s.released,
        created: s.created,
        reuseRate: s.acquired > 0 ? ((s.acquired - s.created) / s.acquired * 100).toFixed(1) + '%' : '0%',
      };
    }
    return stats;
  },

  /**
   * 清空所有池（用於重置遊戲時）
   */
  clear() {
    for (const type in this.pools) {
      this.pools[type] = [];
    }
  },
};
