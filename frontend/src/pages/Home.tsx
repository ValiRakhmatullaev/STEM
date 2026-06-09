import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../api";
import { pickLocalized } from "../utils/localizedContent";
import {
  Sparkles, Calendar, Briefcase, Building2, Target,
  ArrowRight, ChevronRight, Users, Zap, Globe, ArrowUpRight,
  Star
} from "lucide-react";

// 3D Floating particles component
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 20 + 10,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "1000px" }}>
      {particles.map((p) => (
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
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            z: [0, Math.random() * 100 - 50, 0],
            rotateX: [0, 360],
            rotateY: [0, 360],
            opacity: [0.3, 0.8, 0.3],
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
};

// 3D Geometric shapes background
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
          z: [0, 100, 0],
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

// Mouse-following 3D card effect
const TiltCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
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

// Анимационные варианты
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } }
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const slideInLeft = {
  hidden: { x: -60, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }
};

const slideInRight = {
  hidden: { x: 60, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } }
};

// Безопасная проверка строки
const hasValue = (str?: string | null): boolean => {
  return typeof str === 'string' && str?.trim().length > 0;
};

// Градиентная кнопка с 3D эффектом
const GradientButton = ({ to, children, variant = "primary", className = "" }: { to: string; children: React.ReactNode; variant?: "primary" | "secondary"; className?: string }) => {
  const isSecondary = variant === "secondary";
  return (
    <motion.div
      whileHover={{ scale: 1.05, z: 20 }}
      whileTap={{ scale: 0.95 }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <Link
        to={to}
        className={`
          group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold overflow-hidden transition-all duration-300
          ${isSecondary
            ? "bg-white/20 backdrop-blur-md border-2 border-pink-200/50 text-gray-800 hover:bg-white/35 hover:border-pink-300/60 hover:shadow-xl hover:shadow-pink-400/20"
            : "bg-gradient-to-r from-pink-400 via-rose-400 to-purple-300 text-white shadow-xl shadow-pink-400/25 hover:shadow-pink-500/40 hover:shadow-2xl"
          }
          ${className}
        `}
      >
        <span className="relative z-10 flex items-center gap-2">
          {children}
        </span>
        {!isSecondary && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-400 to-rose-400"
            initial={{ x: "100%" }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        )}
      </Link>
    </motion.div>
  );
};

// 3D Стеклянная карточка
const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => (
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

// Плавающий бейдж с 3D
const FloatingBadge = ({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ElementType }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.9, rotateX: -30 }}
    animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    whileHover={{ scale: 1.05, z: 10 }}
    style={{ transformStyle: "preserve-3d" }}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md border border-pink-200/50 text-pink-700 text-sm font-semibold shadow-lg shadow-pink-400/20"
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </motion.div>
);

// Анимированный счетчик с 3D эффектом
const AnimatedCounter = ({ value, label, suffix = "" }: { value: string; label: string; suffix?: string }) => (
  <motion.div
    variants={fadeInScale}
    className="text-center"
    whileHover={{ scale: 1.1, z: 20, rotateY: 5 }}
    style={{ transformStyle: "preserve-3d" }}
  >
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -30 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true }}
      className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-pink-500 via-rose-500 to-purple-400 bg-clip-text text-transparent drop-shadow-lg"
    >
      {value}{suffix}
    </motion.div>
    <div className="text-sm text-slate-500 mt-2 font-medium uppercase tracking-wider">{label}</div>
  </motion.div>
);

