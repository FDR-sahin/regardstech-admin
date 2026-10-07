import React, { useState, useEffect } from 'react';
import {
  Mail,
  KeyRound,
  CheckCircle2,
  Clock,
  Copy,
  RefreshCw,
  Check,
  ArrowRight,
  Settings,
  Send,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { EmailOutboxItem } from '../../types/index.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';

interface EmailSimulatorPageProps {
  onNavigateToVerify?: (token: string, email: string) => void;
}

export const EmailSimulatorPage: React.FC<EmailSimulatorPageProps> = ({ onNavigateToVerify }) => {
  const { showToast } = useToast();
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'smtp' | 'outbox'>('smtp');

  // Outbox stream state
  const [emails, setEmails] = useState<EmailOutboxItem[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // SMTP Settings state
  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('sahinfdr89@gmail.com');
  const [smtpForm, setSmtpForm] = useState({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: '',
    pass: '',
    fromName: 'Regards Tech Client Team',
    fromEmail: 'contact@regardstech.com',
    isConfigured: false,
    passConfigured: false,
    updatedAt: undefined as string | undefined
  });

  const fetchEmails = async () => {
    setIsLoadingEmails(true);
    try {
      const res = await api.getEmails();
      if (res.success) {
        setEmails(res.emails);
      }
    } catch {
      showToast('Could not load email queue', 'error');
    } finally {
      setIsLoadingEmails(false);
    }
  };

  const fetchSmtpSettings = async () => {
    if (!isSuperAdmin) return;
    setIsLoadingSmtp(true);
    try {
      const res = await api.getSmtpSettings();
      if (res.success && res.smtpSettings) {
        setSmtpForm(prev => ({
          ...prev,
          host: res.smtpSettings.host || 'smtp.gmail.com',
          port: res.smtpSettings.port || 465,
          secure: res.smtpSettings.secure ?? true,
          user: res.smtpSettings.user || '',
          pass: '', // Blank for security unless typing new
          fromName: res.smtpSettings.fromName || 'Regards Tech Client Team',
          fromEmail: res.smtpSettings.fromEmail || 'contact@regardstech.com',
          isConfigured: res.smtpSettings.isConfigured,
          passConfigured: res.smtpSettings.passConfigured,
          updatedAt: res.smtpSettings.updatedAt
        }));
        if (res.smtpSettings.user) {
          setTestEmailTarget(res.smtpSettings.user);
        }
      }
    } catch {
      // Non-fatal if regular admin
    } finally {
      setIsLoadingSmtp(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchSmtpSettings();
  }, [isSuperAdmin]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    showToast(`Copied code: ${code}`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpForm.host || !smtpForm.user) {
      showToast('SMTP Host and User/Email are required.', 'error');
      return;
    }
    if (!smtpForm.pass && !smtpForm.passConfigured) {
      showToast('Please provide your SMTP password or App Password.', 'error');
      return;
    }

    setIsSavingSmtp(true);
    try {
      const res = await api.saveSmtpSettings({
        host: smtpForm.host,
        port: Number(smtpForm.port),
        secure: smtpForm.secure,
        user: smtpForm.user,
        pass: smtpForm.pass || undefined,
        fromName: smtpForm.fromName,
        fromEmail: smtpForm.fromEmail
      });
      showToast(res.message, 'success');
      setSmtpForm(prev => ({
        ...prev,
        isConfigured: true,
        passConfigured: true,
        pass: ''
      }));
    } catch (err: any) {
      showToast(err.message || 'Failed to save SMTP settings.', 'error');
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTarget) {
      showToast('Please enter a destination email address.', 'error');
      return;
    }

    setIsTestingSmtp(true);
    try {
      const res = await api.sendTestSmtpEmail(testEmailTarget);
      if (res.success) {
        showToast(res.message, 'success');
      } else {
        showToast(`Test failed: ${res.message}`, 'error');
      }
      fetchEmails();
    } catch (err: any) {
      showToast(err.message || 'Error executing SMTP test.', 'error');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const applyPreset = (preset: 'gmail' | 'hostinger' | 'outlook' | 'sendgrid') => {
    if (preset === 'gmail') {
      setSmtpForm(prev => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        fromEmail: prev.user || 'contact@regardstech.com'
      }));
      showToast('Applied Gmail SMTP settings (Port 465 SSL). Use a Google App Password.', 'info');
    } else if (preset === 'hostinger') {
      setSmtpForm(prev => ({
        ...prev,
        host: 'smtp.hostinger.com',
        port: 465,
        secure: true,
        fromEmail: prev.user || 'contact@regardstech.com'
      }));
      showToast('Applied Hostinger Webmail SMTP settings (Port 465 SSL).', 'info');
    } else if (preset === 'outlook') {
      setSmtpForm(prev => ({
        ...prev,
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        fromEmail: prev.user || 'contact@regardstech.com'
      }));
      showToast('Applied Outlook / Office 365 SMTP settings (Port 587 TLS).', 'info');
    } else if (preset === 'sendgrid') {
      setSmtpForm(prev => ({
        ...prev,
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        user: 'apikey',
        fromEmail: 'contact@regardstech.com'
      }));
      showToast('Applied SendGrid SMTP settings. Enter your SendGrid API key as password.', 'info');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <span>Email & SMTP Dispatch Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure live outgoing SMTP delivery for OTP codes, password resets, and client contact replies
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'smtp'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>SMTP Server Setup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('outbox');
              fetchEmails();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'outbox'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Outbox & OTP Logs ({emails.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SMTP Server Settings & Live Mailer Test */}
      {activeTab === 'smtp' && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              smtpForm.isConfigured
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {smtpForm.isConfigured ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              <div>
                <strong className="block text-white font-semibold text-sm">
                  {smtpForm.isConfigured ? 'Live SMTP Delivery Configured' : 'SMTP Not Configured (Outbox Only Mode)'}
                </strong>
                <span className="text-[11px] opacity-90">
                  {smtpForm.isConfigured
                    ? `Emails are delivered directly via ${smtpForm.host}:${smtpForm.port} (${smtpForm.user}).`
                    : 'Emails & OTPs are logged only to the local Outbox Simulator. Configure your SMTP server below to deliver real emails to actual inboxes.'}
                </span>
              </div>
            </div>

            {smtpForm.updatedAt && (
              <span className="text-[10px] text-slate-400 font-mono self-end sm:self-auto">
                Updated: {new Date(smtpForm.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SMTP Settings Form */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Outgoing SMTP Server Credentials</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your mail server connection details. Supports Gmail, Hostinger, cPanel, SendGrid, etc.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium block">Quick Setup Presets:</span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('gmail')}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>🔴 Gmail (smtp.gmail.com)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('hostinger')}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>🟣 Hostinger Webmail</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('outlook')}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>🔵 Outlook / Office 365</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('sendgrid')}
                    className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-indigo-600 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <span>⚡ SendGrid API</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveSmtp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      SMTP Host *
                    </label>
                    <input
                      type="text"
                      value={smtpForm.host}
                      onChange={e => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Port *
                    </label>
                    <input
                      type="number"
                      value={smtpForm.port}
                      onChange={e => {
                        const portNum = parseInt(e.target.value, 10) || 587;
                        setSmtpForm({
                          ...smtpForm,
                          port: portNum,
                          secure: portNum === 465
                        });
                      }}
                      placeholder="465 or 587"
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={smtpForm.secure}
                      onChange={e => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                      className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-indigo-600"
                    />
                    <span>Use SSL/TLS Secure connection (Required for Port 465; unchecked for Port 587 STARTTLS)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      SMTP Username / Email *
                    </label>
                    <input
                      type="text"
                      value={smtpForm.user}
                      onChange={e => setSmtpForm({ ...smtpForm, user: e.target.value })}
                      placeholder="e.g. contact@regardstech.com or yourname@gmail.com"
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      SMTP Password / App Password *
                    </label>
                    <input
                      type="password"
                      value={smtpForm.pass}
                      onChange={e => setSmtpForm({ ...smtpForm, pass: e.target.value })}
                      placeholder={smtpForm.passConfigured ? '•••••••••••• (Leave blank to keep existing)' : 'Enter 16-character App Password'}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Sender Name (From Name)
                    </label>
                    <input
                      type="text"
                      value={smtpForm.fromName}
                      onChange={e => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                      placeholder="Regards Tech Client Team"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Sender Email (From Address)
                    </label>
                    <input
                      type="email"
                      value={smtpForm.fromEmail}
                      onChange={e => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                      placeholder="contact@regardstech.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingSmtp}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    {isSavingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Save SMTP Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Test Mailer & Instructions Card */}
            <div className="space-y-6">
              {/* Test Email Dispatcher */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <Send className="w-4 h-4 text-indigo-400" />
                  <h4>Live Test Email Dispatcher</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Send a test message to your real email inbox to confirm that your SMTP connection works and delivery succeeds.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Email Address</label>
                    <input
                      type="email"
                      value={testEmailTarget}
                      onChange={e => setTestEmailTarget(e.target.value)}
                      placeholder="e.g. sahinfdr89@gmail.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={isTestingSmtp}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    {isTestingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Send Test Email Now</span>
                  </button>
                </div>
              </div>

              {/* Gmail Guide Card */}
              <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-200 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-indigo-300">
                  <HelpCircle className="w-4 h-4" />
                  <span>How to use Gmail (Google App Password)</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
                  <li>Go to your Google Account (<a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-indigo-400 underline inline-flex items-center gap-0.5">Security <ExternalLink className="w-2.5 h-2.5" /></a>).</li>
                  <li>Ensure <strong>2-Step Verification</strong> is turned ON.</li>
                  <li>Search for <strong>&quot;App passwords&quot;</strong> in Google Settings.</li>
                  <li>Create a new password named &quot;Regards Tech Admin&quot;.</li>
                  <li>Copy the 16-character code into the SMTP Password field above.</li>
                  <li>Use Host: <code className="text-white bg-slate-950 px-1 py-0.5 rounded">smtp.gmail.com</code>, Port: <code className="text-white bg-slate-950 px-1 py-0.5 rounded">465</code>, SSL: <code className="text-white bg-slate-950 px-1 py-0.5 rounded">Checked</code>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Dispatched Outbox & OTP Stream */}
      {activeTab === 'outbox' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Every dispatched OTP code, verification token, and contact reply is recorded here for instant testing and auditing.
            </p>
            <button
              onClick={fetchEmails}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-medium text-slate-300 hover:text-white"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {isLoadingEmails ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading outbox records…</div>
          ) : emails.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-6 h-6" />}
              title="Outbox is currently empty"
              description="Initiate a Forgot Password request, send a test email, or reply to a contact message to trigger records."
            />
          ) : (
            <div className="space-y-4">
              {emails.map(email => (
                <div
                  key={email.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      {email.type === 'otp' ? (
                        <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                          <KeyRound className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                          <Mail className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <h4 className="font-semibold text-white text-xs">{email.subject}</h4>
                        <div className="text-[11px] text-slate-400">
                          To: <span className="font-mono text-slate-300">{email.to}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          email.status === 'sent'
                            ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-400'
                            : email.status === 'failed'
                            ? 'bg-rose-950/40 border border-rose-500/40 text-rose-400'
                            : 'bg-amber-950/40 border border-amber-500/40 text-amber-400'
                        }`}
                      >
                        {email.status === 'sent' ? 'Delivered via SMTP' : email.status === 'failed' ? 'SMTP Failed' : 'Outbox Simulator'}
                      </span>

                      <div className="text-[11px] font-mono text-slate-400">
                        {new Date(email.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Code highlight badge if OTP or Token */}
                  {email.tokenOrCode && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-indigo-500/30">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          {email.type === 'otp' ? '6-Digit OTP Code' : 'Verification Token'}
                        </span>
                        <span className="font-mono text-base font-bold text-indigo-400 tracking-wider">
                          {email.tokenOrCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyCode(email.tokenOrCode!, email.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                        >
                          {copiedId === email.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === email.id ? 'Copied' : 'Copy Code'}</span>
                        </button>

                        {email.type === 'verification' && onNavigateToVerify && (
                          <button
                            onClick={() => onNavigateToVerify(email.tokenOrCode!, email.to)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
                          >
                            <span>Verify Now</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Body message */}
                  <div className="text-xs text-slate-400 whitespace-pre-wrap bg-slate-950/40 p-3 rounded-lg border border-slate-800/40 font-mono text-[11px]">
                    {email.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
