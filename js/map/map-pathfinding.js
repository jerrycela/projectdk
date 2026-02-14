/**
 * Dungeon Keep - 地圖尋路系統
 * 管理距離場計算、路徑尋找與路徑預覽
 */

// BFS 從地心出發，建立距離場
DK.Map.computeDistanceField = function() {
  const rows = this.layout.length;
  const cols = this.layout[0].length;

  // 初始化所有格為 -1（不可達）
  const field = [];
  for (let r = 0; r < rows; r++) {
    field[r] = [];
    for (let c = 0; c < cols; c++) {
      field[r][c] = -1;
    }
  }

  if (!this.heartPos) {
    this.distanceField = field;
    return;
  }

  // 從地心（2x2 的所有 4 格）開始 BFS
  const queue = [];
  const hc = this.heartPos.col;
  const hr = this.heartPos.row;

  // 地心佔 2x2 格，4 個格都設為 0
  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      const r = hr + dr;
      const c = hc + dc;
      field[r][c] = 0;
      queue.push({ col: c, row: r, dist: 0 });
    }
  }

  const dirs = [
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
  ];

  while (queue.length > 0) {
    const { col, row, dist } = queue.shift();

    for (const d of dirs) {
      const nc = col + d.dc;
      const nr = row + d.dr;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (field[nr][nc] !== -1) continue;

      // 可行走格（含深淵橋、草叢、水潭、地心）
      const tile = this.layout[nr][nc];
      if (tile !== '.' && tile !== 'E' && tile !== 'X' && tile !== 'P' && tile !== 'G' && tile !== 'H') continue;

      // 檢查路障（視為阻擋）
      if (this.hasBarricade(nc, nr)) continue;

      // 召喚物不阻擋路徑（一隻召喚物只能阻擋一個敵人，所以其他敵人可以經過）

      field[nr][nc] = dist + 1;
      queue.push({ col: nc, row: nr, dist: dist + 1 });
    }
  }

  this.distanceField = field;
};

// BFS 穿透路障計算距離場（用於英雄無視路障時的路徑）
DK.Map.computeDistanceFieldThrough = function() {
  const rows = this.layout.length;
  const cols = this.layout[0].length;

  const field = [];
  for (let r = 0; r < rows; r++) {
    field[r] = [];
    for (let c = 0; c < cols; c++) {
      field[r][c] = -1;
    }
  }

  if (!this.heartPos) {
    this.distanceFieldThrough = field;
    return;
  }

  const queue = [];
  const hc = this.heartPos.col;
  const hr = this.heartPos.row;

  for (let dr = 0; dr < 2; dr++) {
    for (let dc = 0; dc < 2; dc++) {
      const r = hr + dr;
      const c = hc + dc;
      field[r][c] = 0;
      queue.push({ col: c, row: r, dist: 0 });
    }
  }

  const dirs = [
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
  ];

  while (queue.length > 0) {
    const { col, row, dist } = queue.shift();

    for (const d of dirs) {
      const nc = col + d.dc;
      const nr = row + d.dr;

      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (field[nr][nc] !== -1) continue;

      const tile = this.layout[nr][nc];
      // 可破壞地圖物件在穿透距離場中視為可行走（敵人可規劃攻擊路線）
      const isDestructibleObj = DK.MAP_OBJECTS && DK.MAP_OBJECTS[tile] && DK.MAP_OBJECTS[tile].type === 'destructible';
      if (tile !== '.' && tile !== 'E' && tile !== 'X' && tile !== 'P' && tile !== 'G' && tile !== 'H' && !isDestructibleObj) continue;

      // 不檢查路障（穿透模式）

      field[nr][nc] = dist + 1;
      queue.push({ col: nc, row: nr, dist: dist + 1 });
    }
  }

  this.distanceFieldThrough = field;
};

// 根據距離場回傳 (col,row) 下一步該往哪走
DK.Map.getNextStep = function(col, row) {
  if (!this.distanceField) return { col, row };

  const cur = this.distanceField[row]?.[col];
  if (cur === undefined || cur <= 0) return { col, row };

  const dirs = [
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
  ];

  let bestDir = null;
  let bestDist = cur;

  for (const d of dirs) {
    const nc = col + d.dc;
    const nr = row + d.dr;
    const dist = this.distanceField[nr]?.[nc];
    if (dist !== undefined && dist >= 0 && dist < bestDist) {
      bestDist = dist;
      bestDir = { nc, nr };
    }
  }

  return bestDir ? { col: bestDir.nc, row: bestDir.nr } : { col, row };
};

