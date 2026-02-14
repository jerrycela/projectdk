/**
 * Dungeon Keep - Hero System
 * Handles hero deployment, movement, attack, and rendering
 */
window.DK = window.DK || {};

DK.HERO_TYPES = {
  WATER_MAGE: {
    id: 'water_mage',
    name: '利維坦',
    description: '海之女神，水系範圍魔法附加潮濕',
    cost: 80,
    hp: 150,
    damage: 30,
    range: 3,
    aoeRadius: 2.5,
    attackCooldown: 1800,
    moveSpeed: 0.4,
    element: 'water',
    icon: 'water_mage',
    auraRange: 2,
  },
  FIRE_MAGE: {
    id: 'fire_mage',
    name: '巴爾',
    description: '焰之女神，火球命中施加灼印',
    cost: 90,
    hp: 130,
    damage: 35,
    range: 3,
    aoeRadius: 1.0,
    attackCooldown: 2000,
    moveSpeed: 0.4,
    element: 'fire',
    icon: 'fire_mage',
    auraRange: 2,
  },
  ICE_MAGE: {
    id: 'ice_mage',
    name: '乌利爾',
    description: '霜之女神，冰矛附加冰凍印記',
    cost: 85,
    hp: 120,
    damage: 25,
    range: 3.5,
    aoeRadius: 1.5,
    attackCooldown: 1500,
    moveSpeed: 0.4,
    element: 'ice',
    icon: 'ice_mage',
    auraRange: 2,
  },
};

