const { client: supabaseClient, loadFooter, t, localizeSlotLabels } = window.ReservationApp;
let scheduleLoaded = false;

loadFooter();

function goToEnrollPage(time, date) {
  if (!scheduleLoaded) return;
  const cell = document.querySelector('td[data-time="' + time + '"][data-date="' + date + '"]');
  if (!cell || cell.classList.contains('full')) {
    alert(t('fullMessage'));
    return;
  }
  window.location.href = 'input.html?time=' + encodeURIComponent(time)
    + '&date=' + encodeURIComponent(date);
}
window.goToEnrollPage = goToEnrollPage;

function displayDate(date) {
  // Existing home-page dates are M/D in 2026; newer bookings store YYYY-MM-DD.
  if (!/^2026-\d{2}-\d{2}$/.test(date)) return date;
  const [, month, day] = date.split('-').map(Number);
  return month + '/' + day;
}

function renderAvailability(enrollments) {
  const counts = enrollments.reduce((result, enrollment) => {
    const key = enrollment.time_slot + '_' + displayDate(enrollment.date);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});

  document.querySelectorAll('td[data-capacity]').forEach(cell => {
    const key = cell.dataset.time + '_' + cell.dataset.date;
    const remaining = Number(cell.dataset.capacity) - (counts[key] || 0);
    cell.dataset.remaining = String(Math.max(remaining, 0));
    cell.classList.toggle('full', remaining <= 0);
    cell.classList.toggle('slot', remaining > 0);
    cell.style.pointerEvents = remaining > 0 ? '' : 'none';
  });
  localizeSlotLabels();
}

async function loadSchedule() {
  try {
    const { data, error } = await supabaseClient.from('enrollments').select('time_slot, date');
    if (error) throw error;
    renderAvailability(data);
    scheduleLoaded = true;
  } catch (error) {
    console.error(error);
  }
}

document.addEventListener('reservation-language-change', localizeSlotLabels);
loadSchedule();