// 穿透距離場的下一步（無視路障）
DK.Map.getNextStepThrough = function(col, row) {
  if (!this.distanceFieldThrough) return { col, row };

  const cur = this.distanceFieldThrough[row]?.[col];
  if (cur === undefined || cur <= 0) return { col, row };

  const dirs = [
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
  ];

  let bestDir = null;
  let bestDist = cur;

  for (const d of dirs) {
    const nc = col + d.dc;
    const nr = row + d.dr;
    const dist = this.distanceFieldThrough[nr]?.[nc];
    if (dist !== undefined && dist >= 0 && dist < bestDist) {
      bestDist = dist;
      bestDir = { nc, nr };
    }
  }

  return bestDir ? { col: bestDir.nc, row: bestDir.nr } : { col, row };
};

// 重新計算距離場 + 路徑預覽（放置/移除陷阱或路障時調用）
DK.Map.recomputeFields = function() {
  this.computeDistanceField();
  this.computeDistanceFieldThrough();
  this.recomputePathPreview();

  // 清除路徑快取
  if (DK.PathCache) {
    DK.PathCache.invalidate();
  }
};

// 計算從每個洞口到地心的路徑（用於預覽）
DK.Map.recomputePathPreview = function() {
  this.pathPreviewCache = [];

  if (!this.portals || this.portals.length === 0) return;

  for (const portal of this.portals) {
    // 跳過出口類型傳送門（如果有的話）
    if (portal.type === 'exit') continue;

    // 支援新格式（entrance）和舊格式（col/row）
    const portalCol = portal.entrance ? portal.entrance.x : portal.col;
    const portalRow = portal.entrance ? portal.entrance.y : portal.row;

    // 使用距離場回推路徑
    const path = [];
    let current = { col: portalCol, row: portalRow };
    const maxSteps = 1000;
    let steps = 0;

    while (steps < maxSteps) {
      const dist = this.distanceField[current.row]?.[current.col];
      if (dist === undefined || dist < 0) break;
      if (dist === 0) break;

      path.push({ col: current.col, row: current.row });
      const next = this.getNextStep(current.col, current.row);
      if (next.col === current.col && next.row === current.row) break;
      current = next;
      steps++;
    }

    this.pathPreviewCache.push({ hole: { col: portalCol, row: portalRow }, path });
  }
};

// 計算深淵推力方向（英雄在 A 格上時的推力）
DK.Map.getPushDirection = function(col, row) {
  const dirs = [
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
  ];

  for (const d of dirs) {
    const nc = col + d.dc;
    const nr = row + d.dr;
    const tile = this.getTile(nc, nr);
    if (tile === '.' || tile === 'E' || tile === 'X' || tile === 'P' || tile === 'G' || tile === 'H') {
      return { dc: d.dc, dr: d.dr };
    }
  }

  return null;
};

// 取得草叢狀態
DK.Map.getGrassState = function(col, row) {
  const key = `${col},${row}`;
  return this.grassState[key] || { state: 'normal', timer: 0 };
};

// 點燃草叢（火焰陷阱觸發）
DK.Map.igniteGrass = function(col, row) {
  if (!this.isGrass(col, row)) return;

  const key = `${col},${row}`;
  const currentState = this.grassState[key];

  if (currentState && currentState.state === 'burning') {
    return;
  }

  // 設定為燃燒狀態（3 秒燒完）
  this.grassState[key] = {
    state: 'burning',
    timer: 3.0,
  };

  // 延伸點燃：相鄰草叢（向上下左右四個方向擴散）
  const dirs = [
    { dc: -1, dr: 0 },
    { dc: 1, dr: 0 },
    { dc: 0, dr: -1 },
    { dc: 0, dr: 1 },
  ];

  for (const d of dirs) {
    const nc = col + d.dc;
    const nr = row + d.dr;
    if (this.isGrass(nc, nr)) {
      const nkey = `${nc},${nr}`;
      const nState = this.grassState[nkey];
      if (!nState || nState.state === 'normal') {
        setTimeout(() => {
          this.igniteGrass(nc, nr);
        }, 500);
      }
    }
  }
};

// 更新草叢狀態（每幀調用）
DK.Map.updateGrass = function(dt) {
  for (const key in this.grassState) {
    const state = this.grassState[key];
    if (state.state === 'burning') {
      state.timer -= dt;
      if (state.timer <= 0) {
        state.state = 'scorched';
        state.timer = 0;
      }
    }
  }
};
