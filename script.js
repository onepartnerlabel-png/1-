// ===== TELEGRAM =====
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// ===== GENDER =====
let userGender = localStorage.getItem("gender");

function detectGenderByName(name) {
  const n = name.toLowerCase();
  return (n.endsWith("а") || n.endsWith("я")) ? "female" : "male";
}

if (!userGender && tg?.initDataUnsafe?.user?.first_name) {
  userGender = detectGenderByName(tg.initDataUnsafe.user.first_name);
  localStorage.setItem("gender", userGender);
}

function askGenderIfNeeded() {
  if (userGender) return;
  const choice = confirm("Выбери аватар:\n\nОК — 👨 Мужской\nОтмена — 👩 Женский");
  userGender = choice ? "male" : "female";
  localStorage.setItem("gender", userGender);
}

// ===== НАСТРОЙКИ =====
const XP_TASK = 10;
const BONUS_XP = 5;
const FRAG_LIMIT = 20;
const TASKS_PER_DAY = 3;
const MIN_DELAY_HOURS = 2;

// ===== ДАННЫЕ =====
const TASKS = [
  "Сделай 3 глубоких вдоха",
  "Выпей стакан воды",
  "Убери один предмет рядом",
  "Запиши одну мысль",
  "Сделай 1 шаг к цели",
  "Назови одну вещь, за которую благодарен"
];

const MESSAGES_IDLE = ["Ты в потоке", "Сегодня всё выполнено"];

// ===== ХРАНЕНИЕ =====
let xp = Number(localStorage.getItem("xp")) || 0;
let fragments = Number(localStorage.getItem("fragments")) || 0;
let streak = Number(localStorage.getItem("streak")) || 0;
let lastDay = localStorage.getItem("lastDay") || "";
let day = JSON.parse(localStorage.getItem("day")) || newDay();
let lastTaskText = localStorage.getItem("lastTaskText") || "";
let bonusXP = Number(localStorage.getItem("bonusXP")) || 0;

// ===== ЭЛЕМЕНТЫ =====
const avatarBox = document.getElementById("avatarBox");
const avatar = document.getElementById("avatar");
const fx = document.getElementById("fx");
const levelEl = document.getElementById("level");
const streakEl = document.getElementById("streak");
const xpFill = document.getElementById("xpFill");
const xpText = document.getElementById("xpText");
const statusText = document.getElementById("statusText");

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
    localStorage.setItem("streak", streak);
    localStorage.setItem("lastDay", lastDay);
  }
}

// ===== ЗАДАНИЯ =====
function activateTask() {
  if (day.done >= TASKS_PER_DAY) return;
  day.task = TASKS[Math.floor(Math.random() * TASKS.length)];
  day.nextAt = 0;
  fadeText(day.task);
}

function canActivate() {
  return !day.task && Date.now() >= day.nextAt && day.done < TASKS_PER_DAY;
}

// ===== АВАТАР =====
function getAvatarSrc(level) {
  if (userGender === "female") {
    return level >= 10 ? "f_lv2.gif" : "f_lv1.gif";
  } else {
    return level >= 10 ? "m_lv2.gif" : "m_lv1.gif";
  }
}

// ===== UX FADE =====
function fadeText(text) {
  statusText.style.opacity = 0;
  setTimeout(() => {
    statusText.textContent = text;
    statusText.style.opacity = 1;
  }, 200);
}

// ===== БОНУСЫ =====
function checkFragmentsBonus() {
  if (fragments > 0 && fragments % 10 === 0) {
    if (Math.random() < 0.5) {
      bonusXP += BONUS_XP;
      fadeText(`✨ Бонус: +${BONUS_XP} XP к следующему шагу`);
    } else {
      day.nextAt = Math.max(0, day.nextAt - 3600000);
      fadeText("⏱ Бонус: ожидание сокращено на 1 час");
    }
  }
}

// ===== РЕНДЕР =====
function render() {
  checkDay();

  const lvl = levelByXP(xp);
  avatar.src = getAvatarSrc(lvl);

  const prev = lvl === 1 ? 0 : xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  const cur = xp - prev;
  const need = next - prev;

  levelEl.textContent = lvl;
  streakEl.textContent = streak;
  xpFill.style.width = Math.min((cur / need) * 100, 100) + "%";
  xpText.textContent = `${cur} / ${need} XP`;
  if (canActivate()) activateTask();

  if (!day.task) {
    fadeText(
      day.done >= TASKS_PER_DAY
        ? `✨ Фрагменты: ${fragments} / ${FRAG_LIMIT}`
        : `Следующий шаг скоро`
    );
  }

  localStorage.setItem("xp", xp);
  localStorage.setItem("fragments", fragments);
  localStorage.setItem("bonusXP", bonusXP);
  localStorage.setItem("day", JSON.stringify(day));
  localStorage.setItem("lastTaskText", lastTaskText);
}

// ===== ТАП =====
avatarBox.addEventListener("click", () => {
  fx.classList.remove("pulse");
  void fx.offsetWidth;
  fx.classList.add("pulse");

  if (tg) tg.HapticFeedback.impactOccurred("light");

  if (day.task) {
    xp += XP_TASK + bonusXP;
    bonusXP = 0;
    day.done++;
    lastTaskText = day.task;
    day.task = null;
    day.nextAt = Date.now() + MIN_DELAY_HOURS * 3600000;
    fadeText(`✅ Последний шаг: ${lastTaskText}`);
  } else {
    if (fragments < FRAG_LIMIT) {
      fragments++;
      checkFragmentsBonus();
      fadeText(`✨ Фрагменты: ${fragments} / ${FRAG_LIMIT}`);
    } else {
      fadeText("Хватит на сегодня ✨");
    }
  }

  render();
});

// ===== СТАРТ =====
askGenderIfNeeded();
render();