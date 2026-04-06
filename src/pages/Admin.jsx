import { useState, useEffect, useCallback } from "react";
import { Users, Shield, ChevronRight, ChevronDown, Plus, X, Database, Search, User, Smartphone, MapPin, Hash, Star, LayoutDashboard, Network, BarChart3, LogOut, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm";
import logo from "../assets/logo.png";
import { getChildrenById } from "../lib/memberCache";
import Reports from "./Reports";

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

export default function Admin() {
  const PAGE_SIZE = 50;
  const navigate = useNavigate();

  // Primary State
  const [activeTab, setActiveTab] = useState("overview"); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  // Global System Stats
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [totalRoots, setTotalRoots] = useState(0);
  const [maxRootDepth, setMaxRootDepth] = useState(0);
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

  // Overview extras
  const [recentMembers, setRecentMembers] = useState([]);
  const [wardSnapshot, setWardSnapshot] = useState([]);

  const loadOverviewData = useCallback(async () => {
    try {
      const [{ data: recent }, { data: wardData }] = await Promise.all([
        supabase.from('dcp_members').select('id, full_name, ward, referred_by').order('id', { ascending: false }).limit(6),
        supabase.from('dcp_members').select('ward'),
      ]);
      if (recent) setRecentMembers(recent);
      if (wardData) {
        const map = {};
        wardData.forEach(m => { const w = m.ward || 'Unknown'; map[w] = (map[w] || 0) + 1; });
        const sorted = Object.entries(map).map(([ward, count]) => ({ ward, count })).sort((a, b) => b.count - a.count).slice(0, 5);
        setWardSnapshot(sorted);
      }
    } catch (e) { console.error('Overview data error:', e); }
  }, []);

  // Inline row stats
  const [recruitCounts, setRecruitCounts] = useState({});   // memberId → direct count
  const [referrerNames, setReferrerNames] = useState({});   // memberId → referrer full_name

  // Batch-fetch direct recruit counts for a set of member IDs
  const fetchRecruitCounts = useCallback(async (ids) => {
    if (!ids.length) return;
    const { data } = await supabase.from('dcp_members').select('referred_by').in('referred_by', ids);
    if (!data) return;
    const counts = {};
    data.forEach(r => { counts[r.referred_by] = (counts[r.referred_by] || 0) + 1; });
    setRecruitCounts(prev => ({ ...prev, ...counts }));
  }, []);

  // Batch-fetch referrer names for a set of referred_by IDs
  const fetchReferrerNames = useCallback(async (referrerIds) => {
    const unique = [...new Set(referrerIds.filter(Boolean))];
    if (!unique.length) return;
    const { data } = await supabase.from('dcp_members').select('id, full_name').in('id', unique);
    if (!data) return;
    const names = {};
    data.forEach(r => { names[r.id] = r.full_name; });
    setReferrerNames(prev => ({ ...prev, ...names }));
  }, []);

  // Selected Member Analytics
  const [selectedMemberDirectCount, setSelectedMemberDirectCount] = useState(0);
  const [selectedMemberNetworkSize, setSelectedMemberNetworkSize] = useState(0);
  const [selectedMemberLineage, setSelectedMemberLineage] = useState([]);

  // Fetch Total Registrations + Root Count + DB Health
  const loadTotalRegistered = useCallback(async () => {
    try {
      const [{ count: total, error: e1 }, { count: rootCount, error: e2 }] = await Promise.all([
        supabase.from("dcp_members").select("*", { count: "exact", head: true }),
        supabase.from("dcp_members").select("*", { count: "exact", head: true }).is("referred_by", null),
      ]);
      if (e1 || e2) throw new Error("Query failed");
      if (total !== null) setTotalRegistered(total);
      if (rootCount !== null) setTotalRoots(rootCount);
      setDbStatus("online");
    } catch (e) {
      console.error("Total members count error:", e);
      setDbStatus("error");
    }
  }, []);

  // Fetch Roots Page
  const loadRootPage = useCallback(async (pageIdx, q = "") => {
    setLoadingMoreRoots(true);
    try {
      let query = supabase.from('dcp_members').select('*').is('referred_by', null).order('id', { ascending: false });
      if (q.trim()) query = query.or(`full_name.ilike.%${q}%,national_id.ilike.%${q}%`);
      const from = pageIdx * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      if (data) {
        if (pageIdx === 0) setRoots(data);
        else setRoots(prev => [...prev, ...data]);
        setHasMoreRoots(data.length === PAGE_SIZE);
        setRootPage(pageIdx);
        fetchRecruitCounts(data.map(m => m.id));
      }
    } catch (err) { console.error(err); toast.error("Error loading mobilizers"); }
    finally { setLoadingMoreRoots(false); }
  }, [fetchRecruitCounts]);

  // Fetch Members Page
  const loadMembersPage = useCallback(async (pageIdx, q = "") => {
    setLoadingMoreMembers(true);
    try {
      let query = supabase.from('dcp_members').select('*').order('id', { ascending: false });
      if (q.trim()) query = query.or(`full_name.ilike.%${q}%,national_id.ilike.%${q}%`);
      const from = pageIdx * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await query.range(from, to);
      if (error) throw error;
      if (data) {
        if (pageIdx === 0) setAllMembers(data);
        else setAllMembers(prev => [...prev, ...data]);
        setHasMoreMembers(data.length === PAGE_SIZE);
        setMemberPage(pageIdx);
        fetchRecruitCounts(data.map(m => m.id));
        fetchReferrerNames(data.map(m => m.referred_by));
      }
    } catch (err) { console.error(err); toast.error("Error loading recruits"); }
    finally { setLoadingMoreMembers(false); }
  }, [fetchRecruitCounts, fetchReferrerNames]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "mobilizers") {
        loadRootPage(0, searchQuery);
      } else if (activeTab === "all") {
        loadMembersPage(0, searchQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, loadRootPage, loadMembersPage]);

  // Initial Fetch
  useEffect(() => {
    loadTotalRegistered();
    loadRootPage(0, "");
    loadMembersPage(0, "");
    loadOverviewData();
  }, [loadTotalRegistered, loadRootPage, loadMembersPage, loadOverviewData]);

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
    let lineage = [];
    let currentId = memberId;
    let fallbackDepth = 0;
    try {
      while (currentId && fallbackDepth < 10) {
        const { data } = await supabase.from('dcp_members').select('*').eq('id', currentId).single();
        if (!data) break;
        lineage.unshift(data);
        currentId = data.referred_by;
        fallbackDepth++;
      }
    } catch (err) { console.error(err); }
    return lineage;
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

  // Derived lineage UI stats
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
      const { data, error } = await supabase
        .from('dcp_invites')
        .insert([{ target_role: 'root' }])
        .select()
        .single();
      
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
    <div className="min-h-screen bg-slate-50 flex overflow-hidden w-full">
      {/* ── Sidebar ───────────────────────────────────────── */}
      <AnimatePresence initial={false}>
         {isSidebarOpen && (
            <motion.div 
               initial={{ x: -300 }}
               animate={{ x: 0 }}
               exit={{ x: -300 }}
               transition={{ type: "spring", stiffness: 300, damping: 30 }}
               className="w-72 bg-white border-r border-slate-200 shadow-sm z-30 flex flex-col fixed inset-y-0 left-0 md:relative"
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
                  <NavItem id="analytics" icon={BarChart3} label="System Analytics" activeTab={activeTab} setActiveTab={setActiveTab} />
               </div>
               <div className="p-4 border-t border-slate-100">
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-dcp-green/20 border border-dcp-green/30 flex items-center justify-center">
                           <Shield size={14} className="text-dcp-green" />
                        </div>
                        <div>
                           <p className="text-xs font-black uppercase tracking-widest">System Admin</p>
                           <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Full Access</p>
                        </div>
                     </div>
                     <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-xs font-bold uppercase tracking-widest mt-2">
                        <LogOut size={14} /> Sign Out
                     </button>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>

      {/* ── Main Area ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-screen transition-all bg-slate-50/50">
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
                  {activeTab === 'analytics' && 'Official Party Reports'}
               </h1>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-dcp-green animate-pulse"></span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{totalRegistered} Recruits Synced</p>
               </div>
            </div>
         </div>
         <button onClick={() => setShowAddModal(true)} className="hidden sm:flex bg-slate-950 text-white px-5 py-3 rounded-xl font-bold uppercase tracking-widest text-xs items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg">
            <Plus size={16} className="text-dcp-green" /> Establish Root
         </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full">
            {activeTab === "overview" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1 — Total Members */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]"><Users size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Members</p>
                    <p className="text-4xl font-black text-slate-900">{totalRegistered.toLocaleString()}</p>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Roots</span><span>Delegates</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          className="h-full bg-amber-400 transition-all duration-700"
                          style={{ width: totalRegistered > 0 ? `${Math.round((totalRoots / totalRegistered) * 100)}%` : '0%' }}
                        />
                        <div className="h-full flex-1 bg-dcp-green/40" />
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-slate-500">
                        <span>{totalRoots}</span>
                        <span>{totalRegistered - totalRoots}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 — Root Mobilizers */}
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

                  {/* Card 3 — Avg. Recruits Per Root */}
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

                  {/* Card 4 — System Health */}
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
                      <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3 w-full">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Records</p>
                          <p className="text-sm font-black text-white">{totalRegistered.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Roots</p>
                          <p className="text-sm font-black text-white">{totalRoots}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <button onClick={() => setShowAddModal(true)} className="bg-slate-900 text-white p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800 transition-colors shadow-sm text-left">
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

                {/* Recent + Ward Snapshot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Recent Registrations */}
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
                        <p className="p-6 text-xs text-slate-400 font-bold uppercase tracking-widest text-center">No registrations yet.</p>
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

                  {/* Ward Snapshot */}
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
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest text-center py-4">No data yet.</p>
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
              <div className="h-full w-full overflow-y-auto custom-scrollbar rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Reports />
              </div>
            ) : (activeTab === "mobilizers" || activeTab === "all") && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[calc(100vh-12rem)]">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <div className="relative">
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
                <div className="divide-y divide-slate-100 overflow-y-auto flex-1 custom-scrollbar">
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
                    const directCount = recruitCounts[member.id] || 0;
                    const tier = activeTab === "mobilizers" ? getTierBadge(directCount) : null;
                    const referrerName = activeTab === "all" ? referrerNames[member.referred_by] : null;
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
                            <h4 className="font-black text-slate-900 truncate">{member.full_name}</h4>
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
                      <p className="text-dcp-green text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                        {selectedMember.referred_by ? "Constitutional Delegate" : "Root Mobilizer"}
                      </p>
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
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-800">
                      <InfoRow icon={<Smartphone size={16} />} label="Phone" value={selectedMember.phone} />
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
              <RegistrationForm
                referrerId={null}
                isAdmin={true}
                onSuccess={() => { setShowAddModal(false); toast.success("Root Mobilizer established!"); loadRootPage(0, ""); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
