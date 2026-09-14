const { client: supabaseClient, formatJapaneseDate, loadFooter, t } = window.ReservationApp;

const table = document.getElementById("result-table");
const tbody = table.querySelector("tbody");
const emptyMessage = document.getElementById("empty");
let searchResults = [];

loadFooter();

/** 以纯文本创建单元格，避免用户输入被解释为 HTML。 */
function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "";
  row.appendChild(cell);
}

/** 绘制查询结果并绑定每条预约的取消按钮。 */
function renderResults() {
  tbody.replaceChildren();
  emptyMessage.textContent = "";
  table.style.display = searchResults.length ? "table" : "none";

  searchResults.forEach((enrollment) => {
    const row = document.createElement("tr");
    appendCell(row, formatJapaneseDate(enrollment.date));
    appendCell(row, enrollment.time_slot);
    appendCell(row, enrollment.name);
    appendCell(row, enrollment.kana);
    appendCell(row, enrollment.nationality);
    appendCell(row, enrollment.status);

    const actionCell = document.createElement("td");
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.className = "btn cancel";
    cancelButton.textContent = t("cancel");
    cancelButton.addEventListener("click", () => cancelEnrollment(enrollment));
    actionCell.appendChild(cancelButton);
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
}

/** 按独立预约 ID 删除一条记录，避免同名用户互相影响。 */
async function cancelEnrollment(enrollment) {
  if (!confirm(t("cancelPrompt", formatJapaneseDate(enrollment.date), enrollment.time_slot))) return;

  const { error } = await supabaseClient
    .from("exam_reservations")
    .delete()
    .eq("id", enrollment.id);

  if (error) {
    console.error(error);
    alert(t("loadFailed"));
    return;
  }

  alert(t("cancelSucceeded"));
  window.setTimeout(() => { window.location.href = "index.html"; }, 800);
}

// 按预约姓名精确查询，清空旧表格后展示本次结果或空状态。
document.getElementById("search").addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  if (!name) {
    alert(t("enterName"));
    return;
  }

  tbody.replaceChildren();
  emptyMessage.textContent = "";
  table.style.display = "none";

  const { data, error } = await supabaseClient
    .from("exam_reservations")
    .select("*, slot:exam_slots(exam_date, starts_at, ends_at)")
    .eq("name", name);

  if (error) {
    alert(t("loadFailed"));
    console.error(error);
    return;
  }

  searchResults = data.map(window.ReservationApp.flattenReservation).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.slot.starts_at.localeCompare(b.slot.starts_at);
  });

  if (!searchResults.length) {
    emptyMessage.textContent = t("noReservation");
    return;
  }

  renderResults();
});

// 切换语言后刷新已查询的日期及取消按钮文案。
document.addEventListener("reservation-language-change", () => {
  if (searchResults.length) renderResults();
});
