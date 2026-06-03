import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../api";
import { pickLocalized } from "../utils/localizedContent";
import {
  Building2,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  BadgeCheck,
  FileText,
  Search,
  Clock,
  X,
  Briefcase,
  Users,
  Plus,
  ToggleLeft,
  ToggleRight,
  Eye,
  CheckCircle2,
  XCircle,
  Star,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  BarChart3,
  MessageCircle,
  Calendar,
  Send,
} from "lucide-react";

/* ───── types ───── */
type CompanyInfo = {
  id: number;
  company_name: string;
  slug: string;
  industry: string;
  size: string;
  location: string;
  is_verified: boolean;
  is_approved_for_talents: boolean;
  description: string;
  website: string;
  logo: string | null;
};
type DashStats = {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  new_applications: number;
  shortlisted: number;
  is_approved_for_talents: boolean;
};
type JobItem = {
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
  experience_level: string;
  employment_type: string;
  location_type: string;
  salary_min: string | null;
  salary_max: string | null;
  apply_url: string;
  is_active: boolean;
  published_at: string | null;
  applications_count: number;
  new_applications: number;
};
type ApplicantUser = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  university: string;
  is_verified: boolean;
  profile_photo: string | null;
  cv_file: string | null;
};
type ApplicationItem = {
  id: number;
  status: string;
  applied_at: string | null;
  cover_letter: string;
  resume_url: string | null;
  job?: { id: number; title: string; title_ru?: string; title_uz?: string; title_en?: string };
  applicant: ApplicantUser;
};
type Participant = {
  id: number;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  phone: string;
  city: string;
  education_status: string;
  university: string;
  bio: string;
  total_checkins: number;
  cv_file: string | null;
  profile_photo: string | null;
};

type Tab = "overview" | "jobs" | "applicants" | "talents" | "chats";

type ChatRoom = {
  id: number;
  application_id: number;
  job_title: string;
  other_user: { id: number; full_name: string; profile_photo: string | null };
  unread_count: number;
  last_message: { id: number; sender_id: number; text: string; created_at: string | null } | null;
  interview: { id: number; scheduled_at: string; status: string; format: string; location: string } | null;
  created_at: string | null;
};
type ChatMsg = { id: number; sender_id: number; text: string; is_read: boolean; created_at: string | null };

const STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  viewed: "Просмотрен",
  shortlisted: "В шорт-листе",
  rejected: "Отклонён",
  hired: "Принят",
};
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  viewed: "bg-gray-50 text-gray-600 border-gray-200",
  shortlisted: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const EXP_LABELS: Record<string, string> = { junior: "Junior", middle: "Middle", senior: "Senior", lead: "Lead" };
