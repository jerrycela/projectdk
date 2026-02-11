# 陷阱系統設計文件

## 設計理念

參考 Dungeon Warfare 3 的陷阱設計哲學：
- **多樣化觸發機制**：接觸型、定時型、範圍型、連鎖型
- **元素協同**：與英雄元素光環結合產生進化效果
- **戰術深度**：推擊、控場、AOE、單體爆發各有所長
- **視覺辨識**：每個陷阱有獨特的像素藝術風格

---

## 陷阱類型清單（7 種 + 4 種進化型）

### 1. 尖刺陷阱（Spike Trap）

**基礎屬性**
```javascript
SPIKE_TRAP: {
  id: 'spike_trap',
  name: '尖刺陷阱',
  description: '接觸型物理傷害，冷卻短但傷害中等',
  cost: 30,
  damage: 25,
  range: 0,
  cooldown: 800,
  type: 'floor',
  element: null,
  icon: 'spike_trap',
}
```

**視覺設計**
```javascript
renderFloorTrap(ctx, trap, x, y) {
  if (trap.type.id === 'spike_trap') {
    // 地板嵌入式金屬底座
    PA.rect(ctx, x + 2, y + 2, 12, 12, '#3a3a4a');
    PA.rect(ctx, x + 3, y + 3, 10, 10, '#4a4a5a');

    // 十字形尖刺槽
    PA.rect(ctx, x + 7, y + 2, 2, 12, '#2a2a3a');
    PA.rect(ctx, x + 2, y + 7, 12, 2, '#2a2a3a');

    // 角落鉚釘
    PA.pixel(ctx, x + 2, y + 2, '#7888a0');
    PA.pixel(ctx, x + 13, y + 2, '#7888a0');
    PA.pixel(ctx, x + 2, y + 13, '#7888a0');
    PA.pixel(ctx, x + 13, y + 13, '#7888a0');

    // 尖刺狀態（retracted / extended）
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;
    if (firing) {
      // Extended spikes (4 directions)
      PA.rect(ctx, x + 7, y + 1, 2, 3, '#b0b0c0'); // Top spike
      PA.rect(ctx, x + 7, y + 12, 2, 3, '#b0b0c0'); // Bottom
      PA.rect(ctx, x + 1, y + 7, 3, 2, '#b0b0c0'); // Left
      PA.rect(ctx, x + 12, y + 7, 3, 2, '#b0b0c0'); // Right

      // Spike tips (sharp points)
      PA.pixel(ctx, x + 7, y + 1, '#ffffff');
      PA.pixel(ctx, x + 8, y + 1, '#ffffff');
      PA.pixel(ctx, x + 7, y + 14, '#ffffff');
      PA.pixel(ctx, x + 1, y + 7, '#ffffff');
      PA.pixel(ctx, x + 14, y + 7, '#ffffff');

      // Blood stains
      if (trap.animFrame % 4 === 0) {
        PA.pixel(ctx, x + 6, y + 6, '#aa2020');
        PA.pixel(ctx, x + 9, y + 9, '#aa2020');
      }
    } else {
      // Retracted spikes (hidden in slots)
      PA.rect(ctx, x + 7, y + 3, 2, 2, '#808090');
      PA.rect(ctx, x + 7, y + 11, 2, 2, '#808090');
      PA.rect(ctx, x + 3, y + 7, 2, 2, '#808090');
      PA.rect(ctx, x + 11, y + 7, 2, 2, '#808090');
    }
  }
}
```

---

### 2. 箭塔（Arrow Tower）

**基礎屬性**
```javascript
ARROW_TOWER: {
  id: 'arrow_tower',
  name: '箭塔',
  description: '遠程攻擊，射程 3 格，中等傷害',
  cost: 50,
  damage: 30,
  range: 3,
  cooldown: 1500,
  type: 'wall',
  element: null,
  icon: 'arrow_tower',
}
```

**視覺設計**
```javascript
renderWallTrap(ctx, trap, x, y) {
  if (trap.type.id === 'arrow_tower') {
    const f = trap.facing || { dc: 0, dr: 1 };
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;

    // Stone tower base
    PA.rect(ctx, x + 2, y + 1, 12, 14, '#5a5a6e');
    PA.rect(ctx, x + 3, y + 2, 10, 12, '#6a6a7e');

    // Arrow slit (firing port)
    PA.rect(ctx, x + 6, y + 5, 4, 6, '#2a2a3a');
    PA.pixel(ctx, x + 6, y + 5, '#4a4a5a');
    PA.pixel(ctx, x + 9, y + 5, '#4a4a5a');

    // Stone blocks (texture)
    PA.rect(ctx, x + 3, y + 2, 10, 1, '#4a4a5a');
    PA.rect(ctx, x + 3, y + 6, 10, 1, '#4a4a5a');
    PA.rect(ctx, x + 3, y + 10, 10, 1, '#4a4a5a');

    // Crenellations (top)
    PA.rect(ctx, x + 2, y + 1, 3, 2, '#7a7a8e');
    PA.rect(ctx, x + 7, y + 1, 2, 2, '#7a7a8e');
    PA.rect(ctx, x + 11, y + 1, 3, 2, '#7a7a8e');

    // Firing arrow (when active)
    if (firing) {
      const arrowX = x + 7 + f.dc * 3;
      const arrowY = y + 7 + f.dr * 3;

      if (f.dc !== 0) {
        // Horizontal arrow
        PA.rect(ctx, arrowX, arrowY, 3, 1, '#8a6040');
        PA.pixel(ctx, arrowX + f.dc * 3, arrowY, '#b0b0c0'); // tip
      } else {
        // Vertical arrow
        PA.rect(ctx, arrowX, arrowY, 1, 3, '#8a6040');
        PA.pixel(ctx, arrowX, arrowY + f.dr * 3, '#b0b0c0'); // tip
      }
    }

    // Direction indicator (flag)
    const flagX = x + 11 + f.dc * 2;
    const flagY = y + 2 + f.dr * 2;
    PA.pixel(ctx, flagX, flagY, '#cc4444');
    PA.pixel(ctx, flagX + 1, flagY, '#cc4444');
  }
}
```

