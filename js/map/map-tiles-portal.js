/**
 * Dungeon Keep - 傳送門地磚渲染
 * 包含：傳送門漩渦、2x2 傳送門、入口/出口地磚
 */

DK.Map.isPortalAnchor = function(col, row) {
    const tile = this.getTile(col, row);
    if (tile !== 'E' && tile !== 'M') return false;

    // 檢查右邊和下邊是否也是相同類型（驗證 2×2 完整性）
    const rightTile = this.getTile(col + 1, row);
    const bottomTile = this.getTile(col, row + 1);
    const bottomRightTile = this.getTile(col + 1, row + 1);

    return (
      rightTile === tile &&
      bottomTile === tile &&
      bottomRightTile === tile
    );
  };

DK.Map.drawSwirlPattern = function(ctx, colorScheme, scale = 1.0) {
    const PA = DK.PixelArt;
    // 繪製 4 條螺旋臂（簡化像素風格）
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2;
      const color = i % 2 === 0 ? colorScheme.dark : colorScheme.bright;

      // 每條螺旋臂：從中心向外延伸
      for (let r = 2; r <= 8; r += 2) {
        const armAngle = angle + (r / 8) * Math.PI / 4; // 螺旋扭曲
        const px = Math.cos(armAngle) * r * scale;
        const py = Math.sin(armAngle) * r * scale;
        PA.rect(ctx, Math.floor(px), Math.floor(py), 2, 2, color);
      }
    }
  };

DK.Map.drawPortalFull = function(ctx, x, y, colorScheme, time) {
    const PA = DK.PixelArt;
    const ISO = PA.Isometric;
    const T = 16; // Tile size
    const MC = DK.MathCache;

    // 0. 地面凹陷邊緣（等距光影）- 保持不變
    const edgeColor = '#4a4236'; // 地板色
    const edgeTop = ISO.topLight(edgeColor);
    const edgeSide = ISO.sideDark(edgeColor);

    // 上邊緣（亮面）
    PA.rect(ctx, x, y, 32, 2, edgeTop);
    // 左邊緣（暗面）
    PA.rect(ctx, x, y, 2, 32, edgeSide);
    // 右邊緣（中亮）
    PA.rect(ctx, x + 30, y, 2, 32, PA.lighten(edgeColor, 10));
    // 下邊緣（最暗）
    PA.rect(ctx, x, y + 30, 32, 2, PA.darken(edgeColor, 20));

    // 【優化】共用 alpha 計算 - 使用快取的三角函式
    const pulseAlpha = 0.4 + 0.2 * MC.sinTime(time * 1000, 0.002); // 1 秒週期脈動

    // Layer 1: 地面光暈（核心視覺，保留）
    ctx.save();
    const gradient = ctx.createRadialGradient(x + T, y + T, 4, x + T, y + T, T * 1.5);
    gradient.addColorStop(0, DK.ColorUtils.withAlpha(colorScheme.glow, pulseAlpha * 255));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, T * 2, T * 2);
    ctx.restore();

    // Layer 2: 簡化漩渦（雙重繪製取代三層）
    ctx.save();
    ctx.translate(x + T, y + T);
    ctx.rotate(time * Math.PI); // 0.5 秒/圈

    // 深層（暗，小）- 模擬深度
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(0, 1.5); // 向下偏移 1.5px（折衷）
    this.drawSwirlPattern(ctx, colorScheme, 0.7); // 縮放 70%（折衷）
    ctx.restore();

    // 淺層（亮，大）
    ctx.globalAlpha = 0.9;
    this.drawSwirlPattern(ctx, colorScheme, 1.0);

    ctx.restore();

    // Layer 3: 能量環 + 粒子合併（共用 pulseAlpha）
    ctx.save();

    // 能量環
    const ringAlpha = 0.3 + 0.4 * pulseAlpha; // 複用脈動值
    ctx.strokeStyle = DK.ColorUtils.withAlpha(colorScheme.glow, ringAlpha * 255);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + T, y + T, 12, 0, Math.PI * 2);
    ctx.stroke();

    // 【優化】粒子數量：8 → 6，簡化計算，使用三角函式快取
    for (let i = 0; i < 6; i++) {
      const angleRad = time * 1.6 + i * Math.PI / 3; // 保持弧度（旋轉需要）
      const radiusSin = MC.sinTime(time * 1000 + i * 333, 0.003); // time*3 轉換為頻率
      const radius = 10 + 2 * radiusSin;
      const px = x + T + Math.cos(angleRad) * radius; // 旋轉角度用原生 Math（canvas 旋轉後）
      const py = y + T + Math.sin(angleRad) * radius;

      // 複用 pulseAlpha 避免重複計算
      const particleAlpha = 0.6 + 0.4 * pulseAlpha;
      ctx.fillStyle = DK.ColorUtils.withAlpha(colorScheme.glow, particleAlpha * 255);
      PA.rect(ctx, Math.floor(px) - 1, Math.floor(py) - 1, 2, 2, ctx.fillStyle);
    }

    ctx.restore();
  };

