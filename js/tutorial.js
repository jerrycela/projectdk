/**
 * Dungeon Keep - Tutorial System (Sandbox Mode)
 * 獨立沙盒教學系統，不共用遊戲狀態
 */
window.DK = window.DK || {};

DK.Tutorial = {
  // === 教學模式狀態（獨立於 DK.Game） ===
  active: false,
  currentStep: 0,
  completed: false,

  // 獨立沙盒狀態（不影響 DK.Game.state）
  sandbox: {
    gold: 100,
    trapsPlaced: 0,
    waveStarted: false,
    enemiesDefeated: 0,
    sandboxMode: true, // 標記為沙盒模式
  },

  // === 3 步核心教學流程 ===
  steps: [
    {
      id: 'step1_place_trap',
      title: '步驟 1：放置陷阱',
      message: '點擊下方「電擊板」按鈕，然後點擊地圖上的地板放置陷阱。\n\n（教學模式：金幣固定 100，可放置多個陷阱練習）',
      highlight: {
        type: 'ui',
        element: 'trap_button', // 高亮電擊板按鈕
      },
      arrow: {
        from: { x: 480, y: 680 },
        to: { x: 100, y: 680 }, // 指向電擊板按鈕
      },
      condition: {
        type: 'trapPlaced',
        count: 1, // 至少放置 1 個陷阱
      },
      helpText: '提示：電擊板對潮濕的敵人特別有效！',
    },
    {
      id: 'step2_start_wave',
      title: '步驟 2：開始波次',
      message: '陷阱已放置！點擊右下角的「開始入侵」按鈕，讓敵人進攻。\n\n（教學模式：只會出現 3 個劍士，方便觀察）',
      highlight: {
        type: 'ui',
        element: 'start_invasion_button',
      },
      arrow: {
        from: { x: 480, y: 400 },
        to: { x: 860, y: 680 }, // 指向開始入侵按鈕
      },
      condition: {
        type: 'waveStarted',
      },
      helpText: '提示：注意觀察敵人的行進路線！',
    },
    {
      id: 'step3_observe',
      title: '步驟 3：觀察結果',
      message: '太好了！觀察你的陷阱如何擊敗敵人。\n\n擊敗所有敵人後，教學就完成了。準備好開始真正的遊戲了嗎？',
      highlight: null,
      condition: {
        type: 'enemiesDefeated',
        count: 3, // 擊敗 3 個敵人
      },
      helpText: '提示：右上角顯示剩餘敵人數量。',
      autoComplete: true, // 自動完成
    },
  ],

  // === 初始化教學系統 ===
  init() {
    this.active = true;
    this.currentStep = 0;
    this.completed = false;

    // 重置沙盒狀態
    this.sandbox.gold = 100;
    this.sandbox.trapsPlaced = 0;
    this.sandbox.waveStarted = false;
    this.sandbox.enemiesDefeated = 0;

    console.log('[Tutorial] 教學模式已啟動（沙盒模式）');
  },

  // === 開始教學（從主選單呼叫） ===
  start() {
    // 保存原始遊戲狀態（非必要，因為沙盒完全獨立）
    this.init();

    // 初始化教學地圖（簡化版）
    this.setupTutorialMap();

    // 顯示第一步提示
    this.currentStep = 0;
  },

  // === 設定教學專用地圖 ===
  setupTutorialMap() {
    // 簡化版地圖：只有一條直線路徑
    // 由於不影響 DK.Map，這裡僅作為概念說明
    // 實際實作時需要設定 DK.Map.layout 為教學地圖

    console.log('[Tutorial] 載入教學地圖（簡化版）');
    // 教學地圖可以硬編碼或從 DK.LEVELS 中選擇簡化版本
  },

  // === 檢查條件觸發（由遊戲邏輯呼叫） ===
  checkCondition(conditionType, data = {}) {
    if (!this.active || this.completed) return;

    const step = this.steps[this.currentStep];
    if (!step || !step.condition) return;

    const cond = step.condition;
    if (cond.type !== conditionType) return;

    let met = false;

    switch (conditionType) {
      case 'trapPlaced':
        this.sandbox.trapsPlaced = data.count || this.sandbox.trapsPlaced + 1;
        met = this.sandbox.trapsPlaced >= (cond.count || 1);
        break;

      case 'waveStarted':
        this.sandbox.waveStarted = true;
        met = true;
        break;

      case 'enemiesDefeated':
        this.sandbox.enemiesDefeated = data.count || this.sandbox.enemiesDefeated + 1;
        met = this.sandbox.enemiesDefeated >= (cond.count || 1);
        break;
    }

    if (met) {
      this.nextStep();
    }
  },

  // === 下一步 ===
  nextStep() {
    if (!this.active) return;

    this.currentStep++;

    if (this.currentStep >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[this.currentStep];
    console.log(`[Tutorial] 進入 ${step.title}`);
  },

  // === 完成教學 ===
  complete() {
    this.completed = true;
    this.active = false;

    console.log('[Tutorial] 教學完成！');

    // 儲存教學完成狀態到 localStorage
    try {
      localStorage.setItem('dk_tutorial_completed', 'true');
    } catch (e) {
      console.warn('[Tutorial] 無法儲存教學狀態', e);
    }

    // 顯示完成訊息並返回主選單
    this.showCompletionMessage();
  },

  // === 跳過教學 ===
  skip() {
    if (!this.active) return;

    this.completed = true;
    this.active = false;

    console.log('[Tutorial] 教學已跳過');

    // 也標記為已完成（避免重複提示）
    try {
      localStorage.setItem('dk_tutorial_completed', 'true');
    } catch (e) {
      console.warn('[Tutorial] 無法儲存教學狀態', e);
    }

    // 返回主選單
    if (DK.Game) {
      DK.Game.state = 'start';
    }
  },

  // === 顯示完成訊息 ===
  showCompletionMessage() {
    // 在 UI canvas 上顯示完成訊息
    // 實際渲染在 render() 方法中處理
    this.showCompletion = true;
    this.completionTimer = 3000; // 3 秒後自動返回
  },

  // === 更新（每幀呼叫） ===
  update(dt) {
    if (!this.active) {
      // 完成訊息倒數計時
      if (this.showCompletion && this.completionTimer > 0) {
        this.completionTimer -= dt;
        if (this.completionTimer <= 0) {
          this.showCompletion = false;
          // 返回主選單
          if (DK.Game) {
            DK.Game.state = 'start';
          }
        }
      }
      return;
    }

    // 教學步驟的自動完成邏輯（如有需要）
    const step = this.steps[this.currentStep];
    if (step && step.autoComplete) {
      // 某些步驟可能有計時器自動完成
    }
  },

  // === 渲染教學 UI ===
  render(ctx) {
    if (!this.active && !this.showCompletion) return;

    // 顯示完成訊息
    if (this.showCompletion) {
      this.renderCompletion(ctx);
      return;
    }

    const step = this.steps[this.currentStep];
    if (!step) return;

    // 1. 渲染遮罩（半透明黑底，凸顯教學內容）
    this.renderOverlay(ctx);

    // 2. 渲染高亮區域
    this.renderHighlight(ctx, step);

    // 3. 渲染箭頭指示
    this.renderArrow(ctx, step);

    // 4. 渲染教學面板
    this.renderTutorialPanel(ctx, step);

    // 5. 渲染跳過按鈕
    this.renderSkipButton(ctx);
  },

  // === 渲染遮罩 ===
  renderOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  },

  // === 渲染高亮區域 ===
  renderHighlight(ctx, step) {
    if (!step.highlight) return;

    const hl = step.highlight;

    if (hl.type === 'ui' && hl.element) {
      // 根據 UI 元素類型定位高亮區域
      let rect = this.getUIElementRect(hl.element);
      if (!rect) return;

      // 清除遮罩（顯示高亮區域）
      ctx.clearRect(rect.x - 10, rect.y - 10, rect.w + 20, rect.h + 20);

      // 脈動邊框
      const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255, 215, 0, ${pulse})`;
      ctx.lineWidth = 4;
      ctx.strokeRect(rect.x - 10, rect.y - 10, rect.w + 20, rect.h + 20);
    }
  },

  // === 獲取 UI 元素位置（簡化版） ===
  getUIElementRect(element) {
    // 根據元素類型返回矩形座標
    // 這裡需要與 ui.js 的實際佈局對應

    switch (element) {
      case 'trap_button':
        // 電擊板按鈕位置（假設位於 UI 底部左側）
        return { x: 20, y: DK.CONFIG.UI_TOP + 20, w: 80, h: 60 };

      case 'start_invasion_button':
        // 開始入侵按鈕位置（右下角）
        return { x: 820, y: DK.CONFIG.UI_TOP + 20, w: 120, h: 60 };

      default:
        return null;
    }
  },

  // === 渲染箭頭 ===
  renderArrow(ctx, step) {
    if (!step.arrow) return;

    const { from, to } = step.arrow;

    // 動畫偏移（箭頭跳動）
    const offset = Math.sin(Date.now() / 200) * 10;

    ctx.save();
    ctx.strokeStyle = '#FFD700';
    ctx.fillStyle = '#FFD700';
    ctx.lineWidth = 3;

    // 繪製線條
    ctx.beginPath();
    ctx.moveTo(from.x, from.y + offset);
    ctx.lineTo(to.x, to.y + offset);
    ctx.stroke();

    // 繪製箭頭
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const arrowSize = 15;

    ctx.beginPath();
    ctx.moveTo(to.x, to.y + offset);
    ctx.lineTo(
      to.x - arrowSize * Math.cos(angle - Math.PI / 6),
      to.y + offset - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      to.x - arrowSize * Math.cos(angle + Math.PI / 6),
      to.y + offset - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },

  // === 渲染教學面板 ===
  renderTutorialPanel(ctx, step) {
    const padding = 20;
    const lineHeight = 24;
    const boxWidth = 500;

    // 計算文字行數
    const titleLines = [step.title];
    const messageLines = step.message.split('\n');
    const helpLines = step.helpText ? [step.helpText] : [];

    const totalLines = titleLines.length + messageLines.length + helpLines.length + 1; // +1 for spacing
    const boxHeight = totalLines * lineHeight + padding * 2;

    const x = (ctx.canvas.width - boxWidth) / 2;
    const y = 100;

    // 背景框
    ctx.fillStyle = 'rgba(30, 26, 46, 0.95)';
    ctx.fillRect(x, y, boxWidth, boxHeight);

    // 邊框
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // 標題
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(step.title, x + boxWidth / 2, y + padding);

    // 訊息
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';

    let currentY = y + padding + lineHeight * 1.5;
    messageLines.forEach((line) => {
      ctx.fillText(line, x + padding, currentY);
      currentY += lineHeight;
    });

    // 幫助文字
    if (step.helpText) {
      currentY += lineHeight * 0.5;
      ctx.fillStyle = '#88AAFF';
      ctx.font = 'italic 14px sans-serif';
      ctx.fillText(step.helpText, x + padding, currentY);
    }
  },

  // === 渲染跳過按鈕 ===
  renderSkipButton(ctx) {
    const btnWidth = 120;
    const btnHeight = 40;
    const x = ctx.canvas.width - btnWidth - 20;
    const y = 20;

    // 按鈕背景
    ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
    ctx.fillRect(x, y, btnWidth, btnHeight);

    // 按鈕邊框
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, btnWidth, btnHeight);

    // 按鈕文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('跳過教學', x + btnWidth / 2, y + btnHeight / 2);

    // 儲存按鈕位置（用於點擊檢測）
    this.skipButtonRect = { x, y, w: btnWidth, h: btnHeight };
  },

  // === 渲染完成訊息 ===
  renderCompletion(ctx) {
    const boxWidth = 600;
    const boxHeight = 300;
    const x = (ctx.canvas.width - boxWidth) / 2;
    const y = (ctx.canvas.height - boxHeight) / 2;

    // 背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 完成框
    ctx.fillStyle = 'rgba(30, 26, 46, 0.95)';
    ctx.fillRect(x, y, boxWidth, boxHeight);

    // 邊框（金色）
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // 標題
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('🎉 教學完成！', x + boxWidth / 2, y + 60);

    // 訊息
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px sans-serif';
    ctx.fillText('你已經掌握了基本操作！', x + boxWidth / 2, y + 130);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#AAAAAA';
    ctx.fillText('準備好開始真正的冒險了嗎？', x + boxWidth / 2, y + 170);

    // 倒數計時
    const secondsLeft = Math.ceil(this.completionTimer / 1000);
    ctx.fillStyle = '#88AAFF';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${secondsLeft} 秒後返回主選單...`, x + boxWidth / 2, y + 220);
  },

  // === 處理點擊（由 UI 系統呼叫） ===
  handleClick(mx, my) {
    if (!this.active) return false;

    // 檢查是否點擊跳過按鈕
    if (this.skipButtonRect) {
      const rect = this.skipButtonRect;
      if (mx >= rect.x && mx <= rect.x + rect.w && my >= rect.y && my <= rect.y + rect.h) {
        this.skip();
        return true; // 消耗事件
      }
    }

    // 教學模式下，某些點擊會觸發條件檢查
    // 例如：點擊陷阱按鈕、開始入侵按鈕等
    // 這些邏輯應該由 ui.js 處理並呼叫 checkCondition

    return false; // 不消耗事件，讓 UI 系統繼續處理
  },

  // === 檢查是否已完成教學（首次啟動檢查） ===
  isCompleted() {
    try {
      return localStorage.getItem('dk_tutorial_completed') === 'true';
    } catch (e) {
      return false;
    }
  },

  // === 重置教學進度（測試用） ===
  reset() {
    try {
      localStorage.removeItem('dk_tutorial_completed');
    } catch (e) {
      console.warn('[Tutorial] 無法重置教學狀態', e);
    }

    this.active = false;
    this.currentStep = 0;
    this.completed = false;
    this.showCompletion = false;

    console.log('[Tutorial] 教學進度已重置');
  },
};
