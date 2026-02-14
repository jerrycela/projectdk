/**
 * Dungeon Keep - 裝飾物地磚渲染
 * 包含：寶箱、柱子、骷髏、符文、火盆、水晶、門
 */

DK.Map.drawChestTile = function(ctx, x, y, variant = 0) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);

    const v = variant % 3;

    if (v === 0) {
      // Variant 0: 關閉狀態（原版）
      PA.rect(ctx, x + 4, y + 9, 8, 4, '#4a3020');
      PA.rect(ctx, x + 5, y + 10, 6, 2, '#5a4030');
      PA.rect(ctx, x + 4, y + 7, 8, 2, '#6a5040');
      PA.rect(ctx, x + 5, y + 6, 6, 1, '#7a6050');
      PA.pixel(ctx, x + 7, y + 9, '#ffd700');
      PA.pixel(ctx, x + 8, y + 9, '#ffd700');
      PA.pixel(ctx, x + 7, y + 10, '#ffaa00');
      PA.pixel(ctx, x + 8, y + 10, '#ffaa00');
    } else if (v === 1) {
      // Variant 1: 半開狀態，有金幣光芒
      PA.rect(ctx, x + 4, y + 9, 8, 4, '#4a3020');
      PA.rect(ctx, x + 5, y + 10, 6, 2, '#5a4030');
      PA.rect(ctx, x + 4, y + 6, 8, 3, '#6a5040'); // 蓋子打開
      PA.rect(ctx, x + 5, y + 5, 6, 1, '#7a6050');
      // 金幣堆
      PA.pixel(ctx, x + 6, y + 9, '#ffd700');
      PA.pixel(ctx, x + 7, y + 9, '#ffd700');
      PA.pixel(ctx, x + 8, y + 9, '#ffd700');
      PA.pixel(ctx, x + 9, y + 9, '#ffd700');
      PA.pixel(ctx, x + 7, y + 10, '#ffaa00');
      PA.pixel(ctx, x + 8, y + 10, '#ffaa00');
      // 光芒
      PA.pixel(ctx, x + 7, y + 8, '#ffee88');
      PA.pixel(ctx, x + 8, y + 8, '#ffee88');
    } else {
      // Variant 2: 完全打開，金幣溢出
      PA.rect(ctx, x + 4, y + 9, 8, 4, '#4a3020');
      PA.rect(ctx, x + 5, y + 10, 6, 2, '#5a4030');
      PA.rect(ctx, x + 3, y + 5, 4, 2, '#6a5040'); // 蓋子完全打開
      PA.rect(ctx, x + 4, y + 4, 2, 1, '#7a6050');
      // 溢出的金幣
      PA.pixel(ctx, x + 3, y + 11, '#ffd700');
      PA.pixel(ctx, x + 6, y + 9, '#ffd700');
      PA.pixel(ctx, x + 7, y + 9, '#ffd700');
      PA.pixel(ctx, x + 8, y + 9, '#ffd700');
      PA.pixel(ctx, x + 9, y + 9, '#ffd700');
      PA.pixel(ctx, x + 12, y + 11, '#ffd700');
      PA.pixel(ctx, x + 7, y + 10, '#ffaa00');
      PA.pixel(ctx, x + 8, y + 10, '#ffaa00');
      // 強烈光芒
      PA.pixel(ctx, x + 7, y + 8, '#ffee88');
      PA.pixel(ctx, x + 8, y + 8, '#ffee88');
      PA.pixel(ctx, x + 7, y + 7, '#ffdd77');
      PA.pixel(ctx, x + 8, y + 7, '#ffdd77');
    }
  };

