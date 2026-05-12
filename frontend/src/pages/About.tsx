import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowDown,
  Target,
  Handshake,
  BookOpen,
  Rocket,
  GraduationCap,
  Users,
  Briefcase,
  CalendarDays,
  Sparkles,
  Star,
} from "lucide-react";

const problemItems = [
  "Нет доступа к знаниям",
  "Недостаток поддержки",
  "Страх начать",
  "Нет примеров для подражания",
];

const solutionItems = [
  "Обучение и практика",
  "Менторство",
  "Сообщество",
  "Возможности роста",
];

const missionCards = [
  { icon: Target, title: "Возможности", text: "Открываем путь в STEM через реальные инструменты." },
  { icon: Handshake, title: "Сообщество", text: "Создаём безопасную и поддерживающую среду." },
  { icon: BookOpen, title: "Знания", text: "Делаем образование в технологиях доступным." },
  { icon: Rocket, title: "Развитие", text: "Помогаем расти от первого шага до лидерства." },
];

const actionCards = [
  { icon: GraduationCap, title: "Образование", text: "Программы, воркшопы и практические форматы обучения." },
  { icon: Handshake, title: "Менторство", text: "Поддержка от практикующих специалистов и экспертов." },
  { icon: Users, title: "Комьюнити", text: "Сильное окружение, которое помогает не сдаваться." },
  { icon: Star, title: "Истории успеха", text: "Реальные кейсы девушек, которые уже прошли этот путь." },
  { icon: Briefcase, title: "Карьерные возможности", text: "Доступ к стажировкам, вакансиям и партнёрским программам." },
  { icon: CalendarDays, title: "Ивенты", text: "Мероприятия, где можно учиться, общаться и вдохновляться." },
];

const values = [
  "Талант не имеет гендера",
  "Возможности должны быть доступны каждой",
  "Технологии меняют мир",
  "Сообщество меняет жизни",
];

export default function About() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-gray-900 overflow-x-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/80 via-purple-50/70 to-white pointer-events-none" />

      {/* Hero */}
      <section className="relative z-10 py-24 lg:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <img
            src="/STEM_FOTO.png"
            alt="STEM Women Uzbekistan"
            className="mx-auto w-56 h-56 object-contain mb-6"
          />
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight"
          >
            Открываем возможности для девушек в STEM
          </motion.h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 leading-relaxed">
            Сообщество, обучение и поддержка для старта и роста в технологиях
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:shadow-lg hover:shadow-pink-300/40 transition-all"
            >
              Присоединиться <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#about-more"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-pink-700 border border-pink-200 bg-white/80 hover:bg-pink-50 transition-all"
            >
              Узнать больше <ArrowDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Problem -> Solution */}
      <section id="about-more" className="relative z-10 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white/90 border border-pink-100 shadow-sm p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-5">С какими барьерами сталкиваются девушки</h2>
            <ul className="space-y-3">
              {problemItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-2 h-2 w-2 rounded-full bg-rose-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/90 border border-pink-100 shadow-sm p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-5">Что даёт STEM WOMAN</h2>
            <ul className="space-y-3">
              {solutionItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-2 h-2 w-2 rounded-full bg-pink-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="relative z-10 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Наша история</h2>
            <p className="text-gray-700 text-lg leading-relaxed">
              STEM WOMAN — это сообщество и платформа возможностей для девушек и женщин, которые хотят
              реализовать себя в технологиях, науке и инновациях. Проект вырос из личного опыта и
              наблюдений: мы видели, как талантливые девушки сомневаются в себе не из-за отсутствия
              способностей, а из-за нехватки поддержки и правильного окружения.
            </p>
            <p className="mt-4 text-gray-700 text-lg leading-relaxed">
              Пройдя этот путь сами, мы поняли: двигаться вперёд помогает сообщество, возможности и вера
              в себя.
            </p>
            <blockquote className="mt-8 text-2xl md:text-3xl font-bold text-pink-600">
              «Я могу. Я справлюсь. И я не одна.»
            </blockquote>
          </div>
          <div className="rounded-3xl border border-pink-100 bg-white/80 p-4 shadow-lg">
            <div className="h-full min-h-[320px] rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-rose-100 flex items-center justify-center">
              <div className="text-center px-6">
                <Sparkles className="w-10 h-10 text-pink-500 mx-auto mb-3" />
                <p className="text-gray-700 text-lg">Поддержка, рост и уверенность в технологической сфере</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission cards */}
      <section className="relative z-10 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Наша миссия</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {missionCards.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -5 }}
                  className="rounded-2xl bg-white/90 border border-pink-100 shadow-sm p-5 text-center"
                >
                  <div className="mx-auto mb-3 h-12 w-12 rounded-xl bg-pink-50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-pink-600" />
                  </div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="relative z-10 py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Что мы делаем</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {actionCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.article
                  key={card.title}
                  whileHover={{ y: -6 }}
                  className="rounded-2xl bg-white border border-pink-100 shadow-sm p-6"
                >
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-pink-700" />
                  </div>
                  <h3 className="text-xl font-semibold">{card.title}</h3>
                  <p className="mt-2 text-gray-600">{card.text}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative z-10 py-24 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Наши ценности</h2>
          {values.map((value) => (
            <p key={value} className="text-2xl md:text-3xl font-medium text-gray-800">
              {value}
            </p>
          ))}
        </div>
      </section>

      {/* Vision */}
      <section className="relative z-10 py-24 lg:py-28 bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Наше видение</h2>
          <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
            Мы стремимся к миру, в котором девушки уверенно развиваются в технологической сфере, создают
            инновации, запускают проекты и становятся лидерами. И этот путь начинается с первого шага.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Начни свой путь в STEM уже сегодня</h2>
          <p className="mt-4 text-lg text-gray-600">Присоединяйся к сообществу STEM WOMAN</p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-semibold text-white bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 hover:shadow-lg hover:shadow-pink-300/40 transition-all"
          >
            Присоединиться <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

