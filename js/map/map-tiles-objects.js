/**
 * Dungeon Keep - Map Object Tile Renderers
 * 8 multi-tile map objects (2x2, 3x3, 4x4)
 * 每個物件都填滿完整的 NxN 像素空間
 */

// === 2x2 Objects (32x32px) ===

/** 石柱 (2x2, 32x32px) — 粗壯石柱，底座佔滿寬度，有碎石和苔蘚 */
DK.Map.drawStonePillar = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['1'].colors;

  // 地面底色（填滿整個 32x32）
  PA.rect(ctx, x, y, 32, 32, '#1a1a22');

  // 地面碎石散佈
  PA.rect(ctx, x + 2, y + 26, 3, 2, c.dark);
  PA.rect(ctx, x + 24, y + 28, 4, 2, c.dark);
  PA.pixel(ctx, x + 7, y + 29, c.crack);
  PA.pixel(ctx, x + 22, y + 27, c.crack);
  PA.rect(ctx, x + 27, y + 24, 2, 2, c.dark);
  PA.pixel(ctx, x + 3, y + 23, c.dark);

  // 底座陰影（地面投影）
  ctx.save();
  ctx.globalAlpha = 0.3;
  PA.rect(ctx, x + 4, y + 26, 24, 4, '#000000');
  ctx.restore();

  // 底座第 1 層（最寬，佔滿水平空間）
  PA.rect(ctx, x + 3, y + 23, 26, 5, ISO.sideDark(c.base));
  PA.rect(ctx, x + 3, y + 22, 26, 2, c.base);
  PA.rect(ctx, x + 3, y + 22, 26, 1, ISO.topLight(c.base));

  // 底座第 2 層
  PA.rect(ctx, x + 5, y + 19, 22, 4, ISO.sideDark(c.base));
  PA.rect(ctx, x + 5, y + 18, 22, 2, c.base);
  PA.rect(ctx, x + 5, y + 18, 22, 1, ISO.topLight(c.base));

  // 柱身（粗壯，佔中央 14px 寬）
  PA.rect(ctx, x + 9, y + 4, 14, 15, c.base);
  // 左側高光
  PA.rect(ctx, x + 9, y + 4, 2, 15, c.light);
  // 右側深陰影
  PA.rect(ctx, x + 21, y + 4, 2, 15, c.dark);
  // 中央微妙高光帶
  PA.rect(ctx, x + 14, y + 5, 1, 13, c.light);

  // 柱身裝飾帶（上下各一條）
  PA.rect(ctx, x + 8, y + 7, 16, 1, ISO.topLight(c.base));
  PA.rect(ctx, x + 8, y + 8, 16, 1, ISO.sideDark(c.base));
  PA.rect(ctx, x + 8, y + 15, 16, 1, ISO.topLight(c.base));
  PA.rect(ctx, x + 8, y + 16, 16, 1, ISO.sideDark(c.base));

  // 柱頂（柱冠，比柱身寬）
  PA.rect(ctx, x + 6, y + 2, 20, 3, c.base);
  PA.rect(ctx, x + 6, y + 1, 20, 2, ISO.topLight(c.base));
  PA.rect(ctx, x + 7, y, 18, 1, PA.lighten(c.light, 20));
  // 柱冠側面陰影
  PA.rect(ctx, x + 24, y + 2, 2, 3, c.dark);

  // 裂紋（斜線穿過柱身）
  PA.pixel(ctx, x + 12, y + 9, c.crack);
  PA.pixel(ctx, x + 13, y + 10, c.crack);
  PA.pixel(ctx, x + 14, y + 11, c.crack);
  PA.pixel(ctx, x + 15, y + 12, c.crack);
  PA.pixel(ctx, x + 14, y + 13, c.crack);
  // 第二條裂紋
  PA.pixel(ctx, x + 17, y + 5, c.crack);
  PA.pixel(ctx, x + 18, y + 6, c.crack);
  PA.pixel(ctx, x + 18, y + 7, c.crack);

  // 苔蘚（底座上）
  ctx.save();
  ctx.globalAlpha = 0.5;
  PA.pixel(ctx, x + 5, y + 20, '#2a5a2a');
  PA.pixel(ctx, x + 6, y + 21, '#2a5a2a');
  PA.pixel(ctx, x + 24, y + 20, '#2a5a2a');
  PA.pixel(ctx, x + 25, y + 21, '#2a5a2a');
  PA.rect(ctx, x + 9, y + 17, 3, 1, '#2a5a2a');
  ctx.restore();

  // 邊緣暗化
  for (let i = 0; i < 32; i++) {
    PA.pixel(ctx, x + i, y + 31, '#0a0a0a');
    PA.pixel(ctx, x, y + i, '#0a0a12');
    PA.pixel(ctx, x + 31, y + i, '#0a0a12');
  }
};

