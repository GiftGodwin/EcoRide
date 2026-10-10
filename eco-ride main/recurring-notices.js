// Inline error states for the recurring commute form. Additive: recurring.js is untouched.
(() => {
  const $ = (id) => document.getElementById(id);
  const mapN = $("map-notice"),
    formN = $("form-notice"),
    pickup = $("pickup");
  if (!mapN || !formN || !pickup) return;
  const MSG = {
    far: "This route is too far for regular commute",
    area: "The pickup isn't currently within the EcoRide service area",
    missing: "Select at least one day and a departure time to continue",
  };
  const note = $("map-notice").previousElementSibling; // the green "service area" note
  const wrap = pickup.closest(".input-wrap");
  const say = (el, msg) => {
    el.querySelector("span").textContent = msg || "";
    el.classList.toggle("hidden", !msg);
  };
  const mapError = (msg, warn) => {
    say(mapN, msg);
    note?.classList.toggle("off", !!msg);
    wrap.classList.toggle("warn", !!msg && warn);
  };
  const days = () => document.querySelectorAll(".day.selected").length;

  // 1. missing days / time: shown on Save before the browser's own validation
  $("save").addEventListener(
    "click",
    (e) => {
      if (
        !$("from").value.trim() ||
        !$("to").value.trim() ||
        !pickup.value.trim()
      )
        return; // native "required" handles these
      if (!days() || !$("departure-time").value) {
        e.preventDefault();
        e.stopImmediatePropagation();
        say(formN, MSG.missing);
      }
    },
    true,
  );
  document.querySelectorAll(".day").forEach((b) =>
    b.addEventListener("click", () => {
      if (days() && $("departure-time").value) say(formN, "");
    }),
  );
  $("departure-time").addEventListener("input", () => {
    if (days() && $("departure-time").value) say(formN, "");
  });

  // 2. too far: straight-line distance between the points the user entered
  const cache = {};
  const geo = async (q) => {
    if (cache[q]) return cache[q];
    try {
      const r = await (
        await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`,
          { headers: { Accept: "application/json" } },
        )
      ).json();
      return (cache[q] = r[0] ? [+r[0].lat, +r[0].lon] : null);
    } catch (_) {
      return null;
    }
  };
  const km = (a, b) => {
    const R = 6371,
      t = (x) => (x * Math.PI) / 180,
      dLa = t(b[0] - a[0]),
      dLo = t(b[1] - a[1]);
    const h =
      Math.sin(dLa / 2) ** 2 +
      Math.cos(t(a[0])) * Math.cos(t(b[0])) * Math.sin(dLo / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const MAX_KM = 150;
  let timer;
  const check = () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const [f, t, p] = await Promise.all(
        ["from", "to", "pickup"].map((id) =>
          $(id).value.trim() ? geo($(id).value.trim()) : null,
        ),
      );
      const far =
        (f && t && km(f, t) > MAX_KM) ||
        (f && p && km(f, p) > MAX_KM) ||
        (t && p && km(t, p) > MAX_KM);
      if (far) mapError(MSG.far, true);
      else if (mapN.querySelector("span").textContent === MSG.far) mapError("");
    }, 900);
  };
  ["from", "to", "pickup"].forEach((id) =>
    $(id).addEventListener("change", check),
  );

  // 3. outside the service area: reported by the backend when saving
  new MutationObserver(() => {
    if (/service area/i.test($("toast").textContent)) mapError(MSG.area, false);
  }).observe($("toast"), {
    childList: true,
    characterData: true,
    subtree: true,
  });

  // design preview: recurring.html?state=far | area | missing
  const st = new URLSearchParams(location.search).get("state");
  if (st === "far") mapError(MSG.far, true);
  if (st === "area") mapError(MSG.area, false);
  if (st === "missing") say(formN, MSG.missing);
})();
