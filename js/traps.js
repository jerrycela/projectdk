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
      cooldownTimer: 0,
      animFrame: 0,
      animTimer: 0,
      active: false,
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

          // Apply slow
          if (trap.type.slowAmount) {
            target.slowFactor = trap.type.slowAmount;
            target.slowTimer = trap.type.slowDuration;
          }

          // Create projectile effect
          if (DK.Game && DK.Game.effects) {
            DK.Game.effects.push({
              type: 'projectile',
              x: trapCX + (trap.facing ? trap.facing.dc * T / 2 : 0),
              y: trapCY + (trap.facing ? trap.facing.dr * T / 2 : 0),
              targetX: target.x,
              targetY: target.y,
              color: trap.type.id === 'flame_jet' ? DK.COLORS.TRAP_FIRE :
                     trap.type.id === 'ice_trap' ? DK.COLORS.TRAP_ICE :
                     DK.COLORS.TRAP_ARROW_TIP,
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
              // Damage number
              if (DK.Game && DK.Game.effects) {
                DK.Game.effects.push({
                  type: 'damage',
                  x: enemy.x,
                  y: enemy.y - 8,
                  text: `-${trap.type.damage}`,
                  color: DK.COLORS.DAMAGE_TEXT,
                  duration: 800,
                  timer: 0,
                });
              }
            }

            if (trap.type.slowAmount) {
              enemy.slowFactor = trap.type.slowAmount;
              enemy.slowTimer = trap.type.slowDuration;
            }

            if (trap.type.id === 'bomb_trap' && DK.Game && DK.Game.effects) {
              DK.Game.effects.push({
                type: 'explosion',
                x: trap.col * T + T / 2,
                y: trap.row * T + T / 2,
                radius: trap.type.range * T,
                duration: 500,
                timer: 0,
              });

              // AoE damage
              for (const e2 of enemies) {
                if (e2.hp <= 0 || e2 === enemy) continue;
                const dx = e2.x - (trap.col * T + T / 2);
                const dy = e2.y - (trap.row * T + T / 2);
                if (Math.sqrt(dx * dx + dy * dy) < trap.type.range * T) {
                  e2.hp -= trap.type.damage;
                }
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
    }
  },

  renderWallTrap(ctx, trap, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = trap.facing || { dc: 0, dr: 1 };
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;

    if (trap.type.id === 'arrow_tower') {
      // === ARROW TOWER: Medieval crossbow mechanism mounted on stone ===

      // Wall mounting bracket (iron plate bolted to wall)
      PA.rect(ctx, x + 3, y + 2, 10, 12, C.TRAP_METAL_DARK);
      PA.rect(ctx, x + 4, y + 3, 8, 10, C.TRAP_METAL);

      // Bracket corner rivets
      PA.pixel(ctx, x + 3, y + 2, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 12, y + 2, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 3, y + 13, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 12, y + 13, C.TRAP_METAL_LIGHT);

      // Crossbow body (wooden stock)
      PA.rect(ctx, x + 5, y + 5, 6, 6, '#6b5010');
      PA.rect(ctx, x + 6, y + 6, 4, 4, C.TRAP_ARROW_WOOD);

      // Crossbow arms (curved bow limbs)
      PA.rect(ctx, x + 2, y + 4, 3, 1, '#6b5010');
      PA.pixel(ctx, x + 1, y + 5, '#6b5010');
      PA.pixel(ctx, x + 1, y + 6, '#5a4010');
      PA.rect(ctx, x + 11, y + 4, 3, 1, '#6b5010');
      PA.pixel(ctx, x + 14, y + 5, '#6b5010');
      PA.pixel(ctx, x + 14, y + 6, '#5a4010');

      // Bowstring
      PA.pixel(ctx, x + 1, y + 7, '#aaa888');
      PA.pixel(ctx, x + 3, y + 7, '#aaa888');
      PA.pixel(ctx, x + 5, y + 7, '#aaa888');
      PA.pixel(ctx, x + 10, y + 7, '#aaa888');
      PA.pixel(ctx, x + 12, y + 7, '#aaa888');
      PA.pixel(ctx, x + 14, y + 7, '#aaa888');

      // Arrow slot / guide rail
      PA.rect(ctx, x + 7, y + 8, 2, 5, '#2a2020');

      // Arrow (if loaded)
      if (!firing) {
        PA.rect(ctx, x + 7, y + 8, 2, 4, '#5a4010');
        PA.pixel(ctx, x + 7, y + 12, C.TRAP_ARROW_TIP);
        PA.pixel(ctx, x + 8, y + 12, C.TRAP_ARROW_TIP);
        PA.pixel(ctx, x + 7, y + 13, '#d0d8e0');
      }

      // Metal highlight strip
      PA.rect(ctx, x + 4, y + 3, 8, 1, C.TRAP_METAL_LIGHT);

      // "WALL" indicator: mounting chains
      PA.pixel(ctx, x + 5, y + 2, '#555555');
      PA.pixel(ctx, x + 10, y + 2, '#555555');

    } else if (trap.type.id === 'flame_jet') {
      // === FLAME JET: Pressurized fire nozzle with fuel tank ===

      // Wall mounting plate
      PA.rect(ctx, x + 3, y + 1, 10, 14, C.TRAP_METAL_DARK);
      PA.rect(ctx, x + 4, y + 2, 8, 12, '#4a4040');

      // Fuel tank (copper colored)
      PA.rect(ctx, x + 5, y + 2, 6, 5, '#8a5020');
      PA.rect(ctx, x + 6, y + 3, 4, 3, '#aa6830');
      // Tank highlight
      PA.pixel(ctx, x + 6, y + 2, '#bb7840');
      PA.pixel(ctx, x + 7, y + 2, '#bb7840');

      // Pressure gauge
      PA.pixel(ctx, x + 10, y + 3, '#cc4444');
      PA.pixel(ctx, x + 10, y + 4, '#aa3333');

      // Pipe from tank to nozzle
      PA.rect(ctx, x + 7, y + 7, 2, 3, C.TRAP_METAL);

      // Nozzle (wide flared opening)
      PA.rect(ctx, x + 5, y + 10, 6, 2, C.TRAP_METAL);
      PA.rect(ctx, x + 6, y + 11, 4, 2, C.TRAP_METAL_DARK);
      PA.pixel(ctx, x + 7, y + 12, '#1a1010');
      PA.pixel(ctx, x + 8, y + 12, '#1a1010');

      // Fire animation
      if (firing) {
        const frame = trap.animFrame;
        // Core flame
        PA.pixel(ctx, x + 7, y + 13, '#ffffff');
        PA.pixel(ctx, x + 8, y + 13, '#ffffff');
        PA.pixel(ctx, x + 7, y + 14, C.TRAP_FIRE_GLOW);
        PA.pixel(ctx, x + 8, y + 14, C.TRAP_FIRE_GLOW);
        // Outer flame (animated)
        PA.pixel(ctx, x + 6 + (frame % 2), y + 14, C.TRAP_FIRE);
        PA.pixel(ctx, x + 9 - (frame % 2), y + 14, C.TRAP_FIRE);
        PA.pixel(ctx, x + 7, y + 15, C.TRAP_FIRE);
        PA.pixel(ctx, x + 8, y + 15, C.TRAP_FIRE);
        if (frame > 1) {
          PA.pixel(ctx, x + 5, y + 14, '#ff4400');
          PA.pixel(ctx, x + 10, y + 14, '#ff4400');
          PA.pixel(ctx, x + 6, y + 15, C.TRAP_FIRE_GLOW);
          PA.pixel(ctx, x + 9, y + 15, C.TRAP_FIRE_GLOW);
        }
      }

      // Mounting bolts
      PA.pixel(ctx, x + 3, y + 1, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 12, y + 1, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 3, y + 14, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 12, y + 14, C.TRAP_METAL_LIGHT);

    } else if (trap.type.id === 'ice_trap') {
      // === ICE TRAP: Arcane crystal emitter with runic housing ===

      // Ornate housing (blued steel)
      PA.rect(ctx, x + 3, y + 2, 10, 12, '#2a3448');
      PA.rect(ctx, x + 4, y + 3, 8, 10, '#334466');

      // Decorative frame corners
      PA.pixel(ctx, x + 3, y + 2, '#5566aa');
      PA.pixel(ctx, x + 12, y + 2, '#5566aa');
      PA.pixel(ctx, x + 3, y + 13, '#5566aa');
      PA.pixel(ctx, x + 12, y + 13, '#5566aa');

      // Rune marks on housing
      PA.pixel(ctx, x + 4, y + 5, '#5588cc');
      PA.pixel(ctx, x + 4, y + 7, '#5588cc');
      PA.pixel(ctx, x + 4, y + 9, '#5588cc');
      PA.pixel(ctx, x + 11, y + 5, '#5588cc');
      PA.pixel(ctx, x + 11, y + 7, '#5588cc');
      PA.pixel(ctx, x + 11, y + 9, '#5588cc');

      // Central crystal (diamond shape)
      PA.pixel(ctx, x + 7, y + 3, C.TRAP_ICE);
      PA.pixel(ctx, x + 8, y + 3, C.TRAP_ICE);
      PA.pixel(ctx, x + 6, y + 4, C.TRAP_ICE);
      PA.pixel(ctx, x + 7, y + 4, C.TRAP_ICE_GLOW);
      PA.pixel(ctx, x + 8, y + 4, C.TRAP_ICE_GLOW);
      PA.pixel(ctx, x + 9, y + 4, C.TRAP_ICE);
      PA.pixel(ctx, x + 6, y + 5, C.TRAP_ICE);
      PA.pixel(ctx, x + 7, y + 5, '#ffffff');
      PA.pixel(ctx, x + 8, y + 5, '#eeeeff');
      PA.pixel(ctx, x + 9, y + 5, C.TRAP_ICE);
      PA.pixel(ctx, x + 6, y + 6, C.TRAP_ICE);
      PA.pixel(ctx, x + 7, y + 6, C.TRAP_ICE_GLOW);
      PA.pixel(ctx, x + 8, y + 6, C.TRAP_ICE_GLOW);
      PA.pixel(ctx, x + 9, y + 6, C.TRAP_ICE);
      PA.pixel(ctx, x + 7, y + 7, C.TRAP_ICE);
      PA.pixel(ctx, x + 8, y + 7, C.TRAP_ICE);

      // Emitter channel
      PA.rect(ctx, x + 7, y + 8, 2, 3, '#2a3448');
      PA.pixel(ctx, x + 7, y + 8, C.TRAP_ICE);
      PA.pixel(ctx, x + 8, y + 8, C.TRAP_ICE);

      // Emission nozzle
      PA.rect(ctx, x + 6, y + 11, 4, 2, '#334466');
      PA.pixel(ctx, x + 7, y + 12, C.TRAP_ICE);
      PA.pixel(ctx, x + 8, y + 12, C.TRAP_ICE);

      // Active glow effect
      if (firing || trap.active) {
        PA.pixel(ctx, x + 5, y + 5, C.TRAP_ICE_GLOW);
        PA.pixel(ctx, x + 10, y + 5, C.TRAP_ICE_GLOW);
        PA.pixel(ctx, x + 7, y + 13, C.TRAP_ICE_GLOW);
        PA.pixel(ctx, x + 8, y + 13, C.TRAP_ICE_GLOW);
        // Frost particles
        if (trap.animFrame % 2 === 0) {
          PA.pixel(ctx, x + 6, y + 14, '#aaddff');
          PA.pixel(ctx, x + 9, y + 13, '#aaddff');
        }
      }

      // Wall mounting hooks
      PA.pixel(ctx, x + 5, y + 2, C.TRAP_METAL);
      PA.pixel(ctx, x + 10, y + 2, C.TRAP_METAL);
    }
  },

  renderFloorTrap(ctx, trap, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;

    if (trap.type.id === 'floor_spikes') {
      // Floor spikes: metal grate with spikes
      // Base plate
      PA.rect(ctx, x + 2, y + 2, 12, 12, C.TRAP_METAL_DARK);
      PA.rect(ctx, x + 3, y + 3, 10, 10, '#3a3a3a');
      // Spike holes pattern
      for (let sx = 0; sx < 3; sx++) {
        for (let sy = 0; sy < 3; sy++) {
          const spx = x + 4 + sx * 3;
          const spy = y + 4 + sy * 3;
          PA.pixel(ctx, spx, spy, C.WALL_MORTAR);
          // Spike tips (animated)
          if (trap.active || trap.animFrame < 2) {
            PA.pixel(ctx, spx, spy, C.TRAP_SPIKE_TIP);
            PA.pixel(ctx, spx, spy - 1, C.TRAP_SPIKE);
          }
        }
      }
      // Border rivets
      PA.pixel(ctx, x + 2, y + 2, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 13, y + 2, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 2, y + 13, C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, x + 13, y + 13, C.TRAP_METAL_LIGHT);
    } else if (trap.type.id === 'tar_trap') {
      // Tar trap: dark sticky pool
      // Tar pool shape (irregular)
      PA.rect(ctx, x + 3, y + 4, 10, 8, C.TRAP_TAR);
      PA.rect(ctx, x + 4, y + 3, 8, 10, C.TRAP_TAR);
      PA.rect(ctx, x + 5, y + 2, 6, 12, C.TRAP_TAR);
      // Tar highlights (shiny)
      PA.pixel(ctx, x + 6, y + 5, C.TRAP_TAR_HIGHLIGHT);
      PA.pixel(ctx, x + 7, y + 5, C.TRAP_TAR_HIGHLIGHT);
      PA.pixel(ctx, x + 9, y + 8, C.TRAP_TAR_HIGHLIGHT);
      // Bubble animation
      if (trap.animFrame === 0) {
        PA.pixel(ctx, x + 8, y + 7, '#3a3a4a');
      } else if (trap.animFrame === 2) {
        PA.pixel(ctx, x + 5, y + 9, '#3a3a4a');
      }
    } else if (trap.type.id === 'bomb_trap') {
      // Bomb: round bomb with fuse
      // Body
      PA.circle(ctx, x + 8, y + 9, 3, C.TRAP_BOMB_BODY);
      PA.circle(ctx, x + 8, y + 9, 2, '#5a5a5a');
      // Highlight
      PA.pixel(ctx, x + 6, y + 7, '#7a7a7a');
      // Fuse
      PA.pixel(ctx, x + 8, y + 5, C.TRAP_BOMB_FUSE);
      PA.pixel(ctx, x + 9, y + 4, C.TRAP_BOMB_FUSE);
      PA.pixel(ctx, x + 10, y + 3, C.TRAP_BOMB_FUSE);
      // Spark
      if (trap.animFrame % 2 === 0) {
        PA.pixel(ctx, x + 10, y + 2, C.TRAP_BOMB_SPARK);
        PA.pixel(ctx, x + 11, y + 2, '#ffaa22');
      }
    }
  },

  /**
   * Render trap range indicator
   */
  renderRange(ctx, col, row, trapType) {
    if (!trapType) return;
    const T = DK.CONFIG.TILE_SIZE;
    const cx = col * T + T / 2;
    const cy = row * T + T / 2;
    const range = trapType.range * T;

    ctx.strokeStyle = 'rgba(255,255,100,0.3)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, range, 0, Math.PI * 2);
    ctx.stroke();
  },
};
