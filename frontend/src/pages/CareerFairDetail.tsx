import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { apiFetch } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { pickLocalized } from "../utils/localizedContent";
import {
  Calendar,
  MapPin,
  ArrowRight,
  Users,
  Sparkles,
  Building2,
  ExternalLink,
} from "lucide-react";
import { useScroll, useTransform } from "framer-motion";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

// ====================== 3D Floating Particles ======================
const FloatingParticles = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 15 + 8,
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
            y: [0, -80, 0],
            x: [0, Math.random() * 40 - 20, 0],
            z: [0, Math.random() * 80 - 40, 0],
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
};

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

// Static GlassCard без Tilt
const GlassCard = ({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number
}) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-60px" }}
    transition={{ delay }}
    whileHover={{
      y: -6,
      boxShadow: "0 25px 50px -12px rgba(236, 72, 153, 0.18)",
      transition: { duration: 0.3 }
    }}
    className={`
      relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-2xl
      border border-pink-100/50 shadow-lg shadow-purple-300/10
      hover:border-pink-300/50 transition-all duration-500
      ${className}
    `}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-pink-50/30 pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

const GradientButton = ({ to, children, variant = "primary", className = "" }: {
  to: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string
}) => {
  const isSecondary = variant === "secondary";
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Link
        to={to}
        className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium overflow-hidden transition-all duration-300 text-sm ${
          isSecondary
            ? "bg-white/30 backdrop-blur-md border border-pink-200/60 text-gray-800 hover:bg-white/45 hover:border-pink-300/70"
            : "bg-gradient-to-r from-pink-400 via-rose-400 to-purple-300 text-white shadow-md shadow-pink-400/25 hover:shadow-pink-500/40"
        } ${className}`}
      >
        <span className="relative z-10 flex items-center gap-2">{children}</span>
        {!isSecondary && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-400 to-rose-400 opacity-0 group-hover:opacity-100"
            initial={{ x: "100%" }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        )}
      </Link>
    </motion.div>
  );
};

const ExternalGradientButton = ({ href, children, className = "" }: {
  href: string;
  children: React.ReactNode;
  className?: string
}) => (
  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium overflow-hidden transition-all duration-300 text-sm bg-gradient-to-r from-pink-400 via-rose-400 to-purple-300 text-white shadow-md shadow-pink-400/25 hover:shadow-pink-500/40 ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-400 to-rose-400 opacity-0 group-hover:opacity-100"
        initial={{ x: "100%" }}
        whileHover={{ x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </a>
  </motion.div>
);

type CareerFairDetailData = {
  id: number;
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  slug: string;
  description: string;
  description_ru?: string;
  description_uz?: string;
  description_en?: string;
  date_start: string;
  date_end: string;
  location: string;
  external_url?: string;
  banner_image: string | null;
  registered_companies_count: number;
  max_companies: number;
};

function getDateLocale(locale: "ru" | "uz" | "en"): string {
  if (locale === "uz") return "uz-UZ";
  if (locale === "en") return "en-US";
  return "ru-RU";
}

function formatDate(iso: string, locale: "ru" | "uz" | "en"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(getDateLocale(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CareerFairDetail() {
  const { t, locale } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [fair, setFair] = useState<CareerFairDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  const { scrollYProgress } = useScroll();
  const bannerOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.65]);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/career-fairs/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Возможность не найдена");
        return res.json();
      })
      .then(setFair)
      .catch(() => setFair(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden relative" style={{ perspective: "1000px" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />
        <GeometricBackground />
        <FloatingParticles />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-pink-100/60 rounded-xl" />
            <div className="h-5 w-32 bg-pink-100/40 rounded-lg" />
            <div className="aspect-[16/7] bg-gradient-to-br from-pink-100/40 to-purple-100/30 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-6 w-2/3 bg-pink-100/50 rounded-lg" />
              <div className="h-4 bg-pink-100/40 rounded w-full" />
              <div className="h-4 bg-pink-100/40 rounded w-4/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fair) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden relative flex items-center justify-center py-20" style={{ perspective: "1000px" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />
        <GeometricBackground />
        <FloatingParticles />
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md px-6"
        >
          <motion.div
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center"
            animate={{ rotateY: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Calendar className="w-8 h-8 text-pink-400" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Возможность не найдена</h2>
          <Link
            to="/career-fairs"
            className="inline-flex items-center gap-2 text-pink-600 font-medium hover:text-pink-700 group text-sm"
          >
            <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Вернуться к списку возможностей
          </Link>
        </motion.div>
      </div>
    );
  }

  const localizedTitle = pickLocalized(fair, "title", locale);
  const localizedDescription = pickLocalized(fair, "description", locale);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative" style={{ perspective: "1000px" }}>
      {/* 3D Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />

      {/* 3D Geometric Shapes */}
      <GeometricBackground />

      {/* Floating Particles */}
      <FloatingParticles />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12 z-10">
        {/* Навигация назад */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/career-fairs"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-700 font-medium transition-colors group text-sm"
          >
            <motion.div
              whileHover={{ x: -3 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="w-4 h-4 rotate-180 transition-transform duration-300" />
            </motion.div>
            Все возможности
          </Link>
        </motion.div>

        {/* Основной контент */}
        <motion.section variants={staggerContainer} initial="hidden" animate="visible">
          <GlassCard>
            {/* Баннер */}
            <div className="relative">
              {fair.banner_image ? (
                <motion.div style={{ opacity: bannerOpacity }}>
                  <img
                    src={fair.banner_image}
                    alt={localizedTitle}
                    className="w-full aspect-[16/7] object-cover rounded-t-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </motion.div>
              ) : (
                <div className="aspect-[16/7] bg-gradient-to-br from-purple-400/20 via-pink-400/20 to-rose-400/20 flex items-center justify-center rounded-t-2xl">
                  <div className="text-center">
                    <Calendar className="w-16 h-16 mx-auto text-white/40 mb-2" />
                    <p className="text-white/70 font-medium text-sm">Карьерная возможность</p>
                  </div>
                </div>
              )}

              {/* Основная информация */}
              <div className="p-5 sm:p-6 lg:p-7">
                <motion.h1
                  variants={fadeInUp}
                  className="font-bold text-2xl sm:text-3xl text-gray-900 leading-tight mb-4"
                >
                  {localizedTitle}
                </motion.h1>

                <motion.div
                  variants={fadeInUp}
                  className="flex flex-wrap items-center gap-x-6 gap-y-3 text-gray-700 mb-6 text-sm"
                >
                  <motion.div
                    className="flex items-center gap-2"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-pink-100/70 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Даты</div>
                      <div className="font-medium">
                        {formatDate(fair.date_start, locale)} — {formatDate(fair.date_end, locale)}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center gap-2"
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100/70 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Место</div>
                      <div className="font-medium">{fair.location}</div>
                    </div>
                  </motion.div>
                </motion.div>

                {/* Счётчик регистрации */}
                <motion.div
                  variants={fadeInUp}
                  whileHover={{ scale: 1.02 }}
                  className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100/60 shadow-sm mb-6"
                >
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm"
                    whileHover={{ rotateY: 180 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Building2 className="w-5 h-5 text-pink-600" />
                  </motion.div>
                  <div>
                    <div className="text-xs text-gray-600">Компаний</div>
                    <div className="text-lg font-bold text-gray-900">
                      {fair.registered_companies_count} / {fair.max_companies}
                    </div>
                  </div>
                </motion.div>

                {/* Описание */}
                {localizedDescription && (
                  <motion.div variants={fadeInUp} className="mb-8">
                    <h2 className="font-bold text-xl text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-pink-500" />
                      О возможности
                    </h2>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                      {localizedDescription}
                    </div>
                  </motion.div>
                )}

                {/* Кнопки действий */}
                <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
                  {fair.external_url && (
                    <ExternalGradientButton href={fair.external_url}>
                      <ExternalLink className="w-4 h-4" />
                      {t("careerFairs.openExternal")}
                    </ExternalGradientButton>
                  )}

                  <GradientButton to="/companies">
                    <Users className="w-4 h-4" />
                    {t("nav.companies")}
                  </GradientButton>

                  <GradientButton to="/jobs" variant="secondary">
                    <Building2 className="w-4 h-4" />
                    Вакансии
                  </GradientButton>
                </motion.div>
              </div>
            </div>
          </GlassCard>
        </motion.section>
      </div>
    </div>
  );
}
