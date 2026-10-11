// ===== Config: change these for a real client =====
const CONFIG = {
  // WhatsApp number with country code, digits only (e.g. "18645550123"). Empty = demo mode.
  whatsappNumber: "",
  // Weekly schedule, 0 = Sunday ... 6 = Saturday. null = day off. Times in 24h "HH:MM".
  schedule: [
    { place: "Parque Central", open: "12:00", close: "20:00" },
    null,
    { place: "Main St y 5ta", open: "17:00", close: "22:00" },
    { place: "Main St y 5ta", open: "17:00", close: "22:00" },
    { place: "Main St y 5ta", open: "17:00", close: "22:00" },
    { place: "Plaza del Mercado", open: "17:00", close: "23:30" },
    { place: "Plaza del Mercado", open: "17:00", close: "23:30" }
  ],
  weekOrder: [1, 2, 3, 4, 5, 6, 0] // list starts on Monday
};

const UI = {
  es: {
    days: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
    toggleLabel: "Switch to English",
    off: "Descanso",
    offToday: "Hoy descansamos",
    nextOpen: (d, p) => `Volvemos el ${d} en ${p}`,
    openNow: "Abierto ahora",
    opensAt: (t) => `Cerrado ahora. Abrimos a las ${t}`,
    closed: "Ya cerramos por hoy",
    todayTag: "HOY",
    errEmpty: "Agrega al menos una cosa del menú.",
    errName: "Escribe el nombre para recoger.",
    remove: (n) => `Quitar uno: ${n}`,
    add: (n) => `Agregar: ${n}`,
    msg: (lines, total, name) => `Hola, quiero pedir para recoger:\n${lines}\nTotal: ${total}\nA nombre de: ${name}`,
    demoTitle: "Así funciona en tu página",
    demoWa: "Se abre WhatsApp con este pedido ya escrito para el truck:"
  },
  en: {
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    toggleLabel: "Cambiar a español",
    off: "Day off",
    offToday: "We're off today",
    nextOpen: (d, p) => `Back on ${d} at ${p}`,
    openNow: "Open now",
    opensAt: (t) => `Closed now. We open at ${t}`,
    closed: "Closed for today",
    todayTag: "TODAY",
    errEmpty: "Add at least one item from the menu.",
    errName: "Enter a name for pickup.",
    remove: (n) => `Remove one: ${n}`,
    add: (n) => `Add: ${n}`,
    msg: (lines, total, name) => `Hi, I'd like to order for pickup:\n${lines}\nTotal: ${total}\nName: ${name}`,
    demoTitle: "How it works on your page",
    demoWa: "WhatsApp opens with this order already written to the truck:"
  }
};

let lang = "es";
const cart = {};
const ES = {};
const $ = (id) => document.getElementById(id);
const money = (n) => `$${n.toFixed(2)}`;

// ===== i18n =====
function captureSpanish() {
  document.querySelectorAll("[data-i18n]").forEach((el) => { if (!(el.dataset.i18n in ES)) ES[el.dataset.i18n] = el.innerHTML; });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const [attr, key] = el.dataset.i18nAttr.split(":");
    if (!(key in ES)) ES[key] = el.getAttribute(attr);
  });
}

function applyLang(next) {
  lang = next;
  const dict = lang === "en" ? window.I18N_EN : ES;
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => { const v = dict[el.dataset.i18n]; if (v !== undefined) el.innerHTML = v; });
  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const [attr, key] = el.dataset.i18nAttr.split(":");
    if (dict[key] !== undefined) el.setAttribute(attr, dict[key]);
  });
  $("lang-toggle").textContent = lang === "en" ? "ES" : "EN";
  $("lang-toggle").setAttribute("aria-label", UI[lang].toggleLabel);
  renderToday();
  renderWeek();
  renderItems();
  renderOrder();
  try { localStorage.setItem("lang", lang); } catch (e) { /* storage unavailable */ }
}

