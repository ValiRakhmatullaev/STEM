import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { apiFetch } from "../api";
import { Briefcase, MessageCircle, Calendar, Send, Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, X } from "lucide-react";

type Interview = { id: number; scheduled_at: string; duration_minutes: number; format: string; location: string; note: string; status: string };
type AppItem = { id: number; status: string; applied_at: string | null; job: { id: number; title: string; company: string }; chat_room_id: number | null; unread_messages?: number; interview: Interview | null };
type ChatMsg = { id: number; sender_id: number; text: string; is_read: boolean; created_at: string | null };

const SL: Record<string, string> = { new: "Отправлен", viewed: "Просмотрен", shortlisted: "В шорт-листе", rejected: "Отклонён", hired: "Принят" };
const SC: Record<string, string> = { new: "bg-blue-50 text-blue-700 border-blue-200", viewed: "bg-gray-50 text-gray-600 border-gray-200", shortlisted: "bg-amber-50 text-amber-700 border-amber-200", rejected: "bg-rose-50 text-rose-600 border-rose-200", hired: "bg-emerald-50 text-emerald-700 border-emerald-200" };

function fmtD(iso: string | null) { if (!iso) return "—"; return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }); }
function fmtDT(iso: string) { const d = new Date(iso); return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }

export default function MyApplications() {
  const { user, loading: al } = useAuth();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [ld, setLd] = useState(true);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [chatLd, setChatLd] = useState(false);
  const [txt, setTxt] = useState("");
  const [sending, setSending] = useState(false);
  const [rspId, setRspId] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const fetchApps = useCallback(async () => {
    setLd(true);
    try { const r = await apiFetch("/api/jobs/my-applications/"); if (r.ok) setApps((await r.json()).results || []); } catch {}
    finally { setLd(false); }
  }, []);

  useEffect(() => { if (!al && user) fetchApps(); else if (!al) setLd(false); }, [al, user, fetchApps]);

  const openChat = async (id: number) => {
    setRoomId(id); setChatLd(true); setMsgs([]);
    try { const r = await apiFetch(`/api/chat/rooms/${id}/messages/`); if (r.ok) setMsgs((await r.json()).results || []); } catch {}
    finally { setChatLd(false); }
  };

  const sendMsg = async () => {
    if (!txt.trim() || !roomId) return; setSending(true);
    try { const r = await apiFetch(`/api/chat/rooms/${roomId}/send/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: txt }) }); if (r.ok) { const d = await r.json(); setMsgs(p => [...p, d.message]); setTxt(""); } } catch {} finally { setSending(false); }
  };

  useEffect(() => { if (endRef.current) { const container = endRef.current.parentElement; if (container) container.scrollTop = container.scrollHeight; } }, [msgs]);
  useEffect(() => {
    if (!roomId) return;
    const poll = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const r = await apiFetch(`/api/chat/rooms/${roomId}/messages/`);
        if (r.ok) setMsgs((await r.json()).results || []);
      } catch {
        /* ignore transient network errors */
      }
    };
    const iv = setInterval(poll, 5000);
    void poll();
    return () => clearInterval(iv);
  }, [roomId]);

  useEffect(() => { if (roomId) document.body.style.overflow = 'hidden'; else document.body.style.overflow = ''; return () => { document.body.style.overflow = ''; }; }, [roomId]);

  const respond = async (invId: number, action: string) => {
    setRspId(invId);
    try { await apiFetch(`/api/chat/interviews/${invId}/respond/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) }); fetchApps(); if (roomId) openChat(roomId); } catch {} finally { setRspId(null); }
  };

  if (al || ld) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;
  if (!user) return <div className="min-h-[60vh] flex items-center justify-center text-gray-600">Войдите чтобы видеть свои отклики.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/60 to-purple-50/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/jobs" className="p-2 rounded-xl hover:bg-pink-50 text-gray-500"><ArrowLeft className="w-5 h-5" /></Link>
          <Briefcase className="w-6 h-6 text-pink-500" />
          <h1 className="text-2xl font-bold text-gray-900">Мои отклики</h1>
          <span className="text-sm text-gray-400">{apps.length}</span>
        </div>

        {apps.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white/60 rounded-2xl border border-pink-100/40">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="mb-2">У вас пока нет откликов</p>
            <Link to="/jobs" className="text-pink-600 font-medium hover:underline">Перейти к вакансиям</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {apps.map((a) => (
              <div key={a.id} className="bg-white/90 backdrop-blur-xl rounded-2xl border border-pink-100/60 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link to={`/jobs/${a.job.id}`} className="font-semibold text-gray-900 hover:text-pink-600">{a.job.title}</Link>
                    <div className="text-sm text-gray-500 mt-0.5">{a.job.company} · {fmtD(a.applied_at)}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border ${SC[a.status] || "bg-gray-50 text-gray-500 border-gray-200"}`}>{SL[a.status] || a.status}</span>
                    {a.chat_room_id && (
                      <button type="button" onClick={() => openChat(a.chat_room_id!)} className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                        <MessageCircle className="w-3.5 h-3.5" /> Чат
                        {(a.unread_messages || 0) > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{a.unread_messages}</span>}
                      </button>
                    )}
                  </div>
                </div>
                {a.interview && a.interview.status === "pending" && (
                  <div className="mt-4 bg-indigo-50/70 rounded-xl border border-indigo-200/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-800 mb-2"><Calendar className="w-4 h-4" /> Приглашение на интервью</div>
                    <div className="text-sm text-gray-700 mb-2">{fmtDT(a.interview.scheduled_at)} · {a.interview.duration_minutes} мин</div>
                    {a.interview.location && <div className="text-sm text-gray-600 mb-2">{a.interview.location}</div>}
                    {a.interview.note && <div className="text-sm text-gray-500 mb-3 italic">{a.interview.note}</div>}
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" onClick={() => respond(a.interview!.id, "accept")} disabled={rspId === a.interview.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"><CheckCircle2 className="w-3 h-3" /> Подтвердить</button>
                      <button type="button" onClick={() => respond(a.interview!.id, "reschedule")} disabled={rspId === a.interview.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 disabled:opacity-50"><Clock className="w-3 h-3" /> Перенести</button>
                      <button type="button" onClick={() => respond(a.interview!.id, "decline")} disabled={rspId === a.interview.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 disabled:opacity-50"><XCircle className="w-3 h-3" /> Отклонить</button>
                    </div>
                  </div>
                )}
                {a.interview && a.interview.status === "accepted" && (
                  <div className="mt-4 bg-emerald-50/70 rounded-xl border border-emerald-200/60 p-4 flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Интервью подтверждено: {fmtDT(a.interview.scheduled_at)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {roomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setRoomId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ height: "min(80vh, 600px)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Чат</h2>
              <button type="button" onClick={() => setRoomId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {chatLd ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div> : msgs.length === 0 ? <div className="text-center text-gray-400 py-8">Нет сообщений</div> : msgs.map((m) => (
                <div key={m.id} className={`flex ${m.sender_id === Number(user?.id) ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${m.sender_id === Number(user?.id) ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                    {m.text}
                    <div className={`text-[10px] mt-1 ${m.sender_id === Number(user?.id) ? "text-blue-200" : "text-gray-400"}`}>{m.created_at ? new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }} placeholder="Написать сообщение..." className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-200/50 outline-none text-sm" />
              <button type="button" onClick={sendMsg} disabled={sending || !txt.trim()} className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"><Send className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
