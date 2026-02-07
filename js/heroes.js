/**
 * Dungeon Keep - Hero System
 * Handles hero deployment, movement, attack, and rendering
 */
window.DK = window.DK || {};

DK.HERO_TYPES = {
  WATER_MAGE: {
    id: 'water_mage',
    name: '水法師',
    description: '施放水系範圍魔法，範圍內敵人附加潮濕',
    cost: 80,
    hp: 150,
    damage: 10,
    range: 3,
    aoeRadius: 1.5,
    attackCooldown: 1500,
    moveSpeed: 1.0,
    element: 'water',
    icon: 'water_mage',
    auraRange: 2,
  },
  FIRE_MAGE: {
    id: 'fire_mage',
    name: '火法師',
    description: '投擲火球，命中單體施加灼印',
    cost: 90,
    hp: 130,
    damage: 15,
    range: 3,
    aoeRadius: 1.0,
    attackCooldown: 1800,
    moveSpeed: 1.0,
    element: 'fire',
    icon: 'fire_mage',
    auraRange: 2,
  },
  ICE_MAGE: {
    id: 'ice_mage',
    name: '冰法師',
    description: '發射冰霜射線，直線施加冰凍印記',
    cost: 85,
    hp: 120,
    damage: 8,
    range: 3.5,
    aoeRadius: 0,
    attackCooldown: 1200,
    moveSpeed: 1.0,
    element: 'ice',
    icon: 'ice_mage',
    lineAttack: true,
    auraRange: 2,
  },
};