DK.Heroes = {
  active: [],
  selectedHero: null, // Reference to a deployed hero that is selected
  _nextId: 1,

  init() {
    this.active = [];
    this.selectedHero = null;
    this._nextId = 1;
  },

  /**
   * Deploy a new hero at a floor tile
   */
  deploy(heroTypeId, col, row) {
    const typeDef = Object.values(DK.HERO_TYPES).find(t => t.id === heroTypeId);
    if (!typeDef) {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.log('error', 'Invalid hero type', { heroTypeId });
      }
      return false;
    }

    // Check valid floor tile (exclude outer, breakable walls, heart)
    if (!DK.Map.isPath(col, row)) {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.showError('cannot_deploy_hero_here', { col, row });
      }
      return false;
    }
    const tile = DK.Map.layout[row][col];
    if (tile === 'E' || tile === 'X') {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.showError('cannot_deploy_hero_here', { col, row, tile });
      }
      return false;
    }
    if (tile === 'O' || tile === 'B' || tile === 'H') {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.showError('cannot_deploy_hero_here', { col, row, tile });
      }
      return false;
    }
    if (DK.Map.isOuter && DK.Map.isOuter(col, row)) return false;
    if (DK.Map.isHeart && DK.Map.isHeart(col, row)) return false;

    // Check not occupied by trap or another hero
    if (DK.Traps.placed.some(t => t.col === col && t.row === row)) {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.showError('cannot_deploy_hero_here', { col, row });
      }
      return false;
    }
    if (this.active.some(h => h.col === col && h.row === row)) {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.showError('cannot_deploy_hero_here', { col, row });
      }
      return false;
    }

    const T = DK.CONFIG.TILE_SIZE;
    const hero = {
      id: this._nextId++,
      type: typeDef,
      col,
      row,
      x: col * T + T / 2,
      y: row * T + T / 2,
      hp: typeDef.hp,
      maxHp: typeDef.hp,
      attackTimer: 0,
      animFrame: 0,
      animTimer: 0,
      deployCol: col,           // 記住部署位置（巡邏中心）
      deployRow: row,
      alive: true,
      // Movement
      moving: false,
      movePath: [],
      moveIndex: 0,
      // Attack
      target: null,
      attacking: false,
      attackLine: null, // 攻擊連線特效 { targetX, targetY, timer, duration }
      // AI 狀態機
      aiState: 'idle',          // 'idle' | 'patrol' | 'chase'
      patrolTarget: null,       // { col, row } 巡邏目標
      patrolWaitTimer: 0,       // 抵達巡邏點後等待計時
      idleTimer: 2000 + Math.random() * 1000, // 初始閒置等待
      chaseTarget: null,        // 追擊中的敵人引用
      _chaseRefreshTimer: 0,    // 追擊路徑刷新計時
    };

    this.active.push(hero);

    // 記錄英雄部署
    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', `Hero deployed: ${typeDef.name}`, { col, row, id: hero.id });
    }

    // 記錄到撤銷系統（只在 planning 階段記錄）
    if (DK.UndoSystem && DK.Game.state === 'planning') {
      DK.UndoSystem.record({
        type: 'hero_summoned',
        hero: {
          id: hero.id,
          col: hero.col,
          row: hero.row,
          type: typeDef
        },
        cost: typeDef.cost
      });
    }

    // 英雄部署特效
    if (DK.Game && DK.Game.effects) {
      DK.Game.effects.push({
        type: 'hero_deploy',
        x: hero.x,
        y: hero.y,
        timer: 0,
        duration: 500,
        element: typeDef.element,
      });
    }

    return true;
  },

  /**
   * Recall a deployed hero — remove from active, refund gold, play effect
   */
  recall(hero) {
    const idx = this.active.indexOf(hero);
    if (idx === -1) return false;

    // 從 active 移除
    this.active.splice(idx, 1);

    // 退還全部金幣
    if (DK.Game) {
      DK.Game.gold += hero.type.cost;
    }

    // 清除選擇
    if (this.selectedHero === hero) {
      this.selectedHero = null;
    }

    // 回收特效
    if (DK.Game && DK.Game.effects) {
      DK.Game.effects.push({
        type: 'hero_recall',
        x: hero.x,
        y: hero.y,
        timer: 0,
        duration: 400,
        element: hero.type.element,
      });
    }

    return true;
  },

  /**
   * Command a hero to move to a target tile via BFS
   */
  commandMove(hero, targetCol, targetRow) {
    // Validate target
    if (!DK.Map.isPath(targetCol, targetRow)) return false;
    const tile = DK.Map.layout[targetRow][targetCol];
    if (tile === 'E' || tile === 'X') return false;

    const path = this.findPath(hero.col, hero.row, targetCol, targetRow);
    if (!path || path.length === 0) return false;

    hero.movePath = path;
    hero.moveIndex = 0;
    hero.moving = true;
    return true;
  },

  /**
   * BFS pathfinding between any two floor tiles
   * 使用 DK.PathCache 快取路徑結果，避免重複計算
   */
  findPath(startCol, startRow, endCol, endRow) {
    if (startCol === endCol && startRow === endRow) return [];

    // 檢查快取
    if (DK.PathCache) {
      const cached = DK.PathCache.getPath(startCol, startRow, endCol, endRow);
      if (cached !== null) {
        // 快取命中：深拷貝路徑以避免修改原始快取
        return cached.map(p => ({ ...p }));
      }
    }

    // 快取未命中：執行 BFS 計算
    const visited = new Set();
    const queue = [[{ col: startCol, row: startRow }]];
    visited.add(`${startCol},${startRow}`);

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.col === endCol && current.row === endRow) {
        const T = DK.CONFIG.TILE_SIZE;
        const result = path.slice(1).map(p => ({
          x: p.col * T + T / 2,
          y: p.row * T + T / 2,
          col: p.col,
          row: p.row,
        }));

        // 儲存到快取
        if (DK.PathCache) {
          DK.PathCache.setPath(startCol, startRow, endCol, endRow, result);
        }

        return result;
      }

      for (const [dc, dr] of dirs) {
        const nc = current.col + dc;
        const nr = current.row + dr;
        const key = `${nc},${nr}`;

        if (!visited.has(key) && DK.Map.isPath(nc, nr)) {
          visited.add(key);
          queue.push([...path, { col: nc, row: nr }]);
        }
      }
    }

    // 無路徑：也快取 null 結果
    if (DK.PathCache) {
      DK.PathCache.setPath(startCol, startRow, endCol, endRow, null);
    }

    return null; // No path found
  },

  /**
   * AI 狀態機 — 英雄自主巡邏 / 追擊
   * 狀態流程：IDLE → PATROL → 到達等待 → IDLE
   *           任何狀態偵測敵人 → CHASE → 射程內停下攻擊
   *           CHASE 目標死亡 → IDLE
   */
  updateAI(hero, dt, enemies) {
    const T = DK.CONFIG.TILE_SIZE;
    const detectRange = (hero.type.range + 2) * T;

    // --- 偵測最近敵人（任何 AI 狀態都要做） ---
    let nearestEnemy = null;
    let nearestDist = detectRange;
    for (const enemy of enemies) {
      if (!enemy.alive || enemy.hp <= 0) continue;
      // 九宮格限制：只偵測部署點 ±1 格範圍內的敵人
      const eCol = Math.floor(enemy.x / T);
      const eRow = Math.floor(enemy.y / T);
      if (Math.abs(eCol - hero.deployCol) > 1 || Math.abs(eRow - hero.deployRow) > 1) continue;
      const dx = enemy.x - hero.x;
      const dy = enemy.y - hero.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }

    // 偵測到敵人 → 進入 CHASE（不管目前什麼狀態）
    if (nearestEnemy && hero.aiState !== 'chase') {
      hero.aiState = 'chase';
      hero.chaseTarget = nearestEnemy;
      hero._chaseRefreshTimer = 0;
      hero.patrolTarget = null;
      hero.patrolWaitTimer = 0;
    }

    // --- 狀態處理 ---
    switch (hero.aiState) {
      case 'idle': {
        hero.idleTimer -= dt;
        if (hero.idleTimer <= 0) {
          hero.aiState = 'patrol';
          hero.idleTimer = 0;
        }
        break;
      }

      case 'patrol': {
        // 還沒設定巡邏目標且沒在移動 → 選一個
        if (!hero.moving && !hero.patrolTarget) {
          this.pickPatrolTarget(hero);
        }
        // 移動完畢且有 patrolTarget → 到達巡邏點
        // （到達判定在 update 的移動完成區塊處理）
        // patrolWaitTimer 倒數
        if (hero.patrolWaitTimer > 0) {
          hero.patrolWaitTimer -= dt;
          if (hero.patrolWaitTimer <= 0) {
            hero.patrolWaitTimer = 0;
            hero.aiState = 'idle';
            hero.idleTimer = 2000 + Math.random() * 1000;
          }
        }
        break;
      }

      case 'chase': {
        // 追擊目標已死亡或消失 → 回 IDLE
        if (!hero.chaseTarget || !hero.chaseTarget.alive || hero.chaseTarget.hp <= 0) {
          hero.aiState = 'idle';
          hero.chaseTarget = null;
          hero.moving = false;
          hero.movePath = [];
          hero.idleTimer = 1000 + Math.random() * 500;
          break;
        }

        // === 九宮格限制：敵人離開部署點 ±1 格範圍就放棄追擊 ===
        const enemyCol = Math.floor(hero.chaseTarget.x / T);
        const enemyRow = Math.floor(hero.chaseTarget.y / T);
        if (Math.abs(enemyCol - hero.deployCol) > 1 || Math.abs(enemyRow - hero.deployRow) > 1) {
          hero.aiState = 'idle';
          hero.chaseTarget = null;
          hero.moving = false;
          hero.movePath = [];
          hero.idleTimer = 500 + Math.random() * 500;
          break;
        }

        const attackRange = hero.type.range * T;
        const dx = hero.chaseTarget.x - hero.x;
        const dy = hero.chaseTarget.y - hero.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);

        if (distToTarget <= attackRange) {
          // 在射程內 → 停止移動，讓攻擊邏輯接手
          hero.moving = false;
          hero.movePath = [];
        } else {
          // 不在射程內 → 每 500ms 刷新追擊路徑
          hero._chaseRefreshTimer -= dt;
          if (hero._chaseRefreshTimer <= 0) {
            hero._chaseRefreshTimer = 500;
            // 計算敵人所在格子
            const tgtCol = Math.floor(hero.chaseTarget.x / T);
            const tgtRow = Math.floor(hero.chaseTarget.y / T);
            // 只在九宮格內追擊移動
            if (Math.abs(tgtCol - hero.deployCol) <= 1 && Math.abs(tgtRow - hero.deployRow) <= 1) {
              this.commandMove(hero, tgtCol, tgtRow);
            }
          }
        }
        break;
      }
    }
  },

  /**
   * 為英雄選擇巡邏目標 — 部署點附近 5 格隨機可走格
   */
  pickPatrolTarget(hero) {
    const maxAttempts = 20;
    const patrolRadius = 1;

    for (let i = 0; i < maxAttempts; i++) {
      const offsetCol = Math.floor(Math.random() * (patrolRadius * 2 + 1)) - patrolRadius;
      const offsetRow = Math.floor(Math.random() * (patrolRadius * 2 + 1)) - patrolRadius;
      const targetCol = hero.deployCol + offsetCol;
      const targetRow = hero.deployRow + offsetRow;

      // 跳過自己目前所在的格子
      if (targetCol === hero.col && targetRow === hero.row) continue;

      // 檢查是否為可走的地板格（排除外圍、牆壁、地心）
      if (!DK.Map.isPath(targetCol, targetRow)) continue;
      const tile = DK.Map.layout[targetRow] && DK.Map.layout[targetRow][targetCol];
      if (tile === 'E' || tile === 'X') continue;
      if (tile === 'O' || tile === 'B' || tile === 'H') continue;
      if (DK.Map.isOuter && DK.Map.isOuter(targetCol, targetRow)) continue;
      if (DK.Map.isHeart && DK.Map.isHeart(targetCol, targetRow)) continue;

      // 嘗試設定路徑
      if (this.commandMove(hero, targetCol, targetRow)) {
        hero.patrolTarget = { col: targetCol, row: targetRow };
        return;
      }
    }

    // 找不到有效巡邏點 → 回 IDLE
    hero.aiState = 'idle';
    hero.idleTimer = 1500 + Math.random() * 1000;
  },

  update(dt, enemies) {
    const T = DK.CONFIG.TILE_SIZE;

    for (const hero of this.active) {
      // 跳過死亡英雄
      if (!hero.alive) continue;

      // Animation (walk cycle + idle actions)
      hero.animTimer += dt;
      if (hero.animTimer > 400) { // Slowed from 300ms to 400ms for more elegant movement
        hero.animFrame = (hero.animFrame + 1) % 4;
        hero.animTimer = 0;
      }

      // Idle animation system (3-5 seconds random actions)
      if (!hero.idleActionTimer) hero.idleActionTimer = 0;
      if (!hero.idleAction) hero.idleAction = 'none';
      if (!hero.idleActionProgress) hero.idleActionProgress = 0;

      if (!hero.moving && !hero.attacking) {
        hero.idleActionTimer += dt;
        if (hero.idleActionTimer > 3000 + Math.random() * 2000) {
          // Trigger random idle action
          const actions = ['tilt_head', 'fix_hair', 'adjust_dress'];
          hero.idleAction = actions[Math.floor(Math.random() * actions.length)];
          hero.idleActionProgress = 0;
          hero.idleActionTimer = 0;
        }
      }

      // Progress idle action
      if (hero.idleAction !== 'none') {
        hero.idleActionProgress += dt;
        const actionDuration = hero.idleAction === 'fix_hair' ? 1000 : 800;
        if (hero.idleActionProgress > actionDuration) {
          hero.idleAction = 'none';
          hero.idleActionProgress = 0;
        }
      }

      // AI 狀態機更新（在移動邏輯之前）
      this.updateAI(hero, dt, enemies);

      // Movement
      if (hero.moving && hero.movePath.length > 0) {
        const target = hero.movePath[hero.moveIndex];
        if (!target) {
          hero.moving = false;
          continue;
        }

        const dx = target.x - hero.x;
        const dy = target.y - hero.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1) {
          hero.col = target.col;
          hero.row = target.row;
          hero.x = target.x;
          hero.y = target.y;
          hero.moveIndex++;
          if (hero.moveIndex >= hero.movePath.length) {
            hero.moving = false;
            hero.movePath = [];
            // 巡邏到達：清除 patrolTarget，開始等待
            if (hero.aiState === 'patrol' && hero.patrolTarget) {
              hero.patrolTarget = null;
              hero.patrolWaitTimer = 1000 + Math.random() * 1000;
            }
          }
        } else {
          const speed = hero.type.moveSpeed * (dt / 16);
          hero.x += (dx / dist) * speed;
          hero.y += (dy / dist) * speed;
        }
      }

      // Attack cooldown
      if (hero.attackTimer > 0) {
        hero.attackTimer -= dt;
      }

      // 攻擊連線特效遞減
      if (hero.attackLine) {
        hero.attackLine.timer -= dt;
        if (hero.attackLine.timer <= 0) {
          hero.attackLine = null;
        }
      }

      // Find and attack nearest enemy in range
      if (hero.attackTimer <= 0) {
        const range = hero.type.range * T;
        let bestTarget = null;
        let bestDist = range;

        for (const enemy of enemies) {
          if (!enemy.alive || enemy.hp <= 0) continue;
          const dx = enemy.x - hero.x;
          const dy = enemy.y - hero.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            bestTarget = enemy;
          }
        }

        if (bestTarget) {
          hero.attacking = true;
          hero.target = bestTarget;
          hero.attackTimer = hero.type.attackCooldown;

          // 設定攻擊連線特效
          hero.attackLine = {
            targetX: bestTarget.x,
            targetY: bestTarget.y,
            timer: 200,
            duration: 200,
          };

          // 根據英雄元素決定傷害文字顏色
          const dmgColorMap = { water: '#4488ff', fire: '#ff6622' };
          const dmgColor = dmgColorMap[hero.type.element] || '#ffffff';

          // 水法師/火法師：AoE 或單體攻擊
          const aoeRange = (hero.type.aoeRadius || 0) * T;
          const hitTargets = [];

          if (aoeRange > 0) {
              for (const enemy of enemies) {
                if (!enemy.alive || enemy.hp <= 0) continue;
                const dx = enemy.x - bestTarget.x;
                const dy = enemy.y - bestTarget.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= aoeRange) {
                  hitTargets.push(enemy);
                }
              }
            } else {
              hitTargets.push(bestTarget);
            }

          // 對所有命中目標施加傷害 + 元素
          for (const target of hitTargets) {
              target.hp -= hero.type.damage;
              target.flashTimer = 100;
              DK.Elements.applyElement(target, hero.type.element);

              if (DK.Game && DK.Game.effects) {
                DK.Game.effects.push({
                  type: 'damage',
                  x: target.x + (Math.random() - 0.5) * 4,
                  y: target.y - 8,
                  text: `-${hero.type.damage}`,
                  color: dmgColor,
                  duration: 800,
                  timer: 0,
                });
              }
            }

            // 投射物效果：根據元素類型
            const projectileType = hero.type.element === 'fire' ? 'fire_bolt' : hero.type.element === 'ice' ? 'ice_bolt' : 'water_bolt';
            if (DK.Game && DK.Game.effects) {
              DK.Game.effects.push({
                type: 'projectile',
                x: hero.x,
                y: hero.y - 4,
                targetX: bestTarget.x,
                targetY: bestTarget.y,
                color: dmgColor,
                duration: 300,
                timer: 0,
                trapType: projectileType,
              });

              // AoE 爆發效果
              if (aoeRange > 0 && hitTargets.length > 0) {
                if (hero.type.element === 'fire') {
                  DK.Game.effects.push({
                    type: 'fire_nova',
                    x: bestTarget.x,
                    y: bestTarget.y,
                    radius: aoeRange,
                    duration: 500,
                    timer: 0,
                  });
                } else {
                  DK.Game.effects.push({
                    type: 'water_nova',
                    x: bestTarget.x,
                    y: bestTarget.y,
                    radius: aoeRange,
                    duration: 500,
                    timer: 0,
                  });
                }
              }
            }
        } else {
          hero.attacking = false;
          hero.target = null;
        }
      }
    }
  },

  /**
   * Check if a hero exists at given tile (for selection)
   */
  getHeroAt(col, row) {
    return this.active.find(h => h.col === col && h.row === row);
  },

  /**
   * Check if a hero is near a pixel position (for click detection)
   */
  getHeroNear(pixelX, pixelY) {
    const T = DK.CONFIG.TILE_SIZE;
    const clickRadius = T * 0.7;

    for (const hero of this.active) {
      const dx = pixelX - hero.x;
      const dy = pixelY - hero.y;
      if (Math.sqrt(dx * dx + dy * dy) < clickRadius) {
        return hero;
      }
    }
    return null;
  },

  render(ctx, time) {
    for (const hero of this.active) {
      // 跳過死亡英雄
      if (!hero.alive) continue;

      const x = Math.round(hero.x);
      let y = Math.round(hero.y);

      // Vertical float animation (flying effect)
      if (hero.moving) {
        // Walking: gentle floating (4 frames cycle)
        const floatPattern = [0, -0.5, 0, -1]; // More pronounced float
        y += floatPattern[hero.animFrame];
      } else if (!hero.attackLine) {
        // Idle: breathing
        const breathOffset = Math.sin((time || 0) * 0.003) * 0.5;
        y += Math.round(breathOffset);
      } else if (hero.attacking) {
        // Attacking: casting pose - body lean back slightly
        y -= 1;
      }

      // 光環渲染
      this.renderAura(ctx, hero, x, y, time);

      // 根據英雄類型分派渲染
      if (hero.type.id === 'fire_mage') {
        this.renderFireMage(ctx, hero, x, y, time);
      } else {
        this.renderWaterMage(ctx, hero, x, y, time);
      }

      // 攻擊連線特效渲染
      if (hero.attackLine) {
        this.renderAttackLine(ctx, hero, x, y);
      }

      // Selection indicator
      if (this.selectedHero === hero) {
        // 根據英雄元素選擇光環顏色
        if (hero.type.id === 'fire_mage') {
          this.renderSelectionRing(ctx, x, y, time, 'rgba(255,102,34,');
        } else {
          this.renderSelectionRing(ctx, x, y, time);
        }
      }

      // Range indicator when selected
      if (this.selectedHero === hero) {
        this.renderRange(ctx, hero);
      }
    }
  },

  renderWaterMage(ctx, hero, x, y, time) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = hero.animFrame;
    const attacking = hero.attacking && hero.attackTimer > hero.type.attackCooldown * 0.7;

    // === LEVIATHAN: MapleStory Chibi Style — Big Head, Big Eyes, Tiny Body ===

    // Animation offsets
    let dressSwayX = 0;
    let hairFlowX = 0;
    let weaponExtendX = 0;
    let bodyLeanX = 0;

    if (hero.moving) {
      const swayPattern = [0, -1, 0, 1];
      dressSwayX = swayPattern[f];
      hairFlowX = 1 + (f === 3 ? 1 : 0);
    }

    if (attacking) {
      weaponExtendX = 2;
      bodyLeanX = -1;
      hairFlowX = 2;
    }

    // Idle actions
    if (hero.idleAction === 'tilt_head') {
      const progress = hero.idleActionProgress / 800;
      const tiltOffset = Math.sin(progress * Math.PI) * 1;
      x += Math.round(tiltOffset);
    } else if (hero.idleAction === 'fix_hair') {
      const progress = hero.idleActionProgress / 1000;
      if (progress > 0.3 && progress < 0.7) {
        hairFlowX += 1;
      }
    } else if (hero.idleAction === 'adjust_dress') {
      const progress = hero.idleActionProgress / 800;
      dressSwayX += Math.sin(progress * Math.PI * 2) * 0.5;
    }

    const hairX = x + Math.round(hairFlowX);
    const bodyX = x + Math.round(bodyLeanX);

    // === Shadow (iter10: gradient shadow) ===
    ctx.save();
    ctx.globalAlpha = 0.3;
    PA.rect(ctx, x - 5, y + 5, 10, 1, '#1a2a3a');
    ctx.globalAlpha = 0.15;
    PA.rect(ctx, x - 4, y + 6, 8, 1, '#1a2a3a');
    ctx.restore();

    // === Back hair (iter21-30: enhanced flowing strands) ===
    PA.rect(ctx, hairX - 5, y - 12, 11, 6, C.HERO_WATER_HAIR_DARK);
    PA.rect(ctx, hairX - 4, y - 13, 9, 1, C.HERO_WATER_HAIR_DARK);
    // (iter26: back hair gradient layers)
    PA.rect(ctx, hairX - 5, y - 6, 3, 4, C.HERO_WATER_HAIR_DARK);
    PA.rect(ctx, hairX - 5, y - 2, 3, 3, '#5a8aaa');
    PA.rect(ctx, hairX - 5, y + 1, 3, 2, C.HERO_WATER_HAIR_MID);
    PA.rect(ctx, hairX + 3, y - 6, 3, 4, C.HERO_WATER_HAIR_DARK);
    PA.rect(ctx, hairX + 3, y - 2, 3, 3, '#5a8aaa');
    PA.rect(ctx, hairX + 3, y + 1, 3, 2, C.HERO_WATER_HAIR_MID);
    // (iter25: varied back hair tips)
    PA.pixel(ctx, hairX - 5, y + 3, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX - 4, y + 4, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX - 5, y + 5, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX + 4, y + 3, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX + 5, y + 4, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX + 5, y + 5, C.HERO_WATER_HAIR_TIP);
    // (iter26: back hair inner glow)
    PA.pixel(ctx, hairX - 3, y - 4, '#6a9ab8');
    PA.pixel(ctx, hairX + 3, y - 4, '#6a9ab8');

    // === Tiny feet ===
    if (hero.moving) {
      if (f < 2) {
        PA.rect(ctx, x - 2, y + 4, 2, 1, '#1a2a4a');
        PA.rect(ctx, x + 1, y + 4, 2, 1, '#1a2a4a');
      } else {
        PA.rect(ctx, x - 3, y + 4, 2, 1, '#1a2a4a');
        PA.rect(ctx, x + 2, y + 4, 2, 1, '#1a2a4a');
      }
    } else {
      PA.rect(ctx, x - 2, y + 4, 2, 1, '#1a2a4a');
      PA.rect(ctx, x + 1, y + 4, 2, 1, '#1a2a4a');
    }

    // === Mini A-Line Dress (only 4px tall, MapleStory tiny body) ===
    const dressX = x + Math.round(dressSwayX);
    PA.rect(ctx, dressX - 3, y + 1, 7, 1, C.HERO_ROBE);
    PA.rect(ctx, dressX - 4, y + 2, 9, 1, C.HERO_ROBE);
    PA.rect(ctx, dressX - 4, y + 3, 9, 1, C.HERO_ROBE_DARK);
    PA.pixel(ctx, dressX - 3, y + 3, C.HERO_WATER_WAVE_PATTERN);
    PA.pixel(ctx, dressX - 1, y + 3, C.HERO_WATER_WAVE_PATTERN);
    PA.pixel(ctx, dressX + 1, y + 3, C.HERO_WATER_WAVE_PATTERN);
    PA.pixel(ctx, dressX + 3, y + 3, C.HERO_WATER_WAVE_PATTERN);
    PA.pixel(ctx, dressX - 4, y + 3, C.HERO_PEARL);
    PA.pixel(ctx, dressX, y + 3, C.HERO_PEARL);
    PA.pixel(ctx, dressX + 4, y + 3, C.HERO_PEARL);
    // [iter5] Dress fold highlights (light gleam on fabric)
    PA.pixel(ctx, dressX - 2, y + 2, C.HERO_ROBE_LIGHT);
    PA.pixel(ctx, dressX + 2, y + 2, C.HERO_ROBE_LIGHT);
    // [iter5] Back ribbon bow (cute chibi accessory)
    PA.pixel(ctx, dressX, y + 1, C.HERO_GEM_WATER);
    PA.pixel(ctx, dressX - 1, y + 1, '#aaddee');
    PA.pixel(ctx, dressX + 1, y + 1, '#aaddee');

    // === Upper Torso (tiny) ===
    PA.rect(ctx, x - 2, y - 1, 5, 2, C.HERO_ROBE);
    PA.rect(ctx, x - 2, y, 5, 1, C.HERO_ROBE_LIGHT);
    PA.pixel(ctx, x, y - 1, C.HERO_GEM_WATER);
    PA.rect(ctx, x - 3, y + 1, 7, 1, C.HERO_GOLD);
    PA.pixel(ctx, x, y + 1, C.HERO_GEM_WATER);

    // === Mini Arms ===
    const armOffset = hero.moving ? (f % 2) : 0;
    PA.pixel(ctx, x - 3, y - 1 + armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x - 3, y + armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x - 3, y - 1 + armOffset, C.HERO_SILVER);
    PA.pixel(ctx, x + 3, y - 1 - armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x + 3, y - armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x + 3, y - 1 - armOffset, C.HERO_SILVER);
    // [iter6] Pearl wrist bracelets
    PA.pixel(ctx, x - 3, y + armOffset, C.HERO_PEARL);
    PA.pixel(ctx, x + 3, y - armOffset, C.HERO_PEARL);

    // === Neck ===
    PA.rect(ctx, x - 1, y - 2, 3, 1, C.HERO_SKIN);
    // [iter6] Necklace pendant
    PA.pixel(ctx, x, y - 2, C.HERO_GEM_WATER);

    // === BIG HEAD (MapleStory chibi, 8px tall round) ===
    // Dark outline
    PA.rect(ctx, x - 3, y - 11, 7, 1, '#1a2a3a');
    PA.rect(ctx, x - 5, y - 10, 1, 7, '#1a2a3a');
    PA.rect(ctx, x + 5, y - 10, 1, 7, '#1a2a3a');
    PA.pixel(ctx, x - 4, y - 3, '#1a2a3a');
    PA.pixel(ctx, x + 4, y - 3, '#1a2a3a');
    PA.pixel(ctx, x - 4, y - 10, '#1a2a3a');
    PA.pixel(ctx, x + 4, y - 10, '#1a2a3a');
    // Face fill
    PA.rect(ctx, x - 4, y - 10, 9, 7, C.HERO_SKIN);
    PA.rect(ctx, x - 3, y - 11, 7, 1, C.HERO_SKIN);
    PA.pixel(ctx, x - 3, y - 11, '#1a2a3a');
    PA.pixel(ctx, x + 3, y - 11, '#1a2a3a');
    PA.pixel(ctx, x + 4, y - 7, '#edd0b8');
    PA.pixel(ctx, x - 4, y - 7, '#edd0b8');

    // === FACE (iter11-20: natural chibi expression redesign) ===
    const eyeT = (time || 0) / 700;
    const eyeGlint = (Math.sin(eyeT) + 1) / 2;

    // --- Forehead (iter20: warm glow) ---
    PA.pixel(ctx, x - 1, y - 10, '#fff8f0');
    PA.pixel(ctx, x, y - 10, '#fff8f0');
    PA.pixel(ctx, x + 1, y - 10, '#fff5ea');

    // --- Eyebrows (iter14: natural arch with gradient) ---
    PA.pixel(ctx, x - 3, y - 9, '#e8d0c0');
    PA.pixel(ctx, x - 2, y - 9, '#f5e5d5');
    PA.pixel(ctx, x + 2, y - 9, '#f5e5d5');
    PA.pixel(ctx, x + 3, y - 9, '#e8d0c0');
    // (iter18: temple shadow for 3D)
    PA.pixel(ctx, x - 4, y - 9, '#ddc0a8');
    PA.pixel(ctx, x + 4, y - 9, '#ddc0a8');

    // --- Eyes (bright, lively chibi eyes) ---
    // Left eye - lid with inner glow (NOT all dark)
    PA.pixel(ctx, x - 3, y - 8, '#152840');
    PA.pixel(ctx, x - 2, y - 8, '#1a3050');
    PA.pixel(ctx, x - 1, y - 8, '#5588aa');
    // Left eye - iris (dark | bright | catchlight)
    PA.pixel(ctx, x - 3, y - 7, '#1a3a5a');
    PA.pixel(ctx, x - 2, y - 7, '#55aaee');
    PA.pixel(ctx, x - 1, y - 7, '#ffffff');
    // Right eye - lid with inner glow
    PA.pixel(ctx, x + 1, y - 8, '#5588aa');
    PA.pixel(ctx, x + 2, y - 8, '#1a3050');
    PA.pixel(ctx, x + 3, y - 8, '#152840');
    // Right eye - iris (catchlight | bright | dark)
    PA.pixel(ctx, x + 1, y - 7, '#ffffff');
    PA.pixel(ctx, x + 2, y - 7, '#55aaee');
    PA.pixel(ctx, x + 3, y - 7, '#1a3a5a');
    // (iter13: gentle catchlight pulse, lid stays dark)
    if (eyeGlint > 0.65) {
      ctx.save(); ctx.globalAlpha = (eyeGlint - 0.65) * 2.8;
      PA.pixel(ctx, x - 2, y - 8, '#3a6090');
      PA.pixel(ctx, x + 2, y - 8, '#3a6090');
      ctx.restore();
    }

    // --- Eyelashes (iter14: curved lash, thick outer) ---
    PA.pixel(ctx, x - 4, y - 8, '#1a2a3a');
    PA.pixel(ctx, x - 4, y - 7, '#3a4a5a');
    PA.pixel(ctx, x + 4, y - 8, '#1a2a3a');
    PA.pixel(ctx, x + 4, y - 7, '#3a4a5a');

    // --- Under-eye + Nose + Blush row (y-6) ---
    // (iter14: under-eye shadow)
    PA.pixel(ctx, x - 2, y - 6, '#e8c8b0');
    PA.pixel(ctx, x + 2, y - 6, '#e8c8b0');
    // (iter17: soft single-row blush)
    PA.pixel(ctx, x - 3, y - 6, '#ffbbbb');
    PA.pixel(ctx, x + 3, y - 6, '#ffbbbb');
    PA.pixel(ctx, x - 4, y - 6, '#ffdddd');
    PA.pixel(ctx, x + 4, y - 6, '#ffdddd');
    // (iter15: tiny nose)
    PA.pixel(ctx, x, y - 6, '#dcc0a8');
    PA.pixel(ctx, x + 1, y - 6, '#fff0e0');

    // --- Mouth (smile: light corners = raised, dark center = open) ---
    PA.pixel(ctx, x - 1, y - 5, '#d8a090');
    PA.pixel(ctx, x, y - 5, '#c07060');
    PA.pixel(ctx, x + 1, y - 5, '#d8a090');

    // --- Lower face (iter18: jaw highlight) ---
    PA.pixel(ctx, x - 3, y - 4, '#fff0e0');
    PA.pixel(ctx, x + 3, y - 4, '#fff0e0');
    // (iter3: chin highlight)
    PA.pixel(ctx, x, y - 3, '#fff0e8');

    // === FRONT HAIR (iter21-30: strands, gradient, curls, ornaments) ===
    // --- Bangs (iter21: individual strand highlights) ---
    PA.rect(ctx, bodyX - 4, y - 11, 9, 2, C.HERO_WATER_HAIR_MID);
    PA.rect(ctx, bodyX - 3, y - 12, 7, 1, C.HERO_WATER_HAIR_MID);
    // Strand highlights
    PA.pixel(ctx, bodyX - 2, y - 10, '#a0d0e8');
    PA.pixel(ctx, bodyX, y - 10, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 2, y - 10, '#a0d0e8');
    // Dark strand gaps
    PA.pixel(ctx, bodyX - 1, y - 10, C.HERO_WATER_HAIR_DARK);
    PA.pixel(ctx, bodyX + 1, y - 10, C.HERO_WATER_HAIR_DARK);
    PA.pixel(ctx, bodyX - 3, y - 10, C.HERO_WATER_HAIR_DARK);
    PA.pixel(ctx, bodyX + 3, y - 10, C.HERO_WATER_HAIR_MID);
    // (iter22: bangs edge feather)
    PA.pixel(ctx, bodyX - 4, y - 10, C.HERO_WATER_HAIR_DARK);
    PA.pixel(ctx, bodyX + 4, y - 10, C.HERO_WATER_HAIR_DARK);

    // --- Side hair left (iter23: 4-tone gradient + iter24: inner glow) ---
    PA.rect(ctx, hairX - 6, y - 10, 2, 3, C.HERO_WATER_HAIR_DARK);
    PA.rect(ctx, hairX - 6, y - 7, 2, 2, '#5a8aaa');
    PA.rect(ctx, hairX - 6, y - 5, 2, 2, C.HERO_WATER_HAIR_MID);
    PA.rect(ctx, hairX - 6, y - 3, 2, 2, C.HERO_WATER_HAIR_LIGHT);
    // Inner glow strand
    PA.pixel(ctx, hairX - 5, y - 8, '#8abcd0');
    PA.pixel(ctx, hairX - 5, y - 5, '#a0cce0');
    // (iter25: curled tips at varied heights)
    PA.pixel(ctx, hairX - 6, y - 1, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX - 5, y, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX - 6, y + 1, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX - 5, y + 2, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX - 4, y + 3, C.HERO_WATER_HAIR_TIP);
    // Outer wisp
    PA.pixel(ctx, hairX - 7, y - 8, C.HERO_WATER_HAIR_MID);
    PA.pixel(ctx, hairX - 7, y - 7, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX - 7, y - 6, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX - 7, y - 5, C.HERO_WATER_HAIR_TIP);

    // --- Side hair right (mirror, iter23-25) ---
    PA.rect(ctx, hairX + 5, y - 10, 2, 3, C.HERO_WATER_HAIR_DARK);
    PA.rect(ctx, hairX + 5, y - 7, 2, 2, '#5a8aaa');
    PA.rect(ctx, hairX + 5, y - 5, 2, 2, C.HERO_WATER_HAIR_MID);
    PA.rect(ctx, hairX + 5, y - 3, 2, 2, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX + 6, y - 8, '#8abcd0');
    PA.pixel(ctx, hairX + 6, y - 5, '#a0cce0');
    PA.pixel(ctx, hairX + 5, y - 1, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX + 6, y, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX + 5, y + 1, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX + 6, y + 2, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX + 5, y + 3, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX + 7, y - 8, C.HERO_WATER_HAIR_MID);
    PA.pixel(ctx, hairX + 7, y - 7, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX + 7, y - 6, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX + 7, y - 5, C.HERO_WATER_HAIR_TIP);

    // --- Top volume (iter29: bouncier with gradient) ---
    PA.rect(ctx, bodyX - 3, y - 13, 7, 1, C.HERO_WATER_HAIR_MID);
    PA.pixel(ctx, bodyX - 2, y - 13, '#7ab0cc');
    PA.pixel(ctx, bodyX + 2, y - 13, '#7ab0cc');
    PA.rect(ctx, bodyX - 2, y - 14, 5, 1, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX - 1, y - 15, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 15, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 1, y - 15, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 14, '#cce0f0');

    // --- Hair shine (iter27: multi-spot animated) ---
    PA.pixel(ctx, bodyX - 1, y - 12, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 1, y - 12, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 12, '#d0e8f8');
    const hairShine = Math.sin((time || 0) / 500);
    const hairShine2 = Math.sin((time || 0) / 500 + Math.PI);
    if (hairShine > 0.4) {
      ctx.save(); ctx.globalAlpha = (hairShine - 0.4) * 1.6;
      PA.pixel(ctx, hairX - 5, y - 7, '#ffffff');
      PA.pixel(ctx, hairX + 4, y - 3, '#ffffff');
      ctx.restore();
    }
    if (hairShine2 > 0.5) {
      ctx.save(); ctx.globalAlpha = (hairShine2 - 0.5) * 2;
      PA.pixel(ctx, hairX + 6, y - 1, '#ffffff');
      ctx.restore();
    }

    // --- Hair ornaments (iter28: flower pin = 5px cross) ---
    // Left flower pin
    PA.pixel(ctx, bodyX - 5, y - 9, C.HERO_PEARL);
    PA.pixel(ctx, bodyX - 5, y - 10, '#b8daea');
    PA.pixel(ctx, bodyX - 6, y - 9, '#a8cce0');
    PA.pixel(ctx, bodyX - 5, y - 8, '#a8cce0');
    // Right flower pin
    PA.pixel(ctx, bodyX + 5, y - 9, C.HERO_PEARL);
    PA.pixel(ctx, bodyX + 5, y - 10, '#b8daea');
    PA.pixel(ctx, bodyX + 6, y - 9, '#a8cce0');
    PA.pixel(ctx, bodyX + 5, y - 8, '#a8cce0');

    // --- Idle micro-sway (iter30) ---
    if (!hero.moving && !attacking) {
      const microSway = Math.sin((time || 0) / 900) * 0.6;
      const ms = Math.round(microSway);
      PA.pixel(ctx, hairX - 5 + ms, y + 4, C.HERO_WATER_HAIR_TIP);
      PA.pixel(ctx, hairX + 6 - ms, y + 4, C.HERO_WATER_HAIR_TIP);
    }

    // === Tiara/Crown (iter7: pulsing gem) ===
    const crownPulse = (Math.sin((time || 0) / 500) + 1) / 2;
    PA.pixel(ctx, bodyX - 2, y - 15, C.HERO_WATER_CROWN);
    PA.pixel(ctx, bodyX - 1, y - 16, C.HERO_WATER_CROWN);
    PA.pixel(ctx, bodyX, y - 17, C.HERO_WATER_CROWN);
    // [iter7] Center gem pulses with glow
    PA.pixel(ctx, bodyX, y - 16, crownPulse > 0.6 ? '#ffffff' : C.HERO_WATER_CROWN_GEM);
    PA.pixel(ctx, bodyX + 1, y - 16, C.HERO_WATER_CROWN);
    PA.pixel(ctx, bodyX + 2, y - 15, C.HERO_WATER_CROWN);
    PA.pixel(ctx, bodyX - 3, y - 14, crownPulse > 0.7 ? '#aaddff' : C.HERO_WATER_CROWN_GEM);
    PA.pixel(ctx, bodyX + 3, y - 14, crownPulse > 0.7 ? '#aaddff' : C.HERO_WATER_CROWN_GEM);
    // [iter7] Crown glint at tip
    if (crownPulse > 0.8) {
      ctx.save(); ctx.globalAlpha = crownPulse;
      PA.pixel(ctx, bodyX, y - 18, '#ffffff');
      ctx.restore();
    }

    // Water crystal earrings
    const earringOffset = hero.moving ? Math.sin(time / 200) * 0.5 : 0;
    PA.pixel(ctx, x - 5, y - 7 + earringOffset, C.HERO_GEM_WATER);
    PA.pixel(ctx, x - 5, y - 6 + earringOffset, C.HERO_SILVER);
    PA.pixel(ctx, x + 5, y - 7 + earringOffset, C.HERO_GEM_WATER);
    PA.pixel(ctx, x + 5, y - 6 + earringOffset, C.HERO_SILVER);

    // === Small Trident (iter8: weapon glow) ===
    const weaponX = x + Math.round(weaponExtendX);
    const weaponGlow = (Math.sin((time || 0) / 350) + 1) / 2;
    PA.rect(ctx, weaponX + 5, y - 10, 1, 13, '#5a8aaa');
    PA.pixel(ctx, weaponX + 5, y - 5, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 5, y - 3, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 4, y - 12, '#66aadd');
    PA.pixel(ctx, weaponX + 5, y - 13, C.HERO_GEM_WATER);
    PA.pixel(ctx, weaponX + 6, y - 12, '#66aadd');
    PA.pixel(ctx, weaponX + 5, y - 12, '#aaddff');
    PA.pixel(ctx, weaponX + 4, y - 11, C.HERO_PEARL);
    PA.pixel(ctx, weaponX + 6, y - 11, C.HERO_PEARL);
    PA.pixel(ctx, weaponX + 5, y - 14, '#ccddff');
    // [iter8] Weapon halo glow
    ctx.save();
    ctx.globalAlpha = weaponGlow * 0.35;
    PA.pixel(ctx, weaponX + 4, y - 14, '#88ccff');
    PA.pixel(ctx, weaponX + 6, y - 14, '#88ccff');
    PA.pixel(ctx, weaponX + 5, y - 15, '#aaddff');
    // [iter8] Dripping water droplet
    const dripY = ((time || 0) / 600) % 1;
    PA.pixel(ctx, weaponX + 5, y - 10 + Math.floor(dripY * 4), '#88ccff');
    ctx.restore();
    if (attacking) {
      PA.pixel(ctx, weaponX + 4, y - 13, '#88ccff');
      PA.pixel(ctx, weaponX + 6, y - 13, '#88ccff');
      PA.pixel(ctx, weaponX + 5, y - 15, '#ffffff');
      PA.pixel(ctx, weaponX + 5, y - 16, C.HERO_GEM_WATER);
      PA.pixel(ctx, weaponX + 3, y - 12, '#aaccff');
      PA.pixel(ctx, weaponX + 7, y - 12, '#aaccff');
    }

    // === Water element particles (iter9: enhanced variety) ===
    if (!hero.moving && !attacking) {
      const bubbleTime = (time || 0) / 300;
      const bubble1Y = Math.sin(bubbleTime) * 3;
      const bubble2Y = Math.sin(bubbleTime + Math.PI * 0.66) * 2.5;
      const bubble3Y = Math.sin(bubbleTime + Math.PI * 1.33) * 2;
      const bubble1X = Math.cos(bubbleTime * 0.7) * 1;
      const bubble2X = Math.cos(bubbleTime * 0.7 + Math.PI) * 1;
      ctx.save();
      ctx.globalAlpha = 0.5;
      PA.pixel(ctx, x - 7 + bubble1X, y - 4 + bubble1Y, '#88ccff');
      PA.pixel(ctx, x + 7 + bubble2X, y - 6 + bubble2Y, '#88ccff');
      PA.pixel(ctx, x - 4, y - 14 + bubble3Y, '#aaddff');
      ctx.restore();
      // [iter9] Star sparkles (cross pattern)
      const sparkleAlpha = (Math.sin(bubbleTime * 2) + 1) / 2;
      ctx.save();
      ctx.globalAlpha = sparkleAlpha * 0.6;
      PA.pixel(ctx, x + 4, y - 14 + bubble3Y, '#ffffff');
      ctx.restore();
      // [iter9] Additional water droplets
      const drop4Y = Math.sin(bubbleTime * 1.5 + 2.0) * 2;
      const drop5Y = Math.sin(bubbleTime * 1.2 + 4.0) * 2.5;
      ctx.save();
      ctx.globalAlpha = 0.4;
      PA.pixel(ctx, x - 8, y - 8 + drop4Y, '#66bbee');
      PA.pixel(ctx, x + 8, y - 2 + drop5Y, '#66bbee');
      ctx.restore();
      // [iter9] Star sparkle burst (4-pixel cross)
      const starPhase = (Math.sin(bubbleTime * 3) + 1) / 2;
      if (starPhase > 0.7) {
        ctx.save();
        ctx.globalAlpha = (starPhase - 0.7) * 3.33;
        const starX = x - 6 + Math.round(bubble1X);
        const starY = y - 12 + Math.round(bubble3Y);
        PA.pixel(ctx, starX, starY, '#ffffff');
        PA.pixel(ctx, starX - 1, starY, '#ccddff');
        PA.pixel(ctx, starX + 1, starY, '#ccddff');
        PA.pixel(ctx, starX, starY - 1, '#ccddff');
        PA.pixel(ctx, starX, starY + 1, '#ccddff');
        ctx.restore();
      }
    }

    // Water aura when attacking
    if (attacking) {
      const t = (time || 0) / 150;
      for (let i = 0; i < 8; i++) {
        const angle = t + (i * Math.PI * 2) / 8;
        const r = 10;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 5 + Math.sin(angle) * r * 0.5);
        PA.pixel(ctx, px, py, 'rgba(68,136,255,0.6)');
      }
      for (let i = 0; i < 6; i++) {
        const angle = -(t) * 1.3 + (i * Math.PI * 2) / 6;
        const r = 6;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 5 + Math.sin(angle) * r * 0.4);
        PA.pixel(ctx, px, py, 'rgba(136,204,255,0.5)');
      }
    }
  },

  renderFireMage(ctx, hero, x, y, time) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = hero.animFrame;
    const attacking = hero.attacking && hero.attackTimer > hero.type.attackCooldown * 0.7;

    // === BAAL: MapleStory Chibi Style — Big Head, Big Eyes, High Ponytail ===

    // Animation offsets
    let dressSwayX = 0;
    let ponytailSwayX = 0;
    let ponytailSwayY = 0;
    let weaponExtendX = 0;
    let bodyLeanX = 0;

    if (hero.moving) {
      const swayPattern = [0, -1, 0, 1];
      dressSwayX = swayPattern[f];
      ponytailSwayX = swayPattern[f] * 0.7;
      ponytailSwayY = (f % 2) ? -1 : 0;
    }

    if (attacking) {
      weaponExtendX = 2;
      bodyLeanX = -1;
      ponytailSwayX = -2;
      ponytailSwayY = -1;
    }

    // Idle actions
    if (hero.idleAction === 'tilt_head') {
      const progress = hero.idleActionProgress / 800;
      const tiltOffset = Math.sin(progress * Math.PI) * 1;
      x += Math.round(tiltOffset);
    } else if (hero.idleAction === 'fix_hair') {
      const progress = hero.idleActionProgress / 1000;
      if (progress > 0.3 && progress < 0.7) {
        ponytailSwayX += 1;
      }
    } else if (hero.idleAction === 'adjust_dress') {
      const progress = hero.idleActionProgress / 800;
      dressSwayX += Math.sin(progress * Math.PI * 2) * 0.5;
    }

    const ponytailX = x + Math.round(ponytailSwayX);
    const ptY = Math.round(ponytailSwayY);
    const bodyX = x + Math.round(bodyLeanX);
    const flicker = Math.sin((time || 0) / 120);

    // === Shadow (iter10: gradient shadow) ===
    ctx.save();
    ctx.globalAlpha = 0.3;
    PA.rect(ctx, x - 5, y + 5, 10, 1, '#2a1515');
    ctx.globalAlpha = 0.15;
    PA.rect(ctx, x - 4, y + 6, 8, 1, '#2a1515');
    ctx.restore();

    // === Back ponytail (iter26: enhanced gradient + volume) ===
    // Ponytail base gathered at top
    PA.rect(ctx, bodyX - 2, y - 13, 5, 2, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 1, y - 14, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 14, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 1, y - 14, C.HERO_HAIR_LIGHT);
    // (iter26: wider ponytail shaft with gradient)
    PA.rect(ctx, ponytailX - 2, y - 16 + ptY, 5, 1, C.HERO_HAIR_DARK);
    PA.rect(ctx, ponytailX - 1, y - 17 + ptY, 3, 1, C.HERO_HAIR_MID);
    PA.rect(ctx, ponytailX - 1, y - 18 + ptY, 3, 1, '#8a5a40');
    PA.rect(ctx, ponytailX - 1, y - 19 + ptY, 3, 1, C.HERO_HAIR_LIGHT);
    // (iter26: ponytail inner shine)
    PA.pixel(ctx, ponytailX, y - 17 + ptY, '#b08060');
    PA.pixel(ctx, ponytailX, y - 18 + ptY, '#c09070');
    // Tip pixels
    PA.pixel(ctx, ponytailX, y - 20 + ptY, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, ponytailX - 1, y - 20 + ptY, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, ponytailX + 1, y - 20 + ptY, C.HERO_FIRE_HAIR_TIP);
    // Flame tips at ponytail end (animated, iter25 curl variety)
    PA.pixel(ctx, ponytailX, y - 21 + ptY, flicker > 0.3 ? C.HERO_FIRE_FLAME_TIP : C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, ponytailX - 1, y - 21 + ptY, flicker > 0.6 ? C.HERO_FIRE_FLAME_TIP : C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, ponytailX + 1, y - 21 + ptY, flicker > 0.6 ? C.HERO_FIRE_FLAME_TIP : C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, ponytailX, y - 22 + ptY, flicker > 0.5 ? C.HERO_FIRE_EMBLEM : C.HERO_FIRE_FLAME_TIP);
    if (attacking || flicker > 0.7) {
      PA.pixel(ctx, ponytailX - 2, y - 21 + ptY, C.HERO_FIRE_EMBLEM);
      PA.pixel(ctx, ponytailX + 2, y - 21 + ptY, C.HERO_FIRE_EMBLEM);
      PA.pixel(ctx, ponytailX, y - 23 + ptY, C.HERO_FIRE_FLAME_TIP);
      PA.pixel(ctx, ponytailX - 1, y - 22 + ptY, C.HERO_FIRE_FLAME_TIP);
      PA.pixel(ctx, ponytailX + 1, y - 22 + ptY, C.HERO_FIRE_FLAME_TIP);
    }
    // Hair tie (iter28: ornate gold ribbon with gem)
    PA.pixel(ctx, bodyX, y - 13, C.HERO_GEM_FIRE);
    PA.pixel(ctx, bodyX - 1, y - 13, C.HERO_GOLD);
    PA.pixel(ctx, bodyX + 1, y - 13, C.HERO_GOLD);
    PA.pixel(ctx, bodyX - 2, y - 13, C.HERO_FIRE_CHAIN_GOLD);
    PA.pixel(ctx, bodyX + 2, y - 13, C.HERO_FIRE_CHAIN_GOLD);

    // === Short battle cloak (behind body, semi-transparent) ===
    ctx.save();
    ctx.globalAlpha = 0.6;
    const cloakSwayX = hero.moving ? [0, -1, 0, 1][f] * 1.2 : (attacking ? -2 : 0);
    const cloakX = x + Math.round(cloakSwayX);
    PA.rect(ctx, cloakX - 4, y + 1, 9, 3, C.HERO_FIRE_CLOAK);
    PA.pixel(ctx, cloakX - 4, y + 1, C.HERO_FIRE_CLOAK_EDGE);
    PA.pixel(ctx, cloakX + 4, y + 1, C.HERO_FIRE_CLOAK_EDGE);
    PA.pixel(ctx, cloakX - 4, y + 3, C.HERO_FIRE_CLOAK_EDGE);
    PA.pixel(ctx, cloakX + 4, y + 3, C.HERO_FIRE_CLOAK_EDGE);
    ctx.restore();

    // === Tiny feet (dark boots) ===
    if (hero.moving) {
      if (f < 2) {
        PA.rect(ctx, x - 2, y + 4, 2, 1, '#2a1010');
        PA.rect(ctx, x + 1, y + 4, 2, 1, '#2a1010');
      } else {
        PA.rect(ctx, x - 3, y + 4, 2, 1, '#2a1010');
        PA.rect(ctx, x + 2, y + 4, 2, 1, '#2a1010');
      }
    } else {
      PA.rect(ctx, x - 2, y + 4, 2, 1, '#2a1010');
      PA.rect(ctx, x + 1, y + 4, 2, 1, '#2a1010');
    }

    // === Mini Crimson Dress (4px tall, MapleStory tiny body) ===
    const dressX = x + Math.round(dressSwayX);
    PA.rect(ctx, dressX - 3, y + 1, 7, 1, C.HERO_FIRE_ROBE);
    PA.rect(ctx, dressX - 4, y + 2, 9, 1, C.HERO_FIRE_ROBE);
    PA.rect(ctx, dressX - 4, y + 3, 9, 1, C.HERO_FIRE_ROBE_DARK);
    // Flame emblem pattern on skirt
    PA.pixel(ctx, dressX - 3, y + 3, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, dressX - 1, y + 3, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, dressX + 1, y + 3, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, dressX + 3, y + 3, C.HERO_FIRE_EMBLEM);
    // Gold trim at hem
    PA.pixel(ctx, dressX - 4, y + 3, flicker > 0 ? C.HERO_GOLD : C.HERO_FIRE_CHAIN_GOLD);
    PA.pixel(ctx, dressX, y + 3, C.HERO_GOLD);
    PA.pixel(ctx, dressX + 4, y + 3, flicker > 0 ? C.HERO_GOLD : C.HERO_FIRE_CHAIN_GOLD);
    // [iter5] Dress fold highlights (light gleam)
    PA.pixel(ctx, dressX - 2, y + 2, C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, dressX + 2, y + 2, C.HERO_FIRE_ROBE_LIGHT);
    // [iter5] Back ribbon bow (gold sash)
    PA.pixel(ctx, dressX, y + 1, C.HERO_GEM_FIRE);
    PA.pixel(ctx, dressX - 1, y + 1, C.HERO_FIRE_CHAIN_GOLD);
    PA.pixel(ctx, dressX + 1, y + 1, C.HERO_FIRE_CHAIN_GOLD);

    // === Upper Torso (tiny) ===
    PA.rect(ctx, x - 2, y - 1, 5, 2, C.HERO_FIRE_ROBE);
    PA.rect(ctx, x - 2, y, 5, 1, C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, x, y - 1, C.HERO_GEM_FIRE);
    // Gold chain belt
    PA.rect(ctx, x - 3, y + 1, 7, 1, C.HERO_GOLD);
    PA.pixel(ctx, x, y + 1, flicker > 0.5 ? '#ffffff' : C.HERO_GEM_FIRE);

    // === Mini Golden Pauldrons (2x1 each, chibi-sized) ===
    PA.rect(ctx, x - 4, y - 1, 2, 1, C.HERO_FIRE_ARMOR);
    PA.pixel(ctx, x - 4, y - 1, C.HERO_FIRE_ARMOR_LIGHT);
    PA.rect(ctx, x + 3, y - 1, 2, 1, C.HERO_FIRE_ARMOR);
    PA.pixel(ctx, x + 4, y - 1, C.HERO_FIRE_ARMOR_LIGHT);

    // === Mini Arms ===
    const armOffset = hero.moving ? (f % 2) : 0;
    PA.pixel(ctx, x - 3, y - 1 + armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x - 3, y + armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x - 3, y - 1 + armOffset, C.HERO_FIRE_ARMOR_DARK);
    PA.pixel(ctx, x + 3, y - 1 - armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x + 3, y - armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x + 3, y - 1 - armOffset, C.HERO_FIRE_ARMOR_DARK);
    // [iter6] Gold wrist bracelets
    PA.pixel(ctx, x - 3, y + armOffset, C.HERO_FIRE_CHAIN_GOLD);
    PA.pixel(ctx, x + 3, y - armOffset, C.HERO_FIRE_CHAIN_GOLD);

    // === Neck ===
    PA.rect(ctx, x - 1, y - 2, 3, 1, C.HERO_SKIN);
    // Flame necklace
    PA.pixel(ctx, x - 1, y - 2, flicker > 0 ? C.HERO_FIRE_EMBLEM : C.HERO_FIRE_CROWN_DARK);
    PA.pixel(ctx, x, y - 2, flicker > 0.3 ? C.HERO_GEM_FIRE : C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, x + 1, y - 2, flicker > 0 ? C.HERO_FIRE_EMBLEM : C.HERO_FIRE_CROWN_DARK);

    // === BIG HEAD (MapleStory chibi, 8px tall round) ===
    // Dark warm outline
    PA.rect(ctx, x - 3, y - 11, 7, 1, '#2a1515');
    PA.rect(ctx, x - 5, y - 10, 1, 7, '#2a1515');
    PA.rect(ctx, x + 5, y - 10, 1, 7, '#2a1515');
    PA.pixel(ctx, x - 4, y - 3, '#2a1515');
    PA.pixel(ctx, x + 4, y - 3, '#2a1515');
    PA.pixel(ctx, x - 4, y - 10, '#2a1515');
    PA.pixel(ctx, x + 4, y - 10, '#2a1515');
    // Face fill
    PA.rect(ctx, x - 4, y - 10, 9, 7, C.HERO_SKIN);
    PA.rect(ctx, x - 3, y - 11, 7, 1, C.HERO_SKIN);
    PA.pixel(ctx, x - 3, y - 11, '#2a1515');
    PA.pixel(ctx, x + 3, y - 11, '#2a1515');
    PA.pixel(ctx, x + 4, y - 7, '#edd0b8');
    PA.pixel(ctx, x - 4, y - 7, '#edd0b8');

    // === FACE (iter11-20: natural chibi expression, warm palette) ===
    const eyeT = (time || 0) / 700;
    const eyeGlint = (Math.sin(eyeT) + 1) / 2;

    // --- Forehead (iter20: warm glow) ---
    PA.pixel(ctx, x - 1, y - 10, '#fff5ea');
    PA.pixel(ctx, x, y - 10, '#fff5ea');
    PA.pixel(ctx, x + 1, y - 10, '#fff0e0');

    // --- Eyebrows (iter14: natural arch with gradient) ---
    PA.pixel(ctx, x - 3, y - 9, '#e8d0c0');
    PA.pixel(ctx, x - 2, y - 9, '#f5e5d5');
    PA.pixel(ctx, x + 2, y - 9, '#f5e5d5');
    PA.pixel(ctx, x + 3, y - 9, '#e8d0c0');
    // (iter18: temple shadow)
    PA.pixel(ctx, x - 4, y - 9, '#ddc0a8');
    PA.pixel(ctx, x + 4, y - 9, '#ddc0a8');

    // --- Eyes (bright, lively chibi eyes, warm palette) ---
    // Left eye - lid with inner glow
    PA.pixel(ctx, x - 3, y - 8, '#281008');
    PA.pixel(ctx, x - 2, y - 8, '#331510');
    PA.pixel(ctx, x - 1, y - 8, '#886644');
    // Left eye - iris (dark | amber | catchlight)
    PA.pixel(ctx, x - 3, y - 7, '#3a1a10');
    PA.pixel(ctx, x - 2, y - 7, '#dd8844');
    PA.pixel(ctx, x - 1, y - 7, '#ffffff');
    // Right eye - lid with inner glow
    PA.pixel(ctx, x + 1, y - 8, '#886644');
    PA.pixel(ctx, x + 2, y - 8, '#331510');
    PA.pixel(ctx, x + 3, y - 8, '#281008');
    // Right eye - iris (catchlight | amber | dark)
    PA.pixel(ctx, x + 1, y - 7, '#ffffff');
    PA.pixel(ctx, x + 2, y - 7, '#dd8844');
    PA.pixel(ctx, x + 3, y - 7, '#3a1a10');
    // (iter13: gentle catchlight pulse)
    if (eyeGlint > 0.65) {
      ctx.save(); ctx.globalAlpha = (eyeGlint - 0.65) * 2.8;
      PA.pixel(ctx, x - 2, y - 8, '#664422');
      PA.pixel(ctx, x + 2, y - 8, '#664422');
      ctx.restore();
    }

    // --- Eyelashes (iter14: curved, warm color) ---
    PA.pixel(ctx, x - 4, y - 8, '#2a1515');
    PA.pixel(ctx, x - 4, y - 7, '#4a2a2a');
    PA.pixel(ctx, x + 4, y - 8, '#2a1515');
    PA.pixel(ctx, x + 4, y - 7, '#4a2a2a');

    // --- Under-eye + Nose + Blush row (y-6) ---
    PA.pixel(ctx, x - 2, y - 6, '#e8c8b0');
    PA.pixel(ctx, x + 2, y - 6, '#e8c8b0');
    // (iter17: soft blush)
    PA.pixel(ctx, x - 3, y - 6, '#ffbbbb');
    PA.pixel(ctx, x + 3, y - 6, '#ffbbbb');
    PA.pixel(ctx, x - 4, y - 6, '#ffdddd');
    PA.pixel(ctx, x + 4, y - 6, '#ffdddd');
    // (iter15: tiny nose)
    PA.pixel(ctx, x, y - 6, '#dcc0a8');
    PA.pixel(ctx, x + 1, y - 6, '#fff0e0');

    // --- Mouth (smile: light corners = raised, dark center = open) ---
    PA.pixel(ctx, x - 1, y - 5, '#d8a090');
    PA.pixel(ctx, x, y - 5, '#c07060');
    PA.pixel(ctx, x + 1, y - 5, '#d8a090');

    // --- Lower face (iter18: jaw highlight) ---
    PA.pixel(ctx, x - 3, y - 4, '#fff0e0');
    PA.pixel(ctx, x + 3, y - 4, '#fff0e0');
    PA.pixel(ctx, x, y - 3, '#fff0e8');

    // === FRONT HAIR (iter21-30: strands, gradient, curls, ornaments) ===
    // --- Bangs (iter21: individual strand highlights) ---
    PA.rect(ctx, bodyX - 4, y - 11, 9, 2, C.HERO_HAIR_MID);
    PA.rect(ctx, bodyX - 3, y - 12, 7, 1, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 2, y - 10, '#c09880');
    PA.pixel(ctx, bodyX, y - 10, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 2, y - 10, '#c09880');
    PA.pixel(ctx, bodyX - 1, y - 10, C.HERO_HAIR_DARK);
    PA.pixel(ctx, bodyX + 1, y - 10, C.HERO_HAIR_DARK);
    PA.pixel(ctx, bodyX - 3, y - 10, C.HERO_HAIR_DARK);
    PA.pixel(ctx, bodyX + 3, y - 10, C.HERO_HAIR_MID);
    // (iter22: bangs edge)
    PA.pixel(ctx, bodyX - 4, y - 10, C.HERO_HAIR_DARK);
    PA.pixel(ctx, bodyX + 4, y - 10, C.HERO_HAIR_DARK);

    // --- Side hair left (iter23: 4-tone gradient + iter24: inner glow) ---
    PA.rect(ctx, bodyX - 6, y - 10, 2, 3, C.HERO_HAIR_DARK);
    PA.rect(ctx, bodyX - 6, y - 7, 2, 2, '#8a5a40');
    PA.rect(ctx, bodyX - 6, y - 5, 2, 2, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 5, y - 8, '#a07060');
    PA.pixel(ctx, bodyX - 5, y - 5, '#b08070');
    // (iter25: curled tips)
    PA.pixel(ctx, bodyX - 6, y - 3, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, bodyX - 5, y - 2, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, bodyX - 6, y - 1, C.HERO_FIRE_HAIR_TIP);
    // Outer wisp
    PA.pixel(ctx, bodyX - 7, y - 8, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 7, y - 7, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, bodyX - 7, y - 6, C.HERO_FIRE_HAIR_TIP);

    // --- Side hair right (mirror, iter23-25) ---
    PA.rect(ctx, bodyX + 5, y - 10, 2, 3, C.HERO_HAIR_DARK);
    PA.rect(ctx, bodyX + 5, y - 7, 2, 2, '#8a5a40');
    PA.rect(ctx, bodyX + 5, y - 5, 2, 2, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX + 6, y - 8, '#a07060');
    PA.pixel(ctx, bodyX + 6, y - 5, '#b08070');
    PA.pixel(ctx, bodyX + 5, y - 3, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, bodyX + 6, y - 2, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, bodyX + 5, y - 1, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, bodyX + 7, y - 8, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX + 7, y - 7, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, bodyX + 7, y - 6, C.HERO_FIRE_HAIR_TIP);

    // --- Top volume (iter29) ---
    PA.rect(ctx, bodyX - 3, y - 13, 7, 1, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 2, y - 13, '#9a7060');
    PA.pixel(ctx, bodyX + 2, y - 13, '#9a7060');
    PA.rect(ctx, bodyX - 2, y - 14, 5, 1, C.HERO_HAIR_LIGHT);

    // --- Hair shine (iter27: multi-spot animated) ---
    PA.pixel(ctx, bodyX - 1, y - 12, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 1, y - 12, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 12, '#d8b8a0');
    const hairShine = Math.sin((time || 0) / 450);
    const hairShine2 = Math.sin((time || 0) / 450 + Math.PI);
    if (hairShine > 0.4) {
      ctx.save(); ctx.globalAlpha = (hairShine - 0.4) * 1.6;
      PA.pixel(ctx, bodyX - 4, y - 7, '#ffddaa');
      PA.pixel(ctx, bodyX + 3, y - 4, '#ffddaa');
      ctx.restore();
    }
    if (hairShine2 > 0.5) {
      ctx.save(); ctx.globalAlpha = (hairShine2 - 0.5) * 2;
      PA.pixel(ctx, bodyX + 6, y - 3, '#ffddaa');
      ctx.restore();
    }

    // --- Flyaway wisps ---
    PA.pixel(ctx, bodyX - 7, y - 5, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, bodyX + 7, y - 5, C.HERO_FIRE_HAIR_TIP);

    // === FIRE CROWN (iter7: pulsing gem animation) ===
    const crownPulse = (Math.sin((time || 0) / 400) + 1) / 2;
    PA.pixel(ctx, bodyX - 2, y - 15, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX - 1, y - 16, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX, y - 17, C.HERO_CROWN_GOLD);
    // [iter7] Center gem pulses between fire and white
    PA.pixel(ctx, bodyX, y - 16, crownPulse > 0.6 ? '#ffffff' : (flicker > 0.5 ? C.HERO_FIRE_FLAME_TIP : C.HERO_GEM_FIRE));
    PA.pixel(ctx, bodyX + 1, y - 16, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX + 2, y - 15, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX - 3, y - 14, crownPulse > 0.7 ? C.HERO_FIRE_EMBLEM : C.HERO_FIRE_CROWN_DARK);
    PA.pixel(ctx, bodyX + 3, y - 14, crownPulse > 0.7 ? C.HERO_FIRE_EMBLEM : C.HERO_FIRE_CROWN_DARK);
    // [iter7] Dancing flame on crown (enhanced)
    if (flicker > 0.3) {
      PA.pixel(ctx, bodyX, y - 18, C.HERO_FIRE_EMBLEM);
    }
    if (crownPulse > 0.8) {
      ctx.save(); ctx.globalAlpha = crownPulse;
      PA.pixel(ctx, bodyX - 1, y - 18, C.HERO_FIRE_FLAME_TIP);
      PA.pixel(ctx, bodyX + 1, y - 18, C.HERO_FIRE_FLAME_TIP);
      ctx.restore();
    }

    // Fire crystal earrings
    const earringFlicker = Math.sin((time || 0) / 200);
    PA.pixel(ctx, x - 5, y - 7, earringFlicker > 0 ? C.HERO_GEM_FIRE : C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, x - 5, y - 6, C.HERO_FIRE_CHAIN_GOLD);
    PA.pixel(ctx, x + 5, y - 7, earringFlicker > 0 ? C.HERO_GEM_FIRE : C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, x + 5, y - 6, C.HERO_FIRE_CHAIN_GOLD);

    // === Small Phoenix Staff (iter8: weapon glow) ===
    const weaponX = x + Math.round(weaponExtendX);
    const weaponGlow = (Math.sin((time || 0) / 300) + 1) / 2;
    PA.rect(ctx, weaponX + 5, y - 10, 1, 13, '#5a3020');
    PA.pixel(ctx, weaponX + 5, y - 5, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 5, y - 3, C.HERO_GOLD);
    // Phoenix head
    PA.pixel(ctx, weaponX + 5, y - 12, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, weaponX + 5, y - 13, C.HERO_GEM_FIRE);
    PA.pixel(ctx, weaponX + 4, y - 12, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, weaponX + 6, y - 12, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, weaponX + 5, y - 14, flicker > 0.5 ? '#ffffff' : C.HERO_FIRE_FLAME_TIP);
    // [iter8] Weapon halo glow
    ctx.save();
    ctx.globalAlpha = weaponGlow * 0.35;
    PA.pixel(ctx, weaponX + 4, y - 14, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, weaponX + 6, y - 14, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, weaponX + 5, y - 15, C.HERO_FIRE_FLAME_TIP);
    // [iter8] Rising ember spark
    const emberY = ((time || 0) / 500) % 1;
    PA.pixel(ctx, weaponX + 5, y - 10 - Math.floor(emberY * 4), C.HERO_FIRE_FLAME_TIP);
    ctx.restore();
    if (attacking) {
      // Wings spread
      PA.pixel(ctx, weaponX + 3, y - 12, C.HERO_FIRE_EMBLEM);
      PA.pixel(ctx, weaponX + 7, y - 12, C.HERO_FIRE_EMBLEM);
      PA.pixel(ctx, weaponX + 5, y - 15, '#ffffff');
      PA.pixel(ctx, weaponX + 5, y - 16, C.HERO_GEM_FIRE);
      PA.pixel(ctx, weaponX + 4, y - 13, C.HERO_FIRE_HAIR_TIP);
      PA.pixel(ctx, weaponX + 6, y - 13, C.HERO_FIRE_HAIR_TIP);
    }

    // === Fire element particles (iter9: enhanced variety) ===
    if (!hero.moving && !attacking) {
      const flameTime = (time || 0) / 250;
      const flame1Y = Math.sin(flameTime) * 2;
      const flame2Y = Math.sin(flameTime + Math.PI * 0.66) * 1.5;
      const flame3Y = Math.sin(flameTime + Math.PI * 1.33) * 2;
      ctx.save();
      ctx.globalAlpha = 0.5;
      PA.pixel(ctx, x - 7, y - 4 + flame1Y, C.HERO_FIRE_EMBLEM);
      PA.pixel(ctx, x + 7, y - 6 + flame2Y, C.HERO_FIRE_FLAME_TIP);
      PA.pixel(ctx, x - 4, y - 14 + flame3Y, C.HERO_FIRE_HAIR_TIP);
      ctx.restore();
      // [iter9] Star sparkle
      const sparkleAlpha = (Math.sin(flameTime * 2) + 1) / 2;
      ctx.save();
      ctx.globalAlpha = sparkleAlpha * 0.6;
      PA.pixel(ctx, x + 4, y - 14 + flame3Y, '#ffffff');
      ctx.restore();
      // [iter9] Additional embers (rising)
      const ember4Y = Math.sin(flameTime * 1.5 + 2.0) * 1.5;
      const ember5Y = Math.sin(flameTime * 1.2 + 4.0) * 2;
      ctx.save();
      ctx.globalAlpha = 0.4;
      PA.pixel(ctx, x - 8, y - 8 + ember4Y, C.HERO_FIRE_EMBLEM);
      PA.pixel(ctx, x + 8, y - 2 + ember5Y, C.HERO_FIRE_FLAME_TIP);
      ctx.restore();
      // [iter9] Fire star burst (4-pixel cross)
      const starPhase = (Math.sin(flameTime * 3) + 1) / 2;
      if (starPhase > 0.7) {
        ctx.save();
        ctx.globalAlpha = (starPhase - 0.7) * 3.33;
        const starX = x + 6;
        const starY = y - 12 + Math.round(flame3Y);
        PA.pixel(ctx, starX, starY, '#ffffff');
        PA.pixel(ctx, starX - 1, starY, '#ffddaa');
        PA.pixel(ctx, starX + 1, starY, '#ffddaa');
        PA.pixel(ctx, starX, starY - 1, '#ffddaa');
        PA.pixel(ctx, starX, starY + 1, '#ffddaa');
        ctx.restore();
      }
    }

    // Fire aura when attacking
    if (attacking) {
      const t = (time || 0) / 150;
      for (let i = 0; i < 8; i++) {
        const angle = t + (i * Math.PI * 2) / 8;
        const r = 10;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 5 + Math.sin(angle) * r * 0.5);
        PA.pixel(ctx, px, py, 'rgba(255,102,34,0.6)');
      }
      for (let i = 0; i < 6; i++) {
        const angle = -(t) * 1.3 + (i * Math.PI * 2) / 6;
        const r = 6;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 5 + Math.sin(angle) * r * 0.4);
        PA.pixel(ctx, px, py, 'rgba(255,170,68,0.5)');
      }
    }
  },

  renderSelectionRing(ctx, x, y, time, colorPrefix) {
    const PA = DK.PixelArt;
    const t = (time || 0) / 300;
    // === 2I: 脈動幅度 30%→50% ===
    const pulse = Math.sin(t) * 0.5 + 0.5;

    // Pulsing selection ring (diamond shape at feet) — 2I: 5→6 點
    const prefix = colorPrefix || 'rgba(68,255,68,';
    const color = `${prefix}${pulse})`;
    PA.pixel(ctx, x, y + 5, color);
    PA.pixel(ctx, x - 3, y + 3, color);
    PA.pixel(ctx, x + 3, y + 3, color);
    PA.pixel(ctx, x - 4, y + 1, color);
    PA.pixel(ctx, x + 4, y + 1, color);
    PA.pixel(ctx, x - 3, y - 1, color);
    PA.pixel(ctx, x + 3, y - 1, color);
    PA.pixel(ctx, x, y - 3, color); // 第 6 點
  },

  renderRange(ctx, hero) {
    const T = DK.CONFIG.TILE_SIZE;
    const range = hero.type.range * T;
    // 根據元素類型選擇範圍指示顏色
    const rangeColorMap = {
      water: 'rgba(68,136,255,0.3)',
      fire: 'rgba(255,102,34,0.3)',
    };
    ctx.strokeStyle = rangeColorMap[hero.type.element] || 'rgba(68,136,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(hero.x, hero.y, range, 0, Math.PI * 2);
    ctx.stroke();
  },

  /**
   * 渲染英雄攻擊到目標的元素色虛線連線
   */
  renderAttackLine(ctx, hero, x, y) {
    const line = hero.attackLine;
    if (!line) return;

    // 根據英雄元素決定連線顏色
    const elementColors = {
      water: [68, 136, 255],
      fire: [255, 102, 34],
      ice: [100, 200, 240],
    };
    const rgb = elementColors[hero.type.element] || elementColors.water;
    const alpha = (line.timer / line.duration) * 0.6;

    ctx.save();
    ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.moveTo(x, y - 4); // 從英雄身體中心偏上
    ctx.lineTo(line.targetX, line.targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  },

  renderAura(ctx, hero, x, y, time) {
    const auraRange = hero.type.auraRange;
    if (!auraRange || auraRange <= 0) return;

    const T = DK.CONFIG.TILE_SIZE;
    const radius = auraRange * T;
    const t = (time || 0) / 1000;
    // === 2J: 脈動範圍 0.5-0.85 ===
    const pulse = 0.5 + Math.sin(t * 2) * 0.35;

    // 根據英雄元素選擇光環顏色 — 2J: 透明度 8%→15%
    const auraColors = {
      water: `rgba(68,136,255,${0.15 * pulse})`,
      fire: `rgba(255,102,34,${0.15 * pulse})`,
      ice: `rgba(100,200,240,${0.15 * pulse})`,
    };
    const borderColors = {
      water: `rgba(68,136,255,${0.2 * pulse})`,
      fire: `rgba(255,102,34,${0.2 * pulse})`,
      ice: `rgba(100,200,240,${0.2 * pulse})`,
    };

    const fillColor = auraColors[hero.type.element] || auraColors.water;
    const strokeColor = borderColors[hero.type.element] || borderColors.water;

    // 半透明圓圈（脈動呼吸效果）
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 邊緣虛線圓 — 2J: 線寬 0.5→1.5px
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};
