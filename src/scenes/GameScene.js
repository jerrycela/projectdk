/**
 * 主遊戲場景
 */

import { GRID, COLORS, TILE_TYPES, GAME_CONFIG } from '../config.js';
import { LEVEL_1 } from '../map/level1.js';
import { getLevel1Path } from '../map/PathFinder.js';
import Enemy from '../entities/Enemy.js';
import SpikeTrap from '../entities/SpikeTrap.js';
import ArrowTrap from '../entities/ArrowTrap.js';
import SlowTrap from '../entities/SlowTrap.js';
import FireTrap from '../entities/FireTrap.js';
import TrapUI from '../ui/TrapUI.js';
import WaveManager from '../WaveManager.js';
import EffectsManager from '../effects/EffectsManager.js';

// 陷阱價格
const TRAP_COSTS = {
  spike: 10,
  arrow: 25,
  slow: 15,
  fire: 40
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.path = [];
    this.enemies = [];
    this.traps = [];
    this.map = LEVEL_1;
    this.selectedTrap = 'spike';
    this.gold = GAME_CONFIG.initialGold;
    this.baseHp = GAME_CONFIG.baseHp;
    this.maxBaseHp = GAME_CONFIG.baseHp;
    this.gameOver = false;
  }

  create() {
    // 繪製地圖
    this.drawMap();

    // 計算路徑
    this.path = getLevel1Path();
    console.log('路徑計算完成，路徑點數量:', this.path.length);
    if (this.path.length === 0) {
      console.error('警告：路徑為空！');
    }
    this.drawPath();

    // 建立頂部狀態列
    this.createTopBar();

    // 建立底部 UI 面板
    this.createBottomPanel();

    // 建立 UI
    this.trapUI = new TrapUI(this, 10, 390);

    // 建立波次管理器
    this.waveManager = new WaveManager(this);

    // 建立特效管理器
    this.effectsManager = new EffectsManager(this);

    // 建立「開始波次」按鈕
    this.createStartButton();

    this.updateStatus();

    // 監聽事件
    this.events.on('enemyReachedEnd', this.onEnemyReachedEnd, this);
    this.events.on('enemyDied', this.onEnemyDied, this);
    this.events.on('trapSelected', (type) => {
      this.selectedTrap = type;
    });
    this.events.on('waveEnd', () => {
      this.gold += GAME_CONFIG.waveReward;
      this.updateStatus();
      this.showStartButton();
    });
    this.events.on('allWavesComplete', () => {
      this.showVictory();
    });

    // 按鍵設定
    this.input.keyboard.on('keydown-R', () => {
      if (this.gameOver) {
        this.scene.restart();
      }
    });
    this.input.keyboard.on('keydown-ONE', () => this.trapUI.select('spike'));
    this.input.keyboard.on('keydown-TWO', () => this.trapUI.select('slow'));
    this.input.keyboard.on('keydown-THREE', () => this.trapUI.select('arrow'));
    this.input.keyboard.on('keydown-FOUR', () => this.trapUI.select('fire'));

    // 點擊放置陷阱
    this.input.on('pointerdown', (pointer) => this.handleClick(pointer));
  }

  createTopBar() {
    const barY = 0;
    const barHeight = 35;
    const g = this.add.graphics();

    // 頂部欄背景
    g.fillStyle(0x1a1a1a, 0.9);
    g.fillRect(0, barY, 640, barHeight);

    // 金屬邊框
    g.lineStyle(2, COLORS.uiBorder, 1);
    g.beginPath();
    g.moveTo(0, barY + barHeight);
    g.lineTo(640, barY + barHeight);
    g.strokePath();

    // 裝飾分隔線
    g.lineStyle(1, 0x555555, 0.5);
    g.beginPath();
    g.moveTo(200, barY + 5);
    g.lineTo(200, barY + barHeight - 5);
    g.strokePath();
    g.beginPath();
    g.moveTo(400, barY + 5);
    g.lineTo(400, barY + barHeight - 5);
    g.strokePath();

    // 金幣圖示區
    g.fillStyle(COLORS.gold, 1);
    g.fillCircle(25, barY + barHeight / 2, 10);
    g.fillStyle(0xb8860b, 1);
    g.fillCircle(25, barY + barHeight / 2, 6);
    this.add.text(28, barY + barHeight / 2, '$', {
      fontSize: '10px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 金幣數量
    this.goldText = this.add.text(45, barY + barHeight / 2, '100', {
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 血量圖示區
    g.fillStyle(0xff4444, 1);
    g.fillCircle(220, barY + barHeight / 2, 10);
    this.add.text(220, barY + barHeight / 2, '♥', {
      fontSize: '12px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // 血量數量
    this.hpText = this.add.text(240, barY + barHeight / 2, '20/20', {
      fontSize: '16px',
      color: '#ff6666',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);

    // 波次圖示
    this.add.text(420, barY + barHeight / 2, '⚔', {
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(0, 0.5);

    // 波次顯示
    this.waveText = this.add.text(440, barY + barHeight / 2, '波次 1/5', {
      fontSize: '14px',
      color: '#cccccc'
    }).setOrigin(0, 0.5);

    // 提示文字
    this.add.text(560, barY + barHeight / 2, '1:尖刺 2:弩砲', {
      fontSize: '10px',
      color: '#888888'
    }).setOrigin(0, 0.5);
  }

  createBottomPanel() {
    const panelY = 380;
    const g = this.add.graphics();

    // 底部面板背景
    g.fillStyle(0x1a1a1a, 0.95);
    g.fillRect(0, panelY, 640, 100);

    // 上邊框
    g.lineStyle(2, COLORS.uiBorder, 1);
    g.beginPath();
    g.moveTo(0, panelY);
    g.lineTo(640, panelY);
    g.strokePath();

    // 內側高光
    g.lineStyle(1, 0x333333, 0.5);
    g.beginPath();
    g.moveTo(0, panelY + 2);
    g.lineTo(640, panelY + 2);
    g.strokePath();
  }

  createStartButton() {
    const btnX = 480;
    const btnY = 395;
    const btnW = 140;
    const btnH = 60;

    // 按鈕背景
    this.startBtnBg = this.add.graphics();
    this.drawStartButton(this.startBtnBg, btnX, btnY, btnW, btnH, false);

    // 按鈕文字
    this.startBtnText = this.add.text(btnX + btnW / 2, btnY + btnH / 2, '⚔ 開始波次 ⚔', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 點擊區域
    this.startBtnHit = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, 0x000000, 0);
    this.startBtnHit.setInteractive({ useHandCursor: true });

    this.startBtnHit.on('pointerover', () => {
      this.startBtnBg.clear();
      this.drawStartButton(this.startBtnBg, btnX, btnY, btnW, btnH, true);
    });

    this.startBtnHit.on('pointerout', () => {
      this.startBtnBg.clear();
      this.drawStartButton(this.startBtnBg, btnX, btnY, btnW, btnH, false);
    });

    this.startBtnHit.on('pointerdown', () => {
      this.onStartWaveClick();
    });
  }

  drawStartButton(g, x, y, w, h, isHover) {
    // 陰影
    g.fillStyle(0x000000, 0.5);
    g.fillRect(x + 3, y + 3, w, h);

    // 按鈕底色
    g.fillStyle(isHover ? 0x2a4a2a : 0x1a3a1a, 1);
    g.fillRect(x, y, w, h);

    // 內部漸層效果
    g.fillStyle(isHover ? 0x3a6a3a : 0x2a5a2a, 1);
    g.fillRect(x + 4, y + 4, w - 8, h / 2 - 4);

    // 金屬邊框
    g.lineStyle(2, isHover ? 0x4a8a4a : 0x3a7a3a, 1);
    g.strokeRect(x, y, w, h);

    // 內框高光
    g.lineStyle(1, 0x5aaa5a, 0.3);
    g.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // 角落裝飾
    g.fillStyle(0x4a8a4a, 1);
    g.fillCircle(x + 6, y + 6, 3);
    g.fillCircle(x + w - 6, y + 6, 3);
    g.fillCircle(x + 6, y + h - 6, 3);
    g.fillCircle(x + w - 6, y + h - 6, 3);
  }

  onStartWaveClick() {
    console.log('開始波次按鈕被點擊');
    console.log('gameOver:', this.gameOver, 'isWaveActive:', this.waveManager.isWaveActive);

    if (!this.gameOver && !this.waveManager.isWaveActive) {
      console.log('開始新波次...');
      this.waveManager.startWave();
      this.updateStatus();
      this.hideStartButton();
    }
  }

  hideStartButton() {
    this.startBtnBg.setVisible(false);
    this.startBtnText.setVisible(false);
    this.startBtnHit.disableInteractive();
  }

  showStartButton() {
    if (this.waveManager.isComplete()) return;
    this.startBtnBg.setVisible(true);
    this.startBtnText.setVisible(true);
    this.startBtnHit.setInteractive({ useHandCursor: true });
  }

  updateStatus() {
    const wave = this.waveManager.getCurrentWave();
    const total = this.waveManager.getTotalWaves();
    this.goldText.setText(this.gold.toString());
    this.hpText.setText(`${this.baseHp}/${this.maxBaseHp}`);
    this.waveText.setText(`波次 ${wave}/${total}`);

    // 血量低時變紅
    if (this.baseHp <= 5) {
      this.hpText.setColor('#ff4444');
    } else if (this.baseHp <= 10) {
      this.hpText.setColor('#ffaa44');
    } else {
      this.hpText.setColor('#ff6666');
    }
  }

  drawMap() {
    const mapGraphics = this.add.graphics();
    const size = GRID.TILE_SIZE;

    for (let y = 0; y < this.map.length; y++) {
      for (let x = 0; x < this.map[y].length; x++) {
        const char = this.map[y][x];
        const px = x * size;
        const py = y * size;

        if (char === '#') {
          // 石牆 - 3D 立體效果
          this.drawWallTile(mapGraphics, px, py, size);
        } else if (char === '.' || char === 'S') {
          // 路徑 - 泥土地面
          this.drawPathTile(mapGraphics, px, py, size, char === 'S');
        } else if (char === '_') {
          // 可建造區
          this.drawGroundTile(mapGraphics, px, py, size);
        } else if (char === 'E') {
          // 終點/基地
          this.drawExitTile(mapGraphics, px, py, size);
        }
      }
    }
  }

  drawWallTile(g, x, y, size) {
    // 基底色
    g.fillStyle(COLORS.wall, 1);
    g.fillRect(x, y, size, size);

    // 磚塊紋理
    g.lineStyle(1, COLORS.wallDark, 0.5);

    // 橫向磚縫
    g.beginPath();
    g.moveTo(x, y + size / 2);
    g.lineTo(x + size, y + size / 2);
    g.strokePath();

    // 縱向磚縫（交錯）
    g.beginPath();
    g.moveTo(x + size / 2, y);
    g.lineTo(x + size / 2, y + size / 2);
    g.strokePath();

    g.beginPath();
    g.moveTo(x + size / 4, y + size / 2);
    g.lineTo(x + size / 4, y + size);
    g.strokePath();

    g.beginPath();
    g.moveTo(x + size * 3 / 4, y + size / 2);
    g.lineTo(x + size * 3 / 4, y + size);
    g.strokePath();

    // 上邊高光
    g.lineStyle(1, COLORS.wallLight, 0.4);
    g.beginPath();
    g.moveTo(x, y + 1);
    g.lineTo(x + size, y + 1);
    g.strokePath();

    // 邊框
    g.lineStyle(1, 0x000000, 0.3);
    g.strokeRect(x, y, size, size);
  }

  drawPathTile(g, x, y, size, isSpawn) {
    // 泥土基底
    g.fillStyle(isSpawn ? COLORS.spawn : COLORS.path, 1);
    g.fillRect(x, y, size, size);

    // 泥土紋理 - 隨機點
    g.fillStyle(COLORS.pathLight, 0.3);
    const seed = x * 100 + y;
    for (let i = 0; i < 5; i++) {
      const dx = ((seed + i * 17) % 20) + 4;
      const dy = ((seed + i * 31) % 20) + 4;
      g.fillCircle(x + dx, y + dy, 2);
    }

    // 邊緣陰影
    g.lineStyle(1, 0x000000, 0.2);
    g.strokeRect(x, y, size, size);

    // 起點標記
    if (isSpawn) {
      g.fillStyle(0xFFFFFF, 0.8);
      g.fillTriangle(
        x + size / 2, y + 6,
        x + 6, y + size - 6,
        x + size - 6, y + size - 6
      );
    }
  }

  drawGroundTile(g, x, y, size) {
    // 草地基底
    g.fillStyle(COLORS.ground, 1);
    g.fillRect(x, y, size, size);

    // 草地紋理
    g.fillStyle(COLORS.groundLight, 0.3);
    const seed = x * 100 + y;
    for (let i = 0; i < 4; i++) {
      const dx = ((seed + i * 23) % 24) + 4;
      const dy = ((seed + i * 37) % 24) + 4;
      g.fillRect(x + dx, y + dy, 2, 4);
    }

    // 可建造提示框
    g.lineStyle(1, 0x5a5a2a, 0.5);
    g.strokeRect(x + 2, y + 2, size - 4, size - 4);

    // 邊框
    g.lineStyle(1, 0x000000, 0.2);
    g.strokeRect(x, y, size, size);
  }

  drawExitTile(g, x, y, size) {
    // 藍色基底
    g.fillStyle(COLORS.exit, 1);
    g.fillRect(x, y, size, size);

    // 發光效果
    g.fillStyle(0x6699ff, 0.5);
    g.fillRect(x + 4, y + 4, size - 8, size - 8);

    // 中心光點
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(x + size / 2, y + size / 2, 6);

    // 閃爍環
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeCircle(x + size / 2, y + size / 2, 10);

    // 邊框
    g.lineStyle(1, 0x000000, 0.3);
    g.strokeRect(x, y, size, size);
  }

  drawPath() {
    // 路徑現在透過地磚顏色顯示，不需要額外的線條
    // 但保留此方法以便未來擴展（如顯示敵人預測路徑）
  }

  handleClick(pointer) {
    if (this.gameOver) return;
    if (pointer.y > 380) return;

    const gridX = Math.floor(pointer.x / GRID.TILE_SIZE);
    const gridY = Math.floor(pointer.y / GRID.TILE_SIZE);

    if (gridY < 0 || gridY >= this.map.length ||
        gridX < 0 || gridX >= this.map[gridY].length) {
      return;
    }

    const tile = this.map[gridY][gridX];
    const cost = TRAP_COSTS[this.selectedTrap];

    if (this.gold < cost) return;

    // 地面陷阱：尖刺、減速
    if ((this.selectedTrap === 'spike' || this.selectedTrap === 'slow') && tile === '_') {
      this.placeTrap(gridX, gridY, this.selectedTrap, cost);
    }
    // 牆壁陷阱：箭塔、火焰塔
    else if ((this.selectedTrap === 'arrow' || this.selectedTrap === 'fire') && tile === '#') {
      this.placeTrap(gridX, gridY, this.selectedTrap, cost);
    }
  }

  placeTrap(gridX, gridY, type, cost) {
    const existing = this.traps.find(t => t.gridX === gridX && t.gridY === gridY);
    if (existing) return;

    this.gold -= cost;
    this.updateStatus();

    let trap;
    switch (type) {
      case 'spike':
        trap = new SpikeTrap(this, gridX, gridY);
        break;
      case 'arrow':
        trap = new ArrowTrap(this, gridX, gridY);
        break;
      case 'slow':
        trap = new SlowTrap(this, gridX, gridY);
        break;
      case 'fire':
        trap = new FireTrap(this, gridX, gridY);
        break;
      default:
        trap = new SpikeTrap(this, gridX, gridY);
    }

    this.traps.push(trap);
  }

  spawnEnemy(type = 'goblin') {
    if (this.gameOver) return;

    console.log('GameScene.spawnEnemy 被呼叫, 類型:', type);
    const enemy = new Enemy(this, this.path, type);
    this.enemies.push(enemy);
    console.log('敵人已加入，目前數量:', this.enemies.length);
  }

  onEnemyReachedEnd(enemy) {
    this.baseHp--;
    this.updateStatus();

    this.removeEnemy(enemy);
    this.waveManager.onEnemyDefeated();

    if (this.baseHp <= 0) {
      this.showGameOver();
    }
  }

  onEnemyDied(enemy, goldReward = 5) {
    this.gold += goldReward;
    this.updateStatus();
    this.removeEnemy(enemy);
    this.waveManager.onEnemyDefeated();

    // 死亡特效
    this.effectsManager.createDeathEffect(enemy.x, enemy.y, enemy.size, enemy.color);

    // 金幣特效
    this.effectsManager.createCoinEffect(enemy.x, enemy.y, goldReward);

    // 顯示金幣獲得動畫
    this.showGoldPopup(enemy.x, enemy.y, goldReward);
  }

  showGoldPopup(x, y, amount) {
    const text = this.add.text(x, y - 20, `+${amount}💰`, {
      fontSize: '14px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy()
    });
  }

  showWaveAnnouncement(waveName) {
    // 波次名稱公告
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5);
    overlay.fillRect(150, 160, 340, 60);
    overlay.lineStyle(2, COLORS.gold, 0.8);
    overlay.strokeRect(150, 160, 340, 60);

    const text = this.add.text(320, 190, `⚔ ${waveName} ⚔`, {
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 淡出動畫
    this.tweens.add({
      targets: [overlay, text],
      alpha: 0,
      duration: 500,
      delay: 1500,
      onComplete: () => {
        overlay.destroy();
        text.destroy();
      }
    });
  }

  removeEnemy(enemy) {
    const index = this.enemies.indexOf(enemy);
    if (index > -1) {
      this.enemies.splice(index, 1);
    }
  }

  showVictory() {
    this.gameOver = true;
    this.hideStartButton();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, 640, 480);

    // 勝利框
    this.drawResultPanel(overlay, 120, 100, 400, 280, true);

    // 勝利標題
    this.add.text(320, 140, '⚔ 勝利 ⚔', {
      fontSize: '40px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 裝飾線
    const decor = this.add.graphics();
    decor.lineStyle(2, COLORS.gold, 0.8);
    decor.beginPath();
    decor.moveTo(180, 170);
    decor.lineTo(460, 170);
    decor.strokePath();

    // 統計數據
    this.add.text(320, 210, '地牢守衛成功！', {
      fontSize: '18px',
      color: '#cccccc'
    }).setOrigin(0.5);

    this.add.text(320, 250, `💰 累積金幣: ${this.gold}`, {
      fontSize: '20px',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(320, 285, `⚔ 通過波次: ${this.waveManager.getTotalWaves()}`, {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.createRestartButton(320, 340);
  }

  showGameOver() {
    this.gameOver = true;
    this.hideStartButton();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, 640, 480);

    // 失敗框
    this.drawResultPanel(overlay, 120, 100, 400, 280, false);

    // 失敗標題
    this.add.text(320, 140, '💀 地牢淪陷 💀', {
      fontSize: '36px',
      color: '#ff4444',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 裝飾線
    const decor = this.add.graphics();
    decor.lineStyle(2, 0x8b0000, 0.8);
    decor.beginPath();
    decor.moveTo(180, 170);
    decor.lineTo(460, 170);
    decor.strokePath();

    // 統計數據
    this.add.text(320, 210, '敵人突破了防線...', {
      fontSize: '18px',
      color: '#888888'
    }).setOrigin(0.5);

    this.add.text(320, 250, `⚔ 抵達波次: ${this.waveManager.getCurrentWave()}/${this.waveManager.getTotalWaves()}`, {
      fontSize: '18px',
      color: '#cccccc'
    }).setOrigin(0.5);

    this.add.text(320, 285, `💰 剩餘金幣: ${this.gold}`, {
      fontSize: '16px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.createRestartButton(320, 340);
  }

  drawResultPanel(g, x, y, w, h, isVictory) {
    // 外框陰影
    g.fillStyle(0x000000, 0.5);
    g.fillRect(x + 5, y + 5, w, h);

    // 面板底色
    g.fillStyle(isVictory ? 0x1a2a1a : 0x2a1a1a, 1);
    g.fillRect(x, y, w, h);

    // 內部漸層
    g.fillStyle(isVictory ? 0x2a3a2a : 0x3a2a2a, 0.5);
    g.fillRect(x + 10, y + 10, w - 20, 60);

    // 金屬邊框
    g.lineStyle(3, isVictory ? COLORS.gold : 0x8b0000, 1);
    g.strokeRect(x, y, w, h);

    // 內框
    g.lineStyle(1, isVictory ? 0x6a6a2a : 0x6a2a2a, 0.5);
    g.strokeRect(x + 5, y + 5, w - 10, h - 10);

    // 角落裝飾
    const cornerColor = isVictory ? COLORS.gold : 0x8b0000;
    g.fillStyle(cornerColor, 1);
    g.fillCircle(x + 12, y + 12, 5);
    g.fillCircle(x + w - 12, y + 12, 5);
    g.fillCircle(x + 12, y + h - 12, 5);
    g.fillCircle(x + w - 12, y + h - 12, 5);
  }

  createRestartButton(centerX, centerY) {
    const btnW = 140;
    const btnH = 50;
    const x = centerX - btnW / 2;
    const y = centerY - btnH / 2;

    const btnBg = this.add.graphics();

    // 按鈕陰影
    btnBg.fillStyle(0x000000, 0.5);
    btnBg.fillRect(x + 3, y + 3, btnW, btnH);

    // 按鈕底色
    btnBg.fillStyle(0x3a3a3a, 1);
    btnBg.fillRect(x, y, btnW, btnH);

    // 內部高光
    btnBg.fillStyle(0x4a4a4a, 1);
    btnBg.fillRect(x + 4, y + 4, btnW - 8, btnH / 2 - 4);

    // 邊框
    btnBg.lineStyle(2, 0x666666, 1);
    btnBg.strokeRect(x, y, btnW, btnH);

    this.add.text(centerX, centerY, '🔄 重新挑戰', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(centerX, centerY, btnW, btnH, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0x000000, 0.5);
      btnBg.fillRect(x + 3, y + 3, btnW, btnH);
      btnBg.fillStyle(0x4a4a4a, 1);
      btnBg.fillRect(x, y, btnW, btnH);
      btnBg.fillStyle(0x5a5a5a, 1);
      btnBg.fillRect(x + 4, y + 4, btnW - 8, btnH / 2 - 4);
      btnBg.lineStyle(2, 0x888888, 1);
      btnBg.strokeRect(x, y, btnW, btnH);
    });

    hitArea.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0x000000, 0.5);
      btnBg.fillRect(x + 3, y + 3, btnW, btnH);
      btnBg.fillStyle(0x3a3a3a, 1);
      btnBg.fillRect(x, y, btnW, btnH);
      btnBg.fillStyle(0x4a4a4a, 1);
      btnBg.fillRect(x + 4, y + 4, btnW - 8, btnH / 2 - 4);
      btnBg.lineStyle(2, 0x666666, 1);
      btnBg.strokeRect(x, y, btnW, btnH);
    });

    hitArea.on('pointerdown', () => {
      this.scene.restart();
    });
  }

  update(time, delta) {
    if (this.gameOver) return;

    for (const enemy of this.enemies) {
      enemy.update(delta);
    }

    for (const trap of this.traps) {
      trap.update(time, this.enemies);
    }
  }
}
