/**
 * Dungeon Keep - Enemy System
 * Handles enemy spawning, movement, rendering, and AI
 */
window.DK = window.DK || {};

DK.Enemies = {
  active: [],

  init() {
    this.active = [];
  },

  spawn(typeName, pathIndex) {
    const typeDef = DK.ENEMY_TYPES[typeName];
    if (!typeDef || DK.Map.path.length === 0) return null;

    const startPos = DK.Map.path[pathIndex || 0];
    const enemy = {
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
      flashTimer: 0,
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

      if (enemy.hp <= 0) {
        enemy.alive = false;
        enemy.deathTimer = 0;
        // Award gold
        if (DK.Game) {
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

      // Animation
      enemy.animTimer += dt;
      if (enemy.animTimer > 250) {
        enemy.animFrame = (enemy.animFrame + 1) % 4;
        enemy.animTimer = 0;
      }

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
      e.alive || e.deathTimer < 500 || e.reachedEnd === false
    );
  },

  render(ctx, time) {
    for (const enemy of this.active) {
      if (enemy.deathTimer > 500) continue;

      const x = Math.round(enemy.x);
      const y = Math.round(enemy.y);

      if (!enemy.alive && !enemy.reachedEnd) {
        this.renderDeath(ctx, enemy, x, y);
        continue;
      }

      if (enemy.reachedEnd) continue;

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

      // HP bar
      this.renderHPBar(ctx, enemy, x, y);

      // Slow indicator
      if (enemy.slowTimer > 0) {
        DK.PixelArt.pixel(ctx, x - 1, y - 7, DK.COLORS.TRAP_ICE);
        DK.PixelArt.pixel(ctx, x + 1, y - 7, DK.COLORS.TRAP_ICE);
      }
    }
  },

  renderGoblin(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = enemy.animFrame;
    const flash = enemy.flashTimer > 0;
    const skinColor = flash ? '#ffffff' : C.GOBLIN_SKIN;
    const darkColor = flash ? '#dddddd' : C.GOBLIN_DARK;

    // Body
    PA.rect(ctx, x - 3, y - 2, 6, 5, skinColor);
    PA.rect(ctx, x - 2, y - 2, 4, 5, darkColor);

    // Head
    PA.rect(ctx, x - 3, y - 6, 6, 4, skinColor);

    // Eyes
    PA.pixel(ctx, x - 2, y - 5, C.GOBLIN_EYE);
    PA.pixel(ctx, x + 1, y - 5, C.GOBLIN_EYE);
    PA.pixel(ctx, x - 2, y - 4, '#000000');
    PA.pixel(ctx, x + 1, y - 4, '#000000');

    // Ears (pointy)
    PA.pixel(ctx, x - 4, y - 6, skinColor);
    PA.pixel(ctx, x - 4, y - 7, skinColor);
    PA.pixel(ctx, x + 3, y - 6, skinColor);
    PA.pixel(ctx, x + 3, y - 7, skinColor);

    // Legs (animated)
    if (f === 0 || f === 2) {
      PA.rect(ctx, x - 2, y + 3, 2, 2, darkColor);
      PA.rect(ctx, x + 1, y + 3, 2, 2, darkColor);
    } else {
      PA.rect(ctx, x - 3, y + 3, 2, 2, darkColor);
      PA.rect(ctx, x + 2, y + 3, 2, 2, darkColor);
    }

    // Weapon (small dagger)
    PA.pixel(ctx, x + 4, y - 1, '#aaaaaa');
    PA.pixel(ctx, x + 4, y - 2, '#cccccc');
  },

  renderSkeleton(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = enemy.animFrame;
    const flash = enemy.flashTimer > 0;
    const boneColor = flash ? '#ffffff' : C.SKELETON_BONE;
    const darkColor = flash ? '#dddddd' : C.SKELETON_DARK;

    // Ribcage / body
    PA.rect(ctx, x - 2, y - 2, 5, 5, boneColor);
    PA.pixel(ctx, x - 1, y - 1, darkColor);
    PA.pixel(ctx, x + 1, y - 1, darkColor);
    PA.pixel(ctx, x - 1, y + 1, darkColor);
    PA.pixel(ctx, x + 1, y + 1, darkColor);

    // Skull
    PA.rect(ctx, x - 3, y - 7, 7, 5, boneColor);
    PA.rect(ctx, x - 2, y - 7, 5, 5, boneColor);

    // Eye sockets
    PA.rect(ctx, x - 2, y - 6, 2, 2, '#1a1a1a');
    PA.rect(ctx, x + 1, y - 6, 2, 2, '#1a1a1a');
    // Eye glow
    PA.pixel(ctx, x - 1, y - 5, C.SKELETON_EYE);
    PA.pixel(ctx, x + 1, y - 5, C.SKELETON_EYE);

    // Jaw
    PA.rect(ctx, x - 1, y - 3, 3, 1, darkColor);

    // Arms (bone)
    PA.pixel(ctx, x - 3, y - 1, boneColor);
    PA.pixel(ctx, x - 4, y, boneColor);
    PA.pixel(ctx, x + 3, y - 1, boneColor);
    PA.pixel(ctx, x + 4, y, boneColor);

    // Legs
    if (f < 2) {
      PA.rect(ctx, x - 2, y + 3, 1, 3, boneColor);
      PA.rect(ctx, x + 2, y + 3, 1, 3, boneColor);
    } else {
      PA.rect(ctx, x - 1, y + 3, 1, 3, boneColor);
      PA.rect(ctx, x + 1, y + 3, 1, 3, boneColor);
    }

    // Sword
    PA.pixel(ctx, x - 5, y + 1, '#888888');
    PA.pixel(ctx, x - 5, y, '#aaaaaa');
    PA.pixel(ctx, x - 5, y - 1, '#cccccc');
  },

  renderOrc(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const f = enemy.animFrame;
    const flash = enemy.flashTimer > 0;
    const skinColor = flash ? '#ffffff' : C.ORC_SKIN;
    const darkColor = flash ? '#dddddd' : C.ORC_DARK;

    // Large body with armor
    PA.rect(ctx, x - 4, y - 3, 9, 7, C.ORC_ARMOR);
    PA.rect(ctx, x - 3, y - 2, 7, 5, skinColor);

    // Head (large)
    PA.rect(ctx, x - 4, y - 8, 9, 5, skinColor);
    PA.rect(ctx, x - 3, y - 8, 7, 5, skinColor);

    // Brow
    PA.rect(ctx, x - 3, y - 8, 7, 1, darkColor);

    // Eyes (angry)
    PA.pixel(ctx, x - 2, y - 6, '#ff6600');
    PA.pixel(ctx, x + 2, y - 6, '#ff6600');

    // Tusks
    PA.pixel(ctx, x - 2, y - 4, '#e8e0d0');
    PA.pixel(ctx, x + 2, y - 4, '#e8e0d0');

    // Armor details
    PA.pixel(ctx, x - 4, y - 2, '#707880');
    PA.pixel(ctx, x + 4, y - 2, '#707880');
    PA.rect(ctx, x - 1, y - 3, 3, 1, '#808890');

    // Legs (thick)
    if (f === 0 || f === 2) {
      PA.rect(ctx, x - 3, y + 4, 3, 3, darkColor);
      PA.rect(ctx, x + 1, y + 4, 3, 3, darkColor);
    } else {
      PA.rect(ctx, x - 4, y + 4, 3, 3, darkColor);
      PA.rect(ctx, x + 2, y + 4, 3, 3, darkColor);
    }

    // Weapon (large axe)
    PA.rect(ctx, x + 5, y - 5, 1, 8, '#8b6914');
    PA.rect(ctx, x + 6, y - 5, 2, 3, '#aaaaaa');
    PA.pixel(ctx, x + 6, y - 6, '#cccccc');
  },

  renderSlime(ctx, enemy, x, y, time) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const flash = enemy.flashTimer > 0;
    const bodyColor = flash ? '#ffffff' : C.SLIME_BODY;
    const lightColor = flash ? '#eeeeee' : C.SLIME_LIGHT;
    const darkColor = flash ? '#dddddd' : C.SLIME_DARK;

    // Bouncing animation
    const bounce = Math.sin((time || 0) / 200 + enemy.x) * 1.5;
    const by = Math.round(y + bounce);

    // Body (blob shape)
    PA.rect(ctx, x - 3, by - 2, 7, 4, bodyColor);
    PA.rect(ctx, x - 4, by - 1, 9, 2, bodyColor);
    PA.rect(ctx, x - 2, by - 3, 5, 1, bodyColor);
    // Bottom (wider when squished)
    PA.rect(ctx, x - 4, by + 2, 9, 1, darkColor);

    // Highlight (glossy)
    PA.pixel(ctx, x - 1, by - 2, lightColor);
    PA.pixel(ctx, x, by - 3, lightColor);
    PA.pixel(ctx, x - 2, by - 1, lightColor);

    // Eyes
    PA.pixel(ctx, x - 2, by - 1, C.SLIME_EYE);
    PA.pixel(ctx, x + 1, by - 1, C.SLIME_EYE);
    PA.pixel(ctx, x - 2, by, '#000000');
    PA.pixel(ctx, x + 1, by, '#000000');

    // Transparency effect (scattered light pixels)
    PA.pixel(ctx, x + 2, by + 1, lightColor);
  },

  renderDeath(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const progress = enemy.deathTimer / 500;

    // Scatter pixels outward
    const rng = PA.seededRandom(Math.round(enemy.x * 100 + enemy.y));
    const baseColor = enemy.type.id === 'goblin' ? DK.COLORS.GOBLIN_SKIN :
                      enemy.type.id === 'skeleton' ? DK.COLORS.SKELETON_BONE :
                      enemy.type.id === 'orc' ? DK.COLORS.ORC_SKIN :
                      DK.COLORS.SLIME_BODY;

    for (let i = 0; i < 8; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = progress * 10 * (0.5 + rng() * 0.5);
      const px = Math.round(x + Math.cos(angle) * dist);
      const py = Math.round(y + Math.sin(angle) * dist);
      const alpha = 1 - progress;
      if (alpha > 0) {
        PA.pixel(ctx, px, py, baseColor);
      }
    }
  },

  renderHPBar(ctx, enemy, x, y) {
    const PA = DK.PixelArt;
    const hpPercent = enemy.hp / enemy.maxHp;
    const barWidth = 10;
    const barX = x - 5;
    const barY = y - 9;

    // Background
    PA.rect(ctx, barX, barY, barWidth, 2, '#1a1a1a');
    // HP fill
    const fillColor = hpPercent > 0.5 ? '#44aa44' :
                      hpPercent > 0.25 ? '#aaaa44' : '#aa4444';
    PA.rect(ctx, barX, barY, Math.ceil(barWidth * hpPercent), 2, fillColor);
    // Border pixels
    PA.pixel(ctx, barX - 1, barY, '#333333');
    PA.pixel(ctx, barX + barWidth, barY, '#333333');
  },
};
