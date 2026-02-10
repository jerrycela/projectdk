/**
 * Dungeon Keep - Enemy System
 * Handles enemy spawning, movement, rendering, and AI
 */
window.DK = window.DK || {};

DK.Enemies = {
  active: [],
  _nextId: 1,

  init() {
    this.active = [];
    this._nextId = 1;
  },

  spawnAt(typeName, col, row) {
    const typeDef = DK.ENEMY_TYPES[typeName];
    if (!typeDef) return null;

    const T = DK.CONFIG.TILE_SIZE;
    const enemy = {
      id: this._nextId++,
      type: typeDef,
      x: col * T + T / 2,
      y: row * T + T / 2,
      col: col,
      row: row,
      hp: typeDef.hp,
      maxHp: typeDef.hp,
      speed: typeDef.speed,
      slowFactor: 1,
      slowTimer: 0,
      animFrame: 0,
      animTimer: 0,
      alive: true,
      reachedEnd: false,
      deathTimer: 0,
      deathType: null,
      flashTimer: 0,
      statusEffects: [],
      paralyzed: false,
      pushed: null,
      pushResistTimer: 0,
      spawnTimer: 300,
    };

    this.active.push(enemy);
    return enemy;
  },

  spawn(typeName, pathIndex) {
    // 向後相容：如果有 breachHoles 就用第一個洞口
    if (DK.Map.breachHoles && DK.Map.breachHoles.length > 0) {
      const hole = DK.Map.breachHoles[0];
      return this.spawnAt(typeName, hole.col, hole.row);
    }
    // 否則 fallback（不應觸發）
    return null;
  },

  update(dt) {
    const T = DK.CONFIG.TILE_SIZE;

    for (const enemy of this.active) {
      if (!enemy.alive) {
        enemy.deathTimer += dt;
        continue;
      }

      // 生成淡入動畫遞減
      if (enemy.spawnTimer > 0) {
        enemy.spawnTimer -= dt;
      }

      if (enemy.hp <= 0) {
        enemy.alive = false;
        enemy.deathTimer = 0;
        // Award gold and count kill
        if (DK.Game) {
          DK.Game.enemiesKilled++;
          DK.Game.gold += enemy.type.reward;
          DK.Game.effects.push({
            type: 'gold',
            x: enemy.x,
            y: enemy.y - 10,
            text: `+${enemy.type.reward}`,
            color: DK.COLORS.GOLD_TEXT,
            duration: 1000,
            timer: 0,
          });
          // 金幣閃光粒子特效
          DK.Game.effects.push({
            type: 'gold_sparkle',
            x: enemy.x,
            y: enemy.y,
            timer: 0,
            duration: 400,
          });
        }
        continue;
      }

      // Update slow
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        if (enemy.slowTimer <= 0) {
          enemy.slowFactor = 1;
        }
      }

      // Flash timer (damage feedback)
      if (enemy.flashTimer > 0) {
        enemy.flashTimer -= dt;
      }

      // Push resist timer
      if (enemy.pushResistTimer > 0) {
        enemy.pushResistTimer -= dt;
      }

      // Handle being pushed
      if (enemy.pushed) {
        enemy.pushed.timer += dt;
        const progress = Math.min(1, enemy.pushed.timer / enemy.pushed.duration);

        // Smooth movement toward target
        enemy.x = enemy.pushed.startX + (enemy.pushed.targetX - enemy.pushed.startX) * progress;
        enemy.y = enemy.pushed.startY + (enemy.pushed.targetY - enemy.pushed.startY) * progress;

        if (progress >= 1) {
          if (enemy.pushed.intoAbyss) {
            // 深淵死亡！
            enemy.alive = false;
            enemy.deathTimer = 0;
            enemy.deathType = 'abyss';
            enemy.x = enemy.pushed.targetX;
            enemy.y = enemy.pushed.targetY;

            if (DK.Game) {
              DK.Game.enemiesKilled++;
              DK.Game.gold += enemy.type.reward;
              DK.Game.effects.push({
                type: 'gold',
                x: enemy.x,
                y: enemy.y - 10,
                text: `+${enemy.type.reward}`,
                color: DK.COLORS.GOLD_TEXT,
                duration: 1000,
                timer: 0,
              });
              DK.Game.effects.push({
                type: 'gold_sparkle',
                x: enemy.x,
                y: enemy.y,
                timer: 0,
                duration: 400,
              });
              DK.Game.effects.push({
                type: 'abyss_fall',
                x: enemy.x,
                y: enemy.y,
                duration: 800,
                timer: 0,
              });
            }
          } else {
            // Pushed onto walkable tile - update position
            enemy.x = enemy.pushed.targetX;
            enemy.y = enemy.pushed.targetY;
          }
          enemy.pushed = null;
        }
        continue; // Skip normal movement while being pushed
      }

      // Update elemental status effects
      if (DK.Elements) {
        DK.Elements.updateStatuses(enemy, dt);
      }

      // Animation
      enemy.animTimer += dt;
      if (enemy.animTimer > 250) {
        enemy.animFrame = (enemy.animFrame + 1) % 4;
        enemy.animTimer = 0;
      }

      // 環境互動：水潭自動掛濕
      const tileCol = Math.floor(enemy.x / T);
      const tileRow = Math.floor(enemy.y / T);
      const tile = DK.Map.getTile(tileCol, tileRow);
      if (tile === 'P' && DK.Elements && !DK.Elements.hasStatus(enemy, 'wet')) {
        DK.Elements.applyElement(enemy, 'water');
      }
      // 環境互動：燃燒草叢自動掛灼印
      if (tile === 'G' && DK.Map.getGrassState && DK.Map.getGrassState(tileCol, tileRow)?.state === 'burning') {
        if (DK.Elements && !DK.Elements.hasStatus(enemy, 'burning')) {
          DK.Elements.addStatus(enemy, 'burning');
        }
      }
      // 草叢點燃：帶 burning 的敵人走入 normal 草叢 → 點燃
      if (tile === 'G' && DK.Map.getGrassState && DK.Map.getGrassState(tileCol, tileRow)?.state === 'normal') {
        if (DK.Elements && DK.Elements.hasStatus(enemy, 'burning')) {
          DK.Map.igniteGrass(tileCol, tileRow);
        }
      }

      // Skip movement if paralyzed
      if (enemy.paralyzed) continue;

      // === 距離場移動（含路障攻擊邏輯） ===
      const curCol = Math.floor(enemy.x / T);
      const curRow = Math.floor(enemy.y / T);

      // 檢查是否已到達地心相鄰格（distanceField === 1 或 distanceFieldThrough === 1）
      if (DK.Map.isHeart && DK.Map.heartPos) {
        const df = DK.Map.distanceField;
        const dft = DK.Map.distanceFieldThrough;
        const isNextToHeart = (df && df[curRow] && df[curRow][curCol] === 1) ||
          (dft && dft[curRow] && dft[curRow][curCol] === 1 && !DK.Map.hasBarricade(curCol, curRow));

        if (isNextToHeart) {
          // 攻擊地心
          const damage = enemy.type.heartDamage || 10;
          DK.Game.damageHeart(damage);
          enemy.alive = false;
          enemy.reachedEnd = true;
          continue;
        }
      }

      // 判斷是否被路障封路（正常距離場無法到達 = -1 或不存在）
      const df = DK.Map.distanceField;
      const isBlocked = !df || !df[curRow] || df[curRow][curCol] === -1;

      if (isBlocked && DK.Map.hasBarricade) {
        // 封路模式：用 distanceFieldThrough 導航（忽略路障的距離場）
        const nextStep = DK.Map.getNextStepThrough ? DK.Map.getNextStepThrough(curCol, curRow) : null;

        // 優先檢查門（門比路障更高級）
        if (nextStep && DK.Doors && DK.Doors.getDoorAt(nextStep.col, nextStep.row)) {
          const door = DK.Doors.getDoorAt(nextStep.col, nextStep.row);

          // 只有鎖上的門需要攻擊，開啟的門直接通過
          if (door && !door.isOpen) {
            // 下一步是門 → 停下攻擊
            if (!enemy._attackingDoor) {
              enemy._attackingDoor = { col: nextStep.col, row: nextStep.row };
              enemy._doorAttackTimer = 0;
            }

            // 累計攻擊計時器
            enemy._doorAttackTimer = (enemy._doorAttackTimer || 0) + dt;
            const attackInterval = 1000; // 每秒攻擊一次

            if (enemy._doorAttackTimer >= attackInterval) {
              enemy._doorAttackTimer -= attackInterval;
              const damage = enemy.type.heartDamage || 10;
              DK.Doors.damageNearestDoor(nextStep.col, nextStep.row, damage);

              // 傷害數字特效
              if (DK.Game.effects) {
                DK.Game.effects.push({
                  type: 'damage',
                  x: nextStep.col * T + T / 2,
                  y: nextStep.row * T - 4,
                  text: `-${damage}`,
                  color: '#ff8844',
                  duration: 600,
                  timer: 0,
                });
              }

              // 檢查門是否被破壞
              if (door.hp <= 0) {
                // 門被摧毀 → 碎裂特效
                if (DK.Game.effects) {
                  DK.Game.effects.push({
                    type: 'door_shatter',
                    x: nextStep.col * T + T / 2,
                    y: nextStep.row * T + T / 2,
                    timer: 0,
                    duration: 500,
                  });
                }
                enemy._attackingDoor = null;
                enemy._doorAttackTimer = 0;
              }
            }
            continue; // 攻擊門時不移動
          }
        }

        if (nextStep && DK.Map.hasBarricade(nextStep.col, nextStep.row)) {
          // 下一步是路障 → 停下攻擊
          if (!enemy._attackingBarricade) {
            enemy._attackingBarricade = { col: nextStep.col, row: nextStep.row };
            enemy._barricadeAttackTimer = 0;
          }

          // 累計攻擊計時器
          enemy._barricadeAttackTimer = (enemy._barricadeAttackTimer || 0) + dt;
          const attackInterval = 1000; // 每秒攻擊一次

          if (enemy._barricadeAttackTimer >= attackInterval) {
            enemy._barricadeAttackTimer -= attackInterval;
            const damage = enemy.type.heartDamage || 10;
            const destroyed = DK.Map.damageBarricade(nextStep.col, nextStep.row, damage);

            // 傷害數字特效
            if (DK.Game.effects) {
              DK.Game.effects.push({
                type: 'damage',
                x: nextStep.col * T + T / 2,
                y: nextStep.row * T - 4,
                text: `-${damage}`,
                color: '#ffaa44',
                duration: 600,
                timer: 0,
              });
            }

            if (destroyed) {
              // 路障被摧毀 → 碎裂特效
              if (DK.Game.effects) {
                DK.Game.effects.push({
                  type: 'barricade_shatter',
                  x: nextStep.col * T + T / 2,
                  y: nextStep.row * T + T / 2,
                  timer: 0,
                  duration: 400,
                });
              }
              enemy._attackingBarricade = null;
              enemy._barricadeAttackTimer = 0;
            }
          }
          continue; // 攻擊路障時不移動
        }

        // 下一步不是路障 → 正常移動（用 through 距離場）
        if (nextStep) {
          enemy._attackingBarricade = null;
          const targetX = nextStep.col * T + T / 2;
          const targetY = nextStep.row * T + T / 2;
          const dx = targetX - enemy.x;
          const dy = targetY - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 1) {
            enemy.x = targetX;
            enemy.y = targetY;
          } else {
            const moveSpeed = enemy.speed * enemy.slowFactor * (dt / 16);
            enemy.x += (dx / dist) * moveSpeed;
            enemy.y += (dy / dist) * moveSpeed;
          }
        }
        continue;
      }

      // 正常模式：用 distanceField 導航（路障 = 牆壁，自動繞道）
      enemy._attackingBarricade = null;
      const nextStep = DK.Map.getNextStep ? DK.Map.getNextStep(curCol, curRow) : null;
      if (!nextStep) continue; // 無路可走

      const targetX = nextStep.col * T + T / 2;
      const targetY = nextStep.row * T + T / 2;
      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        enemy.x = targetX;
        enemy.y = targetY;
      } else {
        const moveSpeed = enemy.speed * enemy.slowFactor * (dt / 16);
        enemy.x += (dx / dist) * moveSpeed;
        enemy.y += (dy / dist) * moveSpeed;
      }
    }

    // Clean up dead enemies after animation
    this.active = this.active.filter(e =>
      e.alive || (e.deathTimer < 500 && !e.reachedEnd)
    );
  },

  render(ctx, time) {
    for (const enemy of this.active) {
      if (enemy.deathTimer > 500) continue;

      let x = Math.round(enemy.x);
      let y = Math.round(enemy.y);

      if (!enemy.alive && !enemy.reachedEnd) {
        this.renderDeath(ctx, enemy, x, y);
        continue;
      }

      if (enemy.reachedEnd) continue;

      // 生成淡入效果：透明度漸變 + 從上方飄入
      if (enemy.spawnTimer > 0) {
        const spawnProgress = enemy.spawnTimer / 300;
        ctx.globalAlpha = 1 - spawnProgress;
        y -= Math.round(spawnProgress * 4);
      }

      // Push resist shake effect
      if (enemy.pushResistTimer > 0) {
        const shake = Math.sin(enemy.pushResistTimer / 15) * 2;
        x += Math.round(shake);
      }

      // Walking bounce effect (only when alive and not being pushed)
      if (enemy.alive && !enemy.pushed) {
        const bounceY = Math.round(Math.sin(enemy.animFrame * Math.PI * 0.5));
        y -= bounceY;
      }

      // Draw enemy based on type
      switch (enemy.type.id) {
        case 'goblin':
          this.renderGoblin(ctx, enemy, x, y);
          break;
        case 'skeleton':
          this.renderSkeleton(ctx, enemy, x, y);
          break;
        case 'orc':
          this.renderOrc(ctx, enemy, x, y);
          break;
        case 'slime':
          this.renderSlime(ctx, enemy, x, y, time);
          break;
      }

      // Wet status: blue tint overlay on enemy body
      if (DK.Elements && DK.Elements.hasStatus(enemy, 'wet')) {
        const wetPulse = Math.sin((time || 0) / 300) * 0.1;
        const alpha = 0.3 + wetPulse;
        const size = enemy.type.size || 0.8;
        const w = Math.round(12 * size);
        const h = Math.round(16 * size);
        ctx.fillStyle = `rgba(68,136,255,${alpha})`;
        ctx.fillRect(x - Math.floor(w / 2), y - h + 4, w, h);
      }

      // HP bar
      this.renderHPBar(ctx, enemy, x, y);

      // Slow indicator
      if (enemy.slowTimer > 0) {
        DK.PixelArt.pixel(ctx, x - 1, y - 7, '#88aacc');
        DK.PixelArt.pixel(ctx, x + 1, y - 7, '#88aacc');
      }

      // Elemental status indicators
      if (DK.Elements) {
        DK.Elements.renderStatusIndicators(ctx, enemy, x, y, time);
      }

      // 恢復生成淡入效果的透明度
      if (enemy.spawnTimer > 0) {
        ctx.globalAlpha = 1;
      }
    }
  },

  renderGoblin(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = enemy.animFrame;
    const flash = enemy.flashTimer > 0;
    const skin = flash ? '#ffffff' : C.GOBLIN_SKIN;
    const skinDark = flash ? '#dddddd' : C.GOBLIN_DARK;
    const armor = flash ? '#cccccc' : '#8a6a4a';
    const armorDark = flash ? '#aaaaaa' : '#6a4a2a';
    const hair = flash ? '#dddddd' : '#6a4a2a';

    // === SWORDSMAN: Light-armored human fighter with sword ===

    // Shadow
    PA.rect(ctx, x - 3, y + 4, 7, 1, 'rgba(0,0,0,0.2)');

    // Boots (leather)
    if (f === 0 || f === 2) {
      PA.rect(ctx, x - 2, y + 3, 2, 1, '#5a4030');
      PA.rect(ctx, x + 1, y + 3, 2, 1, '#5a4030');
    } else if (f === 1) {
      PA.rect(ctx, x - 3, y + 3, 2, 1, '#5a4030');
      PA.rect(ctx, x + 2, y + 3, 2, 1, '#5a4030');
    } else {
      PA.rect(ctx, x - 2, y + 3, 2, 1, '#5a4030');
      PA.rect(ctx, x + 2, y + 3, 2, 1, '#5a4030');
    }

    // Legs (trousers)
    PA.pixel(ctx, x - 1, y + 2, '#6a5a4a');
    PA.pixel(ctx, x + 1, y + 2, '#6a5a4a');

    // Leather armor (torso)
    PA.rect(ctx, x - 2, y - 1, 5, 3, armor);
    PA.rect(ctx, x - 3, y, 7, 2, armorDark);
    // Armor light edge (left-top light source)
    PA.pixel(ctx, x - 2, y - 1, PA.lighten(armor, 12));
    PA.pixel(ctx, x + 2, y + 1, PA.darken(armor, 12));
    // Belt
    PA.rect(ctx, x - 2, y + 1, 5, 1, '#4a3a2a');
    PA.pixel(ctx, x, y + 1, '#c8a050');

    // Body/neck
    PA.rect(ctx, x - 1, y - 2, 3, 1, skin);

    // Arms
    const armOffset = f % 2;
    PA.pixel(ctx, x - 3, y - 1 + armOffset, skin);
    PA.pixel(ctx, x - 4, y + armOffset, skin);
    PA.pixel(ctx, x + 3, y - 1 - armOffset, skin);
    PA.pixel(ctx, x + 4, y - armOffset, skin);

    // Head
    PA.rect(ctx, x - 2, y - 6, 5, 4, skin);
    PA.rect(ctx, x - 1, y - 7, 3, 1, skin);
    // Face shading
    PA.pixel(ctx, x + 2, y - 4, skinDark);
    PA.pixel(ctx, x + 2, y - 3, skinDark);

    // Hair (short brown)
    PA.rect(ctx, x - 2, y - 7, 5, 1, hair);
    PA.rect(ctx, x - 3, y - 6, 1, 2, hair);
    PA.pixel(ctx, x - 2, y - 6, hair);
    PA.pixel(ctx, x + 2, y - 7, hair);

    // Eyes (blue)
    PA.pixel(ctx, x - 1, y - 5, C.GOBLIN_EYE);
    PA.pixel(ctx, x + 1, y - 5, C.GOBLIN_EYE);

    // Nose
    PA.pixel(ctx, x, y - 4, skinDark);

    // Mouth
    PA.pixel(ctx, x, y - 3, '#c0a080');

    // Light source highlights
    PA.pixel(ctx, x - 2, y - 6, PA.lighten(skin, 12));
    PA.pixel(ctx, x - 1, y - 7, PA.lighten(skin, 12));
    PA.pixel(ctx, x + 2, y - 4, PA.darken(skin, 10));

    // Sword (right hand)
    PA.pixel(ctx, x + 5, y + 1, '#6a5a4a');  // hilt
    PA.pixel(ctx, x + 5, y, '#8a7a5a');      // guard
    PA.pixel(ctx, x + 5, y - 1, '#aaaaaa');
    PA.pixel(ctx, x + 5, y - 2, '#bbbbbb');
    PA.pixel(ctx, x + 5, y - 3, '#cccccc');
    PA.pixel(ctx, x + 5, y - 4, '#dddddd');  // tip highlight
  },

  renderSkeleton(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = enemy.animFrame;
    const flash = enemy.flashTimer > 0;
    const skin = flash ? '#ffffff' : '#e0c0a0';
    const skinDark = flash ? '#dddddd' : '#c0a080';
    const cloak = flash ? '#cccccc' : '#3a5a2a';
    const cloakLight = flash ? '#dddddd' : '#4a7a3a';
    const leather = flash ? '#bbbbbb' : C.SKELETON_BONE;

    // === ARCHER: Cloaked ranger with longbow ===

    // Shadow
    PA.rect(ctx, x - 3, y + 5, 7, 1, 'rgba(0,0,0,0.2)');

    // Boots
    if (f < 2) {
      PA.rect(ctx, x - 2, y + 4, 2, 1, '#5a4030');
      PA.rect(ctx, x + 1, y + 4, 2, 1, '#5a4030');
    } else {
      PA.rect(ctx, x - 3, y + 4, 2, 1, '#5a4030');
      PA.rect(ctx, x + 2, y + 4, 2, 1, '#5a4030');
    }

    // Legs
    PA.pixel(ctx, x - 1, y + 3, '#6a5a4a');
    PA.pixel(ctx, x - 1, y + 2, '#6a5a4a');
    PA.pixel(ctx, x + 1, y + 3, '#6a5a4a');
    PA.pixel(ctx, x + 1, y + 2, '#6a5a4a');

    // Cloak lower (flowing)
    PA.rect(ctx, x - 3, y, 7, 2, cloak);
    PA.pixel(ctx, x - 3, y + 1, cloakLight);

    // Leather chest armor
    PA.rect(ctx, x - 2, y - 3, 5, 3, leather);
    PA.rect(ctx, x - 3, y - 2, 7, 2, C.SKELETON_DARK);
    // Armor light
    PA.pixel(ctx, x - 2, y - 3, PA.lighten(leather, 10));

    // Cloak shoulders
    PA.rect(ctx, x - 4, y - 3, 2, 3, cloak);
    PA.rect(ctx, x + 3, y - 3, 2, 3, cloak);
    PA.pixel(ctx, x - 4, y - 3, cloakLight);
    PA.pixel(ctx, x + 4, y - 3, cloakLight);

    // Arms
    const armSwing = f % 2;
    PA.pixel(ctx, x - 4, y - 1, skin);
    PA.pixel(ctx, x - 5, y - armSwing, skin);
    PA.pixel(ctx, x + 4, y - 1, skin);
    PA.pixel(ctx, x + 5, y + armSwing, skin);

    // Head
    PA.rect(ctx, x - 2, y - 8, 5, 5, skin);
    PA.pixel(ctx, x - 2, y - 8, skinDark);
    PA.pixel(ctx, x + 2, y - 4, skinDark);

    // Hood (green cloak hood)
    PA.rect(ctx, x - 3, y - 8, 7, 2, cloak);
    PA.rect(ctx, x - 2, y - 9, 5, 1, cloak);
    PA.pixel(ctx, x - 1, y - 9, cloakLight);

    // Eyes (green)
    PA.pixel(ctx, x - 1, y - 6, C.SKELETON_EYE);
    PA.pixel(ctx, x + 1, y - 6, C.SKELETON_EYE);

    // Nose & mouth
    PA.pixel(ctx, x, y - 5, skinDark);
    PA.pixel(ctx, x, y - 4, '#c0a080');

    // Light source
    PA.pixel(ctx, x - 2, y - 7, PA.lighten(skin, 12));
    PA.pixel(ctx, x + 2, y - 5, PA.darken(skin, 10));

    // Quiver (back, right side)
    PA.rect(ctx, x + 3, y - 7, 1, 5, '#6a4a2a');
    PA.pixel(ctx, x + 3, y - 8, '#aaaaaa'); // arrow tips
    PA.pixel(ctx, x + 4, y - 8, '#aaaaaa');

    // Longbow (left side)
    PA.pixel(ctx, x - 6, y - 6, '#7a5a30');
    PA.pixel(ctx, x - 6, y - 5, '#8a6a40');
    PA.pixel(ctx, x - 6, y - 4, '#8a6a40');
    PA.pixel(ctx, x - 6, y - 3, '#8a6a40');
    PA.pixel(ctx, x - 6, y - 2, '#8a6a40');
    PA.pixel(ctx, x - 6, y - 1, '#7a5a30');
    // Bowstring
    PA.pixel(ctx, x - 5, y - 5, '#aaaaaa');
    PA.pixel(ctx, x - 5, y - 2, '#aaaaaa');
  },

  renderOrc(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = enemy.animFrame;
    const flash = enemy.flashTimer > 0;
    const armor = flash ? '#cccccc' : C.ORC_ARMOR;
    const armorLight = flash ? '#dddddd' : '#8898b0';
    const armorDark = flash ? '#aaaaaa' : '#506080';
    const skin = flash ? '#ffffff' : C.ORC_SKIN;

    // === KNIGHT: Heavy plate armored warrior with greatsword ===

    // Shadow (larger)
    PA.rect(ctx, x - 4, y + 6, 9, 1, 'rgba(0,0,0,0.3)');

    // Armored boots
    if (f === 0 || f === 2) {
      PA.rect(ctx, x - 3, y + 4, 3, 2, armorDark);
      PA.rect(ctx, x + 1, y + 4, 3, 2, armorDark);
    } else if (f === 1) {
      PA.rect(ctx, x - 4, y + 3, 3, 2, armorDark);
      PA.rect(ctx, x + 2, y + 4, 3, 2, armorDark);
    } else {
      PA.rect(ctx, x - 3, y + 4, 3, 2, armorDark);
      PA.rect(ctx, x + 3, y + 3, 3, 2, armorDark);
    }
    // Boot metal trim
    PA.pixel(ctx, x - 2, y + 4, armorLight);
    PA.pixel(ctx, x + 2, y + 4, armorLight);

    // Leg armor (greaves)
    PA.rect(ctx, x - 2, y + 2, 2, 2, armor);
    PA.rect(ctx, x + 1, y + 2, 2, 2, armor);

    // Plate armor (torso)
    PA.rect(ctx, x - 4, y - 3, 9, 5, armor);
    PA.rect(ctx, x - 3, y - 4, 7, 1, armor);
    // Armor detail
    PA.rect(ctx, x - 3, y - 2, 7, 1, armorLight);
    PA.pixel(ctx, x - 4, y - 3, armorLight);
    PA.pixel(ctx, x + 4, y - 3, armorDark);
    // Center chest emblem
    PA.rect(ctx, x - 1, y - 3, 3, 3, armorLight);
    PA.pixel(ctx, x, y - 2, '#c8b040'); // gold cross emblem
    // Left-top light source
    PA.pixel(ctx, x - 3, y - 3, PA.lighten(armor, 15));
    PA.pixel(ctx, x - 2, y - 4, PA.lighten(armor, 15));

    // Shoulder pauldrons (large)
    PA.rect(ctx, x - 5, y - 4, 2, 3, armorDark);
    PA.rect(ctx, x + 4, y - 4, 2, 3, armorDark);
    PA.pixel(ctx, x - 5, y - 4, armorLight);
    PA.pixel(ctx, x + 5, y - 4, armorDark);

    // Arms (armored)
    PA.pixel(ctx, x - 5, y - 1, armor);
    PA.pixel(ctx, x - 6, y, armor);
    PA.pixel(ctx, x - 6, y + 1, armorDark);
    PA.pixel(ctx, x + 5, y - 1, armor);
    PA.pixel(ctx, x + 6, y, armor);
    PA.pixel(ctx, x + 6, y + 1, armorDark);

    // Helmet (full plate helm with visor)
    PA.rect(ctx, x - 3, y - 9, 7, 5, armor);
    PA.rect(ctx, x - 2, y - 10, 5, 1, armorLight);
    // Visor slit (eyes visible)
    PA.rect(ctx, x - 2, y - 7, 5, 1, '#1a1a2a');
    PA.pixel(ctx, x - 1, y - 7, '#aaccff'); // glowing blue eyes through visor
    PA.pixel(ctx, x + 1, y - 7, '#aaccff');
    // Helmet crest / plume (blue feather)
    PA.pixel(ctx, x, y - 11, '#4466aa');
    PA.pixel(ctx, x, y - 12, '#5577bb');
    PA.pixel(ctx, x + 1, y - 12, '#4466aa');
    // Helmet light/shadow
    PA.pixel(ctx, x - 3, y - 9, armorLight);
    PA.pixel(ctx, x + 3, y - 6, armorDark);

    // Greatsword (right side, large)
    PA.rect(ctx, x + 6, y - 8, 1, 11, '#6b5a3a'); // handle
    PA.rect(ctx, x + 5, y - 4, 3, 1, '#c8b040');  // guard (gold)
    PA.rect(ctx, x + 7, y - 9, 2, 4, '#aaaaaa');   // blade
    PA.rect(ctx, x + 7, y - 10, 2, 1, '#bbbbbb');
    PA.pixel(ctx, x + 7, y - 11, '#cccccc');        // tip
    // Blade highlight
    PA.pixel(ctx, x + 8, y - 10, '#dddddd');
  },

  renderSlime(ctx, enemy, x, y, time) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const flash = enemy.flashTimer > 0;
    const cloth = flash ? '#cccccc' : C.SLIME_BODY;
    const clothLight = flash ? '#dddddd' : C.SLIME_LIGHT;
    const clothDark = flash ? '#aaaaaa' : C.SLIME_DARK;

    // === THIEF: Agile rogue with dual daggers and mask ===

    // Agile dodge sway (reusing bounce animation)
    const sway = Math.sin((time || 0) / 200 + enemy.x) * 1;
    const bx = Math.round(x + sway);

    // Shadow
    PA.rect(ctx, bx - 3, y + 3, 6, 1, 'rgba(0,0,0,0.2)');

    // Boots (soft leather, silent)
    PA.pixel(ctx, bx - 2, y + 2, '#3a3030');
    PA.pixel(ctx, bx - 1, y + 2, '#3a3030');
    PA.pixel(ctx, bx + 1, y + 2, '#3a3030');
    PA.pixel(ctx, bx + 2, y + 2, '#3a3030');

    // Legs
    PA.pixel(ctx, bx - 1, y + 1, clothDark);
    PA.pixel(ctx, bx + 1, y + 1, clothDark);

    // Dark cloak body
    PA.rect(ctx, bx - 2, y - 2, 5, 3, cloth);
    PA.rect(ctx, bx - 3, y - 1, 7, 2, clothDark);
    // Cloak light edge
    PA.pixel(ctx, bx - 2, y - 2, clothLight);
    PA.pixel(ctx, bx + 2, y, clothDark);

    // Belt with pouches
    PA.rect(ctx, bx - 2, y, 5, 1, '#4a3a2a');
    PA.pixel(ctx, bx - 2, y, '#6a5a3a'); // pouch
    PA.pixel(ctx, bx + 2, y, '#6a5a3a'); // pouch

    // Arms
    PA.pixel(ctx, bx - 3, y - 1, cloth);
    PA.pixel(ctx, bx - 4, y, '#d0b898'); // skin hand
    PA.pixel(ctx, bx + 3, y - 1, cloth);
    PA.pixel(ctx, bx + 4, y, '#d0b898'); // skin hand

    // Head (masked)
    PA.rect(ctx, bx - 2, y - 5, 5, 3, cloth);
    PA.pixel(ctx, bx - 1, y - 6, cloth);
    PA.pixel(ctx, bx, y - 6, cloth);
    PA.pixel(ctx, bx + 1, y - 6, cloth);

    // Mask slit (eyes only)
    PA.rect(ctx, bx - 2, y - 4, 5, 1, '#1a1a2a');
    PA.pixel(ctx, bx - 1, y - 4, '#ffffff'); // sharp white eyes
    PA.pixel(ctx, bx + 1, y - 4, '#ffffff');

    // Hood point
    PA.pixel(ctx, bx, y - 7, clothDark);

    // Light source
    PA.pixel(ctx, bx - 2, y - 5, clothLight);
    PA.pixel(ctx, bx + 2, y - 3, PA.darken(cloth, 10));

    // Dual daggers
    // Left dagger
    PA.pixel(ctx, bx - 5, y + 1, '#6a5a4a');
    PA.pixel(ctx, bx - 5, y, '#aaaaaa');
    PA.pixel(ctx, bx - 5, y - 1, '#cccccc');
    // Right dagger
    PA.pixel(ctx, bx + 5, y + 1, '#6a5a4a');
    PA.pixel(ctx, bx + 5, y, '#aaaaaa');
    PA.pixel(ctx, bx + 5, y - 1, '#cccccc');
  },

  renderDeath(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const progress = enemy.deathTimer / 500;
    const rng = PA.seededRandom(Math.round(enemy.x * 100 + enemy.y));

    // 深淵死亡：沉入黑暗深淵
    if (enemy.deathType === 'abyss') {
      const sinkProgress = Math.min(1, enemy.deathTimer / 600);

      // 敵人身體逐漸縮小 + 透明度降低，向下沉入黑暗
      if (sinkProgress < 0.85) {
        const bodyAlpha = 1 - sinkProgress * 1.15;
        const scale = Math.max(0.1, 1 - sinkProgress);
        const size = Math.max(1, Math.round(scale * 6));
        const sinkY = y + Math.round(sinkProgress * 6);
        ctx.save();
        ctx.globalAlpha = Math.max(0, bodyAlpha);
        const bodyColor = enemy.type.id === 'goblin' ? DK.COLORS.GOBLIN_SKIN :
                          enemy.type.id === 'skeleton' ? DK.COLORS.SKELETON_BONE :
                          enemy.type.id === 'orc' ? DK.COLORS.ORC_SKIN : DK.COLORS.SLIME_BODY;
        PA.rect(ctx, x - Math.floor(size / 2), sinkY - size, size, size, bodyColor);
        ctx.restore();
      }

      // 邊緣小石子碎裂掉落粒子（灰色/暗色）
      for (let i = 0; i < 5; i++) {
        const angle = rng() * Math.PI * 2;
        const dist = sinkProgress * 4 * (0.3 + rng() * 0.7);
        const bx = Math.round(x + Math.cos(angle) * dist);
        const by = Math.round(y + Math.sin(angle) * dist * 0.5);

        if (sinkProgress < 0.6) {
          // 石子碎裂粒子（2G: 3 種色隨機）
          const stoneColors = ['#555550', '#3a3830', '#4a4540'];
          const stoneColor = stoneColors[Math.floor(rng() * 3)];
          PA.pixel(ctx, bx, by, stoneColor);
        }
        if (sinkProgress > 0.2 && sinkProgress < 0.8) {
          // 碎石掉落
          const fallY = by + Math.round((sinkProgress - 0.2) * 6);
          PA.pixel(ctx, bx, fallY, '#2a2820');
        }
      }

      // 黑暗漩渦效果（暗色環形）
      if (sinkProgress < 0.8) {
        const vortexR = 2 + Math.round(sinkProgress * 3);
        for (let a = 0; a < 8; a++) {
          const ga = (a / 8) * Math.PI * 2 + sinkProgress * 3;
          const vx = Math.round(x + Math.cos(ga) * vortexR);
          const vy = Math.round(y + Math.sin(ga) * vortexR * 0.4);
          PA.pixel(ctx, vx, vy, '#1a1a1a');
        }
        // 內圈更暗漩渦
        const innerR = Math.max(1, vortexR - 2);
        for (let a = 0; a < 4; a++) {
          const ga = (a / 4) * Math.PI * 2 - sinkProgress * 2;
          PA.pixel(ctx, Math.round(x + Math.cos(ga) * innerR),
                   Math.round(y + Math.sin(ga) * innerR * 0.4),
                   '#0a0a0a');
        }
      }

      // 最後消失點：純黑
      if (sinkProgress > 0.7) {
        const fadeSize = Math.max(1, Math.round((1 - sinkProgress) * 4));
        PA.rect(ctx, x - Math.floor(fadeSize / 2), y - Math.floor(fadeSize / 2),
                fadeSize, fadeSize, '#000000');
      }
      return;
    }

    // Get type-specific colors
    const colors = {
      goblin: [DK.COLORS.GOBLIN_SKIN, DK.COLORS.GOBLIN_DARK, '#6a4a2a'],
      skeleton: [DK.COLORS.SKELETON_BONE, DK.COLORS.SKELETON_DARK, '#505860'],
      orc: [DK.COLORS.ORC_SKIN, DK.COLORS.ORC_DARK, DK.COLORS.ORC_ARMOR],
      slime: [DK.COLORS.SLIME_BODY, DK.COLORS.SLIME_LIGHT, DK.COLORS.SLIME_DARK],
    }[enemy.type.id] || ['#ffffff', '#aaaaaa', '#666666'];

    if (enemy.type.id === 'slime') {
      // Slime: splash/splatter effect
      const splashR = progress * 12;
      for (let i = 0; i < 12; i++) {
        const angle = rng() * Math.PI * 2;
        const dist = splashR * (0.3 + rng() * 0.7);
        const px = Math.round(x + Math.cos(angle) * dist);
        const py = Math.round(y + Math.sin(angle) * dist);
        if (progress < 0.7) {
          PA.pixel(ctx, px, py, colors[i % 3]);
        }
        // Small puddle remains
        if (progress > 0.3 && dist < 4) {
          PA.pixel(ctx, px, py + 2, DK.COLORS.SLIME_DARK);
        }
      }
    } else if (enemy.type.id === 'skeleton') {
      // Skeleton: bones scatter and collapse
      for (let i = 0; i < 10; i++) {
        const angle = rng() * Math.PI * 2;
        const dist = progress * 6 * (0.3 + rng() * 0.7);
        const px = Math.round(x + Math.cos(angle) * dist);
        const py = Math.round(y + Math.sin(angle) * dist + progress * 3);
        if (progress < 0.8) {
          const col = i % 2 === 0 ? colors[0] : colors[1];
          PA.pixel(ctx, px, py, col);
          if (rng() > 0.5) PA.pixel(ctx, px + 1, py, col);
        }
      }
      // Skull last to fade
      if (progress < 0.6) {
        PA.pixel(ctx, x, y + Math.round(progress * 4), colors[0]);
        PA.pixel(ctx, x + 1, y + Math.round(progress * 4), colors[0]);
      }
    } else {
      // Goblin/Orc: burst into particles flying upward
      for (let i = 0; i < 14; i++) {
        const angle = rng() * Math.PI * 2;
        const speed = 0.5 + rng() * 0.8;
        const dist = progress * 12 * speed;
        const px = Math.round(x + Math.cos(angle) * dist);
        const py = Math.round(y + Math.sin(angle) * dist - progress * 4);
        const col = colors[i % 3];

        if (progress < 0.8) {
          PA.pixel(ctx, px, py, col);
        }
      }
      // Poof cloud
      if (progress < 0.3) {
        const cloudR = progress * 8;
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          PA.pixel(ctx, Math.round(x + Math.cos(angle) * cloudR),
                   Math.round(y + Math.sin(angle) * cloudR), '#888888');
        }
      }
    }
  },

  renderHPBar(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const hpPercent = enemy.hp / enemy.maxHp;
    const barWidth = 12;
    const barX = x - 6;
    const barY = y - 11;

    // Only show when damaged
    if (hpPercent >= 1) return;

    // === 2F: 金屬邊框 (1px) ===
    PA.rect(ctx, barX - 2, barY - 2, barWidth + 4, 7, '#3a3a3a');
    // Background (dark with border) — 高度從 4→5
    PA.rect(ctx, barX - 1, barY - 1, barWidth + 2, 5, '#0a0a0a');
    PA.rect(ctx, barX, barY, barWidth, 3, '#2a1a1a');

    // === 2F: HP 漸進插值顏色 ===
    const fillWidth = Math.ceil(barWidth * hpPercent);
    const r = Math.round(hpPercent > 0.5 ? (1 - hpPercent) * 2 * 204 + 68 : 204);
    const g = Math.round(hpPercent > 0.5 ? 204 : hpPercent * 2 * 204);
    const fillColor = `rgb(${r},${g},68)`;
    const fillHighlight = `rgb(${Math.min(255, r + 34)},${Math.min(255, g + 34)},102)`;
    // 填充從 2→3px 高
    PA.rect(ctx, barX, barY + 1, fillWidth, 2, fillColor);
    PA.rect(ctx, barX, barY, fillWidth, 1, fillHighlight);
  },
};
