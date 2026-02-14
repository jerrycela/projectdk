/**
 * Dungeon Keep - Effect Renderer System
 * All visual effects: projectiles, explosions, status effects, etc.
 */
window.DK = window.DK || {};

DK.EffectRenderer = {
  /**
   * 主效果渲染器 - 渲染所有遊戲效果
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   */
  render(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;

    for (const effect of DK.Game.effects) {
      const progress = effect.timer / effect.duration;

      switch (effect.type) {
        case 'projectile': this._projectile(ctx, PA, C, effect, progress); break;
        case 'oil_splat': this._oilSplat(ctx, PA, effect, progress); break;
        case 'electrocute_burst': this._electrocuteBurst(ctx, PA, effect, progress); break;
        case 'chain_lightning': this._chainLightning(ctx, PA, effect, progress); break;
        case 'water_nova': this._waterNova(ctx, PA, effect, progress); break;
        case 'water_splash': this._waterSplash(ctx, PA, effect, progress); break;
        case 'push_wave': this._pushWave(ctx, PA, effect, progress); break;
        case 'abyss_fall': this._abyssFall(ctx, PA, effect, progress); break;
        case 'oil_ignite_burst': this._oilIgniteBurst(ctx, PA, effect, progress); break;
        case 'oil_splash': this._oilSplash(ctx, PA, effect, progress); break;
        case 'fire_splash': this._fireSplash(ctx, PA, effect, progress); break;
        case 'fire_nova': this._fireNova(ctx, PA, effect, progress); break;
        case 'burn_status': this._burnStatus(ctx, PA, effect, progress); break;
        case 'blizzard_zone': this._blizzardZone(ctx, PA, effect, progress); break;
        case 'evolution_burst': this._evolutionBurst(ctx, PA, effect, progress); break;
        case 'stun_wave': this._stunWave(ctx, PA, effect, progress); break;
        case 'gold_sparkle': this._goldSparkle(ctx, PA, effect, progress); break;
        case 'hero_deploy': this._heroDeploy(ctx, PA, effect, progress); break;
        case 'hero_recall': this._heroRecall(ctx, PA, effect, progress); break;
        case 'wall_break': this._wallBreak(ctx, PA, effect, progress); break;
        case 'halo': this._halo(ctx, PA, effect, progress); break;
        case 'trap_range_highlight': this._trapRangeHighlight(ctx, PA, effect, progress); break;
        case 'barricade_shatter': {
          if (progress > 1) break;

          // 4-6 個石磚碎片飛散
          const bsFragments = [
            { dx: -3, dy: -4, r: 0.3 },
            { dx: 4, dy: -3, r: 0.5 },
            { dx: -2, dy: 3, r: 0.7 },
            { dx: 3, dy: 2, r: 0.4 },
            { dx: -5, dy: 0, r: 0.6 },
            { dx: 1, dy: -5, r: 0.2 },
          ];

          const bsAlpha = 1 - progress;
          for (const frag of bsFragments) {
            const fx = effect.x + frag.dx * progress * 8;
            const fy = effect.y + frag.dy * progress * 8 + progress * progress * 4; // 重力
            ctx.fillStyle = `rgba(90,90,110,${bsAlpha})`;
            ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 2, 2);
            // 較亮碎片
            ctx.fillStyle = `rgba(122,122,142,${bsAlpha * 0.7})`;
            ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
          }
          break;
        }
        case 'door_shatter': {
          if (progress > 1) break;

          // 6-8 個門碎片飛散（門比路障碎片更多更大）
          const dsFragments = [
            { dx: -4, dy: -5, r: 0.3 },
            { dx: 5, dy: -4, r: 0.5 },
            { dx: -3, dy: 4, r: 0.7 },
            { dx: 4, dy: 3, r: 0.4 },
            { dx: -6, dy: -1, r: 0.6 },
            { dx: 2, dy: -6, r: 0.2 },
            { dx: -2, dy: 2, r: 0.8 },
            { dx: 1, dy: 5, r: 0.35 },
          ];

          const dsAlpha = 1 - progress;
          for (const frag of dsFragments) {
            const fx = effect.x + frag.dx * progress * 10;
            const fy = effect.y + frag.dy * progress * 10 + progress * progress * 5; // 重力

            // 門碎片：混合木質、金屬、魔法顏色
            // 主色（褐色木質）
            ctx.fillStyle = `rgba(106,80,64,${dsAlpha})`;
            ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 3);
            // 高光（金屬/魔法光澤）
            ctx.fillStyle = `rgba(170,68,255,${dsAlpha * 0.5})`;
            ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
          }
          break;
        }
        case 'damage':
        case 'gold':
        case 'float_text':
        case 'reaction_text':
          break; // Rendered on UI canvas
      }
    }
  },

  // === 效果子渲染器（私有方法，使用 _ 前綴）===

  _projectile(ctx, PA, C, effect, progress) {
    const t = Math.min(1, progress * 3);
    const px = effect.x + (effect.targetX - effect.x) * t;
    const py = effect.y + (effect.targetY - effect.y) * t;
    const ipx = Math.round(px);
    const ipy = Math.round(py);

    // Direction for trail
    const dx = effect.targetX - effect.x;
    const dy = effect.targetY - effect.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = -dx / len;
    const ny = -dy / len;

    if (effect.trapType === 'fire_bolt') {
      // Fire bolt from fire mage: orange-red fireball
      PA.pixel(ctx, ipx, ipy, '#ffffff');
      PA.pixel(ctx, ipx + 1, ipy, '#ffaa44');
      PA.pixel(ctx, ipx - 1, ipy, '#ffaa44');
      PA.pixel(ctx, ipx, ipy - 1, '#ff6622');
      PA.pixel(ctx, ipx, ipy + 1, '#ff6622');
      // Fire trail - 5 pixels with decay
      const trailColors = ['#ff6622', '#cc4400', '#882200', '#551100', '#330800'];
      for (let i = 2; i < 7; i++) {
        PA.pixel(ctx, ipx + Math.round(nx * i), ipy + Math.round(ny * i),
                 trailColors[Math.min(i - 2, 4)]);
      }
      // Sparks
      if (Math.random() > 0.4) {
        PA.pixel(ctx, ipx + Math.round((Math.random() - 0.5) * 3),
                 ipy + Math.round((Math.random() - 0.5) * 3), '#ffcc44');
      }
      // Impact micro-burst at arrival
      if (t >= 1) {
        for (let i = 0; i < 3; i++) {
          const sa = Math.random() * Math.PI * 2;
          const sd = 1 + Math.random() * 2;
          PA.pixel(ctx, ipx + Math.round(Math.cos(sa) * sd),
                   ipy + Math.round(Math.sin(sa) * sd),
                   i === 0 ? '#ffcc44' : '#ff6622');
        }
      }
    } else if (effect.trapType === 'ice_bolt') {
      // Ice bolt: cyan-white ice shard
      PA.pixel(ctx, ipx, ipy, '#ffffff');
      PA.pixel(ctx, ipx - 1, ipy, '#aaddee');
      PA.pixel(ctx, ipx + 1, ipy, '#aaddee');
      PA.pixel(ctx, ipx, ipy - 1, '#64c8f0');
      PA.pixel(ctx, ipx, ipy + 1, '#64c8f0');
      // Ice crystal trail
      for (let i = 2; i < 5; i++) {
        const tx = ipx + Math.round(nx * i);
        const ty = ipy + Math.round(ny * i);
        PA.pixel(ctx, tx, ty, i < 3 ? '#64c8f0' : '#3399aa');
        if (i < 4 && Math.random() > 0.5) {
          PA.pixel(ctx, tx + Math.round((Math.random() - 0.5) * 2),
                   ty + Math.round((Math.random() - 0.5) * 2), '#cceeff');
        }
      }
      // Frost sparkle
      if (t >= 1) {
        for (let i = 0; i < 3; i++) {
          const sa = Math.random() * Math.PI * 2;
          const sd = 1 + Math.random() * 2;
          PA.pixel(ctx, ipx + Math.round(Math.cos(sa) * sd),
                   ipy + Math.round(Math.sin(sa) * sd), '#cceeff');
        }
      }
    } else if (effect.trapType === 'water_bolt') {
      // Water bolt: blue water sphere
      PA.pixel(ctx, ipx, ipy, '#ffffff');
      PA.pixel(ctx, ipx - 1, ipy, '#66aaff');
      PA.pixel(ctx, ipx + 1, ipy, '#66aaff');
      PA.pixel(ctx, ipx, ipy - 1, '#4488ff');
      PA.pixel(ctx, ipx, ipy + 1, '#4488ff');
      // Water trail - teardrop shape (wide to narrow)
      for (let i = 2; i < 5; i++) {
        const tx = ipx + Math.round(nx * i);
        const ty = ipy + Math.round(ny * i);
        PA.pixel(ctx, tx, ty, i < 3 ? '#4488ff' : '#2266cc');
        if (i < 3) {
          PA.pixel(ctx, tx + Math.round(ny), ty + Math.round(-nx), '#3377dd');
        }
      }
      // Splash sparkle
      if (Math.random() > 0.5) {
        PA.pixel(ctx, ipx + Math.round((Math.random() - 0.5) * 3),
                 ipy + Math.round((Math.random() - 0.5) * 3), '#88ccff');
      }
      // Impact micro-burst at arrival
      if (t >= 1) {
        for (let i = 0; i < 2; i++) {
          const sa = Math.random() * Math.PI * 2;
          const sd = 1 + Math.random() * 2;
          PA.pixel(ctx, ipx + Math.round(Math.cos(sa) * sd),
                   ipy + Math.round(Math.sin(sa) * sd), '#88ccff');
        }
      }
    } else {
      // Generic projectile: metal bolt
      PA.pixel(ctx, ipx, ipy, '#d0d8e0');
      PA.pixel(ctx, ipx + Math.round(nx), ipy + Math.round(ny), C.TRAP_METAL_LIGHT);
      PA.pixel(ctx, ipx + Math.round(nx * 2), ipy + Math.round(ny * 2), C.TRAP_METAL);
      PA.pixel(ctx, ipx + Math.round(nx * 3), ipy + Math.round(ny * 3), C.TRAP_METAL_DARK);
    }
  },

  _oilSplat(ctx, PA, effect, progress) {
    // 油漬噴灑 — 深褐色油滴從中心向外濺射
    const splatR = (effect.radius || 8) * progress;
    const splatFade = 1 - progress;

    if (splatFade > 0.1) {
      // 中心油漬擴散
      if (progress < 0.5) {
        const coreR = splatR * 0.6;
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                 Math.max(1, Math.round(coreR)), '#2a2010');
      }

      // 4-6 個油滴粒子向外飛濺
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + progress * 1.5;
        const r = splatR * (0.6 + Math.random() * 0.4);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r);
        const color = Math.random() > 0.5 ? '#3a2810' : '#5a4020';
        PA.pixel(ctx, spx, spy, color);
        // 油滴拖尾
        if (progress < 0.6) {
          const trailR = r * 0.5;
          PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * trailR),
                   Math.round(effect.y + Math.sin(angle) * trailR), '#2a2010');
        }
      }

      // 油光閃爍
      if (progress < 0.3) {
        PA.pixel(ctx, Math.round(effect.x + 1), Math.round(effect.y - 1), '#5a5030');
      }
    }
  },

  _electrocuteBurst(ctx, PA, effect, progress) {
    // Lightning burst at enemy position (subtle)
    const burstProgress = progress;
    const burstRadius = 2 + burstProgress * 4;
    const burstAlpha = 1 - burstProgress;

    // White flash (shorter)
    if (burstProgress < 0.1) {
      PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#ffffff');
    }

    // Lightning arcs radiating outward (fewer, smaller)
    if (burstAlpha > 0.2) {
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + burstProgress * 4;
        const r = burstRadius * (0.6 + Math.random() * 0.4);
        const epx = Math.round(effect.x + Math.cos(angle) * r);
        const epy = Math.round(effect.y + Math.sin(angle) * r);
        const color = Math.random() > 0.5 ? '#ffffff' : '#ffff44';
        PA.pixel(ctx, epx, epy, color);
      }
    }
  },

  _chainLightning(ctx, PA, effect, progress) {
    // Lightning arc between two points - upgraded with 8 steps + branch
    const chainAlpha = 1 - progress;
    if (chainAlpha < 0.15) return;

    const dx = effect.targetX - effect.x;
    const dy = effect.targetY - effect.y;
    const steps = 8;
    const totalLen = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / totalLen;
    const perpY = dx / totalLen;

    let prevPx = effect.x;
    let prevPy = effect.y;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      let lpx = effect.x + dx * t;
      let lpy = effect.y + dy * t;
      // Jagged offset (reduced)
      if (i > 0 && i < steps) {
        const offset = (Math.random() - 0.5) * 2.5;
        lpx += perpX * offset;
        lpy += perpY * offset;
      }
      // Brightness: center brightest, ends dimmer
      const brightness = 1 - Math.abs(t - 0.5) * 1.2;
      const color = brightness > 0.6
        ? (Math.random() > 0.3 ? '#ffffff' : '#ffff44')
        : (Math.random() > 0.3 ? '#ffff44' : '#cccc22');
      PA.pixel(ctx, Math.round(lpx), Math.round(lpy), color);

      // 30% chance to spawn a branch at mid-segment nodes
      if (i >= 2 && i <= 6 && Math.random() < 0.3) {
        const branchDir = Math.random() > 0.5 ? 1 : -1;
        for (let b = 1; b <= 2 + Math.floor(Math.random() * 2); b++) {
          PA.pixel(ctx,
            Math.round(lpx + perpX * branchDir * b),
            Math.round(lpy + perpY * branchDir * b),
            '#ffff44');
        }
      }

      prevPx = lpx;
      prevPy = lpy;
    }
  },

  _waterNova(ctx, PA, effect, progress) {
    // AoE water burst - expanding blue ring showing AoE radius
    const novaProgress = progress;
    const novaR = (effect.radius || 16) * novaProgress;
    const novaFade = 1 - novaProgress;

    if (novaFade > 0.1) {
      // Expanding blue ring (flattened for perspective)
      for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
        const r = novaR * (0.9 + Math.random() * 0.1);
        const npx = Math.round(effect.x + Math.cos(angle) * r);
        const npy = Math.round(effect.y + Math.sin(angle) * r * 0.6);
        const color = Math.random() > 0.4 ? '#66aaff' : '#aaddff';
        PA.pixel(ctx, npx, npy, color);
        // Inner water fill (early phase)
        if (novaProgress < 0.5) {
          const ir = r * 0.6;
          PA.pixel(ctx, Math.round(effect.x + Math.cos(angle + 0.1) * ir),
                   Math.round(effect.y + Math.sin(angle + 0.1) * ir * 0.6),
                   'rgba(68,136,255,0.3)');
        }
      }
      // Center bright flash
      if (novaProgress < 0.2) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                  Math.round(2 + novaProgress * 4), '#aaddff');
      }
      // Water droplets flying outward - 8 particles
      for (let i = 0; i < 8; i++) {
        const dAngle = (i / 8) * Math.PI * 2 + novaProgress * 2;
        const dR = novaR * 1.1;
        const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
        const dpy = Math.round(effect.y + Math.sin(dAngle) * dR * 0.6 - novaProgress * 3);
        PA.pixel(ctx, dpx, dpy, '#88ccff');
      }
    }
  },

  _halo(ctx, PA, effect, progress) {
    // 陷阱觸發光暈效果：從小放大再縮小，透明度漸變
    const T = DK.CONFIG.TILE_SIZE;
    const maxScale = effect.maxScale || 1.5;

    // 縮放曲線：0 → maxScale → 0 (使用 ease-out-quad)
    let scale;
    if (progress < 0.3) {
      // 前 30%：快速放大 (0 → 1)
      const t = progress / 0.3;
      scale = t * t * (3 - 2 * t); // smoothstep
    } else if (progress < 0.7) {
      // 中 40%：維持最大值
      scale = 1;
    } else {
      // 後 30%：快速縮小 (1 → 0)
      const t = (progress - 0.7) / 0.3;
      scale = 1 - t * t;
    }

    const currentScale = scale * maxScale;

    // 透明度曲線：0.8 → 0 (線性衰減)
    const alpha = (1 - progress) * 0.8;

    if (alpha <= 0.05 || currentScale <= 0.1) return;

    // 繪製徑向漸層光暈
    const radius = T * currentScale;
    const cx = Math.round(effect.x);
    const cy = Math.round(effect.y);

    // 使用 Canvas 徑向漸層
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

    // 解析顏色 (假設為 hex 格式 #rrggbb)
    const color = effect.color || '#ffffff';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // 漸層：中心亮 → 邊緣暗
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`); // 中心白色高光
    gradient.addColorStop(0.3, `rgba(${r},${g},${b},${alpha * 0.9})`); // 主色
    gradient.addColorStop(0.7, `rgba(${r},${g},${b},${alpha * 0.5})`); // 主色衰減
    gradient.addColorStop(1, `rgba(${r},${g},${b},0)`); // 邊緣透明

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // 新增閃光粒子（前 40% 階段）
    if (progress < 0.4) {
      const particleCount = 6;
      const particleAlpha = (0.4 - progress) / 0.4 * alpha;

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + progress * 8;
        const dist = radius * (0.6 + Math.random() * 0.3);
        const px = Math.round(cx + Math.cos(angle) * dist);
        const py = Math.round(cy + Math.sin(angle) * dist);

        ctx.fillStyle = `rgba(255,255,255,${particleAlpha})`;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  },

  _trapRangeHighlight(ctx, PA, effect, progress) {
    // 陷阱範圍圈高亮效果：顯示陷阱的實際作用範圍
    // 持續 500ms，透明度從高到低
    const alpha = (1 - progress) * 0.6;

    if (alpha <= 0.05) return;

    const cx = Math.round(effect.x);
    const cy = Math.round(effect.y);
    const range = effect.range || 0;

    // 解析顏色
    const color = effect.color || '#ffffff';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // 繪製虛線圓圈（範圍指示）
    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 繪製半透明填充
    ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.2})`;
    ctx.beginPath();
    ctx.arc(cx, cy, range, 0, Math.PI * 2);
    ctx.fill();

    // 在圓圈上繪製 8 個亮點（旋轉動畫）
    const pointCount = 8;
    const rotationSpeed = 4; // 旋轉速度
    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2 + progress * rotationSpeed;
      const px = Math.round(cx + Math.cos(angle) * range);
      const py = Math.round(cy + Math.sin(angle) * range);

      // 亮點透明度會閃爍
      const pointAlpha = alpha * (0.5 + Math.sin(progress * Math.PI * 8 + i) * 0.5);
      ctx.fillStyle = `rgba(255,255,255,${pointAlpha})`;
      ctx.fillRect(px - 1, py - 1, 2, 2);
    }
  },

  _waterSplash(ctx, PA, effect, progress) {
    // Expanding water ring when wet status first applied
    const splashProgress = progress;
    const splashR = 2 + splashProgress * 6;
    const splashFade = 1 - splashProgress;

    if (splashFade > 0.1) {
      // Expanding water ring (flattened for perspective)
      for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
        const r = splashR * (0.8 + Math.random() * 0.2);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r * 0.5);
        const color = Math.random() > 0.5 ? '#66aaff' : '#4488ff';
        PA.pixel(ctx, spx, spy, color);
      }
      // Bright center burst
      if (splashProgress < 0.3) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#aaddff');
      }
      // Rising droplets
      for (let i = 0; i < 4; i++) {
        const dAngle = (i / 4) * Math.PI * 2 + splashProgress * 3;
        const dR = splashR * 0.6;
        const dpy = Math.round(effect.y - splashProgress * 6 + Math.sin(dAngle) * 2);
        const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
        PA.pixel(ctx, dpx, dpy, '#88ccff');
      }
      // Landing ripples at base
      if (splashProgress > 0.4) {
        const rippleR = splashR * 0.5;
        PA.pixel(ctx, Math.round(effect.x - rippleR), Math.round(effect.y + 2), '#4488ff');
        PA.pixel(ctx, Math.round(effect.x + rippleR), Math.round(effect.y + 2), '#4488ff');
      }
    }
  },

  _pushWave(ctx, PA, effect, progress) {
    // Directional force wave from push trap
    const pushProgress = progress;
    const pushFade = 1 - pushProgress;

    if (pushFade > 0.1) {
      const dx = effect.dx || 0;
      const dy = effect.dy || 0;

      // Expanding wind lines in push direction
      for (let i = 0; i < 6; i++) {
        const spread = (i - 2.5) * 2;
        const dist = pushProgress * 16;
        const px = Math.round(effect.x + dx * dist + (dy !== 0 ? spread : 0));
        const py = Math.round(effect.y + dy * dist + (dx !== 0 ? spread : 0));
        const color = Math.random() > 0.5 ? '#ffaa44' : '#ff8822';
        PA.pixel(ctx, px, py, color);

        // Trail particles
        const tdist = dist * 0.6;
        PA.pixel(ctx, Math.round(effect.x + dx * tdist + (dy !== 0 ? spread * 0.7 : 0)),
                 Math.round(effect.y + dy * tdist + (dx !== 0 ? spread * 0.7 : 0)),
                 '#ff6622');
      }

      // Central force line (bright)
      if (pushProgress < 0.5) {
        const cDist = pushProgress * 20;
        PA.pixel(ctx, Math.round(effect.x + dx * cDist),
                 Math.round(effect.y + dy * cDist), '#ffffff');
        PA.pixel(ctx, Math.round(effect.x + dx * cDist * 0.7),
                 Math.round(effect.y + dy * cDist * 0.7), '#ffcc66');
      }
    }
  },

  _abyssFall(ctx, PA, effect, progress) {
    // 敵人消失入深淵
    const fallProgress = progress;
    const fallFade = 1 - fallProgress;

    if (fallFade > 0.05) {
      // 黑暗漩渦（而非熔岩飛濺）
      const vortexR = 2 + fallProgress * 4;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
        const r = vortexR * (0.8 + Math.random() * 0.2);
        const spin = angle + fallProgress * 6; // 旋轉效果
        const spx = Math.round(effect.x + Math.cos(spin) * r);
        const spy = Math.round(effect.y + Math.sin(spin) * r * 0.5);
        PA.pixel(ctx, spx, spy, '#1a1a2a');
      }

      // 碎石掉落
      if (fallProgress < 0.6) {
        for (let i = 0; i < 3; i++) {
          const rx = Math.round(effect.x + (Math.random() - 0.5) * 6);
          const ry = Math.round(effect.y + fallProgress * 4 + Math.random() * 2);
          PA.pixel(ctx, rx, ry, Math.random() > 0.5 ? '#2a2838' : '#1a1a2a');
        }
      }

      // 中心暗點（深淵入口）
      if (fallProgress < 0.4) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                  Math.round(2 - fallProgress * 3), '#050508');
      }
    }
  },

  _oilIgniteBurst(ctx, PA, effect, progress) {
    // 油燃引爆 — 橘紅色火焰從中心爆發
    const burstMaxR = (effect.radius || 16) * 1.2;
    const burstExpand = Math.min(1, progress * 2.5);
    const burstFade = Math.max(0, (progress - 0.3) / 0.7);

    // Phase 1：白色閃光核心（0-12%）
    if (progress < 0.12) {
      const flashR = burstMaxR * progress * 5;
      PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
               Math.max(2, Math.round(flashR)), '#ffffff');
    }

    // Phase 2：橘紅火焰環擴散（8-50%）
    if (progress > 0.08 && progress < 0.5) {
      const ringR = burstMaxR * burstExpand;
      for (let angle = 0; angle < Math.PI * 2; angle += 0.22) {
        const r = ringR * (0.7 + Math.random() * 0.3);
        const epx = Math.round(effect.x + Math.cos(angle) * r);
        const epy = Math.round(effect.y + Math.sin(angle) * r);
        const color = Math.random() > 0.4 ? '#ff5500' : '#ffaa22';
        PA.pixel(ctx, epx, epy, color);
        // 內層火焰
        const ir = r * 0.5;
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * ir),
                 Math.round(effect.y + Math.sin(angle) * ir),
                 Math.random() > 0.5 ? '#ffdd44' : '#ff8822');
      }
    }

    // Phase 3：黑煙+油燃餘燼（30-100%）
    if (progress > 0.3) {
      const smokeR = burstMaxR * 1.2;
      const smokeColors = ['#1a1008', '#2a1a10', '#3a2810'];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + progress * 2;
        const r = smokeR * (0.5 + Math.random() * 0.5) * (1 - burstFade * 0.5);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r - burstFade * 4);
        PA.pixel(ctx, spx, spy, smokeColors[Math.floor(Math.random() * 3)]);
        // 油燃火星
        if (Math.random() > 0.6) {
          PA.pixel(ctx, spx + 1, spy - 1, '#ff5500');
        }
      }
    }

    // 焦痕
    if (progress > 0.5) {
      PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#0a0804');
      PA.pixel(ctx, Math.round(effect.x) + 1, Math.round(effect.y), '#0a0804');
    }
  },

  _oilSplash(ctx, PA, effect, progress) {
    // 油污飛濺 — 首次掛上 oiled 時的視覺效果
    const oilSplashP = progress;
    const oilSplashR = 2 + oilSplashP * 4;
    const oilSplashFade = 1 - oilSplashP;

    if (oilSplashFade > 0.1) {
      // 擴散的油環
      for (let angle = 0; angle < Math.PI * 2; angle += 0.5) {
        const r = oilSplashR * (0.8 + Math.random() * 0.2);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r * 0.5);
        const color = Math.random() > 0.5 ? '#5a4020' : '#3a2810';
        PA.pixel(ctx, spx, spy, color);
      }
      // 中心油核
      if (oilSplashP < 0.3) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#2a2010');
      }
      // 下墜油滴
      for (let i = 0; i < 3; i++) {
        const dAngle = (i / 3) * Math.PI * 2 + oilSplashP * 2;
        const dR = oilSplashR * 0.5;
        const dpy = Math.round(effect.y + oilSplashP * 4 + Math.sin(dAngle) * 2);
        const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
        PA.pixel(ctx, dpx, dpy, '#3a2810');
      }
    }
  },

  _fireSplash(ctx, PA, effect, progress) {
    // 火焰飛濺 - 首次掛上 burning 時的視覺效果
    const fireSplashP = progress;
    const fireSplashR = 2 + fireSplashP * 5;
    const fireSplashFade = 1 - fireSplashP;

    if (fireSplashFade > 0.1) {
      // 擴散的火焰環
      for (let angle = 0; angle < Math.PI * 2; angle += 0.4) {
        const r = fireSplashR * (0.8 + Math.random() * 0.2);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r * 0.5);
        const color = Math.random() > 0.5 ? '#ffaa44' : '#ff6622';
        PA.pixel(ctx, spx, spy, color);
      }
      // 中心閃光
      if (fireSplashP < 0.3) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y), 2, '#ffffff');
      }
      // 上升火花
      for (let i = 0; i < 3; i++) {
        const dAngle = (i / 3) * Math.PI * 2 + fireSplashP * 4;
        const dR = fireSplashR * 0.5;
        const dpy = Math.round(effect.y - fireSplashP * 5 + Math.sin(dAngle) * 2);
        const dpx = Math.round(effect.x + Math.cos(dAngle) * dR);
        PA.pixel(ctx, dpx, dpy, '#ffcc44');
      }
    }
  },

  _fireNova(ctx, PA, effect, progress) {
    // 火法師 AoE 爆發 - 擴散的火焰圈
    const novaR = (effect.radius || 16) * progress;
    const novaFade = 1 - progress;

    if (novaFade > 0.1) {
      // 擴散的火焰環
      for (let angle = 0; angle < Math.PI * 2; angle += 0.2) {
        const r = novaR * (0.9 + Math.random() * 0.1);
        const npx = Math.round(effect.x + Math.cos(angle) * r);
        const npy = Math.round(effect.y + Math.sin(angle) * r * 0.6);
        const color = Math.random() > 0.4 ? '#ff6622' : '#ffaa44';
        PA.pixel(ctx, npx, npy, color);
        // 內層火焰填充（早期階段）
        if (progress < 0.5) {
          const ir = r * 0.6;
          PA.pixel(ctx, Math.round(effect.x + Math.cos(angle + 0.1) * ir),
                   Math.round(effect.y + Math.sin(angle + 0.1) * ir * 0.6),
                   Math.random() > 0.5 ? '#ffcc44' : '#ff8822');
        }
      }
      // 中心火核（早期閃光）
      if (progress < 0.2) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                 Math.round(3 - progress * 10), '#ffffff');
      }
    }
  },

  _burnStatus(ctx, PA, effect, progress) {
    // 燃燒狀態持續視覺（地面火焰殘留）- 4-color progressive flames
    const burnFade = 1 - progress;
    if (burnFade > 0.1) {
      const flameColors = ['#ffdd44', '#ffaa22', '#ff6622', '#cc2200'];
      // 地面小火焰閃爍 - different sway frequencies per layer
      const flickerBase = Math.sin(effect.timer / 80) * 0.5;
      const flameH = 2 + flickerBase;

      // Layer 0 (top): brightest, fast sway
      const sway0 = Math.sin(effect.timer / 50) * 0.8;
      PA.pixel(ctx, Math.round(effect.x + sway0), Math.round(effect.y - flameH - 1), flameColors[0]);
      // Layer 1: medium sway
      const sway1 = Math.sin(effect.timer / 70) * 0.5;
      PA.pixel(ctx, Math.round(effect.x + sway1), Math.round(effect.y - flameH), flameColors[1]);
      // Layer 2: slow sway
      const sway2 = Math.sin(effect.timer / 100) * 0.3;
      PA.pixel(ctx, Math.round(effect.x + sway2), Math.round(effect.y - flameH + 1), flameColors[2]);
      // Layer 3 (base): minimal sway
      PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), flameColors[3]);

      // 左右小火舌
      if (Math.random() > 0.3) {
        PA.pixel(ctx, Math.round(effect.x - 1), Math.round(effect.y - flameH * 0.5), flameColors[2]);
        PA.pixel(ctx, Math.round(effect.x + 1), Math.round(effect.y - flameH * 0.7), flameColors[0]);
      }
      // 隨機火花
      if (Math.random() > 0.7) {
        PA.pixel(ctx, Math.round(effect.x + (Math.random() - 0.5) * 3),
                 Math.round(effect.y - 2 - Math.random() * 3), '#ffdd66');
      }
      // 地面焦痕
      PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y + 1), '#1a0808');
    }
  },

  _blizzardZone(ctx, PA, effect, progress) {
    // 持續性減速區域（像素風格渲染）
    const zoneRadius = (effect.radius || 24);
    const zoneFade = 1 - progress;
    if (zoneFade > 0.1) {
      // 像素化橢圓底座：4px height with scanline interval 1
      const cx = Math.round(effect.x);
      const cy = Math.round(effect.y);
      const ry = Math.round(zoneRadius * 0.6);
      const baseColor = `rgba(100,170,238,${zoneFade * 0.15})`;
      for (let sdy = -ry; sdy <= ry; sdy += 1) {
        const yRatio = sdy / ry;
        const halfW = Math.round(zoneRadius * Math.sqrt(Math.max(0, 1 - yRatio * yRatio)));
        if (halfW > 0) {
          PA.rect(ctx, cx - halfW, cy + sdy, halfW * 2, 1, baseColor);
        }
      }
      // 飛舞的冰晶粒子 - 10 particles in 2-3 height layers
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + progress * 4;
        const r = zoneRadius * (0.3 + Math.random() * 0.7);
        const heightLayer = (i % 3) * 2; // 0, 2, or 4 pixels above
        const ppx = Math.round(effect.x + Math.cos(angle) * r);
        const ppy = Math.round(effect.y + Math.sin(angle) * r * 0.6 - heightLayer - Math.random() * 2);
        PA.pixel(ctx, ppx, ppy, Math.random() > 0.5 ? '#aaddff' : '#88ccff');
      }
      // 邊緣冰霜像素點
      for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
        const r = zoneRadius * (0.9 + Math.random() * 0.1);
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * r),
                 Math.round(effect.y + Math.sin(angle) * r * 0.6),
                 '#88ccff');
      }
    }
  },

  _evolutionBurst(ctx, PA, effect, progress) {
    // 進化爆發光效 - thicker gold halo
    const evoProgress = progress;
    const evoR = 4 + evoProgress * 12;
    const evoFade = 1 - evoProgress;

    if (evoFade > 0.05) {
      // 金色光環擴散 - step 0.15 for thicker ring
      for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
        const r = evoR * (0.8 + Math.random() * 0.2);
        const epx = Math.round(effect.x + Math.cos(angle) * r);
        const epy = Math.round(effect.y + Math.sin(angle) * r * 0.6);
        const color = Math.random() > 0.5 ? '#ffd700' : '#ffaa00';
        PA.pixel(ctx, epx, epy, color);
      }
      // 中心白色閃光
      if (evoProgress < 0.3) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                  Math.round(3 - evoProgress * 8), '#ffffff');
      }
      // 上升金色粒子
      for (let i = 0; i < 6; i++) {
        const pAngle = (i / 6) * Math.PI * 2 + evoProgress * 3;
        const pr = evoR * 0.5;
        const ppx = Math.round(effect.x + Math.cos(pAngle) * pr);
        const ppy = Math.round(effect.y - evoProgress * 8 + Math.sin(pAngle) * 2);
        PA.pixel(ctx, ppx, ppy, '#ffdd44');
      }
    }
  },

  _stunWave(ctx, PA, effect, progress) {
    // 眩暈衝擊波 - 擴散的白色環（像素風格渲染）
    const stunProgress = progress;
    const stunR = (effect.radius || 16) * stunProgress;
    const stunFade = 1 - stunProgress;

    if (stunFade > 0.1) {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.25) {
        const r = stunR * (0.95 + Math.random() * 0.05);
        const spx = Math.round(effect.x + Math.cos(angle) * r);
        const spy = Math.round(effect.y + Math.sin(angle) * r * 0.6);
        PA.pixel(ctx, spx, spy, Math.random() > 0.5 ? '#ffffff' : '#ffddaa');
      }
      // 像素化內部填充
      if (stunProgress < 0.4) {
        const scx = Math.round(effect.x);
        const scy = Math.round(effect.y);
        const sry = Math.round(stunR * 0.6);
        const fillColor = `rgba(255,255,255,${stunFade * 0.1})`;
        for (let sdy = -sry; sdy <= sry; sdy += 2) {
          const yRatio = sdy / sry;
          const halfW = Math.round(stunR * Math.sqrt(Math.max(0, 1 - yRatio * yRatio)));
          if (halfW > 0) {
            PA.rect(ctx, scx - halfW, scy + sdy, halfW * 2, 2, fillColor);
          }
        }
      }
    }
  },

  _goldSparkle(ctx, PA, effect, progress) {
    // 金幣獲取閃光粒子 — 3-5 個金色小方塊向外擴散並上漂
    const sparkleProgress = progress;
    const sparkleFade = 1 - sparkleProgress;

    if (sparkleFade > 0.05) {
      const particleCount = 4;
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + effect.timer * 0.008;
        const dist = sparkleProgress * 8;
        const gpx = Math.round(effect.x + Math.cos(angle) * dist);
        const gpy = Math.round(effect.y + Math.sin(angle) * dist - sparkleProgress * 6);
        const size = sparkleProgress < 0.5 ? 2 : 1;

        // 金色小方塊
        const color = i % 2 === 0 ? '#ffd700' : '#ffaa00';
        PA.rect(ctx, gpx, gpy, size, size, color);
      }
      // 中心亮點（早期閃光）
      if (sparkleProgress < 0.3) {
        PA.pixel(ctx, Math.round(effect.x), Math.round(effect.y), '#ffffff');
      }
    }
  },

  _heroDeploy(ctx, PA, effect, progress) {
    // 英雄部署出場特效 — 圓環擴張 + 向外飛散粒子
    const deployProgress = progress;
    const deployFade = 1 - deployProgress;

    // 根據 element 決定顏色
    const elementColorMap = {
      water: { r: 68, g: 136, b: 255 },
      fire:  { r: 255, g: 102, b: 34 },
      ice:   { r: 136, g: 204, b: 255 },
    };
    const ec = elementColorMap[effect.element] || elementColorMap.water;
    const ringColor = `rgba(${ec.r},${ec.g},${ec.b},${deployFade})`;

    // 圓環半徑隨時間擴張到 24px
    const ringR = deployProgress * 24;
    // 線寬從 2px 過渡到 1px
    const lineW = deployProgress < 0.5 ? 2 : 1;

    if (deployFade > 0.05) {
      // 畫圓環（像素點模擬）
      const ringSteps = Math.max(16, Math.round(ringR * 2));
      for (let i = 0; i < ringSteps; i++) {
        const angle = (i / ringSteps) * Math.PI * 2;
        const rpx = Math.round(effect.x + Math.cos(angle) * ringR);
        const rpy = Math.round(effect.y + Math.sin(angle) * ringR);
        PA.pixel(ctx, rpx, rpy, ringColor);
        // 線寬 2 時多畫一層
        if (lineW === 2) {
          const rpx2 = Math.round(effect.x + Math.cos(angle) * (ringR - 1));
          const rpy2 = Math.round(effect.y + Math.sin(angle) * (ringR - 1));
          PA.pixel(ctx, rpx2, rpy2, ringColor);
        }
      }

      // 8 個向外飛散的小粒子 (upgraded from 4)
      for (let i = 0; i < 8; i++) {
        const pAngle = (i / 8) * Math.PI * 2 + deployProgress * 2;
        const pDist = ringR * 1.3;
        const ppx = Math.round(effect.x + Math.cos(pAngle) * pDist);
        const ppy = Math.round(effect.y + Math.sin(pAngle) * pDist);
        const brightColor = `rgba(${Math.min(255, ec.r + 80)},${Math.min(255, ec.g + 80)},${Math.min(255, ec.b + 80)},${deployFade})`;
        PA.pixel(ctx, ppx, ppy, brightColor);
      }

      // 中心白色閃光（早期）
      if (deployProgress < 0.2) {
        PA.circle(ctx, Math.round(effect.x), Math.round(effect.y),
                  Math.round(2 - deployProgress * 8), '#ffffff');
      }
    }
  },

  _heroRecall(ctx, PA, effect, progress) {
    // 回收特效：向內收縮的圓環 + 向上飛散粒子
    const fade = 1 - progress;

    const elementColorMap = {
      water: { r: 68, g: 136, b: 255 },
      fire:  { r: 255, g: 102, b: 34 },
      ice:   { r: 136, g: 204, b: 255 },
    };
    const ec = elementColorMap[effect.element] || elementColorMap.water;
    const ringColor = `rgba(${ec.r},${ec.g},${ec.b},${fade})`;

    // 圓環從大到小收縮
    const ringR = (1 - progress) * 20;

    if (fade > 0.05) {
      const ringSteps = Math.max(12, Math.round(ringR * 2));
      for (let i = 0; i < ringSteps; i++) {
        const angle = (i / ringSteps) * Math.PI * 2;
        const rpx = Math.round(effect.x + Math.cos(angle) * ringR);
        const rpy = Math.round(effect.y + Math.sin(angle) * ringR);
        PA.pixel(ctx, rpx, rpy, ringColor);
      }
    }

    // 向上飛散粒子
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + progress * 3;
      const dist = progress * 12;
      const px = Math.round(effect.x + Math.cos(angle) * dist * 0.5);
      const py = Math.round(effect.y - progress * 16 + Math.sin(angle) * dist * 0.3);
      const pAlpha = fade * 0.8;
      if (pAlpha > 0.05) {
        PA.pixel(ctx, px, py, `rgba(${ec.r},${ec.g},${ec.b},${pAlpha})`);
      }
    }
  },

  _wallBreak(ctx, PA, effect, progress) {
    // Wall debris particles
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + progress * 2;
      const dist = progress * 12;
      const px = Math.round(effect.x + Math.cos(angle) * dist);
      const py = Math.round(effect.y + Math.sin(angle) * dist);
      if (progress < 0.7) {
        const colors = ['#3e3e5a', '#2d2d44', '#565470'];
        PA.pixel(ctx, px, py, colors[i % 3]);
      }
    }
    // Dust cloud
    if (progress < 0.4) {
      const dustR = progress * 8;
      for (let a = 0; a < 6; a++) {
        const angle = (a / 6) * Math.PI * 2;
        PA.pixel(ctx, Math.round(effect.x + Math.cos(angle) * dustR),
                 Math.round(effect.y + Math.sin(angle) * dustR), '#888888');
      }
    }
  }
};

