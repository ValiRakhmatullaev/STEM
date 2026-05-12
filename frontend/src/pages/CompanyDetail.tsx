import { useEffect, useState, ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { apiFetch } from "../api";
import {
  MapPin,
  Globe,
  Building2,
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Sparkles,
} from "lucide-react";

// ────────────────────────────────────────────────
// Типы и маппинги лейблов
const industryLabels: Record<string, string> = {
  fintech: "Финтех",
  edtech: "Эдтех",
  telecom: "Телеком",
  software: "ПО",
  other: "Другое",
};

const sizeLabels: Record<string, string> = {
  startup: "Стартап",
  small: "Малый бизнес",
  medium: "Средний бизнес",
  large: "Крупная компания",
  enterprise: "Корпорация",
};

const employmentTypeLabels: Record<string, string> = {
  full_time: "Полная занятость",
  part_time: "Частичная занятость",
  contract: "Контракт",
  freelance: "Фриланс",
  internship: "Стажировка",
};

const experienceLabels: Record<string, string> = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
  lead: "Lead",
  executive: "C-Level",
};

const locationTypeLabels: Record<string, string> = {
  remote: "Удалённо",
  office: "В офисе",
  hybrid: "Гибрид",
};

type JobItem = {
  id: number;
  title: string;
  slug: string;
  description: string;
  location_type: string;
  experience_level: string;
  employment_type: string;
  published_at: string | null;
};

type CompanyDetailData = {
  id: number;
  company_name: string;
  slug: string;
  industry: string;
  size: string;
  location: string;
  is_verified: boolean;
  description: string;
  website: string;
  logo: string | null;
  founded_year?: number;
  jobs: JobItem[];
};

// ────────────────────────────────────────────────
// Анимации
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

// ────────────────────────────────────────────────
// 3D Floating Particles
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

// ────────────────────────────────────────────────
// 3D Geometric Background
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

