# ProjectDK - Claude 協作指引

## 語言與態度

- **一律使用繁體中文對答**
- **一切誠實以告**：不迴避問題、不美化現狀、不隱瞞風險

---

## 🧠 上下文管理原則

### 強制規則
**適時 compact 上下文，避免 error 狀態**

### 觸發時機
- Token 使用率 > 70% → 立即 compact
- 連續對話 > 20 輪 → 主動建議 compact
- 大量檔案讀取 > 10 個 → 檢查 token 使用率

### 處理方法
1. **總結並重新開始**（推薦）
   - 總結關鍵結論 → 寫入 `progress.md` → 建議用戶 `/clear`
2. **使用 Agent Teams 隔離上下文**
   - 大型任務交給 subagent（獨立 context）
3. **分階段完成**
   - 每階段完成後 compact

### 預防措施
- 避免重複讀取相同檔案
- 優先使用 Grep/Glob 過濾
- 定期檢查 token 使用率

---

## 迭代開發流程

**1+9 迭代模式**：
- **第 1 次**：完整實作任務
- **第 2-10 次**：每次從頭到尾重新檢視，提出改善建議、發現問題、提供洞察

---

## 🚀 Agent Teams 優先原則

### 為什麼必須使用？
1. **速度提升** - 並行執行比序列快 3-5 倍
2. **品質保證** - Opus 4.6 領導/監督確保品質
3. **專業分工** - 不同 agent 專注不同領域

### 適用場景（幾乎所有任務）
- 多檔案修改（≥2 檔案）
- 功能開發
- Bug 修復
- 測試驗證
- 文件撰寫
- 程式碼審查

**唯一例外**：
- 單一檔案小修改（<10 行）
- 簡單問答
- 快速語法檢查

### 標準流程

#### 1. 創建 Team
```javascript
TeamCreate({
  team_name: "任務名稱-team",
  description: "清楚描述目標",
  agent_type: "architect"
})
```

#### 2. 創建任務列表
```javascript
TaskCreate({
  subject: "具體任務",
  description: "詳細說明",
  activeForm: "進行中狀態"
})
```

#### 3. 啟動 Team Lead（必須使用 Opus 4.6）
```javascript
Task({
  subagent_type: "Plan",
  team_name: "任務名稱-team",
  name: "team-lead",
  model: "opus",  // ⚠️ 必須使用 Opus 4.6
  description: "Team lead 規劃與協調",
  prompt: `你是 team lead，職責：
    1. 查看任務列表（TaskList）
    2. 分派 teammates（Task tool + team_name）
    3. 收集並整合成果
    4. 進行 10 次迭代優化
    5. 產出最終文件至 docs/`
})
```

### 模型配置規則

| 角色 | 模型 | 使用時機 |
|------|------|----------|
| **Team Lead / 監督** | **Opus 4.6** | **必須永遠使用**（規劃、協調、品質保證） |
| Teammate | Haiku 4.5 | 簡單、重複性任務 |
| Teammate | Sonnet 4.5 | 中等複雜度任務 |
| Teammate | Opus 4.6 | 高度複雜任務 |

### Team Lead 職責

1. **查看任務列表** - 使用 TaskList
2. **分派 teammates** - 指定 team_name
3. **主動搜尋 Skills** - 加速團隊運行
4. **協調與整合成果**
5. **進行迭代優化**（至少 10 次）
6. **產出最終文件** - 寫入 docs/

---

## 完成通知

**重要**：專案遵循全域 `~/.claude/CLAUDE.md` 的通知規則：
- Slack 通知：推送到 n8n-測試頻道（ID: `C08D74G1ZG8`）
- Heptabase 知識庫：使用 `mcp__heptabase-mcp__save_to_note_card` 保存重要成果
- 本地備份：所有推送到 Heptabase 的內容必須同時保存到 `docs/`

### ProjectDK 專屬 Tag 命名規則
- 專案名稱：`ProjectDK`
- 功能模組：`門系統`, `傳送門`, `小地圖`, `關卡編輯器`
- 階段標記：`Phase1`, `Phase2`, `Phase3`
- 時間標記：`2026-02`, `2026-03`
- 類型標記：`設計`, `實作`, `優化`, `bug修復`

