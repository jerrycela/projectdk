/**
 * Dungeon Keep - 基本地磚渲染
 * 包含：地磚快取、牆壁、地板、外圍、可破壞牆
 */

DK.Map.computeTrapSlots = function() {
    this.wallTrapSlots = [];
    this.floorTrapSlots = [];

    for (let r = 0; r < this.layout.length; r++) {
      for (let c = 0; c < this.layout[r].length; c++) {
        // 跳過外圍區域
        if (this.isOuter(c, r)) continue;

        const tile = this.getTile(c, r);

        if (tile === 'W') {
          // 檢查是否鄰接路徑（牆壁陷阱位）
          const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
          let adjacentToPath = false;
          let facing = null;

          for (const [dc, dr] of dirs) {
            if (this.isPath(c + dc, r + dr)) {
              adjacentToPath = true;
              facing = { dc, dr };
              break;
            }
          }

          if (adjacentToPath) {
            this.wallTrapSlots.push({ col: c, row: r, facing });
          }
        } else if (this.isInteriorFloor(c, r) && tile !== 'H') {
          // 地板陷阱位（排除地心格）
          this.floorTrapSlots.push({ col: c, row: r });
        }
      }
    }
  };

DK.Map.prerenderTiles = function() {
    const T = DK.CONFIG.TILE_SIZE;

    // 牆壁地磚變體（8 個變體 - DW3 風格）
    for (let v = 0; v < 8; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawWallTile(ctx, 0, 0, v);
      this.tileCache[`wall_${v}`] = canvas;
    }

    // 地板地磚變體（8 個變體 - DW3 風格）
    for (let v = 0; v < 8; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawFloorTile(ctx, 0, 0, v);
      this.tileCache[`floor_${v}`] = canvas;
    }

    // 深淵地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawAbyssTile(ctx, 0, 0, v);
      this.tileCache[`abyss_${v}`] = canvas;
    }

    // 水潭地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawPoolTile(ctx, 0, 0, v);
      this.tileCache[`pool_${v}`] = canvas;
    }

    // 草叢地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawGrassTile(ctx, 0, 0, v);
      this.tileCache[`grass_${v}`] = canvas;
    }

    // 焦黑草叢地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawGrassScorchedTile(ctx, 0, 0, v);
      this.tileCache[`grass_scorched_${v}`] = canvas;
    }

    // 軌道地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
    }

    // 外圍地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawOuterTile(ctx, 0, 0, v);
      this.tileCache[`outer_${v}`] = canvas;
    }

    // 可破壞牆地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawBreakableWallTile(ctx, 0, 0, v);
      this.tileCache[`breakable_${v}`] = canvas;
    }

    // 地心地磚變體（6 個變體）
    for (let v = 0; v < 6; v++) {
      const canvas = document.createElement('canvas');
      canvas.width = T;
      canvas.height = T;
      const ctx = canvas.getContext('2d');
      this.drawHeartTile(ctx, 0, 0, v);
      this.tileCache[`heart_${v}`] = canvas;
    }

    // 入口地磚
    const entranceCanvas = document.createElement('canvas');
    entranceCanvas.width = T;
    entranceCanvas.height = T;
    const ectx = entranceCanvas.getContext('2d');
    this.drawEntranceTile(ectx, 0, 0);
    this.tileCache['entrance'] = entranceCanvas;

    // 出口地磚
    const exitCanvas = document.createElement('canvas');
    exitCanvas.width = T;
    exitCanvas.height = T;
    const xctx = exitCanvas.getContext('2d');
    this.drawExitTile(xctx, 0, 0);
    this.tileCache['exit'] = exitCanvas;
  };

