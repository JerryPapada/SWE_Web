# Cinema Ticket System - Database Schema

## Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │     Cinema      │       │      Movie      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (UUID) PK    │       │ id (UUID) PK    │       │ id (UUID) PK    │
│ email (unique)  │       │ name            │       │ title           │
│ password        │       │ description     │       │ original_title  │
│ first_name      │       │ address         │       │ description     │
│ last_name       │       │ city            │       │ duration_minutes│
│ phone           │       │ phone           │       │ genre           │
│ photo           │       │ email           │       │ director        │
│ role            │       │ photo           │       │ cast            │
│ is_active       │       │ is_active       │       │ rating          │
│ is_staff        │       │ created_at      │       │ poster          │
│ created_at      │       │ updated_at      │       │ trailer_url     │
│ updated_at      │       └─────────────────┘       │ release_date    │
└─────────────────┘               │                 │ is_active       │
        │                         │                 │ created_at      │
        │                         │ 1:N             │ updated_at      │
        │                         ▼                 └─────────────────┘
        │                 ┌─────────────────┐               │
        │                 │      Room       │               │
        │                 ├─────────────────┤               │
        │                 │ id (UUID) PK    │               │
        │                 │ cinema_id FK    │───────────────┤
        │                 │ name            │               │
        │                 │ description     │               │
        │                 │ capacity        │               │
        │                 │ rows            │               │
        │                 │ seats_per_row   │               │
        │                 │ photo           │               │
        │                 │ has_3d          │               │
        │                 │ has_imax        │               │
        │                 │ has_dolby_atmos │               │
        │                 │ is_active       │               │
        │                 │ created_at      │               │
        │                 │ updated_at      │               │
        │                 └─────────────────┘               │
        │                         │                         │
        │                         │ 1:N                     │ 1:N
        │                         ▼                         ▼
        │                 ┌─────────────────────────────────────────┐
        │                 │               Showtime                   │
        │                 ├─────────────────────────────────────────┤
        │                 │ id (UUID) PK                            │
        │                 │ movie_id FK ────────────────────────────┤
        │                 │ room_id FK                              │
        │                 │ start_time                              │
        │                 │ end_time                                │
        │                 │ price                                   │
        │                 │ is_active                               │
        │                 │ available_seats                         │
        │                 │ is_3d                                   │
        │                 │ is_imax                                 │
        │                 │ created_at                              │
        │                 │ updated_at                              │
        │                 └─────────────────────────────────────────┘
        │                                   │
        │                                   │ 1:N
        │                                   ▼
        │                 ┌─────────────────────────────────────────┐
        │    1:N          │             Reservation                  │
        └────────────────▶├─────────────────────────────────────────┤
                          │ id (UUID) PK                            │
                          │ user_id FK                              │
                          │ showtime_id FK                          │
                          │ num_seats                               │
                          │ seat_numbers (JSON)                     │
                          │ total_price                             │
                          │ status                                  │
                          │ guest_email                             │
                          │ guest_phone                             │
                          │ notes                                   │
                          │ created_at                              │
                          │ updated_at                              │
                          │ confirmed_at                            │
                          │ cancelled_at                            │
                          └─────────────────────────────────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          │ 1:1             │                 │ 1:N
                          ▼                 │                 ▼
                  ┌───────────────┐         │     ┌─────────────────────┐
                  │    Ticket     │         │     │ ReservationHistory  │
                  ├───────────────┤         │     ├─────────────────────┤
                  │ id (UUID) PK  │         │     │ id (UUID) PK        │
                  │ reservation_id│         │     │ reservation_id FK   │
                  │ qr_code       │         │     │ old_status          │
                  │ qr_data       │         │     │ new_status          │
                  │ status        │         │     │ changed_by FK       │
                  │ checked_in    │         │     │ notes               │
                  │ checked_in_at │         │     │ created_at          │
                  │ checked_in_by │         │     └─────────────────────┘
                  │ created_at    │         │
                  │ updated_at    │         │
                  └───────────────┘         │
                          │                 │
                          │ 1:N             │
                          ▼                 │
                  ┌───────────────┐         │
                  │  VisitorLog   │◀────────┘
                  ├───────────────┤
                  │ id (UUID) PK  │
                  │ ticket_id FK  │
                  │ first_name    │
                  │ last_name     │
                  │ phone         │
                  │ email         │
                  │ photo         │
                  │ showtime_id FK│
                  │ entered_at    │
                  │ logged_by FK  │
                  │ notes         │
                  └───────────────┘
