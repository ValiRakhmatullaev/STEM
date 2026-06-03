import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { apiFetch } from "../api";
import { pickLocalized } from "../utils/localizedContent";

type NewsData = {
  id: number;
  title: string;
  title_ru?: string;
  title_uz?: string;
  title_en?: string;
  summary: string;
  summary_ru?: string;
  summary_uz?: string;
  summary_en?: string;
  content: string;
  content_ru?: string;
  content_uz?: string;
  content_en?: string;
  banner_image: string | null;
  published_at: string | null;
};

export default function NewsDetail() {
  const { t, locale } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<NewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(`/api/home/news/${id}/`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || t("home.newsDetail.notFound"));
        setItem(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("home.newsDetail.errorLoading"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 lg:py-12 z-10">
        <Link to="/" className="inline-flex items-center text-pink-600 hover:text-pink-700 font-medium">
          {t("home.newsDetail.backToMain")}
        </Link>

        {loading && <p className="mt-6 text-gray-600 text-lg">{t("home.newsDetail.loading")}</p>}
        {!loading && error && <p className="mt-6 text-rose-600">{error}</p>}

        {!loading && !error && item && (
          <article className="mt-6 max-w-4xl rounded-3xl bg-white/80 backdrop-blur-xl border border-pink-100/60 shadow-xl p-6 sm:p-8 space-y-4">
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900">
              {pickLocalized(item, "title", locale)}
            </h1>
            {item.published_at && (
              <p className="text-sm text-gray-500">
                {new Date(item.published_at).toLocaleString()}
              </p>
            )}
            {item.banner_image && (
              <img
                src={item.banner_image}
                alt={pickLocalized(item, "title", locale)}
                className="w-full rounded-2xl border border-pink-100"
              />
            )}
            {pickLocalized(item, "summary", locale) && (
              <p className="text-gray-700 text-lg font-medium">{pickLocalized(item, "summary", locale)}</p>
            )}
            <div className="text-gray-800 whitespace-pre-wrap leading-7">
              {pickLocalized(item, "content", locale) || t("home.newsDetail.contentMissing")}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
