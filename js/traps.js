/**
 * Dungeon Keep - Trap System
 * Handles trap placement, rendering, and behavior
 */
window.DK = window.DK || {};

DK.Traps = {
  placed: [], // { type, col, row, facing, cooldownTimer, animFrame, flashTimer }

  init() {
    this.placed = [];
  },

  place(trapTypeId, col, row) {
    const typeDef = Object.values(DK.TRAP_TYPES).find(t => t.id === trapTypeId);
    if (!typeDef) return false;

    // Safety: cannot place on outer walls or heart tiles
    if (DK.Map.isOuter && DK.Map.isOuter(col, row)) return false;
    if (DK.Map.isHeart && DK.Map.isHeart(col, row)) return false;

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
      flashTimer: 0,
      oilZoneTimer: 0,
      oilZoneActive: false,
      oilZoneTiles: [],
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

      // 啟動閃光計時器遞減
      if (trap.flashTimer > 0) {
        trap.flashTimer = Math.max(0, trap.flashTimer - dt);
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
          trap.flashTimer = 150;
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
          trap.flashTimer = 150;
          this.fireWindTrap(trap, enemies, T);
        }
        continue;
      }

      // 油漬陷阱：限時區域型觸發
      if (trap.type.id === 'oil_trap') {
        // 油漬區域活躍中
        if (trap.oilZoneActive && trap.oilZoneTimer > 0) {
          trap.oilZoneTimer -= dt;
          trap.active = true;

          // 對區域內所有敵人施加油污狀態
          const evo = trap.evolved ? DK.EVOLUTION_TYPES[trap.evolutionType] : null;
          const oilSlow = evo ? evo.oilSlowAmount : trap.type.oilSlowAmount;
          for (const enemy of enemies) {
            if (enemy.hp <= 0 || !enemy.alive) continue;
            const ex = Math.floor(enemy.x / T);
            const ey = Math.floor(enemy.y / T);
            for (const tile of trap.oilZoneTiles) {
              if (ex === tile.col && ey === tile.row) {
                if (DK.Elements) {
                  DK.Elements.addStatus(enemy, 'oiled');
                  // 進化態覆寫緩速：0.25 (-75%) 取代預設 0.4 (-60%)
                  if (evo) {
                    enemy.slowFactor = oilSlow;
                    enemy.slowTimer = trap.oilZoneTimer;
                  }
                }
                break;
              }
            }
          }

          // 區域到期
          if (trap.oilZoneTimer <= 0) {
            trap.oilZoneActive = false;
            trap.oilZoneTiles = [];
            trap.active = false;
            trap.cooldownTimer = trap.type.cooldown;
          }
          continue;
        }

        // 冷卻中
        if (trap.cooldownTimer > 0) {
          trap.cooldownTimer -= dt;
          trap.active = false;
          continue;
        }

        // 觸發檢查：敵人踩到
        for (const enemy of enemies) {
          if (enemy.hp <= 0 || !enemy.alive) continue;
          const ex = Math.floor(enemy.x / T);
          const ey = Math.floor(enemy.y / T);
          if (ex === trap.col && ey === trap.row) {
            const evo = trap.evolved ? DK.EVOLUTION_TYPES[trap.evolutionType] : null;
            const duration = evo ? evo.oilDuration : trap.type.oilDuration;

            trap.oilZoneTimer = duration;
            trap.oilZoneActive = true;
            trap.flashTimer = 150;

            // 建立油漬區域格子
            if (evo) {
              trap.oilZoneTiles = [];
              for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                  trap.oilZoneTiles.push({ col: trap.col + dc, row: trap.row + dr });
                }
              }
            } else {
              trap.oilZoneTiles = [{ col: trap.col, row: trap.row }];
            }

            // 噴灑特效
            if (DK.Game && DK.Game.effects) {
              DK.Game.effects.push({
                type: 'oil_splat',
                x: trap.col * T + T / 2,
                y: trap.row * T + T / 2,
                radius: evo ? T * 1.5 : T * 0.5,
                duration: 400,
                timer: 0,
              });
            }

            // 對觸發的敵人施加油污
            if (DK.Elements) {
              DK.Elements.addStatus(enemy, 'oiled');
            }

            break;
          }
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
          trap.flashTimer = 150;

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
            trap.flashTimer = 150;

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

            // Apply element if trap has one
            if (trap.type.element && DK.Elements) {
              DK.Elements.applyElement(enemy, trap.type.element, { evolved: trap.evolved, evolutionType: trap.evolutionType });
            }

            // shock_plate 進化態增強
            if (trap.type.id === 'shock_plate' && trap.evolved) {
              // 進化態的感電效果由 elements.js 透過 source 物件處理
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

      // 油漬區域地面渲染
      if (trap.type.id === 'oil_trap' && trap.oilZoneActive && trap.oilZoneTiles.length > 0) {
        const zoneAlpha = Math.min(1, trap.oilZoneTimer / 500);
        for (const tile of trap.oilZoneTiles) {
          const tx = tile.col * T;
          const ty = tile.row * T;
          // 深褐色半透明油灘
          ctx.fillStyle = `rgba(42,32,16,${0.5 * zoneAlpha})`;
          ctx.fillRect(tx + 1, ty + 1, T - 2, T - 2);
          // 油光反射
          ctx.fillStyle = `rgba(90,80,48,${0.3 * zoneAlpha})`;
          ctx.fillRect(tx + 3, ty + 3, 4, 2);
          ctx.fillRect(tx + 8, ty + 8, 3, 2);
          // 不規則邊緣
          PA.pixel(ctx, tx + 2, ty + 6, `rgba(42,32,16,${0.3 * zoneAlpha})`);
          PA.pixel(ctx, tx + 12, ty + 4, `rgba(42,32,16,${0.3 * zoneAlpha})`);
          PA.pixel(ctx, tx + 5, ty + 12, `rgba(42,32,16,${0.3 * zoneAlpha})`);
          // 進化態：深紅色紋路
          if (trap.evolved) {
            ctx.fillStyle = `rgba(106,32,16,${0.2 * zoneAlpha})`;
            ctx.fillRect(tx + 4, ty + 5, 3, 1);
            ctx.fillRect(tx + 9, ty + 9, 2, 1);
          }
        }
      }

      // 啟動閃光覆蓋層（觸發攻擊時短暫白色閃爍）
      if (trap.flashTimer > 0) {
        const flashAlpha = (trap.flashTimer / 150) * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
        ctx.fillRect(x, y, T, T);
      }

      // 冷卻進度條（冷卻中時顯示）
      if (trap.cooldownTimer > 0 && trap.type.cooldown > 0) {
        const progress = 1 - (trap.cooldownTimer / trap.type.cooldown);
        const barWidth = 12;
        const barX = x + (T - barWidth) / 2;
        const barY = y - 1;

        // 依元素類型決定進度條顏色
        let barColor = '#ffffff';
        if (trap.type.element === 'electric') {
          barColor = '#ffdd44';
        } else if (trap.type.element === 'fire') {
          barColor = '#ff8844';
        } else if (trap.type.element === 'ice') {
          barColor = '#aaddff';
        } else if (trap.type.id === 'oil_trap') {
          barColor = '#8a6030';
        }

        // === 2L: 深色底框 (1px) ===
        PA.rect(ctx, barX - 1, barY - 1, barWidth + 2, 4, '#1a1a1a');
        // 深灰底條 — 2L: 高度 1→2px
        PA.rect(ctx, barX, barY, barWidth, 2, '#333333');
        // 亮色進度 — 2L: 高度 1→2px
        const filledWidth = Math.round(progress * barWidth);
        if (filledWidth > 0) {
          PA.rect(ctx, barX, barY, filledWidth, 2, barColor);
        }
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

    // 選中陷阱的攻擊範圍圈
    const selected = DK.UI ? DK.UI.selectedPlacedTrap : null;
    if (selected) {
      const selT = DK.CONFIG.TILE_SIZE;
      const selCX = selected.col * selT + selT / 2;
      const selCY = selected.row * selT + selT / 2;
      const selRange = selected.type ? selected.type.range : 0;

      if (selRange > 0) {
        // 遠程/範圍型陷阱：畫範圍圈
        const rangePixels = selRange * selT;
        ctx.beginPath();
        ctx.arc(selCX, selCY, rangePixels, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,170,68,0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,170,68,0.4)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else {
        // 接觸型陷阱（range=0）：高亮陷阱所在格子
        ctx.fillStyle = 'rgba(255,170,68,0.2)';
        ctx.fillRect(selected.col * selT, selected.row * selT, selT, selT);
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

      // === 2K: 外殼凹陷邊框 — 右下暗色 ===
      PA.pixel(ctx, x + 12, y + 13, PA.darken('#4a4050', 12));
      PA.pixel(ctx, x + 11, y + 13, PA.darken('#4a4050', 12));
      PA.pixel(ctx, x + 12, y + 12, PA.darken('#4a4050', 12));

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
        // === 2K: 活塞頂部金屬高光 ===
        PA.pixel(ctx, x + 4, y + 6, PA.lighten(C.TRAP_PUSH_PISTON, 15));
        PA.rect(ctx, x + 5, y + 9, 6, 4, C.TRAP_METAL);
        PA.rect(ctx, x + 6, y + 13, 4, 3, C.TRAP_METAL_LIGHT);
        // Ram face
        PA.rect(ctx, x + 4, y + 14, 8, 2, '#aaa0b0');
        PA.rect(ctx, x + 4, y + 14, 8, 1, '#bbb0c0');
      } else {
        // Retracted position
        PA.rect(ctx, x + 4, y + 6, 8, 3, C.TRAP_PUSH_PISTON);
        // === 2K: 活塞頂部金屬高光（縮回狀態） ===
        PA.pixel(ctx, x + 4, y + 6, PA.lighten(C.TRAP_PUSH_PISTON, 15));
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
      // === 2K: 風扇艙室內凹邊框 — 左上高光 + 右下陰影 ===
      PA.pixel(ctx, x + 4, y + 3, '#2a3545');   // 左上高光
      PA.pixel(ctx, x + 5, y + 3, '#2a3545');
      PA.pixel(ctx, x + 4, y + 4, '#2a3545');
      PA.pixel(ctx, x + 11, y + 10, '#0a1020');  // 右下陰影
      PA.pixel(ctx, x + 10, y + 10, '#0a1020');
      PA.pixel(ctx, x + 11, y + 9, '#0a1020');

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
      // === 2K: 出風口金屬質感像素 ===
      PA.pixel(ctx, x + 5, y + 11, '#3a4a5a');
      PA.pixel(ctx, x + 10, y + 11, '#3a4a5a');

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

      // Rune glow — 2K: 符文發光點 2→4 個
      PA.pixel(ctx, x + 7, y + 5, C.TRAP_ELECTRIC_LIGHT);
      PA.pixel(ctx, x + 8, y + 9, C.TRAP_ELECTRIC_LIGHT);
      PA.pixel(ctx, x + 6, y + 6, C.TRAP_ELECTRIC_LIGHT);
      PA.pixel(ctx, x + 9, y + 7, C.TRAP_ELECTRIC_LIGHT);

      // Edge glow lines (etched grooves)
      PA.rect(ctx, x + 2, y + 2, 12, 1, '#3a3a4a');
      PA.rect(ctx, x + 2, y + 2, 1, 12, '#3a3a4a');
      PA.rect(ctx, x + 2, y + 13, 12, 1, '#606070');
      PA.rect(ctx, x + 13, y + 2, 1, 12, '#606070');

      // Active sparking — 2K: 火花增至 6-8 個
      if (firing) {
        const frame = trap.animFrame;
        // Sparks at corners
        if (frame === 0 || frame === 2) {
          PA.pixel(ctx, x + 3, y + 3, '#ffffff');
          PA.pixel(ctx, x + 12, y + 12, '#ffffff');
          PA.pixel(ctx, x + 4, y + 4, C.TRAP_ELECTRIC_LIGHT);
          PA.pixel(ctx, x + 5, y + 3, C.TRAP_ELECTRIC_LIGHT);
          PA.pixel(ctx, x + 11, y + 11, C.TRAP_ELECTRIC_LIGHT);
        }
        if (frame === 1 || frame === 3) {
          PA.pixel(ctx, x + 12, y + 3, '#ffffff');
          PA.pixel(ctx, x + 3, y + 12, '#ffffff');
          PA.pixel(ctx, x + 11, y + 4, C.TRAP_ELECTRIC_LIGHT);
          PA.pixel(ctx, x + 10, y + 3, C.TRAP_ELECTRIC_LIGHT);
          PA.pixel(ctx, x + 4, y + 11, C.TRAP_ELECTRIC_LIGHT);
        }
        // Center glow intensified
        PA.pixel(ctx, x + 7, y + 7, '#ffffff');
        PA.pixel(ctx, x + 8, y + 8, '#ffffff');
        PA.pixel(ctx, x + 7, y + 8, C.TRAP_ELECTRIC_LIGHT);
        PA.pixel(ctx, x + 8, y + 7, C.TRAP_ELECTRIC_LIGHT);
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

    } else if (trap.type.id === 'oil_trap') {
      // === OIL TRAP: 地板嵌入式油罐裝置 ===

      // 嵌入式底座
      PA.rect(ctx, x + 2, y + 2, 12, 12, '#2a2418');
      PA.rect(ctx, x + 3, y + 3, 10, 10, C.TRAP_OIL_BODY);

      // 金屬外框
      PA.rect(ctx, x + 2, y + 2, 12, 1, '#4a4030');
      PA.rect(ctx, x + 2, y + 2, 1, 12, '#4a4030');
      PA.rect(ctx, x + 2, y + 13, 12, 1, '#1a1808');
      PA.rect(ctx, x + 13, y + 2, 1, 12, '#1a1808');

      // 角落鉚釘
      PA.pixel(ctx, x + 2, y + 2, C.TRAP_METAL);
      PA.pixel(ctx, x + 13, y + 2, C.TRAP_METAL);
      PA.pixel(ctx, x + 2, y + 13, C.TRAP_METAL);
      PA.pixel(ctx, x + 13, y + 13, C.TRAP_METAL);

      // 中央油罐（圓形）
      PA.rect(ctx, x + 5, y + 5, 6, 6, '#2a1a10');
      PA.rect(ctx, x + 6, y + 6, 4, 4, C.TRAP_OIL_PUDDLE);
      PA.rect(ctx, x + 7, y + 7, 2, 2, '#1a1208');

      // 油光反射
      PA.pixel(ctx, x + 6, y + 5, C.TRAP_OIL_SHEEN);
      PA.pixel(ctx, x + 7, y + 5, C.TRAP_OIL_SHEEN);

      // 噴嘴（上方 4 個出口）
      PA.pixel(ctx, x + 4, y + 7, '#4a3828');
      PA.pixel(ctx, x + 11, y + 7, '#4a3828');
      PA.pixel(ctx, x + 7, y + 4, '#4a3828');
      PA.pixel(ctx, x + 7, y + 11, '#4a3828');

      // 閒置時油面微光
      const frame = trap.animFrame;
      if (!firing) {
        if (frame < 2) {
          PA.pixel(ctx, x + 7, y + 6, C.TRAP_OIL_SHEEN);
        }
      } else {
        // 觸發時油滴飛濺
        PA.pixel(ctx, x + 4, y + 4, '#3a2810');
        PA.pixel(ctx, x + 11, y + 4, '#3a2810');
        PA.pixel(ctx, x + 4, y + 11, '#3a2810');
        PA.pixel(ctx, x + 11, y + 11, '#3a2810');
      }

      // 進化態增強視覺：深紅色油漬 + 火焰紋路
      if (trap.evolved) {
        PA.rect(ctx, x + 6, y + 6, 4, 4, '#4a1810');
        PA.pixel(ctx, x + 5, y + 7, '#6a2010');
        PA.pixel(ctx, x + 10, y + 7, '#6a2010');
        PA.pixel(ctx, x + 7, y + 5, '#6a2010');
        PA.pixel(ctx, x + 7, y + 10, '#6a2010');
        // 微弱火焰紋
        if (frame % 2 === 0) {
          PA.pixel(ctx, x + 6, y + 5, '#ff6633');
          PA.pixel(ctx, x + 9, y + 10, '#ff6633');
        }
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
