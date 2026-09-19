window.ScheduleConfig = (() => {
  const times = [];
  const label = (minutes) => Math.floor(minutes / 60) + ":" + String(minutes % 60).padStart(2, "0");
  for (let minutes = 540; minutes < 1020; minutes += 30) {
    if (minutes < 720 || minutes >= 780) times.push(label(minutes) + " - " + label(minutes + 30));
  }
  const defaultDates = ["2026-09-24", "2026-09-25", "2026-09-28", "2026-09-30"];
  const defaultCapacities = [
    [2, 1, 0, 1], [2, 1, 0, 1], [2, 1, 1, 0], [2, 1, 1, 0],
    [2, 1, 1, 0], [2, 1, 1, 0], [2, 1, 0, 0], [2, 1, 0, 0],
    [2, 1, 0, 0], [2, 1, 0, 0], [1, 0, 1, 0], [1, 0, 1, 0],
    [1, 1, 1, 0], [1, 1, 1, 0]
  ];
  function defaults() {
    return {
      dates: [...defaultDates],
      deadline: "2026-10-17T23:00:00+09:00",
      capacities: defaultCapacities.map((row) => [...row])
    };
  }
  function dateKey(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const [month, day] = value.split("/");
    return "2026-" + month.padStart(2, "0") + "-" + day.padStart(2, "0");
  }
  function validate(config) {
    return config && Array.isArray(config.dates) && config.dates.length === 4
      && new Set(config.dates).size === 4
      && config.dates.every((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)
        && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date)
      && Number.isFinite(Date.parse(config.deadline))
      && Array.isArray(config.capacities) && config.capacities.length === times.length
      && config.capacities.every((row) => Array.isArray(row) && row.length === 4
        && row.every((value) => Number.isInteger(value) && value >= 0 && value <= 3));
  }
  async function load() {
    const { data, error } = await window.ReservationApp.client
      .from("schedule_settings").select("config").eq("id", 1).single();
    if (error) throw error;
    if (!validate(data.config)) throw new Error("Invalid schedule settings");
    return data.config;
  }
  async function save(config, password) {
    if (!validate(config)) throw new Error("Invalid schedule settings");
    const { error } = await window.ReservationApp.client.rpc("save_schedule_settings", {
      settings: config, admin_password: password
    });
    if (error) throw error;
  }
  function capacity(config, date, time) {
    return config.capacities[times.indexOf(time)]?.[config.dates.indexOf(dateKey(date))] || 0;
  }
  return { times, defaults, dateKey, validate, load, save, capacity };
})();
