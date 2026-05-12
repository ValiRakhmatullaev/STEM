import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden relative"
         style={{ perspective: "1200px" }}>

      {/* Глобальный лёгкий 3D-фон (очень subtle) */}
      <div className="fixed inset-0 bg-gradient-to-br from-pink-50/40 via-purple-50/30 to-transparent pointer-events-none z-[-1]" />

      <Navbar />

      {/* Основной контент с улучшенной анимацией */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          className="flex-1 relative z-10"
          initial={{ opacity: 0, y: 40, rotateX: -8 }}
          animate={{
            opacity: 1,
            y: 0,
            rotateX: 0
          }}
          exit={{
            opacity: 0,
            y: -30,
            rotateX: 6
          }}
          transition={{
            duration: 0.65,
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{ transformStyle: "preserve-3d" }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <Footer />

      {/* Декоративный градиентный блик внизу страницы */}
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-pink-100/10 via-transparent to-transparent pointer-events-none z-[-1]" />
    </div>
  );
}