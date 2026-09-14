/** 场次共享模块：通过新数据库接口读写配置，不访问旧预约表。 */
window.ScheduleStore = (() => {
  /** 新系统统一使用 YYYY-MM-DD 日期键。 */
  function enrollmentDate(isoDate) {
    return isoDate;
  }

  /** 将时间换算为当天分钟数，供排序及重叠检测使用。 */
  function minutes(time) {
    const [hour, minute] = time.split(":").map(Number);
    return hour * 60 + minute;
  }

  /** 将时间输入转换为统一的展示格式，例如 09:00 转成 9:00。 */
  function timeRange(start, end) {
    const format = (value) => Number(value.split(":")[0]) + ":" + value.split(":")[1];
    return format(start) + " - " + format(end);
  }

  /** 验证日期、时间和名额；返回可本地化的错误键，成功时返回空字符串。 */
  function validate(slots) {
    if (!Array.isArray(slots) || !slots.length || slots.length > 2000) return "invalidSchedule";
    const keys = new Set();
    const ranges = new Map();
    for (const slot of slots) {
      if (!slot || typeof slot !== "object") return "invalidSchedule";
      if (!/^20\d{2}-\d{2}-\d{2}$/.test(slot.date)) return "invalidSchedule";
      const date = new Date(slot.date + "T00:00:00Z");
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== slot.date) return "invalidSchedule";
      if (!/^([0-9]|1[0-9]|2[0-3]):[0-5]\d - ([0-9]|1[0-9]|2[0-3]):[0-5]\d$/.test(slot.time_slot)) return "invalidSchedule";
      const [start, end] = slot.time_slot.split(" - ");
      if (minutes(start) >= minutes(end) || minutes(end) >= 1440) return "invalidSchedule";
      if (!Number.isInteger(slot.capacity) || slot.capacity < 0 || slot.capacity > 999) return "invalidSchedule";
      const key = slot.date + "|" + slot.time_slot;
      if (keys.has(key)) return "duplicateSchedule";
      keys.add(key);
      ranges.set(slot.time_slot, [minutes(start), minutes(end)]);
    }
    const ordered = [...ranges.values()].sort((a, b) => a[0] - b[0]);
    if (ordered.some((range, index) => index > 0 && range[0] < ordered[index - 1][1])) return "overlapSchedule";
    return "";
  }

  /** 一次获取场次、当前预约人数与版本；未初始化时明确提示，不读取旧表。 */
  async function load() {
    const { data, error } = await window.ReservationApp.client.rpc("get_exam_schedule");
    if (error) {
      throw new Error(["42P01", "PGRST205", "PGRST202"].includes(error.code) ? "scheduleSetup" : "loadFailed");
    }
    if (!data || validate(data.slots)) throw new Error("invalidSchedule");
    return data;
  }

  /** 通过服务端密码验证和版本检查一次性保存整张场次表。 */
  async function save(slots, revision, password) {
    const validation = validate(slots);
    if (validation) throw new Error(validation);
    const { data, error } = await window.ReservationApp.client.rpc("save_exam_schedule", {
      p_slots: slots, p_revision: revision, p_password: password
    });
    if (error) {
      const messages = { INVALID_PASSWORD: "adminPasswordFailed", SCHEDULE_CONFLICT: "scheduleConflict", BOOKED_SLOT: "bookedSchedule", INVALID_SCHEDULE: "invalidSchedule" };
      throw new Error(messages[error.message] || "saveFailed");
    }
    return { slots, revision: data };
  }

  /** 把扁平场次转换成按日期和时间排序的矩阵，供首页与管理页共享。 */
  function grid(slots) {
    return {
      dates: [...new Set(slots.map((slot) => slot.date))].sort(),
      times: [...new Set(slots.map((slot) => slot.time_slot))].sort((a, b) => minutes(a.split(" - ")[0]) - minutes(b.split(" - ")[0])),
      capacities: new Map(slots.map((slot) => [slot.date + "|" + slot.time_slot, slot.capacity]))
    };
  }

  return { enrollmentDate, minutes, timeRange, validate, load, save, grid };
})();
