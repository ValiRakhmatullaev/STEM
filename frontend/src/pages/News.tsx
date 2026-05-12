import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../api";

type NewsItem = {
  id: number;
  title: string;
  summary: string;
  published_at: string | null;
};

export default function News() {
  const { t } = useLanguage();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch("/api/home/news/");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || t("home.newsPage.errorLoading"));
        setItems(data.results || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("home.newsPage.errorLoading"));
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-12 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("home.newsPage.backToMain")}
        </Link>

        <div className="mt-8 mb-10">
          <p className="text-pink-600 font-semibold text-sm uppercase tracking-wider">{t("home.newsPage.sectionLabel")}</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 mt-2">{t("home.newsPage.title")}</h1>
          <p className="mt-3 text-gray-700 text-lg">{t("home.newsPage.subtitle")}</p>
        </div>

        {loading && <p className="text-gray-600 text-lg">{t("home.newsPage.loading")}</p>}
        {!loading && error && <p className="text-rose-600">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div className="rounded-2xl bg-white/85 backdrop-blur-xl border border-pink-100 shadow-sm p-12 text-center text-gray-600">
            {t("home.newsPage.empty")}
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((item, i) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.05, 0.4) }}
              >
                <Link
                  to={`/news/${item.id}`}
                  className="block h-full rounded-2xl bg-white/85 backdrop-blur-xl border border-pink-100 shadow-sm p-6 hover:shadow-md hover:border-pink-200/80 transition-all group"
                >
                  <div className="flex items-center gap-2 text-xs text-pink-600 font-bold uppercase tracking-wider mb-3">
                    <Calendar className="w-4 h-4" />
                    {item.published_at
                      ? new Date(item.published_at).toLocaleDateString()
                      : t("home.newsPage.dateUnknown")}
                  </div>
                  <h2 className="font-bold text-xl text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h2>
                  {item.summary && (
                    <p className="mt-3 text-gray-700 line-clamp-3 leading-relaxed">{item.summary}</p>
                  )}
                  <div className="mt-4 flex items-center text-pink-600 font-medium text-sm">
                    {t("home.newsPage.readMore")} <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
}
