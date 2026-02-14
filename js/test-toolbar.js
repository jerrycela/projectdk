/**
 * ProjectDK - 測試工具列
 * 測試模式專用的工具列控制
 */
window.DK = window.DK || {};

DK.TestToolbar = {
  isVisible: false,
  elements: {},

  /**
   * 初始化測試工具列
   */
  init() {
    // 檢查是否為測試模式
    if (!DK.LevelManager || !DK.LevelManager.isTestMode) {
      return;
    }

    // 獲取元素
    this.elements.toolbar = document.getElementById('test-toolbar');
    this.elements.levelName = document.getElementById('testLevelName');
    this.elements.stats = document.getElementById('testStats');
    this.elements.btnRestart = document.getElementById('btnTestRestart');
    this.elements.btnEditor = document.getElementById('btnTestEditor');
    this.elements.btnClose = document.getElementById('btnTestClose');

    if (!this.elements.toolbar) {
      console.error('❌ 找不到測試工具列元素');
      return;
    }

    // 顯示工具列
    this.show();

    // 設置事件監聽
    this.setupEventListeners();

    // 更新關卡名稱
    this.updateLevelName();

    // 加入 test-mode class 到 body
    document.body.classList.add('test-mode');
  },

  /**
   * 顯示工具列
   */
  show() {
    if (this.elements.toolbar) {
      this.elements.toolbar.style.display = 'flex';
      this.isVisible = true;
    }
  },

  /**
   * 隱藏工具列
   */
  hide() {
    if (this.elements.toolbar) {
      this.elements.toolbar.style.display = 'none';
      this.isVisible = false;
    }
  },

  /**
   * 設置事件監聽
   */
  setupEventListeners() {
    // 重新開始測試
    if (this.elements.btnRestart) {
      this.elements.btnRestart.addEventListener('click', () => {
        this.restartTest();
      });
    }

    // 返回編輯器
    if (this.elements.btnEditor) {
      this.elements.btnEditor.addEventListener('click', () => {
        this.openEditor();
      });
    }

    // 關閉測試
    if (this.elements.btnClose) {
      this.elements.btnClose.addEventListener('click', () => {
        this.closeTest();
      });
    }
  },

  /**
   * 更新關卡名稱
   */
  updateLevelName() {
    if (!this.elements.levelName) return;

    const level = DK.LevelManager?.currentLevel;
    if (level && level.name) {
      this.elements.levelName.textContent = level.name;
    } else {
      this.elements.levelName.textContent = '測試關卡';
    }
  },

  /**
   * 更新統計資訊
   * 由遊戲主循環定期調用
   */
  updateStats() {
    if (!this.isVisible || !this.elements.stats) return;

    const game = DK.Game;
    if (!game) return;

    // 獲取當前波次
    const currentWave = game.currentWave || 0;
    const totalWaves = DK.WAVES?.length || 0;

    // 獲取剩餘敵人數量
    const enemyCount = DK.Enemies?.enemies?.filter(e => e.alive).length || 0;

    // 獲取金幣
    const gold = game.gold || 0;

    // 獲取地心 HP
    const heartHP = game.dungeonHeartHP || 0;

    // 更新顯示
    this.elements.stats.textContent =
      `波次: ${currentWave}/${totalWaves} | 敵人: ${enemyCount} | 金幣: ${gold} | 地心: ${heartHP}`;
  },

  /**
   * 重新開始測試
   */
  restartTest() {
    if (!confirm('確定要重新開始測試？')) return;

    // 重新載入頁面
    window.location.reload();
  },

  /**
   * 開啟編輯器
   */
  openEditor() {
    if (!confirm('確定要返回編輯器？\n\n當前測試進度將會丟失。')) return;

    // 開啟編輯器（新視窗）
    window.open('editor.html', '_blank', 'width=1600,height=900');

    // 提示用戶可以關閉測試視窗
    setTimeout(() => {
      if (confirm('編輯器已開啟。\n\n是否關閉測試視窗？')) {
        window.close();
      }
    }, 500);
  },

  /**
   * 關閉測試
   */
  closeTest() {
    if (!confirm('確定要關閉測試？')) return;

    // 嘗試關閉視窗
    window.close();

    // 如果無法關閉（某些瀏覽器限制），回到編輯器
    setTimeout(() => {
      if (!window.closed) {
        alert('無法自動關閉視窗，請手動關閉。\n\n或點擊「返回編輯器」按鈕。');
      }
    }, 100);
  }
};

// 在頁面載入後初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    DK.TestToolbar.init();
  });
} else {
  DK.TestToolbar.init();
}