```

---

## Tables Overview

### users_user (Custom User Model)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| email | VARCHAR(254) | UNIQUE, NOT NULL | User's email (login) |
| password | VARCHAR(128) | NOT NULL | Hashed password |
| first_name | VARCHAR(150) | NOT NULL | First name |
| last_name | VARCHAR(150) | NOT NULL | Last name |
| phone | VARCHAR(20) | | Phone number |
| photo | VARCHAR(100) | | Profile photo path |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'USER' | ADMIN, TICKET_MANAGER, USER |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| is_staff | BOOLEAN | DEFAULT FALSE | Admin site access |
| is_superuser | BOOLEAN | DEFAULT FALSE | Superuser status |
| created_at | TIMESTAMP | AUTO | Creation timestamp |
| updated_at | TIMESTAMP | AUTO | Update timestamp |
| last_login | TIMESTAMP | | Last login time |

### venues_cinema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | VARCHAR(200) | NOT NULL | Cinema name |
| description | TEXT | | Description |
| address | VARCHAR(500) | NOT NULL | Full address |
| city | VARCHAR(100) | NOT NULL | City |
| phone | VARCHAR(20) | | Contact phone |
| email | VARCHAR(254) | | Contact email |
| photo | VARCHAR(100) | | Photo path |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | AUTO | Creation timestamp |
| updated_at | TIMESTAMP | AUTO | Update timestamp |

### venues_room

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| cinema_id | UUID | FK → venues_cinema | Parent cinema |
| name | VARCHAR(100) | NOT NULL | Room name |
| description | TEXT | | Description |
| capacity | INTEGER | NOT NULL, > 0 | Total seats |
| rows | INTEGER | DEFAULT 10 | Number of rows |
| seats_per_row | INTEGER | DEFAULT 15 | Seats per row |
| photo | VARCHAR(100) | | Photo path |
| has_3d | BOOLEAN | DEFAULT FALSE | 3D capability |
| has_imax | BOOLEAN | DEFAULT FALSE | IMAX capability |
| has_dolby_atmos | BOOLEAN | DEFAULT FALSE | Dolby Atmos sound |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| created_at | TIMESTAMP | AUTO | Creation timestamp |
| updated_at | TIMESTAMP | AUTO | Update timestamp |

**Constraints:** UNIQUE(cinema_id, name)

### venues_movie

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| title | VARCHAR(300) | NOT NULL | Movie title (Greek) |
| original_title | VARCHAR(300) | | Original title |
| description | TEXT | NOT NULL | Plot description |
| duration_minutes | INTEGER | NOT NULL | Duration in minutes |
| genre | VARCHAR(100) | NOT NULL | Genre |
| director | VARCHAR(200) | | Director name |
| cast | TEXT | | Cast list |
| rating | VARCHAR(10) | DEFAULT 'PG-13' | G, PG, PG-13, R, NC-17 |
| poster | VARCHAR(100) | | Poster image path |
| trailer_url | VARCHAR(200) | | YouTube/Vimeo URL |
| release_date | DATE | | Release date |
| is_active | BOOLEAN | DEFAULT TRUE | Currently showing |
| created_at | TIMESTAMP | AUTO | Creation timestamp |
| updated_at | TIMESTAMP | AUTO | Update timestamp |

### venues_showtime

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| movie_id | UUID | FK → venues_movie | Movie shown |
| room_id | UUID | FK → venues_room | Room/hall |
| start_time | TIMESTAMP | NOT NULL | Show start time |
| end_time | TIMESTAMP | NOT NULL | Show end time |
| price | DECIMAL(10,2) | NOT NULL, >= 0 | Ticket price |
| is_active | BOOLEAN | DEFAULT TRUE | Active status |
| available_seats | INTEGER | NOT NULL | Remaining seats |
| is_3d | BOOLEAN | DEFAULT FALSE | 3D showing |
| is_imax | BOOLEAN | DEFAULT FALSE | IMAX showing |
| created_at | TIMESTAMP | AUTO | Creation timestamp |
| updated_at | TIMESTAMP | AUTO | Update timestamp |

### reservations_reservation

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| user_id | UUID | FK → users_user | Booking user |
| showtime_id | UUID | FK → venues_showtime | Selected showtime |
| num_seats | INTEGER | NOT NULL, DEFAULT 1 | Number of seats |
| seat_numbers | JSONB | DEFAULT [] | Selected seats ["A1", "A2"] |
| total_price | DECIMAL(10,2) | NOT NULL | Total cost |
| status | VARCHAR(20) | NOT NULL | PENDING, CONFIRMED, CANCELLED, COMPLETED |
| guest_email | VARCHAR(254) | | Guest email |
| guest_phone | VARCHAR(20) | | Guest phone |
| notes | TEXT | | Notes |
| created_at | TIMESTAMP | AUTO | Creation timestamp |
| updated_at | TIMESTAMP | AUTO | Update timestamp |
| confirmed_at | TIMESTAMP | | Confirmation time |
| cancelled_at | TIMESTAMP | | Cancellation time |

### reservations_reservationhistory

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| reservation_id | UUID | FK → reservations_reservation | Parent reservation |
| old_status | VARCHAR(20) | | Previous status |
| new_status | VARCHAR(20) | NOT NULL | New status |
| changed_by_id | UUID | FK → users_user | Staff who changed |
| notes | TEXT | | Change notes |
| created_at | TIMESTAMP | AUTO | Change timestamp |

### tickets_ticket

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| reservation_id | UUID | FK → reservations_reservation, UNIQUE | Parent reservation |
| qr_code | VARCHAR(100) | | QR code image path |
| qr_data | VARCHAR(500) | UNIQUE, NOT NULL | QR encoded data |
| status | VARCHAR(20) | DEFAULT 'VALID' | VALID, USED, EXPIRED, CANCELLED |
| checked_in | BOOLEAN | DEFAULT FALSE | Check-in status |
| checked_in_at | TIMESTAMP | | Check-in time |
| checked_in_by_id | UUID | FK → users_user | Staff who checked in |
| created_at | TIMESTAMP | AUTO | Creation timestamp |
| updated_at | TIMESTAMP | AUTO | Update timestamp |

### tickets_visitorlog

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| ticket_id | UUID | FK → tickets_ticket | Related ticket |
| first_name | VARCHAR(150) | NOT NULL | Visitor first name |
| last_name | VARCHAR(150) | NOT NULL | Visitor last name |
| phone | VARCHAR(20) | NOT NULL | Phone number |
| email | VARCHAR(254) | NOT NULL | Email |
| photo | VARCHAR(100) | | Photo path |
| showtime_id | UUID | FK → venues_showtime | Visited showtime |
| entered_at | TIMESTAMP | AUTO | Entry timestamp |
| logged_by_id | UUID | FK → users_user | Staff who logged |
| notes | TEXT | | Notes |

---

## Indexes (Recommended)

```sql
-- Users
CREATE INDEX idx_users_email ON users_user(email);
CREATE INDEX idx_users_role ON users_user(role);

