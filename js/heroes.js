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
    moveSpeed: 0.75,
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
    damage: 40,
    range: 3,
    aoeRadius: 1.2,
    attackCooldown: 2000,
    moveSpeed: 0.75,
    element: 'fire',
    icon: 'fire_mage',
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
    if (!typeDef) return false;

    // Check valid floor tile (exclude outer, breakable walls, heart)
    if (!DK.Map.isPath(col, row)) return false;
    const tile = DK.Map.layout[row][col];
    if (tile === 'E' || tile === 'X') return false;
    if (tile === 'O' || tile === 'B' || tile === 'H') return false;
    if (DK.Map.isOuter && DK.Map.isOuter(col, row)) return false;
    if (DK.Map.isHeart && DK.Map.isHeart(col, row)) return false;

    // Check not occupied by trap or another hero
    if (DK.Traps.placed.some(t => t.col === col && t.row === row)) return false;
    if (this.active.some(h => h.col === col && h.row === row)) return false;

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
   */
  findPath(startCol, startRow, endCol, endRow) {
    if (startCol === endCol && startRow === endRow) return [];

    const visited = new Set();
    const queue = [[{ col: startCol, row: startRow }]];
    visited.add(`${startCol},${startRow}`);

    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.col === endCol && current.row === endRow) {
        const T = DK.CONFIG.TILE_SIZE;
        return path.slice(1).map(p => ({
          x: p.col * T + T / 2,
          y: p.row * T + T / 2,
          col: p.col,
          row: p.row,
        }));
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
            const projectileType = hero.type.element === 'fire' ? 'fire_bolt' : 'water_bolt';
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

    // === LEVIATHAN: Sea Goddess - Enhanced 12×12 core, flowing details ===

    // Animation offsets for dress sway and hair flow
    let dressSwayX = 0;
    let hairFlowX = 0;
    let weaponExtendX = 0;
    let bodyLeanX = 0;

    if (hero.moving) {
      // Walking: dress sways side to side, hair flows backward
      const swayPattern = [0, -1, 0, 1]; // Dress sway left-right
      dressSwayX = swayPattern[f];
      hairFlowX = 1 + (f === 3 ? 1 : 0); // Hair flows back more on frame 3
    }

    if (attacking) {
      // Casting pose: weapon extends forward, body leans back, hair flies back
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
      // Hair fixing animation (hand moves to hair)
      const progress = hero.idleActionProgress / 1000;
      if (progress > 0.3 && progress < 0.7) {
        hairFlowX += 1; // Hair moves as hand touches it
      }
    } else if (hero.idleAction === 'adjust_dress') {
      // Dress adjustment (subtle sway)
      const progress = hero.idleActionProgress / 800;
      dressSwayX += Math.sin(progress * Math.PI * 2) * 0.5;
    }

    // Shadow (wider)
    PA.rect(ctx, x - 5, y + 5, 10, 2, 'rgba(0,0,0,0.25)');

    // Feet (elegant, under dress)
    if (hero.moving) {
      if (f < 2) {
        PA.rect(ctx, x - 2, y + 4, 2, 1, '#2a2040');
        PA.rect(ctx, x + 1, y + 4, 2, 1, '#2a2040');
      } else {
        PA.rect(ctx, x - 3, y + 4, 2, 1, '#2a2040');
        PA.rect(ctx, x + 2, y + 4, 2, 1, '#2a2040');
      }
    } else {
      PA.rect(ctx, x - 2, y + 4, 2, 1, '#2a2040');
      PA.rect(ctx, x + 1, y + 4, 2, 1, '#2a2040');
    }

    // Dress lower (flowing, elegant with pleats) - with sway animation
    const dressX = x + Math.round(dressSwayX);
    PA.rect(ctx, dressX - 5, y + 1, 11, 3, C.HERO_ROBE_DARK);
    PA.rect(ctx, dressX - 6, y + 3, 13, 1, C.HERO_ROBE_DARK);
    // Dress hem shimmer and pleats
    PA.pixel(ctx, dressX - 5, y + 3, C.HERO_ROBE_LIGHT);
    PA.pixel(ctx, dressX - 3, y + 3, C.HERO_ROBE_LIGHT);
    PA.pixel(ctx, dressX, y + 3, C.HERO_ROBE);
    PA.pixel(ctx, dressX + 3, y + 3, C.HERO_ROBE_LIGHT);
    PA.pixel(ctx, dressX + 5, y + 3, C.HERO_ROBE);
    // Pleating shadows
    PA.pixel(ctx, dressX - 2, y + 2, C.HERO_ROBE_DARK);
    PA.pixel(ctx, dressX + 1, y + 2, C.HERO_ROBE_DARK);

    // Dress upper (fitted bodice with lace detail)
    PA.rect(ctx, x - 3, y - 3, 7, 4, C.HERO_ROBE);
    PA.rect(ctx, x - 3, y - 4, 7, 1, C.HERO_ROBE_LIGHT);
    // Lace pattern
    PA.pixel(ctx, x - 2, y - 4, C.HERO_SILVER);
    PA.pixel(ctx, x + 2, y - 4, C.HERO_SILVER);

    // Waist sash with gem
    PA.rect(ctx, x - 3, y, 7, 2, '#2a6aaa');
    PA.rect(ctx, x - 1, y, 3, 1, C.HERO_GOLD); // gold belt
    PA.pixel(ctx, x, y, C.HERO_GEM_WATER); // water crystal center
    PA.pixel(ctx, x - 1, y + 1, C.HERO_GEM_WATER); // water drop gems
    PA.pixel(ctx, x + 1, y + 1, C.HERO_GEM_WATER);

    // Dress fold shadows
    PA.pixel(ctx, x - 2, y + 1, C.HERO_ROBE_DARK);
    PA.pixel(ctx, x + 2, y + 1, C.HERO_ROBE_DARK);
    PA.pixel(ctx, x - 3, y - 2, C.HERO_ROBE_DARK);
    PA.pixel(ctx, x + 3, y - 2, C.HERO_ROBE_DARK);

    // Shoulders with WHITE FUR decoration + silver straps
    PA.rect(ctx, x - 4, y - 4, 2, 1, C.HERO_ROBE);
    PA.rect(ctx, x + 3, y - 4, 2, 1, C.HERO_ROBE);
    PA.pixel(ctx, x - 4, y - 4, C.HERO_FUR_WHITE); // White fur left
    PA.pixel(ctx, x + 4, y - 4, C.HERO_FUR_WHITE); // White fur right
    PA.pixel(ctx, x - 4, y - 5, C.HERO_SILVER);
    PA.pixel(ctx, x + 4, y - 5, C.HERO_SILVER);

    // Arms (slim, feminine)
    const armOffset = hero.moving ? (f % 2) : 0;
    PA.rect(ctx, x - 5, y - 2 + armOffset, 1, 2, C.HERO_SKIN);
    PA.pixel(ctx, x - 6, y + armOffset, C.HERO_SKIN);
    PA.rect(ctx, x + 5, y - 2 - armOffset, 1, 2, C.HERO_SKIN);
    PA.pixel(ctx, x + 6, y - armOffset, C.HERO_SKIN);

    // Neck
    PA.rect(ctx, x - 1, y - 5, 3, 1, C.HERO_SKIN);

    // Pearl necklace
    PA.pixel(ctx, x - 1, y - 5, C.HERO_PEARL);
    PA.pixel(ctx, x, y - 5, C.HERO_PEARL);
    PA.pixel(ctx, x + 1, y - 5, C.HERO_PEARL);

    // Head (elegant, feminine face) -瓜子臉
    PA.rect(ctx, x - 3, y - 10, 7, 5, C.HERO_SKIN);
    PA.rect(ctx, x - 2, y - 11, 5, 1, C.HERO_SKIN);
    PA.pixel(ctx, x - 1, y - 12, C.HERO_SKIN);
    PA.pixel(ctx, x, y - 12, C.HERO_SKIN);
    PA.pixel(ctx, x + 1, y - 12, C.HERO_SKIN);

    // Face shading (cheek contouring)
    PA.pixel(ctx, x + 3, y - 8, '#e0c8b0');
    PA.pixel(ctx, x + 3, y - 7, '#e0c8b0');
    PA.pixel(ctx, x - 3, y - 8, '#e0c8b0');
    PA.pixel(ctx, x + 2, y - 6, '#e8d0b8');

    // Chin highlight
    PA.pixel(ctx, x, y - 6, PA.lighten(C.HERO_SKIN, 8));

    // Long flowing GOLDEN hair (3 layers) - with flow animation
    const hairX = x + Math.round(hairFlowX);
    const bodyX = x + Math.round(bodyLeanX);
    // Inner layer (deep gold, close to face)
    PA.rect(ctx, bodyX - 4, y - 11, 2, 8, C.HERO_HAIR_DARK);
    PA.rect(ctx, bodyX + 3, y - 11, 2, 8, C.HERO_HAIR_DARK);
    // Middle layer (medium gold) - flows more
    PA.rect(ctx, hairX - 5, y - 10, 1, 7, C.HERO_HAIR_MID);
    PA.rect(ctx, hairX + 5, y - 10, 1, 7, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 3, y - 12, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX + 3, y - 12, C.HERO_HAIR_MID);
    // Outer layer (bright gold at tips) - flows most
    PA.pixel(ctx, hairX - 5, y - 4, C.HERO_HAIR_MID);
    PA.pixel(ctx, hairX - 5, y - 3, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, hairX + 5, y - 4, C.HERO_HAIR_MID);
    PA.pixel(ctx, hairX + 5, y - 3, C.HERO_HAIR_LIGHT);
    // Top hair
    PA.rect(ctx, bodyX - 2, y - 13, 5, 1, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 1, y - 14, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 14, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 1, y - 14, C.HERO_HAIR_LIGHT);

    // === GOLDEN CROWN (3-point design) ===
    PA.pixel(ctx, bodyX - 2, y - 14, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX - 1, y - 15, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX, y - 16, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX, y - 15, C.HERO_CROWN_GEM); // Red gem center
    PA.pixel(ctx, bodyX + 1, y - 15, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX + 2, y - 14, C.HERO_CROWN_GOLD);

    // Eyes (3×4px, luminous with pupils)
    // Left eye
    PA.rect(ctx, x - 2, y - 9, 2, 3, '#f0e0d8'); // white
    PA.rect(ctx, x - 2, y - 9, 2, 2, '#3366aa'); // pupil
    PA.pixel(ctx, x - 2, y - 9, '#66bbff'); // iris highlight
    PA.pixel(ctx, x - 2, y - 10, '#aaddff'); // top highlight
    // Right eye
    PA.rect(ctx, x + 1, y - 9, 2, 3, '#f0e0d8');
    PA.rect(ctx, x + 1, y - 9, 2, 2, '#3366aa');
    PA.pixel(ctx, x + 1, y - 9, '#66bbff');
    PA.pixel(ctx, x + 1, y - 10, '#aaddff');
    // Eyelids
    PA.pixel(ctx, x - 2, y - 10, PA.darken(C.HERO_SKIN, 5));
    PA.pixel(ctx, x + 1, y - 10, PA.darken(C.HERO_SKIN, 5));

    // Nose (delicate)
    PA.pixel(ctx, x, y - 8, '#e8ccb4');
    PA.pixel(ctx, x, y - 7, '#e0c0ac');

    // Lips (3×2px, double lips with highlight)
    // Upper lip
    PA.rect(ctx, x - 1, y - 6, 3, 1, '#cc6666');
    // Lower lip
    PA.rect(ctx, x - 1, y - 5, 3, 1, '#ee8888');
    // Lip highlight
    PA.pixel(ctx, x, y - 6, '#ffaaaa');
    PA.pixel(ctx, x, y - 5, '#ffcccc');

    // Forehead highlight
    PA.pixel(ctx, x - 1, y - 11, PA.lighten(C.HERO_SKIN, 10));
    PA.pixel(ctx, x + 1, y - 11, PA.lighten(C.HERO_SKIN, 10));

    // Water crystal earrings (animated sway)
    const earringOffset = hero.moving ? Math.sin(time / 200) * 0.5 : 0;
    PA.pixel(ctx, x - 4, y - 9 + earringOffset, C.HERO_GEM_WATER);
    PA.pixel(ctx, x - 4, y - 8 + earringOffset, C.HERO_SILVER);
    PA.pixel(ctx, x + 4, y - 9 + earringOffset, C.HERO_GEM_WATER);
    PA.pixel(ctx, x + 4, y - 8 + earringOffset, C.HERO_SILVER);

    // Enhanced trident (right side) - with casting extension
    const weaponX = x + Math.round(weaponExtendX);
    PA.rect(ctx, weaponX + 7, y - 11, 2, 15, '#4a7aaa');  // thicker shaft
    PA.pixel(ctx, weaponX + 8, y - 10, C.HERO_GOLD); // gold grip detail
    PA.pixel(ctx, weaponX + 8, y - 8, C.HERO_GOLD);
    // Trident head with spiral detail
    PA.pixel(ctx, weaponX + 6, y - 14, '#66aadd');
    PA.pixel(ctx, weaponX + 7, y - 15, '#88ccff');
    PA.pixel(ctx, weaponX + 8, y - 16, C.HERO_GEM_WATER); // water crystal tip
    PA.pixel(ctx, weaponX + 9, y - 15, '#88ccff');
    PA.pixel(ctx, weaponX + 10, y - 14, '#66aadd');
    PA.pixel(ctx, weaponX + 8, y - 15, '#aaddff'); // center prong
    PA.pixel(ctx, weaponX + 8, y - 14, C.HERO_SILVER); // spiral pattern
    // Trident crystal glow
    PA.pixel(ctx, weaponX + 8, y - 17, '#bbddff');
    if (attacking) {
      PA.pixel(ctx, weaponX + 7, y - 16, '#66bbff');
      PA.pixel(ctx, weaponX + 9, y - 16, '#66bbff');
      PA.pixel(ctx, weaponX + 8, y - 18, '#ffffff');
      PA.pixel(ctx, weaponX + 8, y - 19, C.HERO_GEM_WATER);
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

    // === BAAL: Fire Goddess - Enhanced 12×12 core, flame details ===

    // Animation offsets for dress sway and hair flow
    let dressSwayX = 0;
    let hairFlowX = 0;
    let weaponExtendX = 0;
    let bodyLeanX = 0;

    if (hero.moving) {
      // Walking: dress sways side to side, hair flows backward (with flame flutter)
      const swayPattern = [0, -1, 0, 1];
      dressSwayX = swayPattern[f];
      hairFlowX = 1 + (f === 3 ? 1 : 0);
    }

    if (attacking) {
      // Casting pose: weapon extends forward, body leans back, hair flies back dramatically
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

    // Shadow (wider)
    PA.rect(ctx, x - 5, y + 5, 10, 2, 'rgba(0,0,0,0.25)');

    // Feet
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

    // Dress lower (dark crimson, flowing with flame edges) - with sway animation
    const dressX = x + Math.round(dressSwayX);
    const flicker = Math.sin((time || 0) / 120);
    PA.rect(ctx, dressX - 5, y + 1, 11, 3, C.HERO_FIRE_ROBE_DARK);
    PA.rect(ctx, dressX - 6, y + 3, 13, 1, C.HERO_FIRE_ROBE_DARK);
    // Flame-like hem pattern (animated flicker)
    PA.pixel(ctx, dressX - 5, y + 3, flicker > 0 ? C.HERO_FIRE_ROBE : C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, dressX - 2, y + 3, C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, dressX, y + 3, flicker > 0.3 ? '#ff6622' : C.HERO_FIRE_ROBE);
    PA.pixel(ctx, dressX + 2, y + 3, C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, dressX + 5, y + 3, flicker > 0 ? C.HERO_FIRE_ROBE : C.HERO_FIRE_ROBE_LIGHT);
    // Pleating shadows
    PA.pixel(ctx, dressX - 2, y + 2, C.HERO_FIRE_ROBE_DARK);
    PA.pixel(ctx, dressX + 1, y + 2, C.HERO_FIRE_ROBE_DARK);

    // Dress upper (fitted, off-shoulder with flame patterns)
    PA.rect(ctx, x - 3, y - 3, 7, 4, C.HERO_FIRE_ROBE);
    PA.rect(ctx, x - 3, y - 4, 7, 1, C.HERO_FIRE_ROBE_LIGHT);
    // Flame embroidery pattern
    PA.pixel(ctx, x - 2, y - 3, '#ff6622');
    PA.pixel(ctx, x + 2, y - 3, '#ff6622');
    PA.pixel(ctx, x, y - 2, C.HERO_GEM_FIRE);

    // Waist ornament with flame gem (animated)
    PA.rect(ctx, x - 3, y, 7, 2, '#6a2020');
    PA.rect(ctx, x - 1, y, 3, 1, C.HERO_GOLD); // gold belt
    PA.pixel(ctx, x, y, flicker > 0.5 ? '#ffffff' : C.HERO_GEM_FIRE); // flame crystal (flickering)
    PA.pixel(ctx, x - 1, y + 1, '#ff6622'); // flame shape gems
    PA.pixel(ctx, x + 1, y + 1, '#ff6622');

    // Dress fold
    PA.pixel(ctx, x - 2, y + 1, C.HERO_FIRE_ROBE_DARK);
    PA.pixel(ctx, x + 2, y + 1, C.HERO_FIRE_ROBE_DARK);
    PA.pixel(ctx, x - 3, y - 2, C.HERO_FIRE_ROBE_DARK);
    PA.pixel(ctx, x + 3, y - 2, C.HERO_FIRE_ROBE_DARK);

    // Bare shoulders with WHITE FUR decoration + gold accents
    PA.rect(ctx, x - 4, y - 4, 2, 1, C.HERO_SKIN);
    PA.rect(ctx, x + 3, y - 4, 2, 1, C.HERO_SKIN);
    PA.pixel(ctx, x - 4, y - 4, C.HERO_FUR_WHITE); // White fur left
    PA.pixel(ctx, x + 4, y - 4, C.HERO_FUR_WHITE); // White fur right
    PA.pixel(ctx, x - 4, y - 5, C.HERO_GOLD);
    PA.pixel(ctx, x + 4, y - 5, C.HERO_GOLD);

    // Arms
    const armOffset = hero.moving ? (f % 2) : 0;
    PA.rect(ctx, x - 5, y - 2 + armOffset, 1, 2, C.HERO_SKIN);
    PA.pixel(ctx, x - 6, y + armOffset, C.HERO_SKIN);
    PA.rect(ctx, x + 5, y - 2 - armOffset, 1, 2, C.HERO_SKIN);
    PA.pixel(ctx, x + 6, y - armOffset, C.HERO_SKIN);

    // Neck
    PA.rect(ctx, x - 1, y - 5, 3, 1, C.HERO_SKIN);

    // Flame necklace (animated)
    PA.pixel(ctx, x - 1, y - 5, flicker > 0 ? '#ff6622' : '#cc4400');
    PA.pixel(ctx, x, y - 5, flicker > 0.3 ? C.HERO_GEM_FIRE : '#ff6622');
    PA.pixel(ctx, x + 1, y - 5, flicker > 0 ? '#ff6622' : '#cc4400');

    // Head (elegant, feminine face) - 瓜子臉
    PA.rect(ctx, x - 3, y - 10, 7, 5, C.HERO_SKIN);
    PA.rect(ctx, x - 2, y - 11, 5, 1, C.HERO_SKIN);
    PA.pixel(ctx, x - 1, y - 12, C.HERO_SKIN);
    PA.pixel(ctx, x, y - 12, C.HERO_SKIN);
    PA.pixel(ctx, x + 1, y - 12, C.HERO_SKIN);

    // Face shading (cheek contouring)
    PA.pixel(ctx, x + 3, y - 8, '#e0c8b0');
    PA.pixel(ctx, x + 3, y - 7, '#e0c8b0');
    PA.pixel(ctx, x - 3, y - 8, '#e0c8b0');
    PA.pixel(ctx, x + 2, y - 6, '#e8d0b8');

    // Chin highlight (warm glow from fire)
    PA.pixel(ctx, x, y - 6, '#fff0e8');

    // Long flowing GOLDEN hair (3 layers) - with flow animation (same as water mage)
    const hairX = x + Math.round(hairFlowX);
    const bodyX = x + Math.round(bodyLeanX);
    // Inner layer (deep gold, close to face)
    PA.rect(ctx, bodyX - 4, y - 11, 2, 8, C.HERO_HAIR_DARK);
    PA.rect(ctx, bodyX + 3, y - 11, 2, 8, C.HERO_HAIR_DARK);
    // Middle layer (medium gold) - flows more
    PA.rect(ctx, hairX - 5, y - 10, 1, 7, C.HERO_HAIR_MID);
    PA.rect(ctx, hairX + 5, y - 10, 1, 7, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 3, y - 12, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX + 3, y - 12, C.HERO_HAIR_MID);
    // Outer layer (bright gold at tips with subtle flame flicker)
    PA.pixel(ctx, hairX - 5, y - 4, C.HERO_HAIR_MID);
    PA.pixel(ctx, hairX - 5, y - 3, flicker > 0.3 ? C.HERO_HAIR_LIGHT : C.HERO_HAIR_MID);
    PA.pixel(ctx, hairX + 5, y - 4, C.HERO_HAIR_MID);
    PA.pixel(ctx, hairX + 5, y - 3, flicker > 0.3 ? C.HERO_HAIR_LIGHT : C.HERO_HAIR_MID);
    // Top hair
    PA.rect(ctx, bodyX - 2, y - 13, 5, 1, C.HERO_HAIR_MID);
    PA.pixel(ctx, bodyX - 1, y - 14, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX, y - 14, C.HERO_HAIR_LIGHT);
    PA.pixel(ctx, bodyX + 1, y - 14, C.HERO_HAIR_LIGHT);

    // === GOLDEN CROWN with FLAME GEM (enhanced flame flicker) ===
    PA.pixel(ctx, bodyX - 2, y - 14, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX - 1, y - 15, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX, y - 16, C.HERO_CROWN_GOLD);
    // Flame gem (flickering)
    PA.pixel(ctx, bodyX, y - 15, flicker > 0.5 ? '#ffdd66' : C.HERO_GEM_FIRE);
    if (flicker > 0.3) PA.pixel(ctx, bodyX, y - 17, C.HERO_GEM_FIRE); // Flame tip
    PA.pixel(ctx, bodyX + 1, y - 15, C.HERO_CROWN_GOLD);
    PA.pixel(ctx, bodyX + 2, y - 14, C.HERO_CROWN_GOLD);

    // Eyes (3×4px, fiery with pupils)
    // Left eye
    PA.rect(ctx, x - 2, y - 9, 2, 3, '#f0e0d8'); // white
    PA.rect(ctx, x - 2, y - 9, 2, 2, '#cc2200'); // fiery pupil
    PA.pixel(ctx, x - 2, y - 9, '#ff4422'); // iris highlight
    PA.pixel(ctx, x - 2, y - 10, '#ffaa66'); // top highlight
    // Right eye
    PA.rect(ctx, x + 1, y - 9, 2, 3, '#f0e0d8');
    PA.rect(ctx, x + 1, y - 9, 2, 2, '#cc2200');
    PA.pixel(ctx, x + 1, y - 9, '#ff4422');
    PA.pixel(ctx, x + 1, y - 10, '#ffaa66');
    // Eyelids
    PA.pixel(ctx, x - 2, y - 10, PA.darken(C.HERO_SKIN, 5));
    PA.pixel(ctx, x + 1, y - 10, PA.darken(C.HERO_SKIN, 5));

    // Nose (delicate)
    PA.pixel(ctx, x, y - 8, '#e8ccb4');
    PA.pixel(ctx, x, y - 7, '#e0c0ac');

    // Lips (3×2px, double lips with highlight)
    // Upper lip
    PA.rect(ctx, x - 1, y - 6, 3, 1, '#aa3333');
    // Lower lip
    PA.rect(ctx, x - 1, y - 5, 3, 1, '#dd6666');
    // Lip highlight
    PA.pixel(ctx, x, y - 6, '#ff8888');
    PA.pixel(ctx, x, y - 5, '#ffaaaa');

    // Forehead highlight (warm from flame)
    PA.pixel(ctx, x - 1, y - 11, '#fff0e8');
    PA.pixel(ctx, x + 1, y - 11, '#fff0e8');

    // Enhanced flame scepter (right side) - with casting extension
    const weaponX = x + Math.round(weaponExtendX);
    PA.rect(ctx, weaponX + 7, y - 10, 2, 14, '#4a2010');  // thicker shaft
    // Gold spiral grip
    PA.pixel(ctx, weaponX + 8, y - 9, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 8, y - 7, C.HERO_GOLD);
    PA.pixel(ctx, weaponX + 8, y - 5, C.HERO_GOLD);
    // Multi-layer flame crystal on top
    PA.pixel(ctx, weaponX + 8, y - 11, '#ff4400');
    PA.pixel(ctx, weaponX + 8, y - 12, '#ff6622');
    PA.pixel(ctx, weaponX + 7, y - 13, C.HERO_GEM_FIRE);
    PA.pixel(ctx, weaponX + 8, y - 14, C.HERO_GEM_FIRE);
    PA.pixel(ctx, weaponX + 9, y - 13, C.HERO_GEM_FIRE);
    PA.pixel(ctx, weaponX + 8, y - 15, '#ffdd66');
    if (flicker > 0) PA.pixel(ctx, weaponX + 8, y - 13, '#ffffff');
    if (attacking) {
      PA.pixel(ctx, weaponX + 8, y - 16, '#ffffff');
      PA.pixel(ctx, weaponX + 7, y - 15, '#ff6622');
      PA.pixel(ctx, weaponX + 9, y - 15, '#ff6622');
      PA.pixel(ctx, weaponX + 8, y - 17, C.HERO_GEM_FIRE);
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
    };
    const borderColors = {
      water: `rgba(68,136,255,${0.2 * pulse})`,
      fire: `rgba(255,102,34,${0.2 * pulse})`,
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
