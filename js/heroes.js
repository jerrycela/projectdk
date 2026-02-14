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

    // === LEVIATHAN: Deep Sea Witch - 14×14 core, Octopath-inspired details ===

    // Animation offsets
    let dressSwayX = 0;
    let hairFlowX = 0;
    let weaponExtendX = 0;
    let bodyLeanX = 0;
    let cloakSwayX = 0;

    if (hero.moving) {
      const swayPattern = [0, -1, 0, 1];
      dressSwayX = swayPattern[f];
      hairFlowX = 1 + (f === 3 ? 1 : 0);
      cloakSwayX = swayPattern[f] * 1.5; // Cloak sways more than dress
    }

    if (attacking) {
      weaponExtendX = 2;
      bodyLeanX = -1;
      hairFlowX = 2;
      cloakSwayX = -2; // Cloak flies back
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

    // Shadow (wider)
    PA.rect(ctx, x - 6, y + 5, 12, 2, 'rgba(0,0,0,0.3)');

    // === Layer 1: Semi-transparent sea-blue outer cloak (behind body) ===
    const cloakX = x + Math.round(cloakSwayX);
    ctx.save();
    ctx.globalAlpha = 0.6;
    PA.rect(ctx, cloakX - 6, y - 2, 13, 6, C.HERO_WATER_CLOAK);
    PA.rect(ctx, cloakX - 5, y - 3, 11, 1, C.HERO_WATER_CLOAK_DARK);
    // Cloak edges (lighter)
    PA.pixel(ctx, cloakX - 6, y - 2, C.HERO_WATER_CLOAK_EDGE);
    PA.pixel(ctx, cloakX - 6, y + 3, C.HERO_WATER_CLOAK_EDGE);
    PA.pixel(ctx, cloakX + 6, y - 2, C.HERO_WATER_CLOAK_EDGE);
    PA.pixel(ctx, cloakX + 6, y + 3, C.HERO_WATER_CLOAK_EDGE);
    ctx.restore();

    // Feet (elegant, under dress)
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

    // === Layer 2: Dress with water-wave pattern & pearl trim ===
    const dressX = x + Math.round(dressSwayX);
    // Dress lower (flowing with wave pattern)
    PA.rect(ctx, dressX - 5, y + 1, 11, 3, C.HERO_ROBE_DARK);
    PA.rect(ctx, dressX - 6, y + 3, 13, 1, C.HERO_ROBE_DARK);

    // Water wave pattern (simplified wave motif)
    PA.pixel(ctx, dressX - 4, y + 2, C.HERO_WATER_WAVE_PATTERN);
    PA.pixel(ctx, dressX - 3, y + 2, C.HERO_WATER_WAVE_PATTERN);
    PA.pixel(ctx, dressX - 1, y + 2, C.HERO_WATER_WAVE_PATTERN);
    PA.pixel(ctx, dressX + 1, y + 2, C.HERO_WATER_WAVE_PATTERN);
    PA.pixel(ctx, dressX + 3, y + 2, C.HERO_WATER_WAVE_PATTERN);

    // Pearl trim at hem
    PA.pixel(ctx, dressX - 5, y + 3, C.HERO_PEARL);
    PA.pixel(ctx, dressX - 2, y + 3, C.HERO_PEARL);
    PA.pixel(ctx, dressX + 1, y + 3, C.HERO_PEARL);
    PA.pixel(ctx, dressX + 4, y + 3, C.HERO_PEARL);

    // Pleating shadows
    PA.pixel(ctx, dressX - 2, y + 2, C.HERO_ROBE_DARK);
    PA.pixel(ctx, dressX + 1, y + 2, C.HERO_ROBE_DARK);

    // === Layer 3: Dress upper (V-neck with silver trim & brooch) ===
    PA.rect(ctx, x - 3, y - 3, 7, 4, C.HERO_ROBE);
    PA.rect(ctx, x - 3, y - 4, 7, 1, C.HERO_ROBE_LIGHT);

    // V-neck with silver trim
    PA.pixel(ctx, x - 1, y - 3, C.HERO_SILVER);
    PA.pixel(ctx, x, y - 2, C.HERO_SILVER);
    PA.pixel(ctx, x + 1, y - 3, C.HERO_SILVER);

    // Brooch at chest (water crystal)
    PA.pixel(ctx, x, y - 3, C.HERO_GEM_WATER);

    // === Layer 4: Waist belt (gold chain with large gem & tassels) ===
    PA.rect(ctx, x - 3, y, 7, 2, C.HERO_ROBE_DARK);
    PA.rect(ctx, x - 2, y, 5, 1, C.HERO_GOLD); // gold chain belt
    PA.pixel(ctx, x, y, C.HERO_GEM_WATER); // large water crystal center
    PA.pixel(ctx, x, y + 1, C.HERO_PEARL); // pearl drop
    PA.pixel(ctx, x - 1, y + 1, C.HERO_SILVER); // tassel left
    PA.pixel(ctx, x + 1, y + 1, C.HERO_SILVER); // tassel right

    // Dress fold shadows
    PA.pixel(ctx, x - 3, y - 2, C.HERO_ROBE_DARK);
    PA.pixel(ctx, x + 3, y - 2, C.HERO_ROBE_DARK);

    // Shoulders (simplified, no fur - cleaner look)
    PA.rect(ctx, x - 4, y - 4, 2, 1, C.HERO_ROBE);
    PA.rect(ctx, x + 3, y - 4, 2, 1, C.HERO_ROBE);
    PA.pixel(ctx, x - 4, y - 5, C.HERO_SILVER);
    PA.pixel(ctx, x + 4, y - 5, C.HERO_SILVER);

    // Arms (slim, with bracelets)
    const armOffset = hero.moving ? (f % 2) : 0;
    PA.rect(ctx, x - 5, y - 2 + armOffset, 1, 2, C.HERO_SKIN);
    PA.pixel(ctx, x - 6, y + armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x - 5, y - 2 + armOffset, C.HERO_SILVER); // silver bracelet
    PA.rect(ctx, x + 5, y - 2 - armOffset, 1, 2, C.HERO_SKIN);
    PA.pixel(ctx, x + 6, y - armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x + 5, y - 2 - armOffset, C.HERO_SILVER); // silver bracelet

    // Neck
    PA.rect(ctx, x - 1, y - 5, 3, 1, C.HERO_SKIN);

    // Pearl necklace (3 pearls)
    PA.pixel(ctx, x - 1, y - 5, C.HERO_PEARL);
    PA.pixel(ctx, x, y - 5, C.HERO_PEARL);
    PA.pixel(ctx, x + 1, y - 5, C.HERO_PEARL);

    // === Layer 5: Head (soft, cute face - Octopath style) ===
    PA.rect(ctx, x - 3, y - 10, 7, 5, C.HERO_SKIN);
    PA.rect(ctx, x - 2, y - 11, 5, 1, C.HERO_SKIN);
    PA.pixel(ctx, x - 1, y - 12, C.HERO_SKIN);
    PA.pixel(ctx, x, y - 12, C.HERO_SKIN);
    PA.pixel(ctx, x + 1, y - 12, C.HERO_SKIN);

    // Minimal face shading (very subtle)
    PA.pixel(ctx, x + 3, y - 8, '#f5e5d5');
    PA.pixel(ctx, x - 3, y - 8, '#f5e5d5');

    // Simple eyes (1px each - Octopath style)
    PA.pixel(ctx, x - 2, y - 9, '#2a4a6a'); // Left eye
    PA.pixel(ctx, x + 2, y - 9, '#2a4a6a'); // Right eye

    // Tiny nose (1px)
    PA.pixel(ctx, x, y - 8, '#f0dcc8');

    // Small smile (2px)
    PA.pixel(ctx, x - 1, y - 7, '#e8b8a8');
    PA.pixel(ctx, x, y - 7, '#e8b8a8');

    // === Long flowing SILVER-BLUE hair (3 layers) - with flow animation ===
    const hairX = x + Math.round(hairFlowX);
    const bodyX = x + Math.round(bodyLeanX);
    // Inner layer (deep blue-gray, close to face)
    PA.rect(ctx, bodyX - 4, y - 11, 2, 8, C.HERO_WATER_HAIR_DARK);
    PA.rect(ctx, bodyX + 3, y - 11, 2, 8, C.HERO_WATER_HAIR_DARK);
    // Middle layer (medium silver-blue) - flows more
    PA.rect(ctx, hairX - 5, y - 10, 1, 7, C.HERO_WATER_HAIR_MID);
    PA.rect(ctx, hairX + 5, y - 10, 1, 7, C.HERO_WATER_HAIR_MID);
    PA.pixel(ctx, bodyX - 3, y - 12, C.HERO_WATER_HAIR_MID);
    PA.pixel(ctx, bodyX + 3, y - 12, C.HERO_WATER_HAIR_MID);
    // Outer layer (bright silver at tips) - flows most
    PA.pixel(ctx, hairX - 5, y - 4, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX - 5, y - 3, C.HERO_WATER_HAIR_TIP);
    PA.pixel(ctx, hairX + 5, y - 4, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, hairX + 5, y - 3, C.HERO_WATER_HAIR_TIP);
    // Top hair
    PA.rect(ctx, bodyX - 2, y - 13, 5, 1, C.HERO_WATER_HAIR_MID);
    PA.pixel(ctx, bodyX - 1, y - 14, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 14, C.HERO_WATER_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 1, y - 14, C.HERO_WATER_HAIR_LIGHT);

    // Hair ornaments (shell-shaped hairpin)
    PA.pixel(ctx, bodyX - 4, y - 10, C.HERO_PEARL);
    PA.pixel(ctx, bodyX + 4, y - 10, C.HERO_PEARL);

    // === Layer 6: SILVER ICE CROWN (5-point design) ===
    PA.pixel(ctx, bodyX - 2, y - 14, C.HERO_WATER_CROWN);
    PA.pixel(ctx, bodyX - 1, y - 15, C.HERO_WATER_CROWN);
    PA.pixel(ctx, bodyX, y - 16, C.HERO_WATER_CROWN); // center spire
    PA.pixel(ctx, bodyX, y - 15, C.HERO_WATER_CROWN_GEM); // sea-blue gem center
    PA.pixel(ctx, bodyX + 1, y - 15, C.HERO_WATER_CROWN);
    PA.pixel(ctx, bodyX + 2, y - 14, C.HERO_WATER_CROWN);
    // Additional spires for 5-point design
    PA.pixel(ctx, bodyX - 3, y - 13, C.HERO_WATER_CROWN);
    PA.pixel(ctx, bodyX + 3, y - 13, C.HERO_WATER_CROWN);

    // Forehead highlight (soft)
    PA.pixel(ctx, x, y - 11, '#fff5ea');

    // Water crystal earrings (animated sway)
    const earringOffset = hero.moving ? Math.sin(time / 200) * 0.5 : 0;
    PA.pixel(ctx, x - 4, y - 9 + earringOffset, C.HERO_GEM_WATER);
    PA.pixel(ctx, x - 4, y - 8 + earringOffset, C.HERO_SILVER);
    PA.pixel(ctx, x + 4, y - 9 + earringOffset, C.HERO_GEM_WATER);
    PA.pixel(ctx, x + 4, y - 8 + earringOffset, C.HERO_SILVER);

    // === Layer 7: Enhanced trident with shell-crystal design ===
    const weaponX = x + Math.round(weaponExtendX);
    // Shaft (silver-blue)
    PA.rect(ctx, weaponX + 7, y - 11, 2, 15, '#5a8aaa');
    // Gold grip rings
    PA.pixel(ctx, weaponX + 8, y - 10, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 8, y - 8, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 8, y - 6, C.HERO_GOLD);

    // Trident head - shell-shaped crystal design
    PA.pixel(ctx, weaponX + 6, y - 14, '#66aadd');
    PA.pixel(ctx, weaponX + 7, y - 15, '#88ccff');
    PA.pixel(ctx, weaponX + 8, y - 16, C.HERO_GEM_WATER); // water crystal tip
    PA.pixel(ctx, weaponX + 9, y - 15, '#88ccff');
    PA.pixel(ctx, weaponX + 10, y - 14, '#66aadd');
    PA.pixel(ctx, weaponX + 8, y - 15, '#aaddff'); // center prong
    PA.pixel(ctx, weaponX + 8, y - 14, C.HERO_SILVER); // shell pattern

    // Spiral shell pattern
    PA.pixel(ctx, weaponX + 7, y - 14, C.HERO_PEARL);
    PA.pixel(ctx, weaponX + 9, y - 14, C.HERO_PEARL);

    // Crystal glow
    PA.pixel(ctx, weaponX + 8, y - 17, '#ccddff');
    if (attacking) {
      PA.pixel(ctx, weaponX + 7, y - 16, '#88ccff');
      PA.pixel(ctx, weaponX + 9, y - 16, '#88ccff');
      PA.pixel(ctx, weaponX + 8, y - 18, '#ffffff');
      PA.pixel(ctx, weaponX + 8, y - 19, C.HERO_GEM_WATER);
      // Crystal refraction effect
      PA.pixel(ctx, weaponX + 6, y - 15, '#aaccff');
      PA.pixel(ctx, weaponX + 10, y - 15, '#aaccff');
    }

    // === Layer 8: Water element particles (idle floating bubbles) ===
    if (!hero.moving && !attacking) {
      const bubbleTime = (time || 0) / 300;
      const bubble1Y = Math.sin(bubbleTime) * 2;
      const bubble2Y = Math.sin(bubbleTime + Math.PI) * 2;
      PA.pixel(ctx, x - 6, y - 2 + bubble1Y, 'rgba(136,204,255,0.5)');
      PA.pixel(ctx, x + 6, y - 3 + bubble2Y, 'rgba(136,204,255,0.5)');
    }

    // Water aura when attacking (larger radius)
    if (attacking) {
      const t = (time || 0) / 150;
      for (let i = 0; i < 8; i++) {
        const angle = t + (i * Math.PI * 2) / 8;
        const r = 9;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 4 + Math.sin(angle) * r * 0.5);
        PA.pixel(ctx, px, py, 'rgba(68,136,255,0.6)');
      }
    }
  },

  renderFireMage(ctx, hero, x, y, time) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = hero.animFrame;
    const attacking = hero.attacking && hero.attackTimer > hero.type.attackCooldown * 0.7;

    // === BAAL: Fire Queen - 14×14 core, Octopath-inspired details ===

    // Animation offsets
    let dressSwayX = 0;
    let ponytailSwayX = 0;
    let ponytailSwayY = 0;
    let weaponExtendX = 0;
    let bodyLeanX = 0;
    let cloakSwayX = 0;

    if (hero.moving) {
      const swayPattern = [0, -1, 0, 1];
      dressSwayX = swayPattern[f];
      ponytailSwayX = swayPattern[f] * 0.5; // Ponytail sways gently
      ponytailSwayY = (f % 2) ? -1 : 0; // Slight bounce
      cloakSwayX = swayPattern[f] * 1.2; // Cloak sways more than dress
    }

    if (attacking) {
      weaponExtendX = 2;
      bodyLeanX = -1;
      ponytailSwayX = -2; // Ponytail flies back
      ponytailSwayY = -1;
      cloakSwayX = -2; // Cloak flies back
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

    // Shadow (wider)
    PA.rect(ctx, x - 6, y + 5, 12, 2, 'rgba(0,0,0,0.3)');

    // Flame animation time
    const flicker = Math.sin((time || 0) / 120);
    const cloakX = x + Math.round(cloakSwayX);

    // === Layer 1: Short battle cloak (waist-length, behind body) ===
    ctx.save();
    ctx.globalAlpha = 0.7;
    PA.rect(ctx, cloakX - 5, y - 2, 11, 4, C.HERO_FIRE_CLOAK);
    PA.rect(ctx, cloakX - 4, y - 3, 9, 1, C.HERO_FIRE_CLOAK_DARK);
    // Cloak edges (lighter, flame-like)
    PA.pixel(ctx, cloakX - 5, y - 2, C.HERO_FIRE_CLOAK_EDGE);
    PA.pixel(ctx, cloakX - 5, y + 1, C.HERO_FIRE_CLOAK_EDGE);
    PA.pixel(ctx, cloakX + 5, y - 2, C.HERO_FIRE_CLOAK_EDGE);
    PA.pixel(ctx, cloakX + 5, y + 1, C.HERO_FIRE_CLOAK_EDGE);
    ctx.restore();

    // Feet (dark boots)
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

    // === Layer 2: Dress with flame totem & gold trim ===
    const dressX = x + Math.round(dressSwayX);
    // Dress lower (dark crimson with flame pattern)
    PA.rect(ctx, dressX - 5, y + 1, 11, 3, C.HERO_FIRE_ROBE_DARK);
    PA.rect(ctx, dressX - 6, y + 3, 13, 1, C.HERO_FIRE_ROBE_DARK);

    // Flame totem pattern (stylized fire symbols)
    PA.pixel(ctx, dressX - 3, y + 2, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, dressX - 2, y + 1, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, dressX + 1, y + 2, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, dressX + 2, y + 1, C.HERO_FIRE_EMBLEM);

    // Gold trim at hem (animated flicker)
    PA.pixel(ctx, dressX - 5, y + 3, flicker > 0 ? C.HERO_GOLD : C.HERO_FIRE_CHAIN_GOLD);
    PA.pixel(ctx, dressX - 2, y + 3, C.HERO_GOLD);
    PA.pixel(ctx, dressX + 1, y + 3, C.HERO_GOLD);
    PA.pixel(ctx, dressX + 4, y + 3, flicker > 0 ? C.HERO_GOLD : C.HERO_FIRE_CHAIN_GOLD);

    // Pleating shadows
    PA.pixel(ctx, dressX - 2, y + 2, C.HERO_FIRE_ROBE_DARK);
    PA.pixel(ctx, dressX + 1, y + 2, C.HERO_FIRE_ROBE_DARK);

    // === Layer 3: Dress upper (fitted with flame embroidery) ===
    PA.rect(ctx, x - 3, y - 3, 7, 4, C.HERO_FIRE_ROBE);
    PA.rect(ctx, x - 3, y - 4, 7, 1, C.HERO_FIRE_ROBE_LIGHT);
    // Flame embroidery
    PA.pixel(ctx, x - 2, y - 3, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, x + 2, y - 3, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, x, y - 2, C.HERO_GEM_FIRE);

    // === Layer 4: Metal chain belt with flame gem ===
    PA.rect(ctx, x - 3, y, 7, 2, C.HERO_FIRE_ROBE_DARK);
    // Chain links (gold)
    PA.pixel(ctx, x - 2, y, C.HERO_FIRE_CHAIN_GOLD);
    PA.pixel(ctx, x - 1, y, C.HERO_GOLD);
    PA.pixel(ctx, x, y, flicker > 0.5 ? '#ffffff' : C.HERO_GEM_FIRE); // flame crystal (flickering)
    PA.pixel(ctx, x + 1, y, C.HERO_GOLD);
    PA.pixel(ctx, x + 2, y, C.HERO_FIRE_CHAIN_GOLD);
    // Flame gem drops
    PA.pixel(ctx, x - 1, y + 1, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, x + 1, y + 1, C.HERO_FIRE_EMBLEM);

    // Dress fold shadows
    PA.pixel(ctx, x - 3, y - 2, C.HERO_FIRE_ROBE_DARK);
    PA.pixel(ctx, x + 3, y - 2, C.HERO_FIRE_ROBE_DARK);

    // === Layer 5: Golden shoulder armor plates (3×2 px each) ===
    // Left shoulder armor
    PA.rect(ctx, x - 5, y - 5, 3, 2, C.HERO_FIRE_ARMOR);
    PA.pixel(ctx, x - 5, y - 5, C.HERO_FIRE_ARMOR_LIGHT); // highlight
    PA.pixel(ctx, x - 3, y - 4, C.HERO_FIRE_ARMOR_DARK); // shadow
    // Right shoulder armor
    PA.rect(ctx, x + 3, y - 5, 3, 2, C.HERO_FIRE_ARMOR);
    PA.pixel(ctx, x + 5, y - 5, C.HERO_FIRE_ARMOR_LIGHT); // highlight
    PA.pixel(ctx, x + 3, y - 4, C.HERO_FIRE_ARMOR_DARK); // shadow

    // Bare shoulders (visible skin)
    PA.rect(ctx, x - 4, y - 4, 2, 1, C.HERO_SKIN);
    PA.rect(ctx, x + 3, y - 4, 2, 1, C.HERO_SKIN);

    // Arms with gloves
    const armOffset = hero.moving ? (f % 2) : 0;
    PA.rect(ctx, x - 5, y - 2 + armOffset, 1, 2, C.HERO_SKIN);
    PA.pixel(ctx, x - 6, y + armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x - 5, y - 2 + armOffset, C.HERO_FIRE_ARMOR_DARK); // dark glove
    PA.rect(ctx, x + 5, y - 2 - armOffset, 1, 2, C.HERO_SKIN);
    PA.pixel(ctx, x + 6, y - armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x + 5, y - 2 - armOffset, C.HERO_FIRE_ARMOR_DARK); // dark glove

    // Neck
    PA.rect(ctx, x - 1, y - 5, 3, 1, C.HERO_SKIN);

    // Flame necklace (animated)
    PA.pixel(ctx, x - 1, y - 5, flicker > 0 ? C.HERO_FIRE_EMBLEM : C.HERO_FIRE_CROWN_DARK);
    PA.pixel(ctx, x, y - 5, flicker > 0.3 ? C.HERO_GEM_FIRE : C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, x + 1, y - 5, flicker > 0 ? C.HERO_FIRE_EMBLEM : C.HERO_FIRE_CROWN_DARK);

    // === Layer 6: Head (soft, cute face - Octopath style) ===
    PA.rect(ctx, x - 3, y - 10, 7, 5, C.HERO_SKIN);
    PA.rect(ctx, x - 2, y - 11, 5, 1, C.HERO_SKIN);
    PA.pixel(ctx, x - 1, y - 12, C.HERO_SKIN);
    PA.pixel(ctx, x, y - 12, C.HERO_SKIN);
    PA.pixel(ctx, x + 1, y - 12, C.HERO_SKIN);

    // Minimal face shading (very subtle, warm tone)
    PA.pixel(ctx, x + 3, y - 8, '#f5e0d0');
    PA.pixel(ctx, x - 3, y - 8, '#f5e0d0');

    // Simple eyes (1px each - Octopath style)
    PA.pixel(ctx, x - 2, y - 9, '#6a3020'); // Left eye (warm brown)
    PA.pixel(ctx, x + 2, y - 9, '#6a3020'); // Right eye

    // Tiny nose (1px)
    PA.pixel(ctx, x, y - 8, '#f0dcc8');

    // Small smile (2px)
    PA.pixel(ctx, x - 1, y - 7, '#e8a898');
    PA.pixel(ctx, x, y - 7, '#e8a898');

    // === Flame-shaped HIGH PONYTAIL (upward style) ===
    const ponytailX = x + Math.round(ponytailSwayX);
    const ponytailY = Math.round(ponytailSwayY);
    const bodyX = x + Math.round(bodyLeanX);

    // Side hair (framing face)
    PA.rect(ctx, bodyX - 4, y - 11, 2, 4, C.HERO_HAIR_DARK);
    PA.rect(ctx, bodyX + 3, y - 11, 2, 4, C.HERO_HAIR_DARK);
    PA.pixel(ctx, bodyX - 3, y - 12, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX + 3, y - 12, C.HERO_HAIR_MID);

    // Base ponytail (gathered at top of head)
    PA.rect(ctx, bodyX - 2, y - 13, 5, 2, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 1, y - 14, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 14, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 1, y - 14, C.HERO_HAIR_LIGHT);

    // Ponytail extending upward and back (flame-shaped)
    PA.pixel(ctx, ponytailX, y - 15 + ponytailY, C.HERO_HAIR_MID);
    PA.pixel(ctx, ponytailX, y - 16 + ponytailY, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, ponytailX + 1, y - 16 + ponytailY, C.HERO_HAIR_MID);
    PA.pixel(ctx, ponytailX - 1, y - 16 + ponytailY, C.HERO_HAIR_MID);
    PA.pixel(ctx, ponytailX, y - 17 + ponytailY, C.HERO_HAIR_LIGHT);

    // Flame-tip effect at ponytail end (animated)
    PA.pixel(ctx, ponytailX, y - 18 + ponytailY, flicker > 0.3 ? C.HERO_FIRE_HAIR_TIP : C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, ponytailX, y - 19 + ponytailY, flicker > 0.5 ? C.HERO_FIRE_FLAME_TIP : C.HERO_FIRE_HAIR_TIP);
    if (attacking || flicker > 0.7) {
      PA.pixel(ctx, ponytailX, y - 20 + ponytailY, C.HERO_FIRE_EMBLEM);
    }

    // Hair tie (gold ribbon)
    PA.pixel(ctx, bodyX, y - 13, C.HERO_GOLD);
    PA.pixel(ctx, bodyX - 1, y - 13, C.HERO_FIRE_CHAIN_GOLD);
    PA.pixel(ctx, bodyX + 1, y - 13, C.HERO_FIRE_CHAIN_GOLD);

    // === Layer 7: FIRE CROWN (5-point design with dancing flames) ===
    PA.pixel(ctx, bodyX - 2, y - 14, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX - 1, y - 15, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX, y - 16, C.HERO_CROWN_GOLD); // center spire
    PA.pixel(ctx, bodyX + 1, y - 15, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX + 2, y - 14, C.HERO_CROWN_GOLD);
    // Additional spires for 5-point design
    PA.pixel(ctx, bodyX - 3, y - 13, C.HERO_FIRE_CROWN_DARK);
    PA.pixel(ctx, bodyX + 3, y - 13, C.HERO_FIRE_CROWN_DARK);

    // Flame gem at center (animated)
    PA.pixel(ctx, bodyX, y - 15, flicker > 0.5 ? C.HERO_FIRE_FLAME_TIP : C.HERO_GEM_FIRE);
    if (flicker > 0.3) {
      PA.pixel(ctx, bodyX, y - 17, C.HERO_FIRE_EMBLEM); // dancing flame
    }

    // Forehead highlight (soft, warm)
    PA.pixel(ctx, x, y - 11, '#fff5ea');

    // === Layer 8: Phoenix-shaped staff with flame crystal ===
    const weaponX = x + Math.round(weaponExtendX);
    // Staff shaft (dark wood)
    PA.rect(ctx, weaponX + 7, y - 10, 2, 14, '#5a3020');
    // Gold grip rings
    PA.pixel(ctx, weaponX + 8, y - 9, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 8, y - 7, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 8, y - 5, C.HERO_GOLD);

    // Phoenix head structure (flame crystal core)
    PA.pixel(ctx, weaponX + 8, y - 11, C.HERO_FIRE_CROWN_DARK);
    PA.pixel(ctx, weaponX + 8, y - 12, C.HERO_FIRE_EMBLEM);
    PA.pixel(ctx, weaponX + 8, y - 13, C.HERO_GEM_FIRE); // crystal center

    // Phoenix wings spreading (left and right)
    PA.pixel(ctx, weaponX + 7, y - 13, C.HERO_FIRE_EMBLEM); // left wing
    PA.pixel(ctx, weaponX + 6, y - 14, C.HERO_FIRE_HAIR_TIP);
    PA.pixel(ctx, weaponX + 9, y - 13, C.HERO_FIRE_EMBLEM); // right wing
    PA.pixel(ctx, weaponX + 10, y - 14, C.HERO_FIRE_HAIR_TIP);

    // Phoenix head/beak
    PA.pixel(ctx, weaponX + 8, y - 14, C.HERO_GEM_FIRE);
    PA.pixel(ctx, weaponX + 8, y - 15, flicker > 0.5 ? '#ffffff' : C.HERO_FIRE_FLAME_TIP);

    // Flame crest (animated flicker)
    if (flicker > 0) {
      PA.pixel(ctx, weaponX + 8, y - 16, C.HERO_FIRE_FLAME_TIP);
    }
    if (flicker > 0.5) {
      PA.pixel(ctx, weaponX + 7, y - 15, C.HERO_FIRE_HAIR_TIP);
      PA.pixel(ctx, weaponX + 9, y - 15, C.HERO_FIRE_HAIR_TIP);
    }

    // Attack enhancement - phoenix spreads wings
    if (attacking) {
      PA.pixel(ctx, weaponX + 8, y - 17, '#ffffff'); // bright flame core
      PA.pixel(ctx, weaponX + 8, y - 18, C.HERO_GEM_FIRE);
      // Wing spread wider
      PA.pixel(ctx, weaponX + 6, y - 15, C.HERO_FIRE_EMBLEM);
      PA.pixel(ctx, weaponX + 5, y - 14, C.HERO_FIRE_HAIR_TIP);
      PA.pixel(ctx, weaponX + 10, y - 15, C.HERO_FIRE_EMBLEM);
      PA.pixel(ctx, weaponX + 11, y - 14, C.HERO_FIRE_HAIR_TIP);
      // Tail feathers
      PA.pixel(ctx, weaponX + 7, y - 11, C.HERO_FIRE_CROWN_DARK);
      PA.pixel(ctx, weaponX + 9, y - 11, C.HERO_FIRE_CROWN_DARK);
    }

    // === Layer 9: Fire element particles (idle dancing flames) ===
    if (!hero.moving && !attacking) {
      const flameTime = (time || 0) / 250;
      const flame1Y = Math.sin(flameTime) * 1.5;
      const flame2Y = Math.sin(flameTime + Math.PI) * 1.5;
      PA.pixel(ctx, x - 6, y - 2 + flame1Y, 'rgba(255,102,34,0.6)');
      PA.pixel(ctx, x + 6, y - 3 + flame2Y, 'rgba(255,136,68,0.6)');
    }

    // Fire aura when attacking (larger radius)
    if (attacking) {
      const t = (time || 0) / 150;
      for (let i = 0; i < 8; i++) {
        const angle = t + (i * Math.PI * 2) / 8;
        const r = 9;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 4 + Math.sin(angle) * r * 0.5);
        PA.pixel(ctx, px, py, 'rgba(255,102,34,0.6)');
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
