import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CheckCircle2, Circle, Users, MapPin, Filter, Loader2, AlertTriangle, Download } from "lucide-react";
import { api } from "../lib/api";
import { exportToCSV } from "../lib/exportUtils";
import { useLocationData } from "../contexts/LocationContext";

function VotedStatusButton({ member, onToggle }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    await onToggle(member.id);
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
        member.has_voted
          ? "bg-dcp-green text-white shadow-lg shadow-dcp-green/20 hover:bg-dcp-green/90"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : member.has_voted ? (
        <CheckCircle2 className="w-4 h-4" />
      ) : (
        <Circle className="w-4 h-4" />
      )}
      {member.has_voted ? "Voted" : "Mark Voted"}
    </button>
  );
}

export default function Gotv({ memberId, isAdmin = false }) {
  const { wardsWithCenters } = useLocationData();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ward, setWard] = useState("");
  const [station, setStation] = useState("");
  const [search, setSearch] = useState("");
  const [showOnlyUnvoted, setShowOnlyUnvoted] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const availableStations = ward
    ? wardsWithCenters.find(w => w.name === ward)?.centers || []
    : [];

  const fetchMembers = useCallback(async () => {
    if (!ward) return;
    setLoading(true);
    const params = {};
    if (ward) params.ward = ward;
    if (station) params.station = station;
    const { data } = await api.getGotvList(params);
    setMembers(data?.results || data || []);
    setHasFetched(true);
    setLoading(false);
  }, [ward, station]);

  useEffect(() => {
    if (ward) fetchMembers();
  }, [ward, station, fetchMembers]);

  const handleToggle = async (id) => {
    const { data } = await api.markVoted(id);
    if (data) {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, has_voted: data.has_voted } : m));
    }
  };

  const filtered = members.filter(m => {
    const matchSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase());
    const matchUnvoted = !showOnlyUnvoted || !m.has_voted;
    return matchSearch && matchUnvoted;
  });

  const votedCount = members.filter(m => m.has_voted).length;
  const pct = members.length > 0 ? Math.round((votedCount / members.length) * 100) : 0;

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(0,132,61,0.25)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Election Day · GOTV Command</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Strike-off Tool</h1>
              <p className="text-slate-400 text-sm mt-1">Mark DCP supporters as voted — station by station</p>
            </div>
            {members.length > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <div className="bg-white/10 border border-white/10 rounded-3xl px-5 py-3 text-center w-full sm:w-auto">
                  <p className="text-4xl font-black text-white">{pct}%</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{votedCount}/{members.length} Voted</p>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-dcp-green h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button onClick={() => exportToCSV(members, `GOTV_Turnout_${new Date().toISOString().split('T')[0]}`)}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition shadow-lg w-full sm:w-auto shrink-0">
                  <Download className="w-4 h-4" /> Export Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banner */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs font-bold text-amber-800">
            <strong>Election Day Tool.</strong> Use this to track which DCP supporters have cast their vote. 
            Prioritise following up with anyone still showing as "Not Voted" before polls close.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Polling Station</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
              <select value={ward} onChange={e => { setWard(e.target.value); setStation(""); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-dcp-green/50 transition appearance-none">
                <option value="">— Select Ward —</option>
                {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station</label>
              <select value={station} onChange={e => setStation(e.target.value)} disabled={!ward}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-dcp-green/50 transition appearance-none disabled:opacity-50">
                <option value="">All Stations in Ward</option>
                {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Members list */}
        {hasFetched && (
          <>
            {/* Search + filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-dcp-green/50 transition" />
              </div>
              <button
                onClick={() => setShowOnlyUnvoted(v => !v)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition border ${showOnlyUnvoted ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"}`}
              >
                <Filter className="w-4 h-4" />
                {showOnlyUnvoted ? "Showing: Not Voted" : "Show All"}
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              {/* Table — scrollable on mobile */}
              <div className="overflow-x-auto">
              {/* Table header */}
              <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[480px]">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Full Name</div>
                <div className="col-span-3">Polling Station</div>
                <div className="col-span-3 text-right">Status</div>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 animate-pulse flex gap-4 min-w-[480px]">
                      <div className="h-4 bg-slate-200 rounded flex-1" />
                      <div className="h-8 bg-slate-200 rounded w-28" />
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="p-12 text-center text-slate-600 text-xs font-black uppercase tracking-widest">
                    {members.length === 0 ? "No DCP members registered at this station" : "All members voted! 🎉"}
                  </div>
                ) : (
                  <AnimatePresence>
                    {filtered.map((m, i) => (
                      <motion.div key={m.id} layout
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`grid grid-cols-12 items-center px-6 py-4 gap-2 transition min-w-[480px] ${m.has_voted ? "bg-dcp-green/5" : "hover:bg-slate-50"}`}
                      >
                        <div className="col-span-1 text-[10px] font-black text-slate-400">#{i + 1}</div>
                        <div className="col-span-5">
                          <p className={`font-black uppercase tracking-tight text-sm ${m.has_voted ? "text-slate-400 line-through" : "text-slate-900"}`}>
                            {m.full_name}
                          </p>
                          {m.is_voter_verified && (
                            <span className="text-[9px] font-black text-dcp-green uppercase tracking-widest">✓ IEBC Verified</span>
                          )}
                        </div>
                        <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{m.polling_station}</span>
                        </div>
                        <div className="col-span-3 flex justify-end">
                          <VotedStatusButton member={m} onToggle={handleToggle} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
              </div>

              {/* Footer progress */}
              {members.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {votedCount} of {members.length} DCP supporters have voted at this location
                  </p>
                  <div className="w-40 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-dcp-green h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!ward && !hasFetched && (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <MapPin className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-black text-slate-700 uppercase tracking-tight text-lg">Select a Ward to Begin</p>
            <p className="text-slate-400 text-sm mt-2">Choose the ward and polling station you are monitoring.</p>
          </div>
        )}
      </div>
    </div>
  );
}
