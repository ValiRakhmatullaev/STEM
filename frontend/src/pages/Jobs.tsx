import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../api";
import { useLanguage } from "../context/LanguageContext";
import {
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  Search,
  ArrowRight,
} from "lucide-react";

const LEVELS: Record<string, string> = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
  lead: "Lead",
};

function daysAgo(dateStr: string | null, t: (key: string) => string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "";
  if (diff === 0) return t("jobFilters.today");
  if (diff === 1) return t("jobFilters.yesterday");
  if (diff < 7) return `${diff} ${t("jobFilters.daysAgo")}`;
  if (diff < 30) return `${Math.floor(diff / 7)} ${t("jobFilters.weeksAgo")}`;
  return `${Math.floor(diff / 30)} ${t("jobFilters.monthsAgo")}`;
}

// ====================== 3D ФОН ======================
const BG_PARTICLES = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  xDrift: Math.random() * 120 - 60,
  duration: Math.random() * 30 + 20,
  delay: Math.random() * 15,
}));

const Background3D = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "2000px" }}>
    <motion.div
      className="absolute -top-40 -right-40 w-[900px] h-[900px]"
      animate={{ rotateY: 360, rotateX: 25 }}
      transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pink-300/15 to-purple-400/15 rounded-full blur-3xl" />
    </motion.div>

    {BG_PARTICLES.map((p) => (
      <motion.div
        key={p.id}
        className="absolute w-3 h-3 bg-gradient-to-br from-pink-400/40 to-purple-400/40 rounded-full backdrop-blur-md"
        style={{
          left: `${p.left}%`,
          top: `${p.top}%`,
        }}
        animate={{
          y: [0, -250, 0],
          x: [0, p.xDrift, 0],
          opacity: [0.25, 0.75, 0.25],
          scale: [0.8, 1.4, 0.8],
        }}
        transition={{
          duration: p.duration,
          repeat: Infinity,
          delay: p.delay,
        }}
      />
    ))}
  </div>
);