---

### 3. 火焰噴射器（Flame Thrower）

**基礎屬性**
```javascript
FLAME_THROWER: {
  id: 'flame_thrower',
  name: '火焰噴射器',
  description: '火焰 AOE，範圍 2 格錐形噴射',
  cost: 70,
  damage: 35,
  range: 2,
  cooldown: 2000,
  type: 'wall',
  element: 'fire',
  icon: 'flame_thrower',
}
```

**視覺設計**
```javascript
renderWallTrap(ctx, trap, x, y) {
  if (trap.type.id === 'flame_thrower') {
    const f = trap.facing || { dc: 0, dr: 1 };
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;

    // Copper housing
    PA.rect(ctx, x + 2, y + 1, 12, 14, '#8a5040');
    PA.rect(ctx, x + 3, y + 2, 10, 12, '#aa6050');

    // Fuel tank (center orb)
    PA.rect(ctx, x + 5, y + 5, 6, 6, '#cc5522');
    PA.rect(ctx, x + 6, y + 6, 4, 4, '#ff6622');
    PA.pixel(ctx, x + 6, y + 6, '#ffaa44'); // glow
    PA.pixel(ctx, x + 7, y + 6, '#ffaa44');

    // Nozzle (firing port)
    PA.rect(ctx, x + 6, y + 11, 4, 3, '#4a3028');
    PA.rect(ctx, x + 7, y + 12, 2, 2, '#2a1818');

    // Bolts and rivets
    PA.pixel(ctx, x + 2, y + 1, '#7888a0');
    PA.pixel(ctx, x + 13, y + 1, '#7888a0');
    PA.pixel(ctx, x + 2, y + 14, '#7888a0');
    PA.pixel(ctx, x + 13, y + 14, '#7888a0');

    // Flame effect (when firing)
    if (firing) {
      const flameX = x + 7 + f.dc * 6;
      const flameY = y + 7 + f.dr * 6;

      const frame = trap.animFrame;
      const flameColors = ['#ff6622', '#ffaa44', '#ff8833'];
      const color = flameColors[frame % 3];

      // Cone of fire
      PA.pixel(ctx, flameX, flameY, color);
      PA.pixel(ctx, flameX + 1, flameY, color);
      PA.pixel(ctx, flameX + f.dc, flameY + f.dr, '#ffaa44');
      PA.pixel(ctx, flameX - f.dr, flameY + f.dc, '#ff8833'); // perpendicular spread
      PA.pixel(ctx, flameX + f.dr, flameY - f.dc, '#ff8833');
    }

    // Charge indicator (fuel level)
    const chargeProgress = 1 - (trap.cooldownTimer / trap.type.cooldown);
    if (chargeProgress < 1) {
      const barY = y + 5 + Math.floor((1 - chargeProgress) * 6);
      PA.rect(ctx, x + 6, barY, 4, Math.floor(chargeProgress * 6), '#ff6622');
    }
  }
}
```

---

### 4. 毒氣陷阱（Poison Gas Trap）

**基礎屬性**
```javascript
POISON_GAS_TRAP: {
  id: 'poison_gas_trap',
  name: '毒氣陷阱',
  description: '接觸型觸發，3 秒毒雲持續 DOT',
  cost: 55,
  damage: 8,
  range: 0,
  cooldown: 3500,
  type: 'floor',
  element: 'poison',
  poisonDuration: 3000,
  poisonDotInterval: 300,
  poisonDotDamage: 8,
  icon: 'poison_gas_trap',
}
```

**視覺設計**
```javascript
renderFloorTrap(ctx, trap, x, y) {
  if (trap.type.id === 'poison_gas_trap') {
    // Brass pressure plate
    PA.rect(ctx, x + 2, y + 2, 12, 12, '#5a5a3a');
    PA.rect(ctx, x + 3, y + 3, 10, 10, '#6a6a4a');

    // Gas vents (4 cardinal directions)
    PA.rect(ctx, x + 7, y + 2, 2, 2, '#2a2a1a');
    PA.rect(ctx, x + 7, y + 12, 2, 2, '#2a2a1a');
    PA.rect(ctx, x + 2, y + 7, 2, 2, '#2a2a1a');
    PA.rect(ctx, x + 12, y + 7, 2, 2, '#2a2a1a');

    // Poison vial (center)
    PA.rect(ctx, x + 6, y + 6, 4, 4, '#44aa44');
    PA.rect(ctx, x + 7, y + 7, 2, 2, '#66cc66');
    PA.pixel(ctx, x + 7, y + 7, '#aaffaa'); // glow

    // Active gas cloud
    if (trap.active || trap.cooldownTimer > trap.type.cooldown * 0.5) {
      const frame = trap.animFrame;
      const gasColor = 'rgba(102,204,102,0.6)';

      // Animated gas particles
      if (frame % 2 === 0) {
        PA.pixel(ctx, x + 4, y + 4, gasColor);
        PA.pixel(ctx, x + 11, y + 4, gasColor);
        PA.pixel(ctx, x + 4, y + 11, gasColor);
        PA.pixel(ctx, x + 11, y + 11, gasColor);
      } else {
        PA.pixel(ctx, x + 5, y + 5, gasColor);
        PA.pixel(ctx, x + 10, y + 5, gasColor);
        PA.pixel(ctx, x + 5, y + 10, gasColor);
        PA.pixel(ctx, x + 10, y + 10, gasColor);
      }
    }
  }
}
```

