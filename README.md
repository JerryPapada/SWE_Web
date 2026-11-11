# Web Software Engineering

Full-stack cinema reservation system developed for postgraduate Web Software Engineering coursework.

## Overview

The application provides cinema, room, movie, showtime, seat, reservation, ticket, and visitor-management workflows. It includes a Django REST backend and a frontend application, with authentication, role-based authorization, and transactional seat reservation.

## Technology

- Django 4.2 and Django REST Framework
- PostgreSQL
- JWT authentication
- Google OAuth
- React frontend
- Docker Compose

## Main workflows

- Browse cinemas, movies, rooms, and showtimes
- Register and authenticate users
- Select seats and create reservations safely
- Generate tickets and reservation history
- Validate tickets and record cinema visits
- Manage venues and schedules as staff

## Run locally

```bash
docker compose up --build
```

See the backend and frontend directories for service-specific setup instructions. `Caddyfile` contains the local reverse-proxy configuration.

## Architecture

The backend is organized around users, venues, reservations, tickets, notifications, and visitor logs. Reservation creation uses database transactions and row locking to prevent conflicting seat assignments.
