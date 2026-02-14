/**
 * Dungeon Keep - 地圖主渲染系統
 * 包含：主渲染迴圈、地心光暈、火把、暈影、動畫系統
 */

DK.Map.getVisibleRange = function() {
    const T = DK.CONFIG.TILE_SIZE;
    const cam = DK.Game ? DK.Game.camera : null;
    if (cam) {
      const startCol = Math.max(0, Math.floor(cam.x / T) - 1);
      const startRow = Math.max(0, Math.floor(cam.y / T) - 1);
      const endCol = Math.min(this.layout[0].length - 1, Math.ceil((cam.x + DK.CONFIG.GAME_WIDTH) / T) + 1);
      const endRow = Math.min(this.layout.length - 1, Math.ceil((cam.y + DK.CONFIG.GAME_HEIGHT) / T) + 1);
      return { startCol, startRow, endCol, endRow };
    }
    return {
      startCol: 0,
      startRow: 0,
      endCol: this.layout[0].length - 1,
      endRow: this.layout.length - 1,
    };
  };

DK.Map.isInViewport = function(col, row, buffer = 2) {
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();
    return col >= startCol - buffer && col <= endCol + buffer &&
           row >= startRow - buffer && row <= endRow + buffer;
  };

DK.Map.render = function(ctx) {
    const PA = DK.PixelArt;
    const T = DK.CONFIG.TILE_SIZE;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();
    const time = (Date.now() / 1000) % 3600; // 動畫時間（秒）

    // 第一通道：繪製所有地磚（僅可見範圍）
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.layout[r][c];
        const x = c * T;
        const y = r * T;

        if (tile === 'W') {
          const variant = (c * 7 + r * 13) % 6;
          ctx.drawImage(this.tileCache[`wall_${variant}`], x, y);
        } else if (tile === 'O') {
          const variant = (c * 7 + r * 13) % 6;
          ctx.drawImage(this.tileCache[`outer_${variant}`], x, y);
        } else if (tile === 'B') {
          const variant = (c * 7 + r * 13) % 6;
          ctx.drawImage(this.tileCache[`breakable_${variant}`], x, y);
        } else if (tile === 'H') {
          const variant = (c * 7 + r * 13) % 6;
          ctx.drawImage(this.tileCache[`heart_${variant}`], x, y);
        } else if (tile === 'E') {
          // 入口傳送門：檢查是否為 2×2 錨點（動畫）或單格（靜態）
          if (this.isPortalAnchor(c, r)) {
            this.drawEntranceTile(ctx, x, y, time); // 動畫漩渦
          } else {
            ctx.drawImage(this.tileCache['entrance'], x, y); // 靜態快取
          }
        } else if (tile === 'M') {
          // 出口傳送門：檢查是否為 2×2 錨點（動畫）或單格（靜態）
          if (this.isPortalAnchor(c, r)) {
            this.drawExitTile(ctx, x, y, time); // 動畫漩渦
          } else {
            ctx.drawImage(this.tileCache['exit'], x, y); // 靜態快取
          }
        } else if (tile === 'A') {
          const variant = (c * 11 + r * 17) % 6;
          ctx.drawImage(this.tileCache[`abyss_${variant}`], x, y);
        } else if (tile === 'P') {
          const variant = (c * 11 + r * 17) % 6;
          // 繪製靜態底層
          ctx.drawImage(this.tileCache[`pool_${variant}`], x, y);
          // 繪製動態波紋（使用時間偏移錯開每個水潭）
          this.drawPoolWaves(ctx, x, y, c, r, time);
        } else if (tile === 'G') {
          const variant = (c * 11 + r * 17) % 6;
          const gs = this.getGrassState(c, r);
          if (gs && gs.state === 'scorched') {
            ctx.drawImage(this.tileCache[`grass_scorched_${variant}`], x, y);
          } else {
            ctx.drawImage(this.tileCache[`grass_${variant}`], x, y);
          }
        } else {
          const variant = (c * 11 + r * 17) % 6;
          ctx.drawImage(this.tileCache[`floor_${variant}`], x, y);
        }
      }
    }

    // 第二通道：牆壁陰影投射到相鄰地板（僅可見範圍）
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (!this.isPath(c, r)) continue;
        const x = c * T;
        const y = r * T;

        // 上方牆壁投射的陰影
        if (this.isWall(c, r - 1)) {
          PA.rect(ctx, x, y, T, 2, 'rgba(10,8,20,0.4)');
          PA.rect(ctx, x, y, T, 1, 'rgba(10,8,20,0.3)');
        }
        // 左方牆壁投射的陰影
        if (this.isWall(c - 1, r)) {
          PA.rect(ctx, x, y, 2, T, 'rgba(10,8,20,0.3)');
          PA.rect(ctx, x, y, 1, T, 'rgba(10,8,20,0.2)');
        }
        // 下方牆壁的反光邊
        if (this.isWall(c, r + 1)) {
          PA.rect(ctx, x, y + T - 1, T, 1, 'rgba(100,90,70,0.15)');
        }
        // 右方牆壁的反光邊
        if (this.isWall(c + 1, r)) {
          PA.rect(ctx, x + T - 1, y, 1, T, 'rgba(100,90,70,0.1)');
        }
      }
    }

    // 第三通道：深淵動畫效果
    if (DK.VISUAL_SETTINGS.isEnabled('abyssAnimation')) {
      this.renderAbyssAnimation(ctx);
    }

    // 第五通道：水潭與草叢動畫
    if (DK.VISUAL_SETTINGS.isEnabled('puddleAnimation')) {
      this.renderPoolAnimation(ctx);
    }
    if (DK.VISUAL_SETTINGS.isEnabled('grassAnimation')) {
      this.renderGrassAnimation(ctx);
    }

    // 第六通道：地心脈動光暈
    if (DK.VISUAL_SETTINGS.isEnabled('heartPulse')) {
      this.renderHeartGlow(ctx);
    }

    // 注意：renderVignette 已移至 main.js restore 之後（螢幕空間，不受 camera 影響）
  };