---

## 🎨 Canvas 開發規範（ProjectDK 專屬）

### 架構特色
ProjectDK 使用**雙 Canvas 架構**：
- **低解析度 Canvas**：像素風渲染（地圖、遊戲物件）
- **高解析度 Canvas**：UI 文字與介面

### 必須使用 save/restore 的場景

**所有修改 Canvas 狀態的操作都必須使用 `ctx.save()` / `ctx.restore()` 保護**：

```javascript
// ✅ 正確範例
function drawHighlight(ctx, x, y, w, h) {
  ctx.save();  // 保護狀態
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();  // 恢復狀態
}

// ❌ 錯誤範例（污染 Canvas 狀態）
function drawHighlight(ctx, x, y, w, h) {
  ctx.globalCompositeOperation = 'lighter';  // 永久改變狀態！
  ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
  ctx.fillRect(x, y, w, h);
  // 下一個繪圖函式會受到影響
}
```

**關鍵場景**：
1. 修改 `globalAlpha`
2. 修改 `globalCompositeOperation`
3. 修改 `shadowBlur`, `shadowColor`
4. 修改 `transform`, `translate`, `rotate`, `scale`
5. 修改 `clip` 區域
6. 修改 `fillStyle`, `strokeStyle`（如果不是區域性使用）

### 避免破壞性操作

**使用 `globalCompositeOperation` 替代 `clearRect()`**：

```javascript
// ❌ 錯誤：clearRect 是破壞性操作
ctx.clearRect(rect.x - 10, rect.y - 10, rect.w + 20, rect.h + 20);
// 這會摧毀該區域的所有已渲染內容！

// ✅ 正確：使用 globalCompositeOperation
ctx.save();
ctx.globalCompositeOperation = 'lighter';  // 或 'multiply', 'overlay' 等
ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
ctx.restore();
```

### 雙 Canvas 架構注意事項

1. **確認操作的 Canvas**：
   - 地圖渲染 → 低解析度 Canvas
   - UI 文字 → 高解析度 Canvas

2. **座標轉換**：
   - 低解析度 Canvas：像素座標
   - 高解析度 Canvas：螢幕座標（需要縮放）

3. **渲染順序**：
   - 先渲染低解析度 Canvas（地圖）
   - 再渲染高解析度 Canvas（UI）

---

## 🐛 常見 Bug 案例（從實際修復中學習）

### 案例 1：DK.FONTS.normal 未定義

**錯誤訊息**：
```
TypeError: DK.FONTS.normal is not a function
```

**根本原因**：
- `DK.FONTS` 中不存在 `normal()` 方法
- 應該使用 `DK.FONTS.body()`

**修復**：
```javascript
// ❌ 錯誤
ctx.font = DK.FONTS.normal(14);

// ✅ 修復
ctx.font = DK.FONTS.body(14);
```

**預防**：
- 修改前檢查 API 存在性（查看 `js/config.js` 中的 `DK.FONTS` 定義）
- 使用 IDE 自動完成功能

---

### 案例 2：DK.UI 未初始化

**錯誤訊息**：
```
TypeError: Cannot set property 'ErrorNotification' of undefined
```

**根本原因**：
- 在模組載入時，`DK.UI` 尚未初始化
- 直接賦值 `DK.UI.ErrorNotification = {}` 會出錯

**修復**：
```javascript
// ❌ 錯誤
window.DK = window.DK || {};
DK.UI.ErrorNotification = {  // DK.UI 未初始化！

// ✅ 修復
window.DK = window.DK || {};
DK.UI = DK.UI || {};  // 確保 DK.UI 已初始化
DK.UI.ErrorNotification = {
```

**預防**：
- 在使用全域物件前，檢查其父層是否已初始化
- 遵循初始化順序：`DK` → `DK.UI` → `DK.UI.ErrorNotification`

---

### 案例 3：Tutorial 自動啟動導致按鈕黑屏

**問題描述**：
- 陷阱按鈕顯示黑色/透明，無法正常使用
- 編輯器圖標也是黑色

