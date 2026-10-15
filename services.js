/* EcoRide API layer.
   Every backend call, request field name and response shape the frontend relies on lives HERE.
   If the backend uses different names, change them in this one file (see docs/API_CONTRACT.md). */
const EcoAPI = (() => {
  // ---------- request field names ----------
  const F = {
    bookingRide: "poolId",
    bookingSeats: "seats",
    payBooking: "bookingId",
  };

  // ---------- helpers ----------
  const unwrap = (d) =>
    d && typeof d === "object" && !Array.isArray(d) && d.data !== undefined
      ? d.data
      : d;
  const asList = (d) => {
    d = unwrap(d);
    if (Array.isArray(d)) return d;
    for (const k of [
      "items",
      "results",
      "matches",
      "rides",
      "bookings",
      "commutes",
      "rows",
      "data",
    ])
      if (Array.isArray(d?.[k])) return d[k];
    return [];
  };
  const dig = (o, p) =>
    p.split(".").reduce((a, k) => (a == null ? a : a[k]), o);
  const pick = (o, paths, dflt = null) => {
    for (const p of paths) {
      const v = dig(o, p);
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return dflt;
  };
  const str = (v) =>
    v && typeof v === "object"
      ? v.name || v.address || v.label || v.title || null
      : v;
  const naira = (n) =>
    n === null || n === undefined || n === "" || isNaN(+n)
      ? "₦ —"
      : "₦ " + Number(n).toLocaleString("en-NG");
  const fmtTime = (v) => {
    if (!v) return "—";
    const m = /^(\d{1,2}):(\d{2})/.exec(String(v));
    if (m && !/\d{4}-\d{2}-\d{2}/.test(v)) {
      const h = +m[1];
      return `${h % 12 || 12}:${m[2]} ${h >= 12 ? "PM" : "AM"}`;
    }
    const d = new Date(v);
    return isNaN(d)
      ? String(v)
      : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };
  const toMinutes = (v) => {
    const t = fmtTime(v);
    const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(t);
    return m ? ((+m[1] % 12) + (m[3] === "PM" ? 12 : 0)) * 60 + +m[2] : null;
  };
  const fmtDate = (v) => {
    const d = new Date(v);
    return !v || isNaN(d)
      ? "—"
      : d.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
  };
  const fmtDateTime = (v) => {
    const d = new Date(v);
    return !v || isNaN(d)
      ? "—"
      : d.toLocaleString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };
  const initials = (n) =>
    n
      ? String(n)
          .split(/\s+/)
          .map((x) => x[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "—";
  const dayLabel = (days) => {
    if (!Array.isArray(days) || !days.length) return "";
    const d = days.map((x) =>
      String(x)
        .slice(0, 3)
        .replace(/^./, (c) => c.toUpperCase()),
    );
    return ["Mon", "Tue", "Wed", "Thu", "Fri"].every((x) => d.includes(x)) &&
      d.length === 5
      ? "Mon - Fri"
      : d.join(", ");
  };

  // ---------- normalisers: turn whatever the backend sends into one shape ----------
  const ride = (r) => {
    r = r || {};
    const v =
      pick(r, ["vehicle", "driver.vehicle", "driverProfile.vehicle"], {}) || {};
    const name =
      pick(r, [
        "driver.name",
        "driverName",
        "driver.fullName",
        "driver.user.name",
      ]) ||
      [
        pick(r, ["driver.firstName", "driver.user.firstName"]),
        pick(r, ["driver.lastName", "driver.user.lastName"]),
      ]
        .filter(Boolean)
        .join(" ") ||
      null;
    const type = String(
      pick(r, ["matchType", "match.type", "type", "matchLevel"], ""),
    ).toLowerCase();
    return {
      id: pick(r, ["id", "_id", "commuteId", "rideId"]),
      poolId: pick(r, ["poolId", "pool.id", "pool._id", "pool"]),
      driverId: pick(r, [
        "driverId",
        "driver.id",
        "driver._id",
        "driver.userId",
        "driver.user.id",
      ]),
      driverName: name,
      rating: pick(r, [
        "driver.rating",
        "rating",
        "driverRating",
        "driver.averageRating",
      ]),
      trips: pick(r, [
        "driver.tripsCount",
        "driver.trips",
        "driver.totalTrips",
        "tripsCount",
        "trips",
      ]),
      onTime: pick(r, [
        "driver.onTimePercentage",
        "driver.onTime",
        "onTimePercentage",
      ]),
      cancelRate: pick(r, ["driver.cancellationRate", "cancellationRate"]),
      verified: !!pick(
        r,
        ["driver.verified", "driver.isVerified", "verified"],
        false,
      ),
      reviews: pick(r, ["driver.reviews", "reviews"], []),
      vehicleName:
        pick(v, ["makeModel", "name"]) ||
        [v.make, v.model].filter(Boolean).join(" ") ||
        null,
      plate: pick(v, ["plateNumber", "plate", "licensePlate"]),
      colour: pick(v, ["colour", "color"]),
      year: pick(v, ["year"]),
      ac: pick(v, ["airConditioning", "ac", "hasAC"]),
      seatsTotal: pick(v, ["seats", "capacity", "seatCount"]),
      seatsLeft: pick(r, [
        "seatsLeft",
        "availableSeats",
        "seatsAvailable",
        "seats",
      ]),
      price: pick(r, [
        "pricePerSeat",
        "farePerSeat",
        "fare",
        "price",
        "contribution",
      ]),
      serviceFee: pick(r, ["serviceFee", "fees.service"]),
      from: str(
        pick(r, [
          "from",
          "origin",
          "route.origin",
          "startLocation",
          "commute.from",
          "commute.route.origin",
        ]),
      ),
      to: str(
        pick(r, [
          "to",
          "destination",
          "route.destination",
          "endLocation",
          "commute.to",
          "commute.route.destination",
        ]),
      ),
      pickupName: str(
        pick(r, [
          "pickupPoint",
          "pickupName",
          "pickup",
          "pickupPoints.0",
          "commute.pickupPoint",
          "commute.pickupPoints.0",
        ]),
      ),
      pickupTime: pick(r, [
        "pickupTime",
        "departureTime",
        "schedule.departureTime",
        "time",
        "commute.departureTime",
        "commute.schedule.departureTime",
      ]),
      dropoffTime: pick(r, [
        "dropoffTime",
        "arrivalTime",
        "estimatedArrival",
        "eta",
      ]),
      days: pick(
        r,
        [
          "days",
          "recurringDays",
          "schedule.days",
          "commute.days",
          "commute.schedule.days",
        ],
        [],
      ),
      distanceKm: pick(r, ["distanceKm", "distance"]),
      durationMin: pick(r, ["durationMin", "duration", "etaMinutes"]),
      partial:
        type.includes("partial") ||
        pick(r, ["partial", "isPartial"], false) === true,
      suggestedPickups: pick(
        r,
        ["suggestedPickups", "pickupSuggestions", "suggestedPickupPoints"],
        [],
      ),
      driverRoute: pick(r, ["driverRoute"], null),
      date: pick(r, ["date", "departureDate", "rideDate", "travelDate"]),
    };
  };
  const booking = (b) => {
    b = b || {};
    return {
      id: pick(b, ["id", "_id", "bookingId"]),
      status: String(pick(b, ["status", "bookingStatus"], "")).toLowerCase(),
      paymentStatus: String(
        pick(b, ["paymentStatus", "payment.status"], ""),
      ).toLowerCase(),
      seat: pick(b, ["seatNumber", "seat", "seats"]),
      passengerName:
        pick(b, ["passenger.name", "passengerName", "passenger.fullName"]) ||
        [pick(b, ["passenger.firstName"]), pick(b, ["passenger.lastName"])]
          .filter(Boolean)
          .join(" ") ||
        null,
      message: pick(b, ["message"]),
      fare: pick(b, ["passengerFare", "fare", "baseFare", "pricePerSeat"]),
      serviceFee: pick(b, ["serviceFee", "fees.service"]),
      platformFee: pick(b, ["platformFee", "fees.platform"]),
      bookingFee: pick(b, ["bookingFee", "fees.booking"]),
      total: pick(b, ["totalAmount", "total", "amount", "amountDue"]),
      reference: pick(b, [
        "reference",
        "paymentReference",
        "payment.reference",
      ]),
      method: pick(b, ["paymentMethod", "payment.method", "payment.channel"]),
      paidAt: pick(b, ["paidAt", "payment.paidAt", "updatedAt"]),
      createdAt: pick(b, ["createdAt"]),
      ride: ride(b.commute || b.ride || b.match || b.trip || b),
    };
  };
  const is = {
    pending: (s) => /pend|request|await|review/.test(s),
    accepted: (s) => /accept|confirm|approv/.test(s),
    declined: (s) => /reject|declin|den/.test(s),
    cancelled: (s) => /cancel/.test(s),
    paid: (b) =>
      /paid|success|complete/.test(b.paymentStatus) ||
      /paid|complete/.test(b.status),
  };

  // ---------- ride cache (so profile / booking pages can show a ride chosen on the results page) ----------
  const cacheRides = (list) => {
    try {
      const m = JSON.parse(sessionStorage.getItem("eco_rides") || "{}");
      list.forEach((r) => {
        if (r.id) m[r.id] = r;
      });
      sessionStorage.setItem("eco_rides", JSON.stringify(m));
    } catch (_) {
      /* storage off */
    }
  };
  const cachedRide = (id) => {
    try {
      return (
        JSON.parse(sessionStorage.getItem("eco_rides") || "{}")[id] || null
      );
    } catch (_) {
      return null;
    }
  };

  const commute = (c) => {
    c = c || {};
    return {
      ...c,
      id: pick(c, ["id", "_id"]),
      from: pick(c, ["from", "route.origin"]),
      to: pick(c, ["to", "route.destination"]),
      pickupPoint: pick(c, ["pickupPoint", "pickupPoints.0"]),
      departureTime: pick(c, ["departureTime", "schedule.departureTime"]),
      days: pick(c, ["days", "schedule.days"], []),
    };
  };

  const pool = (p) => {
    p = p || {};
    return {
      id: pick(p, ["id", "_id", "poolId"]),
      status: String(pick(p, ["status"], "active")),
      from: str(pick(p, ["from", "origin", "route.origin", "commute.route.origin", "commute.from"])),
      to: str(pick(p, ["to", "destination", "route.destination", "commute.route.destination", "commute.to"])),
      days: pick(p, ["days", "schedule.days", "commute.schedule.days", "commute.days"], []),
      departureTime: pick(p, ["departureTime", "schedule.departureTime", "commute.schedule.departureTime", "commute.departureTime"]),
    };
  };

  // ---------- endpoints ----------
  const req = (path, method, body) =>
    api(path, body === undefined ? { method } : { method, body });
  const requireAuth = () => {
    if (store.get("token") || /[?&](state|preview)=/.test(location.search))
      return true;
    go("login.html");
    return false;
  };
  return {
    F,
    pick,
    str,
    asList,
    unwrap,
    ride,
    booking,
    is,
    naira,
    fmtTime,
    toMinutes,
    fmtDate,
    fmtDateTime,
    initials,
    dayLabel,
    cacheRides,
    cachedRide,
    requireAuth,
    // identity
    verifyNin: (nin) =>
      req("/api/verification", "POST", {
        verificationType: "identity",
        documentType: "national_id",
        documentNumber: nin,
      }).catch((e) => {
        if (e.status === 409) return {};
        throw e;
      }),
    getVerification: () => req("/api/verification", "GET"),
    // driver
    getDriverProfile: () => req("/api/driver-profile", "GET"),
    saveDriverProfile: (body) => req("/api/driver-profile", "POST", body),
    // wallet
    getWallet: () => req("/api/wallet", "GET"),
    fundWallet: (amount) => req("/api/wallet/fund", "POST", { amount }),
    // commutes + matching
    getCommutes: () =>
      req("/api/recurring-commutes", "GET").then((d) => asList(d).map(commute)),
    getMatches: (commuteId) =>
      req("/api/matching/commutes/" + encodeURIComponent(commuteId), "GET"),
    // commute pools
    getPools: () =>
      req("/api/commute-pools", "GET").then((d) => asList(d).map(pool)),
    joinPool: (poolId) =>
      req("/api/commute-pools/" + encodeURIComponent(poolId) + "/join", "POST"),
    // bookings
    getBookings: () => req("/api/bookings", "GET"),
    getBooking: (id) => req("/api/bookings/" + encodeURIComponent(id), "GET"),
    createBooking: ({ rideId }) =>
      req("/api/bookings", "POST", {
        [F.bookingRide]: rideId,
        [F.bookingSeats]: 1,
      }),
    cancelBooking: (id) =>
      req("/api/bookings/" + encodeURIComponent(id) + "/cancel", "PATCH"),
    acceptBooking: (id) =>
      req("/api/bookings/" + encodeURIComponent(id) + "/accept", "PATCH"),
    rejectBooking: (id) =>
      req("/api/bookings/" + encodeURIComponent(id) + "/reject", "PATCH"),
    refundBooking: (id) =>
      req("/api/refunds/booking", "POST", { [F.payBooking]: id }),
    // payments
    initPayment: ({ bookingId }) =>
      req("/api/payments/initialize", "POST", { [F.payBooking]: bookingId }),
    verifyPayment: (reference) =>
      req("/api/payments/verify/" + encodeURIComponent(reference), "GET"),
    payWithWallet: (bookingId) =>
      req("/api/wallet-payments/pay", "POST", { [F.payBooking]: bookingId }),
  };
})();
