import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Instagram, Mail, MapPin, Phone, Send } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const INSTAGRAM_URL = "https://www.instagram.com/stemwoman_uz/";
/** Замените на актуальный канал или чат Telegram организации */
const TELEGRAM_URL = "https://t.me/stemwoman_uz";

const PHONE_DISPLAY = "+998 (77) 187-00-27";
const PHONE_TEL = "+998771870027";

const EMAIL = "info@stemwoman.uz";
const ADDRESS = "Ташкент, Узбекистан";

const socialItems = [
  {
    name: "Instagram",
    handle: "@stemwoman_uz",
    href: INSTAGRAM_URL,
    icon: Instagram,
    description: "Анонсы, новости и жизнь сообщества",
  },
  {
    name: "Telegram",
    handle: "Канал в Telegram",
    href: TELEGRAM_URL,
    icon: Send,
    description: "Быстрые анонсы и обсуждения",
  },
];

export default function Contacts() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-rose-50/70" />
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10 lg:py-12 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.backToMain")}
        </Link>

        <div className="mt-8 mb-10">
          <p className="text-pink-600 font-semibold text-sm uppercase tracking-wider">{t("contacts.help")}</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 mt-2">{t("contacts.title")}</h1>
          <p className="mt-3 text-gray-700 text-lg">
            {t("contacts.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-white/85 backdrop-blur-xl border border-pink-100 shadow-sm p-6 sm:p-8"
          >
            <h2 className="font-semibold text-gray-900 text-lg mb-4">{t("contacts.emailSection")}</h2>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-3 text-pink-600 hover:text-pink-700 font-medium text-lg"
            >
              <Mail className="w-5 h-5 shrink-0" />
              {EMAIL}
            </a>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">{t("contacts.emailDesc")}</p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl bg-white/85 backdrop-blur-xl border border-pink-100 shadow-sm p-6 sm:p-8"
          >
            <h2 className="font-semibold text-gray-900 text-lg mb-4">{t("contacts.phoneSection")}</h2>
            <a
              href={`tel:${PHONE_TEL}`}
              className="inline-flex items-center gap-3 text-pink-600 hover:text-pink-700 font-medium text-lg"
            >
              <Phone className="w-5 h-5 shrink-0" />
              {PHONE_DISPLAY}
            </a>
            <p className="mt-3 text-gray-600 text-sm leading-relaxed">{t("contacts.phoneDesc")}</p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/85 backdrop-blur-xl border border-pink-100 shadow-sm p-6 sm:p-8"
          >
            <h2 className="font-semibold text-gray-900 text-lg mb-4">{t("contacts.addressSection")}</h2>
            <div className="flex items-start gap-3 text-gray-800">
              <MapPin className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
              <span className="text-lg">{ADDRESS}</span>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white/85 backdrop-blur-xl border border-pink-100 shadow-sm p-6 sm:p-8"
          >
            <h2 className="font-semibold text-gray-900 text-lg mb-4">{t("contacts.socialsSection")}</h2>
            <ul className="space-y-4">
              {socialItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 rounded-xl border border-pink-100/80 bg-pink-50/30 p-4 hover:border-pink-200 hover:bg-pink-50/50 transition-colors"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-pink-600 shadow-sm border border-pink-100">
                        <Icon className="w-6 h-6" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-gray-900">{item.name}</span>
                        <span className="block text-sm text-pink-700">{item.handle}</span>
                        <span className="block text-sm text-gray-600 mt-1">{item.description}</span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
