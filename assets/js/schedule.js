const { client: supabaseClient, loadFooter, t, localizeSlotLabels, formatJapaneseDate } = window.ReservationApp;
let scheduleLoaded = false;
let scheduleConfig;
loadFooter();

function showScheduleMessage(key) {
  let message = document.querySelector('[data-schedule-notice]');
  if (!message) {
    message = document.createElement('p');
    message.className = 'alert';
    document.querySelector('.container').prepend(message);
  }
  message.dataset.scheduleNotice = key;
  message.textContent = t(key);
}
function goToEnrollPage(time, date) {
  if (!scheduleLoaded) return;
  if (Date.now() >= Date.parse(scheduleConfig.deadline)) {
    scheduleLoaded = false;
    showScheduleMessage('closed');
    return;
  }
  const cell = Array.from(document.querySelectorAll('td[data-capacity]'))
    .find(item => item.dataset.time === time && item.dataset.date === date);
  if (!cell || cell.classList.contains('full')) {
    alert(t('fullMessage'));
    return;
  }
  window.location.href = 'input.html?time=' + encodeURIComponent(time) + '&date=' + encodeURIComponent(date);
}
window.goToEnrollPage = goToEnrollPage;
function renderSchedule(enrollments) {
  const counts = {};
  enrollments.forEach(enrollment => {
    const key = enrollment.time_slot + '_' + window.ScheduleConfig.dateKey(enrollment.date);
    counts[key] = (counts[key] || 0) + 1;
  });
  const headers = document.querySelectorAll('#schedule thead th');
  scheduleConfig.dates.forEach((date, index) => { headers[index + 1].textContent = formatJapaneseDate(date); });
  const tbody = document.querySelector('#schedule tbody');
  tbody.replaceChildren();
  const closed = Date.now() >= Date.parse(scheduleConfig.deadline);
  window.ScheduleConfig.times.forEach((time, rowIndex) => {
    if (rowIndex === 6) {
      const row = document.createElement('tr');
      row.innerHTML = '<td>12:00 - 13:00</td><td class="break" colspan="4"></td>';
      row.querySelector('.break').textContent = t('break');
      tbody.appendChild(row);
    }
    const row = document.createElement('tr');
    const timeCell = document.createElement('td');
    timeCell.textContent = time;
    row.appendChild(timeCell);
    scheduleConfig.dates.forEach((date, column) => {
      const cell = document.createElement('td');
      const capacity = scheduleConfig.capacities[rowIndex][column];
      cell.textContent = '-';
      cell.className = 'slot1';
      if (capacity) {
        const remaining = Math.max(0, capacity - (counts[time + '_' + date] || 0));
        cell.dataset.time = time;
        cell.dataset.date = date;
        cell.dataset.capacity = capacity;
        cell.dataset.remaining = remaining;
        cell.className = closed || !remaining ? 'full' : 'slot';
        cell.addEventListener('click', () => goToEnrollPage(time, date));
      }
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  localizeSlotLabels();
  if (closed) showScheduleMessage('closed');
  scheduleLoaded = !closed;
}
async function loadSchedule() {
  try {
    scheduleConfig = await window.ScheduleConfig.load();
    const { data, error } = await supabaseClient.from('enrollments').select('time_slot, date');
    if (error) throw error;
    renderSchedule(data);
  } catch (error) {
    console.error(error);
    document.querySelector('#schedule tbody').replaceChildren();
    showScheduleMessage('settingsLoadFailed');
  }
}
document.addEventListener('reservation-language-change', () => {
  if (scheduleConfig) {
    const headers = document.querySelectorAll('#schedule thead th');
    scheduleConfig.dates.forEach((date, index) => { headers[index + 1].textContent = formatJapaneseDate(date); });
  }
  const notice = document.querySelector('[data-schedule-notice]');
  if (notice) notice.textContent = t(notice.dataset.scheduleNotice);
});
loadSchedule();
