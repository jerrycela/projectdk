/**
 * Dungeon Keep - Game State & Logic
 * Core game loop, wave management, and state
 */
window.DK = window.DK || {};

DK.Game = {
  state: 'start', // 'start' | 'playing'
  gold: 0,
  lives: 0,
  currentWave: 0,
  waveActive: false,
  gameOver: false,
  enemiesKilled: 0,
  effects: [],
  particles: [],
  spawnQueue: [],
  spawnTimer: 0,
  time: 0,
  screenShake: { intensity: 0, timer: 0 },
  camera: { x: 0, y: 0 },

  clampCamera() {
    const maxX = (DK.CONFIG.WORLD_COLS - DK.CONFIG.GRID_COLS) * DK.CONFIG.TILE_SIZE;
    const maxY = (DK.CONFIG.WORLD_ROWS - DK.CONFIG.GRID_ROWS) * DK.CONFIG.TILE_SIZE;
    this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
  },

  init() {
    this.gold = DK.CONFIG.STARTING_GOLD;
    this.lives = DK.CONFIG.STARTING_LIVES;
    this.currentWave = 0;
    this.waveActive = false;
    this.gameOver = false;
    this.enemiesKilled = 0;
    this.effects = [];
    this.particles = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.time = 0;
    this.screenShake = { intensity: 0, timer: 0 };
    this.camera = { x: 0, y: 0 };

    DK.Map.init();
    this.initParticles();
    DK.Traps.init();
    DK.Enemies.init();
    if (DK.Elements) DK.Elements.init();
    if (DK.Heroes) DK.Heroes.init();
    DK.UI.init();
  },

  startGame() {
    this.state = 'playing';
    this.init();
  },

  startWave() {
    if (this.waveActive || this.gameOver) return;
    if (this.currentWave >= DK.WAVES.length) return;

    const wave = DK.WAVES[this.currentWave];
    this.spawnQueue = [];

    for (const group of wave.enemies) {
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push(group.type);
      }
    }

    // Shuffle spawn queue slightly for variety
    for (let i = this.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
    }

    this.waveActive = true;
    this.spawnTimer = 0;

    DK.UI.showWaveStart = true;
    DK.UI.waveStartTimer = 2000;
  },

  update(dt) {
    if (this.state === 'start') {
      this.time += dt;
      return;
    }
    if (this.gameOver) return;

    this.time += dt;

    // Spawn enemies
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= DK.CONFIG.ENEMY_SPAWN_INTERVAL) {
        this.spawnTimer = 0;
        const type = this.spawnQueue.shift();
        DK.Enemies.spawn(type);
      }
    }

    // Update enemies
    DK.Enemies.update(dt);

    // Check for enemies that reached the end
    for (const enemy of DK.Enemies.active) {
      if (enemy.reachedEnd && enemy.alive === false && !enemy._counted) {
        this.lives--;
        enemy._counted = true;
        if (this.lives <= 0) {
          this.gameOver = true;
        }
      }
    }

    // Update traps
    DK.Traps.update(dt, DK.Enemies.active);

    // 更新草叢狀態
    if (DK.Map.updateGrass) {
      DK.Map.updateGrass(dt);
    }

    // Update heroes
    if (DK.Heroes) {
      DK.Heroes.update(dt, DK.Enemies.active);
    }

    // Update elements
    if (DK.Elements) {
      DK.Elements.update(dt);
    }

    // Update effects
    this.updateEffects(dt);

    // Update particles
    this.updateParticles(dt);

    // Update screen shake
    if (this.screenShake.timer > 0) {
      this.screenShake.timer -= dt;
      if (this.screenShake.timer <= 0) {
        this.screenShake.intensity = 0;
      }
    }

    // Update UI
    DK.UI.update(dt);

    // Check wave completion
    if (this.waveActive && this.spawnQueue.length === 0) {
      const aliveEnemies = DK.Enemies.active.filter(e => e.alive);
      if (aliveEnemies.length === 0) {
        this.waveActive = false;

        // 計算波次獎勵金幣（基礎 50 + 波次 * 10）
        const waveBonus = 50 + this.currentWave * 10;
        this.gold += waveBonus;

        // 觸發波次完成慶祝特效
        DK.UI.showWaveComplete = true;
        DK.UI.waveCompleteTimer = 2000;
        DK.UI.waveCompleteBonus = waveBonus;

        this.currentWave++;

        if (this.currentWave >= DK.WAVES.length) {
          this.gameOver = true;
        }
      }
    }
  },

  /** 初始化浮塵粒子（12-15 個） */
  initParticles() {
    this.particles = [];
    const count = 12 + Math.floor(Math.random() * 4); // 12-15
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createDustParticle());
    }
  },

  /** 建立一個浮塵粒子 */
  createDustParticle() {
    const alpha = 0.08 + Math.random() * 0.07; // 0.08-0.15
    return {
      type: 'dust',
      x: Math.random(),
      y: Math.random(),
      vx: 0.001 + Math.random() * 0.002,
      vy: -0.001 + Math.random() * 0.002,
      life: 0,
      maxLife: 3000 + Math.random() * 3000,
      color: `rgba(200,180,160,${alpha})`,
      size: 1,
    };
  },

  /** 更新所有粒子位置、生命、回收重生 */
  updateParticles(dt) {
    const newParticles = [];
    for (const p of this.particles) {
      const newLife = p.life + dt;
      if (newLife >= p.maxLife) {
        // 死亡重生
        if (p.type === 'dust') {
          newParticles.push(this.createDustParticle());
        }
        // ember 不重生，直接移除
      } else {
        newParticles.push({
          ...p,
          x: p.x + p.vx * dt / 1000,
          y: p.y + p.vy * dt / 1000,
          life: newLife,
        });
      }
    }
    this.particles = newParticles;
  },

  updateEffects(dt) {
    for (const effect of this.effects) {
      // Add random y offset to floating text effects on first frame to prevent overlap
      if (effect.timer === 0 && !effect._offsetApplied &&
          (effect.type === 'damage' || effect.type === 'gold' || effect.type === 'reaction_text')) {
        effect.y += (Math.random() - 0.5) * 16; // -8 to +8 pixel offset
        effect._offsetApplied = true;
      }
      effect.timer += dt;
    }
    this.effects = this.effects.filter(e => e.timer < e.duration);
  },

  restart() {
    this.state = 'playing';
    this.init();
  },
};
