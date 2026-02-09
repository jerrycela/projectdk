window.DK = window.DK || {};

DK.Tutorial = {
  enabled: false,
  config: null,
  currentStepIndex: -1,
  currentStep: null,
  autoTimer: 0,

  init(tutorialConfig) {
    if (!tutorialConfig || !tutorialConfig.steps) {
      this.enabled = false;
      return;
    }

    this.config = tutorialConfig;
    this.currentStepIndex = -1;
    this.currentStep = null;
    this.autoTimer = 0;
    this.enabled = true;

    // 觸發 onLoad 步驟
    this.nextStep('onLoad');
  },

  nextStep(triggerType) {
    if (!this.enabled) return;

    // 尋找符合 trigger 的步驟
    for (let i = 0; i < this.config.steps.length; i++) {
      const step = this.config.steps[i];

      // onLoad 觸發
      if (triggerType === 'onLoad' && step.trigger === 'onLoad') {
        this.activateStep(i);
        return;
      }

      // afterStep 觸發
      if (triggerType && triggerType.startsWith('afterStep:')) {
        const prevStepId = triggerType.split(':')[1];
        if (step.trigger === `afterStep:${prevStepId}`) {
          this.activateStep(i);
          return;
        }
      }
    }
  },

  activateStep(index) {
    this.currentStepIndex = index;
    this.currentStep = this.config.steps[index];
    this.autoTimer = 0;

    // 如果是 auto 觸發,啟動計時器
    if (this.currentStep.nextTrigger === 'auto') {
      this.autoTimer = this.currentStep.autoDelay || 3000;
    }
  },

  update(dt) {
    if (!this.enabled || !this.currentStep) return;

    // auto 計時器
    if (this.currentStep.nextTrigger === 'auto' && this.autoTimer > 0) {
      this.autoTimer -= dt;
      if (this.autoTimer <= 0) {
        this.nextStep(`afterStep:${this.currentStep.id}`);
      }
    }
  },

  checkCondition(conditionType, data) {
    if (!this.enabled || !this.currentStep) return;
    if (this.currentStep.nextTrigger !== 'condition') return;

    const cond = this.currentStep.condition;
    if (!cond || cond.type !== conditionType) return;

    // 檢查條件
    let met = false;

    if (conditionType === 'barricadePlaced') {
      met = data.count >= (cond.count || 1);
    } else if (conditionType === 'waveStarted') {
      met = data.wave >= (cond.wave || 1);
    } else if (conditionType === 'trapPlaced') {
      // 檢查陷阱數量
      met = data.count >= (cond.count || 1);

      // 如果有指定 trapType，還需要檢查類型
      if (met && cond.trapType && data.trapType) {
        met = data.trapType === cond.trapType;
      }
    }

    if (met) {
      this.nextStep(`afterStep:${this.currentStep.id}`);
    }
  },

  render(ctx) {
    if (!this.enabled || !this.currentStep) return;

    this.renderTutorialBox(ctx);
    this.renderHighlight(ctx);
  },

  renderTutorialBox(ctx) {
    const message = this.currentStep.message;
    if (!message) return;

    // 重用 drawHintBox 風格
    const lines = message.split('\n');
    const padding = 12;
    const lineHeight = 16;
    const boxWidth = 400;
    const boxHeight = lines.length * lineHeight + padding * 2;

    const x = (ctx.canvas.width - boxWidth) / 2;
    const y = ctx.canvas.height - boxHeight - 100; // 底部中央偏上

    // 半透明黑底
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(x, y, boxWidth, boxHeight);

    // 邊框
    ctx.strokeStyle = '#FFD700'; // 金色邊框
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, boxWidth, boxHeight);

    // 文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    lines.forEach((line, i) => {
      ctx.fillText(line, x + padding, y + padding + i * lineHeight);
    });
  },

  renderHighlight(ctx) {
    const highlight = this.currentStep.highlight;
    if (!highlight) return;

    // UI 元素高亮(簡化版:脈動邊框)
    if (highlight.type === 'ui') {
      const pulse = Math.sin(Date.now() / 300) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 + pulse * 0.5})`;
      ctx.lineWidth = 3;

      // 根據 element 類型定位(簡化:僅標記位置)
      // 實際位置需要從 ui.js 獲取
    }
  },
};
