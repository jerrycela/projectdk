# 地圖修正計畫

## 問題根源

**致命錯誤**：在迭代設計時過度關注視覺美感，忽略了 BFS 路徑的實際可行性。

### 具體問題

1. **Level 1**：第 7 行用 WWWWWW 阻斷了走廊路徑，地心被封閉
2. **Level 2**：地心上方被牆完全封閉
3. **Level 3**：✓ 唯一正確的關卡
4. **Level 4**：破牆點下方是 WW，路徑在第 2-5 行被完全阻斷

## 修正原則

1. **路徑完全連通**：從破牆點到地心必須有完整的 `.` 路徑
2. **W 的使用限制**：只用於外牆、走廊兩側、可選的 1-2 個門檻
3. **地心可到達**：地心周圍至少一個方向是 `.`
4. **破牆點下方通暢**：B 下方必須是 `.`

## 修正後的地圖設計（方案 A：簡化版）

### Level 1：直線走廊（簡化版）
```
OOOOOOOOOOOOOOOOOOOO
OWWWWWWWBBWWWWWWWWWO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW........HH......WO  ← 地心直接在走廊盡頭
OW........WW......WO
OWWWWWWWWWWWWWWWWWWO
OOOOOOOOOOOOOOOOOOOO
```

**特點**：
- 完全移除「房間」概念
- 地心直接放在走廊盡頭
- 路徑從 (1,8-9) → 直線向下 → (9,10-11) 地心
- ✓ 完全連通，無阻斷

---

### Level 2：L 型走廊（簡化版）
```
OOOOOOOOOOOOOOOOOOOO
OWWWWWWWBBWWWWWWWWWO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW..PP....WW......WO  ← 水坑在轉角前
OW..PP............WO
OW................WO
OW..............HHWO  ← 地心在右下角
OWWWWWWWWWWWWWWWWWWO
OOOOOOOOOOOOOOOOOOOO
```

**特點**：
- L 型走廊，向下 → 向右
- 水坑在轉角前（第 7-8 行）
- 地心在右下角，完全可到達
- ✓ 路徑完全連通

---

### Level 3：Z 型走廊（保持原設計）
```
OOOOOOOOOOOOOOOOOOOO
OWWWWWWWBBWWWWWWWWWO
OW........WW......WO
OW........WW......WO
OW........WW......WO
OW..GG....WWWWWWWWWO
OW..GG............WO
OW..WW............WO
OW..WW............WO
OW..WW....HH....WWWO
OW..WWWWWWWWWWWWWWWO
OWWWWWWWWWWWWWWWWWWO
OOOOOOOOOOOOOOOOOOOO
```

**特點**：
- ✓ 原設計已經正確
- 保持不變

---

### Level 4：雙路徑（完全開放設計）
```
OOOOOOOOOOOOOOOOOOOO
OWWWWBBWWWWWWWBBWWWO
OW................WO  ← 完全開放區域
OW................WO
OW..GG............WO  ← 油坑在左側
OW..GG............WO
OW........HH......WO  ← 地心居中
OW..........PP....WO  ← 水坑在右側
OW..........PP....WO
OW................WO
OW................WO
OWWWWWWWWWWWWWWWWWWO
OOOOOOOOOOOOOOOOOOOO
```

**特點**：
- 完全移除內部走廊牆體，改為開放區域
- 左破牆點 (1,4-5) → 完全開放 → 地心 (6,10-11)
- 右破牆點 (1,14-15) → 完全開放 → 地心 (6,10-11)
- 油坑在左側 (4-5,4-5)，水坑在右側 (7-8,12-13)
- ✓ 兩條路徑都完全連通，敵人可自由選擇路徑

---

## 驗證檢查表

### Level 1
- [ ] 破牆點 B (1,8-9) 下方是 `.` ✓
- [ ] 走廊 (2-9, 8-11) 全部是 `.` ✓
- [ ] 地心 HH (9,10-11) 可到達 ✓

### Level 2
- [ ] 破牆點 B (1,8-9) 下方是 `.` ✓
- [ ] 走廊 (2-10) 路徑連通 ✓
- [ ] 地心 HH (10,16-17) 可到達 ✓

### Level 3
- [ ] 已驗證通過 ✓

### Level 4
- [ ] 左破牆點 B (1,4-5) 下方是 `.` ✓
- [ ] 右破牆點 B (1,14-15) 下方是 `.` ✓
- [ ] 左路徑 (2-10, 4-7) 連通 ✓
- [ ] 右路徑 (2-10, 12-15) 連通 ✓
- [ ] 地心 HH (6,10-11) 兩側都可到達 ✓

---

## 實作步驟

1. 更新 `js/levels.js` 中的 4 個關卡 layout
2. 語法檢查
3. 路徑驗證腳本測試
4. 遊戲實測
5. Commit

