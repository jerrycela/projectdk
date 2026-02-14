/**
 * Dungeon Keep - UI Screen Rendering
 * Extends DK.UI with full-screen overlay rendering (tooltips, announcements, game over, etc.)
 */
Object.assign(DK.UI, {
  renderTooltip(ctx) {
    const C = DK.COLORS;

    // Show hint for placed trap inspection
    if (this.selectedPlacedTrap && !DK.Game.gameOver) {
      this.drawHintBox(ctx, '點擊其他陷阱查看  |  右鍵取消選擇', '#ccaa44');
      return;
    }

    // Show hint for hero deployment
    if (this.selectedHeroType && !DK.Game.gameOver) {
      this.drawHintBox(ctx, '點擊地板放置英雄  |  右鍵取消選擇', '#6688cc');
      return;
    }

    // Show hint for selected hero
    if (DK.Heroes && DK.Heroes.selectedHero && !DK.Game.gameOver) {
      this.drawHintBox(ctx, '點擊回收按鈕收回英雄  |  右鍵取消選擇', '#ffaa44');
      return;
    }

    // Show placement hint when a trap is selected
    if (this.selectedTrap && !DK.Game.gameOver) {
      const hintText = this.selectedTrap.type === 'wall'
        ? '點擊紫色牆壁放置  |  右鍵取消選擇'
        : '點擊地板路徑放置  |  右鍵取消選擇';
      this.drawHintBox(ctx, hintText, C.UI_TEXT_DIM);
    }

    // 增強型陷阱 tooltip（懸停在按鈕上）
    if (this.hoveredButton && this.hoveredButton.trap) {
      this.renderTrapTooltip(ctx, this.hoveredButton.trap);
      return;
    }

    // 升級對比 tooltip（懸停在已放置的陷阱上）
    if (this.hoveredTile && !this.selectedTrap && DK.Game) {
      const { col, row } = this.hoveredTile;
      const hoveredTrap = DK.Traps.placed.find(t => t.col === col && t.row === row);
      if (hoveredTrap && DK.Game.state === 'planning') {
        this.renderUpgradePreview(ctx, hoveredTrap);
        return;
      }
    }

    // Render tooltipText near mouse cursor (fallback)
    if (this.tooltipText) {
      ctx.font = DK.FONTS.body(12);
      const tipMetrics = ctx.measureText(this.tooltipText);
      const padX = 6;
      const padY = 4;
      const tipW = tipMetrics.width + padX * 2;
      const tipH = 12 + padY * 2;
      let tipX = this.mouseX + 15;
      const tipY = this.mouseY - 10;

      // If overflows right edge, show on left side of cursor
      if (tipX + tipW > DK.CONFIG.DISPLAY_WIDTH) {
        tipX = this.mouseX - tipW - 5;
      }

      ctx.fillStyle = 'rgba(18,16,30,0.92)';
      ctx.fillRect(tipX, tipY, tipW, tipH);
      ctx.strokeStyle = '#4a3e6e';
      ctx.lineWidth = 1;
      ctx.strokeRect(tipX + 0.5, tipY + 0.5, tipW - 1, tipH - 1);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e8e0d0';
      ctx.fillText(this.tooltipText, tipX + padX, tipY + tipH / 2);
    }
  },

  /**
   * 渲染增強型陷阱 tooltip（卡片式）
   * 顯示陷阱名稱、類型、效果範圍、數值
   */
  renderTrapTooltip(ctx, trap) {
    const padX = 12;
    const padY = 10;
    const lineHeight = 16;
    const titleHeight = 20;

    let tipX = this.mouseX + 15;
    let tipY = this.mouseY + 15;

    // 構建 tooltip 內容
    const lines = [];
    lines.push({ text: trap.name, font: DK.FONTS.bold(14), color: '#ffd966' });
    lines.push({ text: `類型：${trap.type === 'floor' ? '地板陷阱' : '牆壁陷阱'}`, font: DK.FONTS.body(11), color: '#c0b090' });
    lines.push({ text: `花費：${trap.cost} 金幣`, font: DK.FONTS.body(11), color: '#ffcc44' });

    if (trap.damage > 0) {
      lines.push({ text: `傷害：${trap.damage}`, font: DK.FONTS.body(11), color: '#ff8866' });
    }

    if (trap.range > 0) {
      lines.push({ text: `範圍：${trap.range} 格`, font: DK.FONTS.body(11), color: '#88ccff' });
    }

    if (trap.element) {
      const elementName = { electric: '電擊', fire: '火焰', ice: '寒冰', water: '水' }[trap.element] || trap.element;
      lines.push({ text: `元素：${elementName}`, font: DK.FONTS.body(11), color: '#aa88ff' });
    }

    if (trap.pushForce) {
      lines.push({ text: `推力：${trap.pushForce}`, font: DK.FONTS.body(11), color: '#ffaa66' });
    }

    lines.push({ text: trap.description, font: DK.FONTS.body(10), color: '#a0a090', italic: true });

    // 計算 tooltip 尺寸
    const maxWidth = Math.max(...lines.map(line => {
      ctx.font = line.font;
      return ctx.measureText(line.text).width;
    }));
    const tipW = maxWidth + padX * 2;
    const tipH = titleHeight + (lines.length - 1) * lineHeight + padY * 2;

    // 邊界檢測
    if (tipX + tipW > DK.CONFIG.DISPLAY_WIDTH) {
      tipX = this.mouseX - tipW - 5;
    }
    if (tipY + tipH > DK.CONFIG.DISPLAY_HEIGHT) {
      tipY = this.mouseY - tipH - 5;
    }

    // 繪製卡片背景
    ctx.fillStyle = 'rgba(18,16,30,0.95)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = '#6a5a8a';
    ctx.lineWidth = 2;
    ctx.strokeRect(tipX + 1, tipY + 1, tipW - 2, tipH - 2);

    // 繪製標題底色
    ctx.fillStyle = 'rgba(80,60,100,0.4)';
    ctx.fillRect(tipX + 2, tipY + 2, tipW - 4, titleHeight);

    // 繪製文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let currentY = tipY + padY;
    lines.forEach((line, i) => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, tipX + padX, currentY);
      currentY += i === 0 ? titleHeight : lineHeight;
    });
  },

  /**
   * 渲染升級對比預覽
   * 顯示當前等級與升級後數值變化
   */
  renderUpgradePreview(ctx, trap) {
    if (trap.evolved) return; // 已升級，不顯示

    // 查找對應的升級類型
    const baseTrapId = trap.type.id;
    const evolutionType = Object.keys(DK.EVOLUTION_TYPES).find(key =>
      DK.EVOLUTION_TYPES[key].baseTrap === baseTrapId
    );

    if (!evolutionType) return;

    const evo = DK.EVOLUTION_TYPES[evolutionType];
    const canAfford = DK.Game.gold >= evo.cost;

    const padX = 12;
    const padY = 10;
    const lineHeight = 16;

    let tipX = this.mouseX + 15;
    let tipY = this.mouseY + 15;

    // 構建內容
    const lines = [];
    lines.push({ text: `${trap.type.name} → ${evo.name}`, font: DK.FONTS.bold(13), color: '#ffd966' });
    lines.push({ text: `升級成本：${evo.cost} 金幣`, font: DK.FONTS.body(11), color: canAfford ? '#88ff88' : '#ff8888' });
    lines.push({ text: evo.description, font: DK.FONTS.body(10), color: '#c0b090' });
    lines.push({ text: `需要：${evo.requiredHeroElement === 'water' ? '水' : evo.requiredHeroElement === 'fire' ? '火' : '冰'} 元素英雄光環`, font: DK.FONTS.body(10), color: '#aa88ff' });

    if (canAfford) {
      lines.push({ text: '（點擊陷阱查看詳情）', font: DK.FONTS.body(9), color: '#88cc88' });
    } else {
      lines.push({ text: '（金幣不足）', font: DK.FONTS.body(9), color: '#ff6666' });
    }

    // 計算尺寸
    const maxWidth = Math.max(...lines.map(line => {
      ctx.font = line.font;
      return ctx.measureText(line.text).width;
    }));
    const tipW = maxWidth + padX * 2;
    const tipH = lines.length * lineHeight + padY * 2;

    // 邊界檢測
    if (tipX + tipW > DK.CONFIG.DISPLAY_WIDTH) {
      tipX = this.mouseX - tipW - 5;
    }
    if (tipY + tipH > DK.CONFIG.DISPLAY_HEIGHT) {
      tipY = this.mouseY - tipH - 5;
    }

    // 繪製背景
    ctx.fillStyle = 'rgba(18,16,30,0.95)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = canAfford ? '#88cc88' : '#cc8888';
    ctx.lineWidth = 2;
    ctx.strokeRect(tipX + 1, tipY + 1, tipW - 2, tipH - 2);

    // 繪製文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let currentY = tipY + padY;
    lines.forEach(line => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, tipX + padX, currentY);
      currentY += lineHeight;
    });
  },

  /** 波次預告提示：在波次未開始時顯示下一波敵人組成 */
  renderWavePreview(ctx) {
    const game = DK.Game;
    if (!game || game.gameOver) return;
    if (game.state !== 'invasion') return;
    if (game.waveActive) return;
    if (game.currentWave >= DK.WAVES.length) return;

    const wave = DK.WAVES[game.currentWave];
    if (!wave || !wave.enemies) return;

    // 組合預告文字
    const parts = wave.enemies.map(e => {
      const typeDef = DK.ENEMY_TYPES[e.type];
      const name = typeDef ? typeDef.name : e.type;
      return `${name} x${e.count}`;
    });
    const previewText = `下一波：${parts.join('、')}`;

    // 淡入淡出脈動 - 使用快取的三角函式
    const timestamp = game.time || 0;
    const MC = DK.MathCache;
    const pulse = 0.6 + 0.2 * MC.sinTime(timestamp, 0.002);

    ctx.save();
    ctx.globalAlpha = pulse;

    // 面板尺寸與位置
    ctx.font = DK.FONTS.body(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(previewText);
    const panelW = metrics.width + 28;
    const panelH = 24;
    const panelX = DK.CONFIG.DISPLAY_WIDTH / 2 - panelW / 2;
    const panelY = 46;

    // 半透明背景
    ctx.fillStyle = 'rgba(18,16,30,0.85)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 4);
    ctx.fill();

    // 邊框
    ctx.strokeStyle = 'rgba(74,62,110,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 4);
    ctx.stroke();

    // 文字
    ctx.fillStyle = '#aaa090';
    ctx.fillText(previewText, DK.CONFIG.DISPLAY_WIDTH / 2, panelY + panelH / 2);

    ctx.restore();
  },

  renderWaveAnnouncement(ctx) {
    const C = DK.COLORS;
    const game = DK.Game;
    if (!game) return;

    const progress = 1 - this.waveStartTimer / DK.CONFIG.WAVE_START_DURATION;
    const alpha = progress < 0.2 ? progress * 5 :
                  progress > 0.75 ? (1 - progress) * 4 : 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Dark overlay band
    ctx.fillStyle = 'rgba(18,16,30,0.85)';
    ctx.fillRect(0, 240, DK.CONFIG.DISPLAY_WIDTH, 100);

    // Top and bottom borders
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(0, 240, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillRect(0, 338, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    for (let i = 0; i < DK.CONFIG.DISPLAY_WIDTH; i += 6) {
      ctx.fillRect(i, 241, 3, 1);
      ctx.fillRect(i, 337, 3, 1);
    }

    // Wave number (large)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = DK.FONTS.heavy(34);
    this.drawTextWithOutline(ctx,
      `第 ${game.currentWave + 1} 波`,
      DK.CONFIG.DISPLAY_WIDTH / 2, 275,
      '#e8e0d0', 'rgba(0,0,0,0.8)');

    // Subtitle
    ctx.font = DK.FONTS.bold(16);
    ctx.fillStyle = '#ff8866';
    ctx.fillText('敵人來襲！準備防禦！', DK.CONFIG.DISPLAY_WIDTH / 2, 310);

    // Enemy preview (which types in this wave)
    if (DK.WAVES[game.currentWave]) {
      const wave = DK.WAVES[game.currentWave];
      const enemyNames = wave.enemies.map(e => {
        const type = DK.ENEMY_TYPES[e.type];
        return type ? `${type.name} x${e.count}` : '';
      }).join('  |  ');
      ctx.font = DK.FONTS.body(12);
      ctx.fillStyle = C.UI_TEXT_DIM;
      ctx.fillText(enemyNames, DK.CONFIG.DISPLAY_WIDTH / 2, 328);
    }

    ctx.restore();
  },

  /**
   * 波次完成慶祝特效 — 金色文字 + 放大縮小動畫 + 淡出
   */
  renderWaveComplete(ctx) {
    const game = DK.Game;
    if (!game) return;

    const totalDuration = 2000;
    const elapsed = totalDuration - this.waveCompleteTimer;
    const progress = elapsed / totalDuration;

    // 計算 alpha：最後 500ms 淡出
    const fadeStart = 1500; // 開始淡出的時間點
    let alpha = 1;
    if (elapsed > fadeStart) {
      alpha = 1 - (elapsed - fadeStart) / 500;
    }
    alpha = Math.max(0, Math.min(1, alpha));

    // 放大→縮小動畫：前 200ms 放大到 1.2，之後回到 1.0
    let scale = 1;
    if (elapsed < 200) {
      scale = 1 + 0.2 * (elapsed / 200);
    } else if (elapsed < 400) {
      scale = 1.2 - 0.2 * ((elapsed - 200) / 200);
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    const cx = DK.CONFIG.DISPLAY_WIDTH / 2;
    const cy = 180;

    // 半透明背景條
    ctx.fillStyle = 'rgba(18,16,30,0.75)';
    ctx.fillRect(0, cy - 40, DK.CONFIG.DISPLAY_WIDTH, 80);

    // 上下裝飾邊線
    const C = DK.COLORS;
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(0, cy - 40, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillRect(0, cy + 38, DK.CONFIG.DISPLAY_WIDTH, 2);

    // 主標題文字：「波次完成！」
    const fontSize = Math.round(30 * scale);
    ctx.font = DK.FONTS.heavy(fontSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.drawTextWithOutline(ctx, '波次完成！', cx, cy - 8, '#ffd700', 'rgba(0,0,0,0.8)');

    // 金幣獎勵文字
    if (this.waveCompleteBonus > 0) {
      ctx.font = DK.FONTS.bold(16);
      ctx.fillStyle = '#ffe880';
      ctx.fillText(`獎勵金幣 +${this.waveCompleteBonus}`, cx, cy + 22);
    }

    ctx.restore();
  },

  renderPauseScreen(ctx) {
    ctx.save();

    // 半透明遮罩
    ctx.fillStyle = 'rgba(10,10,18,0.7)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);

    const cx = DK.CONFIG.DISPLAY_WIDTH / 2;
    const cy = DK.CONFIG.DISPLAY_HEIGHT / 2;

    // 暫停面板
    const panelW = 260;
    const panelH = 100;
    ctx.fillStyle = 'rgba(30,26,46,0.95)';
    ctx.fillRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH);
    this.drawPixelBorder(ctx, cx - panelW / 2, cy - panelH / 2, panelW, panelH);

    // 暫停文字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = DK.FONTS.heavy(28);
    this.drawTextWithOutline(ctx, '暫停', cx, cy - 15, '#88ddff', 'rgba(0,0,0,0.8)');

    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = '#8a8070';
    ctx.fillText('按 ESC 繼續遊戲', cx, cy + 20);

    ctx.restore();
  },

  renderGameOver(ctx) {
    const game = DK.Game;
    if (!game) return;

    // Full-screen overlay
    ctx.fillStyle = 'rgba(10,10,18,0.9)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, DK.CONFIG.DISPLAY_HEIGHT);

    const isVictory = game.victory === true;
    const cx = DK.CONFIG.DISPLAY_WIDTH / 2;
    const cy = DK.CONFIG.DISPLAY_HEIGHT / 2 - 30;
    const C = DK.COLORS;

    // Panel dimensions (taller to fit more stats)
    const panelW = 440;
    const panelH = 280;
    const panelX = cx - panelW / 2;
    const panelY = cy - 100;

    // Result panel background
    ctx.fillStyle = 'rgba(30,26,46,0.95)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    this.drawPixelBorder(ctx, panelX, panelY, panelW, panelH);

    // Title with thematic text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = DK.FONTS.heavy(36);
    const titleText = isVictory ? '防守成功！' : '地心毀滅...';
    const titleColor = isVictory ? '#44ff44' : '#ff4444';
    this.drawTextWithOutline(ctx, titleText, cx, panelY + 42, titleColor, 'rgba(0,0,0,0.8)');

    // Subtitle
    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = isVictory ? '#88cc88' : '#cc8888';
    const subtitle = isVictory
      ? '所有入侵者已被擊退！地心安全了！'
      : '地心被入侵者摧毀了...防守失敗。';
    ctx.fillText(subtitle, cx, panelY + 70);

    // Divider line
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(panelX + 20, panelY + 85, panelW - 40, 2);
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    for (let i = panelX + 20; i < panelX + panelW - 20; i += 6) {
      ctx.fillRect(i, panelY + 86, 3, 1);
    }

    // Stats area with pixel border
    const statsX = panelX + 20;
    const statsY = panelY + 95;
    const statsW = panelW - 40;
    const statsH = 110;
    ctx.fillStyle = 'rgba(18,16,30,0.6)';
    ctx.fillRect(statsX, statsY, statsW, statsH);
    ctx.strokeStyle = C.UI_BORDER;
    ctx.lineWidth = 1;
    ctx.strokeRect(statsX + 0.5, statsY + 0.5, statsW - 1, statsH - 1);

    // Stats grid (2 columns, 2 rows)
    const leftCol = cx - 90;
    const rightCol = cx + 90;
    let rowY = statsY + 22;

    // Row 1: Wave progress + Kills
    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = C.UI_TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.fillText('存活波數', leftCol, rowY);
    ctx.fillText('擊殺數', rightCol, rowY);

    ctx.font = DK.FONTS.heavy(20);
    this.drawTextWithOutline(ctx, `${game.currentWave} / ${DK.WAVES.length}`, leftCol, rowY + 20, C.UI_WAVE);
    this.drawTextWithOutline(ctx, `${game.enemiesKilled}`, rightCol, rowY + 20, '#ff8866');

    rowY += 56;

    // Row 2: Gold + Lives
    ctx.font = DK.FONTS.body(14);
    ctx.fillStyle = C.UI_TEXT_DIM;
    ctx.fillText('剩餘金幣', leftCol, rowY);
    ctx.fillText('地心 HP', rightCol, rowY);

    ctx.font = DK.FONTS.heavy(20);
    this.drawTextWithOutline(ctx, `${game.gold}`, leftCol, rowY + 20, C.UI_GOLD);
    const endPct = Math.ceil((game.dungeonHeartHP / game.dungeonHeartMaxHP) * 100);
    this.drawTextWithOutline(ctx, `${endPct}%`, rightCol, rowY + 20, game.dungeonHeartHP > 0 ? '#ff6666' : '#882222');

    // Bottom divider
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(panelX + 20, panelY + statsH + 100, panelW - 40, 1);

    // Restart hint (pulsing)
    const pulse = Math.sin(Date.now() / 600) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.font = DK.FONTS.bold(14);
    ctx.fillStyle = '#8a8070';
    ctx.fillText('點擊任意位置重新開始', cx, panelY + panelH - 25);
    ctx.globalAlpha = 1;
  },

  /**
   * 渲染開始畫面 (MVP 簡化版本)
   * gameCtx: 主 canvas context (960×720)
   * uiCtx: UI overlay canvas context (960×720)
   * time: 經過時間 (ms)
   */
  renderStartScreen(gameCtx, uiCtx, time) {
    const W = DK.CONFIG.DISPLAY_WIDTH;
    const H = DK.CONFIG.DISPLAY_HEIGHT;
    const cx = W / 2;

    // === 低解析度 Canvas（遊戲 Canvas）===

    // 1. 深色背景
    gameCtx.fillStyle = '#06060c';
    gameCtx.fillRect(0, 0, W, H);

    // 2. 傳送門動畫背景（3 個）
    if (DK.Map && DK.Map.drawPortalFull) {
      const portalY = 104;
      const portalColors = { glow: '#44ff88', bright: '#88ffaa', dark: '#226644' };
      for (let i = 0; i < 3; i++) {
        const portalX = (i + 1) * 80;
        DK.Map.drawPortalFull(gameCtx, portalX, portalY, portalColors, time / 1000);
      }
    }

    // === 高解析度 Canvas（UI Canvas）===

    // 4. 半透明遮罩層
    uiCtx.fillStyle = 'rgba(18,16,30,0.85)';
    uiCtx.fillRect(0, 0, W, H);

    uiCtx.save();

    // 5. 遊戲標題（大字體 + 陰影）
    uiCtx.shadowColor = '#aa44ff';
    uiCtx.shadowBlur = 20;
    uiCtx.font = DK.FONTS.heavy(48);
    uiCtx.fillStyle = '#f0e8d8';
    uiCtx.textAlign = 'center';
    uiCtx.textBaseline = 'middle';
    uiCtx.fillText('地層守衛', cx, 200);

    uiCtx.restore();

    // 6. 副標題
    uiCtx.font = DK.FONTS.body(18);
    uiCtx.fillStyle = '#c0b8a8';
    uiCtx.textAlign = 'center';
    uiCtx.textBaseline = 'middle';
    uiCtx.fillText('Dungeon Keep - 塔防原型', cx, 240);

    // 7. 遊戲目標（3 行簡介）
    const intro = [
      '🎯 守護地城之心',
      '⚔️ 部署陷阱與英雄',
      '🌀 抵禦入侵者的波次進攻'
    ];
    uiCtx.font = DK.FONTS.body(16);
    uiCtx.fillStyle = '#e8e0d0';
    for (let i = 0; i < intro.length; i++) {
      uiCtx.fillText(intro[i], cx, 300 + i * 35);
    }

    // 7.5. 視覺模式選擇（已移除 - 固定使用 DW3 優化風格）
    // 註：已改為固定使用 'standard' 模式（符合 Dungeon Warfare 3 設計理念）
    // 不再提供模式切換 UI
    /*
    const currentPreset = DK.VISUAL_SETTINGS.currentPreset;
    const presetY = 410;

    // 標題
    uiCtx.font = DK.FONTS.body(14);
    uiCtx.fillStyle = '#8a8070';
    uiCtx.fillText('視覺模式:', cx, presetY - 20);

    // 三個模式按鈕
    const presets = [
      { name: 'simple', label: '簡單', desc: '最大效能' },
      { name: 'standard', label: '標準', desc: '平衡' },
      { name: 'fancy', label: '華麗', desc: '最佳視覺' }
    ];

    const presetBtnW = 80, presetBtnH = 40;
    const presetSpacing = 20;
    const totalWidth = presets.length * presetBtnW + (presets.length - 1) * presetSpacing;
    const startX = cx - totalWidth / 2;

    for (let i = 0; i < presets.length; i++) {
      const preset = presets[i];
      const btnX = startX + i * (presetBtnW + presetSpacing);
      const btnY = presetY;
      const isSelected = currentPreset === preset.name;

      // 按鈕背景
      uiCtx.fillStyle = isSelected ? '#3a344a' : '#2a2438';
      uiCtx.fillRect(btnX, btnY, presetBtnW, presetBtnH);

      // 按鈕邊框
      uiCtx.strokeStyle = isSelected ? '#aa44ff' : '#4a3e6e';
      uiCtx.lineWidth = isSelected ? 2 : 1;
      uiCtx.strokeRect(btnX, btnY, presetBtnW, presetBtnH);

      // 按鈕文字（標籤）
      uiCtx.font = DK.FONTS.bold(14);
      uiCtx.fillStyle = isSelected ? '#f0e8d8' : '#c0b8a8';
      uiCtx.fillText(preset.label, btnX + presetBtnW / 2, btnY + 14);

      // 按鈕文字（描述）
      uiCtx.font = DK.FONTS.body(10);
      uiCtx.fillStyle = '#8a8070';
      uiCtx.fillText(preset.desc, btnX + presetBtnW / 2, btnY + 30);

      // 儲存按鈕位置（用於點擊檢測）
      if (!this._presetButtons) this._presetButtons = [];
      this._presetButtons[i] = {
        x: btnX,
        y: btnY,
        w: presetBtnW,
        h: presetBtnH,
        preset: preset.name
      };
    }
    */

    // 8. 開始按鈕（脈動動畫）- 使用快取的三角函式
    const MC = DK.MathCache;
    const pulse = MC.sinTime(time, 0.001) * 0.1 + 0.9; // time/1000 * PI = time * PI/1000 ≈ 0.00314
    const btnW = 200, btnH = 50;
    const btnX = cx - btnW / 2, btnY = 480;

    uiCtx.fillStyle = '#2a2438';
    uiCtx.fillRect(btnX, btnY, btnW, btnH);

    uiCtx.strokeStyle = `rgba(170,68,255,${pulse})`;
    uiCtx.lineWidth = 2;
    uiCtx.strokeRect(btnX, btnY, btnW, btnH);

    uiCtx.font = DK.FONTS.bold(20);
    uiCtx.fillStyle = '#f0e8d8';
    uiCtx.fillText('開始遊戲', cx, btnY + btnH / 2);

    // 8.5. 教學按鈕
    const tutBtnW = 160, tutBtnH = 40;
    const tutBtnX = cx - tutBtnW / 2, tutBtnY = btnY + btnH + 15;

    uiCtx.fillStyle = '#1a2438';
    uiCtx.fillRect(tutBtnX, tutBtnY, tutBtnW, tutBtnH);
    uiCtx.strokeStyle = '#4a6e8e';
    uiCtx.lineWidth = 1;
    uiCtx.strokeRect(tutBtnX, tutBtnY, tutBtnW, tutBtnH);

    uiCtx.font = DK.FONTS.bold(16);
    uiCtx.fillStyle = '#88ddff';
    uiCtx.fillText('教學模式', cx, tutBtnY + tutBtnH / 2);

    // 儲存教學按鈕位置（用於點擊檢測）
    this._tutorialButton = { x: tutBtnX, y: tutBtnY, w: tutBtnW, h: tutBtnH };

    // 9. 提示文字（閃爍）- 使用快取的三角函式
    const blinkAlpha = MC.sinTime(time, 0.00167) * 0.3 + 0.7; // time/600 * PI ≈ 0.00524
    uiCtx.globalAlpha = blinkAlpha;
    uiCtx.font = DK.FONTS.body(14);
    uiCtx.fillStyle = '#8a8070';
    uiCtx.fillText('點擊任意處開始', cx, 580);
    uiCtx.globalAlpha = 1;
  }
});
