/**
 * Dungeon Keep - 特殊地磚渲染
 * 包含：深淵、水潭、草叢
 */

DK.Map.drawAbyssTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 193 + 59);

    // 純黑深洞底色
    PA.rect(ctx, x, y, 16, 16, C.ABYSS_VOID);

    // === 深度漸層系統：徑向漸變（中心深黑→邊緣稍亮）===
    const centerX = 8;
    const centerY = 8;
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 16; j++) {
        const dx = i - centerX;
        const dy = j - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 11; // 最大距離（對角線）

        // 距離越遠，顏色越亮（0=中心黑，1=邊緣）
        const depthRatio = Math.min(1, dist / maxDist);

        let color;
        if (depthRatio < 0.2) {
          color = C.ABYSS_VOID; // 中心全黑
        } else if (depthRatio < 0.4) {
          color = C.ABYSS_DARKEST; // 極深
        } else if (depthRatio < 0.6) {
          color = C.ABYSS_DARK; // 深灰
        } else if (depthRatio < 0.8) {
          color = C.ABYSS_MID_DARK; // 中深
        } else {
          color = C.ABYSS_MID; // 邊緣稍亮
        }

        // 加入隨機噪點模擬深度不規則
        if (rng() > 0.7) {
          PA.pixel(ctx, x + i, y + j, color);
        }
      }
    }

    // 中心核心區域（最深黑）
    for (let i = 5; i < 11; i++) {
      for (let j = 5; j < 11; j++) {
        if (rng() > 0.3) {
          PA.pixel(ctx, x + i, y + j, C.ABYSS_VOID);
        }
      }
    }

    // 邊緣岩層改為 2 層漸變：外層 ABYSS_EDGE，內層 ABYSS_MID
    // 上邊緣
    for (let i = 0; i < 16; i++) {
      const depth = Math.floor(rng() * 3);
      for (let d = 0; d < depth; d++) {
        const edgeColor = d === 0 ? (rng() > 0.5 ? C.ABYSS_EDGE : C.ABYSS_ROCK) : C.ABYSS_MID;
        PA.pixel(ctx, x + i, y + d, edgeColor);
      }
    }
    // 下邊緣
    for (let i = 0; i < 16; i++) {
      const depth = Math.floor(rng() * 3);
      for (let d = 0; d < depth; d++) {
        const edgeColor = d === 0 ? (rng() > 0.5 ? C.ABYSS_EDGE : C.ABYSS_ROCK) : C.ABYSS_MID;
        PA.pixel(ctx, x + i, y + 15 - d, edgeColor);
      }
    }
    // 左邊緣
    for (let i = 2; i < 14; i++) {
      const depth = Math.floor(rng() * 2);
      for (let d = 0; d < depth; d++) {
        const edgeColor = d === 0 ? (rng() > 0.4 ? C.ABYSS_EDGE : C.ABYSS_CRACK) : C.ABYSS_MID;
        PA.pixel(ctx, x + d, y + i, edgeColor);
      }
    }
    // 右邊緣
    for (let i = 2; i < 14; i++) {
      const depth = Math.floor(rng() * 2);
      for (let d = 0; d < depth; d++) {
        const edgeColor = d === 0 ? (rng() > 0.4 ? C.ABYSS_EDGE : C.ABYSS_CRACK) : C.ABYSS_MID;
        PA.pixel(ctx, x + 15 - d, y + i, edgeColor);
      }
    }

    // 內部碎裂紋路（從邊緣延伸的裂縫）
    for (let i = 0; i < 3; i++) {
      const cx = 3 + Math.floor(rng() * 10);
      const cy = 3 + Math.floor(rng() * 10);
      const len = 2 + Math.floor(rng() * 3);
      for (let j = 0; j < len; j++) {
        const dx = cx + (rng() > 0.5 ? j : 0);
        const dy = cy + (rng() > 0.5 ? j : 0);
        if (dx >= 0 && dx < 16 && dy >= 0 && dy < 16) {
          PA.pixel(ctx, x + dx, y + dy, C.ABYSS_CRACK);
        }
      }
    }

    // 碎石散落（增至 4 個 + 混合多色）
    if (variant === 1 || variant === 3) {
      PA.pixel(ctx, x + 4, y + 3, C.ABYSS_ROCK);
      PA.pixel(ctx, x + 11, y + 12, C.ABYSS_ROCK);
      PA.pixel(ctx, x + 6, y + 5, C.ABYSS_MID);
      PA.pixel(ctx, x + 13, y + 8, C.ABYSS_EDGE);
    }
    if (variant === 0 || variant === 2) {
      PA.pixel(ctx, x + 7, y + 4, C.ABYSS_EDGE);
      PA.pixel(ctx, x + 12, y + 5, C.ABYSS_ROCK);
      PA.pixel(ctx, x + 3, y + 11, C.ABYSS_MID);
      PA.pixel(ctx, x + 9, y + 13, C.ABYSS_EDGE);
    }
  };

