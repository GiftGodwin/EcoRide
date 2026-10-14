# EcoRide booking flow update

Integrated the three supplied designs into the existing passenger booking journey:

1. `booking.html` seat selection leads to `seat-request.html`.
2. Sending the request creates a booking and opens `request-processing.html`, which checks booking status every six seconds.
3. An accepted request opens `booking-confirmation.html`; declined or cancelled requests offer a route back to available rides.

The new pages use the existing EcoRide logo, typography, colors, ride cache, authentication token, and booking endpoints. Back links are included below the header on Seat Request, Request Processing, and Booking Confirmation.

## Backend contract note

The published booking endpoint requires `poolId` and accepts a one-seat count; it does not accept a seat number. The selected seat is preserved locally as a preference across the supplied screens, not as a backend-confirmed assignment. The confirmation copy reflects this boundary. Persisting a specific seat assignment requires the backend to accept and return a seat identifier/number.

## Validation

- `node --check` passed for `connect.js`, `services.js`, and `booking-flow.js`.
- All 32 HTML pages parsed successfully.
- Local HTML link targets checked with no missing destinations.
- New flow CSS includes responsive breakpoints at 700px and 420px.
