import React, { useEffect, useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { apiFetch } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { pickLocalized } from "../utils/localizedContent";
import {
  Calendar,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
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
const CF_PARTICLES = Array.from({ length: 15 }, (_, i) => ({
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
    {CF_PARTICLES.map((p) => (
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

// ====================== 3D TiltCard ======================
const TiltCard = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Компонент карточки с 3D эффектом
const GlassCard = ({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number
}) => (
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

const GradientBadge = ({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.span
    whileHover={{ scale: 1.05, y: -2 }}
    transition={{ duration: 0.2 }}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border border-pink-200/60 shadow-sm ${className}`}
  >
    {children}
  </motion.span>
);

type CareerFairItem = {
  id: number;
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  slug: string;
  description?: string;
  description_ru?: string;
  description_uz?: string;
  description_en?: string;
  date_start: string;
  date_end: string;
  location: string;
  registered_companies_count: number;
  max_companies: number;
};

function getDateLocale(locale: "ru" | "uz" | "en"): string {
  if (locale === "uz") return "uz-UZ";
  if (locale === "en") return "en-US";
  return "ru-RU";
}

export default function CareerFairs() {
  const { t, locale } = useLanguage();
  const [fairs, setFairs] = useState<CareerFairItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0.5]);

  useEffect(() => {
    apiFetch("/api/career-fairs/")
      .then((res) => {
        if (!res.ok) throw new Error(t("careerFairs.errorLoad"));
        return res.json();
      })
      .then((data) => setFairs(data.results || data || []))
      .catch(() => setFairs([]))
      .finally(() => setLoading(false));
  }, [t]);

  const dateLocale = getDateLocale(locale);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative" style={{ perspective: "1000px" }}>
      {/* 3D Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />

      {/* 3D Geometric Shapes */}
      <GeometricBackground />

      {/* Floating Particles */}
      <FloatingParticles />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 z-10">
        {/* Заголовок */}
        <motion.section
          style={{ opacity: headerOpacity }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9 }}
            className="inline-flex mb-5"
          >
            <GradientBadge>
              <Sparkles className="w-4 h-4" />
              {t("careerFairs.badge")}
            </GradientBadge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="font-bold text-5xl sm:text-6xl lg:text-7xl text-gray-900 tracking-tight leading-[1.05]"
          >
            {t("careerFairs.titlePrefix")}
            <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-400 bg-clip-text text-transparent">
              {" "}
              {t("careerFairs.titleAccent")}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mt-6 text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed"
          >
            {t("careerFairs.subtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-pink-100/50 shadow-lg"
            whileHover={{ scale: 1.05, z: 10 }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <Users className="w-5 h-5 text-pink-500" />
            <span className="font-medium text-gray-800">
              {fairs.length} {fairs.length === 1 ? t("careerFairs.countOne") : t("careerFairs.countMany")}
            </span>
          </motion.div>
        </motion.section>

        {/* Список карточек */}
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
                  className="h-72 bg-white/40 backdrop-blur-sm rounded-3xl border border-pink-100/40 animate-pulse"
                />
              ))}
            </motion.div>
          ) : fairs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center"
                animate={{ rotateY: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Calendar className="w-10 h-10 text-pink-400" />
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                {t("careerFairs.emptyTitle")}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {t("careerFairs.emptySubtitle")}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              style={{ perspective: "1200px" }}
            >
              {fairs.map((fair, idx) => (
                <Link key={fair.id} to={`/career-fairs/${fair.id}`} className="group block h-full">
                  <GlassCard delay={idx * 0.1} className="h-full">
                    <div className="p-6 lg:p-7 h-full flex flex-col" style={{ transform: "translateZ(20px)" }}>
                      <h3 className="font-bold text-2xl text-gray-900 group-hover:text-pink-600 transition-colors mb-4 line-clamp-2 leading-tight">
                        {pickLocalized(fair, "title", locale)}
                      </h3>

                      <div className="space-y-3 mb-6 text-gray-700">
                        <motion.div
                          className="flex items-center gap-3"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-9 h-9 rounded-xl bg-pink-100/70 flex items-center justify-center shrink-0 group-hover:bg-pink-200/70 transition-colors">
                            <Calendar className="w-5 h-5 text-pink-600" />
                          </div>
                          <span className="font-medium">{`${new Date(fair.date_start).toLocaleDateString(dateLocale, { day: "numeric", month: "long" })} — ${new Date(fair.date_end).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}`}</span>
                        </motion.div>

                        <motion.div
                          className="flex items-center gap-3"
                          whileHover={{ x: 3 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="w-9 h-9 rounded-xl bg-purple-100/70 flex items-center justify-center shrink-0 group-hover:bg-purple-200/70 transition-colors">
                            <MapPin className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="line-clamp-1">{fair.location}</span>
                        </motion.div>
                      </div>

                      <GradientBadge className="mb-6 w-fit">
                        <Users className="w-4 h-4" />
                        {t("careerFairs.companiesLabel")}: <strong className="text-pink-700">{fair.registered_companies_count}</strong> /{" "}
                        {fair.max_companies}
                      </GradientBadge>

                      {pickLocalized(fair, "description", locale) && (
                        <p className="text-gray-600 leading-relaxed line-clamp-3 mb-6 mt-auto">
                          {pickLocalized(fair, "description", locale)}
                        </p>
                      )}

                      <motion.div
                        className="flex items-center text-pink-600 font-medium text-sm mt-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                        whileHover={{ x: 5 }}
                      >
                        {t("careerFairs.details")}
                        <motion.div
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </motion.div>
                      </motion.div>
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
