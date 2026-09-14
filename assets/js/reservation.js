const { client: supabaseClient, formatJapaneseDate, loadFooter, t } = window.ReservationApp;

const parameters = new URLSearchParams(window.location.search);
const timeSlot = parameters.get("time");
const date = parameters.get("date");
const slotId = parameters.get("slot");

loadFooter();

/** 显示网址传入的预约日期和时间。 */
function renderSelectedSlot() {
  document.getElementById("time-slot").textContent = timeSlot || "";
  document.getElementById("date").textContent = date ? formatJapaneseDate(date) : "";
}

/** 重新读取场次配置与人数，检查当前场次是否仍可预约。 */
async function hasAvailability() {
  let slot;
  try {
    const settings = await window.ScheduleStore.load();
    if (new Date() > new Date(settings.deadline)) {
      document.getElementById("alert-message").textContent = t("closed");
      return false;
    }
    slot = settings.slots.find((item) => item.id === slotId && item.date === date && item.time_slot === timeSlot);
  } catch (error) {
    document.getElementById("alert-message").textContent = t("loadFailed");
    return false;
  }
  if (!slot || slot.capacity <= 0) {
    document.getElementById("alert-message").textContent = t("fullMessage");
    return false;
  }
  if (slot.booked >= slot.capacity) {
    document.getElementById("alert-message").textContent = t("fullMessage");
    window.setTimeout(() => { window.location.href = "index.html"; }, 3000);
    return false;
  }

  return true;
}

// 返回排期页，不提交当前表单。
document.getElementById("back").addEventListener("click", () => {
  window.location.href = "index.html";
});

// 提交前检查必填项与最新名额，用户确认后写入预约表。
document.getElementById("confirm").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const kana = document.getElementById("kana").value.trim();
  const nationality = document.getElementById("nationality").value.trim();
  const status = document.getElementById("status").value;

  if (!name || !kana || !nationality || !status) {
    alert(t("required"));
    return;
  }

  if (!slotId || !timeSlot || !date) {
    window.location.href = "index.html";
    return;
  }

  const available = await hasAvailability();
  if (!available) return;

  const confirmed = confirm(t("reservationPrompt", {
    date: formatJapaneseDate(date),
    time: timeSlot,
    name,
    kana,
    nationality,
    status: document.getElementById("status").selectedOptions[0].textContent
  }));
  if (!confirmed) return;

  const button = document.getElementById("confirm");
  if (button.disabled) return;
  button.disabled = true;
  try {
    // 日期、时间由场次外键决定；数据库触发器再次锁定场次检查容量。
    const { error } = await supabaseClient.from("exam_reservations")
      .insert([{ slot_id: slotId, name, kana, nationality, status }]);
    if (error) throw error;
    alert(t("reservationSucceeded"));
    window.location.href = "index.html";
  } catch (error) {
    console.error(error);
    alert(t(error.code === "23505" ? "duplicateReservation" : error.message === "SLOT_FULL" ? "fullMessage" : error.message === "BOOKING_CLOSED" ? "closed" : "reservationFailed"));
  } finally {
    button.disabled = false;
  }
});

document.addEventListener("reservation-language-change", renderSelectedSlot);
renderSelectedSlot();
