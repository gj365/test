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
      nationalityPlaceholder: "例：中国、日本、アメリカ",
      statusPlaceholder: "選択してください",
      statusOptions: ["J：JUSST プログラム学生", "RS：研究生", "D：博士後期課程学生", "M：博士前期課程学生", "S：配偶者"],
      confirm: "この内容で予約する",
      back: "日時選択へ戻る",
      required: "未入力の項目があります。すべての項目を入力してから、もう一度お試しください。",
      fullMessage: "この時間帯は満席です。恐れ入りますが、ほかの時間帯を選択してください。",
      closedMessage: "予約受付は終了しました。",
      alreadyReserved: "すでに予約があります。1人につき予約できるのは1回のみです。",
      invalidSlot: "選択した日時は予約できません。日時選択ページから、もう一度選択してください。",
      reservationPrompt: (data) => "以下の内容で予約します。\n\n日程：" + data.date + "\n時間：" + data.time + "\n氏名：" + data.name + "\n国籍・地域：" + data.nationality + "\n身分：" + data.status + "\n\nよろしいですか？",
      reservationFailed: "予約を完了できませんでした。通信状況を確認して、もう一度お試しください。",
      reservationSucceeded: "予約が完了しました。以下の予約番号は、確認・キャンセル時に必要です。",
      reservationCodeLabel: "予約番号",
      reservationCodeNotice: "この番号は再表示できません。必ず保存してください。",
      adminTitle: "予約管理｜予約一覧",
      adminSubtitle: "スタッフアカウントでログイン済みの場合のみ、予約一覧を表示できます。",
      adminHeaders: ["日程", "時間", "氏名", "カタカナ", "国籍・地域", "身分", "登録日時"],
      exportCsv: "CSV をダウンロード",
      adminTabs: ["予約一覧", "時段・名額管理", "受付期間設定"],
      slotLabels: ["日付", "時間", "定員", "受付中"],
      saveSlot: "時段を保存",
      settingsLabels: ["予約受付を有効にする", "受付開始日時", "受付終了日時"],
      saveSettings: "設定を保存",
      saved: "設定を保存しました。",
      returnTop: "トップへ戻る",
      staffOnly: "このページはスタッフ専用です。管理者アカウントでログインしてください。",
      staffLogin: "Google でスタッフログイン",
      loadFailed: "データを読み込めませんでした。ネットワーク接続を確認して、もう一度お試しください。",
      cancelTitle: "予約の確認・キャンセル",
      cancelSubtitle: "予約完了時に表示された予約番号を入力してください。",
      reservationCodePlaceholder: "例：A1B2C3D4E5F6",
      search: "予約を確認する",
      cancelHeaders: ["日程", "時間", "氏名", "カタカナ", "国籍・地域", "身分", "操作"],
      cancel: "この予約をキャンセル",
      enterReservationCode: "予約番号を入力してください。",
      noReservation: "該当する予約は見つかりませんでした。予約番号を確認してください。",
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
      nationalityPlaceholder: "e.g. China, Japan, United States",
      statusPlaceholder: "Please select",
      statusOptions: ["J: JUSST Program student", "RS: Research student", "D: Ph.D. student", "M: Master's student", "S: Spouse"],
      confirm: "Confirm reservation",
      back: "Back to time selection",
      required: "Some required information is missing. Please complete all fields and try again.",
      fullMessage: "This time slot is fully booked. Please choose another available time.",
      closedMessage: "The reservation period has ended.",
      alreadyReserved: "You already have a reservation. Each student may reserve only one time slot.",
      invalidSlot: "This time slot is not available. Please return to the schedule and choose a listed slot.",
      reservationPrompt: (data) => "Confirm this reservation?\n\nDate: " + data.date + "\nTime: " + data.time + "\nName: " + data.name + "\nNationality / region: " + data.nationality + "\nStatus: " + data.status,
      reservationFailed: "We could not complete your reservation. Check your connection and try again.",
      reservationSucceeded: "Your reservation is complete. You need the reservation code below to view or cancel it.",
      reservationCodeLabel: "Reservation code",
      reservationCodeNotice: "This code cannot be shown again. Please save it now.",
      adminTitle: "Reservation management | List",
      adminSubtitle: "The reservation list is available only to signed-in staff accounts.",
      adminHeaders: ["Date", "Time", "Name", "Katakana", "Nationality / region", "Status", "Created at"],
      exportCsv: "Download CSV",
      adminTabs: ["Reservations", "Slots and capacity", "Booking period"],
      slotLabels: ["Date", "Time", "Capacity", "Open for booking"],
      saveSlot: "Save slot",
      settingsLabels: ["Enable reservations", "Booking opens", "Booking closes"],
      saveSettings: "Save settings",
      saved: "Settings saved.",
      returnTop: "Back to top",
      staffOnly: "This page is for staff only. Sign in with an administrator account.",
      staffLogin: "Staff sign in with Google",
      loadFailed: "We could not load the data. Check your network connection and try again.",
      cancelTitle: "View or cancel reservation",
      cancelSubtitle: "Enter the reservation code displayed after your reservation was completed.",
      reservationCodePlaceholder: "e.g. A1B2C3D4E5F6",
      search: "View reservation",
      cancelHeaders: ["Date", "Time", "Name", "Katakana", "Nationality / region", "Status", "Action"],
      cancel: "Cancel this reservation",
      enterReservationCode: "Enter your reservation code.",
      noReservation: "No reservation was found. Please check your reservation code.",
      cancelPrompt: (date, time) => "Cancel the reservation for " + date + " " + time + "?\nThis action cannot be undone.",
      cancelSucceeded: "Reservation cancelled."
    }
  };

  /** 从浏览器读取语言偏好；没有记录时使用日文。 */
  function getLanguage() {
    try {
      return localStorage.getItem(storageKey) === "en" ? "en" : "ja";
    } catch {
      return "ja";
    }
  }

  let language = getLanguage();

  /** 根据当前语言取得文案；支持传递文案所需参数。 */
  function t(key, ...args) {
    const value = copy[language][key];
    return typeof value === "function" ? value(...args) : value;
  }

  /** 依次替换多个元素的显示文字。 */
  function setTextList(selector, values) {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (values[index] !== undefined) element.textContent = values[index];
    });
  }

  /** 根据剩余名额和当前语言更新课程表中的名额文字。 */
  function localizeSlotLabels() {
    document.querySelectorAll("td[data-capacity]").forEach((cell) => {
      cell.textContent = cell.classList.contains("full")
        ? t("full")
        : t("people", Number(cell.dataset.remaining || cell.dataset.capacity));
    });
  }

  /** 把当前页面的标题、说明、表头和按钮替换为所选语言。 */
  function applyPageCopy() {
    document.documentElement.lang = language;
    const subtitle = document.querySelector("[data-page-subtitle]");

    if (page === "schedule") {
      document.title = t("scheduleTitle");
      document.querySelector("h2").textContent = t("scheduleTitle");
      subtitle.textContent = t("scheduleSubtitle");
      setTextList("#schedule thead th", t("scheduleHeaders"));
      document.querySelector(".break").textContent = t("break");
      setTextList(".buttons .btn", t("scheduleButtons"));
      localizeSlotLabels();
    }

    if (page === "reservation") {
      document.title = t("basicInfo");
      document.querySelector("h2").textContent = t("basicInfo");
      subtitle.textContent = t("formSubtitle");
      setTextList(".details p strong", t("formLabels"));
      document.getElementById("name").placeholder = t("namePlaceholder");
      document.getElementById("kana").placeholder = t("kanaPlaceholder");
      document.getElementById("nationality").placeholder = t("nationalityPlaceholder");
      const status = document.getElementById("status");
      status.options[0].textContent = t("statusPlaceholder");
      t("statusOptions").forEach((label, index) => { status.options[index + 1].textContent = label; });
      document.getElementById("confirm").textContent = t("confirm");
      document.getElementById("back").textContent = t("back");
      document.getElementById("success-message").textContent = t("reservationSucceeded");
      document.querySelector("[data-reservation-code-label]").textContent = t("reservationCodeLabel");
      document.getElementById("reservation-code-notice").textContent = t("reservationCodeNotice");
      document.querySelector("#reservation-success .btn").textContent = t("returnTop");
    }

    if (page === "admin") {
      document.title = t("adminTitle");
      document.querySelector("h2").textContent = t("adminTitle");
      subtitle.textContent = t("adminSubtitle");
      setTextList("#result-table thead th", t("adminHeaders"));
      document.getElementById("export-btn").textContent = t("exportCsv");
      setTextList("[data-admin-tab]", t("adminTabs"));
      setTextList("[data-slot-label]", t("slotLabels"));
      setTextList("[data-settings-label]", t("settingsLabels"));
      document.getElementById("save-slot").textContent = t("saveSlot");
      document.getElementById("save-settings").textContent = t("saveSettings");
      document.querySelector(".actions .cancel").textContent = t("returnTop");
      document.getElementById("staff-login").textContent = t("staffLogin");
    }

    if (page === "cancellation") {
      document.title = t("cancelTitle");
      document.querySelector("h2").textContent = t("cancelTitle");
      subtitle.textContent = t("cancelSubtitle");
      document.getElementById("reservation-code").placeholder = t("reservationCodePlaceholder");
      document.getElementById("search").textContent = t("search");
      setTextList("#result-table thead th", t("cancelHeaders"));
      document.querySelector(".actions .cancel").textContent = t("returnTop");
    }
  }

  /** 在页面顶部创建日文/英文切换按钮。 */
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

  /** 用样式和辅助属性标记当前启用的语言。 */
  function updateLanguageSwitch() {
    document.querySelectorAll(".language-switch button").forEach((button) => {
      const selected = button.dataset.language === language;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  /** 保存语言选择、刷新页面文字，并通知各页面脚本更新动态内容。 */
  function setLanguage(nextLanguage) {
    language = nextLanguage === "en" ? "en" : "ja";
    try {
      localStorage.setItem(storageKey, language);
    } catch {
      // 浏览器禁止本地存储时，仍可在当前页面正常切换语言。
    }
    applyPageCopy();
    updateLanguageSwitch();
    document.dispatchEvent(new CustomEvent("reservation-language-change"));
  }

  /** 载入全站共用页脚，避免每个页面重复维护同一段 HTML。 */
  async function loadFooter() {
    const container = document.getElementById("footer-container");
    if (!container) return;
    try {
      const response = await fetch("footer.html");
      container.innerHTML = await response.text();
    } catch (error) {
      console.error("页脚载入失败：", error);
    }
  }

  /** 按当前语言格式化数据库保存的 ISO 日期。 */
  function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    const weekdays = language === "ja"
      ? ["日", "月", "火", "水", "木", "金", "土"]
      : ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return language === "ja"
      ? month + "月" + day + "日（" + weekdays[date.getDay()] + "）"
      : month + "/" + day + " (" + weekdays[date.getDay()] + ")";
  }

  createLanguageSwitch();
  setLanguage(language);

  return { client, formatDate, loadFooter, t, localizeSlotLabels };
})();
