/**
 * Dungeon Keep - Game State & Logic
 * Core game loop, wave management, and state
 */
window.DK = window.DK || {};

DK.Game = {
  state: 'start', // 'start' | 'planning' | 'invasion' (BREACH 已移除)
  gold: 0,
  dungeonHeartHP: 0,
  dungeonHeartMaxHP: 0,
  heartFlashTimer: 0,
  waveAutoTimer: 0,
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
  _spawnHoleIndex: 0,

  clampCamera() {
    const maxX = (DK.CONFIG.WORLD_COLS - DK.CONFIG.GRID_COLS) * DK.CONFIG.TILE_SIZE;
    const maxY = (DK.CONFIG.WORLD_ROWS - DK.CONFIG.GRID_ROWS) * DK.CONFIG.TILE_SIZE;
    this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
    this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
  },

  init() {
    // 初始化關卡管理器（首次啟動）
    if (DK.LevelManager && !DK.LevelManager.currentLevel) {
      DK.LevelManager.init();
    }

    // 重置遊戲狀態為 planning（關卡切換時需要）
    this.state = 'planning';

    this.gold = DK.CONFIG.STARTING_GOLD;
    this.dungeonHeartHP = DK.CONFIG.DUNGEON_HEART_HP;
    this.dungeonHeartMaxHP = DK.CONFIG.DUNGEON_HEART_HP;
    this.heartFlashTimer = 0;
    this.waveAutoTimer = 0;
    this._spawnHoleIndex = 0;
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
    if (DK.Doors) DK.Doors.init(DK.LevelManager.currentLevel);
    DK.Enemies.init();
    if (DK.Elements) DK.Elements.init();
    if (DK.Heroes) DK.Heroes.init();
    DK.UI.init();
  },

  startGame() {
    this.state = 'planning';
    this.init();
  },

  /** @deprecated BREACH 階段已移除，保留向後相容 */
  startBreach() {
    console.warn('[Deprecated] startBreach() - BREACH 階段已移除');
    this.startInvasion();
  },

  startInvasion() {
    if (this.state !== 'planning') return;
    // 使用傳送門作為敵人生成點
    this.initPortalsAsSpawnPoints();
    this.state = 'invasion';
    this._spawnHoleIndex = 0;
    this.startWave();
  },

  /**
   * 初始化傳送門作為敵人生成點
   * 向後相容：若無 portals，自動掃描 layout 生成
   */
  initPortalsAsSpawnPoints() {
    if (!DK.Map) return;

    // 優先使用 portals（新地圖）
    if (DK.Map.portals && DK.Map.portals.length > 0) {
      // 將 portals 的 entrance 轉換為 breachHoles 格式（向後相容）
      DK.Map.breachHoles = DK.Map.portals.map(p => ({
        col: p.entrance ? p.entrance.x : p.col,
        row: p.entrance ? p.entrance.y : p.row
      }));
    } else {
      // 向後相容：舊地圖無 portals，自動掃描 'E' 生成
      if (DK.Map.scanPortalsFromLayout) {
        DK.Map.scanPortalsFromLayout();
        // 再次嘗試轉換
        if (DK.Map.portals && DK.Map.portals.length > 0) {
          DK.Map.breachHoles = DK.Map.portals.map(p => ({
            col: p.entrance ? p.entrance.x : p.col,
            row: p.entrance ? p.entrance.y : p.row
          }));
        }
      }
    }

    // 最終檢查：如果仍無生成點，發出警告
    if (!DK.Map.breachHoles || DK.Map.breachHoles.length === 0) {
      console.error('[Game] 無法找到敵人生成點（portals 或 E 標記）');
    }
  },

  damageHeart(amount) {
    this.dungeonHeartHP = Math.max(0, this.dungeonHeartHP - amount);
    this.heartFlashTimer = 300;
    this.screenShake = { intensity: 3, timer: 200 };

    // 傷害數字特效
    const hp = DK.Map.heartPos;
    if (hp) {
      const T = DK.CONFIG.TILE_SIZE;
      this.effects.push({
        type: 'damage',
        x: (hp.col + 1) * T,
        y: hp.row * T - 4,
        text: `-${amount}`,
        color: '#ff4444',
        duration: 800,
        timer: 0,
      });
    }

    if (this.dungeonHeartHP <= 0) {
      this.gameOver = true;
    }
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

    // planning 階段只更新時間和 UI（BREACH 已移除）
    if (this.state === 'planning') {
      this.time += dt;
      DK.UI.update(dt);
      // 更新教學系統
      if (DK.Tutorial) DK.Tutorial.update(dt);
      // 更新粒子和特效（環境動畫繼續）
      this.updateParticles(dt);
      this.updateEffects(dt);
      return;
    }

    // invasion 階段 = 原本的 playing 邏輯
    if (this.gameOver) return;

    this.time += dt;

    // Heart flash timer
    if (this.heartFlashTimer > 0) {
      this.heartFlashTimer -= dt;
    }

    // Spawn enemies from breach holes（取代原本的單一入口生成）
    if (this.waveActive && this.spawnQueue.length > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= DK.CONFIG.ENEMY_SPAWN_INTERVAL) {
        this.spawnTimer = 0;
        const type = this.spawnQueue.shift();
        // 從洞口之一生成（輪流分配）
        if (DK.Map.breachHoles && DK.Map.breachHoles.length > 0) {
          const holeIdx = this._spawnHoleIndex % DK.Map.breachHoles.length;
          this._spawnHoleIndex++;
          const hole = DK.Map.breachHoles[holeIdx];
          DK.Enemies.spawnAt(type, hole.col, hole.row);
        }
      }
    }

    // Update enemies
    DK.Enemies.update(dt);

    // Update traps
    DK.Traps.update(dt, DK.Enemies.active);

    // Update doors
    if (DK.Doors) {
      DK.Doors.update(dt);
    }

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

    // Screen shake
    if (this.screenShake.timer > 0) {
      this.screenShake.timer -= dt;
      if (this.screenShake.timer <= 0) {
        this.screenShake.intensity = 0;
      }
    }

    // Update UI
    DK.UI.update(dt);

    // 波次完成 + 自動下一波
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
          // 檢查是否有下一關
          if (DK.LevelManager && DK.LevelManager.nextLevel()) {
            // 載入下一關成功，重新初始化遊戲
            this.init();
          } else {
            // 所有關卡完成，勝利！
            this.gameOver = true;
          }
        } else {
          // 自動開始下一波倒數
          this.waveAutoTimer = DK.CONFIG.WAVE_AUTO_DELAY;
        }
      }
    }

    // 自動波次倒數
    if (!this.waveActive && this.waveAutoTimer > 0 && !this.gameOver) {
      this.waveAutoTimer -= dt;
      if (this.waveAutoTimer <= 0) {
        this.startWave();
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
    this.state = 'planning';
    this.init();
  },
};
