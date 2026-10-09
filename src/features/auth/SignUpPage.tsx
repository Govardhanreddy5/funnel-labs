import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  Lock,
  Mail,
  Store,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateStoreName,
  evaluatePasswordStrength,
} from '../../utils/validators';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pwdStrength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const errs: Record<string, string> = {};

    if (!fullName.trim()) {
      errs.fullName = 'Full name is required.';
    }

    const storeErr = validateStoreName(storeName);
    if (storeErr) errs.storeName = storeErr;

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;

    const passErr = validatePassword(password, 8);
    if (passErr) errs.password = passErr;

    const confirmErr = validatePasswordConfirmation(password, confirmPassword);
    if (confirmErr) errs.confirmPassword = confirmErr;

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setErrorMsg('Please resolve the highlighted validation errors.');
      return;
    }

    setIsLoading(true);
    const { error, user } = await signUp(email, password, { fullName, storeName });
    setIsLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (user && !user.confirmed_at) {
        setSuccessMsg(
          'Account created! If email confirmation is active, check your inbox. Otherwise you can sign in directly.'
        );
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070d1e] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-2xl tracking-tight">Funnel Labs</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded">
                D2C
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Growth Experimentation Platform</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white tracking-tight">Create your brand workspace</h2>
        <p className="mt-1 text-xs text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in here →
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-8 shadow-2xl rounded-2xl border border-slate-200">
          {errorMsg && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              role="status"
              className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Founder Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-name"
                  type="text"
                  required
                  aria-invalid={Boolean(fieldErrors.fullName)}
                  aria-describedby={fieldErrors.fullName ? 'signup-name-error' : undefined}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
                  }}
                  placeholder="e.g. Aarav Sharma"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 transition-all ${
                    fieldErrors.fullName
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p
                  id="signup-name-error"
                  role="alert"
                  className="mt-1 text-xs text-rose-600 font-medium"
                >
                  {fieldErrors.fullName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="signup-store"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Brand / Store Name (Organization)
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-store"
                  type="text"
                  required
                  aria-invalid={Boolean(fieldErrors.storeName)}
                  aria-describedby={fieldErrors.storeName ? 'signup-store-error' : undefined}
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    if (fieldErrors.storeName)
                      setFieldErrors((prev) => ({ ...prev, storeName: '' }));
                  }}
                  placeholder="e.g. Bombay Threads D2C"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 transition-all ${
                    fieldErrors.storeName
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {fieldErrors.storeName && (
                <p
                  id="signup-store-error"
                  role="alert"
                  className="mt-1 text-xs text-rose-600 font-medium"
                >
                  {fieldErrors.storeName}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
              >
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="signup-email"
                  type="email"
                  required
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="founder@bombaythreads.com"
                  className={`w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border rounded-lg text-sm text-slate-900 outline-none focus:bg-white focus:ring-2 transition-all ${
                    fieldErrors.email
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p
                  id="signup-email-error"
                  role="alert"
                  className="mt-1 text-xs text-rose-600 font-medium"
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="signup-password"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'signup-password-error' : undefined}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password)
                        setFieldErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 outline-none focus:bg-white transition-all ${
                      fieldErrors.password
                        ? 'border-rose-300 focus:border-rose-500'
                        : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {fieldErrors.password && (
                  <p
                    id="signup-password-error"
                    role="alert"
                    className="mt-1 text-xs text-rose-600 font-medium"
                  >
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="signup-confirm"
                  className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="signup-confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                    aria-describedby={
                      fieldErrors.confirmPassword ? 'signup-confirm-error' : undefined
                    }
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword)
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-3 py-2 bg-slate-50 border rounded-lg text-sm text-slate-900 outline-none focus:bg-white transition-all ${
                      fieldErrors.confirmPassword
                        ? 'border-rose-300 focus:border-rose-500'
                        : 'border-slate-200 focus:border-indigo-500'
                    }`}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p
                    id="signup-confirm-error"
                    role="alert"
                    className="mt-1 text-xs text-rose-600 font-medium"
                  >
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                  <span>Strength: {pwdStrength.label}</span>
                  <span>{pwdStrength.score}/4</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      pwdStrength.score <= 1
                        ? 'bg-rose-500 w-1/4'
                        : pwdStrength.score === 2
                          ? 'bg-amber-500 w-2/4'
                          : pwdStrength.score === 3
                            ? 'bg-blue-500 w-3/4'
                            : 'bg-emerald-500 w-full'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Creating Workspace...</span>
                ) : (
                  <>
                    <span>Create Free Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Your workspace and brand data are isolated by PostgreSQL Row Level Security.
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
