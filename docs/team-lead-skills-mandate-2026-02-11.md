# Team Lead Skills 搜尋與整合規範

**日期**：2026-02-11
**狀態**：✅ 已寫入 CLAUDE.md
**優先級**：🔴 Critical（Team Lead 核心職責）

---

## 核心原則

> **Team Lead 以及領導職要盡可能地搜尋網路上好用的 Skill 來協助 Team Member 加速運行**

---

## 為什麼 Team Lead 必須搜尋 Skills？

### 1. 避免重複造輪子

**範例**：設計 UI 系統

| 方式 | 時間 | 結果 |
|------|------|------|
| ❌ 從零開始設計 | 2 小時 | 可能不符合最佳實踐 |
| ✅ 使用 ui-ux-pro-max | 20 分鐘 | 專業設計系統 + 最佳實踐 |

**效率提升**：2 小時 → 20 分鐘（**6 倍**）

### 2. 提供專業指引

Skills 通常包含：
- ✅ 業界最佳實踐
- ✅ 常見錯誤避免
- ✅ 專業設計模式
- ✅ 自動化工具

### 3. 統一團隊標準

使用相同的 Skills → 統一的設計語言和程式碼風格

### 4. 持續學習與優化

每個 Skill 都是一個知識來源，Team Lead 應該：
- 學習 Skill 提供的最佳實踐
- 整合到團隊工作流程
- 培訓 Team Members 使用

---

## Team Lead 的 Skills 管理職責

### 1. 任務開始前：識別需求

**檢查清單**：
- [ ] 這個任務需要 UI/UX 設計嗎？→ 搜尋 `ui-ux` skills
- [ ] 需要測試嗎？→ 搜尋 `testing`, `tdd` skills
- [ ] 需要除錯嗎？→ 搜尋 `debugging` skills
- [ ] 需要規劃嗎？→ 搜尋 `planning` skills
- [ ] 需要文件嗎？→ 搜尋 `documentation` skills

### 2. 搜尋與評估

**搜尋管道**：
1. **Claude Plugin 系統**
   ```bash
   claude plugin search <keyword>
   claude plugin list
   ```

2. **網路搜尋**
   - GitHub：搜尋 "claude code skill <keyword>"
   - Claude 官方文件
   - 社群推薦

3. **內建 Skills**
   ```bash
   ls ~/.claude/skills/
   ls ~/.claude/plugins/
   ```

**評估標準**：
- ✅ 是否符合任務需求？
- ✅ 文件是否完整？
- ✅ 是否有使用範例？
- ✅ 是否活躍維護？

### 3. 安裝與測試

```bash
# 安裝（永遠使用 --scope user）
claude plugin install <skill-name> --scope user

# 測試
/<skill-name> <測試指令>

# 查看說明
/<skill-name> --help
```

### 4. 整合到團隊工作流程

**方式 1：在任務 Prompt 中明確指定**

```javascript
Task({
  subagent_type: "general-purpose",
  name: "ui-designer",
  prompt: `
    ## 任務：設計 Tooltip 系統

    ## 使用 Skills
    1. 先執行：/ui-ux-pro-max "設計遊戲 Tooltip 系統"
    2. 根據結果設計 UI 組件
    3. 實作程式碼

    ## 預期成果
    - 完整的設計系統文件
    - 實作程式碼
  `
})
```

**方式 2：提供 Skills 指引文件**

建立 `docs/skills-guide.md`：
```markdown
# Team Skills 指引

## UI/UX 設計
使用 `/ui-ux-pro-max` skill

## 測試
使用 `/tdd-guide` skill

## 除錯
使用 `/debugging` skill
```

### 5. 記錄與分享

**建立 Skills 使用記錄**：`docs/skills-usage-log.md`

```markdown
# Skills 使用記錄

## 2026-02-11

### ui-ux-pro-max
- **使用場景**：設計 Tooltip 系統
- **效果**：節省 1.5 小時，獲得專業設計建議
- **推薦度**：⭐⭐⭐⭐⭐

### planning-with-files
- **使用場景**：規劃 Portal 系統重構
- **效果**：清晰的任務結構，減少遺漏
- **推薦度**：⭐⭐⭐⭐⭐
```

---

## 常見任務與推薦 Skills

### UI/UX 設計

**推薦 Skill**：`ui-ux-pro-max`

**使用場景**：
- 設計按鈕、卡片、表單
- 選擇色彩系統
- 字型配對
- 響應式設計

**範例**：
```bash
/ui-ux-pro-max "設計遊戲 Tooltip 系統：需要卡片式設計、清晰分層"
```

### 測試與 TDD

**推薦 Skills**：
- `tdd-guide` - TDD 流程指引
- `e2e-runner` - E2E 測試執行

**使用場景**：
- 新功能開發（先寫測試）
- Bug 修復（寫測試驗證）
- 回歸測試

**範例**：
```bash
/tdd-guide "為 Portal 系統撰寫單元測試"
```

### 規劃與追蹤

**推薦 Skill**：`planning-with-files`

**使用場景**：
- 複雜任務規劃
- 進度追蹤
- 研究任務

**範例**：
```bash
/planning-with-files
# 然後建立 task_plan.md, findings.md, progress.md
```

