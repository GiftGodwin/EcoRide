# Backend to-do (for the frontend to be fully connected)

## Fix / confirm on what already exists
1. CORS: allow the live frontend origin (https://ecoride-steel.vercel.app) and preview origins.
2. Login response must include: token, user.role, user.verified, user.firstName.
3. Role is chosen AFTER NIN verification: add a way to save it (e.g. PATCH /api/users/role) or accept it in /api/verification.
4. POST /api/verification {nin}: validate, reply 400 + clear message for "invalid NIN" and "NIN does not match name"; GET returns status (pending/verified/rejected).
5. Make the face step part of verification (accept a selfie, or tell us which endpoint).
6. OTP e-mail sending (Resend) works - keep the 60 second resend limit.

## Missing endpoints (not in the Swagger / list we have)
7. Driver documents: upload (licence, vehicle info, insurance), approval status, rejection reason.
8. Publish a ride (route, date/time, seats, fare) for drivers.
9. Search rides by from / to / date / time / passengers (matching currently needs a saved commute id).
10. Matching response with all fields in docs/API_CONTRACT.md, including partial matches and suggested pickup points, and nearby-time alternatives.
11. Driver side of bookings: list incoming requests (passenger details, pickup), reply window, notify the passenger on decline.
12. Trips: start trip, complete trip, live location + ETA, shareable trip link, "Get help".
13. Payments: Paystack `authorization_url` + callback, fee breakdown on the booking, bank-transfer details, receipt, payment history list, credit driver wallet on trip completion, earnings + payouts.
14. Ratings: submit review, driver rating / trips / on-time % / cancellation rate, driver public profile by id.
15. Dashboard numbers: CO2 saved, spend this month, today's trips, earnings this week, available seats.
16. Ride alerts ("notify me when a ride is available") and notifications (bell icon).