/** 寶箱 (2x2, 32x32px) — 大型寶箱微開，金幣散落地面 */
DK.Map.drawTreasureChest = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['2'].colors;

  // 地面底色
  PA.rect(ctx, x, y, 32, 32, '#1a1a22');

  // 散落金幣（地面上）
  PA.pixel(ctx, x + 3, y + 25, c.gold);
  PA.pixel(ctx, x + 5, y + 27, c.goldLight);
  PA.pixel(ctx, x + 26, y + 26, c.gold);
  PA.pixel(ctx, x + 28, y + 24, c.goldLight);
  PA.pixel(ctx, x + 7, y + 23, c.gold);
  PA.rect(ctx, x + 23, y + 22, 2, 1, c.gold);
  PA.pixel(ctx, x + 2, y + 20, c.goldLight);
  PA.pixel(ctx, x + 28, y + 20, c.gold);
  // 寶石
  PA.pixel(ctx, x + 4, y + 22, '#cc2244');
  PA.pixel(ctx, x + 27, y + 28, '#2266cc');

  // 地面投影
  ctx.save();
  ctx.globalAlpha = 0.3;
  PA.rect(ctx, x + 3, y + 24, 26, 6, '#000000');
  ctx.restore();

  // 箱體底部（主體，寬大）
  PA.rect(ctx, x + 3, y + 14, 26, 12, c.wood);
  // 頂面
  PA.rect(ctx, x + 3, y + 14, 26, 2, ISO.topLight(c.wood));
  // 底邊
  PA.rect(ctx, x + 3, y + 24, 26, 2, c.darkWood);
  // 左陰影
  PA.rect(ctx, x + 3, y + 14, 2, 12, c.darkWood);
  // 右高光
  PA.rect(ctx, x + 27, y + 14, 2, 12, ISO.sideDark(c.wood));

  // 鐵邊帶（3 條水平）
  PA.rect(ctx, x + 3, y + 14, 26, 1, c.iron);
  PA.rect(ctx, x + 3, y + 19, 26, 1, c.iron);
  PA.rect(ctx, x + 3, y + 24, 26, 1, c.iron);
  // 鐵邊直條
  PA.rect(ctx, x + 15, y + 14, 2, 12, c.iron);

  // 箱蓋（斜開，向後傾）
  PA.rect(ctx, x + 3, y + 7, 26, 8, ISO.topLight(c.wood));
  PA.rect(ctx, x + 3, y + 7, 26, 1, PA.lighten(c.wood, 30));
  PA.rect(ctx, x + 3, y + 7, 2, 8, c.darkWood);
  PA.rect(ctx, x + 27, y + 7, 2, 8, ISO.sideDark(c.wood));
  // 蓋子鐵邊
  PA.rect(ctx, x + 3, y + 14, 26, 1, c.iron);
  PA.rect(ctx, x + 3, y + 10, 26, 1, c.iron);
  PA.rect(ctx, x + 15, y + 7, 2, 8, c.iron);

  // 箱蓋內的金光（微開縫隙透出）
  ctx.save();
  ctx.globalAlpha = 0.7;
  PA.rect(ctx, x + 6, y + 13, 20, 2, c.goldLight);
  ctx.restore();

  // 寶箱內的金幣堆（從縫隙溢出）
  PA.rect(ctx, x + 8, y + 12, 5, 3, c.gold);
  PA.rect(ctx, x + 14, y + 11, 6, 4, c.goldLight);
  PA.rect(ctx, x + 21, y + 12, 4, 3, c.gold);
  PA.pixel(ctx, x + 10, y + 11, c.goldLight);
  PA.pixel(ctx, x + 18, y + 11, c.gold);
  // 寶石在金幣中
  PA.pixel(ctx, x + 12, y + 12, '#cc2244');
  PA.pixel(ctx, x + 19, y + 12, '#22cc66');

  // 大鎖頭
  PA.rect(ctx, x + 14, y + 16, 4, 4, c.iron);
  PA.rect(ctx, x + 15, y + 17, 2, 2, c.gold);
  PA.pixel(ctx, x + 16, y + 20, c.iron);

  // 邊緣暗化
  for (let i = 0; i < 32; i++) {
    PA.pixel(ctx, x + i, y + 31, '#0a0a0a');
    PA.pixel(ctx, x, y + i, '#0a0a12');
    PA.pixel(ctx, x + 31, y + i, '#0a0a12');
  }
};

/** 木桶堆 (2x2, 32x32px, destructible) — 三桶堆疊，有稻草和濺灑液體 */
DK.Map.drawBarrelStack = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['3'].colors;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    PA.rect(ctx, x, y, 32, 32, '#ffffff');
    ctx.restore();
  }

  // 地面底色
  PA.rect(ctx, x, y, 32, 32, '#1a1a22');

  // 地面濺灑液體（深紫色酒液）
  ctx.save();
  ctx.globalAlpha = 0.4;
  PA.rect(ctx, x + 22, y + 27, 5, 3, '#442244');
  PA.rect(ctx, x + 24, y + 25, 3, 2, '#442244');
  PA.pixel(ctx, x + 27, y + 28, '#442244');
  ctx.restore();

  // 稻草散佈
  PA.pixel(ctx, x + 2, y + 28, '#8a7a3a');
  PA.pixel(ctx, x + 4, y + 29, '#9a8a4a');
  PA.pixel(ctx, x + 27, y + 29, '#8a7a3a');
  PA.rect(ctx, x + 1, y + 26, 3, 1, '#8a7a3a');
  PA.pixel(ctx, x + 29, y + 26, '#9a8a4a');

  // 地面投影
  ctx.save();
  ctx.globalAlpha = 0.3;
  PA.rect(ctx, x + 2, y + 26, 28, 4, '#000000');
  ctx.restore();

  // === 左桶（底層左，正面朝前） ===
  PA.rect(ctx, x + 1, y + 14, 14, 14, c.wood);
  // 桶的圓弧（中間寬，上下窄）
  PA.rect(ctx, x + 1, y + 14, 1, 14, c.dark);
  PA.rect(ctx, x + 14, y + 14, 1, 14, ISO.sideDark(c.wood));
  PA.rect(ctx, x + 2, y + 14, 1, 14, ISO.sideDark(c.wood));
  PA.rect(ctx, x + 13, y + 14, 1, 14, c.dark);
  // 中央高光
  PA.rect(ctx, x + 7, y + 14, 2, 14, c.light);
  // 鐵環（3 條）
  PA.rect(ctx, x + 1, y + 16, 14, 1, c.iron);
  PA.rect(ctx, x + 1, y + 21, 14, 1, c.iron);
  PA.rect(ctx, x + 1, y + 26, 14, 1, c.iron);
  // 頂面
  PA.rect(ctx, x + 3, y + 13, 10, 2, ISO.topLight(c.wood));

  // === 右桶（底層右，稍後方） ===
  PA.rect(ctx, x + 17, y + 15, 13, 13, c.wood);
  PA.rect(ctx, x + 17, y + 15, 1, 13, c.dark);
  PA.rect(ctx, x + 29, y + 15, 1, 13, ISO.sideDark(c.wood));
  PA.rect(ctx, x + 18, y + 15, 1, 13, ISO.sideDark(c.wood));
  PA.rect(ctx, x + 28, y + 15, 1, 13, c.dark);
  PA.rect(ctx, x + 23, y + 15, 2, 13, c.light);
  PA.rect(ctx, x + 17, y + 17, 13, 1, c.iron);
  PA.rect(ctx, x + 17, y + 22, 13, 1, c.iron);
  PA.rect(ctx, x + 17, y + 26, 13, 1, c.iron);
  PA.rect(ctx, x + 19, y + 14, 9, 2, ISO.topLight(c.wood));

  // === 頂桶（橫放在兩桶上方） ===
  PA.rect(ctx, x + 5, y + 2, 22, 12, c.wood);
  PA.rect(ctx, x + 5, y + 2, 1, 12, c.dark);
  PA.rect(ctx, x + 26, y + 2, 1, 12, ISO.sideDark(c.wood));
  PA.rect(ctx, x + 6, y + 2, 1, 12, ISO.sideDark(c.wood));
  PA.rect(ctx, x + 25, y + 2, 1, 12, c.dark);
  PA.rect(ctx, x + 15, y + 2, 2, 12, c.light);
  // 鐵環（橫放桶的直條）
  PA.rect(ctx, x + 9, y + 2, 1, 12, c.iron);
  PA.rect(ctx, x + 16, y + 2, 1, 12, c.iron);
  PA.rect(ctx, x + 22, y + 2, 1, 12, c.iron);
  // 頂面弧形
  PA.rect(ctx, x + 7, y + 1, 18, 2, ISO.topLight(c.wood));

  // 木紋細節
  PA.pixel(ctx, x + 10, y + 5, c.dark);
  PA.pixel(ctx, x + 20, y + 8, c.dark);
  PA.pixel(ctx, x + 5, y + 19, c.dark);
  PA.pixel(ctx, x + 11, y + 22, c.dark);
  PA.pixel(ctx, x + 21, y + 19, c.dark);

  // HP 指示條
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = 28;
    const hpRatio = obj.hp / obj.maxHp;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }

  // 邊緣暗化
  for (let i = 0; i < 32; i++) {
    PA.pixel(ctx, x + i, y + 31, '#0a0a0a');
  }
};

