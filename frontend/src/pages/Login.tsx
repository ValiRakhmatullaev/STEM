import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";
import { Loader2, ArrowRight } from "lucide-react";
import { apiFetch } from "../api";

const TiltCard = ({ children }: { children: React.ReactNode }) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: "easeOut" }} className="relative">
    {children}
  </motion.div>
);

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          data.message ||
          (response.status === 403
            ? t("login.errorCsrf")
            : response.status >= 500
              ? t("login.errorServer")
              : t("login.errorInvalid"));
        setError(message);
        return;
      }
      if (data.user) setUser(data.user);
      const next = searchParams.get("next");
      if (next) navigate(next, { replace: true });
      else if (data.user?.is_company_user) navigate("/company", { replace: true });
      else if (data.user?.is_presence_checker) navigate("/admin/checkins", { replace: true });
      else navigate("/", { replace: true });
    } catch {
      setError(t("login.errorNetwork"));
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = username.trim().length > 0 && password.length > 0;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-4 py-16">
      {/* Subtle background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-64 -right-64 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-rose-100/60 via-pink-50/40 to-transparent blur-3xl" />
        <div className="absolute -bottom-64 -left-64 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-purple-100/50 via-pink-50/30 to-transparent blur-3xl" />
      </div>

      <div className="w-full max-w-[400px] relative z-10 flex flex-col items-center gap-8">

        {/* Logo + Branding */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <img
            src="/STEM_FOTO.png"
            alt="STEM Woman Uzbekistan"
            className="w-60 h-60 object-contain"
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("login.title")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("login.subtitle")}</p>
          </div>
        </motion.div>

        {/* Card */}
        <TiltCard>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="w-full rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/60 p-8"
          >
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-widest text-slate-400 select-none">
                  {t("login.username")}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder={t("login.usernamePlaceholder")}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300
                    transition-all duration-200 outline-none
                    hover:border-slate-300 focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-slate-400 select-none">
                  {t("login.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300
                    transition-all duration-200 outline-none
                    hover:border-slate-300 focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
                />
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={!canSubmit || isLoading}
                whileHover={{ scale: canSubmit && !isLoading ? 1.01 : 1 }}
                whileTap={{ scale: canSubmit && !isLoading ? 0.99 : 1 }}
                className={`mt-2 w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200
                  ${canSubmit && !isLoading
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t("login.loading")}</>
                ) : (
                  <>{t("login.submit")} <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t("login.noAccount")}{" "}
              <Link to="/register" className="font-semibold text-rose-500 hover:text-rose-600 transition-colors">
                {t("login.register")}
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-slate-400">
              <Link to="/register-company" className="font-medium text-blue-500 hover:text-blue-600 transition-colors">
                Регистрация компании
              </Link>
            </p>
          </motion.div>
        </TiltCard>

        <p className="text-xs text-slate-400 text-center">{t("login.slogan")}</p>
      </div>
    </div>
  );
}
