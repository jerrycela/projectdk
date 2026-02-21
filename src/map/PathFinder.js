/**
 * 路徑尋找器
 * 從起點到終點建立路徑點陣列
 */

import { LEVEL_1, findSpawnPoint, findExitPoint } from './level1.js';

// 可行走的格子類型
const WALKABLE = ['.', 'S', 'E'];

/**
 * 使用 BFS 找出從起點到終點的路徑
 */
export function findPath(map) {
  const spawn = findSpawnPoint(map);
  const exit = findExitPoint(map);

  if (!spawn || !exit) {
    console.error('找不到起點或終點');
    return [];
  }

  // BFS 搜尋
  const queue = [{ x: spawn.x, y: spawn.y, path: [{ x: spawn.x, y: spawn.y }] }];
  const visited = new Set();
  visited.add(`${spawn.x},${spawn.y}`);

  const directions = [
    { dx: 0, dy: -1 },  // 上
    { dx: 0, dy: 1 },   // 下
    { dx: -1, dy: 0 },  // 左
    { dx: 1, dy: 0 }    // 右
  ];

  while (queue.length > 0) {
    const current = queue.shift();

    // 找到終點
    if (map[current.y][current.x] === 'E') {
      return current.path;
    }

    // 探索相鄰格子
    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const key = `${nx},${ny}`;

      // 邊界檢查
      if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[ny].length) {
        continue;
      }

      // 已訪問檢查
      if (visited.has(key)) {
        continue;
      }

      // 可行走檢查
      const tile = map[ny][nx];
      if (!WALKABLE.includes(tile)) {
        continue;
      }

      visited.add(key);
      queue.push({
        x: nx,
        y: ny,
        path: [...current.path, { x: nx, y: ny }]
      });
    }
  }

  console.error('找不到路徑');
  return [];
}

/**
 * 取得預設關卡的路徑
 */
export function getLevel1Path() {
  return findPath(LEVEL_1);
}