DK.Map.drawPillarTile = function(ctx, x, y, variant = 0) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);

    const v = variant % 3;

    if (v === 0) {
      // Variant 0: 完整石柱（原版）
      PA.rect(ctx, x + 5, y + 2, 6, 12, '#5a5a6e');
      PA.rect(ctx, x + 6, y + 3, 4, 10, '#6a6a7e');
      PA.rect(ctx, x + 4, y + 1, 8, 2, '#7a7a8e');
      PA.rect(ctx, x + 5, y + 2, 6, 1, '#8a8a9e');
      PA.rect(ctx, x + 4, y + 13, 8, 2, '#4a4a5e');
      PA.pixel(ctx, x + 6, y + 5, '#9a9aae');
      PA.pixel(ctx, x + 6, y + 7, '#9a9aae');
    } else if (v === 1) {
      // Variant 1: 有裂紋
      PA.rect(ctx, x + 5, y + 2, 6, 12, '#5a5a6e');
      PA.rect(ctx, x + 6, y + 3, 4, 10, '#6a6a7e');
      PA.rect(ctx, x + 4, y + 1, 8, 2, '#7a7a8e');
      PA.rect(ctx, x + 5, y + 2, 6, 1, '#8a8a9e');
      PA.rect(ctx, x + 4, y + 13, 8, 2, '#4a4a5e');
      // 裂紋
      PA.pixel(ctx, x + 6, y + 4, '#3a3a4e');
      PA.pixel(ctx, x + 7, y + 5, '#3a3a4e');
      PA.pixel(ctx, x + 7, y + 6, '#3a3a4e');
      PA.pixel(ctx, x + 8, y + 7, '#3a3a4e');
      PA.pixel(ctx, x + 8, y + 8, '#3a3a4e');
      PA.pixel(ctx, x + 7, y + 9, '#3a3a4e');
      PA.pixel(ctx, x + 6, y + 10, '#3a3a4e');
    } else {
      // Variant 2: 嚴重破損
      PA.rect(ctx, x + 5, y + 3, 6, 11, '#5a5a6e');
      PA.rect(ctx, x + 6, y + 4, 4, 9, '#6a6a7e');
      PA.rect(ctx, x + 4, y + 1, 8, 2, '#7a7a8e'); // 頂部傾斜
      PA.rect(ctx, x + 4, y + 13, 8, 2, '#4a4a5e');
      // 嚴重裂紋和缺口
      PA.pixel(ctx, x + 5, y + 6, '#3a3a4e');
      PA.pixel(ctx, x + 6, y + 7, '#3a3a4e');
      PA.pixel(ctx, x + 7, y + 8, '#3a3a4e');
      PA.pixel(ctx, x + 8, y + 9, '#3a3a4e');
      PA.pixel(ctx, x + 9, y + 10, '#3a3a4e');
      // 缺口
      PA.rect(ctx, x + 9, y + 5, 2, 3, '#5e5648'); // 顯示地板色（缺口）
      PA.pixel(ctx, x + 10, y + 6, '#5e5648');
    }
  };

