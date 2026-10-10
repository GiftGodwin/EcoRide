(() => {
  const S = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const IC = {
    home: S('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>'),
    car: S(
      '<path d="M5 16l1.5-5.5A2 2 0 018.4 9h7.2a2 2 0 011.9 1.5L19 16"/><rect x="3" y="16" width="18" height="4" rx="1.5"/><circle cx="7.5" cy="18" r=".6"/><circle cx="16.5" cy="18" r=".6"/>',
    ),
    card: S(
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    ),
    coins: S(
      '<ellipse cx="12" cy="7" rx="8" ry="3"/><path d="M4 7v5c0 1.7 3.6 3 8 3s8-1.300 8-3V7"/><path d="M4 12v5c0 1.700 3.600 3 8 3s8-1.300 8-3v-5"/>',
    ),
    wallet: S(
      '<path d="M4 7a2 2 0 012-2h11v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="16.500" cy="13.500" r="1.200"/>',
    ),
    user: S(
      '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    ),
    users: S(
      '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c.8-3.500 3.300-5.500 6.500-5.500s5.700 2 6.500 5.500"/><path d="M16 4.500a3.500 3.500 0 010 7"/><path d="M18 14.800c2 .7 3.200 2.500 3.600 5.200"/>',
    ),
    settings: S(
      '<circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 00.3 1.800l.1.1a2 2 0 11-2.800 2.800l-.1-.1a1.700 1.700 0 00-1.800-.3 1.700 1.700 0 00-1 1.500V21a2 2 0 01-4 0v-.1a1.700 1.700 0 00-1.100-1.500 1.700 1.700 0 00-1.800.3l-.1.1a2 2 0 11-2.800-2.800l.1-.1a1.700 1.700 0 00.3-1.800 1.700 1.700 0 00-1.500-1H3a2 2 0 010-4h.1a1.700 1.700 0 001.500-1.100 1.700 1.700 0 00-.3-1.800l-.1-.1a2 2 0 112.800-2.800l.1.1a1.700 1.700 0 001.800.3H9a1.700 1.700 0 001-1.500V3a2 2 0 014 0v.1a1.700 1.700 0 001 1.500 1.700 1.700 0 001.800-.3l.1-.1a2 2 0 112.800 2.800l-.1.1a1.700 1.700 0 00-.3 1.800V9a1.700 1.700 0 001.500 1H21a2 2 0 010 4h-.1a1.700 1.700 0 00-1.500 1z"/>',
    ),
    logout: S(
      '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    ),
    search: S('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.300-4.300"/>'),
    clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    help: S(
      '<circle cx="12" cy="12" r="9"/><path d="M9.500 9.500a2.500 2.500 0 114 2c-.9.6-1.500 1.200-1.500 2.300"/><circle cx="12" cy="17" r=".5"/>',
    ),
    calendar: S(
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    ),
    pin: S(
      '<path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.500"/>',
    ),
    swap: S(
      '<path d="M7 4L3 8l4 4"/><path d="M3 8h14"/><path d="M17 20l4-4-4-4"/><path d="M21 16H7"/>',
    ),
    bell: S(
      '<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 004 0"/>',
    ),
    check: S('<path d="M5 12.500l4.500 4.500L19 7.500"/>'),
    shield: S(
      '<path d="M12 3l8 3v5.500c0 4.700-3.300 8-8 9.500-4.700-1.500-8-4.800-8-9.500V6z"/><path d="M8.500 12l2.500 2.500 4.500-5"/>',
    ),
    phone: S(
      '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>',
    ),
    share: S(
      '<circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="6" r="2.500"/><circle cx="18" cy="18" r="2.500"/><path d="M8.200 10.800l7.600-3.600M8.200 13.200l7.600 3.600"/>',
    ),
    alert: S(
      '<path d="M12 3L2 20h20z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".4"/>',
    ),
    star: S(
      '<path d="M12 3l2.700 5.600 6.100.8-4.500 4.200 1.100 6-5.400-3-5.400 3 1.100-6L3.200 9.400l6.100-.8z"/>',
    ),
    leaf: S(
      '<path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z"/><path d="M5 19c3-5 6-8 10-10"/>',
    ),
    expand: S('<path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6"/>'),
    nav: S('<path d="M4 11l16-7-7 16-2.500-6.500z"/>'),
    receipt: S(
      '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    ),
    arrow: S('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    chev: S('<path d="M9 5l7 7-7 7"/>'),
    chevd: S('<path d="M6 9l6 6 6-6"/>'),
    back: S('<path d="M15 5l-7 7 7 7"/>'),
    route: S(
      '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 17c0-6 12-4 12-10"/>',
    ),
    sched: S(
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v4M10 15h4"/>',
    ),
    ride: S(
      '<path d="M5 16l1.500-5.500A2 2 0 018.400 9h7.200a2 2 0 011.900 1.500L19 16"/><rect x="3" y="16" width="18" height="4" rx="1.500"/>',
    ),
    walk: S(
      '<circle cx="13" cy="4.500" r="1.800"/><path d="M10 21l2-6-2.500-2.500L11 8l3 2 3 1M9 12l-3 2"/>',
    ),
    dot: S('<circle cx="12" cy="12" r="4"/>'),
    dl: S('<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>'),
    cash: S(
      '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.500"/>',
    ),
    lock: S(
      '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    ),
    list: S('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),
    filter: S('<path d="M4 6h16M7 12h10M10 18h4"/>'),
    info: S(
      '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".4"/>',
    ),
  };
  const hydrate = (root = document) =>
    root.querySelectorAll("[data-ic]").forEach((e) => {
      if (!e.firstChild) e.innerHTML = IC[e.dataset.ic] || "";
    });
  hydrate();
  window.pagesIcons = IC;

  const qs = new URLSearchParams(location.search);
  const dash = "—";
  const fmtDate = (v, long) => {
    const d = new Date(v + "T00:00:00");
    return isNaN(d)
      ? v
      : d.toLocaleDateString(
          "en-GB",
          long
            ? {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              }
            : { day: "numeric", month: "short", year: "numeric" },
        );
  };
  const fmtTime = (v) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(v || "");
    if (!m) return v;
    const h = +m[1];
    return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
  };
  document.querySelectorAll("[data-q]").forEach((e) => {
    const v = qs.get(e.dataset.q);
    if (e.matches("input,select")) {
      if (v) e.value = v;
      return;
    }
    let t = v || dash;
    if (v && e.dataset.fmt === "date") t = fmtDate(v, true);
    if (v && e.dataset.fmt === "time") t = fmtTime(v);
    if (v && e.dataset.fmt === "pax")
      t = `${v} passenger${v === "1" ? "" : "s"}`;
    e.textContent = t;
  });
  document.querySelectorAll("input[type=date][name=date]").forEach((i) => {
    if (!i.value) i.value = new Date().toLocaleDateString("en-CA");
  });

  const first = (store.get("name") || store.get("user_name") || "")
    .trim()
    .split(/\s+/)[0];
  const hr = new Date().getHours();
  document.querySelectorAll("[data-greet]").forEach((e) => {
    e.textContent = `${hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening"}${first ? ", " + first : ""} 👋`;
  });
  document.querySelectorAll("[data-today]").forEach((e) => {
    e.textContent = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  });

  // placeholder links
  document.querySelectorAll('a[href="#"]').forEach((a) =>
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      toast("This page isn't available yet.");
    }),
  );

  // search bars -> available rides
  document.querySelectorAll("form.searchbar").forEach((f) =>
    f.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const p = new URLSearchParams();
      new FormData(f).forEach((v, k) => {
        if (String(v).trim()) p.set(k, String(v).trim());
      });
      if (!p.get("from") || !p.get("to"))
        return toast("Enter a pickup location and a destination.");
      go("available-rides.html?" + p);
    }),
  );
  document.querySelectorAll("[data-swap]").forEach((b) =>
    b.addEventListener("click", () => {
      const f = b.closest("form"),
        a = f.elements.from,
        c = f.elements.to;
      [a.value, c.value] = [c.value, a.value];
    }),
  );
  document.querySelectorAll("[data-focus]").forEach((b) =>
    b.addEventListener("click", () => {
      const t = document.querySelector(b.dataset.focus);
      t?.scrollIntoView({ behavior: "smooth", block: "center" });
      t?.focus();
    }),
  );

  // steppers
  document.querySelectorAll("[data-step]").forEach((b) =>
    b.addEventListener("click", () => {
      const i = b.parentElement.querySelector("input"),
        n = Math.min(
          +i.max || 8,
          Math.max(+i.min || 1, (+i.value || 0) + +b.dataset.step),
        );
      i.value = n;
    }),
  );

  // toggles
  document.querySelectorAll(".sw").forEach((b) =>
    b.addEventListener("click", () => {
      const on = b.getAttribute("aria-checked") !== "true";
      b.setAttribute("aria-checked", on);
      b.firstChild.textContent = on ? "You're online" : "Go online";
    }),
  );
  document.querySelectorAll(".rtype button").forEach((b) =>
    b.addEventListener("click", () => {
      b.parentElement
        .querySelectorAll("button")
        .forEach((x) => x.classList.toggle("sel", x === b));
    }),
  );
  document.querySelectorAll("[data-more]").forEach((b) =>
    b.addEventListener("click", () => {
      const t = document.querySelector(b.dataset.more);
      t.hidden = !t.hidden;
      b.setAttribute("aria-expanded", !t.hidden);
    }),
  );
  document
    .querySelectorAll("[data-alert]")
    .forEach((b) =>
      b.addEventListener("click", () =>
        toast(
          "Ride alerts are not available yet because the backend has not published an alerts endpoint.",
        ),
      ),
    );
  document.querySelectorAll("[data-logout]").forEach((a) =>
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      localStorage.removeItem("eco_token");
      go("login.html");
    }),
  );
  document.querySelectorAll("[data-share]").forEach((b) =>
    b.addEventListener("click", async () => {
      const data = { title: "My EcoRide trip", url: location.href };
      try {
        if (navigator.share) return await navigator.share(data);
        await navigator.clipboard.writeText(data.url);
        toast("Trip link copied.");
      } catch (_) {
        /* cancelled */
      }
    }),
  );

  // publish ride
  const pub = document.getElementById("publish-form");
  if (pub)
    pub.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const f = pub.elements;
      if (!f.from.value.trim() || !f.to.value.trim())
        return toast("Enter where the ride starts and ends.");
      if (!f.date.value || !f.time.value)
        return toast("Choose a date and time.");
      if (!(+f.fare.value > 0)) return toast("Enter a fare per seat.");
      toast(
        "Publishing cannot be completed yet because the live backend has not published a rides endpoint.",
      );
    });

  // alternative departure times: chips around the requested time
  const chips = document.getElementById("time-chips");
  if (chips) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(qs.get("time") || "");
    const label = document.getElementById("at-time"),
      msg = document.getElementById("pref-time");
    if (m) {
      const base = +m[1] * 60 + +m[2];
      const t = (mins) => {
        const x = ((mins % 1440) + 1440) % 1440;
        return fmtTime(
          `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}`,
        );
      };
      [-45, -30, -15, 0, 15, 30, 45].forEach((d) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = t(base + d);
        if (d === 0) b.disabled = true;
        b.addEventListener("click", () => {
          chips
            .querySelectorAll(".chip")
            .forEach((c) => c.classList.toggle("on", c === b));
          label.textContent = b.textContent;
        });
        chips.append(b);
      });
      const pick = chips.children[4];
      pick.classList.add("on");
      label.textContent = pick.textContent;
      msg.textContent = t(base);
    } else {
      label.textContent = dash;
      msg.textContent = "your preferred time";
    }
  }

  // maps (Leaflet is optional; the page stays usable without it)
  document.querySelectorAll("[data-map]").forEach((el) => {
    if (!window.L) return;
    const map = L.map(el, {
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([6.5244, 3.3792], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    setTimeout(() => map.invalidateSize(), 120);
  });
})();

// carry the search (?from=&to=&date=&time=&pax=) across the result pages
(() => {
  const q = location.search;
  if (!q) return;
  document.querySelectorAll("a[data-keepq]").forEach((a) => {
    const u = a.getAttribute("href").split("?")[0];
    a.setAttribute("href", u + q);
  });
})();
