import { useEffect, useState, ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../api";
import { useLanguage } from "../context/LanguageContext";
import { pickLocalized } from "../utils/localizedContent";
import {
  Building2,
  MapPin,
  Users,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useScroll, useTransform } from "framer-motion";

// Анимации
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
  delay?: number;
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

// Градиентный бейдж
const GradientBadge = ({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 border border-pink-200/60 shadow-sm ${className}`}
  >
    {children}
  </span>
);

// Лейблы и цвета
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

const industryColors: Record<string, Record<string, string>> = {
  fintech: { bg: "from-emerald-400/10 to-teal-400/10", text: "text-emerald-700", border: "border-emerald-200/60" },
  edtech: { bg: "from-blue-400/10 to-cyan-400/10", text: "text-blue-700", border: "border-blue-200/60" },
  telecom: { bg: "from-purple-400/10 to-violet-400/10", text: "text-purple-700", border: "border-purple-200/60" },
  software: { bg: "from-indigo-400/10 to-blue-400/10", text: "text-indigo-700", border: "border-indigo-200/60" },
  other: { bg: "from-slate-300/20 to-gray-300/10", text: "text-slate-700", border: "border-slate-200/60" },
};

type CompanyItem = {
  id: number;
  company_name: string;
  slug: string;
  industry: string;
  size: string;
  location: string;
  is_verified: boolean;
  description?: string;
  description_ru?: string;
  description_uz?: string;
  description_en?: string;
  logo?: string | null;
  job_count?: number;
};

export default function Companies() {
  const { locale } = useLanguage();
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [failedLogos, setFailedLogos] = useState<Set<number>>(new Set());

  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0.4]);

  useEffect(() => {
    apiFetch("/api/companies/")
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить компании");
        return res.json();
      })
      .then((data) => setCompanies(data.results || data || []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    const description = pickLocalized(c, "description", locale);
    const matchesSearch =
      c.company_name.toLowerCase().includes(q) ||
      (c.location || "").toLowerCase().includes(q) ||
      description.toLowerCase().includes(q);
    const matchesIndustry = selectedIndustry === "all" || c.industry === selectedIndustry;
    return matchesSearch && matchesIndustry;
  });

  const industries = ["all", ...Array.from(new Set(companies.map((c) => c.industry)))];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative" style={{ perspective: "1000px" }}>
      {/* 3D Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/80 to-rose-50/80" />

      {/* 3D Geometric Shapes */}
      <GeometricBackground />

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Hero-like header */}
      <motion.section
        style={{ opacity: headerOpacity }}
        className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 z-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex mb-5"
            >
              <GradientBadge>
                <Building2 className="w-4 h-4 mr-1.5" />
                Партнёры & Работодатели
              </GradientBadge>
            </motion.div>

            <h1 className="font-bold text-5xl sm:text-6xl lg:text-7xl text-gray-900 tracking-tight leading-[1.05]">
              Компании
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-400 bg-clip-text text-transparent">
                {" "}Women in Tech
              </span>
            </h1>

            <p className="mt-6 text-xl text-gray-700 leading-relaxed">
              Работодатели, которые поддерживают женщин в IT и создают инклюзивную среду
            </p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-10 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/60 backdrop-blur-md border border-pink-100/50 shadow-lg"
              whileHover={{ scale: 1.05, z: 10 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Sparkles className="w-5 h-5 text-pink-500" />
              <span className="font-medium text-gray-800">
                {companies.length} {companies.length === 1 ? "компания" : "компаний"}
              </span>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Filters */}
      <section className="py-6 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <GlassCard className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400 group-hover:text-pink-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Название компании, город..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 bg-white/60 backdrop-blur-sm border border-pink-100 rounded-2xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 transition-all placeholder:text-gray-400 text-gray-800 hover:bg-white/80"
                />
              </div>

              {/* Industry filter */}
              <div className="relative min-w-[220px] group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400 group-hover:text-pink-600 transition-colors" />
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full pl-12 pr-10 py-3.5 bg-white/60 backdrop-blur-sm border border-pink-100 rounded-2xl focus:outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 appearance-none cursor-pointer text-gray-800 hover:bg-white/80 transition-all"
                >
                  <option value="all">Все отрасли</option>
                  {industries
                    .filter((i) => i !== "all")
                    .map((ind) => (
                      <option key={ind} value={ind}>
                        {industryLabels[ind] || ind}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="pb-24 pt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-white/40 backdrop-blur-sm rounded-3xl border border-pink-100/40 animate-pulse"
                  />
                ))}
              </motion.div>
            ) : filteredCompanies.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <motion.div
                  className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center"
                  animate={{ rotateY: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Building2 className="w-10 h-10 text-pink-400" />
                </motion.div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  {companies.length === 0 ? "Компаний пока нет" : "Ничего не найдено"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  {companies.length === 0
                    ? "Скоро здесь появятся компании-партнёры"
                    : "Попробуйте изменить запрос или убрать фильтры"}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                style={{ perspective: "1200px" }}
              >
                {filteredCompanies.map((company, idx) => {
                  const indColor = industryColors[company.industry] || industryColors.other;

                  return (
                    <Link key={company.id} to={`/companies/${company.id}`} className="group block h-full">
                      <GlassCard delay={idx * 0.06} className="h-full">
                        <div className="p-6 h-full flex flex-col" style={{ transform: "translateZ(20px)" }}>
                          {/* Logo + Name */}
                          <div className="flex items-start gap-4">
                            <motion.div
                              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/80 to-pink-50/60 border border-pink-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:shadow-md group-hover:border-pink-300/50 transition-all duration-300"
                              whileHover={{ scale: 1.1, rotateY: 10 }}
                              transition={{ duration: 0.3 }}
                            >
                              {company.logo && !failedLogos.has(company.id) ? (
                                <img
                                  src={company.logo}
                                  alt={company.company_name}
                                  className="w-full h-full object-contain p-2.5 group-hover:scale-110 transition-transform duration-300"
                                  onError={() => setFailedLogos((prev) => new Set([...prev, company.id]))}
                                />
                              ) : (
                                <span className="text-2xl font-bold text-pink-300/80 group-hover:text-pink-500 transition-colors">
                                  {company.company_name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </motion.div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-xl text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-1">
                                  {company.company_name}
                                </h3>
                                <motion.div
                                  initial={{ scale: 1 }}
                                  whileHover={{ scale: 1.2, rotate: 15 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <CheckCircle2 className="w-5 h-5 text-pink-500 shrink-0" />
                                </motion.div>
                              </div>
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2 leading-relaxed group-hover:text-gray-700 transition-colors">
                                {pickLocalized(company, "description", locale) || "Современная технологическая компания"}
                              </p>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="mt-5 flex flex-wrap gap-2">
                            <motion.div
                              whileHover={{ scale: 1.05, y: -2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <GradientBadge
                                className={`${indColor.text} ${indColor.border} bg-gradient-to-r ${indColor.bg} hover:shadow-md transition-shadow`}
                              >
                                {industryLabels[company.industry] || company.industry}
                              </GradientBadge>
                            </motion.div>

                            <motion.div
                              whileHover={{ scale: 1.05, y: -2 }}
                              transition={{ duration: 0.2 }}
                            >
                              <GradientBadge>
                                <Users className="w-3.5 h-3.5 mr-1" />
                                {sizeLabels[company.size] || company.size}
                              </GradientBadge>
                            </motion.div>
                          </div>

                          {/* Location & Jobs */}
                          <div className="mt-6 pt-5 border-t border-pink-100/40 flex items-center justify-between text-sm mt-auto">
                            <motion.div
                              className="flex items-center gap-1.5 text-gray-600"
                              whileHover={{ x: 3 }}
                              transition={{ duration: 0.2 }}
                            >
                              <MapPin className="w-4 h-4 text-pink-400 group-hover:text-pink-600 transition-colors" />
                              <span className="line-clamp-1">{company.location || "Узбекистан"}</span>
                            </motion.div>

                            {company.job_count !== undefined && company.job_count > 0 && (
                              <motion.div
                                className="flex items-center gap-1.5 text-pink-600 font-medium bg-pink-50/50 px-2 py-1 rounded-lg group-hover:bg-pink-100/50 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Briefcase className="w-4 h-4" />
                                {company.job_count} вакансий
                              </motion.div>
                            )}
                          </div>

                          {/* Hover action hint */}
                          <motion.div
                            className="mt-5 text-pink-600 font-medium text-sm flex items-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                            initial={{ opacity: 0 }}
                            whileHover={{ x: 5 }}
                          >
                            Подробнее о компании
                            <motion.div
                              animate={{ x: [0, 5, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            >
                              <ArrowRight className="w-4 h-4 ml-1.5" />
                            </motion.div>
                          </motion.div>
                        </div>
                      </GlassCard>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
