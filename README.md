# 英文字母打字練習遊戲 (English Typing Practice Game)

## 🎮 專案簡介
這是一個以 HTML、CSS 與原生理 JavaScript (Vanilla JS) 開發的網頁版英文字母打字練習遊戲。
主要目標是幫助使用者熟悉鍵盤上的英文字母位置，並透過動態的下落動畫與「虛擬手指提示」來訓練盲打能力與反應速度。

## ✨ 功能特色
1. **直覺的視覺提示**：當字母落下時，畫面下方的虛擬雙手會亮起對應的手指（例如：看到 'A' 落下，左手小拇指會發光提示），幫助正確建立肌肉記憶。
2. **純靜態無依賴**：單一 `typeEN.html` 檔案即可運行，無需任何後端伺服器，直接點擊開啟即可遊玩。
3. **隨機排序與色彩**：26 個英文字母會以隨機順序、隨機顏色、隨機 X 軸位置落下，增加挑戰與趣味性。
4. **Tailwind CSS 快速排版**：透過 CDN 引入 Tailwind CSS 進行基礎 UI 構建，畫面簡潔明瞭。
5. **RWD 響應式基礎**：使用相對單位與 Tailwind 類別，能在不同螢幕尺寸下維持基本可用性。

## 🕹️ 使用說明
1. **啟動遊戲**：使用任何現代瀏覽器（Chrome, Edge, Firefox, Safari 等）打開 `typeEN.html`。
2. **開始畫面**：點擊【開始遊戲】按鈕。
3. **遊玩方式**：
   - 螢幕上方會隨機落下英文字母。
   - 觀察下方「發光的手指」，並使用你真實雙手的對應手指按下鍵盤上相同的字母鍵。
   - 若按下正確，該字母會有擊中特效並消失，算作完成 1 個字母。
4. **結算畫面**：當成功擊落所有 26 個字母後，遊戲將會顯示你所花費的總時間（秒數），並可點擊【再玩一次】重新挑戰。

---

## 🚀 GitHub Pages 部署指南

目前的架構（單一 HTML 靜態檔案）**完全且完美地支援** GitHub Pages 部署，且步驟極為簡單。

### 部署步驟：
1. **建立 Repository**：在您的 GitHub 建立一個新的公開 (Public) 儲存庫，例如命名為 `TypingGame`。
2. **上傳檔案**：
   - 將本資料夾中的 `typeEN.html` 重新命名為 `index.html`（這會讓 GitHub Pages 自動將其視為首頁）。
   - 將 `index.html` 上傳至剛建立的 GitHub Repository 的 `main`（或 `master`）分支。
3. **開啟 GitHub Pages 服務**：
   - 在 Repository 頁面上方點選 **Settings**。
   - 在左側選單找到 **Pages** (GitHub Pages)。
   - 在 "Build and deployment" 下的 "Source" 選擇 **Deploy from a branch**。
   - 在 "Branch" 下拉選單中選擇 `main`，資料夾選擇 `/ (root)`，並點選 **Save**。
4. **等待部署並瀏覽**：
   - 等待約 1~2 分鐘，GitHub 會顯示您的專案專屬網址（例如：`https://<你的帳號>.github.io/TypingGame/`）。
   - 點擊網址即可在任何裝置上遊玩！
