/**
 * Dungeon Keep - UI Tooltip System
 * 統一 Tooltip 系統 - 為陷阱、英雄、敵人、UI 按鈕提供詳細資訊提示
 *
 * 設計原則：
 * - 卡片式背景（半透明深色）
 * - 清晰的標題與內容分層
 * - 圖示 + 文字組合
 * - 適當的留白與間距
 * - 自動邊界檢測（不超出螢幕）
 */
window.DK = window.DK || {};

DK.Tooltip = {
  // 當前顯示的 tooltip
  current: null,

  /**
   * 顯示 tooltip
   * @param {string} type - 'trap', 'hero', 'enemy', 'button'
   * @param {object} data - 相關資料物件
   * @param {number} x - 滑鼠 X 座標
   * @param {number} y - 滑鼠 Y 座標
   */
  show(type, data, x, y) {
    this.current = {
      type,
      data,
      x,
      y
    };
  },

  /**
   * 隱藏 tooltip
   */
  hide() {
    this.current = null;
  },

  /**
   * 渲染 tooltip（在 main.js 的 UI 渲染層呼叫）
   * @param {CanvasRenderingContext2D} ctx - 高解析度 UI canvas context
   * @param {number} canvasWidth - Canvas 寬度
   * @param {number} canvasHeight - Canvas 高度
   */
  render(ctx, canvasWidth, canvasHeight) {
    if (!this.current) return;

    const { type, data, x, y } = this.current;

    switch (type) {
      case 'trap':
        this._renderTrapTooltip(ctx, data, x, y, canvasWidth, canvasHeight);
        break;
      case 'hero':
        this._renderHeroTooltip(ctx, data, x, y, canvasWidth, canvasHeight);
        break;
      case 'enemy':
        this._renderEnemyTooltip(ctx, data, x, y, canvasWidth, canvasHeight);
        break;
      case 'button':
        this._renderButtonTooltip(ctx, data, x, y, canvasWidth, canvasHeight);
        break;
    }
  },

  /**
   * 已放置陷阱 Tooltip
   * 顯示：陷阱名稱 + 等級 + 當前傷害/效果 + 觸發次數統計 + 升級按鈕（如可升級）
   */
  _renderTrapTooltip(ctx, trap, x, y, cw, ch) {
    const padX = 14;
    const padY = 12;
    const lineHeight = 18;
    const titleHeight = 24;

    // 構建內容
    const lines = [];

    // 標題：陷阱名稱
    const trapName = trap.type ? trap.type.name : '陷阱';
    const isEvolved = !!trap.evolved;
    lines.push({
      text: trapName + (isEvolved ? ' ★' : ''),
      font: DK.FONTS.bold(15),
      color: isEvolved ? '#ffcc44' : '#ffd966',
      isTitle: true
    });

    // 類型
    const trapType = trap.type ? (trap.type.type === 'floor' ? '地板陷阱' : '牆壁陷阱') : '陷阱';
    lines.push({ text: `類型：${trapType}`, font: DK.FONTS.body(11), color: '#c0b090' });

    // 當前傷害/效果
    if (trap.type) {
      if (trap.type.damage > 0) {
        lines.push({ text: `傷害：${trap.type.damage}`, font: DK.FONTS.body(11), color: '#ff8866' });
      }
      if (trap.type.pushForce) {
        lines.push({ text: `推力：${trap.type.pushForce}`, font: DK.FONTS.body(11), color: '#ffaa66' });
      }
      if (trap.type.range > 0) {
        lines.push({ text: `範圍：${trap.type.range} 格`, font: DK.FONTS.body(11), color: '#88ccff' });
      }
    }

    // 觸發次數統計（未來可擴充）
    // lines.push({ text: `觸發：0 次`, font: DK.FONTS.body(10), color: '#a0a090' });

    // 升級提示
    if (!isEvolved && DK.Traps) {
      const evoInfo = DK.Traps.getEvolutionForTrap ? DK.Traps.getEvolutionForTrap(trap) : null;
      const auraHero = DK.Traps.getAuraHeroForTrap ? DK.Traps.getAuraHeroForTrap(trap) : null;

      if (evoInfo && auraHero) {
        lines.push({ text: '', font: DK.FONTS.body(1), color: '#000' }); // 空行
        lines.push({ text: `可升級至：${evoInfo.name}`, font: DK.FONTS.body(11), color: '#88ff88' });
        lines.push({ text: `成本：${evoInfo.cost} 金`, font: DK.FONTS.body(10), color: '#ffcc44' });
      } else if (evoInfo && !auraHero) {
        lines.push({ text: '', font: DK.FONTS.body(1), color: '#000' }); // 空行
        lines.push({ text: '需要對應英雄光環才能升級', font: DK.FONTS.body(10), color: '#ff8866' });
      }
    }

    // 描述
    if (trap.type && trap.type.description) {
      lines.push({ text: '', font: DK.FONTS.body(1), color: '#000' }); // 空行
      lines.push({ text: trap.type.description, font: DK.FONTS.body(10), color: '#a0a090', italic: true });
    }

    // 計算尺寸
    const maxWidth = Math.max(...lines.map(line => {
      ctx.font = line.font;
      return ctx.measureText(line.text).width;
    }));
    const tipW = Math.max(180, maxWidth + padX * 2);
    const tipH = titleHeight + (lines.length - 1) * lineHeight + padY * 2;

    // 邊界檢測並調整位置
    let tipX = x + 15;
    let tipY = y + 15;
    if (tipX + tipW > cw) tipX = x - tipW - 5;
    if (tipY + tipH > ch) tipY = y - tipH - 5;
    tipX = Math.max(4, Math.min(cw - tipW - 4, tipX));
    tipY = Math.max(44, Math.min(ch - tipH - 4, tipY)); // 不蓋住 HUD

    // 繪製卡片背景
    ctx.fillStyle = 'rgba(18,16,30,0.96)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = '#6a5a8a';
    ctx.lineWidth = 2;
    ctx.strokeRect(tipX + 1, tipY + 1, tipW - 2, tipH - 2);

    // 繪製標題底色
    ctx.fillStyle = 'rgba(80,60,100,0.4)';
    ctx.fillRect(tipX + 2, tipY + 2, tipW - 4, titleHeight - 2);

    // 繪製文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let currentY = tipY + padY;
    lines.forEach((line, i) => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      if (line.italic) ctx.font = ctx.font.replace('normal', 'italic');
      ctx.fillText(line.text, tipX + padX, currentY);
      currentY += line.isTitle ? titleHeight : lineHeight;
    });
  },

  /**
   * 英雄 Tooltip
   * 顯示：英雄名稱 + 等級 + HP/最大HP + 攻擊力/攻速 + 當前狀態 + 元素光環範圍
   */
  _renderHeroTooltip(ctx, hero, x, y, cw, ch) {
    const padX = 14;
    const padY = 12;
    const lineHeight = 18;
    const titleHeight = 24;

    // 構建內容
    const lines = [];

    // 標題：英雄名稱
    const heroName = hero.type ? hero.type.name : '英雄';
    lines.push({
      text: heroName,
      font: DK.FONTS.bold(15),
      color: '#4488ff',
      isTitle: true
    });

    // HP
    const hpCurrent = Math.ceil(hero.hp || 0);
    const hpMax = hero.type ? hero.type.hp : 100;
    const hpPercent = Math.floor((hpCurrent / hpMax) * 100);
    const hpColor = hpPercent > 60 ? '#88ff88' : hpPercent > 30 ? '#ffcc44' : '#ff6666';
    lines.push({ text: `HP：${hpCurrent} / ${hpMax} (${hpPercent}%)`, font: DK.FONTS.body(11), color: hpColor });

    // 攻擊力/攻速
    if (hero.type) {
      lines.push({ text: `攻擊力：${hero.type.damage}`, font: DK.FONTS.body(11), color: '#ff8866' });
      lines.push({ text: `射程：${hero.type.range} 格`, font: DK.FONTS.body(11), color: '#88ccff' });
    }

    // 當前狀態
    let statusText = '待命';
    let statusColor = '#aaa090';
    if (hero.movingToTarget) {
      statusText = '移動中';
      statusColor = '#88aaff';
    } else if (hero.attackTarget) {
      statusText = '攻擊中';
      statusColor = '#ff8866';
    }
    lines.push({ text: `狀態：${statusText}`, font: DK.FONTS.body(11), color: statusColor });

    // 元素光環範圍
    if (hero.type && hero.type.element) {
      const elementName = { water: '水', fire: '火', ice: '冰' }[hero.type.element] || hero.type.element;
      const auraRange = 3; // 預設光環範圍
      lines.push({ text: '', font: DK.FONTS.body(1), color: '#000' }); // 空行
      lines.push({ text: `元素：${elementName}`, font: DK.FONTS.body(11), color: '#aa88ff' });
      lines.push({ text: `光環範圍：${auraRange} 格`, font: DK.FONTS.body(10), color: '#8888cc' });
    }

    // 計算尺寸
    const maxWidth = Math.max(...lines.map(line => {
      ctx.font = line.font;
      return ctx.measureText(line.text).width;
    }));
    const tipW = Math.max(180, maxWidth + padX * 2);
    const tipH = titleHeight + (lines.length - 1) * lineHeight + padY * 2;

    // 邊界檢測並調整位置
    let tipX = x + 15;
    let tipY = y + 15;
    if (tipX + tipW > cw) tipX = x - tipW - 5;
    if (tipY + tipH > ch) tipY = y - tipH - 5;
    tipX = Math.max(4, Math.min(cw - tipW - 4, tipX));
    tipY = Math.max(44, Math.min(ch - tipH - 4, tipY));

    // 繪製卡片背景
    ctx.fillStyle = 'rgba(18,16,30,0.96)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(tipX + 1, tipY + 1, tipW - 2, tipH - 2);

    // 繪製標題底色
    ctx.fillStyle = 'rgba(40,80,150,0.4)';
    ctx.fillRect(tipX + 2, tipY + 2, tipW - 4, titleHeight - 2);

    // 繪製文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let currentY = tipY + padY;
    lines.forEach((line, i) => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, tipX + padX, currentY);
      currentY += line.isTitle ? titleHeight : lineHeight;
    });
  },

  /**
   * 敵人 Tooltip
   * 顯示：敵人類型 + HP/最大HP + 移動速度 + 攜帶金幣
   */
  _renderEnemyTooltip(ctx, enemy, x, y, cw, ch) {
    const padX = 14;
    const padY = 12;
    const lineHeight = 18;
    const titleHeight = 24;

    // 構建內容
    const lines = [];

    // 標題：敵人類型
    const enemyName = enemy.typeDef ? enemy.typeDef.name : '敵人';
    lines.push({
      text: enemyName,
      font: DK.FONTS.bold(15),
      color: '#ff6666',
      isTitle: true
    });

    // HP
    const hpCurrent = Math.ceil(enemy.hp || 0);
    const hpMax = enemy.typeDef ? enemy.typeDef.hp : 100;
    const hpPercent = Math.floor((hpCurrent / hpMax) * 100);
    const hpColor = hpPercent > 60 ? '#ff8866' : hpPercent > 30 ? '#ffaa44' : '#ffcc88';
    lines.push({ text: `HP：${hpCurrent} / ${hpMax} (${hpPercent}%)`, font: DK.FONTS.body(11), color: hpColor });

    // 移動速度
    if (enemy.typeDef) {
      const speedLabel = enemy.typeDef.speed >= 40 ? '快速' : enemy.typeDef.speed >= 25 ? '中速' : '緩慢';
      lines.push({ text: `速度：${speedLabel} (${enemy.typeDef.speed})`, font: DK.FONTS.body(11), color: '#88aaff' });
    }

    // 攜帶金幣
    if (enemy.typeDef && enemy.typeDef.gold) {
      lines.push({ text: `金幣：${enemy.typeDef.gold}`, font: DK.FONTS.body(11), color: '#ffcc44' });
    }

    // 計算尺寸
    const maxWidth = Math.max(...lines.map(line => {
      ctx.font = line.font;
      return ctx.measureText(line.text).width;
    }));
    const tipW = Math.max(160, maxWidth + padX * 2);
    const tipH = titleHeight + (lines.length - 1) * lineHeight + padY * 2;

    // 邊界檢測並調整位置
    let tipX = x + 15;
    let tipY = y + 15;
    if (tipX + tipW > cw) tipX = x - tipW - 5;
    if (tipY + tipH > ch) tipY = y - tipH - 5;
    tipX = Math.max(4, Math.min(cw - tipW - 4, tipX));
    tipY = Math.max(44, Math.min(ch - tipH - 4, tipY));

    // 繪製卡片背景
    ctx.fillStyle = 'rgba(18,16,30,0.96)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 2;
    ctx.strokeRect(tipX + 1, tipY + 1, tipW - 2, tipH - 2);

    // 繪製標題底色
    ctx.fillStyle = 'rgba(150,40,40,0.4)';
    ctx.fillRect(tipX + 2, tipY + 2, tipW - 4, titleHeight - 2);

    // 繪製文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let currentY = tipY + padY;
    lines.forEach((line, i) => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, tipX + padX, currentY);
      currentY += line.isTitle ? titleHeight : lineHeight;
    });
  },

  /**
   * UI 按鈕 Tooltip
   * 顯示：功能說明 + 快捷鍵（如有） + 花費（如需要）
   */
  _renderButtonTooltip(ctx, button, x, y, cw, ch) {
    const padX = 12;
    const padY = 10;
    const lineHeight = 16;

    // 構建內容
    const lines = [];

    // 功能說明
    if (button.description) {
      lines.push({ text: button.description, font: DK.FONTS.body(12), color: '#e8e0d0' });
    }

    // 快捷鍵
    if (button.hotkey) {
      lines.push({ text: `快捷鍵：${button.hotkey}`, font: DK.FONTS.body(10), color: '#88aaff' });
    }

    // 花費
    if (button.cost) {
      lines.push({ text: `花費：${button.cost} 金`, font: DK.FONTS.body(10), color: '#ffcc44' });
    }

    // 計算尺寸
    const maxWidth = Math.max(...lines.map(line => {
      ctx.font = line.font;
      return ctx.measureText(line.text).width;
    }));
    const tipW = Math.max(120, maxWidth + padX * 2);
    const tipH = lines.length * lineHeight + padY * 2;

    // 邊界檢測並調整位置
    let tipX = x + 15;
    let tipY = y + 15;
    if (tipX + tipW > cw) tipX = x - tipW - 5;
    if (tipY + tipH > ch) tipY = y - tipH - 5;
    tipX = Math.max(4, Math.min(cw - tipW - 4, tipX));
    tipY = Math.max(44, Math.min(ch - tipH - 4, tipY));

    // 繪製卡片背景
    ctx.fillStyle = 'rgba(18,16,30,0.95)';
    ctx.fillRect(tipX, tipY, tipW, tipH);
    ctx.strokeStyle = '#6a5a8a';
    ctx.lineWidth = 1;
    ctx.strokeRect(tipX + 0.5, tipY + 0.5, tipW - 1, tipH - 1);

    // 繪製文字
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    let currentY = tipY + padY;
    lines.forEach(line => {
      ctx.font = line.font;
      ctx.fillStyle = line.color;
      ctx.fillText(line.text, tipX + padX, currentY);
      currentY += lineHeight;
    });
  }
};
