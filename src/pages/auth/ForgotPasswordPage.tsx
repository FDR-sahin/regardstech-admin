import React, { useState } from 'react';
import { Mail, KeyRound, Lock, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api.ts';

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
  onNavigateToSimulator?: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onBackToLogin }) => {
  // Step 1: 'request' | Step 2: 'verify_otp' | Step 3: 'new_password' | Step 4: 'success'
  const [step, setStep] = useState<'request' | 'verify_otp' | 'new_password' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  // Password requirements calculation
  const rules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
  };
  const isPasswordValid = Object.values(rules).every(Boolean);

  // Step 1: Send OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await api.forgotPassword(email.trim());
      setSuccessInfo(res.message);
      setStep('verify_otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await api.verifyOtp(email, otp);
      setStep('new_password');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please meet all security requirements for your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.resetPassword(email, otp, newPassword, confirmPassword);
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>

          {/* Step 1: Request OTP */}
          {step === 'request' && (
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-white">Reset Admin Password</h2>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                Enter your registered administrator email address. We will dispatch a 6-digit verification code.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="admin@regardstech.com"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Send 6-Digit OTP</span>}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'verify_otp' && (
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-white">Enter Security OTP</h2>
              <p className="text-xs text-slate-400 mt-1 mb-2">
                We sent a 6-digit code to <span className="font-semibold text-slate-200">{email}</span>.
              </p>
              <p className="text-[11px] text-amber-300 mb-6">
                Code valid for 10 minutes. (Inspect Dev Outbox if testing locally)
              </p>

              {successInfo && (
                <div className="mb-4 p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{successInfo}</span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    6-Digit One-Time Password
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    className="w-full text-center tracking-[0.5em] font-mono text-lg py-3 bg-slate-950/70 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verify OTP Code</span>}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-xs text-slate-400 hover:text-indigo-300"
                  >
                    Didn&apos;t receive code? Resend OTP
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 'new_password' && (
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-white">Create New Password</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5">
                Set a strong, secure passphrase for administrator access.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="New strong password"
                      required
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Password Complexity Checklist */}
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5 text-[11px]">
                  <div className="font-semibold text-slate-300 mb-1">Password Requirements:</div>
                  <div className={`flex items-center gap-1.5 ${rules.length ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{rules.length ? '✓' : '○'}</span> Minimum 8 characters
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.upper ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{rules.upper ? '✓' : '○'}</span> At least one uppercase letter (A-Z)
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.lower ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{rules.lower ? '✓' : '○'}</span> At least one lowercase letter (a-z)
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.number ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{rules.number ? '✓' : '○'}</span> At least one number (0-9)
                  </div>
                  <div className={`flex items-center gap-1.5 ${rules.special ? 'text-emerald-400' : 'text-slate-500'}`}>
                    <span>{rules.special ? '✓' : '○'}</span> At least one special symbol (!@#$%^&*)
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !isPasswordValid || newPassword !== confirmPassword}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password & Finish</span>}
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-white">Password Updated!</h2>
              <p className="text-xs text-slate-400 mt-2 mb-6">
                Your administrator credentials have been successfully updated. The previous session and OTP have been invalidated.
              </p>
              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
