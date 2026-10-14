# EcoRide frontend API contract

The frontend API base in `app.js` is `https://ecoride-backend-mdlg.onrender.com`. Requests are sent through `api()` / `EcoAPI` with the bearer token when available. This note was reconciled against the production Swagger UI on 14 October 2026.

| Frontend flow | Published endpoint contract | Current integration status |
|---|---|---|
| Register | `POST /api/auth/register`; required: `firstName`, `lastName`, `email`, `password`, `role`; `role` is documented as `passenger` only | The current signup handler does not send `role`; it also offers phone-only registration, but the API requires email. Driver registration is not documented. |
| Log in | `POST /api/auth/login`; required: `email`, `password` | The email route matches. The UI's phone route sends `phone`, which is not in the documented schema. |
| Email OTP | `POST /api/auth/send-otp` (`email`) and `POST /api/auth/verify-otp` (`email`, `otp`) | Matches the email-based flow. |
| Identity verification | `POST /api/verification`; required: `verificationType`, `documentType`, `documentNumber`; optional `documentUrl` | The NIN handler sends `identity`, `national_id`, and `documentNumber`, matching the published fields. |
| Create recurring commute | `POST /api/recurring-commutes`; required `route` and `schedule`; optional `pickupPoints`, `preferences` | The commute form submits this nested structure. |
| Match rides | `GET /api/matching/commutes/{commuteId}` | Route and method match. Response fields are not declared in Swagger. |
| Request a seat | `POST /api/bookings`; required `poolId`; optional `seats` | `EcoAPI.createBooking` sends `poolId` and `seats: 1`, matching the documented schema. The schema has no `seatNumber` field. |
| Poll/cancel a booking | `GET /api/bookings/{bookingId}`; `PATCH /api/bookings/{bookingId}/cancel` (optional `reason`) | Paths and methods match. Swagger does not declare booking response fields/status values. |
| Initialize payment | `POST /api/payments/initialize`; required `bookingId` only | The request body matches. `method` and `callbackUrl` are not documented or sent by `EcoAPI`; method-specific behavior cannot be confirmed from this spec. |
| Verify payment | `GET /api/payments/verify/{reference}` | Route and method match. Swagger does not declare the response fields consumed by checkout. |
| Trip sessions | `POST /api/trip-sessions` (`bookingId`); `GET` and `PATCH` lifecycle routes | The docs provide the expected routes; test with an authenticated account before relying on live-trip actions. |
| Emergency incident | `POST /api/incidents/trip/{tripId}`; required `type`, `description`; optional `severity`, location | The SOS flow sends the documented required fields. |
| Driver profile | `POST /api/driver-profile`; required `vehicle`; optional `phoneNumber`, `profilePhoto`, `bio` | Driver profile schema exists, but registration/role eligibility and response fields are not documented sufficiently to confirm driver onboarding end to end. |

## Important limits

- The three added booking pages create a one-seat booking request and poll until the driver accepts or rejects it. The backend schema accepts a **seat count**, not a seat number. The selected seat is retained locally as a preference; it is not an assigned seat confirmed by the server.
- The production Swagger page was reachable, but authenticated requests and write operations were not executed. OpenAPI response entries for the core flows are descriptions only, with no response schemas. Therefore field-level runtime behavior (for example `authorization_url`, booking status, or payment verification fields) cannot be certified from the published documentation alone.
- The published auth contract is email-only and passenger-only at registration. Phone signup/login and driver registration require corresponding backend support or an agreed frontend-flow change.
- Ride publishing/alerts are not documented in this API. Existing pages already identify those actions as unavailable; no extra pages or endpoints have been invented.
