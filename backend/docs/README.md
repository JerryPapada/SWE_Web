# Cinema Ticket Backend

## What this is
A Django REST backend for a cinema reservation and ticket check-in system.

It supports:
- custom users with roles (`ADMIN`, `TICKET_MANAGER`, `USER`)
- cinemas, rooms, movies, and showtimes
- reservation creation/cancellation with seat tracking
- ticket generation with QR payloads
- ticket validation/check-in and visitor logs
- OpenAPI schema + Swagger UI

## Stack
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT auth (`simplejwt`, `dj-rest-auth`)
- Google OAuth support via `django-allauth`

## Run locally (Docker)
From `backend/`:

```bash
docker-compose up --build -d
docker-compose exec web python manage.py migrate
docker-compose exec web python manage.py createsuperuser
```

Main URLs:
- API root: `http://localhost:8000/api/`
- Admin: `http://localhost:8000/admin/`
- Swagger: `http://localhost:8000/api/docs/`
- OpenAPI schema: `http://localhost:8000/api/schema/`

## Main API groups
- `api/auth/` authentication endpoints (`dj-rest-auth`)
- `api/users/` registration, profile, password change, admin user management
- `api/venues/` cinemas, rooms, movies, showtimes + calendar/today/upcoming
- `api/reservations/` booking flow, cancellation, history, admin statistics
- `api/tickets/` my tickets, QR validation/check-in, visitor registration/search/logs

## Roles and permissions
- `ADMIN`: full access, user management, reservation stats
- `TICKET_MANAGER`: manage venue/showtime data and check-in operations
- `USER`: create/manage own reservations and view own tickets

## Notes
- Email sending defaults to Django console backend in development.
- Media uploads (posters/photos/QR images) are stored under `media/`.
- The API defaults to authenticated access unless explicitly opened per endpoint.

## Testing
Run tests from `backend/`:

```bash
docker-compose exec web python manage.py test
```
