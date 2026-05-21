import React, { useState, useEffect } from 'react';
import { useApp, Role } from '../context/AppContext';
import { DashboardCharts } from '../components/DashboardCharts';
import { 
  Link, Copy, Check, Download, Trash2, ShieldCheck, 
  ExternalLink, AlertTriangle, Play
} from 'lucide-react';

interface DashboardPageProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ activeTab, setActiveTab: _setActiveTab }) => {
  const { 
    user, users, links, analytics, withdrawals, fraudLogs, settings,
    systemLogs, permissions, togglePermission, triggerSimulatedClick,
    createShortUrl, deleteShortUrl, requestWithdrawal, approveWithdrawal, rejectWithdrawal,
    banUser, unbanUser, updateSettings, hasUserPermission
  } = useApp();

  const [inputUrl, setInputUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [showInPagePush, setShowInPagePush] = useState(false);

  // Trigger banner slide-in 3 seconds after mounting
  useEffect(() => {
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem('ax_inpage_push_dismissed');
      if (!dismissed) {
        setShowInPagePush(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Withdrawal Form States
  const [wdAmount, setWdAmount] = useState('');
  const [wdMethod, setWdMethod] = useState('UPI');
  const [wdDetails, setWdDetails] = useState('');
  const [wdMessage, setWdMessage] = useState({ type: '', text: '' });

  // Shortener Form States
  const [shortenLoading, setShortenLoading] = useState(false);
  const [shortenError, setShortenError] = useState('');

  // System Log Filtering States
  const [logSearch, setLogSearch] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('ALL');

  if (!user) return null;

  // 1. Process stats metrics based on user role
  const getStats = () => {
    let filteredAnalytics = [...analytics];
    let filteredLinks = [...links];
    let filteredWds = [...withdrawals];

    if (user.role === 'USER') {
      filteredLinks = links.filter(l => l.userId === user.id);
      const linkIds = filteredLinks.map(l => l.id);
      filteredAnalytics = analytics.filter(a => linkIds.includes(a.urlId));
      filteredWds = withdrawals.filter(w => w.userId === user.id);
    } else if (user.role === 'ADMIN') {
      // Admins manage their own links + see earnings of their child users
      const childUserIds = users.filter(u => u.adminId === user.id).map(u => u.id);
      const adminAndChildrenIds = [user.id, ...childUserIds];
      filteredLinks = links.filter(l => adminAndChildrenIds.includes(l.userId));
      const linkIds = filteredLinks.map(l => l.id);
      filteredAnalytics = analytics.filter(a => linkIds.includes(a.urlId));
      filteredWds = withdrawals.filter(w => w.userId === user.id);
    }

    const totalClicks = filteredAnalytics.length;
    const validClicks = filteredAnalytics.filter(a => a.isValid).length;
    const totalEarnings = filteredAnalytics.filter(a => a.isValid).reduce((acc, curr) => acc + curr.earnings, 0);
    const avgCpm = totalClicks > 0 
      ? Number((filteredAnalytics.reduce((acc, curr) => acc + curr.cpm, 0) / totalClicks).toFixed(2))
      : user.customCpm || settings.defaultCpm;

    return {
      totalClicks,
      validClicks,
      totalEarnings,
      avgCpm,
      linksCount: filteredLinks.length,
      withdrawalsCount: filteredWds.length
    };
  };

  const stats = getStats();

  // Create Link Helper
  const handleShortenLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setShortenError('');
    if (!inputUrl.trim()) return;

    setShortenLoading(true);
    try {
      await createShortUrl(inputUrl, customAlias);
      setInputUrl('');
      setCustomAlias('');
    } catch (err: any) {
      setShortenError(err.message || 'Error occurred shortening URL.');
    } finally {
      setShortenLoading(false);
    }
  };

  // Copy Clipboard Link
  const copyLink = (code: string, id: string) => {
    navigator.clipboard.writeText(`http://localhost:5173/s/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Withdraw Request Helper
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setWdMessage({ type: '', text: '' });
    const amt = parseFloat(wdAmount);

    if (isNaN(amt) || amt <= 0) {
      setWdMessage({ type: 'error', text: 'Please enter a valid gross withdrawal amount.' });
      return;
    }

    const res = await requestWithdrawal(amt, wdMethod, wdDetails);
    if (res.success) {
      setWdMessage({ type: 'success', text: res.message });
      setWdAmount('');
      setWdDetails('');
    } else {
      setWdMessage({ type: 'error', text: res.message });
    }
  };

  // Render Stats Grid
  const renderStatsGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
      <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-radial-purple opacity-20"></div>
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-2">Total Impressions</span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white font-sans">{stats.totalClicks}</span>
          <span className="text-xs font-semibold text-accent-cyan">clicks</span>
        </div>
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-radial-cyan opacity-15"></div>
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-2">Publisher Balance</span>
        <div className="flex items-baseline gap-1.5 text-accent-emerald">
          <span className="text-3xl font-black font-sans">
            ₹{user.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] font-bold uppercase">INR</span>
        </div>
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-radial-emerald opacity-15"></div>
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-2">Average Payout CPM</span>
        <div className="flex items-baseline gap-1 text-primary-400">
          <span className="text-3xl font-extrabold font-sans">₹{stats.avgCpm.toFixed(2)}</span>
          <span className="text-[10px] font-bold uppercase">per 1k</span>
        </div>
      </div>

      <div className="glass-panel p-5 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-radial-cyan opacity-20"></div>
        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mb-2">Active Link count</span>
        <div className="flex items-baseline gap-2 text-indigo-400">
          <span className="text-3xl font-extrabold font-sans">{stats.linksCount}</span>
          <span className="text-xs font-semibold">handles</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      {/* -------------------- MY LINKS TAB -------------------- */}
      {activeTab === 'links' && hasUserPermission('create_link') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-2xl text-slate-100 font-sans">Shorten New Handle</h2>
              <p className="text-xs text-slate-400">Create a highly monetized ad link with custom aliases.</p>
            </div>
            <span className="text-[10px] bg-primary-950 border border-primary-500/20 text-primary-400 px-3 py-1 rounded-md font-bold uppercase tracking-wider">
              CPM Shield Active
            </span>
          </div>

          {/* Shortening Form Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-white/5">
            <form onSubmit={handleShortenLink} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Destination URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/long-file-path-to-asset"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-card rounded-xl border border-white/10 text-slate-200 outline-none focus:border-primary-500 transition-colors text-sm font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Custom Alias (Optional)</label>
                  <input
                    type="text"
                    placeholder="premium-dl"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-card rounded-xl border border-white/10 text-slate-200 outline-none focus:border-primary-500 transition-colors text-sm font-semibold"
                  />
                </div>
              </div>

              {shortenError && (
                <p className="text-xs text-accent-rose font-bold">{shortenError}</p>
              )}

              <button
                type="submit"
                disabled={shortenLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold rounded-xl shadow-neon-purple hover:scale-[1.01] active:scale-95 transition-all text-xs flex items-center gap-1.5"
              >
                <Link className="w-4.5 h-4.5" />
                <span>{shortenLoading ? 'Processing...' : 'Create Short Link'}</span>
              </button>
            </form>
          </div>

          {/* Links Listing */}
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-extrabold text-base text-slate-200">Active Link Directory</h3>
              <p className="text-[10px] text-slate-400">Copy shortened codes or inspect QR image tokens</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold select-none">
                <thead>
                  <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="px-6 py-3">Link Title</th>
                    <th className="px-6 py-3">Short URL</th>
                    <th className="px-6 py-3">Destination</th>
                    <th className="px-6 py-3 text-center">QR Card</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(user.role === 'USER' ? links.filter(l => l.userId === user.id) : links).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-medium">
                        No links generated yet. Paste a destination URL above to start earning!
                      </td>
                    </tr>
                  ) : (
                    (user.role === 'USER' ? links.filter(l => l.userId === user.id) : links).map((link) => (
                      <tr key={link.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-slate-200 font-bold block">{link.title || 'Untitled Redirect'}</span>
                          <span className="text-[9px] text-slate-500 font-medium">{new Date(link.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-6 py-4 text-accent-cyan font-bold">
                          <a 
                            href={`/ad/step1?code=${link.shortCode}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1.5"
                          >
                            <span>http://localhost:5173/s/{link.shortCode}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-slate-400 truncate max-w-xs">{link.originalUrl}</td>
                        <td className="px-6 py-4 text-center">
                          {link.qrCodeUrl && (
                            <button
                              onClick={() => setQrModalUrl(link.qrCodeUrl)}
                              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all inline-flex text-primary-400 hover:text-primary-300"
                              title="View QR Code"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center space-x-2">
                          <button
                            onClick={() => copyLink(link.shortCode, link.id)}
                            className="p-1.5 bg-background-card rounded-lg hover:bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all inline-flex"
                            title="Copy link"
                          >
                            {copiedId === link.id ? <Check className="w-4 h-4 text-accent-emerald" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => deleteShortUrl(link.id)}
                            className="p-1.5 bg-accent-rose/5 rounded-lg hover:bg-accent-rose/10 border border-accent-rose/10 text-accent-rose/60 hover:text-accent-rose transition-all inline-flex"
                            title="Delete link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- LINK ANALYTICS TAB -------------------- */}
      {activeTab === 'analytics' && hasUserPermission('create_link') && (
        <div className="space-y-6">
          <div>
            <h2 className="font-extrabold text-2xl text-slate-100 font-sans">Granular Traffic Performance</h2>
            <p className="text-xs text-slate-400">Log geographic regions, devices, and dynamic payout balances.</p>
          </div>

          {/* Render Recharts dashboard charts */}
          <DashboardCharts 
            analyticsData={
              user.role === 'USER' 
                ? analytics.filter(a => links.filter(l => l.userId === user.id).map(l => l.id).includes(a.urlId))
                : analytics
            } 
          />

          {/* Clicks log table */}
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-base text-slate-200">Recent Visits Log</h3>
              <p className="text-[10px] text-slate-400">Detailed overview of last traffic events</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold select-none">
                <thead>
                  <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="px-6 py-3">Visitor IP</th>
                    <th className="px-6 py-3">Country</th>
                    <th className="px-6 py-3">Device / Browser</th>
                    <th className="px-6 py-3">Origin Referrer</th>
                    <th className="px-6 py-3 text-center">Security Status</th>
                    <th className="px-6 py-3 text-center">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(user.role === 'USER' 
                    ? analytics.filter(a => links.filter(l => l.userId === user.id).map(l => l.id).includes(a.urlId))
                    : analytics
                  ).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500 font-medium">
                        No clicks logged yet. Share your links to generate active traffic!
                      </td>
                    </tr>
                  ) : (
                    (user.role === 'USER' 
                      ? analytics.filter(a => links.filter(l => l.userId === user.id).map(l => l.id).includes(a.urlId))
                      : analytics
                    ).map((an) => (
                      <tr key={an.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-slate-300 font-mono">{an.ip}</td>
                        <td className="px-6 py-4 text-slate-200">{an.country}</td>
                        <td className="px-6 py-4">
                          <span className="text-slate-200 block">{an.device}</span>
                          <span className="text-[9px] text-slate-500">{an.browser}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{an.referrer}</td>
                        <td className="px-6 py-4 text-center">
                          {an.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded-md uppercase font-bold tracking-wider">
                              <ShieldCheck className="w-3 h-3" />
                              Valid unique
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 bg-accent-rose/10 border border-accent-rose/25 text-accent-rose rounded-md uppercase font-bold tracking-wider">
                              <AlertTriangle className="w-3 h-3" />
                              Duplicate IP / Skip
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-extrabold text-accent-emerald">
                          ₹{an.earnings.toFixed(4)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- WITHDRAW EARNINGS TAB -------------------- */}
      {activeTab === 'withdraw' && hasUserPermission('withdraw_funds') && (
        <div className="space-y-6">
          <div>
            <h2 className="font-extrabold text-2xl text-slate-100 font-sans">Withdraw Publisher Balance</h2>
            <p className="text-xs text-slate-400">Request payouts from your wallet. Standard 10% commission deductions apply for Admin requests.</p>
          </div>

          {/* Stats Summary */}
          {renderStatsGrid()}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Withdrawal form card */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 h-fit lg:col-span-1">
              <h3 className="font-bold text-base text-slate-200 mb-4">Request Payout</h3>
              
              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Gross Amount (INR)</label>
                  <input
                    type="number"
                    min="100"
                    placeholder="10000"
                    value={wdAmount}
                    onChange={(e) => setWdAmount(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-card rounded-xl border border-white/10 text-slate-200 outline-none focus:border-primary-500 transition-colors text-sm font-semibold"
                    required
                  />
                  {user.role === 'ADMIN' && wdAmount && (
                    <span className="text-[9px] text-accent-rose font-bold block mt-1">
                      ⚠️ Platform fee of 10% (₹{(parseFloat(wdAmount) * 0.1).toFixed(2)}) will be deducted. Net = ₹{(parseFloat(wdAmount) * 0.9).toFixed(2)}.
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Payment Method</label>
                  <select
                    value={wdMethod}
                    onChange={(e) => setWdMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background-card rounded-xl border border-white/10 text-slate-200 outline-none focus:border-primary-500 transition-colors text-sm font-semibold"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                    <option value="PayPal">PayPal Invoice</option>
                    <option value="Crypto">Crypto USDT (TRC-20)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Payment credentials</label>
                  <textarea
                    placeholder="Enter UPI ID or Bank Details (A/C No, IFSC, Name)"
                    value={wdDetails}
                    onChange={(e) => setWdDetails(e.target.value)}
                    className="w-full h-24 px-4 py-2.5 bg-background-card rounded-xl border border-white/10 text-slate-200 outline-none focus:border-primary-500 transition-colors text-xs font-semibold resize-none"
                    required
                  />
                </div>

                {wdMessage.text && (
                  <p className={`text-xs font-bold ${wdMessage.type === 'success' ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {wdMessage.text}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white font-bold rounded-xl shadow-neon-purple hover:scale-[1.01] active:scale-95 transition-all text-xs"
                >
                  Submit Payout Request
                </button>
              </form>
            </div>

            {/* Payout history card */}
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden lg:col-span-2">
              <div className="px-6 py-4 border-b border-white/5">
                <h3 className="font-bold text-base text-slate-200">Withdrawal Ledgers</h3>
                <p className="text-[10px] text-slate-400">Statement of gross withdrawals, platform fees, and net payouts</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold select-none">
                  <thead>
                    <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                      <th className="px-6 py-3">Gross Amount</th>
                      <th className="px-6 py-3">Commission (10%)</th>
                      <th className="px-6 py-3">Net payout</th>
                      <th className="px-6 py-3">Credentials</th>
                      <th className="px-6 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {withdrawals.filter(w => w.userId === user.id).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                          No withdrawals logged. Minimum payout threshold is ₹100.
                        </td>
                      </tr>
                    ) : (
                      withdrawals.filter(w => w.userId === user.id).map((w) => (
                        <tr key={w.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4 text-slate-200 font-bold">₹{w.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-accent-rose">₹{w.commissionFee.toLocaleString()}</td>
                          <td className="px-6 py-4 text-accent-emerald font-extrabold">₹{w.netAmount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 border border-white/5 text-slate-300 rounded font-semibold">{w.paymentMethod}</span>
                            <span className="text-[10px] text-slate-500 font-medium truncate block max-w-[150px] mt-1">{w.paymentDetails}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                              w.status === 'APPROVED' 
                                ? 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald' 
                                : w.status === 'REJECTED'
                                ? 'bg-accent-rose/10 border border-accent-rose/25 text-accent-rose'
                                : 'bg-white/5 border border-white/5 text-slate-400'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ADMIN: MANAGE USERS TAB -------------------- */}
      {activeTab === 'users-manage' && hasUserPermission('manage_publishers') && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-2xl text-slate-100 font-sans">User Directory Control</h2>
              <p className="text-xs text-slate-400">View and audit publisher accounts assigned to your administrative level.</p>
            </div>
            <span className="text-xs bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan px-3 py-1 rounded font-bold uppercase tracking-wider">
              {users.filter(u => u.adminId === user.id).length} Managed Publishers
            </span>
          </div>

          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-base text-slate-200">Registered Accounts</h3>
              <p className="text-[10px] text-slate-400">Ban fraudulent publishers or check wallet balances</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold select-none">
                <thead>
                  <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="px-6 py-3">Publisher Name</th>
                    <th className="px-6 py-3">Email Address</th>
                    <th className="px-6 py-3">Total Earned</th>
                    <th className="px-6 py-3">Wallet Balance</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.filter(u => u.adminId === user.id || u.role === 'USER').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                        No registered publishers managed under your admin ID.
                      </td>
                    </tr>
                  ) : (
                    users.filter(u => u.adminId === user.id || u.role === 'USER').map((usr) => (
                      <tr key={usr.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-200">{usr.name}</td>
                        <td className="px-6 py-4 text-slate-400">{usr.email}</td>
                        <td className="px-6 py-4 text-slate-300">₹{usr.totalEarned.toLocaleString()}</td>
                        <td className="px-6 py-4 text-accent-emerald font-extrabold">₹{usr.balance.toLocaleString()}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                            usr.status === 'ACTIVE' 
                              ? 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald' 
                              : 'bg-accent-rose/10 border border-accent-rose/25 text-accent-rose'
                          }`}>
                            {usr.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {usr.status === 'ACTIVE' ? (
                            <button
                              onClick={() => banUser(usr.id)}
                              className="px-2.5 py-1 bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose border border-accent-rose/20 rounded font-bold text-[10px] transition-all"
                            >
                              Ban Publisher
                            </button>
                          ) : (
                            <button
                              onClick={() => unbanUser(usr.id)}
                              className="px-2.5 py-1 bg-accent-emerald/10 hover:bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/20 rounded font-bold text-[10px] transition-all"
                            >
                              Unban Profile
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- ADMIN: ALL USER LINKS TAB -------------------- */}
      {activeTab === 'admin-links' && hasUserPermission('manage_publishers') && (
        <div className="space-y-6">
          <div>
            <h2 className="font-extrabold text-2xl text-slate-100 font-sans">Administrative Link Manager</h2>
            <p className="text-xs text-slate-400">Monitor shortened URL channels generated by registered publishers.</p>
          </div>

          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-base text-slate-200">Global URL Registry</h3>
              <p className="text-[10px] text-slate-400">View redirect pathways and publisher IDs</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold select-none">
                <thead>
                  <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="px-6 py-3">Publisher ID</th>
                    <th className="px-6 py-3">Short URL</th>
                    <th className="px-6 py-3">Destination URL</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {links.map((link) => {
                    const owner = users.find(u => u.id === link.userId);
                    return (
                      <tr key={link.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-slate-300 font-bold">{owner ? owner.name : 'Unknown User'}</td>
                        <td className="px-6 py-4 text-accent-cyan font-bold">
                          <a 
                            href={`/ad/step1?code=${link.shortCode}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1.5"
                          >
                            <span>/{link.shortCode}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </a>
                        </td>
                        <td className="px-6 py-4 text-slate-400 truncate max-w-xs">{link.originalUrl}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded-md uppercase font-bold tracking-wider">
                            Active Redirect
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => deleteShortUrl(link.id)}
                            className="p-1 px-2.5 bg-accent-rose/5 rounded hover:bg-accent-rose/10 border border-accent-rose/10 text-accent-rose/80 transition-all font-bold text-[10px]"
                          >
                            Revoke Link
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SUPER: GLOBAL ANALYTICS TAB -------------------- */}
      {activeTab === 'super-analytics' && hasUserPermission('approve_payouts') && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-2xl text-slate-100 font-sans">Global Platform Analytics</h2>
              <p className="text-xs text-slate-400">Total global analytics and revenue statements across Axiino Links.</p>
            </div>
            <span className="text-xs bg-accent-rose/10 border border-accent-rose/25 text-accent-rose px-3 py-1 rounded font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-rose"></span>
              Live Admin Shield Connected
            </span>
          </div>

          {/* Stats Summary */}
          {renderStatsGrid()}

          {/* Render Recharts charts */}
          <DashboardCharts analyticsData={analytics} />
        </div>
      )}

      {/* -------------------- SUPER: WITHDRAWALS APPROVAL TAB -------------------- */}
      {activeTab === 'super-withdrawals' && hasUserPermission('approve_payouts') && (
        <div className="space-y-6">
          <div>
            <h2 className="font-extrabold text-2xl text-slate-100 font-sans">Withdrawal Approvals Queue</h2>
            <p className="text-xs text-slate-400">Approve or reject platform publisher withdrawal requests. Automated 10% commission deduction audit.</p>
          </div>

          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-base text-slate-200">Pending Approvals Ledger</h3>
              <p className="text-[10px] text-slate-400">Statements awaiting processing</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold select-none">
                <thead>
                  <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="px-6 py-3">Publisher Details</th>
                    <th className="px-6 py-3">Gross requested</th>
                    <th className="px-6 py-3">Commission (10%)</th>
                    <th className="px-6 py-3">Net Payable</th>
                    <th className="px-6 py-3">Transfer Credentials</th>
                    <th className="px-6 py-3 text-center">Execution Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {withdrawals.filter(w => w.status === 'PENDING').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                        No pending withdrawal requests in the ledger queues! Beautiful.
                      </td>
                    </tr>
                  ) : (
                    withdrawals.filter(w => w.status === 'PENDING').map((w) => {
                      const claimant = users.find(u => u.id === w.userId);
                      return (
                        <tr key={w.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-slate-200 font-bold block">{claimant ? claimant.name : 'Unknown User'}</span>
                            <span className="text-[10px] text-slate-500 tracking-wide font-medium">{claimant ? claimant.role : 'USER'}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-300 font-bold">₹{w.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-accent-rose">₹{w.commissionFee.toLocaleString()}</td>
                          <td className="px-6 py-4 text-accent-emerald font-black">₹{w.netAmount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] bg-white/5 px-2 py-0.5 border border-white/5 text-slate-300 rounded font-semibold">{w.paymentMethod}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-1 truncate max-w-[150px]">{w.paymentDetails}</span>
                          </td>
                          <td className="px-6 py-4 text-center space-x-2">
                            <button
                              onClick={() => approveWithdrawal(w.id)}
                              className="px-2.5 py-1 bg-accent-emerald/10 hover:bg-accent-emerald/20 text-accent-emerald border border-accent-emerald/20 rounded font-bold text-[10px] transition-all"
                            >
                              Approve Pay
                            </button>
                            <button
                              onClick={() => rejectWithdrawal(w.id)}
                              className="px-2.5 py-1 bg-accent-rose/10 hover:bg-accent-rose/25 text-accent-rose border border-accent-rose/20 rounded font-bold text-[10px] transition-all"
                            >
                              Reject & Refund
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SUPER: AD & PLATFORM SETTINGS TAB -------------------- */}
      {activeTab === 'super-settings' && hasUserPermission('global_settings') && (
        <div className="space-y-6">
          <div>
            <h2 className="font-extrabold text-2xl text-slate-100 font-sans">Platform Configurations Console</h2>
            <p className="text-xs text-slate-400">Configure global advertiser payout CPM thresholds, VPN guards, and request rate-limits.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
            {/* CPM Rates */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="font-bold text-base text-slate-200">Advertising CPM Indexes</h3>
              
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Global Default CPM (INR / 1k unique impressions)</label>
                <input
                  type="number"
                  value={settings.defaultCpm}
                  onChange={(e) => updateSettings({ defaultCpm: parseFloat(e.target.value) || 5.0 })}
                  className="w-full px-4 py-2.5 bg-background-card rounded-xl border border-white/10 text-slate-200 outline-none focus:border-primary-500 transition-colors text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Global API rate limit (Requests / Hour)</label>
                <input
                  type="number"
                  value={settings.rateLimitPerHour}
                  onChange={(e) => updateSettings({ rateLimitPerHour: parseInt(e.target.value) || 100 })}
                  className="w-full px-4 py-2.5 bg-background-card rounded-xl border border-white/10 text-slate-200 outline-none focus:border-primary-500 transition-colors text-sm font-semibold"
                />
              </div>
            </div>

            {/* Security Toggles */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 space-y-5">
              <h3 className="font-bold text-base text-slate-200">Axiino Security Shield parameters</h3>
              
              <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                <div>
                  <span className="text-sm font-bold text-slate-200 block">VPN & Datacenter proxy shield</span>
                  <span className="text-[10px] text-slate-500 leading-normal font-medium">Instantly filters server hostnames and VPN nodes.</span>
                </div>
                <input 
                  type="checkbox"
                  checked={settings.vpnShieldActive}
                  onChange={(e) => updateSettings({ vpnShieldActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-white/10 rounded focus:ring-primary-500 focus:ring-opacity-0 bg-background-card"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white/2 rounded-xl border border-white/5">
                <div>
                  <span className="text-sm font-bold text-slate-200 block">Headless Browser Bot Shield</span>
                  <span className="text-[10px] text-slate-500 leading-normal font-medium">Intercepts scraper executions and emulators.</span>
                </div>
                <input 
                  type="checkbox"
                  checked={settings.botCheckActive}
                  onChange={(e) => updateSettings({ botCheckActive: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-white/10 rounded focus:ring-primary-500 focus:ring-opacity-0 bg-background-card"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SUPER: FRAUD & VPN MONITOR TAB -------------------- */}
      {activeTab === 'super-fraud' && hasUserPermission('fraud_shield') && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-2xl text-slate-100 font-sans">Anti-Fraud Shield Logs</h2>
              <p className="text-xs text-slate-400">Real-time log of VPN intercepts, proxy shields, scraper scripts, and click velocity alerts.</p>
            </div>
            <span className="text-[10px] bg-accent-rose/10 border border-accent-rose/25 text-accent-rose px-3 py-1 rounded font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-rose"></span>
              Live Shield Active
            </span>
          </div>

          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-base text-slate-200">Intercept Logs</h3>
              <p className="text-[10px] text-slate-400">Security event statements processed by backend filters</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold select-none">
                <thead>
                  <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Offender IP</th>
                    <th className="px-6 py-3">Breach Trigger</th>
                    <th className="px-6 py-3">Device Agent Signature</th>
                    <th className="px-6 py-3">Incident specifics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {fraudLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                        No security breaches captured yet. Axiino links are perfectly clean!
                      </td>
                    </tr>
                  ) : (
                    fraudLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</td>
                        <td className="px-6 py-4 text-slate-300 font-mono">{log.ip}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex text-[9px] px-2 py-0.5 bg-accent-rose/10 border border-accent-rose/25 text-accent-rose rounded font-bold uppercase tracking-wider">
                            {log.reason.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate">{log.userAgent}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium text-[10px] max-w-[250px] leading-relaxed">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SUPER: USER ACCESS CONTROL (UAM) TAB -------------------- */}
      {activeTab === 'super-uam' && hasUserPermission('uam_control') && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-extrabold text-2xl text-slate-100 font-sans">User Access Management (UAM)</h2>
              <p className="text-xs text-slate-400">Configure core module rules and granular action permissions for role classes.</p>
            </div>
            <span className="text-[10px] bg-accent-cyan/10 border border-accent-cyan/25 text-accent-cyan px-3 py-1 rounded font-bold uppercase tracking-wider">
              UAM Engine Online
            </span>
          </div>

          {/* Alert Callout */}
          <div className="p-4 bg-primary-950/40 border border-primary-500/20 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-primary-300">Super Admin Security Shield</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                Modifying permission flags directly adjusts system behavior. Toggling off permissions will restrict actions in real-time. Role keys for SUPER_ADMIN cannot be revoked to safeguard administrative login pathways.
              </p>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-base text-slate-200">Role Permissions Mapping Matrix</h3>
              <p className="text-[10px] text-slate-400">Configure toggles for individual system action modules</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold select-none">
                <thead>
                  <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                    <th className="px-6 py-3.5">Action Module / Description</th>
                    <th className="px-6 py-3.5 text-center">USER</th>
                    <th className="px-6 py-3.5 text-center">ADMIN</th>
                    <th className="px-6 py-3.5 text-center">SUPER ADMIN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { key: 'create_link', label: 'Create Shortened URL', description: 'Allows users to shrink links and initiate monetization flows.' },
                    { key: 'withdraw_funds', label: 'Request Balance Withdrawals', description: 'Allows requesting payouts from publisher wallets.' },
                    { key: 'manage_publishers', label: 'Administrative Publisher Ban', description: 'Allows banning or reactivating developer/publisher accounts.' },
                    { key: 'approve_payouts', label: 'Authorize Withdrawal Transactions', description: 'Allows approving or rejecting pending cashout payouts.' },
                    { key: 'global_settings', label: 'Global Platform Settings', description: 'Allows modifying CPM rates, rate limits, and proxy rules.' },
                    { key: 'fraud_shield', label: 'Anti-Fraud Shield Console', description: 'Allows reviewing VPN monitoring intercepts and emulator blocks.' },
                    { key: 'uam_control', label: 'User Access Control Grid', description: 'Allows managing permission matrices across roles.' },
                  ].map((perm) => (
                    <tr key={perm.key} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-slate-200 font-bold block text-sm">{perm.label}</span>
                        <span className="text-[10px] text-slate-500 font-medium leading-relaxed mt-0.5 block">{perm.description}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-1 block">permission_id: {perm.key}</span>
                      </td>
                      {(['USER', 'ADMIN', 'SUPER_ADMIN'] as Role[]).map((role) => {
                        const isGranted = permissions[role]?.includes(perm.key);
                        return (
                          <td key={role} className="px-6 py-4 text-center">
                            <label className="inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={isGranted}
                                disabled={role === 'SUPER_ADMIN'}
                                onChange={() => togglePermission(role, perm.key)}
                                className="sr-only peer"
                              />
                              <div className={`w-8 h-4 rounded-full transition-all duration-300 relative ${
                                role === 'SUPER_ADMIN' 
                                  ? 'bg-primary-500/50 cursor-not-allowed'
                                  : isGranted 
                                  ? 'bg-primary-600 shadow-neon-purple' 
                                  : 'bg-white/10 hover:bg-white/20'
                              } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all ${
                                isGranted ? 'after:translate-x-4' : ''
                              }`}></div>
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SUPER: SYSTEM ACTIVITY LOGS TAB -------------------- */}
      {activeTab === 'super-logs' && hasUserPermission('uam_control') && (() => {
        // Collect all distinct actions for filter options
        const distinctActions = ['ALL', ...Array.from(new Set(systemLogs.map(l => l.action)))];
        
        // Filter logs
        const filteredLogs = systemLogs.filter(log => {
          const matchesSearch = 
            log.operator.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
            log.action.toLowerCase().includes(logSearch.toLowerCase());
            
          const matchesAction = logFilterAction === 'ALL' || log.action === logFilterAction;
          
          return matchesSearch && matchesAction;
        });

        const getBadgeStyle = (action: string) => {
          switch (action) {
            case 'SYSTEM_SEED': return 'bg-indigo-950 border-indigo-500/30 text-indigo-400';
            case 'UAM_UPDATE': return 'bg-cyan-950 border-cyan-500/30 text-accent-cyan';
            case 'UAM_PERMISSION_MODIFIED': return 'bg-pink-950 border-pink-500/30 text-pink-400';
            case 'USER_LOGIN': return 'bg-blue-950 border-blue-500/30 text-blue-400';
            case 'USER_REGISTER': return 'bg-emerald-950 border-emerald-500/30 text-accent-emerald';
            case 'URL_CREATE': return 'bg-purple-950 border-purple-500/30 text-purple-400';
            case 'URL_DELETE': return 'bg-red-950 border-red-500/30 text-accent-rose';
            case 'WITHDRAW_REQUEST': return 'bg-amber-950 border-amber-500/30 text-amber-400';
            case 'WITHDRAW_APPROVE': return 'bg-emerald-950 border-emerald-500/30 text-emerald-400';
            case 'WITHDRAW_REJECT': return 'bg-red-950 border-red-500/30 text-accent-rose';
            case 'CLICK_CREDITED': return 'bg-teal-950 border-teal-500/30 text-teal-400';
            case 'FRAUD_BREACH_DETECTED': return 'bg-red-950 border-red-500/30 text-accent-rose animate-pulse';
            default: return 'bg-white/5 border-white/10 text-slate-300';
          }
        };

        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-extrabold text-2xl text-slate-100 font-sans">System Activity Audit Logs</h2>
                <p className="text-xs text-slate-400">Chronological history of operator actions, user registrations, and payout transactions.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    triggerSimulatedClick();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-accent-cyan to-indigo-600 hover:from-accent-cyan hover:to-indigo-500 text-white font-bold rounded-xl shadow-neon-cyan transition-all text-xs flex items-center gap-1.5 active:scale-95 hover:scale-[1.01]"
                >
                  <Play className="w-3.5 h-3.5 text-white" />
                  <span>Simulate Visitor Traffic</span>
                </button>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-72">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Search Keywords</label>
                <input 
                  type="text" 
                  placeholder="Filter by operator name or details..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-background-card rounded-lg border border-white/10 text-slate-200 outline-none focus:border-primary-500 text-xs font-semibold"
                />
              </div>

              <div className="w-full md:w-56">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Filter Action Type</label>
                <select
                  value={logFilterAction}
                  onChange={(e) => setLogFilterAction(e.target.value)}
                  className="w-full px-3 py-2 bg-background-card rounded-lg border border-white/10 text-slate-200 outline-none focus:border-primary-500 text-xs font-semibold"
                >
                  {distinctActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              <div className="text-right text-[10px] text-slate-400 font-bold shrink-0 self-end md:self-center">
                Showing {filteredLogs.length} of {systemLogs.length} audit entries
              </div>
            </div>

            {/* Logs Table */}
            <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold select-none">
                  <thead>
                    <tr className="bg-background-lighter/40 border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-400 font-bold">
                      <th className="px-6 py-3.5">Timestamp</th>
                      <th className="px-6 py-3.5">Operator Name</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Action Executed</th>
                      <th className="px-6 py-3.5">Details & Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500 font-medium">
                          No audit logs matches the active filters. Click the simulator above to log actions!
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4 text-slate-500 font-mono text-[10px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-6 py-4 text-slate-200 font-bold">{log.operator}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                              log.role === 'SUPER_ADMIN' ? 'text-accent-rose bg-accent-rose/10' :
                              log.role === 'ADMIN' ? 'text-accent-cyan bg-accent-cyan/10' : 'text-slate-400 bg-white/5'
                            }`}>
                              {log.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex text-[9px] px-2 py-0.5 border rounded font-extrabold uppercase tracking-wide ${getBadgeStyle(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 font-medium text-[10px] leading-relaxed max-w-sm">
                            {log.details}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* -------------------- QR IMAGE MODAL DRAWSER -------------------- */}
      {qrModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-white/10 text-center space-y-6 shadow-glass-glow animate-fadeIn">
            <h3 className="font-extrabold text-lg text-slate-200">Share QR Code Handle</h3>
            <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
              <img src={qrModalUrl} alt="QR Link Code" className="w-48 h-48 mx-auto" />
            </div>
            <p className="text-xs text-slate-400 leading-normal max-w-xs mx-auto">
              Scan this QR image with smartphones to immediately access the monetized redirect steps.
            </p>
            <div className="flex gap-3">
              <a
                href={qrModalUrl}
                download="axiino-link-qr.png"
                className="flex-1 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 text-xs font-bold rounded-xl text-white shadow-neon-purple transition-all text-center"
              >
                Download PNG
              </a>
              <button
                onClick={() => setQrModalUrl(null)}
                className="flex-1 py-2.5 bg-background-lighter hover:bg-background-card border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Monetag In-Page Push Ad Banner */}
      {showInPagePush && (
        <div className="fixed bottom-6 right-6 z-50 w-80 p-4 border border-white/10 bg-background-card/85 backdrop-blur-md rounded-2xl shadow-glass-glow animate-fadeIn flex flex-col gap-2.5">
          <div className="flex justify-between items-start">
            <span className="text-[9px] bg-primary-950 border border-primary-500/20 text-primary-400 px-2 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-primary-400 animate-ping"></span>
              Sponsored Update
            </span>
            <button
              onClick={() => {
                setShowInPagePush(false);
                sessionStorage.setItem('ax_inpage_push_dismissed', 'true');
              }}
              className="text-slate-500 hover:text-slate-300 text-xs font-bold transition-all p-0.5 hover:bg-white/5 rounded-md"
            >
              [X]
            </button>
          </div>
          <div className="text-left">
            <h4 className="text-xs font-extrabold text-white">💡 High CPM Network Alert</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-normal">
              High CPM Traffic Notice: US, UK, and Germany mobile traffic redirect payouts are currently up 25%! Share your RCB squad links now to capture maximum revenue.
            </p>
          </div>
          <a
            href="https://monetag.com"
            target="_blank"
            rel="noreferrer"
            className="w-full py-1.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 text-center text-[9px] font-black rounded-lg text-white transition-all uppercase tracking-wider"
          >
            Optimize Revenue Console
          </a>
        </div>
      )}

    </div>
  );
};
