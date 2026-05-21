import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Types representing database tables & UAM
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: 'ACTIVE' | 'BANNED';
  adminId?: string; // parent admin if role = USER
  balance: number;
  totalEarned: number;
  customCpm?: number;
  createdAt: string;
}

export interface ShortUrl {
  id: string;
  originalUrl: string;
  shortCode: string;
  customAlias?: string;
  title: string;
  qrCodeUrl: string;
  isActive: boolean;
  userId: string;
  createdAt: string;
}

export interface LinkAnalytic {
  id: string;
  urlId: string;
  ip: string;
  country: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  referrer: string;
  isValid: boolean;
  earnings: number;
  cpm: number;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  commissionFee: number;
  netAmount: number;
  paymentMethod: string;
  paymentDetails: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface FraudLog {
  id: string;
  userId?: string;
  ip: string;
  reason: 'VPN_DETECTION' | 'DUPLICATE_IP' | 'BOT_TRAFFIC' | 'SPEED_CLICK' | 'EMULATOR_DETECTED';
  userAgent: string;
  details: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  operator: string;
  role: Role;
  action: string;
  details: string;
  timestamp: string;
}

export interface RolePermissions {
  USER: string[];
  ADMIN: string[];
  SUPER_ADMIN: string[];
}

export interface SystemSettings {
  defaultCpm: number;
  vpnShieldActive: boolean;
  botCheckActive: boolean;
  rateLimitPerHour: number;
}

interface AppContextType {
  user: UserProfile | null;
  users: UserProfile[];
  links: ShortUrl[];
  analytics: LinkAnalytic[];
  withdrawals: Withdrawal[];
  fraudLogs: FraudLog[];
  systemLogs: SystemLog[];
  permissions: RolePermissions;
  settings: SystemSettings;
  liveVisitors: number;
  login: (email: string, role: Role) => Promise<boolean>;
  register: (name: string, email: string, role: Role) => Promise<boolean>;
  logout: () => void;
  createShortUrl: (originalUrl: string, customAlias?: string) => Promise<ShortUrl>;
  deleteShortUrl: (id: string) => Promise<void>;
  requestWithdrawal: (amount: number, method: string, details: string) => Promise<{ success: boolean; message: string }>;
  approveWithdrawal: (id: string) => Promise<void>;
  rejectWithdrawal: (id: string) => Promise<void>;
  banUser: (id: string) => Promise<void>;
  unbanUser: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  addFraudLog: (log: Omit<FraudLog, 'id' | 'createdAt'>) => Promise<void>;
  addSystemLog: (action: string, details: string) => void;
  togglePermission: (role: Role, permissionKey: string) => Promise<void>;
  recordAdView: (shortCode: string, step: number, ip: string, visitorDetails: Partial<LinkAnalytic>) => Promise<boolean>;
  changeUserRole: (role: Role) => void;
  triggerSimulatedClick: () => Promise<void>;
  hasUserPermission: (actionKey: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock Users
const MOCK_USERS: Omit<UserProfile, 'createdAt'>[] = [
  { id: 'sa-1', email: 'superadmin@axiino.com', name: 'Alax Axiino', role: 'SUPER_ADMIN', status: 'ACTIVE', balance: 450000, totalEarned: 1200000 },
  { id: 'adm-1', email: 'admin_vikram@axiino.com', name: 'Vikram Singh', role: 'ADMIN', status: 'ACTIVE', balance: 24500, totalEarned: 78000 },
  { id: 'usr-1', email: 'user_rohan@axiino.com', name: 'Rohan Sharma', role: 'USER', adminId: 'adm-1', status: 'ACTIVE', balance: 3200, totalEarned: 12400 },
  { id: 'usr-2', email: 'user_ananya@axiino.com', name: 'Ananya Roy', role: 'USER', adminId: 'adm-1', status: 'ACTIVE', balance: 5400, totalEarned: 18900 },
  { id: 'usr-3', email: 'fraud_bot@axiino.com', name: 'Suspicious Bot Account', role: 'USER', adminId: 'adm-1', status: 'BANNED', balance: 0, totalEarned: 140 },
];

// Seeding RCB Details URLs
const MOCK_LINKS: Omit<ShortUrl, 'id' | 'createdAt'>[] = [
  { originalUrl: 'https://www.royalchallengers.com/ipl-2026/squad', shortCode: 'rcb-squad', customAlias: 'rcb-squad', title: 'RCB 2026 Team Player Squad Roster', qrCodeUrl: '', isActive: true, userId: 'usr-1' },
  { originalUrl: 'https://www.royalchallengers.com/ipl-2026/schedule', shortCode: 'rcb-schedule', customAlias: 'rcb-schedule', title: 'IPL 2026 RCB Match Fixtures Schedule', qrCodeUrl: '', isActive: true, userId: 'usr-1' },
  { originalUrl: 'https://www.royalchallengers.com/tickets/chinnaswamy', shortCode: 'rcb-tickets', customAlias: 'rcb-tickets', title: 'IPL RCB M. Chinnaswamy Stadium Ticket Booking', qrCodeUrl: '', isActive: true, userId: 'adm-1' },
  { originalUrl: 'https://shop.royalchallengers.com/official-jersey-2026', shortCode: 'rcb-jersey', customAlias: 'rcb-jersey', title: 'Official RCB Fan Merchandise Match Jersey Store', qrCodeUrl: '', isActive: true, userId: 'usr-2' },
];

const MOCK_ANALYTICS: Omit<LinkAnalytic, 'id' | 'createdAt'>[] = [
  { urlId: 'rcb-link-1', ip: '103.45.201.22', country: 'India', device: 'Mobile', browser: 'Chrome', referrer: 'Telegram', isValid: true, earnings: 4.5, cpm: 4.5 },
  { urlId: 'rcb-link-1', ip: '45.120.45.89', country: 'United States', device: 'Desktop', browser: 'Safari', referrer: 'Twitter', isValid: true, earnings: 6.5, cpm: 6.5 },
  { urlId: 'rcb-link-2', ip: '82.45.90.122', country: 'United Kingdom', device: 'Tablet', browser: 'Firefox', referrer: 'Direct', isValid: true, earnings: 5.0, cpm: 5.0 },
  { urlId: 'rcb-link-3', ip: '192.168.1.1', country: 'India', device: 'Desktop', browser: 'Chrome', referrer: 'Direct', isValid: true, earnings: 4.0, cpm: 4.0 },
  { urlId: 'rcb-link-3', ip: '172.56.21.99', country: 'Germany', device: 'Mobile', browser: 'Edge', referrer: 'Youtube', isValid: true, earnings: 7.2, cpm: 7.2 },
];

const MOCK_WITHDRAWALS: Omit<Withdrawal, 'id' | 'createdAt'>[] = [
  { userId: 'adm-1', amount: 10000, commissionFee: 1000, netAmount: 9000, paymentMethod: 'UPI', paymentDetails: 'vikram@okaxis', status: 'APPROVED' },
  { userId: 'usr-1', amount: 3000, commissionFee: 0, netAmount: 3000, paymentMethod: 'UPI', paymentDetails: 'rohan@okpaytm', status: 'APPROVED' },
];

const MOCK_FRAUD: Omit<FraudLog, 'id' | 'createdAt'>[] = [
  { userId: 'usr-3', ip: '185.200.116.4', reason: 'BOT_TRAFFIC', userAgent: 'Mozilla/5.0 (compatible; HeadlessChrome/114.0.0.0)', details: 'Automated script detected trying to bypass redirect step verification on /rcb-squad.' },
];

// Default Action Permissions (User Access Management - UAM)
const DEFAULT_PERMISSIONS: RolePermissions = {
  USER: ['create_link', 'withdraw_funds'],
  ADMIN: ['create_link', 'withdraw_funds', 'manage_publishers'],
  SUPER_ADMIN: ['create_link', 'withdraw_funds', 'manage_publishers', 'approve_payouts', 'global_settings', 'fraud_shield', 'uam_control']
};

// PostgreSQL to Frontend Type Mappings
const mapProfileFromDb = (row: any): UserProfile => ({
  id: row.id,
  email: row.email,
  name: row.name,
  role: row.role as Role,
  status: row.status as any,
  adminId: row.adminId || undefined,
  balance: row.balance,
  totalEarned: row.totalEarned,
  customCpm: row.customCpm || undefined,
  createdAt: row.createdAt || row.created_at
});

const mapUrlFromDb = (row: any): ShortUrl => ({
  id: row.id,
  originalUrl: row.original_url || row.originalUrl,
  shortCode: row.short_code || row.shortCode,
  customAlias: row.custom_alias || row.customAlias || undefined,
  title: row.title || '',
  qrCodeUrl: row.qr_code_url || row.qrCodeUrl || '',
  isActive: row.is_active !== undefined ? row.is_active : row.isActive,
  userId: row.user_id || row.userId,
  createdAt: row.created_at || row.createdAt
});

const mapUrlToDb = (url: Partial<ShortUrl>) => ({
  id: url.id,
  original_url: url.originalUrl,
  short_code: url.shortCode,
  custom_alias: url.customAlias || null,
  title: url.title,
  qr_code_url: url.qrCodeUrl,
  is_active: url.isActive,
  user_id: url.userId,
  updated_at: new Date().toISOString()
});

const mapAnalyticFromDb = (row: any): LinkAnalytic => ({
  id: row.id,
  urlId: row.url_id || row.urlId,
  ip: row.ip,
  country: row.country || 'India',
  device: row.device as any || 'Desktop',
  browser: row.browser || 'Chrome',
  referrer: row.referrer || 'Direct',
  isValid: row.is_valid !== undefined ? row.is_valid : row.isValid,
  earnings: row.earnings,
  cpm: row.cpm,
  createdAt: row.created_at || row.createdAt
});

const mapAnalyticToDb = (a: Partial<LinkAnalytic>) => ({
  id: a.id,
  url_id: a.urlId,
  ip: a.ip,
  country: a.country,
  device: a.device,
  browser: a.browser,
  referrer: a.referrer,
  is_valid: a.isValid,
  earnings: a.earnings,
  cpm: a.cpm
});

const mapWithdrawalFromDb = (row: any): Withdrawal => ({
  id: row.id,
  userId: row.user_id || row.userId,
  amount: row.amount,
  commissionFee: row.commission_fee || row.commissionFee,
  netAmount: row.net_amount || row.netAmount,
  paymentMethod: row.payment_method || row.paymentMethod,
  paymentDetails: row.payment_details || row.paymentDetails,
  status: row.status as any,
  createdAt: row.created_at || row.createdAt
});

const mapWithdrawalToDb = (w: Partial<Withdrawal>) => ({
  id: w.id,
  user_id: w.userId,
  amount: w.amount,
  commission_fee: w.commissionFee,
  net_amount: w.netAmount,
  payment_method: w.paymentMethod,
  payment_details: w.paymentDetails,
  status: w.status,
  updated_at: new Date().toISOString()
});

const mapFraudFromDb = (row: any): FraudLog => ({
  id: row.id,
  userId: row.user_id || row.userId || undefined,
  ip: row.ip,
  reason: row.reason as any,
  userAgent: row.user_agent || row.userAgent,
  details: row.details || '',
  createdAt: row.created_at || row.createdAt
});

const mapFraudToDb = (f: Partial<FraudLog>) => ({
  id: f.id,
  user_id: f.userId || null,
  ip: f.ip,
  reason: f.reason,
  user_agent: f.userAgent,
  details: f.details
});

const loadSettingsFromDb = (rows: any[]): SystemSettings => {
  const settings: SystemSettings = {
    defaultCpm: 5.0,
    vpnShieldActive: true,
    botCheckActive: true,
    rateLimitPerHour: 100
  };
  rows.forEach(r => {
    if (r.key === 'defaultCpm') settings.defaultCpm = parseFloat(r.value);
    if (r.key === 'vpnShieldActive') settings.vpnShieldActive = r.value === 'true';
    if (r.key === 'botCheckActive') settings.botCheckActive = r.value === 'true';
    if (r.key === 'rateLimitPerHour') settings.rateLimitPerHour = parseInt(r.value);
  });
  return settings;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [links, setLinks] = useState<ShortUrl[]>([]);
  const [analytics, setAnalytics] = useState<LinkAnalytic[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [permissions, setPermissions] = useState<RolePermissions>(DEFAULT_PERMISSIONS);
  const [settings, setSettings] = useState<SystemSettings>({
    defaultCpm: 5.0,
    vpnShieldActive: true,
    botCheckActive: true,
    rateLimitPerHour: 100
  });
  const [liveVisitors, setLiveVisitors] = useState<number>(24);

  // Initialize DB from PostgreSQL via Supabase client
  useEffect(() => {
    const initDatabase = async () => {
      try {
        // 1. Fetch Users / Profiles
        const { data: dbProfiles, error: errProfiles } = await supabase
          .from('profiles')
          .select('*');
        
        let activeProfiles: UserProfile[] = [];
        if (dbProfiles && !errProfiles) {
          activeProfiles = dbProfiles.map(mapProfileFromDb);
        }

        // 2. Check if default preset profiles exist, if not, auto-seed them in DB
        const hasSa = activeProfiles.some(p => p.email.toLowerCase() === 'superadmin@axiino.com');
        const hasAdm = activeProfiles.some(p => p.email.toLowerCase() === 'admin_vikram@axiino.com');
        
        const presetsToInsert: any[] = [];
        if (!hasSa) {
          presetsToInsert.push({
            id: 'sa-1',
            email: 'superadmin@axiino.com',
            name: 'Alax Axiino',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            balance: 450000.0,
            totalEarned: 1200000.0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        if (!hasAdm) {
          presetsToInsert.push({
            id: 'adm-1',
            email: 'admin_vikram@axiino.com',
            name: 'Vikram Singh',
            role: 'ADMIN',
            status: 'ACTIVE',
            balance: 24500.0,
            totalEarned: 78000.0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        // Add additional MOCK profiles to DB if missing completely
        if (activeProfiles.length <= presetsToInsert.length) {
          MOCK_USERS.forEach(m => {
            if (m.id !== 'sa-1' && m.id !== 'adm-1') {
              presetsToInsert.push({
                ...m,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          });
        }

        if (presetsToInsert.length > 0) {
          const { data: inserted, error: errInsert } = await supabase
            .from('profiles')
            .insert(presetsToInsert)
            .select();
          
          if (inserted && !errInsert) {
            const mappedInserted = inserted.map(mapProfileFromDb);
            activeProfiles = [...activeProfiles.filter(ap => !mappedInserted.some(mi => mi.id === ap.id)), ...mappedInserted];
          }
        }
        setUsers(activeProfiles);

        // 3. Fetch Links / ShortUrls
        const { data: dbUrls, error: errUrls } = await supabase
          .from('urls')
          .select('*');
        
        let activeUrls: ShortUrl[] = [];
        if (dbUrls && dbUrls.length > 0 && !errUrls) {
          activeUrls = dbUrls.map(mapUrlFromDb);
        } else {
          // If no links, let's auto-seed RCB URLs in DB for initial setup
          const initLinks = MOCK_LINKS.map((l, index) => ({
            id: 'rcb-link-' + (index + 1),
            ...l,
            createdAt: new Date().toISOString()
          }));
          
          const promises = initLinks.map(async (l) => {
            l.qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:5173/s/${l.shortCode}`;
            return mapUrlToDb(l);
          });
          const mappedMockLinks = await Promise.all(promises);
          
          const { data: insertedUrls, error: errInsertUrls } = await supabase
            .from('urls')
            .insert(mappedMockLinks)
            .select();
            
          if (insertedUrls && !errInsertUrls) {
            activeUrls = insertedUrls.map(mapUrlFromDb);
          }
        }
        setLinks(activeUrls);

        // 4. Fetch Analytics
        const { data: dbAnalytics, error: errAnalytics } = await supabase
          .from('analytics')
          .select('*')
          .order('created_at', { ascending: false });
        
        let activeAnalytics: LinkAnalytic[] = [];
        if (dbAnalytics && dbAnalytics.length > 0 && !errAnalytics) {
          activeAnalytics = dbAnalytics.map(mapAnalyticFromDb);
        } else {
          // Auto-seed mock analytics in DB
          const initAnalytics = MOCK_ANALYTICS.map((a, idx) => ({
            id: 'an-rcb-' + (idx + 1),
            ...a,
            createdAt: new Date().toISOString()
          }));
          const mappedMockAnalytics = initAnalytics.map(mapAnalyticToDb);
          const { data: insertedAnalytics, error: errInsertAnalytics } = await supabase
            .from('analytics')
            .insert(mappedMockAnalytics)
            .select();
          
          if (insertedAnalytics && !errInsertAnalytics) {
            activeAnalytics = insertedAnalytics.map(mapAnalyticFromDb);
          }
        }
        setAnalytics(activeAnalytics);

        // 5. Fetch Withdrawals
        const { data: dbWithdrawals, error: errWds } = await supabase
          .from('withdrawals')
          .select('*')
          .order('created_at', { ascending: false });
        
        let activeWithdrawals: Withdrawal[] = [];
        if (dbWithdrawals && dbWithdrawals.length > 0 && !errWds) {
          activeWithdrawals = dbWithdrawals.map(mapWithdrawalFromDb);
        } else {
          // Auto-seed mock withdrawals in DB
          const initWds = MOCK_WITHDRAWALS.map((w, idx) => ({
            id: 'wd-' + (idx + 1),
            ...w,
            createdAt: new Date().toISOString()
          }));
          const mappedMockWds = initWds.map(mapWithdrawalToDb);
          const { data: insertedWds, error: errInsertWds } = await supabase
            .from('withdrawals')
            .insert(mappedMockWds)
            .select();
          
          if (insertedWds && !errInsertWds) {
            activeWithdrawals = insertedWds.map(mapWithdrawalFromDb);
          }
        }
        setWithdrawals(activeWithdrawals);

        // 6. Fetch Fraud Logs
        const { data: dbFraud, error: errFraud } = await supabase
          .from('fraud_logs')
          .select('*')
          .order('created_at', { ascending: false });
        
        let activeFraud: FraudLog[] = [];
        if (dbFraud && dbFraud.length > 0 && !errFraud) {
          activeFraud = dbFraud.map(mapFraudFromDb);
        } else {
          // Auto-seed mock fraud in DB
          const initFraud = MOCK_FRAUD.map((f, idx) => ({
            id: 'fr-' + (idx + 1),
            ...f,
            createdAt: new Date().toISOString()
          }));
          const mappedMockFraud = initFraud.map(mapFraudToDb);
          const { data: insertedFraud, error: errInsertFraud } = await supabase
            .from('fraud_logs')
            .insert(mappedMockFraud)
            .select();
          
          if (insertedFraud && !errInsertFraud) {
            activeFraud = insertedFraud.map(mapFraudFromDb);
          }
        }
        setFraudLogs(activeFraud);

        // 7. Fetch System Settings & Custom Permissions from DB
        const { data: dbSettings, error: errSettings } = await supabase
          .from('system_settings')
          .select('*');
        
        if (dbSettings && dbSettings.length > 0 && !errSettings) {
          setSettings(loadSettingsFromDb(dbSettings));
          const localPerms = dbSettings.find(r => r.key === 'permissions');
          if (localPerms) {
            setPermissions(JSON.parse(localPerms.value));
          }
        } else {
          // Seed settings key-value in DB
          const defaultSettings = [
            { key: 'defaultCpm', value: '5.0' },
            { key: 'vpnShieldActive', value: 'true' },
            { key: 'botCheckActive', value: 'true' },
            { key: 'rateLimitPerHour', value: '100' },
            { key: 'permissions', value: JSON.stringify(DEFAULT_PERMISSIONS) }
          ];
          await supabase.from('system_settings').upsert(defaultSettings);
        }

        // Restore system logs from local session audit details
        const localSysLogs = localStorage.getItem('ax_syslogs');
        if (localSysLogs) setSystemLogs(JSON.parse(localSysLogs));
        else {
          const defaultLogs: SystemLog[] = [
            { id: 'sl-1', operator: 'Platform Engine', role: 'SUPER_ADMIN', action: 'SYSTEM_SEED', details: 'Pre-seeded Royal Challengers Bangalore (RCB) Squad, Schedule, and Tickets links.', timestamp: new Date().toISOString() },
            { id: 'sl-2', operator: 'Alax Axiino', role: 'SUPER_ADMIN', action: 'UAM_UPDATE', details: 'Initialized standard action permissions map for Super Admin, Admin, and User roles.', timestamp: new Date().toISOString() }
          ];
          setSystemLogs(defaultLogs);
          localStorage.setItem('ax_syslogs', JSON.stringify(defaultLogs));
        }

        // 8. Restore logged in user session from LocalStorage
        const localCurrentUser = localStorage.getItem('ax_current_user');
        if (localCurrentUser) {
          const parsed = JSON.parse(localCurrentUser);
          // Fetch freshest user profile state from DB
          const { data: freshestProfile, error: errFresh } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', parsed.id)
            .single();
          
          if (freshestProfile && !errFresh) {
            const mapped = mapProfileFromDb(freshestProfile);
            setUser(mapped);
            localStorage.setItem('ax_current_user', JSON.stringify(mapped));
          } else {
            setUser(parsed);
          }
        }
      } catch (e) {
        console.error('Error synchronizing database schemas:', e);
      }
    };

    initDatabase();
  }, []);

  const syncToLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // Live visitor fluctuations
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveVisitors(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        const next = prev + change;
        return next < 5 ? 5 : next > 60 ? 60 : next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // System Action Logger
  const addSystemLog = (action: string, details: string) => {
    const operatorName = user ? user.name : 'Visitor Shield';
    const operatorRole = user ? user.role : 'USER';

    const newLog: SystemLog = {
      id: 'sl-' + Date.now(),
      operator: operatorName,
      role: operatorRole,
      action,
      details,
      timestamp: new Date().toISOString()
    };

    const updated = [newLog, ...systemLogs];
    setSystemLogs(updated);
    syncToLocal('ax_syslogs', updated);
  };

  // UAM Toggles
  const togglePermission = async (role: Role, permissionKey: string) => {
    if (!user || user.role !== 'SUPER_ADMIN') return;

    const currentList = permissions[role] || [];
    const isPresent = currentList.includes(permissionKey);
    const newList = isPresent
      ? currentList.filter(p => p !== permissionKey)
      : [...currentList, permissionKey];

    const updated = {
      ...permissions,
      [role]: newList
    };

    setPermissions(updated);
    await supabase.from('system_settings').upsert({ key: 'permissions', value: JSON.stringify(updated) });
    addSystemLog('UAM_PERMISSION_MODIFIED', `Super Admin updated UAM rules for ${role}: ${isPresent ? 'REVOKED' : 'GRANTED'} [${permissionKey}]`);
  };

  // Check if role has permission helper
  const hasPermission = (checkRole: Role, actionKey: string): boolean => {
    return permissions[checkRole]?.includes(actionKey) || false;
  };

  const hasUserPermission = (actionKey: string): boolean => {
    if (!user) return false;
    return permissions[user.role]?.includes(actionKey) || false;
  };

  // Auth Operations
  const login = async (email: string, _role: Role): Promise<boolean> => {
    // 1. Check database profiles
    const { data: matchProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim())
      .maybeSingle();

    let dbUser = matchProfile ? mapProfileFromDb(matchProfile) : null;

    // Auto-seed presets instantly on click if they got cleared
    if (!dbUser) {
      if (email.toLowerCase() === 'superadmin@axiino.com') {
        const seededSa = { 
          id: 'sa-1', 
          email: 'superadmin@axiino.com', 
          name: 'Alax Axiino', 
          role: 'SUPER_ADMIN' as const, 
          status: 'ACTIVE', 
          balance: 450000.0, 
          totalEarned: 1200000.0, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const { data } = await supabase.from('profiles').insert(seededSa).select().single();
        if (data) dbUser = mapProfileFromDb(data);
      } else if (email.toLowerCase() === 'admin_vikram@axiino.com') {
        const seededAdm = { 
          id: 'adm-1', 
          email: 'admin_vikram@axiino.com', 
          name: 'Vikram Singh', 
          role: 'ADMIN' as const, 
          status: 'ACTIVE', 
          balance: 24500.0, 
          totalEarned: 78000.0, 
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const { data } = await supabase.from('profiles').insert(seededAdm).select().single();
        if (data) dbUser = mapProfileFromDb(data);
      }
    }

    if (dbUser) {
      if (dbUser.status === 'BANNED') {
        return false;
      }
      setUser(dbUser);
      localStorage.setItem('ax_current_user', JSON.stringify(dbUser));
      addSystemLog('USER_LOGIN', `${dbUser.name} signed in successfully in ${dbUser.role} console.`);
      
      // Update users list in state from DB
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      if (allProfiles) setUsers(allProfiles.map(mapProfileFromDb));
      return true;
    }
    
    return false;
  };

  const register = async (name: string, email: string, role: Role): Promise<boolean> => {
    // Check if email already registered
    const { data: matchProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.trim())
      .maybeSingle();

    if (matchProfile) return false;

    const newUser: UserProfile = {
      id: 'usr-' + Date.now(),
      email: email.trim(),
      name: name.trim(),
      role,
      status: 'ACTIVE',
      balance: 0.0,
      totalEarned: 0.0,
      createdAt: new Date().toISOString()
    };

    // Insert user profile into database
    const { data: inserted, error } = await supabase
      .from('profiles')
      .insert({
        ...newUser,
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (inserted && !error) {
      const mapped = mapProfileFromDb(inserted);
      setUser(mapped);
      localStorage.setItem('ax_current_user', JSON.stringify(mapped));
      
      // Refresh users state from database
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      if (allProfiles) setUsers(allProfiles.map(mapProfileFromDb));

      addSystemLog('USER_REGISTER', `${mapped.name} registered email as ${role}.`);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) {
      addSystemLog('USER_LOGOUT', `${user.name} logged out from the console.`);
    }
    setUser(null);
    localStorage.removeItem('ax_current_user');
  };

  const changeUserRole = (newRole: Role) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('ax_current_user', JSON.stringify(updated));
      const updatedList = users.map(u => u.id === user.id ? updated : u);
      setUsers(updatedList);
      addSystemLog('ROLE_VIEW_TOGGLE', `Switched live dashboard interface view to ${newRole}.`);
    }
  };

  // Link Operations
  const createShortUrl = async (originalUrl: string, customAlias?: string): Promise<ShortUrl> => {
    if (!user) throw new Error('Unauthenticated');
    
    // Check UAM permission
    if (!hasPermission(user.role, 'create_link')) {
      throw new Error('Action Refused: Your role does not hold "create_link" permissions in the UAM map.');
    }

    const cleanAlias = customAlias ? customAlias.trim().replace(/\s+/g, '-') : undefined;
    if (cleanAlias) {
      const { data: collision } = await supabase
        .from('urls')
        .select('id')
        .or(`short_code.eq.${cleanAlias},custom_alias.eq.${cleanAlias}`)
        .maybeSingle();
      
      if (collision) throw new Error('Alias or short code already exists!');
    }

    const shortCode = cleanAlias || Math.random().toString(36).substring(2, 8);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=http://localhost:5173/s/${shortCode}`;

    const newUrl: ShortUrl = {
      id: 'link-' + Date.now(),
      originalUrl,
      shortCode,
      customAlias: cleanAlias,
      title: originalUrl.replace('https://', '').replace('http://', '').split('/')[0] + ' Redirect',
      qrCodeUrl,
      isActive: true,
      userId: user.id,
      createdAt: new Date().toISOString()
    };

    const dbRow = mapUrlToDb(newUrl);
    const { data: inserted, error } = await supabase
      .from('urls')
      .insert(dbRow)
      .select()
      .single();

    if (inserted && !error) {
      const mapped = mapUrlFromDb(inserted);
      
      // Update local links list from database
      const { data: allUrls } = await supabase.from('urls').select('*');
      if (allUrls) setLinks(allUrls.map(mapUrlFromDb));

      addSystemLog('URL_CREATE', `Created short link /${shortCode} referencing target destination.`);
      return mapped;
    } else {
      throw new Error(error?.message || 'Error occurred writing link to database.');
    }
  };

  const deleteShortUrl = async (id: string) => {
    const match = links.find(l => l.id === id);
    if (!match) return;

    const { error } = await supabase
      .from('urls')
      .delete()
      .eq('id', id);

    if (!error) {
      // Update local links state
      setLinks(prev => prev.filter(l => l.id !== id));
      addSystemLog('URL_DELETE', `Deactivated and deleted shortened link code: /${match.shortCode}`);
    }
  };

  // Withdrawal Requests
  const requestWithdrawal = async (amount: number, method: string, details: string) => {
    if (!user) return { success: false, message: 'Unauthenticated' };
    
    if (!hasPermission(user.role, 'withdraw_funds')) {
      return { success: false, message: 'UAM Error: Your role does not hold "withdraw_funds" permissions.' };
    }

    if (amount <= 0) return { success: false, message: 'Amount must be greater than zero.' };
    if (user.balance < amount) return { success: false, message: 'Insufficient wallet balance!' };

    const commissionFee = user.role === 'ADMIN' ? Number((amount * 0.1).toFixed(2)) : 0;
    const netAmount = Number((amount - commissionFee).toFixed(2));

    const newWd: Withdrawal = {
      id: 'wd-' + Date.now(),
      userId: user.id,
      amount,
      commissionFee,
      netAmount,
      paymentMethod: method,
      paymentDetails: details,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    // 1. Insert withdrawal record in DB
    const dbWd = mapWithdrawalToDb(newWd);
    const { data: insertedWd, error: errWd } = await supabase
      .from('withdrawals')
      .insert(dbWd)
      .select()
      .single();

    if (insertedWd && !errWd) {
      // 2. Update user profile balance in DB (decrement)
      const updatedBalance = Number((user.balance - amount).toFixed(4));
      const { data: updatedProfile, error: errProfile } = await supabase
        .from('profiles')
        .update({ balance: updatedBalance })
        .eq('id', user.id)
        .select()
        .single();

      if (updatedProfile && !errProfile) {
        const mappedUser = mapProfileFromDb(updatedProfile);
        setUser(mappedUser);
        localStorage.setItem('ax_current_user', JSON.stringify(mappedUser));

        // Refresh dynamic variables
        const { data: allWds } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
        if (allWds) setWithdrawals(allWds.map(mapWithdrawalFromDb));

        const { data: allProfiles } = await supabase.from('profiles').select('*');
        if (allProfiles) setUsers(allProfiles.map(mapProfileFromDb));

        addSystemLog('WITHDRAW_REQUEST', `${user.name} requested ₹${amount} payout. Status: PENDING.`);
        return { success: true, message: 'Withdrawal requested successfully.' };
      }
    }
    return { success: false, message: 'Database communication error submitting withdrawal.' };
  };

  const approveWithdrawal = async (id: string) => {
    if (!user || !hasPermission(user.role, 'approve_payouts')) {
      return;
    }

    const match = withdrawals.find(w => w.id === id);
    if (!match) return;

    // Update withdrawal status in DB
    const { data: updatedWd, error } = await supabase
      .from('withdrawals')
      .update({ status: 'APPROVED' })
      .eq('id', id)
      .select()
      .single();

    if (updatedWd && !error) {
      const mappedWd = mapWithdrawalFromDb(updatedWd);
      setWithdrawals(prev => prev.map(w => w.id === id ? mappedWd : w));
      
      const claimant = users.find(u => u.id === match.userId);
      addSystemLog('WITHDRAW_APPROVE', `Super Admin approved gross payout of ₹${match.amount} (Net: ₹${match.netAmount}) for ${claimant ? claimant.name : 'Publisher'}.`);
    }
  };

  const rejectWithdrawal = async (id: string) => {
    if (!user || !hasPermission(user.role, 'approve_payouts')) {
      return;
    }

    const match = withdrawals.find(w => w.id === id);
    if (!match) return;

    // Update withdrawal status to REJECTED in DB
    const { data: updatedWd, error: errWd } = await supabase
      .from('withdrawals')
      .update({ status: 'REJECTED' })
      .eq('id', id)
      .select()
      .single();

    if (updatedWd && !errWd) {
      const claimant = users.find(u => u.id === match.userId);
      if (claimant) {
        const refundedBalance = Number((claimant.balance + match.amount).toFixed(4));
        const { error: errProfile } = await supabase
          .from('profiles')
          .update({ balance: refundedBalance })
          .eq('id', claimant.id);

        if (!errProfile) {
          // If current logged user is claimant, refund
          if (user && user.id === match.userId) {
            setUser(prev => prev ? { ...prev, balance: refundedBalance } : null);
            localStorage.setItem('ax_current_user', JSON.stringify({ ...user, balance: refundedBalance }));
          }

          // Refresh states
          const { data: allProfiles } = await supabase.from('profiles').select('*');
          if (allProfiles) setUsers(allProfiles.map(mapProfileFromDb));

          const { data: allWds } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
          if (allWds) setWithdrawals(allWds.map(mapWithdrawalFromDb));

          addSystemLog('WITHDRAW_REJECT', `Super Admin rejected payout ID: ${id} for ${claimant.name}. Wallet refunded.`);
        }
      }
    }
  };

  // Administration Controls
  const banUser = async (id: string) => {
    if (!user || !hasPermission(user.role, 'manage_publishers')) {
      return;
    }

    const match = users.find(u => u.id === id);
    if (!match) return;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ status: 'BANNED' })
      .eq('id', id)
      .select()
      .single();

    if (updatedProfile && !error) {
      const mapped = mapProfileFromDb(updatedProfile);
      setUsers(prev => prev.map(u => u.id === id ? mapped : u));
      addSystemLog('USER_BAN', `Banned publisher account: ${match.name} (${match.email}) due to click policy breach.`);
    }
  };

  const unbanUser = async (id: string) => {
    if (!user || !hasPermission(user.role, 'manage_publishers')) {
      return;
    }

    const match = users.find(u => u.id === id);
    if (!match) return;

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({ status: 'ACTIVE' })
      .eq('id', id)
      .select()
      .single();

    if (updatedProfile && !error) {
      const mapped = mapProfileFromDb(updatedProfile);
      setUsers(prev => prev.map(u => u.id === id ? mapped : u));
      addSystemLog('USER_UNBAN', `Reactivated publisher account: ${match.name}.`);
    }
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    if (!user || !hasPermission(user.role, 'global_settings')) {
      return;
    }

    const updated = { ...settings, ...newSettings };
    setSettings(updated);

    try {
      const promises = Object.entries(newSettings).map(([key, value]) => {
        return supabase.from('system_settings').upsert({ key, value: String(value) });
      });
      await Promise.all(promises);
      addSystemLog('SETTINGS_UPDATE', `Modified global configuration variables.`);
    } catch (e) {
      console.error('Error saving global settings key-values:', e);
    }
  };

  const addFraudLog = async (log: Omit<FraudLog, 'id' | 'createdAt'>) => {
    const newLog: FraudLog = {
      id: 'fr-' + Date.now(),
      ...log,
      createdAt: new Date().toISOString()
    };

    const dbRow = mapFraudToDb(newLog);
    const { data: inserted, error } = await supabase
      .from('fraud_logs')
      .insert(dbRow)
      .select()
      .single();

    if (inserted && !error) {
      const mapped = mapFraudFromDb(inserted);
      setFraudLogs(prev => [mapped, ...prev]);
      addSystemLog('FRAUD_BREACH_DETECTED', `Blocked connection from IP ${log.ip}. Reason: ${log.reason}`);
    }
  };

  // Ad Views completions
  const recordAdView = async (
    shortCode: string, 
    step: number, 
    ip: string, 
    visitorDetails: Partial<LinkAnalytic>
  ): Promise<boolean> => {
    const link = links.find(l => l.shortCode === shortCode || l.customAlias === shortCode);
    if (!link) return false;

    if (step === 3) {
      const linkOwner = users.find(u => u.id === link.userId);
      if (!linkOwner) return false;

      const matches = analytics.filter(a => a.urlId === link.id && a.ip === ip);
      const isDuplicate = matches.some(a => {
        const timePassed = Date.now() - new Date(a.createdAt).getTime();
        return timePassed < 24 * 60 * 60 * 1000;
      });

      const currentCpm = linkOwner.customCpm || settings.defaultCpm;
      const calculatedEarning = isDuplicate ? 0 : Number((currentCpm / 1000).toFixed(4));
      
      const newAnalytic: LinkAnalytic = {
        id: 'an-' + Date.now(),
        urlId: link.id,
        ip,
        country: visitorDetails.country || 'India',
        device: visitorDetails.device || 'Desktop',
        browser: visitorDetails.browser || 'Chrome',
        referrer: visitorDetails.referrer || 'Direct',
        isValid: !isDuplicate,
        earnings: calculatedEarning,
        cpm: currentCpm,
        createdAt: new Date().toISOString()
      };

      const dbRow = mapAnalyticToDb(newAnalytic);
      const { data: insertedAnalytic, error: errAnalytic } = await supabase
        .from('analytics')
        .insert(dbRow)
        .select()
        .single();

      if (insertedAnalytic && !errAnalytic) {
        const mappedAnalytic = mapAnalyticFromDb(insertedAnalytic);
        setAnalytics(prev => [mappedAnalytic, ...prev]);

        if (!isDuplicate && calculatedEarning > 0) {
          const updatedBalance = Number((linkOwner.balance + calculatedEarning).toFixed(4));
          const updatedEarned = Number((linkOwner.totalEarned + calculatedEarning).toFixed(4));
          
          const { data: updatedProfile, error: errProfile } = await supabase
            .from('profiles')
            .update({ balance: updatedBalance, totalEarned: updatedEarned })
            .eq('id', linkOwner.id)
            .select()
            .single();

          if (updatedProfile && !errProfile) {
            const mappedProfile = mapProfileFromDb(updatedProfile);
            setUsers(prev => prev.map(u => u.id === linkOwner.id ? mappedProfile : u));

            if (user && user.id === linkOwner.id) {
              setUser(mappedProfile);
              localStorage.setItem('ax_current_user', JSON.stringify(mappedProfile));
            }
            addSystemLog('CLICK_CREDITED', `Credited ₹${calculatedEarning} payout to publisher account for unique click on /${shortCode}.`);
          }
        } else if (isDuplicate) {
          await addFraudLog({
            userId: linkOwner.id,
            ip,
            reason: 'DUPLICATE_IP',
            userAgent: visitorDetails.browser || 'Chrome',
            details: `Duplicate view attempt logged in rolling 24h. Payout ignored.`
          });
        }
      }
    }
    return true;
  };

  // Simulating live clicks
  const triggerSimulatedClick = async () => {
    if (links.length === 0) return;
    
    const link = links[Math.floor(Math.random() * links.length)];
    const owner = users.find(u => u.id === link.userId);
    if (!owner) return;

    const countries = ['India', 'United States', 'Germany', 'United Kingdom', 'Singapore'];
    const devices: ('Desktop' | 'Mobile' | 'Tablet')[] = ['Desktop', 'Mobile', 'Tablet'];
    const browsers = ['Chrome', 'Safari', 'Firefox'];
    const referrers = ['Telegram', 'Direct', 'Twitter', 'Google'];

    const ip = `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 254) + 1}`;
    const country = countries[Math.floor(Math.random() * countries.length)];
    const device = devices[Math.floor(Math.random() * devices.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];
    const referrer = referrers[Math.floor(Math.random() * referrers.length)];

    const isVpn = Math.random() < 0.08 && settings.vpnShieldActive;
    const currentCpm = owner.customCpm || settings.defaultCpm;

    if (isVpn) {
      await addFraudLog({
        userId: owner.id,
        ip,
        reason: 'VPN_DETECTION',
        userAgent: `${browser} User`,
        details: `Simulated connection from VPN node at ${country} intercepted and blocked.`
      });
      return;
    }

    const earnings = Number((currentCpm / 1000).toFixed(4));
    
    const click: LinkAnalytic = {
      id: 'an-sim-' + Date.now(),
      urlId: link.id,
      ip,
      country,
      device,
      browser,
      referrer,
      isValid: true,
      earnings,
      cpm: currentCpm,
      createdAt: new Date().toISOString()
    };

    const dbRow = mapAnalyticToDb(click);
    const { data: insertedClick, error: errClick } = await supabase
      .from('analytics')
      .insert(dbRow)
      .select()
      .single();

    if (insertedClick && !errClick) {
      const mappedClick = mapAnalyticFromDb(insertedClick);
      setAnalytics(prev => [mappedClick, ...prev]);

      const updatedBalance = Number((owner.balance + earnings).toFixed(4));
      const updatedEarned = Number((owner.totalEarned + earnings).toFixed(4));

      const { data: updatedProfile, error: errProfile } = await supabase
        .from('profiles')
        .update({ balance: updatedBalance, totalEarned: updatedEarned })
        .eq('id', owner.id)
        .select()
        .single();

      if (updatedProfile && !errProfile) {
        const mappedProfile = mapProfileFromDb(updatedProfile);
        setUsers(prev => prev.map(u => u.id === owner.id ? mappedProfile : u));

        if (user && user.id === owner.id) {
          setUser(mappedProfile);
          localStorage.setItem('ax_current_user', JSON.stringify(mappedProfile));
        }
      }
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      users,
      links,
      analytics,
      withdrawals,
      fraudLogs,
      systemLogs,
      permissions,
      settings,
      liveVisitors,
      login,
      register,
      logout,
      createShortUrl,
      deleteShortUrl,
      requestWithdrawal,
      approveWithdrawal,
      rejectWithdrawal,
      banUser,
      unbanUser,
      updateSettings,
      addFraudLog,
      addSystemLog,
      togglePermission,
      recordAdView,
      changeUserRole,
      triggerSimulatedClick,
      hasUserPermission
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
