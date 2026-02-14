/**
 * Dungeon Keep - UI Notifications
 * 錯誤提示系統（就近原則）- 在指定位置顯示錯誤/警告/資訊提示
 */
window.DK = window.DK || {};
DK.UI = DK.UI || {};  // 確保 DK.UI 已初始化

DK.UI.ErrorNotification = {
  queue: [],
  current: null,

  /**
   * 顯示錯誤提示
   * @param {string} message - 錯誤訊息
   * @param {string} type - 類型：'error' | 'warning' | 'info'
   * @param {object} position - 顯示位置 { x, y }，null 則顯示於螢幕中央
   */
  show(message, type = 'error', position = null) {
    this.queue.push({
      message,
      type,
      timer: 0,
      duration: 2000,
      position: position || { x: 480, y: 300 },
      enterProgress: 0 // 進場動畫進度追蹤（0-1）
    });
  },

  update(dt) {
    if (!this.current && this.queue.length > 0) {
      this.current = this.queue.shift();
    }

    if (this.current) {
      this.current.timer += dt;
      if (this.current.timer >= this.current.duration) {
        this.current = null;
      }
    }
  },

  render(ctx) {
    if (!this.current) return;

    const n = this.current;
    const x = n.position.x;
    const y = n.position.y;

    // 進場/離場動畫時間設定
    const enterTime = 400; // 進場時間延長到 400ms，展現彈跳效果
    const exitTime = 300;  // 離場時間保持 300ms

    // 更新進場進度（在 update 中累加會更流暢，但這裡也可直接計算）
    let offsetY = 0;
    let alpha = 1;

    if (n.timer < enterTime) {
      // 進場動畫：使用 bounce 緩動（彈跳效果）
      const enterProgress = n.timer / enterTime;
      const easedEnter = DK.MathCache.easing.bounce(enterProgress);
      offsetY = -50 * (1 - easedEnter);
      alpha = easedEnter;
    } else if (n.timer > n.duration - exitTime) {
      // 離場動畫：使用 smoothstep 緩動（平滑淡出）
      const exitProgress = (n.timer - (n.duration - exitTime)) / exitTime;
      const easedExit = DK.MathCache.easing.smoothstep(exitProgress);
      offsetY = -50 * easedExit;
      alpha = 1 - easedExit;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(0, offsetY);

    // 背景框（根據類型變色）
    const colors = {
      error: { bg: '#6e3e3e', border: '#ff4444', icon: '❌' },
      warning: { bg: '#6e5e3e', border: '#ffaa44', icon: '⚠️' },
      info: { bg: '#3e4e6e', border: '#4488ff', icon: 'ℹ️' }
    };
    const style = colors[n.type];

    const w = 300, h = 60;

    // 背景
    ctx.fillStyle = style.bg;
    ctx.fillRect(x - w/2, y - h/2, w, h);

    // 邊框（脈動）- 使用快取的三角函式
    const MC = DK.MathCache;
    const pulse = MC.sinTime(n.timer, 1/200) * 0.3 + 0.7;
    ctx.strokeStyle = style.border;
    ctx.lineWidth = 3 * pulse;
    ctx.strokeRect(x - w/2, y - h/2, w, h);

    // 圖標
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f0e8d8';
    ctx.fillText(style.icon, x - 120, y - 15);

    // 訊息文字（支援多行，使用 \n 分隔）
    const lines = n.message.split('\n');
    ctx.font = DK.FONTS.bold(14);
    ctx.fillStyle = '#f0e8d8';
    ctx.textAlign = 'left';

    const lineHeight = 18;
    const startY = y - ((lines.length - 1) * lineHeight) / 2 - 5;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // 第二行（建議）使用較小字體和不同顏色
      if (i > 0 && line.startsWith('💡')) {
        ctx.font = DK.FONTS.body(12);
        ctx.fillStyle = '#ffcc88';
      }
      ctx.fillText(line, x - 90, startY + i * lineHeight);
    }

    ctx.restore();
  }
};
