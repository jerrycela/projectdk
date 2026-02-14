/**
 * ProjectDK - 門系統
 * 職責：門的生命週期管理、碰撞檢測、敵人攻擊處理
 */

DK.Doors = {
  // 門實例陣列
  doors: [],

  /**
   * 初始化門系統（從關卡數據載入）
   */
  init(levelData) {
    this.doors = [];

    if (!levelData.layout) return;

    // 掃描地圖，找出所有門地磚
    for (let row = 0; row < levelData.layout.length; row++) {
      const rowStr = levelData.layout[row];
      for (let col = 0; col < rowStr.length; col++) {
        const tile = rowStr[col];

        if (tile === 'D' || tile === 'I' || tile === 'Z') {
          // 判斷門類型
          let doorType = 'wooden';
          if (tile === 'I') doorType = 'iron';
          if (tile === 'Z') doorType = 'magic';

          const config = DK.DOOR_TYPES[doorType];

          this.doors.push({
            id: `door-${col}-${row}`,
            type: doorType,
            col: col,
            row: row,
            hp: config.maxHp,
            maxHp: config.maxHp,
            defense: config.defense,
            isLocked: true,      // 預設鎖上
            isOpen: false,       // 是否已破壞
            unlockCondition: null,
            damageFlash: 0       // 受傷閃爍計時器
          });
        }
      }
    }

    if (DK.DEBUG_MODE) {
      DK.ErrorHandler.log('info', `Doors initialized: ${this.doors.length} doors`);
    }
  },

  /**
   * 更新門狀態
   */
  update(dt) {
    this.doors.forEach(door => {
      // 更新受傷閃爍計時器
      if (door.damageFlash > 0) {
        door.damageFlash -= dt;
      }

      // 檢查門是否被破壞
      if (door.hp <= 0 && !door.isOpen) {
        door.isOpen = true;
      }
    });
  },

  /**
   * 渲染所有門
   */
  render(ctx) {
    const T = DK.CONFIG.TILE_SIZE;
    const offsetX = DK.Game.camera.x;
    const offsetY = DK.Game.camera.y;

    this.doors.forEach(door => {
      if (door.isOpen) return; // 已破壞的門不渲染

      const screenX = door.col * T - offsetX;
      const screenY = door.row * T - offsetY;

      // 繪製門地磚
      DK.Map.drawDoorTile(ctx, screenX, screenY, door.type, door.isLocked);

      // 受傷閃爍效果
      if (door.damageFlash > 0) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(screenX, screenY, T, T);
        ctx.restore();
      }

      // 繪製血條（HP < 100% 時）
      const hpPercent = door.hp / door.maxHp;
      if (hpPercent < 1.0) {
        const barWidth = 12;
        const barHeight = 2;
        const barX = screenX + 2;
        const barY = screenY + 1;

        // 背景
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // HP
        const color = hpPercent > 0.5 ? '#44ff44' : hpPercent > 0.25 ? '#ffaa44' : '#ff4444';
        ctx.fillStyle = color;
        ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
      }
    });
  },

  /**
   * 敵人攻擊最近的門
   */
  damageNearestDoor(col, row, damage) {
    const door = this.getDoorAt(col, row);
    if (!door || door.isOpen) return false;

    // 計算實際傷害（防禦力減免）
    const actualDamage = Math.max(1, damage - door.defense);
    door.hp -= actualDamage;
    door.damageFlash = 200; // 200ms 閃爍

    return true;
  },

  /**
   * 獲取指定位置的門
   */
  getDoorAt(col, row) {
    return this.doors.find(d => d.col === col && d.row === row && !d.isOpen);
  },

  /**
   * 檢查路徑是否被鎖上的門阻擋
   */
  isPathBlocked(col, row) {
    const door = this.getDoorAt(col, row);
    return door && door.isLocked;
  },

  /**
   * 檢查解鎖條件（未來擴展：時間/鑰匙/開關）
   */
  checkUnlockCondition(door) {
    if (!door.unlockCondition) return false;

    // TODO: 實作解鎖條件檢查
    // 例如：時間到達、擁有鑰匙、開關觸發等
    return false;
  },

  /**
   * 解鎖門
   */
  unlockDoor(doorId) {
    const door = this.doors.find(d => d.id === doorId);
    if (door) {
      door.isLocked = false;
    }
  },

  /**
   * 清空所有門
   */
  clear() {
    this.doors = [];
  }
};