DK.Map.renderHeartGlow = function(ctx) {
    const T = DK.CONFIG.TILE_SIZE;
    const timestamp = DK.Game ? DK.Game.time : 0;
    const MC = DK.MathCache;
    const alpha = 0.12 + 0.08 * MC.sinTime(timestamp, 0.002);
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const tile = this.layout[r][c];
        if (tile !== 'H') continue;

        const x = c * T;
        const y = r * T;

        // 3 層同心半透明矩形模擬光暈擴散（由外到內漸亮）
        // 第 3 層（最外層）— 紫色光暈
        ctx.fillStyle = `rgba(120,80,180,${alpha * 0.3})`;
        ctx.fillRect(x - 4, y - 4, T + 8, T + 8);

        // 第 2 層（中層）
        ctx.fillStyle = `rgba(140,100,200,${alpha * 0.5})`;
        ctx.fillRect(x - 2, y - 2, T + 4, T + 4);

        // 第 1 層（內層，最亮）
        ctx.fillStyle = `rgba(160,120,220,${alpha})`;
        ctx.fillRect(x, y, T, T);
      }
    }
  };

DK.Map.renderVignette = function(ctx) {
    const T = DK.CONFIG.TILE_SIZE;
    const W = DK.CONFIG.WORLD_WIDTH || DK.CONFIG.GAME_WIDTH;
    const H = DK.CONFIG.WORLD_HEIGHT || DK.CONFIG.GAME_HEIGHT;

    // 第三層最外圍：T*3 範圍、alpha 0.05
    ctx.fillStyle = 'rgba(10,8,18,0.05)';
    ctx.fillRect(0, 0, W, T * 3);
    ctx.fillRect(0, H - T * 3, W, T * 3);
    ctx.fillRect(0, 0, T * 3, H);
    ctx.fillRect(W - T * 3, 0, T * 3, H);

    // 邊緣暗化營造氛圍（alpha 0.15 -> 0.22）
    ctx.fillStyle = 'rgba(10,8,18,0.22)';
    ctx.fillRect(0, 0, W, T);
    ctx.fillRect(0, H - T, W, T);
    ctx.fillRect(0, 0, T, H);
    ctx.fillRect(W - T, 0, T, H);

    // 角落更深的暗化（alpha 0.1 -> 0.2）
    ctx.fillStyle = 'rgba(10,8,18,0.2)';
    ctx.fillRect(0, 0, T * 2, T * 2);
    ctx.fillRect(W - T * 2, 0, T * 2, T * 2);
    ctx.fillRect(0, H - T * 2, T * 2, T * 2);
    ctx.fillRect(W - T * 2, H - T * 2, T * 2, T * 2);
  };

