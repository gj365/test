/** 场次管理页面：编辑仅修改内存草稿，保存成功后才切换回只读状态。 */
(() => {
  const { t, loadFooter, formatJapaneseDate } = window.ReservationApp;
  const store = window.ScheduleStore;
  let saved = null;
  let draft = null;
  let editing = false;
  let busy = false;
  let messageKey = "";

  /** 更新提示消息；保留键以便切换语言时同步翻译。 */
  function showMessage(key, success = false) {
    messageKey = key;
    const element = document.getElementById("schedule-message");
    element.textContent = key ? t(key) : "";
    element.className = success ? "save-success" : "alert";
  }

  /** 创建与草稿绑定的输入框，避免在编辑时重新渲染导致输入丢失。 */
  function input(type, value, label, onChange) {
    const element = document.createElement("input");
    element.type = type;
    element.value = value;
    element.disabled = !editing || busy;
    element.setAttribute("aria-label", label);
    element.addEventListener("input", () => onChange(element.value));
    return element;
  }

  /** 创建删除日期列或时间行的按钮，删除操作仅作用于当前草稿。 */
  function removeButton(onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn cancel remove-slot";
    button.textContent = t("removeSchedule");
    button.disabled = busy;
    button.addEventListener("click", onClick);
    return button;
  }

  /** 按当前状态绘制日期列、时间行与每格总名额，默认禁用全部输入。 */
  function render() {
    document.querySelectorAll("[data-copy]").forEach((element) => { element.textContent = t(element.dataset.copy); });
    document.title = t("manageSchedule");
    document.getElementById("edit-state").textContent = t(editing ? "editingSchedule" : "readonlySchedule");
    document.getElementById("edit-schedule").hidden = editing;
    document.getElementById("edit-schedule").disabled = !saved || busy;
    ["save-schedule", "discard-schedule", "add-controls"].forEach((id) => { document.getElementById(id).hidden = !editing; });
    ["save-schedule", "discard-schedule", "add-date", "add-time"].forEach((id) => { document.getElementById(id).disabled = busy; });
    document.getElementById("reload-schedule").hidden = editing;
    document.getElementById("reload-schedule").disabled = busy;
    document.getElementById("save-schedule").textContent = t(busy ? "savingSchedule" : "saveSchedule");
    if (messageKey) document.getElementById("schedule-message").textContent = t(messageKey);
    const table = document.getElementById("schedule-editor");
    table.querySelector("thead").replaceChildren();
    table.querySelector("tbody").replaceChildren();
    if (!draft) return;
    const header = document.createElement("tr");
    const corner = document.createElement("th");
    corner.textContent = t("scheduleHeaders")[0];
    header.appendChild(corner);
    draft.dates.forEach((date, column) => {
      const th = document.createElement("th");
      th.scope = "col";
      const dateInput = input("date", date, t("dateLabel"), (value) => { draft.dates[column] = value; });
      dateInput.min = "2000-01-01";
      dateInput.max = "2099-12-31";
      th.appendChild(dateInput);
      if (editing) th.appendChild(removeButton(() => {
        draft.dates.splice(column, 1);
        draft.capacities.forEach((row) => row.splice(column, 1));
        render();
      }));
      header.appendChild(th);
    });
    table.querySelector("thead").appendChild(header);
    draft.times.forEach((range, rowIndex) => {
      const row = document.createElement("tr");
      const th = document.createElement("th");
      th.scope = "row";
      const box = document.createElement("div");
      box.className = "time-inputs";
      range.forEach((time, index) => {
        if (index) {
          const separator = document.createElement("span");
          separator.textContent = "–";
          separator.setAttribute("aria-hidden", "true");
          box.appendChild(separator);
        }
        box.appendChild(input("time", time, t(index ? "endTime" : "startTime"), (value) => { draft.times[rowIndex][index] = value; }));
      });
      th.appendChild(box);
      if (editing) th.appendChild(removeButton(() => {
        draft.times.splice(rowIndex, 1);
        draft.capacities.splice(rowIndex, 1);
        render();
      }));
      row.appendChild(th);
      draft.dates.forEach((date, column) => {
        const cell = document.createElement("td");
        cell.className = "capacity-cell";
        const field = input("number", draft.capacities[rowIndex][column], formatJapaneseDate(date) + " " + range.join(" - ") + " " + t("capacityLabel"), (value) => { draft.capacities[rowIndex][column] = value; });
        field.min = "0";
        field.max = "999";
        field.step = "1";
        cell.appendChild(field);
        row.appendChild(cell);
      });
      table.querySelector("tbody").appendChild(row);
    });
  }

  /** 根据最后一次成功加载或保存的配置建立独立草稿，用于编辑与放弃修改。 */
  function resetDraft() {
    const grid = store.grid(saved.slots);
    draft = {
      dates: [...grid.dates],
      times: grid.times.map((range) => range.split(" - ").map((time) => time.padStart(5, "0"))),
      capacities: grid.times.map((time) => grid.dates.map((date) => grid.capacities.get(date + "|" + time) ?? 0))
    };
  }

  /** 加载服务端配置；失败时保持编辑入口禁用，并显示可重试提示。 */
  async function load() {
    busy = true;
    showMessage("loadingSchedule");
    render();
    try {
      saved = await store.load();
      resetDraft();
      showMessage("");
    } catch (error) {
      saved = null;
      draft = null;
      showMessage(t(error.message) ? error.message : "loadFailed");
    } finally {
      busy = false;
      render();
    }
  }

  /** 校验完整草稿，要求服务端验证管理密码，失败时保留全部未保存输入。 */
  async function save() {
    if (busy) return;
    const slots = draft.times.flatMap((range, row) => draft.dates.map((date, column) => ({
      date,
      time_slot: store.timeRange(...range),
      capacity: draft.capacities[row][column] === "" ? NaN : Number(draft.capacities[row][column])
    })));
    const validation = store.validate(slots);
    if (validation) { showMessage(validation); return; }
    const password = prompt(t("adminPasswordPrompt"));
    if (password === null) return;
    busy = true;
    showMessage("");
    render();
    try {
      saved = await store.save(slots, saved.revision, password);
      editing = false;
      resetDraft();
      showMessage("scheduleSaved", true);
    } catch (error) {
      showMessage(t(error.message) ? error.message : "saveFailed");
    } finally {
      busy = false;
      render();
    }
  }

  // 编辑按钮只解锁草稿，不向数据库写入。
  document.getElementById("edit-schedule").addEventListener("click", () => { editing = true; showMessage(""); render(); });
  document.getElementById("save-schedule").addEventListener("click", save);
  document.getElementById("discard-schedule").addEventListener("click", () => { editing = false; resetDraft(); showMessage(""); render(); });
  document.getElementById("reload-schedule").addEventListener("click", load);
  document.getElementById("add-date").addEventListener("click", () => {
    draft.dates.push("");
    draft.capacities.forEach((row) => row.push(0));
    render();
  });
  document.getElementById("add-time").addEventListener("click", () => {
    draft.times.push(["", ""]);
    draft.capacities.push(draft.dates.map(() => 0));
    render();
  });
  // 离开编辑页前交由浏览器提醒，避免未保存的草稿意外丢失。
  window.addEventListener("beforeunload", (event) => { if (editing) { event.preventDefault(); event.returnValue = ""; } });
  document.addEventListener("reservation-language-change", render);
  loadFooter();
  load();
})();
