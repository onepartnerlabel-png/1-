// ===== TELEGRAM =====
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// ===== НАСТРОЙКИ =====
const XP_TASK = 10;
const FRAG_LIMIT = 20;
const TASKS_PER_DAY = 3;
const MIN_DELAY_HOURS = 2;
const FRAG_FOR_BONUS = 10;

// ===== ДАННЫЕ =====
const TASKS = [
  "Сделай 3 глубоких вдоха",
  "Выпей стакан воды",
  "Убери один предмет рядом",
  "Запиши одну мысль",
  "Сделай 1 шаг к цели",
  "Назови одну вещь, за которую благодарен"
];

const MSG_IDLE = [
  "Ты в потоке ✨",
  "Рост — это привычка",
  "Сегодня всё выполнено"
];

// ===== ХРАНЕНИЕ =====
let xp = Number(localStorage.getItem("xp")) || 0;
let fragments = Number(localStorage.getItem("fragments")) || 0;
let streak = Number(localStorage.getItem("streak")) || 0;
let lastDay = localStorage.getItem("lastDay") || "";
let lastTaskText = localStorage.getItem("lastTaskText") || "";

let day = JSON.parse(localStorage.getItem("day")) || newDay();

// ===== ЭЛЕМЕНТЫ =====
const avatarBox = document.getElementById("avatarBox");
const avatar = document.getElementById("avatar");
const fx = document.getElementById("fx");
const levelEl = document.getElementById("level");
const streakEl = document.getElementById("streak");
const xpFill = document.getElementById("xpFill");
const xpText = document.getElementById("xpText");
const statusText = document.getElementById("statusText");
const fragEl = document.getElementById("fragments");

// ===== УРОВНИ =====
function xpForLevel(lvl) {
  return Math.floor(50 * Math.pow(lvl, 1.5));
}

function levelByXP(x) {
  let l = 1;
  while (x >= xpForLevel(l + 1)) l++;
  return l;
}

// ===== ДЕНЬ =====
function today() {
  return new Date().toISOString().slice(0, 10);
}

function newDay() {
  return { done: 0, task: null, nextAt: 0 };
}

function checkDay() {
  if (lastDay !== today()) {
    lastDay = today();
    day = newDay();
    fragments = 0;
    streak++;
    save();
  }
}

// ===== ЗАДАНИЯ =====
function activateTask() {
  if (day.done >= TASKS_PER_DAY) return;
  day.task = TASKS[Math.floor(Math.random() * TASKS.length)];
}

function canActivate() {
  return !day.task && Date.now() >= day.nextAt && day.done < TASKS_PER_DAY;
}

// ===== БОНУС =====
function checkBonus() {
  if (fragments > 0 && fragments % FRAG_FOR_BONUS === 0) {
    if (day.nextAt > Date.now()) {
      day.nextAt -= 3600000;
      statusText.textContent = "🎁 Бонус: −1 час ожидания";
    } else {
      xp += 5;
      statusText.textContent = "🎁 Бонус: +5 XP к росту";
    }
  }
}

// ===== РЕНДЕР =====
function render() {
  checkDay();

  const lvl = levelByXP(xp);
  const prev = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);

  levelEl.textContent = lvl;
  streakEl.textContent = streak;

  const cur = Math.max(0, xp - prev);
  const need = next - prev;
  xpFill.style.width = Math.min((cur / need) * 100, 100) + "%";
  xpText.textContent = `${cur} / ${need} XP`;

  if (fragEl) fragEl.textContent = fragments;

  if (canActivate()) activateTask();

  if (day.task) {
    statusText.textContent = day.task;
  } else if (day.done >= TASKS_PER_DAY) {
    statusText.textContent = lastTaskText
      ? `🧠 Последний шаг:\n${lastTaskText}`
      : "💙 Сегодня ты стал лучше";
  } else {
    const m = Math.ceil((day.nextAt - Date.now()) / 60000);
    statusText.textContent = `⏳ Следующий шаг через ${m} мин\n✨ Можно собирать фрагменты`;
  }

  save();
}

// ===== ТАП =====
avatarBox.addEventListener("click", () => {
  if (fx) {
    fx.classList.remove("pulse");
    void fx.offsetWidth;
    fx.classList.add("pulse");
  }

  if (tg) tg.HapticFeedback.impactOccurred("light");

  if (day.task) {
    xp += XP_TASK;
    day.done++;
    lastTaskText = day.task;
    day.task = null;
    day.nextAt = Date.now() + MIN_DELAY_HOURS * 3600000;

    statusText.textContent = `✅ Последний шаг:\n${lastTaskText}\n+${XP_TASK} XP`;
    } else {
    if (fragments < FRAG_LIMIT) {
      fragments++;
      statusText.textContent =
        MSG_IDLE[Math.floor(Math.random() * MSG_IDLE.length)];
      checkBonus();
    } else {
      statusText.textContent = "Хватит на сегодня ✨";
    }
  }

  render();
});

// ===== SAVE =====
function save() {
  localStorage.setItem("xp", xp);
  localStorage.setItem("fragments", fragments);
  localStorage.setItem("streak", streak);
  localStorage.setItem("lastDay", lastDay);
  localStorage.setItem("day", JSON.stringify(day));
  localStorage.setItem("lastTaskText", lastTaskText);
}

// ===== START =====
render();