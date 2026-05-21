import React from 'react';
import { Award, Globe, ShieldCheck, Zap, Info } from 'lucide-react';

export const PricingPage: React.FC = () => {
  
  // Realistically structured CPM pricing table
  const cpmData = [
    { rank: 1, country: 'United States', flag: '🇺🇸', code: 'US', desktop: '₹1,000.00', mobile: '₹840.00', quality: 'Tier 1' },
    { rank: 2, country: 'United Kingdom', flag: '🇬🇧', code: 'UK', desktop: '₹880.00', mobile: '₹750.00', quality: 'Tier 1' },
    { rank: 3, country: 'Germany', flag: '🇩🇪', code: 'DE', desktop: '₹850.00', mobile: '₹720.00', quality: 'Tier 1' },
    { rank: 4, country: 'Canada', flag: '🇨🇦', code: 'CA', desktop: '₹800.00', mobile: '₹680.00', quality: 'Tier 1' },
    { rank: 5, country: 'Singapore', flag: '🇸🇬', code: 'SG', desktop: '₹750.00', mobile: '₹600.00', quality: 'Tier 1' },
    { rank: 6, country: 'Australia', flag: '🇦🇺', code: 'AU', desktop: '₹720.00', mobile: '₹580.00', quality: 'Tier 1' },
    { rank: 7, country: 'India', flag: '🇮🇳', code: 'IN', desktop: '₹400.00', mobile: '₹320.00', quality: 'Tier 2' },
    { rank: 8, country: 'Rest of the World', flag: '🌐', code: 'ROW', desktop: '₹250.00', mobile: '₹200.00', quality: 'Tier 3' },
  ];

  return (
    <div className="relative min-h-screen max-w-6xl mx-auto px-6 py-16">
      {/* Ambient BG gradients */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-radial-purple opacity-10 pointer-events-none"></div>
      
      {/* Header section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-950/40 border border-primary-800/30 text-primary-300 rounded-full text-xs font-semibold mb-6">
          <Globe className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Global Monetization Coverage</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
          Publisher <span className="text-gradient">CPM Payout Tiers</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base font-medium">
          Earnings are calculated dynamically per 1,000 unique visitor completions inside our 3-step ad journey. Real-time logging backed by the Axiino Fraud Shield.
        </p>
      </div>

      {/* Tiers highlight list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 select-none">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="w-10 h-10 bg-primary-950 border border-primary-800/30 rounded-xl flex items-center justify-center text-primary-400 mb-4">
            <Zap className="w-5 h-5 text-accent-cyan" />
          </div>
          <h3 className="font-bold text-slate-200 mb-1.5 text-base">Tier 1 Premium Audience</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Traffic from USA, UK, and DE generates the highest monetization value. Advertisers bid aggressively, securing CPM rates up to ₹1,000.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="w-10 h-10 bg-accent-emerald/10 border border-accent-emerald/20 rounded-xl flex items-center justify-center text-accent-emerald mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 mb-1.5 text-base">Unique Payout Multiplier</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            We only cap payout rules on unique IPs per 24 hours. Multiple redirects by unique users continue recording standard ad impressions.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="w-10 h-10 bg-accent-rose/10 border border-accent-rose/20 rounded-xl flex items-center justify-center text-accent-rose mb-4">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-200 mb-1.5 text-base">Dynamic CPM Overrides</h3>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            Super Admins have the ability to override individual publisher configurations with customized CPM tiers to reward top traffic partners.
          </p>
        </div>
      </div>

      {/* Main Pricing Table Container */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-glass-glow">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between bg-white/2-glass">
          <div>
            <h3 className="font-extrabold text-base text-slate-200">Current Payout Rates</h3>
            <p className="text-[10px] text-slate-400 font-medium">Rates updated live matching real advertiser programmatic bids</p>
          </div>
          <span className="text-[10px] bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald px-2.5 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse"></span>
            Programmatic Active
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm select-none">
            <thead>
              <tr className="bg-background-lighter/40 border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                <th className="px-6 py-4">Rank</th>
                <th className="px-6 py-4">Country</th>
                <th className="px-6 py-4">Traffic Tier</th>
                <th className="px-6 py-4 text-center">Desktop CPM</th>
                <th className="px-6 py-4 text-center">Mobile/Tablet CPM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {cpmData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-white/2 transition-colors duration-150"
                >
                  <td className="px-6 py-4 font-bold text-slate-400">#{row.rank}</td>
                  <td className="px-6 py-4 flex items-center gap-3">
                    <span className="text-xl" role="img" aria-label={row.country}>{row.flag}</span>
                    <div>
                      <span className="text-slate-200 font-bold block">{row.country}</span>
                      <span className="text-[10px] text-slate-500">{row.code}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold tracking-wider ${
                      row.quality === 'Tier 1' 
                        ? 'bg-primary-950/60 border border-primary-500/20 text-primary-400' 
                        : row.quality === 'Tier 2'
                        ? 'bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan'
                        : 'bg-white/5 border border-white/5 text-slate-400'
                    }`}>
                      {row.quality}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-extrabold text-accent-emerald">{row.desktop}</td>
                  <td className="px-6 py-4 text-center font-extrabold text-slate-300">{row.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer Footer */}
      <div className="flex items-start gap-3 mt-6 p-4 bg-background-card/50 border border-white/5 rounded-xl text-slate-400 text-xs">
        <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Please Note:</strong> CPM rates are average indices based on dynamic real-time impressions from Monetag advertising networks. Traffic bypassing the ad countdown flows, routing through proxy layers, or failing screen compatibility checks will trigger standard zero-credit safety skips.
        </p>
      </div>

    </div>
  );
};
