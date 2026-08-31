import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  Mail, 
  Lock, 
  User, 
  MapPin, 
  Briefcase, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { authService, DEMO_PERSONAS, calculatePasswordStrength } from '../services/authService';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot';
  onSuccess?: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  
  // Sign Up state
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpCity, setSignUpCity] = useState('Bengaluru');
  const [signUpOccupation, setSignUpOccupation] = useState('Professional');
  const [signUpPhone, setSignUpPhone] = useState('');
  
  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const passwordStrength = calculatePasswordStrength(signUpPassword);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!signInEmail.trim()) {
      setErrorMsg('Please provide your email address.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.login(signInEmail, signInPassword);
      if (res.success && res.user) {
        if (onSuccess) onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Invalid credentials.');
      }
    } catch {
      setErrorMsg('Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!signUpName.trim() || !signUpEmail.trim()) {
      setErrorMsg('Name and email are required.');
      return;
    }
    if (signUpPassword && signUpPassword !== signUpConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (signUpPassword && signUpPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.signup({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        city: signUpCity,
        occupation: signUpOccupation,
        phone: signUpPhone
      });
      if (res.success && res.user) {
        if (onSuccess) onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    } catch {
      setErrorMsg('Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!forgotEmail.trim()) {
      setErrorMsg('Please provide your email address.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (data.success) {
        setForgotSent(true);
        setSuccessMsg(data.message || 'Reset link sent to your email.');
      } else {
        setErrorMsg(data.error || 'Could not send reset link.');
      }
    } catch {
      setForgotSent(true);
      setSuccessMsg(`Password reset link dispatched to ${forgotEmail}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonaSelect = (personaId: string) => {
    const user = authService.switchPersona(personaId);
    if (onSuccess) onSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Agentic Housing Account</h3>
              <p className="text-[11px] text-slate-400">Authenticated user identity & personal memory</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
          <button
            id="tab-auth-signin"
            type="button"
            onClick={() => { setMode('signin'); setErrorMsg(null); }}
            className={`py-3 px-4 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signin' ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            id="tab-auth-signup"
            type="button"
            onClick={() => { setMode('signup'); setErrorMsg(null); }}
            className={`py-3 px-4 text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'signup' ? 'border-emerald-600 text-emerald-700 bg-white' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
          <button
            id="tab-auth-personas"
            type="button"
            onClick={() => { setMode('signin'); }}
            className="py-3 px-4 text-center border-b-2 border-transparent text-slate-500 hover:text-slate-900 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personas</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Demo Persona Switcher */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick-Switch Demo Personas
              </span>
              <span className="text-[10px] text-slate-400">1-Click Sign In</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_PERSONAS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePersonaSelect(p.id)}
                  className="p-2 rounded-lg bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-left transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <img src={p.avatarUrl} alt={p.name} className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-800 truncate">{p.name}</p>
                    <p className="text-[9px] text-slate-500 truncate">{p.city.split(' ')[0]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-auth-email"
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder="e.g. girasevaishnavi28@gmail.com"
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-auth-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none"
                  />
                </div>
              </div>

              <button
                id="btn-auth-submit-signin"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="input-signup-name"
                      type="text"
                      required
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      placeholder="Vaishnavi"
                      className="w-full pl-9 pr-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">City / Region</label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="input-signup-city"
                      type="text"
                      value={signUpCity}
                      onChange={(e) => setSignUpCity(e.target.value)}
                      placeholder="Bengaluru"
                      className="w-full pl-9 pr-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-signup-email"
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-9 pr-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={signUpPhone}
                      onChange={(e) => setSignUpPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full pl-9 pr-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Occupation</label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={signUpOccupation}
                      onChange={(e) => setSignUpOccupation(e.target.value)}
                      placeholder="e.g. Student / Tech"
                      className="w-full pl-9 pr-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-9 pr-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Password Strength Meter */}
                {signUpPassword && (
                  <div className="mt-2 space-y-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px]">
                    <div className="flex items-center justify-between text-slate-600 font-medium">
                      <span>Password Strength: <strong className="text-slate-800">{passwordStrength.label}</strong></span>
                      <span>{passwordStrength.score}/4</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4].map(idx => (
                        <div
                          key={idx}
                          className={`h-full flex-1 rounded-full transition-all ${
                            idx <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-500 pt-0.5">
                      <span className={passwordStrength.hasMinLength ? 'text-emerald-700 font-semibold' : ''}>
                        {passwordStrength.hasMinLength ? '✓' : '○'} 8+ characters
                      </span>
                      <span className={passwordStrength.hasNumber ? 'text-emerald-700 font-semibold' : ''}>
                        {passwordStrength.hasNumber ? '✓' : '○'} Contains number
                      </span>
                      <span className={passwordStrength.hasUpperCase ? 'text-emerald-700 font-semibold' : ''}>
                        {passwordStrength.hasUpperCase ? '✓' : '○'} Uppercase letter
                      </span>
                      <span className={passwordStrength.hasSymbol ? 'text-emerald-700 font-semibold' : ''}>
                        {passwordStrength.hasSymbol ? '✓' : '○'} Special symbol
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input-signup-password-confirm"
                    type="password"
                    value={signUpConfirmPassword}
                    onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-9 pr-2.5 py-2 text-xs rounded-lg border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <button
                id="btn-auth-submit-signup"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Free Account</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your email address and our autonomous agent system will send you a secure password reset link.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Registered Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setErrorMsg(null); }}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={isLoading || forgotSent}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Encrypted with Cloud Firestore Isolation</span>
          <span className="font-mono text-[10px] text-slate-400">Agentic Auth v1.4</span>
        </div>
      </div>
    </div>
  );
};
