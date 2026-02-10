# ProjectDK - Claude 協作指引

## 語言與態度

- **一律使用繁體中文對答**
- **一切誠實以告**：不迴避問題、不美化現狀、不隱瞞風險，如實告知優缺點與不確定性

## 迭代開發流程

本專案採用「1+9 迭代模式」：

1. **第 1 次迭代**：完整實作任務，產出可運行的成果
2. **第 2～10 次迭代**：每次從頭到尾重新檢視整份程式碼與任務成果，提出：
   - 具體的改善建議
   - 發現的問題或潛在風險
   - 新的洞察與優化方向
   - 每次迭代都應該基於前一次的修改重新審視全局

**重點**：第 2 次開始不是修修補補，而是每次都完整重新審視，確保不會只看到局部而忽略整體。

## Agent Teams 協作流程（標準模式）

當用戶要求「啟動 agent teams」時，**必須嚴格遵循以下標準流程**：

### 步驟 1：創建 Team 結構

```javascript
TeamCreate({
  team_name: "具體任務名稱-team",  // 例如: level-editor-design
  description: "清楚描述團隊目標與職責範圍",
  agent_type: "architect"  // Team lead 的角色類型
})
```

### 步驟 2：創建任務列表

使用 `TaskCreate` 為所有需要完成的子任務建立清單：

```javascript
// 範例：為設計任務創建清單
TaskCreate({ subject: "設計整體架構", description: "...", activeForm: "設計架構中" })
TaskCreate({ subject: "設計 UI/UX", description: "...", activeForm: "設計 UI 中" })
// ... 更多任務
TaskCreate({ subject: "進行 10 次迭代優化", description: "...", activeForm: "迭代優化中" })
```

### 步驟 3：啟動 Team Lead（**必須使用 Opus 4.6**）

```javascript
Task({
  subagent_type: "Plan",  // 或其他適合的 agent 類型
  team_name: "具體任務名稱-team",  // 與步驟 1 的 team_name 一致
  name: "team-lead",
  model: "opus",  // ⚠️ 關鍵：必須明確指定 opus (Opus 4.6)
  description: "Team lead 規劃與協調",
  prompt: `你是 XXX team 的 team lead，使用 Opus 4.6 模型。

## 你的職責

1. 查看任務列表（使用 TaskList）
2. 為每個設計/實作任務分派 teammates（使用 Task tool 指定 team_name）
3. Teammates 可使用 Sonnet 或 Haiku 模型（根據任務複雜度選擇）
4. 收集並整合 teammates 的成果
5. 進行多輪迭代優化（通常 10 次）
6. 產出最終文件至 docs/ 目錄

## 專案背景
[補充專案相關背景資訊]

現在開始你的工作！`
})
```

### 模型配置規則

| 角色 | 模型 | 使用時機 |
|------|------|----------|
| **Team Lead** | **Opus 4.6** | **永遠使用**（規劃、協調、迭代優化） |
| Teammate | Haiku 4.5 | 簡單、重複性任務（快速、低成本） |
| Teammate | Sonnet 4.5 | 中等複雜度任務（平衡效能與成本） |
| Teammate | Opus 4.6 | 高度複雜任務（需要深度推理） |

### 工作流程圖

```
主 Claude
  ↓ 創建 Team（TeamCreate）
  ↓ 創建任務列表（TaskCreate × N）
  ↓ 啟動 Team Lead（Task tool + model: opus）

Team Lead (Opus 4.6)
  ↓ 查看任務（TaskList）
  ↓ 分派 Teammates（Task tool + team_name）
  ↓ 協調與整合成果
  ↓ 進行 10 次迭代優化
  ↓ 產出最終文件（Write to docs/）
  ↓ 向主 Claude 報告（SendMessage）

主 Claude
  ↓ 接收成果報告
  ↓ 根據設計文件進行實作（或交由用戶決定）
```

### 迭代優化標準

Team lead 必須進行至少 10 次完整迭代：
- **Iteration 1-5**：專注特定維度（架構、UX、數據、整合、擴展性）
- **Iteration 6-10**：全局深度檢視與細節優化
- 每次從頭到尾重新審視，確保一致性與完整性

### 成果交付檢查清單

Team lead 完成後必須：
- ✅ 設計文件已寫入 `docs/` 目錄
- ✅ 文件包含完整的架構、數據結構、流程說明
- ✅ 已進行至少 10 次迭代優化
- ✅ 向主 Claude 發送訊息報告（使用 SendMessage）

**⚠️ 關鍵提醒**：
1. Team lead **必須**明確指定 `model: "opus"`
2. 分派 teammates 時**必須**指定 `team_name` 參數
3. 所有 teammates 工作完成後，team lead 才能進行迭代優化

## 大量任務處理

處理大量或複雜任務時，**必須適時呼叫 subagent 並行處理**：

- 將可獨立執行的子任務拆分給不同 subagent
- 善用 `run_in_background` 處理耗時任務
- 透過 `TaskOutput` 追蹤進度
- 不要一個人硬撐,該分工就分工

## 完成通知

工作完成後，**必須同時推送到 Slack 和 Heptabase**：

### 1️⃣ Slack 通知（即時通知）

推送結果摘要到 **n8n-測試頻道**（ID: `C08D74G1ZG8`）：

- 使用 `mcp__claude_ai_Slack__slack_send_message` 工具
- 訊息格式包含：類型、摘要、修改範圍、注意事項
- 讓用戶在 Slack 即時收到進度通知

### 2️⃣ Heptabase 知識庫（長期保存）

將重要成果推送到 Heptabase 作為知識資產：

**觸發條件**：
- ✅ 重大功能完成（如：門系統、傳送門視覺重構）
- ✅ 重要技術發現（如：性能優化方案）
- ✅ 架構決策（如：數據結構設計）
- ✅ 問題解決方案（如：複雜 bug 修復）
- ✅ 學習筆記（如：最佳實踐總結）

**推送流程**：

1. **推送到 Heptabase**：使用 `mcp__claude_ai_Heptabase__save_to_note_card`
   ```javascript
   mcp__claude_ai_Heptabase__save_to_note_card({
     content: "完整的技術文檔內容...",
     tags: ["ProjectDK", "門系統", "Phase3", "2026-02"]
   })
   ```

2. **本地備份**：同時保存到 `docs/` 目錄
   ```javascript
   Write({
     file_path: "/projectdk/docs/door-system-implementation.md",
     content: "與 Heptabase 相同的內容..."
   })
   ```

**Tag 命名規則**：

| Tag 類型 | 格式 | 範例 |
|---------|------|------|
| 專案名稱 | `ProjectDK` | `ProjectDK` |
| 功能模組 | `模組名稱` | `門系統`, `傳送門`, `小地圖` |
| 階段標記 | `Phase{數字}` | `Phase1`, `Phase2`, `Phase3` |
| 時間標記 | `YYYY-MM` | `2026-02`, `2026-03` |
| 類型標記 | `類型` | `設計`, `實作`, `優化`, `bug修復` |

**內容格式**：

```markdown
# [標題]

## 概述
[簡短描述 2-3 句話]

## 詳細內容
[完整的技術細節或結論]

## 相關資訊
- 日期：YYYY-MM-DD
- 專案：ProjectDK
- Git Commit：[commit hash]
- 修改檔案：[檔案列表]
```

**⚠️ 重要**：
- 推送到 Heptabase 後**必須**同時保存本地備份
- Tag 必須包含至少 3 個：專案名稱 + 功能模組 + 時間標記
- 本地備份檔名格式：`<主題>-<日期>.md`