// Render floating text effects on UI canvas
DK.renderUIEffects = function(ctx) {
  for (const effect of DK.Game.effects) {
    if (effect.type !== 'damage' && effect.type !== 'gold' && effect.type !== 'reaction_text' && effect.type !== 'float_text') continue;

    const progress = effect.timer / effect.duration;
    const alpha = Math.min(1, (1 - progress) * 2); // Fade out in second half
    const offsetY = progress * -25; // Float upward
    const scale = progress < 0.1 ? 0.5 + progress * 5 : 1; // Pop-in

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';

    const uiCam = DK.Game.camera || { x: 0, y: 0 };
    const screenX = (effect.x - uiCam.x) * DK.CONFIG.SCALE;
    const screenY = (effect.y - uiCam.y) * DK.CONFIG.SCALE + offsetY;

    // Reaction text is bigger and bolder
    const isReaction = effect.type === 'reaction_text';
    const fontSize = isReaction ? Math.round(20 * scale) : Math.round(14 * scale);

    // Text setup
    ctx.font = DK.FONTS.bold(fontSize);

    // Reaction text: semi-transparent background rectangle
    if (isReaction) {
      const metrics = ctx.measureText(effect.text);
      const bgW = metrics.width + 8;
      const bgH = fontSize + 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(screenX - bgW / 2, screenY - bgH + 2, bgW, bgH);
    }

    // 1px black stroke outline for all text
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeText(effect.text, screenX, screenY);

    // Main text (reaction text flickers)
    if (isReaction) {
      const flicker = Math.sin(effect.timer / 40) > 0 ? effect.color : '#ffffff';
      ctx.fillStyle = flicker;
    } else {
      ctx.fillStyle = effect.color;
    }
    ctx.fillText(effect.text, screenX, screenY);

    ctx.restore();
  }
};
