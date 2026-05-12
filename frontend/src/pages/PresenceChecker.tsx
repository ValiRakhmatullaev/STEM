import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Loader2, QrCode, ShieldAlert, BadgeCheck, Search, Building2 } from "lucide-react";
import { apiFetch } from "../api";

type DetectedQr = {
  rawValue: string;
};

type CheckinRow = {
  id: number;
  event_id: number;
  event_title: string;
  username: string;
  full_name: string;
  checked_in: boolean;
  organizer_confirmed: boolean;
};

type NonRegisteredUserRow = {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  is_verified: boolean;
  is_company_user: boolean;
  is_staff: boolean;
  registered_for_any_event: boolean;
  registered_events_count?: number;
  total_checkins: number;
};

type EventOption = {
  id: number;
  title: string;
};

function extractCheckinUrl(raw: string): string | null {
  const value = (raw || "").trim();
  if (!value) return null;

  // Most reliable: extract token and rebuild URL against current host.
  const tokenMatch = value.match(/\/checkin\/([A-Za-z0-9-]+)\/?/);
  if (tokenMatch && tokenMatch[1]) {
    return `${window.location.protocol}//${window.location.hostname}:8000/checkin/${tokenMatch[1]}/`;
  }

  // Full check-in URL present: normalize localhost/127.0.0.1 to current host.
  if (value.includes("/checkin/")) {
    try {
      const u = new URL(value, window.location.origin);
      if (u.hostname === "127.0.0.1" || u.hostname === "localhost") {
        u.hostname = window.location.hostname;
        u.port = "8000";
      }
      return u.toString();
    } catch {
      return value;
    }
  }

  // Иногда может быть только token (uuid). В этом случае мы просим пользователя
  // вставить именно ссылку; генерацию ссылки делаем только если удалось понять
  // хост из текущего URL (редко используется).
  const tokenCandidate = value;
  if (/^[0-9a-fA-F-]{10,64}$/.test(tokenCandidate)) {
    return `${window.location.protocol}//${window.location.hostname}:8000/checkin/${tokenCandidate}/`;
  }
  return null;
}

