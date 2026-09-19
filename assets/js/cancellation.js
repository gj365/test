const { client: supabaseClient, formatJapaneseDate, loadFooter, t } = window.ReservationApp;

const table = document.getElementById("result-table");
const tbody = table.querySelector("tbody");
const emptyMessage = document.getElementById("empty");
let searchResults = [];

loadFooter();

function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = value || "";
  row.appendChild(cell);
}

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

async function cancelEnrollment(enrollment) {
  if (!confirm(t("cancelPrompt", formatJapaneseDate(enrollment.date), enrollment.time_slot))) return;

  const { error } = await supabaseClient
    .from("enrollments")
    .delete()
    .eq("name", enrollment.name)
    .eq("date", enrollment.date)
    .eq("time_slot", enrollment.time_slot);

  if (error) {
    console.error(error);
    alert(t("loadFailed"));
    return;
  }

  alert(t("cancelSucceeded"));
  window.setTimeout(() => { window.location.href = "index.html"; }, 800);
}

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
    .from("enrollments")
    .select("*")
    .eq("name", name);

  if (error) {
    alert(t("loadFailed"));
    console.error(error);
    return;
  }

  searchResults = data.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time_slot.localeCompare(b.time_slot);
  });

  if (!searchResults.length) {
    emptyMessage.textContent = t("noReservation");
    return;
  }

  renderResults();
});

document.addEventListener("reservation-language-change", () => {
  if (searchResults.length) renderResults();
});
