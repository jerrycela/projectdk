/**
 * Dungeon Keep - Elemental Status Effect & Reaction System
 * Handles status effects on enemies and elemental reaction triggers
 */
window.DK = window.DK || {};

DK.Elements = {
  // Status effect definitions
  EFFECTS: {
    wet: {
      id: 'wet',
      name: '潮濕',
      duration: 4000,
      color: '#4488ff',
      particleColor: '#66aaff',
    },
    electrocuted: {
      id: 'electrocuted',
      name: '感電',
      duration: 2000,
      color: '#ffff44',
      particleColor: '#ffffff',
      paralysis: true,
      dot: 12,
      dotInterval: 500,
    },
    burning: {
      id: 'burning',
      name: '灼印',
      duration: 3000,
      color: '#ff6622',
      particleColor: '#ffaa44',
    },
    frozen_mark: {
      id: 'frozen_mark',
      name: '冰凍印記',
      duration: 3000,
      color: '#88ccff',
      particleColor: '#aaddff',
      slowAmount: 0.8, // 移速×0.8 = -20%
    },
    oiled: {
      id: 'oiled',
      name: '油污',
      duration: 3000,
      color: '#5a4020',
      particleColor: '#3a2810',
      slowAmount: 0.4, // 移速×0.4 = -60%
    },
    oil_burn: {
      id: 'oil_burn',
      name: '油燃燒傷',
      duration: 3000,
      color: '#ff5500',
      particleColor: '#ffaa22',
      dot: 20,
      dotInterval: 500,
    },
    oil_stun: {
      id: 'oil_stun',
      name: '油燃眩暈',
      duration: 1000,
      color: '#ff8800',
      particleColor: '#ffaa44',
      paralysis: true,
    },
  },

  // Reaction definitions: { trigger, consumed, result }
  REACTIONS: [
    { trigger: 'electric', consumed: 'wet', result: 'electrocuted' },
    { trigger: 'fire', consumed: 'oiled', result: 'oil_ignite' },
  ],

  // Active reaction effects (for chain lightning rendering)
  reactionEffects: [],

  init() {
    this.reactionEffects = [];
  },

  /**
   * Apply an elemental hit to an enemy.
   * element = 'water' | 'electric'
   * Returns true if a reaction was triggered.
   */
  applyElement(enemy, element, source) {
    if (!enemy.statusEffects) {
      enemy.statusEffects = [];
    }

    // Check for reactions: does this element trigger a reaction with existing status?
    for (const reaction of this.REACTIONS) {
      if (element === reaction.trigger && this.hasStatus(enemy, reaction.consumed)) {
        // Trigger reaction!
        this.removeStatus(enemy, reaction.consumed);
        this.addStatus(enemy, reaction.result);
        this.triggerReaction(enemy, reaction.result, source);
        return true;
      }
    }

    // No reaction — apply base status for elements that have one
    const elementStatusMap = { water: 'wet', fire: 'burning', ice: 'frozen_mark' };
    const baseStatus = elementStatusMap[element];
    if (baseStatus) {
      this.addStatus(enemy, baseStatus);
    }

    return false;
  },

  addStatus(enemy, effectId) {
    if (!enemy.statusEffects) {
      enemy.statusEffects = [];
    }

    const def = this.EFFECTS[effectId];
    if (!def) return;

    const hadStatus = this.hasStatus(enemy, effectId);

    // Remove existing same-type status (refresh)
    this.removeStatus(enemy, effectId);

    enemy.statusEffects.push({
      id: def.id,
      timer: def.duration,
      maxDuration: def.duration,
      dotTimer: 0,
    });

    // First application: show status text + splash effect
    if (!hadStatus && DK.Game && DK.Game.effects) {
      if (effectId === 'wet') {
        DK.Game.effects.push({
          type: 'reaction_text',
          x: enemy.x,
          y: enemy.y - 12,
          text: '潮濕',
          color: '#66aaff',
          duration: 800,
          timer: 0,
        });
        DK.Game.effects.push({
          type: 'water_splash',
          x: enemy.x,
          y: enemy.y,
          duration: 400,
          timer: 0,
        });
      } else if (effectId === 'burning') {
        DK.Game.effects.push({
          type: 'reaction_text',
          x: enemy.x,
          y: enemy.y - 12,
          text: '灼印',
          color: '#ff6622',
          duration: 800,
          timer: 0,
        });
        DK.Game.effects.push({
          type: 'fire_splash',
          x: enemy.x,
          y: enemy.y,
          duration: 400,
          timer: 0,
        });
      } else if (effectId === 'frozen_mark') {
        DK.Game.effects.push({
          type: 'reaction_text',
          x: enemy.x,
          y: enemy.y - 12,
          text: '冰凍印記',
          color: '#88ccff',
          duration: 800,
          timer: 0,
        });
        DK.Game.effects.push({
          type: 'ice_splash',
          x: enemy.x,
          y: enemy.y,
          duration: 400,
          timer: 0,
        });
        // 套用減速效果
        enemy.slowFactor = def.slowAmount;
        enemy.slowTimer = def.duration;
      } else if (effectId === 'oiled') {
        DK.Game.effects.push({
          type: 'reaction_text',
          x: enemy.x,
          y: enemy.y - 12,
          text: '油污',
          color: '#8a6030',
          duration: 800,
          timer: 0,
        });
        DK.Game.effects.push({
          type: 'oil_splash',
          x: enemy.x,
          y: enemy.y,
          duration: 400,
          timer: 0,
        });
        // 套用強力減速
        enemy.slowFactor = def.slowAmount;
        enemy.slowTimer = def.duration;
      } else if (effectId === 'oil_burn') {
        // 油燃燒傷：移除油污（火燒掉了油）
        this.removeStatus(enemy, 'oiled');
        DK.Game.effects.push({
          type: 'reaction_text',
          x: enemy.x,
          y: enemy.y - 12,
          text: '油燃燒傷',
          color: '#ff5500',
          duration: 800,
          timer: 0,
        });
        DK.Game.effects.push({
          type: 'fire_splash',
          x: enemy.x,
          y: enemy.y,
          duration: 400,
          timer: 0,
        });
      } else if (effectId === 'oil_stun') {
        // oil_stun 不需要特殊視覺（oil_burn 已經很醒目）
        // paralysis 由 updateStatuses 自動套用
      }
    }
  },

  removeStatus(enemy, effectId) {
    if (!enemy.statusEffects) return;
    enemy.statusEffects = enemy.statusEffects.filter(s => s.id !== effectId);
  },

  hasStatus(enemy, effectId) {
    if (!enemy.statusEffects) return false;
    return enemy.statusEffects.some(s => s.id === effectId);
  },

  getStatus(enemy, effectId) {
    if (!enemy.statusEffects) return null;
    return enemy.statusEffects.find(s => s.id === effectId);
  },

  /**
   * Update all status effects on an enemy. Called each frame.
   */
  updateStatuses(enemy, dt) {
    if (!enemy.statusEffects || enemy.statusEffects.length === 0) return;

    const toRemove = [];

    for (const status of enemy.statusEffects) {
      const def = this.EFFECTS[status.id];
      if (!def) continue;

      status.timer -= dt;

      // DoT processing
      if (def.dot) {
        status.dotTimer += dt;
        if (status.dotTimer >= def.dotInterval) {
          status.dotTimer = 0;
          enemy.hp -= def.dot;
          enemy.flashTimer = 80;

          // DoT damage number
          if (DK.Game && DK.Game.effects) {
            DK.Game.effects.push({
              type: 'damage',
              x: enemy.x + (Math.random() - 0.5) * 4,
              y: enemy.y - 8,
              text: `-${def.dot}`,
              color: def.color,
              duration: 600,
              timer: 0,
            });
          }
        }
      }

      // Paralysis: prevent movement
      if (def.paralysis) {
        enemy.paralyzed = true;
      }

      // 減速效果：每幀持續套用
      if (def.slowAmount) {
        enemy.slowFactor = def.slowAmount;
        enemy.slowTimer = status.timer;
      }

      if (status.timer <= 0) {
        toRemove.push(status.id);
      }
    }

    // Clean up expired
    for (const id of toRemove) {
      this.removeStatus(enemy, id);
    }

    // Clear paralysis if no paralysis status active
    if (!enemy.statusEffects.some(s => {
      const d = this.EFFECTS[s.id];
      return d && d.paralysis;
    })) {
      enemy.paralyzed = false;
    }
  },

  /**
   * Trigger a reaction - create visual effects, screen shake, etc.
   */
  triggerReaction(enemy, reactionId, source) {
    if (reactionId === 'electrocuted') {
      // Base screen shake (subtle feedback)
      if (DK.Game) {
        DK.Game.screenShake = { intensity: 1, timer: 150 };
      }

      // Reaction text
      if (DK.Game && DK.Game.effects) {
        DK.Game.effects.push({
          type: 'reaction_text',
          x: enemy.x,
          y: enemy.y - 14,
          text: '感電！',
          color: '#ffff44',
          duration: 1200,
          timer: 0,
        });
      }

      // Lightning burst effect (subtle)
      if (DK.Game && DK.Game.effects) {
        DK.Game.effects.push({
          type: 'electrocute_burst',
          x: enemy.x,
          y: enemy.y,
          duration: 250,
          timer: 0,
          enemyRef: enemy,
        });
      }

      // White flash on enemy
      enemy.flashTimer = 200;

      // Store reaction effect (subtle glow)
      this.reactionEffects.push({
        x: enemy.x,
        y: enemy.y,
        timer: 500,
        enemyRef: enemy,
      });

      // Chain electrocution: spread to nearby wet enemies
      // 如果 source 有進化參數，傳遞給 spreadElectrocution
      let evolutionParams = null;
      if (source && source.evolved && source.evolutionType) {
        const evoDef = DK.EVOLUTION_TYPES[source.evolutionType];
        if (evoDef) {
          evolutionParams = {
            chainRangeBonus: evoDef.chainRangeBonus || 0,
            electrocuteRangeBonus: evoDef.electrocuteRangeBonus || 0,
          };
        }
      }
      const chainCount = this.spreadElectrocution(enemy, new Set([enemy]), evolutionParams);

      // Slight amplification for chain (capped)
      if (chainCount > 0 && DK.Game) {
        DK.Game.screenShake = {
          intensity: Math.min(1.5 + chainCount * 0.5, 3),
          timer: Math.min(150 + chainCount * 30, 250),
        };
      }
    }

    // 油燃引爆：火元素觸發油污
    if (reactionId === 'oil_ignite') {
      const T = DK.CONFIG.TILE_SIZE;

      // 引爆傷害
      let igniteDamage = 50;
      let igniteRange = T * 1;
      let igniteDotAmount = 20;
      let igniteDotInterval = 500;
      let stunDuration = 0;

      // 進化態加成：尋找附近的進化態油漬陷阱
      if (DK.Traps && DK.Traps.placed) {
        for (const trap of DK.Traps.placed) {
          if (trap.type.id !== 'oil_trap' || !trap.evolved) continue;
          const trapCX = trap.col * T + T / 2;
          const trapCY = trap.row * T + T / 2;
          const dx = enemy.x - trapCX;
          const dy = enemy.y - trapCY;
          if (Math.sqrt(dx * dx + dy * dy) < T * 2) {
            const evoDef = DK.EVOLUTION_TYPES[trap.evolutionType];
            if (evoDef) {
              igniteDamage = Math.round(igniteDamage * (1 + (evoDef.igniteDamageBonus || 0)));
              igniteDotAmount = Math.round(igniteDotAmount * (1 + (evoDef.igniteDotBonus || 0)));
              igniteRange = T * (1 + (evoDef.igniteRangeBonus || 0));
              stunDuration = evoDef.stunDuration || 0;
            }
            break;
          }
        }
      }

      // 螢幕震動
      if (DK.Game) {
        DK.Game.screenShake = { intensity: 3, timer: 300 };
      }

      // 對被引爆的敵人造成一次性傷害
      enemy.hp -= igniteDamage;
      enemy.flashTimer = 200;

      if (DK.Game && DK.Game.effects) {
        // 引爆傷害數字
        DK.Game.effects.push({
          type: 'damage',
          x: enemy.x + (Math.random() - 0.5) * 4,
          y: enemy.y - 8,
          text: `-${igniteDamage}`,
          color: '#ff5500',
          duration: 800,
          timer: 0,
        });

        // 反應文字
        DK.Game.effects.push({
          type: 'reaction_text',
          x: enemy.x,
          y: enemy.y - 14,
          text: '油燃引爆！',
          color: '#ff5500',
          duration: 1200,
          timer: 0,
        });

        // 引爆爆發特效
        DK.Game.effects.push({
          type: 'oil_ignite_burst',
          x: enemy.x,
          y: enemy.y,
          radius: igniteRange,
          duration: 500,
          timer: 0,
        });
      }

      // 範圍效果：1 格內所有其他敵人
      if (DK.Enemies && DK.Enemies.active) {
        for (const other of DK.Enemies.active) {
          if (other === enemy || !other.alive || other.hp <= 0) continue;
          const dx = other.x - enemy.x;
          const dy = other.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > igniteRange) continue;

          // 有油污的敵人：額外消耗油污 + 引爆傷害
          if (this.hasStatus(other, 'oiled')) {
            this.removeStatus(other, 'oiled');
            other.hp -= igniteDamage;
            other.flashTimer = 150;
            if (DK.Game && DK.Game.effects) {
              DK.Game.effects.push({
                type: 'damage',
                x: other.x + (Math.random() - 0.5) * 4,
                y: other.y - 8,
                text: `-${igniteDamage}`,
                color: '#ff5500',
                duration: 800,
                timer: 0,
              });
              DK.Game.effects.push({
                type: 'reaction_text',
                x: other.x,
                y: other.y - 14,
                text: '連鎖引爆！',
                color: '#ff5500',
                duration: 1000,
                timer: 0,
              });
            }
          }

          // 所有範圍內敵人（無論有無油污）：施加油燃燒傷
          this.addStatus(other, 'oil_burn');

          // 進化態眩暈（透過狀態系統，讓 updateStatuses 正確管理）
          if (stunDuration > 0) {
            this.addStatus(other, 'oil_stun');
          }
        }
      }

      // 被引爆的敵人自身也施加油燃燒傷
      this.addStatus(enemy, 'oil_burn');

      // 進化態眩暈（自身）
      if (stunDuration > 0) {
        this.addStatus(enemy, 'oil_stun');
      }
    }

  },

  /**
   * Chain electrocution: when an enemy is electrocuted, spread to nearby WET enemies.
   * Lightning arcs between them and they all become electrocuted.
   * Recursive — the chain keeps spreading as long as there are wet enemies nearby.
   * Returns total number of enemies chained.
   */
  spreadElectrocution(sourceEnemy, processedSet, evolutionParams) {
    if (!DK.Enemies || !DK.Enemies.active || !DK.Game) return 0;

    const T = DK.CONFIG.TILE_SIZE;
    const baseChainRange = T * 1;
    const chainRangeBonus = (evolutionParams && evolutionParams.chainRangeBonus) ? evolutionParams.chainRangeBonus * T : 0;
    const chainRange = baseChainRange + chainRangeBonus;
    let chainCount = 0;
    const newTargets = [];

    for (const other of DK.Enemies.active) {
      if (processedSet.has(other) || !other.alive || other.hp <= 0) continue;
      if (!this.hasStatus(other, 'wet')) continue;

      const dx = other.x - sourceEnemy.x;
      const dy = other.y - sourceEnemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < chainRange) {
        // Chain lightning visual arc
        DK.Game.effects.push({
          type: 'chain_lightning',
          x: sourceEnemy.x,
          y: sourceEnemy.y,
          targetX: other.x,
          targetY: other.y,
          duration: 350,
          timer: 0,
        });

        // Consume wet, apply electrocuted
        this.removeStatus(other, 'wet');
        this.addStatus(other, 'electrocuted');

        // Visual feedback on chained enemy
        other.flashTimer = 200;
        DK.Game.effects.push({
          type: 'reaction_text',
          x: other.x,
          y: other.y - 14,
          text: '連鎖感電！',
          color: '#ffff44',
          duration: 1200,
          timer: 0,
        });
        DK.Game.effects.push({
          type: 'electrocute_burst',
          x: other.x,
          y: other.y,
          duration: 250,
          timer: 0,
          enemyRef: other,
        });

        this.reactionEffects.push({
          x: other.x,
          y: other.y,
          timer: 500,
          enemyRef: other,
        });

        // 進化態：額外直接傷害
        if (evolutionParams && evolutionParams.electrocuteRangeBonus > 0) {
          const bonusDmg = Math.round(12 * evolutionParams.electrocuteRangeBonus);
          other.hp -= bonusDmg;
          if (DK.Game && DK.Game.effects) {
            DK.Game.effects.push({
              type: 'damage',
              x: other.x,
              y: other.y - 10,
              text: `-${bonusDmg}`,
              color: '#ffff44',
              duration: 600,
              timer: 0,
            });
          }
        }

        processedSet.add(other);
        newTargets.push(other);
        chainCount++;
      }
    }

    // Recursively spread from newly electrocuted targets
    for (const target of newTargets) {
      chainCount += this.spreadElectrocution(target, processedSet, evolutionParams);
    }

    return chainCount;
  },

  /**
   * Update reaction effects (cleanup)
   */
  update(dt) {
    for (const re of this.reactionEffects) {
      re.timer -= dt;
    }
    this.reactionEffects = this.reactionEffects.filter(r => r.timer > 0);
  },

  /**
   * Render status effect indicators on enemies (pixel art, offscreen canvas)
   */
  renderStatusIndicators(ctx, enemy, x, y, time) {
    if (!enemy.statusEffects) return;

    // 計算活躍效果的 index，讓多重狀態垂直錯開
    let activeIndex = 0;

    for (const status of enemy.statusEffects) {
      const def = this.EFFECTS[status.id];
      if (!def) continue;

      // 每個活躍狀態效果的軌道垂直偏移：第一個 -2px，之後每個再高 3px
      const yOffset = -(activeIndex * 3);

      if (status.id === 'wet') {
        const PA = DK.PixelArt;
        const t = (time || 0) / 300;
        const pulse = 0.5 + Math.sin(t * 2) * 0.5;

        // Blue aura glow around enemy (pulsing)
        const glowAlpha = 0.15 + pulse * 0.12;
        PA.rect(ctx, x - 5, y - 8 + yOffset, 11, 13, `rgba(68,136,255,${glowAlpha})`);

        // 6 orbiting water droplets (2px tall, brighter)
        for (let i = 0; i < 6; i++) {
          const angle = t + (i * Math.PI * 2) / 6;
          const radius = 6 + Math.sin(t * 3 + i) * 1;
          const px = Math.round(x + Math.cos(angle) * radius);
          const py = Math.round(y - 2 + yOffset + Math.sin(angle) * radius * 0.6);
          const bright = i % 2 === 0;
          PA.pixel(ctx, px, py, bright ? '#aaddff' : '#66aaff');
          PA.pixel(ctx, px, py + 1, '#4488ff');
        }

        // Falling water drips (3 staggered streams)
        for (let i = 0; i < 3; i++) {
          const dripPhase = ((t * 2) + i * 1.2) % 3.0;
          if (dripPhase < 2.0) {
            const dripX = x - 3 + Math.round(i * 3);
            const dripY = Math.round(y + yOffset + dripPhase * 4);
            PA.pixel(ctx, dripX, dripY, '#4488ff');
            PA.pixel(ctx, dripX, dripY - 1, '#66aaff');
          }
        }

        // Water puddle ripple at feet
        const rippleR = 2 + Math.round(pulse * 2);
        PA.pixel(ctx, x - rippleR, y + 4, '#2266cc');
        PA.pixel(ctx, x + rippleR, y + 4, '#2266cc');
        PA.pixel(ctx, x, y + 4, '#4488ff');
        PA.pixel(ctx, x - 1, y + 4, '#3377dd');
        PA.pixel(ctx, x + 1, y + 4, '#3377dd');
      } else if (status.id === 'electrocuted') {
        // Sparking electricity around enemy
        const t = (time || 0);
        const flicker = Math.floor(t / 60) % 4;

        // Small electric arcs
        for (let i = 0; i < 4; i++) {
          const angle = (t / 100) + (i * Math.PI / 2);
          const r = 4 + Math.sin(t / 80 + i) * 2;
          const px = Math.round(x + Math.cos(angle) * r);
          const py = Math.round(y - 2 + yOffset + Math.sin(angle) * r * 0.7);
          const color = flicker === i ? '#ffffff' : '#ffff44';
          DK.PixelArt.pixel(ctx, px, py, color);
        }

        // Periodic bright flash
        if (flicker === 0) {
          DK.PixelArt.pixel(ctx, x - 1, y - 3 + yOffset, '#ffffff');
          DK.PixelArt.pixel(ctx, x + 1, y + 1 + yOffset, '#ffffff');
        }
      } else if (status.id === 'burning') {
        // 灼印：火焰粒子環繞敵人
        const PA = DK.PixelArt;
        const t = (time || 0) / 250;

        // 底部微弱橘光
        const glowAlpha = 0.12 + Math.sin(t * 3) * 0.06;
        PA.rect(ctx, x - 4, y - 6 + yOffset, 9, 11, `rgba(255,102,34,${glowAlpha})`);

        // 6 個火焰粒子環繞（橘紅色，向上飄動）
        for (let i = 0; i < 6; i++) {
          const angle = t * 1.5 + (i * Math.PI * 2) / 6;
          const radius = 5 + Math.sin(t * 2 + i * 0.8) * 1.5;
          const px = Math.round(x + Math.cos(angle) * radius);
          // 火焰粒子向上飄動
          const floatY = Math.sin(t * 3 + i * 1.1) * 2 - 1;
          const py = Math.round(y - 2 + yOffset + Math.sin(angle) * radius * 0.5 + floatY);
          const bright = i % 2 === 0;
          PA.pixel(ctx, px, py, bright ? '#ffaa44' : '#ff6622');
          PA.pixel(ctx, px, py - 1, bright ? '#ff8833' : '#cc4411');
        }

        // 底部橘光圈
        PA.pixel(ctx, x - 2, y + 3, '#ff6622');
        PA.pixel(ctx, x + 2, y + 3, '#ff6622');
        PA.pixel(ctx, x, y + 4, '#cc4411');
      } else if (status.id === 'frozen_mark') {
        // 冰凍印記：冰晶粒子環繞
        const PA = DK.PixelArt;
        const t = (time || 0) / 350;

        // 身體微弱藍色光暈
        const glowAlpha = 0.1 + Math.sin(t * 2) * 0.05;
        PA.rect(ctx, x - 4, y - 6 + yOffset, 9, 11, `rgba(136,204,255,${glowAlpha})`);

        // 冰晶粒子環繞（淺藍色小菱形）
        for (let i = 0; i < 6; i++) {
          const angle = t + (i * Math.PI * 2) / 6;
          const radius = 5 + Math.sin(t * 1.5 + i) * 1;
          const px = Math.round(x + Math.cos(angle) * radius);
          const py = Math.round(y - 2 + yOffset + Math.sin(angle) * radius * 0.6);
          // 小菱形（3像素）
          PA.pixel(ctx, px, py - 1, '#aaddff');
          PA.pixel(ctx, px - 1, py, '#88ccff');
          PA.pixel(ctx, px + 1, py, '#88ccff');
          PA.pixel(ctx, px, py + 1, '#aaddff');
        }
      } else if (status.id === 'oiled') {
        // 油污：深褐色油滴向下滴落
        const PA = DK.PixelArt;
        const t = (time || 0) / 300;

        // 身體深褐色光暈
        const glowAlpha = 0.12 + Math.sin(t * 2) * 0.05;
        PA.rect(ctx, x - 4, y - 6 + yOffset, 9, 11, `rgba(90,64,32,${glowAlpha})`);

        // 3-4 個深褐色油滴向下滴落
        for (let i = 0; i < 4; i++) {
          const dripPhase = ((t * 1.5) + i * 0.8) % 2.5;
          if (dripPhase < 1.8) {
            const dripX = x - 3 + Math.round(i * 2.5);
            const dripY = Math.round(y + yOffset + dripPhase * 5);
            PA.pixel(ctx, dripX, dripY, '#3a2810');
            PA.pixel(ctx, dripX, dripY - 1, '#5a4020');
          }
        }

        // 腳底油漬
        PA.pixel(ctx, x - 2, y + 4, '#2a2010');
        PA.pixel(ctx, x, y + 4, '#3a2810');
        PA.pixel(ctx, x + 2, y + 4, '#2a2010');
      } else if (status.id === 'oil_burn') {
        // 油燃燒傷：猛烈火焰粒子
        const PA = DK.PixelArt;
        const t = (time || 0) / 200;

        // 底部猛烈橘紅光
        const glowAlpha = 0.18 + Math.sin(t * 4) * 0.08;
        PA.rect(ctx, x - 5, y - 7 + yOffset, 11, 13, `rgba(255,85,0,${glowAlpha})`);

        // 8 個火焰粒子猛烈向上飄動（比灼印更大更亮）
        for (let i = 0; i < 8; i++) {
          const angle = t * 2 + (i * Math.PI * 2) / 8;
          const radius = 6 + Math.sin(t * 3 + i) * 2;
          const px = Math.round(x + Math.cos(angle) * radius);
          const floatY = Math.sin(t * 4 + i * 0.7) * 3 - 2;
          const py = Math.round(y - 3 + yOffset + Math.sin(angle) * radius * 0.4 + floatY);
          const colors = ['#ffdd44', '#ffaa22', '#ff5500', '#cc2200'];
          PA.pixel(ctx, px, py, colors[i % 4]);
          PA.pixel(ctx, px, py - 1, colors[(i + 1) % 4]);
        }

        // 底部大火焰
        PA.pixel(ctx, x - 2, y + 3, '#ff5500');
        PA.pixel(ctx, x, y + 3, '#ffaa22');
        PA.pixel(ctx, x + 2, y + 3, '#ff5500');
        PA.pixel(ctx, x - 1, y + 4, '#cc2200');
        PA.pixel(ctx, x + 1, y + 4, '#cc2200');
      }

      activeIndex++;
    }
  },
};