// === 3x3 Objects (48x48px) ===

/** 祭壇 (3x3, 48x48px) — 宏偉石台，多層階梯，燭台和符文地紋 */
DK.Map.drawAltar = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['4'].colors;

  // 地面底色（填滿 48x48）
  PA.rect(ctx, x, y, 48, 48, '#1a1a22');

  // 地面符文紋路（外圍裝飾線）
  ctx.save();
  ctx.globalAlpha = 0.25;
  // 四邊線條
  PA.rect(ctx, x + 4, y + 4, 40, 1, c.rune);
  PA.rect(ctx, x + 4, y + 43, 40, 1, c.rune);
  PA.rect(ctx, x + 4, y + 4, 1, 40, c.rune);
  PA.rect(ctx, x + 43, y + 4, 1, 40, c.rune);
  // 四角符文標記
  PA.rect(ctx, x + 3, y + 3, 3, 3, c.rune);
  PA.rect(ctx, x + 42, y + 3, 3, 3, c.rune);
  PA.rect(ctx, x + 3, y + 42, 3, 3, c.rune);
  PA.rect(ctx, x + 42, y + 42, 3, 3, c.rune);
  // 對角連線
  for (let i = 0; i < 6; i++) {
    PA.pixel(ctx, x + 7 + i, y + 7 + i, c.rune);
    PA.pixel(ctx, x + 41 - i, y + 7 + i, c.rune);
    PA.pixel(ctx, x + 7 + i, y + 41 - i, c.rune);
    PA.pixel(ctx, x + 41 - i, y + 41 - i, c.rune);
  }
  ctx.restore();

  // 地面投影
  ctx.save();
  ctx.globalAlpha = 0.25;
  PA.rect(ctx, x + 5, y + 38, 38, 6, '#000000');
  ctx.restore();

  // === 階梯平台（3 層，從下到上） ===
  // 第 1 層（最底，最寬）
  PA.rect(ctx, x + 3, y + 38, 42, 6, ISO.sideDark(c.stone));
  PA.rect(ctx, x + 3, y + 36, 42, 3, c.stone);
  PA.rect(ctx, x + 3, y + 36, 42, 1, ISO.topLight(c.stone));

  // 第 2 層
  PA.rect(ctx, x + 7, y + 31, 34, 6, ISO.sideDark(c.stone));
  PA.rect(ctx, x + 7, y + 29, 34, 3, c.stone);
  PA.rect(ctx, x + 7, y + 29, 34, 1, ISO.topLight(c.stone));

  // 第 3 層（祭壇桌面）
  PA.rect(ctx, x + 11, y + 24, 26, 6, ISO.sideDark(c.stone));
  PA.rect(ctx, x + 11, y + 22, 26, 3, c.stone);
  PA.rect(ctx, x + 11, y + 22, 26, 1, ISO.topLight(c.stone));

  // 祭壇中央祭台（小型凸起）
  PA.rect(ctx, x + 17, y + 18, 14, 5, ISO.sideDark(c.stone));
  PA.rect(ctx, x + 17, y + 17, 14, 2, ISO.topLight(c.stone));

  // 祭品碗（祭台上）
  PA.rect(ctx, x + 21, y + 15, 6, 3, c.stoneDark);
  PA.rect(ctx, x + 22, y + 14, 4, 2, c.stone);
  // 碗中暗紅液體
  PA.rect(ctx, x + 22, y + 15, 4, 1, '#662222');

  // === 左燭台（高大，從地面延伸） ===
  // 底座
  PA.rect(ctx, x + 5, y + 32, 5, 5, c.stoneDark);
  PA.rect(ctx, x + 5, y + 31, 5, 2, c.stone);
  // 柱身
  PA.rect(ctx, x + 6, y + 14, 3, 18, c.stoneDark);
  PA.rect(ctx, x + 6, y + 14, 1, 18, c.stone);
  // 燭盤
  PA.rect(ctx, x + 4, y + 12, 7, 2, c.stone);
  // 蠟燭
  PA.rect(ctx, x + 6, y + 7, 3, 6, c.candle);
  PA.rect(ctx, x + 6, y + 7, 1, 6, PA.lighten(c.candle, 30));
  // 火焰
  PA.pixel(ctx, x + 7, y + 5, '#ffee66');
  PA.pixel(ctx, x + 7, y + 4, '#ffcc44');
  PA.pixel(ctx, x + 7, y + 6, '#ff8822');
  PA.pixel(ctx, x + 6, y + 5, '#ff8822');
  PA.pixel(ctx, x + 8, y + 5, '#ff6600');

  // === 右燭台 ===
  PA.rect(ctx, x + 38, y + 32, 5, 5, c.stoneDark);
  PA.rect(ctx, x + 38, y + 31, 5, 2, c.stone);
  PA.rect(ctx, x + 39, y + 14, 3, 18, c.stoneDark);
  PA.rect(ctx, x + 39, y + 14, 1, 18, c.stone);
  PA.rect(ctx, x + 37, y + 12, 7, 2, c.stone);
  PA.rect(ctx, x + 39, y + 7, 3, 6, c.candle);
  PA.rect(ctx, x + 39, y + 7, 1, 6, PA.lighten(c.candle, 30));
  PA.pixel(ctx, x + 40, y + 5, '#ffee66');
  PA.pixel(ctx, x + 40, y + 4, '#ffcc44');
  PA.pixel(ctx, x + 40, y + 6, '#ff8822');
  PA.pixel(ctx, x + 39, y + 5, '#ff8822');
  PA.pixel(ctx, x + 41, y + 5, '#ff6600');

  // 符文脈動（祭壇面板上的發光符文）
  const pulseAlpha = 0.3 + 0.5 * Math.sin((time || 0) * 0.002);
  ctx.save();
  ctx.globalAlpha = pulseAlpha;
  // 大十字符文
  PA.rect(ctx, x + 22, y + 24, 4, 1, c.rune);
  PA.rect(ctx, x + 23, y + 23, 2, 3, c.rune);
  // 階梯上的符文點
  PA.pixel(ctx, x + 14, y + 30, c.rune);
  PA.pixel(ctx, x + 33, y + 30, c.rune);
  PA.pixel(ctx, x + 10, y + 37, c.rune);
  PA.pixel(ctx, x + 37, y + 37, c.rune);
  ctx.restore();

  // 邊緣暗化
  for (let i = 0; i < 48; i++) {
    PA.pixel(ctx, x + i, y + 47, '#0a0a0a');
    PA.pixel(ctx, x, y + i, '#0a0a12');
    PA.pixel(ctx, x + 47, y + i, '#0a0a12');
  }
};

