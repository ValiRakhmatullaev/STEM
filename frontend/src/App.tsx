import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import RequireAuth from "./components/RequireAuth";

// Главная
import Home from "./pages/Home";

// Мероприятия
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import EventTicket from "./pages/EventTicket";
import MyEvents from "./pages/MyEvents";

// Вакансии
import Jobs from "./pages/Jobs";
import JobDetail from "./pages/JobDetail";
import MyApplications from "./pages/MyApplications";

// Компании
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";

// Карьерные ярмарки
import CareerFairs from "./pages/CareerFairs";
import CareerFairDetail from "./pages/CareerFairDetail";

// Новости
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";

// FAQ
import Faq from "./pages/Faq";

// Контакты
import Contacts from "./pages/Contacts";
import About from "./pages/About";

// Админ-панель
import AdminDashboard from "./pages/AdminDashboard";
import AdminCheckins from "./pages/AdminCheckins";
import CheckinsLite from "./pages/CheckinsLite";

// Presence checker
import PresenceChecker from "./pages/PresenceChecker";
import Participants from "./pages/Participants";

// Компании (аккаунт)
import CompanyRegister from "./pages/CompanyRegister";
import CompanyDashboard from "./pages/CompanyDashboard";

// Авторизация (без Layout)
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Routes>
      {/* Основной layout для всех защищённых/основных страниц */}
      <Route path="/" element={<Layout />}>
        {/* Главная */}
        <Route index element={<Home />} />

        {/* Мероприятия */}
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="events/:id/ticket" element={<EventTicket />} />
        <Route path="my-events" element={<RequireAuth><MyEvents /></RequireAuth>} />

        {/* Вакансии */}
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="my-applications" element={<RequireAuth><MyApplications /></RequireAuth>} />

        {/* Компании */}
        <Route path="companies" element={<Companies />} />
        <Route path="companies/:id" element={<CompanyDetail />} />

        {/* Карьерные ярмарки */}
        <Route path="career-fairs" element={<CareerFairs />} />
        <Route path="career-fairs/:id" element={<CareerFairDetail />} />

        {/* Новости: список и детальная страница */}
        <Route path="news" element={<News />} />
        <Route path="news/:id" element={<NewsDetail />} />

        <Route path="faq" element={<Faq />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="about" element={<About />} />

        {/* Панель администратора (доступ по is_staff) */}
        <Route path="admin" element={<RequireAuth requireStaff><AdminDashboard /></RequireAuth>} />
        <Route path="admin/checkins" element={<RequireAuth requirePresenceChecker><AdminCheckins /></RequireAuth>} />

        {/* Presence checker (доступ по is_presence_checker) */}
        <Route path="presence-checker" element={<RequireAuth requirePresenceChecker><PresenceChecker /></RequireAuth>} />
        <Route path="participants" element={<RequireAuth requirePresenceChecker><Participants /></RequireAuth>} />
      </Route>

      {/* Страницы авторизации — без Layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register-company" element={<CompanyRegister />} />

      {/* Панель компании — без Layout */}
      <Route path="/company" element={<CompanyDashboard />} />
      {/* Checkins pages without Layout (safe fallback) */}
      <Route path="/checkins-panel" element={<AdminCheckins />} />
      <Route path="/checkins-lite" element={<CheckinsLite />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;