DK.Map.drawSkullTile = function(ctx, x, y, variant = 0) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);

    const v = variant % 3;

    if (v === 0) {
      // Variant 0: 正面骷髏頭（原版）
      PA.rect(ctx, x + 6, y + 7, 4, 4, '#d0c8b0');
      PA.rect(ctx, x + 5, y + 8, 6, 2, '#e0d8c0');
      PA.pixel(ctx, x + 6, y + 8, '#1a1a1a');
      PA.pixel(ctx, x + 9, y + 8, '#1a1a1a');
      PA.pixel(ctx, x + 7, y + 9, '#2a2a2a');
      PA.pixel(ctx, x + 8, y + 9, '#2a2a2a');
      PA.rect(ctx, x + 4, y + 11, 3, 1, '#c0b8a0');
      PA.rect(ctx, x + 9, y + 11, 3, 1, '#c0b8a0');
    } else if (v === 1) {
      // Variant 1: 側面骷髏頭
      PA.rect(ctx, x + 5, y + 7, 5, 4, '#d0c8b0');
      PA.rect(ctx, x + 6, y + 8, 4, 2, '#e0d8c0');
      PA.pixel(ctx, x + 7, y + 8, '#1a1a1a'); // 單邊眼睛
      PA.pixel(ctx, x + 6, y + 9, '#2a2a2a'); // 鼻孔
      PA.rect(ctx, x + 3, y + 11, 4, 1, '#c0b8a0'); // 下顎骨
      PA.pixel(ctx, x + 9, y + 10, '#c0b8a0'); // 突出的顴骨
    } else {
      // Variant 2: 散落的骨頭
      // 骷髏頭碎片
      PA.rect(ctx, x + 4, y + 6, 3, 3, '#d0c8b0');
      PA.pixel(ctx, x + 5, y + 7, '#1a1a1a'); // 眼睛
      // 分散的骨頭
      PA.rect(ctx, x + 9, y + 8, 4, 1, '#c0b8a0'); // 長骨
      PA.rect(ctx, x + 10, y + 9, 2, 1, '#c0b8a0');
      PA.rect(ctx, x + 6, y + 11, 3, 1, '#c0b8a0'); // 肋骨
      PA.rect(ctx, x + 4, y + 12, 2, 1, '#c0b8a0');
      PA.rect(ctx, x + 10, y + 12, 2, 1, '#c0b8a0');
    }
  };

DK.Map.drawRuneTile = function(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.pixel(ctx, x + 8, y + 5, '#44aaff');
    PA.pixel(ctx, x + 7, y + 6, '#44aaff');
    PA.pixel(ctx, x + 8, y + 6, '#66ccff');
    PA.pixel(ctx, x + 9, y + 6, '#44aaff');
    PA.pixel(ctx, x + 6, y + 7, '#44aaff');
    PA.pixel(ctx, x + 8, y + 7, '#66ccff');
    PA.pixel(ctx, x + 10, y + 7, '#44aaff');
    PA.pixel(ctx, x + 7, y + 8, '#44aaff');
    PA.pixel(ctx, x + 8, y + 8, '#88eeff');
    PA.pixel(ctx, x + 9, y + 8, '#44aaff');
    PA.pixel(ctx, x + 8, y + 9, '#44aaff');
    PA.pixel(ctx, x + 6, y + 10, '#2288cc');
    PA.pixel(ctx, x + 10, y + 10, '#2288cc');
  };

DK.Map.drawFirePitTile = function(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 5, y + 10, 6, 3, '#3a3a3a');
    PA.rect(ctx, x + 6, y + 11, 4, 1, '#2a2a2a');
    PA.pixel(ctx, x + 6, y + 8, '#ff8800');
    PA.pixel(ctx, x + 7, y + 7, '#ffaa00');
    PA.pixel(ctx, x + 8, y + 6, '#ffcc44');
    PA.pixel(ctx, x + 9, y + 7, '#ffaa00');
    PA.pixel(ctx, x + 10, y + 8, '#ff8800');
    PA.pixel(ctx, x + 7, y + 9, '#ff9922');
    PA.pixel(ctx, x + 8, y + 9, '#ffbb33');
    PA.pixel(ctx, x + 9, y + 9, '#ff9922');
  };

DK.Map.drawCrystalTile = function(ctx, x, y) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);
    PA.rect(ctx, x + 7, y + 6, 2, 6, '#aa44ff');
    PA.pixel(ctx, x + 8, y + 5, '#cc66ff');
    PA.pixel(ctx, x + 6, y + 7, '#8833cc');
    PA.pixel(ctx, x + 9, y + 7, '#8833cc');
    PA.pixel(ctx, x + 7, y + 8, '#cc88ff');
    PA.pixel(ctx, x + 8, y + 8, '#ee99ff');
    PA.pixel(ctx, x + 8, y + 6, '#ffaaff');
    PA.pixel(ctx, x + 7, y + 9, '#bb66ee');
    PA.rect(ctx, x + 6, y + 12, 4, 1, '#5a5a6e');
  };