/** 水晶簇 (3x3, 48x48px) — 散佈整個區域的多層水晶群，有地面岩石和光效 */
DK.Map.drawCrystalCluster = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['5'].colors;

  // 地面底色
  PA.rect(ctx, x, y, 48, 48, '#0a0a1a');

  // 地面岩石基底（佔滿底部）
  PA.rect(ctx, x + 2, y + 34, 44, 12, c.shadow);
  PA.rect(ctx, x + 4, y + 30, 40, 6, PA.darken(c.shadow, 10));
  PA.rect(ctx, x + 8, y + 28, 32, 4, c.shadow);
  // 岩石高光
  PA.rect(ctx, x + 5, y + 34, 38, 1, PA.lighten(c.shadow, 20));

  // 地面小水晶碎片（散佈整個區域）
  PA.rect(ctx, x + 2, y + 38, 2, 4, c.base);
  PA.pixel(ctx, x + 2, y + 38, c.mid);
  PA.rect(ctx, x + 42, y + 36, 2, 6, c.base);
  PA.pixel(ctx, x + 42, y + 36, c.mid);
  PA.pixel(ctx, x + 6, y + 42, c.base);
  PA.pixel(ctx, x + 38, y + 42, c.base);
  PA.rect(ctx, x + 44, y + 40, 2, 3, c.base);
  PA.pixel(ctx, x + 1, y + 44, c.mid);

  // 地面發光效果（水晶的反射光）
  ctx.save();
  ctx.globalAlpha = 0.15;
  PA.circle(ctx, x + 24, y + 36, 16, c.sparkle);
  ctx.restore();

  // === 主要水晶群（12 根，覆蓋大部分區域） ===
  const crystals = [
    // 外圈小水晶
    { dx: 3,  dy: 32, h: 10, w: 3 },
    { dx: 40, dy: 30, h: 12, w: 3 },
    { dx: 8,  dy: 28, h: 14, w: 3 },
    { dx: 36, dy: 26, h: 16, w: 3 },
    // 中圈中水晶
    { dx: 12, dy: 24, h: 20, w: 4 },
    { dx: 32, dy: 22, h: 22, w: 4 },
    { dx: 6,  dy: 20, h: 16, w: 3 },
    { dx: 38, dy: 18, h: 18, w: 3 },
    // 核心大水晶
    { dx: 18, dy: 16, h: 28, w: 5 },
    { dx: 24, dy: 14, h: 32, w: 6 },  // 最高
    { dx: 14, dy: 18, h: 24, w: 4 },
    { dx: 30, dy: 16, h: 26, w: 5 },
  ];

  for (const cr of crystals) {
    const bx = x + cr.dx;
    const by = y + cr.dy - cr.h + 8;
    const bodyH = Math.floor(cr.h * 0.55);
    const midH = Math.floor(cr.h * 0.3);
    const tipH = cr.h - bodyH - midH;

    // 水晶陰影（底部）
    ctx.save();
    ctx.globalAlpha = 0.3;
    PA.rect(ctx, bx - 1, y + cr.dy + 6, cr.w + 2, 2, '#000011');
    ctx.restore();

    // 水晶底部（最暗）
    PA.rect(ctx, bx, by + tipH + midH, cr.w, bodyH, c.base);
    // 水晶中段
    PA.rect(ctx, bx, by + tipH, cr.w, midH, c.mid);
    // 水晶頂部（最亮）
    PA.rect(ctx, bx + 1, by, Math.max(1, cr.w - 2), tipH, c.tip);
    // 尖端
    PA.pixel(ctx, bx + Math.floor(cr.w / 2), by, c.sparkle);

    // 左側高光
    if (cr.w >= 4) {
      PA.rect(ctx, bx, by + tipH, 1, midH + bodyH, c.mid);
    }
    // 右側陰影
    PA.rect(ctx, bx + cr.w - 1, by + tipH, 1, midH + bodyH, PA.darken(c.base, 20));
  }

  // 閃爍光點（多個，分散在各水晶上）
  if (time) {
    const phase = Math.floor(time / 300) % 12;
    const cr = crystals[phase];
    const sx = x + cr.dx + Math.floor(cr.w / 2);
    const sy = y + cr.dy - cr.h + 12;
    PA.pixel(ctx, sx, sy, '#ffffff');
    PA.pixel(ctx, sx + 1, sy, c.sparkle);

    // 第二個閃爍（偏移 6 相位）
    const phase2 = (phase + 6) % 12;
    const cr2 = crystals[phase2];
    PA.pixel(ctx, x + cr2.dx + 1, y + cr2.dy - cr2.h + 15, c.sparkle);
  }

  // 邊緣暗化
  for (let i = 0; i < 48; i++) {
    PA.pixel(ctx, x + i, y + 47, '#050510');
    PA.pixel(ctx, x, y + i, '#050510');
    PA.pixel(ctx, x + 47, y + i, '#050510');
    PA.pixel(ctx, x + i, y, '#050510');
  }
};

