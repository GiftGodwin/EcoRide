(() => {
  const $ = (id) => document.getElementById(id);
  const show = (id) =>
    document
      .querySelectorAll(".state")
      .forEach((el) => el.classList.toggle("hidden", el.id !== id));
  const notify = (message) => {
    const el = $("toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(el.timer);
    el.timer = setTimeout(() => el.classList.remove("show"), 3600);
  };
  let selectedSeat = null;
  document.querySelectorAll(".seat.open,.seat.yours").forEach((button) =>
    button.addEventListener("click", () => {
      if (
        button.classList.contains("taken") ||
        button.classList.contains("wheel")
      )
        return;
      document
        .querySelectorAll(".seat")
        .forEach((s) => s.classList.remove("yours"));
      button.classList.add("yours");
      selectedSeat = button.textContent.match(/Seat (\d)/)?.[1] || null;
      $("request-seat").disabled = !selectedSeat;
    }),
  );
  $("request-seat").onclick = () => {
    if (!selectedSeat) return;
    notify(
      "Booking cannot be submitted yet because the live backend has not published a booking endpoint.",
    );
  };
  $("cancel-request").onclick = () => {
    show("choose-state");
    notify("Request cancelled.");
  };
  $("pay-now").onclick = () => (location.href = "checkout.html");
  $("change-booking").onclick = () => {
    location.href = "booking.html";
  };
  $("cancel-reserved").onclick = () => {
    location.href = "index.html";
  };
  // ?state=request | confirmed | reserved opens that screen directly (design preview)
  const target = {
    request: ["request-state", 1],
    confirmed: ["confirmed-state", 2],
    reserved: ["reserved-state", 2],
  }[new URLSearchParams(location.search).get("state")];
  if (target) {
    show(target[0]);
    document
      .querySelectorAll(".booking-progress span")
      .forEach((s, i) => s.classList.toggle("done", i <= target[1]));
    document.body.classList.toggle("is-reserved", target[0] === "reserved");
  }
})();

// Expandable live route map for the booking page.
(() => {
  const overlay = document.getElementById("map-overlay");
  const open = document.getElementById("expand-map");
  const close = document.getElementById("close-map");
  const cancelMap = document.getElementById("cancel-map");
  const cancelBooking = document.getElementById("cancel-booking");
  let map;
  const points = [];
  const hide = () => {
    overlay.classList.add("hidden");
    document.body.classList.remove("map-open");
    open?.focus();
  };
  const showMap = () => {
    overlay.classList.remove("hidden");
    document.body.classList.add("map-open");
    if (!map && window.L) {
      map = L.map("booking-map", { scrollWheelZoom: true }).setView([20, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      }).addTo(map);
      if (points.length > 1)
        L.polyline(points, { color: "#117f76", weight: 5, opacity: 0.9 }).addTo(
          map,
        );
      points.forEach((point, index) =>
        L.circleMarker(point, {
          radius: 8,
          color: "#fff",
          weight: 3,
          fillColor: index ? "#f39a22" : "#117f76",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip(index ? "Destination" : "Pickup location")
          .openTooltip(),
      );
    }
    setTimeout(() => map?.invalidateSize(), 80);
  };
  open?.addEventListener("click", showMap);
  close?.addEventListener("click", hide);
  cancelMap?.addEventListener("click", hide);
  overlay?.addEventListener("click", (e) => {
    if (e.target === overlay) hide();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay?.classList.contains("hidden")) hide();
  });
  cancelBooking?.addEventListener("click", () => {
    location.href = "index.html";
  });
})();
