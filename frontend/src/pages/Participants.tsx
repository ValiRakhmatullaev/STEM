import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiFetch } from "../api";
import {
  Users,
  BadgeCheck,
  Search,
  FileText,
  X,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Building2,
  ArrowUpDown,
  Calendar,
  ChevronUp,
  ChevronDown,
  Filter,
  RotateCcw,
} from "lucide-react";

type Participant = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  education_status: string;
  university: string;
  is_verified: boolean;
  is_company_user: boolean;
  is_staff: boolean;
  registered_events_count: number;
  total_checkins: number;
  profile_photo: string | null;
  cv_file: string | null;
  date_joined: string | null;
};

type SortKey = "date_joined" | "full_name" | "total_checkins" | "registered_events_count" | "is_verified";
type SortDir = "asc" | "desc";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Participants() {
  const { user, loading: authLoading } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [selected, setSelected] = useState<Participant | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date_joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [withCvOnly, setWithCvOnly] = useState(false);

  const canAccess = !!user?.is_presence_checker || !!user?.is_staff;

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const q = searchDebounced ? `?search=${encodeURIComponent(searchDebounced)}` : "";
      const res = await apiFetch(`/api/admin/users-for-presence-checker/${q}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setParticipants(data.results || []);
    } catch {
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [searchDebounced]);

  useEffect(() => {
    if (!canAccess) { setLoading(false); return; }
    fetchParticipants();
  }, [canAccess, fetchParticipants]);

  const doSort = (arr: Participant[]) => {
    return [...arr].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date_joined") {
        cmp = (a.date_joined || "").localeCompare(b.date_joined || "");
      } else if (sortKey === "full_name") {
        cmp = (a.full_name || a.username).localeCompare(b.full_name || b.username);
      } else if (sortKey === "total_checkins") {
        cmp = a.total_checkins - b.total_checkins;
      } else if (sortKey === "registered_events_count") {
        cmp = a.registered_events_count - b.registered_events_count;
      } else if (sortKey === "is_verified") {
        cmp = (a.is_verified === b.is_verified) ? 0 : a.is_verified ? 1 : -1;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  };

  const allUsers = useMemo(() => participants.filter((p) => !p.is_company_user), [participants]);
  const companies = useMemo(() => participants.filter((p) => p.is_company_user), [participants]);

  const users = useMemo(() => {
    let list = allUsers;
    if (verifiedOnly) list = list.filter((p) => p.is_verified);
    if (withCvOnly) list = list.filter((p) => p.cv_file);
    return list;
  }, [allUsers, verifiedOnly, withCvOnly]);

  const sortedUsers = useMemo(() => doSort(users), [users, sortKey, sortDir]);
  const sortedCompanies = useMemo(() => doSort(companies), [companies, sortKey, sortDir]);

  const hasActiveFilters = verifiedOnly || withCvOnly || search || sortKey !== "date_joined" || sortDir !== "desc";

  const resetAll = () => {
    setSearch("");
    setVerifiedOnly(false);
    setWithCvOnly(false);
    setSortKey("date_joined");
    setSortDir("desc");
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "full_name" ? "asc" : "desc");
    }
  };

  const SortBtn = ({ col, label }: { col: SortKey; label: string }) => {
    const active = sortKey === col;
    return (
      <button
        type="button"
        onClick={() => toggleSort(col)}
        className={`flex items-center gap-1 text-left font-semibold text-xs uppercase tracking-wide ${active ? "text-pink-600" : "text-gray-500"} hover:text-pink-600 transition-colors`}
      >
        {label}
        {active ? (
          sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40" />
        )}
      </button>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (!user || !canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">Эта страница доступна только для presence checker и администраторов.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium">На главную</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/" className="p-2 rounded-xl hover:bg-white/60 text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Все участники</h1>
            <p className="text-gray-500 text-sm">{allUsers.length} участников · {companies.length} компаний</p>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-sm">
            <div className="px-4 py-2 rounded-xl bg-white/80 border border-pink-100">
              <span className="text-gray-500">Участники: </span>
              <span className="font-bold text-gray-900">{allUsers.length}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-gray-500">Верифицировано: </span>
              <span className="font-bold text-emerald-600">{users.filter((p) => p.is_verified).length}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-gray-500">С CV: </span>
              <span className="font-bold text-blue-600">{users.filter((p) => p.cv_file).length}</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100">
              <span className="text-gray-500">Компании: </span>
              <span className="font-bold text-indigo-600">{companies.length}</span>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 shadow-sm p-4 mb-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени, email, телефону..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 text-sm"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAll}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Сбросить
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-gray-400 mr-1">
              <Filter className="w-3 h-3" /> Фильтры:
            </span>
            <button
              type="button"
              onClick={() => setVerifiedOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                verifiedOnly
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-emerald-200 hover:text-emerald-600"
              }`}
            >
              <BadgeCheck className="w-3 h-3" />
              Только verified
            </button>
            <button
              type="button"
              onClick={() => setWithCvOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                withCvOnly
                  ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                  : "bg-white border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"
              }`}
            >
              <FileText className="w-3 h-3" />
              С CV
            </button>

            <span className="mx-1 text-gray-200">|</span>

            <span className="flex items-center gap-1 text-xs text-gray-400 mr-1">
              <ArrowUpDown className="w-3 h-3" /> Сортировка:
            </span>
            {(["date_joined", "full_name", "is_verified", "total_checkins", "registered_events_count"] as SortKey[]).map((key) => {
              const labels: Record<SortKey, string> = {
                date_joined: "Дата",
                full_name: "Имя",
                is_verified: "Статус",
                total_checkins: "Check-in",
                registered_events_count: "Меропр.",
              };
              const active = sortKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSort(key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    active
                      ? "bg-pink-50 border-pink-300 text-pink-700 shadow-sm"
                      : "bg-white border-gray-200 text-gray-500 hover:border-pink-200 hover:text-pink-600"
                  }`}
                >
                  {labels[key]}
                  {active && (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : participants.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Пользователи не найдены.</div>
        ) : (
          <div className="space-y-8">
            {/* ── Участники ── */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-pink-500" />
                <h2 className="text-lg font-bold text-gray-900">Участники</h2>
                <span className="text-sm text-gray-400">
                  {sortedUsers.length !== allUsers.length ? `${sortedUsers.length} из ${allUsers.length}` : sortedUsers.length}
                </span>
              </div>
              {sortedUsers.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white/60 rounded-2xl border border-pink-100/40">Нет участников</div>
              ) : (
                <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100/60 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-4 py-3 w-8 text-gray-400 font-medium text-xs">#</th>
                          <th className="text-left px-4 py-3"><SortBtn col="full_name" label="Участник" /></th>
                          <th className="text-left px-4 py-3 hidden md:table-cell text-gray-500 font-semibold text-xs uppercase tracking-wide">Телефон</th>
                          <th className="text-left px-4 py-3 hidden lg:table-cell text-gray-500 font-semibold text-xs uppercase tracking-wide">Город</th>
                          <th className="text-center px-4 py-3"><SortBtn col="is_verified" label="Статус" /></th>
                          <th className="text-center px-4 py-3"><SortBtn col="registered_events_count" label="Мероприятия" /></th>
                          <th className="text-center px-4 py-3"><SortBtn col="total_checkins" label="Check-in" /></th>
                          <th className="text-center px-4 py-3 hidden sm:table-cell text-gray-500 font-semibold text-xs uppercase tracking-wide">CV</th>
                          <th className="text-left px-4 py-3"><SortBtn col="date_joined" label="Регистрация" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedUsers.map((p, i) => (
                          <tr
                            key={p.id}
                            onClick={() => setSelected(p)}
                            className="border-b border-gray-50 hover:bg-pink-50/40 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {p.profile_photo ? (
                                  <img src={p.profile_photo} alt="" className="w-9 h-9 rounded-lg object-cover border border-pink-100 flex-shrink-0" />
                                ) : (
                                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 font-bold text-sm flex-shrink-0">
                                    {(p.full_name?.[0] || p.username?.[0] || "?").toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium text-gray-900 truncate">{p.full_name || p.username}</span>
                                    {p.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                                  </div>
                                  <div className="text-xs text-gray-400 truncate">{p.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.phone || "—"}</td>
                            <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.city || "—"}</td>
                            <td className="px-4 py-3 text-center">
                              {p.is_verified ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                                  <BadgeCheck className="w-3 h-3" /> Verified
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-50 text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-medium text-gray-700">{p.registered_events_count}</td>
                            <td className="px-4 py-3 text-center font-medium text-gray-700">{p.total_checkins}</td>
                            <td className="px-4 py-3 text-center hidden sm:table-cell">
                              {p.cv_file ? (
                                <a
                                  href={p.cv_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                >
                                  <FileText className="w-3 h-3" /> Открыть
                                </a>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {formatDate(p.date_joined)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ── Компании ── */}
            {sortedCompanies.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-gray-900">Компании</h2>
                  <span className="text-sm text-gray-400">{sortedCompanies.length}</span>
                </div>
                <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-indigo-100/60 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 bg-indigo-50/30">
                          <th className="text-left px-4 py-3 w-8 text-gray-400 font-medium text-xs">#</th>
                          <th className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wide">Компания</th>
                          <th className="text-left px-4 py-3 hidden md:table-cell text-gray-500 font-semibold text-xs uppercase tracking-wide">Email</th>
                          <th className="text-left px-4 py-3 hidden md:table-cell text-gray-500 font-semibold text-xs uppercase tracking-wide">Телефон</th>
                          <th className="text-left px-4 py-3 hidden lg:table-cell text-gray-500 font-semibold text-xs uppercase tracking-wide">Город</th>
                          <th className="text-left px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wide">Регистрация</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCompanies.map((p, i) => (
                          <tr
                            key={p.id}
                            onClick={() => setSelected(p)}
                            className="border-b border-gray-50 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-medium text-gray-900 truncate block">{p.full_name || p.username}</span>
                                  <div className="text-xs text-gray-400 truncate">@{p.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.email || "—"}</td>
                            <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{p.phone || "—"}</td>
                            <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{p.city || "—"}</td>
                            <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {formatDate(p.date_joined)}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Профиль участника</h2>
              <button type="button" onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Photo + Name */}
              <div className="flex items-center gap-4">
                {selected.profile_photo ? (
                  <img src={selected.profile_photo} alt="" className="w-20 h-20 rounded-2xl object-cover border-2 border-pink-200 shadow-md" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 font-bold text-2xl">
                    {(selected.full_name?.[0] || selected.username?.[0] || "?").toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-gray-900">{selected.full_name || selected.username}</span>
                    {selected.is_verified && <BadgeCheck className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <div className="text-sm text-gray-500">@{selected.username}</div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Зарегистрирован: {formatDate(selected.date_joined)}
                  </div>
                </div>
              </div>

              {/* Verified badge */}
              {selected.is_verified && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                  <BadgeCheck className="w-4 h-4" />
                  Верифицированный участник
                  <span className="ml-auto font-medium">{selected.total_checkins} посещений</span>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{selected.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{selected.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{selected.city || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span>{selected.university || selected.education_status || "—"}</span>
                </div>
              </div>

              {/* Bio */}
              {selected.bio && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-1">О себе</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selected.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-4">
                <div className="flex-1 text-center px-4 py-3 rounded-xl bg-pink-50 border border-pink-100">
                  <div className="text-lg font-bold text-pink-600">{selected.registered_events_count}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Регистрации</div>
                </div>
                <div className="flex-1 text-center px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-lg font-bold text-emerald-600">{selected.total_checkins}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Check-in</div>
                </div>
              </div>

              {/* CV */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">CV / Резюме</div>
                {selected.cv_file ? (
                  <a
                    href={selected.cv_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Скачать CV
                  </a>
                ) : (
                  <div className="text-sm text-gray-400">CV не загружен</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
