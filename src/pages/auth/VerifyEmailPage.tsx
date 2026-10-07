import React, { useState, useEffect } from 'react';
import { MailCheck, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Send, KeyRound } from 'lucide-react';
import { api } from '../../services/api.ts';

interface VerifyEmailPageProps {
  initialEmail?: string;
  initialToken?: string;
  onBackToLogin: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  initialEmail = '',
  initialToken = '',
  onBackToLogin
}) => {
  const [token, setToken] = useState(initialToken);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [showManualCode, setShowManualCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Auto-verify if token is present
  useEffect(() => {
    if (initialToken) {
      setIsLoading(true);
      api.verifyEmail(initialToken)
        .then((res) => {
          setSuccess(res.message);
          setIsVerified(true);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Verification link failed or expired.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialToken]);

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp && !email) {
      setError('Please provide your administrator email and 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.verifyEmail(token || undefined, email || undefined, otp || undefined);
      setSuccess(res.message);
      setIsVerified(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLink = async () => {
    if (!email) {
      setError('Please enter your administrator email to dispatch the verification link.');
      return;
    }

    setIsResending(true);
    setError('');
    try {
      const res = await api.resendVerification(email.trim());
      setSuccess(res.message || '1-Click verification link sent to your Gmail inbox!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch verification email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={onBackToLogin}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Sign In</span>
          </button>

          {!isVerified ? (
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                <MailCheck className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-white">1-Click Email Verification</h2>
              <p className="text-xs text-slate-400 mt-1 mb-5 leading-relaxed">
                Super Admin has dispatched a 1-click verification link to your Gmail. Open your Gmail inbox and click the <strong className="text-slate-200">"Verify My Account"</strong> button to immediately activate your account.
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Administrator Gmail Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. admin@gmail.com"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResendLink}
                  disabled={isResending || isLoading}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-semibold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching Link to Gmail...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send 1-Click Verification Link to Gmail</span>
                    </>
                  )}
                </button>

                {/* Optional manual code fallback toggle */}
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setShowManualCode(!showManualCode)}
                    className="text-[11px] text-slate-400 hover:text-indigo-400 underline transition-colors"
                  >
                    {showManualCode ? 'Hide manual 6-digit code input' : 'Have a 6-digit backup code instead?'}
                  </button>

                  {showManualCode && (
                    <form onSubmit={handleManualVerify} className="mt-3 space-y-3 p-3 bg-slate-950/50 rounded-lg border border-slate-800/70">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          6-Digit Verification Code
                        </label>
                        <div className="relative">
                          <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 529103"
                            className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-white font-mono tracking-widest text-center"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        {isLoading ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-white">Email Verified Successfully!</h2>
              <p className="text-xs text-slate-400 mt-2 mb-6">
                Your administrator account is now verified and active. You can proceed to sign in with your credentials.
              </p>

              <button
                type="button"
                onClick={onBackToLogin}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
