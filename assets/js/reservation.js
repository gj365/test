const { client: supabaseClient, formatDate, loadFooter, t } = window.ReservationApp;
const parameters = new URLSearchParams(window.location.search);
const timeSlot = parameters.get("time");
const slotDate = parameters.get("date");

loadFooter();

/** 按当前语言显示从课程表带来的预约日期和时间。 */
function renderSelectedSlot() {
  document.getElementById("time-slot").textContent = timeSlot || "";
  document.getElementById("date").textContent = slotDate ? formatDate(slotDate) : "";
}

/** 将数据库错误代码转换为学生可理解的提示。 */
function getReservationErrorMessage(error) {
  if (error.code === "P0001" && error.message.includes("already_reserved")) return t("alreadyReserved");
  if (error.code === "P0001" && error.message.includes("slot_full")) return t("fullMessage");
  if (error.code === "P0001" && error.message.includes("invalid_slot")) return t("invalidSlot");
  if (error.code === "P0001" && error.message.includes("closed")) return t("closedMessage");
  return t("reservationFailed");
}

/** 显示预约成功信息和只显示一次的预约编号。 */
function showReservationComplete(reservationCode) {
  document.querySelector(".details").hidden = true;
  document.querySelector(".form-actions").hidden = true;
  document.getElementById("alert-message").hidden = true;
  document.getElementById("reservation-code").textContent = reservationCode;
  document.getElementById("reservation-success").hidden = false;
}

// 点击返回时不提交任何个人资料。
document.getElementById("back").addEventListener("click", () => {
  window.location.href = "index.html";
});

// 校验表单、让学生确认内容，再通过原子 RPC 创建预约。
document.getElementById("confirm").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const kana = document.getElementById("kana").value.trim();
  const nationality = document.getElementById("nationality").value.trim();
  const status = document.getElementById("status").value;

  if (!name || !kana || !nationality || !status) {
    alert(t("required"));
    return;
  }

  if (!timeSlot || !slotDate) {
    alert(t("invalidSlot"));
    window.location.href = "index.html";
    return;
  }

  const confirmed = confirm(t("reservationPrompt", {
    date: formatDate(slotDate),
    time: timeSlot,
    name,
    kana,
    nationality,
    status: document.getElementById("status").selectedOptions[0].textContent
  }));
  if (!confirmed) return;

  const { data, error } = await supabaseClient.rpc("create_reservation", {
    p_slot_date: slotDate,
    p_time_slot: timeSlot,
    p_name: name,
    p_kana: kana,
    p_nationality: nationality,
    p_status: status
  });

  if (error) {
    console.error("预约创建失败：", error);
    alert(getReservationErrorMessage(error));
    return;
  }

  showReservationComplete(data);
});

// 语言切换时同步刷新预约日期的显示格式。
document.addEventListener("reservation-language-change", renderSelectedSlot);
renderSelectedSlot();
