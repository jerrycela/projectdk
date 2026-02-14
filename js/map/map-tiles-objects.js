/**
 * Dungeon Keep - Map Object Tile Renderers
 * 8 multi-tile map objects (2x2, 3x3, 4x4)
 */

// === 2x2 Objects ===

/** 石柱 (2x2, 32x32px) */
DK.Map.drawStonePillar = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['1'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T; // 2x2 中心 X
  const cy = y + T; // 2x2 中心 Y

  // 底座（寬矩形）
  PA.rect(ctx, cx - 5, cy + 6, 10, 4, ISO.sideDark(c.base));
  PA.rect(ctx, cx - 5, cy + 5, 10, 1, c.base);

  // 柱身
  PA.rect(ctx, cx - 3, cy - 8, 6, 14, c.base);
  // 高光（左側）
  PA.rect(ctx, cx - 3, cy - 8, 1, 14, c.light);
  // 陰影（右側）
  PA.rect(ctx, cx + 2, cy - 8, 1, 14, c.dark);

  // 裂紋（2-3 條斜線）
  PA.pixel(ctx, cx - 1, cy - 3, c.crack);
  PA.pixel(ctx, cx, cy - 2, c.crack);
  PA.pixel(ctx, cx + 1, cy - 1, c.crack);
  PA.pixel(ctx, cx - 2, cy + 2, c.crack);
  PA.pixel(ctx, cx - 1, cy + 3, c.crack);

  // 頂部（稍寬）
  PA.rect(ctx, cx - 4, cy - 10, 8, 2, ISO.topLight(c.base));
};

/** 寶箱 (2x2, 32x32px) */
DK.Map.drawTreasureChest = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['2'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T;
  const cy = y + T;

  // 箱體（木質）
  PA.rect(ctx, cx - 6, cy - 2, 12, 8, c.wood);
  PA.rect(ctx, cx - 6, cy - 2, 12, 1, ISO.topLight(c.wood));
  PA.rect(ctx, cx - 6, cy + 5, 12, 1, c.darkWood);

  // 箱蓋（微開）
  PA.rect(ctx, cx - 6, cy - 5, 12, 3, ISO.topLight(c.wood));
  PA.rect(ctx, cx - 6, cy - 5, 1, 3, c.darkWood);
  PA.rect(ctx, cx + 5, cy - 5, 1, 3, c.darkWood);

  // 鐵邊框
  PA.rect(ctx, cx - 6, cy - 2, 12, 1, c.iron);
  PA.pixel(ctx, cx - 6, cy + 1, c.iron);
  PA.pixel(ctx, cx + 5, cy + 1, c.iron);

  // 金光（箱蓋縫隙）
  PA.pixel(ctx, cx - 2, cy - 3, c.gold);
  PA.pixel(ctx, cx - 1, cy - 3, c.goldLight);
  PA.pixel(ctx, cx, cy - 3, c.gold);
  PA.pixel(ctx, cx + 1, cy - 3, c.goldLight);

  // 鎖頭
  PA.pixel(ctx, cx, cy - 1, c.iron);
  PA.pixel(ctx, cx, cy, c.gold);
};

