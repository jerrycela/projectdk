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

  spawn(typeName, pathIndex) {
    const typeDef = DK.ENEMY_TYPES[typeName];
    if (!typeDef || DK.Map.path.length === 0) return null;

    const startPos = DK.Map.path[pathIndex || 0];
    const enemy = {
      id: this._nextId++,
      type: typeDef,
      x: startPos.x,
      y: startPos.y,
      hp: typeDef.hp,
      maxHp: typeDef.hp,
      speed: typeDef.speed,
      pathIndex: pathIndex || 0,
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
      spawnTimer: 300, // 生成淡入動畫 (300ms)
    };

    this.active.push(enemy);
    return enemy;
  },

  update(dt) {
    const T = DK.CONFIG.TILE_SIZE;
    const path = DK.Map.path;

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
              // 金幣閃光粒子特效
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
            // Pushed onto path - update position
            enemy.x = enemy.pushed.targetX;
            enemy.y = enemy.pushed.targetY;

            // Find nearest pathIndex for new position
            const path = DK.Map.path;
            let bestIdx = enemy.pathIndex;
            let bestDist = Infinity;
            for (let i = 0; i < path.length; i++) {
              const pdx = path[i].x - enemy.x;
              const pdy = path[i].y - enemy.y;
              const dist = pdx * pdx + pdy * pdy;
              if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
              }
            }
            enemy.pathIndex = bestIdx;
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

      // Movement along path
      if (enemy.pathIndex >= path.length - 1) {
        enemy.reachedEnd = true;
        enemy.alive = false;
        continue;
      }

      const target = path[enemy.pathIndex + 1];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        enemy.pathIndex++;
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
        DK.PixelArt.pixel(ctx, x - 1, y - 7, DK.COLORS.ELEMENT_ICE);
        DK.PixelArt.pixel(ctx, x + 1, y - 7, DK.COLORS.ELEMENT_ICE);
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
    const dark = flash ? '#dddddd' : C.GOBLIN_DARK;
    const light = flash ? '#ffffff' : '#55cc55';

    // === GOBLIN: Small, hunched, pointy-eared creature with ragged tunic ===

    // Shadow on ground
    PA.rect(ctx, x - 3, y + 4, 6, 1, 'rgba(0,0,0,0.2)');

    // Feet (animated walk cycle)
    if (f === 0 || f === 2) {
      PA.pixel(ctx, x - 2, y + 3, '#4a3020');
      PA.pixel(ctx, x - 1, y + 3, '#4a3020');
      PA.pixel(ctx, x + 1, y + 3, '#4a3020');
      PA.pixel(ctx, x + 2, y + 3, '#4a3020');
    } else if (f === 1) {
      PA.pixel(ctx, x - 3, y + 3, '#4a3020');
      PA.pixel(ctx, x - 2, y + 2, '#4a3020');
      PA.pixel(ctx, x + 2, y + 3, '#4a3020');
      PA.pixel(ctx, x + 3, y + 3, '#4a3020');
    } else {
      PA.pixel(ctx, x - 2, y + 3, '#4a3020');
      PA.pixel(ctx, x - 3, y + 3, '#4a3020');
      PA.pixel(ctx, x + 3, y + 2, '#4a3020');
      PA.pixel(ctx, x + 2, y + 3, '#4a3020');
    }

    // Legs (green, thin)
    PA.pixel(ctx, x - 1, y + 2, dark);
    PA.pixel(ctx, x + 1, y + 2, dark);

    // Ragged tunic (brown)
    PA.rect(ctx, x - 2, y - 1, 5, 3, '#6a4a2a');
    PA.rect(ctx, x - 3, y, 7, 2, '#5a3a1a');
    // Tunic trim
    PA.pixel(ctx, x - 3, y + 1, '#4a2a10');
    PA.pixel(ctx, x + 3, y + 1, '#4a2a10');

    // Body/skin (behind tunic)
    PA.rect(ctx, x - 2, y - 2, 5, 1, skin);

    // Arms (thin, reaching forward)
    const armOffset = f % 2;
    PA.pixel(ctx, x - 3, y - 1 + armOffset, skin);
    PA.pixel(ctx, x - 4, y + armOffset, skin);
    PA.pixel(ctx, x + 3, y - 1 - armOffset, skin);
    PA.pixel(ctx, x + 4, y - armOffset, skin);

    // Head (large for body, distinctive green)
    PA.rect(ctx, x - 3, y - 6, 7, 4, skin);
    PA.rect(ctx, x - 2, y - 7, 5, 1, skin);
    // Face shading
    PA.rect(ctx, x - 3, y - 4, 7, 1, dark);

    // Pointy ears (prominent, goblin signature)
    PA.pixel(ctx, x - 4, y - 5, skin);
    PA.pixel(ctx, x - 5, y - 6, skin);
    PA.pixel(ctx, x - 5, y - 7, light);
    PA.pixel(ctx, x + 4, y - 5, skin);
    PA.pixel(ctx, x + 5, y - 6, skin);
    PA.pixel(ctx, x + 5, y - 7, light);

    // Eyes (large, menacing red)
    PA.pixel(ctx, x - 2, y - 5, C.GOBLIN_EYE);
    PA.pixel(ctx, x - 1, y - 5, '#ff8888');
    PA.pixel(ctx, x + 1, y - 5, C.GOBLIN_EYE);
    PA.pixel(ctx, x + 2, y - 5, '#ff8888');

    // Nose (pointy)
    PA.pixel(ctx, x, y - 4, light);

    // Mouth (toothy grin)
    PA.pixel(ctx, x - 1, y - 3, '#2a5a2a');
    PA.pixel(ctx, x, y - 3, '#ffffff');
    PA.pixel(ctx, x + 1, y - 3, '#2a5a2a');

    // === 2A: 光源面統一 — 頭部左上高光、右下陰影 ===
    PA.pixel(ctx, x - 3, y - 6, PA.lighten(skin, 12));  // 頭部左側高光
    PA.pixel(ctx, x - 2, y - 7, PA.lighten(skin, 12));  // 頭頂左側高光
    PA.pixel(ctx, x + 3, y - 4, PA.darken(skin, 12));   // 頭部右下陰影
    PA.pixel(ctx, x + 2, y - 3, PA.darken(skin, 12));   // 下巴右側陰影

    // === 2B: 衣著分明暗面 ===
    PA.pixel(ctx, x - 2, y - 1, PA.lighten('#6a4a2a', 12));  // 衣著左側高光
    PA.pixel(ctx, x + 2, y - 1, PA.darken('#6a4a2a', 12));   // 衣著右側陰影

    // === 2B: 耳朵底部陰影 ===
    PA.pixel(ctx, x - 4, y - 4, PA.darken(skin, 12));  // 左耳底部陰影
    PA.pixel(ctx, x + 4, y - 4, PA.darken(skin, 12));  // 右耳底部陰影

    // === 2B: 眼睛黑底對比 ===
    PA.pixel(ctx, x - 2, y - 4, '#1a0a0a');  // 左眼下方黑底
    PA.pixel(ctx, x + 1, y - 4, '#1a0a0a');  // 右眼下方黑底

    // Small rusty dagger (held in right hand)
    PA.pixel(ctx, x + 5, y - 1, '#8a6a4a');
    PA.pixel(ctx, x + 5, y - 2, '#aaaaaa');
    PA.pixel(ctx, x + 5, y - 3, '#cccccc');
  },

  renderSkeleton(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = enemy.animFrame;
    const flash = enemy.flashTimer > 0;
    const bone = flash ? '#ffffff' : C.SKELETON_BONE;
    const dark = flash ? '#dddddd' : C.SKELETON_DARK;
    const joint = flash ? '#cccccc' : '#b0a890';

    // === SKELETON: Undead warrior with visible bone structure and tattered armor ===

    // Shadow
    PA.rect(ctx, x - 3, y + 5, 7, 1, 'rgba(0,0,0,0.2)');

    // Feet (bone)
    if (f < 2) {
      PA.rect(ctx, x - 2, y + 4, 2, 1, bone);
      PA.rect(ctx, x + 1, y + 4, 2, 1, bone);
    } else {
      PA.rect(ctx, x - 3, y + 4, 2, 1, bone);
      PA.rect(ctx, x + 2, y + 4, 2, 1, bone);
    }

    // Leg bones
    PA.pixel(ctx, x - 1, y + 3, bone);
    PA.pixel(ctx, x - 1, y + 2, joint);
    PA.pixel(ctx, x + 1, y + 3, bone);
    PA.pixel(ctx, x + 1, y + 2, joint);

    // Pelvis
    PA.rect(ctx, x - 2, y + 1, 5, 1, dark);

    // Ribcage (detailed - visible ribs)
    PA.rect(ctx, x - 2, y - 3, 5, 4, bone);
    // Spine (center dark line)
    PA.rect(ctx, x, y - 3, 1, 4, dark);
    // Rib gaps
    PA.pixel(ctx, x - 1, y - 2, dark);
    PA.pixel(ctx, x + 1, y - 2, dark);
    PA.pixel(ctx, x - 1, y, dark);
    PA.pixel(ctx, x + 1, y, dark);

    // Tattered armor remnant (shoulder piece)
    PA.rect(ctx, x - 3, y - 3, 2, 2, '#505860');
    PA.pixel(ctx, x - 3, y - 3, '#606870');
    PA.rect(ctx, x + 2, y - 3, 2, 2, '#505860');
    PA.pixel(ctx, x + 3, y - 3, '#606870');

    // Arms (bone with joints)
    const armSwing = f % 2;
    // Left arm
    PA.pixel(ctx, x - 3, y - 1, bone);
    PA.pixel(ctx, x - 4, y - armSwing, joint);
    PA.pixel(ctx, x - 5, y + 1 - armSwing, bone);
    // Right arm
    PA.pixel(ctx, x + 3, y - 1, bone);
    PA.pixel(ctx, x + 4, y + armSwing, joint);
    PA.pixel(ctx, x + 5, y + 1 + armSwing, bone);

    // Skull (detailed)
    PA.rect(ctx, x - 3, y - 8, 7, 5, bone);
    PA.pixel(ctx, x - 3, y - 8, dark);
    PA.pixel(ctx, x + 3, y - 8, dark);
    // Cranium highlight
    PA.rect(ctx, x - 1, y - 8, 3, 1, '#e8e0d0');

    // Eye sockets (deep and dark)
    PA.rect(ctx, x - 2, y - 7, 2, 2, '#0a0808');
    PA.rect(ctx, x + 1, y - 7, 2, 2, '#0a0808');
    // === 2C: 眼眶周圍暗色環像素 ===
    PA.pixel(ctx, x - 3, y - 6, '#0a0808');
    PA.pixel(ctx, x + 3, y - 6, '#0a0808');
    // Glowing eyes (2C: 改為黃綠色)
    PA.pixel(ctx, x - 2, y - 6, '#ccff44');
    PA.pixel(ctx, x + 1, y - 6, '#ccff44');

    // Nasal cavity
    PA.pixel(ctx, x, y - 5, '#2a2018');

    // Jaw (separate, slightly open)
    PA.rect(ctx, x - 2, y - 4, 5, 1, dark);
    // Teeth
    PA.pixel(ctx, x - 1, y - 4, bone);
    PA.pixel(ctx, x + 1, y - 4, bone);

    // === 2A: 骷髏光源面統一 — 頭骨左上高光、右下陰影 ===
    PA.pixel(ctx, x - 3, y - 7, PA.lighten(bone, 12));  // 頭骨左側高光
    PA.pixel(ctx, x - 1, y - 8, PA.lighten(bone, 12));  // 頭頂左側高光
    PA.pixel(ctx, x + 3, y - 5, PA.darken(bone, 12));   // 頭骨右下陰影
    PA.pixel(ctx, x + 2, y - 4, PA.darken(bone, 12));   // 下顎右側陰影

    // Rusty sword (left hand)
    PA.pixel(ctx, x - 6, y + 2, '#6a5a4a');
    PA.pixel(ctx, x - 6, y + 1, '#8a7a6a');
    PA.pixel(ctx, x - 6, y, '#aaaaaa');
    PA.pixel(ctx, x - 6, y - 1, '#bbbbbb');
    PA.pixel(ctx, x - 6, y - 2, '#cccccc');
    // === 2C: 劍尖高光 ===
    PA.pixel(ctx, x - 6, y - 3, '#dddddd');
  },

  renderOrc(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = enemy.animFrame;
    const flash = enemy.flashTimer > 0;
    const skin = flash ? '#ffffff' : C.ORC_SKIN;
    const dark = flash ? '#dddddd' : C.ORC_DARK;
    const armor = flash ? '#bbbbbb' : C.ORC_ARMOR;

    // === ORC: Large, muscular brute with heavy plate armor and battleaxe ===

    // Shadow (larger)
    PA.rect(ctx, x - 4, y + 6, 9, 1, 'rgba(0,0,0,0.3)');

    // Boots (heavy, armored)
    if (f === 0 || f === 2) {
      PA.rect(ctx, x - 3, y + 4, 3, 2, '#3a3030');
      PA.rect(ctx, x + 1, y + 4, 3, 2, '#3a3030');
    } else if (f === 1) {
      PA.rect(ctx, x - 4, y + 3, 3, 2, '#3a3030');
      PA.rect(ctx, x + 2, y + 4, 3, 2, '#3a3030');
    } else {
      PA.rect(ctx, x - 3, y + 4, 3, 2, '#3a3030');
      PA.rect(ctx, x + 3, y + 3, 3, 2, '#3a3030');
    }
    // Boot metal trim
    PA.pixel(ctx, x - 2, y + 4, armor);
    PA.pixel(ctx, x + 2, y + 4, armor);

    // Legs (thick, armored greaves)
    PA.rect(ctx, x - 2, y + 2, 2, 2, armor);
    PA.rect(ctx, x + 1, y + 2, 2, 2, armor);

    // Body armor (heavy plate)
    PA.rect(ctx, x - 4, y - 3, 9, 5, armor);
    PA.rect(ctx, x - 3, y - 4, 7, 1, armor);
    // Armor detail - rivets and plates
    PA.rect(ctx, x - 3, y - 2, 7, 1, '#707880');
    PA.pixel(ctx, x - 4, y - 3, '#808890');
    PA.pixel(ctx, x + 4, y - 3, '#808890');
    // Center chest plate
    PA.rect(ctx, x - 1, y - 3, 3, 3, '#707880');
    PA.pixel(ctx, x, y - 2, '#888');
    // Shoulder pauldrons
    PA.rect(ctx, x - 5, y - 4, 2, 3, '#505860');
    PA.rect(ctx, x + 4, y - 4, 2, 3, '#505860');
    PA.pixel(ctx, x - 5, y - 4, '#707880');
    PA.pixel(ctx, x + 5, y - 4, '#707880');

    // Arms (thick, green skin visible below armor)
    PA.pixel(ctx, x - 5, y - 1, skin);
    PA.pixel(ctx, x - 6, y, skin);
    PA.pixel(ctx, x - 6, y + 1, dark);
    PA.pixel(ctx, x + 5, y - 1, skin);
    PA.pixel(ctx, x + 6, y, skin);
    PA.pixel(ctx, x + 6, y + 1, dark);

    // Head (large, brutish)
    PA.rect(ctx, x - 4, y - 9, 9, 5, skin);
    PA.rect(ctx, x - 3, y - 10, 7, 1, skin);
    // Heavy brow ridge
    PA.rect(ctx, x - 4, y - 9, 9, 1, dark);
    PA.rect(ctx, x - 3, y - 10, 7, 1, dark);

    // Eyes (fierce orange)
    PA.pixel(ctx, x - 2, y - 7, '#ff6600');
    PA.pixel(ctx, x - 1, y - 7, '#ff8800');
    PA.pixel(ctx, x + 1, y - 7, '#ff6600');
    PA.pixel(ctx, x + 2, y - 7, '#ff8800');

    // Nose (flat, wide)
    PA.pixel(ctx, x - 1, y - 6, dark);
    PA.pixel(ctx, x, y - 6, dark);
    PA.pixel(ctx, x + 1, y - 6, dark);

    // Tusks (prominent, ivory)
    PA.pixel(ctx, x - 3, y - 5, '#e8e0d0');
    PA.pixel(ctx, x - 3, y - 4, '#d8d0c0');
    PA.pixel(ctx, x + 3, y - 5, '#e8e0d0');
    PA.pixel(ctx, x + 3, y - 4, '#d8d0c0');

    // Jaw
    PA.rect(ctx, x - 2, y - 5, 5, 1, dark);

    // Battle axe (right side, large)
    PA.rect(ctx, x + 6, y - 7, 1, 10, '#6b5010');
    PA.rect(ctx, x + 7, y - 8, 2, 4, '#aaaaaa');
    PA.rect(ctx, x + 7, y - 9, 2, 1, '#bbbbbb');
    PA.pixel(ctx, x + 9, y - 7, '#cccccc');
    PA.pixel(ctx, x + 9, y - 6, '#bbbbbb');
    // Axe blade highlight
    PA.pixel(ctx, x + 7, y - 9, '#dddddd');
    // === 2D: 戰斧刀刃高光 ===
    PA.pixel(ctx, x + 9, y - 8, '#eeeeee');

    // === 2A: 獸人光源面統一 — 頭部左上高光、右下陰影 ===
    PA.pixel(ctx, x - 4, y - 9, PA.lighten(skin, 12));  // 頭部左側高光
    PA.pixel(ctx, x - 3, y - 10, PA.lighten(skin, 12)); // 頭頂左側高光
    PA.pixel(ctx, x + 4, y - 5, PA.darken(skin, 12));   // 頭部右下陰影
    PA.pixel(ctx, x + 3, y - 4, PA.darken(skin, 12));   // 下巴右側陰影

    // === 2D: 胸甲左上光源面高光 ===
    PA.pixel(ctx, x - 3, y - 3, PA.lighten('#606870', 15));  // 胸甲高光
    PA.pixel(ctx, x - 2, y - 4, PA.lighten('#606870', 15));  // 胸甲高光 2

    // === 2D: 肩甲高光 ===
    PA.pixel(ctx, x - 5, y - 5, PA.lighten('#505860', 15));  // 左肩甲高光
  },

  renderSlime(ctx, enemy, x, y, time) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const flash = enemy.flashTimer > 0;
    const body = flash ? '#ffffff' : C.SLIME_BODY;
    const light = flash ? '#eeeeee' : C.SLIME_LIGHT;
    const dark = flash ? '#dddddd' : C.SLIME_DARK;

    // === SLIME: Translucent jelly creature that bounces and wobbles ===

    // Bounce animation
    const bounce = Math.sin((time || 0) / 200 + enemy.x) * 1.5;
    const squish = Math.cos((time || 0) / 200 + enemy.x); // Width variation
    const by = Math.round(y + bounce);
    const wide = squish > 0 ? 1 : 0;

    // Shadow (changes with bounce)
    const shadowW = 6 + wide;
    PA.rect(ctx, x - Math.floor(shadowW / 2), y + 3, shadowW, 1, 'rgba(0,0,0,0.2)');

    // Slime trail (transparent)
    PA.pixel(ctx, x - 2, y + 2, 'rgba(68,136,204,0.3)');
    PA.pixel(ctx, x + 1, y + 2, 'rgba(68,136,204,0.3)');

    // Body (blob shape with wobble)
    // Base (wider when squished down)
    PA.rect(ctx, x - 4 - wide, by + 1, 9 + wide * 2, 2, dark);
    // Middle body
    PA.rect(ctx, x - 4, by - 1, 9, 3, body);
    PA.rect(ctx, x - 3, by - 2, 7, 1, body);
    // Top (narrower)
    PA.rect(ctx, x - 2, by - 3, 5, 1, body);
    PA.pixel(ctx, x - 1, by - 4, body);
    PA.pixel(ctx, x, by - 4, body);
    PA.pixel(ctx, x + 1, by - 4, body);

    // Internal gradient (darker center mass)
    PA.rect(ctx, x - 2, by - 1, 5, 2, dark);
    PA.pixel(ctx, x - 1, by - 2, dark);
    PA.pixel(ctx, x + 1, by - 2, dark);

    // Glossy highlights (top-left, showing translucency)
    PA.pixel(ctx, x - 2, by - 3, light);
    PA.pixel(ctx, x - 1, by - 4, '#88ddff');
    PA.pixel(ctx, x - 3, by - 2, light);
    // Secondary highlight
    PA.pixel(ctx, x + 2, by - 1, light);

    // Eyes (cute, round)
    // Left eye
    PA.pixel(ctx, x - 2, by - 1, '#ffffff');
    PA.pixel(ctx, x - 1, by - 1, '#ffffff');
    PA.pixel(ctx, x - 2, by, '#000000');
    PA.pixel(ctx, x - 1, by, '#eeeeff');
    // Right eye
    PA.pixel(ctx, x + 1, by - 1, '#ffffff');
    PA.pixel(ctx, x + 2, by - 1, '#ffffff');
    PA.pixel(ctx, x + 2, by, '#000000');
    PA.pixel(ctx, x + 1, by, '#eeeeff');

    // Mouth (small smile)
    PA.pixel(ctx, x - 1, by + 1, '#2266aa');
    PA.pixel(ctx, x, by + 1, '#2266aa');
    PA.pixel(ctx, x + 1, by + 1, '#2266aa');

    // Light refraction spots (translucent body)
    PA.pixel(ctx, x + 3, by, 'rgba(136,204,255,0.5)');
    PA.pixel(ctx, x - 3, by + 1, 'rgba(136,204,255,0.5)');

    // === 2E: 身體底部邊緣漸進暗色 ===
    PA.pixel(ctx, x - 3, by + 1, PA.darken(C.SLIME_BODY, 15));
    PA.pixel(ctx, x + 3, by + 1, PA.darken(C.SLIME_BODY, 15));
    PA.pixel(ctx, x - 4, by + 1, PA.darken(C.SLIME_BODY, 15));

    // === 2E: 高光擴展第 2 層 — 淺藍漸進 ===
    PA.pixel(ctx, x - 3, by - 3, '#aaddff');
    PA.pixel(ctx, x - 1, by - 3, '#aaddff');

    // === 2E: 中心深藍核心像素 ===
    PA.pixel(ctx, x, by, '#1155aa');

    // === 2A: 史萊姆光源面統一 — 左上高光、右下陰影 ===
    PA.pixel(ctx, x - 4, by - 1, PA.lighten(body, 12));  // 左側高光
    PA.pixel(ctx, x - 3, by - 2, PA.lighten(body, 12));  // 左上高光
    PA.pixel(ctx, x + 4, by + 1, PA.darken(body, 12));   // 右側陰影
    PA.pixel(ctx, x + 3, by + 2, PA.darken(body, 12));   // 右下陰影

    // Wobble drip (animated)
    if (squish < -0.5) {
      PA.pixel(ctx, x + 3, by + 2, body);
    }
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