-- Cinemas
CREATE INDEX idx_cinema_city ON venues_cinema(city);
CREATE INDEX idx_cinema_active ON venues_cinema(is_active);

-- Rooms
CREATE INDEX idx_room_cinema ON venues_room(cinema_id);

-- Movies
CREATE INDEX idx_movie_active ON venues_movie(is_active);
CREATE INDEX idx_movie_release ON venues_movie(release_date);

-- Showtimes
CREATE INDEX idx_showtime_movie ON venues_showtime(movie_id);
CREATE INDEX idx_showtime_room ON venues_showtime(room_id);
CREATE INDEX idx_showtime_time ON venues_showtime(start_time);
CREATE INDEX idx_showtime_active_time ON venues_showtime(is_active, start_time);

-- Reservations
CREATE INDEX idx_reservation_user ON reservations_reservation(user_id);
CREATE INDEX idx_reservation_showtime ON reservations_reservation(showtime_id);
CREATE INDEX idx_reservation_status ON reservations_reservation(status);

-- Tickets
CREATE INDEX idx_ticket_qr ON tickets_ticket(qr_data);
CREATE INDEX idx_ticket_status ON tickets_ticket(status);

-- Visitor Logs
CREATE INDEX idx_visitor_showtime ON tickets_visitorlog(showtime_id);
CREATE INDEX idx_visitor_entered ON tickets_visitorlog(entered_at);
```

---

## Enums

### User Roles
- `ADMIN` - Full system access
- `TICKET_MANAGER` - Venue and ticket management
- `USER` - Regular user (can book)

### Movie Ratings
- `G` - General Audiences
- `PG` - Parental Guidance
- `PG-13` - Parents Strongly Cautioned
- `R` - Restricted
- `NC-17` - Adults Only

### Reservation Status
- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Confirmed, ticket issued
- `CANCELLED` - Cancelled by user/system
- `COMPLETED` - User attended

### Ticket Status
- `VALID` - Ready to use
- `USED` - Already checked in
- `EXPIRED` - Showtime passed
- `CANCELLED` - Reservation cancelled
