/**
 * Dungeon Keep - 地城之心地磚渲染
 * 包含：2x2 地城之心等距視覺
 */

DK.Map.drawDungeonHeart2x2 = function(ctx, x, y, variant = 0) {
    const PA = DK.PixelArt;
    const ISO = PA.Isometric;

    // 底色：深紫色地板
    PA.rect(ctx, x, y, 32, 32, '#1a0a2a');

    // 中心點（16, 16）
    const cx = x + 16;
    const cy = y + 16;

    // === 1. 地面陰影（橢圓，淡紫色） ===
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#aa44ff';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 14, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // === 2. 等距石座（3 層） ===
    const stoneBase = '#3a2a4a';

    // 底層（最暗）
    PA.rect(ctx, cx - 6, cy + 8, 12, 5, ISO.sideDark(stoneBase));

    // 中層
    PA.rect(ctx, cx - 5, cy + 4, 10, 4, stoneBase);

    // 頂層（最亮）
    PA.rect(ctx, cx - 4, cy + 1, 8, 3, ISO.topLight(stoneBase));

    // 右側陰影（增強 3D 效果）
    PA.rect(ctx, cx + 5, cy + 4, 1, 9, ISO.ambientOcclusion(stoneBase));

    // === 3. 懸浮水晶（4 層，紫色） ===
    const crystalColor = '#aa44ff';

    // 底層（最暗，最大）
    PA.rect(ctx, cx - 3, cy - 2, 6, 6, ISO.ambientOcclusion(crystalColor));

    // 中下層
    PA.rect(ctx, cx - 2, cy - 4, 4, 9, ISO.sideDark(crystalColor));

    // 中上層（亮紫）
    PA.rect(ctx, cx - 1, cy - 6, 2, 6, crystalColor);

    // 頂層（最亮）
    PA.pixel(ctx, cx, cy - 7, ISO.topLight(crystalColor));
    PA.pixel(ctx, cx - 1, cy - 7, ISO.topLight(crystalColor));

    // === 4. 核心發光點（白色中心） ===
    PA.pixel(ctx, cx, cy - 4, '#ffffff');

    // === 5. 能量粒子（8 個紫色光點） ===
    const rng = PA.seededRandom(variant * 199 + 67);
    for (let i = 0; i < 8; i++) {
      const px = 8 + Math.floor(rng() * 16);
      const py = 8 + Math.floor(rng() * 16);
      const brightness = rng() > 0.5 ? '#cc88ff' : '#aa66dd';
      PA.pixel(ctx, x + px, y + py, brightness);
    }

    // === 6. 邊緣暗化 ===
    for (let i = 0; i < 32; i++) {
      PA.pixel(ctx, x + i, y, '#0a0a0a');
      PA.pixel(ctx, x + i, y + 31, '#0a0a0a');
      PA.pixel(ctx, x, y + i, '#0a0a0a');
      PA.pixel(ctx, x + 31, y + i, '#0a0a0a');
    }
  };

