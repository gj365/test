const { client: supabaseClient, loadFooter, t, localizeSlotLabels } = window.ReservationApp;
let scheduleLoaded = false;

loadFooter();

/** 系统未开放或没有开放时段时，禁用课程表并显示明确的关闭提示。 */
function closeSchedule() {
  document.querySelectorAll(".slot").forEach((cell) => {
    cell.classList.add("full");
    cell.style.pointerEvents = "none";
  });

  const message = document.createElement("p");
  message.className = "alert";
  message.dataset.closedNotice = "true";
  message.textContent = t("closed");
  document.querySelector(".container").prepend(message);
  localizeSlotLabels();
}

/** 仅在课程表已载入且时段可用时，进入预约表单。 */
function goToEnrollPage(time, date) {
  if (!scheduleLoaded) return;

  const cell = document.querySelector('td[data-time="' + time + '"][data-date="' + date + '"]');
  if (!cell || cell.classList.contains("full")) {
    alert(t("fullMessage"));
    return;
  }

  window.location.href = "input.html?time=" + encodeURIComponent(time)
    + "&date=" + encodeURIComponent(date);
}

/** 将数据库返回的剩余名额写入对应的课程表格。 */
function renderAvailability(slots) {
  if (!slots.length) {
    closeSchedule();
    return;
  }

  const slotMap = new Map(slots.map((slot) => [slot.slot_date + "_" + slot.time_slot, slot.remaining]));

  document.querySelectorAll("td[data-capacity]").forEach((cell) => {
    const remaining = slotMap.get(cell.dataset.date + "_" + cell.dataset.time);
    const available = Number.isInteger(remaining) && remaining > 0;

    cell.dataset.remaining = String(Math.max(remaining || 0, 0));
    cell.classList.toggle("full", !available);
    cell.classList.toggle("slot", available);
    cell.style.pointerEvents = available ? "" : "none";
  });

  localizeSlotLabels();
}

/** 通过仅返回名额的 RPC 读取课程表，避免向公众公开预约者资料。 */
async function loadSchedule() {
  const { data, error } = await supabaseClient.rpc("get_reservation_schedule");

  if (error) {
    console.error("课程表载入失败：", error.message);
    return;
  }

  renderAvailability(data || []);
  scheduleLoaded = true;
}

// 使用事件监听替代 HTML 内联 onclick，使行为集中在本模块中维护。
document.querySelectorAll("td[data-time][data-date]").forEach((cell) => {
  cell.addEventListener("click", () => goToEnrollPage(cell.dataset.time, cell.dataset.date));
});

loadSchedule();

// 切换语言时只更新时段标签，不重复请求数据库。
document.addEventListener("reservation-language-change", () => {
  const notice = document.querySelector("[data-closed-notice]");
  if (notice) notice.textContent = t("closed");
  localizeSlotLabels();
});
