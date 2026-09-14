window.ReservationApp = (() => {
  const SUPABASE_URL = "https://iodijnhbxihastuknqky.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGlqbmhieGloYXN0dWtucWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjgyNTIsImV4cCI6MjA4NTQ0NDI1Mn0.PTG1s0Zv14VX-yfrZNmJqyu-R7wlvJl3_YYcq40g6Y4";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const page = document.body.dataset.page;
  const storageKey = "uec-reservation-language";

  const copy = {
    ja: {
      scheduleTitle: "UEC 日本語プレイスメントテスト｜予約ポータル",
      scheduleSubtitle: "希望する日時を選択してください。表示されている人数は残りの予約可能枠です。",
      scheduleHeaders: ["時間", "9月24日（木）", "9月25日（金）", "9月28日（月）", "9月30日（水）"],
      break: "休憩",
      people: (count) => count + "名",
      full: "満席",
      closed: "受付終了",
      scheduleButtons: ["予約管理（スタッフ用）", "予約の確認・キャンセル"],
      basicInfo: "予約内容の入力",
      formSubtitle: "選択した日時を確認し、必要事項を入力してください。",
      formLabels: ["時間", "日程", "氏名（アルファベット）", "氏名（カタカナ）", "国籍・地域", "在留資格・身分"],
      namePlaceholder: "例：Yamada Taro",
      kanaPlaceholder: "例：ヤマダ タロウ",
      nationalityPlaceholder: "例：中国、日本、ベトナム",
      statusPlaceholder: "選択してください",
      statusOptions: ["J：JUSST プログラム学生", "RS：研究生", "D：博士後期課程学生", "M：博士前期課程学生", "S：配偶者"],
      confirm: "この内容で予約する",
      back: "日時選択へ戻る",
      required: "未入力の項目があります。すべての項目を入力してから、もう一度お試しください。",
      fullMessage: "この時間帯は満席です。恐れ入りますが、ほかの時間帯を選択してください。",
      reservationPrompt: (data) => "以下の内容で予約します。\n\n日程：" + data.date + "\n時間：" + data.time + "\n氏名：" + data.name + "\nカタカナ：" + data.kana + "\n国籍・地域：" + data.nationality + "\n身分：" + data.status + "\n\nよろしいですか？",
      reservationFailed: "予約を完了できませんでした。通信状況を確認して、もう一度お試しください。",
      reservationSucceeded: "予約が完了しました。予約日時を控えてください。",
      adminPasswordPrompt: "予約管理用のパスワードを入力してください：",
      adminPasswordFailed: "パスワードが正しくありません。トップページに戻ります。",
      adminTitle: "予約管理｜予約一覧",
      adminSubtitle: "現在登録されている予約を確認し、必要に応じて CSV をダウンロードできます。",
      adminHeaders: ["日程", "時間", "氏名", "カタカナ", "国籍・地域", "身分", "メールアドレス", "登録日時"],
      exportCsv: "CSV をダウンロード",
      returnTop: "トップへ戻る",
      loadFailed: "データを読み込めませんでした。ネットワーク接続を確認して、もう一度お試しください。",
      cancelTitle: "予約の確認・キャンセル",
      cancelSubtitle: "予約時に入力した氏名（アルファベット）で検索してください。",
      searchPlaceholder: "例：Yamada Taro",
      search: "検索",
      cancelHeaders: ["日程", "時間", "氏名（アルファベット）", "氏名（カタカナ）", "国籍・地域", "身分", "操作"],
      cancel: "キャンセル",
      enterName: "予約時に入力した氏名（アルファベット）を入力してください。",
      noReservation: "該当する予約は見つかりませんでした。入力内容を確認して、もう一度検索してください。",
      cancelPrompt: (date, time) => date + " " + time + " の予約をキャンセルしますか？\nこの操作は取り消せません。",
      cancelSucceeded: "予約をキャンセルしました。"
    },
    en: {
      scheduleTitle: "UEC Japanese Placement Test | Reservation Portal",
      scheduleSubtitle: "Choose a time slot. The number shown is the number of seats still available.",
      scheduleHeaders: ["Time", "Sep 24 (Thu.)", "Sep 25 (Fri.)", "Sep 28 (Mon.)", "Sep 30 (Wed.)"],
      break: "Break",
      people: (count) => count + " seat" + (count === 1 ? "" : "s"),
      full: "Full",
      closed: "Closed",
      scheduleButtons: ["Manage reservations (staff)", "View or cancel reservation"],
      basicInfo: "Reservation details",
      formSubtitle: "Review the selected time and complete all required fields.",
      formLabels: ["Time", "Date", "Name (alphabet)", "Name (katakana)", "Nationality / region", "Status"],
      namePlaceholder: "e.g. Yamada Taro",
      kanaPlaceholder: "e.g. ヤマダ タロウ",
      nationalityPlaceholder: "e.g. China, Japan, Vietnam",
      statusPlaceholder: "Please select",
      statusOptions: ["J: JUSST Program student", "RS: Research student", "D: Ph.D. student", "M: Master's student", "S: Spouse"],
      confirm: "Confirm reservation",
      back: "Back to time selection",
      required: "Some required information is missing. Please complete all fields and try again.",
      fullMessage: "This time slot is fully booked. Please choose another available time.",
      reservationPrompt: (data) => "Confirm this reservation?\n\nDate: " + data.date + "\nTime: " + data.time + "\nName: " + data.name + "\nKatakana: " + data.kana + "\nNationality / region: " + data.nationality + "\nStatus: " + data.status,
      reservationFailed: "We could not complete your reservation. Check your connection and try again.",
      reservationSucceeded: "Your reservation is complete. Please keep a note of your date and time.",
      adminPasswordPrompt: "Enter the reservation-management password:",
      adminPasswordFailed: "Incorrect password. Returning to the top page.",
      adminTitle: "Reservation management | List",
      adminSubtitle: "Review current reservations or download the list as a CSV file.",
      adminHeaders: ["Date", "Time", "Name", "Katakana", "Nationality / region", "Status", "Email", "Created at"],
      exportCsv: "Download CSV",
      returnTop: "Back to top",
      loadFailed: "We could not load the data. Check your network connection and try again.",
      cancelTitle: "View or cancel reservation",
      cancelSubtitle: "Search using the alphabetic name entered when you made your reservation.",
      searchPlaceholder: "e.g. Yamada Taro",
      search: "Search",
      cancelHeaders: ["Date", "Time", "Name (alphabet)", "Name (katakana)", "Nationality / region", "Status", "Action"],
      cancel: "Cancel",
      enterName: "Enter the alphabetic name used for your reservation.",
      noReservation: "No matching reservation was found. Please check the name and try again.",
      cancelPrompt: (date, time) => "Cancel the reservation for " + date + " " + time + "?\nThis action cannot be undone.",
      cancelSucceeded: "Reservation cancelled."
    }
  };

  /** Returns the saved language, with Japanese as the default. */
  function getLanguage() {
    try {
      return localStorage.getItem(storageKey) === "en" ? "en" : "ja";
    } catch {
      return "ja";
    }
  }

  let language = getLanguage();

  /** Resolves a translated phrase; supports phrases that require parameters. */
  function t(key, ...args) {
    const value = copy[language][key];
    return typeof value === "function" ? value(...args) : value;
  }

  /** Replaces a sequence of matching elements with the corresponding translations. */
  function setTextList(selector, values) {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (values[index] !== undefined) element.textContent = values[index];
    });
  }

  /** Updates availability labels after the selected language or remaining seats change. */
  function localizeSlotLabels() {
    document.querySelectorAll("td[data-capacity]").forEach((cell) => {
      cell.textContent = cell.classList.contains("full")
        ? t("full")
        : t("people", Number(cell.dataset.remaining || cell.dataset.capacity));
    });
  }

  /** Applies translated titles, labels, buttons, and descriptive copy to the current page. */
  function applyPageCopy() {
    document.documentElement.lang = language;

    if (page === "schedule") {
      document.title = t("scheduleTitle");
      document.querySelector("h2").textContent = t("scheduleTitle");
      document.querySelector("[data-page-subtitle]").textContent = t("scheduleSubtitle");
      setTextList("#schedule thead th", t("scheduleHeaders"));
      document.querySelector(".break").textContent = t("break");
      setTextList(".buttons .btn", t("scheduleButtons"));
      localizeSlotLabels();
    }

    if (page === "reservation") {
      document.title = t("basicInfo");
      document.querySelector("h2").textContent = t("basicInfo");
      document.querySelector("[data-page-subtitle]").textContent = t("formSubtitle");
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

    if (page === "admin") {
      document.title = t("adminTitle");
      document.querySelector("h2").textContent = t("adminTitle");
      document.querySelector("[data-page-subtitle]").textContent = t("adminSubtitle");
      setTextList("#result-table thead th", t("adminHeaders"));
      document.getElementById("export-btn").textContent = t("exportCsv");
      document.querySelector(".actions .cancel").textContent = t("returnTop");
    }

    if (page === "cancellation") {
      document.title = t("cancelTitle");
      document.querySelector("h2").textContent = t("cancelTitle");
      document.querySelector("[data-page-subtitle]").textContent = t("cancelSubtitle");
      document.getElementById("name").placeholder = t("searchPlaceholder");
      document.getElementById("search").textContent = t("search");
      setTextList("#result-table thead th", t("cancelHeaders"));
      document.querySelector(".actions .cancel").textContent = t("returnTop");
    }

  }

  /** Adds the persistent Japanese/English switch at the top of each page. */
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

  /** Marks the active language button for visual and assistive-technology feedback. */
  function updateLanguageSwitch() {
    document.querySelectorAll(".language-switch button").forEach((button) => {
      const selected = button.dataset.language === language;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  /** Saves a language choice, refreshes the page copy, and notifies page modules. */
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

  /** Loads the shared footer fragment without duplicating it in every HTML file. */
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

  /** Formats a stored M/D date in the language currently selected by the visitor. */
  function formatJapaneseDate(dateString) {
    const [month, day] = dateString.split("/").map(Number);
    const date = new Date(2026, month - 1, day);
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
