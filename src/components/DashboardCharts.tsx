import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { LinkAnalytic } from '../context/AppContext';

interface DashboardChartsProps {
  analyticsData: LinkAnalytic[];
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ analyticsData }) => {
  
  // 1. Process Area Chart (Clicks & Earnings in last 7 days)
  const processTimelineData = () => {
    const datesMap: { [key: string]: { date: string; clicks: number; earnings: number } } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      datesMap[str] = { date: str, clicks: 0, earnings: 0 };
    }

    analyticsData.forEach(item => {
      const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (datesMap[dateStr]) {
        datesMap[dateStr].clicks += 1;
        if (item.isValid) {
          datesMap[dateStr].earnings += item.earnings;
        }
      }
    });

    return Object.values(datesMap);
  };

  // 2. Process Pie Chart (Devices)
  const processDeviceData = () => {
    const devices = { Desktop: 0, Mobile: 0, Tablet: 0 };
    analyticsData.forEach(item => {
      if (item.device in devices) {
        devices[item.device as keyof typeof devices] += 1;
      } else {
        devices.Desktop += 1; // Default fallback
      }
    });

    const total = analyticsData.length || 1;
    return Object.entries(devices).map(([name, count]) => ({
      name,
      value: count,
      percentage: Number(((count / total) * 100).toFixed(1))
    }));
  };

  // 3. Process Bar Chart (Country stats)
  const processCountryData = () => {
    const countries: { [key: string]: number } = {};
    analyticsData.forEach(item => {
      countries[item.country] = (countries[item.country] || 0) + 1;
    });

    return Object.entries(countries)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  };

  // 4. Process Referrer Data
  const processReferrerData = () => {
    const referrers: { [key: string]: number } = {};
    analyticsData.forEach(item => {
      referrers[item.referrer] = (referrers[item.referrer] || 0) + 1;
    });

    return Object.entries(referrers)
      .map(([referrer, count]) => ({ name: referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const timelineData = processTimelineData();
  const deviceData = processDeviceData();
  const countryData = processCountryData();
  const referrerData = processReferrerData();

  // Color configurations
  const COLORS_PIE = ['#8b5cf6', '#06b6d4', '#10b981']; // Purple, Cyan, Emerald

  // Custom translucent tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel border border-white/10 p-3 rounded-lg shadow-glass text-xs">
          <p className="font-bold text-slate-200 mb-1.5">{label}</p>
          {payload.map((pld: any, idx: number) => (
            <p key={idx} className="font-medium" style={{ color: pld.color }}>
              {pld.name}: <span className="font-bold">{pld.name.includes('Earning') ? `₹${pld.value.toFixed(2)}` : pld.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Main Timeline Chart (Span 2 Cols) */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-radial-purple opacity-30 pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-100 font-sans">Performance Overview</h3>
            <p className="text-xs text-slate-400">Visitor clicks & payout balances logged over the last 7 days</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-primary-400">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-500"></span> Clicks
            </span>
            <span className="flex items-center gap-1.5 text-accent-cyan">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan"></span> Earnings (INR)
            </span>
          </div>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={true}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                name="Clicks" 
                type="monotone" 
                dataKey="clicks" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorClicks)" 
              />
              <Area 
                name="Earnings" 
                type="monotone" 
                dataKey="earnings" 
                stroke="#06b6d4" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEarnings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Device Breakdown Chart (Span 1 Col) */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-radial-cyan opacity-20 pointer-events-none"></div>
        <h3 className="font-bold text-lg text-slate-100 font-sans mb-1">Visitor Devices</h3>
        <p className="text-xs text-slate-400 mb-6">Device categorization of links traffic</p>
        
        <div className="h-48 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {deviceData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: any, props: any) => [
                  `${value} clicks (${props.payload.percentage}%)`, name
                ]}
                contentStyle={{ background: 'rgba(18,18,29,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Dynamic Legend indicators */}
        <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] font-semibold">
          {deviceData.map((d, i) => (
            <div key={i} className="flex flex-col items-center bg-white/5 rounded-lg p-2 border border-white/5 text-center">
              <span className="flex items-center gap-1.5 mb-1" style={{ color: COLORS_PIE[i] }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS_PIE[i] }}></span>
                {d.name}
              </span>
              <span className="text-xs font-extrabold text-slate-200">{d.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Geographical Country Stats */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5">
        <h3 className="font-bold text-base text-slate-100 font-sans mb-1">Top Countries</h3>
        <p className="text-xs text-slate-400 mb-6">Geographical traffic distribution</p>

        {countryData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-500 font-medium">
            No geographic clicks logged
          </div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={countryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="country" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ background: 'rgba(18,18,29,0.85)', border: '1px solid rgba(255,255,255,0.08)' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {countryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#06b6d4' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. Traffic Referral Metrics */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 lg:col-span-2">
        <h3 className="font-bold text-base text-slate-100 font-sans mb-1">Referral Sources</h3>
        <p className="text-xs text-slate-400 mb-6">Incoming click streams categorized by platform origins</p>

        {referrerData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-500 font-medium">
            No referrer streams logged
          </div>
        ) : (
          <div className="space-y-4">
            {referrerData.map((ref, idx) => {
              const maxCount = Math.max(...referrerData.map(r => r.count)) || 1;
              const percent = (ref.count / maxCount) * 100;
              const colors = ['bg-primary-500', 'bg-accent-cyan', 'bg-accent-violet', 'bg-indigo-500', 'bg-accent-emerald'];
              
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{ref.name}</span>
                    <span className="text-slate-400">
                      {ref.count} clicks <span className="text-[10px] text-slate-500">({Math.round(percent)}%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full ${colors[idx % colors.length]} transition-all duration-1000`} 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