**毒雲持續效果**
```javascript
// In traps.js update() method
if (trap.type.id === 'poison_gas_trap') {
  // Gas cloud active
  if (trap.gasCloudActive && trap.gasCloudTimer > 0) {
    trap.gasCloudTimer -= dt;
    trap.active = true;

    // Apply poison DOT to all enemies in the tile
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || !enemy.alive) continue;
      const ex = Math.floor(enemy.x / T);
      const ey = Math.floor(enemy.y / T);

      if (ex === trap.col && ey === trap.row) {
        if (!enemy.poisonTimer || enemy.poisonTimer <= 0) {
          enemy.poisonTimer = trap.type.poisonDuration;
          enemy.poisonDotInterval = trap.type.poisonDotInterval;
          enemy.poisonDotDamage = trap.type.poisonDotDamage;
        }
      }
    }

    // Cloud expires
    if (trap.gasCloudTimer <= 0) {
      trap.gasCloudActive = false;
      trap.active = false;
      trap.cooldownTimer = trap.type.cooldown;
    }
    continue;
  }

  // Cooldown
  if (trap.cooldownTimer > 0) {
    trap.cooldownTimer -= dt;
    trap.active = false;
    continue;
  }

  // Trigger check
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || !enemy.alive) continue;
    const ex = Math.floor(enemy.x / T);
    const ey = Math.floor(enemy.y / T);

    if (ex === trap.col && ey === trap.row) {
      trap.gasCloudTimer = trap.type.poisonDuration;
      trap.gasCloudActive = true;
      trap.flashTimer = 150;

      // Gas cloud visual effect
      if (DK.Game && DK.Game.effects) {
        DK.Game.effects.push({
          type: 'poison_cloud',
          x: trap.col * T + T / 2,
          y: trap.row * T + T / 2,
          radius: T * 0.8,
          duration: trap.type.poisonDuration,
          timer: 0,
        });
      }
      break;
    }
  }
  continue;
}
```

---

### 5. 電擊塔（Lightning Tower）

**基礎屬性**
```javascript
LIGHTNING_TOWER: {
  id: 'lightning_tower',
  name: '電擊塔',
  description: '鏈式閃電，彈跳至 3 個目標',
  cost: 85,
  damage: 28,
  range: 2.5,
  cooldown: 2200,
  type: 'wall',
  element: 'electric',
  chainTargets: 3,
  chainRange: 1.5,
  icon: 'lightning_tower',
}
```

**視覺設計**
```javascript
renderWallTrap(ctx, trap, x, y) {
  if (trap.type.id === 'lightning_tower') {
    const f = trap.facing || { dc: 0, dr: 1 };
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;

    // Crystal tower housing
    PA.rect(ctx, x + 2, y + 1, 12, 14, '#3a3a5a');
    PA.rect(ctx, x + 3, y + 2, 10, 12, '#4a4a6a');

    // Energy crystal (center)
    PA.rect(ctx, x + 5, y + 4, 6, 8, '#5a5a8a');
    PA.rect(ctx, x + 6, y + 5, 4, 6, '#7a7aaa');
    PA.rect(ctx, x + 7, y + 6, 2, 4, '#9a9acc');

    // Crystal facets
    PA.pixel(ctx, x + 6, y + 5, '#bbbcee');
    PA.pixel(ctx, x + 9, y + 5, '#bbbcee');
    PA.pixel(ctx, x + 7, y + 6, '#ffffff');

    // Discharge nodes (corners)
    PA.pixel(ctx, x + 2, y + 2, '#ffdd44');
    PA.pixel(ctx, x + 13, y + 2, '#ffdd44');
    PA.pixel(ctx, x + 2, y + 13, '#ffdd44');
    PA.pixel(ctx, x + 13, y + 13, '#ffdd44');

    // Charging effect
    const chargeProgress = 1 - (trap.cooldownTimer / trap.type.cooldown);
    if (chargeProgress > 0.7) {
      const glow = (chargeProgress - 0.7) / 0.3;
      const glowColor = `rgba(255,255,136,${glow})`;

      PA.pixel(ctx, x + 7, y + 7, glowColor);
      PA.pixel(ctx, x + 8, y + 8, glowColor);

      if (trap.animFrame % 2 === 0) {
        PA.pixel(ctx, x + 6, y + 6, '#ffffff');
        PA.pixel(ctx, x + 9, y + 9, '#ffffff');
      }
    }

    // Lightning bolt (when firing)
    if (firing) {
      const boltX = x + 7 + f.dc * 5;
      const boltY = y + 7 + f.dr * 5;

      // Jagged lightning path
      PA.pixel(ctx, boltX, boltY, '#ffffff');
      PA.pixel(ctx, boltX + 1, boltY, '#ffff88');
      PA.pixel(ctx, boltX + f.dc, boltY + f.dr, '#ffdd44');
      PA.pixel(ctx, boltX + f.dc + 1, boltY + f.dr + 1, '#ffff88');
    }
  }
}
```

