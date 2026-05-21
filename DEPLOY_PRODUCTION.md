# 🚀 Production Deployment Guide

Пошаговая инструкция по деплою STEM Woman Uzbekistan на production сервер.

---

## 📋 Предварительные требования

### На вашем локальном компьютере:
- [x] Git установлен
- [x] Проект готов к деплою

### На сервере (VPS/Dedicated):
- [ ] Ubuntu 20.04+ или другой Linux дистрибутив
- [ ] Docker и Docker Compose установлены
- [ ] Минимум 2GB RAM, 20GB диска
- [ ] Открыты порты: 80 (HTTP), 443 (HTTPS), 22 (SSH)
- [ ] Доменное имя настроено (опционально, но рекомендуется)

---

## 🔧 Шаг 1: Подготовка сервера

### 1.1 Подключитесь к серверу
```bash
ssh root@your-server-ip
```

### 1.2 Обновите систему
```bash
apt update && apt upgrade -y
```

### 1.3 Установите Docker
```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавьте пользователя в группу docker (опционально)
usermod -aG docker $USER

# Проверка установки
docker --version
docker compose version
```

### 1.4 Установите дополнительные утилиты
```bash
apt install -y git ufw fail2ban
```

### 1.5 Настройте firewall
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

---

## 📦 Шаг 2: Загрузка проекта на сервер

### Вариант A: Через Git (рекомендуется)

```bash
# На сервере
cd /opt
git clone https://github.com/your-username/STEM.git
cd STEM
```

### Вариант B: Через SCP (если нет Git репозитория)

```bash
# На локальном компьютере
cd /Users/valijonrakhmatullaev/PycharmProjects
tar -czf STEM.tar.gz STEM/
scp STEM.tar.gz root@your-server-ip:/opt/

# На сервере
cd /opt
tar -xzf STEM.tar.gz
cd STEM
```

---

## ⚙️ Шаг 3: Конфигурация для Production

### 3.1 Создайте production environment файл
```bash
cp .env.production.example .env.production
nano .env.production
```

### 3.2 Заполните реальные значения в `.env.production`:

```bash
# Django Settings
DJANGO_DEBUG=False
DJANGO_SECRET_KEY=<сгенерируйте ниже>
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com,your-server-ip

# Database
DATABASE_NAME=stem_production
DATABASE_USER=stem_user
DATABASE_PASSWORD=<сильный пароль>

# CORS & CSRF
DJANGO_CORS_ALLOWED_ORIGINS=https://your-domain.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-domain.com

# Public URL
CHECKIN_PUBLIC_BASE_URL=https://your-domain.com
```

### 3.3 Сгенерируйте SECRET_KEY
```bash
# Запустите на сервере:
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Скопируйте вывод в DJANGO_SECRET_KEY
```

---

## 🚀 Шаг 4: Деплой приложения

### 4.1 Запустите deployment скрипт
```bash
./deploy.sh
```

Скрипт автоматически:
- ✅ Проверит конфигурацию
- ✅ Соберёт Docker образы
- ✅ Запустит PostgreSQL, Django backend, Nginx
- ✅ Выполнит миграции базы данных
- ✅ Соберёт статические файлы
- ✅ Соберёт и развернёт React frontend

### 4.2 Создайте суперпользователя
```bash
docker compose --env-file .env.production exec backend python manage.py createsuperuser
```

Введите:
- Username: `admin`
- Email: `your-email@example.com`
- Password: `<сильный пароль>`

---

## 🔒 Шаг 5: Настройка HTTPS (SSL/TLS)

### 5.1 Установите Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 5.2 Остановите Nginx контейнер
```bash
docker compose --env-file .env.production stop nginx
```

### 5.3 Получите SSL сертификат
```bash
certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

### 5.4 Обновите nginx.conf для HTTPS

Создайте файл `nginx/nginx-ssl.conf`:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 25m;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ckeditor/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        alias /vol/static/;
        access_log off;
        expires 30d;
    }

    location /media/ {
        alias /vol/media/;
        access_log off;
        expires 7d;
    }
}
```

### 5.5 Обновите docker-compose.yml для SSL
Добавьте volumes для SSL сертификатов в nginx сервис:
```yaml
nginx:
  volumes:
    - static_volume:/vol/static
    - media_volume:/vol/media
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

### 5.6 Перезапустите с новой конфигурацией
```bash
docker compose --env-file .env.production up -d --force-recreate nginx
```

---

## 📊 Шаг 6: Проверка деплоя

### 6.1 Проверьте статус сервисов
```bash
docker compose --env-file .env.production ps
```

Все сервисы должны быть в статусе `Up`.

### 6.2 Проверьте логи
```bash
# Все логи
docker compose --env-file .env.production logs -f

