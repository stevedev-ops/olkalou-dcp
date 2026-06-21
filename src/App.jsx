import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useSearchParams, NavLink, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from "sonner";
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Reports from './pages/Reports';
import Admin from './pages/Admin';
import Enrollment from './pages/Enrollment';
import Login from './pages/Login';
import PollingCoverage from './pages/PollingCoverage';
import Leaderboard from './pages/Leaderboard';
import Gotv from './pages/Gotv';
import Canvass from './pages/Canvass';
import Transport from './pages/Transport';
import PollingAgents from './pages/PollingAgents';
import Pvt from './pages/Pvt';
import SmsExport from './pages/SmsExport';
import ContactMatcher from './pages/ContactMatcher';
import Incidents from './pages/Incidents';
import PhoneBank from './pages/PhoneBank';
import { api } from "./lib/api";

function App() {
  const [memberId, setMemberId] = useState(() => localStorage.getItem("dcp_member_id"));
  const [memberProfile, setMemberProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(!!localStorage.getItem("dcp_member_id"));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isLanding = location.pathname === "/";
  const isAdmin = location.pathname.startsWith("/admin");
  const isLoginPage = location.pathname === "/login";

  const showMemberNav = memberId && !isAdmin && !isLanding && !isLoginPage;

  const loadMemberProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const { data, error } = await api.getMe();

      if (error) {
        // If 401, token might be invalid
        if (error.message?.includes('Invalid token')) {
          handleLogout();
        }
        throw new Error(error.message);
      }
      
      const member = data;
      setMemberProfile(member || null);
    } catch (error) {
      console.error("Failed to load member profile:", error);
      setMemberProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    if (memberId) {
      loadMemberProfile();
    } else {
      setMemberProfile(null);
      setProfileLoading(false);
    }
  }, [memberId, loadMemberProfile]);

  const handleLogin = (id, token) => {
    localStorage.setItem("dcp_member_id", String(id));
    if (token) localStorage.setItem("dcp_token", token);
    setMemberId(String(id));
  };

  const handleLogout = () => {
    localStorage.removeItem("dcp_member_id");
    localStorage.removeItem("dcp_token");
    setMemberId(null);
    setMemberProfile(null);
    navigate("/");
  };

  // Helper: wraps protected routes with auth + loading guard
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
            <p className="text-sm text-slate-300">
              Contact HQ to have your profile elevated before accessing this area.
            </p>
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

  return (
    <div className={`flex flex-col min-h-screen w-full relative overflow-x-hidden font-sans transition-colors duration-500 ${isAdmin || isLanding || isLoginPage ? 'bg-dcp-black text-white' : 'bg-slate-50 text-slate-900'}`}>
      <Toaster position="top-center" richColors theme={isAdmin || isLanding || isLoginPage ? "dark" : "light"} />

      {showMemberNav && (
        <header className="relative z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-2xl bg-dcp-green/10 border border-dcp-green/20 flex items-center justify-center text-dcp-green font-black uppercase">
                DCP
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Member Control Center</p>
                <p className="font-black text-sm">View everything from one dashboard</p>
              </div>
            </div>
            <nav className="flex flex-wrap items-center gap-2">
              <NavLink to="/dashboard" className={({ isActive }) => `rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Dashboard</NavLink>
              <NavLink to="/members" className={({ isActive }) => `rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Members</NavLink>
              <NavLink to="/reports" className={({ isActive }) => `rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Reports</NavLink>
              <NavLink to="/coverage" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Coverage</NavLink>
              <NavLink to="/canvass" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Panna</NavLink>
              <NavLink to="/transport" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-amber-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Boda</NavLink>
              <NavLink to="/agents" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Agents</NavLink>
              <NavLink to="/tally" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>PVT</NavLink>
              <NavLink to="/incidents" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-red-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Alerts</NavLink>
              <NavLink to="/phonebank" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Calls</NavLink>
              <NavLink to="/matcher" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Match</NavLink>
              <NavLink to="/sms" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>SMS</NavLink>
              <NavLink to="/leaderboard" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>🏆</NavLink>
              <NavLink to="/gotv" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-red-500 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>📍 GOTV</NavLink>
              <NavLink to="/enroll" className={({ isActive }) => `rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${isActive ? 'bg-dcp-green text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>Enroll</NavLink>
              <button
                onClick={handleLogout}
                className="rounded-2xl px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] bg-slate-100 text-slate-950 hover:bg-slate-200 transition"
              >
                Logout
              </button>
            </nav>
          </div>
        </header>
      )}

      {(isAdmin || isLanding || isLoginPage) && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dcp-green/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-dcp-brown/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        </div>
      )}

      <main className={`flex-1 relative z-10 ${!isAdmin ? 'pb-20 pt-6 md:pt-10' : ''}`}>
        <Routes>
          <Route path="/" element={<Landing onLogin={handleLogin} referrerId={searchParams.get("ref")} inviteToken={searchParams.get("invite")} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/dashboard" element={authed(<Dashboard memberId={memberId} onLogout={handleLogout} />)} />
          <Route path="/members" element={authed(<Members memberId={memberId} isAdmin={false} />)} />
          <Route path="/reports" element={authed(<Reports memberId={memberId} />)} />
          <Route path="/enroll" element={authed(<Enrollment memberId={memberId} />)} />
          <Route path="/coverage" element={authed(<PollingCoverage />)} />
          <Route path="/canvass" element={authed(<Canvass memberId={memberId} />)} />
          <Route path="/transport" element={authed(<Transport memberId={memberId} />)} />
          <Route path="/agents" element={authed(<PollingAgents />)} />
          <Route path="/tally" element={authed(<Pvt memberId={memberId} />)} />
          <Route path="/incidents" element={authed(<Incidents />)} />
          <Route path="/phonebank" element={authed(<PhoneBank />)} />
          <Route path="/matcher" element={authed(<ContactMatcher />)} />
          <Route path="/sms" element={authed(<SmsExport />)} />
          <Route path="/leaderboard" element={authed(<Leaderboard memberId={memberId} />)} />
          <Route path="/gotv" element={authed(<Gotv memberId={memberId} />)} />
          <Route path="/admin" element={renderAdminRoute()} />
        </Routes>
      </main>

      {!isAdmin && (
        <footer className="relative z-10 py-12 border-t border-white/5 bg-black/40 backdrop-blur-sm text-center mt-auto">
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
