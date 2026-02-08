/**
 * Dungeon Keep - Game State & Logic
 * Core game loop, wave management, and state
 */
window.DK = window.DK || {};

DK.Game = {
  state: 'start', // 'start' | 'planning' | 'breach' | 'invasion'
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
  minecarts: [],
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
    this.minecarts = [];
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.time = 0;
    this.screenShake = { intensity: 0, timer: 0 };
    this.camera = { x: 0, y: 0 };

    DK.Map.init();
    this.initParticles();
    this.initMinecarts();
    DK.Traps.init();
    DK.Enemies.init();
    if (DK.Elements) DK.Elements.init();
    if (DK.Heroes) DK.Heroes.init();
    DK.UI.init();
  },

  startGame() {
    this.state = 'planning';
    this.init();
  },

  startBreach() {
    if (this.state !== 'planning') return;
    this.state = 'breach';
  },

  startInvasion() {
    if (this.state !== 'breach') return;
    if (!DK.Map.breachHoles || DK.Map.breachHoles.length === 0) return;
    this.state = 'invasion';
    this._spawnHoleIndex = 0;
    this.startWave();
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

    // planning 和 breach 階段只更新時間和 UI
    if (this.state === 'planning' || this.state === 'breach') {
      this.time += dt;
      DK.UI.update(dt);
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

    // Update minecarts
    this.updateMinecarts(dt);

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
          this.gameOver = true; // 勝利！
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

  initMinecarts() {
    this.minecarts = [];
    // 從 DK.Map.tracks 讀取軌道定義
    if (!DK.Map.tracks || DK.Map.tracks.length === 0) return;

    for (const track of DK.Map.tracks) {
      const T = DK.CONFIG.TILE_SIZE;
      const startPt = track.path[0];
      this.minecarts.push({
        track: track,
        pathIndex: 0,           // 目前在路徑中的位置索引
        progress: 0,            // 0-1 在兩個路徑點之間的進度
        x: startPt.col * T + T / 2,  // 世界像素座標
        y: startPt.row * T + T / 2,
        direction: 1,           // 1=正向, -1=反向
        speed: track.speed || 1.5,
        damage: track.damage || 25,
        knockback: track.knockback || 2,
        hitCooldowns: new Map(), // 防止同一敵人被連續擊中
      });
    }
  },

  updateMinecarts(dt) {
    const T = DK.CONFIG.TILE_SIZE;

    for (const cart of this.minecarts) {
      const path = cart.track.path;
      if (path.length < 2) continue;

      // 更新碰撞冷卻
      for (const [id, cd] of cart.hitCooldowns) {
        cart.hitCooldowns.set(id, cd - dt);
        if (cd - dt <= 0) cart.hitCooldowns.delete(id);
      }

      // 移動礦車
      const moveAmount = cart.speed * dt / 1000; // 格/幀
      cart.progress += moveAmount;

      while (cart.progress >= 1) {
        cart.progress -= 1;
        cart.pathIndex += cart.direction;

        // 到達端點，反轉方向
        if (cart.pathIndex >= path.length - 1) {
          cart.pathIndex = path.length - 1;
          cart.direction = -1;
          cart.progress = 0;
          break;
        }
        if (cart.pathIndex <= 0) {
          cart.pathIndex = 0;
          cart.direction = 1;
          cart.progress = 0;
          break;
        }
      }

      // 計算當前世界座標（兩點之間插值）
      const currIdx = cart.pathIndex;
      const nextIdx = currIdx + cart.direction;
      const clamped = Math.max(0, Math.min(path.length - 1, nextIdx));
      const from = path[currIdx];
      const to = path[clamped];
      cart.x = (from.col + (to.col - from.col) * cart.progress) * T + T / 2;
      cart.y = (from.row + (to.row - from.row) * cart.progress) * T + T / 2;

      // 碰撞偵測：與所有活著的敵人檢測
      const hitRadius = T * 0.6; // 碰撞半徑（略小於一格）
      for (const enemy of DK.Enemies.active) {
        if (!enemy.alive) continue;
        if (cart.hitCooldowns.has(enemy.id)) continue;

        const dx = enemy.x - cart.x;
        const dy = enemy.y - cart.y;
        if (dx * dx + dy * dy < hitRadius * hitRadius) {
          // 造成傷害
          enemy.hp -= cart.damage;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            this.gold += enemy.type.reward || 5;
            this.enemiesKilled++;
          }

          // 擊退效果
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const knockX = (dx / dist) * cart.knockback * T;
          const knockY = (dy / dist) * cart.knockback * T;
          enemy.x += knockX;
          enemy.y += knockY;

          // 碰撞冷卻 1 秒
          cart.hitCooldowns.set(enemy.id, 1000);

          // 碰撞特效
          this.effects.push({
            type: 'minecart_hit',
            x: cart.x,
            y: cart.y,
            timer: 0,
            duration: 400,
          });

          // 傷害數字
          this.effects.push({
            type: 'float_text',
            x: enemy.x,
            y: enemy.y - 8,
            text: `-${cart.damage}`,
            timer: 0,
            duration: 800,
            color: '#ff8844',
          });
        }
      }

      // 同理檢測英雄碰撞
      if (DK.Heroes) {
        for (const hero of DK.Heroes.active) {
          if (!hero.alive) continue;
          if (cart.hitCooldowns.has('hero_' + hero.id)) continue;

          const dx = hero.x - cart.x;
          const dy = hero.y - cart.y;
          if (dx * dx + dy * dy < hitRadius * hitRadius) {
            hero.hp -= cart.damage;
            if (hero.hp <= 0) {
              hero.alive = false;
            }
            cart.hitCooldowns.set('hero_' + hero.id, 1000);

            this.effects.push({
              type: 'minecart_hit',
              x: cart.x,
              y: cart.y,
              timer: 0,
              duration: 400,
            });
          }
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
    this.state = 'planning';
    this.init();
  },
};