DK.Heroes = {
  active: [],
  selectedHero: null, // Reference to a deployed hero that is selected

  init() {
    this.active = [];
    this.selectedHero = null;
  },

  /**
   * Deploy a new hero at a floor tile
   */
  deploy(heroTypeId, col, row) {
    const typeDef = Object.values(DK.HERO_TYPES).find(t => t.id === heroTypeId);
    if (!typeDef) return false;

    // Check valid floor tile
    if (!DK.Map.isPath(col, row)) return false;
    const tile = DK.Map.layout[row][col];
    if (tile === 'E' || tile === 'X') return false;

    // Check not occupied by trap or another hero
    if (DK.Traps.placed.some(t => t.col === col && t.row === row)) return false;
    if (this.active.some(h => h.col === col && h.row === row)) return false;

    const T = DK.CONFIG.TILE_SIZE;
    const hero = {
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
      // Movement
      moving: false,
      movePath: [],
      moveIndex: 0,
      // Attack
      target: null,
      attacking: false,
    };

    this.active.push(hero);
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

  update(dt, enemies) {
    const T = DK.CONFIG.TILE_SIZE;

    for (const hero of this.active) {
      // Animation
      hero.animTimer += dt;
      if (hero.animTimer > 300) {
        hero.animFrame = (hero.animFrame + 1) % 4;
        hero.animTimer = 0;
      }

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

          // 根據英雄元素決定傷害文字顏色
          const dmgColorMap = { water: '#4488ff', fire: '#ff6622', ice: '#88ccff' };
          const dmgColor = dmgColorMap[hero.type.element] || '#ffffff';

          // 冰法師：直線射線攻擊
          if (hero.type.lineAttack) {
            // 計算英雄到敵人方向
            const dirX = bestTarget.x - hero.x;
            const dirY = bestTarget.y - hero.y;
            const dirLen = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
            const nx = dirX / dirLen;
            const ny = dirY / dirLen;

            // 射線方向上所有在 range 內的敵人都受到傷害
            const hitTargets = [];
            for (const enemy of enemies) {
              if (!enemy.alive || enemy.hp <= 0) continue;
              // 計算敵人到射線的距離（點到直線距離）
              const ex = enemy.x - hero.x;
              const ey = enemy.y - hero.y;
              // 投影長度
              const proj = ex * nx + ey * ny;
              if (proj < 0 || proj > range) continue;
              // 垂直距離
              const perpX = ex - nx * proj;
              const perpY = ey - ny * proj;
              const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
              // 射線寬度容差：半個格子
              if (perpDist <= T * 0.5) {
                hitTargets.push(enemy);
              }
            }

            // 對所有命中的敵人造成傷害和元素附著
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

            // 冰霜射線投射物效果
            if (DK.Game && DK.Game.effects) {
              const rayEndX = hero.x + nx * range;
              const rayEndY = hero.y + ny * range;
              DK.Game.effects.push({
                type: 'ice_ray',
                x: hero.x,
                y: hero.y - 4,
                targetX: rayEndX,
                targetY: rayEndY,
                duration: 400,
                timer: 0,
              });
            }
          } else {
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
      const x = Math.round(hero.x);
      const y = Math.round(hero.y);

      // 光環渲染
      this.renderAura(ctx, hero, x, y, time);

      // 根據英雄類型分派渲染
      if (hero.type.id === 'fire_mage') {
        this.renderFireMage(ctx, hero, x, y, time);
      } else if (hero.type.id === 'ice_mage') {
        this.renderIceMage(ctx, hero, x, y, time);
      } else {
        this.renderWaterMage(ctx, hero, x, y, time);
      }

      // Selection indicator
      if (this.selectedHero === hero) {
        // 根據英雄元素選擇光環顏色
        if (hero.type.id === 'fire_mage') {
          this.renderSelectionRing(ctx, x, y, time, 'rgba(255,102,34,');
        } else if (hero.type.id === 'ice_mage') {
          this.renderSelectionRing(ctx, x, y, time, 'rgba(136,204,255,');
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
    const f = hero.animFrame;
    const attacking = hero.attacking && hero.attackTimer > hero.type.attackCooldown * 0.7;

    // === WATER MAGE: Robed wizard with water staff ===

    // Shadow
    PA.rect(ctx, x - 3, y + 4, 7, 1, 'rgba(0,0,0,0.25)');

    // Feet (subtle, under robe)
    if (hero.moving) {
      if (f < 2) {
        PA.pixel(ctx, x - 1, y + 3, '#3a3050');
        PA.pixel(ctx, x + 1, y + 3, '#3a3050');
      } else {
        PA.pixel(ctx, x - 2, y + 3, '#3a3050');
        PA.pixel(ctx, x + 2, y + 3, '#3a3050');
      }
    } else {
      PA.pixel(ctx, x - 1, y + 3, '#3a3050');
      PA.pixel(ctx, x + 1, y + 3, '#3a3050');
    }

    // Robe lower (wide, flowing)
    PA.rect(ctx, x - 3, y + 1, 7, 2, '#1a3388');
    PA.rect(ctx, x - 4, y + 2, 9, 1, '#152a70');
    // Robe hem highlight
    PA.pixel(ctx, x - 3, y + 2, '#2244aa');
    PA.pixel(ctx, x + 3, y + 2, '#2244aa');

    // Robe upper (body)
    PA.rect(ctx, x - 3, y - 2, 7, 3, '#2244aa');
    PA.rect(ctx, x - 2, y - 3, 5, 1, '#2244aa');
    // Robe center line (belt area)
    PA.rect(ctx, x - 1, y - 1, 3, 1, '#c8a050');
    PA.pixel(ctx, x, y - 1, '#e0b860');

    // Shoulders
    PA.rect(ctx, x - 4, y - 3, 2, 2, '#1a3388');
    PA.rect(ctx, x + 3, y - 3, 2, 2, '#1a3388');
    // Shoulder trim
    PA.pixel(ctx, x - 4, y - 3, '#3355cc');
    PA.pixel(ctx, x + 4, y - 3, '#3355cc');

    // Arms
    const armOffset = hero.moving ? (f % 2) : 0;
    // Left arm
    PA.pixel(ctx, x - 4, y - 1 + armOffset, '#1a3388');
    PA.pixel(ctx, x - 5, y + armOffset, '#e8d0b0');
    // Right arm (holding staff)
    PA.pixel(ctx, x + 4, y - 1 - armOffset, '#1a3388');
    PA.pixel(ctx, x + 5, y - armOffset, '#e8d0b0');

    // Head (face visible in hood)
    PA.rect(ctx, x - 2, y - 6, 5, 3, '#e8d0b0');
    // Face shading
    PA.pixel(ctx, x - 2, y - 4, '#d0b898');
    PA.pixel(ctx, x + 2, y - 4, '#d0b898');

    // Eyes (blue, magical)
    PA.pixel(ctx, x - 1, y - 5, '#4488ff');
    PA.pixel(ctx, x + 1, y - 5, '#4488ff');

    // Mouth
    PA.pixel(ctx, x, y - 4, '#c8a890');

    // Hood (pointed wizard hat)
    PA.rect(ctx, x - 3, y - 7, 7, 1, '#1a3388');
    PA.rect(ctx, x - 4, y - 7, 9, 1, '#152a70');
    PA.rect(ctx, x - 2, y - 8, 5, 1, '#2244aa');
    PA.rect(ctx, x - 1, y - 9, 3, 1, '#2244aa');
    PA.pixel(ctx, x, y - 10, '#2244aa');
    PA.pixel(ctx, x, y - 11, '#3355cc');
    // Hat tip sparkle
    const sparkle = Math.sin((time || 0) / 200) > 0.5;
    if (sparkle) {
      PA.pixel(ctx, x, y - 12, '#88ccff');
      PA.pixel(ctx, x + 1, y - 11, '#4488ff');
    }

    // Staff (right side)
    PA.rect(ctx, x + 5, y - 8, 1, 10, '#6b5010');
    PA.pixel(ctx, x + 5, y - 9, '#5a4010');
    // Staff crystal (water crystal top)
    PA.pixel(ctx, x + 5, y - 10, '#44aaff');
    PA.pixel(ctx, x + 4, y - 10, '#2288dd');
    PA.pixel(ctx, x + 6, y - 10, '#2288dd');
    PA.pixel(ctx, x + 5, y - 11, '#88ccff');
    // Crystal glow
    PA.pixel(ctx, x + 5, y - 12, '#aaddff');
    if (attacking) {
      PA.pixel(ctx, x + 4, y - 11, '#66bbff');
      PA.pixel(ctx, x + 6, y - 11, '#66bbff');
      PA.pixel(ctx, x + 5, y - 13, '#ffffff');
    }

    // Water aura when attacking
    if (attacking) {
      const t = (time || 0) / 150;
      for (let i = 0; i < 3; i++) {
        const angle = t + (i * Math.PI * 2) / 3;
        const r = 6;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 3 + Math.sin(angle) * r * 0.5);
        PA.pixel(ctx, px, py, 'rgba(68,136,255,0.6)');
      }
    }
  },

  renderFireMage(ctx, hero, x, y, time) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = hero.animFrame;
    const attacking = hero.attacking && hero.attackTimer > hero.type.attackCooldown * 0.7;

    // === 火法師：紅橘色長袍 + 火焰法杖 ===

    // 陰影
    PA.rect(ctx, x - 3, y + 4, 7, 1, 'rgba(0,0,0,0.25)');

    // 腳（長袍下方微露）
    if (hero.moving) {
      if (f < 2) {
        PA.pixel(ctx, x - 1, y + 3, '#3a2020');
        PA.pixel(ctx, x + 1, y + 3, '#3a2020');
      } else {
        PA.pixel(ctx, x - 2, y + 3, '#3a2020');
        PA.pixel(ctx, x + 2, y + 3, '#3a2020');
      }
    } else {
      PA.pixel(ctx, x - 1, y + 3, '#3a2020');
      PA.pixel(ctx, x + 1, y + 3, '#3a2020');
    }

    // 長袍下擺（寬大飄逸）
    PA.rect(ctx, x - 3, y + 1, 7, 2, C.HERO_FIRE_ROBE);
    PA.rect(ctx, x - 4, y + 2, 9, 1, C.HERO_FIRE_ROBE_DARK);
    // 下擺高光
    PA.pixel(ctx, x - 3, y + 2, C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, x + 3, y + 2, C.HERO_FIRE_ROBE_LIGHT);

    // 長袍上身
    PA.rect(ctx, x - 3, y - 2, 7, 3, C.HERO_FIRE_ROBE_LIGHT);
    PA.rect(ctx, x - 2, y - 3, 5, 1, C.HERO_FIRE_ROBE_LIGHT);
    // 腰帶區域
    PA.rect(ctx, x - 1, y - 1, 3, 1, '#c8a050');
    PA.pixel(ctx, x, y - 1, '#e0b860');

    // 肩膀
    PA.rect(ctx, x - 4, y - 3, 2, 2, C.HERO_FIRE_ROBE);
    PA.rect(ctx, x + 3, y - 3, 2, 2, C.HERO_FIRE_ROBE);
    // 肩膀裝飾
    PA.pixel(ctx, x - 4, y - 3, C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, x + 4, y - 3, C.HERO_FIRE_ROBE_LIGHT);

    // 手臂
    const armOffset = hero.moving ? (f % 2) : 0;
    // 左手
    PA.pixel(ctx, x - 4, y - 1 + armOffset, C.HERO_FIRE_ROBE);
    PA.pixel(ctx, x - 5, y + armOffset, C.HERO_SKIN);
    // 右手（持杖）
    PA.pixel(ctx, x + 4, y - 1 - armOffset, C.HERO_FIRE_ROBE);
    PA.pixel(ctx, x + 5, y - armOffset, C.HERO_SKIN);

    // 頭部
    PA.rect(ctx, x - 2, y - 6, 5, 3, C.HERO_SKIN);
    PA.pixel(ctx, x - 2, y - 4, '#d0b898');
    PA.pixel(ctx, x + 2, y - 4, '#d0b898');

    // 眼睛（火紅色）
    PA.pixel(ctx, x - 1, y - 5, '#ff6622');
    PA.pixel(ctx, x + 1, y - 5, '#ff6622');

    // 嘴
    PA.pixel(ctx, x, y - 4, '#c8a890');

    // 尖帽（火紅色）
    PA.rect(ctx, x - 3, y - 7, 7, 1, C.HERO_FIRE_ROBE);
    PA.rect(ctx, x - 4, y - 7, 9, 1, C.HERO_FIRE_ROBE_DARK);
    PA.rect(ctx, x - 2, y - 8, 5, 1, C.HERO_FIRE_ROBE_LIGHT);
    PA.rect(ctx, x - 1, y - 9, 3, 1, C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, x, y - 10, C.HERO_FIRE_ROBE_LIGHT);
    PA.pixel(ctx, x, y - 11, '#ff6622');
    // 帽尖火焰閃爍
    const sparkle = Math.sin((time || 0) / 150) > 0.3;
    if (sparkle) {
      PA.pixel(ctx, x, y - 12, '#ffaa44');
      PA.pixel(ctx, x + 1, y - 11, '#ff6622');
    }

    // 法杖（右側）
    PA.rect(ctx, x + 5, y - 8, 1, 10, '#6b5010');
    PA.pixel(ctx, x + 5, y - 9, '#5a4010');
    // 法杖頂端：火焰水晶
    PA.pixel(ctx, x + 5, y - 10, '#ff6622');
    PA.pixel(ctx, x + 4, y - 10, '#ffaa44');
    PA.pixel(ctx, x + 6, y - 10, '#ffaa44');
    PA.pixel(ctx, x + 5, y - 11, '#ff8833');
    // 水晶光暈
    PA.pixel(ctx, x + 5, y - 12, '#ffcc66');
    if (attacking) {
      PA.pixel(ctx, x + 4, y - 11, '#ff6622');
      PA.pixel(ctx, x + 6, y - 11, '#ff6622');
      PA.pixel(ctx, x + 5, y - 13, '#ffffff');
    }

    // 攻擊時：手臂上方火球準備動畫
    if (attacking) {
      const t = (time || 0) / 120;
      // 火球在左手上方
      PA.pixel(ctx, x - 4, y - 4, '#ff6622');
      PA.pixel(ctx, x - 5, y - 4, '#ffaa44');
      PA.pixel(ctx, x - 4, y - 5, '#ffcc66');
      // 火焰光環
      for (let i = 0; i < 3; i++) {
        const angle = t + (i * Math.PI * 2) / 3;
        const r = 5;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 3 + Math.sin(angle) * r * 0.5);
        PA.pixel(ctx, px, py, 'rgba(255,102,34,0.6)');
      }
    }
  },

  renderIceMage(ctx, hero, x, y, time) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = hero.animFrame;
    const attacking = hero.attacking && hero.attackTimer > hero.type.attackCooldown * 0.7;

    // === 冰法師：淺藍白色長袍 + 冰晶法杖 ===

    // 陰影
    PA.rect(ctx, x - 3, y + 4, 7, 1, 'rgba(0,0,0,0.25)');

    // 腳
    if (hero.moving) {
      if (f < 2) {
        PA.pixel(ctx, x - 1, y + 3, '#2a3040');
        PA.pixel(ctx, x + 1, y + 3, '#2a3040');
      } else {
        PA.pixel(ctx, x - 2, y + 3, '#2a3040');
        PA.pixel(ctx, x + 2, y + 3, '#2a3040');
      }
    } else {
      PA.pixel(ctx, x - 1, y + 3, '#2a3040');
      PA.pixel(ctx, x + 1, y + 3, '#2a3040');
    }

    // 長袍下擺
    PA.rect(ctx, x - 3, y + 1, 7, 2, C.HERO_ICE_ROBE);
    PA.rect(ctx, x - 4, y + 2, 9, 1, C.HERO_ICE_ROBE_DARK);
    PA.pixel(ctx, x - 3, y + 2, C.HERO_ICE_ROBE_LIGHT);
    PA.pixel(ctx, x + 3, y + 2, C.HERO_ICE_ROBE_LIGHT);

    // 長袍上身
    PA.rect(ctx, x - 3, y - 2, 7, 3, C.HERO_ICE_ROBE_LIGHT);
    PA.rect(ctx, x - 2, y - 3, 5, 1, C.HERO_ICE_ROBE_LIGHT);
    // 腰帶
    PA.rect(ctx, x - 1, y - 1, 3, 1, '#8090a0');
    PA.pixel(ctx, x, y - 1, '#a0b0c0');

    // 肩膀
    PA.rect(ctx, x - 4, y - 3, 2, 2, C.HERO_ICE_ROBE);
    PA.rect(ctx, x + 3, y - 3, 2, 2, C.HERO_ICE_ROBE);
    PA.pixel(ctx, x - 4, y - 3, C.HERO_ICE_ROBE_LIGHT);
    PA.pixel(ctx, x + 4, y - 3, C.HERO_ICE_ROBE_LIGHT);

    // 手臂
    const armOffset = hero.moving ? (f % 2) : 0;
    PA.pixel(ctx, x - 4, y - 1 + armOffset, C.HERO_ICE_ROBE);
    PA.pixel(ctx, x - 5, y + armOffset, C.HERO_SKIN);
    PA.pixel(ctx, x + 4, y - 1 - armOffset, C.HERO_ICE_ROBE);
    PA.pixel(ctx, x + 5, y - armOffset, C.HERO_SKIN);

    // 頭部
    PA.rect(ctx, x - 2, y - 6, 5, 3, C.HERO_SKIN);
    PA.pixel(ctx, x - 2, y - 4, '#d0b898');
    PA.pixel(ctx, x + 2, y - 4, '#d0b898');

    // 眼睛（冰藍色）
    PA.pixel(ctx, x - 1, y - 5, '#88ccff');
    PA.pixel(ctx, x + 1, y - 5, '#88ccff');

    // 嘴
    PA.pixel(ctx, x, y - 4, '#c8a890');

    // 尖帽（淡藍色）
    PA.rect(ctx, x - 3, y - 7, 7, 1, C.HERO_ICE_ROBE);
    PA.rect(ctx, x - 4, y - 7, 9, 1, C.HERO_ICE_ROBE_DARK);
    PA.rect(ctx, x - 2, y - 8, 5, 1, C.HERO_ICE_ROBE_LIGHT);
    PA.rect(ctx, x - 1, y - 9, 3, 1, C.HERO_ICE_ROBE_LIGHT);
    PA.pixel(ctx, x, y - 10, C.HERO_ICE_ROBE_LIGHT);
    PA.pixel(ctx, x, y - 11, '#88ccff');
    // 帽尖冰晶閃爍
    const sparkle = Math.sin((time || 0) / 250) > 0.4;
    if (sparkle) {
      PA.pixel(ctx, x, y - 12, '#aaddff');
      PA.pixel(ctx, x + 1, y - 11, '#88ccff');
    }

    // 法杖（右側）
    PA.rect(ctx, x + 5, y - 8, 1, 10, '#6b5010');
    PA.pixel(ctx, x + 5, y - 9, '#5a4010');
    // 法杖頂端：冰晶
    PA.pixel(ctx, x + 5, y - 10, '#88ccff');
    PA.pixel(ctx, x + 4, y - 10, '#aaddff');
    PA.pixel(ctx, x + 6, y - 10, '#aaddff');
    PA.pixel(ctx, x + 5, y - 11, '#bbddff');
    // 冰晶光暈
    PA.pixel(ctx, x + 5, y - 12, '#ddeeff');
    if (attacking) {
      PA.pixel(ctx, x + 4, y - 11, '#88ccff');
      PA.pixel(ctx, x + 6, y - 11, '#88ccff');
      PA.pixel(ctx, x + 5, y - 13, '#ffffff');
    }

    // 攻擊時：冰霜射線準備動畫
    if (attacking) {
      const t = (time || 0) / 180;
      // 冰霜能量在左手上方
      PA.pixel(ctx, x - 4, y - 4, '#88ccff');
      PA.pixel(ctx, x - 5, y - 4, '#aaddff');
      PA.pixel(ctx, x - 4, y - 5, '#ddeeff');
      // 冰晶光環
      for (let i = 0; i < 3; i++) {
        const angle = t + (i * Math.PI * 2) / 3;
        const r = 5;
        const px = Math.round(x + Math.cos(angle) * r);
        const py = Math.round(y - 3 + Math.sin(angle) * r * 0.5);
        PA.pixel(ctx, px, py, 'rgba(136,204,255,0.6)');
      }
    }
  },

  renderSelectionRing(ctx, x, y, time, colorPrefix) {
    const PA = DK.PixelArt;
    const t = (time || 0) / 300;
    const pulse = Math.sin(t) * 0.3 + 0.7;

    // Pulsing selection ring (diamond shape at feet)
    const prefix = colorPrefix || 'rgba(68,255,68,';
    const color = `${prefix}${pulse})`;
    PA.pixel(ctx, x, y + 5, color);
    PA.pixel(ctx, x - 3, y + 3, color);
    PA.pixel(ctx, x + 3, y + 3, color);
    PA.pixel(ctx, x - 4, y + 1, color);
    PA.pixel(ctx, x + 4, y + 1, color);
    PA.pixel(ctx, x - 3, y - 1, color);
    PA.pixel(ctx, x + 3, y - 1, color);
  },

  renderRange(ctx, hero) {
    const T = DK.CONFIG.TILE_SIZE;
    const range = hero.type.range * T;
    // 根據元素類型選擇範圍指示顏色
    const rangeColorMap = {
      water: 'rgba(68,136,255,0.3)',
      fire: 'rgba(255,102,34,0.3)',
      ice: 'rgba(136,204,255,0.3)',
    };
    ctx.strokeStyle = rangeColorMap[hero.type.element] || 'rgba(68,136,255,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(hero.x, hero.y, range, 0, Math.PI * 2);
    ctx.stroke();
  },

  renderAura(ctx, hero, x, y, time) {
    const auraRange = hero.type.auraRange;
    if (!auraRange || auraRange <= 0) return;

    const T = DK.CONFIG.TILE_SIZE;
    const radius = auraRange * T;
    const t = (time || 0) / 1000;
    const pulse = 0.6 + Math.sin(t * 2) * 0.15;

    // 根據英雄元素選擇光環顏色
    const auraColors = {
      water: `rgba(68,136,255,${0.08 * pulse})`,
      fire: `rgba(255,102,34,${0.08 * pulse})`,
      ice: `rgba(136,204,255,${0.08 * pulse})`,
    };
    const borderColors = {
      water: `rgba(68,136,255,${0.2 * pulse})`,
      fire: `rgba(255,102,34,${0.2 * pulse})`,
      ice: `rgba(136,204,255,${0.2 * pulse})`,
    };

    const fillColor = auraColors[hero.type.element] || auraColors.water;
    const strokeColor = borderColors[hero.type.element] || borderColors.water;

    // 半透明圓圈（脈動呼吸效果）
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // 邊緣虛線圓
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};
