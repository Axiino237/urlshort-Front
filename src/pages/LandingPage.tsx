import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Zap, Shield, DollarSign, BarChart2, Link2, Copy, Check, ArrowRight,
  PlayCircle
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { createShortUrl, user } = useApp();
  const [inputUrl, setInputUrl] = useState('');
  const [shortenedUrl, setShortenedUrl] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShortenedUrl(null);
    if (!inputUrl.trim()) return;

    if (!user) {
      setError('Please sign in or register to shorten and monetize URLs!');
      return;
    }

    setLoading(true);
    try {
      const res = await createShortUrl(inputUrl);
      setShortenedUrl(res);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shortenedUrl) {
      navigator.clipboard.writeText(`http://localhost:5173/s/${shortenedUrl.shortCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Ambient background glows */}
      <div className="absolute top-40 left-10 w-96 h-96 bg-radial-purple opacity-20 pointer-events-none"></div>
      <div className="absolute top-1/2 right-10 w-96 h-96 bg-radial-cyan opacity-15 pointer-events-none"></div>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-950/40 border border-primary-800/30 text-primary-300 rounded-full text-xs font-semibold mb-6 animate-pulse">
          <Zap className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Earn up to ₹1,000 CPM on high-tier ad redirects</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.15]">
          Shorten Links & Maximize <span className="text-gradient font-black">Monetization</span> Profits
        </h1>
        
        <p className="text-base sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Axiino Links is the ultimate dark-obsidian platform for publishers. Secure ad steps, robust VPN shields, and detailed real-time statistics.
        </p>

        {/* Shortener Container (Interactive Guest Try-out) */}
        <div className="max-w-3xl mx-auto mb-16">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-glass-glow">
            <form onSubmit={handleShorten} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  placeholder="Paste your long destination URL here..."
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-background-card/90 rounded-xl border border-white/10 text-slate-200 outline-none focus:border-primary-500 transition-colors placeholder:text-slate-500 text-sm font-semibold"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold rounded-xl shadow-neon-purple hover:scale-[1.01] transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Shorten & Earn'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {error && (
              <p className="text-left mt-3 text-xs font-semibold text-accent-rose pl-2">
                {error}
              </p>
            )}

            {/* Post Shorten Success Result */}
            {shortenedUrl && (
              <div className="mt-6 p-4 bg-background-lighter/60 rounded-xl border border-primary-500/20 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
                <div className="space-y-1 overflow-hidden">
                  <span className="text-[10px] text-primary-400 font-extrabold uppercase tracking-wider block">Shortened Link Ready:</span>
                  <a 
                    href={`/ad/step1?code=${shortenedUrl.shortCode}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-bold text-sm text-accent-cyan hover:underline truncate block"
                  >
                    http://localhost:5173/s/{shortenedUrl.shortCode}
                  </a>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-background-card rounded-lg hover:bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-4.5 h-4.5 text-accent-emerald" /> : <Copy className="w-4.5 h-4.5" />}
                  </button>
                  <a
                    href={`/ad/step1?code=${shortenedUrl.shortCode}`} 
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-gradient-to-r from-accent-cyan to-indigo-600 hover:from-accent-cyan/90 text-xs font-bold rounded-lg text-white shadow-neon-cyan flex items-center gap-1.5"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Test Ad Journey</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Platform stats counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16 select-none">
          <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
            <span className="text-3xl font-extrabold text-white font-sans block mb-1">5.8M+</span>
            <span className="text-xs font-semibold text-slate-400">Total clicks processed</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
            <span className="text-3xl font-extrabold text-accent-cyan font-sans block mb-1">₹8.4M+</span>
            <span className="text-xs font-semibold text-slate-400">Payouts distributed</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
            <span className="text-3xl font-extrabold text-accent-emerald font-sans block mb-1">₹1,000</span>
            <span className="text-xs font-semibold text-slate-400">Peak payout CPM rate</span>
          </div>
          <div className="glass-panel p-4 rounded-xl border border-white/5 text-center">
            <span className="text-3xl font-extrabold text-primary-400 font-sans block mb-1">99.9%</span>
            <span className="text-xs font-semibold text-slate-400">VPN intercept accuracy</span>
          </div>
        </div>
      </section>

      {/* Feature Selling Points */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-center font-extrabold text-3xl sm:text-4xl mb-12">
          Engineered for <span className="text-gradient">Professional Publishers</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-primary-500/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-radial-purple opacity-30 pointer-events-none"></div>
            <div className="w-12 h-12 bg-primary-950 border border-primary-800/30 rounded-xl flex items-center justify-center text-primary-400 mb-6">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-xl mb-3 text-slate-200">High Revenue Monetag Ad Flow</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              3 secure ad countdown steps maximize impression values without sacrificing visitor retention. Clean high-end layout styles.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-accent-cyan/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-radial-cyan opacity-25 pointer-events-none"></div>
            <div className="w-12 h-12 bg-accent-cyan/10 border border-accent-cyan/20 rounded-xl flex items-center justify-center text-accent-cyan mb-6">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-xl mb-3 text-slate-200">Axiino Security Shield</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Stops bots, emulators, duplicate clicks, and proxy configurations to protect your advertising reputation and assure valid earnings.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-accent-emerald/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-radial-emerald opacity-25 pointer-events-none"></div>
            <div className="w-12 h-12 bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl flex items-center justify-center text-accent-emerald mb-6">
              <BarChart2 className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-xl mb-3 text-slate-200">Granular Real-Time Stats</h3>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Log devices, browser versions, and regional referrers instantly. Keep track of earnings fluctuations with responsive charts.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="glass-panel p-8 rounded-3xl border border-white/5 relative overflow-hidden bg-gradient-to-r from-primary-950/20 via-indigo-950/10 to-background-card text-center">
          <div className="absolute top-0 left-0 w-full h-full bg-radial-purple opacity-20 pointer-events-none"></div>
          <h2 className="text-3xl font-extrabold text-white mb-4">Start Monetizing Your Link Traffic Today</h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto mb-8 font-medium">
            Register your dashboard, shorten target assets with customizable handles, and request payouts with an automated 10% commission fee structure.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold rounded-xl shadow-neon-purple hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="w-full sm:w-auto px-6 py-3 bg-background-lighter hover:bg-background-card text-slate-300 font-bold border border-white/10 rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              Check CPM Rates
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