### 程式碼審查

**推薦 Skill**：`code-reviewer`

**使用場景**：
- 完成程式碼後立即審查
- Pull Request 前檢查

**範例**：
```bash
/code-reviewer "審查 Portal 系統實作"
```

### 除錯診斷

**推薦 Skills**：
- `debugging` - 系統化除錯流程
- `build-error-resolver` - 建置錯誤修復

**使用場景**：
- Runtime 錯誤
- 建置失敗
- 功能異常

---

## Team Lead Skills 搜尋流程圖

```
任務開始
  ↓
識別需求（UI/測試/除錯/規劃？）
  ↓
搜尋相關 Skills
  ├─ claude plugin search <keyword>
  ├─ 網路搜尋
  └─ 查看內建 skills
  ↓
評估 Skills（符合需求？文件完整？）
  ↓
安裝測試
  ├─ claude plugin install --scope user
  └─ 測試功能
  ↓
整合到團隊工作流程
  ├─ 在任務 Prompt 中指定
  ├─ 建立 Skills 指引文件
  └─ 培訓 Team Members
  ↓
記錄使用效果
  └─ 寫入 docs/skills-usage-log.md
  ↓
持續優化
```

---

## 實際案例

### 案例 1：設計 Tooltip 系統

**任務**：為遊戲設計 Tooltip 系統

**Team Lead 行動**：
1. 識別需求：UI/UX 設計
2. 搜尋 Skills：`claude plugin search ui-ux`
3. 找到：`ui-ux-pro-max`
4. 測試：`/ui-ux-pro-max "設計遊戲 Tooltip 系統"`
5. 獲得：
   - 完整的設計系統建議
   - 色彩搭配方案
   - 字型建議
   - 最佳實踐
6. 整合到任務：
   ```javascript
   Task({
     name: "ui-designer",
     prompt: "使用 /ui-ux-pro-max skill 設計 Tooltip 系統"
   })
   ```

**結果**：節省 1.5 小時，獲得專業設計

### 案例 2：Portal 系統重構規劃

**任務**：規劃 Portal 系統重構

**Team Lead 行動**：
1. 識別需求：複雜任務規劃
2. 搜尋 Skills：`planning-with-files`
3. 使用：建立 `task_plan.md`, `findings.md`
4. 整合到團隊：所有 teammates 更新進度到這些檔案

**結果**：清晰的任務結構，0 個遺漏步驟

### 案例 3：Critical Bug 除錯

**任務**：修復陷阱按鈕黑屏 bug

**Team Lead 行動**：
1. 識別需求：系統化除錯
2. 搜尋 Skills：`debugging`
3. 使用：建立除錯測試頁面，捕獲 console 錯誤
4. 整合到團隊：所有 teammates 使用相同的除錯流程

**結果**：20 分鐘定位根本原因（vs 1 小時盲目猜測）

---

## 成功檢查清單

### Team Lead 每次任務前

- [ ] 識別了任務需求類型
- [ ] 搜尋了相關 Skills
- [ ] 測試了 Skills 功能
- [ ] 整合到任務 Prompt 中
- [ ] 提供了 Skills 使用指引給 teammates

### Team Lead 任務完成後

- [ ] 記錄了使用的 Skills
- [ ] 評估了 Skills 效果
- [ ] 更新了 `docs/skills-usage-log.md`
- [ ] 分享了最佳實踐

---

## 常見錯誤與改正

### 錯誤 1：忘記搜尋 Skills

❌ **錯誤**：直接讓 teammates 從零開始

✅ **正確**：先搜尋 Skills，提供專業工具

### 錯誤 2：找到 Skill 但不測試

❌ **錯誤**：直接丟給 teammates 使用未測試的 Skill

✅ **正確**：Team Lead 先測試，確認有效後再推薦

### 錯誤 3：不記錄使用效果

❌ **錯誤**：用完就忘，下次又要重新搜尋

✅ **正確**：記錄到 `docs/skills-usage-log.md`，建立知識庫

---

## Skills 發現管道

### 1. Claude 官方

- Claude Code 文件
- Claude Plugin 市場

### 2. GitHub

搜尋關鍵字：
- "claude code skill"
- "claude plugin"
- "anthropic skill"

### 3. 社群

- Claude 使用者社群
- Discord / Slack 頻道
- Reddit r/ClaudeAI

### 4. 內建

```bash
# 查看已安裝的 skills
ls ~/.claude/skills/
ls ~/.claude/plugins/

# 查看可用指令
/help
```

---

## 總結

### Team Lead 的責任

1. **主動搜尋** - 不等待，主動尋找工具
2. **測試驗證** - 確保 Skill 有效
3. **整合工作流程** - 讓 teammates 輕鬆使用
4. **記錄分享** - 建立團隊知識庫
5. **持續優化** - 定期搜尋新 Skills

### 核心信念

> **好的 Team Lead 不只是分派任務，更要提供正確的工具讓團隊加速運行**

### 記住這句話

> **Team Lead 以及領導職要盡可能地搜尋網路上好用的 Skill 來協助 Team Member 加速運行**

---

**日期**：2026-02-11
**執行者**：Claude Sonnet 4.5
**狀態**：✅ 已寫入 CLAUDE.md，強制執行