// ────────────────────────────────────────────────
// Компоненты
const GlassCard = ({ children, className = "", delay = 0 }: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => (
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

const GradientButton = ({ href, children, variant = "primary", className = "" }: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) => {
  const isSecondary = variant === "secondary";
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium overflow-hidden transition-all duration-300 text-sm ${
        isSecondary
          ? "bg-white/40 backdrop-blur-md border border-pink-200/50 text-gray-800 hover:bg-white/55"
          : "bg-gradient-to-r from-pink-400 via-rose-400 to-purple-300 text-white shadow-md shadow-pink-400/25 hover:shadow-pink-500/40"
      } ${className}`}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {!isSecondary && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-300 via-pink-400 to-rose-400 opacity-0 group-hover:opacity-100"
          initial={{ x: "100%" }}
          whileHover={{ x: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.a>
  );
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "Не указано";
  const date = new Date(dateString);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

// ────────────────────────────────────────────────
// Основной компонент
export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<CompanyDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    apiFetch(`/api/companies/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error("Компания не найдена");
        return res.json();
      })
      .then((data) => {
        setCompany(data);
        setLogoError(false);
      })
      .catch(() => setCompany(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden relative" style={{ perspective: "1000px" }}>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />
        <GeometricBackground />
        <FloatingParticles />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-48 bg-pink-100/40 rounded-xl" />
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-24 h-24 bg-pink-100/30 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <div className="h-9 w-3/5 bg-pink-100/40 rounded-xl" />
                <div className="h-5 w-2/5 bg-pink-100/30 rounded" />
              </div>
            </div>
            <div className="h-48 bg-pink-100/25 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
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
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center"
            animate={{ rotateY: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Building2 className="w-8 h-8 text-pink-400" />
          </motion.div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Компания не найдена</h2>
          <Link
            to="/companies"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            К списку компаний
          </Link>
        </motion.div>
      </div>
    );
  }

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
            to="/companies"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-pink-700 font-medium transition-colors group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Все компании
          </Link>
        </motion.div>

        {/* Карточка компании */}
        <GlassCard>
          <div className="p-6 sm:p-8 lg:p-9">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <div className="flex flex-col sm:flex-row gap-6 lg:gap-8">
                {/* Логотип */}
                <motion.div variants={fadeInUp} className="shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-white/85 to-pink-50/50 border border-pink-100/60 flex items-center justify-center overflow-hidden shadow-md">
                    {company.logo && !logoError ? (
                      <img
                        src={company.logo}
                        alt={company.company_name}
                        className="w-full h-full object-contain p-3"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <span className="text-4xl font-bold text-pink-300/70">
                        {company.company_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </motion.div>

                {/* Основная информация */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <motion.h1
                      variants={fadeInUp}
                      className="font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight"
                    >
                      {company.company_name}
                    </motion.h1>
                    {company.is_verified && (
                      <motion.div
                        variants={fadeInUp}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200/50 text-pink-700 text-xs font-medium shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Проверена
                      </motion.div>
                    )}
                  </div>

                  <motion.div
                    variants={fadeInUp}
                    className="flex flex-wrap gap-4 text-sm text-gray-700 mb-6"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-pink-100/60 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-pink-600" />
                      </div>
                      <span>{industryLabels[company.industry] || company.industry}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-100/60 flex items-center justify-center">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <span>{sizeLabels[company.size] || company.size}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-rose-100/60 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-rose-600" />
                      </div>
                      <span>{company.location}</span>
                    </div>

                    {company.founded_year && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100/60 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span>с {company.founded_year}</span>
                      </div>
                    )}
                  </motion.div>

                  {company.website && (
                    <motion.div variants={fadeInUp}>
                      <GradientButton href={company.website}>
                        <Globe className="w-4 h-4" />
                        Сайт компании
                        <ExternalLink className="w-3.5 h-3.5" />
                      </GradientButton>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Описание компании */}
              {company.description && (
                <motion.div variants={fadeInUp} className="mt-10 pt-8 border-t border-pink-100/40">
                  <h2 className="font-bold text-2xl text-gray-900 mb-4 flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    О компании
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                    {company.description}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </GlassCard>

        {/* Блок вакансий */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <GlassCard delay={0.1}>
            <div className="p-6 sm:p-8 lg:p-9">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white shadow-md">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-2xl sm:text-3xl text-gray-900">
                    Вакансии
                  </h2>
                  <p className="text-gray-600 text-sm mt-0.5">
                    {company.jobs.length === 0
                      ? "Пока нет открытых позиций"
                      : `${company.jobs.length} ${company.jobs.length === 1 ? "позиция" : "позиций"}`}
                  </p>
                </div>
              </div>

              {company.jobs.length === 0 ? (
                <div className="text-center py-12">
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center"
                    animate={{ rotateY: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  >
                    <Briefcase className="w-8 h-8 text-pink-400" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Вакансий пока нет</h3>
                  <p className="text-gray-600 text-sm">Следите за обновлениями компании</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {company.jobs.map((job, idx) => (
                    <Link key={job.id} to={`/jobs/${job.id}`}>
                      <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.06 }}
                        whileHover={{ x: 5, scale: 1.01 }}
                        className="group p-5 rounded-xl bg-white/65 backdrop-blur-sm border border-pink-100/50 hover:border-pink-300/60 hover:bg-white/85 transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-pink-700 transition-colors mb-1.5 line-clamp-1">
                              {job.title}
                            </h3>
                            <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">
                              {job.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-pink-50/80 text-pink-700 border border-pink-200/50">
                                {employmentTypeLabels[job.employment_type] || job.employment_type}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-purple-50/80 text-purple-700 border border-purple-200/50">
                                {experienceLabels[job.experience_level] || job.experience_level}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-rose-50/80 text-rose-700 border border-rose-200/50">
                                {locationTypeLabels[job.location_type] || job.location_type}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 text-xs text-gray-600 shrink-0">
                            {job.published_at && (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-pink-400" />
                                {formatDate(job.published_at)}
                              </div>
                            )}
                            <div className="text-pink-600 font-medium opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1.5">
                              Подробнее →
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </motion.section>
      </div>
    </div>
  );
}