DK.Map.drawOuterTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 179 + 31);

    // 棕色泥土底色
    PA.rect(ctx, x, y, 16, 16, '#2a2218');

    // 泥土色調變化
    for (let i = 0; i < 10; i++) {
      const rx = Math.floor(rng() * 14);
      const ry = Math.floor(rng() * 14);
      const rw = 2 + Math.floor(rng() * 4);
      const rh = 1 + Math.floor(rng() * 3);
      const roll = rng();
      const shade = roll > 0.6 ? '#342a1e' : roll > 0.3 ? '#2e2618' : '#1e1a12';
      PA.rect(ctx, x + rx, y + ry, rw, rh, shade);
    }

    // 深綠色野草
    for (let i = 0; i < 6; i++) {
      const gx = 1 + Math.floor(rng() * 14);
      const gy = 2 + Math.floor(rng() * 12);
      const height = 1 + Math.floor(rng() * 2);
      const shade = rng() > 0.5 ? '#1a3018' : '#243820';
      for (let h = 0; h < height; h++) {
        if (gy - h >= 0) {
          PA.pixel(ctx, x + gx, y + gy - h, shade);
        }
      }
    }

    // 碎石
    for (let i = 0; i < 3; i++) {
      const sx = 1 + Math.floor(rng() * 14);
      const sy = 1 + Math.floor(rng() * 14);
      PA.pixel(ctx, x + sx, y + sy, rng() > 0.5 ? '#3a3428' : '#2a2620');
    }

    // 偶爾較亮的泥土斑點
    if (variant === 1 || variant === 4) {
      PA.pixel(ctx, x + 5, y + 8, '#3a3020');
      PA.pixel(ctx, x + 11, y + 4, '#3a3020');
    }
  };

DK.Map.drawBreakableWallTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 163 + 53);

    // 稍亮的石磚底色（比普通牆亮）
    PA.rect(ctx, x, y, 16, 16, '#3a3850');

    // 磚塊排列：2 排交錯
    const brickRows = [
      { y: 0, h: 7, offsets: variant % 2 === 0 ? [0, 7] : [0, 5, 11] },
      { y: 8, h: 8, offsets: variant % 2 === 0 ? [0, 5, 11] : [0, 8] },
    ];

    // 灰縫線
    PA.rect(ctx, x, y + 7, 16, 1, '#282638');

    for (const row of brickRows) {
      for (let i = 0; i < row.offsets.length; i++) {
        const bx = x + row.offsets[i];
        const bw = (i < row.offsets.length - 1)
          ? row.offsets[i + 1] - row.offsets[i] - 1
          : 16 - row.offsets[i];
        const by = y + row.y;

        const brickRoll = rng();
        const shade = brickRoll > 0.6 ? '#4a4868' : brickRoll > 0.3 ? '#3e3c58' : '#343248';
        PA.rect(ctx, bx, by, bw, row.h, shade);

        // 高光
        PA.rect(ctx, bx, by, bw, 1, '#5a5878');
        PA.rect(ctx, bx, by, 1, row.h, '#4e4c68');

        // 陰影
        PA.rect(ctx, bx, by + row.h - 1, bw, 1, '#2a2840');
        PA.rect(ctx, bx + bw - 1, by, 1, row.h, '#2a2840');

        // 灰縫
        if (i < row.offsets.length - 1) {
          PA.rect(ctx, bx + bw, by, 1, row.h, '#282638');
        }
      }
    }

    // 裂紋（每個變體 2-3 條裂縫）
    const crackCount = 2 + Math.floor(rng() * 2);
    for (let ci = 0; ci < crackCount; ci++) {
      const startX = 2 + Math.floor(rng() * 10);
      const startY = 2 + Math.floor(rng() * 10);
      const length = 3 + Math.floor(rng() * 4);
      const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      const dirIdx = Math.floor(rng() * 4);
      const [cdx, cdy] = dirs[dirIdx];

      for (let p = 0; p < length; p++) {
        const px = startX + cdx * p;
        const py = startY + cdy * p;
        if (px >= 0 && px < 16 && py >= 0 && py < 16) {
          PA.pixel(ctx, x + px, y + py, '#1a1828');
          // 裂紋旁高光
          if (px + 1 < 16) {
            PA.pixel(ctx, x + px + 1, y + py, '#5a5878');
          }
        }
      }
    }

    // 苔蘚點綴
    if (variant === 2 || variant === 4) {
      PA.pixel(ctx, x + 3, y + 7, C.WALL_MOSS);
      PA.pixel(ctx, x + 4, y + 7, C.WALL_MOSS);
      PA.pixel(ctx, x + 12, y + 7, '#1e3a1e');
    }
  };

