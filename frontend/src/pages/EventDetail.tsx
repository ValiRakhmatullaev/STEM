import { useCallback, useEffect, useState, ReactNode, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../api";
import { pickLocalized } from "../utils/localizedContent";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Globe,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  QrCode,
  Loader2,
} from "lucide-react";

const TYPE_KEYS: Record<string, string> = {
  meetup: "typeMeetup",
  workshop: "typeWorkshop",
  career_fair: "typeCareerFair",
  networking: "typeNetworking",
  webinar: "typeWebinar",
};

type EventDetailData = {
  id: number;
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  slug: string;
  event_type: string;
  description: string;
  description_ru?: string;
  description_uz?: string;
  description_en?: string;
  date: string;
  time: string;
  duration_minutes: number;
  location: string;
  is_online: boolean;
  meeting_link: string;
  capacity: number;
  registered_count: number;
  waitlist_count?: number;
  banner_image: string | null;
  organizer: string;
};

function getDateLocale(locale: string): string {
  if (locale === "uz") return "uz-UZ";
  if (locale === "en") return "en-US";
  return "ru-RU";
}

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

// ====================== 3D Floating Particles ======================
const ED_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 15 + 8,
  duration: Math.random() * 20 + 10,
  delay: Math.random() * 5,
  xDrift: Math.random() * 40 - 20,
  zDrift: Math.random() * 80 - 40,
}));

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "1000px" }}>
    {ED_PARTICLES.map((p) => (
      <motion.div
        key={p.id}
        className="absolute rounded-full bg-gradient-to-br from-pink-300/40 to-purple-400/40 backdrop-blur-sm"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
          transformStyle: "preserve-3d",
        }}
        animate={{
          y: [0, -80, 0],
          x: [0, p.xDrift, 0],
          z: [0, p.zDrift, 0],
          rotateX: [0, 360],
          rotateY: [0, 360],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: p.duration,
          repeat: Infinity,
          delay: p.delay,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

// ====================== 3D Geometric Background ======================
const GeometricBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "2000px" }}>
      {/* Large floating cube */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64"
        style={{ transformStyle: "preserve-3d" }}
        animate={{
          rotateX: [0, 360],
          rotateY: [0, 360],
          z: [0, 50, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-500/20 backdrop-blur-xl rounded-3xl border border-pink-300/30 shadow-2xl shadow-pink-500/20"
             style={{ transform: "translateZ(50px)" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-rose-500/20 backdrop-blur-xl rounded-3xl border border-purple-300/30"
             style={{ transform: "rotateY(90deg) translateZ(50px)" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 to-pink-500/20 backdrop-blur-xl rounded-3xl border border-rose-300/30"
             style={{ transform: "rotateX(90deg) translateZ(50px)" }} />
      </motion.div>

      {/* Floating spheres */}
      <motion.div
        className="absolute bottom-40 left-10 w-32 h-32 rounded-full bg-gradient-to-br from-pink-300/30 to-purple-400/30 backdrop-blur-xl border border-pink-200/40 shadow-2xl"
        animate={{
          y: [0, -50, 0],
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute top-1/3 left-1/4 w-24 h-24 rounded-full bg-gradient-to-br from-purple-300/30 to-rose-400/30 backdrop-blur-xl border border-purple-200/40 shadow-2xl"
        animate={{
          y: [0, 30, 0],
          x: [0, 20, 0],
          scale: [1, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Large rotating sphere top-right */}
      <motion.div
        className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-pink-200/25 to-purple-300/25 blur-3xl"
        animate={{
          rotateY: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ transformStyle: "preserve-3d" }}
      />

      {/* 3D Grid floor */}
      <div
        className="absolute bottom-0 left-0 right-0 h-96 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(236, 72, 153, 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(236, 72, 153, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: 'rotateX(60deg) translateY(100px)',
          transformOrigin: 'bottom',
        }}
      />
    </div>
  );
};

// ====================== Static GlassCard (без Tilt) ======================
const GlassCard = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-50px" }}
    transition={{ delay }}
    whileHover={{
      y: -8,
      boxShadow: "0 30px 60px -15px rgba(236, 72, 153, 0.2)",
      transition: { duration: 0.3 }
    }}
    className={`
      relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-2xl
      border border-pink-100/50 shadow-xl shadow-purple-300/10
      hover:border-pink-300/50 transition-all duration-500
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-pink-50/30 pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

const GradientButton = ({
  children,
  onClick,
  disabled,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}) => {
  const isSecondary = variant === "secondary";
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium overflow-hidden transition-all duration-300 text-sm disabled:opacity-60 ${
        isSecondary
          ? "bg-white/40 backdrop-blur-md border border-pink-200/50 text-gray-800 hover:bg-white/55"
          : "bg-gradient-to-r from-pink-400 via-rose-400 to-purple-300 text-white shadow-md shadow-pink-400/25 hover:shadow-pink-500/40"
      } ${className}`}
    >
      {disabled && <Loader2 className="w-4 h-4 animate-spin" />}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {!isSecondary && !disabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-400 to-rose-400 opacity-0 group-hover:opacity-100"
          initial={{ x: "100%" }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.button>
  );
};

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, locale } = useLanguage();

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString(getDateLocale(locale), {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };
  const [event, setEvent] = useState<EventDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [isWaitlist, setIsWaitlist] = useState(false);
  const [organizerConfirmed, setOrganizerConfirmed] = useState(true);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await apiFetch(`/api/events/${id}/`, {
        signal: abortControllerRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("eventDetail.notFound"));
      setEvent(data);
      setError("");
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : t("eventDetail.notFound"));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  const fetchRegisterStatus = useCallback(async () => {
    if (!id || !user) return;
    try {
      const res = await apiFetch(`/api/events/${id}/register/`);
      const data = await res.json();
      setRegistered(!!data.registered);
      setIsWaitlist(!!data.is_waitlist);
      setOrganizerConfirmed(data.organizer_confirmed !== false);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setRegistered(false);
      setIsWaitlist(false);
      setOrganizerConfirmed(true);
    }
  }, [id, user, t]);

  useEffect(() => {
    fetchEvent();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchEvent]);

  useEffect(() => {
    if (user && id) fetchRegisterStatus();
  }, [user, id, fetchRegisterStatus]);

  useEffect(() => {
    if (registerError && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [registerError]);

  const handleRegister = async () => {
    if (!id || registerLoading) return;
    setRegisterError("");
    setRegisterLoading(true);
    try {
      const res = await apiFetch(`/api/events/${id}/register/`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("eventDetail.errorRegister"));
      await fetchEvent();
      await fetchRegisterStatus();
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setRegisterError(e instanceof Error ? e.message : t("eventDetail.errorRegister"));
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleUnregister = async () => {
    if (!id || registerLoading) return;
    setRegisterError("");
    setRegisterLoading(true);
    try {
      const res = await apiFetch(`/api/events/${id}/register/`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t("eventDetail.errorUnregister"));
      await fetchEvent();
      setRegistered(false);
      setIsWaitlist(false);
      setOrganizerConfirmed(true);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setRegisterError(e instanceof Error ? e.message : t("eventDetail.errorUnregister"));
    } finally {
      setRegisterLoading(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden relative" style={{ perspective: "1000px" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />
        <GeometricBackground />
        <FloatingParticles />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-40 bg-pink-100/40 rounded" />
            <div className="h-10 w-3/4 bg-pink-100/50 rounded-xl" />
            <div className="h-40 bg-pink-100/30 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden relative flex items-center justify-center py-16" style={{ perspective: "1000px" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />
        <GeometricBackground />
        <FloatingParticles />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center px-6"
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center"
            animate={{ rotateY: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Calendar className="w-8 h-8 text-pink-400" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">{error || t("eventDetail.notFound")}</h2>
          <Link
            to="/events"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t("eventDetail.backToEvents")}
          </Link>
        </motion.div>
      </div>
    );
  }

  const eventTitle = pickLocalized(event, "title", locale);
  const eventDescription = pickLocalized(event, "description", locale);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative" style={{ perspective: "1000px" }}>
      {/* 3D Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />

      {/* 3D Geometric Shapes */}
      <GeometricBackground />

      {/* Floating Particles */}
      <FloatingParticles />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 lg:py-12 z-10">
        {/* Навигация назад */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-pink-700 font-medium transition-colors group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t("eventDetail.allEvents")}
          </Link>
        </motion.div>

        <GlassCard>
          <div className="p-6 sm:p-8 lg:p-9">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {/* Уменьшенный баннер */}
              {event.banner_image ? (
                <motion.div
                  variants={fadeInUp}
                  className="aspect-video max-w-xl mx-auto rounded-xl overflow-hidden mb-6 border border-pink-100/50 shadow-sm"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={event.banner_image}
                    alt={eventTitle}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  variants={fadeInUp}
                  className="aspect-video max-w-xl mx-auto rounded-xl bg-gradient-to-br from-purple-100/40 to-pink-100/40 flex items-center justify-center mb-6"
                >
                  <Calendar className="w-16 h-16 sm:w-20 sm:h-20 text-pink-300/60" />
                </motion.div>
              )}

              {/* Тип и заголовок */}
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-pink-50/80 text-pink-700 border border-pink-200/50 mb-3">
                  {t(`eventDetail.${TYPE_KEYS[event.event_type] || ""}`) || event.event_type}
                </span>
                <h1 className="font-bold text-3xl sm:text-4xl text-gray-900 leading-tight">
                  {eventTitle}
                </h1>
              </motion.div>

              {/* Основная информация в сетке */}
              <motion.div variants={fadeInUp} className="grid sm:grid-cols-2 gap-4 mb-6">
                {/* Дата */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-pink-50/50 to-rose-50/30 border border-pink-100/40">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{t("eventDetail.date")}</div>
                    <div className="font-semibold text-gray-900">{formatDate(event.date)}</div>
                  </div>
                </div>

                {/* Время */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-rose-50/50 to-pink-50/30 border border-rose-100/40">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{t("eventDetail.time")}</div>
                    <div className="font-semibold text-gray-900">
                      {event.time}
                      {event.duration_minutes > 0 && ` · ${event.duration_minutes} ${t("eventDetail.minutes")}`}
                    </div>
                  </div>
                </div>

                {/* Формат */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 border border-purple-100/40">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    {event.is_online ? (
                      <Video className="w-5 h-5 text-purple-600" />
                    ) : (
                      <MapPin className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{t("eventDetail.format")}</div>
                    <div className="font-semibold text-gray-900">{event.is_online ? t("common.online") : t("common.offline")}</div>
                    {event.location && !event.is_online && (
                      <div className="text-sm text-gray-600 mt-1">{event.location}</div>
                    )}
                  </div>
                </div>

                {/* Участники */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100/40">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{t("eventDetail.participants")}</div>
                    <div className="font-semibold text-gray-900">{event.registered_count} / {event.capacity}</div>
                    {event.waitlist_count != null && event.waitlist_count > 0 && (
                      <div className="text-sm text-gray-600 mt-1">{t("eventDetail.waiting")}: {event.waitlist_count}</div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Организатор */}
              {event.organizer && (
                <motion.div variants={fadeInUp} className="flex items-center gap-2 text-sm text-gray-600 mb-6 px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-100">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>{t("eventDetail.organizer")}: <span className="font-medium text-gray-900">{event.organizer}</span></span>
                </motion.div>
              )}

              {/* Кнопки действий */}
              <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-3 mb-8" role="group" aria-label={t("eventDetail.register")}>
                {!user ? (
                  <Link
                    to={`/login?next=${encodeURIComponent(`/events/${id}`)}`}
                    className="inline-flex px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:brightness-105 shadow-md"
                    aria-label={t("eventDetail.loginToRegister")}
                  >
                    {t("eventDetail.loginToRegister")}
                  </Link>
                ) : user.is_company_user ? (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 border border-blue-200/50 text-blue-700 font-medium text-sm">
                    Аккаунт компании — только просмотр
                  </div>
                ) : registered ? (
                  <>
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 text-emerald-800 font-medium" role="status" aria-live="polite">
                      <CheckCircle2 className="w-4 h-4" />
                      {isWaitlist
                        ? t("eventDetail.waitlist")
                        : !organizerConfirmed
                        ? t("eventDetail.waitingConfirm")
                        : t("eventDetail.registered")}
                    </div>

                    <GradientButton
                      onClick={handleUnregister}
                      disabled={registerLoading}
                      variant="secondary"
                      aria-label={t("eventDetail.cancelRegistration")}
                      aria-busy={registerLoading}
                    >
                      {registerLoading ? t("eventDetail.cancelling") : t("eventDetail.cancelRegistration")}
                    </GradientButton>

                    {organizerConfirmed && !isWaitlist && (
                      <Link
                        to={`/events/${id}/ticket`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:brightness-105 shadow-md"
                        aria-label={t("eventDetail.myTicket")}
                      >
                        <QrCode className="w-4 h-4" />
                        {t("eventDetail.myTicket")}
                      </Link>
                    )}
                  </>
                ) : (
                  <GradientButton 
                    onClick={handleRegister} 
                    disabled={registerLoading}
                    aria-label={t("eventDetail.register")}
                    aria-busy={registerLoading}
                  >
                    {registerLoading ? t("eventDetail.registering") : t("eventDetail.register")}
                  </GradientButton>
                )}
              </motion.div>

              {registerError && (
                <motion.div
                  ref={errorRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-rose-600 mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200"
                  role="alert"
                  aria-live="assertive"
                >
                  {registerError}
                </motion.div>
              )}

              {/* Описание */}
              {eventDescription && (
                <motion.div variants={fadeInUp} className="mt-8 pt-6 border-t border-pink-100/40">
                  <h2 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    {t("eventDetail.description")}
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {eventDescription}
                  </div>
                </motion.div>
              )}

              {/* Ссылка на встречу */}
              {event.is_online && event.meeting_link && registered && organizerConfirmed && !isWaitlist && isValidUrl(event.meeting_link) && (
                <motion.div variants={fadeInUp} className="mt-8">
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:brightness-105 shadow-md"
                    aria-label={`${t("eventDetail.goToMeeting")} (opens in new tab)`}
                  >
                    <Globe className="w-4 h-4" />
                    {t("eventDetail.goToMeeting")}
                  </a>
                </motion.div>
              )}
            </motion.div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