const EMP_LABELS: Record<string, string> = { full_time: "Full time", part_time: "Part time", contract: "Contract", internship: "Internship" };
const LOC_LABELS: Record<string, string> = { on_site: "Офис", remote: "Удалённо", hybrid: "Гибрид" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ═══════════════════════════════════ */
export default function CompanyDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");

  /* overview */
  const [stats, setStats] = useState<DashStats | null>(null);

  /* jobs */
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const emptyJobForm = {
    title: "",
    description: "",
    requirements: "",
    experience_level: "junior",
    employment_type: "full_time",
    location_type: "on_site",
    salary_min: "",
    salary_max: "",
    apply_url: "",
  };
  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [jobFormError, setJobFormError] = useState("");
  const [jobSubmitting, setJobSubmitting] = useState(false);

  /* applicants */
  const [applicants, setApplicants] = useState<ApplicationItem[]>([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  /* talents */
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [talentsLoading, setTalentsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  /* chats */
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [openRoomId, setOpenRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ scheduled_at: "", duration_minutes: "30", format: "online", location: "", note: "" });
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);

  const canAccess = !!user?.is_company_user;

  /* ── fetchers ── */
  const fetchCompanyMe = useCallback(async () => {
    try {
      const res = await apiFetch("/api/companies/me/");
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Ошибка"); return; }
      const d = await res.json();
      setCompany(d.company);
      setRole(d.role || "");
    } catch { setError("Ошибка сети"); }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiFetch("/api/companies/dashboard/");
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const res = await apiFetch("/api/companies/my-jobs/");
      if (res.ok) { const d = await res.json(); setJobs(d.results || []); }
    } catch { /* ignore */ } finally { setJobsLoading(false); }
  }, []);

  const fetchApplicants = useCallback(async () => {
    setApplicantsLoading(true);
    try {
      const res = await apiFetch("/api/companies/my-applicants/");
      if (res.ok) { const d = await res.json(); setApplicants(d.results || []); }
    } catch { /* ignore */ } finally { setApplicantsLoading(false); }
  }, []);

  const fetchTalents = useCallback(async () => {
    setTalentsLoading(true);
    try {
      const res = await apiFetch("/api/companies/talents/");
      if (res.ok) { const d = await res.json(); setParticipants(d.results || []); }
    } catch { /* ignore */ } finally { setTalentsLoading(false); }
  }, []);

  const fetchChats = useCallback(async () => {
    setChatsLoading(true);
    try {
      const res = await apiFetch("/api/chat/rooms/");
      if (res.ok) { const d = await res.json(); setChatRooms(d.results || []); }
    } catch {}
    finally { setChatsLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!canAccess) { setLoading(false); return; }
    (async () => {
      await fetchCompanyMe();
      setLoading(false);
    })();
  }, [authLoading, canAccess, fetchCompanyMe]);

  useEffect(() => {
    if (!company) return;
    if (tab === "overview") fetchStats();
    if (tab === "jobs") fetchJobs();
    if (tab === "applicants") fetchApplicants();
    if (tab === "talents" && company.is_approved_for_talents) fetchTalents();
    if (tab === "chats") fetchChats();
  }, [tab, company, fetchStats, fetchJobs, fetchApplicants, fetchTalents, fetchChats]);

  /* ── actions ── */
  const createJob = async () => {
    setJobFormError("");
    setJobSubmitting(true);
    try {
      const res = await apiFetch("/api/companies/my-jobs/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...jobForm,
          salary_min: jobForm.salary_min ? Number(jobForm.salary_min) : null,
          salary_max: jobForm.salary_max ? Number(jobForm.salary_max) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const fieldErrors = d.field_errors && typeof d.field_errors === "object"
          ? Object.values(d.field_errors).join(" ")
          : "";
        setJobFormError(fieldErrors || d.error || "Ошибка создания");
        return;
      }
      setShowJobForm(false);
      setJobForm(emptyJobForm);
      fetchJobs();
      fetchStats();
    } catch { setJobFormError("Ошибка сети"); } finally { setJobSubmitting(false); }
  };

  const toggleJob = async (id: number) => {
    await apiFetch(`/api/companies/my-jobs/${id}/toggle/`, { method: "POST" });
    fetchJobs();
    fetchStats();
  };

  const updateAppStatus = async (appId: number, status: string) => {
    setStatusUpdating(appId);
    try {
      await apiFetch(`/api/companies/applicants/${appId}/status/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchApplicants();
      fetchStats();
    } catch { /* ignore */ } finally { setStatusUpdating(null); }
  };

  /* ── guards ── */
  if (authLoading || loading) {
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50/50"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>);
  }
  if (!user) {
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50/50 p-4"><div className="text-center"><p className="text-gray-700 mb-4">Войдите, чтобы открыть панель компании.</p><Link to={`/login?next=${encodeURIComponent("/company")}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium">Войти</Link></div></div>);
  }
  if (!canAccess) {
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50/50 p-4"><div className="flex flex-col items-center gap-4 max-w-md text-center"><div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center"><ShieldAlert className="w-8 h-8 text-rose-600" /></div><h1 className="text-xl font-semibold text-gray-800">Доступ запрещён</h1><p className="text-gray-600">Эта страница доступна только для аккаунтов компаний.</p><Link to="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"><ArrowLeft className="w-4 h-4" /> На главную</Link></div></div>);
  }
  if (error) {
    return (<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50/50 p-4"><div className="text-center text-red-600">{error}</div></div>);
  }

  const filteredTalents = search
    ? participants.filter((p) =>
        p.display_name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.city.toLowerCase().includes(search.toLowerCase()) ||
        p.university.toLowerCase().includes(search.toLowerCase()))
    : participants;

  const totalUnread = chatRooms.reduce((sum, r) => sum + r.unread_count, 0);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "overview", label: "Обзор", icon: <BarChart3 className="w-4 h-4" /> },
    { key: "jobs", label: "Вакансии", icon: <Briefcase className="w-4 h-4" />, badge: stats?.active_jobs },
    { key: "applicants", label: "Отклики", icon: <Users className="w-4 h-4" />, badge: stats?.new_applications },
    { key: "chats", label: "Чаты", icon: <MessageCircle className="w-4 h-4" />, badge: totalUnread > 0 ? totalUnread : undefined },
    { key: "talents", label: "Участники", icon: <BadgeCheck className="w-4 h-4" /> },
  ];

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="p-2 rounded-xl hover:bg-white/60 text-gray-500 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 truncate">{company?.company_name || "Компания"}</h1>
              {company?.is_verified && <BadgeCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            </div>
            <p className="text-sm text-gray-500 truncate">
              {company?.industry} · {company?.size} · {company?.location}
              {role && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{role}</span>}
            </p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-6 bg-white/70 backdrop-blur-xl rounded-2xl p-1.5 border border-blue-100/60 shadow-sm overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-white/20 text-white" : "bg-blue-100 text-blue-600"}`}>{t.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ══════ OVERVIEW TAB ══════ */}
        {tab === "overview" && (
          <div className="space-y-6">
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Вакансий", val: stats.total_jobs, color: "blue" },
                  { label: "Активные", val: stats.active_jobs, color: "emerald" },
                  { label: "Откликов", val: stats.total_applications, color: "purple" },
                  { label: "Новые", val: stats.new_applications, color: "amber" },
                  { label: "Шорт-лист", val: stats.shortlisted, color: "rose" },
                ].map((s) => (
                  <div key={s.label} className={`bg-white/85 backdrop-blur-xl rounded-2xl border border-${s.color}-100 p-5 shadow-sm`}>
                    <div className={`text-3xl font-bold text-${s.color}-600`}>{s.val}</div>
                    <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
            )}

            {company && !company.is_approved_for_talents && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
                <Clock className="w-8 h-8 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ожидание одобрения</h3>
                  <p className="text-gray-600 text-sm">Администратор должен одобрить доступ к списку верифицированных участников. После одобрения вкладка «Участники» станет доступна.</p>
                </div>
              </div>
            )}

            {company?.is_approved_for_talents && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4">
                <BadgeCheck className="w-8 h-8 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Доступ к участникам одобрен</h3>
                  <p className="text-gray-600 text-sm">Вы можете просматривать профили верифицированных участников во вкладке «Участники».</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ JOBS TAB ══════ */}
        {tab === "jobs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Мои вакансии ({jobs.length})</h2>
              <button type="button" onClick={() => setShowJobForm(!showJobForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Новая вакансия
              </button>
            </div>

            {/* Job form */}
            {showJobForm && (
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-blue-100 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Создать вакансию</h3>
                {jobFormError && <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 border border-red-200">{jobFormError}</div>}
                <input value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="Название вакансии *" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 outline-none text-sm" />
                <textarea value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Описание *" rows={4} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 outline-none text-sm resize-none" />
                <textarea value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} placeholder="Требования" rows={3} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 outline-none text-sm resize-none" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select value={jobForm.experience_level} onChange={(e) => setJobForm({ ...jobForm, experience_level: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 outline-none text-sm bg-white">
                    <option value="junior">Junior</option><option value="middle">Middle</option><option value="senior">Senior</option><option value="lead">Lead</option>
                  </select>
                  <select value={jobForm.employment_type} onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 outline-none text-sm bg-white">
                    <option value="full_time">Full time</option><option value="part_time">Part time</option><option value="contract">Contract</option><option value="internship">Internship</option>
                  </select>
                  <select value={jobForm.location_type} onChange={(e) => setJobForm({ ...jobForm, location_type: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 outline-none text-sm bg-white">
                    <option value="on_site">Офис</option><option value="remote">Удалённо</option><option value="hybrid">Гибрид</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={jobForm.salary_min} onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })} placeholder="Зарплата от" type="number" className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 outline-none text-sm" />
                  <input value={jobForm.salary_max} onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })} placeholder="Зарплата до" type="number" className="px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 outline-none text-sm" />
                </div>
                <input value={jobForm.apply_url} onChange={(e) => setJobForm({ ...jobForm, apply_url: e.target.value })} placeholder="Ссылка для отклика на сайте работодателя (https://...)" type="url" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 outline-none text-sm" />
                <div className="flex gap-3">
                  <button type="button" onClick={createJob} disabled={jobSubmitting} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {jobSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Опубликовать
                  </button>
                  <button type="button" onClick={() => setShowJobForm(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Отмена</button>
                </div>
              </div>
            )}

            {/* Job list */}
            {jobsLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-white/60 rounded-2xl border border-blue-100/40">
                <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p>У вас пока нет вакансий</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((j) => (
                  <div key={j.id} className={`bg-white/85 backdrop-blur-xl rounded-2xl border shadow-sm p-5 transition-all ${j.is_active ? "border-blue-100" : "border-gray-200 opacity-60"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {pickLocalized(j, "title", locale)}
                          </h3>
                          {!j.is_active && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Неактивна</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">{EXP_LABELS[j.experience_level] || j.experience_level}</span>
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-600">{EMP_LABELS[j.employment_type] || j.employment_type}</span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{LOC_LABELS[j.location_type] || j.location_type}</span>
                          {j.salary_min && <span className="text-gray-400">{j.salary_min}{j.salary_max ? ` – ${j.salary_max}` : "+"}</span>}
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {pickLocalized(j, "description", locale)}
                        </p>
                        {j.apply_url && (
                          <a href={j.apply_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                            <Send className="w-3 h-3" /> Ссылка для отклика
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-900">{j.applications_count}</div>
                          <div className="text-[10px] text-gray-400">откликов</div>
                        </div>
                        {j.new_applications > 0 && (
                          <div className="text-center">
                            <div className="text-lg font-bold text-amber-600">{j.new_applications}</div>
                            <div className="text-[10px] text-amber-500">новых</div>
                          </div>
                        )}
                        <button type="button" onClick={() => toggleJob(j.id)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors" title={j.is_active ? "Деактивировать" : "Активировать"}>
                          {j.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500" /> : <ToggleLeft className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ APPLICANTS TAB ══════ */}
        {tab === "applicants" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Все отклики ({applicants.length})</h2>
            {applicantsLoading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-white/60 rounded-2xl border border-blue-100/40">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p>Пока нет откликов на ваши вакансии</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applicants.map((a) => (
                  <div key={a.id} className="bg-white/85 backdrop-blur-xl rounded-2xl border border-blue-100/60 shadow-sm p-5">
                    <div className="flex items-start gap-4">
                      {/* avatar */}
                      {a.applicant.profile_photo ? (
                        <img src={a.applicant.profile_photo} alt="" className="w-11 h-11 rounded-xl object-cover border border-blue-100 flex-shrink-0" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                          {(a.applicant.full_name?.[0] || "?").toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-gray-900">{a.applicant.full_name}</span>
                          {a.applicant.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />}
                        </div>
                        <div className="text-xs text-gray-500 mb-1">{a.applicant.email} · {a.applicant.city || "—"}</div>
                        {a.job && (
                          <div className="text-xs text-blue-600 font-medium mb-2">
                            📋 {pickLocalized(a.job, "title", locale)}
                          </div>
                        )}
                        {a.cover_letter && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 mb-2 line-clamp-3">{a.cover_letter}</p>}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${STATUS_COLORS[a.status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>{STATUS_LABELS[a.status] || a.status}</span>
                          <span className="text-xs text-gray-400">{fmtDate(a.applied_at)}</span>
                          {a.resume_url && (
                            <a href={a.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline">
                              <FileText className="w-3 h-3" /> Резюме
                            </a>
                          )}
                          {a.applicant.cv_file && (
                            <a href={a.applicant.cv_file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:underline">
                              <FileText className="w-3 h-3" /> CV
                            </a>
                          )}
                        </div>
                      </div>
                      {/* action buttons */}
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        {a.status === "new" && (
                          <button type="button" onClick={() => updateAppStatus(a.id, "viewed")} disabled={statusUpdating === a.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors disabled:opacity-50">
                            <Eye className="w-3 h-3" /> Просмотрено
                          </button>
                        )}
                        {a.status !== "shortlisted" && a.status !== "hired" && (
                          <button type="button" onClick={() => updateAppStatus(a.id, "shortlisted")} disabled={statusUpdating === a.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors disabled:opacity-50">
                            <Star className="w-3 h-3" /> В шорт-лист
                          </button>
                        )}
                        {a.status !== "hired" && (
                          <button type="button" onClick={() => updateAppStatus(a.id, "hired")} disabled={statusUpdating === a.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50">
                            <CheckCircle2 className="w-3 h-3" /> Принять
                          </button>
                        )}
                        {a.status !== "rejected" && (
                          <button type="button" onClick={() => updateAppStatus(a.id, "rejected")} disabled={statusUpdating === a.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50">
                            <XCircle className="w-3 h-3" /> Отклонить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ TALENTS TAB ══════ */}
        {tab === "talents" && (
          <div className="space-y-4">
            {!company?.is_approved_for_talents ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                <Clock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ожидайте одобрения</h3>
                <p className="text-gray-600 max-w-md mx-auto">Администратор должен одобрить доступ вашей компании к списку верифицированных участников.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-gray-900">Верифицированные участники ({filteredTalents.length})</h2>
                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по имени, email, городу..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 outline-none text-sm" />
                  </div>
                </div>

                {talentsLoading ? (
                  <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
                ) : filteredTalents.length === 0 ? (
                  <div className="text-center py-16 text-gray-500 bg-white/60 rounded-2xl border border-blue-100/40">
                    {search ? "Ничего не найдено" : "Нет верифицированных участников"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTalents.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedParticipant(p)}
                        className="bg-white/85 backdrop-blur-xl rounded-2xl border border-blue-100/60 shadow-sm p-5 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {p.profile_photo ? (
                            <img src={p.profile_photo} alt="" className="w-12 h-12 rounded-xl object-cover border border-blue-100" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold">
                              {(p.first_name?.[0] || "")}{(p.last_name?.[0] || "")}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 truncate">{p.display_name}</span>
                              <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            </div>
                            <div className="text-xs text-gray-500 truncate">{p.email}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {p.city || "—"}</div>
                          <div className="flex items-center gap-1"><GraduationCap className="w-3 h-3 text-gray-400" /> {p.university || "—"}</div>
                          <div className="flex items-center gap-1"><BadgeCheck className="w-3 h-3 text-emerald-400" /> {p.total_checkins} посещений</div>
                          <div className="flex items-center gap-1">
                            {p.cv_file ? <><FileText className="w-3 h-3 text-blue-400" /> <span className="text-blue-600">Есть CV</span></> : <span className="text-gray-400">Нет CV</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Participant Detail Modal ── */}
      {selectedParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelectedParticipant(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Профиль участника</h2>
              <button type="button" onClick={() => setSelectedParticipant(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                {selectedParticipant.profile_photo ? (
                  <img src={selectedParticipant.profile_photo} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-blue-200" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                    {(selectedParticipant.first_name?.[0] || "")}{(selectedParticipant.last_name?.[0] || "")}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{selectedParticipant.display_name}</span>
                    <BadgeCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="text-sm text-gray-500">{selectedParticipant.total_checkins} посещений</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> <span className="text-gray-900">{selectedParticipant.email || "—"}</span></div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> <span className="text-gray-900">{selectedParticipant.phone || "—"}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> <span className="text-gray-900">{selectedParticipant.city || "—"}</span></div>
                <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-gray-400" /> <span className="text-gray-900">{selectedParticipant.education_status || "—"}</span></div>
                <div className="col-span-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" /> <span className="text-gray-900">{selectedParticipant.university || "—"}</span></div>
              </div>
              {selectedParticipant.bio && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">О себе</div>
                  <p className="text-sm text-gray-700">{selectedParticipant.bio}</p>
                </div>
              )}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">CV / Резюме</div>
                {selectedParticipant.cv_file ? (
                  <a href={selectedParticipant.cv_file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium">
                    <FileText className="w-4 h-4" /> Открыть CV
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">CV не загружено</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* ══════ CHATS TAB ══════ */}
        {tab === "chats" && (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Chat rooms list */}
            <div className="lg:col-span-1 bg-white/90 backdrop-blur-xl rounded-2xl border border-blue-100/60 shadow-sm p-4 max-h-[600px] overflow-y-auto">
              <h3 className="font-bold text-gray-900 mb-4">Чаты ({chatRooms.length})</h3>
              {chatsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
              ) : chatRooms.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Нет активных чатов</p>
              ) : (
                <div className="space-y-2">
                  {chatRooms.map((room) => (
                    <button key={room.id} type="button" onClick={() => { setOpenRoomId(room.id); setMsgLoading(true); apiFetch(`/api/chat/rooms/${room.id}/messages/`).then(r => r.json()).then(d => setMessages(d.results || [])).catch(() => {}).finally(() => setMsgLoading(false)); }} className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${openRoomId === room.id ? "bg-blue-50 border-blue-200 shadow-sm" : "bg-white border-gray-100 hover:bg-blue-50/50 hover:border-blue-100"}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-gray-900 line-clamp-1">{room.other_user.full_name}</span>
                        {room.unread_count > 0 && <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{room.unread_count}</span>}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1 mb-1">{room.job_title}</p>
                      {room.last_message && <p className="text-xs text-gray-400 line-clamp-1">{room.last_message.text}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat messages */}
            {openRoomId ? (
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-blue-100/60 shadow-sm flex flex-col" style={{ height: "600px" }}>
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">{chatRooms.find(r => r.id === openRoomId)?.other_user.full_name || "Чат"}</h3>
                  <button type="button" onClick={() => setShowInterviewForm(!showInterviewForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"><Calendar className="w-3.5 h-3.5" /> Пригласить на интервью</button>
                </div>

                {showInterviewForm && (
                  <div className="px-5 py-4 bg-indigo-50/50 border-b border-indigo-100">
                    <h4 className="font-semibold text-sm text-gray-900 mb-3">Приглашение на интервью</h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <input type="datetime-local" value={interviewForm.scheduled_at} onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_at: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                      <input type="number" placeholder="Длительность (мин)" value={interviewForm.duration_minutes} onChange={(e) => setInterviewForm({ ...interviewForm, duration_minutes: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                      <select value={interviewForm.format} onChange={(e) => setInterviewForm({ ...interviewForm, format: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">
                        <option value="online">Online</option>
                        <option value="offline">Офис</option>
                        <option value="phone">Телефон</option>
                      </select>
                      <input placeholder="Ссылка/Адрес" value={interviewForm.location} onChange={(e) => setInterviewForm({ ...interviewForm, location: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                    </div>
                    <textarea placeholder="Примечание..." value={interviewForm.note} onChange={(e) => setInterviewForm({ ...interviewForm, note: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-3" />
                    <div className="flex gap-2">
                      <button type="button" onClick={async () => { if (!interviewForm.scheduled_at) return; setInterviewSubmitting(true); try { await apiFetch(`/api/chat/rooms/${openRoomId}/interview/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(interviewForm) }); setShowInterviewForm(false); setInterviewForm({ scheduled_at: "", duration_minutes: "30", format: "online", location: "", note: "" }); } catch {} finally { setInterviewSubmitting(false); } }} disabled={interviewSubmitting || !interviewForm.scheduled_at} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Отправить</button>
                      <button type="button" onClick={() => setShowInterviewForm(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Отмена</button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {msgLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">Нет сообщений</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className={`flex ${m.sender_id === Number(user?.id) ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.sender_id === Number(user?.id) ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                          {m.text}
                          <div className={`text-[10px] mt-1 ${m.sender_id === Number(user?.id) ? "text-blue-200" : "text-gray-400"}`}>{m.created_at ? new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
                  <input value={msgText} onChange={(e) => setMsgText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!msgText.trim()) return; setSending(true); apiFetch(`/api/chat/rooms/${openRoomId}/send/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: msgText }) }).then(r => r.json()).then(d => { setMessages(p => [...p, d.message]); setMsgText(""); }).catch(() => {}).finally(() => setSending(false)); } }} placeholder="Написать сообщение..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 outline-none text-sm" />
                  <button type="button" onClick={() => { if (!msgText.trim()) return; setSending(true); apiFetch(`/api/chat/rooms/${openRoomId}/send/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: msgText }) }).then(r => r.json()).then(d => { setMessages(p => [...p, d.message]); setMsgText(""); }).catch(() => {}).finally(() => setSending(false)); }} disabled={sending || !msgText.trim()} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-blue-100/60 shadow-sm flex flex-col items-center justify-center gap-3" style={{ height: "600px" }}>
                <MessageCircle className="w-16 h-16 text-gray-300" />
                <div className="text-center">
                  <p className="text-gray-600 font-medium mb-1">Выберите чат</p>
                  <p className="text-sm text-gray-400">Кликните на чат слева, чтобы начать общение</p>
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
