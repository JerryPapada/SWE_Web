# Cinema Reservation Web Application

Full-stack cinema and ticketing coursework project with a Django REST backend, React frontend, PostgreSQL database, and Docker Compose/Caddy deployment configuration.

## Main workflows

- Browse cinemas, rooms, films, and showtimes.
- Register and authenticate users.
- Select seats and create reservations.
- Generate tickets and view reservation history.
- Support staff workflows for schedules, venues, and ticket validation.

The backend separates users, reservations, tickets, notifications, and visitor records into domain apps. The project documentation describes transactional reservation creation and row locking for seat conflicts. The frontend consumes the API and the Compose stack includes the database and reverse proxy.

## Local environment configuration

## Local environment configuration

Before running the Compose stack, copy `.env.example` to `.env`. Set `DATABASE_URL`, `SECRET_KEY`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`; use matching database values in the URL and PostgreSQL service. Email and Google sign-in credentials are optional for startup, but the corresponding features need valid provider configuration. The backend template at `backend/.env.example` is for configuring the backend outside Compose; copy it to `backend/.env` and fill the same application settings when using that workflow. Both local environment files are ignored by Git.

## Run locally

Requirements: Docker Engine and Docker Compose.

```bash
docker compose up --build
```

The Compose file starts the backend, frontend, database, and Caddy. Review Caddyfile, Django settings, and backend/.env.example for local endpoint, OAuth, and email configuration. Use the repository's current Compose port mappings when opening the frontend/API; those mappings can differ from a production deployment.

Stop the local stack with:

```bash
docker compose down
```

## Security and deployment

This public repository contains static mail/database credential values in Compose, and the example environment file has defaults. Treat any real/reused values as exposed and rotate them. Replace defaults through private runtime configuration before deployment. Review OAuth callback URLs, email settings, and Caddy routing separately for each environment; local Compose settings are not production-ready.