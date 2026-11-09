// Frontend logic: loads data from the backend API, then renders the cloud view (modules m1-m8)
// and the FAT view (papers A1, A2, F1, G1, G2). Routing uses the URL hash: #m3, #fat-g1.
import { Api } from "./api.js";

const tabsEl = document.getElementById("tabs");
const bodyEl = document.getElementById("body");
const titleEl = document.getElementById("title");
const backEl = document.getElementById("back");
const fatEl = document.getElementById("fatBtn");
const scrollEl = document.getElementById("scroll");
const themeBtn = document.getElementById("theme");
const q = document.getElementById("q");

let MODS = [];
let PAPERS = [];
let view = "cloud";
let cur = 0;
let curP = 0;
let builtView = "";

/* ---------- helpers ---------- */
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function priorityClass(p) {
  return p === "Very High" ? "vh" : p === "High" ? "hi" : "md";
}
function moduleTitle(id) {
  const m = MODS.find((x) => x.id === id);
  return m ? m.title : id;
}

/* ---------- cloud view ---------- */
function topicTable(rows) {
  let h = '<div class="tbl"><table><thead><tr><th>Topic</th><th>PYQ importance</th><th>Priority</th></tr></thead><tbody>';
  rows.forEach((r) => {
    h += "<tr><td>" + esc(r.topic) + "</td><td>" + esc(r.importance) + '</td><td class="pr ' + priorityClass(r.priority) + '">' + esc(r.priority) + "</td></tr>";
  });
  return h + "</tbody></table></div>";
}
function filterTopics(rows, term) {
  if (!term) return rows;
  return rows.filter((r) => (r.topic + " " + r.importance + " " + r.priority).toLowerCase().includes(term));
}
function renderCloud(term) {
  const m = MODS[cur];
  const a = filterTopics(m.priority1, term);
  const b = filterTopics(m.priority2, term);
  let h = "<h1>" + m.id.toUpperCase() + " – " + esc(m.title) + "</h1>";
  h += '<div class="stat"><span class="pill">' + m.priority1.length + ' must prepare</span><span class="pill">' + m.priority2.length + " important</span></div>";
  if (a.length) h += '<span class="chip p1">Priority 1 – Must prepare</span>' + topicTable(a);
  if (b.length) h += '<span class="chip p2">Priority 2 – Important</span>' + topicTable(b);
  if (!a.length && !b.length) h += '<p class="none">No topics in ' + m.id.toUpperCase() + " match “" + esc(q.value.trim()) + "”.</p>";
  bodyEl.innerHTML = h;
  Array.from(tabsEl.children).forEach((t, i) => t.setAttribute("aria-selected", i === cur ? "true" : "false"));
}

/* ---------- FAT view ---------- */
function questionText(question) {
  return question.parts
    .map((p) => [p.text, p.co, p.bl, p.modules.join(" ")].join(" "))
    .join(" ")
    .toLowerCase();
}
function partHtml(p) {
  let h = '<div class="part"><p>' + (p.label ? '<span class="pl">' + esc(p.label) + "</span>" : "") + esc(p.text) + '</p><div class="meta">';
  if (p.co) h += '<span class="tag">' + esc(p.co) + "</span>";
  if (p.bl) h += '<span class="tag">' + esc(p.bl) + "</span>";
  p.modules.forEach((k) => {
    h += '<a class="mchip" href="#' + k + '" data-go="' + k + '" title="' + esc(moduleTitle(k)) + '">' + k + "</a>";
  });
  return h + "</div></div>";
}
function renderFat(term) {
  const p = PAPERS[curP];
  let h = "<h1>" + esc(p.id) + " – Final Assessment Test, " + esc(p.exam) + "</h1>";
  h += '<p class="sub">' + esc(p.course) + " · Slot " + esc(p.slot) + " · Three hours</p>";
  h += '<div class="stat"><span class="pill">' + p.questions.length + ' questions</span><span class="pill">10 × 10 = 100 marks</span><span class="pill">Answer all questions</span></div>';
  let list = "";
  let shown = 0;
  p.questions.forEach((question) => {
    if (term && !questionText(question).includes(term)) return;
    shown++;
    list += '<li class="q"><span class="qn">' + question.number + '</span><div class="qb">';
    question.parts.forEach((part, j) => {
      if (j > 0) list += '<div class="or">OR</div>';
      list += partHtml(part);
    });
    list += "</div></li>";
  });
  if (shown) h += '<ol class="qs">' + list + "</ol>";
  else h += '<p class="none">No questions in ' + esc(p.id) + " match “" + esc(q.value.trim()) + "”.</p>";
  if (p.id === "F1") h += '<p class="note">F1 does not print CO or BL levels on the paper. Module tags are matched by topic.</p>';
  bodyEl.innerHTML = h;
  Array.from(tabsEl.children).forEach((t, i) => t.setAttribute("aria-selected", i === curP ? "true" : "false"));
}

