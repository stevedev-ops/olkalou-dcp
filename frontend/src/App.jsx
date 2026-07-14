import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useSearchParams, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from "sonner";

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Members = lazy(() => import('./pages/Members'));
const Reports = lazy(() => import('./pages/Reports'));
const Admin = lazy(() => import('./pages/Admin'));
const Enrollment = lazy(() => import('./pages/Enrollment'));
const Login = lazy(() => import('./pages/Login'));
const PollingCoverage = lazy(() => import('./pages/PollingCoverage'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Gotv = lazy(() => import('./pages/Gotv'));
const Canvass = lazy(() => import('./pages/Canvass'));
const Transport = lazy(() => import('./pages/Transport'));
const PollingAgents = lazy(() => import('./pages/PollingAgents'));
const Pvt = lazy(() => import('./pages/Pvt'));
const SmsExport = lazy(() => import('./pages/SmsExport'));
const ContactMatcher = lazy(() => import('./pages/ContactMatcher'));
const Incidents = lazy(() => import('./pages/Incidents'));
const PhoneBank = lazy(() => import('./pages/PhoneBank'));
const SecurityDashboard = lazy(() => import('./pages/SecurityDashboard'));
const SecurityCommand = lazy(() => import('./pages/SecurityCommand'));
const CheatSheets = lazy(() => import('./pages/CheatSheets'));
import { api } from "./lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, BarChart3, Map, BookOpen, Truck,
  MessageSquare, Navigation, Trophy, UserPlus, LogOut, Menu, X, Shield, Megaphone,
  UserCog, ClipboardList, AlertTriangle, Phone, Link2
} from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";
import { useSync } from "./contexts/SyncContext";
import { CloudUpload } from "lucide-react";
import LanguageToggle from "./components/LanguageToggle";

// ── Sidebar nav definition ──────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    labelKey: "my_tools",
    items: [
      { to: "/dashboard",   icon: LayoutDashboard, labelKey: "nav_dashboard" },
      { to: "/members",     icon: Users,           labelKey: "nav_members" },
      { to: "/reports",     icon: BarChart3,       labelKey: "nav_reports" },
      { to: "/leaderboard", icon: Trophy,          labelKey: "nav_leaderboard" },
    ],
  },
  {
    labelKey: "field_ops",
    items: [
      { to: "/enroll",    icon: UserPlus,      labelKey: "nav_enroll" },
      { to: "/coverage",  icon: Map,           labelKey: "nav_coverage" },
      { to: "/canvass",   icon: BookOpen,      labelKey: "nav_canvass" },
      { to: "/transport", icon: Truck,         labelKey: "nav_boda" },
      { to: "/agents",    icon: UserCog,       labelKey: "nav_agents" },
      { to: "/tally",     icon: ClipboardList, labelKey: "nav_pvt" },
      { to: "/gotv",      icon: Navigation,    labelKey: "nav_gotv" },
      { to: "/training",  icon: BookOpen,      labelKey: "nav_training" },
    ],
  },
  {
    labelKey: "intelligence",
    items: [
      { to: "/security", icon: Shield, labelKey: "nav_security" },
      { to: "/security-command", icon: Shield, labelKey: "nav_sec_command" },
      { to: "/incidents", icon: AlertTriangle, labelKey: "nav_alerts" },
      { to: "/phonebank", icon: Phone,         labelKey: "nav_phonebank" },
      { to: "/matcher",   icon: Link2,         labelKey: "nav_matcher" },
      { to: "/sms",       icon: MessageSquare, labelKey: "nav_sms" },
    ],
  },
];

