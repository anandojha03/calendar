const calendarEl = document.getElementById('calendar');
const monthTitleEl = document.getElementById('monthTitle');
const monthDotsEl = document.getElementById('month-dots');

const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');

const moveModalEl = document.getElementById('moveModal');
const moveModal = new bootstrap.Modal(moveModalEl);
const moveDateInput = document.getElementById('moveDate');
const confirmMoveBtn = document.getElementById('confirmMove');

const year = 2026;
const storageKey = 'calendar_2026_tasks';

let currentMonth = 0;
let moveContext = null;

const months = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const data = JSON.parse(localStorage.getItem(storageKey) || '{}');

/* ---------- UTIL ---------- */
function save() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

/* ---------- NAV ---------- */
prevBtn.onclick = () => {
  currentMonth = Math.max(0, currentMonth - 1);
  render();
};

nextBtn.onclick = () => {
  currentMonth = Math.min(11, currentMonth + 1);
  render();
};

function renderMonthDots() {
  monthDotsEl.innerHTML = '';
  months.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'month-dot' + (i === currentMonth ? ' active' : '');
    dot.onclick = () => {
      currentMonth = i;
      render();
    };
    monthDotsEl.appendChild(dot);
  });
}

/* ---------- TASK ACTIONS ---------- */
function addTask(dateKey, input) {
  const value = input.value.trim();
  if (!value) return;

  if (!data[dateKey]) data[dateKey] = [];
  data[dateKey].push({ text: value, completed: false });

  input.value = '';
  save();
  render();
}

function toggleComplete(dateKey, index) {
  data[dateKey][index].completed = !data[dateKey][index].completed;
  save();
  render();
}

function deleteTask(dateKey, index) {
  data[dateKey].splice(index, 1);
  if (!data[dateKey].length) delete data[dateKey];
  save();
  render();
}

function editTask(dateKey, index, span) {
  const input = document.createElement('input');
  input.className = 'form-control form-control-sm';
  input.value = span.textContent;

  input.onkeydown = e => {
    if (e.key === 'Enter') input.blur();
  };

  input.onblur = () => {
    const v = input.value.trim();
    if (v) data[dateKey][index].text = v;
    save();
    render();
  };

  span.replaceWith(input);
  input.focus();
}

/* ---------- MOVE ---------- */
function openMove(dateKey, index) {
  moveContext = { dateKey, index };
  moveDateInput.value = '';
  moveModal.show();
}

confirmMoveBtn.onclick = () => {
  if (!moveContext || !moveDateInput.value) return;

  const toDate = moveDateInput.value;
  if (!data[toDate]) data[toDate] = [];

  data[toDate].push(data[moveContext.dateKey][moveContext.index]);
  data[moveContext.dateKey].splice(moveContext.index, 1);

  save();
  moveModal.hide();
  render();
};

/* ---------- RENDER ---------- */
function render() {
  calendarEl.innerHTML = '';
  monthTitleEl.textContent = `${months[currentMonth]} ${year}`;

  /* Week header */
  const header = document.createElement('div');
  header.className = 'row text-center fw-semibold mb-2 calendar-weekdays';
  weekdays.forEach(d => {
    const col = document.createElement('div');
    col.className = 'col';
    col.textContent = d;
    header.appendChild(col);
  });
  calendarEl.appendChild(header);

  const firstDay = new Date(year, currentMonth, 1).getDay();
  const daysInMonth = new Date(year, currentMonth + 1, 0).getDate();

  let row = document.createElement('div');
  row.className = 'row g-2';

  for (let i = 0; i < firstDay; i++) {
    row.appendChild(document.createElement('div')).className = 'col';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

    const col = document.createElement('div');
    col.className = 'col';

    const card = document.createElement('div');
    card.className = 'card h-100 day-card';

    const body = document.createElement('div');
    body.className = 'card-body p-2';

    const title = document.createElement('div');
    title.className = 'fw-semibold';
    title.textContent = day;

    const input = document.createElement('input');
    input.className = 'form-control form-control-sm my-1';
    input.placeholder = '+ Add task';
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') addTask(dateKey, input);
    });

    body.append(title, input);

    (data[dateKey] || []).forEach((task, i) => {
      const t = document.createElement('div');
      t.className =
        'd-flex align-items-center justify-content-between task-box p-1 rounded ' +
        (task.completed ? 'completed' : '');

      const left = document.createElement('div');
      left.className = 'd-flex align-items-center gap-1';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = task.completed;
      cb.onchange = () => toggleComplete(dateKey, i);

      const span = document.createElement('span');
      span.textContent = task.text;
      span.ondblclick = () => editTask(dateKey, i, span);

      left.append(cb, span);

      const actions = document.createElement('div');

      const moveIcon = document.createElement('i');
      moveIcon.className = 'bi bi-arrow-right-circle me-2';
      moveIcon.title = 'Move';
      moveIcon.onclick = () => openMove(dateKey, i);

      const deleteIcon = document.createElement('i');
      deleteIcon.className = 'bi bi-trash text-danger';
      deleteIcon.title = 'Delete';
      deleteIcon.onclick = () => deleteTask(dateKey, i);

      actions.append(moveIcon, deleteIcon);

      t.append(left, actions);
      body.appendChild(t);
    });

    card.appendChild(body);
    col.appendChild(card);
    row.appendChild(col);

    if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
      calendarEl.appendChild(row);
      row = document.createElement('div');
      row.className = 'row g-2';
    }
  }

  // Auto scroll to today on mobile
  if (window.innerWidth < 768) {
    const today = new Date();
    if (today.getMonth() === currentMonth) {
      const dayCards = document.querySelectorAll('.day-card');
      const index = today.getDate() - 1;
      if (dayCards[index]) {
        dayCards[index].scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  renderMonthDots();
}

/* ---------- INIT ---------- */
render();

/* ===============================
   Mobile Swipe Month Navigation
   =============================== */

let touchStartX = 0;
let touchStartY = 0;

calendarEl.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

calendarEl.addEventListener('touchend', (e) => {
  if (!touchStartX) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  // Reset
  touchStartX = 0;
  touchStartY = 0;

  // Ignore vertical scroll
  if (Math.abs(deltaY) > Math.abs(deltaX)) return;

  // Minimum swipe distance
  if (Math.abs(deltaX) < 50) return;

  // Swipe right → previous month
  if (deltaX > 0 && currentMonth > 0) {
    currentMonth--;
    render();
  }

  // Swipe left → next month
  if (deltaX < 0 && currentMonth < 11) {
    currentMonth++;
    render();
  }
});