DK.Map.drawPoolTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 311 + 87);

    // 深藍水底
    PA.rect(ctx, x, y, 16, 16, C.POOL_DARK);

    // 中間色調水面
    for (let i = 0; i < 6; i++) {
      const rx = Math.floor(rng() * 14);
      const ry = Math.floor(rng() * 14);
      const rw = 2 + Math.floor(rng() * 4);
      const rh = 1 + Math.floor(rng() * 2);
      PA.rect(ctx, x + rx, y + ry, rw, rh, C.POOL_MID);
    }

    // 波紋線條（水平線）
    const waveY1 = 3 + (variant % 3);
    const waveY2 = 9 + (variant % 3);
    for (let i = 1; i < 15; i++) {
      if (rng() > 0.3) {
        PA.pixel(ctx, x + i, y + waveY1, C.POOL_LIGHT);
      }
      if (rng() > 0.4) {
        PA.pixel(ctx, x + i, y + waveY2, C.POOL_LIGHT);
      }
    }

    // 高光反射點（增至 4 個）
    for (let i = 0; i < 4; i++) {
      const hx = 2 + Math.floor(rng() * 12);
      const hy = 2 + Math.floor(rng() * 12);
      PA.pixel(ctx, x + hx, y + hy, C.POOL_HIGHLIGHT);
    }

    // 邊緣暗化改為 2 層漸變：外圈 darken 10、內圈 darken 6
    for (let i = 0; i < 16; i++) {
      // 外圈（最邊緣）
      PA.pixel(ctx, x + i, y, PA.darken(C.POOL_DARK, 10));
      PA.pixel(ctx, x + i, y + 15, PA.darken(C.POOL_DARK, 10));
      PA.pixel(ctx, x, y + i, PA.darken(C.POOL_DARK, 10));
      PA.pixel(ctx, x + 15, y + i, PA.darken(C.POOL_DARK, 10));
      // 內圈（次邊緣）
      PA.pixel(ctx, x + i, y + 1, PA.darken(C.POOL_DARK, 6));
      PA.pixel(ctx, x + i, y + 14, PA.darken(C.POOL_DARK, 6));
      PA.pixel(ctx, x + 1, y + i, PA.darken(C.POOL_DARK, 6));
      PA.pixel(ctx, x + 14, y + i, PA.darken(C.POOL_DARK, 6));
    }

    // 水底卵石（增至 4 個 + 多色）
    if (variant === 0 || variant === 2) {
      PA.pixel(ctx, x + 5, y + 10, '#1a2838');
      PA.pixel(ctx, x + 6, y + 10, '#1a2838');
      PA.pixel(ctx, x + 10, y + 6, '#1a2838');
      PA.pixel(ctx, x + 3, y + 7, '#1a3040');
    }
    if (variant === 1 || variant === 3) {
      PA.pixel(ctx, x + 8, y + 11, '#1a2838');
      PA.pixel(ctx, x + 4, y + 5, '#1a3040');
      PA.pixel(ctx, x + 12, y + 9, '#142030');
      PA.pixel(ctx, x + 7, y + 3, '#1a2838');
    }
  };

/**
 * 繪製水潭動態波紋（疊加在靜態底層之上）
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} x - X 座標
 * @param {number} y - Y 座標
 * @param {number} col - 地圖列（用於錯開動畫）
 * @param {number} row - 地圖行（用於錯開動畫）
 * @param {number} time - 當前時間戳（ms）
 */
