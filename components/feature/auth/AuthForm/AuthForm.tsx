import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { AuthUser } from "@/types";

interface AuthProps {
  onLogin: (user: AuthUser, token: string, refreshToken?: string) => void;
  message?: string;
  onBackToHome?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, message, onBackToHome }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.auth.login({ email, password });
        localStorage.setItem("tkdn_token", data.token);
        if (data.refreshToken) {
          localStorage.setItem("tkdn_refresh_token", data.refreshToken);
        }
        onLogin(data.user, data.token, data.refreshToken);
      } else {
        if (!name.trim()) {
          setError(t('auth.nameRequired'));
          setLoading(false);
          return;
        }
        const data = await api.auth.register({ email, password, name });
        localStorage.setItem("tkdn_token", data.token);
        if (data.refreshToken) {
          localStorage.setItem("tkdn_refresh_token", data.refreshToken);
        }
        onLogin(data.user, data.token, data.refreshToken);
      }
    } catch (err: any) {
      setError(err.message || t('auth.authFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {message && (
        <div className="sticky top-4 right-4 z-50 flex justify-end px-4 mb-4">
          <div className="text-blue-600 text-sm font-medium bg-blue-50 border border-blue-100 p-3 rounded-lg shadow-sm max-w-xs animate-in fade-in slide-in-from-right duration-500">
            {message}
          </div>
        </div>
      )}
      <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
          <h1 className="text-2xl font-black uppercase text-slate-900 mb-2 text-center">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h1>
          <p className="text-slate-500 text-center mb-6 text-sm">
            {isLogin ? t('auth.signInDesc') : t('auth.registerDesc')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {t('auth.nameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={t('auth.namePlaceholder')}
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              {t('auth.passwordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-blue-200 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <span>{loading ? t('auth.pleaseWait') : isLogin ? t('auth.signIn') : t('auth.createAccountBtn')}</span>
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-blue-600 text-sm font-semibold hover:underline"
          >
            {isLogin ? `${t('auth.noAccount')} ${t('results.registerToSave')}` : `${t('auth.hasAccount')} ${t('auth.signIn')}`}
          </button>
          <div>
            <button
              type="button"
              onClick={() => onBackToHome?.()}
              className="inline-flex items-center text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {t('auth.backToHome')}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Auth;
