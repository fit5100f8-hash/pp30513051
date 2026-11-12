// 報修登記：新增表單與最近 20 筆清單
(function () {
  "use strict";

  const TABLE = "repair_requests";
  const LIST_LIMIT = 20;

  const form = document.getElementById("repair-form");
  const submitBtn = document.getElementById("submit-btn");
  const formMessage = document.getElementById("form-message");
  const refreshBtn = document.getElementById("refresh-btn");
  const listEl = document.getElementById("repair-list");
  const listMessage = document.getElementById("list-message");

  function showMessage(el, text, kind) {
    el.textContent = text;
    el.className = "message " + kind;
    el.hidden = false;
  }

  function hideMessage(el) {
    el.hidden = true;
    el.textContent = "";
  }

  // 檢查設定與函式庫是否載入成功
  const config = window.APP_CONFIG;
  if (!window.supabase || !config || !config.supabaseUrl || !config.supabaseKey) {
    showMessage(formMessage, "系統載入失敗，請檢查網路連線後重新整理頁面。", "error");
    showMessage(listMessage, "無法載入清單。", "error");
    submitBtn.disabled = true;
    refreshBtn.disabled = true;
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const timeFormatter = new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // 把資料庫錯誤轉成看得懂的中文訊息
  function describeError(error) {
    if (!error) return "發生未知錯誤。";
    const code = error.code || "";
    if (code === "42501") return "沒有權限執行這個動作（資料庫權限或 RLS 拒絕）。";
    if (code === "23514") return "資料內容不符合規定，請檢查各欄位。";
    if (code === "42P01" || code === "PGRST205") return "找不到資料表 repair_requests，請先在 Supabase 執行 supabase/schema.sql。";
    if (/fetch|network/i.test(error.message || "")) return "無法連線到伺服器，請檢查網路。";
    return "錯誤：" + (error.message || code);
  }

  function getChecked(name) {
    const el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }

  // 前端檢查；與資料庫 CHECK 限制一致（最終仍以資料庫為準）
  function validate(data) {
    if (!data.reporter_name) return "請填寫報修人。";
    if (data.reporter_name.length > 50) return "報修人最多 50 字。";
    if (!data.location) return "請填寫地點或部門。";
    if (data.location.length > 100) return "地點或部門最多 100 字。";
    if (!data.category) return "請選擇類別。";
    if (!data.description) return "請填寫問題說明。";
    if (data.description.length > 1000) return "問題說明最多 1000 字。";
    if (!data.urgency) return "請選擇緊急程度。";
    return "";
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideMessage(formMessage);

    // 只送這 5 個欄位；不送 status，由資料庫套用預設值「待處理」
    const data = {
      reporter_name: form.reporter_name.value.trim(),
      location: form.location.value.trim(),
      category: getChecked("category"),
      description: form.description.value.trim(),
      urgency: getChecked("urgency"),
    };

    const problem = validate(data);
    if (problem) {
      showMessage(formMessage, problem, "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "送出中…";
    try {
      const { error } = await client.from(TABLE).insert(data);
      if (error) {
        showMessage(formMessage, "送出失敗。" + describeError(error), "error");
        return;
      }
      showMessage(formMessage, "已送出報修，謝謝！", "ok");
      form.reset();
      loadList();
    } catch (err) {
      showMessage(formMessage, "送出失敗。" + describeError(err), "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "送出報修";
    }
  });

  function makeTag(text, extraClass) {
    const span = document.createElement("span");
    span.className = "tag" + (extraClass ? " " + extraClass : "");
    span.textContent = text;
    return span;
  }

  // 用 textContent 組畫面，不用 innerHTML，避免使用者輸入的內容被當成 HTML 執行
  function renderItem(row) {
    const li = document.createElement("li");
    li.className = "repair-item";

    const top = document.createElement("div");
    top.className = "item-top";
    top.append(
      makeTag(row.category),
      makeTag("緊急：" + row.urgency, "urgency-" + row.urgency),
      makeTag(row.status)
    );

    const desc = document.createElement("p");
    desc.className = "item-desc";
    desc.textContent = row.description;

    const meta = document.createElement("p");
    meta.className = "item-meta";
    const time = row.created_at ? timeFormatter.format(new Date(row.created_at)) : "";
    meta.textContent = row.reporter_name + "・" + row.location + "・" + time;

    li.append(top, desc, meta);
    return li;
  }

  async function loadList() {
    refreshBtn.disabled = true;
    showMessage(listMessage, "載入中…", "info");
    try {
      const { data, error } = await client
        .from(TABLE)
        .select("id, created_at, reporter_name, location, category, description, urgency, status")
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT);

      if (error) {
        listEl.replaceChildren();
        showMessage(listMessage, "清單載入失敗。" + describeError(error), "error");
        return;
      }
      listEl.replaceChildren(...data.map(renderItem));
      if (data.length === 0) {
        showMessage(listMessage, "目前還沒有報修資料。", "info");
      } else {
        hideMessage(listMessage);
      }
    } catch (err) {
      listEl.replaceChildren();
      showMessage(listMessage, "清單載入失敗。" + describeError(err), "error");
    } finally {
      refreshBtn.disabled = false;
    }
  }

  refreshBtn.addEventListener("click", loadList);
  loadList();
})();
