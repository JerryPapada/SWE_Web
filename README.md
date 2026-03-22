# SWE_Web
MSc Class - Software Development for the Web

This repository contains a full-stack cinema reservation system. The frontend lives in `frontend/` and the Django REST backend lives in `backend/`. The rest of this README focuses exclusively on the backend and how the system works end-to-end.

Stack:
- Framework: Django 4.2 + Django REST Framework
- Database: PostgreSQL
- Auth: JWT (SimpleJWT) + dj-rest-auth + Google OAuth
- API docs: OpenAPI schema + Swagger UI
- Core domains: users, venues, showtimes, reservations, tickets, visitor logs

Directory Structure:
- backend/config/: Django settings and URL routing.
- backend/apps/: Domain apps (users, venues, reservations, tickets, notifications).
- backend/docs/: Detailed database schema and backend-specific docs.
- backend/tests/: Automated tests for users, venues, reservations, tickets.

Functionality:
1. Users register or sign in via email/password or Google OAuth.
2. Public endpoints allow browsing cinemas, rooms, movies, and upcoming showtimes.
3. A logged-in user creates a reservation for a showtime and optionally selects seats.
4. The reservation is confirmed inside a DB transaction: the showtime row is locked, seat availability is verified, seats are assigned, tickets are generated, and a history entry is recorded.
5. A confirmation email is sent with reservation details and QR codes.
6. Staff validate or check-in tickets at the cinema, which logs the visit.
7. Admins/managers can modify showtimes; affected reservations are notified or cancelled if necessary.

Models:
- User (apps.users.models.User): custom auth model with email as username and role-based access.
- Cinema -> Room -> Showtime -> Reservation -> Ticket: the booking floow.
- ShowtimeSeat: generated seats per showtime, used for seat selection and conflicting safe reservations.
- ReservationHistory: append-only log of status changes.
- VisitorLog: check-in/visitor tracking for staff.

Authentication & Authorization
The backend uses JWT authentication (access + refresh tokens) and role-based permissions.

Authentication stack:
- JWT via rest_framework_simplejwt.
- dj-rest-auth provides login/logout/registration endpoints.
- django-allauth enables Google OAuth.

Role model (apps.users.models.User.Role):
- ADMIN: full access to all endpoints.
- TICKET_MANAGER: manages venues, showtimes, tickets, and check-ins.
- USER: can browse and manage their own reservations and tickets.

Permission rules (apps.users.permissions):
- Most endpoints require authentication by default (IsAuthenticated).
- Public read-only access is allowed for browsing cinemas, rooms, movies, and showtimes.
- Admin-only endpoints exist for user management and analytics.
- Ownership checks are enforced for reservations/tickets when a regular user accesses their own data.

User Management
User model highlights:
- Email is the login identifier (USERNAME_FIELD = 'email').
- Profile fields: first/last name, phone, optional photo.
- Role flags drive permissions (ADMIN, TICKET_MANAGER, USER).

Endpoints (base: api/users/):
- register/: create an account with validated password confirmation.
- profile/: get or update own profile.
- change-password/: update password with validation.
- roles/: list available roles (used by frontend forms).
- manage/: admin CRUD on users (role assignment, activate/deactivate).
- google/: Google OAuth login endpoint (backend handles the token exchange).

Venues, Movies, And Showtimes
The venues app defines the catalog of cinemas and their schedules.

Cinema:
- Basic profile (name, city, address, contact info, photo).
- `is_active` flag controls public visibility.

Room:
- Belongs to a cinema.
- Contains capacity, row count, seats per row, and room type.
- Room type drives flags for showtimes (`3D`, `IMAX`, `Dolby Atmos`).

Movie:
- Title, original title, duration, genre, rating, poster, trailer URL.
- `is_active` indicates currently showing.

Showtime:
- Links a movie to a room with start/end time and pricing.
- Automatically computes end time based on movie duration (with a buffer).
- Prevents overlapping showtimes in the same room.
- Initializes `available_seats` from room capacity.
- Generates `ShowtimeSeat` records on create.

Seat model (`ShowtimeSeat`):
- Each showtime generates row/seat identifiers (A1, A2, ...).
- Seats are reserved atomically to avoid race conditions.

Special showtime behavior:
- Updates/destroys trigger email notifications for affected reservations.
- If a showtime is deleted, associated confirmed reservations are cancelled.

