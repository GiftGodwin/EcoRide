const API = "https://ecoride-backend-mdlg.onrender.com";
const store = {
  get: (k) => localStorage.getItem("eco_" + k),
  set: (k, v) => localStorage.setItem("eco_" + k, v),
};
const ICON = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  check:
    '<svg width="22" height="22" viewBox="0 0 24 24"><g fill="#0E766E"><rect x="4.5" y="4.5" width="15" height="15" rx="4"/><rect x="4.5" y="4.5" width="15" height="15" rx="4" transform="rotate(45 12 12)"/></g><path d="M8.3 12.3l2.6 2.6 4.9-5.1" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0E766E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>',
  hash: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M10 7.5l-1 9M15.500 7.500l-1 9M7.500 10h9M7.500 14h9"/></svg>',
  shield:
    '<svg width="64" height="72" viewBox="0 0 24 27"><path d="M12 1l9.500 3.500v7.200c0 6-4 10.600-9.500 13.300C6.500 22.300 2.500 17.700 2.500 11.700V4.500z" fill="#0E766E"/><path d="M7.500 13l3.300 3.300 6-6.300" fill="none" stroke="#fff" stroke-width="2.200" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
document
  .querySelectorAll("[data-i]")
  .forEach((e) => (e.innerHTML = ICON[e.dataset.i]));
function toast(m) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    document.body.append(t);
  }
  t.textContent = m;
  t.classList.add("show");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("show"), 3800);
}
function go(u) {
  document.body.classList.add("leave");
  setTimeout(() => (location.href = u), 250);
}
async function api(path, { method = "GET", body, form } = {}) {
  const h = {};
  const t = store.get("token");
  if (t) h.Authorization = "Bearer " + t;
  if (body) h["Content-Type"] = "application/json";
  const wake = setTimeout(
    () => toast("The server is waking up. This can take up to a minute."),
    4000,
  );
  document.body.classList.add("busy");
  try {
    const r = await fetch(API + path, {
      method,
      headers: h,
      body: form || (body && JSON.stringify(body)),
    });
    const d = await r.json().catch(() => null);
    if (!r.ok)
      throw new Error(
        d?.message || d?.error || "Request failed (" + r.status + ")",
      );
    if (d?.token) store.set("token", d.token);
    return d;
  } catch (e) {
    throw e instanceof TypeError
      ? new Error("Cannot reach the server. Check your connection.")
      : e;
  } finally {
    clearTimeout(wake);
    document.body.classList.remove("busy");
  }
}
async function busy(btn, fn) {
  btn.classList.add("load");
  btn.disabled = true;
  try {
    return await fn();
  } finally {
    btn.classList.remove("load");
    btn.disabled = false;
  }
}