// ====================== УМЕНЬШЕННАЯ КАРТОЧКА ======================
const JobCard = ({ job }: { job: any }) => {
  const { t } = useLanguage();

  return (
    <Link to={`/jobs/${job.id}`} className="block h-full group">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-xl overflow-hidden h-full flex flex-col hover:shadow-2xl transition-all duration-300"
      >
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-bold text-xl text-gray-900 mb-4 line-clamp-2 leading-tight group-hover:text-pink-600 transition-colors">
            {job.title}
          </h3>

          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
            <span className="font-medium text-gray-700 line-clamp-1">{job.company}</span>
          </div>

          <div className="space-y-3 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-pink-500" />
              <span>{daysAgo(job.published_at, t)}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-pink-500" />
              <span>
                {job.location_type === "remote" ? t("jobFilters.remote") : job.location || t("common.offline")}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {job.employment_type && (
              <span className="px-3 py-1 text-xs bg-pink-50 text-pink-700 rounded-lg border border-pink-200">
                {t(`jobFilters.${job.employment_type === "full_time" ? "fullTime" : job.employment_type === "part_time" ? "partTime" : job.employment_type}`) || job.employment_type}
              </span>
            )}
            {job.experience_level && (
              <span className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                {LEVELS[job.experience_level] || job.experience_level}
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-2 text-pink-600 font-medium group-hover:text-pink-700 mt-auto text-sm">
            {t("jobs.details")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default function Jobs() {
  const { t } = useLanguage();
  const location = useLocation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [jobType, setJobType] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/companies/jobs/")
      .then((res) => res.json())
      .then((data) => setJobs(data.results || data || []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [location.key]);

  const filteredAndSorted = useMemo(() => {
    let list = jobs.filter((job) => {
      const matchSearch = !search ||
        job.title?.toLowerCase().includes(search.toLowerCase()) ||
        job.company?.toLowerCase().includes(search.toLowerCase());

      const matchRegion = !region ||
        (region === "remote" && job.location_type === "remote") ||
        (region === "hybrid" && job.location_type === "hybrid") ||
        (region === "on_site" && job.location_type === "on_site") ||
        (region === "tashkent" && job.location?.toLowerCase().includes("ташкент"));

      const matchIndustry = !industry || job.company_industry === industry;
      const matchJobType = !jobType || job.employment_type === jobType;
      const matchLevel = !level || job.experience_level === level;

      return matchSearch && matchRegion && matchIndustry && matchJobType && matchLevel;
    });

    if (sort === "newest") list = [...list].sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
    if (sort === "oldest") list = [...list].sort((a, b) => (a.published_at || "").localeCompare(b.published_at || ""));
    if (sort === "a-z") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "z-a") list = [...list].sort((a, b) => b.title.localeCompare(a.title));

    return list;
  }, [jobs, search, region, industry, jobType, level, sort]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/70 to-purple-50/40 relative overflow-hidden">
      {/* 3D Фон */}
      <Background3D />

      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16 z-10">
        {/* Заголовок */}
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-pink-200 text-pink-700 font-medium shadow-sm">
            <Briefcase className="w-5 h-5" />
            {t("jobs.badge")}
          </span>
          <h1 className="font-display font-bold text-5xl lg:text-6xl text-gray-900 mt-6 tracking-tighter">
            {t("jobs.title")}
          </h1>
          <p className="mt-6 text-lg text-gray-700 max-w-2xl mx-auto">
            {t("jobs.subtitle")}
          </p>
        </div>

        {/* Блок фильтров */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-2xl border border-white rounded-3xl shadow-xl p-6 mb-12"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
              <input
                type="text"
                placeholder={t("jobFilters.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-14 pr-5 py-3.5 bg-white border border-pink-100 rounded-2xl focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none text-base"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-5 py-3.5 bg-white border border-pink-100 rounded-2xl focus:border-pink-400 outline-none text-sm min-w-[180px]"
            >
              {[
                { value: "newest", key: "sortNewest" },
                { value: "oldest", key: "sortOldest" },
                { value: "a-z", key: "sortAZ" },
                { value: "z-a", key: "sortZA" },
              ].map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`jobFilters.${opt.key}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-4 py-3 bg-white border border-pink-100 rounded-2xl focus:border-pink-400 outline-none text-sm"
            >
              {[
                { value: "", key: "allRegions" },
                { value: "tashkent", key: "tashkent" },
                { value: "samarkand", key: "samarkand" },
                { value: "remote", key: "remote" },
                { value: "hybrid", key: "hybrid" },
                { value: "on_site", key: "onSite" },
              ].map((r) => (
                <option key={r.value} value={r.value}>{t(`jobFilters.${r.key}`)}</option>
              ))}
            </select>

            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="px-4 py-3 bg-white border border-pink-100 rounded-2xl focus:border-pink-400 outline-none text-sm"
            >
              <option value="">{t("jobFilters.allIndustries")}</option>
              {["fintech", "edtech", "telecom", "software", "other"].map((v) => (
                <option key={v} value={v}>{t(`jobFilters.${v}`)}</option>
              ))}
            </select>

            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="px-4 py-3 bg-white border border-pink-100 rounded-2xl focus:border-pink-400 outline-none text-sm"
            >
              <option value="">{t("jobFilters.allTypes")}</option>
              {[
                { value: "full_time", key: "fullTime" },
                { value: "part_time", key: "partTime" },
                { value: "contract", key: "contract" },
                { value: "internship", key: "internship" },
              ].map((opt) => (
                <option key={opt.value} value={opt.value}>{t(`jobFilters.${opt.key}`)}</option>
              ))}
            </select>

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-4 py-3 bg-white border border-pink-100 rounded-2xl focus:border-pink-400 outline-none text-sm"
            >
              <option value="">{t("jobFilters.allLevels")}</option>
              {Object.entries(LEVELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Список вакансий */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 bg-white/50 rounded-3xl animate-pulse" />
              ))}
            </motion.div>
          ) : filteredAndSorted.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <Briefcase className="w-16 h-16 mx-auto mb-6 text-pink-300" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">{t("jobs.emptyTitle")}</h3>
              <p className="text-gray-600 mb-6">{t("jobs.emptySubtitle")}</p>
              <button
                onClick={() => {
                  setSearch("");
                  setRegion("");
                  setIndustry("");
                  setJobType("");
                  setLevel("");
                }}
                className="px-8 py-3 rounded-2xl border border-pink-200 text-pink-600 hover:bg-pink-50 font-medium"
              >
                {t("jobs.resetFilters")}
              </button>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSorted.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}