**根本原因**：
1. 關卡載入時自動呼叫 `DK.Tutorial.init()`
2. Tutorial 使用 `ctx.clearRect()` 摧毀已渲染的按鈕內容
3. 沒有使用 `ctx.save()` / `ctx.restore()` 保護 Canvas 狀態

**修復**：
```javascript
// 1. 停止自動啟動
// ❌ 錯誤：在 levels.js 中自動呼叫
if (this.currentLevel.tutorial) {
  DK.Tutorial.init(this.currentLevel.tutorial);  // 移除此行
}

// 2. 替換 clearRect 為非破壞性高亮
// ❌ 錯誤：tutorial.js 中使用 clearRect
ctx.clearRect(rect.x - 10, rect.y - 10, rect.w + 20, rect.h + 20);

// ✅ 修復：使用 globalCompositeOperation
ctx.save();
ctx.globalCompositeOperation = 'lighter';
ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
ctx.restore();
```

**教訓**：
- **Canvas 狀態是全域的，必須保護**
- **避免使用破壞性 API**（如 `clearRect()`）
- **自動啟動功能需要明確的用戶意圖**

---

### 案例 4：瀏覽器快取陷阱

**問題描述**：
- 用戶報告「重啟遊戲還是一樣的問題」
- 明明程式碼已修復，但用戶看到的還是舊版本

**根本原因**：
- 瀏覽器快取舊版本的 JavaScript 檔案
- 正常 Refresh（F5 或 Cmd+R）不會清除快取

**解決方案**：
1. **提醒用戶執行 Hard Refresh**：
   - macOS：`Cmd + Shift + R`
   - Windows/Linux：`Ctrl + Shift + F5`

2. **自動化測試使用 `--disable-cache` 標誌**：
   ```javascript
   const browser = await puppeteer.launch({
     args: ['--disable-cache']
   });
   ```

3. **考慮在 index.html 中加入版本號查詢參數**：
   ```html
   <script src="js/main.js?v=1.0.1"></script>
   ```

**預防**：
- 修復完成後，主動提醒用戶執行 Hard Refresh
- 在文檔中加入「清除快取」步驟

---

### 案例 5：錯誤鏈追蹤的重要性

**問題**：
- 修復一個錯誤後，會連鎖觸發下一個錯誤
- 需要完整追蹤錯誤鏈

**錯誤鏈範例**：
1. ❌ DK.FONTS.normal → 修復
2. ❌ DK.UI 未初始化 → 修復
3. ❌ this.ErrorNotification 未定義 → 修復
4. ✅ 所有問題解決

**教訓**：
- **修復後必須執行完整測試，不能只驗證單一錯誤**
- 使用 Puppeteer 自動化測試捕獲所有 Console 錯誤
- 檢查錯誤堆疊中的所有相關函式

---

## 除錯核心原則

### 系統化除錯流程

1. **語法檢查** - `node -c js/*.js`
2. **清除快取** - 硬重新載入（Cmd+Shift+R）
3. **建立除錯頁面** - 捕獲所有錯誤訊息
4. **檢查錯誤堆疊** - 找出確切位置
5. **追蹤呼叫鏈** - 找出呼叫來源
6. **驗證參數** - 檢查參數是否存在
7. **屬性名稱** - 確認物件屬性正確
8. **模組載入順序** - 確認相依模組已載入

### 關鍵教訓

1. **語法正確 ≠ 邏輯正確**
   - 使用執行期驗證（像素採樣、渲染追蹤）
2. **沒有錯誤訊息 ≠ 沒有問題**
   - 視覺驗證和狀態檢查
3. **視覺問題要追蹤渲染流程**
   - 追蹤「哪一步出錯」
4. **Canvas 狀態必須保護**
   - 所有修改 Canvas 的函式都必須 `ctx.save()/restore()`
5. **clearRect 是破壞性操作**
   - 使用 `globalCompositeOperation` 替代
6. **Script 載入順序很重要**
   - 基礎物件先載入，擴展功能後載入
7. **函式呼叫前必須驗證參數**
   - 檢查型別、單位、數量
