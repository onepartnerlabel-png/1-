// ===== TELEGRAM =====
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

// ===== ENTITIES =====
const User = {
  xp: Number(localStorage.getItem("xp")) || 0,
  level: 1,
  streak: Number(localStorage.getItem("streak")) || 0,

  taps: Number(localStorage.getItem("taps")) || 0,

  silver: Number(localStorage.getItem("silver")) || 0, // 10 taps
  gold: Number(localStorage.getItem("gold")) || 0,     // 100 taps

  money: Number(localStorage.getItem("money")) || 0,

  friends: JSON.parse(localStorage.getItem("friends")) || [],
  likesGivenToday: 0,

  lastDay: localStorage.getItem("lastDay") || ""
};

const TaskState = {
  current: null,
  completedToday: 0,
  lastTaskText: localStorage.getItem("lastTaskText") || "",
  nextAvailableAt: 0
};

const Economy = {
  XP_PER_TASK: 20,
  MONEY_PER_TAP: 100,

  TAPS_PER_SILVER: 10,
  SILVER_PER_GOLD: 10,

  TASKS_PER_DAY: 3,
  COOLDOWN_HOURS: 2
};

const GameState = {
  screen: "idle" // idle | task | cooldown
};

// ===== DOM =====
const avatarBox = document.getElementById("avatarBox");
const avatar = document.getElementById("avatar");

const levelEl = document.getElementById("level");
const streakEl = document.getElementById("streak");
const xpFill = document.getElementById("xpFill");

const silverEl = document.getElementById("silver");
const goldEl = document.getElementById("gold");
const moneyEl = document.getElementById("money");

const statusText = document.getElementById("statusText");

// ===== LEVELS =====
function xpForLevel(lvl) {
  return Math.floor(30 * Math.pow(lvl, 1.4));
}

function calculateLevel(xp) {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

// ===== DAY =====
function today() {
  return new Date().toISOString().slice(0, 10);
}

function checkNewDay() {
  if (User.lastDay !== today()) {
    User.lastDay = today();
    User.streak++;
    TaskState.completedToday = 0;
    User.likesGivenToday = 0;
  }
}

// ===== TASKS =====
const TASKS = [
  "Сделай 3 глубоких вдоха",
  "Выпей стакан воды",
  "Убери один предмет рядом",
  "Запиши одну мысль",
  "Сделай 1 шаг к цели"
];

function activateTask() {
  if (TaskState.completedToday >= Economy.TASKS_PER_DAY) return;
  TaskState.current = TASKS[Math.floor(Math.random() * TASKS.length)];
  GameState.screen = "task";
}

// ===== TAP =====
avatarBox.addEventListener("click", () => {
  avatar.classList.remove("glow");
  void avatar.offsetWidth;
  avatar.classList.add("glow");

  if (tg) tg.HapticFeedback.impactOccurred("light");

  User.taps++;
  User.money += Economy.MONEY_PER_TAP;

  // серебро
  if (User.taps % Economy.TAPS_PER_SILVER === 0) {
    User.silver++;
  }

  // золото
  if (User.silver >= Economy.SILVER_PER_GOLD) {
    User.gold++;
    User.silver = 0;
    applyGoldBonus();
  }

  if (GameState.screen === "task" && TaskState.current) {
    completeTask();
  }

  render();
});

// ===== TASK COMPLETE =====
function completeTask() {
  User.xp += Economy.XP_PER_TASK;
  TaskState.completedToday++;
  TaskState.lastTaskText = TaskState.current;
  TaskState.current = null;

  TaskState.nextAvailableAt =
    Date.now() + Economy.COOLDOWN_HOURS * 3600000;

  GameState.screen = "cooldown";

  statusText.textContent =
    `✅ Последний шаг: ${TaskState.lastTaskText}  +${Economy.XP_PER_TASK} XP`;
}

// ===== BONUSES (GOLD) =====
function applyGoldBonus() {
  const bonus = Math.random() > 0.5
    ? "⏱ −1 час ожидания"
    : "✨ +50% XP к следующему заданию";

  statusText.textContent = `🥇 Бонус получен: ${bonus}`;
}

// ===== SOCIAL MVP =====
function likeFriend(friendId) {
  if (User.likesGivenToday >= 1) return;
  User.likesGivenToday++;
  // friend.likes++
}

// ===== RENDER =====
function render() {
  checkNewDay();

  User.level = calculateLevel(User.xp);

  const prev = xpForLevel(User.level);
  const next = xpForLevel(User.level + 1);
  const progress = ((User.xp - prev) / (next - prev)) * 100;

  levelEl.textContent = User.level;
  streakEl.textContent = User.streak;
  xpFill.style.width = Math.min(progress, 100) + "%";
  silverEl.textContent = User.silver;
  goldEl.textContent = User.gold;
  moneyEl.textContent = User.money;

  if (GameState.screen === "idle" && !TaskState.current) {
    activateTask();
  }

  if (GameState.screen === "task") {
    statusText.textContent = TaskState.current;
  }

  if (GameState.screen === "cooldown") {
    const m = Math.ceil((TaskState.nextAvailableAt - Date.now()) / 60000);
    if (m <= 0) GameState.screen = "idle";
    else
      statusText.textContent =
        `⏳ Следующий шаг через ${m} мин ✨ Можно тапать`;
  }

  // SAVE
  localStorage.setItem("xp", User.xp);
  localStorage.setItem("streak", User.streak);
  localStorage.setItem("taps", User.taps);
  localStorage.setItem("silver", User.silver);
  localStorage.setItem("gold", User.gold);
  localStorage.setItem("money", User.money);
  localStorage.setItem("lastTaskText", TaskState.lastTaskText);
  localStorage.setItem("lastDay", User.lastDay);
}

// ===== START =====
render();
setInterval(render, 60000);