DK.Map.renderAbyssAnimation = function(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const T = DK.CONFIG.TILE_SIZE;
    const time = DK.Game ? DK.Game.time : 0;
    const t = time / 1000;
    const MC = DK.MathCache;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.layout[r][c] !== 'A') continue;

        const x = c * T;
        const y = r * T;

        // 偶爾掉落的小石子粒子（稀疏、非持續性）
        const seed1 = MC.sinTime(time + c * 5300 + r * 3700, 0.0008);
        if (seed1 > 0.6) {
          // 石子位置隨時間緩慢下落
          const fallProgress = (t * 2 + c * 1.7) % 4; // 0~4秒循環
          if (fallProgress < 2) {
            const px = x + 3 + Math.round(((c * 7 + r * 3) % 10));
            const py = y + 2 + Math.round(fallProgress * 6);
            if (py < y + 14) {
              // 石子（逐漸變暗=越掉越深）
              const fadeAlpha = 1 - fallProgress / 2;
              const shade = Math.round(40 * fadeAlpha);
              PA.pixel(ctx, px, py, `rgb(${shade},${shade},${Math.round(shade * 0.8)})`);
            }
          }
        }

        // 第二顆石子（不同相位）
        const seed2 = MC.sinTime(time + c * 3100 + r * 7300, 0.0012);
        if (seed2 > 0.7) {
          const fallProgress2 = (t * 1.5 + c * 2.3 + r * 1.1) % 5;
          if (fallProgress2 < 2.5) {
            const px2 = x + 8 + Math.round(((c * 3 + r * 11) % 4));
            const py2 = y + 1 + Math.round(fallProgress2 * 5);
            if (py2 < y + 14) {
              const fadeAlpha2 = 1 - fallProgress2 / 2.5;
              const shade2 = Math.round(35 * fadeAlpha2);
              PA.pixel(ctx, px2, py2, `rgb(${shade2},${shade2},${Math.round(shade2 * 0.7)})`);
            }
          }
        }

        // 深淵邊緣微光（與相鄰路徑格的邊界微弱暗光）
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dc, dr] of dirs) {
          const nc = c + dc;
          const nr = r + dr;
          if (nr >= 0 && nr < this.layout.length && nc >= 0 && nc < this.layout[0].length) {
            if (this.isPath(nc, nr)) {
              ctx.fillStyle = 'rgba(5,5,10,0.08)';
              ctx.fillRect(nc * T, nr * T, T, T);
            }
          }
        }
      }
    }
  };

DK.Map.renderPoolAnimation = function(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const T = DK.CONFIG.TILE_SIZE;
    const time = DK.Game ? DK.Game.time : 0;
    const t = time / 1000;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    // 檢查是否啟用水潭動畫
    if (!DK.VISUAL_SETTINGS.isEnabled('puddleAnimation')) {
      return; // 完全跳過渲染
    }

    // 隔幀更新優化（固定啟用，符合 DW3 優化理念）
    // 每 2 幀更新一次動畫，降低 50% CPU 時間，視覺上無明顯頓挫
    if (!this._poolAnimFrame) this._poolAnimFrame = 0;
    this._poolAnimFrame++;

    // DW3 優化：固定啟用隔幀更新
    if (this._poolAnimFrame % 2 !== 0) {
      return; // 跳過偶數幀
    }

    // 使用 MathCache 替代 Math.sin/cos（60% CPU 時間降低）
    const MC = DK.MathCache;

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.layout[r][c] !== 'P') continue;

        const x = c * T;
        const y = r * T;

        // 水平波紋線（隨時間緩慢移動）
        // 使用 MathCache.sinTime() 直接計算（無需手動轉角度）
        const waveOffset = Math.round(MC.sinTime(time, 0.0015) * 2 + c * 0.3);
        const waveY = (Math.round(t * 2 + r * 3) % 14) + 1;

        for (let i = 2; i < 14; i++) {
          // 使用 MathCache.sinTime() 計算波紋偏移
          const rippleOffset = MC.sinTime(time + i * 500, 0.001);
          const wx = x + i + Math.round(rippleOffset * 0.5);
          if (wx >= x && wx < x + 16) {
            PA.pixel(ctx, wx, y + waveY, C.POOL_RIPPLE);
          }
        }

        // 閃爍高光點（水面光線反射）
        // 使用 MathCache.sinTime() 計算閃爍值
        const sparkle = MC.sinTime(time + c * 4700 + r * 2300, 0.003);

        if (sparkle > 0.5) {
          const sx = x + 4 + Math.round(MC.sinTime(time + c * 700, 0.0007) * 4);
          const sy = y + 4 + Math.round(MC.cosTime(time + r * 900, 0.0009) * 4);
          if (sx >= x + 1 && sx < x + 15 && sy >= y + 1 && sy < y + 15) {
            PA.pixel(ctx, sx, sy, C.POOL_HIGHLIGHT);
          }
        }

        // 第二個高光
        const sparkle2 = MC.sinTime(time + c * 2100 + r * 5700, 0.0025);

        if (sparkle2 > 0.6) {
          const sx2 = x + 10 + Math.round(MC.sinTime(time + r * 1100, 0.0011) * 3);
          const sy2 = y + 8 + Math.round(MC.cosTime(time + c * 800, 0.0008) * 3);
          if (sx2 >= x + 1 && sx2 < x + 15 && sy2 >= y + 1 && sy2 < y + 15) {
            PA.pixel(ctx, sx2, sy2, '#8accff');
          }
        }
      }
    }
  };