8. **Agent Teams 交付必須驗證**
   - 對照文件，逐項檢查程式碼變更

### 預防措施

1. **使用 JSDoc 或 TypeScript** - 參數型別註解
2. **防禦性編程** - 使用可選鏈（`?.`）
3. **統一命名規範** - 避免混淆
4. **建立除錯工具** - 測試頁面、驗證腳本
5. **視覺回歸測試** - Playwright 截圖對比

---

## ✅ 檢查清單

### 程式碼修改前
- [ ] 確認 API 存在性（查看 `js/config.js` 等定義檔）
- [ ] 檢查參數類型（物件 vs 字串）
- [ ] 檢查命名一致性（DK.FONTS.body vs DK.FONTS.normal）
- [ ] 檢查全域物件初始化順序（DK → DK.UI → DK.UI.xxx）

### 程式碼修改後
- [ ] 語法檢查（`node -c js/*.js`）
- [ ] Canvas save/restore 檢查（所有修改狀態的函式）
- [ ] globalCompositeOperation 使用檢查（避免 clearRect）
- [ ] 執行期驗證（瀏覽器 Console）
- [ ] 視覺檢查（UI 正常顯示）
- [ ] 功能測試（可以互動）
- [ ] **Puppeteer 自動化測試**（必須先自己驗證，不依賴用戶手動測試）

### QA 測試前
- [ ] Hard Refresh 清除快取（Cmd+Shift+R）
- [ ] 確認測試最新版本
- [ ] 開啟 DevTools Console
- [ ] 準備截圖對比
- [ ] **執行 Puppeteer 自動化測試**
- [ ] **截圖對比驗證**（視覺回歸測試）

### 發現錯誤後
- [ ] 記錄錯誤訊息（完整 stack trace）
- [ ] **錯誤鏈追蹤**（檢查是否有連鎖錯誤）
- [ ] 分析根本原因
- [ ] 建立預防機制
- [ ] **更新常見 Bug 案例**（加入本文檔）
- [ ] 更新 CLAUDE.md

### 修復完成後
- [ ] 提醒用戶執行 Hard Refresh（Cmd+Shift+R）
- [ ] 確認所有 Console 錯誤已清除
- [ ] 確認視覺正常
- [ ] 產出修復報告（寫入 `docs/`）

---

## 📦 專案概況

- **專案名稱**：ProjectDK (Dungeon Keep)
- **專案類型**：地層塔防 - HTML5 Canvas 像素風塔防遊戲
- **技術棧**：Pure vanilla JavaScript
- **程式碼規模**：18 個核心 JS 檔案, ~14,538 行
- **架構特色**：雙 Canvas 架構（低解析度像素畫 + 高解析度 UI 文字）
- **Git 倉庫**：https://github.com/jerrycela/projectdk
- **已完成功能**：
  - ✅ Phase 1-3 關卡編輯器（6 個模組）
  - ✅ Tutorial Bug Fix（2026-02-11）
  - ✅ DW3 視覺風格優化（2026-02-12）
  - ✅ 傳送門系統取代 Breach 階段
  - ✅ 10 次視覺迭代 + 元素反應系統 V2

---

## 📚 參考資源

**詳細除錯案例與範例請參考**：
- `docs/critical-bugs-final-fix-2026-02-11.md` - Critical Bugs 完整修復過程
- `docs/FINAL-DELIVERY-REPORT-2026-02-12.md` - DW3 優化專案最終報告
- `docs/agent-teams-mandate-2026-02-11.md` - Agent Teams 使用規範
- `progress.md` - 當前開發進度與測試記錄
- `findings.md` - 研究發現與決策記錄

---

**最後更新**：2026-02-14
**當前版本**：v2.0（優化版）
**主要改進**：
- ✅ 新增 Canvas 開發規範章節
- ✅ 新增常見 Bug 案例章節（5 個實際案例）
- ✅ 強化檢查清單（自動化測試、錯誤鏈追蹤）
- ✅ 更新專案概況（最新統計、GitHub 連結）
- ✅ 簡化通知機制（引用全域設定）
