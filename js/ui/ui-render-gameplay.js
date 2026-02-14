/**
 * Dungeon Keep - UI Gameplay Rendering
 * Extends DK.UI with in-game HUD and interaction rendering
 */
Object.assign(DK.UI, {
  renderHUD(ctx) {
    const C = DK.COLORS;
    const game = DK.Game;
    if (!game) return;

    // 浮動半透明狀態列（優化後的背景透明度）
    ctx.fillStyle = 'rgba(30,26,46,0.8)';
    ctx.fillRect(0, 0, DK.CONFIG.DISPLAY_WIDTH, 40);

    // Bottom border (decorative pixel line)
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(0, 38, DK.CONFIG.DISPLAY_WIDTH, 2);
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    for (let i = 0; i < DK.CONFIG.DISPLAY_WIDTH; i += 6) {
      ctx.fillRect(i, 37, 3, 1);
    }

    ctx.textBaseline = 'middle';

    // HP 低於 30% 時閃爍警告
    const heartPct = Math.ceil((game.dungeonHeartHP / game.dungeonHeartMaxHP) * 100);
    const lowHP = heartPct < 30;
    let originalAlpha = 1;
    if (lowHP) {
      originalAlpha = ctx.globalAlpha;
      const flash = Math.sin(Date.now() / 200) * 0.5 + 0.5; // 0.5 ~ 1.0 脈動
      ctx.globalAlpha = 0.6 + flash * 0.4;
    }

    // 💰 金幣
    ctx.textAlign = 'left';
    ctx.font = DK.FONTS.bold(16);
    this.drawTextWithOutline(ctx, '💰', 15, 20, C.UI_TEXT);
    ctx.font = DK.FONTS.heavy(18);
    this.drawTextWithOutline(ctx, `${game.gold}`, 42, 20, C.UI_GOLD);

    // ❤️ 地城之心 HP（顯示為 當前/最大 格式）
    ctx.font = DK.FONTS.bold(16);
    this.drawTextWithOutline(ctx, '❤️', 130, 20, '#ff6666');
    ctx.font = DK.FONTS.heavy(18);
    this.drawTextWithOutline(ctx, `${game.dungeonHeartHP}/${game.dungeonHeartMaxHP}`, 157, 20, '#ff6666');

    // 恢復原始透明度
    if (lowHP) {
      ctx.globalAlpha = originalAlpha;
    }

    // 📊 波次
    ctx.font = DK.FONTS.bold(16);
    this.drawTextWithOutline(ctx, '📊', 300, 20, C.UI_WAVE);
    ctx.font = DK.FONTS.heavy(18);
    this.drawTextWithOutline(ctx, `${game.currentWave + 1}/${DK.WAVES.length}`, 327, 20, '#66bbff');

    // ⚔️ 敵人（顯示為 存活/總數 格式）
    if (game.waveActive) {
      ctx.font = DK.FONTS.bold(16);
      const aliveCount = DK.Enemies.active.filter(e => e.alive).length;
      const totalCount = DK.Enemies.active.length;
      this.drawTextWithOutline(ctx, '⚔️', 450, 20, C.UI_TEXT);
      ctx.font = DK.FONTS.heavy(18);
      this.drawTextWithOutline(ctx, `${aliveCount}/${totalCount}`, 477, 20, C.UI_TEXT);
    }

    // 遊戲標題
    ctx.textAlign = 'right';
    ctx.font = DK.FONTS.pixel(12);
    this.drawTextWithOutline(ctx, 'PROJECT DK', DK.CONFIG.DISPLAY_WIDTH - 15, 20, C.UI_TEXT_DIM);
  },

  renderHoverIndicator(ctx) {
    if (!this.hoveredTile) return;
    if (DK.Game && DK.Game.gameOver) return;

    const { col, row } = this.hoveredTile;
    const T = DK.CONFIG.DISPLAY_TILE;
    const cam = DK.Game.camera;
    const x = (col * DK.CONFIG.TILE_SIZE - cam.x) * DK.CONFIG.SCALE;
    const y = (row * DK.CONFIG.TILE_SIZE - cam.y) * DK.CONFIG.SCALE;

    // 移除 BREACH 階段的牆壁高亮（已廢除）
    // Planning 階段：無需高亮牆壁

    // Hero deployment hover
    if (this.selectedHeroType) {
      const validFloor = DK.Map.isPath(col, row) &&
                         DK.Map.layout[row] && DK.Map.layout[row][col] !== 'E' &&
                         DK.Map.layout[row][col] !== 'X';
      const notOccupied = !DK.Traps.placed.some(t => t.col === col && t.row === row) &&
                          !(DK.Heroes && DK.Heroes.active.some(h => h.col === col && h.row === row));
      const valid = validFloor && notOccupied;

      ctx.strokeStyle = valid ? 'rgba(68,136,255,0.7)' : 'rgba(255,100,100,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);
      if (valid) {
        ctx.fillStyle = 'rgba(68,136,255,0.15)';
        ctx.fillRect(x, y, T, T);
      }
      return;
    }

    // Trap placement hover
    if (!this.selectedTrap) return;

    let valid = false;
    if (this.selectedTrap.type === 'wall') {
      valid = DK.Map.isValidWallTrapSlot(col, row);
    } else {
      valid = DK.Map.isValidFloorTrapSlot(col, row);
    }

    // Check if already occupied
    if (DK.Traps.placed.some(t => t.col === col && t.row === row)) {
      valid = false;
    }

    ctx.strokeStyle = valid ? 'rgba(100,255,100,0.6)' : 'rgba(255,100,100,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, T - 2, T - 2);

    if (valid) {
      ctx.fillStyle = 'rgba(100,255,100,0.15)';
      ctx.fillRect(x, y, T, T);
    }
  },

  renderPlacementPreview(ctx) {
    if (!this.hoveredTile || !this.selectedTrap) return;

    const { col, row } = this.hoveredTile;
    const T = DK.CONFIG.DISPLAY_TILE;
    const cam = DK.Game.camera;
    const range = this.selectedTrap.range * T;

    // 判斷位置有效性
    let valid = false;
    if (this.selectedTrap.type === 'wall') {
      valid = DK.Map.isValidWallTrapSlot(col, row);
    } else {
      valid = DK.Map.isValidFloorTrapSlot(col, row);
    }

    // 檢查是否已佔用
    const occupied = DK.Traps.placed.some(t => t.col === col && t.row === row);
    if (occupied) valid = false;

    // 檢查是否為次佳位置（邊緣位置 - 接近外牆）
    const isEdge = col <= 1 || col >= DK.CONFIG.WORLD_COLS - 2 ||
                   row <= 1 || row >= DK.CONFIG.WORLD_ROWS - 2;

    // 顏色編碼
    let previewColor, rangeColor;
    if (!valid) {
      previewColor = 'rgba(255,100,100,0.5)'; // 紅色 - 不可放置
      rangeColor = 'rgba(255,100,100,0.3)';
    } else if (isEdge && this.selectedTrap.type === 'floor') {
      previewColor = 'rgba(255,220,100,0.5)'; // 黃色 - 次佳位置
      rangeColor = 'rgba(255,220,100,0.3)';
    } else {
      previewColor = 'rgba(100,255,100,0.5)'; // 綠色 - 可放置
      rangeColor = 'rgba(100,255,100,0.3)';
    }

    const cx = (col * DK.CONFIG.TILE_SIZE - cam.x) * DK.CONFIG.SCALE + T / 2;
    const cy = (row * DK.CONFIG.TILE_SIZE - cam.y) * DK.CONFIG.SCALE + T / 2;

    // 繪製範圍圈（虛線）
    if (range > 0) {
      ctx.strokeStyle = rangeColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = rangeColor.replace('0.3', '0.1');
      ctx.fill();
    }

    // 繪製半透明陷阱圖示
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = previewColor;
    const iconSize = T * 0.6;
    const iconX = cx - iconSize / 2;
    const iconY = cy - iconSize / 2;

    // 根據陷阱類型繪製不同圖示
    if (this.selectedTrap.element === 'electric') {
      // 電擊板 - 閃電符號
      ctx.strokeStyle = '#ffff44';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - iconSize / 3);
      ctx.lineTo(cx - iconSize / 4, cy);
      ctx.lineTo(cx + iconSize / 6, cy);
      ctx.lineTo(cx, cy + iconSize / 3);
      ctx.stroke();
    } else if (this.selectedTrap.id === 'push_trap' || this.selectedTrap.id === 'wind_trap') {
      // 推力/風壓 - 箭頭
      ctx.fillStyle = '#ffaa44';
      ctx.beginPath();
      ctx.moveTo(cx + iconSize / 2, cy);
      ctx.lineTo(cx - iconSize / 3, cy - iconSize / 3);
      ctx.lineTo(cx - iconSize / 3, cy + iconSize / 3);
      ctx.closePath();
      ctx.fill();
    } else if (this.selectedTrap.id === 'oil_trap') {
      // 油漬 - 水滴形狀
      ctx.fillStyle = '#8a6030';
      ctx.beginPath();
      ctx.arc(cx, cy + iconSize / 6, iconSize / 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx, cy - iconSize / 3);
      ctx.lineTo(cx - iconSize / 4, cy + iconSize / 6);
      ctx.lineTo(cx + iconSize / 4, cy + iconSize / 6);
      ctx.closePath();
      ctx.fill();
    } else {
      // 預設 - 方形
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
    }

    ctx.restore();

    // 繪製狀態文字
    ctx.font = DK.FONTS.body(10);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const statusText = !valid ? '無效位置' : (isEdge && this.selectedTrap.type === 'floor') ? '次佳位置' : '可放置';
    const statusColor = !valid ? '#ff8888' : (isEdge && this.selectedTrap.type === 'floor') ? '#ffdd88' : '#88ff88';

    // 文字陰影
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(statusText, cx + 1, cy + T / 2 + 6);
    ctx.fillStyle = statusColor;
    ctx.fillText(statusText, cx, cy + T / 2 + 5);
  },

  renderMessages(ctx) {
    const C = DK.COLORS;
    let y = DK.CONFIG.UI_TOP - 30;

    for (const msg of this.messageQueue) {
      const alpha = Math.min(1, msg.timer / 500);
      ctx.save();
      ctx.globalAlpha = alpha;

      // Message background
      ctx.font = DK.FONTS.bold(16);
      const metrics = ctx.measureText(msg.text);
      const msgW = metrics.width + 24;
      const msgX = DK.CONFIG.DISPLAY_WIDTH / 2 - msgW / 2;

      ctx.fillStyle = 'rgba(80,20,20,0.9)';
      ctx.fillRect(msgX, y - 12, msgW, 24);
      ctx.strokeStyle = '#cc4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(msgX, y - 12, msgW, 24);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ff8888';
      ctx.fillText(msg.text, DK.CONFIG.DISPLAY_WIDTH / 2, y);

      ctx.restore();
      y -= 30;
    }
  },

  renderHeroRecallButton(ctx) {
    if (!DK.Heroes || !DK.Heroes.selectedHero) {
      this._recallButtonRect = null;
      return;
    }

    const hero = DK.Heroes.selectedHero;
    const cam = DK.Game.camera;
    const screenX = (hero.x - cam.x) * DK.CONFIG.SCALE;
    const screenY = (hero.y - cam.y) * DK.CONFIG.SCALE;

    // 按鈕位置：英雄上方
    const btnW = 60;
    const btnH = 24;
    const btnX = screenX - btnW / 2;
    const btnY = screenY - 60; // 英雄上方

    // 邊界檢查：確保按鈕不超出畫面
    const clampedX = Math.max(4, Math.min(DK.CONFIG.DISPLAY_WIDTH - btnW - 4, btnX));
    const clampedY = Math.max(44, btnY); // 不蓋住 HUD bar

    // 儲存點擊區域
    this._recallButtonRect = { x: clampedX, y: clampedY, w: btnW, h: btnH };

    // 背景
    ctx.fillStyle = 'rgba(18,16,30,0.9)';
    ctx.beginPath();
    ctx.roundRect(clampedX, clampedY, btnW, btnH, 4);
    ctx.fill();

    // 邊框
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(clampedX, clampedY, btnW, btnH, 4);
    ctx.stroke();

    // 文字
    ctx.font = DK.FONTS.bold(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.drawTextWithOutline(ctx, '回收', clampedX + btnW / 2, clampedY + btnH / 2, '#ffaa44');

    // 金幣退還提示
    ctx.font = DK.FONTS.body(10);
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`+${hero.type.cost}金`, clampedX + btnW / 2, clampedY + btnH + 10);
  },

  /**
   * 共用提示框渲染輔助函式
   * 在遊戲區域底部中央繪製帶背景的提示文字
   */
  drawHintBox(ctx, text, textColor) {
    ctx.font = DK.FONTS.body(12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(text);
    const tw = metrics.width + 16;
    const hx = DK.CONFIG.DISPLAY_WIDTH / 2 - tw / 2;
    const hy = DK.CONFIG.UI_TOP - 22;

    // 背景圓角矩形
    ctx.fillStyle = 'rgba(18,16,30,0.8)';
    ctx.beginPath();
    ctx.roundRect(hx, hy, tw, 18, 3);
    ctx.fill();

    // 邊框
    ctx.strokeStyle = 'rgba(74,62,110,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(hx, hy, tw, 18, 3);
    ctx.stroke();

    // 文字
    ctx.fillStyle = textColor;
    ctx.fillText(text, DK.CONFIG.DISPLAY_WIDTH / 2, DK.CONFIG.UI_TOP - 13);
  },

  renderSelectedTrapInfo(ctx) {
    // Clear evolve button rect if no trap selected
    if (!this.selectedPlacedTrap) {
      this._evolveButtonRect = null;
      return;
    }

    const trap = this.selectedPlacedTrap;
    const T = DK.CONFIG.DISPLAY_TILE;
    const cam = DK.Game.camera;
    const trapScreenX = (trap.col * DK.CONFIG.TILE_SIZE - cam.x) * DK.CONFIG.SCALE;
    const trapScreenY = (trap.row * DK.CONFIG.TILE_SIZE - cam.y) * DK.CONFIG.SCALE;
    const trapCX = trapScreenX + T / 2;

    // Draw highlight around selected trap
    ctx.strokeStyle = '#ffcc44';
    ctx.lineWidth = 2;
    ctx.strokeRect(trapScreenX + 1, trapScreenY + 1, T - 2, T - 2);
    // Inner glow
    const glowAlpha = Math.sin(Date.now() / 400) * 0.15 + 0.2;
    ctx.fillStyle = `rgba(255,204,68,${glowAlpha})`;
    ctx.fillRect(trapScreenX, trapScreenY, T, T);

    // Determine trap info
    const trapDef = trap.type || {};
    const isEvolved = !!trap.evolved;
    const evoInfo = (!isEvolved && DK.Traps) ? DK.Traps.getEvolutionForTrap(trap) : null;
    const auraHero = (!isEvolved && DK.Traps) ? DK.Traps.getAuraHeroForTrap(trap) : null;
    const canEvolve = !!evoInfo && !!auraHero;
    const hasEvolutionPath = !!evoInfo; // Has evolution but may lack aura

    // Panel dimensions
    const panelW = 220;
    const lineH = 18;
    let contentLines = 3; // name + stats + element
    if (isEvolved) contentLines += 2; // evolved name + description
    if (canEvolve) contentLines += 2; // evolve button + description preview
    if (!isEvolved && hasEvolutionPath && !canEvolve) contentLines += 1; // aura hint
    const panelH = 16 + contentLines * lineH + (canEvolve ? 30 : 8);

    // Position: above the trap, or below if not enough room
    let panelX = trapCX - panelW / 2;
    let panelY = trapScreenY - panelH - 8;
    if (panelY < 42) {
      panelY = trapScreenY + T + 8;
    }
    // Clamp horizontal
    if (panelX < 4) panelX = 4;
    if (panelX + panelW > DK.CONFIG.DISPLAY_WIDTH - 4) {
      panelX = DK.CONFIG.DISPLAY_WIDTH - panelW - 4;
    }

    // Panel background
    ctx.fillStyle = 'rgba(18,16,30,0.95)';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    this.drawPixelBorder(ctx, panelX, panelY, panelW, panelH);

    // Content rendering
    let curY = panelY + 14;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const centerX = panelX + panelW / 2;

    // Trap name (gold if evolved, white otherwise)
    ctx.font = DK.FONTS.bold(16);
    const nameColor = isEvolved ? '#ffcc44' : '#e8e0d0';
    this.drawTextWithOutline(ctx, trapDef.name || trapDef.id || '陷阱', centerX, curY, nameColor);
    curY += lineH;

    // Evolved name + description
    if (isEvolved && trap.evolutionType) {
      const evoType = DK.EVOLUTION_TYPES ? DK.EVOLUTION_TYPES[trap.evolutionType] : null;
      const evoName = evoType ? evoType.name : trap.evolutionType;
      ctx.font = DK.FONTS.bold(14);
      this.drawTextWithOutline(ctx, `★ ${evoName}`, centerX, curY, '#ffcc44');
      curY += lineH;

      // Evolution description
      if (evoType && evoType.description) {
        ctx.font = DK.FONTS.body(11);
        this.drawTextWithOutline(ctx, evoType.description, centerX, curY, '#ccaa66');
        curY += lineH;
      }
    }

    // Stats: damage / cooldown (adapt for push traps)
    ctx.font = DK.FONTS.body(13);
    const damage = trapDef.damage || 0;
    const cooldown = trapDef.cooldown || 0;
    let statsText;
    if (damage === 0 && trapDef.pushForce) {
      statsText = `推力: ${trapDef.pushForce}  冷卻: ${(cooldown / 1000).toFixed(1)}s`;
    } else {
      statsText = `傷害: ${damage}  冷卻: ${(cooldown / 1000).toFixed(1)}s`;
    }
    this.drawTextWithOutline(ctx, statsText, centerX, curY, '#ccbbaa');
    curY += lineH;

    // Element info
    const element = trapDef.element || '';
    const elementNames = {
      electric: '雷電',
      fire: '火焰',
      wind: '風',
      physical: '物理',
    };
    const elementColors = {
      electric: '#ffdd44',
      fire: '#ff6622',
      wind: '#88aacc',
      physical: '#ccbbaa',
    };
    if (element) {
      ctx.font = DK.FONTS.body(12);
      const eName = elementNames[element] || element;
      const eColor = elementColors[element] || '#ccbbaa';
      this.drawTextWithOutline(ctx, `元素: ${eName}`, centerX, curY, eColor);
      curY += lineH;
    }

    // Evolve section
    if (canEvolve && evoInfo) {
      // Evolution effect preview
      if (evoInfo.description) {
        ctx.font = DK.FONTS.body(11);
        this.drawTextWithOutline(ctx, evoInfo.description, centerX, curY, '#aabb88');
        curY += lineH;
      }

      // Evolve button
      const btnW = panelW - 20;
      const btnH = 24;
      const btnX = panelX + 10;
      const btnY = curY + 2;
      const canAfford = DK.Game && DK.Game.gold >= evoInfo.cost;

      // Store for click detection
      this._evolveButtonRect = { x: btnX, y: btnY, w: btnW, h: btnH };

      // Button background
      const grad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
      if (canAfford) {
        grad.addColorStop(0, '#4a3e10');
        grad.addColorStop(1, '#3a2e08');
      } else {
        grad.addColorStop(0, '#3a3030');
        grad.addColorStop(1, '#2a2020');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(btnX, btnY, btnW, btnH);

      // Button border (pulsing if affordable)
      if (canAfford) {
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,204,68,${pulse})`;
      } else {
        ctx.strokeStyle = '#665533';
      }
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX + 0.5, btnY + 0.5, btnW - 1, btnH - 1);

      // Button text
      const evoName = evoInfo.name || evoInfo.id;
      const evoCost = evoInfo.cost;
      ctx.font = DK.FONTS.bold(13);
      ctx.textAlign = 'center';
      const btnText = `進化 → ${evoName} (${evoCost}金)`;
      this.drawTextWithOutline(ctx, btnText, btnX + btnW / 2, btnY + btnH / 2,
        canAfford ? '#ffdd66' : '#887744');
    } else if (!isEvolved && hasEvolutionPath && !canEvolve) {
      // Has evolution path but not in aura range
      ctx.font = DK.FONTS.body(11);
      this.drawTextWithOutline(ctx, '需要對應英雄光環才能進化', centerX, curY, '#666060');
      curY += lineH;
      this._evolveButtonRect = null;
    } else {
      this._evolveButtonRect = null;
    }
  }
});
