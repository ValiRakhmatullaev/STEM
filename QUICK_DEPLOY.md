# ⚡ Быстрый деплой на сервер

## 🎯 За 5 минут до production

### 1️⃣ На локальном компьютере

```bash
# Проверьте, что всё работает
cd /Users/valijonrakhmatullaev/PycharmProjects/STEM
cd frontend && npm run build && cd ..

# Создайте архив проекта
cd ..
tar -czf STEM.tar.gz STEM/
```

### 2️⃣ На сервере (первый раз)

```bash
# Установите Docker (если ещё не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Настройте firewall
ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw enable
```

### 3️⃣ Загрузите проект на сервер

**Вариант A: Через SCP**
```bash
# На локальном компьютере
scp STEM.tar.gz root@YOUR_SERVER_IP:/opt/

# На сервере
cd /opt
tar -xzf STEM.tar.gz
cd STEM
```

**Вариант B: Через Git**
```bash
# На сервере
cd /opt
git clone YOUR_GIT_REPO_URL STEM
cd STEM
```

### 4️⃣ Настройте окружение

```bash
# Создайте production конфигурацию
cp .env.production.example .env.production
nano .env.production
```

**Минимальные изменения в `.env.production`:**
```bash
DJANGO_SECRET_KEY=<сгенерируйте: python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())">
DJANGO_ALLOWED_HOSTS=YOUR_DOMAIN.com,YOUR_SERVER_IP
DATABASE_PASSWORD=<сильный-пароль>
DJANGO_CORS_ALLOWED_ORIGINS=https://YOUR_DOMAIN.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://YOUR_DOMAIN.com
```

### 5️⃣ Запустите деплой

```bash
./deploy.sh
```

### 6️⃣ Создайте админа

```bash
docker compose --env-file .env.production exec backend python manage.py createsuperuser
```

### 7️⃣ Готово! 🎉

Откройте в браузере:
- **Сайт:** `http://YOUR_SERVER_IP` или `http://YOUR_DOMAIN.com`
- **Админка:** `http://YOUR_SERVER_IP/admin`

---

## 🔄 Обновление (после изменений)

```bash
cd /opt/STEM
git pull  # или загрузите новый архив
./deploy.sh
```

---

## 💾 Backup базы данных

```bash
# Автоматический backup (каждый день в 3:00)
crontab -e
# Добавьте: 0 3 * * * cd /opt/STEM && ./backup.sh

# Ручной backup
./backup.sh
```

---

## 🛠️ Полезные команды

```bash
# Логи
docker compose --env-file .env.production logs -f

# Перезапуск
docker compose --env-file .env.production restart

# Остановка
docker compose --env-file .env.production down

# Django shell
docker compose --env-file .env.production exec backend python manage.py shell
```

---

## 📚 Подробная инструкция

Смотрите `DEPLOY_PRODUCTION.md` для детальной информации по:
- Настройке HTTPS/SSL
- Troubleshooting
- Мониторингу
- Безопасности