/** 木桶堆 (2x2, 32x32px, destructible) */
DK.Map.drawBarrelStack = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['3'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T;
  const cy = y + T;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    PA.rect(ctx, x, y, T * 2, T * 2, '#ffffff');
    ctx.restore();
  }

  // 下層 2 桶
  // 左桶
  PA.rect(ctx, cx - 7, cy - 1, 6, 8, c.wood);
  PA.rect(ctx, cx - 7, cy + 1, 6, 1, c.iron); // 鐵環
  PA.rect(ctx, cx - 7, cy + 4, 6, 1, c.iron);
  PA.rect(ctx, cx - 7, cy - 1, 1, 8, c.dark); // 陰影
  PA.rect(ctx, cx - 2, cy - 1, 1, 8, c.light); // 高光

  // 右桶
  PA.rect(ctx, cx + 1, cy - 1, 6, 8, c.wood);
  PA.rect(ctx, cx + 1, cy + 1, 6, 1, c.iron);
  PA.rect(ctx, cx + 1, cy + 4, 6, 1, c.iron);
  PA.rect(ctx, cx + 1, cy - 1, 1, 8, c.dark);
  PA.rect(ctx, cx + 6, cy - 1, 1, 8, c.light);

  // 上層 1 桶（堆疊）
  PA.rect(ctx, cx - 3, cy - 8, 6, 7, c.wood);
  PA.rect(ctx, cx - 3, cy - 6, 6, 1, c.iron);
  PA.rect(ctx, cx - 3, cy - 3, 6, 1, c.iron);
  PA.rect(ctx, cx - 3, cy - 8, 1, 7, c.dark);
  PA.rect(ctx, cx + 2, cy - 8, 1, 7, c.light);

  // HP 指示條（僅剩餘 HP < maxHP 時顯示）
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = T * 2 - 4;
    const hpRatio = obj.hp / obj.maxHp;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }
};

// === 3x3 Objects ===

/** 祭壇 (3x3, 48x48px) */
DK.Map.drawAltar = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['4'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 1.5; // 3x3 中心
  const cy = y + T * 1.5;

  // 石台基座（3 層等距）
  PA.rect(ctx, cx - 10, cy + 6, 20, 5, ISO.sideDark(c.stone));
  PA.rect(ctx, cx - 8, cy + 2, 16, 4, c.stone);
  PA.rect(ctx, cx - 6, cy - 1, 12, 3, ISO.topLight(c.stone));

  // 兩側燭台
  // 左燭台
  PA.rect(ctx, cx - 9, cy - 6, 2, 5, c.stoneDark);
  PA.pixel(ctx, cx - 9, cy - 7, c.candle);
  PA.pixel(ctx, cx - 8, cy - 7, c.candle);
  PA.pixel(ctx, cx - 9, cy - 8, '#ffcc44'); // 火焰

  // 右燭台
  PA.rect(ctx, cx + 7, cy - 6, 2, 5, c.stoneDark);
  PA.pixel(ctx, cx + 7, cy - 7, c.candle);
  PA.pixel(ctx, cx + 8, cy - 7, c.candle);
  PA.pixel(ctx, cx + 7, cy - 8, '#ffcc44');

  // 符文脈動（呼吸動畫）
  const pulseAlpha = 0.3 + 0.4 * Math.sin((time || 0) * 0.002);
  ctx.save();
  ctx.globalAlpha = pulseAlpha;
  PA.pixel(ctx, cx - 2, cy - 1, c.rune);
  PA.pixel(ctx, cx, cy - 1, c.rune);
  PA.pixel(ctx, cx + 2, cy - 1, c.rune);
  PA.pixel(ctx, cx - 1, cy, c.rune);
  PA.pixel(ctx, cx + 1, cy, c.rune);
  ctx.restore();
};

/** 水晶簇 (3x3, 48x48px) */
DK.Map.drawCrystalCluster = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['5'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 1.5;
  const cy = y + T * 1.5;

  // 底部陰影
  PA.rect(ctx, cx - 8, cy + 6, 16, 3, c.shadow);

  // 7 根水晶（不同高度和角度）
  const crystals = [
    { dx: -6, h: 12, w: 3 },
    { dx: -3, h: 18, w: 3 },
    { dx: 0, h: 22, w: 4 },  // 最高的中央水晶
    { dx: 4, h: 16, w: 3 },
    { dx: 7, h: 10, w: 2 },
    { dx: -8, h: 8, w: 2 },
    { dx: 9, h: 7, w: 2 },
  ];

  for (const cr of crystals) {
    const bx = cx + cr.dx;
    const by = cy + 6 - cr.h;
    // 漸層：base -> mid -> tip
    const bodyH = Math.floor(cr.h * 0.6);
    const tipH = cr.h - bodyH;
    PA.rect(ctx, bx, by + tipH, cr.w, bodyH, c.base);
    PA.rect(ctx, bx, by, cr.w, tipH, c.mid);
    PA.pixel(ctx, bx + Math.floor(cr.w / 2), by, c.tip); // 尖端
  }

  // 閃爍（隨機像素每 500ms）
  if (time) {
    const sparklePhase = Math.floor(time / 500) % 7;
    const sp = crystals[sparklePhase];
    PA.pixel(ctx, cx + sp.dx + 1, cy + 6 - sp.h + 2, c.sparkle);
  }
};

