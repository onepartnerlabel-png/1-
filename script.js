const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

// ===== CONFIG =====
const CFG = {
  TASKS_PER_DAY: 3,
  COOLDOWN_HOURS: 2,
  XP: { common: 20, rare: 40, epic: 80 },
  MONEY_PER_TAP: 100,
  TAPS_PER_SILVER: 10,
  SILVER_PER_GOLD: 10
};

// ===== USER =====
const User = {
  id: tg?.initDataUnsafe?.user?.id || "local",
  name: tg?.initDataUnsafe?.user?.first_name || "Игрок",
  xp: +localStorage.getItem("xp") || 0,
  streak: +localStorage.getItem("streak") || 0,
  taps: +localStorage.getItem("taps") || 0,
  silver: +localStorage.getItem("silver") || 0,
  gold: +localStorage.getItem("gold") || 0,
  money: +localStorage.getItem("money") || 0,
  achievements: JSON.parse(localStorage.getItem("ach")) || [],
  friends: JSON.parse(localStorage.getItem("friends")) || [],
  lastDay: localStorage.getItem("lastDay") || ""
};

// ===== DAY =====
let Day = JSON.parse(localStorage.getItem("day")) || newDay();
function newDay() {
  return { date: today(), done: 0, task: null, nextAt: 0, history: [] };
}

// ===== TASKS (персонализация) =====
const TASKS = [
  { text: "Сделай 3 глубоких вдоха", rarity: "common", tags: ["calm"] },
  { text: "Выпей стакан воды", rarity: "common", tags: ["body"] },
  { text: "Убери 1 предмет рядом", rarity: "common", tags: ["space"] },
  { text: "Запиши мысль о дне", rarity: "rare", tags: ["mind"] },
  { text: "Сделай шаг к цели", rarity: "rare", tags: ["growth"] },
  { text: "1 минута тишины", rarity: "epic", tags: ["focus"] }
];

// ===== DOM =====
const el = id => document.getElementById(id);
const avatarBox = el("avatarBox");
const avatar = el("avatar");
const fx = el("fx");
const statusText = el("statusText");
const chatInput = el("chatInput");
const chatSend = el("chatSend");
const profilePanel = el("profilePanel");
const friendsPanel = el("friendsPanel");
const rankPanel = el("rankPanel");

// ===== HELPERS =====
function today() { return new Date().toISOString().slice(0,10); }
function hour() { return new Date().getHours(); }
function xpForLevel(l) { return Math.floor(30 * Math.pow(l, 1.4)); }
function levelByXP(x) { let l=1; while(x>=xpForLevel(l+1)) l++; return l; }

// ===== CHAT =====
function avatarReply(text) {
  const t = text.toLowerCase();
  if (t.includes("утро")) return "Доброе утро ☀️ Сегодня будет хороший шаг.";
  if (t.includes("ноч")) return "Спокойной ночи 🌙 Ты молодец.";
  return "Я рядом. Маленькие шаги важны.";
}
chatSend.onclick = () => {
  if (!chatInput.value) return;
  statusText.textContent = "💬 " + avatarReply(chatInput.value);
  chatInput.value = "";
};

// ===== TASK =====
function canActivateTask() {
  return !Day.task && Day.done < CFG.TASKS_PER_DAY && Date.now() >= Day.nextAt;
}
function activateTask() {
  if (!canActivateTask()) return;
  const pool = TASKS[Math.floor(Math.random()*TASKS.length)];
  Day.task = pool;
  avatar.classList.toggle("glow-epic", pool.rarity==="epic");
}

// ===== TAP =====
avatarBox.onclick = () => {
  fx.classList.remove("pulse"); void fx.offsetWidth; fx.classList.add("pulse");

  User.taps++;
  User.money += CFG.MONEY_PER_TAP;

  if (User.taps % CFG.TAPS_PER_SILVER === 0) User.silver++;
  if (User.silver >= CFG.SILVER_PER_GOLD) {
    User.gold++; User.silver = 0;
    statusText.textContent = "🥇 Получено золото!";
  }

  if (Day.task) {
    User.xp += CFG.XP[Day.task.rarity];
    Day.history.push(Day.task.text);
    Day.done++;
    Day.task = null;
    Day.nextAt = Date.now() + CFG.COOLDOWN_HOURS*3600000;
    statusText.textContent = "✅ Выполнено:\n" + Day.history.at(-1);
  }

  render();
};

// ===== FRIENDS (Telegram MVP) =====
function loadFriends() {
  if (!tg?.initDataUnsafe?.user) return;
  User.friends = [{ id: 1, name: "Друг", liked: false }];
}

// ===== RANK (mock) =====
function renderRank() {
  rankPanel.textContent = "🌍 Ранг: #" + (1000 - levelByXP(User.xp));
}

// ===== PROFILE =====
function renderProfile() {
  profilePanel.textContent =
    `👤 ${User.name}
LVL ${levelByXP(User.xp)}
XP ${User.xp}
Заданий сегодня: ${Day.done}/${CFG.TASKS_PER_DAY}
История: ${Day.history.join(" • ") || "—"}`;
}// ===== RENDER =====
function render() {
  if (User.lastDay !== today()) {
    User.lastDay = today();
    User.streak++;
    Day = newDay();
  }

  el("level").textContent = levelByXP(User.xp);
  el("streak").textContent = User.streak;
  el("silver").textContent = User.silver;
  el("gold").textContent = User.gold;
  el("money").textContent = User.money;

  const lvl = levelByXP(User.xp);
  const prev = xpForLevel(lvl);
  const next = xpForLevel(lvl+1);
  el("xpFill").style.width =
    Math.min(((User.xp-prev)/(next-prev))*100,100)+"%";

  if (canActivateTask()) activateTask();
  if (Day.task) statusText.textContent = Day.task.text;

  renderProfile();
  renderRank();

  localStorage.setItem("xp",User.xp);
  localStorage.setItem("streak",User.streak);
  localStorage.setItem("taps",User.taps);
  localStorage.setItem("silver",User.silver);
  localStorage.setItem("gold",User.gold);
  localStorage.setItem("money",User.money);
  localStorage.setItem("friends",JSON.stringify(User.friends));
  localStorage.setItem("lastDay",User.lastDay);
  localStorage.setItem("day",JSON.stringify(Day));
}

// ===== START =====
loadFriends();
render();
setInterval(render,60000);