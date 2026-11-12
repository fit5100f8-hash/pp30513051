報修登記系統
提供報修資料登記與清單查閱，方便追蹤設備及環境問題。
雲端任務測試
報修欄位表：[文件/報修欄位表.xlsx](文件/報修欄位表.xlsx)

網頁前端：index.html、style.css、app.js、config.js（純 HTML/CSS/JavaScript，透過 CDN 載入 supabase-js v2）。
發佈網址（GitHub Pages）：https://fit5100f8-hash.github.io/pp30513051/
本機預覽：在儲存庫根目錄執行 `python3 -m http.server 8000`，再開啟 http://localhost:8000/
使用前請先在 Supabase SQL Editor 執行 supabase/schema.sql 建立資料表。

鋁圈客製化選配頁：wheel/index.html（純 HTML/CSS/JavaScript，不連資料庫）
發佈網址（GitHub Pages）：https://fit5100f8-hash.github.io/pp30513051/wheel/