/** 符文陣 (3x3, 48x48px, destructible) */
DK.Map.drawRuneCircle = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['6'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 1.5;
  const cy = y + T * 1.5;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    PA.rect(ctx, x, y, T * 3, T * 3, '#ff4444');
    ctx.restore();
  }

  // 四角符文石
  const corners = [
    { dx: -10, dy: -10 }, { dx: 8, dy: -10 },
    { dx: -10, dy: 8 }, { dx: 8, dy: 8 },
  ];
  for (const cn of corners) {
    PA.rect(ctx, cx + cn.dx, cy + cn.dy, 3, 3, c.stone);
  }

  // 圓形魔法陣（用像素圓）
  PA.circle(ctx, cx, cy, 9, c.circle);

  // 中心十字符文
  PA.rect(ctx, cx - 3, cy, 7, 1, c.symbol);
  PA.rect(ctx, cx, cy - 3, 1, 7, c.symbol);

  // 旋轉光效（4 個光點繞圓）
  const rotAngle = (time || 0) * 0.001;
  const glowAlpha = 0.4 + 0.3 * Math.sin((time || 0) * 0.003);
  ctx.save();
  ctx.globalAlpha = glowAlpha;
  for (let i = 0; i < 4; i++) {
    const a = rotAngle + (i * Math.PI / 2);
    const gx = Math.round(cx + Math.cos(a) * 7);
    const gy = Math.round(cy + Math.sin(a) * 7);
    PA.pixel(ctx, gx, gy, c.glow);
    PA.pixel(ctx, gx + 1, gy, c.glow);
  }
  ctx.restore();

  // HP bar
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = T * 3 - 4;
    const hpRatio = obj.hp / obj.maxHp;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }
};

// === 4x4 Objects ===

/** 龍骨遺骸 (4x4, 64x64px) */
DK.Map.drawDragonSkeleton = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['7'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 2; // 4x4 中心
  const cy = y + T * 2;

  // 地面暗底
  PA.rect(ctx, x + 2, y + 2, T * 4 - 4, T * 4 - 4, c.ground);

  // 脊椎骨（中央橫線）
  PA.rect(ctx, cx - 14, cy + 2, 28, 2, c.boneShadow);
  PA.rect(ctx, cx - 14, cy, 28, 2, c.bone);

  // 肋骨（5 對）
  for (let i = 0; i < 5; i++) {
    const rx = cx - 10 + i * 5;
    // 上肋
    PA.rect(ctx, rx, cy - 8, 2, 8, c.bone);
    PA.pixel(ctx, rx - 1, cy - 8, c.bone);
    // 下肋
    PA.rect(ctx, rx, cy + 4, 2, 6, c.boneShadow);
    PA.pixel(ctx, rx + 2, cy + 9, c.boneShadow);
  }

  // 頭骨（左上角）
  PA.rect(ctx, x + 4, y + 6, 8, 7, c.bone);
  PA.rect(ctx, x + 3, y + 8, 1, 3, c.bone); // 下顎
  PA.rect(ctx, x + 12, y + 8, 2, 2, c.bone); // 鼻
  // 眼窩
  PA.pixel(ctx, x + 6, y + 8, c.ground);
  PA.pixel(ctx, x + 9, y + 8, c.ground);

  // 眼窩閃爍（10% 機率每 2 秒）
  if (time && Math.floor(time / 2000) % 10 === 0) {
    const flicker = Math.sin(time * 0.01) > 0.5;
    if (flicker) {
      PA.pixel(ctx, x + 6, y + 8, c.eye);
      PA.pixel(ctx, x + 9, y + 8, c.eye);
    }
  }

  // 尾骨（右下延伸）
  PA.rect(ctx, cx + 14, cy + 1, 6, 2, c.boneShadow);
  PA.rect(ctx, cx + 19, cy + 3, 4, 1, c.boneShadow);
  PA.pixel(ctx, cx + 22, cy + 4, c.boneShadow);
};

