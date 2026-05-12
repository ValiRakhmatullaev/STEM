import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiFetch } from "../api";
import {
  Users,
  Building2,
  Calendar,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  ShieldAlert,
  BarChart3,
  X,
  BadgeCheck,
  FileText,
  CheckCircle2,
} from "lucide-react";

type TabId = "users" | "companies" | "events" | "analytics";

type UserRow = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
  total_checkins: number;
  has_cv: boolean;
  date_joined: string | null;
};

type CompanyRow = {
  id: number;
  company_name: string;
  slug: string;
  industry: string;
  size: string;
  location: string;
  is_verified: boolean;
  is_approved_for_talents: boolean;
  website: string;
};

type UserDetail = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  bio: string;
  age: number | null;
  city: string;
  education_status: string;
  university: string;
  is_staff: boolean;
  is_active: boolean;
  is_verified: boolean;
  verified_at: string | null;
  total_checkins: number;
  cv_file: string | null;
  profile_photo: string | null;
  date_joined: string | null;
  attended_events: Array<{
    event_id: number;
    event_title: string;
    checked_in_at: string | null;
  }>;
};

type RegistrationRow = {
  id: number;
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  is_waitlist: boolean;
  registered_at: string | null;
  visits_count: number;
};

type EventWithRegs = {
  id: number;
  title: string;
  date: string | null;
  time: string | null;
  location: string;
  capacity: number;
  registered_count: number;
  waitlist_count: number;
  registrations: RegistrationRow[];
};