/* ---------- shell: tabs, routing, render ---------- */
function buildTabs() {
  tabsEl.innerHTML = "";
  const labels = view === "fat" ? PAPERS.map((p) => p.id) : MODS.map((m) => m.id);
  tabsEl.setAttribute("aria-label", view === "fat" ? "Question papers" : "Modules m1 to m8");
  labels.forEach((label) => {
    const t = document.createElement("button");
    t.className = "tab";
    t.type = "button";
    t.setAttribute("role", "tab");
    t.textContent = label;
    t.onclick = () => go(view === "fat" ? "fat-" + label.toLowerCase() : label);
    tabsEl.appendChild(t);
  });
}
function render() {
  const term = q.value.trim().toLowerCase();
  if (builtView !== view) {
    buildTabs();
    builtView = view;
  }
  titleEl.textContent = view === "fat" ? "fat" : "cloud";
  backEl.hidden = view !== "fat";
  fatEl.hidden = view === "fat";
  q.placeholder = view === "fat" ? "Search questions in this paper, e.g. VPC, DMS, WAF" : "Search topics in this module, e.g. VPC, Aurora, KMS";
  if (view === "fat") renderFat(term);
  else renderCloud(term);
}
function parse(hash) {
  const h = (hash || "").replace("#", "").toLowerCase();
  if (h.startsWith("fat")) {
    view = "fat";
    const id = h.split("-")[1];
    const i = PAPERS.findIndex((p) => p.id.toLowerCase() === id);
    curP = i === -1 ? 0 : i;
  } else {
    view = "cloud";
    const i = MODS.findIndex((m) => m.id === h);
    cur = i === -1 ? 0 : i;
  }
}
function go(hash) {
  const before = view;
  parse(hash);
  if (before !== view) q.value = "";
  try {
    if (location.hash !== "#" + hash) location.hash = hash;
  } catch (e) {}
  render();
  scrollEl.scrollTop = 0;
}

/* ---------- theme ---------- */
const SUN = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
function setTheme(t) {
  const root = document.documentElement;
  if (t === "light") root.setAttribute("data-theme", "light");
  else root.removeAttribute("data-theme");
  themeBtn.innerHTML = t === "light" ? MOON : SUN;
  themeBtn.setAttribute("aria-label", t === "light" ? "Switch to dark mode" : "Switch to light mode");
  try {
    localStorage.setItem("cloud-theme", t);
  } catch (e) {}
}

/* ---------- start ---------- */
async function init() {
  let saved = "dark";
  try {
    saved = localStorage.getItem("cloud-theme") || "dark";
  } catch (e) {}
  setTheme(saved === "light" ? "light" : "dark");

  themeBtn.onclick = () => setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
  q.addEventListener("input", render);
  document.getElementById("clear").onclick = () => {
    q.value = "";
    render();
    q.focus();
  };
  fatEl.onclick = () => go("fat-a1");
  backEl.onclick = () => go("m1");
  bodyEl.addEventListener("click", (e) => {
    const a = e.target.closest ? e.target.closest("a[data-go]") : null;
    if (a) {
      e.preventDefault();
      go(a.getAttribute("data-go"));
    }
  });
  window.addEventListener("hashchange", () => {
    if (!MODS.length) return;
    parse(location.hash);
    render();
  });

  try {
    [MODS, PAPERS] = await Promise.all([Api.modules(), Api.papers()]);
  } catch (e) {
    bodyEl.innerHTML = '<p class="none">Could not load data from the backend. Start it with <code>npm start</code> and open <code>http://localhost:3000</code>.</p>';
    return;
  }
  parse(location.hash);
  render();
}

init();
