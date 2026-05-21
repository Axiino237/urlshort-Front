import React, { useState } from 'react';
import { useApp, Role } from '../context/AppContext';
import { Link2, Mail, KeyRound, Eye, EyeOff, CheckCircle2, ArrowLeft, ShieldAlert } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

type LoginView = 'LOGIN' | 'FORGOT_PASSWORD' | 'RESET_SUCCESS';

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, addSystemLog, users } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password States
  const [view, setView] = useState<LoginView>('LOGIN');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // Determine role by looking up existing user profile
    const match = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!match) {
      setError('No operator profile discovered with this email. Please register a Tier account first.');
      return;
    }

    // Role check: USER role is blocked from dashboard access
    if (match.role === 'USER') {
      setError('Access Denied: Standard publisher profiles do not have administrative console privileges.');
      addSystemLog('UNAUTHORIZED_ACCESS_BLOCKED', `Blocked login attempt for USER role on console: ${email}`);
      return;
    }

    // Check if account is suspended
    if (match.status === 'BANNED') {
      setError('Access Denied: This administrator profile is permanently suspended due to security policy violations.');
      return;
    }
    
    const success = await login(email, match.role);
    if (success) {
      // Simulate checking password (any password passes as long as it's entered)
      addSystemLog('CONSOLE_USER_LOGIN', `Authorized ${match.role} console login for ${email}.`);
      onNavigate('dashboard');
    } else {
      setError('Failed to authenticate. Profile may be suspended or incorrect.');
    }
  };

  // Preset triggers for instant admin evaluation
  const handleQuickLogin = async (presetEmail: string, presetRole: Role) => {
    setError('');
    setEmail(presetEmail);
    setPassword('secretpassword123');
    
    const success = await login(presetEmail, presetRole);
    if (success) {
      addSystemLog('CONSOLE_QUICK_LOGIN', `Quick preset authorized for ${presetRole} console: ${presetEmail}`);
      onNavigate('dashboard');
    } else {
      setError('Preset profile not found and could not be auto-seeded.');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recoveryEmail.trim() || !recoveryEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setRecoveryLoading(true);

    // Simulate sending network recovery token with premium delay
    setTimeout(() => {
      setRecoveryLoading(false);
      // Append a trace directly into the Super Admin audit logs
      addSystemLog(
        'PASSWORD_RESET_TRIGGERED', 
        `Simulated secure recovery email sent to ${recoveryEmail}. Token valid for 60 minutes.`
      );
      setView('RESET_SUCCESS');
    }, 1200);
  };

  if (view === 'FORGOT_PASSWORD') {
    return (
      <div className="py-12 md:py-20 px-4 flex items-center justify-center relative">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-radial-purple opacity-20 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-radial-cyan opacity-15 pointer-events-none animate-pulse"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-glass-glow animate-fadeIn">
          <button 
            onClick={() => { setView('LOGIN'); setError(''); }}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex bg-gradient-to-tr from-primary-600 to-accent-cyan p-3 rounded-xl shadow-neon-purple mb-4">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <h2 className="font-extrabold text-2xl text-slate-100 font-sans tracking-tight">Reset Password</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Enter your admin email. We'll simulate dispatching a cryptographically secure token to recover your console access.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose rounded-xl text-xs font-semibold text-left flex items-start gap-2.5 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="admin@axiino.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-background-card/80 rounded-xl border border-white/10 text-slate-200 outline-none hover:border-white/20 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 text-sm font-semibold"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 disabled:from-primary-800 disabled:to-primary-900 disabled:text-slate-500 text-white font-bold rounded-xl shadow-neon-purple hover:scale-[1.01] active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              {recoveryLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Generating Token...
                </>
              ) : 'Send Recovery Link'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'RESET_SUCCESS') {
    return (
      <div className="py-12 md:py-20 px-4 flex items-center justify-center relative">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-radial-purple opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-radial-cyan opacity-15 pointer-events-none"></div>

        <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-accent-emerald/20 relative overflow-hidden shadow-neon-emerald animate-fadeIn">
          <div className="text-center py-4">
            <div className="inline-flex bg-accent-emerald/10 border border-accent-emerald/20 p-3 rounded-full mb-4 shadow-glass-glow">
              <CheckCircle2 className="w-8 h-8 text-accent-emerald animate-bounce" />
            </div>
            <h2 className="font-extrabold text-2xl text-slate-100 font-sans tracking-tight">Email Dispatched!</h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              We simulated a secure password recovery payload transfer. A recovery token has been sent to:
            </p>
            <div className="my-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 inline-block text-xs font-mono text-accent-cyan">
              {recoveryEmail}
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto mt-2">
              Note: An audit event (`PASSWORD_RESET_TRIGGERED`) has been registered in the Super Admin's activity logs panel.
            </p>

            <button
              onClick={() => { setView('LOGIN'); setEmail(recoveryEmail); setRecoveryEmail(''); setError(''); }}
              className="w-full mt-6 py-2.5 bg-gradient-to-r from-accent-emerald to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl shadow-glass-glow hover:scale-[1.01] active:scale-95 transition-all text-xs"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-20 px-4 flex items-center justify-center relative overflow-hidden w-full max-w-full">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-radial-purple opacity-20 pointer-events-none select-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-radial-cyan opacity-15 pointer-events-none select-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-glass-glow animate-fadeIn">
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-tr from-primary-600 to-accent-cyan p-3 rounded-xl shadow-neon-purple mb-4">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-extrabold text-2xl text-slate-100 font-sans tracking-tight">Axiino Console Sign In</h2>
          <p className="text-xs text-slate-400 mt-1">Access your platform management and admin workspace</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose rounded-xl text-xs font-semibold text-left flex items-start gap-2.5 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="you@axiino.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background-card/80 rounded-xl border border-white/10 text-slate-200 outline-none hover:border-white/20 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 text-sm font-semibold shadow-inner"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Console Password</label>
              <button 
                type="button" 
                onClick={() => { setView('FORGOT_PASSWORD'); setError(''); }}
                className="text-[10px] font-bold text-accent-cyan hover:underline transition-all outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-background-card/80 rounded-xl border border-white/10 text-slate-200 outline-none hover:border-white/20 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 text-sm font-semibold shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold rounded-xl shadow-neon-purple hover:scale-[1.01] active:scale-95 transition-all duration-200 text-sm"
          >
            Sign In to Console
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-slate-400 font-semibold select-none">
          Need admin privileges?{' '}
          <button 
            onClick={() => onNavigate('register')} 
            className="text-accent-cyan hover:underline ml-1 transition-all outline-none font-bold"
          >
            Register Tier account
          </button>
        </p>

        {/* Sleek divider for developer preset helpers */}
        <div className="relative my-6 select-none">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-white/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background-card/90 px-3 text-[9px] font-bold text-slate-500 tracking-widest rounded-full border border-white/5 py-0.5">
              Developer presets
            </span>
          </div>
        </div>

        {/* Dynamic low-profile quick login helper drawer */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickLogin('superadmin@axiino.com', 'SUPER_ADMIN')}
            className="bg-accent-rose/5 hover:bg-accent-rose/10 text-accent-rose/90 hover:text-accent-rose text-[10px] font-bold py-2 px-3 rounded-xl border border-accent-rose/10 hover:border-accent-rose/35 text-center transition-all duration-300 shadow-sm shadow-accent-rose/5 hover:scale-[1.01]"
          >
            Super Admin Preset
          </button>
          <button
            onClick={() => handleQuickLogin('admin_vikram@axiino.com', 'ADMIN')}
            className="bg-accent-cyan/5 hover:bg-accent-cyan/10 text-accent-cyan/90 hover:text-accent-cyan text-[10px] font-bold py-2 px-3 rounded-xl border border-accent-cyan/10 hover:border-accent-cyan/35 text-center transition-all duration-300 shadow-sm shadow-accent-cyan/5 hover:scale-[1.01]"
          >
            Admin Preset
          </button>
        </div>
      </div>
    </div>
  );
};

