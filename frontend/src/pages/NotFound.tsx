import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-pink-50/70 to-purple-50/40 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t("common.pageNotFound") || "Страница не найдена"}
        </h1>
        <p className="text-gray-500 mb-8">
          {t("common.pageNotFoundDesc") || "Возможно, она была удалена или вы перешли по неверной ссылке"}
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:brightness-105 transition shadow-lg shadow-pink-200/50"
          >
            <Home className="w-4 h-4" />
            {t("common.backToMain")}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium border border-pink-200 text-pink-700 hover:bg-pink-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("common.goBack") || "Назад"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