# Только backend
docker compose --env-file .env.production logs -f backend

# Только nginx
docker compose --env-file .env.production logs -f nginx
```

### 6.3 Откройте сайт в браузере
- Frontend: `https://your-domain.com`
- Admin: `https://your-domain.com/admin`
- API: `https://your-domain.com/api/`

---

## 🔄 Шаг 7: Обновление приложения

### При изменениях в коде:
```bash
cd /opt/STEM
git pull origin main
./deploy.sh
```

### При изменениях в базе данных:
```bash
docker compose --env-file .env.production exec backend python manage.py makemigrations
docker compose --env-file .env.production exec backend python manage.py migrate
```

---

## 💾 Шаг 8: Резервное копирование

### 8.1 Настройте автоматический backup
```bash
# Создайте cron job для ежедневного бэкапа
crontab -e

# Добавьте строку (бэкап каждый день в 3:00 AM):
0 3 * * * cd /opt/STEM && ./backup.sh >> /var/log/stem-backup.log 2>&1
```

### 8.2 Ручной backup
```bash
./backup.sh
```

Бэкапы сохраняются в `./backups/` и автоматически сжимаются.

### 8.3 Восстановление из backup
```bash
# Распакуйте backup
gunzip backups/stem_backup_YYYYMMDD_HHMMSS.sql.gz

# Восстановите базу данных
docker compose --env-file .env.production exec -T db psql \
    -U stem_user \
    -d stem_production \
    < backups/stem_backup_YYYYMMDD_HHMMSS.sql
```

---

## 🛠️ Полезные команды

### Управление контейнерами
```bash
# Просмотр логов
docker compose --env-file .env.production logs -f [service]

# Перезапуск сервиса
docker compose --env-file .env.production restart [service]

# Остановка всех сервисов
docker compose --env-file .env.production down

# Запуск всех сервисов
docker compose --env-file .env.production up -d

# Django shell
docker compose --env-file .env.production exec backend python manage.py shell

# Django команды
docker compose --env-file .env.production exec backend python manage.py [command]
```

### Мониторинг ресурсов
```bash
# Использование ресурсов контейнерами
docker stats

# Дисковое пространство
df -h
docker system df
```

### Очистка
```bash
# Удаление неиспользуемых образов
docker image prune -a

# Удаление неиспользуемых volumes
docker volume prune

# Полная очистка
docker system prune -a --volumes
```

---

## 🔍 Troubleshooting

### Проблема: Контейнер не запускается
```bash
# Проверьте логи
docker compose --env-file .env.production logs [service]

# Проверьте конфигурацию
docker compose --env-file .env.production config
```

### Проблема: База данных не подключается
```bash
# Проверьте статус PostgreSQL
docker compose --env-file .env.production exec db pg_isready

# Проверьте переменные окружения
docker compose --env-file .env.production exec backend env | grep DATABASE
```

### Проблема: Static файлы не загружаются
```bash
# Пересоберите static файлы
docker compose --env-file .env.production exec backend python manage.py collectstatic --noinput

# Проверьте права доступа
docker compose --env-file .env.production exec backend ls -la /vol/static
```

### Проблема: Frontend не обновляется
```bash
# Пересоберите nginx контейнер
docker compose --env-file .env.production build --no-cache nginx
docker compose --env-file .env.production up -d --force-recreate nginx
```

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker compose --env-file .env.production logs -f`
2. Проверьте статус: `docker compose --env-file .env.production ps`
3. Проверьте конфигурацию: `.env.production`

---

## ✅ Чеклист деплоя

- [ ] Сервер настроен (Docker, firewall)
- [ ] Проект загружен на сервер
- [ ] `.env.production` создан и заполнен
- [ ] `deploy.sh` выполнен успешно
- [ ] Суперпользователь создан
- [ ] SSL сертификат установлен (для HTTPS)
- [ ] Сайт доступен через браузер
- [ ] Admin панель работает
- [ ] API отвечает корректно
- [ ] Настроен автоматический backup
- [ ] Документация сохранена

---

**Готово! Ваше приложение развёрнуто в production! 🎉**
