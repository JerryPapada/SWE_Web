# Cinema Ticket System - Backend Documentation

## Overview

This is a Django REST API backend for a cinema ticket reservation system. The system allows users to browse movies, make reservations, and receive tickets with QR codes for entry.

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Django 4.2 |
| API | Django REST Framework |
| Database | PostgreSQL 15 |
| Authentication | JWT (SimpleJWT) + OAuth 2.0 (django-allauth) |
| Containerization | Docker + Docker Compose |
| Documentation | drf-spectacular (OpenAPI/Swagger) |

---

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git

### Setup and Run

```bash
# Clone the repository
cd backend

# Copy environment file
cp .env.example .env

# Build and start containers
docker-compose up --build -d

# Wait for database to be ready
docker-compose logs -f db

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Access the application
# API: http://localhost:8000/api/
# Admin: http://localhost:8000/admin/
# Swagger Docs: http://localhost:8000/api/docs/
```

---

## Project Structure

```
backend/
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Django app container
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variables template
├── manage.py                  # Django CLI
├── config/                    # Django project configuration
│   ├── settings/
│   │   ├── base.py           # Base settings
│   │   └── development.py    # Development overrides
│   ├── urls.py               # URL routing
│   └── wsgi.py               # WSGI application
├── apps/                      # Django applications
│   ├── users/                # User management & authentication
│   ├── venues/               # Cinemas, rooms, movies, showtimes
│   ├── reservations/         # Booking management
│   └── tickets/              # Tickets & QR codes
├── docs/                     # Documentation
├── static/                   # Static files
└── media/                    # User uploads
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login with email/password |
| POST | `/api/auth/logout/` | Logout |
| POST | `/api/auth/registration/` | Register new user |
| POST | `/api/auth/token/refresh/` | Refresh JWT token |
| GET | `/api/auth/social/google/` | Google OAuth login |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register/` | Custom registration |
| GET/PUT | `/api/users/profile/` | User profile |
| POST | `/api/users/change-password/` | Change password |
| GET | `/api/users/manage/` | List users (admin) |
| POST | `/api/users/manage/{id}/assign_role/` | Assign role (admin) |

### Venues

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/venues/cinemas/` | List cinemas |
| GET | `/api/venues/cinemas/{id}/` | Cinema details |
| GET | `/api/venues/cinemas/{id}/rooms/` | Cinema rooms |
| GET | `/api/venues/cinemas/{id}/showtimes/` | Cinema showtimes |
| GET | `/api/venues/movies/` | List movies |
| GET | `/api/venues/movies/{id}/` | Movie details |
| GET | `/api/venues/movies/{id}/showtimes/` | Movie showtimes |
| GET | `/api/venues/showtimes/` | List showtimes |
| GET | `/api/venues/showtimes/calendar/` | Calendar view |
| GET | `/api/venues/showtimes/today/` | Today's showtimes |
| GET | `/api/venues/showtimes/upcoming/` | Next 7 days |

### Reservations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reservations/` | Create reservation |
| GET | `/api/reservations/my_reservations/` | User's reservations |
| GET | `/api/reservations/{id}/` | Reservation details |
| POST | `/api/reservations/{id}/cancel/` | Cancel reservation |
| GET | `/api/reservations/{id}/history/` | Status history |
| GET | `/api/reservations/admin/statistics/` | Statistics (admin) |

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tickets/my_tickets/` | User's tickets |
| POST | `/api/tickets/validate/` | Validate QR code |
| POST | `/api/tickets/checkin/` | Check-in ticket |
| POST | `/api/tickets/register/` | Visitor registration |
| POST | `/api/tickets/search/` | Search by phone/email |
| GET | `/api/tickets/visitors/today/` | Today's visitors |
| GET | `/api/tickets/visitors/by_showtime/` | Visitors by showtime |

---

## User Roles

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full system access, user management |
| `TICKET_MANAGER` | Manage venues, movies, showtimes, check-in |
| `USER` | Browse, make reservations, view own tickets |

---

## Environment Variables

```bash
# Django
DEBUG=1
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://user:password@db:5432/cinema_db

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# OAuth (Google)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Frontend (CORS)
FRONTEND_URL=http://localhost:4200
```

---

## Development Commands

```bash
# Run migrations
docker-compose exec web python manage.py migrate

# Create migrations
docker-compose exec web python manage.py makemigrations

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Run tests
docker-compose exec web python manage.py test

# Django shell
docker-compose exec web python manage.py shell

# View logs
docker-compose logs -f web

# Stop containers
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

---

## Testing the API

### Using curl

```bash
# Register
curl -X POST http://localhost:8000/api/auth/registration/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password1":"TestPass123!","password2":"TestPass123!"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123!"}'

# Use the token
curl http://localhost:8000/api/venues/movies/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Angular Integration

The backend is configured for Angular frontend at `http://localhost:4200`:

1. CORS is enabled for Angular dev server
2. JWT tokens use HttpOnly cookies
3. API endpoints are RESTful

### Angular HttpClient Example

```typescript
// auth.service.ts
login(email: string, password: string) {
  return this.http.post('/api/auth/login/', { email, password }, {
    withCredentials: true
  });
}

// movie.service.ts
getMovies() {
  return this.http.get<Movie[]>('/api/venues/movies/');
}
```

---

## License

University of Piraeus - Web Programming Course
