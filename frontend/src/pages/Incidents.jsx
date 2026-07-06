import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MapPin, Camera, Clock, CheckCircle2, Search, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

const TYPE_CONFIG = {
  kiems_failure: { label: "KIEMS Failure", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "💻" },
  bribery:       { label: "Voter Bribery", color: "bg-red-100 text-red-700 border-red-200", icon: "💰" },
  violence:      { label: "Intimidation",  color: "bg-rose-100 text-rose-700 border-rose-200", icon: "⚠️" },
  late_opening:  { label: "Late Opening",  color: "bg-orange-100 text-orange-700 border-orange-200", icon: "⏰" },
  other:         { label: "Other",         color: "bg-slate-100 text-slate-700 border-slate-200", icon: "📝" },
};

export default function Incidents({ isAdmin = false }) {
  const { wardsWithCenters } = useLocationData();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  
  const [form, setForm] = useState({ incident_type: "kiems_failure", ward: "", polling_station: "", description: "" });
  const availableStations = form.ward ? wardsWithCenters.find(w => w.name === form.ward)?.centers || [] : [];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getIncidents();
    setIncidents(data?.results || data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.ward || !form.description) {
      toast.error("Ward and description are required.");
      return;
    }
    const { error } = await api.reportIncident(form);
    if (error) { toast.error("Failed to report incident."); return; }
    toast.success("Incident reported to HQ!");
    setShowReport(false);
    setForm({ incident_type: "kiems_failure", ward: "", polling_station: "", description: "" });
    load();
  };

  const handleStatusChange = async (id, newStatus) => {
    await api.updateIncidentStatus(id, newStatus);
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
  };

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(220,38,38,0.2)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-400 mb-1">Ushahidi-Style Reporting</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Incident Command</h1>
              <p className="text-slate-400 text-sm mt-1">Live feed of election day irregularities and security threats.</p>
            </div>
            <button onClick={() => setShowReport(v => !v)}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition shadow-lg shadow-red-500/20">
              <AlertTriangle className="w-4 h-4" /> Report Incident
            </button>
          </div>
        </div>

        {/* Report Form */}
        <AnimatePresence>
          {showReport && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white border border-red-200 rounded-3xl p-6 shadow-md space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">File New Report</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Incident Type</label>
                  <select value={form.incident_type} onChange={e => setForm(f => ({ ...f, incident_type: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-red-400 transition appearance-none">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
                  <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value, polling_station: "" }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-red-400 transition appearance-none">
                    <option value="">— Select Ward —</option>
                    {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station (Optional)</label>
                  <select value={form.polling_station} onChange={e => setForm(f => ({ ...f, polling_station: e.target.value }))} disabled={!form.ward}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-red-400 transition appearance-none disabled:opacity-50">
                    <option value="">— Select Station —</option>
                    {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Detailed Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                    placeholder="Describe exactly what happened..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-red-400 transition resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSubmit}
                  className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition">
                  Submit Alert to HQ
                </button>
                <button onClick={() => setShowReport(false)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feed */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-3xl" />)
          ) : incidents.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="font-black text-slate-500 uppercase tracking-tight text-lg">No Incidents Reported</p>
              <p className="text-slate-400 text-sm mt-2">All polling stations operating normally.</p>
            </div>
          ) : incidents.map(i => {
            const typeInfo = TYPE_CONFIG[i.incident_type] || TYPE_CONFIG.other;
            return (
              <motion.div key={i.id} layout
                className={`bg-white border rounded-3xl p-5 md:p-6 transition-all ${i.status === 'resolved' ? 'opacity-60 border-slate-200' : 'border-red-200 shadow-sm'}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${typeInfo.color}`}>
                        {typeInfo.icon} {typeInfo.label}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(i.reported_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      "{i.description}"
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {i.ward}{i.polling_station ? ` · ${i.polling_station}` : ''}</span>
                      <span className="text-slate-200">|</span>
                      <span>Reported by: {i.reporter_name}</span>
                    </div>
                  </div>
                  
                  <div className="md:text-right shrink-0">
                    <select value={i.status} onChange={(e) => handleStatusChange(i.id, e.target.value)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest outline-none border transition appearance-none text-center cursor-pointer ${
                        i.status === 'pending' ? 'bg-red-50 text-red-600 border-red-200' :
                        i.status === 'investigating' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                      <option value="pending">⚠️ Pending Review</option>
                      <option value="investigating">🔍 Investigating</option>
                      <option value="resolved">✅ Resolved</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