/** 符文陣 (3x3, 48x48px, destructible) — 完整魔法陣，覆蓋全區域 */
DK.Map.drawRuneCircle = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['6'].colors;
  const cx = x + 24;
  const cy = y + 24;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    PA.rect(ctx, x, y, 48, 48, '#ff4444');
    ctx.restore();
  }

  // 地面底色
  PA.rect(ctx, x, y, 48, 48, '#12101a');

  // 地面圖案底層（淡紫圓形光暈）
  ctx.save();
  ctx.globalAlpha = 0.12;
  PA.circle(ctx, cx, cy, 22, c.glow);
  ctx.restore();

  // === 外圈（大圓，半徑 20） ===
  PA.circle(ctx, cx, cy, 21, c.circle);
  // 擦除內部形成環形（用底色覆蓋）
  PA.circle(ctx, cx, cy, 19, '#12101a');

  // === 內圈（中圓，半徑 14） ===
  PA.circle(ctx, cx, cy, 15, c.circle);
  PA.circle(ctx, cx, cy, 13, '#12101a');

  // === 四角錨石（大型，有雕刻） ===
  const corners = [
    { dx: -20, dy: -20 }, { dx: 15, dy: -20 },
    { dx: -20, dy: 15 },  { dx: 15, dy: 15 },
  ];
  for (const cn of corners) {
    // 石塊底座
    PA.rect(ctx, cx + cn.dx, cy + cn.dy, 6, 6, c.stone);
    PA.rect(ctx, cx + cn.dx, cy + cn.dy, 6, 1, PA.lighten(c.stone, 30));
    PA.rect(ctx, cx + cn.dx + 5, cy + cn.dy, 1, 6, PA.darken(c.stone, 20));
    // 石塊上的符文
    PA.rect(ctx, cx + cn.dx + 2, cy + cn.dy + 2, 2, 2, c.symbol);
  }

  // === 連接線（錨石到外圈的直線） ===
  ctx.save();
  ctx.globalAlpha = 0.5;
  // 四條對角線
  PA.line(ctx, cx - 17, cy - 17, cx - 10, cy - 10, c.symbol);
  PA.line(ctx, cx + 17, cy - 17, cx + 10, cy - 10, c.symbol);
  PA.line(ctx, cx - 17, cy + 17, cx - 10, cy + 10, c.symbol);
  PA.line(ctx, cx + 17, cy + 17, cx + 10, cy + 10, c.symbol);
  ctx.restore();

  // === 核心符文圖案 ===
  // 大十字
  PA.rect(ctx, cx - 8, cy, 17, 1, c.symbol);
  PA.rect(ctx, cx, cy - 8, 1, 17, c.symbol);
  // X 形
  for (let i = 0; i < 7; i++) {
    PA.pixel(ctx, cx - 6 + i * 2, cy - 6 + i * 2, c.symbol);
    PA.pixel(ctx, cx + 6 - i * 2, cy - 6 + i * 2, c.symbol);
  }
  // 中心菱形
  PA.pixel(ctx, cx, cy - 3, c.glow);
  PA.pixel(ctx, cx - 1, cy - 2, c.glow);
  PA.pixel(ctx, cx + 1, cy - 2, c.glow);
  PA.pixel(ctx, cx - 2, cy - 1, c.glow);
  PA.pixel(ctx, cx + 2, cy - 1, c.glow);
  PA.pixel(ctx, cx - 3, cy, c.glow);
  PA.pixel(ctx, cx + 3, cy, c.glow);
  PA.pixel(ctx, cx - 2, cy + 1, c.glow);
  PA.pixel(ctx, cx + 2, cy + 1, c.glow);
  PA.pixel(ctx, cx - 1, cy + 2, c.glow);
  PA.pixel(ctx, cx + 1, cy + 2, c.glow);
  PA.pixel(ctx, cx, cy + 3, c.glow);

  // 中心核心（明亮）
  PA.rect(ctx, cx - 1, cy - 1, 3, 3, c.glow);
  PA.pixel(ctx, cx, cy, '#ffffff');

  // === 旋轉光效（8 個光點繞雙圈） ===
  const rotAngle = (time || 0) * 0.001;
  const glowAlpha = 0.4 + 0.4 * Math.sin((time || 0) * 0.003);
  ctx.save();
  ctx.globalAlpha = glowAlpha;
  // 外圈 4 光點
  for (let i = 0; i < 4; i++) {
    const a = rotAngle + (i * Math.PI / 2);
    const gx = Math.round(cx + Math.cos(a) * 18);
    const gy = Math.round(cy + Math.sin(a) * 18);
    PA.rect(ctx, gx - 1, gy - 1, 3, 3, c.glow);
  }
  // 內圈 4 光點（反方向）
  for (let i = 0; i < 4; i++) {
    const a = -rotAngle + (i * Math.PI / 2) + Math.PI / 4;
    const gx = Math.round(cx + Math.cos(a) * 12);
    const gy = Math.round(cy + Math.sin(a) * 12);
    PA.rect(ctx, gx, gy, 2, 2, c.glow);
  }
  ctx.restore();

  // HP bar
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = 44;
    const hpRatio = obj.hp / obj.maxHp;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }
};

// === 4x4 Objects (64x64px) ===

