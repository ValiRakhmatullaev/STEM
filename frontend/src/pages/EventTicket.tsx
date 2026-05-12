import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { motion } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { apiFetch } from "../api";
import {
  QrCode as QrIcon,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  Video,
  Loader2,
} from "lucide-react";

type TicketData = {
  event_id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  is_online: boolean;
  checkin_url: string;
  visits_count: number;
};

const fadeInUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

const GlassCard = ({ children, className = "", delay = 0 }: GlassCardProps) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-40px" }}
    transition={{ delay }}
    whileHover={{ y: -4, boxShadow: "0 20px 40px -10px rgba(236, 201, 255, 0.18)" }}
    className={`relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-xl border border-pink-100/40 shadow-lg shadow-purple-200/10 hover:border-pink-300/50 transition-all duration-400 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-pink-50/20 pointer-events-none" />
    <div className="relative z-10 h-full">{children}</div>
  </motion.div>
);

export default function EventTicket() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("ID мероприятия не указан");
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch(`/api/events/my-registrations/`)
      .then((res) => {
        if (!res.ok) throw new Error("Не удалось загрузить билеты");
        return res.json();
      })
      .then((data) => {
        const found = (data.results || []).find((e: any) => String(e.id) === id);
        if (!found) {
          throw new Error("Вы не записаны на это мероприятие");
        }
        const t: TicketData = {
          event_id: found.id,
          title: found.title,
          date: found.date,
          time: found.time,
          location: found.location,
          is_online: found.is_online,
          checkin_url: found.checkin_url,
          visits_count: found.visits_count ?? 0,
        };
        setTicket(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/20 to-white flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-6 max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <QrIcon className="w-8 h-8 text-pink-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Войдите, чтобы увидеть билет
          </h2>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:brightness-105 shadow-md transition-all"
          >
            Войти в аккаунт
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/15 to-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500" />
          <p className="mt-4 text-gray-600">Загрузка билета...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/15 to-white flex items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center px-6 max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
            <QrIcon className="w-8 h-8 text-pink-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {error || "Билет не найден"}
          </h2>
          <Link
            to="/my-events"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Мои мероприятия
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/20 to-white overflow-x-hidden">
      <div className="relative max-w-md mx-auto px-4 sm:px-6 py-10 lg:py-12">
        {/* Навигация назад */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="mb-6">
          <Link
            to="/my-events"
            className="inline-flex items-center gap-1.5 text-gray-600 hover:text-pink-700 font-medium transition-colors group text-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Мои мероприятия
          </Link>
        </motion.div>

        <GlassCard>
          <div className="p-6 sm:p-8">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white shadow-md">
                  <QrIcon className="w-5 h-5" />
                </div>
                <h1 className="font-display font-bold text-2xl text-gray-900">
                  Мой билет
                </h1>
              </div>

              <p className="text-sm text-gray-600 mb-7">
                Покажите этот QR-код организатору для отметки посещения
              </p>

              {/* QR-код */}
              <div className="flex justify-center mb-8">
                <div className="p-4 bg-white rounded-2xl border border-pink-100/60 shadow-md">
                  <QRCode
                    value={ticket.checkin_url}
                    size={180}
                    level="Q"
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
              </div>

              {/* Информация о мероприятии */}
              <div className="space-y-4 text-gray-700">
                <h2 className="font-bold text-xl text-gray-900 line-clamp-2">
                  {ticket.title}
                </h2>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-100/60 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-pink-600" />
                  </div>
                  <span>{ticket.date}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100/60 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-rose-600" />
                  </div>
                  <span>{ticket.time}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100/60 flex items-center justify-center">
                    {ticket.is_online ? (
                      <Video className="w-4 h-4 text-purple-600" />
                    ) : (
                      <MapPin className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <span>{ticket.is_online ? "Онлайн" : "Офлайн"}</span>
                </div>

                {ticket.location && !ticket.is_online && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-gray-600">{ticket.location}</span>
                  </div>
                )}

                {ticket.visits_count > 0 && (
                  <div className="flex items-center gap-2.5 mt-3 pt-3 border-t border-pink-100/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm text-emerald-700">
                      Посещений отмечено: {ticket.visits_count}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}