DK.Map.drawHeartTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 199 + 67);

    // 深紫色基底
    PA.rect(ctx, x, y, 16, 16, '#2a1a3a');

    // 發光石板圖案
    const innerShade = rng() > 0.5 ? '#3a2a4e' : '#342448';
    PA.rect(ctx, x + 1, y + 1, 14, 14, innerShade);

    // 核心發光（增強版：5層漸進式發光）
    PA.rect(ctx, x + 3, y + 3, 10, 10, '#4a2a5e'); // 外層
    PA.rect(ctx, x + 4, y + 4, 8, 8, '#5a3a6e');   // 中外層
    PA.rect(ctx, x + 5, y + 5, 6, 6, '#6a4a80');   // 中層
    PA.rect(ctx, x + 6, y + 6, 4, 4, '#8a6aa0');   // 中內層
    PA.rect(ctx, x + 7, y + 7, 2, 2, '#aa8ac0');   // 核心

    // 中心最亮點（擴大範圍）
    PA.pixel(ctx, x + 7, y + 7, '#ddbbff');
    PA.pixel(ctx, x + 8, y + 8, '#ddbbff');
    PA.pixel(ctx, x + 7, y + 8, '#ccaaee');
    PA.pixel(ctx, x + 8, y + 7, '#ccaaee');

    // 邊緣發光紋路（更明顯）
    for (let i = 2; i < 14; i++) {
      if (rng() > 0.3) {
        PA.pixel(ctx, x + i, y + 1, '#5a4a6e');
      }
      if (rng() > 0.3) {
        PA.pixel(ctx, x + i, y + 14, '#5a4a6e');
      }
      if (rng() > 0.3) {
        PA.pixel(ctx, x + 1, y + i, '#5a4a6e');
      }
      if (rng() > 0.3) {
        PA.pixel(ctx, x + 14, y + i, '#5a4a6e');
      }
    }

    // 角落暗化
    PA.pixel(ctx, x, y, '#1a0e28');
    PA.pixel(ctx, x + 15, y, '#1a0e28');
    PA.pixel(ctx, x, y + 15, '#1a0e28');
    PA.pixel(ctx, x + 15, y + 15, '#1a0e28');

    // 散落的能量粒子（增加數量和亮度）
    for (let i = 0; i < 6; i++) {
      const px = 3 + Math.floor(rng() * 10);
      const py = 3 + Math.floor(rng() * 10);
      const brightness = rng() > 0.5 ? '#aa8ac0' : '#9a7ab0';
      PA.pixel(ctx, x + px, y + py, brightness);
    }
  };

