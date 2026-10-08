(() => {
  const $ = (id) => document.getElementById(id);
  const EMPTY = { from: null, pickup: null, to: null };
  const days = () =>
    [...document.querySelectorAll(".day.selected")].map(
      (button) => button.dataset.day,
    );
  const daysLabel = (selected) =>
    selected.length
      ? selected.join(",") === "Mon,Tue,Wed,Thu,Fri"
        ? "Mon–Fri"
        : selected.join("–")
      : "—";
  const timeLabel = (value) => {
    if (!value) return "—";
    const [h, m] = value.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")}${suffix}`;
  };
  const refresh = () => {
    const from = $("from").value.trim() || "—",
      to = $("to").value.trim() || "—",
      pickup = $("pickup").value.trim() || "—";
    $("summary-route").textContent =
      `${from.split(",")[0]} → ${to.split(",")[0]}`;
    $("summary-pickup").textContent = `Pickup: ${pickup}`;
    $("summary-days").textContent = daysLabel(days());
    $("summary-time").textContent = timeLabel($("departure-time").value);
    $("preview-from").textContent = from;
    $("preview-to").textContent = to;
    $("preview-pickup").textContent = pickup;
  };
  const toastMessage = (message) => {
    const t = $("toast");
    t.textContent = message;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 3800);
  };

  let routeMap,
    previewMap,
    routeLine,
    previewLine,
    points = { ...EMPTY };
  const drawMaps = () => {
    if (!window.L) return;
    const bounds = Object.values(points).filter(Boolean);
    [routeMap, previewMap].forEach((map) => {
      if (map) {
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [18, 18] });
        map.invalidateSize();
      }
    });
    if (bounds.length > 1 && !routeLine) {
      routeLine = L.polyline(bounds, {
        color: "#117f76",
        weight: 4,
        opacity: 0.9,
      }).addTo(routeMap);
      previewLine = L.polyline(bounds, {
        color: "#117f76",
        weight: 3,
        opacity: 0.9,
      }).addTo(previewMap);
    } else if (routeLine && bounds.length > 1) {
      routeLine.setLatLngs(bounds);
      previewLine.setLatLngs(bounds);
    } else if (routeLine && bounds.length < 2) {
      routeMap.removeLayer(routeLine);
      previewMap.removeLayer(previewLine);
      routeLine = null;
      previewLine = null;
    }
  };
  const setupMaps = () => {
    if (!window.L) return;
    routeMap = L.map("route-map", {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView([20, 0], 2);
    previewMap = L.map("preview-map", {
      scrollWheelZoom: true,
      zoomControl: false,
    }).setView([20, 0], 2);
    const tile = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
    L.tileLayer(tile, { maxZoom: 19, attribution }).addTo(routeMap);
    L.tileLayer(tile, { maxZoom: 19, attribution }).addTo(previewMap);
    drawMaps();
  };
  const geocode = async (field, key) => {
    const query = $(field).value.trim();
    if (!query) {
      points[key] = null;
      drawMaps();
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: "application/json" } },
      );
      const result = await response.json();
      if (result[0]) {
        points[key] = [+result[0].lat, +result[0].lon];
        drawMaps();
      }
    } catch (_) {
      /* Keep the form usable if geocoding is unavailable. */
    }
  };

  // Full-screen route picker. Map clicks become the selected field's location.
  let pickerMap,
    pickerMode = "from",
    pickerMarkers = [],
    pickerLine;
  const pickerOverlay = $("route-map-overlay");
  const pickerHelp = $("route-map-help");
  const pickerClear = () => {
    pickerMarkers.forEach((marker) => pickerMap?.removeLayer(marker));
    pickerMarkers = [];
    if (pickerLine) {
      pickerMap.removeLayer(pickerLine);
      pickerLine = null;
    }
  };
  const pickerDraw = () => {
    if (!pickerMap) return;
    pickerClear();
    const entries = [
      ["from", "Pickup location", "#117f76"],
      ["pickup", "Pickup point", "#f39a22"],
      ["to", "Destination", "#117f76"],
    ];
    const selected = entries
      .map(([key, label, color]) => ({ key, label, color, point: points[key] }))
      .filter((item) => item.point);
    selected.forEach((item) =>
      pickerMarkers.push(
        L.circleMarker(item.point, {
          radius: 9,
          color: "#fff",
          weight: 3,
          fillColor: item.color,
          fillOpacity: 1,
        })
          .addTo(pickerMap)
          .bindTooltip(item.label)
          .openTooltip(),
      ),
    );
    if (selected.length > 1)
      pickerLine = L.polyline(
        selected.map((item) => item.point),
        { color: "#117f76", weight: 4, opacity: 0.9 },
      ).addTo(pickerMap);
    if (selected.length > 1)
      pickerMap.fitBounds(
        selected.map((item) => item.point),
        { padding: [30, 30] },
      );
  };
  const setPickerMode = (mode) => {
    pickerMode = mode;
    document
      .querySelectorAll("[data-map-mode]")
      .forEach((button) =>
        button.classList.toggle("active", button.dataset.mapMode === mode),
      );
    pickerHelp.textContent = `Click the map to set the ${mode === "from" ? "pickup location" : mode === "pickup" ? "pickup point" : "destination"}.`;
  };
  const reverseGeocode = async (latlng, key) => {
    const fallback = `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`,
        { headers: { Accept: "application/json" } },
      );
      const result = await response.json();
      $(key).value = result.display_name || fallback;
    } catch (_) {
      $(key).value = fallback;
    }
    refresh();
  };
  const openPicker = () => {
    pickerOverlay.classList.remove("hidden");
    document.body.classList.add("map-open");
    if (!pickerMap && window.L) {
      pickerMap = L.map("route-map-overlay-canvas", {
        scrollWheelZoom: true,
        zoomControl: true,
      }).setView([20, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      }).addTo(pickerMap);
      pickerMap.on("click", (event) => {
        points[pickerMode] = [event.latlng.lat, event.latlng.lng];
        $(pickerMode).value = "";
        pickerDraw();
        drawMaps();
        reverseGeocode(event.latlng, pickerMode);
      });
    }
    pickerDraw();
    setTimeout(() => pickerMap?.invalidateSize(), 80);
  };
  const closePicker = () => {
    pickerOverlay.classList.add("hidden");
    document.body.classList.remove("map-open");
    $("open-route-map")?.focus();
  };
  $("open-route-map")?.addEventListener("click", openPicker);
  $("close-route-map")?.addEventListener("click", closePicker);
  $("done-route-map")?.addEventListener("click", closePicker);
  $("clear-map-points")?.addEventListener("click", () => {
    points = { ...EMPTY };
    ["from", "pickup", "to"].forEach((id) => ($(id).value = ""));
    pickerDraw();
    drawMaps();
    refresh();
  });
  document
    .querySelectorAll("[data-map-mode]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setPickerMode(button.dataset.mapMode),
      ),
    );
  pickerOverlay?.addEventListener("click", (event) => {
    if (event.target === pickerOverlay) closePicker();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !pickerOverlay?.classList.contains("hidden"))
      closePicker();
  });

  ["from", "to", "pickup", "departure-time"].forEach((id) =>
    $(id).addEventListener("input", refresh),
  );
  $("from").addEventListener("change", () => geocode("from", "from"));
  $("to").addEventListener("change", () => geocode("to", "to"));
  $("pickup").addEventListener("change", () => geocode("pickup", "pickup"));
  document.querySelectorAll("[data-clear]").forEach(
    (button) =>
      (button.onclick = () => {
        $(button.dataset.clear).value = "";
        points[button.dataset.clear] = null;
        $(button.dataset.clear).focus();
        refresh();
        drawMaps();
      }),
  );
  document.querySelectorAll(".day").forEach(
    (button) =>
      (button.onclick = () => {
        button.classList.toggle("selected");
        refresh();
      }),
  );
  const applyRemote = (item) => {
    if (!item) return;
    const data = item.data || item.recurringCommute || item;
    if (data.from) $("from").value = data.from;
    if (data.to) $("to").value = data.to;
    if (data.pickupPoint || data.pickup)
      $("pickup").value = data.pickupPoint || data.pickup;
    if (data.departureTime || data.time)
      $("departure-time").value = data.departureTime || data.time;
    if (Array.isArray(data.days))
      document
        .querySelectorAll(".day")
        .forEach((button) =>
          button.classList.toggle(
            "selected",
            data.days.includes(button.dataset.day),
          ),
        );
    refresh();
  };
  // Do not preload a saved commute here. The form must open empty; saved data is only
  // written after the user explicitly completes this form.
  $("commute-form").onsubmit = (event) => {
    event.preventDefault();
    if (!days().length) {
      toastMessage("Select at least one commute day.");
      return;
    }
    const body = {
      from: $("from").value.trim(),
      to: $("to").value.trim(),
      pickupPoint: $("pickup").value.trim(),
      days: days(),
      departureTime: $("departure-time").value,
    };
    busy($("save"), async () => {
      try {
        await api("/api/recurring-commutes", { method: "POST", body });
        toastMessage("Recurring commute saved.");
      } catch (error) {
        toastMessage(error.message);
      }
    });
  };
  $("commute-form").reset();
  document
    .querySelectorAll(".day")
    .forEach((button) => button.classList.remove("selected"));
  points = { ...EMPTY };
  refresh();
  setupMaps();
})();
