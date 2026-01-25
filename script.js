/********************
 * TELEGRAM SAFE
 ********************/
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

/********************
 * CONFIG
 ********************/
const CFG = {
  TASKS_PER_DAY: 3,
  COOLDOWN_HOURS: 2,
  XP: { common: 20, rare: 40, epic: 80 },
  FRAG_LIMIT: 20
};

/********************
 * HELPERS
 ********************/
const el = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);

const xpForLevel = l => Math.floor(50 * Math.pow(l, 1.5));
const levelByXP = xp => {
  let l = 1;
  while (xp >= xpForLevel(l + 1)) l++;
  return l;
};

/********************
 * USER
 ********************/
const User = {
  gender: localStorage.getItem("gender"),
  xp: +localStorage.getItem("xp") || 0,
  streak: +localStorage.getItem("streak") || 0,
  fragments: +localStorage.getItem("fragments") || 0,
  lastDay: localStorage.getItem("lastDay") || ""
};

if (!User.gender) {
  const male = confirm("Выбери аватар:\nОК — 👨 Мужской\nОтмена — 👩 Женский");
  User.gender = male ? "male" : "female";
  localStorage.setItem("gender", User.gender);
}

/********************
 * DAY
 ********************/
function newDay() {
  return { date: today(), done: 0, task: null, nextAt: 0, history: [] };
}
let Day = JSON.parse(localStorage.getItem("day")) || newDay();

/********************
 * TASKS
 ********************/
const TASKS = [
  { text: "Сделай 3 глубоких вдоха", rarity: "common" },
  { text: "Выпей стакан воды", rarity: "common" },
  { text: "Убери 1 предмет рядом", rarity: "common" },
  { text: "Запиши мысль о дне", rarity: "rare" },
  { text: "Сделай шаг к цели", rarity: "rare" },
  { text: "1 минута тишины", rarity: "epic" }
];

/********************
 * AVATAR
 ********************/
function avatarByLevel(lvl) {
  const g = User.gender === "female" ? "f" : "m";
  if (lvl < 10) return `assets/avatars/${g}_base.png`;
  if (lvl < 25) return `assets/avatars/${g}_plus.png`;
  return `assets/avatars/${g}_pro.png`;
}

/********************
 * TASK LOGIC
 ********************/
function canActivateTask() {
  return !Day.task && Day.done < CFG.TASKS_PER_DAY && Date.now() >= Day.nextAt;
}

function activateTask() {
  if (!canActivateTask()) return;
  Day.task = TASKS[Math.floor(Math.random() * TASKS.length)];
}

/********************
 * TAP
 ********************/
el("avatarBox").onclick = () => {
  if (Day.task) {
    User.xp += CFG.XP[Day.task.rarity];
    Day.done++;
    Day.history.push(Day.task.text);
    Day.task = null;
    Day.nextAt = Date.now() + CFG.COOLDOWN_HOURS * 3600000;
  } else {
    if (User.fragments < CFG.FRAG_LIMIT) User.fragments++;
  }
  render();
};

/********************
 * RENDER
 ********************/
function render() {
  if (User.lastDay !== today()) {
    User.lastDay = today();
    User.streak++;
    User.fragments = 0;
    Day = newDay();
  }

  if (canActivateTask()) activateTask();

  const lvl = levelByXP(User.xp);
  el("level").textContent = lvl;
  el("rankText").textContent = lvl < 10 ? "Обычный" : lvl < 25 ? "Улучшенный" : "Прокачанный ✨";
  el("streak").textContent = User.streak;
  el("fragments").textContent = User.fragments;
  el("avatar").src = avatarByLevel(lvl);

  // XP BAR
  const prevXP = xpForLevel(lvl);
  const nextXP = xpForLevel(lvl + 1);
  const progress = ((User.xp - prevXP) / (nextXP - prevXP)) * 100;
  document.querySelector(".xp-fill").style.width = Math.max(0, Math.min(100, progress)) + "%";

  if (Day.task) {
    el("statusText").innerHTML = "🧠 Текущий шаг:<br>" + Day.task.text;
  } else if (Date.now() < Day.nextAt) {
    const m = Math.ceil((Day.nextAt - Date.now()) / 60000);
    el("statusText").innerHTML = `⏳ Следующий шаг через ${m} мин<br>✨ Маленький шаг тоже важен`;
  }

  el("historyPanel").innerHTML =
    Day.history.slice(-3).map(t => `<li>✔ ${t}</li>`).join("");

  localStorage.setItem("xp", User.xp);
  localStorage.setItem("streak", User.streak);
  localStorage.setItem("fragments", User.fragments);
  localStorage.setItem("lastDay", User.lastDay);
  localStorage.setItem("day", JSON.stringify(Day));
}

render();
setInterval(render, 60000);
