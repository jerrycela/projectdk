/**
 * Dungeon Keep - UI Button Rendering
 * Extends DK.UI with button and icon rendering methods
 */
Object.assign(DK.UI, {
  renderPhaseHint(ctx) {
    const game = DK.Game;
    if (!game || game.gameOver) return;

    let hintText = '';
    let hintColor = '#aaa090';

    if (game.state === 'planning') {
      hintText = '部署陷阱和英雄 → 點擊右側按鈕開始入侵';
      hintColor = '#88ddff';
    } else if (game.state === 'invasion' && game.waveAutoTimer > 0) {
      hintText = `下一波倒數 ${Math.ceil(game.waveAutoTimer / 1000)} 秒`;
      hintColor = '#88ddff';
    }

    if (!hintText) return;

    const panelY = 46;
    const panelH = 24;

    ctx.save();
    ctx.font = DK.FONTS.body(13);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const metrics = ctx.measureText(hintText);
    const panelW = metrics.width + 28;
    const panelX = DK.CONFIG.DISPLAY_WIDTH / 2 - panelW / 2;

    ctx.fillStyle = 'rgba(18,16,30,0.85)';
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(74,62,110,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 4);
    ctx.stroke();

    ctx.fillStyle = hintColor;
    ctx.fillText(hintText, DK.CONFIG.DISPLAY_WIDTH / 2, panelY + panelH / 2);

    ctx.restore();
  },

  drawPixelBorder(ctx, x, y, w, h) {
    const C = DK.COLORS;
    const s = 3; // pixel size for border segments

    // Outer border
    ctx.fillStyle = C.UI_BORDER;
    ctx.fillRect(x, y, w, s);
    ctx.fillRect(x, y + h - s, w, s);
    ctx.fillRect(x, y, s, h);
    ctx.fillRect(x + w - s, y, s, h);

    // Inner highlight (top and left)
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    ctx.fillRect(x + s, y + s, w - s * 2, 1);
    ctx.fillRect(x + s, y + s, 1, h - s * 2);

    // Inner shadow (bottom and right)
    ctx.fillStyle = '#1a1630';
    ctx.fillRect(x + s, y + h - s - 1, w - s * 2, 1);
    ctx.fillRect(x + w - s - 1, y + s, 1, h - s * 2);

    // Corner decorations (pixel art diamonds)
    ctx.fillStyle = C.UI_BORDER_LIGHT;
    // Top-left corner
    ctx.fillRect(x + s, y + s, 2, 2);
    // Top-right corner
    ctx.fillRect(x + w - s - 2, y + s, 2, 2);
    // Bottom-left corner
    ctx.fillRect(x + s, y + h - s - 2, 2, 2);
    // Bottom-right corner
    ctx.fillRect(x + w - s - 2, y + h - s - 2, 2, 2);
  },

  /**
   * Draw a small pixel art icon representing a trap type
   */
  drawTrapIcon(ctx, x, y, trapId, size) {
    ctx.save(); // 保護 Canvas 狀態

    const s = size || 24;
    const hs = s / 2;

    switch (trapId) {
      case 'shock_plate':
        // Lightning bolt icon
        if (DK.DEBUG_MODE) {
          console.log(`[UI] 繪製 shock_plate 圖標: x=${x}, y=${y}, size=${s}`);
        }

        ctx.fillStyle = '#ffdd44';
        ctx.fillRect(x + hs, y + 3, 2, 3);
        ctx.fillRect(x + hs - 2, y + 6, 5, 2);
        ctx.fillRect(x + hs, y + 8, 2, 3);
        ctx.fillRect(x + hs - 1, y + 11, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + hs, y + 6, 1, 1);
        break;

      case 'push_trap':
        // Piston/ram icon
        ctx.fillStyle = '#5a5060';
        ctx.fillRect(x + 4, y + 3, s - 8, 6);
        ctx.fillStyle = '#8a8090';
        ctx.fillRect(x + 5, y + 4, s - 10, 4);
        // Ram plate
        ctx.fillStyle = '#aaa0b0';
        ctx.fillRect(x + 4, y + s - 8, s - 8, 3);
        ctx.fillStyle = '#bbb0c0';
        ctx.fillRect(x + 4, y + s - 8, s - 8, 1);
        // Charge glow
        ctx.fillStyle = '#ff6622';
        ctx.fillRect(x + hs - 1, y + 6, 2, 2);
        // Direction arrow
        ctx.fillStyle = '#ff8844';
        ctx.fillRect(x + hs - 1, y + s - 4, 2, 2);
        ctx.fillRect(x + hs, y + s - 3, 1, 2);
        break;

      case 'oil_trap':
        // 油漬陷阱圖標
        ctx.fillStyle = '#3a3020';
        ctx.beginPath();
        ctx.arc(x + hs, y + hs + 2, hs - 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2a2010';
        ctx.beginPath();
        ctx.arc(x + hs, y + hs + 2, hs - 8, 0, Math.PI * 2);
        ctx.fill();
        // 油光反射
        ctx.fillStyle = '#5a5030';
        ctx.fillRect(x + hs - 2, y + hs - 1, 3, 1);
        // 油滴
        ctx.fillStyle = '#3a2810';
        ctx.fillRect(x + hs - 1, y + hs + 3, 2, 2);
        ctx.fillRect(x + hs + 2, y + hs + 1, 1, 2);
        // 噴嘴
        ctx.fillStyle = '#4a3828';
        ctx.fillRect(x + hs - 3, y + hs, 1, 1);
        ctx.fillRect(x + hs + 3, y + hs, 1, 1);
        break;

      case 'wind_trap':
        // 風壓裝置圖標
        ctx.fillStyle = '#2a3448';
        ctx.fillRect(x + 3, y + 2, s - 6, s - 4);
        ctx.fillStyle = '#88aacc';
        // 風扇葉片 (X 形)
        ctx.fillRect(x + hs - 1, y + 4, 2, s - 8);
        ctx.fillRect(x + 4, y + hs - 1, s - 8, 2);
        // 中心軸
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(x + hs - 1, y + hs - 1, 2, 2);
        break;

      default:
        // 未知陷阱 ID：繪製紅色警告框
        if (DK.DEBUG_MODE) {
          console.error(`[UI] 未知的陷阱 ID: ${trapId}`);
        }
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x, y, s, s);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('?', x + hs, y + hs + 3);
        break;
    }

    ctx.restore(); // 恢復 Canvas 狀態
  },

  renderButton(ctx, btn) {
    // 診斷：記錄按鈕類型
    if (DK.DEBUG_MODE && btn.trap) {
      console.log(`[UI] renderButton: ${btn.trap.name} (id: ${btn.trap.id}), trap object:`, btn.trap);
    }

    const C = DK.COLORS;
    const isSelected = btn.trap && this.selectedTrap && btn.trap.id === this.selectedTrap.id;
    const game = DK.Game;
    const canAfford = btn.trap ? (game && game.gold >= btn.trap.cost) : true;

    // 計算按鈕狀態
    const btnState = this.getButtonState(btn);
    const isHovered = btnState === this.ButtonStates.HOVER;

    // 緩動過渡：使用 DK.MathCache.easing.smoothstep 實現流暢 hover 動畫
    const hoverProgress = btn.hoverProgress || 0;
    const easedProgress = DK.MathCache.easing.smoothstep(hoverProgress);

    // HOVER 狀態：上浮效果（-5px），使用緩動過渡
    const offsetY = -5 * easedProgress;

    // Alpha 過渡（懸停時高亮疊加層 alpha 提升）
    const hoverAlpha = 0.15 * easedProgress;

    // 儲存 canvas 狀態，套用位移
    ctx.save();
    ctx.translate(0, offsetY);

    // Button background with gradient
    const grad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
    if (isSelected) {
      grad.addColorStop(0, '#302850');
      grad.addColorStop(1, '#1e1838');
    } else {
      grad.addColorStop(0, '#241e36');
      grad.addColorStop(1, '#181430');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

    // Pixel art border
    ctx.strokeStyle = isSelected ? C.UI_SELECTED : C.UI_BORDER;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);

    // Inner highlight (top edge)
    ctx.fillStyle = isSelected ? 'rgba(255,170,68,0.2)' : 'rgba(106,94,142,0.3)';
    ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, 1);

    if (btn.action === 'start_wave') {
      // Phase-dependent wave/breach button
      let buttonText = '';
      let buttonColor = '#88ddff';
      let isEnabled = true;
      let subText = '';

      if (game && game.state === 'planning') {
        buttonText = '開始入侵';
        buttonColor = '#ff6644';
        subText = '部署完成後點擊';
      } else if (game && game.state === 'invasion') {
        if (game.waveAutoTimer > 0) {
          buttonText = `下一波 ${Math.ceil(game.waveAutoTimer / 1000)}秒`;
          buttonColor = '#88ddff';
        } else if (game.waveActive) {
          buttonText = '戰鬥中...';
          buttonColor = C.UI_TEXT_DIM;
        } else {
          buttonText = '等待中...';
          buttonColor = C.UI_TEXT_DIM;
        }
        isEnabled = false;
        subText = `第 ${game.currentWave + 1} / ${DK.WAVES.length} 波`;
      }

      // Pulsing border when actionable
      if (isEnabled && game && !game.gameOver) {
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(68,170,255,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
      }

      ctx.font = DK.FONTS.bold(16);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.drawTextWithOutline(ctx,
        buttonText,
        btn.x + btn.width / 2,
        btn.y + btn.height / 2 - 10,
        buttonColor
      );

      // Sub text
      if (subText) {
        ctx.font = DK.FONTS.body(11);
        ctx.fillStyle = C.UI_TEXT_DIM;
        ctx.fillText(subText, btn.x + btn.width / 2, btn.y + btn.height / 2 + 10);
      }

      // Hover highlight overlay - 使用緩動 alpha
      if (hoverAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${hoverAlpha})`;
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

      // 鍵盤焦點高亮（無障礙）
      const btnIndex1 = this.buttons.indexOf(btn);
      if (this.keyboardNavigationEnabled && this.keyboardFocusIndex === btnIndex1) {
        const focusPulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,255,0,${focusPulse})`; // 黃色焦點邊框
        ctx.lineWidth = 3;
        ctx.strokeRect(btn.x - 1.5, btn.y - 1.5, btn.width + 3, btn.height + 3);
      }

      ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
      return;
    }

    // 路障按鈕渲染
    if (btn.barricade) {
      const isBarricadeSelected = DK.UI.selectedBarricadeMode;
      ctx.fillStyle = isBarricadeSelected ? '#4a3e6e' : '#1e1a2e';
      ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
      ctx.strokeStyle = isBarricadeSelected ? '#ffaa44' : '#4a3e6e';
      ctx.lineWidth = isBarricadeSelected ? 2 : 1;
      ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);

      // 石磚圖示（小型）
      const iconX = btn.x + btn.width / 2 - 8;
      const iconY = btn.y + 12;
      ctx.fillStyle = '#5a5a6e';
      ctx.fillRect(iconX, iconY, 16, 10);
      ctx.fillStyle = '#7a7a8e';
      ctx.fillRect(iconX, iconY, 16, 1);
      ctx.fillRect(iconX, iconY, 1, 10);
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(iconX, iconY + 5, 16, 1);

      // 文字（路障 + 數量）
      const count = DK.Map.barricades ? DK.Map.barricades.length : 0;
      const max = DK.CONFIG.BARRICADE_MAX || 5;
      ctx.fillStyle = '#e8e0d0';
      ctx.font = DK.FONTS.body(11);
      ctx.textAlign = 'center';
      ctx.fillText('路障', btn.x + btn.width / 2, btn.y + 40);
      ctx.fillStyle = count >= max ? '#ff4444' : '#8a8070';
      ctx.font = DK.FONTS.body(10);
      ctx.fillText(`${count}/${max}`, btn.x + btn.width / 2, btn.y + 55);
      ctx.textAlign = 'left';

      // 選取中脈衝邊框
      if (isBarricadeSelected) {
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,170,68,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
      }

      // 懸停高亮 - 使用緩動 alpha
      if (hoverAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${hoverAlpha})`;
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

      // 鍵盤焦點高亮（無障礙）
      const btnIndex2 = this.buttons.indexOf(btn);
      if (this.keyboardNavigationEnabled && this.keyboardFocusIndex === btnIndex2) {
        const focusPulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,255,0,${focusPulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(btn.x - 1.5, btn.y - 1.5, btn.width + 3, btn.height + 3);
      }

      ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
      return;
    }

    // Hero button rendering
    if (btn.hero) {
      const heroType = btn.hero;
      const isHeroSelected = this.selectedHeroType && this.selectedHeroType.id === heroType.id;
      const heroCanAfford = game && game.gold >= heroType.cost;

      // 根據元素決定配色
      const elementColors = {
        water: { badge: '#1a3388', border: '#3355cc', icon: '#4488ff', iconLight: '#88ccff', selected: '#4488ff' },
        fire:  { badge: '#882211', border: '#cc4433', icon: '#ff6622', iconLight: '#ffaa44', selected: '#ff6622' },
        ice:   { badge: '#1a5566', border: '#33aacc', icon: '#64c8f0', iconLight: '#aaddee', selected: '#64c8f0' },
      };
      const ec = elementColors[heroType.element] || elementColors.water;

      // Button background
      const grad = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
      if (isHeroSelected) {
        grad.addColorStop(0, '#1a2850');
        grad.addColorStop(1, '#102040');
      } else {
        grad.addColorStop(0, '#1a2236');
        grad.addColorStop(1, '#101830');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

      // Border
      ctx.strokeStyle = isHeroSelected ? ec.selected : C.UI_BORDER;
      ctx.lineWidth = isHeroSelected ? 2 : 1;
      ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);

      // Hero badge（根據元素配色）
      ctx.fillStyle = ec.badge;
      ctx.fillRect(btn.x + 3, btn.y + 3, 20, 16);
      ctx.strokeStyle = ec.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(btn.x + 3.5, btn.y + 3.5, 19, 15);
      ctx.fillStyle = '#e8e0d0';
      ctx.font = DK.FONTS.bold(12);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('英', btn.x + 13, btn.y + 11);

      // Mini element icon（根據元素配色）
      ctx.fillStyle = ec.icon;
      ctx.beginPath();
      ctx.arc(btn.x + btn.width - 16, btn.y + 12, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ec.iconLight;
      ctx.beginPath();
      ctx.arc(btn.x + btn.width - 17, btn.y + 11, 2, 0, Math.PI * 2);
      ctx.fill();

      // Hero name + 形狀標記（色盲友善）
      ctx.fillStyle = heroCanAfford ? C.UI_TEXT : '#444488';
      ctx.font = DK.FONTS.bold(15);
      ctx.textAlign = 'center';
      const heroShape = this.getShapeForType('hero', heroType.id);
      ctx.fillText(`${heroShape} ${heroType.name}`, btn.x + btn.width / 2, btn.y + 32);

      // Cost
      ctx.font = DK.FONTS.bold(13);
      ctx.fillStyle = heroCanAfford ? C.UI_GOLD : '#664400';
      ctx.fillText(`⚙ ${heroType.cost} 金`, btn.x + btn.width / 2, btn.y + 48);

      // Stats
      ctx.font = DK.FONTS.body(11);
      ctx.fillStyle = '#8888cc';
      ctx.fillText(`傷害:${heroType.damage} 射程:${heroType.range}`, btn.x + btn.width / 2, btn.y + 62);

      // Cannot afford overlay + 提示文字
      if (!heroCanAfford) {
        ctx.fillStyle = 'rgba(10,8,20,0.45)';
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
        ctx.font = DK.FONTS.bold(11);
        ctx.fillStyle = '#ff6644';
        ctx.textAlign = 'center';
        ctx.fillText(`需 ${heroType.cost} 金`, btn.x + btn.width / 2, btn.y + btn.height - 8);
      }

      // Selected hero button pulsing border
      if (isHeroSelected) {
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(68,136,255,${pulse})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
      }

      // Hover highlight overlay - 使用緩動 alpha
      if (hoverAlpha > 0) {
        ctx.fillStyle = `rgba(255,255,255,${hoverAlpha})`;
        ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      }

      // 鍵盤焦點高亮（無障礙）
      const btnIndex3 = this.buttons.indexOf(btn);
      if (this.keyboardNavigationEnabled && this.keyboardFocusIndex === btnIndex3) {
        const focusPulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(255,255,0,${focusPulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(btn.x - 1.5, btn.y - 1.5, btn.width + 3, btn.height + 3);
      }

      ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
      return;
    }

    if (!btn.trap) {
      ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
      return;
    }

    // === Trap type badge (wall vs floor) ===
    const isWall = btn.trap.type === 'wall';
    const badgeColor = isWall ? '#4a3e6e' : '#3e5a3e';
    const badgeBorder = isWall ? '#6a5e8e' : '#5e7a5e';
    const badgeText = isWall ? '牆' : '地';

    // Badge background
    ctx.fillStyle = badgeColor;
    ctx.fillRect(btn.x + 3, btn.y + 3, 20, 16);
    ctx.strokeStyle = badgeBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(btn.x + 3.5, btn.y + 3.5, 19, 15);

    // Badge text
    ctx.fillStyle = '#e8e0d0';
    ctx.font = DK.FONTS.bold(12);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, btn.x + 13, btn.y + 11);

    // Mini trap icon (right side of badge area)
    if (DK.DEBUG_MODE) {
      console.log(`[UI] 渲染陷阱圖標: ${btn.trap.name} (id: ${btn.trap.id}) at (${btn.x + btn.width - 28}, ${btn.y + 2})`);
    }
    this.drawTrapIcon(ctx, btn.x + btn.width - 28, btn.y + 2, btn.trap.id, 22);

    // Trap name (large, centered) + 形狀標記（色盲友善）
    ctx.fillStyle = canAfford ? C.UI_TEXT : '#664444';
    ctx.font = DK.FONTS.bold(15);
    ctx.textAlign = 'center';
    const trapShape = this.getShapeForType('trap', btn.trap.id);
    ctx.fillText(`${trapShape} ${btn.trap.name}`, btn.x + btn.width / 2, btn.y + 32);

    // Cost with gold icon
    ctx.font = DK.FONTS.bold(13);
    ctx.fillStyle = canAfford ? C.UI_GOLD : '#664400';
    ctx.fillText(`⚙ ${btn.trap.cost} 金`, btn.x + btn.width / 2, btn.y + 48);

    // Stats row
    ctx.font = DK.FONTS.body(11);
    const statsY = btn.y + 62;
    const statsCX = btn.x + btn.width / 2;
    if (btn.trap.damage > 0 && btn.trap.element === 'electric') {
      // shock_plate: 傷害 + 雷電
      ctx.fillStyle = '#cc8888';
      ctx.fillText(`傷害:${btn.trap.damage}`, statsCX - 18, statsY);
      ctx.fillStyle = C.TRAP_ELECTRIC;
      ctx.fillText('⚡', statsCX + 20, statsY);
    } else if (btn.trap.id === 'oil_trap') {
      // oil_trap: 緩速
      ctx.fillStyle = '#8a6030';
      ctx.fillText('緩速60%', statsCX - 10, statsY);
      ctx.fillText('🛢', statsCX + 24, statsY);
    } else if (btn.trap.damage === 0 && btn.trap.pushForce) {
      // push_trap: 推力 + 方向箭頭
      ctx.fillStyle = '#aaa0b0';
      ctx.fillText(`推力:${btn.trap.pushForce}`, statsCX - 8, statsY);
      ctx.fillStyle = '#ff8844';
      ctx.fillText('\u2192', statsCX + 22, statsY);
    } else if (btn.trap.damage > 0) {
      // fallback: 只有傷害
      ctx.fillStyle = '#cc8888';
      ctx.fillText(`傷害:${btn.trap.damage}`, statsCX, statsY);
    }

    // Cannot afford overlay + 提示文字
    if (!canAfford) {
      ctx.fillStyle = 'rgba(10,8,20,0.45)';
      ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
      ctx.font = DK.FONTS.bold(11);
      ctx.fillStyle = '#ff6644';
      ctx.textAlign = 'center';
      ctx.fillText(`需 ${btn.trap.cost} 金`, btn.x + btn.width / 2, btn.y + btn.height - 8);
    }

    // Selected button pulsing border
    if (isSelected) {
      const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255,170,68,${pulse})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(btn.x + 0.5, btn.y + 0.5, btn.width - 1, btn.height - 1);
    }

    // Hover highlight overlay - 使用緩動 alpha
    if (hoverAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${hoverAlpha})`;
      ctx.fillRect(btn.x + 1, btn.y + 1, btn.width - 2, btn.height - 2);
    }

    // 鍵盤焦點高亮（無障礙）
    const btnIndex4 = this.buttons.indexOf(btn);
    if (this.keyboardNavigationEnabled && this.keyboardFocusIndex === btnIndex4) {
      const focusPulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255,255,0,${focusPulse})`;
      ctx.lineWidth = 3;
      ctx.strokeRect(btn.x - 1.5, btn.y - 1.5, btn.width + 3, btn.height + 3);
    }

    // 已放置陷阱數量徽章（僅限陷阱按鈕，數量 > 0 時顯示）
    if (btn.trap && DK.Traps && DK.Traps.placed) {
      const placedCount = DK.Traps.placed.filter(t => t.type && t.type.name === btn.trap.name).length;
      if (placedCount > 0) {
        const badgeR = 9;
        const badgeCX = btn.x + btn.width - 3 - badgeR;
        const badgeCY = btn.y + 3 + badgeR;

        // 深色圓底
        ctx.fillStyle = 'rgba(10,8,20,0.85)';
        ctx.beginPath();
        ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
        ctx.fill();

        // 邊框
        ctx.strokeStyle = 'rgba(138,128,112,0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(badgeCX, badgeCY, badgeR, 0, Math.PI * 2);
        ctx.stroke();

        // 白色數字
        ctx.font = DK.FONTS.bold(11);
        ctx.fillStyle = '#e8e0d0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${placedCount}`, badgeCX, badgeCY);
      }
    }

    ctx.restore(); // 恢復 canvas 狀態（因為有 offsetY）
  },

  /**
   * Draw text with outline for readability (無障礙：3px 黑色描邊)
   */
  drawTextWithOutline(ctx, text, x, y, fillColor, outlineColor) {
    ctx.fillStyle = outlineColor || 'rgba(0,0,0,0.9)';
    // 3px 描邊（無障礙增強）
    for (let ox = -3; ox <= 3; ox++) {
      for (let oy = -3; oy <= 3; oy++) {
        if (ox === 0 && oy === 0) continue;
        // 只繪製距離 <= 3 的點（圓形描邊）
        if (Math.sqrt(ox * ox + oy * oy) <= 3) {
          ctx.fillText(text, x + ox, y + oy);
        }
      }
    }
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  }
});