DK.Map.drawEntranceTile = function(ctx, x, y, time = 0) {
    const PA = DK.PixelArt;
    const col = Math.floor(x / 16);
    const row = Math.floor(y / 16);

    // 檢查是否為 2×2 傳送門錨點
    if (this.isPortalAnchor(col, row)) {
      // 繪製完整 2×2 動畫漩渦
      const colorScheme = {
        dark: '#226622',
        bright: '#44aa44',
        glow: '#66ff66'
      };
      this.drawPortalFull(ctx, x, y, colorScheme, time);
      return;
    }

    // 如果不是錨點，檢查是否為 2×2 的其他格（不渲染，由錨點統一處理）
    const leftTile = this.getTile(col - 1, row);
    const topTile = this.getTile(col, row - 1);
    const topLeftTile = this.getTile(col - 1, row - 1);

    if ((leftTile === 'E' && this.isPortalAnchor(col - 1, row)) ||
        (topTile === 'E' && this.isPortalAnchor(col, row - 1)) ||
        (topLeftTile === 'E' && this.isPortalAnchor(col - 1, row - 1))) {
      // 這是 2×2 傳送門的一部分，但不是錨點 → 不渲染
      return;
    }

    // 回退：渲染舊版小型傳送門（向後兼容）
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 1, y + 4, 4, 8, '#22662a');
    PA.rect(ctx, x + 2, y + 5, 2, 6, '#44aa44');
    PA.pixel(ctx, x + 1, y + 6, '#338833');
    PA.pixel(ctx, x + 1, y + 9, '#338833');
    PA.pixel(ctx, x + 4, y + 6, '#338833');
    PA.pixel(ctx, x + 4, y + 9, '#338833');
    PA.pixel(ctx, x + 2, y + 4, '#66cc66');
    PA.pixel(ctx, x + 3, y + 4, '#66cc66');
    PA.pixel(ctx, x + 2, y + 11, '#66cc66');
    PA.pixel(ctx, x + 3, y + 11, '#66cc66');
    PA.pixel(ctx, x + 5, y + 7, '#88ee88');
    PA.pixel(ctx, x + 5, y + 8, '#88ee88');
    PA.pixel(ctx, x + 6, y + 8, '#66cc66');
    PA.pixel(ctx, x + 2, y + 7, '#aaffaa');
    PA.pixel(ctx, x + 3, y + 8, '#aaffaa');
  };

DK.Map.drawExitTile = function(ctx, x, y, time = 0) {
    const PA = DK.PixelArt;
    const col = Math.floor(x / 16);
    const row = Math.floor(y / 16);

    // 檢查是否為 2×2 傳送門錨點
    if (this.isPortalAnchor(col, row)) {
      // 繪製完整 2×2 動畫漩渦（紅色出口配色）
      const colorScheme = {
        dark: '#662222',
        bright: '#aa4444',
        glow: '#ff6666'
      };
      this.drawPortalFull(ctx, x, y, colorScheme, time);
      return;
    }

    // 如果不是錨點，檢查是否為 2×2 的其他格（不渲染，由錨點統一處理）
    const leftTile = this.getTile(col - 1, row);
    const topTile = this.getTile(col, row - 1);
    const topLeftTile = this.getTile(col - 1, row - 1);

    if ((leftTile === 'M' && this.isPortalAnchor(col - 1, row)) ||
        (topTile === 'M' && this.isPortalAnchor(col, row - 1)) ||
        (topLeftTile === 'M' && this.isPortalAnchor(col - 1, row - 1))) {
      // 這是 2×2 傳送門的一部分，但不是錨點 → 不渲染
      return;
    }

    // 回退：渲染舊版小型傳送門（向後兼容）
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 11, y + 4, 4, 8, '#662222');
    PA.rect(ctx, x + 12, y + 5, 2, 6, '#cc4444');
    PA.pixel(ctx, x + 11, y + 6, '#883333');
    PA.pixel(ctx, x + 11, y + 9, '#883333');
    PA.pixel(ctx, x + 14, y + 6, '#883333');
    PA.pixel(ctx, x + 14, y + 9, '#883333');
    PA.pixel(ctx, x + 12, y + 4, '#ff6666');
    PA.pixel(ctx, x + 13, y + 4, '#ff6666');
    PA.pixel(ctx, x + 12, y + 11, '#ff6666');
    PA.pixel(ctx, x + 13, y + 11, '#ff6666');
    PA.pixel(ctx, x + 10, y + 7, '#ff8888');
    PA.pixel(ctx, x + 10, y + 8, '#ff8888');
    PA.pixel(ctx, x + 12, y + 7, '#ffaaaa');
    PA.pixel(ctx, x + 13, y + 8, '#ffaaaa');
    PA.pixel(ctx, x + 7, y + 7, '#ff4444');
    PA.pixel(ctx, x + 8, y + 7, '#ff4444');
    PA.pixel(ctx, x + 7, y + 8, '#ff4444');
    PA.pixel(ctx, x + 8, y + 8, '#ff4444');
  };