/** 龍骨遺骸 (4x4, 64x64px) — 完整龍骨架，頭骨+脊椎+肋骨+翼骨+尾骨+爪 */
DK.Map.drawDragonSkeleton = function(ctx, x, y, time) {
  const PA = DK.PixelArt;
  const c = DK.MAP_OBJECTS['7'].colors;
  const darkGround = PA.darken(c.ground, 12);

  // 地面底色（灰暗灰燼地面）
  PA.rect(ctx, x, y, 64, 64, c.ground);

  // 焦痕區域（大面積深色灼燒）
  const ashColor = PA.lighten(c.ground, 8);
  PA.rect(ctx, x + 5, y + 48, 22, 12, ashColor);
  PA.rect(ctx, x + 28, y + 44, 28, 14, ashColor);
  PA.rect(ctx, x + 10, y + 35, 15, 8, ashColor);
  PA.rect(ctx, x + 40, y + 30, 18, 10, ashColor);
  // 深色灼燒圈（龍倒下的痕跡）
  PA.rect(ctx, x + 14, y + 50, 18, 6, darkGround);
  PA.rect(ctx, x + 38, y + 52, 14, 8, darkGround);

  // === 頭骨（左上象限，大型，16x14） ===
  PA.rect(ctx, x + 3, y + 8, 16, 12, c.bone);
  PA.rect(ctx, x + 5, y + 6, 12, 3, c.bone);
  PA.rect(ctx, x + 7, y + 5, 8, 2, c.bone);
  PA.rect(ctx, x + 9, y + 4, 4, 2, c.bone);
  // 下顎
  PA.rect(ctx, x + 4, y + 18, 14, 4, c.boneShadow);
  PA.rect(ctx, x + 6, y + 20, 10, 3, c.boneShadow);
  // 上顎突出
  PA.rect(ctx, x + 18, y + 10, 5, 4, c.bone);
  PA.rect(ctx, x + 22, y + 11, 3, 3, c.bone);
  // 鼻孔
  PA.pixel(ctx, x + 20, y + 12, c.ground);
  PA.pixel(ctx, x + 22, y + 12, c.ground);
  // 眼窩（大，深色）
  PA.rect(ctx, x + 6, y + 9, 4, 4, c.ground);
  PA.rect(ctx, x + 13, y + 9, 4, 4, c.ground);
  // 頭骨高光/陰影
  PA.rect(ctx, x + 5, y + 6, 1, 8, PA.lighten(c.bone, 20));
  PA.rect(ctx, x + 17, y + 8, 1, 12, c.boneShadow);
  // 牙齒（下排）
  for (let t = 0; t < 5; t++) {
    PA.pixel(ctx, x + 7 + t * 2, y + 17, c.bone);
  }
  // 散落牙齒（地面）
  PA.pixel(ctx, x + 22, y + 20, c.bone);
  PA.pixel(ctx, x + 18, y + 23, c.bone);
  PA.pixel(ctx, x + 5, y + 24, c.bone);
  // 犄角
  PA.rect(ctx, x + 4, y + 3, 2, 5, c.bone);
  PA.rect(ctx, x + 3, y + 1, 2, 3, c.boneShadow);
  PA.pixel(ctx, x + 3, y, c.boneShadow);
  PA.rect(ctx, x + 16, y + 3, 2, 5, c.bone);
  PA.rect(ctx, x + 17, y + 1, 2, 3, c.boneShadow);
  PA.pixel(ctx, x + 18, y, c.boneShadow);

  // 眼窩綠光
  if (time && Math.floor(time / 2000) % 5 === 0) {
    const flicker = Math.sin(time * 0.008) > 0.3;
    if (flicker) {
      PA.rect(ctx, x + 7, y + 10, 2, 2, c.eye);
      PA.rect(ctx, x + 14, y + 10, 2, 2, c.eye);
      ctx.save();
      ctx.globalAlpha = 0.3;
      PA.rect(ctx, x + 5, y + 8, 6, 6, c.eye);
      PA.rect(ctx, x + 12, y + 8, 6, 6, c.eye);
      ctx.restore();
    }
  }

  // === 脊椎骨（S 形，從頭骨到右下） ===
  // 第一段（水平向右）
  PA.rect(ctx, x + 20, y + 14, 20, 3, c.bone);
  PA.rect(ctx, x + 20, y + 16, 20, 2, c.boneShadow);
  // 脊椎關節突起
  for (let s = 0; s < 4; s++) {
    PA.pixel(ctx, x + 22 + s * 5, y + 13, c.bone);
  }
  // 第二段（向右下彎）
  PA.rect(ctx, x + 38, y + 16, 3, 12, c.bone);
  PA.rect(ctx, x + 40, y + 16, 2, 12, c.boneShadow);
  // 第三段（水平向右）
  PA.rect(ctx, x + 40, y + 26, 16, 3, c.bone);
  PA.rect(ctx, x + 40, y + 28, 16, 2, c.boneShadow);

  // === 肋骨（從脊椎向上下延伸） ===
  // 上半段肋骨
  for (let i = 0; i < 4; i++) {
    const rx = x + 22 + i * 5;
    PA.rect(ctx, rx, y + 6 + i, 2, 8 - i, c.bone);
    PA.pixel(ctx, rx - 1, y + 6 + i, c.bone);
    PA.rect(ctx, rx, y + 18, 2, 6 + i, c.boneShadow);
    PA.pixel(ctx, rx + 2, y + 23 + i, c.boneShadow);
  }
  // 下半段肋骨（從垂直脊椎向左右）
  for (let i = 0; i < 3; i++) {
    const ry = y + 18 + i * 4;
    PA.rect(ctx, x + 30, ry, 9, 2, c.bone);
    PA.pixel(ctx, x + 29, ry, c.bone);
    PA.rect(ctx, x + 42, ry, 6, 2, c.boneShadow);
  }

  // === 翼骨（右上方展開，殘破） ===
  PA.line(ctx, x + 35, y + 12, x + 55, y + 4, c.bone);
  PA.line(ctx, x + 35, y + 13, x + 55, y + 5, c.boneShadow);
  PA.line(ctx, x + 48, y + 6, x + 58, y + 2, c.bone);
  PA.line(ctx, x + 50, y + 7, x + 60, y + 5, c.bone);
  PA.line(ctx, x + 52, y + 8, x + 62, y + 10, c.boneShadow);
  ctx.save();
  ctx.globalAlpha = 0.3;
  PA.rect(ctx, x + 50, y + 3, 8, 5, c.boneShadow);
  ctx.restore();

  // === 尾骨（從脊椎末端向右下彎曲至底部角落） ===
  PA.rect(ctx, x + 54, y + 28, 6, 2, c.bone);
  PA.rect(ctx, x + 56, y + 30, 5, 3, c.bone);
  PA.rect(ctx, x + 57, y + 33, 4, 3, c.boneShadow);
  PA.rect(ctx, x + 58, y + 36, 3, 4, c.boneShadow);
  PA.rect(ctx, x + 57, y + 40, 3, 4, c.bone);
  PA.rect(ctx, x + 55, y + 44, 3, 4, c.boneShadow);
  PA.rect(ctx, x + 53, y + 48, 3, 4, c.boneShadow);
  PA.rect(ctx, x + 52, y + 52, 2, 4, c.boneShadow);
  PA.rect(ctx, x + 53, y + 56, 2, 3, c.bone);
  // 尾錘（末端膨大）
  PA.rect(ctx, x + 51, y + 58, 5, 3, c.bone);
  PA.rect(ctx, x + 52, y + 57, 3, 1, c.bone);
  PA.pixel(ctx, x + 50, y + 59, c.boneShadow);
  PA.pixel(ctx, x + 56, y + 59, c.boneShadow);

  // === 前腿骨（頭骨下方，延伸到 y+52 帶 3 爪） ===
  // 股骨
  PA.rect(ctx, x + 10, y + 24, 3, 12, c.bone);
  PA.rect(ctx, x + 12, y + 24, 1, 12, c.boneShadow);
  // 膝關節
  PA.rect(ctx, x + 9, y + 35, 5, 3, c.bone);
  PA.pixel(ctx, x + 8, y + 36, c.boneShadow);
  // 脛骨
  PA.rect(ctx, x + 10, y + 38, 2, 12, c.bone);
  PA.rect(ctx, x + 12, y + 38, 1, 12, c.boneShadow);
  // 腳掌
  PA.rect(ctx, x + 7, y + 49, 9, 3, c.bone);
  PA.rect(ctx, x + 7, y + 51, 9, 1, c.boneShadow);
  // 三根腳趾爪
  PA.rect(ctx, x + 4, y + 52, 3, 5, c.bone);
  PA.pixel(ctx, x + 4, y + 57, c.boneShadow);
  PA.pixel(ctx, x + 5, y + 58, c.boneShadow);
  PA.rect(ctx, x + 10, y + 52, 2, 6, c.bone);
  PA.pixel(ctx, x + 10, y + 58, c.boneShadow);
  PA.pixel(ctx, x + 11, y + 59, c.boneShadow);
  PA.rect(ctx, x + 14, y + 52, 3, 5, c.bone);
  PA.pixel(ctx, x + 15, y + 57, c.boneShadow);
  PA.pixel(ctx, x + 16, y + 58, c.boneShadow);

  // === 後腿骨（脊椎下方，延伸到 y+56 帶 3 爪） ===
  // 股骨
  PA.rect(ctx, x + 32, y + 30, 3, 10, c.bone);
  PA.rect(ctx, x + 34, y + 30, 1, 10, c.boneShadow);
  // 膝關節
  PA.rect(ctx, x + 31, y + 39, 5, 3, c.bone);
  PA.pixel(ctx, x + 30, y + 40, c.boneShadow);
  // 脛骨
  PA.rect(ctx, x + 32, y + 42, 2, 10, c.bone);
  PA.rect(ctx, x + 34, y + 42, 1, 10, c.boneShadow);
  // 腳掌
  PA.rect(ctx, x + 29, y + 51, 9, 3, c.bone);
  PA.rect(ctx, x + 29, y + 53, 9, 1, c.boneShadow);
  // 三根腳趾爪
  PA.rect(ctx, x + 27, y + 54, 3, 5, c.bone);
  PA.pixel(ctx, x + 27, y + 59, c.boneShadow);
  PA.pixel(ctx, x + 28, y + 60, c.boneShadow);
  PA.rect(ctx, x + 32, y + 54, 2, 6, c.bone);
  PA.pixel(ctx, x + 32, y + 60, c.boneShadow);
  PA.pixel(ctx, x + 33, y + 61, c.boneShadow);
  PA.rect(ctx, x + 37, y + 54, 3, 5, c.bone);
  PA.pixel(ctx, x + 38, y + 59, c.boneShadow);
  PA.pixel(ctx, x + 39, y + 60, c.boneShadow);

  // === 地面散落骨頭碎片（大塊，有存在感） ===
  // 斷裂肋骨（左下）
  PA.rect(ctx, x + 2, y + 46, 5, 2, c.bone);
  PA.pixel(ctx, x + 7, y + 47, c.boneShadow);
  // 碎骨片（中下）
  PA.rect(ctx, x + 20, y + 55, 4, 2, c.boneShadow);
  PA.rect(ctx, x + 22, y + 58, 3, 2, c.bone);
  // 散落爪牙（右下）
  PA.rect(ctx, x + 44, y + 56, 2, 4, c.bone);
  PA.pixel(ctx, x + 44, y + 60, c.boneShadow);
  PA.rect(ctx, x + 48, y + 58, 1, 3, c.boneShadow);
  // 脊椎碎片（左下）
  PA.rect(ctx, x + 2, y + 55, 3, 3, c.bone);
  PA.pixel(ctx, x + 5, y + 56, c.boneShadow);
  // 角碎片（中間底部）
  PA.rect(ctx, x + 18, y + 60, 2, 2, c.bone);
  PA.pixel(ctx, x + 20, y + 61, c.boneShadow);

  // 地面裂紋（更明顯）
  ctx.save();
  ctx.globalAlpha = 0.5;
  PA.line(ctx, x + 2, y + 50, x + 12, y + 56, '#222233');
  PA.line(ctx, x + 12, y + 56, x + 18, y + 54, '#222233');
  PA.line(ctx, x + 42, y + 48, x + 50, y + 54, '#222233');
  PA.line(ctx, x + 50, y + 54, x + 58, y + 52, '#222233');
  PA.line(ctx, x + 22, y + 48, x + 26, y + 54, '#1a1a28');
  ctx.restore();

  // 邊緣暗化
  for (let i = 0; i < 64; i++) {
    PA.pixel(ctx, x + i, y + 63, '#050508');
    PA.pixel(ctx, x + i, y, '#050508');
    PA.pixel(ctx, x, y + i, '#050508');
    PA.pixel(ctx, x + 63, y + i, '#050508');
  }
};

