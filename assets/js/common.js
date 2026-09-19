window.ReservationApp = (() => {
  const SUPABASE_URL = "https://iodijnhbxihastuknqky.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGlqbmhieGloYXN0dWtucWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjgyNTIsImV4cCI6MjA4NTQ0NDI1Mn0.PTG1s0Zv14VX-yfrZNmJqyu-R7wlvJl3_YYcq40g6Y4";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const page = document.body.dataset.page;
  const storageKey = "uec-reservation-language";

  const copy = {
    ja: {
      scheduleTitle: "UEC 日本語プレイスメントテスト予約",
      scheduleHeaders: ["時間", "9月24日（木）", "9月25日（金）", "9月28日（月）", "9月30日（水）"],
      break: "休憩",
      people: (count) => count + "名",
      full: "満員",
      closed: "受付終了",
      scheduleButtons: ["予約管理", "予約の確認・キャンセル"],
      basicInfo: "基本情報",
      formLabels: ["時間", "日程", "氏名（アルファベット）", "氏名（カタカナ）", "国籍・地域", "在留資格・身分"],
      namePlaceholder: "例：Yamada Taro",
      kanaPlaceholder: "例：ヤマダ タロウ",
      nationalityPlaceholder: "例：中国、日本、ベトナム",
      statusPlaceholder: "選択してください",
      statusOptions: ["J：JUSST プログラム学生", "RS：研究生", "D：博士後期課程学生", "M：博士前期課程学生", "S：配偶者"],
      confirm: "予約する",
      back: "戻る",
      required: "すべての項目を入力してください。",
      fullMessage: "この時間帯は満席です。ほかの時間を選択してください。",
      reservationPrompt: (data) => "以下の内容で予約します。\n\n日程：" + data.date + "\n時間：" + data.time + "\n氏名：" + data.name + "\nカタカナ：" + data.kana + "\n国籍・地域：" + data.nationality + "\n身分：" + data.status + "\n\nよろしいですか？",
      reservationFailed: "予約に失敗しました。もう一度お試しください。",
      reservationSucceeded: "予約が完了しました。",
      adminPasswordPrompt: "管理者パスワードを入力してください：",
      adminPasswordFailed: "パスワードが正しくありません。",
      settingsTitle: "予約枠設定",
      settingsTime: "時間",
      settingsDate: "日程",
      settingsSeats: "定員",
      settingsDeadline: "予約締切（日本時間）",
      settingsSave: "保存",
      settingsSaving: "保存中…",
      settingsSaved: "保存しました。予約ページに反映されます。",
      settingsInvalid: "異なる有効な日付を4つと予約締切を入力してください。",
      settingsLoadFailed: "設定を読み込めません。データベースの設定と接続を確認してから再読み込みしてください。",
      settingsSaveFailed: "保存できませんでした。パスワードと接続を確認してください。",
      settingsBack: "予約管理へ戻る",
      adminTitle: "予約一覧",
      adminHeaders: ["番号", "日程", "時間", "氏名", "カタカナ", "国籍・地域", "身分", "登録日時"],
      exportCsv: "CSV をダウンロード",
      returnTop: "トップへ戻る",
      loadFailed: "データの読み込みに失敗しました。",
      cancelTitle: "予約の確認・キャンセル",
      searchPlaceholder: "予約時の氏名を入力してください",
      search: "検索",
      cancelHeaders: ["日程", "時間", "氏名（アルファベット）", "氏名（カタカナ）", "国籍・地域", "身分", "操作"],
      cancel: "キャンセル",
      enterName: "予約時の氏名を入力してください。",
      noReservation: "予約記録が見つかりません。",
      cancelPrompt: (date, time) => date + " " + time + " の予約をキャンセルしますか？",
      cancelSucceeded: "予約をキャンセルしました。"
    },
    en: {
      scheduleTitle: "UEC Japanese Placement Test Reservation",
      scheduleHeaders: ["Time", "Sep 24 (Thu.)", "Sep 25 (Fri.)", "Sep 28 (Mon.)", "Sep 30 (Wed.)"],
      break: "Break",
      people: (count) => count + " seat" + (count === 1 ? "" : "s"),
      full: "Full",
      closed: "Closed",
      scheduleButtons: ["Manage reservations", "View or cancel reservation"],
      basicInfo: "Reservation details",
      formLabels: ["Time", "Date", "Name (alphabet)", "Name (katakana)", "Nationality / region", "Status"],
      namePlaceholder: "e.g. Yamada Taro",
      kanaPlaceholder: "e.g. ヤマダ タロウ",
      nationalityPlaceholder: "e.g. China, Japan, Vietnam",
      statusPlaceholder: "Please select",
      statusOptions: ["J: JUSST Program student", "RS: Research student", "D: Ph.D. student", "M: Master's student", "S: Spouse"],
      confirm: "Reserve",
      back: "Back",
      required: "Please fill in all fields.",
      fullMessage: "This time slot is fully booked. Please choose another time.",
      reservationPrompt: (data) => "Confirm this reservation?\n\nDate: " + data.date + "\nTime: " + data.time + "\nName: " + data.name + "\nKatakana: " + data.kana + "\nNationality / region: " + data.nationality + "\nStatus: " + data.status,
      reservationFailed: "Reservation failed. Please try again.",
      reservationSucceeded: "Reservation successful.",
      adminPasswordPrompt: "Enter the administrator password:",
      adminPasswordFailed: "Incorrect password.",
      settingsTitle: "Reservation slot settings",
      settingsTime: "Time",
      settingsDate: "Date",
      settingsSeats: "Capacity",
      settingsDeadline: "Reservation deadline (Japan time)",
      settingsSave: "Save",
      settingsSaving: "Saving…",
      settingsSaved: "Saved. The reservation page will use these settings.",
      settingsInvalid: "Choose four distinct valid dates and a reservation deadline.",
      settingsLoadFailed: "Unable to load settings. Check the database setup and connection, then reload.",
      settingsSaveFailed: "Unable to save. Check the password and connection.",
      settingsBack: "Back to reservation management",
      adminTitle: "Reservation list",
      adminHeaders: ["No.", "Date", "Time", "Name", "Katakana", "Nationality / region", "Status", "Created at"],
      exportCsv: "Download CSV",
      returnTop: "Back to top",
      loadFailed: "Unable to load data.",
      cancelTitle: "View or cancel reservation",
      searchPlaceholder: "Enter the name used for your reservation",
      search: "Search",
      cancelHeaders: ["Date", "Time", "Name (alphabet)", "Name (katakana)", "Nationality / region", "Status", "Action"],
      cancel: "Cancel",
      enterName: "Enter the name used for your reservation.",
      noReservation: "No reservation found.",
      cancelPrompt: (date, time) => "Cancel the reservation for " + date + " " + time + "?",
      cancelSucceeded: "Reservation cancelled."
    }
  };

  function getLanguage() {
    try {
      return localStorage.getItem(storageKey) === "en" ? "en" : "ja";
    } catch {
      return "ja";
    }
  }

  let language = getLanguage();

  function t(key, ...args) {
    const value = copy[language][key];
    return typeof value === "function" ? value(...args) : value;
  }

  function setTextList(selector, values) {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (values[index] !== undefined) element.textContent = values[index];
    });
  }

  function localizeSlotLabels() {
    document.querySelectorAll("td[data-capacity]").forEach((cell) => {
      cell.textContent = cell.classList.contains("full")
        ? t("full")
        : t("people", Number(cell.dataset.remaining || cell.dataset.capacity));
    });
  }

  function applyPageCopy() {
    document.documentElement.lang = language;

    if (page === "schedule") {
      document.title = t("scheduleTitle");
      document.querySelector("h2").textContent = t("scheduleTitle");
      document.querySelector("#schedule thead th").textContent = t("scheduleHeaders")[0];
      const breakCell = document.querySelector(".break");
      if (breakCell) breakCell.textContent = t("break");
      setTextList(".buttons .btn", t("scheduleButtons"));
      localizeSlotLabels();
    }

    if (page === "reservation") {
      document.title = t("basicInfo");
      document.querySelector("h2").textContent = t("basicInfo");
      setTextList(".details p strong", t("formLabels"));
      document.getElementById("name").placeholder = t("namePlaceholder");
      document.getElementById("kana").placeholder = t("kanaPlaceholder");
      document.getElementById("nationality").placeholder = t("nationalityPlaceholder");
      const status = document.getElementById("status");
      status.options[0].textContent = t("statusPlaceholder");
      t("statusOptions").forEach((label, index) => { status.options[index + 1].textContent = label; });
      document.getElementById("confirm").textContent = t("confirm");
      document.getElementById("back").textContent = t("back");
    }

    if (page === "schedule-settings") {
      document.title = t("settingsTitle");
      document.querySelector("h2").textContent = t("settingsTitle");
      document.getElementById("settings-time").textContent = t("settingsTime");
      document.getElementById("deadline-label").textContent = t("settingsDeadline");
      document.getElementById("save-settings").textContent = t("settingsSave");
      document.querySelector(".buttons .cancel").textContent = t("settingsBack");
    }

    if (page === "admin") {
      document.title = t("adminTitle");
      document.querySelector("h2").textContent = t("adminTitle");
      setTextList("#result-table thead th", t("adminHeaders"));
      document.getElementById("export-btn").textContent = t("exportCsv");
      document.getElementById("settings-link").textContent = t("settingsTitle");
      document.querySelector(".actions .cancel").textContent = t("returnTop");
    }

    if (page === "cancellation") {
      document.title = t("cancelTitle");
      document.querySelector("h2").textContent = t("cancelTitle");
      document.getElementById("name").placeholder = t("searchPlaceholder");
      document.getElementById("search").textContent = t("search");
      setTextList("#result-table thead th", t("cancelHeaders"));
      document.querySelector(".actions .cancel").textContent = t("returnTop");
    }

  }

  function createLanguageSwitch() {
    const container = document.querySelector(".container");
    if (!container || document.querySelector(".language-switch")) return;

    const switcher = document.createElement("div");
    switcher.className = "language-switch";
    switcher.setAttribute("aria-label", "Language selection");
    switcher.innerHTML = '<button type="button" data-language="ja">日本語</button><button type="button" data-language="en">English</button>';
    switcher.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.language));
    });
    container.prepend(switcher);
  }

  function updateLanguageSwitch() {
    document.querySelectorAll(".language-switch button").forEach((button) => {
      const selected = button.dataset.language === language;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function setLanguage(nextLanguage) {
    language = nextLanguage === "en" ? "en" : "ja";
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // Browsing still works when storage is unavailable.
    }
    applyPageCopy();
    updateLanguageSwitch();
    document.dispatchEvent(new CustomEvent("reservation-language-change", { detail: { language } }));
  }

  async function loadFooter() {
    const container = document.getElementById("footer-container");
    if (!container) return;
    try {
      const response = await fetch("footer.html");
      container.innerHTML = await response.text();
    } catch (error) {
      console.error("Unable to load footer:", error);
    }
  }

  function formatJapaneseDate(dateString) {
    const [year, month, day] = /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ? dateString.split("-").map(Number)
      : [2026, ...dateString.split("/").map(Number)];
    const date = new Date(year, month - 1, day);
    const weekdays = language === "ja"
      ? ["日", "月", "火", "水", "木", "金", "土"]
      : ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];

    return language === "ja"
      ? month + "月" + day + "日（" + weekdays[date.getDay()] + "）"
      : month + "/" + day + " (" + weekdays[date.getDay()] + ")";
  }

  createLanguageSwitch();
  setLanguage(language);

  return { client, formatJapaneseDate, loadFooter, t, getLanguage, localizeSlotLabels };
})();
