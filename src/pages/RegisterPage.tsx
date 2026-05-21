import React, { useState } from 'react';
import { useApp, Role } from '../context/AppContext';
import { Link2, Mail, User, ShieldCheck, KeyRound, Eye, EyeOff, ShieldAlert } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, addSystemLog } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const role: Role = 'ADMIN'; // All registrations automatically become Admin
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Please fill in all standard details.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all password details.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const success = await register(name, email, role);
    if (success) {
      addSystemLog('CONSOLE_USER_REGISTERED', `Created new ${role} profile: ${name} (${email})`);
      onNavigate('dashboard');
    } else {
      setError('An account with this email already exists!');
    }
  };

  return (
    <div className="py-12 md:py-20 px-4 flex items-center justify-center relative overflow-hidden w-full max-w-full">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-radial-purple opacity-20 pointer-events-none select-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-radial-cyan opacity-15 pointer-events-none select-none"></div>

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden shadow-glass-glow animate-fadeIn">
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-tr from-primary-600 to-accent-cyan p-3 rounded-xl shadow-neon-purple mb-4">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-extrabold text-2xl text-slate-100 font-sans tracking-tight">Create Console Account</h2>
          <p className="text-xs text-slate-400 mt-1">Register an admin credential tier on the Axiino console</p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-accent-rose/10 border border-accent-rose/20 text-accent-rose rounded-xl text-xs font-semibold text-left flex items-start gap-2.5 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Vikram Singh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background-card/80 rounded-xl border border-white/10 text-slate-200 outline-none hover:border-white/20 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 text-sm font-semibold shadow-inner"
                required
              />
            </div>
          </div>

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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Choose Password</label>
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

          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-background-card/80 rounded-xl border border-white/10 text-slate-200 outline-none hover:border-white/20 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-300 text-sm font-semibold shadow-inner"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 py-1 text-slate-400 text-[10px] text-left select-none leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-accent-emerald shrink-0 mt-0.5" />
            <p>
              Console registrations are reserved for administrative operators only. All log audit actions are monitored in real time.
            </p>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold rounded-xl shadow-neon-purple hover:scale-[1.01] active:scale-95 transition-all text-sm"
          >
            Create Console Account
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-slate-400 font-semibold select-none">
          Already registered?{' '}
          <button 
            onClick={() => onNavigate('login')} 
            className="text-accent-cyan hover:underline ml-1 transition-all outline-none font-bold"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