/** 封印之門 (4x4, 64x64px, destructible) — 巨大石拱門，雙扇鐵門，鏈條封印 */
DK.Map.drawSealedGate = function(ctx, x, y, time, obj) {
  const PA = DK.PixelArt;
  const ISO = PA.Isometric;
  const c = DK.MAP_OBJECTS['8'].colors;
  const hpRatio = (obj && obj.maxHp) ? obj.hp / obj.maxHp : 1;

  // 受傷閃白
  if (obj && obj.flashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    PA.rect(ctx, x, y, 64, 64, '#ffffff');
    ctx.restore();
  }

  // 背景牆面
  PA.rect(ctx, x, y, 64, 64, '#1a1a22');

  // === 石拱門框架（填滿外圍） ===
  // 左柱
  PA.rect(ctx, x, y + 8, 14, 56, c.door);
  PA.rect(ctx, x, y + 8, 3, 56, ISO.sideDark(c.door));
  PA.rect(ctx, x + 12, y + 8, 2, 56, c.crack);
  PA.rect(ctx, x + 3, y + 8, 9, 56, c.doorLight);
  // 左柱凹槽裝飾
  PA.rect(ctx, x + 4, y + 14, 3, 40, ISO.sideDark(c.door));
  PA.rect(ctx, x + 9, y + 14, 2, 40, ISO.sideDark(c.door));

  // 右柱
  PA.rect(ctx, x + 50, y + 8, 14, 56, c.door);
  PA.rect(ctx, x + 50, y + 8, 2, 56, c.crack);
  PA.rect(ctx, x + 62, y + 8, 2, 56, ISO.sideDark(c.door));
  PA.rect(ctx, x + 52, y + 8, 9, 56, c.doorLight);
  PA.rect(ctx, x + 53, y + 14, 3, 40, ISO.sideDark(c.door));
  PA.rect(ctx, x + 58, y + 14, 2, 40, ISO.sideDark(c.door));

  // 拱頂
  PA.rect(ctx, x, y, 64, 12, c.door);
  PA.rect(ctx, x, y, 64, 3, ISO.sideDark(c.door));
  PA.rect(ctx, x, y + 3, 64, 6, c.doorLight);
  PA.rect(ctx, x, y + 9, 64, 3, ISO.sideDark(c.door));
  // 拱頂中央裝飾石
  PA.rect(ctx, x + 26, y + 2, 12, 8, c.door);
  PA.rect(ctx, x + 27, y + 3, 10, 6, c.doorLight);
  PA.rect(ctx, x + 30, y + 4, 4, 4, c.chain);

  // 底部台階
  PA.rect(ctx, x + 2, y + 58, 60, 6, ISO.sideDark(c.door));
  PA.rect(ctx, x + 2, y + 56, 60, 3, c.door);
  PA.rect(ctx, x + 2, y + 56, 60, 1, ISO.topLight(c.door));

  // === 雙扇鐵門 ===
  // 左門扇
  PA.rect(ctx, x + 14, y + 12, 18, 44, c.door);
  PA.rect(ctx, x + 15, y + 13, 16, 42, ISO.sideDark(c.door));
  // 門板凸紋
  PA.rect(ctx, x + 16, y + 15, 14, 3, c.doorLight);
  PA.rect(ctx, x + 16, y + 25, 14, 3, c.doorLight);
  PA.rect(ctx, x + 16, y + 35, 14, 3, c.doorLight);
  PA.rect(ctx, x + 16, y + 45, 14, 3, c.doorLight);
  // 鉚釘
  PA.pixel(ctx, x + 17, y + 20, c.chain);
  PA.pixel(ctx, x + 28, y + 20, c.chain);
  PA.pixel(ctx, x + 17, y + 30, c.chain);
  PA.pixel(ctx, x + 28, y + 30, c.chain);
  PA.pixel(ctx, x + 17, y + 40, c.chain);
  PA.pixel(ctx, x + 28, y + 40, c.chain);

  // 右門扇
  PA.rect(ctx, x + 32, y + 12, 18, 44, c.door);
  PA.rect(ctx, x + 33, y + 13, 16, 42, ISO.sideDark(c.door));
  PA.rect(ctx, x + 34, y + 15, 14, 3, c.doorLight);
  PA.rect(ctx, x + 34, y + 25, 14, 3, c.doorLight);
  PA.rect(ctx, x + 34, y + 35, 14, 3, c.doorLight);
  PA.rect(ctx, x + 34, y + 45, 14, 3, c.doorLight);
  PA.pixel(ctx, x + 35, y + 20, c.chain);
  PA.pixel(ctx, x + 46, y + 20, c.chain);
  PA.pixel(ctx, x + 35, y + 30, c.chain);
  PA.pixel(ctx, x + 46, y + 30, c.chain);
  PA.pixel(ctx, x + 35, y + 40, c.chain);
  PA.pixel(ctx, x + 46, y + 40, c.chain);

  // 門縫（中央）
  PA.rect(ctx, x + 31, y + 12, 2, 44, '#0a0a0a');

  // === 鏈條封印（4 條，交叉覆蓋門面） ===
  if (hpRatio > 0.5) {
    // 水平鏈條
    for (let i = 0; i < 30; i += 3) {
      PA.rect(ctx, x + 14 + i, y + 22, 2, 2, c.chain);
      PA.pixel(ctx, x + 15 + i, y + 23, c.doorLight);
    }
    for (let i = 0; i < 30; i += 3) {
      PA.rect(ctx, x + 14 + i, y + 38, 2, 2, c.chain);
      PA.pixel(ctx, x + 15 + i, y + 39, c.doorLight);
    }
    // 交叉鏈條
    for (let i = 0; i < 15; i++) {
      PA.pixel(ctx, x + 16 + i * 2, y + 14 + i * 2, c.chain);
      PA.pixel(ctx, x + 46 - i * 2, y + 14 + i * 2, c.chain);
    }
  } else if (hpRatio > 0.25) {
    // 半斷鏈條（只剩一條水平）
    for (let i = 0; i < 30; i += 3) {
      PA.rect(ctx, x + 14 + i, y + 30, 2, 2, c.chain);
    }
    // 斷鏈殘片
    PA.rect(ctx, x + 14, y + 22, 4, 2, c.chain);
    PA.rect(ctx, x + 42, y + 22, 4, 2, c.chain);
    PA.rect(ctx, x + 14, y + 38, 4, 2, c.chain);
    PA.rect(ctx, x + 42, y + 38, 4, 2, c.chain);
  }

  // === 中央封印符文 ===
  if (hpRatio > 0.25) {
    const sealAlpha = 0.5 + 0.4 * Math.sin((time || 0) * 0.002);
    ctx.save();
    ctx.globalAlpha = sealAlpha;
    // 大型六芒星封印
    const scx = x + 32;
    const scy = y + 32;
    // 菱形核心
    for (let i = 0; i < 6; i++) {
      PA.pixel(ctx, scx - i, scy - 6 + i, c.seal);
      PA.pixel(ctx, scx + i, scy - 6 + i, c.seal);
      PA.pixel(ctx, scx - i, scy + 6 - i, c.seal);
      PA.pixel(ctx, scx + i, scy + 6 - i, c.seal);
    }
    // 水平線
    PA.rect(ctx, scx - 6, scy, 13, 1, c.seal);
    // 中心發光
    PA.rect(ctx, scx - 2, scy - 2, 5, 5, c.seal);
    PA.rect(ctx, scx - 1, scy - 1, 3, 3, c.glow);
    PA.pixel(ctx, scx, scy, '#ffffff');
    ctx.restore();
  }

  // === 裂縫（HP < 50%） ===
  if (hpRatio < 0.5) {
    const crackW = hpRatio < 0.25 ? 3 : 1;
    // 主裂縫（沿門縫擴展）
    PA.rect(ctx, x + 30, y + 12, crackW, 44, c.crack);
    // 分支裂縫
    PA.line(ctx, x + 30, y + 20, x + 22, y + 16, c.crack);
    PA.line(ctx, x + 33, y + 25, x + 40, y + 20, c.crack);
    PA.line(ctx, x + 30, y + 40, x + 24, y + 48, c.crack);
    PA.line(ctx, x + 33, y + 35, x + 42, y + 45, c.crack);

    // 裂縫發光
    const glowAlpha = (1 - hpRatio) * 0.5;
    ctx.save();
    ctx.globalAlpha = glowAlpha;
    PA.rect(ctx, x + 28, y + 14, crackW + 4, 40, c.glow);
    ctx.restore();
  }

  // HP bar
  if (obj && obj.hp !== null && obj.hp < obj.maxHp) {
    const barW = 60;
    PA.rect(ctx, x + 2, y - 2, barW, 2, '#333333');
    PA.rect(ctx, x + 2, y - 2, Math.round(barW * hpRatio), 2, hpRatio > 0.5 ? '#44cc44' : '#cc4444');
  }

  // 邊緣暗化
  for (let i = 0; i < 64; i++) {
    PA.pixel(ctx, x + i, y + 63, '#050508');
    PA.pixel(ctx, x + i, y, '#050508');
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