**鏈式閃電邏輯**
```javascript
// In traps.js update() method
if (trap.type.id === 'lightning_tower') {
  if (trap.cooldownTimer > 0) {
    trap.cooldownTimer -= dt;
    continue;
  }

  const range = trap.type.range * T;
  let primaryTarget = null;
  let bestDist = range;

  // Find primary target
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || !enemy.alive) continue;
    const dx = enemy.x - trapCX;
    const dy = enemy.y - trapCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      primaryTarget = enemy;
    }
  }

  if (primaryTarget) {
    trap.active = true;
    trap.cooldownTimer = trap.type.cooldown;
    trap.flashTimer = 150;

    // Chain lightning sequence
    const chainedTargets = [primaryTarget];
    const chainRange = trap.type.chainRange * T;
    let currentTarget = primaryTarget;

    for (let i = 1; i < trap.type.chainTargets; i++) {
      let nextTarget = null;
      let closestDist = chainRange;

      for (const enemy of enemies) {
        if (enemy.hp <= 0 || !enemy.alive) continue;
        if (chainedTargets.includes(enemy)) continue;

        const dx = enemy.x - currentTarget.x;
        const dy = enemy.y - currentTarget.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
          closestDist = dist;
          nextTarget = enemy;
        }
      }

      if (!nextTarget) break;
      chainedTargets.push(nextTarget);
      currentTarget = nextTarget;
    }

    // Apply damage to all chained targets
    for (let i = 0; i < chainedTargets.length; i++) {
      const target = chainedTargets[i];
      const damageReduction = Math.pow(0.85, i); // 15% reduction per chain
      const damage = Math.round(trap.type.damage * damageReduction);

      target.hp -= damage;
      target.flashTimer = 150;

      // Apply electric element
      if (DK.Elements) {
        DK.Elements.applyElement(target, 'electric', { evolved: trap.evolved, evolutionType: trap.evolutionType });
      }

      // Damage number
      if (DK.Game && DK.Game.effects) {
        DK.Game.effects.push({
          type: 'damage',
          x: target.x,
          y: target.y - 8,
          text: `-${damage}`,
          color: '#ffff88',
          duration: 800,
          timer: 0,
        });
      }
    }

    // Lightning chain visual effect
    if (DK.Game && DK.Game.effects) {
      for (let i = 0; i < chainedTargets.length - 1; i++) {
        DK.Game.effects.push({
          type: 'lightning_chain',
          x: chainedTargets[i].x,
          y: chainedTargets[i].y,
          targetX: chainedTargets[i + 1].x,
          targetY: chainedTargets[i + 1].y,
          duration: 400,
          timer: 0,
        });
      }
    }
  } else {
    trap.active = false;
  }
  continue;
}
```

---

### 6. 滾石陷阱（Boulder Trap）

**基礎屬性**
```javascript
BOULDER_TRAP: {
  id: 'boulder_trap',
  name: '滾石陷阱',
  description: '定時釋放巨石碾壓並擊退敵人',
  cost: 65,
  damage: 50,
  range: 0,
  cooldown: 4000,
  type: 'wall',
  element: null,
  pushForce: 3,
  icon: 'boulder_trap',
}
```

**視覺設計**
```javascript
renderWallTrap(ctx, trap, x, y) {
  if (trap.type.id === 'boulder_trap') {
    const f = trap.facing || { dc: 0, dr: 1 };
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;

    // Stone chute (inclined ramp)
    PA.rect(ctx, x + 2, y + 1, 12, 14, '#5a5a6e');
    PA.rect(ctx, x + 3, y + 2, 10, 12, '#6a6a7e');

    // Chute opening (bottom)
    PA.rect(ctx, x + 4, y + 11, 8, 4, '#2a2a3a');
    PA.rect(ctx, x + 5, y + 12, 6, 3, '#1a1a2a');

    // Boulder (stored at top)
    if (!firing) {
      PA.rect(ctx, x + 5, y + 3, 6, 6, '#8a8090');
      PA.rect(ctx, x + 6, y + 4, 4, 4, '#aaa0b0');
      PA.pixel(ctx, x + 6, y + 4, '#ccc0d0'); // highlight
      PA.pixel(ctx, x + 7, y + 4, '#ccc0d0');

      // Cracks on boulder
      PA.pixel(ctx, x + 7, y + 5, '#6a6070');
      PA.pixel(ctx, x + 8, y + 6, '#6a6070');
    } else {
      // Boulder rolling out (mid position)
      PA.rect(ctx, x + 5, y + 8, 6, 6, '#8a8090');
      PA.rect(ctx, x + 6, y + 9, 4, 4, '#aaa0b0');
      PA.pixel(ctx, x + 6, y + 9, '#ccc0d0');

      // Motion blur
      PA.pixel(ctx, x + 4, y + 10, 'rgba(170,160,176,0.5)');
      PA.pixel(ctx, x + 11, y + 10, 'rgba(170,160,176,0.5)');
    }

    // Support rails
    PA.rect(ctx, x + 3, y + 2, 1, 12, '#4a4a5a');
    PA.rect(ctx, x + 12, y + 2, 1, 12, '#4a4a5a');

    // Warning sign (top corner)
    PA.pixel(ctx, x + 11, y + 2, '#ffaa44');
    PA.pixel(ctx, x + 12, y + 2, '#ffaa44');
    PA.pixel(ctx, x + 11, y + 3, '#ffaa44');
  }
}
```

