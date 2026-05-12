import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { Locale } from "../i18n/translations";

type FaqItem = {
  id: number;
  question: string;
  content: React.ReactNode;
};

const FAQ_ITEMS_BY_LOCALE: Record<Locale, FaqItem[]> = {
  ru: [
    {
      id: 1,
      question: "Что это за проект?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Наш проект — это вдохновляющее пространство для женщин, стремящихся развиваться и реализовывать свой потенциал в сфере STEM (наука, технологии, инженерия и математика). Мы объединяем знания, возможности и сообщество, чтобы поддерживать участниц на каждом этапе их пути — от первых шагов до профессионального роста. Через образовательные программы, мероприятия и нетворкинг мы создаём среду, где идеи превращаются в реальные достижения, а каждая женщина может почувствовать уверенность в своих силах и будущем в технологиях.
        </p>
      ),
    },
    {
      id: 2,
      question: "Кто может участвовать в ваших мероприятиях?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Участвовать могут все желающие женщины и девушки, независимо от уровня подготовки — от начинающих до профессионалов в STEM.
        </p>
      ),
    },
    {
      id: 3,
      question: "Нужно ли иметь технический опыт?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Нет, не обязательно. У нас есть мероприятия как для новичков, так и для тех, кто уже работает в STEM-сфере.
        </p>
      ),
    },
    {
      id: 4,
      question: "Какие мероприятия вы проводите?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Мы создаём разнообразные форматы мероприятий, направленные на развитие знаний, навыков и профессиональных связей в сфере STEM. Среди них:
          </p>
          <ul className="list-disc pl-5 space-y-2 marker:text-pink-500">
            <li>практические воркшопы и интерактивные мастер-классы, где участницы получают реальные навыки</li>
            <li>лекции и вебинары с участием экспертов индустрии</li>
            <li>карьерные встречи и нетворкинг-сессии для расширения профессиональных возможностей</li>
            <li>менторские программы с поддержкой опытных специалистов</li>
            <li>форумы и масштабные события, объединяющие сообщество и вдохновляющие на новые достижения</li>
          </ul>
          <p>Каждое мероприятие — это возможность учиться, расти и находить единомышленников.</p>
        </div>
      ),
    },
    {
      id: 5,
      question: "Платные ли у вас мероприятия?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Все мероприятия бесплатные, но количество мест ограничено.
        </p>
      ),
    },
    {
      id: 6,
      question: "Как зарегистрироваться на мероприятие?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Зарегистрироваться очень просто: выберите интересующее вас мероприятие на нашем сайте и заполните короткую регистрационную форму. После этого вы получите всю необходимую информацию для участия.
          </p>
          <p>
            Также рекомендуем подписаться на наши страницы в Instagram и Telegram — там мы делимся анонсами мероприятий, полезными материалами и актуальными новостями, чтобы вы всегда оставались в курсе наших инициатив.
          </p>
        </div>
      ),
    },
    {
      id: 7,
      question: "Могу ли я стать спикером или ментором?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Да! Мы всегда рады новым экспертам. Пожалуйста, свяжитесь с нами по почте или в социальных сетях.
        </p>
      ),
    },
    {
      id: 8,
      question: "Как я могу стать партнёром или спонсором?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Мы открыты к сотрудничеству и всегда рады партнёрам, разделяющим нашу миссию поддержки женщин в STEM. Если вы заинтересованы в совместных проектах, спонсорстве или других форматах взаимодействия, свяжитесь с нами по электронной почте или через социальные сети.
          </p>
          <p>
            Мы будем рады обсудить возможные направления сотрудничества и создать вместе инициативы, которые принесут реальную ценность сообществу.
          </p>
        </div>
      ),
    },
  ],
  uz: [
    {
      id: 1,
      question: "Bu qanday loyiha?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Bizning loyihamiz — STEM (fan, texnologiya, muhandislik va matematika) sohasida o'z salohiyatini rivojlantirish va ro'yobga chiqarishni istagan ayollar uchun ilhomlantiruvchi makon. Biz bilim, imkoniyatlar va hamjamiyatni birlashtirib, ishtirokchilarni yo'lning har bir bosqichida — dastlabki qadamlaridan tortib professional o'sishigacha — qo'llab-quvvatlaymiz. Ta'lim dasturlari, tadbirlar va networking orqali g'oyalar real yutuqlarga aylanishi uchun muhit yaratamiz, har bir ayol esa o'z kuchiga va texnologiyalardagi kelajagiga ishonch his qilishi mumkin.
        </p>
      ),
    },
    {
      id: 2,
      question: "Sizning tadbirlaringizda kim ishtirok eta oladi?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Tayyorlik darajasidan qat'i nazar, STEMda boshlovchi bo'lasizmi yoki tajribali mutaxassismi — xohlagan ayollar va qizlar ishtirok etishi mumkin.
        </p>
      ),
    },
    {
      id: 3,
      question: "Texnik tajriba bo'lishi shartmi?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Yo'q, shart emas. Bizda ham yangilar uchun, ham STEM sohasida ishlayotganlar uchun tadbirlar bor.
        </p>
      ),
    },
    {
      id: 4,
      question: "Qanday tadbirlar o'tkazasiz?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Biz STEM sohasida bilim, ko'nikma va professional aloqalarni rivojlantirishga qaratilgan turli formatdagi tadbirlarni o‘tkazamiz. Jumladan:
          </p>
          <ul className="list-disc pl-5 space-y-2 marker:text-pink-500">
            <li>amaliy workshplar va interaktiv master-klasslar — bu yerda ishtirokchilar real ko'nikmalarni egallaydi</li>
            <li>sanoat ekspertlari ishtirokidagi ma'ruzalar va vebinarlar</li>
            <li>karyera uchrashuvlari va networking-sessiyalar — professional imkoniyatlarni kengaytirish uchun</li>
            <li>tajribali mutaxassislar ko'magidagi mentorlik dasturlari</li>
            <li>forumlar va hamjamiyatni birlashtiradigan, yangi yutuqlarga ilhomlantiradigan yirik tadbirlar</li>
          </ul>
          <p>Har bir tadbir o‘rganish, o‘sish va hamfikrlarni topish imkoniyatidir.</p>
        </div>
      ),
    },
    {
      id: 5,
      question: "Tadbirlar pullikmi?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Barcha tadbirlar bepul, lekin o'rinlar soni cheklangan.
        </p>
      ),
    },
    {
      id: 6,
      question: "Tadbirga qanday ro'yxatdan o'tish mumkin?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Ro'yxatdan o'tish juda oson: saytda sizni qiziqtirgan tadbirni tanlang va qisqa ro'yxatdan o'tish formasini to'ldiring. Shundan so'ng ishtirok etish uchun kerak bo'ladigan barcha ma'lumotlarni olasiz.
          </p>
          <p>
            Shuningdek, Instagram va Telegram sahifalarimizga obuna bo'lishni tavsiya qilamiz — u yerda tadbirlar e'lonlari, foydali materiallar va dolzarb yangiliklarni ulashamiz, shunda tashabbuslarimizdan doimo xabardor bo'lib turasiz.
          </p>
        </div>
      ),
    },
    {
      id: 7,
      question: "Spiker yoki mentor bo'la olamanmi?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Ha! Biz doim yangi ekspertlarni mamnuniyat bilan kutib olamiz. Iltimos, email yoki ijtimoiy tarmoqlar orqali biz bilan bog'laning.
        </p>
      ),
    },
    {
      id: 8,
      question: "Qanday qilib hamkor yoki homiy bo'lishim mumkin?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Biz hamkorlikka ochiqmiz va STEM sohasida ayollarni qo'llab-quvvatlash missiyamizni baham ko'radigan hamkorlarni doimo xush ko'ramiz. Agar siz birgalikdagi loyihalar, homiylik yoki boshqa hamkorlik formatlariga qiziqsangiz, email yoki ijtimoiy tarmoqlar orqali biz bilan bog'laning.
          </p>
          <p>
            Hamkorlik yo'nalishlarini muhokama qilish va hamjamiyat uchun real qiymat keltiradigan tashabbuslarni birgalikda yaratishdan mamnun bo'lamiz.
          </p>
        </div>
      ),
    },
  ],
  en: [
    {
      id: 1,
      question: "What is this project?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Our project is an inspiring space for women who want to grow and unlock their potential in STEM (science, technology, engineering, and mathematics). We bring together knowledge, opportunities, and community to support participants at every stage of their journey — from first steps to professional growth. Through educational programs, events, and networking, we create an environment where ideas turn into real achievements, and every woman can feel confident in her abilities and future in technology.
        </p>
      ),
    },
    {
      id: 2,
      question: "Who can participate in your events?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Any women and girls are welcome, regardless of their preparation level — from beginners to experienced professionals in STEM.
        </p>
      ),
    },
    {
      id: 3,
      question: "Do I need to have technical experience?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          No, not at all. We host events for both beginners and people who already work in the STEM field.
        </p>
      ),
    },
    {
      id: 4,
      question: "What kinds of events do you run?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            We create a variety of event formats aimed at developing knowledge, skills, and professional connections in STEM. Among them:
          </p>
          <ul className="list-disc pl-5 space-y-2 marker:text-pink-500">
            <li>hands-on workshops and interactive masterclasses where participants gain real skills</li>
            <li>lectures and webinars with industry experts</li>
            <li>career meetups and networking sessions to expand professional opportunities</li>
            <li>mentorship programs supported by experienced specialists</li>
            <li>forums and large-scale events that bring the community together and inspire new achievements</li>
          </ul>
          <p>Each event is a chance to learn, grow, and meet like-minded people.</p>
        </div>
      ),
    },
    {
      id: 5,
      question: "Are your events paid?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          All our events are free, but the number of seats is limited.
        </p>
      ),
    },
    {
      id: 6,
      question: "How do I register for an event?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            Registration is easy: choose the event you like on our website and fill in the short registration form. After that, you’ll receive all the information you need to participate.
          </p>
          <p>
            We also recommend following our Instagram and Telegram pages — there we share event announcements, helpful resources, and the latest news so you stay up to date with our initiatives.
          </p>
        </div>
      ),
    },
    {
      id: 7,
      question: "Can I become a speaker or mentor?",
      content: (
        <p className="text-gray-700 leading-relaxed">
          Yes! We’re always happy to meet new experts. Please contact us by email or through social networks.
        </p>
      ),
    },
    {
      id: 8,
      question: "How can I become a partner or sponsor?",
      content: (
        <div className="space-y-4 text-gray-700 leading-relaxed">
          <p>
            We’re open to collaboration and always welcome partners who share our mission to support women in STEM. If you’re interested in joint projects, sponsorship, or other partnership formats, contact us by email or through social networks.
          </p>
          <p>
            We’d be glad to discuss potential directions of collaboration and create initiatives together that bring real value to the community.
          </p>
        </div>
      ),
    },
  ],
};

export default function Faq() {
  const [openId, setOpenId] = useState<number | null>(null);
  const { locale, t } = useLanguage();
  const items = FAQ_ITEMS_BY_LOCALE[locale];

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

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
          <p className="text-pink-600 font-semibold text-sm uppercase tracking-wider">{t("faq.help")}</p>
          <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 mt-2">{t("faq.title")}</h1>
          <p className="mt-3 text-gray-700 text-lg">{t("faq.subtitle")}</p>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white/85 backdrop-blur-xl border border-pink-100 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 sm:px-6 sm:py-5 hover:bg-pink-50/40 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-gray-900 text-base sm:text-lg pr-2">
                    {item.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 text-pink-600"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-pink-100/80">
                        <div className="pt-4 text-base">{item.content}</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