// ===== Schedule =====
function toMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function fmt(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? ":" + String(m).padStart(2, "0") : ""} ${h >= 12 ? "p.m." : "a.m."}`;
}

function renderToday() {
  const t = UI[lang];
  const now = new Date();
  const d = now.getDay();
  const s = CONFIG.schedule[d];
  const card = document.querySelector(".today");
  $("today-day").textContent = t.days[d];
  if (!s) {
    let k = 1;
    while (!CONFIG.schedule[(d + k) % 7] && k < 7) k++;
    const next = CONFIG.schedule[(d + k) % 7];
    $("today-place").textContent = t.offToday;
    $("today-hours").textContent = next ? t.nextOpen(t.days[(d + k) % 7], next.place) : "";
    $("today-status-text").textContent = t.closed;
    card.classList.add("is-closed");
    return;
  }
  const mins = now.getHours() * 60 + now.getMinutes();
  $("today-place").textContent = s.place;
  $("today-hours").textContent = `${fmt(s.open)} – ${fmt(s.close)}`;
  let status;
  if (mins >= toMin(s.open) && mins < toMin(s.close)) status = t.openNow;
  else if (mins < toMin(s.open)) status = t.opensAt(fmt(s.open));
  else status = t.closed;
  $("today-status-text").textContent = status;
  card.classList.toggle("is-closed", status !== t.openNow);
}

function renderWeek() {
  const t = UI[lang];
  const today = new Date().getDay();
  const list = $("week");
  list.replaceChildren();
  CONFIG.weekOrder.forEach((d) => {
    const s = CONFIG.schedule[d];
    const li = document.createElement("li");
    if (d === today) li.className = "is-today";
    if (!s) li.classList.add("is-off");
    const day = document.createElement("span"); day.className = "day"; day.textContent = t.days[d].charAt(0).toUpperCase() + t.days[d].slice(1);
    if (d === today) day.dataset.today = t.todayTag;
    const place = document.createElement("span"); place.className = "place"; place.textContent = s ? s.place : t.off;
    const hours = document.createElement("span"); hours.className = "hours"; hours.textContent = s ? `${fmt(s.open)} – ${fmt(s.close)}` : "";
    li.append(day, place, hours);
    list.append(li);
  });
}

// ===== Menu + order =====
function itemName(li) { return li.querySelector(".item-name").textContent.trim(); }

function renderItems() {
  document.querySelectorAll(".item").forEach((li) => {
    const id = li.dataset.id;
    const n = cart[id] || 0;
    const name = itemName(li);
    const box = li.querySelector(".qty");
    box.replaceChildren();
    if (n > 0) {
      const minus = document.createElement("button");
      minus.type = "button"; minus.textContent = "−"; minus.setAttribute("aria-label", UI[lang].remove(name));
      minus.addEventListener("click", () => change(id, -1));
      const count = document.createElement("span"); count.className = "qty-n"; count.textContent = n;
      box.append(minus, count);
    }
    const plus = document.createElement("button");
    plus.type = "button"; plus.className = "add"; plus.textContent = "+"; plus.setAttribute("aria-label", UI[lang].add(name));
    plus.addEventListener("click", () => change(id, 1));
    box.append(plus);
    li.classList.toggle("in-order", n > 0);
  });
}

function change(id, delta) {
  const next = Math.max(0, (cart[id] || 0) + delta);
  if (next === 0) delete cart[id]; else cart[id] = next;
  renderItems();
  renderOrder();
  const btn = document.querySelector(`.item[data-id="${id}"] .qty ${delta > 0 ? ".add" : "button:not(.add)"}`) || document.querySelector(`.item[data-id="${id}"] .add`);
  if (btn) btn.focus();
}

function orderLines() {
  return Object.entries(cart).map(([id, n]) => {
    const li = document.querySelector(`.item[data-id="${id}"]`);
    return { n, name: itemName(li), sub: n * Number(li.dataset.price) };
  });
}

function renderOrder() {
  const lines = orderLines();
  const total = lines.reduce((a, l) => a + l.sub, 0);
  const count = lines.reduce((a, l) => a + l.n, 0);
  const ul = $("pad-lines");
  ul.replaceChildren();
  lines.forEach((l) => {
    const li = document.createElement("li");
    const n = document.createElement("span"); n.className = "n"; n.textContent = l.n;
    const name = document.createElement("span"); name.textContent = l.name;
    const p = document.createElement("span"); p.className = "p"; p.textContent = money(l.sub);
    li.append(n, name, p);
    ul.append(li);
  });
  $("pad-empty").hidden = lines.length > 0;
  $("pad-total").textContent = money(total);
  $("bar-count").textContent = count;
  $("bar-total").textContent = money(total);
  updateBar();
}

// Show the mobile bar only when there is an order and the pad is off screen.
let padVisible = false;
function updateBar() {
  $("order-bar").hidden = !(Object.keys(cart).length > 0 && !padVisible);
}

// ===== WhatsApp + toast =====
let toastTimer;
function showToast(title, body, quote) {
  const toast = $("toast");
  toast.replaceChildren();
  const s = document.createElement("strong"); s.textContent = title;
  toast.append(s, document.createTextNode(body));
  if (quote) { const pre = document.createElement("pre"); pre.textContent = quote; toast.append(pre); }
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 9000);
}

function sendOrder() {
  const t = UI[lang];
  const err = $("form-error");
  const name = $("f-name").value.trim();
  const lines = orderLines();
  let msg = "";
  if (!lines.length) msg = t.errEmpty;
  else if (!name) { msg = t.errName; $("f-name").focus(); }
  if (msg) { err.textContent = msg; err.hidden = false; return; }
  err.hidden = true;
  const total = money(lines.reduce((a, l) => a + l.sub, 0));
  const text = t.msg(lines.map((l) => `• ${l.n} ${l.name}`).join("\n"), total, name);
  if (CONFIG.whatsappNumber) {
    window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  } else {
    showToast(t.demoTitle, t.demoWa, text);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  captureSpanish();
  let saved = "es";
  try { saved = localStorage.getItem("lang") || "es"; } catch (e) { /* storage unavailable */ }
  applyLang(saved === "en" ? "en" : "es");
  $("lang-toggle").addEventListener("click", () => applyLang(lang === "es" ? "en" : "es"));
  $("send-order").addEventListener("click", sendOrder);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      padVisible = entries[0].isIntersecting;
      updateBar();
    }).observe($("orden"));
  }
});
