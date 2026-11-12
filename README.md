# Cinema Reservation Web Application

Full-stack cinema and ticketing coursework application with a Django REST backend, React frontend, PostgreSQL, and Docker Compose.

## Features

- Browse cinemas, rooms, movies, and showtimes.
- Register/authenticate users and manage reservations.
- Select seats and create reservation records.
- Generate tickets and view reservation history.
- Staff workflows for schedules, venues, and ticket validation.

The backend is organized into domain apps for users, reservations, tickets, notifications, and visitor records. The README describes transactional reservation creation and row locking for seat conflicts.

## Run locally

Requirements: Docker Engine and Docker Compose.

```bash
docker compose up --build
```

The Compose stack starts the backend, frontend, database, and Caddy reverse proxy. Review `Caddyfile`, backend settings, and `backend/.env.example` for local endpoint and OAuth/email configuration.

## Security

This repository is public, and the current Compose configuration contains static mail/database credential values. Treat those as exposed: rotate any real or reused credential and move secrets into an appropriate private runtime configuration. The checked-in example configuration also contains defaults and must not be treated as production-ready.
