import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, RefreshCw, MonitorPlay, CheckCircle2,
  ExternalLink, Eye, PlaySquare, AlertCircle, ArrowRight,
  Globe, X, Flame, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdRedirectPageProps {
  onNavigate: (page: string) => void;
}

type CPMProfile = 'US_AGGRESSIVE' | 'INDIA_BALANCED' | 'EUROPE_CLEAN';

export const AdRedirectPage: React.FC<AdRedirectPageProps> = ({ onNavigate }) => {
  const { links, recordAdView, settings, addFraudLog } = useApp();
  
  // URL routing queries
  const [shortCode, setShortCode] = useState('');
  const [step, setStep] = useState(1);
  const [timer, setTimer] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [checking, setChecking] = useState(true);
  const [urlData, setUrlData] = useState<any>(null);
  const [ipAddress, setIpAddress] = useState('103.45.201.22');
  const [fraudBlocked, setFraudBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  // Monetag Simulation States
  const [cpmProfile, setCpmProfile] = useState<CPMProfile>('INDIA_BALANCED');
  const [showVignette, setShowVignette] = useState(false);
  const [popunderOpen, setPopunderOpen] = useState(false);
  const [showDirectLinkOverlay, setShowDirectLinkOverlay] = useState(false);

  // Dynamically load Monetag script only inside this page structure when checks complete
  useEffect(() => {
    let script: HTMLScriptElement | null = null;
    if (!checking) {
      script = document.createElement('script');
      script.src = "https://quge5.com/88/tag.min.js";
      script.setAttribute('data-zone', '241593');
      script.setAttribute('data-cfasync', 'false');
      script.async = true;
      
      script.onload = () => console.log("Monetag ad script loaded successfully.");
      script.onerror = (err) => console.error("Monetag ad script failed to load:", err);
      
      document.head.appendChild(script);
    }

    return () => {
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [checking]);


  // Extract query code
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code') || '';
    
    // Support either direct "/s/code" simulation or "/ad/step1?code=x"
    let targetCode = code;
    if (!targetCode) {
      const pathSegments = window.location.pathname.split('/');
      const codeIndex = pathSegments.indexOf('s');
      if (codeIndex !== -1 && pathSegments[codeIndex + 1]) {
        targetCode = pathSegments[codeIndex + 1];
      }
    }

    setShortCode(targetCode);
  }, []);

  // Fetch URL metadata and execute Anti-Fraud analysis
  useEffect(() => {
    if (!shortCode) return;

    // Simulate mock IP fetch and safety scanner
    const runAntiFraudScanner = async () => {
      setChecking(true);
      
      const match = links.find(l => l.shortCode === shortCode || l.customAlias === shortCode);
      if (!match) {
        setChecking(false);
        return;
      }
      setUrlData(match);

      // VPN & Bot inspection (mocking settings thresholds)
      const randomIp = `152.195.12.${Math.floor(Math.random() * 254) + 1}`;
      setIpAddress(randomIp);

      const isBot = navigator.userAgent.includes('HeadlessChrome') || navigator.userAgent.includes('Puppeteer');
      const mockVpnIp = Math.random() < 0.05 && settings.vpnShieldActive; // 5% chance of mock VPN trigger

      if (isBot && settings.botCheckActive) {
        setFraudBlocked(true);
        setBlockReason('Headless browser / web-crawler execution detected.');
        addFraudLog({
          userId: match.userId,
          ip: randomIp,
          reason: 'BOT_TRAFFIC',
          userAgent: navigator.userAgent,
          details: 'Scraper attempt rejected.'
        });
      } else if (mockVpnIp) {
        setFraudBlocked(true);
        setBlockReason('Proxy connection or hosting VPN IP address detected.');
        addFraudLog({
          userId: match.userId,
          ip: randomIp,
          reason: 'VPN_DETECTION',
          userAgent: navigator.userAgent,
          details: `Flagged virtual node resolving in datacenters.`
        });
      }

      setChecking(false);
      triggerStepInit(1);
    };

    runAntiFraudScanner();
  }, [shortCode, links]);

  // Handle step initiation (vignettes rules)
  const triggerStepInit = (targetStep: number) => {
    setTimer(30);
    setTimerActive(false);

    // Apply Vignette rules based on CPM profile
    if (cpmProfile === 'US_AGGRESSIVE') {
      // Aggressive setup triggers vignettes on every step
      setShowVignette(true);
    } else if (cpmProfile === 'INDIA_BALANCED') {
      // Balanced triggers vignettes on Step 1 and Step 3
      if (targetStep === 1 || targetStep === 3) {
        setShowVignette(true);
      } else {
        setTimerActive(true);
      }
    } else {
      // Clean triggers vignettes only on Step 1
      if (targetStep === 1) {
        setShowVignette(true);
      } else {
        setTimerActive(true);
      }
    }
  };

  // Handle countdown ticker
  useEffect(() => {
    if (!timerActive || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timer]);

  // Handle step updates
  const handleNextStep = async () => {
    if (timer > 0) return;

    if (step < 3) {
      const next = step + 1;
      setStep(next);
      triggerStepInit(next);
    } else {
      // Step 3 finished! Trigger Direct Link overlay representation before final route
      setShowDirectLinkOverlay(true);
      
      const success = await recordAdView(shortCode, 3, ipAddress, {
        country: cpmProfile === 'US_AGGRESSIVE' ? 'United States' : cpmProfile === 'EUROPE_CLEAN' ? 'Germany' : 'India',
        device: 'Desktop',
        browser: 'Chrome',
        referrer: 'Direct'
      });

      setTimeout(() => {
        setShowDirectLinkOverlay(false);
        if (success && urlData) {
          // Trigger success confetti wow effect
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });

          setTimeout(() => {
            window.location.href = urlData.originalUrl;
          }, 1500);
        }
      }, 2500); // intermediate direct link delay
    }
  };

  // Simulated Onclick Popunder Trigger
  const handlePageClick = () => {
    // Aggressive triggers popunder on all clicks, Balanced triggers only on Page 1 (Step 1)
    if (cpmProfile === 'US_AGGRESSIVE') {
      if (!popunderOpen) {
        setPopunderOpen(true);
      }
    } else if (cpmProfile === 'INDIA_BALANCED' && step === 1) {
      if (!popunderOpen) {
        setPopunderOpen(true);
      }
    }
  };

  // Close Vignette & activate timer
  const dismissVignette = () => {
    setShowVignette(false);
    setTimerActive(true);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#08080c]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-primary-500 animate-spin mx-auto" />
          <h3 className="font-extrabold text-slate-200">Axiino Security Guard Scanning...</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">Evaluating visitor device agent headers, canvas indicators, and proxy credentials.</p>
        </div>
      </div>
    );
  }

  // VPN or bot blocked warning page
  if (fraudBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#08080c]">
        <div className="max-w-md w-full glass-panel border-accent-rose/30 p-8 rounded-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-accent-rose/10 border border-accent-rose/20 rounded-full flex items-center justify-center text-accent-rose mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-black text-2xl text-slate-200">Access Restrained</h2>
            <p className="text-xs text-slate-400 font-medium">
              Our automated anti-fraud engine blocked this connection.
            </p>
          </div>
          <div className="bg-background-card border border-white/5 rounded-xl p-4 text-xs font-semibold text-accent-rose text-left">
            <strong>Reason:</strong> {blockReason}
          </div>
          <p className="text-[10px] text-slate-500">
            VPN servers, duplicate automated click scripts, and custom head-less scrapers are strictly prohibited. Turn off proxy shields to continue.
          </p>
          <button 
            onClick={() => onNavigate('landing')}
            className="w-full py-2.5 bg-background-lighter hover:bg-background-card border border-white/10 rounded-xl text-xs font-bold text-slate-300 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // 404 Invalid Short Code
  if (!urlData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#08080c]">
        <div className="max-w-md w-full glass-panel p-8 rounded-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-white/5 border border-white/5 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-black text-2xl text-slate-200">Link Not Discovered</h2>
            <p className="text-xs text-slate-400 font-medium">
              The short code code you entered is invalid or has been deactivated.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('landing')}
            className="w-full py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 text-xs font-bold rounded-xl text-white shadow-neon-purple transition-all"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-16 bg-[#07070a] relative text-slate-100 flex flex-col items-center select-none"
      onClick={handlePageClick}
    >
      {/* -------------------- DYNAMIC STICKY HEADER -------------------- */}
      <div className="w-full glass-panel border-b border-white/5 py-4 px-6 flex items-center justify-between sticky top-0 z-40">
        <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
          <Flame className="w-4.5 h-4.5 text-accent-rose animate-bounce" />
          AXIINO<span className="text-accent-cyan font-light">LINKS</span>
        </span>
        <div className="flex items-center gap-4">
          {/* Pro Tip CPM Profiler Selector */}
          <div className="relative flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl">
            <Globe className="w-3.5 h-3.5 text-primary-400" />
            <select
              value={cpmProfile}
              onChange={(e) => {
                const val = e.target.value as CPMProfile;
                setCpmProfile(val);
                triggerStepInit(step);
              }}
              className="bg-transparent text-[10px] font-bold text-slate-200 outline-none cursor-pointer border-none"
            >
              <option value="US_AGGRESSIVE" className="bg-[#0f0f18] text-accent-rose">USA Profile (Aggressive Ads)</option>
              <option value="INDIA_BALANCED" className="bg-[#0f0f18] text-accent-cyan">India Profile (Balanced Ads)</option>
              <option value="EUROPE_CLEAN" className="bg-[#0f0f18] text-accent-emerald">Europe Profile (Clean Ads)</option>
            </select>
          </div>
          <div className="h-4 w-px bg-white/10 hidden md:block"></div>
          <div className="text-xs font-semibold text-slate-300 hidden md:block">
            Target: <span className="font-extrabold text-primary-400">{urlData.title || 'Asset'}</span>
          </div>
        </div>
      </div>

      {/* -------------------- TOP MULTITAG BANNER -------------------- */}
      <div className="w-full max-w-4xl px-6 pt-6">
        <div className="glass-panel p-4 rounded-xl border border-white/5 text-center relative overflow-hidden select-none bg-gradient-to-r from-primary-950/20 via-[#101018] to-accent-cyan/5">
          <div className="absolute top-0 left-0 w-2 h-full bg-accent-cyan"></div>
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            <span>Monetag Multitag Placement #1084</span>
            <span className="text-accent-cyan flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3" /> Auto-Optimized Ad Channel
            </span>
          </div>
          <div className="py-2 flex items-center justify-center gap-6">
            <div className="text-left">
              <div className="text-xs font-black text-slate-200">🚀 Exclusive Offer: Axiino Cloud Pro VPN</div>
              <div className="text-[10px] text-slate-400">Unlock ultra-high bandwidth nodes worldwide. Zero logs preserved.</div>
            </div>
            <button className="hidden sm:block px-3 py-1 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all">
              Launch Agent
            </button>
          </div>
        </div>
      </div>

      {/* -------------------- MAIN PAGE CONTAINER -------------------- */}
      <main className="max-w-4xl w-full px-6 pt-6 flex-1 space-y-6">
        
        {/* Progress & Countdown Circle Widget */}
        <div className="glass-panel p-6 rounded-2xl border border-white/5 shadow-glass-glow flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial-purple opacity-20 pointer-events-none"></div>
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold bg-primary-950 border border-primary-500/25 px-2.5 py-1 rounded-md text-primary-400 uppercase tracking-widest">
                Verification Progress
              </span>
              <span className="text-xs font-bold text-slate-400">Step {step} of 3</span>
            </div>
            <h2 className="font-extrabold text-lg text-slate-200">
              {step === 1 ? 'Verify Full-Page Interstitial Ads' : 
               step === 2 ? 'Engage Banners & Native Placements' : 
               'Watch Reward Segment Video'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg font-medium">
              {timerActive ? 'Please wait. Keep the tab focused to finalize the monetization checks.' : 'Dismiss the sponsored vignette banner overlay to activate countdown.'}
            </p>
          </div>

          {/* Dynamic timer circle */}
          <div className="flex items-center gap-4 shrink-0 justify-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute w-full h-full -rotate-90">
                <circle 
                  cx="40" 
                  cy="40" 
                  r="35" 
                  stroke="rgba(255,255,255,0.03)" 
                  strokeWidth="5" 
                  fill="transparent" 
                  className="transition-all"
                />
                <circle 
                  cx="40" 
                  cy="40" 
                  r="35" 
                  stroke={timerActive ? "#8b5cf6" : "#4b5563"} 
                  strokeWidth="5" 
                  fill="transparent" 
                  className="timer-path transition-all"
                  strokeDashoffset={283 - (283 * (30 - timer)) / 30}
                />
              </svg>
              <span className="text-lg font-black text-slate-200">
                {showVignette ? <X className="w-5 h-5 text-slate-400 animate-pulse" /> : timer > 0 ? timer : 'Done'}
              </span>
            </div>
          </div>
        </div>

        {/* STEP-SPECIFIC NATIVE SPONSOR WIDGETS */}
        {step === 1 && (
          <div className="space-y-6 text-left">
            {/* Step 1: Full-page details representation */}
            <div className="glass-panel p-8 rounded-2xl border border-primary-500/25 relative overflow-hidden bg-gradient-to-tr from-primary-950/20 to-indigo-950/10 min-h-[220px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-48 h-48 bg-radial-purple opacity-40 pointer-events-none"></div>
              <div className="flex items-center justify-between text-xs select-none">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                  Monetag Placement #0492
                </span>
                <span className="text-accent-cyan font-bold animate-pulse">● High Revenue Impending</span>
              </div>
              <div className="my-6 max-w-xl space-y-3">
                <span className="w-10 h-10 bg-primary-900/40 border border-primary-800/40 rounded-lg flex items-center justify-center text-primary-400 mb-2">
                  <Eye className="w-5 h-5 text-accent-cyan" />
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-200">Unlock Link Redirection Routing</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  We generate our publisher monetization payouts via programmatic ad impressions. Interact with premium sponsor services or verify the dynamic countdown to unlock your link routing rules.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* Native Banner Columns */}
            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-80 relative overflow-hidden">
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-4">Native Sponsor Widget</div>
              <div className="space-y-3">
                <div className="h-28 bg-white/5 rounded-xl border border-white/5 shimmer"></div>
                <h4 className="font-bold text-sm text-slate-200">Premium Crypto Ledger Wallet</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Secure digital asset channels with multi-signature hardware modules.</p>
              </div>
              <span className="text-[9px] text-accent-cyan font-extrabold mt-4">Programmatic Banner Placed</span>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-80 relative overflow-hidden">
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-4">Native Sponsor Widget</div>
              <div className="space-y-3">
                <div className="h-28 bg-white/5 rounded-xl border border-white/5 shimmer"></div>
                <h4 className="font-bold text-sm text-slate-200">Cloud Web VPS Scalability</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Ultra high-speed bandwidth channels tailored for scale.</p>
              </div>
              <span className="text-[9px] text-accent-cyan font-extrabold mt-4">Programmatic Banner Placed</span>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between h-80 relative overflow-hidden">
              <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-4">Native Sponsor Widget</div>
              <div className="space-y-3">
                <div className="h-28 bg-white/5 rounded-xl border border-white/5 shimmer"></div>
                <h4 className="font-bold text-sm text-slate-200">AI Design Tools</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Generate premium product mockups instantly using LLMs.</p>
              </div>
              <span className="text-[9px] text-accent-cyan font-extrabold mt-4">Programmatic Banner Placed</span>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="glass-panel p-8 rounded-2xl border border-white/5 relative overflow-hidden bg-gradient-to-br from-indigo-950/20 to-[#0e0e15] min-h-[300px] flex flex-col justify-between text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-radial-emerald opacity-20 pointer-events-none"></div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
                Video Reward Placement
              </span>
              <span className="text-accent-emerald font-bold animate-pulse">● Final Segment Ready</span>
            </div>
            <div className="my-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald rounded-full flex items-center justify-center shrink-0 shadow-neon-cyan">
                <MonitorPlay className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-xl text-slate-200">Dynamic Video Reward Module</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Watch the sponsor video segment or wait out the active timer. Upon completion, clicking "Unlock Link" will trigger high-revenue Direct Link redirection gateway.
                </p>
              </div>
            </div>
            <div className="h-32 w-full bg-background-card/90 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden group select-none">
              <div className="absolute inset-0 bg-white/2 shimmer group-hover:opacity-75 transition-opacity"></div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 z-10">
                <PlaySquare className="w-5 h-5 text-accent-emerald" />
                <span>Simulating Sponsor Video Ad Streaming...</span>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- CONTINUE BUTTON DISABLED/ENABLED -------------------- */}
        <div className="flex items-center justify-center pt-2 select-none">
          <button
            onClick={handleNextStep}
            disabled={timer > 0 || showVignette}
            className={`px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
              timer > 0 || showVignette
                ? 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white shadow-neon-purple hover:scale-105 active:scale-95'
            }`}
          >
            {showVignette ? (
              <span>Close Sponsored Ad to Unlock</span>
            ) : timer > 0 ? (
              <span>Locked: Wait {timer}s</span>
            ) : (
              <>
                <span>{step === 3 ? 'Unlock Link' : 'Continue to Next Step'}</span>
                {step === 3 ? <CheckCircle2 className="w-5 h-5 text-accent-emerald animate-bounce" /> : <ArrowRight className="w-5 h-5" />}
              </>
            )}
          </button>
        </div>

      </main>

      {/* -------------------- FOOTER AD BANNER -------------------- */}
      <div className="w-full max-w-4xl px-6 pt-8">
        <div className="glass-panel p-4 rounded-xl border border-white/5 text-center relative overflow-hidden bg-gradient-to-r from-accent-rose/5 via-[#101018] to-primary-950/20">
          <div className="absolute top-0 right-0 w-2 h-full bg-accent-rose"></div>
          <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>Responsive Monetag Banner Placement #4928</span>
            <span className="text-accent-rose font-bold">100% Mobile Compatible</span>
          </div>
          <div className="py-2 text-xs font-semibold text-slate-400">
            🔥 <strong>Sponsor:</strong> Host tournament lobbies instantly. Low commission brackets, automated payment processing channels, and live brackets dashboard updates.
          </div>
        </div>
      </div>

      {/* -------------------- MONETAG VIGNETTE BANNER BANNER INTERSTITIAL MODAL -------------------- */}
      {showVignette && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-white/10 relative overflow-hidden shadow-glass-glow flex flex-col p-6 space-y-6 max-h-[90vh]">
            
            {/* Top Close Bar */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-accent-rose animate-pulse" />
                Sponsor Vignette Interstitial Banner
              </span>
              <button 
                onClick={dismissVignette}
                className="p-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-lg transition-colors outline-none flex items-center gap-1 text-[10px] font-bold px-2"
              >
                Dismiss Sponsored Ad <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulated Vignette Banner Content */}
            <div className="flex-1 space-y-4 text-left overflow-y-auto pr-1">
              <div className="h-44 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden shimmer flex items-center justify-center">
                <Globe className="w-12 h-12 text-slate-700 animate-spin" />
              </div>
              <h3 className="text-lg font-black text-slate-200 leading-snug">Maximize Link Payouts with Programmatic Vignette Formats</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Vignette banners represent one of Monetag's cleanest yet highest visibility formats. Perfect for mobile overlays, presenting highly targeted desktop sponsorships to maximize CPM indexes cleanly.
              </p>
              <div className="p-3.5 bg-background-card border border-white/5 rounded-xl text-[10px] text-slate-400 leading-normal">
                💡 <strong>Monetag Setup Guideline:</strong> Country CPM Profiles automatically optimize the delivery thresholds to secure high conversions while protecting user retention.
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex gap-3 select-none">
              <button 
                onClick={dismissVignette}
                className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 font-bold rounded-xl text-xs text-white shadow-neon-purple transition-all"
              >
                Dismiss Ad & Start Timer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* -------------------- MOCK FLOATING ONCLICK POPUNDER WINDOW -------------------- */}
      {popunderOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 glass-panel border-accent-cyan/30 p-5 rounded-2xl shadow-neon-cyan flex flex-col space-y-4 animate-slideIn select-none text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase font-bold text-accent-cyan tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3" /> Monetag Onclick Popunder Window
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPopunderOpen(false);
              }}
              className="text-slate-500 hover:text-slate-300 transition-colors outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-black text-slate-200">🎁 Congratulations! Reward Selections Assigned</div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Your publisher traffic qualify checks cleared successfully. Click below to secure a simulated CPM promotion bonus.
            </p>
          </div>

          <a 
            href="#cpm-boost"
            onClick={(e) => {
              e.preventDefault();
              setPopunderOpen(false);
              confetti({ particleCount: 30, spread: 40 });
            }}
            className="w-full py-2 bg-gradient-to-r from-accent-cyan to-indigo-600 hover:from-accent-cyan/90 text-center rounded-xl text-[10px] font-bold text-white block shadow-neon-cyan hover:scale-[1.01] active:scale-95 transition-all"
          >
            Claim Instant Balance Boost
          </a>
        </div>
      )}

      {/* -------------------- DIRECT LINK Intermediate ROUTING GATEWAY OVERLAY -------------------- */}
      {showDirectLinkOverlay && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 select-none animate-fadeIn">
          <div className="max-w-sm text-center space-y-6">
            <div className="w-20 h-20 bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan rounded-full flex items-center justify-center mx-auto shadow-neon-cyan animate-pulse">
              <ExternalLink className="w-10 h-10 text-accent-cyan animate-spin" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-gradient font-black text-2xl tracking-tight">Direct Link Redirection</h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Traversing high-revenue Monetag direct link advertising gateway... Verification token verified cleanly.
              </p>
            </div>

            <div className="w-48 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-accent-cyan to-primary-500 rounded-full animate-progress"></div>
            </div>

            <p className="text-[9px] text-slate-500 max-w-xs mx-auto">
              Please wait. Redirecting dynamically to target destination: <br />
              <span className="font-mono text-accent-cyan mt-1 block truncate max-w-xs">{urlData.originalUrl}</span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

