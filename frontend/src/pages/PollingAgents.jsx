import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, MapPin, Phone, CheckCircle2, Clock, Plus, AlertTriangle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

function AgentCard({ agent, onCheckIn }) {
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async () => {
    setLoading(true);
    await onCheckIn(agent.id);
    setLoading(false);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-2xl p-5 space-y-4 transition-all ${agent.checked_in ? 'border-dcp-green/50 shadow-sm' : 'border-slate-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${agent.checked_in ? 'bg-dcp-green/10 text-dcp-green' : 'bg-slate-100 text-slate-400'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className={`font-black uppercase tracking-tight text-sm ${agent.checked_in ? 'text-slate-900' : 'text-slate-700'}`}>{agent.member_name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />{agent.phone}
            </p>
          </div>
        </div>
        {agent.checked_in ? (
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Checked In
          </span>
        ) : (
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border bg-amber-100 text-amber-700 border-amber-200">
            Awaiting Check-in
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assigned Station</p>
          <p className="font-bold text-slate-700 text-sm truncate">{agent.polling_station}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{agent.ward}</p>
        </div>
      </div>

      {agent.notes && <p className="text-xs text-slate-500 italic px-2 border-l-2 border-slate-200">{agent.notes}</p>}

      <button onClick={handleCheckIn} disabled={loading}
        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 ${
          agent.checked_in
            ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
            : "bg-dcp-green text-white hover:bg-dcp-green/90 shadow-lg shadow-dcp-green/20"
        }`}>
        {loading ? <Clock className="w-4 h-4 animate-spin" /> : agent.checked_in ? "Undo Check-in" : "Mark Present at Station"}
      </button>
    </motion.div>
  );
}

export default function PollingAgents() {
  const { wardsWithCenters } = useLocationData();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wardFilter, setWardFilter] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  
  const [form, setForm] = useState({ member_id: "", ward: "", polling_station: "", notes: "" });
  const availableStations = form.ward ? wardsWithCenters.find(w => w.name === form.ward)?.centers || [] : [];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getAgents();
    setAgents(data?.results || data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async () => {
    if (!form.member_id || !form.polling_station) { toast.error("Member ID and Station are required."); return; }
    const { error } = await api.assignAgent(form);
    if (error) { toast.error("Failed to assign agent."); return; }
    toast.success("Agent assigned successfully!");
    setShowAssign(false);
    setForm({ member_id: "", ward: "", polling_station: "", notes: "" });
    load();
  };

  const handleCheckIn = async (id) => {
    const { data } = await api.checkInAgent(id);
    if (data) {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, checked_in: data.checked_in, check_in_time: data.check_in_time } : a));
    }
  };

  const filtered = agents.filter(a => !wardFilter || a.ward === wardFilter);
  const checkedInCount = filtered.filter(a => a.checked_in).length;
  const pct = filtered.length > 0 ? Math.round((checkedInCount / filtered.length) * 100) : 0;

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,132,61,0.2)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">HQ Command · Election Day</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Agent Deployment</h1>
              <p className="text-slate-400 text-sm mt-1">Manage polling agents across all 142 stations</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-center w-full sm:w-auto">
                <p className="text-2xl font-black text-white">{pct}%</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deployed</p>
              </div>
              <button onClick={() => setShowAssign(v => !v)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 transition shadow-lg shadow-dcp-green/20 w-full sm:w-auto">
                <UserPlus className="w-4 h-4" /> Assign Agent
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showAssign && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-dcp-green/20 rounded-3xl p-6 shadow-md space-y-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">New Agent Assignment</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Agent Member ID</label>
                  <input value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                    placeholder="Enter member ID"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
                  <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value, polling_station: "" }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition appearance-none">
                    <option value="">— Select Ward —</option>
                    {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station</label>
                  <select value={form.polling_station} onChange={e => setForm(f => ({ ...f, polling_station: e.target.value }))} disabled={!form.ward}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition appearance-none disabled:opacity-50">
                    <option value="">— Select Station —</option>
                    {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAssign}
                  className="px-6 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 transition">
                  Confirm Assignment
                </button>
                <button onClick={() => setShowAssign(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 overflow-x-auto pb-1">
          <button onClick={() => setWardFilter("")}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 transition border ${!wardFilter ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"}`}>
            All Wards
          </button>
          {wardsWithCenters.map(w => (
            <button key={w.id} onClick={() => setWardFilter(w.name)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 transition border ${wardFilter === w.name ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-400 border-slate-200"}`}>
              {w.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="font-black text-slate-500 uppercase tracking-tight text-lg">No Agents Assigned</p>
            <p className="text-slate-400 text-sm mt-2">Deploy agents to ensure every polling station is monitored.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map(a => <AgentCard key={a.id} agent={a} onCheckIn={handleCheckIn} />)}
          </div>
        )}
      </div>
    </div>
  );
}
