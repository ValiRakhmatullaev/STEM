import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { apiFetch } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { pickLocalized } from "../utils/localizedContent";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  CheckCircle2,
  ArrowRight,
  QrCode,
} from "lucide-react";

type MyEventItem = {
  id: number;
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  description?: string;
  description_ru?: string;
  description_uz?: string;
  description_en?: string;
  event_type: string;
  date: string;
  time: string;
  duration_minutes: number;
  location: string;
  is_online: boolean;
  is_waitlist: boolean;
  organizer_confirmed?: boolean;
  registered_count: number;
  capacity: number;
};

function getDateLocale(locale: "ru" | "uz" | "en"): string {
  if (locale === "uz") return "uz-UZ";
  if (locale === "en") return "en-US";
  return "ru-RU";
}

function formatDate(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ====================== 3D TiltCard ======================
const TiltCard = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 110, damping: 22 });
  const mouseY = useSpring(y, { stiffness: 110, damping: 22 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    x.set((e.clientX - centerX) / 13);
    y.set((e.clientY - centerY) / 13);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX: mouseY, rotateY: mouseX, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.015 }}
    >
      {children}
    </motion.div>
  );
};

// ====================== 3D ФОН ======================
const Background3D = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "2000px" }}>
    {/* Большой вращающийся элемент */}
    <motion.div
      className="absolute -top-40 -right-40 w-[900px] h-[900px]"
      animate={{ rotateY: 360, rotateX: 20 }}
      transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-purple-500/10 rounded-full blur-3xl" />
    </motion.div>

    {/* Плавающие частицы */}
    {Array.from({ length: 25 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2.5 h-2.5 bg-gradient-to-br from-pink-400/40 to-purple-400/40 rounded-full backdrop-blur-md"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -220, 0],
          x: [0, Math.random() * 100 - 50, 0],
          opacity: [0.2, 0.7, 0.2],
          scale: [0.8, 1.3, 0.8],
        }}
        transition={{
          duration: Math.random() * 28 + 18,
          repeat: Infinity,
          delay: Math.random() * 12,
        }}
      />
    ))}
  </div>
);

export default function MyEvents() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [events, setEvents] = useState<MyEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const dateLocale = getDateLocale(locale);

  const typeLabel = (eventType: string) => {
    if (eventType === "meetup") return t("myEvents.typeMeetup");
    if (eventType === "workshop") return t("myEvents.typeWorkshop");
    if (eventType === "career_fair") return t("myEvents.typeCareerFair");
    if (eventType === "networking") return t("myEvents.typeNetworking");
    if (eventType === "webinar") return t("myEvents.typeWebinar");
    return eventType;
  };

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    apiFetch("/api/events/my-registrations/")
      .then((res) => res.json())
      .then((data) => setEvents(data.results || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50 flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <Calendar className="w-10 h-10 text-pink-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("myEvents.loginTitle")}</h2>
          <p className="text-gray-600 mb-8">{t("myEvents.loginSubtitle")}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:brightness-105"
          >
            {t("myEvents.loginButton")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/70 to-purple-50/40 relative overflow-hidden">

      {/* 3D Фон */}
      <Background3D />

      <div className="relative max-w-5xl mx-auto px-6 py-12 lg:py-16 z-10">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-pink-200 text-pink-700 font-medium shadow-sm">
            <Calendar className="w-5 h-5" />
            {t("myEvents.badge")}
          </span>
          <h1 className="font-display font-bold text-5xl lg:text-6xl text-gray-900 mt-6 tracking-tighter">
            {t("myEvents.title")}
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            {t("myEvents.subtitle")}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-white/50 backdrop-blur rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <Calendar className="w-12 h-12 text-pink-400" />
              </div>
              <h3 className="text-3xl font-semibold text-gray-900 mb-4">{t("myEvents.emptyTitle")}</h3>
              <p className="text-gray-600 mb-8">{t("myEvents.emptySubtitle")}</p>
              <Link
                to="/events"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-medium hover:brightness-105"
              >
                {t("myEvents.browseButton")} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <TiltCard key={event.id}>
                  <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl overflow-hidden h-full flex flex-col">
                    <div className="p-7 flex-1">
                      <div className="flex items-center gap-3 mb-5">
                        <span className="px-4 py-1.5 text-xs font-medium bg-pink-50 text-pink-700 rounded-xl border border-pink-200">
                          {typeLabel(event.event_type)}
                        </span>
                      </div>

                      <h3 className="font-bold text-2xl text-gray-900 leading-tight mb-6 line-clamp-2">
                        {pickLocalized(event, "title", locale)}
                      </h3>

                      <div className="space-y-4 text-sm text-gray-700 mb-8">
                        <div className="flex gap-3">
                          <Calendar className="w-5 h-5 text-pink-500 mt-0.5 flex-shrink-0" />
                          <div>{formatDate(event.date, dateLocale)} • {event.time}</div>
                        </div>
                        <div className="flex gap-3">
                          <Clock className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
                          <div>{event.duration_minutes} {t("myEvents.minutes")}</div>
                        </div>
                        <div className="flex gap-3">
                          {event.is_online ? (
                            <Video className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <MapPin className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div>{event.is_online ? t("common.online") : (event.location || t("common.offline"))}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-gray-600 mb-6">
                        <Users className="w-4 h-4" />
                        <span>{event.registered_count} / {event.capacity}</span>
                      </div>

                      <div className="mb-7">
                        <span
                          className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-medium border ${
                            event.organizer_confirmed === false || event.is_waitlist
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {event.organizer_confirmed === false
                            ? t("myEvents.statusWaitingConfirm")
                            : event.is_waitlist
                            ? t("myEvents.statusWaitlist")
                            : t("myEvents.statusRegistered")}
                        </span>
                      </div>
                    </div>

                    <div className="border-t p-7 flex gap-3 mt-auto">
                      <Link
                        to={`/events/${event.id}/ticket`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:brightness-105 transition-all"
                      >
                        <QrCode className="w-4 h-4" />
                        {t("myEvents.ticket")}
                      </Link>
                      <Link
                        to={`/events/${event.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 border border-pink-200 text-pink-700 rounded-2xl hover:bg-pink-50 transition-all"
                      >
                        {t("myEvents.details")}
                      </Link>
                    </div>
                  </div>
                </TiltCard>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