DK.Map.drawDoorTile = function(ctx, x, y, doorType = 'wooden', isLocked = true) {
    const PA = DK.PixelArt;
    this.drawFloorTile(ctx, x, y, 0);

    if (doorType === 'wooden') {
      this.drawWoodenDoor(ctx, x, y, isLocked);
    } else if (doorType === 'iron') {
      this.drawIronDoor(ctx, x, y, isLocked);
    } else if (doorType === 'magic') {
      this.drawMagicDoor(ctx, x, y, isLocked);
    }
  };

DK.Map.drawWoodenDoor = function(ctx, x, y, isLocked) {
    const PA = DK.PixelArt;
    const ISO = PA.Isometric;

    // === 1. 等距門框（深灰石材）===
    const frameBase = '#4a4a5e';
    const frameTop = ISO.topLight(frameBase);
    const frameSide = ISO.sideDark(frameBase);

    // 頂部門框（2px 高，顯示頂面 + 正面）
    PA.rect(ctx, x + 3, y + 2, 10, 1, frameTop);    // 頂面
    PA.rect(ctx, x + 3, y + 3, 10, 1, frameBase);   // 正面

    // 左側門框（2px 寬）
    PA.rect(ctx, x + 3, y + 3, 1, 11, frameSide);
    PA.rect(ctx, x + 4, y + 3, 1, 11, frameBase);

    // 右側門框（2px 寬）
    PA.rect(ctx, x + 11, y + 3, 1, 11, frameBase);
    PA.rect(ctx, x + 12, y + 3, 1, 11, PA.lighten(frameBase, 10));

    // 底部門框
    PA.rect(ctx, x + 3, y + 13, 10, 1, PA.darken(frameBase, 20));

    // === 2. 門板底色 ===
    const woodBase = '#6a5040';
    PA.rect(ctx, x + 5, y + 3, 6, 10, woodBase);

    // === 3. 等距斜面（左上亮，右下暗）===
    const woodLight = ISO.topLight(woodBase);
    const woodDark = ISO.sideDark(woodBase);

    PA.rect(ctx, x + 5, y + 3, 1, 10, woodLight);  // 左邊緣高光
    PA.rect(ctx, x + 5, y + 3, 6, 1, woodLight);   // 頂邊高光
    PA.rect(ctx, x + 10, y + 4, 1, 9, woodDark);   // 右邊緣陰影
    PA.rect(ctx, x + 6, y + 12, 5, 1, woodDark);   // 底邊陰影

    // === 4. 木紋橫條（凹陷效果）===
    const woodGrain = ISO.ambientOcclusion(woodBase);
    PA.rect(ctx, x + 5, y + 5, 6, 1, woodGrain);
    PA.rect(ctx, x + 5, y + 8, 6, 1, woodGrain);
    PA.rect(ctx, x + 5, y + 11, 6, 1, woodGrain);

    // === 5. 鐵鉸鏈（4個像素）===
    PA.pixel(ctx, x + 5, y + 4, '#3a3a4e');
    PA.pixel(ctx, x + 5, y + 5, '#3a3a4e');
    PA.pixel(ctx, x + 5, y + 11, '#3a3a4e');
    PA.pixel(ctx, x + 5, y + 12, '#3a3a4e');

    // === 6. 門把（金色）===
    PA.pixel(ctx, x + 9, y + 8, '#ffd700');
    PA.pixel(ctx, x + 9, y + 9, '#ffaa00');

    // === 7. 鎖定狀態：鎖頭圖示 ===
    if (isLocked) {
      PA.rect(ctx, x + 7, y + 7, 2, 2, '#ffd700'); // 鎖體
      PA.pixel(ctx, x + 7, y + 6, '#ffd700'); // 鎖環
      PA.pixel(ctx, x + 8, y + 6, '#ffd700');
    }
  };

