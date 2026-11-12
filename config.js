// Supabase 連線設定
// publishable key 是公開金鑰，本來就會出現在網頁前端，可以上傳到 GitHub。
// 資料安全靠資料庫端的 GRANT、RLS 與 CHECK（見 supabase/schema.sql）。
// 絕對不要把 secret 金鑰或 service_role 金鑰放在這裡。
window.APP_CONFIG = {
  supabaseUrl: "https://noljckmsbjyumbvugppc.supabase.co",
  supabaseKey: "sb_publishable_XxDBYy6W2LNvUtjCq8tJWg_CQSyAMbq",
};
