window.ReservationApp = (() => {
  const SUPABASE_URL = "https://iodijnhbxihastuknqky.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvZGlqbmhieGloYXN0dWtucWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NjgyNTIsImV4cCI6MjA4NTQ0NDI1Mn0.PTG1s0Zv14VX-yfrZNmJqyu-R7wlvJl3_YYcq40g6Y4";
  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const page = document.body.dataset.page;
  const storageKey = "uec-reservation-language";

  const copy = {
    ja: {
      duplicateReservation: "この氏名はすでに予約されています。予約はお一人につき1件のみです。",
      manageSchedule: "日程・時間・定員の管理",
      scheduleHelp: "日付ごとの時間帯と総定員を管理します。0 は予約不可です。編集後「保存」で全体に反映されます。予約済みの枠は削除・日時変更できません。",
      editSchedule: "編集",
      saveSchedule: "保存",
      discardSchedule: "変更を破棄",
      reloadSchedule: "再読み込み",
      addDate: "日付を追加",
      addTime: "時間帯を追加",
      removeSchedule: "削除",
      backAdmin: "予約管理へ戻る",
      readonlySchedule: "閲覧モード",
      editingSchedule: "編集中・未保存",
      savingSchedule: "保存中…",
      loadingSchedule: "読み込み中…",
      scheduleSaved: "保存しました。予約画面に反映されます。",
      invalidSchedule: "有効な日付・開始／終了時間・0〜999 の整数定員を入力してください。最低1日・1時間帯が必要です。",
      duplicateSchedule: "日付または時間帯が重複しています。",
      overlapSchedule: "時間帯が重なっています。",
      scheduleSetup: "日程管理の初期設定が必要です。管理者にお問い合わせください。",
      scheduleConflict: "他の管理者が更新しました。変更を控えてから破棄し、再読み込みしてください。",
      bookedSchedule: "予約済みの枠は削除・日時変更できません。定員は予約人数以上にしてください。",
      saveFailed: "保存できませんでした。入力内容は保持されています。再度お試しください。",
      dateLabel: "日付",
      startTime: "開始時間",
      endTime: "終了時間",
      capacityLabel: "総定員",
      scheduleTitle: "UEC 日本語プレイスメントテスト予約",
      scheduleHeaders: ["時間", "9月24日（木）", "9月25日（金）", "9月28日（月）", "9月30日（水）"],
      break: "休憩",
      people: (count) => count + "名",
      full: "満席",
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
      adminTitle: "予約一覧",
      adminHeaders: ["日程", "時間", "氏名", "カタカナ", "国籍・地域", "身分", "メールアドレス", "登録日時"],
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
      duplicateReservation: "This name already has a reservation. Only one reservation per name is allowed.",
      manageSchedule: "Manage dates, times and capacity",
      scheduleHelp: "Manage dates, time slots and total capacity. Set 0 to close a slot. Changes apply to everyone after saving. Booked slots cannot be removed or rescheduled.",
      editSchedule: "Edit",
      saveSchedule: "Save",
      discardSchedule: "Discard changes",
      reloadSchedule: "Reload",
      addDate: "Add date",
      addTime: "Add time slot",
      removeSchedule: "Remove",
      backAdmin: "Back to reservations",
      readonlySchedule: "Read only",
      editingSchedule: "Editing · Unsaved",
      savingSchedule: "Saving…",
      loadingSchedule: "Loading…",
      scheduleSaved: "Saved. The reservation schedule now uses these settings.",
      invalidSchedule: "Enter valid dates, start/end times and integer capacities from 0 to 999. At least one date and time slot are required.",
      duplicateSchedule: "Dates or time slots are duplicated.",
      overlapSchedule: "Time slots overlap.",
      scheduleSetup: "Schedule management needs initial setup. Please contact the administrator.",
      scheduleConflict: "Another administrator updated the schedule. Copy your changes, discard them, then reload.",
      bookedSchedule: "Booked slots cannot be removed or rescheduled. Capacity must cover existing reservations.",
      saveFailed: "Unable to save. Your changes are retained. Please try again.",
      dateLabel: "Date",
      startTime: "Start time",
      endTime: "End time",
      capacityLabel: "Total capacity",
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
      adminTitle: "Reservation list",
      adminHeaders: ["Date", "Time", "Name", "Katakana", "Nationality / region", "Status", "Email", "Created at"],
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

  /** 读取保存的语言，存储不可用时使用日语。 */
  function getLanguage() {
    try {
      return localStorage.getItem(storageKey) === "en" ? "en" : "ja";
    } catch {
      return "ja";
    }
  }

  let language = getLanguage();

  /** 读取当前语言文案，并为动态文案传入参数。 */
  function t(key, ...args) {
    const value = copy[language][key];
    return typeof value === "function" ? value(...args) : value;
  }

  /** 按 DOM 顺序更新一组标签的翻译。 */
  function setTextList(selector, values) {
    document.querySelectorAll(selector).forEach((element, index) => {
      if (values[index] !== undefined) element.textContent = values[index];
    });
  }

  /** 根据余位和满席状态更新名额文案。 */
  function localizeSlotLabels() {
    document.querySelectorAll("td[data-capacity]").forEach((cell) => {
      cell.textContent = cell.classList.contains("full")
        ? t("full")
        : t("people", Number(cell.dataset.remaining || cell.dataset.capacity));
    });
  }

  /** 根据页面类型更新标题、表头及表单文案。 */
  function applyPageCopy() {
    document.documentElement.lang = language;

    if (page === "schedule") {
      document.title = t("scheduleTitle");
      document.querySelector("h2").textContent = t("scheduleTitle");
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

    if (page === "admin") {
      document.title = t("adminTitle");
      document.querySelector("h2").textContent = t("adminTitle");
      setTextList("#result-table thead th", t("adminHeaders"));
      document.getElementById("export-btn").textContent = t("exportCsv");
      document.getElementById("manage-schedule").textContent = t("manageSchedule");
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

  /** 创建日英切换按钮并绑定事件。 */
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

  /** 同步语言按钮的选中和无障碍状态。 */
  function updateLanguageSwitch() {
    document.querySelectorAll(".language-switch button").forEach((button) => {
      const selected = button.dataset.language === language;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  /** 保存语言偏好并通知业务页面刷新。 */
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

  /** 加载公共页脚，失败时记录错误。 */
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

  /** 兼容完整日期与旧版月/日格式，按语言显示日期及星期。 */
  function formatJapaneseDate(dateString) {
    if (!dateString) return "";
    const [year, month, day] = dateString.includes("-")
      ? dateString.split("-").map(Number)
      : [2026, ...dateString.split("/").map(Number)];
    const date = new Date(year, month - 1, day);
    const weekdays = language === "ja"
      ? ["日", "月", "火", "水", "木", "金", "土"]
      : ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];

    return language === "ja"
      ? year + "年" + month + "月" + day + "日（" + weekdays[date.getDay()] + "）"
      : year + "/" + month + "/" + day + " (" + weekdays[date.getDay()] + ")";
  }

  /** 将新预约表关联的场次字段展开为列表与 CSV 使用的显示结构。 */
  function flattenReservation(reservation) {
    const slot = reservation.slot;
    const displayTime = (value) => Number(value.slice(0, 2)) + value.slice(2, 5);
    return {
      ...reservation,
      date: slot.exam_date,
      time_slot: displayTime(slot.starts_at) + " - " + displayTime(slot.ends_at)
    };
  }

  createLanguageSwitch();
  setLanguage(language);

  return { client, formatJapaneseDate, loadFooter, t, getLanguage, localizeSlotLabels, flattenReservation };
})();