/** 封印之門 (4x4, 64x64px, destructible) */
DK.Map.drawSealedGate = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['8'].colors;
  const T = DK.CONFIG.TILE_SIZE;
  const cx = x + T * 2;
  const cy = y + T * 2;
  const hpRatio = (obj && obj.maxHp) ? obj.hp / obj.maxHp : 1;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    PA.rect(ctx, x, y, T * 4, T * 4, '#ffffff');
    ctx.restore();
  }

  // 石門框
  PA.rect(ctx, x + 2, y + 2, T * 4 - 4, T * 4 - 4, c.door);
  PA.rect(ctx, x + 4, y + 4, T * 4 - 8, T * 4 - 8, c.doorLight);

  // 門板（中央大矩形）
  PA.rect(ctx, cx - 10, cy - 12, 20, 26, c.door);

  // 鏈條（四角）
  const chains = [
    { dx: -12, dy: -12 }, { dx: 10, dy: -12 },
    { dx: -12, dy: 10 }, { dx: 10, dy: 10 },
  ];
  for (const ch of chains) {
    // 鏈條斷裂視覺（HP < 50% 時鏈條消失）
    if (hpRatio > 0.5) {
      PA.rect(ctx, cx + ch.dx, cy + ch.dy, 3, 3, c.chain);
      PA.pixel(ctx, cx + ch.dx + 1, cy + ch.dy + 1, c.doorLight);
    }
  }

  // 中央封印符文
  if (hpRatio > 0.25) {
    const sealAlpha = 0.5 + 0.3 * Math.sin((time || 0) * 0.002);
    ctx.save();
    ctx.globalAlpha = sealAlpha;
    PA.rect(ctx, cx - 3, cy - 3, 6, 6, c.seal);
    PA.rect(ctx, cx - 1, cy - 5, 2, 10, c.seal);
    PA.rect(ctx, cx - 5, cy - 1, 10, 2, c.seal);
    ctx.restore();
  }

  // 裂縫（HP < 50% 時出現，越來越寬）
  if (hpRatio < 0.5) {
    const crackWidth = hpRatio < 0.25 ? 3 : 1;
    PA.rect(ctx, cx - 1, cy - 10, crackWidth, 22, c.crack);

    // 裂縫發光
    const glowAlpha = (1 - hpRatio) * 0.5;
    ctx.save();
    ctx.globalAlpha = glowAlpha;
    PA.rect(ctx, cx - 2, cy - 8, crackWidth + 2, 18, c.glow);
    ctx.restore();
  }

  // HP bar
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = T * 4 - 4;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }
};

/** 統一渲染入口：根據 typeCode 分派到對應渲染函式 */
DK.Map.renderMapObjects = function(ctx, time) {
  const T = DK.CONFIG.TILE_SIZE;

  for (const obj of this.mapObjects) {
    if (obj.destroyed) continue;

    const x = obj.gridX * T;
    const y = obj.gridY * T;

    switch (obj.typeCode) {
      case '1': this.drawStonePillar(ctx, x, y, time); break;
      case '2': this.drawTreasureChest(ctx, x, y, time); break;
      case '3': this.drawBarrelStack(ctx, x, y, time, obj); break;
      case '4': this.drawAltar(ctx, x, y, time); break;
      case '5': this.drawCrystalCluster(ctx, x, y, time); break;
      case '6': this.drawRuneCircle(ctx, x, y, time, obj); break;
      case '7': this.drawDragonSkeleton(ctx, x, y, time); break;
      case '8': this.drawSealedGate(ctx, x, y, time, obj); break;
    }
  }
};