**滾石發射邏輯**
```javascript
// In traps.js update() method
if (trap.type.id === 'boulder_trap') {
  if (trap.cooldownTimer > 0) {
    trap.cooldownTimer -= dt;
    trap.active = false;
  }

  if (trap.cooldownTimer <= 0) {
    trap.cooldownTimer = trap.type.cooldown;
    trap.active = true;
    trap.flashTimer = 150;
    this.fireBoulderTrap(trap, enemies, T);
  }
  continue;
}

// New method: fireBoulderTrap()
fireBoulderTrap(trap, enemies, T) {
  const facing = trap.facing;
  if (!facing) return;

  // Boulder travels 4 tiles in the facing direction
  const boulderPath = [];
  for (let i = 1; i <= 4; i++) {
    boulderPath.push({
      col: trap.col + facing.dc * i,
      row: trap.row + facing.dr * i,
    });
  }

  // Damage and push enemies in path
  for (const tile of boulderPath) {
    for (const enemy of enemies) {
      if (enemy.hp <= 0 || !enemy.alive) continue;
      const ex = Math.floor(enemy.x / T);
      const ey = Math.floor(enemy.y / T);

      if (ex === tile.col && ey === tile.row) {
        // Damage
        enemy.hp -= trap.type.damage;
        enemy.flashTimer = 150;

        // Knockback
        const mass = enemy.type.mass || 1;
        if (trap.type.pushForce >= mass) {
          const targetCol = tile.col + facing.dc;
          const targetRow = tile.row + facing.dr;
          const isAbyss = DK.Map.isAbyss(targetCol, targetRow);
          const isPath = DK.Map.isPath(targetCol, targetRow);

          if (isAbyss || isPath) {
            enemy.pushed = {
              startX: enemy.x,
              startY: enemy.y,
              targetX: targetCol * T + T / 2,
              targetY: targetRow * T + T / 2,
              timer: 0,
              duration: 200,
              intoAbyss: isAbyss,
            };
          }
        }

        // Damage number
        if (DK.Game && DK.Game.effects) {
          DK.Game.effects.push({
            type: 'damage',
            x: enemy.x,
            y: enemy.y - 8,
            text: `-${trap.type.damage}`,
            color: '#cc8866',
            duration: 800,
            timer: 0,
          });
        }
      }
    }
  }

  // Boulder rolling visual effect
  if (DK.Game && DK.Game.effects) {
    DK.Game.effects.push({
      type: 'boulder_roll',
      x: trap.col * T + T / 2,
      y: trap.row * T + T / 2,
      dx: facing.dc,
      dy: facing.dr,
      distance: 4 * T,
      duration: 1200,
      timer: 0,
    });
  }

  // Screen shake
  if (DK.Game) {
    DK.Game.screenShake = { intensity: 4, timer: 300 };
  }
}
```

---

### 7. 鐘擺刀（Pendulum Blade）

**基礎屬性**
```javascript
PENDULUM_BLADE: {
  id: 'pendulum_blade',
  name: '鐘擺刀',
  description: '範圍斬擊，攻擊正面 3 格扇形區域',
  cost: 60,
  damage: 40,
  range: 1.5,
  cooldown: 2500,
  type: 'wall',
  element: null,
  sweepAngle: 90, // degrees
  icon: 'pendulum_blade',
}
```

**視覺設計**
```javascript
renderWallTrap(ctx, trap, x, y) {
  if (trap.type.id === 'pendulum_blade') {
    const f = trap.facing || { dc: 0, dr: 1 };
    const firing = trap.active || trap.cooldownTimer > trap.type.cooldown * 0.6;

    // Stone housing
    PA.rect(ctx, x + 2, y + 1, 12, 14, '#5a5a6e');
    PA.rect(ctx, x + 3, y + 2, 10, 12, '#6a6a7e');

    // Chain anchor (top)
    PA.rect(ctx, x + 7, y + 2, 2, 4, '#4a4a5a');
    PA.pixel(ctx, x + 7, y + 2, '#7888a0');
    PA.pixel(ctx, x + 8, y + 2, '#7888a0');

    // Blade pendulum
    const swingPhase = firing ? (trap.animFrame % 4) / 4 : 0.5;
    const swingAngle = (swingPhase - 0.5) * Math.PI / 3; // ±60°

    const chainLength = 6;
    const bladeX = x + 8 + Math.sin(swingAngle) * chainLength;
    const bladeY = y + 6 + Math.cos(swingAngle) * chainLength;

    // Chain
    PA.pixel(ctx, x + 8, y + 3, '#6a6a7a');
    PA.pixel(ctx, x + 8, y + 4, '#6a6a7a');
    PA.pixel(ctx, bladeX, bladeY - 1, '#6a6a7a');

    // Blade
    PA.rect(ctx, bladeX - 1, bladeY, 3, 4, '#b0b0c0');
    PA.rect(ctx, bladeX, bladeY, 1, 5, '#d0d0e0');
    PA.pixel(ctx, bladeX, bladeY + 4, '#ffffff'); // sharp tip

    // Blood stains (if recently used)
    if (firing) {
      PA.pixel(ctx, bladeX, bladeY + 2, '#aa2020');
    }

    // Motion blur
    if (firing && Math.abs(swingAngle) > 0.3) {
      const prevX = bladeX - Math.cos(swingAngle) * 2;
      const prevY = bladeY + Math.sin(swingAngle) * 2;
      PA.pixel(ctx, prevX, prevY, 'rgba(176,176,192,0.5)');
    }
  }
}
```