// 3D Icon wrapper
const Icon3D = ({ icon: Icon, color, className = "" }: { icon: React.ElementType; color: string; className?: string }) => (
  <motion.div
    whileHover={{ scale: 1.2, rotateY: 180, z: 30 }}
    transition={{ duration: 0.4 }}
    style={{ transformStyle: "preserve-3d" }}
    className={`${className}`}
  >
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center text-white shadow-xl relative`}>
      <Icon className="w-7 h-7 relative z-10" />
      <div className="absolute inset-0 bg-white/20 rounded-2xl" style={{ transform: "translateZ(-5px)" }} />
    </div>
  </motion.div>
);

type EventItem = { id: number; title: string; date: string; time: string; event_type: string };
type JobItem = {
  id: number;
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  company: string;
  location_type: string;
};
type FairItem = {
  id: number;
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  date_start: string;
  date_end: string;
  location: string;
};
type HomeBanner = {
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  subtitle: string;
  subtitle_ru?: string;
  subtitle_uz?: string;
  subtitle_en?: string;
  button_label?: string;
  button_label_ru?: string;
  button_label_uz?: string;
  button_label_en?: string;
  button_url?: string;
  image?: string | null;
};
type NewsItem = {
  id: number;
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  summary: string;
  summary_ru?: string;
  summary_uz?: string;
  summary_en?: string;
  published_at: string | null;
};

export default function Home() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [fairs, setFairs] = useState<FairItem[]>([]);
  const [banner, setBanner] = useState<HomeBanner | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const joinUrl = user ? "/events" : banner?.button_url || "/register";
  const bannerTitle = pickLocalized(banner, "title", locale);
  const bannerSubtitle = pickLocalized(banner, "subtitle", locale);
  const bannerButtonLabel = pickLocalized(banner, "button_label", locale);

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);

  useEffect(() => {
    const load = async () => {
      try {
        const [homeRes, evRes, jobRes, fairRes] = await Promise.all([
          apiFetch("/api/home/"),
          apiFetch("/api/events/"),
          apiFetch("/api/companies/jobs/"),
          apiFetch("/api/career-fairs/"),
        ]);
        const homeData = homeRes.ok ? await homeRes.json() : {};
        const evData = evRes.ok ? await evRes.json() : { results: [] };
        const jobData = jobRes.ok ? await jobRes.json() : { results: [] };
        const fairData = fairRes.ok ? await fairRes.json() : { results: [] };
        if (homeData.banner) setBanner(homeData.banner);
        setNews((homeData.news || []).slice(0, 6));
        setEvents((evData.results || []).slice(0, 3));
        setJobs((jobData.results || []).slice(0, 3));
        setFairs((fairData.results || []).slice(0, 2));
      } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        setEvents([]);
        setJobs([]);
        setFairs([]);
        setBanner(null);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden" style={{ perspective: "1000px" }}>

      {/* Welcome Banner */}
      <AnimatePresence>
        {user && (
          <motion.section
            initial={{ height: 0, opacity: 0, rotateX: -90 }}
            animate={{ height: "auto", opacity: 1, rotateX: 0 }}
            exit={{ height: 0, opacity: 0, rotateX: -90 }}
            className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-rose-500/10 border-b border-pink-200/40 backdrop-blur-xl overflow-hidden relative z-50"
            style={{ transformOrigin: "top", transformStyle: "preserve-3d" }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-gray-700 flex items-center gap-2 font-medium"
              >
                <motion.div
                  animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-pink-500" />
                </motion.div>
                {t("home.welcomePrefix")}
                <span className="font-bold text-pink-700">{user.username}</span>! ✨
              </motion.p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Hero Section с 3D фоном */}
      {true ? (
        <motion.section
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative min-h-[95vh] flex items-center overflow-hidden"
        >
          {/* 3D Background Layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />

          {/* 3D Geometric Shapes */}
          <GeometricBackground />

          {/* Floating Particles */}
          <FloatingParticles />

          {/* Фоновое изображение с 3D эффектом */}
          {hasValue(banner?.image) && (
            <motion.div
              className="absolute inset-0 bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${banner?.image})`,
                backgroundSize: "cover",
                transformStyle: "preserve-3d",
              }}
              animate={{
                scale: [1, 1.05, 1],
                rotateY: [0, 2, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/60 backdrop-blur-[2px]" />
            </motion.div>
          )}

          {/* Декоративные 3D элементы без изображения */}
          {!hasValue(banner?.image) && (
            <div className="absolute inset-0 overflow-hidden" style={{ perspective: "1500px" }}>
              <motion.div
                animate={{ rotateY: 360, rotateX: 20 }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1/4 -right-1/4 w-[1000px] h-[1000px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full blur-3xl"
                     style={{ transform: "translateZ(100px)" }} />
                <div className="absolute inset-0 bg-gradient-to-br from-rose-200/30 to-purple-200/30 rounded-full blur-3xl"
                     style={{ transform: "rotateY(60deg) translateZ(50px)" }} />
              </motion.div>

              <motion.div
                animate={{ rotateY: -360, rotateZ: 10 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-1/3 -left-1/4 w-[800px] h-[800px]"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-200/40 to-purple-200/40 rounded-full blur-3xl"
                     style={{ transform: "translateZ(80px)" }} />
              </motion.div>
            </div>
          )}

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32 z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-3xl"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <FloatingBadge icon={Zap}>{t("home.hero.badge")}</FloatingBadge>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl text-gray-900 leading-[1.1] tracking-tight drop-shadow-sm"
                style={{ transform: "translateZ(50px)" }}
              >
                {bannerTitle || (
                  <>
                    {t("home.hero.titlePrefix")}{" "}
                    <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-400 bg-clip-text text-transparent drop-shadow-lg">
                      {t("home.hero.country")}
                    </span>
                  </>
                )}
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="mt-6 text-xl text-gray-700 max-w-2xl leading-relaxed backdrop-blur-sm"
                style={{ transform: "translateZ(30px)" }}
              >
                {bannerSubtitle || t("home.hero.subtitleFallback")}
              </motion.p>

              <motion.div variants={fadeInUp} className="mt-10 flex flex-wrap gap-4" style={{ transform: "translateZ(40px)" }}>
                <GradientButton to={joinUrl}>
                  {bannerButtonLabel || t("home.hero.join")}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
                <GradientButton to="/events" variant="secondary">
                  <Calendar className="w-5 h-5" />
                  {t("home.hero.events")}
                </GradientButton>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-16 grid grid-cols-3 gap-8 max-w-lg"
                style={{ transform: "translateZ(60px)" }}
              >
                <AnimatedCounter value="500" suffix="+" label={t("home.counters.participants")} />
                <AnimatedCounter value="50" suffix="+" label={t("home.counters.companies")} />
                <AnimatedCounter value="100" suffix="+" label={t("home.counters.jobs")} />
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 rounded-full border-2 border-pink-400/50 flex justify-center pt-2">
              <motion.div
                className="w-1.5 h-3 bg-pink-400 rounded-full"
                animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.section>
      ) : (
        // Fallback с 3D
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative min-h-[60vh] flex items-center overflow-hidden"
        >
          <GeometricBackground />
          <FloatingParticles />
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ transform: "translateZ(50px)" }}>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 mb-4">
                {t("home.fallback.welcome")}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {t("home.fallback.bannerSoon")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <GradientButton to="/events">
                  <Calendar className="w-5 h-5" />
                  {t("home.fallback.events")}
                </GradientButton>
                <GradientButton to="/jobs" variant="secondary">
                  <Briefcase className="w-5 h-5" />
                  {t("home.fallback.jobs")}
                </GradientButton>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* News Section с 3D карточками */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-50/30 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12"
          >
            <div>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-pink-600 font-semibold text-sm uppercase tracking-wider"
              >
                {t("home.news.sectionLabel")}
              </motion.span>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 mt-2">{t("home.news.title")}</h2>
              <p className="mt-3 text-gray-700 text-lg">{t("home.news.subtitle")}</p>
            </div>
            <motion.div whileHover={{ x: 5, z: 10 }} className="shrink-0" style={{ transformStyle: "preserve-3d" }}>
              <Link to="/news" className="text-pink-600 font-semibold hover:text-pink-700 flex items-center gap-1 group">
                {t("home.news.allNews")}
                <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          {!loading && news.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotateX: -10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              className="text-center py-20 rounded-3xl bg-white/70 backdrop-blur-xl border border-pink-100/50 shadow-xl"
              style={{ transformStyle: "preserve-3d" }}
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center"
                animate={{ rotateY: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-8 h-8 text-pink-400" />
              </motion.div>
              <p className="text-gray-600 text-lg">{t("home.news.empty")}</p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              style={{ perspective: "1000px" }}
            >
              {news.map((item, i) => (
                <GlassCard key={item.id} delay={i * 0.1}>
                  <Link to={`/news/${item.id}`} className="block p-6 group h-full">
                    <div className="flex items-center gap-2 text-xs text-pink-600 font-bold uppercase tracking-wider mb-3">
                      <Calendar className="w-4 h-4" />
                      {item.published_at && new Date(item.published_at).toLocaleDateString("ru-RU")}
                    </div>
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2 leading-tight">
                      {pickLocalized(item, "title", locale)}
                    </h3>
                    {pickLocalized(item, "summary", locale) && (
                      <p className="mt-3 text-gray-700 line-clamp-3 leading-relaxed">
                        {pickLocalized(item, "summary", locale)}
                      </p>
                    )}
                    <div className="mt-4 flex items-center text-pink-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      {t("home.news.readMore")} <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </Link>
                </GlassCard>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Grid с 3D иконками */}
      <section className="py-24 bg-gradient-to-b from-transparent via-pink-50/30 to-transparent relative overflow-hidden">
        <FloatingParticles />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-pink-600 font-semibold text-sm uppercase tracking-wider">{t("home.features.sectionLabel")}</span>
            <h2 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 mt-3">
              {t("home.features.title")}
            </h2>
            <p className="mt-4 text-gray-700 text-lg max-w-2xl mx-auto">
              {t("home.features.subtitle")}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            style={{ perspective: "1200px" }}
          >
            {[
              { to: "/events", icon: Calendar, title: t("home.features.events.title"), desc: t("home.features.events.desc"), color: "from-pink-400 to-rose-500", gradient: "group-hover:shadow-pink-500/30" },
              { to: "/jobs", icon: Briefcase, title: t("home.features.jobs.title"), desc: t("home.features.jobs.desc"), color: "from-rose-400 to-pink-500", gradient: "group-hover:shadow-rose-500/30" },
              { to: "/companies", icon: Building2, title: t("home.features.companies.title"), desc: t("home.features.companies.desc"), color: "from-purple-400 to-pink-400", gradient: "group-hover:shadow-purple-500/30" },
              { to: "/career-fairs", icon: Target, title: t("home.features.fairs.title"), desc: t("home.features.fairs.desc"), color: "from-purple-500 to-rose-400", gradient: "group-hover:shadow-purple-500/30" },
            ].map((feature) => (
              <motion.div key={feature.to} variants={fadeInUp} style={{ transformStyle: "preserve-3d" }}>
                <Link to={feature.to} className="group block h-full">
                  <GlassCard className={`h-full p-6 ${feature.gradient} transition-shadow duration-300`}>
                    <Icon3D icon={feature.icon} color={feature.color} className="mb-5" />
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-pink-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-gray-700 leading-relaxed">{feature.desc}</p>
                    <div className="mt-4 flex items-center text-pink-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      {t("home.features.more")} <ArrowUpRight className="w-4 h-4 ml-1" />
                    </div>
                  </GlassCard>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Career Opportunities Section с 3D */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: -10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[2.5rem] overflow-hidden"
            style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

            {/* 3D floating elements */}
            <motion.div
              className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ transform: "translateZ(50px)" }}
            />
            <motion.div
              className="absolute bottom-10 left-10 w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20"
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              style={{ transform: "translateZ(30px)" }}
            />

            <div className="relative p-8 sm:p-12 lg:p-16">
              <div className="max-w-3xl">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 mb-4"
                >
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotateY: 180 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Globe className="w-6 h-6 text-white" />
                  </motion.div>
                  <span className="text-white/90 font-semibold text-lg">{t("home.fairs.label")}</span>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-6 leading-tight drop-shadow-lg"
                >
                  {t("home.fairs.title")}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-white/90 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed"
                >
                  {t("home.fairs.desc")}
                </motion.p>

                {!loading && fairs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mb-8 space-y-3"
                  >
                    {fairs.map((fair, i) => (
                      <motion.div
                        key={fair.id}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ x: 10, scale: 1.02 }}
                        className="flex items-center gap-4 text-white bg-white/15 backdrop-blur-md rounded-xl p-4 border border-white/25 shadow-lg hover:bg-white/25 transition-all cursor-pointer"
                      >
                        <motion.div
                          className="w-2 h-2 rounded-full bg-white/70 shrink-0"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        />
                        <Link to={`/career-fairs/${fair.id}`} className="hover:underline font-semibold text-lg flex-1">
                          {pickLocalized(fair, "title", locale)}
                        </Link>
                        <span className="text-white/80 text-sm shrink-0 bg-white/10 px-3 py-1 rounded-full">
                          {fair.date_start} — {fair.date_end}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <GradientButton to="/career-fairs" variant="secondary" className="inline-flex">
                    {t("home.fairs.allButton")}
                    <ArrowRight className="w-5 h-5" />
                  </GradientButton>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Preview Section с 3D */}
      {!loading && (events.length > 0 || jobs.length > 0) && (
        <section className="py-24 bg-gradient-to-b from-white/60 to-pink-50/30 backdrop-blur-sm relative overflow-hidden">
          <GeometricBackground />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display font-bold text-4xl sm:text-5xl text-gray-900 mb-12 text-center"
            >
              {t("home.platformNow.title")}
            </motion.h2>

            <div className="grid sm:grid-cols-2 gap-8" style={{ perspective: "1000px" }}>
              {events.length > 0 && (
                <motion.div
                  variants={slideInLeft}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <GlassCard className="p-6 h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <Icon3D icon={Calendar} color="from-purple-400 to-pink-500" />
                      <h3 className="font-bold text-xl text-gray-900">{t("home.platformNow.eventsTitle")}</h3>
                    </div>
                    <ul className="space-y-3">
                      {events.map((e, i) => (
                        <motion.li
                          key={e.id}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ x: 5, scale: 1.02 }}
                        >
                          <Link to={`/events/${e.id}`} className="group flex items-center justify-between p-4 rounded-xl hover:bg-pink-50/80 transition-all border border-transparent hover:border-pink-200/50 backdrop-blur-sm">
                            <span className="text-gray-800 group-hover:text-pink-700 font-semibold transition-colors">{e.title}</span>
                            <span className="text-sm text-gray-600 bg-gray-100/80 px-3 py-1 rounded-full group-hover:bg-pink-100 group-hover:text-pink-600 transition-colors">{e.date}</span>
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                    <Link to="/events" className="mt-6 inline-flex items-center text-pink-600 font-semibold hover:text-pink-700 group">
                      {t("home.platformNow.eventsAll")}{" "}
                      <ArrowUpRight className="w-5 h-5 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                  </GlassCard>
                </motion.div>
              )}

              {jobs.length > 0 && (
                <motion.div
                  variants={slideInRight}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  <GlassCard className="p-6 h-full">
                    <div className="flex items-center gap-3 mb-6">
                      <Icon3D icon={Briefcase} color="from-rose-400 to-pink-500" />
                      <h3 className="font-bold text-xl text-gray-900">{t("home.platformNow.jobsTitle")}</h3>
                    </div>
                    <ul className="space-y-3">
                      {jobs.map((j, i) => (
                        <motion.li
                          key={j.id}
                          initial={{ opacity: 0, x: 10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ x: 5, scale: 1.02 }}
                        >
                          <Link to={`/jobs/${j.id}`} className="group flex items-center justify-between p-4 rounded-xl hover:bg-rose-50/80 transition-all border border-transparent hover:border-rose-200/50 backdrop-blur-sm">
                            <div>
                              <span className="text-gray-800 group-hover:text-rose-700 font-semibold block transition-colors">
                                {pickLocalized(j, "title", locale)}
                              </span>
                              <span className="text-sm text-gray-600">{j.company}</span>
                            </div>
                            <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
                          </Link>
                        </motion.li>
                      ))}
                    </ul>
                    <Link to="/jobs" className="mt-6 inline-flex items-center text-pink-600 font-semibold hover:text-pink-700 group">
                      {t("home.platformNow.jobsAll")}{" "}
                      <ArrowUpRight className="w-5 h-5 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                  </GlassCard>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section с 3D */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/10 via-purple-400/10 to-rose-400/10" />
        <FloatingParticles />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 text-sm font-semibold mb-6"
              whileHover={{ scale: 1.05, z: 20 }}
            >
              <Star className="w-4 h-4" />
              {t("home.cta.badge")}
            </motion.div>

            <h2 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 mb-6 leading-tight">
              {t("home.cta.title")}
            </h2>
            <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t("home.cta.desc")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <GradientButton to={user ? "/events" : "/register"}>
                <Users className="w-5 h-5" />
                {t("home.cta.participantButton")}
              </GradientButton>
              <GradientButton to="/companies" variant="secondary">
                <Building2 className="w-5 h-5" />
                {t("home.cta.employerButton")}
              </GradientButton>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
