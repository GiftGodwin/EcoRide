(() => {
  const page = location.pathname.split("/").pop().replace(".html", "");
  const q = new URLSearchParams(location.search);
  const id = q.get("booking");
  const $ = (s) => document.querySelector(s);
  const set = (s, v) => {
    const e = $(s);
    if (e && v !== undefined && v !== null && v !== "") e.textContent = v;
  };
  const money = (v) =>
    v == null || isNaN(+v) ? "₦ —" : "₦ " + Number(v).toLocaleString("en-NG");
  const data = async (path, opts = {}) => api(path, opts);
  const booking = async () =>
    id
      ? EcoAPI.booking(
          EcoAPI.unwrap(await data("/api/bookings/" + encodeURIComponent(id))),
        )
      : null;
  const profile = async () => EcoAPI.unwrap(await data("/api/driver-profile"));
  const fillRide = (b) => {
    const r = b?.ride || {};
    set("[data-from]", r.from || "—");
    set("[data-to]", r.to || "—");
    set("[data-pickup]", r.pickupName || r.from || "—");
    set("[data-driver]", r.driverName || b?.passengerName || "—");
    set("[data-plate]", r.plate || "—");
    set("[data-vehicle]", r.vehicleName || "—");
    set("[data-price]", money(b?.total ?? b?.fare ?? r.price));
    set(
      "[data-when]",
      [
        r.date ? EcoAPI.fmtDate(r.date) : null,
        r.pickupTime ? EcoAPI.fmtTime(r.pickupTime) : null,
      ]
        .filter(Boolean)
        .join(" · "),
    );
  };
  const auth = [
    "trip-start",
    "trip-complete",
    "earnings",
    "sos",
    "sos-options",
    "safety-feedback",
  ].includes(page);
  if (auth && !EcoAPI.requireAuth()) return;
  const run = async () => {
    if (page === "trip-start") {
      const b = await booking();
      fillRide(b);
      const start = $("#start-trip");
      start?.addEventListener("click", () =>
        busy(start, async () => {
          if (!id) return toast("Open this page from an accepted booking.");
          try {
            const session = EcoAPI.unwrap(
              await data("/api/trip-sessions", {
                method: "POST",
                body: { bookingId: id },
              }),
            );
            const tid = EcoAPI.pick(session, [
              "id",
              "_id",
              "tripId",
              "trip.id",
              "tripSession.id",
            ]);
            if (tid) {
              sessionStorage.setItem("eco_trip_id", tid);
              await data(
                "/api/trip-sessions/" + encodeURIComponent(tid) + "/start",
                { method: "PATCH" },
              );
            }
            toast("Trip started.");
            setTimeout(
              () =>
                (location.href =
                  "trip-complete.html?booking=" +
                  encodeURIComponent(id) +
                  (tid ? "&trip=" + encodeURIComponent(tid) : "")),
              500,
            );
          } catch (e) {
            toast(e.message);
          }
        }),
      );
      return;
    }
    if (page === "trip-complete") {
      const b = await booking();
      fillRide(b);
      const complete = $("#complete-trip");
      complete?.addEventListener("click", () =>
        busy(complete, async () => {
          try {
            const tid = q.get("trip") || sessionStorage.getItem("eco_trip_id");
            if (tid)
              await data(
                "/api/trip-sessions/" + encodeURIComponent(tid) + "/complete",
                { method: "PATCH" },
              );
            if (id)
              await data(
                "/api/bookings/" + encodeURIComponent(id) + "/complete",
                { method: "PATCH" },
              );
            toast("Trip completed.");
            setTimeout(
              () =>
                (location.href =
                  "earnings.html" +
                  (id ? "?booking=" + encodeURIComponent(id) : "")),
              500,
            );
          } catch (e) {
            toast(e.message);
          }
        }),
      );
      return;
    }
    if (page === "earnings") {
      const [p, bk, w] = await Promise.all([
        profile().catch(() => null),
        data("/api/bookings").catch(() => null),
        data("/api/wallet").catch(() => null),
      ]);
      const bs = EcoAPI.asList(bk).map(EcoAPI.booking);
      const completed = bs.filter(
        (b) => EcoAPI.is.paid(b) || /complete/i.test(b.status),
      );
      const total = completed.reduce(
        (sum, b) => sum + (+b.fare || +b.total || 0),
        0,
      );
      set("[data-earnings]", money(total));
      set(
        "[data-rating]",
        EcoAPI.pick(p || {}, ["rating", "averageRating"]) ?? "—",
      );
      set(
        "[data-trips]",
        EcoAPI.pick(p || {}, ["tripsCount", "totalTrips"]) ?? completed.length,
      );
      set(
        "[data-wallet]",
        money(EcoAPI.pick(w || {}, ["balance", "amount", "wallet.balance"])),
      );
      $("#wallet-link")?.addEventListener(
        "click",
        () => (location.href = "dashboard.html"),
      );
      return;
    }
    if (page === "sos") {
      const b = await booking().catch(() => null);
      fillRide(b);
      $("#sos-submit")?.addEventListener("click", () =>
        busy($("#sos-submit"), async () => {
          try {
            const tid = q.get("trip") || sessionStorage.getItem("eco_trip_id");
            if (!tid) throw new Error("No active trip was found.");
            await data("/api/incidents/trip/" + encodeURIComponent(tid), {
              method: "POST",
              body: {
                type: "emergency",
                severity: "critical",
                description: "Emergency help requested from the EcoRide trip.",
              },
            });
            toast("Emergency alert sent.");
            $("#sos-submit").textContent = "Alert sent";
            $("#sos-submit").disabled = true;
          } catch (e) {
            toast(e.message);
          }
        }),
      );
      return;
    }
    if (page === "safety-feedback") {
      const b = await booking().catch(() => null);
      fillRide(b);
      let score = 0;
      document.querySelectorAll(".stars button").forEach(
        (btn, i) =>
          (btn.onclick = () => {
            score = i + 1;
            document
              .querySelectorAll(".stars button")
              .forEach((x, j) => x.classList.toggle("on", j <= i));
          }),
      );
      document.querySelectorAll(".incident-grid button").forEach(
        (btn) =>
          (btn.onclick = () => {
            document
              .querySelectorAll(".incident-grid button")
              .forEach((x) => x.classList.remove("on"));
            btn.classList.add("on");
          }),
      );
      $("#rating-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        busy($("#rating-submit"), async () => {
          try {
            if (!id || !b)
              throw new Error("Open feedback from a completed booking.");
            const ratee =
              b.ride?.driverId || b.ride?.driver?.id || q.get("ratee");
            if (!ratee)
              throw new Error(
                "The driver identity is missing from this booking.",
              );
            await data("/api/ratings", {
              method: "POST",
              body: {
                booking: id,
                ratee,
                score: score || 5,
                review: $("#review").value.trim(),
              },
            });
            toast("Thanks for your feedback.");
            $("#rating-submit").disabled = true;
          } catch (e) {
            toast(e.message);
          }
        });
      });
      $("#incident-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        busy($("#incident-submit"), async () => {
          try {
            const tid = q.get("trip") || sessionStorage.getItem("eco_trip_id");
            const type = $(".incident-grid button.on")?.dataset.type || "other";
            const description = $("#incident-description").value.trim();
            if (tid)
              await data("/api/incidents/trip/" + encodeURIComponent(tid), {
                method: "POST",
                body: {
                  type,
                  description: description || "Incident reported after trip.",
                  severity: "medium",
                },
              });
            else
              throw new Error("Open incident reporting from an active trip.");
            toast("Your report has been submitted.");
            $("#incident-submit").disabled = true;
          } catch (e) {
            toast(e.message);
          }
        });
      });
    }
  };
  run().catch((e) => console.error("[EcoRide flow]", e));
})();
