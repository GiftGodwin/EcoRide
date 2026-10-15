/* Connects each built page to the backend through EcoAPI (services.js). */
(() => {
  const E = EcoAPI;
  const $ = (id) => document.getElementById(id);
  const qs = new URLSearchParams(location.search);
  const page =
    location.pathname.split("/").pop().replace(".html", "") || "index";
  const set = (el, text) => {
    if (el && text !== null && text !== undefined && text !== "")
      el.textContent = text;
  };
  const quiet = (p) =>
    p.then(
      (v) => v,
      () => null,
    ); // a failed read leaves the "—" placeholders
  const guarded = [
    "passenger-dashboard",
    "driver-dashboard",
    "dashboard",
    "available-rides",
    "alternative-times",
    "no-match",
    "partial-match",
    "driver-profile",
    "booking",
    "checkout",
    "booking-request",
    "passenger-accepted",
    "live-trip",
    "seat-request",
    "request-processing",
    "booking-confirmation",
    "trusted-commute",
  ];
  if (guarded.includes(page) && !E.requireAuth()) return;

  // ---------- ride cards (available rides, alternative times) ----------
  const fillRide = (card, r) => {
    const q = (s) => card.querySelector(s),
      qa = (s) => [...card.querySelectorAll(s)];
    set(q(".rd-av"), E.initials(r.driverName));
    set(q(".rd-p b"), r.driverName);
    set(q(".rd-p small"), `★ ${r.rating ?? "—"} (${r.trips ?? "—"} trips)`);
    if (q(".vfy")) q(".vfy").hidden = !r.verified;
    set(q(".rd-v b"), r.vehicleName || "—");
    set(
      q(".rd-v small"),
      [r.colour, r.seatsTotal ? r.seatsTotal + " seats" : null]
        .filter(Boolean)
        .join(" · ") || "—",
    );
    const tag = qa(".tags .tag")[1];
    if (tag) {
      if (r.days?.length)
        tag.textContent = "↻ Recurring · " + E.dayLabel(r.days);
      else tag.hidden = true;
    }
    set(q(".rd-r h3"), `${r.from || "—"} → ${r.to || "—"}`);
    const tl = qa(".tl div");
    if (tl[0]) {
      set(tl[0].querySelector("b"), E.fmtTime(r.pickupTime));
      set(
        tl[0].querySelector("span"),
        `${r.pickupName || r.from || "—"} (Pickup)`,
      );
    }
    if (tl[1]) {
      set(tl[1].querySelector("b"), E.fmtTime(r.dropoffTime));
      set(tl[1].querySelector("span"), `${r.to || "—"} (Drop-off)`);
    }
    const meta = qa(".meta span"),
      txt = [
        `${r.durationMin ?? "—"} min`,
        `${r.distanceKm ?? "—"} km`,
        `${r.seatsLeft ?? "—"} seats left`,
      ];
    meta.forEach((m, i) => {
      const svg = m.querySelector("svg")?.outerHTML || "";
      m.innerHTML = svg + " " + txt[i];
    });
    const note = q(".note");
    if (note) {
      note.classList.toggle("part", r.partial);
      note.classList.toggle("ok", !r.partial);
      note.querySelector("b").textContent = r.partial
        ? "Partial route match"
        : "On your route";
      note.querySelector("b").nextSibling.textContent = r.partial
        ? "The pickup is a short walk from your preferred location."
        : "This driver’s route is a great match for your journey.";
    }
    const strong = q(".rd-x strong");
    if (strong) strong.textContent = E.naira(r.price);
    const [details, book] = qa(".rd-x a");
    const target = r.partial ? "partial-match.html" : "driver-profile.html";
    if (details) details.href = `${target}?ride=${encodeURIComponent(r.id)}`;
    if (book) book.href = `booking.html?ride=${encodeURIComponent(r.id)}`;
  };
  const renderRides = (box, rides, tpl) => {
    box.innerHTML = "";
    rides.forEach((r) => {
      const c = tpl.cloneNode(true);
      fillRide(c, r);
      box.append(c);
    });
  };
  const emptyBox = (box, html) => {
    box.innerHTML = `<div class="card" style="text-align:center;padding:28px">${html}</div>`;
  };
  const loadMatches = async () => {
    const commutes = E.asList(await E.getCommutes());
    const c =
      commutes.find(
        (x) => String(E.pick(x, ["id", "_id"])) === qs.get("commute"),
      ) || commutes[0];
    if (!c) return { commute: null, rides: [] };
    const rides = E.asList(await E.getMatches(E.pick(c, ["id", "_id"]))).map(
      E.ride,
    );
    E.cacheRides(rides);
    return { commute: c, rides };
  };
  const fillSearchInfo = (c) => {
    if (!c) return;
    const m = { from: E.str(c.from), to: E.str(c.to), time: c.departureTime };
    document.querySelectorAll("[data-q]").forEach((el) => {
      if (el.textContent.trim() !== "—" || !m[el.dataset.q]) return;
      el.textContent =
        el.dataset.fmt === "time"
          ? E.fmtTime(m[el.dataset.q])
          : m[el.dataset.q];
    });
  };

  // ---------- pages ----------
  const pages = {
    nin() {
      const n = $("nin"),
        nx = $("next");
      if (!n || !nx) return;
      const box = n.closest(".field") || n.parentElement;
      const err = document.createElement("p");
      err.setAttribute("role", "alert");
      err.style.cssText = "color:#b3261e;font-size:13px;margin:8px 2px 0";
      box.after(err);
      n.addEventListener("input", () => {
        n.value = n.value.replace(/\D/g, "").slice(0, 11);
        err.textContent = "";
        nx.disabled = !n.value;
      });
      nx.onclick = () => {
        if (nx.disabled) return;
        if (!/^\d{11}$/.test(n.value)) {
          err.textContent =
            "Invalid NIN. Enter the 11-digit number on your NIN slip.";
          return;
        }
        busy(nx, async () => {
          try {
            await E.verifyNin(n.value);
            store.set("nin_verified", "1");
            go("face.html");
          } catch (e) {
            err.textContent = e.message;
          }
        });
      };
    },

    async "passenger-dashboard"() {
      const [bk, cm] = await Promise.all([
        quiet(E.getBookings()),
        quiet(E.getCommutes()),
      ]);
      const all = E.asList(bk).map(E.booking);
      const upcoming = all.filter(
        (b) =>
          !E.is.cancelled(b.status) &&
          !E.is.declined(b.status) &&
          !/complete/.test(b.status),
      );
      const stats = document.querySelectorAll(".top4 .stat");
      const next = upcoming[0];
      if (next && stats[0]) {
        set(stats[0].querySelector("strong"), E.fmtTime(next.ride.pickupTime));
        set(
          stats[0].querySelector(".sub"),
          `${next.ride.from || "—"} → ${next.ride.to || "—"}`,
        );
        stats[0].querySelector("a").href =
          `booking.html?booking=${encodeURIComponent(next.id)}`;
      }
      const now = new Date(),
        paid = all.filter(
          (b) =>
            E.is.paid(b) &&
            new Date(b.paidAt || b.createdAt).getMonth() === now.getMonth(),
        );
      if (stats[1] && bk) {
        set(
          stats[1].querySelector("strong"),
          E.naira(paid.reduce((s, b) => s + (+b.total || 0), 0)),
        );
        set(
          stats[1].querySelector(".sub"),
          `${paid.length} ride${paid.length === 1 ? "" : "s"}`,
        );
      }
      const list = document.querySelector(".cols .list"),
        tpl = list?.firstElementChild?.cloneNode(true);
      if (list && bk) {
        list.innerHTML = "";
        if (!upcoming.length)
          list.innerHTML =
            '<div class="card muted" style="padding:22px">No upcoming rides yet. Use the search above to find a ride.</div>';
        upcoming.slice(0, 3).forEach((b) => {
          const row = tpl.cloneNode(true),
            d = new Date(b.ride.date || b.createdAt);
          const sp = row.querySelectorAll(".udate > *");
          if (!isNaN(d)) {
            sp[0].textContent = d
              .toLocaleDateString("en-US", { weekday: "short" })
              .toUpperCase();
            sp[1].textContent = d.getDate();
            sp[2].textContent = d
              .toLocaleDateString("en-US", { month: "short" })
              .toUpperCase();
          }
          set(row.querySelector(".uavatar"), E.initials(b.ride.driverName));
          set(row.querySelector(".ubody b"), b.ride.driverName);
          set(
            row.querySelector(".ubody span"),
            `${E.fmtTime(b.ride.pickupTime)} · ${b.ride.from || "—"} → ${b.ride.to || "—"}`,
          );
          set(row.querySelector(".uend span"), "1 passenger");
          set(
            row.querySelector(".uend b"),
            E.naira(b.total ?? b.fare ?? b.ride.price),
          );
          row.style.cursor = "pointer";
          row.onclick = () =>
            go(`booking.html?booking=${encodeURIComponent(b.id)}`);
          list.append(row);
        });
      }
      const c = E.asList(cm)[0];
      if (c) {
        const v = document.querySelectorAll(".kv2 b");
        set(v[0], E.str(c.pickupPoint) || E.str(c.from));
        set(v[1], E.str(c.to));
        set(v[2], E.fmtTime(c.departureTime));
        set(v[3], "1");
      }
    },

    async "driver-dashboard"() {
      const p = E.unwrap(await quiet(E.getDriverProfile()));
      if (!p) return;
      const stats = document.querySelectorAll(".top4 .stat");
      const rating = E.pick(p, ["rating", "averageRating"]),
        trips = E.pick(p, ["tripsCount", "totalTrips", "trips"]);
      if (stats[3] && rating !== null)
        stats[3].querySelector("strong").innerHTML =
          `${rating} <small>(${trips ?? "—"} trips)</small>`;
      const seats = E.pick(p, ["availableSeats", "vehicle.seats"]);
      if (stats[2] && seats !== null)
        set(stats[2].querySelector("strong"), seats);
    },

    async dashboard() {
      const bk = await quiet(E.getBookings());
      if (!bk) return;
      const paid = E.asList(bk)
        .map(E.booking)
        .filter(E.is.paid)
        .sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));
      const last = paid[0];
      const banner = document.querySelector(".banner");
      if (!last) {
        if (banner) banner.hidden = true;
        return;
      }
      const amt = E.naira(last.total),
        bank = /bank|transfer|ussd/i.test(last.method || "");
      set(
        banner.querySelector("small"),
        `Your ${amt} ${bank ? "bank transfer" : "payment"} has been confirmed.`,
      );
      banner.querySelector("a").href =
        `checkout.html?booking=${encodeURIComponent(last.id)}&state=receipt`;
      const m = document.querySelectorAll(".mini");
      set(m[0].querySelector("strong"), amt);
      set(m[1].querySelector("strong"), "Confirmed");
      set(
        m[1].querySelector("small"),
        `${bank ? "Bank transfer" : "Card payment"} · ${last.reference || "—"}`,
      );
      set(
        document.querySelector(".rrow small"),
        `${last.ride.from || "—"} → ${last.ride.to || "—"}`,
      );
      set(document.querySelector(".rrow .pill"), "Paid");
      set(document.querySelector(".bottom-row span"), `${amt} total paid`);
      const rows = document.querySelectorAll(".act-row");
      set(
        rows[0].querySelector(".ab b").firstChild,
        `${bank ? "Bank transfer" : "Payment"} confirmed `,
      );
      set(
        rows[0].querySelector(".ab small"),
        `${last.reference || "—"} · ${E.fmtDateTime(last.paidAt)}`,
      );
      set(rows[0].querySelector(".ar b"), amt);
      set(rows[0].querySelector(".pill"), "Successful");
      set(
        rows[1].querySelector("small"),
        `${E.fmtDate(last.paidAt)} · Download a copy for your records.`,
      );
    },

    async "available-rides"() {
      const box = document.querySelector(".rides"),
        tpl = box.firstElementChild.cloneNode(true),
        count = document.querySelector(".rhead h2 small");
      let res;
      try {
        res = await loadMatches();
      } catch (e) {
        emptyBox(
          box,
          `<b>Could not load rides</b><p class="muted">${e.message}</p>`,
        );
        return;
      }
      fillSearchInfo(res.commute);
      if (!res.commute) {
        set(count, "0 rides found");
        emptyBox(
          box,
          '<b>Save your commute to see matching rides</b><p class="muted" style="margin:6px 0 14px">We match drivers to your saved route and time.</p><a class="btn" href="recurring.html">Set up recurring commute</a>',
        );
        return;
      }
      if (!res.rides.length) {
        go("no-match.html" + location.search);
        return;
      }
      let rides = res.rides;
      const draw = () => {
        set(
          count,
          `${rides.length} ride${rides.length === 1 ? "" : "s"} found`,
        );
        renderRides(box, rides, tpl);
      };
      draw();
      document
        .querySelector(".sortbar select")
        ?.addEventListener("change", (e) => {
          const v = e.target.value;
          rides = [...res.rides];
          if (/price/i.test(v))
            rides.sort((a, b) => (+a.price || 0) - (+b.price || 0));
          if (/early/i.test(v))
            rides.sort(
              (a, b) =>
                (E.toMinutes(a.pickupTime) ?? 0) -
                (E.toMinutes(b.pickupTime) ?? 0),
            );
          draw();
        });
    },

    async "alternative-times"() {
      const box = document.querySelector(".rides"),
        tpl = box.firstElementChild.cloneNode(true),
        chips = $("time-chips");
      let res;
      try {
        res = await loadMatches();
      } catch (e) {
        emptyBox(
          box,
          `<b>Could not load rides</b><p class="muted">${e.message}</p>`,
        );
        return;
      }
      fillSearchInfo(res.commute);
      const draw = (label) => {
        const mins = label
          ? (E.toMinutes(label.replace(/^(\d):/, "0$1:")) ?? parseClock(label))
          : null;
        const rides =
          mins === null
            ? res.rides
            : res.rides.filter(
                (r) =>
                  Math.abs((E.toMinutes(r.pickupTime) ?? -999) - mins) <= 7,
              );
        const info = document.querySelector(".pager span");
        if (info)
          info.textContent = `Showing ${rides.length} of ${res.rides.length} rides`;
        if (!rides.length)
          emptyBox(
            box,
            '<b>No rides at this time</b><p class="muted">Try another departure time above.</p>',
          );
        else renderRides(box, rides, tpl);
      };
      const parseClock = (t) => {
        const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(t);
        return m
          ? ((+m[1] % 12) + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2]
          : null;
      };
      const active = chips?.querySelector(".chip.on");
      draw(active ? active.textContent : null);
      chips?.addEventListener("click", (e) => {
        const b = e.target.closest(".chip");
        if (b && !b.disabled) draw(b.textContent);
      });
    },

    async "live-trip"() {
      const id = qs.get("booking");
      if (!id) return;
      const b = await quiet(
        E.getBooking(id).then((d) => E.booking(E.unwrap(d))),
      );
      if (!b) return;
      const r = b.ride;
      set(document.querySelector(".eta h2"), `Heading to ${r.to || "—"}`);
      set(
        document.querySelector(".eta strong"),
        E.fmtTime(r.dropoffTime || r.pickupTime),
      );
      set(
        document.querySelector(".eta span"),
        `${r.durationMin ?? "—"} min, ${r.distanceKm ?? "—"} km`,
      );
      const stops = document.querySelectorAll(".steps .stp small");
      set(stops[0], r.pickupName || r.from);
      set(stops[2], r.to);
      set(document.querySelector(".db b"), r.driverName);
      set(
        document.querySelector(".plate"),
        [r.vehicleName, r.plate].filter(Boolean).join(" · "),
      );
      const help = document.querySelector(".acts .danger");
      if (help) help.href = `sos.html?booking=${encodeURIComponent(id)}`;
    },

    async "partial-match"() {
      let r = E.cachedRide(qs.get("ride"));
      if (!r) {
        try {
          const res = await loadMatches();
          r =
            res.rides.find((x) => x.id == qs.get("ride")) ||
            res.rides.find((x) => x.partial) ||
            res.rides[0];
        } catch (_) {
          /* leave placeholders */
        }
      }
      if (!r) return;
      const q = (s) => document.querySelector(s),
        qa = (s) => [...document.querySelectorAll(s)];
      set(q(".det .rd-av"), E.initials(r.driverName));
      set(q(".det .who b"), r.driverName);
      set(
        q(".det .who small"),
        `★ ${r.rating ?? "—"} (${r.trips ?? "—"} trips)`,
      );
      set(q(".det .rd-v b"), r.vehicleName || "—");
      set(
        q(".det .rd-v small"),
        [r.colour, r.seatsTotal ? r.seatsTotal + " seats" : null]
          .filter(Boolean)
          .join(" · ") || "—",
      );
      const k = qa(".det .k b");
      set(k[0], E.fmtTime(r.pickupTime));
      set(k[1], E.fmtTime(r.dropoffTime));
      set(k[2], `${r.seatsLeft ?? "—"} seats left`);
      set(k[3], E.naira(r.price));
      const tg = qa(".det .tags .tag")[1];
      if (tg) set(tg, E.dayLabel(r.days) || "—");
      const rr = qa(".rt-row");
      set(rr[0].querySelector("div"), ""); // rebuilt below
      const route = (el, label, txt, km) => {
        el.querySelector("div").innerHTML = `<b>${label}</b>${txt}`;
        el.querySelector(".km").lastChild.textContent = ` ${km ?? "—"} km`;
      };
      route(
        rr[0],
        "Driver’s route",
        `${r.driverRoute?.from || r.from || "—"} → ${r.driverRoute?.to || r.to || "—"}`,
        r.driverRoute?.distanceKm ?? r.distanceKm,
      );
      const sp = r.suggestedPickups || [];
      const cards = qa(".pk");
      sp.slice(0, 3).forEach((s, i) => {
        const b = cards[i];
        if (!b) return;
        set(b.querySelector("b"), E.str(s));
        set(
          b.querySelector("small"),
          `${s.distanceKm ?? "—"} km · ${s.walkMinutes ?? s.walkMin ?? "—"} min walk`,
        );
      });
      if (sp[0]) {
        const sg = q(".sugg");
        set(sg.querySelector("b").nextSibling, E.str(sp[0]));
        const sm = sg.querySelectorAll("small");
        set(sm[0], `${sp[0].distanceKm ?? "—"} km from your location`);
        set(sm[1], `≈ ${sp[0].walkMinutes ?? sp[0].walkMin ?? "—"} min walk`);
      }
      qa(".foot-actions a")[0].href =
        `driver-profile.html?ride=${encodeURIComponent(r.id)}`;
      qa(".foot-actions a")[1].href =
        `booking.html?ride=${encodeURIComponent(r.id)}`;
    },

    async "driver-profile"() {
      let r = E.cachedRide(qs.get("ride"));
      if (!r) {
        try {
          const res = await loadMatches();
          r = res.rides.find((x) => x.id == qs.get("ride")) || res.rides[0];
        } catch (_) {
          /* leave placeholders */
        }
      }
      if (!r) return;
      const q = (s) => document.querySelector(s);
      set(q(".hero .photo").firstChild, E.initials(r.driverName));
      set(q(".hero h1"), r.driverName);
      const hm = document.querySelectorAll(".hmeta > span");
      set(hm[0].lastChild, ` ${r.rating ?? "—"}`);
      set(hm[1], `${r.trips ?? "—"} trips`);
      set(hm[2], `${r.onTime ?? "—"}% on-time`);
      q(".hbadge").hidden = !r.verified;
      set(q(".hplate strong"), r.plate);
      set(
        q(".hplate span"),
        [r.colour, r.vehicleName].filter(Boolean).join(" "),
      );
      const st = document.querySelectorAll(".stat3 b");
      set(st[0], `${r.onTime ?? "—"}%`);
      set(st[1], `${r.cancelRate ?? "—"}%`);
      set(st[2], r.trips);
      const vg = document.querySelectorAll(".vgrid b");
      set(vg[0], r.year);
      set(vg[1], r.ac === null ? null : r.ac ? "Yes" : "No");
      set(vg[2], r.vehicleName);
      set(vg[3], r.colour);
      set(vg[4], r.seatsTotal);
      if (Array.isArray(r.reviews) && r.reviews.length) {
        q(".rev").innerHTML = r.reviews
          .slice(0, 5)
          .map(
            (v) =>
              `<div><b>${E.str(E.pick(v, ["name", "author", "passenger"])) || "Commuter"}${v.trips ? ", " + v.trips + " trips" : ""}</b><small>${v.comment || v.text || ""}</small></div>`,
          )
          .join("");
      }
      set(q(".req .pr strong"), E.naira(r.price));
      set(q(".req .pill"), `${r.seatsLeft ?? "—"} Seat left`);
      const pt = document.querySelectorAll(".pts b"),
        ps = document.querySelectorAll(".pts small");
      set(pt[0], r.pickupName || r.from);
      set(ps[0], `Pickup ${E.fmtTime(r.pickupTime)}`);
      set(pt[1], r.to);
      set(ps[1], `Arrive about ${E.fmtTime(r.dropoffTime)}`);
      q(".req .btn").href = `booking.html?ride=${encodeURIComponent(r.id)}`;
      set(
        q(".req p"),
        `You will see live details once ${(r.driverName || "the driver").split(" ")[0]} accepts.`,
      );
    },

    async booking() {
      const show = (id) =>
        document
          .querySelectorAll(".state")
          .forEach((el) => el.classList.toggle("hidden", el.id !== id));
      const stage = (id, i) => {
        show(id);
        document
          .querySelectorAll(".booking-progress span")
          .forEach((s, n) => s.classList.toggle("done", n <= i));
        document.body.classList.toggle("is-reserved", id === "reserved-state");
      };
      const note = (m) => {
        const el = $("toast");
        el.textContent = m;
        el.classList.add("show");
        clearTimeout(el.t);
        el.t = setTimeout(() => el.classList.remove("show"), 4200);
      };
      let current = null,
        timer = null,
        bookingId = qs.get("booking") || sessionStorage.getItem("eco_booking");
      const summary = (r) => {
        const dd = document.querySelectorAll(".ride-summary dl dd");
        set(dd[0], r.from);
        set(dd[1], r.to);
        set(document.querySelector(".driver-avatar"), E.initials(r.driverName));
        set(document.querySelector(".driver-card strong span"), r.driverName);
        set(
          document.querySelector(".driver-card small"),
          [r.colour, r.vehicleName, r.plate].filter(Boolean).join(" · "),
        );
        const rows = document.querySelectorAll(".summary-row b");
        set(rows[0], E.naira(r.price));
        set(
          rows[1],
          `${r.seatsLeft ?? "—"}${r.seatsTotal ? " of " + r.seatsTotal : ""}`,
        );
        set($("seat-price"), E.naira(r.price));
        set($("fee"), r.serviceFee != null ? E.naira(r.serviceFee) : "—");
        set(
          $("total"),
          E.naira((+r.price || 0) + (+r.serviceFee || 0) || null),
        );
        const left = +r.seatsLeft;
        if (!isNaN(left))
          [...document.querySelectorAll(".seat:not(.wheel)")].forEach(
            (s, i, all) => {
              if (i < all.length - left) {
                s.classList.remove("open", "yours");
                s.classList.add("taken");
                s.disabled = true;
                s.querySelector("small").textContent = "Taken";
              }
            },
          );
      };
      const apply = (b) => {
        current = b;
        bookingId = b.id;
        sessionStorage.setItem("eco_booking", b.id);
        summary(b.ride);
        set($("requested-seat"), b.seat);
        if (E.is.paid(b)) {
          stage("reserved-state", 2);
          const dd = document.querySelectorAll(".reserved-card dd");
          set(dd[0], b.reference || b.id);
          set(dd[1], E.naira(b.total));
          set(dd[2], b.method || "—");
          set(
            document.querySelector(".reserved-banner small"),
            `Seat ${b.seat ?? "—"} · ${E.fmtDate(b.ride.date)} · ${E.fmtTime(b.ride.pickupTime)} · Confirmed by ${(b.ride.driverName || "driver").split(" ")[0]}`,
          );
          set(document.querySelector(".seats-now b"), `Seat ${b.seat ?? "—"}`);
          stop();
        } else if (E.is.accepted(b.status)) {
          stage("confirmed-state", 2);
          stop();
          set(
            document.querySelector("#confirmed-state .notice span"),
            `${b.ride.from || "—"} → ${b.ride.to || "—"} · ${E.fmtDate(b.ride.date)} ${E.fmtTime(b.ride.pickupTime)}`,
          );
        } else if (E.is.declined(b.status)) {
          stop();
          note("The driver could not take your request. Choose another ride.");
          setTimeout(() => go("available-rides.html"), 1800);
        } else if (E.is.cancelled(b.status)) {
          stop();
          stage("choose-state", 0);
        } else stage("request-state", 1);
      };
      const stop = () => {
        clearInterval(timer);
        timer = null;
      };
      const poll = () => {
        stop();
        timer = setInterval(async () => {
          try {
            apply(E.booking(E.unwrap(await E.getBooking(bookingId))));
          } catch (_) {
            /* try again next tick */
          }
        }, 6000);
      };

      $("request-seat").onclick = () => {
        const seat = document
          .querySelector(".seat.yours")
          ?.textContent.match(/Seat (\d)/)?.[1];
        const ride = E.cachedRide(qs.get("ride"));
        if (!seat) return;
        if (!ride) return note("Choose a ride first from the available rides.");
        sessionStorage.setItem("eco_selected_ride", ride.id);
        sessionStorage.setItem("eco_selected_seat", seat);
        location.href = `seat-request.html?ride=${encodeURIComponent(ride.id)}&seat=${encodeURIComponent(seat)}`;
      };
      $("cancel-request").onclick = () =>
        busy($("cancel-request"), async () => {
          try {
            await E.cancelBooking(bookingId);
            stop();
            stage("choose-state", 0);
            note("Request cancelled.");
          } catch (e) {
            note(e.message);
          }
        });
      $("pay-now").onclick = () => {
        location.href = `checkout.html?booking=${encodeURIComponent(bookingId)}`;
      };
      $("cancel-reserved").onclick = () =>
        busy($("cancel-reserved"), async () => {
          try {
            await E.cancelBooking(bookingId);
            if (current && E.is.paid(current))
              await E.refundBooking(bookingId).catch(() => null);
            note("Booking cancelled.");
            setTimeout(() => go("passenger-dashboard.html"), 1200);
          } catch (e) {
            note(e.message);
          }
        });
      $("change-booking").onclick = () => go("available-rides.html");
      const cancelB = $("cancel-booking");
      if (cancelB) cancelB.onclick = () => go("available-rides.html");

      if (qs.get("state")) return; // design preview, handled by booking.js
      if (bookingId && qs.get("booking")) {
        try {
          apply(E.booking(E.unwrap(await E.getBooking(bookingId))));
          if (!E.is.paid(current) && E.is.pending(current.status)) poll();
        } catch (e) {
          note(e.message);
        }
        return;
      }
      const ride = E.cachedRide(qs.get("ride"));
      if (ride) summary(ride);
      else note("Choose a ride first from the available rides.");
    },

    async checkout() {
      const q = (s) => document.querySelector(s),
        qa = (s) => [...document.querySelectorAll(s)];
      const bookingId =
        qs.get("booking") || sessionStorage.getItem("eco_booking");
      const notify = (m) => {
        const el = $("toast");
        el.textContent = m;
        el.classList.add("show");
        clearTimeout(el.t);
        el.t = setTimeout(() => el.classList.remove("show"), 4200);
      };
      const steps = qa(".checkout-progress span");
      const showState = (id, done, active) => {
        qa(".checkout-state").forEach((el) =>
          el.classList.toggle("hidden", el.id !== id),
        );
        steps.forEach((s, i) => {
          s.classList.toggle("done", i < done);
          s.classList.toggle("active", i === active);
          s.querySelector("i").textContent = i < done ? "✓" : i + 1;
        });
        window.scrollTo({ top: 0 });
      };
      let b = null;
      const fillFare = (root) => {
        const fees = root.querySelectorAll(".fee-lines b"),
          line = root.querySelector(".fare-line strong"),
          total = root.querySelector(".total-box strong");
        const sum =
          (+b.fare || 0) +
          (+b.serviceFee || 0) +
          (+b.platformFee || 0) +
          (+b.bookingFee || 0);
        if (line) line.textContent = E.naira(b.fare ?? b.ride.price);
        [b.serviceFee, b.platformFee, b.bookingFee].forEach((v, i) => {
          if (fees[i]) fees[i].textContent = E.naira(v);
        });
        if (total) total.textContent = E.naira(b.total ?? (sum || null));
      };
      if (bookingId && !qs.get("state")) {
        try {
          b = E.booking(E.unwrap(await E.getBooking(bookingId)));
          const loc = qa(".location small");
          set(loc[0], b.ride.pickupName || b.ride.from);
          set(loc[1], b.ride.to);
          set(
            q(".vehicle small"),
            [b.ride.colour, b.ride.vehicleName].filter(Boolean).join(" ") ||
              "—",
          );
          set(
            q(".date"),
            `▣　 ${E.fmtDate(b.ride.date)} · ${E.fmtTime(b.ride.pickupTime)}`,
          );
          qa(".checkout-state").forEach(fillFare);
          const pay = $("payment-form").querySelector("button[type=submit]");
          if (pay && (b.total ?? b.fare) != null)
            pay.textContent = `Pay ${E.naira(b.total ?? b.fare)}`;
        } catch (e) {
          notify(e.message);
        }
      }
      // pay: the backend returns a Paystack link; card details are entered on Paystack, never here
      $("payment-form").onsubmit = (ev) => {
        ev.preventDefault();
        if (!bookingId)
          return notify("Open checkout from a confirmed booking.");
        const method =
          q("input[name=method]:checked")?.value === "bank"
            ? "bank_transfer"
            : "card";
        busy(
          $("payment-form").querySelector("button[type=submit]"),
          async () => {
            try {
              const r = E.unwrap(await E.initPayment({ bookingId, method }));
              const url = E.pick(r, [
                "authorization_url",
                "authorizationUrl",
                "authorizationURL",
                "paymentUrl",
                "url",
              ]);
              if (!url)
                throw new Error("The server did not return a payment link.");
              sessionStorage.setItem("eco_pay_method", method);
              location.href = url;
            } catch (e) {
              notify(e.message);
              showState("failed-state", 1, 1);
            }
          },
        );
      };
      // coming back from Paystack: confirm the payment before showing a receipt
      const ref = qs.get("reference") || qs.get("trxref");
      if (ref) {
        showState("fare-state", 0, 0);
        notify("Confirming your payment…");
        try {
          const r = E.unwrap(await E.verifyPayment(ref));
          const ok = /success|paid|complete/i.test(
            String(E.pick(r, ["status", "paymentStatus"], "")),
          );
          if (!ok) return showState("failed-state", 1, 1);
          const channel = String(
            E.pick(
              r,
              ["channel", "method", "paymentMethod"],
              sessionStorage.getItem("eco_pay_method") || "",
            ),
          );
          const bank = /bank|transfer|ussd/i.test(channel),
            root = $(bank ? "receipt-state" : "success-state");
          const dd = root.querySelectorAll(".receipt dd");
          set(
            dd[0],
            E.fmtDateTime(
              E.pick(r, ["paidAt", "paid_at", "transactionDate"], new Date()),
            ),
          );
          if (!bank)
            set(
              dd[1],
              /card/i.test(channel)
                ? "Card payment"
                : channel || "Card payment",
            );
          set(dd[2], ref);
          set(root.querySelector(".receipt-head span"), "#" + ref);
          if (b) fillFare(root);
          const paidTotal = E.pick(r, ["amount", "total"]);
          if (
            paidTotal != null &&
            root.querySelector(".total-box strong").textContent.includes("—")
          )
            root.querySelector(".total-box strong").textContent = E.naira(
              +paidTotal > 100000 ? paidTotal / 100 : paidTotal,
            );
          showState(bank ? "receipt-state" : "success-state", 3, bank ? 3 : -1);
          const vt = root.querySelector(".preview-actions .outline");
          if (vt && bookingId)
            vt.onclick = () => {
              location.href = `live-trip.html?booking=${encodeURIComponent(bookingId)}`;
            };
        } catch (e) {
          notify(e.message);
          showState("failed-state", 1, 1);
        }
      }
    },
    async "booking-request"() {
      const id = qs.get("booking");
      const longDate = (v) => {
        const d = new Date(v);
        return !v || isNaN(d)
          ? null
          : d.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            });
      };
      const field = (el, v) => {
        if (el && v !== null && v !== undefined && v !== "") el.value = v;
      };
      if (id) {
        const b = await quiet(
          E.getBooking(id).then((d) => E.booking(E.unwrap(d))),
        );
        if (b) {
          const r = b.ride;
          field($("br-from"), r.from);
          field($("br-to"), r.to);
          field($("br-date"), longDate(r.date || b.createdAt));
          field($("br-time"), r.pickupTime ? E.fmtTime(r.pickupTime) : null);
          field($("br-seats"), r.seatsLeft ?? b.seat);
          field(
            $("br-fare"),
            r.price != null
              ? Number(r.price).toLocaleString("en-NG")
              : b.fare != null
                ? Number(b.fare).toLocaleString("en-NG")
                : null,
          );
        }
      }
      const need = () => {
        if (!id) {
          toast("Open a booking request from your notifications first.");
          return false;
        }
        return true;
      };
      $("br-accept").onclick = () => {
        if (need())
          busy($("br-accept"), async () => {
            try {
              await E.acceptBooking(id);
              go("passenger-accepted.html?booking=" + encodeURIComponent(id));
            } catch (e) {
              toast(e.message);
            }
          });
      };
      $("br-decline").onclick = () => {
        if (need())
          busy($("br-decline"), async () => {
            try {
              await E.rejectBooking(id);
              toast("Booking declined.");
              setTimeout(() => go("driver-dashboard.html"), 1200);
            } catch (e) {
              toast(e.message);
            }
          });
      };
    },

    async "passenger-accepted"() {
      const id = qs.get("booking");
      $("ac-done").onclick = () => go("driver-dashboard.html");
      $("ac-trip").onclick = () =>
        go(
          "trip-start.html" + (id ? "?booking=" + encodeURIComponent(id) : ""),
        );
      $("ac-copy").onclick = async () => {
        const t = $("ac-id").textContent;
        try {
          await navigator.clipboard.writeText(t.replace(/^#/, ""));
          toast("Booking ID copied.");
        } catch (_) {
          toast(t);
        }
      };
      if (!id) return;
      const b = await quiet(
        E.getBooking(id).then((d) => E.booking(E.unwrap(d))),
      );
      if (!b) return;
      const r = b.ride,
        d = new Date(r.date || b.createdAt);
      set($("ac-from"), r.from);
      set($("ac-to"), r.to);
      const day = isNaN(d)
        ? null
        : d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          });
      set(
        $("ac-when"),
        [day, r.pickupTime ? E.fmtTime(r.pickupTime) : null]
          .filter(Boolean)
          .join("  •  "),
      );
      set($("ac-seat"), b.seat);
      set($("ac-seat-n"), b.seat);
      if (String(b.seat) === "1") $("ac-seat-note").hidden = false;
      set($("ac-pax"), b.passengerName);
      set($("ac-id"), "#" + (b.reference || b.id));
    },
    async "trusted-commute"() {
      const cards = $("tc-cards"),
        tpl = $("tc-card"),
        poolBox = $("tc-pools"),
        poolState = $("tc-pool-state"),
        f = { from: $("tc-from"), to: $("tc-to"), date: $("tc-date"), time: $("tc-time"), pax: $("tc-pax") },
        state = (html) => (cards.innerHTML = `<p class="state">${html}</p>`);
      let commute = null,
        rides = [];
      f.date.value = new Date().toISOString().slice(0, 10);

      const draw = () => {
        const pax = +f.pax.value || 1,
          want = (k) => f[k].value.trim().toLowerCase(),
          changed = (k) => want(k) && want(k) !== String(E.str(commute?.[k]) || "").toLowerCase(),
          list = rides.filter(
            (r) =>
              (r.seatsLeft == null || isNaN(+r.seatsLeft) || +r.seatsLeft >= pax) &&
              (!changed("from") || `${r.from || ""} ${r.pickupName || ""}`.toLowerCase().includes(want("from"))) &&
              (!changed("to") || String(r.to || "").toLowerCase().includes(want("to"))),
          );
        cards.innerHTML = "";
        if (!list.length)
          return state("<b>No groups found</b>Try a different route, time or number of passengers.");
        list.forEach((r) => {
          const c = tpl.content.firstElementChild.cloneNode(true),
            q = (s) => c.querySelector(s),
            car = [r.vehicleName, r.colour].filter(Boolean).join(" · ");
          set(q(".av"), E.initials(r.driverName));
          set(q(".nm"), r.driverName || "Verified driver");
          set(q(".rv"), `${r.rating ?? "—"} (${r.trips ?? "—"} trips)`);
          set(q(".car"), [car, r.seatsTotal ? r.seatsTotal + " seats" : null].filter(Boolean).join(" · ") || "—");
          set(q(".pr"), E.naira(r.price));
          set(q(".seats"), r.seatsLeft != null ? `${r.seatsLeft} seat${+r.seatsLeft === 1 ? "" : "s"} left` : "");
          if (r.seatsLeft == null) q(".seats").hidden = true;
          set(q(".pk"), r.pickupName || r.from || "—");
          set(q(".pt"), E.fmtTime(r.pickupTime));
          set(q(".dk"), r.to || "—");
          set(q(".dt"), E.fmtTime(r.dropoffTime));
          set(q(".cn"), r.vehicleName || "Vehicle");
          set(q(".rd"), r.days?.length ? "Recurring (" + E.dayLabel(r.days).replace(/ /g, "") + ")" : "Recurring");
          const btn = q(".join");
          btn.addEventListener("click", async () => {
            const id = r.poolId || r.id;
            if (!id) return toast("This group can't be joined right now.");
            btn.disabled = true;
            try {
              await E.joinPool(id);
              toast("You've joined the group.");
              btn.firstChild.textContent = "Joined";
              loadPools();
            } catch (e) {
              toast(e.message);
              btn.disabled = false;
            }
          });
          cards.append(c);
        });
      };

      const loadPools = async () => {
        const pools = await quiet(E.getPools());
        poolBox.querySelectorAll(".pool-row").forEach((n) => n.remove());
        if (!pools) return set(poolState, "Could not load your pools.");
        poolState.hidden = !!pools.length;
        if (!pools.length) return set(poolState, "You haven't joined a commute group yet.");
        pools.slice(0, 3).forEach((p) => {
          const row = document.createElement("div");
          row.className = "pool-row";
          row.innerHTML =
            '<div class="pr-route"><svg><use href="#i-pin"/></svg><span><b class="a"></b><br><span class="status"></span></span></div>' +
            '<div class="pr-days"><svg><use href="#i-cal"/></svg><span class="d"></span></div>' +
            '<div class="pr-time"><svg><use href="#i-clock"/></svg><span><b class="t"></b><small>Departure time</small></span></div>' +
            '<a class="outline" href="recurring.html">View Details<svg><use href="#i-arrow"/></svg></a>';
          const q = (s) => row.querySelector(s);
          q(".a").textContent = `${p.from || "—"} → ${p.to || "—"}`;
          q(".status").textContent = p.status.charAt(0).toUpperCase() + p.status.slice(1);
          q(".d").textContent = E.dayLabel(p.days) || "—";
          q(".t").textContent = E.fmtTime(p.departureTime);
          poolBox.append(row);
        });
      };
      loadPools();

      $("tc-swap").addEventListener("click", () => {
        [f.from.value, f.to.value] = [f.to.value, f.from.value];
      });
      $("tc-search").addEventListener("submit", (e) => {
        e.preventDefault();
        draw();
      });

      let list;
      try {
        list = E.asList(await E.getCommutes());
      } catch (e) {
        return state(`<b>Could not load groups</b>${e.message}`);
      }
      commute = list.find((x) => String(E.pick(x, ["id", "_id"])) === qs.get("commute")) || list[0];
      if (!commute)
        return state(
          '<b>Save your commute to see matching groups</b>We match you with verified commuters on your route and schedule.<br><a class="btn" href="recurring.html">Set up recurring commute</a>',
        );
      f.from.value = E.str(commute.from) || "";
      f.to.value = E.str(commute.to) || "";
      const t = String(commute.departureTime || "");
      if (/^\d{2}:\d{2}/.test(t)) f.time.value = t.slice(0, 5);
      try {
        rides = E.asList(await E.getMatches(E.pick(commute, ["id", "_id"]))).map(E.ride);
      } catch (e) {
        return state(`<b>Could not load groups</b>${e.message}`);
      }
      E.cacheRides(rides);
      draw();
    },

  };

  const fn = pages[page];
  if (fn)
    Promise.resolve(fn()).catch((e) =>
      console.error("[EcoRide connect]", page, e),
    );
})();
