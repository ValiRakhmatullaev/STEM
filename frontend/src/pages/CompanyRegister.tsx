import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Building2, ArrowLeft } from "lucide-react";
import { apiFetch } from "../api";

const INDUSTRY_OPTIONS = [
  { value: "fintech", label: "Fintech" },
  { value: "edtech", label: "Edtech" },
  { value: "telecom", label: "Telecom" },
  { value: "software", label: "Software" },
  { value: "other", label: "Other" },
];

const SIZE_OPTIONS = [
  { value: "startup", label: "Startup" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "enterprise", label: "Enterprise" },
];

export default function CompanyRegister() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    company_name: "",
    industry: "",
    size: "",
    location: "",
    website: "",
    description: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGlobalError("");
    setFieldErrors({});
    try {
      const res = await apiFetch("/api/companies/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field_errors) setFieldErrors(data.field_errors);
        setGlobalError(data.message || "Ошибка регистрации");
        return;
      }
      setSuccess(true);
    } catch {
      setGlobalError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/70 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Компания зарегистрирована!</h2>
          <p className="text-gray-600 mb-6">
            Ваш аккаунт создан. Для доступа к списку верифицированных участников необходимо
            одобрение администратора.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors"
            >
              Войти
            </Link>
            <Link
              to="/"
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputCls = (name: string) =>
    `w-full rounded-xl border px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 bg-white transition-all outline-none focus:ring-2 focus:ring-blue-300/40 focus:border-blue-400 ${
      fieldErrors[name] ? "border-red-400 bg-red-50/30" : "border-gray-200 hover:border-gray-300"
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/80 via-purple-50/70 to-pink-50/70 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Регистрация компании</h1>
            <p className="text-sm text-gray-500">Создайте аккаунт для доступа к участникам</p>
          </div>
        </div>

        {globalError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Логин</label>
              <input name="username" value={form.username} onChange={handleChange} placeholder="company_login" className={inputCls("username")} />
              {fieldErrors.username && <p className="text-xs text-red-500 mt-1">{fieldErrors.username}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="company@mail.com" className={inputCls("email")} />
              {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Пароль</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Минимум 8 символов" className={inputCls("password")} />
            {fieldErrors.password && <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>}
          </div>

          <hr className="border-gray-100" />

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Название компании</label>
            <input name="company_name" value={form.company_name} onChange={handleChange} placeholder="ACME Corp" className={inputCls("company_name")} />
            {fieldErrors.company_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.company_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Отрасль</label>
              <select name="industry" value={form.industry} onChange={handleChange} className={inputCls("industry")}>
                <option value="">Выберите</option>
                {INDUSTRY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {fieldErrors.industry && <p className="text-xs text-red-500 mt-1">{fieldErrors.industry}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Размер</label>
              <select name="size" value={form.size} onChange={handleChange} className={inputCls("size")}>
                <option value="">Выберите</option>
                {SIZE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {fieldErrors.size && <p className="text-xs text-red-500 mt-1">{fieldErrors.size}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Местоположение</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="Ташкент, Узбекистан" className={inputCls("location")} />
            {fieldErrors.location && <p className="text-xs text-red-500 mt-1">{fieldErrors.location}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Сайт (необязательно)</label>
            <input name="website" value={form.website} onChange={handleChange} placeholder="https://example.com" className={inputCls("website")} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Описание (необязательно)</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="О компании..." className={inputCls("description")} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Зарегистрировать компанию
          </button>

          <p className="text-center text-sm text-gray-500">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