DK.Map.drawPoolWaves = function(ctx, x, y, col, row, time) {
  const PA = DK.PixelArt;
  const C = DK.COLORS;

  // 每個水潭使用不同的時間偏移（避免所有水潭同步動畫）
  const timeOffset = (col * 337 + row * 541) % 1000;
  const adjustedTime = time + timeOffset;

  // 波紋週期（1.5秒一個完整週期）
  const waveSpeed = 0.0015;
  const phase = (adjustedTime * waveSpeed) % (Math.PI * 2);

  // 同心圓波紋（2 層）
  const wave1Radius = 3 + Math.sin(phase) * 1.5; // 3-4.5px
  const wave2Radius = 4 + Math.sin(phase + Math.PI) * 1.5; // 反相

  const centerX = x + 8;
  const centerY = y + 8;

  // 波紋 1（外圈）
  const wave1Alpha = 0.2 + Math.sin(phase) * 0.1; // 0.1-0.3
  ctx.strokeStyle = `rgba(90, 138, 170, ${wave1Alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, wave1Radius, 0, Math.PI * 2);
  ctx.stroke();

  // 波紋 2（內圈）
  const wave2Alpha = 0.15 + Math.sin(phase + Math.PI) * 0.1; // 0.05-0.25
  ctx.strokeStyle = `rgba(106, 170, 238, ${wave2Alpha})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, wave2Radius, 0, Math.PI * 2);
  ctx.stroke();

  // 反光高光（隨波紋脈動）
  const glowAlpha = 0.08 + Math.sin(phase * 2) * 0.04; // 0.04-0.12
  ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
  ctx.fillRect(x + 5, y + 3, 6, 4);
};

DK.Map.drawGrassTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 277 + 113);

    // 深綠底色（泥土+草）
    PA.rect(ctx, x, y, 16, 16, C.GRASS_DARK);

    // 中間色調草地
    for (let i = 0; i < 8; i++) {
      const rx = Math.floor(rng() * 14);
      const ry = Math.floor(rng() * 14);
      const rw = 2 + Math.floor(rng() * 3);
      const rh = 1 + Math.floor(rng() * 2);
      PA.rect(ctx, x + rx, y + ry, rw, rh, C.GRASS_MID);
    }

    // 草葉紋理（方向多樣化：一半向上、一半左傾，4 色混合）
    for (let i = 0; i < 10; i++) {
      const gx = 1 + Math.floor(rng() * 14);
      const gy = 2 + Math.floor(rng() * 12);
      const height = 2 + Math.floor(rng() * 2);
      const leanLeft = rng() > 0.5; // 一半左傾
      const colorRoll = rng();
      const shade = colorRoll > 0.75 ? C.GRASS_HIGHLIGHT
        : colorRoll > 0.5 ? C.GRASS_LIGHT
        : colorRoll > 0.25 ? C.GRASS_MID
        : C.GRASS_DARK;
      for (let h = 0; h < height; h++) {
        const lx = leanLeft ? gx - Math.floor(h / 2) : gx;
        if (lx >= 0 && lx < 16 && gy - h >= 0) {
          PA.pixel(ctx, x + lx, y + gy - h, shade);
        }
      }
    }

    // 高光草尖（增至 5 個）
    for (let i = 0; i < 5; i++) {
      const hx = 2 + Math.floor(rng() * 12);
      const hy = 1 + Math.floor(rng() * 6);
      PA.pixel(ctx, x + hx, y + hy, C.GRASS_HIGHLIGHT);
    }

    // 底部泥土色（地面部分）
    for (let i = 0; i < 16; i++) {
      if (rng() > 0.5) {
        PA.pixel(ctx, x + i, y + 15, '#2a2a1a');
        PA.pixel(ctx, x + i, y + 14, '#2a2a1a');
      }
    }

    // 偶爾小花或小石（依變體）
    if (variant === 1) {
      PA.pixel(ctx, x + 6, y + 5, '#aa8844');
      PA.pixel(ctx, x + 6, y + 4, '#ccaa55');
    }
    if (variant === 3) {
      PA.pixel(ctx, x + 11, y + 8, '#777766');
      PA.pixel(ctx, x + 12, y + 8, '#666655');
    }
  };

DK.Map.drawGrassScorchedTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 353 + 97);

    // 焦黑底色
    PA.rect(ctx, x, y, 16, 16, C.GRASS_SCORCHED);

    // 灰燼紋理
    for (let i = 0; i < 6; i++) {
      const rx = Math.floor(rng() * 14);
      const ry = Math.floor(rng() * 14);
      const rw = 1 + Math.floor(rng() * 3);
      PA.rect(ctx, x + rx, y + ry, rw, 1, '#1a1a14');
    }

    // 殘餘碳化草梗
    for (let i = 0; i < 4; i++) {
      const gx = 2 + Math.floor(rng() * 12);
      const gy = 4 + Math.floor(rng() * 10);
      PA.pixel(ctx, x + gx, y + gy, '#1a1810');
      PA.pixel(ctx, x + gx, y + gy - 1, '#1a1810');
    }

    // 灰塵散落
    for (let i = 0; i < 3; i++) {
      const dx = 1 + Math.floor(rng() * 14);
      const dy = 1 + Math.floor(rng() * 14);
      PA.pixel(ctx, x + dx, y + dy, '#3a3630');
    }
  };