DK.Map.drawIronDoor = function(ctx, x, y, isLocked) {
    const PA = DK.PixelArt;

    // 門框（黑色）
    PA.rect(ctx, x + 3, y + 2, 10, 12, '#2a2a3e');

    // 鐵板（灰色金屬）
    PA.rect(ctx, x + 5, y + 3, 6, 10, '#5a5a6e');
    PA.rect(ctx, x + 6, y + 4, 4, 8, '#6a6a7e');

    // 邊緣陰影（厚重感）
    PA.rect(ctx, x + 5, y + 3, 1, 10, '#4a4a5e');
    PA.rect(ctx, x + 5, y + 3, 6, 1, '#4a4a5e');

    // 鉚釘裝飾（8個點）
    PA.pixel(ctx, x + 6, y + 5, '#7a7a8e');
    PA.pixel(ctx, x + 9, y + 5, '#7a7a8e');
    PA.pixel(ctx, x + 6, y + 8, '#7a7a8e');
    PA.pixel(ctx, x + 9, y + 8, '#7a7a8e');
    PA.pixel(ctx, x + 6, y + 11, '#7a7a8e');
    PA.pixel(ctx, x + 9, y + 11, '#7a7a8e');

    // 門把（鐵環）
    PA.pixel(ctx, x + 9, y + 8, '#9a9aae');
    PA.pixel(ctx, x + 10, y + 8, '#9a9aae');

    // 鎖定狀態：鐵鏈纏繞
    if (isLocked) {
      // 對角線鐵鏈
      PA.pixel(ctx, x + 6, y + 5, '#8a8a9e');
      PA.pixel(ctx, x + 7, y + 6, '#8a8a9e');
      PA.pixel(ctx, x + 7, y + 8, '#8a8a9e');
      PA.pixel(ctx, x + 8, y + 9, '#8a8a9e');
      PA.pixel(ctx, x + 9, y + 10, '#8a8a9e');
    }
  };

DK.Map.drawMagicDoor = function(ctx, x, y, isLocked) {
    const PA = DK.PixelArt;

    // 門框（深紫色）
    PA.rect(ctx, x + 3, y + 2, 10, 12, '#4a2a5e');

    // 能量紋理（紫色漸層）
    PA.rect(ctx, x + 5, y + 3, 6, 10, '#7a2acc');
    PA.rect(ctx, x + 6, y + 4, 4, 8, '#aa44ff');

    // 符文圖案（中心 8×8px）
    PA.pixel(ctx, x + 7, y + 6, '#ddbbff'); // 上
    PA.pixel(ctx, x + 8, y + 6, '#ddbbff');
    PA.pixel(ctx, x + 6, y + 8, '#ddbbff'); // 左
    PA.pixel(ctx, x + 9, y + 8, '#ddbbff'); // 右
    PA.pixel(ctx, x + 7, y + 10, '#ddbbff'); // 下
    PA.pixel(ctx, x + 8, y + 10, '#ddbbff');
    PA.pixel(ctx, x + 7, y + 8, '#ffffff'); // 中心
    PA.pixel(ctx, x + 8, y + 8, '#ffffff');

    // 能量粒子（4個閃爍點）
    PA.pixel(ctx, x + 5, y + 5, '#ccaaee');
    PA.pixel(ctx, x + 10, y + 5, '#ccaaee');
    PA.pixel(ctx, x + 5, y + 11, '#ccaaee');
    PA.pixel(ctx, x + 10, y + 11, '#ccaaee');

    // 鎖定狀態：符文發紅光
    if (isLocked) {
      PA.pixel(ctx, x + 7, y + 6, '#ff4444');
      PA.pixel(ctx, x + 8, y + 6, '#ff4444');
      PA.pixel(ctx, x + 6, y + 8, '#ff4444');
      PA.pixel(ctx, x + 9, y + 8, '#ff4444');
      PA.pixel(ctx, x + 7, y + 10, '#ff4444');
      PA.pixel(ctx, x + 8, y + 10, '#ff4444');
    }
  };