DK.Map.drawWallTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS;
    const rng = PA.seededRandom(variant * 137 + 42);

    // === 深色石磚牆（原始設計）===
    PA.rect(ctx, x, y, 16, 16, C.WALL_DARK);

    // 磚塊排列：3 排交錯磚塊
    const brickRows = [
      { y: 0, h: 5, offsets: variant % 2 === 0 ? [0, 6, 12] : [0, 8] },
      { y: 6, h: 4, offsets: variant % 2 === 0 ? [0, 8] : [0, 5, 11] },
      { y: 11, h: 5, offsets: variant % 2 === 0 ? [0, 6, 12] : [0, 8] },
    ];

    // 灰縫線
    PA.rect(ctx, x, y + 5, 16, 1, C.WALL_MORTAR);
    PA.rect(ctx, x, y + 10, 16, 1, C.WALL_MORTAR);

    // 繪製每排磚塊
    for (const row of brickRows) {
      for (let i = 0; i < row.offsets.length; i++) {
        const bx = x + row.offsets[i];
        const bw = (i < row.offsets.length - 1)
          ? row.offsets[i + 1] - row.offsets[i] - 1
          : 16 - row.offsets[i];
        const by = y + row.y;

        // 磚塊本體（使用新過渡色增加層次）
        const brickRoll = rng();
        const brickShade = brickRoll > 0.7 ? C.WALL_LIGHT
          : brickRoll > 0.4 ? C.WALL_MID
          : brickRoll > 0.15 ? C.WALL_WARM
          : C.WALL_DARK_MID;
        PA.rect(ctx, bx, by, bw, row.h, brickShade);

        // 左上高光
        PA.rect(ctx, bx, by, bw, 1, C.WALL_HIGHLIGHT);
        PA.rect(ctx, bx, by, 1, row.h, PA.lighten(brickShade, 12));

        // 右下陰影
        PA.rect(ctx, bx, by + row.h - 1, bw, 1, C.WALL_DARK);
        PA.rect(ctx, bx + bw - 1, by, 1, row.h, C.WALL_DARK);

        // 磚塊間灰縫
        if (i < row.offsets.length - 1) {
          PA.rect(ctx, bx + bw, by, 1, row.h, C.WALL_MORTAR);
        }

        // 紋理噪點（增至 5 個，使用過渡色階）
        for (let t = 0; t < 5; t++) {
          const tx = bx + 1 + Math.floor(rng() * Math.max(1, bw - 2));
          const ty = by + 1 + Math.floor(rng() * Math.max(1, row.h - 2));
          const r2 = rng();
          const noiseColor = r2 > 0.7 ? C.WALL_HIGHLIGHT
            : r2 > 0.4 ? C.WALL_MID_LIGHT
            : r2 > 0.2 ? C.WALL_DARK_MID
            : C.WALL_DARK;
          PA.pixel(ctx, tx, ty, noiseColor);
        }
      }
    }

    // 灰縫深色裂線（在磚塊之上疊加）
    const mortarDeep = PA.darken(C.WALL_MORTAR, 8);
    for (let mx = 0; mx < 16; mx += 3) {
      PA.pixel(ctx, x + mx, y + 5, mortarDeep);
      PA.pixel(ctx, x + mx + 1, y + 10, mortarDeep);
    }

    // 苔蘚/裂紋（依變體）
    if (variant === 2) {
      // 苔蘚區擴大至 4-6px，混合 WALL_DARK_MID / WALL_MID_LIGHT
      PA.pixel(ctx, x + 2, y + 5, C.WALL_MOSS);
      PA.pixel(ctx, x + 3, y + 5, C.WALL_MOSS);
      PA.pixel(ctx, x + 3, y + 4, '#2a5a2a');
      PA.pixel(ctx, x + 4, y + 5, C.WALL_DARK_MID);
      PA.pixel(ctx, x + 4, y + 4, C.WALL_MID_LIGHT);
      PA.pixel(ctx, x + 11, y + 10, C.WALL_MOSS);
      PA.pixel(ctx, x + 12, y + 10, '#1e3a1e');
      PA.pixel(ctx, x + 12, y + 9, C.WALL_DARK_MID);
      PA.pixel(ctx, x + 13, y + 10, C.WALL_MID_LIGHT);
    }
    if (variant === 3) {
      PA.pixel(ctx, x + 9, y + 2, C.WALL_MORTAR);
      PA.pixel(ctx, x + 10, y + 3, C.WALL_MORTAR);
      PA.pixel(ctx, x + 10, y + 4, C.WALL_MORTAR);
    }

    // 邊角暗角
    PA.pixel(ctx, x, y, C.WALL_MORTAR);
    PA.pixel(ctx, x + 15, y, C.WALL_MORTAR);
    PA.pixel(ctx, x, y + 15, C.WALL_MORTAR);
    PA.pixel(ctx, x + 15, y + 15, C.WALL_MORTAR);
  };