// ── Sidebar component ───────────────────────────────────────────────────────
function MemberSidebar({ profile, onLogout, isOpen, onClose }) {
  const { t } = useLanguage();
  const isSecurityOnly = profile?.is_security_only;
  
  const filteredNavGroups = NAV_GROUPS.filter(group => {
    if (isSecurityOnly) {
      return group.labelKey === 'intelligence';
    }
    return true;
  });

  return (
    <>
      {/* Dark overlay — mobile only */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.aside
            key="sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 shadow-xl flex flex-col"
          >
            {/* Logo header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center">
                  <span className="text-dcp-green font-black text-xs uppercase tracking-widest">DCP</span>
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{t('member_portal')}</p>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Ol Kalou</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-3">
              {filteredNavGroups.map(group => (
                <div key={group.labelKey}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 pt-5 pb-2">
                    {t(group.labelKey)}
                  </p>
                  {group.items.map(({ to, icon: Icon, labelKey }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all mb-0.5 ${
                          isActive
                            ? "bg-slate-950 text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon size={15} className={isActive ? "text-dcp-green" : ""} />
                          {t(labelKey)}
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            {/* User profile card */}
            <div className="p-3 border-t border-slate-100 shrink-0">
              <div className="bg-slate-900 text-white rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <LanguageToggle className="hidden sm:flex" />
                  <div className="w-8 h-8 bg-dcp-green text-white rounded-full flex items-center justify-center font-black">
                    {profile?.full_name?.charAt(0) || "M"}
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3 mt-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest truncate">
                      {profile?.full_name || (profile?.is_security_only || profile?.security_rank ? "Security Personnel" : "Mobilizer")}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase truncate">
                      {profile?.ward || "DCP Member"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-xs font-bold uppercase tracking-widest mb-2"
                >
                  <LogOut size={13} /> {t('sign_out')}
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "https://www.google.com/search?q=weather+in+nairobi";
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500 hover:bg-red-600 transition text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-red-500/20"
                >
                  <AlertTriangle size={13} /> {t('wipe_device')}
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Broadcast Banner ────────────────────────────────────────────────────────
function BroadcastBanner({ activeBroadcast }) {
  if (!activeBroadcast) return null;
  const isCritical = activeBroadcast.severity === 'critical';
  
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }} 
      animate={{ height: "auto", opacity: 1 }}
      className={`relative z-50 w-full p-4 border-b-4 flex items-start sm:items-center justify-center gap-3 shadow-2xl ${
        isCritical 
          ? "bg-red-600 border-red-800 text-white" 
          : "bg-amber-500 border-amber-700 text-slate-900"
      }`}
    >
      <div className={`p-2 rounded-full shrink-0 animate-pulse ${isCritical ? 'bg-red-800' : 'bg-amber-600'}`}>
        <Megaphone size={20} className={isCritical ? 'text-white' : 'text-slate-900'} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-0.5">
          HQ Emergency Broadcast
        </p>
        <p className="font-bold text-sm sm:text-base leading-tight">
          {activeBroadcast.message}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main App ────────────────────────────────────────────────────────────────

function GlobalSyncIndicator() {
  const { isSyncing, offlineCount } = useSync();
  if (!isSyncing && offlineCount === 0) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed top-2 right-2 md:top-4 md:right-4 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl border border-slate-700"
    >
      {isSyncing ? (
        <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : (
        <CloudUpload size={14} className="text-amber-400" />
      )}
      <span className="text-[10px] font-black uppercase tracking-widest">
        {isSyncing ? 'Syncing to HQ...' : `${offlineCount} Offline`}
      </span>
    </motion.div>
  );
}

function App() {
  const { t } = useLanguage();
  const [memberId, setMemberId] = useState(() => localStorage.getItem("dcp_member_id"));
  const [memberProfile, setMemberProfile] = useState(() => {
    const cached = localStorage.getItem("dcp_member_profile");
    try { return cached ? JSON.parse(cached) : null; } catch(e) { return null; }
  });
  const [profileLoading, setProfileLoading] = useState(!!localStorage.getItem("dcp_member_id"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isLanding  = location.pathname === "/";
  const isAdmin    = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login";
  const showMemberNav = memberId && !isAdmin && !isLanding && !isLoginPage;

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  // Poll for emergency broadcasts
  useEffect(() => {
    if (!memberId && !isAdmin) return; // Only poll if logged in
    const checkBroadcast = async () => {
      try {
        const { data } = await api.getBroadcast();
        if (data && data.is_active) {
          setActiveBroadcast(data);
        } else {
          setActiveBroadcast(null);
        }
      } catch (e) {
        // Ignore poll errors
      }
    };
    checkBroadcast();
    const interval = setInterval(checkBroadcast, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [memberId, isAdmin]);

  const loadMemberProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const { data, error } = await api.getMe();
      if (error) {
        if (error.message?.includes('Invalid token') || error.message?.includes('credentials were not provided')) handleLogout();
        throw new Error(error.message);
      }
      setMemberProfile(data || null);
      if (data) localStorage.setItem("dcp_member_profile", JSON.stringify(data));
    } catch (err) {
      console.error("Failed to load member profile:", err);
      // Do not clear the profile on network errors so the user stays logged in visually
      // setMemberProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (memberId) loadMemberProfile();
    else { setMemberProfile(null); setProfileLoading(false); }
  }, [memberId, loadMemberProfile]);

  const handleLogin = (id, token) => {
    localStorage.setItem("dcp_member_id", String(id));
    if (token) localStorage.setItem("dcp_token", token);
    setMemberId(String(id));
  };

  const handleLogout = () => {
    localStorage.removeItem("dcp_member_id");
    localStorage.removeItem("dcp_token");
    localStorage.removeItem("dcp_member_profile");
    setMemberId(null);
    setMemberProfile(null);
    navigate("/");
  };

  const authed = (el) => {
    if (profileLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-dcp-green border-t-transparent rounded-full animate-spin" />
            <span className="text-sm uppercase tracking-[0.3em]">Loading...</span>
          </div>
        </div>
      );
    }
    if (!memberId) return <Navigate to="/login" />;
    if (memberProfile?.is_admin) return <Navigate to="/admin" replace />;
    
    // If security only, prevent access to non-security routes by checking the current URL
    if (memberProfile?.is_security_only) {
       const allowedPaths = ['/security', '/incidents', '/phonebank', '/matcher', '/sms'];
       const currentPath = window.location.pathname;
       if (!allowedPaths.includes(currentPath)) {
          return <Navigate to="/security" replace />;
       }
    }
    
    return el;
  };

  const renderAdminRoute = () => {
    if (profileLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-dcp-green border-t-transparent rounded-full animate-spin" />
            <span className="text-sm uppercase tracking-[0.3em]">Checking privileges...</span>
          </div>
        </div>
      );
    }
    if (!memberId) return <Navigate to="/login" />;
    if (!memberProfile?.is_admin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="max-w-xl text-center space-y-4">
            <p className="text-xs uppercase tracking-[0.4em] text-red-400">Access Denied</p>
            <h2 className="text-2xl font-black">Your member record is not flagged as an administrator.</h2>
            <p className="text-sm text-slate-300">Contact HQ to have your profile elevated before accessing this area.</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 bg-white text-slate-900 font-black uppercase tracking-widest rounded-2xl"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return <Admin onLogout={handleLogout} />;
  };

  const currentPageLabel = NAV_GROUPS
    .flatMap(g => g.items)
    .find(i => i.to === location.pathname)?.labelKey || "member_portal";

  return (
    <div className={`min-h-screen w-full font-sans transition-colors duration-500 flex flex-col ${
      isAdmin || isLanding || isLoginPage ? 'bg-dcp-black text-white' : 'bg-slate-50 text-slate-900'
    }`}>
      <GlobalSyncIndicator />
      <Toaster position="top-center" richColors theme={isAdmin || isLanding || isLoginPage ? "dark" : "light"} />

      {/* Emergency Broadcast overrides everything at the top */}
      <BroadcastBanner activeBroadcast={activeBroadcast} />

      {/* Background glows for dark pages */}
      {(isAdmin || isLanding || isLoginPage) && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dcp-green/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-dcp-brown/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }} />
        </div>
      )}

      {/* Member sidebar */}
      {showMemberNav && (
        <MemberSidebar
          profile={memberProfile}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Slim top bar with hamburger — member pages only */}
      {showMemberNav && (
        <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm flex items-center px-4 gap-4">
          <button
            id="sidebar-toggle"
            onClick={() => setSidebarOpen(v => !v)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-slate-950 flex items-center justify-center">
              <span className="text-dcp-green font-black text-[8px] uppercase tracking-widest">DCP</span>
            </div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{t(currentPageLabel)}</p>
          </div>
        </header>
      )}

      {/* Page content */}
      <main className={`relative z-10 ${showMemberNav ? 'p-4 md:p-8 min-h-[calc(100vh-3.5rem)]' : ''}`}>
        <Suspense fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-dcp-green border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        }>
          <Routes>
            <Route path="/"           element={<Landing onLogin={handleLogin} referrerId={searchParams.get("ref")} inviteToken={searchParams.get("invite")} />} />
            <Route path="/login"      element={<Login onLogin={handleLogin} />} />
            <Route path="/dashboard"  element={authed(<Dashboard  memberId={memberId} onLogout={handleLogout} />)} />
            <Route path="/members"    element={authed(<Members    memberId={memberId} isAdmin={false} />)} />
            <Route path="/reports"    element={authed(<Reports    memberId={memberId} />)} />
            <Route path="/enroll"     element={authed(<Enrollment memberId={memberId} />)} />
            <Route path="/coverage"   element={authed(<PollingCoverage />)} />
            <Route path="/canvass"    element={authed(<Canvass    memberId={memberId} />)} />
            <Route path="/transport"  element={authed(<Transport  memberId={memberId} />)} />
            <Route path="/agents"     element={authed(<PollingAgents />)} />
            <Route path="/tally"      element={authed(<Pvt        memberId={memberId} />)} />
            <Route path="/incidents"  element={authed(<Incidents />)} />
            <Route path="/phonebank"  element={authed(<PhoneBank />)} />
            <Route path="/security"  element={authed(<SecurityDashboard profile={memberProfile} />)} />
            <Route path="/security-command"  element={authed(<SecurityCommand />)} />
            <Route path="/matcher"    element={authed(<ContactMatcher />)} />
            <Route path="/sms"        element={authed(<SmsExport />)} />
            <Route path="/leaderboard" element={authed(<Leaderboard memberId={memberId} />)} />
            <Route path="/gotv"       element={authed(<Gotv memberId={memberId} />)} />
            <Route path="/training"   element={authed(<CheatSheets />)} />
            <Route path="/admin"      element={renderAdminRoute()} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer — only on public (non-member, non-admin) pages */}
      {!isAdmin && !showMemberNav && (
        <footer className="relative z-10 py-12 border-t border-white/5 bg-black/40 backdrop-blur-sm text-center">
          <div className="max-w-4xl mx-auto px-6 space-y-4">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">&copy; 2026 Democracy for Citizens Party (DCP)</p>
            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed">Building a movement for accountability in Ol Kalou and across Kenya.</p>
            <div className="flex justify-center gap-6 pt-4">
              <a href="#" className="text-[10px] font-bold text-gray-500 hover:text-dcp-green transition-colors uppercase tracking-widest">Privacy</a>
              <a href="#" className="text-[10px] font-bold text-gray-500 hover:text-dcp-green transition-colors uppercase tracking-widest">Terms</a>
              <a href="#" className="text-[10px] font-bold text-gray-500 hover:text-dcp-green transition-colors uppercase tracking-widest">Contact</a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
