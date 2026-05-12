import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../api";
import {
  Briefcase,
  Building2,
  Calendar,
  DollarSign,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  MapPin,
  Clock,
} from "lucide-react";

// ====================== 3D Фон (как на главной странице) ======================
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 14 + 7,
  duration: Math.random() * 25 + 15,
  xDrift: Math.random() * 25 - 12,
}));

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "1200px" }}>
    {PARTICLES.map((p) => (
      <motion.div
        key={p.id}
        className="absolute rounded-full bg-gradient-to-br from-pink-300/30 to-purple-400/30 backdrop-blur-sm"
        style={{
          left: `${p.x}%`,
          top: `${p.y}%`,
          width: p.size,
          height: p.size,
        }}
        animate={{
          y: [0, -80, 0],
          x: [0, p.xDrift, 0],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: p.duration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

const GeometricBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ perspective: "2000px" }}>
    <motion.div
      className="absolute top-32 right-24 w-64 h-64"
      style={{ transformStyle: "preserve-3d" }}
      animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-purple-500/10 backdrop-blur-xl rounded-3xl border border-pink-300/20"
        style={{ transform: "translateZ(50px)" }}
      />
    </motion.div>
  </div>
);

// ====================== Константы ======================
const JOB_TYPE_KEYS: Record<string, string> = {
  full_time: "fullTime",
  part_time: "partTime",
  contract: "contract",
  internship: "internship",
};

const LEVELS: Record<string, string> = {
  junior: "Junior",
  middle: "Middle",
  senior: "Senior",
  lead: "Lead",
};

const LOCATION_TYPE_KEYS: Record<string, string> = {
  on_site: "onSite",
  remote: "remote",
  hybrid: "hybrid",
};

const STATUS_KEYS: Record<string, string> = {
  new: "statusNew",
  viewed: "statusViewed",
  shortlisted: "statusShortlisted",
  rejected: "statusRejected",
  hired: "statusHired",
};

function getDateLocale(locale: string): string {
  if (locale === "uz") return "uz-UZ";
  if (locale === "en") return "en-US";
  return "ru-RU";
}

// ====================== Лёгкий TiltCard (только подъём) ======================
const TiltCard = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    whileHover={{ y: -8 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// ====================== Types ======================
interface Company {
  id: number;
  company_name: string;
}

interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  employment_type: string;
  experience_level: string;
  location_type: string;
  salary_min?: number | null;
  salary_max?: number | null;
  published_at: string;
  company: Company;
}

interface ApplicationStatus {
  applied: boolean;
  status: string | null;
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, locale } = useLanguage();

  const formatDate = (dateString: string): string => {
    if (!dateString) return t("jobDetail.dateNotSet");
    const date = new Date(dateString);
    return date.toLocaleDateString(getDateLocale(locale), { day: "numeric", month: "long", year: "numeric" });
  };

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Загрузка вакансии
  useEffect(() => {
    if (!id) {
      setError(t("jobDetail.noId"));
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        const res = await apiFetch(`/api/companies/jobs/${id}/`);
        if (!res.ok) throw new Error(`${t("jobDetail.errorLoad")}: ${res.status}`);
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("jobDetail.errorLoad"));
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  // Проверка статуса заявки
  const fetchApplied = useCallback(async () => {
    if (!user || !id) return;
    try {
      const res = await apiFetch(`/api/jobs/apply/${id}/`);
      if (!res.ok) throw new Error(t("jobDetail.errorLoad"));
      const data: ApplicationStatus = await res.json();
      setApplied(data.applied);
      setApplicationStatus(data.status);
    } catch (err) {
      console.error("Ошибка проверки статуса:", err);
    }
  }, [id, user]);

  useEffect(() => {
    fetchApplied();
  }, [fetchApplied]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    if (file) {
      const maxSize = 5 * 1024 * 1024;
      const parts = file.name.split(".");
      const ext = parts.length > 1 ? "." + parts.pop()!.toLowerCase() : "";
      if (![".pdf", ".doc", ".docx"].includes(ext)) {
        setFileError(t("jobDetail.fileAllowed"));
        setResumeFile(null);
        return;
      }
      if (file.size > maxSize) {
        setFileError(t("jobDetail.fileTooBig"));
        setResumeFile(null);
        return;
      }
    }
    setResumeFile(file);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("cover_letter", coverLetter);
    if (resumeFile) formData.append("resume", resumeFile);

    setApplyError(null);
    try {
      const res = await apiFetch(`/api/jobs/apply/${id}/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || t("jobDetail.errorSubmit"));
      }

      setApplied(true);
      setApplicationStatus("new");
      setShowApplyForm(false);
      setCoverLetter("");
      setResumeFile(null);
    } catch (err: any) {
      setApplyError(err.message || t("jobDetail.errorSubmitGeneric"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
          <p className="mt-4 text-gray-600">{t("jobDetail.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto text-pink-300" />
          <h2 className="text-2xl font-bold mt-6">{error || t("jobDetail.notFound")}</h2>
          <Link to="/jobs" className="mt-6 inline-block text-pink-600 hover:underline">
            ← {t("jobDetail.backToJobs")}
          </Link>
        </div>
      </div>
    );
  }

  const dateLocaleStr = getDateLocale(locale);
  const salary = (() => {
    const min = job.salary_min;
    const max = job.salary_max;
    const cur = t("jobDetail.salaryCurrency");
    if (min && max) return `${min.toLocaleString(dateLocaleStr)} — ${max.toLocaleString(dateLocaleStr)} ${cur}`;
    if (min) return `${t("jobDetail.salaryFrom")} ${min.toLocaleString(dateLocaleStr)} ${cur}`;
    if (max) return `${t("jobDetail.salaryTo")} ${max.toLocaleString(dateLocaleStr)} ${cur}`;
    return t("jobDetail.salaryNegotiable");
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/70 to-purple-50/40 relative overflow-hidden">
      {/* 3D Фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/60 to-rose-50/50" />
      <GeometricBackground />
      <FloatingParticles />

      <div className="relative max-w-4xl mx-auto px-6 py-12 lg:py-16 z-10">
        {/* Кнопка назад */}
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-pink-700 mb-8 group"
        >
          <div className="w-9 h-9 rounded-2xl bg-white shadow flex items-center justify-center group-hover:-translate-x-1 transition">
            <ArrowLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">{t("jobDetail.backToJobs")}</span>
        </Link>

        {/* Компактная карточка вакансии */}
        <TiltCard>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 lg:p-8">
              {/* Компания и заголовок */}
              <Link to={`/companies/${job.company.id}`} className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-pink-600 transition-colors mb-3 group">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-pink-100 transition-colors">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className="font-medium">{job.company.company_name}</span>
              </Link>

              <h1 className="font-bold text-3xl lg:text-4xl text-gray-900 leading-tight mb-8">
                {job.title}
              </h1>

              {/* Информация в сетке */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-pink-50/50 to-rose-50/30 border border-pink-100/40">
                  <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{t("jobDetail.employmentType")}</div>
                    <div className="font-semibold text-gray-900">{t(`jobDetail.${JOB_TYPE_KEYS[job.employment_type] || ""}`) || job.employment_type}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 border border-purple-100/40">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{t("jobDetail.level")}</div>
                    <div className="font-semibold text-gray-900">{LEVELS[job.experience_level] || job.experience_level}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-rose-50/50 to-pink-50/30 border border-rose-100/40">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{t("jobDetail.locationFormat")}</div>
                    <div className="font-semibold text-gray-900">{t(`jobDetail.${LOCATION_TYPE_KEYS[job.location_type] || ""}`) || job.location_type}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100/40">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">{t("jobDetail.salary")}</div>
                    <div className="font-semibold text-gray-900">{salary}</div>
                  </div>
                </div>
              </div>

              {/* Дата публикации */}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-8 px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-100">
                <Calendar className="w-4 h-4" />
                <span>{t("jobDetail.published")}: <span className="font-medium text-gray-700">{formatDate(job.published_at)}</span></span>
              </div>

              {/* Кнопки действий */}
              <div className="flex flex-wrap gap-4 mb-8">
                {!user ? (
                  <Link
                    to="/login"
                    className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-semibold text-center hover:brightness-105 transition-all shadow-lg shadow-pink-200/50"
                  >
                    {t("jobDetail.loginToApply")}
                  </Link>
                ) : user.is_company_user ? (
                  <div className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-medium bg-blue-50 border border-blue-200 text-blue-700">
                    Аккаунт компании — только просмотр
                  </div>
                ) : applied ? (
                  <div className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-medium ${
                    applicationStatus === "rejected" ? "bg-red-50 border border-red-200 text-red-700" :
                    applicationStatus === "hired" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" :
                    "bg-blue-50 border border-blue-200 text-blue-700"
                  }`}>
                    {applicationStatus === "rejected" ? <XCircle className="w-5 h-5" /> :
                     applicationStatus === "hired" ? <CheckCircle2 className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                    <span>
                      {t(`jobDetail.${STATUS_KEYS[applicationStatus || "new"] || ""}`) || t("jobDetail.statusSent")}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowApplyForm(true)}
                    className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-semibold hover:brightness-105 transition-all flex items-center justify-center gap-3 shadow-lg shadow-pink-200/50"
                  >
                    {t("jobDetail.apply")}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}

                <Link
                  to={`/companies/${job.company.id}`}
                  className="flex-1 py-4 border border-pink-200 text-pink-700 rounded-2xl font-semibold hover:bg-pink-50 transition-all text-center"
                >
                  {t("jobDetail.aboutCompany")}
                </Link>
              </div>

              {/* Описание */}
              {job.description && (
                <div className="pt-8 border-t border-pink-100/40">
                  <h2 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-pink-500" />
                    {t("jobDetail.description")}
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px]">
                    {job.description}
                  </div>
                </div>
              )}

              {/* Требования */}
              {job.requirements && (
                <div className="pt-8 mt-8 border-t border-pink-100/40">
                  <h2 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-purple-500" />
                    {t("jobDetail.requirements")}
                  </h2>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line text-[15px]">
                    {job.requirements}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </TiltCard>

        {/* Форма отклика — полностью восстановлена */}
        <AnimatePresence>
          {showApplyForm && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="mt-10"
            >
              <TiltCard>
                <div className="bg-white/95 backdrop-blur-2xl border border-white rounded-3xl shadow-2xl p-8">
                  <h2 className="text-2xl font-bold mb-6">{t("jobDetail.applyTitle")}</h2>
                  <form onSubmit={handleApply} className="space-y-6">
                    {applyError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">
                        {applyError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("jobDetail.coverLetter")}
                      </label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        required
                        rows={6}
                        maxLength={2000}
                        className="w-full rounded-2xl border border-pink-200 p-5 focus:border-pink-400 focus:ring-2 focus:ring-pink-200 outline-none resize-y"
                        placeholder={t("jobDetail.coverLetterPlaceholder")}
                      />
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {coverLetter.length}/2000
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("jobDetail.resume")}
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                      />
                      {fileError && <p className="text-sm text-red-600 mt-2">{fileError}</p>}
                      {resumeFile && (
                        <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowApplyForm(false);
                          setFileError(null);
                          setResumeFile(null);
                        }}
                        className="flex-1 py-4 border border-gray-300 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
                      >
                        {t("jobDetail.cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={submitting || !!fileError}
                        className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-2xl font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:brightness-105 transition-all"
                      >
                        {submitting ? (
                          <Loader2 className="animate-spin w-5 h-5" />
                        ) : (
                          t("jobDetail.submitApplication")
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </TiltCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}