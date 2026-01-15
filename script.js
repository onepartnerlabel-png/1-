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

// ===== HELPERS =====
const el = id => document.getElementById(id);
const today = () => new Date().toISOString().slice(0,10);
const xpForLevel = l => Math.floor(30 * Math.pow(l, 1.4));
const levelByXP = x => { let l=1; while(x>=xpForLevel(l+1)) l++; return l; };

// ===== USER =====
const User = {
  xp: +localStorage.getItem("xp") || 0,
  streak: +localStorage.getItem("streak") || 0,
  taps: +localStorage.getItem("taps") || 0,
  silver: +localStorage.getItem("silver") || 0,
  gold: +localStorage.getItem("gold") || 0,
  money: +localStorage.getItem("money") || 0,
  lastDay: localStorage.getItem("lastDay") || ""
};

// ===== DAY =====
let Day = JSON.parse(localStorage.getItem("day")) || newDay();
function newDay(){
  return { date: today(), done: 0, task: null, nextAt: 0, history: [] };
}

// ===== TASKS =====
const TASKS = [
  { text:"Сделай 3 глубоких вдоха", rarity:"common" },
  { text:"Выпей стакан воды", rarity:"common" },
  { text:"Убери 1 предмет рядом", rarity:"common" },
  { text:"Запиши мысль о дне", rarity:"rare" },
  { text:"Сделай шаг к цели", rarity:"rare" },
  { text:"1 минута тишины", rarity:"epic" }
];

// ===== STATE =====
function canActivateTask(){
  return !Day.task && Day.done < CFG.TASKS_PER_DAY && Date.now() >= Day.nextAt;
}
function activateTask(){
  if (!canActivateTask()) return;
  Day.task = TASKS[Math.floor(Math.random()*TASKS.length)];
  el("avatar").classList.toggle("glow-epic", Day.task.rarity==="epic");
}

// ===== TAP =====
el("avatarBox").onclick = () => {
  el("fx").classList.remove("pulse");
  void el("fx").offsetWidth;
  el("fx").classList.add("pulse");

  User.taps++;
  User.money += CFG.MONEY_PER_TAP;

  if (User.taps % CFG.TAPS_PER_SILVER === 0) User.silver++;
  if (User.silver >= CFG.SILVER_PER_GOLD) {
    User.gold++; User.silver = 0;
    el("statusText").textContent = "🥇 Получено золото!";
  }

  if (Day.task) {
    User.xp += CFG.XP[Day.task.rarity];
    Day.history.push(Day.task.text);
    Day.done++;
    Day.task = null;
    Day.nextAt = Date.now() + CFG.COOLDOWN_HOURS * 3600000;
    el("statusText").textContent = "✅ Выполнено:\n" + Day.history.at(-1);
  }

  render();
};

// ===== CHAT =====
el("chatSend").onclick = () => {
  const v = el("chatInput").value.trim();
  if (!v) return;
  el("statusText").textContent = "💬 Я рядом. Маленькие шаги важны.";
  el("chatInput").value = "";
};

// ===== RENDER =====
function render(){
  if (User.lastDay !== today()) {
    User.lastDay = today();
    User.streak++;
    Day = newDay();
  }

  if (canActivateTask()) activateTask();

  el("level").textContent = levelByXP(User.xp);
  el("rankText").textContent = "#" + (1000 - levelByXP(User.xp));
  el("streak").textContent = User.streak;
  el("silver").textContent = User.silver;
  el("gold").textContent = User.gold;
  el("money").textContent = User.money;

  const lvl = levelByXP(User.xp);
  const prev = xpForLevel(lvl);
  const next = xpForLevel(lvl+1);
  el("xpFill").style.width =
    Math.min(((User.xp-prev)/(next-prev))*100,100)+"%";

  if (Day.task) {
    el("statusText").textContent = "🧠 Текущий шаг:\n" + Day.task.text;
  } else if (Date.now() < Day.nextAt) {
    const m = Math.ceil((Day.nextAt - Date.now()) / 60000);
    el("statusText").textContent = `⏳ Следующий шаг через ${m} мин`;
  } else {
    el("statusText").textContent = "✨ Маленькие тапы тоже важны";
  }

  el("historyPanel").textContent =
    `📊 Сегодня: ${Day.done}/${CFG.TASKS_PER_DAY}\n` +
    (Day.history.slice(-3).map(t=>"• "+t).join("\n") || "");

  localStorage.setItem("xp",User.xp);
  localStorage.setItem("streak",User.streak);
  localStorage.setItem("taps",User.taps);
  localStorage.setItem("silver",User.silver);
  localStorage.setItem("gold",User.gold);
  localStorage.setItem("money",User.money);
  localStorage.setItem("lastDay",User.lastDay);
  localStorage.setItem("day",JSON.stringify(Day));
}

// ===== START =====
render();
setInterval(render,60000);