DK.Map.drawFloorTile = function(ctx, x, y, variant) {
    const PA = DK.PixelArt;
    const C = DK.COLORS.environment.floor;
    const T = 16;
    const rng = PA.seededRandom(variant * 251 + 73);

    // === DW3 實際風格：粗糙石地（無幾何圖案）===

    // 1. 填充基礎色（深灰綠色）
    const baseColor = '#2a2e2a';  // 深色石地
    PA.rect(ctx, x, y, T, T, baseColor);

    // 2. 添加細微的色調變化（2-4 個區域）
    const patchCount = 2 + Math.floor(rng() * 3);
    for (let i = 0; i < patchCount; i++) {
      const px = x + Math.floor(rng() * T);
      const py = y + Math.floor(rng() * T);
      const pw = 2 + Math.floor(rng() * 4);
      const ph = 2 + Math.floor(rng() * 4);

      const shadeRoll = rng();
      const patchColor = shadeRoll > 0.7 ? '#323632'   // 稍亮
                       : shadeRoll > 0.4 ? '#2e322e'   // 中等
                       : '#262a26';                     // 稍暗

      PA.rect(ctx, px, py, pw, ph, patchColor);
    }

    // 3. 添加隨機噪點（8-12 個）
    const noiseCount = 8 + Math.floor(rng() * 5);
    for (let i = 0; i < noiseCount; i++) {
      const nx = x + Math.floor(rng() * T);
      const ny = y + Math.floor(rng() * T);
      const noiseRoll = rng();
      const noiseColor = noiseRoll > 0.6 ? '#363a36'   // 亮噪點
                       : noiseRoll > 0.3 ? '#1e221e'   // 暗噪點
                       : '#2a2e2a';                     // 中等
      PA.pixel(ctx, nx, ny, noiseColor);
    }

    // 4. 添加不規則裂紋（1-3 條）
    const crackCount = 1 + Math.floor(rng() * 3);
    for (let ci = 0; ci < crackCount; ci++) {
      const crackStartX = x + Math.floor(rng() * T);
      const crackStartY = y + Math.floor(rng() * T);
      const crackLength = 2 + Math.floor(rng() * 4);

      // 隨機方向
      const dirs = [[1, 0], [0, 1], [1, 1], [-1, 1], [1, -1]];
      const [dx, dy] = dirs[Math.floor(rng() * dirs.length)];

      for (let p = 0; p < crackLength; p++) {
        const cx = crackStartX + dx * p;
        const cy = crackStartY + dy * p;
        if (cx >= x && cx < x + T && cy >= y && cy < y + T) {
          PA.pixel(ctx, cx, cy, '#1a1e1a');  // 深色裂紋
        }
      }
    }

    // 5. 變體差異（部分地格添加更多裂紋或風化）
    if (variant === 2 || variant === 5 || variant === 7) {
      // 額外的風化效果
      for (let i = 0; i < 3; i++) {
        const wx = x + 1 + Math.floor(rng() * 14);
        const wy = y + 1 + Math.floor(rng() * 14);
        PA.pixel(ctx, wx, wy, '#1e221e');
      }
    }

    // 6. 添加熔岩紅點（隨機分布 2-5 個）
    const lavaCount = 2 + Math.floor(rng() * 4);
    for (let i = 0; i < lavaCount; i++) {
      const lx = x + 1 + Math.floor(rng() * 14);
      const ly = y + 1 + Math.floor(rng() * 14);

      // 隨機紅色色調（暗紅到亮紅）
      const lavaRoll = rng();
      const lavaColor = lavaRoll > 0.7 ? '#cc4422'   // 亮紅
                      : lavaRoll > 0.4 ? '#aa3311'   // 中紅
                      : '#882211';                    // 暗紅

      PA.pixel(ctx, lx, ly, lavaColor);

      // 部分紅點周圍添加微弱的橙色光暈
      if (rng() > 0.6) {
        if (lx + 1 < x + T) PA.pixel(ctx, lx + 1, ly, '#442211');
        if (ly + 1 < y + T) PA.pixel(ctx, lx, ly + 1, '#442211');
      }
    }
  };

