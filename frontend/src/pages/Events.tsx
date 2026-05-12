import { useEffect, useState, ReactNode, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { apiFetch } from "../api";
import { useLanguage } from "../context/LanguageContext";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  Video,
} from "lucide-react";

const TYPE_KEYS: Record<string, string> = {
  meetup: "typeMeetup",
  workshop: "typeWorkshop",
  career_fair: "typeCareerFair",
  networking: "typeNetworking",
  webinar: "typeWebinar",
};

type EventItem = {
  id: number;
  title: string;
  slug: string;
  event_type: string;
  date: string;
  time: string;
  location: string;
  is_online: boolean;
  registered_count: number;
  capacity: number;
  description?: string;
  banner_image?: string | null;
};

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

// ====================== 3D Floating Particles ======================
const EVENTS_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
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
    {EVENTS_PARTICLES.map((p) => (
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

// ====================== 3D TiltCard (как в Home.tsx) ======================
const TiltCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / 20);
    y.set((e.clientY - centerY) / 20);
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
      style={{
        rotateX: mouseY,
        rotateY: mouseX,
        transformStyle: "preserve-3d",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ====================== GlassCard (идентично Home.tsx) ======================
const GlassCard = ({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => (
  <TiltCard>
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay }}
      whileHover={{
        y: -12,
        z: 30,
        boxShadow: "0 40px 80px -20px rgba(236, 72, 153, 0.25)",
        transition: { duration: 0.3 }
      }}
      style={{ transformStyle: "preserve-3d" }}
      className={`
        relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-2xl
        border border-pink-100/50 shadow-xl shadow-purple-300/10
        hover:border-pink-300/50 transition-all duration-500
        ${className}
      `}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-pink-50/30 pointer-events-none" />
      <motion.div
        className="absolute -inset-1 bg-gradient-to-r from-pink-400/0 via-pink-400/20 to-purple-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ transform: "translateZ(-10px)" }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  </TiltCard>
);

export default function Events() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/events/")
      .then((res) => {
        if (!res.ok) throw new Error(t("events.errorLoad"));
        return res.json();
      })
      .then((data) => {
        setEvents(data.results || data || []);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t("events.errorTitle"));
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative" style={{ perspective: "1000px" }}>
      {/* 3D Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />

      {/* 3D Geometric Shapes */}
      <GeometricBackground />

      {/* Floating Particles */}
      <FloatingParticles />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 z-10">

        {/* Заголовок */}
        <motion.section className="text-center mb-12 lg:mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex mb-5"
          >
            <motion.span
              className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200/50 text-pink-700 font-medium shadow-sm backdrop-blur-md"
              whileHover={{ scale: 1.05, z: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Sparkles className="w-4 h-4" />
              {t("events.badge")}
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 tracking-tight"
            style={{ transform: "translateZ(30px)" }}
          >
            {t("events.title")}
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-400 bg-clip-text text-transparent">
              {" "}STEM Women Uzbekistan
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-5 text-lg text-gray-700 max-w-3xl mx-auto"
          >
            {t("events.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-pink-100/50 shadow-lg"
            whileHover={{ scale: 1.05, z: 10 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <Calendar className="w-5 h-5 text-pink-500" />
            <span className="font-medium text-gray-800">
              {events.length} {t("events.countSuffix")}
            </span>
          </motion.div>
        </motion.section>

        {/* Список событий */}
        <section>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-white/40 backdrop-blur-sm rounded-2xl border border-pink-100/40 animate-pulse"
                />
              ))}
            </motion.div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {t("events.errorTitle")}
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors"
              >
                {t("common.tryAgain")}
              </button>
            </motion.div>
          ) : events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <Calendar className="w-12 h-12 mx-auto text-pink-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-800">
                {t("events.emptyTitle")}
              </h3>
              <p className="text-gray-600 mt-2">{t("events.emptySubtitle")}</p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              style={{ perspective: "1200px" }}
            >
              {events.map((event, idx) => (
                <Link
                  key={event.id}
                  to={`/events/${event.id}`}
                  className="group block h-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <GlassCard delay={idx * 0.1} className="h-full">
                    {/* Banner Image */}
                    {event.banner_image && (
                      <div className="relative h-48 overflow-hidden rounded-t-2xl">
                        <img
                          src={event.banner_image}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                    )}

                    <div className="p-6 h-full flex flex-col">

                      {/* Тип */}
                      <span className="inline-flex px-3 py-1 text-xs rounded-lg bg-pink-50 text-pink-700 border border-pink-200 mb-3 w-fit">
                        {t(`events.${TYPE_KEYS[event.event_type] || ""}`) || event.event_type}
                      </span>

                      {/* Заголовок */}
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-pink-600 transition-colors mb-4 line-clamp-2 leading-tight">
                        {event.title}
                      </h3>

                      {/* Дата */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 text-pink-500" />
                        <span>{event.date}</span>
                      </div>

                      {/* Время */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock className="w-4 h-4 text-rose-500" />
                        <span>{event.time}</span>
                      </div>

                      {/* Онлайн / офлайн */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        {event.is_online ? (
                          <>
                            <Video className="w-4 h-4 text-purple-500" />
                            <span>{t("common.online")}</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="line-clamp-1">{event.location}</span>
                          </>
                        )}
                      </div>

                      {/* Участники */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 mt-auto">
                        <Users className="w-4 h-4 text-rose-500" />
                        <span>
                          {event.registered_count} / {event.capacity} {t("jobFilters.participants")}
                        </span>
                      </div>

                      <div className="flex items-center text-pink-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        {t("events.details")}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>

                    </div>
                  </GlassCard>
                </Link>
              ))}
            </motion.div>
          )}
        </section>

      </div>
    </div>
  );
}