DK.Map.renderGrassAnimation = function(ctx) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const T = DK.CONFIG.TILE_SIZE;
    const time = DK.Game ? DK.Game.time : 0;
    const t = time / 1000;
    const { startCol, startRow, endCol, endRow } = this.getVisibleRange();

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (this.layout[r][c] !== 'G') continue;

        const gs = this.getGrassState(c, r);
        if (!gs) continue;

        const x = c * T;
        const y = r * T;

        if (gs.state === 'normal') {
          // 搖擺動畫：草尖隨時間輕微搖擺
          const sway = Math.sin(t * 2 + c * 1.7 + r * 2.3);
          const swayOffset = Math.round(sway);

          // 幾根搖擺的草葉
          for (let i = 0; i < 3; i++) {
            const gx = 3 + i * 5 + Math.round(Math.sin(t + i * 2.1) * 0.5);
            const gy = 3 + Math.round(Math.sin(t * 1.5 + i * 3.3 + c) * 1);
            const tipX = gx + swayOffset;
            if (tipX >= 0 && tipX < 16) {
              PA.pixel(ctx, x + tipX, y + gy, C.GRASS_HIGHLIGHT);
            }
          }

        } else if (gs.state === 'burning') {
          // 火焰效果：閃爍的橘紅色火焰 + 上方煙霧
          const burnProgress = gs.timer / 20000; // 0~1
          const flicker = Math.sin(t * 8 + c * 3 + r * 5) * 0.5 + 0.5;
          const flicker2 = Math.sin(t * 12 + c * 7 + r * 2) * 0.5 + 0.5;

          // 火焰底部（橘紅）
          for (let i = 0; i < 4; i++) {
            const fx = 2 + i * 3 + Math.round(Math.sin(t * 6 + i * 2) * 1);
            const fy = 8 + Math.round(flicker * 2);
            PA.pixel(ctx, x + fx, y + fy, C.GRASS_BURNING);
            PA.pixel(ctx, x + fx, y + fy - 1, '#ee6633');
          }

          // 火焰頂部（亮黃）
          if (flicker > 0.3) {
            for (let i = 0; i < 3; i++) {
              const fx = 3 + i * 4 + Math.round(Math.sin(t * 10 + i * 3) * 1);
              const fy = 4 + Math.round(flicker2 * 2);
              PA.pixel(ctx, x + fx, y + fy, '#ffaa22');
              PA.pixel(ctx, x + fx, y + fy - 1, '#ffcc44');
            }
          }

          // 煙霧粒子（灰色，向上飄）
          const smokeY = Math.round((t * 4 + c * 2) % 4);
          if (smokeY < 4) {
            const smokeX = 7 + Math.round(Math.sin(t * 2 + r) * 2);
            const smokeAlpha = (1 - smokeY / 4) * 0.3 * (1 - burnProgress * 0.5);
            ctx.fillStyle = `rgba(80,70,60,${smokeAlpha})`;
            ctx.fillRect(x + smokeX, y + smokeY, 2, 1);
          }

          // 整體火光（讓整格有橘色光暈）
          const glowAlpha = 0.1 + flicker * 0.05;
          ctx.fillStyle = `rgba(255,100,30,${glowAlpha * (1 - burnProgress * 0.7)})`;
          ctx.fillRect(x, y, T, T);

        }
        // scorched 狀態由靜態地磚處理，不需額外動畫
      }
    }
  };

DK.Map.isValidWallTrapSlot = function(col, row) {
    return this.wallTrapSlots.some(s => s.col === col && s.row === row);
  };

DK.Map.isValidFloorTrapSlot = function(col, row) {
    return this.floorTrapSlots.some(s => s.col === col && s.row === row);
  };

DK.Map.getWallFacing = function(col, row) {
    const slot = this.wallTrapSlots.find(s => s.col === col && s.row === row);
    return slot ? slot.facing : null;
  };

