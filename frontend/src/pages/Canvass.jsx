import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Plus, Trash2, CheckCircle2, Circle, Search, MapPin, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

export default function Canvass({ memberId, isAdmin = false }) {
  const { wardsWithCenters } = useLocationData();
  const [assignments, setAssignments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  // New assignment form state
  const [form, setForm] = useState({
    mobilizer_id: "",
    ward: "",
    polling_station: "",
    target_households: 50,
    notes: "",
  });

  const availableStations = form.ward
    ? wardsWithCenters.find(w => w.name === form.ward)?.centers || []
    : [];

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: aData }, { data: mData }] = await Promise.all([
      api.getCanvass(),
      api.getMembers?.() || { data: null },
    ]);
    setAssignments(aData?.results || aData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.mobilizer_id || !form.ward) {
      toast.error("Please select a mobilizer and ward.");
      return;
    }
    const { data, error } = await api.createCanvass(form);
    if (error) { toast.error("Failed to create assignment."); return; }
    toast.success("Assignment created!");
    setShowForm(false);
    setForm({ mobilizer_id: "", ward: "", polling_station: "", target_households: 50, notes: "" });
    load();
  };

  const handleToggle = async (id) => {
    await api.toggleCanvass(id);
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, is_completed: !a.is_completed } : a));
  };

  const handleDelete = async (id) => {
    await api.deleteCanvass(id);
    setAssignments(prev => prev.filter(a => a.id !== id));
    toast.success("Assignment removed.");
  };

  const filtered = assignments.filter(a => {
    if (filter === "pending") return !a.is_completed;
    if (filter === "done") return a.is_completed;
    return true;
  });

  const doneCount = assignments.filter(a => a.is_completed).length;

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,132,61,0.2)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">BJP-Style · Panna Pramukh System</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Area Assignments</h1>
              <p className="text-slate-400 text-sm mt-1">Assign mobilizers to specific shambas, polling stations & villages</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 border border-white/10 rounded-2xl px-5 py-3 text-center">
                <p className="text-2xl font-black text-white">{doneCount}/{assignments.length}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
              </div>
              <button onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-2 px-5 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 transition shadow-lg shadow-dcp-green/20">
                <Plus className="w-4 h-4" /> Assign
              </button>
            </div>
          </div>
        </div>

        {/* Create Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-dcp-green/20 rounded-3xl p-6 shadow-md space-y-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">New Canvass Assignment</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Mobilizer Member ID</label>
                  <input value={form.mobilizer_id} onChange={e => setForm(f => ({ ...f, mobilizer_id: e.target.value }))}
                    placeholder="Paste member ID number"
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
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station (Optional)</label>
                  <select value={form.polling_station} onChange={e => setForm(f => ({ ...f, polling_station: e.target.value }))}
                    disabled={!form.ward}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition appearance-none disabled:opacity-50">
                    <option value="">Whole Ward</option>
                    {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Target Households</label>
                  <input type="number" value={form.target_households} onChange={e => setForm(f => ({ ...f, target_households: +e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Notes / Instructions</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    placeholder="e.g. Focus on the market area near the river..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreate}
                  className="px-6 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 transition">
                  Create Assignment
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-2">
          {[{ id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "done", label: "Completed" }].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${filter === t.id ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-2xl" />)
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
              <Map className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-black text-slate-500 uppercase tracking-tight">No assignments yet</p>
              <p className="text-slate-400 text-xs mt-1">Click "Assign" above to send a mobilizer to the field</p>
            </div>
          ) : filtered.map(a => (
            <motion.div key={a.id} layout
              className={`flex items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${a.is_completed ? "bg-dcp-green/5 border-dcp-green/20" : "bg-white border-slate-200 hover:border-slate-300"}`}>
              <div className="flex items-center gap-4 min-w-0">
                <button onClick={() => handleToggle(a.id)}
                  className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border-2 transition ${a.is_completed ? "bg-dcp-green border-dcp-green text-white" : "border-slate-300 text-slate-300 hover:border-dcp-green"}`}>
                  {a.is_completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <div className="min-w-0">
                  <p className={`font-black uppercase tracking-tight ${a.is_completed ? "text-slate-400 line-through" : "text-slate-900"}`}>
                    {a.mobilizer_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <MapPin className="w-3 h-3" />{a.ward}{a.polling_station ? ` · ${a.polling_station}` : ""}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      🏠 {a.target_households} households
                    </span>
                  </div>
                  {a.notes && <p className="text-xs text-slate-500 mt-1 italic">{a.notes}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(a.id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-300 hover:bg-red-50 hover:text-red-400 transition shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