export default function PresenceChecker() {
  const { user, loading } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const redirectingRef = useRef(false);

  const [supported, setSupported] = useState<boolean>(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastScan, setLastScan] = useState<string>("");
  const [lastTargetUrl, setLastTargetUrl] = useState<string>("");
  const [manualValue, setManualValue] = useState<string>("");
  const [rows, setRows] = useState<CheckinRow[]>([]);
  const [usersWithoutRegistrations, setUsersWithoutRegistrations] = useState<NonRegisteredUserRow[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [eventId, setEventId] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<"not_checked_in" | "all" | "checked_in" | "not_registered" | "all_users">("not_checked_in");
  const [userSearch, setUserSearch] = useState("");
  const [userSearchDebounced, setUserSearchDebounced] = useState("");

  const canCheckIn = useMemo(() => {
    return !!user?.is_presence_checker;
  }, [user?.is_presence_checker]);

  const filteredRows = useMemo(() => {
    if (attendanceFilter === "not_registered" || attendanceFilter === "all_users") return [];
    if (attendanceFilter === "all") return rows;
    if (attendanceFilter === "checked_in") return rows.filter((r) => r.checked_in);
    return rows.filter((r) => !r.checked_in);
  }, [rows, attendanceFilter]);

  useEffect(() => {
    const BarcodeDetectorAny = (window as any).BarcodeDetector;
    setSupported(!!BarcodeDetectorAny);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setUserSearchDebounced(userSearch), 350);
    return () => clearTimeout(timer);
  }, [userSearch]);

  useEffect(() => {
    if (!canCheckIn) return;
    const load = async () => {
      setListLoading(true);
      try {
        if (attendanceFilter === "not_registered" || attendanceFilter === "all_users") {
          const endpoint = attendanceFilter === "not_registered"
            ? "/api/admin/users-without-event-registrations/"
            : "/api/admin/users-for-presence-checker/";
          const searchParam = attendanceFilter === "all_users" && userSearchDebounced
            ? `?search=${encodeURIComponent(userSearchDebounced)}` : "";
          const res = await apiFetch(endpoint + searchParam);
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Не удалось загрузить пользователей");
          setUsersWithoutRegistrations(data.results || []);
          setRows([]);
          return;
        }

        const query = eventId ? `?event_id=${encodeURIComponent(eventId)}` : "";
        const res = await apiFetch(`/api/admin/checkins/${query}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Не удалось загрузить участников");
        setRows(data.results || []);
        setEvents(data.events || []);
        setUsersWithoutRegistrations([]);
      } catch (e) {
        setRows([]);
        setUsersWithoutRegistrations([]);
      } finally {
        setListLoading(false);
      }
    };
    load();
  }, [canCheckIn, eventId, attendanceFilter, userSearchDebounced]);

  useEffect(() => {
    return () => {
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      streamRef.current = null;
    };
  }, []);

  const start = async () => {
    setError("");
    setLastScan("");
    redirectingRef.current = false;

    const BarcodeDetectorAny = (window as any).BarcodeDetector;
    if (!BarcodeDetectorAny) {
      setError("Этот браузер не поддерживает QR-сканирование. Используйте ввод ссылки вручную.");
      return;
    }

    try {
      setScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      if (!videoRef.current) {
        setError("Видео-элемент не найден.");
        setScanning(false);
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const detector = new BarcodeDetectorAny({ formats: ["qr_code"] });
      detectorRef.current = detector;

      const tick = async () => {
        if (!detectorRef.current || !videoRef.current) return;
        if (redirectingRef.current) return;

        try {
          const barcodes: DetectedQr[] = await detectorRef.current.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            if (raw) {
              setLastScan(raw);
              const checkinUrl = extractCheckinUrl(raw);
              if (!checkinUrl) {
                setError("Распознанный QR не похож на ссылку check-in.");
              } else {
                redirectingRef.current = true;
                setLastTargetUrl(checkinUrl);
                try {
                  streamRef.current?.getTracks().forEach((t) => t.stop());
                } catch {
                  // ignore
                }
                window.location.assign(checkinUrl);
                return;
              }
            }
          }
        } catch {
          // detector.detect() может падать на некоторых устройствах — игнорируем и повторяем
        }

        if (!redirectingRef.current) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось открыть камеру";
      setError(msg);
      setScanning(false);
    }
  };

  const stop = () => {
    redirectingRef.current = true;
    setScanning(false);
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      // ignore
    }
    streamRef.current = null;
  };

  const handleManualCheckin = () => {
    const checkinUrl = extractCheckinUrl(manualValue);
    if (!checkinUrl) {
      setError("Введите ссылку вида .../checkin/<token>/ или сам token.");
      return;
    }
    setLastTargetUrl(checkinUrl);
    window.location.assign(checkinUrl);
  };

  if (loading) {
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Нужно войти</h2>
          <Link to={`/login?next=${encodeURIComponent("/presence-checker")}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500 text-white font-medium">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  if (!canCheckIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70 p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-100 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Доступ запрещен</h2>
          <p className="text-gray-600 mb-4">
            Этот аккаунт не имеет права `presence checker` для отметки посещаемости.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <QrCode className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Presence Checker</h1>
            <p className="text-gray-600 mt-1">
              Наведите камеру на QR-код билета. Посещение будет засчитано на сервере.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="font-semibold text-gray-900">Сканирование</div>
              <div className="text-sm text-gray-500 mt-1">
                {supported
                  ? "Камера + встроенный QR-распознаватель"
                  : "Браузер без поддержки QR-сканирования — используйте ввод ссылки"}
              </div>
            </div>
            <div className="p-5">
              {supported ? (
                <>
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full rounded-xl bg-black/5"
                      playsInline
                      muted
                      style={{ display: scanning ? "block" : "none" }}
                    />
                    {!scanning && (
                      <div className="p-6 text-center text-gray-600">
                        Нажмите «Начать», чтобы включить камеру.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {!scanning ? (
                      <button
                        type="button"
                        onClick={start}
                        className="px-5 py-3 rounded-xl bg-pink-500 text-white font-medium hover:brightness-105 transition"
                      >
                        Начать
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stop}
                        className="px-5 py-3 rounded-xl bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition"
                      >
                        Остановить
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-600">
                  QR-сканирование камерой недоступно в этом браузере. Введите ссылку/токен вручную справа.
                </div>
              )}

              {lastScan && (
                <div className="mt-4 text-xs text-gray-500 break-all">
                  Последний QR: {lastScan}
                </div>
              )}
              {lastTargetUrl && (
                <div className="mt-3 p-3 rounded-xl bg-pink-50 border border-pink-100">
                  <div className="text-xs text-gray-600 break-all">
                    Открываем: {lastTargetUrl}
                  </div>
                  <a
                    href={lastTargetUrl}
                    className="mt-2 inline-flex items-center px-3 py-2 rounded-lg bg-pink-500 text-white text-xs font-medium"
                  >
                    Open check-in page
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="font-semibold text-gray-900">Ввод ссылки/токена</div>
              <div className="text-sm text-gray-500 mt-1">
                Если авто-сканер не работает — вставьте значение из QR.
              </div>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Значение QR</label>
              <input
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="например: https://.../checkin/<token>/"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50"
              />
              <button
                type="button"
                onClick={handleManualCheckin}
                className="mt-4 w-full px-5 py-3 rounded-xl bg-pink-500 text-white font-medium hover:brightness-105 transition"
              >
                Отметить посещение
              </button>
              <div className="mt-3 text-xs text-gray-500">
                Рекомендуется использовать именно ссылку из QR (как на билете).
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white/85 backdrop-blur-xl rounded-2xl border border-pink-100 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="font-semibold text-gray-900">Участницы мероприятия</div>
            <div className="text-sm text-gray-500 mt-1">
              Фильтр показывает зарегистрированных пользователей, которые еще не отметились.
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50"
              >
                <option value="">Все мероприятия</option>
                {events.map((ev) => (
                  <option key={ev.id} value={String(ev.id)}>
                    {ev.title}
                  </option>
                ))}
              </select>

              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value as "not_checked_in" | "all" | "checked_in" | "not_registered" | "all_users")}
                className="rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50"
              >
                <option value="not_checked_in">Не отметились</option>
                <option value="all">Все зарегистрированные</option>
                <option value="checked_in">Только отметившиеся</option>
                <option value="not_registered">Не записаны на мероприятия</option>
                <option value="all_users">Все пользователи</option>
              </select>

              <div className="rounded-xl border border-pink-100 bg-pink-50/50 px-4 py-3 text-sm text-gray-700">
                Показано: <b>{attendanceFilter === "not_registered" || attendanceFilter === "all_users" ? usersWithoutRegistrations.length : filteredRows.length}</b>
              </div>
            </div>

            {attendanceFilter === "all_users" && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Поиск по имени, email, телефону..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 text-sm"
                />
              </div>
            )}

            {listLoading ? (
              <div className="py-8 text-center text-gray-500">Загрузка списка...</div>
            ) : attendanceFilter === "not_registered" || attendanceFilter === "all_users" ? (
              usersWithoutRegistrations.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  {attendanceFilter === "not_registered"
                    ? "Все пользователи уже записаны хотя бы на одно мероприятие."
                    : "Пользователи не найдены."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-600">
                        <th className="text-left py-2 pr-3">Участница</th>
                        <th className="text-left py-2 pr-3">Email</th>
                        <th className="text-left py-2 pr-3">Телефон</th>
                        {attendanceFilter === "all_users" && (
                          <>
                            <th className="text-left py-2 pr-3">Город</th>
                            <th className="text-left py-2 pr-3">Верифицирован</th>
                            <th className="text-left py-2 pr-3">Регистрации</th>
                            <th className="text-left py-2 pr-3">Check-in</th>
                          </>
                        )}
                        {attendanceFilter === "not_registered" && (
                          <th className="text-left py-2 pr-3">Статус</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {usersWithoutRegistrations.map((u) => (
                        <tr key={u.id} className="border-b border-gray-50 hover:bg-pink-50/30 transition-colors">
                          <td className="py-2 pr-3 text-gray-800">
                            <div className="flex items-center gap-1.5">
                              {u.full_name || u.username}
                              {u.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                              {u.is_company_user && <Building2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                              {u.is_staff && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-medium">staff</span>}
                            </div>
                          </td>
                          <td className="py-2 pr-3 text-gray-700">{u.email || "-"}</td>
                          <td className="py-2 pr-3 text-gray-700">{u.phone || "-"}</td>
                          {attendanceFilter === "all_users" && (
                            <>
                              <td className="py-2 pr-3 text-gray-700">{u.city || "-"}</td>
                              <td className="py-2 pr-3">
                                {u.is_verified ? <span className="text-emerald-600 font-medium">Да</span> : <span className="text-gray-400">Нет</span>}
                              </td>
                              <td className="py-2 pr-3 text-gray-700">{u.registered_events_count ?? 0}</td>
                              <td className="py-2 pr-3 text-gray-700">{u.total_checkins ?? 0}</td>
                            </>
                          )}
                          {attendanceFilter === "not_registered" && (
                            <td className="py-2 pr-3">
                              <span className="text-amber-700">Не записана</span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredRows.length === 0 ? (
              <div className="py-8 text-center text-gray-500">Нет участников по выбранному фильтру.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-600">
                      <th className="text-left py-2 pr-3">Мероприятие</th>
                      <th className="text-left py-2 pr-3">Участница</th>
                      <th className="text-left py-2 pr-3">Подтверждение</th>
                      <th className="text-left py-2 pr-3">Статус посещения</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r) => (
                      <tr key={r.id} className="border-b border-gray-50">
                        <td className="py-2 pr-3 text-gray-800">{r.event_title}</td>
                        <td className="py-2 pr-3 text-gray-800">{r.full_name || r.username}</td>
                        <td className="py-2 pr-3">{r.organizer_confirmed ? "Да" : "Нет"}</td>
                        <td className="py-2 pr-3">
                          {r.checked_in ? (
                            <span className="text-emerald-700">Отметилась</span>
                          ) : (
                            <span className="text-amber-700">Не отметилась</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

