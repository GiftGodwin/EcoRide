# EcoRide backend and Figma cross-check

**Checked:** 14 October 2026

## Result

The configured frontend API base URL matches the production server named in the supplied Swagger docs. The three added booking screens are present both in the Figma canvas and in the code, and their main booking request/status/cancel routes match the published endpoint paths. I cannot certify that the full site works end to end: the OpenAPI spec omits response schemas for the core booking/payment operations, and some existing auth and seat-selection behavior is not supported by the documented backend contract.

The Swagger UI was reachable over HTTPS (HTTP 200). This check compared the frontend and the published OpenAPI spec; it did **not** execute authenticated writes or payment transactions because no user session/token was available.

### Non-destructive production API probes

I sent empty/invalid request bodies to write routes and made unauthenticated GETs to protected routes; no account, booking, ride, trip, OTP, or payment was created. Across 30 frontend-used route/method probes, protected reads/writes returned `401` with `Not authorized. No token provided.`; the four auth endpoints returned `400` validation errors for missing/invalid input. Responses returned `Access-Control-Allow-Origin: *`. Sampled browser preflights returned `204` and listed the required methods. These checks show reachability, CORS, and auth/validation gates—not successful authenticated behavior.

The live `POST /api/auth/register` empty-body response says first name, last name, email, and password are required; it does not mention `role`, although Swagger marks `role` required and restricts it to `passenger`. This documentation/runtime validation discrepancy needs a valid test account or a backend clarification to resolve. No successful login, registration, OTP delivery/verification, booking lifecycle, or payment could be tested without staging credentials and safe test data.

## Figma screens and corresponding code

The first 50 images in `Screenshots.zip` are captures of the Swagger documentation. The final nine are Figma canvas screenshots at 13% zoom. I checked the visible frame labels and the actual contents of each visible design; some names are generic or do not match the design content.

| Visible Figma frame/design | Existing or added code |
|---|---|
| Web page / home | `index.html` |
| Web page; Driver/Passenger | `index.html`; `role.html` |
| Create Account Email; Create Account Phone Number | `signup.html` (email/phone modes) |
| Driver Login/Desktop; Login Email | `login.html` (shared login page) |
| OTP Verification; Face Verification; Verification Successful; Enter NIN | `otp.html`; `face.html`; `success.html`; `nin.html` |
| Passenger Dashboard; Driver Dashboard/Desktop | `passenger-dashboard.html`; `driver-dashboard.html` |
| Generic Desktop ride-results frame (visually the available-rides/results layout) | `available-rides.html` |
| Verification frames (recurring commute route, pickup, map, and schedule states) | `recurring.html` |
| Available rides; Partial route match; Alternative time; No exact routes | `available-rides.html`; `partial-match.html`; `alternative-times.html`; `no-match.html` |
| Driver Trust Profile | `driver-profile.html` |
| Booking request; Accept passenger | `booking-request.html`; `passenger-accepted.html` |
| Seat Request; Request Processing; Booking Confirmation | `seat-request.html`; `request-processing.html`; `booking-confirmation.html` |
| Fare breakdown; Pay with card/bank transfer; Payment Failed/Successful; Payment Receipt | `checkout.html` and its in-page states |
| Trip in progress/live trip tracking; Complete trip; Earnings; SOS | `live-trip.html` / `trip-start.html`; `trip-complete.html`; `earnings.html`; `sos.html` / `sos-options.html` |
| Frame labeled “Partial route match” whose visible content is actually Safety & Feedback | `safety-feedback.html` |

**Page gap finding:** After matching the visible frames by both their labels and their actual contents, I did not find a distinct screen shown in these screenshots without a code counterpart. The frame named “Partial route match” appears twice with different content: one is the partial-match page; the other is the Safety & Feedback page and maps to `safety-feedback.html`. Payment Receipt is an in-page `checkout.html` state; email/phone signup and login variants share pages. Repeated SOS, Complete trip, Verification, and trip frames are variants/states, not additional pages.

## Backend compatibility

### Matches

- `app.js` points at `https://ecoride-backend-mdlg.onrender.com`, the published production server.
- Ride matching uses `GET /api/matching/commutes/{commuteId}`.
- The commute form sends nested `route` and `schedule` fields to `POST /api/recurring-commutes`, matching the OpenAPI schema.
- Booking creation sends `poolId` and `seats: 1` to `POST /api/bookings`; the published schema requires `poolId` and allows `seats`.
- Booking polling and cancellation use the documented `GET /api/bookings/{bookingId}` and `PATCH /api/bookings/{bookingId}/cancel` routes.
- Payment initialization sends `bookingId` to `POST /api/payments/initialize`, which is the only required field documented. Verification uses `GET /api/payments/verify/{reference}`.
- The SOS flow sends `type`, `description`, and `severity` to the documented trip-incident endpoint.

### Gaps or unverified behavior

1. **Seat assignment:** the create-booking schema has no `seatNumber`; it only represents the number of seats. The frontend's selected seat is local state, so the backend cannot confirm or reserve that specific seat from the documented request. The confirmation copy was changed to say the driver accepted the booking and that the seat is a preference, not a server-assigned seat.
2. **Registration:** the backend requires `role` and documents only `passenger`; the existing signup handler omits `role`. It also permits phone-only signup, although the API requires `email`. Driver signup/role assignment is not documented.
3. **Phone login:** the UI sends `phone`, while the published login schema requires `email` and `password`. Phone login is not contract-compatible.
4. **Payment choice/return:** Swagger documents only `bookingId` for initialization; it does not document a payment-method field, callback URL, or response schema. The frontend's payment choices and expected authorization/verification response fields therefore cannot be confirmed from this spec. The card/bank-transfer distinction needs a documented backend behavior.
5. **Response schemas:** the core booking and payment operations list status codes but provide no response field schemas. Fields used by the frontend such as booking `status`, `authorization_url`, payment `reference`, and verification outcome are not proven by this documentation.
6. **Driver role/profile:** a driver-profile endpoint exists, but the docs do not establish how a passenger account becomes a driver or whether the current role-selection flow is accepted by the backend.

## Conclusion

**The core new booking route wiring matches the published request/path contract, and the Figma booking screens are represented in the site. The site is not fully contract-verified end to end.** Email registration, phone auth, exact seat allocation, driver onboarding, and method-specific payment behavior need backend contract support or an agreed product-flow adjustment. The authoritative request/response details should be expanded in the backend OpenAPI docs before calling these parts fully integrated.
