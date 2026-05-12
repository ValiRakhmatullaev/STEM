import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import CheckinsLite from "./pages/CheckinsLite";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";

const isCheckinsMode =
  window.location.pathname.startsWith("/checkins-panel") ||
  window.location.pathname.startsWith("/checkins-lite");

if (isCheckinsMode) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <LanguageProvider>
          <Routes>
            <Route path="/checkins-panel" element={<CheckinsLite />} />
            <Route path="/checkins-lite" element={<CheckinsLite />} />
            <Route path="*" element={<Navigate to="/checkins-panel" replace />} />
          </Routes>
        </LanguageProvider>
      </BrowserRouter>
    </StrictMode>
  );
} else {
  const App = lazy(() => import("./App"));
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
              <App />
            </Suspense>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
