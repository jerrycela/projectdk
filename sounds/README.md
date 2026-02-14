# 音效資源目錄

本目錄用於存放遊戲音效檔案。

## 當前狀態

**Placeholder 模式**：目前尚未加入實際音效檔案，DK.SoundSystem 使用 `console.log` 模擬播放。

## 需要的音效檔案

### UI 音效
- `ui_click.mp3` - 按鈕點擊音效
- `ui_hover.mp3` - 滑鼠懸停音效
- `ui_error.mp3` - 錯誤提示音效
- `ui_success.mp3` - 成功提示音效

### 遊戲操作音效
- `trap_place.mp3` - 陷阱放置音效
- `trap_trigger.mp3` - 陷阱觸發音效
- `trap_destroy.mp3` - 陷阱摧毀音效
- `hero_summon.mp3` - 英雄召喚音效
- `hero_death.mp3` - 英雄死亡音效

### 敵人音效
- `enemy_spawn.mp3` - 敵人生成音效
- `enemy_hit.mp3` - 敵人受擊音效
- `enemy_death.mp3` - 敵人死亡音效

### 波次事件音效
- `wave_start.mp3` - 波次開始音效
- `wave_complete.mp3` - 波次完成音效
- `wave_failed.mp3` - 波次失敗音效

### 遊戲狀態音效
- `game_over.mp3` - 遊戲結束音效
- `victory.mp3` - 勝利音效
- `pause.mp3` - 暫停音效
- `resume.mp3` - 繼續音效

## 音效規格建議

- **格式**：MP3（廣泛支援）或 OGG（高品質）
- **位元率**：128kbps - 192kbps
- **長度**：0.2s - 1.5s（短音效）
- **音量**：標準化至 -6dB 峰值

## 音效來源建議

1. **免費資源**：
   - [Freesound.org](https://freesound.org)
   - [OpenGameArt.org](https://opengameart.org)
   - [Zapsplat.com](https://www.zapsplat.com)

2. **商業資源**：
   - [Epidemic Sound](https://www.epidemicsound.com)
   - [AudioJungle](https://audiojungle.net)

3. **自製音效**：
   - 使用 [Bfxr](https://www.bfxr.net) 生成 8-bit 風格音效
   - 使用 Audacity 錄製與編輯

## 啟用實際音效

當音效檔案準備好後：

1. 將音效檔案放入此目錄
2. 在 `js/sound.js` 中設定 `debugMode: false`
3. 系統將自動切換至實際播放模式

## 測試音效

開啟瀏覽器開發者工具 Console，執行：

```javascript
// 播放測試
DK.SoundSystem.play('trap_place');
DK.SoundSystem.play('wave_start');

// 設定音量
DK.SoundSystem.setVolume('master', 0.5);

// 切換靜音
DK.SoundSystem.toggleMute();
```