**扇形範圍攻擊邏輯**
```javascript
// In traps.js update() method
if (trap.type.id === 'pendulum_blade') {
  if (trap.cooldownTimer > 0) {
    trap.cooldownTimer -= dt;
    trap.active = false;
    continue;
  }

  const range = trap.type.range * T;
  const facing = trap.facing;
  if (!facing) continue;

  // Check for enemies in sweep area
  let hitAny = false;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || !enemy.alive) continue;

    // Distance check
    const dx = enemy.x - trapCX;
    const dy = enemy.y - trapCY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > range) continue;

    // Angle check (90° cone in facing direction)
    const facingAngle = Math.atan2(facing.dr, facing.dc);
    const enemyAngle = Math.atan2(dy, dx);
    let angleDiff = Math.abs(facingAngle - enemyAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

    const sweepHalfAngle = (trap.type.sweepAngle / 2) * Math.PI / 180;
    if (angleDiff <= sweepHalfAngle) {
      // Hit!
      enemy.hp -= trap.type.damage;
      enemy.flashTimer = 150;
      hitAny = true;

      // Damage number
      if (DK.Game && DK.Game.effects) {
        DK.Game.effects.push({
          type: 'damage',
          x: enemy.x,
          y: enemy.y - 8,
          text: `-${trap.type.damage}`,
          color: '#cc6666',
          duration: 800,
          timer: 0,
        });
      }
    }
  }

  if (hitAny) {
    trap.active = true;
    trap.cooldownTimer = trap.type.cooldown;
    trap.flashTimer = 150;

    // Slash visual effect
    if (DK.Game && DK.Game.effects) {
      DK.Game.effects.push({
        type: 'blade_sweep',
        x: trapCX,
        y: trapCY,
        facing: facing,
        angle: trap.type.sweepAngle,
        range: range,
        duration: 600,
        timer: 0,
      });
    }
  }
  continue;
}
```

---

## 進化型陷阱（4 種新增）

### 1. 毀滅尖刺（Doom Spikes）- 尖刺陷阱進化

```javascript
DOOM_SPIKES: {
  baseTrap: 'spike_trap',
  name: '毀滅尖刺',
  cost: 50,
  requiredHeroElement: 'death', // 假設有死亡元素英雄
  description: '傷害+60%、冷卻-30%、擊殺後回復 10 金',
  damageMultiplier: 1.6,
  cooldownMultiplier: 0.7,
  killBounty: 10,
}
```

### 2. 連射箭塔（Rapid Fire Tower）- 箭塔進化

```javascript
RAPID_FIRE_TOWER: {
  baseTrap: 'arrow_tower',
  name: '連射箭塔',
  cost: 80,
  requiredHeroElement: 'wind', // 假設有風元素英雄
  description: '一次射出 3 箭、射程+1、冷卻+20%',
  multiShot: 3,
  rangeBonus: 1,
  cooldownMultiplier: 1.2,
}
```

### 3. 劇毒雲（Toxic Miasma）- 毒氣陷阱進化

```javascript
TOXIC_MIASMA: {
  baseTrap: 'poison_gas_trap',
  name: '劇毒雲',
  cost: 90,
  requiredHeroElement: 'poison',
  description: '九宮格毒雲、DOT 傷害+100%、緩速 40%',
  areaSize: 3, // 3x3 grid
  dotMultiplier: 2.0,
  slowFactor: 0.6, // 40% slow
}
```

### 4. 碎石崩落（Avalanche Trap）- 滾石陷阱進化

```javascript
AVALANCHE_TRAP: {
  baseTrap: 'boulder_trap',
  name: '碎石崩落',
  cost: 100,
  requiredHeroElement: 'earth', // 假設有地元素英雄
  description: '連續釋放 3 顆巨石、每顆傷害+20%',
  boulderCount: 3,
  damageMultiplier: 1.2,
  stunDuration: 800,
}
```

---

## 編輯器整合

### 1. 陷阱放置邏輯

```javascript
// In UI.js - Add to placeSelectedTrap()
placeSelectedTrap() {
  if (!this.selectedTrapType) return;

  const hoveredTile = this.getHoveredTile();
  if (!hoveredTile) return;

  const trapDef = Object.values(DK.TRAP_TYPES).find(t => t.id === this.selectedTrapType);
  if (!trapDef) return;

  // Check gold
  if (DK.Game.gold < trapDef.cost) {
    this.showMessage('金幣不足！');
    return;
  }

  // Place trap
  const placed = DK.Traps.place(this.selectedTrapType, hoveredTile.col, hoveredTile.row);
  if (placed) {
    DK.Game.gold -= trapDef.cost;
    this.showMessage(`放置 ${trapDef.name} (-${trapDef.cost} 金)`);
  } else {
    this.showMessage('無法放置陷阱！');
  }
}
```

### 2. 陷阱屬性配置面板

```javascript
// In UI.js - renderTrapInfo()
renderTrapInfo(ctx, trap) {
  const T = DK.CONFIG.TILE_SIZE;
  const trapDef = trap.type;

  // Info panel (bottom-right corner)
  const panelX = DK.CONFIG.DISPLAY_WIDTH - 220;
  const panelY = DK.CONFIG.UI_TOP + 10;
  const panelW = 210;
  const panelH = 80;

  // Background
  ctx.fillStyle = DK.COLORS.UI_PANEL;
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = DK.COLORS.UI_BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // Title
  ctx.fillStyle = DK.COLORS.UI_TEXT;
  ctx.font = 'bold 14px monospace';
  ctx.fillText(trapDef.name, panelX + 10, panelY + 20);

  // Stats
  ctx.font = '12px monospace';
  ctx.fillStyle = DK.COLORS.UI_TEXT_DIM;

  let line = 35;
  ctx.fillText(`傷害: ${trapDef.damage}`, panelX + 10, panelY + line);
  line += 15;
  ctx.fillText(`射程: ${trapDef.range}`, panelX + 10, panelY + line);
  line += 15;
  ctx.fillText(`冷卻: ${trapDef.cooldown}ms`, panelX + 10, panelY + line);

  // Special properties
  if (trapDef.element) {
    line += 15;
    ctx.fillStyle = DK.COLORS.ELEMENT_FIRE; // Color by element
    ctx.fillText(`元素: ${trapDef.element}`, panelX + 10, panelY + line);
  }
}
```

