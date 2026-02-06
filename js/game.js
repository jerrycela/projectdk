/**
 * Dungeon Keep - Game State & Logic
 * Core game loop, wave management, and state
 */
window.DK = window.DK || {};

DK.Game = {
  gold: 0,
  lives: 0,
  currentWave: 0,
  waveActive: false,
  gameOver: false,
  effects: [],
  spawnQueue: [],
  spawnTimer: 0,
  time: 0,

  init() {
    this.gold = DK.CONFIG.STARTING_GOLD;
    this.lives = DK.CONFIG.STARTING_LIVES;
    this.currentWave = 0;
    this.waveActive = false;
    this.gameOver = false;
    this.effects = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.time = 0;

    DK.Map.init();
    DK.Traps.init();
    DK.Enemies.init();
    DK.UI.init();
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

    // Update effects
    this.updateEffects(dt);

    // Update UI
    DK.UI.update(dt);

    // Check wave completion
    if (this.waveActive && this.spawnQueue.length === 0) {
      const aliveEnemies = DK.Enemies.active.filter(e => e.alive);
      if (aliveEnemies.length === 0) {
        this.waveActive = false;
        this.currentWave++;

        if (this.currentWave >= DK.WAVES.length) {
          this.gameOver = true;
        }
      }
    }
  },

  updateEffects(dt) {
    for (const effect of this.effects) {
      effect.timer += dt;
    }
    this.effects = this.effects.filter(e => e.timer < e.duration);
  },

  restart() {
    this.init();
  },
};
