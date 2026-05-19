import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./layout/Layout";
import RequireAuth from "./components/RequireAuth";

const Home = lazy(() => import("./pages/Home"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const EventTicket = lazy(() => import("./pages/EventTicket"));
const MyEvents = lazy(() => import("./pages/MyEvents"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobDetail = lazy(() => import("./pages/JobDetail"));
const MyApplications = lazy(() => import("./pages/MyApplications"));
const Companies = lazy(() => import("./pages/Companies"));
const CompanyDetail = lazy(() => import("./pages/CompanyDetail"));
const CareerFairs = lazy(() => import("./pages/CareerFairs"));
const CareerFairDetail = lazy(() => import("./pages/CareerFairDetail"));
const News = lazy(() => import("./pages/News"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const Faq = lazy(() => import("./pages/Faq"));
const Contacts = lazy(() => import("./pages/Contacts"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminCheckins = lazy(() => import("./pages/AdminCheckins"));
const CheckinsLite = lazy(() => import("./pages/CheckinsLite"));
const PresenceChecker = lazy(() => import("./pages/PresenceChecker"));
const Participants = lazy(() => import("./pages/Participants"));
const CompanyRegister = lazy(() => import("./pages/CompanyRegister"));
const CompanyDashboard = lazy(() => import("./pages/CompanyDashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const NotFound = lazy(() => import("./pages/NotFound"));
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
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="terms" element={<TermsOfUse />} />

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
