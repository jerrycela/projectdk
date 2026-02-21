/**
 * Project DK - Tower Defense MVP
 * 入口文件
 */

import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 640,
  height: 480,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [GameScene]
};

const game = new Phaser.Game(config);
