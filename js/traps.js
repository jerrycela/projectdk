/**
 * Dungeon Keep - Trap System
 * Handles trap placement, rendering, and behavior
 */
window.DK = window.DK || {};

DK.Traps = {
  placed: [], // { type, col, row, facing, cooldownTimer, animFrame }

  init() {
    this.placed = [];
  },

  place(trapTypeId, col, row) {
    const typeDef = Object.values(DK.TRAP_TYPES).find(t => t.id === trapTypeId);
    if (!typeDef) return false;

    // Check if already occupied
    if (this.placed.some(t => t.col === col && t.row === row)) return false;

    const trap = {
      type: typeDef,
      col,
      row,
      facing: typeDef.type === 'wall' ? DK.Map.getWallFacing(col, row) : null,
      cooldownTimer: (typeDef.id === 'push_trap' || typeDef.id === 'wind_trap') ? typeDef.cooldown : 0,
      animFrame: 0,
      animTimer: 0,
      active: false,
      evolved: false,
      evolutionType: null,
    };

    this.placed.push(trap);
    return true;
  },

  update(dt, enemies) {
    const T = DK.CONFIG.TILE_SIZE;

    for (const trap of this.placed) {
      trap.animTimer += dt;
      if (trap.animTimer > 200) {
        trap.animFrame = (trap.animFrame + 1) % 4;
        trap.animTimer = 0;
      }

      // Push trap: auto-fire on timer (independent of enemies)
      if (trap.type.id === 'push_trap') {
        if (trap.cooldownTimer > 0) {
          trap.cooldownTimer -= dt;
          trap.active = false;
        }
        if (trap.cooldownTimer <= 0) {
          trap.cooldownTimer = trap.type.cooldown;
          trap.active = true;
          this.firePushTrap(trap, enemies, T);
        }
        continue;
      }

      // 風壓陷阱：定時觸發，推動敵人 + 冰凍印記反應
      if (trap.type.id === 'wind_trap') {
        if (trap.cooldownTimer > 0) {
          trap.cooldownTimer -= dt;
          trap.active = false;
        }
        if (trap.cooldownTimer <= 0) {
          trap.cooldownTimer = trap.type.cooldown;
          trap.active = true;
          this.fireWindTrap(trap, enemies, T);
        }
        continue;
      }

      if (trap.cooldownTimer > 0) {
        trap.cooldownTimer -= dt;
        continue;
      }

      const trapCX = trap.col * T + T / 2;
      const trapCY = trap.row * T + T / 2;

      if (trap.type.type === 'wall') {
        // Wall traps: attack enemies in range
        const range = trap.type.range * T;
        let target = null;
        let bestDist = range;

        for (const enemy of enemies) {
          if (enemy.hp <= 0) continue;
          const dx = enemy.x - trapCX;
          const dy = enemy.y - trapCY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < bestDist) {
            bestDist = dist;
            target = enemy;
          }
        }

        if (target) {
          trap.active = true;
          trap.cooldownTimer = trap.type.cooldown;

          // Deal damage
          target.hp -= trap.type.damage;
          target.flashTimer = 150; // Visual hit feedback

          // Create projectile effect
          if (DK.Game && DK.Game.effects) {
            DK.Game.effects.push({
              type: 'projectile',
              x: trapCX + (trap.facing ? trap.facing.dc * T / 2 : 0),
              y: trapCY + (trap.facing ? trap.facing.dr * T / 2 : 0),
              targetX: target.x,
              targetY: target.y,
              color: DK.COLORS.TRAP_METAL_LIGHT,
              duration: 300,
              timer: 0,
              trapType: trap.type.id,
            });
          }
        } else {
          trap.active = false;
        }
      } else {
        // Floor traps: affect enemies standing on them
        for (const enemy of enemies) {
          if (enemy.hp <= 0) continue;
          const ex = Math.floor(enemy.x / T);
          const ey = Math.floor(enemy.y / T);

          if (ex === trap.col && ey === trap.row) {
            trap.active = true;
            trap.cooldownTimer = trap.type.cooldown;

            if (trap.type.damage > 0) {
              enemy.hp -= trap.type.damage;
              enemy.flashTimer = 150; // Visual hit feedback
              // Damage number
              if (DK.Game && DK.Game.effects) {
                DK.Game.effects.push({
                  type: 'damage',
                  x: enemy.x,
                  y: enemy.y - 8,
                  text: `-${trap.type.damage}`,
                  color: trap.type.element === 'electric' ? DK.COLORS.TRAP_ELECTRIC : DK.COLORS.DAMAGE_TEXT,
                  duration: 800,
                  timer: 0,
                });
              }
            }

            // Apply element if trap has one (blast_trap handles its own applyElement manually)
            if (trap.type.element && DK.Elements && trap.type.id !== 'blast_trap') {
              DK.Elements.applyElement(enemy, trap.type.element, { evolved: trap.evolved, evolutionType: trap.evolutionType });
            }

            // shock_plate 進化態增強
            if (trap.type.id === 'shock_plate' && trap.evolved) {
              // 進化態的感電效果由 elements.js 透過 source 物件處理
            }

            // 爆破陷阱：踩到時爆炸，灼印敵人觸發烈焰引爆
            if (trap.type.id === 'blast_trap' && DK.Game && DK.Game.effects) {
              const hasBurning = DK.Elements && DK.Elements.hasStatus(enemy, 'burning');
              let blastDamage = trap.type.damage; // 40
              let blastRange = trap.type.range;   // 1.5

              // 進化態增強：範圍 +30%
              const evo = trap.evolved ? DK.EVOLUTION_TYPES[trap.evolutionType] : null;
              if (evo) {
                blastRange *= (1 + (evo.rangeBonus || 0));
              }

              if (hasBurning) {
                // 烈焰引爆：消耗灼印，增強傷害與範圍
                DK.Elements.removeStatus(enemy, 'burning');
                blastDamage = Math.round(blastDamage * 1.5); // 60
                blastRange = blastRange * 1.3;

                // 烈焰引爆特效
                DK.Game.effects.push({
                  type: 'blaze_explosion',
                  x: trap.col * T + T / 2,
                  y: trap.row * T + T / 2,
                  radius: blastRange * T,
                  duration: 600,
                  timer: 0,
                });

                // 反應文字
                DK.Game.effects.push({
                  type: 'reaction_text',
                  x: enemy.x,
                  y: enemy.y - 14,
                  text: '烈焰引爆！',
                  color: '#ff4400',
                  duration: 1000,
                  timer: 0,
                });

                // 螢幕震動
                DK.Game.screenShake = { intensity: 4, timer: 300 };

                // AoE 傷害 + 擊退（烈焰引爆：無條件擊退）
                this.applyBlastAoE(enemies, enemy, trap, T, blastDamage, blastRange, evo, true);
              } else {
                // 普通爆炸
                DK.Game.effects.push({
                  type: 'explosion',
                  x: trap.col * T + T / 2,
                  y: trap.row * T + T / 2,
                  radius: blastRange * T,
                  duration: 500,
                  timer: 0,
                });

                // AoE 傷害（普通爆炸：僅進化態擊退）
                this.applyBlastAoE(enemies, enemy, trap, T, blastDamage, blastRange, evo, false);
              }

              // 附著灼印給命中的敵人
              if (DK.Elements) {
                DK.Elements.applyElement(enemy, 'fire');
              }
            }
            break;
          }
        }
      }
    }
  },

  render(ctx) {
    const T = DK.CONFIG.TILE_SIZE;
    const PA = DK.PixelArt;
    const C = DK.COLORS;

    for (const trap of this.placed) {
      const x = trap.col * T;
      const y = trap.row * T;

      if (trap.type.type === 'wall') {
        this.renderWallTrap(ctx, trap, x, y);
      } else {
        this.renderFloorTrap(ctx, trap, x, y);
      }

      // 可進化金色閃爍邊框 / 已進化淡金色邊框
      if (!trap.evolved) {
        const auraHero = this.getAuraHeroForTrap(trap);
        if (auraHero) {
          const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.5;
          ctx.strokeStyle = `rgba(255,215,0,${pulse})`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x + 0.5, y + 0.5, DK.CONFIG.TILE_SIZE - 1, DK.CONFIG.TILE_SIZE - 1);
        }
      } else {
        ctx.strokeStyle = 'rgba(255,215,0,0.4)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x + 0.5, y + 0.5, DK.CONFIG.TILE_SIZE - 1, DK.CONFIG.TILE_SIZE - 1);
      }
    }
  },

  renderWallTrap(ctx, trap, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = trap.facing || { dc: 0, dr: 1 };
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;

    if (trap.type.id === 'push_trap') {
      // === PUSH TRAP: Mechanical piston ram mounted on wall ===
      const chargeProgress = 1 - (trap.cooldownTimer / trap.type.cooldown);
      const isCharging = chargeProgress > 0.7;
      const justFired = trap.active && trap.cooldownTimer > trap.type.cooldown * 0.85;

      // Wall mounting plate
      PA.rect(ctx, x + 2, y + 1, 12, 14, C.TRAP_METAL_DARK);
      PA.rect(ctx, x + 3, y + 2, 10, 12, C.TRAP_PUSH_HOUSING);

      // Mounting bolts
      PA.pixel(ctx, x + 2, y + 1, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 13, y + 1, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 2, y + 14, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 13, y + 14, C.TRAP_METAL_LIGHT);

      // Internal mechanism (spring coils)
      PA.rect(ctx, x + 5, y + 3, 6, 3, '#4a4050');
      PA.pixel(ctx, x + 6, y + 3, '#6a6070');
      PA.pixel(ctx, x + 8, y + 3, '#6a6070');
      PA.pixel(ctx, x + 10, y + 3, '#6a6070');
      // Spring lines
      PA.pixel(ctx, x + 5, y + 4, '#7a7080');
      PA.pixel(ctx, x + 7, y + 4, '#7a7080');
      PA.pixel(ctx, x + 9, y + 4, '#7a7080');

      // Piston ram
      if (justFired) {
        // Extended position
        PA.rect(ctx, x + 4, y + 6, 8, 3, C.TRAP_PUSH_PISTON);
        PA.rect(ctx, x + 5, y + 9, 6, 4, C.TRAP_METAL);
        PA.rect(ctx, x + 6, y + 13, 4, 3, C.TRAP_METAL_LIGHT);
        // Ram face
        PA.rect(ctx, x + 4, y + 14, 8, 2, '#aaa0b0');
        PA.rect(ctx, x + 4, y + 14, 8, 1, '#bbb0c0');
      } else {
        // Retracted position
        PA.rect(ctx, x + 4, y + 6, 8, 3, C.TRAP_PUSH_PISTON);
        PA.rect(ctx, x + 5, y + 9, 6, 3, C.TRAP_METAL);
        // Ram face (retracted)
        PA.rect(ctx, x + 4, y + 11, 8, 2, '#aaa0b0');
        PA.rect(ctx, x + 4, y + 11, 8, 1, '#bbb0c0');
      }

      // Charge indicator (glowing orb)
      if (chargeProgress > 0.3) {
        const glow = (chargeProgress - 0.3) / 0.7;
        const r = Math.round(glow * 255);
        const g = Math.round((1 - glow * 0.5) * 100);
        const color = `rgb(${r},${g},0)`;
        PA.pixel(ctx, x + 7, y + 7, color);
        PA.pixel(ctx, x + 8, y + 7, color);
        if (isCharging) {
          PA.pixel(ctx, x + 6, y + 7, C.TRAP_PUSH_CHARGE);
          PA.pixel(ctx, x + 9, y + 7, C.TRAP_PUSH_CHARGE);
          // Warning flash
          if (trap.animFrame % 2 === 0) {
            PA.pixel(ctx, x + 7, y + 6, '#ffffff');
            PA.pixel(ctx, x + 8, y + 6, '#ffffff');
          }
        }
      }

      // Direction arrow indicator
      if (f) {
        const arrowX = x + 7 + f.dc * 6;
        const arrowY = y + 7 + f.dr * 6;
        PA.pixel(ctx, arrowX, arrowY, '#ff8844');
        PA.pixel(ctx, arrowX + 1, arrowY, '#ff8844');
        PA.pixel(ctx, arrowX, arrowY + f.dr, '#ffaa66');
      }

    } else if (trap.type.id === 'wind_trap') {
      // === WIND TRAP: 風壓裝置，藍灰色金屬外殼搭配風扇 ===
      const chargeProgress = 1 - (trap.cooldownTimer / trap.type.cooldown);
      const isCharging = chargeProgress > 0.7;
      const justFired = trap.active && trap.cooldownTimer > trap.type.cooldown * 0.85;

      // 金屬外殼（藍灰色）
      PA.rect(ctx, x + 2, y + 1, 12, 14, C.TRAP_WIND_HOUSING);
      PA.rect(ctx, x + 3, y + 2, 10, 12, '#334455');

      // 安裝螺栓
      PA.pixel(ctx, x + 2, y + 1, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 13, y + 1, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 2, y + 14, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 13, y + 14, C.TRAP_METAL_LIGHT);

      // 風扇艙室（圓形區域）
      PA.rect(ctx, x + 4, y + 3, 8, 8, '#1a2030');

      // 風扇葉片（根據 animFrame 旋轉）
      const frame = trap.animFrame;
      const fanColor = isCharging ? C.TRAP_WIND_GLOW : C.TRAP_WIND_FAN;
      const fanSpeed = justFired ? 1 : 0;

      const fanFrame = (frame + fanSpeed) % 4;
      if (fanFrame === 0 || fanFrame === 2) {
        // 十字形位置
        PA.rect(ctx, x + 7, y + 3, 2, 3, fanColor);
        PA.rect(ctx, x + 7, y + 8, 2, 3, fanColor);
        PA.rect(ctx, x + 4, y + 6, 3, 2, fanColor);
        PA.rect(ctx, x + 9, y + 6, 3, 2, fanColor);
      } else {
        // X 形位置
        PA.pixel(ctx, x + 5, y + 4, fanColor);
        PA.pixel(ctx, x + 6, y + 5, fanColor);
        PA.pixel(ctx, x + 10, y + 4, fanColor);
        PA.pixel(ctx, x + 9, y + 5, fanColor);
        PA.pixel(ctx, x + 5, y + 9, fanColor);
        PA.pixel(ctx, x + 6, y + 8, fanColor);
        PA.pixel(ctx, x + 10, y + 9, fanColor);
        PA.pixel(ctx, x + 9, y + 8, fanColor);
      }

      // 風扇中心軸
      PA.pixel(ctx, x + 7, y + 6, C.TRAP_METAL);
      PA.pixel(ctx, x + 8, y + 7, C.TRAP_METAL);
      PA.pixel(ctx, x + 7, y + 7, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 8, y + 6, C.TRAP_METAL_LIGHT);

      // 出風口（底部開口）
      PA.rect(ctx, x + 5, y + 11, 6, 2, '#1a2030');
      PA.rect(ctx, x + 6, y + 12, 4, 2, '#0a1020');

      // 充能發光效果
      if (isCharging) {
        PA.pixel(ctx, x + 6, y + 5, C.TRAP_WIND_GLOW);
        PA.pixel(ctx, x + 9, y + 5, C.TRAP_WIND_GLOW);
        PA.pixel(ctx, x + 6, y + 8, C.TRAP_WIND_GLOW);
        PA.pixel(ctx, x + 9, y + 8, C.TRAP_WIND_GLOW);
        if (frame % 2 === 0) {
          PA.pixel(ctx, x + 7, y + 4, '#ffffff');
          PA.pixel(ctx, x + 8, y + 4, '#ffffff');
        }
      }

      // 發射時風壓波效果
      if (justFired) {
        PA.pixel(ctx, x + 7, y + 13, C.TRAP_WIND_GLOW);
        PA.pixel(ctx, x + 8, y + 13, C.TRAP_WIND_GLOW);
        PA.pixel(ctx, x + 6, y + 14, '#88bbdd');
        PA.pixel(ctx, x + 9, y + 14, '#88bbdd');
        PA.pixel(ctx, x + 7, y + 14, C.TRAP_WIND_GLOW);
        PA.pixel(ctx, x + 8, y + 14, C.TRAP_WIND_GLOW);
      }

      // 方向指示
      if (f) {
        const arrowX = x + 7 + f.dc * 6;
        const arrowY = y + 7 + f.dr * 6;
        PA.pixel(ctx, arrowX, arrowY, '#88bbdd');
        PA.pixel(ctx, arrowX + 1, arrowY, '#88bbdd');
      }
    }
  },

  renderFloorTrap(ctx, trap, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;

    if (trap.type.id === 'shock_plate') {
      // === SHOCK PLATE: Metal plate with lightning rune ===

      // Base plate (flush with floor)
      PA.rect(ctx, x + 1, y + 1, 14, 14, C.TRAP_ELECTRIC_PLATE);
      PA.rect(ctx, x + 2, y + 2, 12, 12, '#555568');

      // Plate border rivets
      PA.pixel(ctx, x + 1, y + 1, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 14, y + 1, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 1, y + 14, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 14, y + 14, C.TRAP_METAL_LIGHT);

      // Lightning bolt rune (center)
      PA.pixel(ctx, x + 8, y + 3, C.TRAP_ELECTRIC);
      PA.pixel(ctx, x + 7, y + 4, C.TRAP_ELECTRIC);
      PA.pixel(ctx, x + 6, y + 5, C.TRAP_ELECTRIC);
      PA.rect(ctx, x + 6, y + 6, 4, 1, C.TRAP_ELECTRIC);
      PA.pixel(ctx, x + 9, y + 7, C.TRAP_ELECTRIC);
      PA.pixel(ctx, x + 8, y + 8, C.TRAP_ELECTRIC);
      PA.pixel(ctx, x + 7, y + 9, C.TRAP_ELECTRIC);
      PA.rect(ctx, x + 5, y + 10, 4, 1, C.TRAP_ELECTRIC);
      PA.pixel(ctx, x + 8, y + 11, C.TRAP_ELECTRIC);
      PA.pixel(ctx, x + 7, y + 12, C.TRAP_ELECTRIC);

      // Rune glow
      PA.pixel(ctx, x + 7, y + 5, C.TRAP_ELECTRIC_LIGHT);
      PA.pixel(ctx, x + 8, y + 9, C.TRAP_ELECTRIC_LIGHT);

      // Edge glow lines (etched grooves)
      PA.rect(ctx, x + 2, y + 2, 12, 1, '#3a3a4a');
      PA.rect(ctx, x + 2, y + 2, 1, 12, '#3a3a4a');
      PA.rect(ctx, x + 2, y + 13, 12, 1, '#606070');
      PA.rect(ctx, x + 13, y + 2, 1, 12, '#606070');

      // Active sparking
      if (firing) {
        const frame = trap.animFrame;
        // Sparks at corners
        if (frame === 0 || frame === 2) {
          PA.pixel(ctx, x + 3, y + 3, '#ffffff');
          PA.pixel(ctx, x + 12, y + 12, '#ffffff');
          PA.pixel(ctx, x + 4, y + 4, C.TRAP_ELECTRIC_LIGHT);
        }
        if (frame === 1 || frame === 3) {
          PA.pixel(ctx, x + 12, y + 3, '#ffffff');
          PA.pixel(ctx, x + 3, y + 12, '#ffffff');
          PA.pixel(ctx, x + 11, y + 4, C.TRAP_ELECTRIC_LIGHT);
        }
        // Center glow intensified
        PA.pixel(ctx, x + 7, y + 7, '#ffffff');
        PA.pixel(ctx, x + 8, y + 8, '#ffffff');
      }

      // 進化態增強視覺：邊角額外電弧像素
      if (trap.evolved) {
        PA.pixel(ctx, x + 2, y + 2, '#ffff88');
        PA.pixel(ctx, x + 3, y + 2, '#ffffff');
        PA.pixel(ctx, x + 2, y + 3, '#ffffff');
        PA.pixel(ctx, x + 13, y + 2, '#ffff88');
        PA.pixel(ctx, x + 12, y + 2, '#ffffff');
        PA.pixel(ctx, x + 13, y + 3, '#ffffff');
        PA.pixel(ctx, x + 2, y + 13, '#ffff88');
        PA.pixel(ctx, x + 3, y + 13, '#ffffff');
        PA.pixel(ctx, x + 2, y + 12, '#ffffff');
        PA.pixel(ctx, x + 13, y + 13, '#ffff88');
        PA.pixel(ctx, x + 12, y + 13, '#ffffff');
        PA.pixel(ctx, x + 13, y + 12, '#ffffff');
      }

    } else if (trap.type.id === 'blast_trap') {
      // === BLAST TRAP: 地板嵌入式爆破裝置，火焰紋路 ===

      // 嵌入式底座（略低於地面）
      PA.rect(ctx, x + 2, y + 2, 12, 12, '#3a2818');
      PA.rect(ctx, x + 3, y + 3, 10, 10, '#2a1a10');

      // 金屬外殼帶火焰紋路
      PA.rect(ctx, x + 4, y + 4, 8, 8, C.TRAP_BLAST_BODY);
      PA.rect(ctx, x + 5, y + 5, 6, 6, '#4a2818');

      // 火焰紋路裝飾
      PA.pixel(ctx, x + 4, y + 5, '#6a3a1a');
      PA.pixel(ctx, x + 5, y + 4, '#6a3a1a');
      PA.pixel(ctx, x + 11, y + 5, '#6a3a1a');
      PA.pixel(ctx, x + 10, y + 4, '#6a3a1a');
      PA.pixel(ctx, x + 4, y + 10, '#6a3a1a');
      PA.pixel(ctx, x + 11, y + 10, '#6a3a1a');

      // 中央火焰核心
      PA.rect(ctx, x + 6, y + 6, 4, 4, C.TRAP_BLAST_CORE);
      PA.rect(ctx, x + 7, y + 7, 2, 2, '#cc5533');

      // 核心高光
      PA.pixel(ctx, x + 7, y + 7, '#dd6644');
      PA.pixel(ctx, x + 8, y + 8, '#993322');

      // 引信（從核心延伸）
      PA.pixel(ctx, x + 10, y + 4, C.TRAP_BLAST_FUSE);
      PA.pixel(ctx, x + 11, y + 3, C.TRAP_BLAST_FUSE);
      PA.pixel(ctx, x + 12, y + 3, C.TRAP_BLAST_FUSE);

      // 引信火花
      const frame = trap.animFrame;
      if (frame === 0 || frame === 2) {
        PA.pixel(ctx, x + 13, y + 2, '#ffaa33');
        PA.pixel(ctx, x + 12, y + 2, '#ff8822');
      } else {
        PA.pixel(ctx, x + 13, y + 3, '#ff6611');
        PA.pixel(ctx, x + 13, y + 2, '#ffcc44');
      }

      // 閒置時微弱脈動光
      if (!firing) {
        const pulseFrame = frame % 4;
        if (pulseFrame < 2) {
          PA.pixel(ctx, x + 7, y + 6, C.TRAP_BLAST_GLOW);
          PA.pixel(ctx, x + 8, y + 6, C.TRAP_BLAST_GLOW);
        }
      } else {
        // 觸發時爆炸閃光
        PA.pixel(ctx, x + 6, y + 5, '#ffffff');
        PA.pixel(ctx, x + 9, y + 5, '#ffffff');
        PA.pixel(ctx, x + 6, y + 10, '#ffaa33');
        PA.pixel(ctx, x + 9, y + 10, '#ffaa33');
        PA.pixel(ctx, x + 7, y + 6, '#ffffff');
        PA.pixel(ctx, x + 8, y + 6, '#ffffff');
      }

      // 角落固定螺栓
      PA.pixel(ctx, x + 2, y + 2, C.TRAP_METAL);
      PA.pixel(ctx, x + 13, y + 2, C.TRAP_METAL);
      PA.pixel(ctx, x + 2, y + 13, C.TRAP_METAL);
      PA.pixel(ctx, x + 13, y + 13, C.TRAP_METAL);

      // 邊緣高光
      PA.rect(ctx, x + 2, y + 2, 12, 1, '#4a3020');
      PA.rect(ctx, x + 2, y + 2, 1, 12, '#4a3020');

      // 進化態增強視覺：核心更亮、衝擊波紋路
      if (trap.evolved) {
        // 核心顏色更亮
        PA.rect(ctx, x + 6, y + 6, 4, 4, '#dd6644');
        PA.rect(ctx, x + 7, y + 7, 2, 2, '#ff8855');
        PA.pixel(ctx, x + 7, y + 7, '#ffaa77');
        // 衝擊波紋路（十字放射）
        PA.pixel(ctx, x + 3, y + 7, '#ff6633');
        PA.pixel(ctx, x + 3, y + 8, '#ff6633');
        PA.pixel(ctx, x + 12, y + 7, '#ff6633');
        PA.pixel(ctx, x + 12, y + 8, '#ff6633');
        PA.pixel(ctx, x + 7, y + 3, '#ff6633');
        PA.pixel(ctx, x + 8, y + 3, '#ff6633');
        PA.pixel(ctx, x + 7, y + 12, '#ff6633');
        PA.pixel(ctx, x + 8, y + 12, '#ff6633');
      }
    }
  },

  /**
   * Fire push trap: push all enemies on the facing tile
   */
  firePushTrap(trap, enemies, T) {
    const facing = trap.facing;
    if (!facing) return;

    const pathCol = trap.col + facing.dc;
    const pathRow = trap.row + facing.dr;
    let pushedAny = false;

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.hp <= 0 || enemy.pushed) continue;

      const ex = Math.floor(enemy.x / T);
      const ey = Math.floor(enemy.y / T);

      if (ex === pathCol && ey === pathRow) {
        const mass = enemy.type.mass || 1;
        const pushForce = trap.type.pushForce || 2;

        if (pushForce >= mass) {
          // Can push!
          const targetCol = pathCol + facing.dc;
          const targetRow = pathRow + facing.dr;
          const isAbyss = DK.Map.isAbyss(targetCol, targetRow);
          const isPath = DK.Map.isPath(targetCol, targetRow);

          if (isAbyss || isPath) {
            enemy.pushed = {
              startX: enemy.x,
              startY: enemy.y,
              targetX: targetCol * T + T / 2,
              targetY: targetRow * T + T / 2,
              timer: 0,
              duration: 300,
              intoAbyss: isAbyss,
            };
            pushedAny = true;
          }
          // If target is wall/out-of-bounds, enemy stays put
        } else {
          // Can't push - resist animation
          enemy.pushResistTimer = 300;

          if (DK.Game && DK.Game.effects) {
            DK.Game.effects.push({
              type: 'reaction_text',
              x: enemy.x,
              y: enemy.y - 14,
              text: '抵抗！',
              color: '#ff8844',
              duration: 800,
              timer: 0,
            });
          }
        }
      }
    }

    // Push wave visual effect
    if (DK.Game && DK.Game.effects) {
      DK.Game.effects.push({
        type: 'push_wave',
        x: (trap.col + facing.dc * 0.5) * T + T / 2,
        y: (trap.row + facing.dr * 0.5) * T + T / 2,
        dx: facing.dc,
        dy: facing.dr,
        duration: 400,
        timer: 0,
      });
    }

    // Screen shake
    if (pushedAny && DK.Game) {
      DK.Game.screenShake = { intensity: 2, timer: 200 };
    }
  },

  /**
   * 風壓陷阱：推動敵人 + 冰凍印記反應
   */
  fireWindTrap(trap, enemies, T) {
    const facing = trap.facing;
    if (!facing) return;

    const evo = trap.evolved ? DK.EVOLUTION_TYPES[trap.evolutionType] : null;
    const pathCol = trap.col + facing.dc;
    const pathRow = trap.row + facing.dr;
    let pushedAny = false;

    for (const enemy of enemies) {
      if (!enemy.alive || enemy.hp <= 0 || enemy.pushed) continue;

      const ex = Math.floor(enemy.x / T);
      const ey = Math.floor(enemy.y / T);

      if (ex === pathCol && ey === pathRow) {
        const mass = enemy.type.mass || 1;
        // 進化態：pushForce 加上 pushMassBonus
        const pushForce = (trap.type.pushForce || 1) + (evo ? (evo.pushMassBonus || 0) : 0);

        if (pushForce >= mass) {
          const targetCol = pathCol + facing.dc;
          const targetRow = pathRow + facing.dr;
          const isAbyss = DK.Map.isAbyss(targetCol, targetRow);
          const isPath = DK.Map.isPath(targetCol, targetRow);

          if (isAbyss || isPath) {
            enemy.pushed = {
              startX: enemy.x,
              startY: enemy.y,
              targetX: targetCol * T + T / 2,
              targetY: targetRow * T + T / 2,
              timer: 0,
              duration: 300,
              intoAbyss: isAbyss,
            };
            pushedAny = true;

            // 檢查冰凍印記反應：暴風雪
            if (DK.Elements && DK.Elements.hasStatus(enemy, 'frozen_mark')) {
              DK.Elements.removeStatus(enemy, 'frozen_mark');

              // 進化態：暴風雪範圍乘以 blizzardMultiplier
              const blizzardRadius = 1.5 * T * (evo ? (evo.blizzardMultiplier || 1) : 1);
              // 進化態：減速持續時間加上 freezeBonus
              const slowDuration = 3000 + (evo ? (evo.freezeBonus || 0) : 0);

              // 暴風雪效果
              if (DK.Game && DK.Game.effects) {
                DK.Game.effects.push({
                  type: 'blizzard_zone',
                  x: enemy.x,
                  y: enemy.y,
                  radius: blizzardRadius,
                  duration: slowDuration,
                  timer: 0,
                });

                DK.Game.effects.push({
                  type: 'reaction_text',
                  x: enemy.x,
                  y: enemy.y - 14,
                  text: evo ? '極寒暴風雪！' : '暴風雪！',
                  color: '#aaddff',
                  duration: 1000,
                  timer: 0,
                });
              }

              // 範圍內敵人大幅減速
              for (const e2 of enemies) {
                if (e2.hp <= 0) continue;
                const dx = e2.x - enemy.x;
                const dy = e2.y - enemy.y;
                if (Math.sqrt(dx * dx + dy * dy) < blizzardRadius) {
                  e2.slowFactor = 0.3;
                  e2.slowTimer = slowDuration;
                }
              }
            }
          }
        } else {
          // 無法推動 - 抵抗
          enemy.pushResistTimer = 300;
          if (DK.Game && DK.Game.effects) {
            DK.Game.effects.push({
              type: 'reaction_text',
              x: enemy.x,
              y: enemy.y - 14,
              text: '抵抗！',
              color: '#ff8844',
              duration: 800,
              timer: 0,
            });
          }
        }
      }
    }

    // 風壓波視覺效果
    if (DK.Game && DK.Game.effects) {
      DK.Game.effects.push({
        type: 'push_wave',
        x: (trap.col + facing.dc * 0.5) * T + T / 2,
        y: (trap.row + facing.dr * 0.5) * T + T / 2,
        dx: facing.dc,
        dy: facing.dr,
        duration: 400,
        timer: 0,
      });
    }

    if (pushedAny && DK.Game) {
      DK.Game.screenShake = { intensity: 1, timer: 150 };
    }
  },

  /**
   * blast_trap AoE 共用邏輯：對範圍內敵人造成傷害、擊退、眩暈
   * @param {Array} enemies - 所有敵人
   * @param {Object} triggerEnemy - 觸發陷阱的敵人（排除在 AoE 之外）
   * @param {Object} trap - 陷阱物件
   * @param {number} T - TILE_SIZE
   * @param {number} damage - AoE 傷害值
   * @param {number} range - AoE 範圍（tile 單位）
   * @param {Object|null} evo - 進化態定義（若有）
   * @param {boolean} alwaysKnockback - true=無條件擊退（烈焰引爆），false=僅進化態擊退
   */
  applyBlastAoE(enemies, triggerEnemy, trap, T, damage, range, evo, alwaysKnockback) {
    const centerX = trap.col * T + T / 2;
    const centerY = trap.row * T + T / 2;
    const knockbackDist = evo ? (evo.knockbackTiles || 1) * T : T;
    const rangePixels = range * T;

    for (const e2 of enemies) {
      if (e2.hp <= 0 || e2 === triggerEnemy) continue;
      const dx = e2.x - centerX;
      const dy = e2.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= rangePixels) continue;

      e2.hp -= damage;
      e2.flashTimer = 150;

      // 擊退：烈焰引爆無條件擊退，普通爆炸僅進化態擊退
      const shouldKnockback = alwaysKnockback || !!evo;
      if (shouldKnockback && !e2.pushed && dist > 0) {
        const pushDx = dx / dist;
        const pushDy = dy / dist;
        e2.pushed = {
          startX: e2.x,
          startY: e2.y,
          targetX: e2.x + pushDx * knockbackDist,
          targetY: e2.y + pushDy * knockbackDist,
          timer: 0,
          duration: 250,
          intoAbyss: false,
        };
      }

      // 進化態眩暈
      if (evo && evo.stunDuration) {
        const ref = e2;
        ref.paralyzed = true;
        setTimeout(() => { if (ref.alive) ref.paralyzed = false; }, evo.stunDuration);
      }
    }
  },

  getTrapAt(col, row) {
    return this.placed.find(t => t.col === col && t.row === row) || null;
  },

  getAuraHeroForTrap(trap) {
    if (!DK.Heroes || !DK.Heroes.active) return null;
    const pairedElement = Object.entries(DK.AURA_PAIRS).find(([elem, trapId]) => trapId === trap.type.id);
    if (!pairedElement) return null;
    const [requiredElement] = pairedElement;

    const T = DK.CONFIG.TILE_SIZE;
    for (const hero of DK.Heroes.active) {
      const auraRange = (hero.type.auraRange || 0) * T;
      if (auraRange <= 0) continue;
      if (hero.type.element !== requiredElement) continue;
      const dx = (trap.col * T + T / 2) - hero.x;
      const dy = (trap.row * T + T / 2) - hero.y;
      if (Math.sqrt(dx * dx + dy * dy) <= auraRange) return hero;
    }
    return null;
  },

  getEvolutionForTrap(trap) {
    if (trap.evolved) return null;
    const evo = Object.entries(DK.EVOLUTION_TYPES).find(([id, def]) => def.baseTrap === trap.type.id);
    if (!evo) return null;
    return { id: evo[0], ...evo[1] };
  },

  evolveTrap(trap, evoId) {
    const evoDef = DK.EVOLUTION_TYPES[evoId];
    if (!evoDef) return;
    trap.evolved = true;
    trap.evolutionType = evoId;

    // 進化特效
    if (DK.Game && DK.Game.effects) {
      const T = DK.CONFIG.TILE_SIZE;
      DK.Game.effects.push({
        type: 'evolution_burst',
        x: trap.col * T + T / 2,
        y: trap.row * T + T / 2,
        duration: 800,
        timer: 0,
      });
      DK.Game.effects.push({
        type: 'reaction_text',
        x: trap.col * T + T / 2,
        y: trap.row * T - 4,
        text: `進化！${evoDef.name}`,
        color: '#ffd700',
        duration: 1500,
        timer: 0,
      });
      DK.Game.screenShake = { intensity: 3, timer: 300 };
    }
  },
};