### 3. 陷阱圖示渲染（UI 面板）

```javascript
// In UI.js - renderTrapIcon()
renderTrapIcon(ctx, trapId, x, y, size) {
  const trapDef = Object.values(DK.TRAP_TYPES).find(t => t.id === trapId);
  if (!trapDef) return;

  // Simplified icon rendering
  ctx.save();
  ctx.translate(x, y);

  switch (trapId) {
    case 'spike_trap':
      // Mini spike icon
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(2, 2, size - 4, size - 4);
      ctx.fillStyle = '#b0b0c0';
      ctx.fillRect(size / 2 - 1, 4, 2, 6); // spike
      break;

    case 'arrow_tower':
      // Mini tower icon
      ctx.fillStyle = '#6a6a7e';
      ctx.fillRect(4, 4, size - 8, size - 8);
      ctx.fillStyle = '#cc4444';
      ctx.fillRect(size - 6, 4, 3, 2); // flag
      break;

    case 'flame_thrower':
      // Mini flame icon
      ctx.fillStyle = '#aa6050';
      ctx.fillRect(4, 4, size - 8, size - 8);
      ctx.fillStyle = '#ff6622';
      ctx.fillRect(size / 2 - 2, size / 2 - 2, 4, 4); // fuel
      break;

    case 'poison_gas_trap':
      // Mini vial icon
      ctx.fillStyle = '#6a6a4a';
      ctx.fillRect(4, 4, size - 8, size - 8);
      ctx.fillStyle = '#66cc66';
      ctx.fillRect(size / 2 - 2, size / 2 - 2, 4, 4); // poison
      break;

    case 'lightning_tower':
      // Mini crystal icon
      ctx.fillStyle = '#4a4a6a';
      ctx.fillRect(4, 4, size - 8, size - 8);
      ctx.fillStyle = '#9a9acc';
      ctx.fillRect(size / 2 - 2, size / 2 - 2, 4, 4); // crystal
      break;

    case 'boulder_trap':
      // Mini boulder icon
      ctx.fillStyle = '#6a6a7e';
      ctx.fillRect(4, 4, size - 8, size - 8);
      ctx.fillStyle = '#aaa0b0';
      ctx.fillRect(size / 2 - 3, size / 2 - 3, 6, 6); // boulder
      break;

    case 'pendulum_blade':
      // Mini blade icon
      ctx.fillStyle = '#6a6a7e';
      ctx.fillRect(4, 4, size - 8, size - 8);
      ctx.fillStyle = '#d0d0e0';
      ctx.fillRect(size / 2 - 1, 6, 2, size - 12); // blade
      break;
  }

  ctx.restore();
}
```

---

## 特效渲染器（main.js 新增）

### 1. 毒雲特效

```javascript
// In main.js - renderEffects()
if (effect.type === 'poison_cloud') {
  const progress = effect.timer / effect.duration;
  const alpha = Math.sin(progress * Math.PI) * 0.6;
  const radius = effect.radius * (1 + progress * 0.2);

  // Outer cloud
  offCtx.beginPath();
  offCtx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
  offCtx.fillStyle = `rgba(102,204,102,${alpha * 0.4})`;
  offCtx.fill();

  // Inner toxic core
  offCtx.beginPath();
  offCtx.arc(effect.x, effect.y, radius * 0.6, 0, Math.PI * 2);
  offCtx.fillStyle = `rgba(68,170,68,${alpha * 0.6})`;
  offCtx.fill();

  // Poison particles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + effect.timer / 100;
    const dist = radius * 0.7;
    const px = effect.x + Math.cos(angle) * dist;
    const py = effect.y + Math.sin(angle) * dist;
    PA.pixel(offCtx, px, py, `rgba(170,255,170,${alpha})`);
  }
}
```

### 2. 閃電鏈特效

```javascript
// In main.js - renderEffects()
if (effect.type === 'lightning_chain') {
  const progress = effect.timer / effect.duration;
  const alpha = 1 - progress;

  // Jagged lightning bolt
  const dx = effect.targetX - effect.x;
  const dy = effect.targetY - effect.y;
  const steps = 5;

  offCtx.strokeStyle = `rgba(255,255,136,${alpha})`;
  offCtx.lineWidth = 1;
  offCtx.beginPath();
  offCtx.moveTo(effect.x, effect.y);

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const jitter = (Math.random() - 0.5) * 4;
    const x = effect.x + dx * t + jitter;
    const y = effect.y + dy * t + jitter;
    offCtx.lineTo(x, y);
  }
  offCtx.lineTo(effect.targetX, effect.targetY);
  offCtx.stroke();

  // Glow
  offCtx.strokeStyle = `rgba(255,221,68,${alpha * 0.5})`;
  offCtx.lineWidth = 2;
  offCtx.stroke();
}
```

### 3. 滾石特效

```javascript
// In main.js - renderEffects()
if (effect.type === 'boulder_roll') {
  const progress = effect.timer / effect.duration;
  const traveled = progress * effect.distance;

  const bx = effect.x + effect.dx * traveled;
  const by = effect.y + effect.dy * traveled;

  // Boulder
  PA.rect(offCtx, bx - 4, by - 4, 8, 8, '#8a8090');
  PA.rect(offCtx, bx - 3, by - 3, 6, 6, '#aaa0b0');
  PA.pixel(offCtx, bx - 3, by - 3, '#ccc0d0');

  // Rotation effect (cracks spinning)
  const rotation = effect.timer / 50;
  PA.pixel(offCtx, bx + Math.cos(rotation) * 2, by + Math.sin(rotation) * 2, '#6a6070');

  // Dust trail
  for (let i = 1; i <= 3; i++) {
    const dustAlpha = (1 - progress) * 0.4 / i;
    const dustX = bx - effect.dx * i * 3;
    const dustY = by - effect.dy * i * 3;
    offCtx.fillStyle = `rgba(138,128,144,${dustAlpha})`;
    offCtx.fillRect(dustX - 1, dustY - 1, 2, 2);
  }
}
```