type UsersAnalytics = {
  summary: {
    total_users: number;
    active_users: number;
    staff_users: number;
    verified_email_users: number;
    age: {
      count: number;
      avg: number | null;
      min: number | null;
      max: number | null;
    };
  };
  education_status_breakdown: Array<{
    status: string | null;
    label: string;
    count: number;
  }>;
  city_top: Array<{ city: string; count: number }>;
  age_buckets: Array<{ bucket: string; count: number }>;
  registrations_last_6_months: Array<{ month: string | null; count: number }>;
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<TabId>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [eventsRegs, setEventsRegs] = useState<EventWithRegs[]>([]);
  const [usersAnalytics, setUsersAnalytics] = useState<UsersAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/users/?search=${encodeURIComponent(search)}`
        : "/api/admin/users/";
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setUsers(data.results || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const url = search
        ? `/api/admin/companies/?search=${encodeURIComponent(search)}`
        : "/api/admin/companies/";
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setCompanies(data.results || []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchEventsRegs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/event-registrations/");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setEventsRegs(data.results || []);
    } catch {
      setEventsRegs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsersAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/admin/users-analytics/");
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setUsersAnalytics(data || null);
    } catch {
      setUsersAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserDetail = useCallback(async (userId: number) => {
    setUserDetailLoading(true);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/`);
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data: UserDetail = await res.json();
      setSelectedUser(data);
    } catch {
      setSelectedUser(null);
    } finally {
      setUserDetailLoading(false);
    }
  }, []);

  const handleApproveTalents = useCallback(async (companyId: number, approve: boolean) => {
    try {
      const res = await apiFetch(`/api/admin/companies/${companyId}/approve-talents/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approve }),
      });
      if (!res.ok) throw new Error("Ошибка");
      fetchCompanies();
    } catch {
      // ignore
    }
  }, [fetchCompanies]);

  useEffect(() => {
    if (!user?.is_staff) return;
    if (tab === "users") fetchUsers();
    else if (tab === "companies") fetchCompanies();
    else if (tab === "events") fetchEventsRegs();
    else if (tab === "analytics") fetchUsersAnalytics();
  }, [user?.is_staff, tab, fetchUsers, fetchCompanies, fetchEventsRegs, fetchUsersAnalytics]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70 p-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Войдите, чтобы открыть панель администратора.</p>
          <Link
            to={`/login?next=${encodeURIComponent("/admin")}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 text-white font-medium"
          >
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (!user.is_staff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70 p-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Доступ запрещён</h1>
          <p className="text-gray-600">Эта страница доступна только администраторам.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "users" as TabId, label: "Пользователи", icon: Users },
    { id: "companies" as TabId, label: "Компании", icon: Building2 },
    { id: "events" as TabId, label: "Регистрации на мероприятия", icon: Calendar },
    { id: "analytics" as TabId, label: "Аналитика пользователей", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-pink-600 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            На главную
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
          <Link
            to="/checkins-panel"
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-500 text-white text-sm font-medium hover:bg-pink-600"
          >
            Check-in страница
          </Link>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                tab === id
                  ? "bg-pink-500 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {(tab === "users" || tab === "companies") && (
          <div className="mb-6">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 outline-none text-gray-800"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : tab === "users" ? (
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Имя</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Телефон</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Верифицирован</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Посещений</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">CV</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Дата регистрации</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-pink-50/40 cursor-pointer transition-colors"
                      onClick={() => fetchUserDetail(u.id)}
                    >
                      <td className="px-4 py-3 text-gray-500">{u.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-pink-700 hover:underline">
                          {u.display_name || u.username}
                        </span>
                        {u.is_staff && (
                          <span className="ml-2 text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full">staff</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{u.email || "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{u.phone || "—"}</td>
                      <td className="px-4 py-3">
                        {u.is_verified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <BadgeCheck className="w-4 h-4" /> Да
                          </span>
                        ) : (
                          <span className="text-gray-400">Нет</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{u.total_checkins}</td>
                      <td className="px-4 py-3">
                        {u.has_cv ? (
                          <FileText className="w-4 h-4 text-blue-500" />
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {u.date_joined
                          ? new Date(u.date_joined).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="py-12 text-center text-gray-500">Нет пользователей</div>
            )}
          </div>
        ) : tab === "companies" ? (
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Название</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Отрасль</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Размер</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Место</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Верифицирована</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Доступ к участникам</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500">{c.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{c.company_name}</td>
                      <td className="px-4 py-3 text-gray-700">{c.industry}</td>
                      <td className="px-4 py-3 text-gray-700">{c.size}</td>
                      <td className="px-4 py-3 text-gray-700">{c.location || "—"}</td>
                      <td className="px-4 py-3">
                        {c.is_verified ? (
                          <span className="text-emerald-600 font-medium">Да</span>
                        ) : (
                          <span className="text-gray-400">Нет</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.is_approved_for_talents ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-xs">
                              <CheckCircle2 className="w-4 h-4" /> Одобрено
                            </span>
                            <button
                              type="button"
                              onClick={() => handleApproveTalents(c.id, false)}
                              className="text-xs text-red-500 hover:text-red-700 underline"
                            >
                              Отозвать
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleApproveTalents(c.id, true)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                          >
                            Одобрить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {companies.length === 0 && (
              <div className="py-12 text-center text-gray-500">Нет компаний</div>
            )}
          </div>
        ) : tab === "analytics" ? (
          <div className="space-y-6">
            {!usersAnalytics ? (
              <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center text-gray-500">
                Нет данных
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Всего пользователей</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {usersAnalytics.summary.total_users}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Активные</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {usersAnalytics.summary.active_users}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Админы (staff)</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {usersAnalytics.summary.staff_users}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="text-sm text-gray-500">Email подтвержден</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">
                      {usersAnalytics.summary.verified_email_users}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">Статус обучения</div>
                      <div className="text-sm text-gray-500 mt-1">Распределение по education_status</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">Статус</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Кол-во</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersAnalytics.education_status_breakdown.map((r, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="px-4 py-3 text-gray-700">{r.label}</td>
                              <td className="px-4 py-3 text-gray-900 font-medium">{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">Топ городов</div>
                      <div className="text-sm text-gray-500 mt-1">По полю city (Top 10)</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">Город</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Кол-во</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersAnalytics.city_top.map((r, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="px-4 py-3 text-gray-700">{r.city}</td>
                              <td className="px-4 py-3 text-gray-900 font-medium">{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">Возраст (бакеты)</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Средний:{" "}
                        {usersAnalytics.summary.age.avg !== null ? usersAnalytics.summary.age.avg.toFixed(1) : "—"}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">Бакет</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Кол-во</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersAnalytics.age_buckets.map((r, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="px-4 py-3 text-gray-700">{r.bucket}</td>
                              <td className="px-4 py-3 text-gray-900 font-medium">{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">Регистрации (последние 6 месяцев)</div>
                      <div className="text-sm text-gray-500 mt-1">По date_joined</div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 font-semibold text-gray-700">Месяц</th>
                            <th className="px-4 py-3 font-semibold text-gray-700">Кол-во</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersAnalytics.registrations_last_6_months.map((r, idx) => (
                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                              <td className="px-4 py-3 text-gray-700">
                                {r.month ? new Date(r.month).toLocaleDateString("ru-RU", { month: "short", year: "numeric" }) : "—"}
                              </td>
                              <td className="px-4 py-3 text-gray-900 font-medium">{r.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {eventsRegs.map((ev) => {
              const isExpanded = expandedEventId === ev.id;
              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedEventId(isExpanded ? null : ev.id)
                    }
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{ev.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {ev.date && ev.time
                          ? `${new Date(ev.date).toLocaleDateString("ru-RU")} ${ev.time}`
                          : "—"}
                        {" · "}
                        {ev.registered_count} / {ev.capacity} записей
                        {ev.waitlist_count > 0 && ` · ${ev.waitlist_count} в листе ожидания`}
                      </div>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      <div className="px-5 py-4">
                        <div className="text-sm font-medium text-gray-700 mb-3">
                          Участники ({ev.registrations.length})
                        </div>
                        {ev.registrations.length === 0 ? (
                          <p className="text-gray-500 text-sm">Пока никто не зарегистрирован</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 text-left">
                                  <th className="pb-2 pr-4 font-medium">Имя</th>
                                  <th className="pb-2 pr-4 font-medium">Email</th>
                                  <th className="pb-2 pr-4 font-medium">Логин</th>
                                  <th className="pb-2 pr-4 font-medium">Статус</th>
                                  <th className="pb-2 pr-4 font-medium">Дата записи</th>
                                  <th className="pb-2 font-medium">Посещений</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ev.registrations.map((r) => (
                                  <tr key={r.id} className="border-t border-gray-100">
                                    <td className="py-2 pr-4 text-gray-900">{r.full_name || "—"}</td>
                                    <td className="py-2 pr-4 text-gray-700">{r.email || "—"}</td>
                                    <td className="py-2 pr-4 text-gray-700">{r.username}</td>
                                    <td className="py-2 pr-4">
                                      {r.is_waitlist ? (
                                        <span className="text-amber-600">Лист ожидания</span>
                                      ) : (
                                        <span className="text-emerald-600">Записан</span>
                                      )}
                                    </td>
                                    <td className="py-2 pr-4 text-gray-500">
                                      {r.registered_at
                                        ? new Date(r.registered_at).toLocaleString("ru-RU")
                                        : "—"}
                                    </td>
                                    <td className="py-2 text-gray-500">{r.visits_count}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {eventsRegs.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center text-gray-500">
                Нет мероприятий с регистрациями
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Профиль участника</h2>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userDetailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
              </div>
            ) : (
              <div className="px-6 py-5 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-4">
                  {selectedUser.profile_photo ? (
                    <img
                      src={selectedUser.profile_photo}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover border-2 border-pink-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
                      {(selectedUser.first_name?.[0] || "")}{(selectedUser.last_name?.[0] || "")}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900">{selectedUser.display_name}</span>
                      {selectedUser.is_verified && (
                        <BadgeCheck className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-500">@{selectedUser.username}</div>
                  </div>
                </div>

                {/* Verified status */}
                {selectedUser.is_verified && (
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                    <BadgeCheck className="w-4 h-4" />
                    Верифицирован
                    {selectedUser.verified_at && (
                      <span className="text-emerald-500 ml-1">
                        ({new Date(selectedUser.verified_at).toLocaleDateString("ru-RU")})
                      </span>
                    )}
                    <span className="ml-auto font-medium">{selectedUser.total_checkins} посещений</span>
                  </div>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Email:</span> <span className="text-gray-900">{selectedUser.email || "—"}</span></div>
                  <div><span className="text-gray-500">Телефон:</span> <span className="text-gray-900">{selectedUser.phone || "—"}</span></div>
                  <div><span className="text-gray-500">Возраст:</span> <span className="text-gray-900">{selectedUser.age ?? "—"}</span></div>
                  <div><span className="text-gray-500">Город:</span> <span className="text-gray-900">{selectedUser.city || "—"}</span></div>
                  <div><span className="text-gray-500">Образование:</span> <span className="text-gray-900">{selectedUser.education_status || "—"}</span></div>
                  <div><span className="text-gray-500">Университет:</span> <span className="text-gray-900">{selectedUser.university || "—"}</span></div>
                </div>

                {selectedUser.bio && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">О себе</div>
                    <p className="text-sm text-gray-700">{selectedUser.bio}</p>
                  </div>
                )}

                {/* CV */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">CV / Резюме</div>
                  {selectedUser.cv_file ? (
                    <a
                      href={selectedUser.cv_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Открыть CV
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">CV не загружено</p>
                  )}
                </div>

                {/* Attended events */}
                {selectedUser.attended_events.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                      Посещённые мероприятия ({selectedUser.attended_events.length})
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedUser.attended_events.map((ev, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-gray-50">
                          <span className="text-gray-800">{ev.event_title}</span>
                          <span className="text-gray-400 text-xs">
                            {ev.checked_in_at
                              ? new Date(ev.checked_in_at).toLocaleDateString("ru-RU")
                              : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
