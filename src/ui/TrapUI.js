/**
 * 陷阱選擇 UI - 地牢風格（支援 4 種陷阱）
 */

import { COLORS } from '../config.js';

const TRAP_INFO = {
  spike: {
    name: '尖刺',
    cost: 10,
    color: COLORS.spike,
    description: '地面陷阱',
    placeOn: '空地',
    key: '1'
  },
  slow: {
    name: '冰霜',
    cost: 15,
    color: 0x87ceeb,
    description: '減速敵人',
    placeOn: '空地',
    key: '2'
  },
  arrow: {
    name: '弩砲',
    cost: 25,
    color: COLORS.arrow,
    description: '遠程攻擊',
    placeOn: '牆壁',
    key: '3'
  },
  fire: {
    name: '火焰',
    cost: 40,
    color: 0xff4500,
    description: '範圍傷害',
    placeOn: '牆壁',
    key: '4'
  }
};

export default class TrapUI {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.selected = 'spike';
    this.buttons = {};

    this.create();
  }

  create() {
    // 背景面板（石板風格）
    const bg = this.scene.add.graphics();

    // 外框陰影
    bg.fillStyle(0x000000, 0.5);
    bg.fillRect(this.x + 3, this.y + 3, 460, 90);

    // 石板底色
    bg.fillStyle(COLORS.uiBg, 1);
    bg.fillRect(this.x, this.y, 460, 90);

    // 石板紋理
    bg.lineStyle(1, 0x252525, 0.3);
    for (let i = 0; i < 5; i++) {
      bg.beginPath();
      bg.moveTo(this.x + 5, this.y + 18 + i * 16);
      bg.lineTo(this.x + 455, this.y + 18 + i * 16);
      bg.strokePath();
    }

    // 金屬邊框
    bg.lineStyle(3, COLORS.uiBorder, 1);
    bg.strokeRect(this.x, this.y, 460, 90);

    // 內框高光
    bg.lineStyle(1, 0x555555, 0.5);
    bg.strokeRect(this.x + 3, this.y + 3, 454, 84);

    // 角落裝飾
    this.drawCornerNail(bg, this.x + 8, this.y + 8);
    this.drawCornerNail(bg, this.x + 452, this.y + 8);
    this.drawCornerNail(bg, this.x + 8, this.y + 82);
    this.drawCornerNail(bg, this.x + 452, this.y + 82);

    // 標題
    const titleBg = this.scene.add.graphics();
    titleBg.fillStyle(0x3a2a1a, 1);
    titleBg.fillRect(this.x + 180, this.y - 8, 100, 20);
    titleBg.lineStyle(2, COLORS.gold, 0.8);
    titleBg.strokeRect(this.x + 180, this.y - 8, 100, 20);

    this.scene.add.text(this.x + 230, this.y + 2, '⚔ 陷阱工坊 ⚔', {
      fontSize: '12px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 陷阱按鈕（2x2 佈局改為 1x4）
    let btnX = this.x + 10;
    const btnY = this.y + 15;

    Object.entries(TRAP_INFO).forEach(([key, info]) => {
      const btn = this.createButton(btnX, btnY, key, info);
      this.buttons[key] = btn;
      btnX += 112;
    });

    this.updateSelection();
  }

  drawCornerNail(g, x, y) {
    g.fillStyle(0x606060, 1);
    g.fillCircle(x, y, 4);
    g.fillStyle(0x808080, 1);
    g.fillCircle(x - 1, y - 1, 2);
  }

  createButton(x, y, key, info) {
    const container = this.scene.add.container(x, y);

    // 按鈕背景
    const bg = this.scene.add.graphics();
    this.drawButtonBackground(bg, info.color, false);

    // 陷阱圖示
    const icon = this.scene.add.graphics();
    this.drawTrapIcon(icon, key, 50, 22);

    // 名稱 + 快捷鍵
    const nameText = this.scene.add.text(50, 40, `${info.name} [${info.key}]`, {
      fontSize: '9px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 價格
    const costBg = this.scene.add.graphics();
    costBg.fillStyle(0x2a2a2a, 0.8);
    costBg.fillRoundedRect(22, 50, 56, 14, 3);

    const costText = this.scene.add.text(50, 57, `💰 ${info.cost}`, {
      fontSize: '9px',
      color: '#ffd700'
    }).setOrigin(0.5);

    container.add([bg, icon, nameText, costBg, costText]);

    // 點擊事件
    const hitArea = this.scene.add.rectangle(x + 50, y + 35, 100, 70, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerdown', () => {
      this.select(key);
    });

    hitArea.on('pointerover', () => {
      if (key !== this.selected) {
        bg.clear();
        this.drawButtonBackground(bg, info.color, false, true);
      }
    });

    hitArea.on('pointerout', () => {
      bg.clear();
      this.drawButtonBackground(bg, info.color, key === this.selected);
    });

    return { container, bg, icon, hitArea };
  }

  drawButtonBackground(g, color, isSelected, isHover = false) {
    const width = 100;
    const height = 65;

    // 陰影
    if (isSelected) {
      g.fillStyle(COLORS.gold, 0.3);
      g.fillRect(2, 2, width, height);
    }

    // 木質底板
    g.fillStyle(isSelected ? 0x4a3a2a : 0x3a2a1a, 1);
    g.fillRect(0, 0, width, height);

    // 木紋
    g.lineStyle(1, 0x2a1a0a, 0.3);
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(5, 12 + i * 20);
      g.lineTo(width - 5, 12 + i * 20);
      g.strokePath();
    }

    // 內部區域
    g.fillStyle(isHover ? 0x2a2a2a : 0x1a1a1a, 1);
    g.fillRect(5, 5, width - 10, 32);

    // 邊框
    const borderColor = isSelected ? COLORS.gold : (isHover ? 0x888888 : COLORS.uiBorder);
    const borderWidth = isSelected ? 3 : 2;
    g.lineStyle(borderWidth, borderColor, 1);
    g.strokeRect(0, 0, width, height);

    // 內框
    g.lineStyle(1, 0x555555, 0.5);
    g.strokeRect(5, 5, width - 10, 32);
  }

  drawTrapIcon(g, type, cx, cy) {
    if (type === 'spike') {
      // 尖刺圖示
      const spikes = [{ dx: -10, dy: 0 }, { dx: 0, dy: 0 }, { dx: 10, dy: 0 }];
      for (const pos of spikes) {
        const x = cx + pos.dx;
        const y = cy + pos.dy;
        g.fillStyle(COLORS.spike, 1);
        g.beginPath();
        g.moveTo(x, y - 8);
        g.lineTo(x - 3, y + 4);
        g.lineTo(x + 3, y + 4);
        g.closePath();
        g.fillPath();
        g.fillStyle(COLORS.spikeShine, 0.6);
        g.beginPath();
        g.moveTo(x, y - 8);
        g.lineTo(x - 3, y + 4);
        g.lineTo(x - 1, y + 3);
        g.lineTo(x, y - 6);
        g.closePath();
        g.fillPath();
      }
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(cx - 15, cy + 4, 30, 5);
    } else if (type === 'slow') {
      // 冰霜圖示
      g.fillStyle(0x1a3a5a, 1);
      g.fillCircle(cx, cy, 10);
      g.lineStyle(1, 0x87ceeb, 0.8);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        g.beginPath();
        g.moveTo(cx, cy);
        g.lineTo(cx + Math.cos(angle) * 10, cy + Math.sin(angle) * 10);
        g.strokePath();
      }
      g.fillStyle(0x87ceeb, 1);
      g.fillCircle(cx, cy, 5);
    } else if (type === 'arrow') {
      // 弩砲圖示
      g.fillStyle(COLORS.arrow, 1);
      g.fillRect(cx - 10, cy - 4, 20, 16);
      g.lineStyle(1, 0x4a3520, 0.5);
      g.beginPath();
      g.moveTo(cx - 8, cy + 2);
      g.lineTo(cx + 8, cy + 2);
      g.strokePath();
      g.fillStyle(COLORS.arrowMetal, 1);
      g.fillRect(cx - 2, cy - 10, 4, 8);
      g.fillStyle(0xff4444, 0.8);
      g.fillCircle(cx, cy - 6, 2);
      g.fillStyle(0xaaaaaa, 1);
      g.beginPath();
      g.moveTo(cx, cy - 14);
      g.lineTo(cx - 2, cy - 10);
      g.lineTo(cx + 2, cy - 10);
      g.closePath();
      g.fillPath();
    } else if (type === 'fire') {
      // 火焰圖示
      g.fillStyle(0x4a4a4a, 1);
      g.fillCircle(cx, cy, 10);
      g.fillStyle(0x2a2a2a, 1);
      g.fillCircle(cx, cy, 6);
      // 火焰
      g.fillStyle(0xff4500, 1);
      g.beginPath();
      g.moveTo(cx, cy - 12);
      g.lineTo(cx - 4, cy - 2);
      g.lineTo(cx + 4, cy - 2);
      g.closePath();
      g.fillPath();
      g.fillStyle(0xffa500, 1);
      g.beginPath();
      g.moveTo(cx, cy - 10);
      g.lineTo(cx - 2, cy - 3);
      g.lineTo(cx + 2, cy - 3);
      g.closePath();
      g.fillPath();
      g.fillStyle(0xffff00, 0.8);
      g.fillCircle(cx, cy - 4, 2);
    }
  }

  select(key) {
    this.selected = key;
    this.updateSelection();
    this.scene.events.emit('trapSelected', key);
  }

  updateSelection() {
    Object.entries(this.buttons).forEach(([key, btn]) => {
      const isSelected = key === this.selected;
      btn.bg.clear();
      this.drawButtonBackground(btn.bg, TRAP_INFO[key].color, isSelected);
    });
  }

  getSelected() {
    return this.selected;
  }

  getCost(trapType) {
    return TRAP_INFO[trapType]?.cost || 0;
  }
}
