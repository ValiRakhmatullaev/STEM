import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, User, QrCode, Menu, X, BadgeCheck, Users, Building2, Briefcase } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../api";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string;
  is_read: boolean;
  created_at: string | null;
};

const navLinks = [
  { to: "/", key: "navbar.home" },
  { to: "/events", key: "navbar.events" },
  { to: "/my-events", key: "navbar.myEvents" },
  { to: "/jobs", key: "navbar.jobs" },
  { to: "/companies", key: "navbar.companies" },
  { to: "/career-fairs", key: "navbar.careerFairs" },
  { to: "/contacts", key: "navbar.contacts" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const languageOptions = useMemo(
    () => [
      { code: "ru" as const, flag: "🇷🇺", label: "Русский" },
      { code: "uz" as const, flag: "🇺🇿", label: "O'zbek" },
      { code: "en" as const, flag: "🇬🇧", label: "English" },
    ],
    [],
  );

  const { locale, setLocale, t } = useLanguage();
  const currentLang = languageOptions.find((l) => l.code === locale) || languageOptions[0];

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    try {
      const [notifRes, chatRes] = await Promise.all([
        apiFetch("/api/notifications/"),
        apiFetch("/api/chat/rooms/"),
      ]);

      let notificationUnread = 0;
      let chatUnread = 0;

      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotifications(data.results || []);
        notificationUnread = (data.results || []).filter((n: any) => !n.is_read).length;
      }

      if (chatRes.ok) {
        const chatData = await chatRes.json();
        chatUnread = (chatData.results || []).reduce((sum: number, room: any) => sum + room.unread_count, 0);
      }

      setUnreadCount(notificationUnread + chatUnread);
    } catch {
      // ignore
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const iv = setInterval(fetchNotifications, 30000);
    return () => clearInterval(iv);
  }, [user, fetchNotifications]);

  useEffect(() => {
    // Close language dropdown + notifications dropdown on outside click.
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;

      if (langMenuOpen && langMenuRef.current && !langMenuRef.current.contains(target)) {
        setLangMenuOpen(false);
      }
      if (
        notificationsOpen &&
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [langMenuOpen, notificationsOpen]);

  const openNotifications = useCallback(async () => {
    setNotificationsOpen((prev) => !prev);
    if (notificationsOpen) return;
    await fetchNotifications();
  }, [notificationsOpen, fetchNotifications]);

  const markAsRead = useCallback(
    async (id: number, link: string) => {
      try {
        await apiFetch(`/api/notifications/${id}/read/`, {
          method: "POST",
        });
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((list) => list.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      } catch {
        // no-op
      }

      if (link) navigate(link);
      setNotificationsOpen(false);
    },
    [navigate],
  );

  const markAllRead = useCallback(async () => {
    try {
      await apiFetch("/api/notifications/mark-all-read/", {
        method: "POST",
      });
      setUnreadCount(0);
      setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
    } catch {
      // no-op
    }
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-purple-100/50 shadow-sm">
      <nav className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          to="/"
          className="group flex-shrink-0 flex items-center relative"
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
        >
          {/* Фоновое свечение вокруг логотипа */}
          <motion.div
            className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-pink-400/30 blur-2xl"
            animate={{
              scale: logoHovered ? 1.3 : 1,
              opacity: logoHovered ? 0.6 : 0.3,
            }}
            transition={{ duration: 0.4 }}
          />

          <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <motion.img
              src="/STEM_FOTO.png"
              alt="STEM Woman Uzbekistan"
              className="h-12 w-auto md:h-14 lg:h-16 object-contain drop-shadow-xl"
              animate={{
                y: logoHovered ? [0, -1, 0] : 0,
              }}
              transition={{
                duration: 2,
                repeat: logoHovered ? Infinity : 0,
                ease: "easeInOut",
              }}
            />

            {/* Блик при наведении */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
              initial={{ x: "-100%" }}
              animate={{ x: logoHovered ? "200%" : "-100%" }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>
        </Link>

        {/* Desktop center links */}
        <ul className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ to, key }) => (
            <li key={to}>
              <Link
                to={to}
                className={`relative px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  location.pathname === to
                    ? "text-pink-700"
                    : "text-gray-600 hover:text-pink-600"
                }`}
              >
                {location.pathname === to && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-white rounded-2xl shadow-md border border-pink-100"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 whitespace-nowrap leading-none">{t(key)}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop right: language + actions */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <div className="relative group" ref={langMenuRef}>
            <button
              type="button"
              onClick={() => setLangMenuOpen((v) => !v)}
              aria-label="Language"
              className="h-8 w-8 rounded-xl flex items-center justify-center bg-white/60 backdrop-blur-sm border border-purple-100/60 hover:bg-white/80 text-base transition-all"
            >
              {currentLang.flag}
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 top-full mt-2 rounded-2xl bg-white/85 backdrop-blur-xl border border-purple-100/60 shadow-lg p-1">
                <div className="flex items-center gap-1">
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        setLocale(opt.code);
                        setLangMenuOpen(false);
                      }}
                      className={`h-8 w-8 rounded-xl flex items-center justify-center text-base transition-all ${
                        locale === opt.code
                          ? "bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 text-white shadow-sm"
                          : "bg-white/70 text-gray-600 hover:bg-pink-50"
                      }`}
                    >
                      {opt.flag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="w-10 h-10 bg-gray-200 rounded-2xl animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* Presence checker links */}
              {user.is_presence_checker && (
                <>
                  <Link
                    to="/participants"
                    className="p-3 rounded-2xl text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-all flex items-center gap-2"
                    title="Все участники"
                  >
                    <Users className="w-5 h-5" />
                  </Link>
                  <Link
                    to="/presence-checker"
                    className="p-3 rounded-2xl text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-all flex items-center gap-2"
                    title="QR сканер"
                  >
                    <QrCode className="w-5 h-5" />
                  </Link>
                </>
              )}

              {/* Company dashboard link */}
              {user.is_company_user && (
                <Link
                  to="/company"
                  className="p-3 rounded-2xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2"
                  title="Company Dashboard"
                >
                  <Building2 className="w-5 h-5" />
                </Link>
              )}

              {/* My applications link for candidates */}
              {!user.is_company_user && (
                <Link
                  to="/my-applications"
                  className="p-3 rounded-2xl text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-all flex items-center gap-2"
                  title="My Applications"
                >
                  <Briefcase className="w-5 h-5" />
                </Link>
              )}

              {/* Admin link */}
              {user.is_staff && (
                <Link
                  to="/admin"
                  className="p-3 rounded-2xl text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-all flex items-center gap-2"
                >
                  <span className="sr-only">{t("navbar.admin")}</span>
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  type="button"
                  onClick={openNotifications}
                  className="p-3 rounded-2xl text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all relative"
                  aria-label={t("navbar.notifications")}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-pink-500 text-white text-[11px] flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-[360px] rounded-2xl bg-white/90 backdrop-blur-xl border border-purple-100/60 shadow-lg overflow-hidden"
                    >
                      <div className="p-3 border-b border-purple-100/50 flex items-center justify-between">
                        <div className="font-semibold text-gray-900 text-sm">
                          {t("navbar.notifications")}
                        </div>
                        <button
                          type="button"
                          onClick={markAllRead}
                          className="text-xs text-gray-500 hover:text-pink-600 transition-colors"
                        >
                          {t("navbar.readAll")}
                        </button>
                      </div>

                      <div className="p-3">
                        {notificationsLoading ? (
                          <div className="text-sm text-gray-500">{t("navbar.loadingNotifications")}</div>
                        ) : notifications.length === 0 ? (
                          <div className="text-sm text-gray-500">{t("navbar.noNotifications")}</div>
                        ) : (
                          <ul className="space-y-2 max-h-[320px] overflow-auto pr-1">
                            {notifications.map((n) => (
                              <li key={n.id}>
                                <button
                                  type="button"
                                  onClick={() => markAsRead(n.id, n.link)}
                                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                                    n.is_read
                                      ? "bg-white/70 border-gray-100 hover:bg-pink-50/60 border-transparent"
                                      : "bg-pink-50/60 border-pink-200 hover:bg-pink-50/80"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-gray-900">
                                        {n.title}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                        {n.message}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Logout + user info */}
              <button
                onClick={logout}
                className="p-3 rounded-2xl text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all"
                aria-label={t("navbar.logout")}
              >
                <LogOut className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                    {user.username}
                    {user.is_verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
                  </span>
                  <span className="text-xs text-gray-500 truncate max-w-[120px]">{user.email}</span>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-pink-500/20"
                >
                  {user.username?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                </motion.div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="p-3 rounded-2xl text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all text-sm font-medium"
              >
                {t("navbar.login")}
              </Link>
              <Link
                to="/register"
                className="p-3 rounded-2xl text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all text-sm font-medium"
              >
                {t("navbar.register")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile right: burger */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="p-3 rounded-2xl text-gray-600 hover:text-pink-600 hover:bg-pink-50 transition-all"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden border-t border-purple-100/50 bg-white/90 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-4">
              <ul className="space-y-1">
                {navLinks.map(({ to, key }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        location.pathname === to
                          ? "bg-pink-50/70 text-pink-700"
                          : "text-gray-600 hover:bg-pink-50/60 hover:text-pink-600"
                      }`}
                    >
                      {t(key)}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Extra actions */}
              {loading ? null : user ? (
                <div className="space-y-2">
                  {user.is_presence_checker && (
                    <>
                      <Link
                        to="/participants"
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white/70 border border-purple-100/60 hover:bg-pink-50/50 transition-all"
                      >
                        <Users className="w-5 h-5 text-pink-600" />
                        Участники
                      </Link>
                      <Link
                        to="/presence-checker"
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white/70 border border-purple-100/60 hover:bg-pink-50/50 transition-all"
                      >
                        <QrCode className="w-5 h-5 text-pink-600" />
                        {t("navbar.qrCheck")}
                      </Link>
                    </>
                  )}

                  {user.is_company_user && (
                    <Link
                      to="/company"
                      onClick={() => setMobileOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white/70 border border-blue-100/60 hover:bg-blue-50/50 transition-all"
                    >
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span>Company Dashboard</span>
                    </Link>
                  )}

                  {user.is_staff && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white/70 border border-purple-100/60 hover:bg-pink-50/50 transition-all"
                    >
                      <User className="w-5 h-5 text-pink-600" />
                      {t("navbar.admin")}
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white/70 border border-purple-100/60 hover:bg-pink-50/50 transition-all"
                  >
                    <LogOut className="w-5 h-5 text-pink-600" />
                    {t("navbar.logout")}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white/70 border border-purple-100/60 hover:bg-pink-50/50 transition-all"
                  >
                    {t("navbar.login")}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-white/70 border border-purple-100/60 hover:bg-pink-50/50 transition-all"
                  >
                    {t("navbar.register")}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