Endpoints (base: `api/venues/`):
- `cinemas/`, `rooms/`, `movies/`, `showtimes/`: CRUD for managers, read-only for public.
- `cinemas/{id}/rooms/`: list rooms by cinema.
- `cinemas/{id}/showtimes/`: upcoming showtimes by cinema.
- `movies/{id}/showtimes/`: upcoming showtimes by movie.
- `showtimes/{id}/seats/`: seat map for a showtime.
- `showtimes/calendar/`, `showtimes/today/`, `showtimes/upcoming/`: schedule views.
- `rooms/room-types/`, `movies/rating-options/`, `movies/genre-options/`: UI helpers.

Reservations (Booking Engine)
Reservations are the core transaction of the system. The booking flow is intentionally strict to avoid double-booking.

Creation flow (handled in `ReservationCreateSerializer` and `Reservation.confirm`):
1. Validate the showtime is active and in the future.
2. Lock the showtime row using `select_for_update` to prevent race conditions.
3. Verify `available_seats` against requested seats.
4. If seat numbers are provided, validate the count and ensure all seats exist and are not already reserved.
5. If seat numbers are not provided, automatically allocate the next available seats in row order.
6. Persist the reservation and mark status as `CONFIRMED`.
7. Decrease `available_seats` and mark `ShowtimeSeat` records as reserved.
8. Create one `Ticket` per seat and generate QR codes.
9. Record a `ReservationHistory` entry.
10. Send confirmation email after the DB transaction commits.

Reservation statuses:
- `PENDING`: initial state (used internally, immediately confirmed on create).
- `CONFIRMED`: tickets issued and seats locked.
- `CANCELLED`: reservation cancelled, seats released if previously confirmed.
- `COMPLETED`: reserved for future extension / manual status updates.

Cancellation flow:
- Disallowed for past showtimes or completed reservations.
- Releases seats and restores `available_seats`.
- Cancels tickets that were not checked in.
- Logs history and sends a cancellation email.

Endpoints (base: `api/reservations/`):
- `POST /`: create reservation (auto-confirms).
- `GET /`: list reservations (managers), or own reservations (users).
- `GET /my_reservations/`: convenience view for the current user.
- `POST /{id}/cancel/`: cancel a reservation.
- `GET /{id}/history/`: reservation history entries.
- `GET /admin/statistics/`: aggregated reservation stats (admin only).

Tickets And Check-In
Tickets represent each seat in a confirmed reservation and power QR validation at entry.

Ticket creation:
- For every reserved seat, a `Ticket` record is created.
- Each ticket generates `qr_data` and a QR PNG on first save.
- QR codes are stored under `media/tickets/qr/` and linked to the ticket.

Ticket validation:
- Staff submit a QR payload to validate a ticket.
- The system verifies that the ticket exists and is still valid.

Check-in logic (`Ticket.check_in`):
- Rejects if the ticket is already used or cancelled.
- If the showtime has started, allows a 30-minute grace period.
- If the grace period passed, the ticket is marked `EXPIRED`.
- Successful check-in marks the ticket as `USED` and records staff + time.

Visitor logging:
- Each successful check-in creates a `VisitorLog` record.
- Visitor logs store name, contact info, showtime, and staff user.

Endpoints (api/tickets/):
- `GET /`: list tickets (managers) or own tickets (users).
- `GET /my_tickets/`: valid tickets for the current user.
- `POST /validate/`: QR validation endpoint.
- `POST /checkin/`: check-in endpoint (staff only).
- `GET /visitors/`: list visitor logs (staff only).
- `POST /register/`: public visitor registration by contact info.
- `POST /search/`: search confirmed reservations by phone/email.

Email Notifications
The notification layer is centralized in apps/notifications/email.py and used by:
- Reservation confirmation emails (includes ticket QR images).
- Reservation cancellation emails.
- Showtime updates/cancellations affecting confirmed reservations.

details:
- Email is intentionally sent after DB commits so a temporary SMTP failure does not cancel reservations.
- Attachments are optional and skipped if a QR file cannot be read.
- In development you can use Django's console email backend to print emails to stdout.

API Docs
The backend serves an OpenAPI schema and interactive Swagger UI:
- `http://localhost:8000/api/schema/`
- `http://localhost:8000/api/docs/`
- `http://localhost:8000/api/redoc/`


Running Locally (Docker):
```bash
docker compose up --build -d
```

Useful URLs:
- API: `http://localhost:8000/api/`
- Admin: `http://localhost:8000/admin/`
- Swagger: `http://localhost:8000/api/docs/`



