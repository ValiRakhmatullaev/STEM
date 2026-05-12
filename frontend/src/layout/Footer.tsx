import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Send,
  Heart
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

const footerLinks = {
  platform: [
    { key: "footer.events", to: "/events" },
    { key: "footer.jobs", to: "/jobs" },
    { key: "footer.companies", to: "/companies" },
    { key: "footer.careerFairs", to: "/career-fairs" },
  ],
  community: [
    { key: "footer.about", to: "/about" },
    { key: "footer.news", to: "/news" },
    { key: "footer.contacts", to: "/contacts" },
    { key: "footer.faq", to: "/faq" },
  ],
  legal: [
    { key: "footer.privacy", to: "/" },
    { key: "footer.terms", to: "/" },
  ],
};

const INSTAGRAM_URL = "https://www.instagram.com/stemwoman_uz/";
const TELEGRAM_URL = "https://t.me/stemwomanuz";

const socialLinks = [
  { icon: Instagram, href: INSTAGRAM_URL, label: "Instagram" },
  { icon: Send, href: TELEGRAM_URL, label: "Telegram" },
];

export default function Footer() {
  const [logoHovered, setLogoHovered] = useState(false);
  const { t } = useLanguage();

  return (
    <footer className="relative mt-0">
      {/* Градиентный переход от контента к футеру */}
      <div className="h-32 bg-gradient-to-b from-white via-pink-50/50 to-pink-100/30 pointer-events-none" />

      {/* Основной футер с glassmorphism */}
      <div className="relative bg-gradient-to-b from-pink-100/30 via-purple-50/40 to-white/80 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-300/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Логотип и описание */}
            <div className="lg:col-span-1">
              <Link
                to="/"
                className="group relative flex items-center mb-6"
                onMouseEnter={() => setLogoHovered(true)}
                onMouseLeave={() => setLogoHovered(false)}
              >
                {/* Фоновое свечение */}
                <motion.div
                  className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-pink-400/30 via-purple-400/30 to-pink-400/30 blur-2xl"
                  animate={{
                    scale: logoHovered ? 1.3 : 1,
                    opacity: logoHovered ? 0.6 : 0.3,
                  }}
                  transition={{ duration: 0.4 }}
                />

                {/* Контейнер логотипа */}
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Основное изображение логотипа */}
                  <motion.img
                    src="/STEM_FOTO.png"
                    alt="STEM Woman Uzbekistan"
                    className="h-24 w-auto md:h-28 lg:h-32 xl:h-36 object-contain drop-shadow-xl"
                    animate={{
                      y: logoHovered ? [0, -3, 0] : 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: logoHovered ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  />

                  {/* Блик при наведении */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                    initial={{ x: "-100%" }}
                    animate={{ x: logoHovered ? "200%" : "-100%" }}
                    transition={{ duration: 0.8 }}
                  />
                </motion.div>

                {/* Декоративное свечение под логотипом */}
                <motion.div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-pink-500/20 blur-xl rounded-full"
                  animate={{
                    scale: logoHovered ? 1.2 : 1,
                    opacity: logoHovered ? 0.8 : 0.4,
                  }}
                  transition={{ duration: 0.4 }}
                />
              </Link>

              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                {t("footer.platformDesc")}
              </p>

              {/* Социальные сети */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="group w-12 h-12 rounded-xl bg-white/60 backdrop-blur-sm border border-pink-200/50 flex items-center justify-center text-gray-600 hover:text-pink-600 hover:bg-pink-50/80 hover:border-pink-300/50 transition-all duration-300 shadow-md"
                  >
                    <social.icon
                      className={`w-6 h-6 ${
                        social.label === "Telegram" || social.label === "Instagram"
                          ? "text-pink-600 group-hover:text-pink-700"
                          : ""
                      }`}
                    />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Ссылки платформы */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                {t("footer.platformTitle")}
              </h3>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-gray-600 hover:text-pink-600 transition-colors duration-200 text-sm flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-300 group-hover:bg-pink-500 group-hover:scale-125 transition-all" />
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ссылки сообщества */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                {t("footer.communityTitle")}
              </h3>
              <ul className="space-y-3">
                {footerLinks.community.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-gray-600 hover:text-pink-600 transition-colors duration-200 text-sm flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-300 group-hover:bg-purple-500 group-hover:scale-125 transition-all" />
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Контакты */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
                {t("footer.contactsTitle")}
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:hello@womenintech.uz"
                    className="text-gray-600 hover:text-pink-600 transition-colors duration-200 text-sm flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-pink-400" />
                    hello@womenintech.uz
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+998771870027"
                    className="text-gray-600 hover:text-pink-600 transition-colors duration-200 text-sm flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-pink-400" />
                    +998 (77) 187-00-27
                  </a>
                </li>
                <li className="flex items-start gap-2 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                  <span>{t("footer.address")}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Нижняя часть */}
          <div className="mt-12 pt-8 border-t border-pink-200/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-500 text-sm flex items-center gap-1">
                {t("footer.copyright")}
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                </motion.span>
                {t("footer.madeInTashkent")}
              </p>
              <div className="flex items-center gap-6">
                {footerLinks.legal.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="text-gray-500 hover:text-pink-600 transition-colors duration-200 text-xs"
                  >
                    {t(link.key)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}