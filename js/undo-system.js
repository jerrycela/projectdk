/**
 * Dungeon Keep - Undo System
 * Ctrl+Z 撤銷系統，允許玩家撤銷最近的操作
 *
 * 支援操作類型：
 * - trap_placed: 陷阱放置
 * - trap_upgraded: 陷阱升級（進化）
 * - hero_summoned: 英雄召喚
 *
 * 限制：
 * - 僅在 PLANNING 階段可撤銷
 * - INVASION 階段禁用撤銷（遊戲已開始）
 * - 最多保留 20 步操作歷史
 */
window.DK = window.DK || {};

DK.UndoSystem = {
  history: [],        // 操作歷史陣列
  maxHistory: 20,     // 最多保留 20 步
  enabled: true,      // 是否啟用撤銷系統

  /**
   * 初始化撤銷系統
   */
  init() {
    this.history = [];
    this.enabled = true;

    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', 'UndoSystem initialized');
    }
  },

  /**
   * 記錄一個操作到歷史
   * @param {Object} action - 操作物件
   * @param {string} action.type - 操作類型
   * @param {*} action.data - 操作相關數據
   */
  record(action) {
    if (!this.enabled) return;

    // 檢查階段：只在 PLANNING 階段記錄
    if (DK.Game.state !== 'planning') {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.log('warning', 'Cannot record action outside planning phase', {
          state: DK.Game.state
        });
      }
      return;
    }

    // 添加時間戳
    const timestampedAction = {
      ...action,
      timestamp: Date.now()
    };

    this.history.push(timestampedAction);

    // 限制歷史長度
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', `Action recorded: ${action.type}`, {
        historyLength: this.history.length
      });
    }
  },

  /**
   * 撤銷最後一步操作
   * @returns {boolean} 是否成功撤銷
   */
  undo() {
    // 檢查階段：只在 PLANNING 階段可撤銷
    if (DK.Game.state !== 'planning') {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.showError('undo_wrong_phase', { state: DK.Game.state });
      }
      return false;
    }

    // 檢查歷史是否為空
    if (this.history.length === 0) {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.log('warning', 'No action to undo');
      }
      // 顯示提示訊息
      if (DK.UI && DK.UI.ErrorNotification) {
        DK.UI.ErrorNotification.show('沒有可撤銷的操作', 'info');
      }
      return false;
    }

    // 取出最後一個操作
    const action = this.history.pop();

    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', `Undoing action: ${action.type}`);
    }

    // 執行撤銷
    const success = this._executeUndo(action);

    if (success) {
      // 顯示成功訊息
      if (DK.UI && DK.UI.ErrorNotification) {
        const message = this._getUndoMessage(action);
        DK.UI.ErrorNotification.show(message, 'info');
      }
    }

    return success;
  },

  /**
   * 執行撤銷動作
   * @param {Object} action - 要撤銷的操作
   * @returns {boolean} 是否成功
   */
  _executeUndo(action) {
    switch (action.type) {
      case 'trap_placed':
        return this._undoTrapPlaced(action);

      case 'trap_upgraded':
        return this._undoTrapUpgraded(action);

      case 'hero_summoned':
        return this._undoHeroSummoned(action);

      default:
        if (DK.ErrorHandler) {
          DK.ErrorHandler.log('error', `Unknown action type: ${action.type}`);
        }
        return false;
    }
  },

  /**
   * 撤銷陷阱放置
   */
  _undoTrapPlaced(action) {
    const { trap, cost } = action;

    if (!trap || !DK.Traps) return false;

    // 找到陷阱（使用位置匹配）
    const trapIndex = DK.Traps.placed.findIndex(
      t => t.col === trap.col && t.row === trap.row && t.type.id === trap.type.id
    );

    if (trapIndex === -1) {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.log('error', 'Trap not found for undo', { trap });
      }
      return false;
    }

    // 移除陷阱
    DK.Traps.placed.splice(trapIndex, 1);

    // 退還金幣
    if (DK.Game) {
      DK.Game.gold += cost;
    }

    // 清除 UI 選擇
    if (DK.UI) {
      DK.UI.selectedPlacedTrap = null;
    }

    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', `Trap removed: ${trap.type.name}`, {
        col: trap.col,
        row: trap.row,
        refund: cost
      });
    }

    return true;
  },

  /**
   * 撤銷陷阱升級（進化）
   */
  _undoTrapUpgraded(action) {
    const { trap, evolutionType, cost } = action;

    if (!trap || !DK.Traps) return false;

    // 找到陷阱
    const placedTrap = DK.Traps.placed.find(
      t => t.col === trap.col && t.row === trap.row
    );

    if (!placedTrap) {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.log('error', 'Trap not found for downgrade', { trap });
      }
      return false;
    }

    // 降級陷阱（還原進化）
    placedTrap.evolved = false;
    placedTrap.evolutionType = null;

    // 退還金幣
    if (DK.Game) {
      DK.Game.gold += cost;
    }

    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', `Trap downgraded: ${trap.type.name}`, {
        col: trap.col,
        row: trap.row,
        refund: cost
      });
    }

    return true;
  },

  /**
   * 撤銷英雄召喚
   */
  _undoHeroSummoned(action) {
    const { hero, cost } = action;

    if (!hero || !DK.Heroes) return false;

    // 找到英雄（使用 ID 或位置匹配）
    let heroIndex = -1;
    if (hero.id) {
      heroIndex = DK.Heroes.active.findIndex(h => h.id === hero.id);
    } else {
      heroIndex = DK.Heroes.active.findIndex(
        h => h.col === hero.col && h.row === hero.row && h.type.id === hero.type.id
      );
    }

    if (heroIndex === -1) {
      if (DK.ErrorHandler) {
        DK.ErrorHandler.log('error', 'Hero not found for undo', { hero });
      }
      return false;
    }

    // 移除英雄
    const removedHero = DK.Heroes.active[heroIndex];
    DK.Heroes.active.splice(heroIndex, 1);

    // 清除選擇
    if (DK.Heroes.selectedHero === removedHero) {
      DK.Heroes.selectedHero = null;
    }

    // 退還金幣
    if (DK.Game) {
      DK.Game.gold += cost;
    }

    // 播放回收特效
    if (DK.Game && DK.Game.effects) {
      DK.Game.effects.push({
        type: 'hero_recall',
        x: removedHero.x,
        y: removedHero.y,
        timer: 0,
        duration: 400,
        element: removedHero.type.element,
      });
    }

    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', `Hero removed: ${hero.type.name}`, {
        col: hero.col,
        row: hero.row,
        refund: cost
      });
    }

    return true;
  },

  /**
   * 取得撤銷成功訊息
   */
  _getUndoMessage(action) {
    switch (action.type) {
      case 'trap_placed':
        return `已撤銷：放置 ${action.trap.type.name}`;
      case 'trap_upgraded':
        return `已撤銷：升級 ${action.trap.type.name}`;
      case 'hero_summoned':
        return `已撤銷：召喚 ${action.hero.type.name}`;
      default:
        return '已撤銷操作';
    }
  },

  /**
   * 清空歷史
   */
  clear() {
    this.history = [];

    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', 'Undo history cleared');
    }
  },

  /**
   * 取得歷史長度
   */
  getHistoryLength() {
    return this.history.length;
  },

  /**
   * 啟用/禁用撤銷系統
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    if (DK.ErrorHandler) {
      DK.ErrorHandler.log('info', `UndoSystem ${enabled ? 'enabled' : 'disabled'}`);
    }
  }
};
