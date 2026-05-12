import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ArrowLeft, Loader2, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";
import { apiFetch } from "../api";

type CheckinRow = {
  id: number;
  event_id: number;
  event_title: string;
  username: string;
  full_name: string;
  email: string;
  organizer_confirmed: boolean;
  checked_in: boolean;
  visits_count: number;
  registered_at: string | null;
  checked_in_at: string | null;
};

type EventOption = { id: number; title: string };

export default function AdminCheckins() {
  const { user, loading: authLoading, setUser } = useAuth();
  const [rows, setRows] = useState<CheckinRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventId, setEventId] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const canOpen = !!(user?.is_staff || user?.is_presence_checker);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = eventId ? `?event_id=${encodeURIComponent(eventId)}` : "";
      const res = await apiFetch(`/api/admin/checkins/${query}`);
      if (!res.ok) throw new Error("Ошибка загрузки данных");
      const data = await res.json();
      setRows(data.results || []);
      setEvents(data.events || []);
    } catch (e) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!canOpen) return;
    load();
  }, [canOpen, load]);

  useEffect(() => {
    if (!canOpen) return;
    const t = setInterval(() => {
      load();
    }, 5000);
    return () => clearInterval(t);
  }, [canOpen, load]);

  const confirmRegistration = async (id: number) => {
    setBusyId(id);
    try {
      const res = await apiFetch(`/api/admin/checkins/${id}/confirm/`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Не удалось подтвердить");
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, organizer_confirmed: true } : r))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка подтверждения");
    } finally {
      setBusyId(null);
    }
  };

  const loginInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await apiFetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.user) {
        setLoginError(data.message || "Invalid login or password.");
        return;
      }
      setUser(data.user);
      if (!data.user.is_staff && !data.user.is_presence_checker) {
        setLoginError("This account has no access. Use admin or presence-checker account.");
      } else {
        setTimeout(() => {
          load();
        }, 50);
      }
    } catch {
      setLoginError("Connection error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const confirmed = rows.filter((r) => r.organizer_confirmed).length;
    const checkedIn = rows.filter((r) => r.checked_in).length;
    const totalVisits = rows.reduce((acc, r) => acc + (r.visits_count || 0), 0);
    return { total, confirmed, checkedIn, totalVisits };
  }, [rows]);

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
        <div className="w-full max-w-md bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900">Check-ins Login</h1>
          <p className="text-gray-600 mt-2 text-sm">
            Sign in with admin or presence-checker account.
          </p>

          {loginError && (
            <div className="mt-4 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
              {loginError}
            </div>
          )}

          <form onSubmit={loginInline} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 outline-none"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 outline-none"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading || !loginUsername || !loginPassword}
              className={`w-full px-5 py-2.5 rounded-xl font-medium ${
                loginLoading || !loginUsername || !loginPassword
                  ? "bg-gray-200 text-gray-500"
                  : "bg-pink-500 text-white hover:bg-pink-600"
              }`}
            >
              {loginLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!canOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800">Доступ запрещен</h1>
          <p className="text-gray-600 mt-2">Требуется роль staff или presence checker.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" />
              Назад в админку
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">Подтверждение и посещаемость</h1>
            <p className="text-gray-600 mt-1">Для теста QR-checker смотрите колонку "Посещений".</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard label="Всего записей" value={stats.total} />
          <StatCard label="Подтверждено" value={stats.confirmed} />
          <StatCard label="Отмечено входом" value={stats.checkedIn} />
          <StatCard label="Всего посещений" value={stats.totalVisits} />
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Loaded rows: <span className="font-semibold text-gray-900">{rows.length}</span>
          {eventId ? ` (event_id=${eventId})` : " (all events)"}
        </div>

        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 shadow-sm p-4 mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Фильтр по мероприятию</label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full md:max-w-md px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 outline-none"
          >
            <option value="">Все мероприятия</option>
            {events.map((e) => (
              <option key={e.id} value={String(e.id)}>
                {e.title}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : (
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-700">Мероприятие</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Участник</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Подтверждение</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Посещений</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Последний check-in</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-900">{r.event_title}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900 font-medium">{r.full_name || r.username}</div>
                        <div className="text-gray-500 text-xs">{r.email || r.username}</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.organizer_confirmed ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="w-4 h-4" />
                            Да
                          </span>
                        ) : (
                          <span className="text-amber-700">Нет</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-semibold">{r.visits_count}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.checked_in_at ? new Date(r.checked_in_at).toLocaleString("ru-RU") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={r.organizer_confirmed || busyId === r.id}
                          onClick={() => confirmRegistration(r.id)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium ${
                            r.organizer_confirmed
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "bg-pink-500 text-white hover:bg-pink-600"
                          }`}
                        >
                          {busyId === r.id ? "..." : r.organizer_confirmed ? "Подтверждено" : "Подтвердить"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && (
              <div className="py-12 text-center text-gray-500">Нет регистраций</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
    </div>
  );
}

