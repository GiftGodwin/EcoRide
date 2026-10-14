(() => {
  const E = window.EcoAPI;
  const qs = new URLSearchParams(location.search);
  const page = document.body.dataset.page;
  const $ = (id) => document.getElementById(id);
  const id = qs.get("booking") || sessionStorage.getItem("eco_booking");
  const flash = (message) => {
    const toast = $("flow-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => toast.classList.remove("show"), 3400);
  };
  const name = store.get("name") || store.get("user_name") || "Passenger";
  const avatar = $("flow-avatar");
  if (avatar && name !== "Passenger") {
    avatar.hidden = false;
    avatar.textContent = name.trim().charAt(0).toUpperCase();
    $("flow-user-name").textContent = name;
  }
  const selectedRide = E.cachedRide(
    qs.get("ride") || sessionStorage.getItem("eco_selected_ride"),
  );
  const selectedSeat =
    qs.get("seat") || sessionStorage.getItem("eco_selected_seat");
  const details = (ride) => {
    const r = ride || {};
    return {
      from: r.from || "—",
      to: r.to || "—",
      pickup: r.pickupName || "",
      dropoff: r.dropoffName || "",
      date: r.date ? E.fmtDate(r.date) : "Date to be confirmed",
      time: r.pickupTime ? E.fmtTime(r.pickupTime) : "Time to be confirmed",
    };
  };
  const routeLink = (anchor, url) => {
    if (anchor) anchor.href = url;
  };
  const initRequest = () => {
    if (!E.requireAuth()) return;
    if (!selectedRide || !selectedSeat) {
      flash("Select an available ride and seat first.");
      setTimeout(() => (location.href = "available-rides.html"), 1000);
      return;
    }
    const r = details(selectedRide);
    $("sr-from").textContent = r.from;
    $("sr-to").textContent = r.to;
    $("sr-pickup").textContent = r.pickup;
    $("sr-dropoff").textContent = r.dropoff;
    $("sr-seat").textContent =
      `Seat ${selectedSeat}${selectedSeat === "1" ? " (Front Passenger)" : ""}`;
    $("sr-passenger").textContent = name;
    $("sr-date").textContent = r.date;
    $("sr-time").textContent = r.time;
    routeLink(
      $("flow-back"),
      `booking.html?ride=${encodeURIComponent(qs.get("ride") || selectedRide.id)}`,
    );
    routeLink(
      $("edit-seat"),
      `booking.html?ride=${encodeURIComponent(qs.get("ride") || selectedRide.id)}`,
    );
    $("send-request").addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      button.textContent = "Sending request…";
      try {
        const raw = await E.createBooking({
          rideId: selectedRide.poolId || selectedRide.id,
        });
        const booking = E.booking(E.unwrap(raw));
        if (!booking.id)
          throw new Error(
            "The booking request could not be created. Please try again.",
          );
        booking.ride = selectedRide;
        booking.seat = selectedSeat;
        booking.passengerName = name;
        sessionStorage.setItem("eco_booking", booking.id);
        sessionStorage.setItem("eco_booking_details", JSON.stringify(booking));
        location.href = `request-processing.html?booking=${encodeURIComponent(booking.id)}`;
      } catch (error) {
        flash(
          error.message || "Could not send your request. Please try again.",
        );
        button.disabled = false;
        button.textContent = "Request Seat";
      }
    });
  };
  const initProcessing = () => {
    if (!E.requireAuth()) return;
    if (!id) {
      location.replace("available-rides.html");
      return;
    }
    const alert = $("rp-alert");
    const cancel = $("cancel-request");
    let stopped = false;
    const saved = (() => {
      try {
        return JSON.parse(
          sessionStorage.getItem("eco_booking_details") || "null",
        );
      } catch (_) {
        return null;
      }
    })();
    const initialRoute = details(saved?.ride || {});
    $("rp-from").textContent = initialRoute.from;
    $("rp-to").textContent = initialRoute.to;
    cancel.hidden = false;
    const stop = () => {
      stopped = true;
      clearInterval(timer);
    };
    const showAlert = (message, showCancel = false) => {
      alert.hidden = false;
      alert.textContent = message;
      cancel.hidden = !showCancel;
    };
    const refresh = async () => {
      if (stopped) return;
      try {
        const booking = E.booking(E.unwrap(await E.getBooking(id)));
        if (!booking.seat && saved?.seat) booking.seat = saved.seat;
        if ((!booking.ride?.from || booking.ride.from === "—") && saved?.ride)
          booking.ride = saved.ride;
        if (!booking.passengerName && saved?.passengerName)
          booking.passengerName = saved.passengerName;
        if (booking.ride?.from && booking.ride.from !== "—")
          $("rp-from").textContent = booking.ride.from;
        if (booking.ride?.to && booking.ride.to !== "—")
          $("rp-to").textContent = booking.ride.to;
        sessionStorage.setItem(
          "eco_booking_details",
          JSON.stringify({ ...saved, ...booking }),
        );
        if (E.is.accepted(booking.status)) {
          stop();
          location.replace(
            `booking-confirmation.html?booking=${encodeURIComponent(id)}`,
          );
        } else if (E.is.declined(booking.status)) {
          stop();
          $("processing-title").textContent =
            "This seat is no longer available";
          showAlert(
            "The driver could not accept this request. Choose another ride to continue.",
          );
          cancel.hidden = false;
          cancel.textContent = "Find another ride";
          cancel.onclick = () => (location.href = "available-rides.html");
        } else if (E.is.cancelled(booking.status)) {
          stop();
          $("processing-title").textContent = "Request cancelled";
          showAlert("Your request has been cancelled.");
          cancel.hidden = false;
          cancel.textContent = "Find another ride";
          cancel.onclick = () => (location.href = "available-rides.html");
        }
      } catch (_) {
        showAlert(
          "We are still waiting for the booking service. We’ll keep checking automatically.",
          true,
        );
      }
    };
    cancel.addEventListener("click", async () => {
      if (cancel.textContent === "Find another ride")
        return (location.href = "available-rides.html");
      cancel.disabled = true;
      cancel.textContent = "Cancelling…";
      try {
        await E.cancelBooking(id);
        stop();
        location.href = "available-rides.html";
      } catch (error) {
        cancel.disabled = false;
        cancel.textContent = "Cancel request";
        flash(error.message || "Unable to cancel this request right now.");
      }
    });
    const timer = setInterval(refresh, 6000);
    refresh();
  };
  const initConfirmation = async () => {
    if (!E.requireAuth()) return;
    if (!id) {
      location.replace("passenger-dashboard.html");
      return;
    }
    let booking;
    try {
      booking = E.booking(E.unwrap(await E.getBooking(id)));
    } catch (_) {
      try {
        booking = E.booking(
          JSON.parse(sessionStorage.getItem("eco_booking_details") || "null"),
        );
      } catch (_) {}
    }
    if (!booking) {
      flash("Booking details are not available right now.");
      return;
    }
    const retained = (() => {
      try {
        return JSON.parse(
          sessionStorage.getItem("eco_booking_details") || "null",
        );
      } catch (_) {
        return null;
      }
    })();
    if (!booking.seat && retained?.seat) booking.seat = retained.seat;
    if ((!booking.ride?.from || booking.ride.from === "—") && retained?.ride)
      booking.ride = retained.ride;
    if (!booking.passengerName && retained?.passengerName)
      booking.passengerName = retained.passengerName;
    let r = booking.ride || {};
    if ((!r.from || r.from === "—") && selectedRide) r = selectedRide;
    const d = details(r);
    $("bc-route").textContent = `${d.from}  →  ${d.to}`;
    $("bc-date").textContent = [d.date, d.time].filter(Boolean).join("  ·  ");
    $("bc-seat").textContent =
      `Seat preference: ${booking.seat || savedSeat(booking) || "—"}${String(booking.seat || savedSeat(booking)) === "1" ? " (Front Passenger)" : ""}`;
    $("bc-passenger").textContent =
      `Passenger: ${booking.passengerName || name}`;
    $("bc-id").textContent = `#${booking.reference || booking.id || id}`;
    $("bc-subtitle").textContent =
      "The driver accepted your booking request. The selected seat is a preference, not a backend-confirmed assignment.";
    routeLink(
      $("view-booking"),
      `passenger-accepted.html?booking=${encodeURIComponent(id)}`,
    );
    $("copy-booking").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(
          String(booking.reference || booking.id || id),
        );
        flash("Booking ID copied.");
      } catch (_) {
        flash(booking.reference || booking.id || id);
      }
    });
  };
  function savedSeat(booking) {
    try {
      return (
        booking?.seat ||
        JSON.parse(sessionStorage.getItem("eco_booking_details") || "null")
          ?.seat
      );
    } catch (_) {
      return null;
    }
  }
  if (page === "seat-request") initRequest();
  if (page === "request-processing") initProcessing();
  if (page === "booking-confirmation") initConfirmation();
})();
