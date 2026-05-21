# STEM Woman Uzbekistan — Frontend

Фронтенд на **React 18**, **TypeScript**, **Vite** и **Tailwind CSS**.

## Запуск

```bash
cd frontend
npm install
npm run dev
```

Откройте в браузере: [http://localhost:5173](http://localhost:5173).

## Сборка

```bash
npm run build
```

Результат в папке `dist/`.

## Прокси на бэкенд

В режиме разработки запросы на `/api`, `/admin` и `/media` проксируются на `http://127.0.0.1:8000`. Запустите Django (`python manage.py runserver`) для работы с API.

## Страницы

- **/** — главная  
- **/events** — мероприятия  
- **/jobs** — вакансии  
- **/companies** — компании  
- **/career-fairs** — карьерные ярмарки  
- **/mentorship** — менторство  
- **/login**, **/register** — вход и регистрация  

Сейчас на страницах используются заглушки; после добавления API в Django данные можно подключать через `fetch` или axios.
