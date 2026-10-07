import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BrandLogo } from '../../components/common/BrandLogo.tsx';
import { api } from '../../services/api.ts';

interface LoginPageProps {
  onNavigate: (view: string, data?: { email?: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, verifyLoginOtp } = useAuth();
  
  // Auth step: 'credentials' -> 'otp'
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingLink, setIsResendingLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Check if redirected from 1-click verification link in Gmail
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('verified') === 'true') {
        const emailParam = params.get('email');
        if (emailParam) setEmail(emailParam);
        setSuccessInfo('Your administrator account has been verified! Please enter your password to receive your login OTP.');
      }
    }
  }, []);

  // Step 1: Validate email & password, dispatch 6-digit OTP
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');
    setUnverifiedEmail(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(cleanEmail, password, rememberMe);
      if (res.requireOtp) {
        setStep('otp');
        setSuccessInfo(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('not yet verified') || msg.toLowerCase().includes('not verified')) {
        setUnverifiedEmail(cleanEmail);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Validate 6-digit OTP and complete login
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo('');

    if (!otp || otp.length < 6) {
      setErrorMessage('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyLoginOtp(email.trim(), otp.trim(), rememberMe);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await login(email.trim(), password, rememberMe);
      setSuccessInfo('A fresh 6-digit OTP code has been dispatched to your email.');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Direct resend 1-click verification link to Gmail
  const handleDirectResendVerification = async () => {
    if (!unverifiedEmail) return;
    setIsResendingLink(true);
    try {
      const res = await api.resendVerification(unverifiedEmail);
      setSuccessInfo(res.message || '1-Click verification email dispatched! Please check your Gmail.');
      setErrorMessage('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to dispatch verification email.');
    } finally {
      setIsResendingLink(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand identity */}
        <div className="text-center mb-8 flex flex-col items-center">
          <BrandLogo size="lg" lightMode={false} className="justify-center mb-2" />
          <p className="text-xs text-slate-400">Enterprise Administration Console · regardstech.com</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {step === 'otp' && (
            <button
              type="button"
              onClick={() => {
                setStep('credentials');
                setOtp('');
                setErrorMessage('');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Email or Password</span>
            </button>
          )}

          <div className="mb-6">
            <h2 className="text-base font-semibold text-white">
              {step === 'credentials' ? 'Administrator Sign In' : 'Two-Factor OTP Verification'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {step === 'credentials'
                ? 'Enter your administrator credentials to receive your security OTP'
                : `Enter the 6-digit OTP code dispatched to ${email}`}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div>{errorMessage}</div>
                {unverifiedEmail && (
                  <div className="mt-2.5 pt-2.5 border-t border-rose-900/60 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] text-rose-300">
                        Check your Gmail inbox or Spam folder and click "Verify My Account".
                      </span>
                      <button
                        type="button"
                        onClick={handleDirectResendVerification}
                        disabled={isResendingLink}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-200 hover:text-white underline cursor-pointer shrink-0"
                      >
                        {isResendingLink ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Dispatching...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Resend Link to Gmail</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-rose-300/80">
                      💡 Tip: Super Admin can also verify your account directly in 1 second by clicking "Verify Now" on the Admins page.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {successInfo && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successInfo}</span>
            </div>
          )}

          {/* STEP 1: CREDENTIALS FORM */}
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('forgot-password')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-400">Remember session for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-colors mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying credentials…</span>
                  </>
                ) : (
                  <span>Send Login OTP Code →</span>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION FORM */
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Enter 6-Digit Login OTP</span>
                  <span className="text-[10px] text-slate-500 font-normal">Valid for 10 minutes</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 583921"
                    autoFocus
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono tracking-widest text-center text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 6}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-colors mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP…</span>
                  </>
                ) : (
                  <span>Verify OTP & Log In</span>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Didn't receive OTP? Resend Code
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-[11px] text-slate-400">
          Protected by Regards Tech Two-Factor Security Protocol
        </div>
      </div>
    </div>
  );
};
