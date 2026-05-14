import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { apiFetch } from "../api";
import { useLanguage } from "../context/LanguageContext";

const TiltCard = ({ children }: { children: React.ReactNode }) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2, ease: "easeOut" }} className="relative">
    {children}
  </motion.div>
);

const InputField = ({
  id, label, type = "text", value, onChange, error, placeholder, children, ...rest
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; placeholder?: string; children?: React.ReactNode;
  [key: string]: unknown;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-slate-400 select-none">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-800 placeholder:text-slate-300
        bg-white transition-all duration-200 outline-none
        focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400
        ${error ? "border-rose-400 bg-rose-50/30" : "border-slate-200 hover:border-slate-300"}`}
      {...rest}
    />
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className="text-xs text-rose-500 font-medium"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
    {children}
  </div>
);

export default function Register() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const personalDataConsentLabel =
    t("register.personalDataConsent") === "register.personalDataConsent"
      ? "Я согласна на обработку личных данных, которые я указала при регистрации."
      : t("register.personalDataConsent");
  const personalDataConsentError =
    t("register.errorPersonalDataConsent") === "register.errorPersonalDataConsent"
      ? "Нужно согласие на обработку личных данных"
      : t("register.errorPersonalDataConsent");
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    username: "", first_name: "", last_name: "", age: "", city: "",
    phone: "", email: "", password: "", passwordConfirm: "",
    education_status: "", university: "", personal_data_consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (formData.username.length < 3) newErrors.username = t("register.errorMinChars3");
      if (!formData.email) newErrors.email = t("register.errorEmailRequired");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t("register.errorEmailInvalid");
      if (formData.password.length < 8) newErrors.password = t("register.errorMinChars8");
      if (formData.password !== formData.passwordConfirm) newErrors.passwordConfirm = t("register.errorPasswordMismatch");
      if (!formData.first_name.trim()) newErrors.first_name = t("register.errorRequired");
      if (!formData.last_name.trim()) newErrors.last_name = t("register.errorRequired");
      const ageNum = Number(formData.age);
      if (!formData.age) newErrors.age = t("register.errorRequired");
      else if (!Number.isFinite(ageNum) || ageNum < 10 || ageNum > 120) newErrors.age = t("register.errorAgeRange");
      if (!formData.city.trim()) newErrors.city = t("register.errorRequired");
      if (!formData.phone.trim()) newErrors.phone = t("register.errorRequired");
      else if (formData.phone.replace(/\D/g, "").length < 7) newErrors.phone = t("register.errorPhoneShort");
    } else {
      if (!formData.education_status) newErrors.education_status = t("register.errorSelectStatus");
      if ((formData.education_status === "student" || formData.education_status === "graduate") && !formData.university.trim())
        newErrors.university = t("register.errorUniversity");
      if (!formData.personal_data_consent) newErrors.personal_data_consent = personalDataConsentError;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => ({ ...prev, [id]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    if (step === 1) { if (!validateForm()) return; setErrors({}); setStep(2); return; }
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username, email: formData.email, password: formData.password,
          first_name: formData.first_name, last_name: formData.last_name, age: formData.age,
          city: formData.city, phone: formData.phone, education_status: formData.education_status,
          university: formData.university || undefined,
          personal_data_consent: formData.personal_data_consent,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.field_errors && typeof data.field_errors === "object") setErrors(prev => ({ ...prev, ...data.field_errors }));
        const message = (Array.isArray(data.errors) && data.errors.length > 0 ? data.errors.join("\n") : null) || data.message || data.detail || t("register.errorGeneric");
        setApiError(typeof message === "string" ? message : t("register.errorGeneric"));
        return;
      }
      navigate("/login", { state: { message: t("register.successMessage") } });
    } catch (error) {
      setApiError(error instanceof Error ? error.message : t("register.errorUnknown"));
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmitStep1 =
    formData.username.length >= 3 && !!formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.password.length >= 8 && formData.password === formData.passwordConfirm &&
    !!formData.first_name.trim() && !!formData.last_name.trim() && !!formData.age &&
    (() => { const n = Number(formData.age); return Number.isFinite(n) && n >= 10 && n <= 120; })() &&
    !!formData.city.trim() && formData.phone.replace(/\D/g, "").length >= 7;

  const canSubmitStep2 = !!formData.education_status &&
    ((formData.education_status === "student" || formData.education_status === "graduate") ? !!formData.university.trim() : true) &&
    formData.personal_data_consent;

  const canSubmit = step === 1 ? canSubmitStep1 : canSubmitStep2;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center px-4 py-16">
      {/* Subtle background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-64 -right-64 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-rose-100/60 via-pink-50/40 to-transparent blur-3xl" />
        <div className="absolute -bottom-64 -left-64 w-[700px] h-[700px] rounded-full bg-gradient-to-tr from-purple-100/50 via-pink-50/30 to-transparent blur-3xl" />
      </div>

      <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center gap-8">

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("register.title")}</h1>
            <p className="mt-1 text-sm text-slate-500">{t("register.subtitle")}</p>
          </div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 w-full">
          {[1, 2].map((s) => (
            <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
              <motion.div
                animate={{ backgroundColor: step >= s ? "#f43f5e" : "#e2e8f0" }}
                className="w-full h-1 rounded-full"
              />
              <span className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${step >= s ? "text-rose-500" : "text-slate-300"}`}>
                {s === 1 ? t("register.stepPersonal") : t("register.stepEducation")}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <TiltCard>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="w-full rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/60 p-8"
          >
            <AnimatePresence>
              {apiError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium"
                >
                  {apiError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    {/* Two column row */}
                    <div className="grid grid-cols-2 gap-3">
                      <InputField id="first_name" label={t("register.firstName")} value={formData.first_name} onChange={handleChange} error={errors.first_name} placeholder="Dildora" />
                      <InputField id="last_name" label={t("register.lastName")} value={formData.last_name} onChange={handleChange} error={errors.last_name} placeholder="Rakhmatova" />
                    </div>
                    <InputField id="username" label={t("register.username")} value={formData.username} onChange={handleChange} error={errors.username} placeholder="your_login" />
                    <InputField id="email" label={t("register.email")} type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="example@mail.com" />
                    <div className="grid grid-cols-2 gap-3">
                      <InputField id="password" label={t("register.password")} type="password" value={formData.password} onChange={handleChange} error={errors.password} placeholder="••••••••" />
                      <InputField id="passwordConfirm" label={t("register.passwordConfirm")} type="password" value={formData.passwordConfirm} onChange={handleChange} error={errors.passwordConfirm} placeholder="••••••••" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InputField id="age" label={t("register.age")} type="number" value={formData.age} onChange={handleChange} error={errors.age} placeholder="20" min={10} max={120} />
                      <InputField id="city" label={t("register.city")} value={formData.city} onChange={handleChange} error={errors.city} placeholder="Tashkent" />
                    </div>
                    <InputField id="phone" label={t("register.phone")} type="tel" value={formData.phone} onChange={handleChange} error={errors.phone} placeholder="+998 90 123 45 67" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">
                        {t("register.educationStatus")}
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "student", label: t("register.student") },
                          { value: "graduate", label: t("register.graduate") },
                          { value: "not_studying", label: t("register.notStudying") },
                        ].map((opt) => (
                          <label
                            key={opt.value}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150
                              ${formData.education_status === opt.value
                                ? "border-rose-400 bg-rose-50/50 text-rose-700"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                              ${formData.education_status === opt.value ? "border-rose-500 bg-rose-500" : "border-slate-300"}`}>
                              {formData.education_status === opt.value && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                            </div>
                            <input type="radio" name="education_status" value={opt.value} checked={formData.education_status === opt.value}
                              onChange={(ev) => setFormData(prev => ({ ...prev, education_status: ev.target.value }))} className="sr-only" />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      {errors.education_status && <p className="text-xs text-rose-500 font-medium">{errors.education_status}</p>}
                    </div>

                    <AnimatePresence>
                      {(formData.education_status === "student" || formData.education_status === "graduate") && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                          <InputField id="university" label={t("register.university")} value={formData.university} onChange={handleChange} error={errors.university} placeholder={t("register.universityPlaceholder")} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <label
                      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors
                        ${errors.personal_data_consent ? "border-rose-300 bg-rose-50/60" : "border-slate-200 bg-slate-50/60"}`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.personal_data_consent}
                        onChange={(ev) => {
                          setFormData(prev => ({ ...prev, personal_data_consent: ev.target.checked }));
                          if (errors.personal_data_consent) setErrors(prev => ({ ...prev, personal_data_consent: "" }));
                        }}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                      />
                      <span className="leading-5 text-slate-600">{personalDataConsentLabel}</span>
                    </label>
                    {errors.personal_data_consent && <p className="text-xs text-rose-500 font-medium">{errors.personal_data_consent}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

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
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t("register.loading")}</>
                ) : (
                  <>{step === 1 ? t("register.next") : t("register.submit")} <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t("register.haveAccount")}{" "}
              <Link to="/login" className="font-semibold text-rose-500 hover:text-rose-600 transition-colors">
                {t("register.login")}
              </Link>
            </p>
          </motion.div>
        </TiltCard>

        <p className="text-xs text-slate-400 text-center">{t("register.slogan")}</p>
      </div>
    </div>
  );
}