DK.Map.drawEntrancePortal2x2 = function(ctx, x, y, variant = 0) {
    const PA = DK.PixelArt;
    const rng = PA.seededRandom(variant * 197 + 43);

    // 底色：深綠色地板
    PA.rect(ctx, x, y, 32, 32, '#0a1a0a');

    // 外圈漩渦（深綠）
    PA.rect(ctx, x + 4, y + 4, 24, 24, '#1a3820');

    // 中圈漩渦（綠）
    PA.rect(ctx, x + 8, y + 8, 16, 16, '#2a5a30');

    // 內圈（亮綠）
    PA.rect(ctx, x + 11, y + 11, 10, 10, '#44aa44');

    // 核心發光
    PA.rect(ctx, x + 13, y + 13, 6, 6, '#66ff66');
    PA.pixel(ctx, x + 15, y + 15, '#aaffaa');
    PA.pixel(ctx, x + 16, y + 16, '#aaffaa');

    // 螺旋紋理（4 條螺旋臂）
    const spiralPoints = [
      // 北臂
      [15, 5], [16, 6], [17, 7],
      // 東臂
      [26, 15], [25, 16], [24, 17],
      // 南臂
      [15, 26], [16, 25], [17, 24],
      // 西臂
      [5, 15], [6, 16], [7, 17]
    ];

    spiralPoints.forEach(([px, py]) => {
      PA.pixel(ctx, x + px, y + py, '#88ff88');
    });

    // 隨機能量粒子（12 個）
    for (let i = 0; i < 12; i++) {
      const px = 10 + Math.floor(rng() * 12);
      const py = 10 + Math.floor(rng() * 12);
      const brightness = rng() > 0.5 ? '#aaffaa' : '#88ee88';
      PA.pixel(ctx, x + px, y + py, brightness);
    }

    // 邊緣暗化
    for (let i = 0; i < 32; i++) {
      PA.pixel(ctx, x + i, y, '#0a0a0a');
      PA.pixel(ctx, x + i, y + 31, '#0a0a0a');
      PA.pixel(ctx, x, y + i, '#0a0a0a');
      PA.pixel(ctx, x + 31, y + i, '#0a0a0a');
    }
  };

DK.Map.drawExitPortal2x2 = function(ctx, x, y, variant = 0) {
    const PA = DK.PixelArt;
    const rng = PA.seededRandom(variant * 199 + 47);

    // 底色：深紅色地板
    PA.rect(ctx, x, y, 32, 32, '#1a0a0a');

    // 外圈漩渦（深紅）
    PA.rect(ctx, x + 4, y + 4, 24, 24, '#3a1820');

    // 中圈漩渦（紅）
    PA.rect(ctx, x + 8, y + 8, 16, 16, '#5a2a30');

    // 內圈（亮紅）
    PA.rect(ctx, x + 11, y + 11, 10, 10, '#aa4444');

    // 核心發光
    PA.rect(ctx, x + 13, y + 13, 6, 6, '#ff6666');
    PA.pixel(ctx, x + 15, y + 15, '#ffaaaa');
    PA.pixel(ctx, x + 16, y + 16, '#ffaaaa');

    // 螺旋紋理（4 條螺旋臂）
    const spiralPoints = [
      // 北臂
      [15, 5], [16, 6], [17, 7],
      // 東臂
      [26, 15], [25, 16], [24, 17],
      // 南臂
      [15, 26], [16, 25], [17, 24],
      // 西臂
      [5, 15], [6, 16], [7, 17]
    ];

    spiralPoints.forEach(([px, py]) => {
      PA.pixel(ctx, x + px, y + py, '#ff8888');
    });

    // 隨機能量粒子（12 個，紅色）
    for (let i = 0; i < 12; i++) {
      const px = 10 + Math.floor(rng() * 12);
      const py = 10 + Math.floor(rng() * 12);
      const brightness = rng() > 0.5 ? '#ffaaaa' : '#ff8888';
      PA.pixel(ctx, x + px, y + py, brightness);
    }

    // 邊緣暗化
    for (let i = 0; i < 32; i++) {
      PA.pixel(ctx, x + i, y, '#0a0a0a');
      PA.pixel(ctx, x + i, y + 31, '#0a0a0a');
      PA.pixel(ctx, x, y + i, '#0a0a0a');
      PA.pixel(ctx, x + 31, y + i, '#0a0a0a');
    }
  };

