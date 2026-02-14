/**
 * Dungeon Keep - World Renderer System
 * Game world rendering: dungeon heart, barricades, path preview, wave preview
 */
window.DK = window.DK || {};

DK.WorldRenderer = {
  // === Wave Preview System ===

  /**
   * 渲染波次預覽系統（當前波次 + 下一波次 + 進度條）
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   */
  wavePreview(ctx) {
    const currentWave = DK.Game.getCurrentWaveData();
    const nextWave = DK.Game.getNextWaveData();

    if (!currentWave) return;

    // 渲染當前波次卡片（左上角，波次資訊下方）
    this._currentWaveCard(ctx, currentWave, 20, 120);

    // 渲染下一波次預覽（左上角，偏下）
    if (nextWave) {
      this._nextWaveCard(ctx, nextWave, 20, 300);
    }

    // 渲染波次進度條（底部中央）
    this._waveProgress(ctx, DK.Game.currentWave + 1, DK.WAVES.length);
  },

  /**
   * 渲染當前波次卡片（詳細資訊）
   * @private
   */
  _currentWaveCard(ctx, waveData, x, y) {
    ctx.save();  // ✅ 保存 Canvas 狀態

    const cardW = 220;
    const cardH = 160;

    // 難度邊框顏色
    const difficultyColors = {
      easy: '#44ff44',
      medium: '#ffff44',
      hard: '#ff8844',
      extreme: '#ff4444'
    };
    const borderColor = difficultyColors[waveData.difficulty] || '#44ff44';

    // 半透明深色背景
    ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
    ctx.fillRect(x, y, cardW, cardH);

    // 難度邊框（3px）
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, cardW, cardH);

    // 波次編號（大字體）
    ctx.font = DK.FONTS.bold(28);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`第 ${waveData.wave} 波`, x + 12, y + 32);

    // 難度指示器（5 個格子）
    this._difficultyIndicator(ctx, waveData.difficulty, x + 12, y + 46);

    // 敵人類型 + 數量
    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`敵人類型：`, x + 12, y + 80);

    let offsetY = y + 100;
    waveData.enemies.forEach((enemyGroup, index) => {
      const enemyType = DK.ENEMY_TYPES[enemyGroup.type];
      const enemyName = enemyType ? enemyType.name : enemyGroup.type;
      const color = this._getEnemyColor(enemyGroup.type);

      ctx.fillStyle = color;
      ctx.fillText(`• ${enemyName} × ${enemyGroup.count}`, x + 16, offsetY);
      offsetY += 18;
    });

    // 完成獎勵金幣
    ctx.font = DK.FONTS.bold(16);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`💰 獎勵：+${waveData.reward} 金幣`, x + 12, y + cardH - 12);

    ctx.restore();  // ✅ 恢復 Canvas 狀態
  },

  /**
   * 渲染下一波次卡片（簡化預覽）
   * @private
   */
  _nextWaveCard(ctx, waveData, x, y) {
    ctx.save();  // ✅ 保存 Canvas 狀態

    const cardW = 220;
    const cardH = 100;

    // 半透明深色背景（更透明）
    ctx.fillStyle = 'rgba(20, 20, 40, 0.7)';
    ctx.fillRect(x, y, cardW, cardH);

    // 灰色邊框
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, cardH);

    // "下一波" 標籤
    ctx.font = DK.FONTS.bold(18);
    ctx.fillStyle = '#aaaaaa';
    ctx.textAlign = 'left';
    ctx.fillText(`下一波（第 ${waveData.wave} 波）`, x + 12, y + 28);

    // 難度指示器
    this._difficultyIndicator(ctx, waveData.difficulty, x + 12, y + 40);

    // 敵人類型預覽（小圖示）
    ctx.font = DK.FONTS.body(12);
    ctx.fillStyle = '#999999';
    ctx.fillText(`敵人：${waveData.totalEnemies} 隻`, x + 12, y + 68);

    // 敵人類型列表（簡化版）
    const enemyTypes = waveData.enemies.map(e => {
      const enemyType = DK.ENEMY_TYPES[e.type];
      return enemyType ? enemyType.name : e.type;
    }).join(', ');

    ctx.fillStyle = '#777777';
    ctx.fillText(enemyTypes.length > 24 ? enemyTypes.substring(0, 24) + '...' : enemyTypes, x + 12, y + 84);

    ctx.restore();  // ✅ 恢復 Canvas 狀態
  },

  /**
   * 渲染難度指示器（5 個格子）
   * @private
   */
  _difficultyIndicator(ctx, difficulty, x, y) {
    ctx.save();  // ✅ 保存 Canvas 狀態

    const barW = 10;
    const barH = 16;
    const gap = 4;
    const totalBars = 5;

    const difficultyLevels = {
      easy: 1,
      medium: 3,
      hard: 4,
      extreme: 5
    };
    const level = difficultyLevels[difficulty] || 1;

    const colors = {
      easy: '#44ff44',
      medium: '#ffff44',
      hard: '#ff8844',
      extreme: '#ff4444'
    };
    const activeColor = colors[difficulty] || '#44ff44';

    for (let i = 0; i < totalBars; i++) {
      const barX = x + i * (barW + gap);
      const isActive = i < level;

      if (isActive) {
        ctx.fillStyle = activeColor;
      } else {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
      }

      ctx.fillRect(barX, y, barW, barH);
    }

    ctx.restore();  // ✅ 恢復 Canvas 狀態
  },

  /**
   * 渲染波次進度條（底部中央）
   * @private
   */
  _waveProgress(ctx, currentWave, totalWaves) {
    ctx.save();  // ✅ 保存 Canvas 狀態

    const barW = 300;
    const barH = 20;
    const x = (DK.CONFIG.DISPLAY_WIDTH - barW) / 2;
    const y = DK.CONFIG.DISPLAY_HEIGHT - 40;

    // 背景
    ctx.fillStyle = 'rgba(20, 20, 40, 0.8)';
    ctx.fillRect(x - 4, y - 4, barW + 8, barH + 8);

    // 邊框
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barW, barH);

    // 進度條填充
    const progress = currentWave / totalWaves;
    const fillW = Math.round(barW * progress);

    ctx.fillStyle = '#44aaff';
    ctx.fillRect(x, y, fillW, barH);

    // 文字
    ctx.font = DK.FONTS.bold(14);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`波次進度：${currentWave} / ${totalWaves}`, x + barW / 2, y + 14);

    ctx.restore();  // ✅ 恢復 Canvas 狀態
  },

  /**
   * 根據敵人類型取得顏色
   * @private
   */
  _getEnemyColor(enemyType) {
    const colorMap = {
      goblin: '#44ff44',
      orc: '#ff8844',
      troll: '#ff4444',
      golem: '#888888',
      // 可根據需要擴展
    };
    return colorMap[enemyType] || '#cccccc';
  },

  // === Dungeon Heart Renderer ===

  /**
   * 渲染地城之心（2×2 脈動水晶）
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} time - 遊戲時間（毫秒）
   */
  dungeonHeart(ctx, time) {
    const hp = DK.Map.heartPos;
    if (!hp) return;
    const T = DK.CONFIG.TILE_SIZE;
    const x = hp.col * T;
    const y = hp.row * T;
    const PA = DK.PixelArt;
    const ISO = PA.Isometric;

    // Hurt flash
    const isFlashing = DK.Game.heartFlashTimer > 0;

    // Pulse (2000ms cycle)
    const pulse = Math.sin(time / 1000 * Math.PI) * 0.5 + 0.5;
    const hpPercent = DK.Game.dungeonHeartHP / DK.Game.dungeonHeartMaxHP;

    // HP < 30%: faster pulse
    const fastPulse = hpPercent < 0.3 ? Math.sin(time / 500 * Math.PI) * 0.5 + 0.5 : pulse;

    // Center point of 2×2 area (32×32 pixels)
    const cx = x + 16;
    const cy = y + 16;

    // Crystal colors (HP-based)
    const coreColor = isFlashing ? '#ff4444' : '#aa44ff';
    const hpColor = hpPercent > 0.3 ? coreColor : (isFlashing ? '#ff4444' : '#ff4488');

    // === 1. Ground Shadow (ellipse, alpha 0.15, crystal color) ===
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 16, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // === 2. Isometric Stone Pedestal (3 layers, compact) ===
    const stoneBase = '#3a2a4a';

    // Bottom layer (base, darkest) - 14×6
    PA.rect(ctx, cx - 7, cy + 8, 14, 6, ISO.sideDark(stoneBase));

    // Front face (medium) - 12×4
    PA.rect(ctx, cx - 6, cy + 4, 12, 4, stoneBase);

    // Top face (brightest) - 10×3
    PA.rect(ctx, cx - 5, cy + 1, 10, 3, ISO.topLight(stoneBase));

    // Right side dark edge (enhance 3D effect) - 1px width
    PA.rect(ctx, cx + 6, cy + 4, 1, 10, ISO.ambientOcclusion(stoneBase));

    // === 3. Hovering Crystal (4 layers, 3px gap above pedestal) ===
    // Crystal bottom (cy - 2) is 3px above pedestal top (cy + 1)

    // Layer 1: Bottom (darkest, largest) - 8×8
    PA.rect(ctx, cx - 4, cy - 2, 8, 8, ISO.ambientOcclusion(hpColor));

    // Layer 2: Middle (medium) - 6×12
    PA.rect(ctx, cx - 3, cy - 5, 6, 12, ISO.sideDark(hpColor));

    // Layer 3: Top (bright) - 4×8
    PA.rect(ctx, cx - 2, cy - 7, 4, 8, hpColor);

    // Layer 4: Tip (brightest) - 2×2
    PA.rect(ctx, cx - 1, cy - 8, 2, 2, ISO.topLight(hpColor));

    // === 4. Inner glow point (pulsating, at crystal center) ===
    const glowSize = 2 + Math.round(fastPulse * 2);
    PA.rect(ctx, cx - Math.floor(glowSize / 2), cy - 5 - Math.floor(glowSize / 2),
            glowSize, glowSize, '#ffffff');

    // === 5. Glow effect (tile-based halo) ===
    const glowAlpha = 0.08 + fastPulse * 0.08;
    const glowRadius = 3 + fastPulse * 0.5;
    for (let gr = -glowRadius; gr <= glowRadius; gr++) {
      for (let gc = -glowRadius; gc <= glowRadius; gc++) {
        const dist = Math.sqrt(gr * gr + gc * gc);
        if (dist > glowRadius) continue;
        const falloff = 1 - dist / glowRadius;
        const alpha = glowAlpha * falloff * falloff;
        if (alpha < 0.01) continue;
        const gx = (hp.col + 1) * T + gc * T;
        const gy = (hp.row + 1) * T + gr * T;
        const r = isFlashing ? 255 : 170;
        const g = isFlashing ? 68 : 68;
        const b = isFlashing ? 68 : 255;
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fillRect(gx, gy, T, T);
      }
    }

    // === 6. HP bar (above heart) - only show when damaged ===
    if (hpPercent < 1) {
      const barW = 28;
      const barX = x + 2;
      const barY = y - 4;
      PA.rect(ctx, barX - 1, barY - 1, barW + 2, 5, '#1a1a1a');
      PA.rect(ctx, barX, barY, barW, 3, '#2a0a0a');
      const fillW = Math.ceil(barW * hpPercent);
      PA.rect(ctx, barX, barY + 1, fillW, 2, hpPercent > 0.3 ? '#ff4444' : '#ff0000');
      PA.rect(ctx, barX, barY, fillW, 1, hpPercent > 0.3 ? '#ff8888' : '#ff4444');
    }
  },

  // === Breakable Wall Highlight (deprecated) ===

  /**
   * 渲染可破壞牆壁高亮（BREACH 階段已移除，保留空函式避免錯誤）
   * @deprecated
   */
  breakableWallHighlight(ctx, time) {
    // 不再使用，保留空函式
    return;
  },

  // === 路障渲染 ===

  /**
   * 渲染路障系統
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {number} time - 遊戲時間（毫秒）
   */
  barricades(ctx, time) {
    if (!DK.Map.barricades) return;
    const T = DK.CONFIG.TILE_SIZE;

    for (const b of DK.Map.barricades) {
      const x = b.col * T;
      const y = b.row * T;

      // 受擊晃動
      let shakeX = 0;
      if (b.hp < b.maxHp) {
        const shakeCycle = Math.sin(time * 0.04) * 1;
        if (b.hp < b.maxHp * 0.5) shakeX = Math.round(shakeCycle);
      }

      const bx = x + shakeX;

      // 石磚底座（10px 高）
      ctx.fillStyle = DK.COLORS.BARRICADE_STONE || '#5a5a6e';
      ctx.fillRect(bx + 1, y + 4, T - 2, 10);

      // 頂部深色邊緣（2px）
      ctx.fillStyle = DK.COLORS.BARRICADE_STONE_DARK || '#2a2a3a';
      ctx.fillRect(bx + 1, y + 2, T - 2, 2);

      // 左上光源 — 左側高光
      ctx.fillStyle = DK.COLORS.BARRICADE_STONE_LIGHT || '#7a7a8e';
      ctx.fillRect(bx + 1, y + 4, 1, 10);
      ctx.fillRect(bx + 1, y + 4, T - 2, 1);

      // 右側和底部陰影
      ctx.fillStyle = DK.COLORS.BARRICADE_STONE_DARK || '#2a2a3a';
      ctx.fillRect(bx + T - 2, y + 4, 1, 10);
      ctx.fillRect(bx + 1, y + 13, T - 2, 1);

      // 灰縫（中間分隔線）
      ctx.fillStyle = DK.COLORS.BARRICADE_MORTAR || '#3a3a4a';
      ctx.fillRect(bx + 1, y + 9, T - 2, 1);
      // 垂直灰縫
      ctx.fillRect(bx + T / 2, y + 4, 1, 5);
      ctx.fillRect(bx + T / 4, y + 10, 1, 4);
      ctx.fillRect(bx + T * 3 / 4, y + 10, 1, 4);

      // 裂痕（HP < 50%）
      if (b.hp < b.maxHp * 0.5) {
        ctx.fillStyle = DK.COLORS.BARRICADE_CRACK || '#1a1a2a';
        ctx.fillRect(bx + 4, y + 5, 1, 3);
        ctx.fillRect(bx + 5, y + 7, 1, 2);
        if (b.hp < b.maxHp * 0.25) {
          ctx.fillRect(bx + 10, y + 6, 1, 4);
          ctx.fillRect(bx + 11, y + 9, 1, 2);
        }
      }

      // HP 條（受損時顯示）
      if (b.hp < b.maxHp) {
        const barW = T - 4;
        const hpRatio = b.hp / b.maxHp;
        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(bx + 2, y, barW, 2);
        // 血量
        ctx.fillStyle = hpRatio > 0.5 ? '#44aa44' : hpRatio > 0.25 ? '#aaaa44' : '#aa4444';
        ctx.fillRect(bx + 2, y, Math.round(barW * hpRatio), 2);
      }
    }

    // 路障懸停預覽（planning 階段 + 路障模式）
    if (DK.Game.state === 'planning' && DK.UI.selectedBarricadeMode && DK.UI.hoveredTile) {
      const hc = DK.UI.hoveredTile.col;
      const hr = DK.UI.hoveredTile.row;
      const tile = DK.Map.getTile ? DK.Map.getTile(hc, hr) : null;
      if (tile && (tile === '.' || tile === 'P' || tile === 'G') && !(DK.Map.hasBarricade && DK.Map.hasBarricade(hc, hr))) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = DK.COLORS.BARRICADE_STONE || '#5a5a6e';
        ctx.fillRect(hc * T + 1, hr * T + 4, T - 2, 10);
        ctx.fillStyle = DK.COLORS.BARRICADE_STONE_DARK || '#2a2a3a';
        ctx.fillRect(hc * T + 1, hr * T + 2, T - 2, 2);
        ctx.globalAlpha = 1.0;
      }
    }
  },

  // === Path Preview System ===

  /**
   * 渲染路徑預覽（從傳送門到地心）
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   */
  pathPreview(ctx) {
    // 優先使用路徑預覽快取（支援路障標記）
    if (DK.Map.pathPreviewCache && DK.Map.pathPreviewCache.length > 0) {
      const T = DK.CONFIG.TILE_SIZE;
      const time = DK.Game.time || 0;

      for (const { hole, path } of DK.Map.pathPreviewCache) {
        if (path.length === 0) continue;

        // 建立完整路徑點陣列（起點：傳送門中心 + 路徑點 + 終點：地城之心中心）
        const points = [
          { x: hole.col * T + T, y: hole.row * T + T }, // 傳送門中心（2x2格子）
          ...path.slice(1).map(step => ({ // 跳過 path[0]（傳送門自己的格子）
            x: step.col * T + T / 2,
            y: step.row * T + T / 2,
            blocked: step.blocked
          }))
        ];

        // 加入地城之心中心點作為終點
        if (DK.Map.heartPos) {
          points.push({
            x: DK.Map.heartPos.col * T + T / 2,
            y: DK.Map.heartPos.row * T + T / 2
          });
        }

        // 檢查是否有路障
        const hasBlocked = path.some(step => step.blocked);
        const pathColor = hasBlocked ? 'rgba(255,180,40,0.6)' : 'rgba(255,255,255,0.6)';

        // 繪製虛線曲線（光滑 + 斷點）
        ctx.save();
        ctx.shadowColor = pathColor;
        ctx.shadowBlur = 4;
        ctx.strokeStyle = pathColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 虛線設定（斷點效果，快速流動）
        ctx.setLineDash([8, 4]);
        ctx.lineDashOffset = -(time * 0.025) % 12;

        ctx.beginPath();
        this._drawCardinalSpline(ctx, points, 0.5, 16);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }

    // 回退：無快取時使用舊邏輯（現在支援 planning/invasion）
    if (!DK.Map.distanceField || !DK.Map.heartPos) return;
    if (!DK.Map.breachHoles || DK.Map.breachHoles.length === 0) return;
    const T = DK.CONFIG.TILE_SIZE;

    for (const hole of DK.Map.breachHoles) {
      let col = hole.col;
      let row = hole.row;
      let steps = 0;
      const maxSteps = 200;

      while (steps < maxSteps) {
        const next = DK.Map.getNextStep ? DK.Map.getNextStep(col, row) : null;
        if (!next) break;
        if (DK.Map.isHeart && DK.Map.isHeart(next.col, next.row)) break;

        ctx.fillStyle = 'rgba(255,200,100,0.15)';
        ctx.fillRect(next.col * T + 4, next.row * T + 4, T - 8, T - 8);

        col = next.col;
        row = next.row;
        steps++;
      }
    }
  },

  /**
   * Cardinal 樣條曲線插值點計算
   * @private
   * @param {number} p0 - 前一個控制點
   * @param {number} p1 - 起點
   * @param {number} p2 - 終點
   * @param {number} p3 - 下一個控制點
   * @param {number} t - 插值參數 (0-1)
   * @param {number} tension - 張力 (0-1, 0=最平滑)
   */
  _cardinalSplinePoint(p0, p1, p2, p3, t, tension) {
    const t2 = t * t;
    const t3 = t2 * t;
    const s = (1 - tension) / 2;

    const v1 = s * (p2 - p0);
    const v2 = s * (p3 - p1);

    return (
      (2 * p1 - 2 * p2 + v1 + v2) * t3 +
      (-3 * p1 + 3 * p2 - 2 * v1 - v2) * t2 +
      v1 * t +
      p1
    );
  },

  /**
   * 繪製 Cardinal 樣條曲線
   * @private
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
   * @param {Array<{x, y}>} points - 路徑點陣列
   * @param {number} tension - 張力 (0-1)
   * @param {number} numSegments - 每段的插值數量
   */
  _drawCardinalSpline(ctx, points, tension, numSegments) {
    if (points.length < 2) return;

    // 如果只有 2 個點，直接畫直線
    if (points.length === 2) {
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      return;
    }

    // 從第一個點開始
    ctx.moveTo(points[0].x, points[0].y);

    // 為每一對相鄰點繪製曲線段
    for (let i = 0; i < points.length - 1; i++) {
      // 選擇控制點（使用邊界點作為虛擬控制點）
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      // 插值這一段
      for (let t = 1; t <= numSegments; t++) {
        const t1 = t / numSegments;

        const x = this._cardinalSplinePoint(p0.x, p1.x, p2.x, p3.x, t1, tension);
        const y = this._cardinalSplinePoint(p0.y, p1.y, p2.y, p3.y, t1, tension);

        ctx.lineTo(x, y);
      }
    }
  }
};
