# Deploy (Docker + Postgres + Nginx + Gunicorn)

## Prerequisites

- Docker + Docker Compose installed on the server

## 1) Configure environment

Copy `.env.docker` to a real env file and edit values:

- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS` (domain/IPs)
- `DATABASE_PASSWORD`
- `DJANGO_CORS_ALLOWED_ORIGINS` (your public frontend URL)
- `DJANGO_CSRF_TRUSTED_ORIGINS` (your public frontend URL)

## 2) Build and start

```bash
docker compose up -d --build
```

This will:

- start Postgres
- run Django migrations
- run `collectstatic`
- start Gunicorn
- start Nginx which serves the frontend and proxies `/api` and `/admin`

## 3) Create superuser

```bash
docker compose exec backend python manage.py createsuperuser
```

## 4) URLs

- Frontend: `http://<server>/`
- Admin: `http://<server>/admin/`
- API: `http://<server>/api/...`

## Notes

- Static files are collected to Docker volume `static_volume` and served by nginx at `/static/`.
- Media files are stored in Docker volume `media_volume` and served by nginx at `/media/`.
