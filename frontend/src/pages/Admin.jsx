import { useState, useEffect, useCallback } from "react";
import { Users, Star, Network, Database, ShieldCheck, MapPin, Search, Menu, X, CheckCircle2, ChevronRight, ChevronDown, Plus, Download, User, Smartphone, Hash, LayoutDashboard, BarChart3, LogOut, UserCheck, Mail, BookOpen, Truck, UserCog, ClipboardList, AlertTriangle, Phone, Link2, MessageSquare, Navigation, Trophy, UserPlus, Calendar, Megaphone, Loader2, BrainCircuit, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm";
import VoterLookup from "../components/VoterLookup";
import logo from "../assets/logo.png";
import { getChildrenById } from "../lib/memberCache";
import Reports from "./Reports";
import PollingCoverage from "./PollingCoverage";
import Canvass from "./Canvass";
import Transport from "./Transport";
import PollingAgents from "./PollingAgents";
import Pvt from "./Pvt";
import Incidents from "./Incidents";
import SecurityCommand from "./SecurityCommand";
import PhoneBank from "./PhoneBank";
import ContactMatcher from "./ContactMatcher";
import { exportToCSV } from "../lib/exportUtils";
import SmsExport from "./SmsExport";
import Gotv from "./Gotv";
import Leaderboard from "./Leaderboard";
import Enrollment from "./Enrollment";
import Events from "./Events";
import CheatSheets from "./CheatSheets";
import { useLanguage } from "../contexts/LanguageContext";

const PAGE_SIZE = 20;

// ─── Tier helper ─────────────────────────────────────────────────────────────
const TIER_MAP = [
  { min: 1,  max: 5,  name: "Bronze",   color: "text-amber-600",  bg: "bg-amber-100"  },
  { min: 6,  max: 10, name: "Silver",   color: "text-slate-500",  bg: "bg-slate-100"  },
  { min: 11, max: 15, name: "Gold",     color: "text-yellow-600", bg: "bg-yellow-100" },
  { min: 16, max: 20, name: "Platinum", color: "text-cyan-600",   bg: "bg-cyan-100"   },
  { min: 21, max: 25, name: "Diamond",  color: "text-blue-600",   bg: "bg-blue-100"   },
];
function getTierBadge(count) {
  if (!count) return null;
  const tier = TIER_MAP.find(t => count >= t.min && count <= t.max)
    || (count > 25 ? TIER_MAP[4] : null);
  return tier;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
    <div className="text-slate-500 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-black text-white truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const LineageCard = ({ label, title, subtitle, badge, meta }) => (
  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-black/40 transition-colors">
    <div className="flex justify-between items-start mb-3">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      {badge && <span className="px-2 py-0.5 rounded shadow-sm text-[9px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/10">{badge}</span>}
    </div>
    <div>
      <h4 className="text-sm font-black text-white leading-tight truncate">{title}</h4>
      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest truncate">{subtitle}</p>
      {meta && <p className="text-[9px] text-dcp-green mt-2 font-bold uppercase tracking-widest">{meta}</p>}
    </div>
  </div>
);

const NavItem = ({ id, icon: Icon, label, count, activeTab, setActiveTab }) => (
  <button 
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
      activeTab === id 
        ? 'bg-slate-950 text-white shadow-md' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={activeTab === id ? 'text-dcp-green' : ''} />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-[10px] px-2 py-1 rounded-md font-black ${
        activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const TreeNode = ({ member, depth = 0, onSelectMember }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);

  useEffect(() => {
    getChildrenById(member.id).then(ch => setChildrenCount(ch.length));
  }, [member.id]);

  const toggleExpand = async () => {
    if (!isExpanded) {
      if (children.length === 0) {
        setLoading(true);
        const fetchedChildren = await getChildrenById(member.id);
        setChildren(fetchedChildren);
        setLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const isRoot = !member.referred_by;
  const maxQuota = isRoot ? 25 : 5;
  const isFull = childrenCount >= maxQuota;

  return (
    <div className="w-full">
      <div 
        className={`flex items-center group py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${depth === 0 ? 'bg-white border mb-2 shadow-sm' : ''}`}
        style={{ paddingLeft: `${depth * 28 + 12}px` }}
      >
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          {childrenCount > 0 ? (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleExpand(); }}
              className="p-1 hover:bg-slate-200 rounded text-slate-500"
            >
              {loading ? (
                <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          ) : (
            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-2" />
          )}
        </div>

        <div 
          className="flex-1 flex items-center gap-3 overflow-hidden"
          onClick={() => onSelectMember(member)}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isRoot ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
            {isRoot ? <Star size={14} /> : <User size={14} />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">{member.full_name}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
              {member.ward} · {member.polling_station}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <span className={`text-xs font-black ${isFull ? 'text-dcp-green' : 'text-slate-600'}`}>
              {childrenCount} <span className="text-slate-400 font-bold">/ {maxQuota}</span>
            </span>
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isExpanded && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-l border-slate-200 ml-7"
          >
            {children.map(child => (
              <TreeNode 
                key={child.id} 
                member={child} 
                depth={depth + 1} 
                onSelectMember={onSelectMember}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Admin({ onLogout }) {
  const { t } = useLanguage();
  const handlePanicWipe = () => {
    localStorage.clear();
    window.location.href = "https://www.google.com/search?q=weather+in+nairobi";
  };
  const navigate = useNavigate();

  // Primary State
  const [activeTab, setActiveTab] = useState("overview");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [wardInsights, setWardInsights] = useState([]);

  // Emergency Broadcast State
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState("critical");
  const [broadcastTargetType, setBroadcastTargetType] = useState("global");
  const { wardStationMap } = useLocationData();
  const [broadcastTargetWards, setBroadcastTargetWards] = useState([]);
  const [broadcastTargetStations, setBroadcastTargetStations] = useState([]);
  const [broadcastTargetMembers, setBroadcastTargetMembers] = useState([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalStep, setAddModalStep] = useState('lookup');
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Sidebar Notification Counts
  const [transportCount, setTransportCount] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [transRes, incRes] = await Promise.all([
          api.getTransport(),
          api.getIncidents()
        ]);
        if (transRes.data) {
          setTransportCount(transRes.data.filter(t => t.status === 'pending').length);
        }
        if (incRes.data) {
          setIncidentCount(incRes.data.filter(i => i.status !== 'resolved').length);
        }
      } catch (err) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);
  const [addModalPrefill, setAddModalPrefill] = useState(null);
  const [addModalVoter, setAddModalVoter] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  // Global System Stats
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [totalRoots, setTotalRoots] = useState(0);
  const [verifiedVoters, setVerifiedVoters] = useState(0);
  const [unverifiedNew, setUnverifiedNew] = useState(0);
  const [dbStatus, setDbStatus] = useState("checking"); // "checking" | "online" | "error"

  // Pagination & Data States for Roots
  const [roots, setRoots] = useState([]);
  const [rootPage, setRootPage] = useState(0);
  const [hasMoreRoots, setHasMoreRoots] = useState(true);
  const [loadingMoreRoots, setLoadingMoreRoots] = useState(false);
  
  // Pagination & Data States for All Members
  const [allMembers, setAllMembers] = useState([]);
  const [memberPage, setMemberPage] = useState(0);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  const [voterStatusFilter, setVoterStatusFilter] = useState("all"); // "all" | "verified" | "unverified"
  const [memberSort, setMemberSort] = useState("id"); // "id" | "voter_status"

  // Voter Registry States
  const [voterRecords, setVoterRecords] = useState([]);
  const [voterPage, setVoterPage] = useState(0);
  const [hasMoreVoters, setHasMoreVoters] = useState(true);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [voterSearch, setVoterSearch] = useState("");

  // Overview extras
  const [recentMembers, setRecentMembers] = useState([]);
  const [wardSnapshot, setWardSnapshot] = useState([]);

  const loadOverviewData = useCallback(async () => {
    try {
      const { data: allData } = await api.getMembers({});
      const list = Array.isArray(allData) ? allData : (allData?.results || []);
      const filteredList = list.filter(m => !m.is_admin && !m.is_staff);
      const recent = filteredList.slice(0, 6);
      setRecentMembers(recent);
      const map = {};
      filteredList.forEach(m => { const w = m.ward || 'Unknown'; map[w] = (map[w] || 0) + 1; });
      const sorted = Object.entries(map).map(([ward, count]) => ({ ward, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      setWardSnapshot(sorted);
    } catch (e) { console.error('Overview data error:', e); }
  }, []);

  // Selected Member Analytics
  const [selectedMemberDirectCount, setSelectedMemberDirectCount] = useState(0);
  const [selectedMemberNetworkSize, setSelectedMemberNetworkSize] = useState(0);
  const [selectedMemberLineage, setSelectedMemberLineage] = useState([]);

  // Fetch Total Registrations + Root Count + DB Health
  const loadTotalRegistered = useCallback(async () => {
    try {
      const { data: stats, error } = await api.getStats();
      if (error) throw new Error("Query failed");
      setTotalRegistered(stats.total_registered);
      setTotalRoots(stats.total_roots);
      setVerifiedVoters(stats.verified_voters || 0);
      setUnverifiedNew(stats.unverified_new || 0);
      setDbStatus("online");
    } catch (e) {
      console.error("Stats count error:", e);
      setDbStatus("error");
    }
  }, []);

  // Fetch Roots Page
  const loadRootPage = useCallback(async (pageIdx, q = "") => {
    setLoadingMoreRoots(true);
    try {
      const { data, error } = await api.getMembers({ 
        referred_by: 'null', 
        search: q,
        page: pageIdx + 1
      });
      if (error) {
        if (error.message?.includes('401') || error.message?.includes('403')) {
          navigate('/');
        }
        throw error;
      }
      if (data) {
        const members = (data.results || []).filter(m => !m.is_admin && !m.is_staff);
        if (pageIdx === 0) setRoots(members);
        else setRoots(prev => [...prev, ...members]);
        setHasMoreRoots(!!data.next);
        setRootPage(pageIdx);
      }
    } catch (err) { console.error(err); toast.error("Error loading mobilizers"); }
    finally { setLoadingMoreRoots(false); }
  }, [navigate]);

  // Fetch Members Page
  const loadMembersPage = useCallback(async (pageIdx, q = "", voterStatus = "all") => {
    setLoadingMoreMembers(true);
    try {
      const params = { 
        search: q,
        page: pageIdx + 1,
        sort: memberSort === "voter_status" ? "voter_status" : undefined
      };
      if (voterStatus !== "all") {
        params.voter_status = voterStatus;
      }

      const { data, error } = await api.getMembers(params);
      if (error) {
        if (error.message?.includes('401') || error.message?.includes('403')) {
          navigate('/');
        }
        throw error;
      }
      if (data) {
        const members = (data.results || []).filter(m => !m.is_admin && !m.is_staff);
        if (pageIdx === 0) setAllMembers(members);
        else setAllMembers(prev => [...prev, ...members]);
        setHasMoreMembers(!!data.next);
        setMemberPage(pageIdx);
      }
    } catch (err) { console.error(err); toast.error("Error loading recruits"); }
    finally { setLoadingMoreMembers(false); }
  }, [navigate, memberSort]);


  const loadWardInsights = useCallback(async () => {
    try {
      setLoadingInsights(true);
      const { data } = await api.getWardHealthInsights();
      if (data && data.insights) setWardInsights(data.insights);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "mobilizers") {
        loadRootPage(0, searchQuery);
      } else if (activeTab === "all") {
        loadMembersPage(0, searchQuery, voterStatusFilter);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, voterStatusFilter, activeTab, loadRootPage, loadMembersPage]);


  // Fetch Voter Records
  const loadVoterRecordsPage = useCallback(async (pageIdx, q = "") => {
    setLoadingVoters(true);
    try {
      const { data, error } = await api.getVoterRecords({ 
        search: q,
        page: pageIdx + 1
      });
      if (data) {
        if (pageIdx === 0) setVoterRecords(data.results || []);
        else setVoterRecords(prev => [...prev, ...(data.results || [])]);
        setHasMoreVoters(!!data.next);
        setVoterPage(pageIdx);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingVoters(false); }
  }, []);

  const loadBroadcast = useCallback(async () => {
    try {
      const { data } = await api.getBroadcast();
      if (data && data.is_active) setActiveBroadcast(data);
      else setActiveBroadcast(null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    loadTotalRegistered();
    loadRootPage(0, "");
    loadMembersPage(0, "", voterStatusFilter);
    loadOverviewData();
    loadBroadcast();
    
    api.getMe().then(({ data }) => {
      if (data) setCurrentUser(data);
    });
  }, [loadTotalRegistered, loadRootPage, loadMembersPage, loadOverviewData, loadBroadcast]);

  const handleSetBroadcast = async () => {
    if (!broadcastText.trim()) {
      toast.error("Message is required.");
      return;
    }
    setIsBroadcasting(true);
    try {
      const { data, error } = await api.adminCreateBroadcast({
        message: broadcastText,
        severity: broadcastSeverity,
        target_type: broadcastTargetType,
        target_wards: broadcastTargetWards,
        target_polling_stations: broadcastTargetStations,
        target_member_ids: broadcastTargetMembers.map(m => m.id)
      });
      if (error) throw error;
      setActiveBroadcast(data);
      setBroadcastText("");
      setBroadcastTargetMembers([]);
      setBroadcastTargetWards([]);
      setBroadcastTargetStations([]);
      toast.success("Targeted Emergency Broadcast sent!");
    } catch (err) {
      toast.error(err.message || "Failed to send broadcast");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleClearBroadcast = async () => {
    setIsBroadcasting(true);
    try {
      const { error } = await api.adminClearBroadcast();
      if (error) throw error;
      setActiveBroadcast(null);
      toast.success("Broadcast cleared.");
    } catch (err) {
      toast.error("Failed to clear broadcast");
    } finally {
      setIsBroadcasting(false);
    }
  };

  useEffect(() => {
    if (activeTab === "voter-registry") {
      const timer = setTimeout(() => {
        loadVoterRecordsPage(0, voterSearch);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab, voterSearch, loadVoterRecordsPage]);

  // Deep Network Analytics logic
  const computeNetworkStats = useCallback(async (memberId) => {
    let directCount = 0;
    let totalNetwork = 0;
    try {
      const directs = await getChildrenById(memberId);
      directCount = directs.length;
      totalNetwork += directs.length;
      
      let processing = [...directs];
      let depthLimit = 1;
      while (processing.length > 0 && depthLimit < 6) {
        let nxt = [];
        for (let p of processing) {
          const ch = await getChildrenById(p.id);
          totalNetwork += ch.length;
          nxt.push(...ch);
        }
        processing = nxt;
        depthLimit++;
      }
    } catch (err) { console.error(err); }
    return { directCount, totalNetwork };
  }, []);

  const buildLineage = useCallback(async (memberId) => {
    try {
      const { data: insights } = await api.getInsights(memberId);
      return insights?.lineage || [];
    } catch (err) { console.error(err); return []; }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (selectedMember) {
      setSelectedMemberNetworkSize(0);
      setSelectedMemberDirectCount(0);
      setSelectedMemberLineage([]);
      (async () => {
        const stats = await computeNetworkStats(selectedMember.id);
        const lineage = await buildLineage(selectedMember.id);
        if (!cancelled) {
          setSelectedMemberDirectCount(stats.directCount);
          setSelectedMemberNetworkSize(stats.totalNetwork);
          setSelectedMemberLineage(lineage);
        }
      })();
    }
    return () => { cancelled = true; };
  }, [selectedMember, computeNetworkStats, buildLineage]);

  const handlePromoteToRoot = async () => {
    if (!selectedMember || !selectedMember.referred_by) return;
    if (!window.confirm(`Are you sure you want to promote ${selectedMember.full_name} to a Root Mobilizer? They will be detached from their current referrer.`)) return;

    try {
      const { data, error } = await api.updateMember(selectedMember.id, { referred_by: null });
      if (error) throw new Error(error.message || "Failed to promote");
      
      toast.success(`${selectedMember.full_name} is now a Root Mobilizer!`);
      setSelectedMember(null);
      loadRootPage(0, searchQuery);
      loadMembersPage(0, searchQuery, voterStatusFilter);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const directInviter = selectedMemberLineage.length > 1 ? selectedMemberLineage[selectedMemberLineage.length - 2] : null;
  const topMobilizer = selectedMemberLineage.length > 0 ? selectedMemberLineage[0] : null;
  const selectedMemberTier = selectedMemberLineage.length;
  const selectedMemberDepth = selectedMemberTier - 1;

  const getTierValue = (member) => {
    if (!member) return 0;
    const idx = selectedMemberLineage.findIndex(m => m.id === member.id);
    return idx + 1;
  };

  const generateInviteToken = async () => {
    setIsGeneratingInvite(true);
    try {
      const { data, error } = await api.createInvite({ target_role: 'root' });
      
      if (error) throw error;
      if (data) {
        const url = `${window.location.origin}/?invite=${data.id}`;
        setGeneratedInvite(url);
        toast.custom((t) => (
          <div className="bg-slate-900 border border-amber-400/30 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[320px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">One-Time Invite Generated</p>
            <p className="text-white text-xs font-mono break-all bg-white/5 p-2 rounded-lg">{url}</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.dismiss(t);
                toast.success("Invite link copied!");
              }}
              className="bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-300 transition-colors"
            >
              Copy & Close
            </button>
          </div>
        ), { duration: 6000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invite token");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex w-full">
      <AnimatePresence initial={false}>
         {isSidebarOpen && (
            <motion.div 
               initial={{ x: -300 }}
               animate={{ x: 0 }}
               exit={{ x: -300 }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               className="w-72 bg-white border-r border-slate-200 shadow-sm z-30 flex flex-col fixed inset-y-0 left-0"
            >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="bg-slate-100 p-2 rounded-xl">
                        <img src={logo} alt="DCP" className="w-10 h-10 object-contain mix-blend-multiply" />
                     </div>
                     <div>
                        <h2 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">HQ Admin</h2>
                        <span className="text-[9px] text-dcp-green font-bold uppercase tracking-[0.2em] mt-1 block">Command Center</span>
                     </div>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                     <X size={18} />
                  </button>
               </div>
               <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 py-2 mt-2">Dashboard</p>
                  <NavItem id="overview" icon={LayoutDashboard} label="Overview" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 pt-6 pb-2">Network</p>
                  <NavItem id="tree" icon={Network} label="Hierarchy" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="mobilizers" icon={Star} label="Mobilizers" count={roots.length} activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="all" icon={Users} label="All Members" count={totalRegistered} activeTab={activeTab} setActiveTab={setActiveTab} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 pt-6 pb-2">Intelligence</p>
                  <NavItem id="security-command" icon={ShieldCheck} label="HQ Security Command" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="voter-registry" icon={Database} label="Voter Registry" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="analytics" icon={BarChart3} label="System Analytics" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 pt-6 pb-2">Operations</p>
                  <NavItem id="coverage" icon={MapPin} label="Coverage" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="canvass" icon={BookOpen} label="Panna (Canvass)" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="transport" icon={Truck} label="Boda Transport" count={transportCount > 0 ? transportCount : undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="agents" icon={UserCog} label="Polling Agents" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="tally" icon={ClipboardList} label="PVT Tally" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="incidents" icon={AlertTriangle} label="Alerts" count={incidentCount > 0 ? incidentCount : undefined} activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="phonebank" icon={Phone} label="Phone Bank" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="matcher" icon={Link2} label="Contact Matcher" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="sms" icon={MessageSquare} label="SMS Export" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="events" icon={Calendar} label="Rally Check-ins" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="gotv" icon={Navigation} label="GOTV" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="leaderboard" icon={Trophy} label="Leaderboard" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="enroll" icon={UserPlus} label="Enroll Member" activeTab={activeTab} setActiveTab={setActiveTab} />
                  <NavItem id="training" icon={BookOpen} label="Training Materials" activeTab={activeTab} setActiveTab={setActiveTab} />
               </div>
               <div className="p-4 border-t border-slate-100">
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-dcp-green/20 border border-dcp-green/30 flex items-center justify-center">
                           <ShieldCheck size={14} className="text-dcp-green" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">{currentUser?.full_name || 'System Admin'}</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{currentUser?.is_admin ? 'HQ Administrator' : 'Mobilizer'}</p>
                        </div>
                     </div>
                     <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-widest mt-2">
                        <LogOut size={14} /> Sign Out
                     </button>
                     <button onClick={handlePanicWipe} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 transition-colors text-xs font-black uppercase tracking-widest mt-2 shadow-lg shadow-red-500/20">
                        <AlertTriangle size={14} /> {t('wipe_device')}
                     </button>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all bg-slate-50/50 ${isSidebarOpen ? 'ml-72' : ''}`}>
        <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-20 w-full">
         <div className="flex items-center gap-4">
            {!isSidebarOpen && (
               <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shadow-sm transition-colors">
                  <Menu size={18} />
               </button>
            )}
            <div>
               <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest">
                  {activeTab === 'overview' && 'System Overview'}
                  {activeTab === 'tree' && 'Mobilization Tree'}
                  {activeTab === 'mobilizers' && 'Root Directory'}
                  {activeTab === 'all' && 'Membership Registry'}
                  {activeTab === 'security-command' && 'HQ Security Command'}
                  {activeTab === 'voter-registry' && '2022 Official Voter Database'}
                  {activeTab === 'analytics' && 'Official Party Reports'}
                  {activeTab === 'coverage' && 'Polling Coverage Map'}
                  {activeTab === 'canvass' && 'Panna Canvass Management'}
                  {activeTab === 'transport' && 'Boda Transport Management'}
                  {activeTab === 'agents' && 'Polling Agent Management'}
                  {activeTab === 'tally' && 'PVT Parallel Vote Tally'}
                  {activeTab === 'incidents' && 'Alerts & Incident Reports'}
                  {activeTab === 'phonebank' && 'Phone Bank Operations'}
                  {activeTab === 'matcher' && 'Relational Contact Matcher'}
                  {activeTab === 'sms' && 'SMS Export'}
                  {activeTab === 'events' && 'Rally & Event Check-ins'}
                  {activeTab === 'gotv' && 'GOTV — Get Out The Vote'}
                  {activeTab === 'leaderboard' && 'Mobilizer Leaderboard'}
                  {activeTab === 'enroll' && 'Enroll New Member'}
                  {activeTab === 'training' && 'Printable Training Materials'}
               </h1>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-dcp-green animate-pulse"></span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{totalRegistered} Recruits Synced</p>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-2 hidden sm:flex">
           <button onClick={() => { setShowSecurityModal(true); }} className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] items-center gap-2 hover:bg-slate-700 transition-colors shadow-lg flex">
              <ShieldCheck size={14} className="text-blue-400" /> Deploy Security
           </button>
           <button onClick={() => { setShowAddModal(true); setAddModalStep('lookup'); setAddModalPrefill(null); }} className="bg-slate-950 text-white px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg flex">
              <Plus size={16} className="text-dcp-green" /> Establish Root
           </button>
         </div>
        </header>

        <main className="flex-1 p-4 md:p-8 relative flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col w-full">
            {activeTab === "security-command" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-6xl mx-auto">
                <SecurityCommand />
              </div>
            ) : activeTab === "overview" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]"><Users size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Members</p>
                    <p className="text-4xl font-black text-slate-900">{totalRegistered.toLocaleString()}</p>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Verified Voters</span><span>Unverified</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          className="h-full bg-dcp-green transition-all duration-700"
                          style={{ width: totalRegistered > 0 ? `${Math.round((verifiedVoters / totalRegistered) * 100)}%` : '0%' }}
                        />
                        <div className="h-full flex-1 bg-amber-400/40" />
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-slate-500">
                        <span>{verifiedVoters}</span>
                        <span>{unverifiedNew}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]"><Star size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Root Mobilizers</p>
                    <p className="text-4xl font-black text-slate-900">{totalRoots}</p>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Network Capacity</span>
                        <span>{(totalRoots * 25).toLocaleString()} slots</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-700"
                          style={{ width: totalRoots > 0 ? `${Math.min(100, Math.round(((totalRegistered - totalRoots) / (totalRoots * 25)) * 100))}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {totalRoots > 0 ? Math.min(100, Math.round(((totalRegistered - totalRoots) / (totalRoots * 25)) * 100)) : 0}% capacity used
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]"><Network size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Avg. Recruits / Root</p>
                    <div className="flex items-end gap-1.5">
                      <p className="text-4xl font-black text-slate-900">
                        {totalRoots > 0 ? (((totalRegistered - totalRoots) / totalRoots)).toFixed(1) : '0.0'}
                      </p>
                      <p className="text-base font-black text-slate-300 mb-1">/ 25</p>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-dcp-green transition-all duration-700"
                          style={{ width: totalRoots > 0 ? `${Math.min(100, Math.round((((totalRegistered - totalRoots) / totalRoots) / 25) * 100))}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {totalRoots > 0 ? Math.round(25 - (totalRegistered - totalRoots) / totalRoots) : 25} slots avg. remaining
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 shadow-lg flex flex-col justify-between items-start">
                    <div className="w-full">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">System Health</p>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${dbStatus === 'online' ? 'bg-dcp-green/20 border-dcp-green/30' : dbStatus === 'error' ? 'bg-red-500/20 border-red-500/30' : 'bg-slate-700 border-slate-600'}`}>
                          <Database size={20} className={dbStatus === 'online' ? 'text-dcp-green' : dbStatus === 'error' ? 'text-red-400' : 'text-slate-400'} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">
                            {dbStatus === 'online' ? 'Operational' : dbStatus === 'error' ? 'Degraded' : 'Connecting...'}
                          </p>
                          <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-widest ${dbStatus === 'online' ? 'text-dcp-green' : dbStatus === 'error' ? 'text-red-400' : 'text-slate-500'}`}>
                            {dbStatus === 'online' ? 'Real-time sync' : dbStatus === 'error' ? 'Check connection' : 'Please wait'}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-slate-800 pt-3 flex flex-col gap-2 w-full">
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Verified Voters</p>
                          <p className="text-sm font-black text-dcp-green">{verifiedVoters.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">New Registrants</p>
                          <p className="text-sm font-black text-amber-400">{unverifiedNew.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                
                {/* AI Ward Health Insights */}
                <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <BrainCircuit size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Algorithmic AI</p>
                      <h3 className="font-black text-white text-base uppercase tracking-widest">Predictive Ward Health</h3>
                    </div>
                  </div>
                  
                  {loadingInsights ? (
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : wardInsights.length === 0 ? (
                    <div className="bg-dcp-green/10 border border-dcp-green/20 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-dcp-green/20 text-dcp-green flex items-center justify-center shrink-0">
                        <Activity size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">All Wards Optimal</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                          No significant drops in mobilization velocity detected across the system over the last 48 hours. The network is growing steadily.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {wardInsights.map((insight, idx) => (
                        <div key={idx} className={`rounded-2xl p-4 flex items-start gap-4 border ${insight.type === 'warning' ? 'bg-red-500/10 border-red-500/20' : 'bg-dcp-green/10 border-dcp-green/20'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${insight.type === 'warning' ? 'bg-red-500/20 text-red-400' : 'bg-dcp-green/20 text-dcp-green'}`}>
                            <Activity size={16} />
                          </div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${insight.type === 'warning' ? 'text-red-400' : 'text-dcp-green'}`}>
                              {insight.type === 'warning' ? 'Velocity Warning' : 'Growth Trend'}
                            </p>
                            <p className="text-xs font-bold text-slate-300 leading-relaxed">
                              {insight.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Emergency Command Center */}
                <div className={`rounded-3xl border ${activeBroadcast ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'} p-6 shadow-sm`}>
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeBroadcast ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Override</p>
                      <h3 className="font-black text-slate-900 text-base uppercase tracking-widest">Emergency Broadcast</h3>
                    </div>
                  </div>
                  
                  {activeBroadcast ? (
                    <div className="space-y-4">
                      <div className="bg-red-600 text-white p-4 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Active Alert</p>
                        <p className="font-bold">{activeBroadcast.message}</p>
                      </div>
                      <button 
                        onClick={handleClearBroadcast}
                        disabled={isBroadcasting}
                        className="w-full bg-white border-2 border-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-slate-50 transition"
                      >
                        {isBroadcasting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Clear Global Alert"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        placeholder="Type emergency alert message..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold resize-none focus:outline-none focus:border-red-400 focus:bg-white transition"
                        rows="3"
                      />
                      <div className="flex flex-col gap-3 border-t border-slate-100 pt-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select 
                            value={broadcastSeverity}
                            onChange={(e) => setBroadcastSeverity(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none flex-1"
                          >
                            <option value="critical">Severity: Critical (Red)</option>
                            <option value="warning">Severity: Warning (Yellow)</option>
                          </select>
                          <select 
                            value={broadcastTargetType}
                            onChange={(e) => setBroadcastTargetType(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none flex-1"
                          >
                            <option value="global">Target: Global (Everyone)</option>
                            <option value="ward">Target: Specific Wards</option>
                            <option value="specific_people">Target: Specific People</option>
                          </select>
                        </div>
                        
                        {broadcastTargetType === 'ward' && (
                          <div className="flex flex-col gap-3 border border-slate-200 rounded-xl p-4 bg-white">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Select Target Wards</p>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                               {Object.keys(wardStationMap).length === 0 ? <p className="text-xs text-slate-400">Loading wards...</p> : Object.keys(wardStationMap).map(ward => (
                                  <label key={ward} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${broadcastTargetWards.includes(ward) ? 'bg-dcp-green/10 border-dcp-green/30 text-slate-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                      <input 
                                          type="checkbox" 
                                          className="hidden"
                                          checked={broadcastTargetWards.includes(ward)}
                                          onChange={(e) => {
                                              if (e.target.checked) setBroadcastTargetWards([...broadcastTargetWards, ward]);
                                              else {
                                                setBroadcastTargetWards(broadcastTargetWards.filter(w => w !== ward));
                                                // Remove stations that belonged to this ward
                                                const stationsToRemove = wardStationMap[ward] || [];
                                                setBroadcastTargetStations(prev => prev.filter(s => !stationsToRemove.includes(s)));
                                              }
                                          }}
                                      />
                                      <span className="text-xs font-bold">{ward}</span>
                                  </label>
                               ))}
                            </div>

                            {broadcastTargetWards.length > 0 && (
                                <div className="mt-2 pt-3 border-t border-slate-100">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-2">Select Target Polling Stations (Optional)</p>
                                   <p className="text-[9px] text-slate-400 mb-2">Leave unselected to broadcast to ALL stations in the selected wards.</p>
                                   <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                      {broadcastTargetWards.map(ward => (
                                          (wardStationMap[ward] || []).map(station => (
                                             <label key={station} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${broadcastTargetStations.includes(station) ? 'bg-amber-400/20 border-amber-400/40 text-slate-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                                 <input 
                                                     type="checkbox" 
                                                     className="hidden"
                                                     checked={broadcastTargetStations.includes(station)}
                                                     onChange={(e) => {
                                                         if (e.target.checked) setBroadcastTargetStations([...broadcastTargetStations, station]);
                                                         else setBroadcastTargetStations(broadcastTargetStations.filter(s => s !== station));
                                                     }}
                                                 />
                                                 <span className="text-xs font-bold">{station}</span>
                                             </label>
                                          ))
                                      ))}
                                   </div>
                                </div>
                            )}
                          </div>
                        )}

                        {broadcastTargetType === 'specific_people' && (
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Members</p>
                            <div className="flex gap-2">
                               <select 
                                  onChange={(e) => {
                                      const id = e.target.value;
                                      if (!id) return;
                                      const m = allMembers.find(x => x.id.toString() === id);
                                      if (m && !broadcastTargetMembers.find(x => x.id === m.id)) {
                                          setBroadcastTargetMembers([...broadcastTargetMembers, m]);
                                      }
                                      e.target.value = "";
                                  }}
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none"
                               >
                                  <option value="">-- Select Member to Add --</option>
                                  {allMembers.map(m => (
                                      <option key={m.id} value={m.id}>{m.full_name} ({m.phone})</option>
                                  ))}
                               </select>
                            </div>
                            {broadcastTargetMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {broadcastTargetMembers.map(m => (
                                        <span key={m.id} className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                                            {m.full_name}
                                            <button onClick={() => setBroadcastTargetMembers(broadcastTargetMembers.filter(x => x.id !== m.id))} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                          </div>
                        )}

                        <button 
                          onClick={handleSetBroadcast}
                          disabled={isBroadcasting || !broadcastText.trim() || (broadcastTargetType === 'ward' && broadcastTargetWards.length === 0) || (broadcastTargetType === 'specific_people' && broadcastTargetMembers.length === 0)}
                          className="w-full bg-red-600 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-red-600/20 mt-2"
                        >
                          {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <><Megaphone size={16} /> Send Targeted Alert</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button onClick={() => { setShowAddModal(true); setAddModalStep('lookup'); setAddModalPrefill(null); }} className="bg-slate-900 text-white p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800 transition-colors shadow-sm text-left">
                    <div className="w-10 h-10 rounded-xl bg-dcp-green/20 flex items-center justify-center shrink-0"><Plus size={18} className="text-dcp-green" /></div>
                    <div><p className="font-black text-sm uppercase tracking-widest">Add Root</p><p className="text-[10px] text-slate-400 font-bold mt-0.5">Manual entry</p></div>
                  </button>
                  <button 
                    onClick={generateInviteToken} 
                    disabled={isGeneratingInvite}
                    className="bg-amber-400 text-slate-950 p-5 rounded-2xl flex items-center gap-4 hover:bg-amber-300 transition-colors shadow-sm text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      {isGeneratingInvite ? <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : <Smartphone size={18} className="text-slate-950" />}
                    </div>
                    <div><p className="font-black text-sm uppercase tracking-widest">Generate Invite</p><p className="text-[10px] text-slate-900/60 font-bold mt-0.5">One-time link</p></div>
                  </button>
                  <button onClick={() => setActiveTab('mobilizers')} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-dcp-green/30 transition-colors shadow-sm text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Star size={18} className="text-amber-500" /></div>
                    <div><p className="font-black text-sm text-slate-900 uppercase tracking-widest">Mobilizers</p><p className="text-[10px] text-slate-400 font-bold mt-0.5">Directory</p></div>
                  </button>
                  <button onClick={() => setActiveTab('analytics')} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-dcp-green/30 transition-colors shadow-sm text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><BarChart3 size={18} className="text-blue-500" /></div>
                    <div><p className="font-black text-sm text-slate-900 uppercase tracking-widest">Reports</p><p className="text-[10px] text-slate-400 font-bold mt-0.5">Party analytics</p></div>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Activity</p>
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Recent Registrations</h3>
                      </div>
                      <button onClick={() => setActiveTab('all')} className="text-[10px] font-black text-dcp-green uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {recentMembers.length === 0 ? (
                        <p className="p-6 text-xs text-slate-500 font-bold uppercase tracking-widest text-center">No registrations yet.</p>
                      ) : recentMembers.map(m => (
                        <div key={m.id} onClick={() => { setSelectedMember(m); setActiveTab('all'); }} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${m.referred_by ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600'}`}>
                              {m.referred_by ? <User size={14} /> : <Star size={14} />}
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-xs">{m.full_name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.ward}</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold shrink-0">{m.referred_by ? 'Delegate' : 'Root'}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Distribution</p>
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Top 5 Wards</h3>
                      </div>
                      <button onClick={() => setActiveTab('analytics')} className="text-[10px] font-black text-dcp-green uppercase tracking-widest hover:underline">Full Report</button>
                    </div>
                    <div className="p-6 space-y-4">
                      {wardSnapshot.length === 0 ? (
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-4">No data yet.</p>
                      ) : wardSnapshot.map((w, i) => {
                        const pct = totalRegistered > 0 ? Math.round((w.count / totalRegistered) * 100) : 0;
                        return (
                          <div key={w.ward}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 w-4">#{i + 1}</span>
                                <p className="font-black text-slate-900 text-xs uppercase tracking-widest">{w.ward}</p>
                              </div>
                              <span className="text-xs font-black text-slate-700">{w.count.toLocaleString()} <span className="text-slate-400 font-bold">({pct}%)</span></span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-dcp-green h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "tree" ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-3">
                    Click an arrow to expand downline tree
                </p>
                {roots.map(root => (
                  <TreeNode key={root.id} member={root} onSelectMember={setSelectedMember} />
                ))}
              </div>
            ) : activeTab === "analytics" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Reports />
              </div>
            ) : activeTab === "coverage" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <PollingCoverage />
              </div>
            ) : activeTab === "canvass" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Canvass memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "transport" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Transport memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "agents" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <PollingAgents isAdmin={true} />
              </div>
            ) : activeTab === "tally" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Pvt memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "incidents" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Incidents isAdmin={true} />
              </div>
            ) : activeTab === "phonebank" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <PhoneBank isAdmin={true} />
              </div>
            ) : activeTab === "matcher" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <ContactMatcher isAdmin={true} />
              </div>
            ) : activeTab === "sms" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <SmsExport isAdmin={true} />
              </div>
            ) : activeTab === "events" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Events isAdmin={true} />
              </div>
            ) : activeTab === "gotv" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Gotv memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "leaderboard" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Leaderboard memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "enroll" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Enrollment memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "training" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0 p-6">
                <CheatSheets />
              </div>
            ) : activeTab === "voter-registry" ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search 2022 voter database by name, ID, phone, or ward..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-dcp-green/50 focus:ring-4 focus:ring-dcp-green/10 transition-all font-bold text-sm tracking-wider uppercase"
                        value={voterSearch}
                        onChange={(e) => setVoterSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 flex-1">
                  {voterRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                        <Database size={24} className="text-amber-500" />
                      </div>
                      <p className="font-black text-slate-900 text-lg uppercase tracking-tight mb-2">No Voter Records Found</p>
                      
                      {!voterSearch ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mt-4">
                          <p className="text-sm text-slate-600 mb-3 font-bold">
                            The 2022 Official Database has not been loaded into this environment.
                          </p>
                          <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-left">
                            <span className="text-dcp-green font-black"># Run this on your server</span><br/>
                            python manage.py import_voter_register
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-slate-500 mt-2">
                          No match found for your search filters.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                      {voterRecords.map(record => (
                        <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col justify-between border-b border-slate-100">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-black text-slate-900 text-base uppercase tracking-tight">{record.full_name}</h4>
                              <p className="text-[10px] font-bold text-dcp-green uppercase tracking-[0.2em] mt-1">{record.ward || 'Unknown Ward'}</p>
                            </div>
                            <div className="bg-slate-100 px-2 py-1 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              2022 Official
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">National ID</p>
                              <p className="text-xs font-bold text-slate-700">{record.id_number || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                              <p className="text-xs font-bold text-slate-700">{record.phone_number || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasMoreVoters && (
                    <div className="p-8 flex justify-center">
                      <button
                        onClick={() => loadVoterRecordsPage(voterPage + 1, voterSearch)}
                        disabled={loadingVoters}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg"
                      >
                        {loadingVoters ? "Scanning Database..." : "Load More Official Records"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (activeTab === "mobilizers" || activeTab === "all") && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
                      {[
                        { id: 'all', label: 'All Registrants', count: totalRegistered },
                        { id: 'verified', label: 'Verified Voters', count: verifiedVoters },
                        { id: 'unverified', label: 'Unverified', count: unverifiedNew }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setVoterStatusFilter(tab.id); setMemberPage(0); }}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            voterStatusFilter === tab.id 
                              ? 'bg-white text-slate-900 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {tab.label} <span className="ml-1 opacity-50">({tab.count})</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          const newSort = memberSort === "id" ? "voter_status" : "id";
                          setMemberSort(newSort);
                          setMemberPage(0);
                          loadMembersPage(0, searchQuery, voterStatusFilter);
                        }}
                        className={`px-4 py-3 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2 ${
                          memberSort === "voter_status" ? "bg-dcp-green/10 border-dcp-green/30 text-dcp-green" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <ShieldCheck size={16} /> Sort Verified
                      </button>
                      <button
                        onClick={() => {
                          const data = activeTab === "mobilizers" ? roots : allMembers;
                          exportToCSV(data, `${activeTab}_export_${new Date().toISOString().split('T')[0]}`);
                        }}
                        className="px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
                      >
                        <Download size={16} /> Export
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={`SEARCH ${activeTab === "mobilizers" ? "ROOTS" : "ALL MEMBERS"} BY NAME OR ID...`}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-dcp-green/50 focus:ring-4 focus:ring-dcp-green/10 transition-all font-bold text-sm tracking-wider uppercase"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
                </div>
                <div className="divide-y divide-slate-100 flex-1">
                  {(activeTab === "mobilizers" ? roots : allMembers).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <Search size={24} className="text-slate-400" />
                      </div>
                      <p className="font-black text-slate-700 text-sm uppercase tracking-widest">No Results Found</p>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {searchQuery ? `No match for "${searchQuery}"` : "No records available"}
                      </p>
                    </div>
                    ) : (activeTab === "mobilizers" ? roots : allMembers).map(member => {
                      const directCount = member.recruits_count || 0;
                      const tier = activeTab === "mobilizers" ? getTierBadge(directCount) : null;
                      const referrerName = activeTab === "all" ? member.referrer_name : null;
                    return (
                      <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className={`p-4 transition-all cursor-pointer flex justify-between items-center gap-3 ${selectedMember?.id === member.id ? 'bg-amber-50 border-l-4 border-l-amber-400 pl-3' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm ${selectedMember?.id === member.id ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                            {member.referred_by ? <User size={18} /> : <Star size={18} />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-slate-900 flex items-center gap-1.5 truncate">
                              {member.full_name}
                              {member.is_voter_verified && (
                                <CheckCircle2 
                                  size={12} 
                                  className="text-dcp-green shrink-0" 
                                  title="Verified 2022 Voter"
                                />
                              )}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                              {member.ward}
                              {activeTab === "all" && referrerName && (
                                <span className="text-slate-300"> · Under: <span className="text-slate-500">{referrerName}</span></span>
                              )}
                              {activeTab === "all" && !member.referred_by && (
                                <span className="text-amber-500"> · Root Mobilizer</span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {tier && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>
                              {tier.name}
                            </span>
                          )}
                          <div className="text-right">
                            <p className="text-sm font-black text-slate-900">{directCount}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">recruits</p>
                          </div>
                          <ChevronRight size={16} className="text-slate-300 ml-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Pagination Controls */}
                {(activeTab === "mobilizers" ? hasMoreRoots : hasMoreMembers) && (
                  <div className="flex justify-center p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <button
                      onClick={() => {
                        if (activeTab === "mobilizers") loadRootPage(rootPage + 1, searchQuery);
                        else loadMembersPage(memberPage + 1, searchQuery);
                      }}
                      disabled={activeTab === "mobilizers" ? loadingMoreRoots : loadingMoreMembers}
                      className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.3em] border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      {activeTab === "mobilizers" 
                        ? (loadingMoreRoots ? "Loading..." : "Load more mobilizers")
                        : (loadingMoreMembers ? "Loading..." : "Load more recruits")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Intelligence Profile */}
          <AnimatePresence>
            {selectedMember && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full md:w-[400px] shrink-0"
              >
                <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col relative sticky top-6 max-h-[calc(100vh-3rem)]">
                  <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none opacity-20 z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,132,61,0.5)_0%,transparent_70%)]" />
                  </div>
                  <div className="p-6 border-b border-slate-800 z-10 flex justify-between items-center shrink-0">
                    <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                      <Database size={18} className="text-dcp-green" />
                      Intelligence Profile
                    </h3>
                    <button onClick={() => setSelectedMember(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-6 z-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                    <div>
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4 border border-white/5">
                        {selectedMember.referred_by ? <User size={32} /> : <Star size={32} className="text-amber-400" />}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-dcp-green text-[10px] font-black uppercase tracking-[0.2em]">
                          {selectedMember.referred_by ? "Constitutional Delegate" : "Root Mobilizer"}
                        </p>
                        {selectedMember.is_voter_verified && (
                          <span className="bg-dcp-green/10 text-dcp-green text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-dcp-green/20 flex items-center gap-1">
                            <CheckCircle2 size={8} /> Verified Voter
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-black text-white italic tracking-tight">{selectedMember.full_name}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Direct Children</p>
                        <p className="text-2xl font-black text-white">{selectedMemberDirectCount}</p>
                      </div>
                      <div className="bg-black/40 border border-white/5 border-l-dcp-green/50 rounded-2xl p-4">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Downline</p>
                        <p className="text-2xl font-black text-white">{selectedMemberNetworkSize}</p>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800 space-y-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">Role Management</p>
                      </div>
                      <div className="space-y-3">
                        <select 
                          className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold p-3 rounded-xl focus:border-dcp-green outline-none"
                          value={selectedMember.security_rank || 'none'}
                          onChange={(e) => {
                            api.updateMemberRole(selectedMember.id, { security_rank: e.target.value })
                              .then(() => {
                                toast.success('Rank updated');
                                setSelectedMember({...selectedMember, security_rank: e.target.value});
                              });
                          }}
                        >
                          <option value="none">Standard Member (No Rank)</option>
                          <option value="guard">Guard</option>
                          <option value="station_commander">Station Commander</option>
                          <option value="ward_commander">Ward Commander</option>
                        </select>
                        
                        {(selectedMember.security_rank && selectedMember.security_rank !== 'none') && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                className="w-full bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-bold p-3 rounded-xl outline-none"
                                value={selectedMember.ward || ''}
                                onChange={(e) => {
                                  api.updateMemberRole(selectedMember.id, { ward: e.target.value, polling_station: '' })
                                    .then(() => {
                                      toast.success('Deployed to ' + e.target.value);
                                      setSelectedMember({...selectedMember, ward: e.target.value, polling_station: ''});
                                    });
                                }}
                              >
                                <option value="">-- Deploy Ward --</option>
                                {wardStationMap && Object.keys(wardStationMap).map(ward => (
                                  <option key={ward} value={ward}>{ward}</option>
                                ))}
                              </select>

                              <select
                                className="w-full bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-bold p-3 rounded-xl outline-none"
                                value={selectedMember.polling_station || ''}
                                disabled={!selectedMember.ward || selectedMember.security_rank === 'ward_commander'}
                                onChange={(e) => {
                                  api.updateMemberRole(selectedMember.id, { polling_station: e.target.value })
                                    .then(() => {
                                      toast.success('Deployed to ' + e.target.value);
                                      setSelectedMember({...selectedMember, polling_station: e.target.value});
                                    });
                                }}
                              >
                                <option value="">-- Deploy Station --</option>
                                {selectedMember.ward && wardStationMap && 
                                 (wardStationMap[selectedMember.ward] || []).map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                              <div>
                                <p className="text-xs font-bold text-white">Security Only Mode</p>
                                <p className="text-[9px] text-slate-500">Hides campaign tools</p>
                              </div>
                              <button 
                                onClick={() => {
                                  const newVal = !selectedMember.is_security_only;
                                  api.updateMemberRole(selectedMember.id, { is_security_only: newVal })
                                    .then(() => {
                                      toast.success(newVal ? 'Locked to security only' : 'Campaign tools enabled');
                                      setSelectedMember({...selectedMember, is_security_only: newVal});
                                    });
                                }}
                                className={`w-12 h-6 rounded-full transition-colors relative ${selectedMember.is_security_only ? 'bg-dcp-green' : 'bg-slate-700'}`}
                              >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${selectedMember.is_security_only ? 'left-7' : 'left-1'}`} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800 space-y-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em] mb-3">Referral Lineage</p>
                      <div className="grid gap-3">
                        <LineageCard
                          label="Invited By"
                          title={directInviter ? directInviter.full_name : "No referrer / Root"}
                          subtitle={directInviter ? `${directInviter.ward} · ${directInviter.polling_station}` : "Root Level Setup"}
                          badge={`Tier ${getTierValue(directInviter)}`}
                        />
                        <LineageCard
                          label="Current Tier Placement"
                          title={`Tier ${selectedMemberTier}`}
                          subtitle={`Depth ${selectedMemberDepth}`}
                          badge={`Lineage: ${selectedMemberLineage.length} steps`}
                        />
                        {topMobilizer && topMobilizer.id !== selectedMember.id && (
                          <LineageCard
                            label="Root Mobilizer"
                            title={topMobilizer.full_name}
                            subtitle={`${topMobilizer.ward} · ${topMobilizer.polling_station}`}
                            badge="Root"
                            meta="Top of lineage chain"
                          />
                        )}
                      </div>
                      {selectedMember.referred_by && (
                        <div className="mt-4">
                          <button 
                            onClick={handlePromoteToRoot}
                            className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-500 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                          >
                            <Star size={14} /> Promote to Root Mobilizer
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-800">
                      <InfoRow icon={<Smartphone size={16} />} label="Phone" value={selectedMember.phone} />
                      <InfoRow icon={<Mail size={16} />} label="Email" value={selectedMember.email} />
                      <InfoRow icon={<Hash size={16} />} label="National ID" value={selectedMember.national_id} />
                      <InfoRow icon={<MapPin size={16} />} label="Ward" value={selectedMember.ward} />
                      <InfoRow icon={<MapPin size={16} />} label="Polling" value={selectedMember.polling_station} />
                      <InfoRow icon={<User size={16} />} label="Y.O.B" value={selectedMember.yob} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showSecurityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Deploy Security</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fast-Track Enrollment</p>
                </div>
                <button onClick={() => setShowSecurityModal(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                 <form onSubmit={(e) => {
                   e.preventDefault();
                   const fd = new FormData(e.target);
                   const data = Object.fromEntries(fd.entries());
                   data.is_security_only = true;
                   
                   api.register(data).then(({ error }) => {
                     if (error) { toast.error(error.message || 'Failed to deploy'); return; }
                     toast.success('Security Personnel Deployed!');
                     setShowSecurityModal(false);
                     loadMembersPage(0, searchQuery, voterStatusFilter);
                   });
                 }} className="space-y-4">
                    <input name="full_name" placeholder="Full Name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" />
                    <input name="national_id" placeholder="ID Number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" />
                    <input name="phone" placeholder="Phone Number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <select name="security_rank" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" onChange={(e) => {
                         const sSelect = document.getElementById('sec_station_select');
                         if (e.target.value === 'ward_commander') {
                             sSelect.disabled = true;
                             sSelect.value = '';
                         } else {
                             sSelect.disabled = false;
                         }
                      }}>
                        <option value="">- Select Rank -</option>
                        <option value="guard">Guard</option>
                        <option value="station_commander">Station Commander</option>
                        <option value="ward_commander">Ward Commander</option>
                      </select>
                      <select name="ward" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" onChange={(e) => {
                         const stations = (wardStationMap[e.target.value] || []);
                         const sSelect = document.getElementById('sec_station_select');
                         sSelect.innerHTML = '<option value="">- Select Station -</option>' + stations.map(s => `<option value="${s}">${s}</option>`).join('');
                      }}>
                        <option value="">- Select Ward -</option>
                        {wardStationMap && Object.keys(wardStationMap).map(ward => <option key={ward} value={ward}>{ward}</option>)}
                      </select>
                    </div>
                    <select id="sec_station_select" name="polling_station" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition">
                      <option value="">- Select Station -</option>
                    </select>

                    <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-sm uppercase tracking-widest mt-4">
                       Deploy Now
                    </button>
                 </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-start justify-center overflow-y-auto py-8 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="w-full max-w-xl relative"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div>
                  <p className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                    <Star size={16} className="text-amber-400" />
                    New Root Mobilizer
                  </p>
                  <p className="text-slate-400 text-[11px] font-bold mt-0.5">
                    This member will have null referrer and a quota of 25.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>

              {addModalStep === 'lookup' ? (
                <div className="bg-white rounded-[2rem] p-6 shadow-2xl">
                  <VoterLookup 
                    onSelect={(formData, voter) => {
                      setAddModalPrefill(formData);
                      setAddModalVoter(voter);
                      setAddModalStep('form');
                    }}
                    onSkip={() => {
                      setAddModalPrefill(null);
                      setAddModalVoter(null);
                      setAddModalStep('form');
                    }}
                  />
                </div>
              ) : (
                <RegistrationForm
                  referrerId={null}
                  isAdmin={true}
                  initialData={addModalPrefill}
                  selectedVoter={addModalVoter}
                  onSuccess={() => { setShowAddModal(false); toast.success("Root Mobilizer established!"); loadRootPage(0, ""); }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