### 4. 刀刃掃擊特效

```javascript
// In main.js - renderEffects()
if (effect.type === 'blade_sweep') {
  const progress = effect.timer / effect.duration;
  const alpha = Math.sin(progress * Math.PI) * 0.6;

  const facingAngle = Math.atan2(effect.facing.dr, effect.facing.dc);
  const sweepHalfAngle = (effect.angle / 2) * Math.PI / 180;

  // Arc sweep
  offCtx.beginPath();
  offCtx.arc(
    effect.x,
    effect.y,
    effect.range,
    facingAngle - sweepHalfAngle,
    facingAngle + sweepHalfAngle
  );
  offCtx.lineTo(effect.x, effect.y);
  offCtx.closePath();
  offCtx.fillStyle = `rgba(204,102,102,${alpha * 0.3})`;
  offCtx.fill();

  // Slash line
  const slashAngle = facingAngle + (progress - 0.5) * sweepHalfAngle * 2;
  const slashX = effect.x + Math.cos(slashAngle) * effect.range;
  const slashY = effect.y + Math.sin(slashAngle) * effect.range;

  offCtx.strokeStyle = `rgba(255,255,255,${alpha})`;
  offCtx.lineWidth = 1;
  offCtx.beginPath();
  offCtx.moveTo(effect.x, effect.y);
  offCtx.lineTo(slashX, slashY);
  offCtx.stroke();
}
```

---

## 數據平衡表

| 陷阱 | 成本 | DPS (理論) | 射程 | 特殊能力 | 推薦用途 |
|------|------|-----------|------|---------|---------|
| 尖刺陷阱 | 30 | 31.25 | 0 | 無 | 路徑封鎖、低成本鋪陣 |
| 箭塔 | 50 | 20 | 3 | 無 | 遠程狙擊、彈性部署 |
| 火焰噴射器 | 70 | 17.5 | 2 | 火元素 AOE | 元素反應、群體傷害 |
| 毒氣陷阱 | 55 | ~26 (DOT) | 0 | 持續 DOT | 持續輸出、緩速控場 |
| 電擊塔 | 85 | ~38 (連鎖) | 2.5 | 3 目標連鎖 | 群體電擊、感電觸發 |
| 滾石陷阱 | 65 | 12.5 | 0 | 高傷害 + 擊退 | 深淵推落、大型敵 |
| 鐘擺刀 | 60 | 16 | 1.5 | 扇形 AOE | 路口防守、範圍清場 |

**DPS 計算公式**: `DPS = (傷害 × 目標數) / (冷卻時間 / 1000)`

---

## 實作檢查清單

### Phase 1: 基礎陷阱（3 種）
- [ ] 尖刺陷阱 - 數據配置、渲染、觸發邏輯
- [ ] 箭塔 - 數據配置、渲染、投射物邏輯
- [ ] 毒氣陷阱 - 數據配置、渲染、DOT 系統

### Phase 2: 進階陷阱（4 種）
- [ ] 火焰噴射器 - 數據配置、渲染、AOE 邏輯
- [ ] 電擊塔 - 數據配置、渲染、連鎖系統
- [ ] 滾石陷阱 - 數據配置、渲染、發射邏輯
- [ ] 鐘擺刀 - 數據配置、渲染、扇形判定

### Phase 3: 進化系統
- [ ] 4 種進化型定義
- [ ] 光環進化觸發邏輯
- [ ] 進化視覺強化

### Phase 4: 特效渲染
- [ ] 毒雲特效
- [ ] 閃電鏈特效
- [ ] 滾石特效
- [ ] 刀刃掃擊特效

### Phase 5: 編輯器整合
- [ ] 陷阱選擇 UI
- [ ] 放置邏輯整合
- [ ] 屬性面板顯示
- [ ] 圖示渲染

### Phase 6: 測試與平衡
- [ ] 單一陷阱功能測試
- [ ] 組合陷阱戰術測試
- [ ] DPS 數值平衡調整
- [ ] 視覺效果迭代優化

---

## 迭代優化建議

### Iteration 1-3: 核心機制
- 確保每個陷阱的基礎觸發邏輯正確
- 驗證傷害計算、冷卻機制
- 完善碰撞判定

### Iteration 4-6: 視覺表現
- 優化像素藝術細節
- 增強特效視覺衝擊
- 統一藝術風格

### Iteration 7-9: 戰術深度
- 調整數值平衡
- 測試陷阱組合 Combo
- 驗證進化系統協同

### Iteration 10: 拋光完善
- 性能優化
- 邊緣案例修復
- 最終數值微調

---

## 總結

本設計提供了 **7 種基礎陷阱 + 4 種進化型**，涵蓋：
- **觸發類型**：接觸型（尖刺、毒氣）、定時型（滾石）、範圍型（箭塔、電擊塔）
- **元素協同**：火焰、電擊、毒素、物理
- **戰術定位**：單體爆發、群體 AOE、控場推擊、持續 DOT
- **視覺風格**：像素藝術、金屬質感、能量特效、機械動態

所有設計遵循 ProjectDK 的現有架構，可直接整合至 `traps.js`、`config.js`、`main.js` 中。
