import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Send, CheckCircle2, AlertTriangle, MapPin, ShieldCheck, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { exportToCSV } from "../lib/exportUtils";
import { useLocationData } from "../contexts/LocationContext";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageToggle from "../components/LanguageToggle";

function TallyBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-sm font-black text-slate-900">{count.toLocaleString()} <span className="text-slate-400 text-xs font-bold">({pct}%)</span></span>
      </div>
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
        <div className={`${color} h-3 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Pvt({ isAdmin = false }) {
  const { wardsWithCenters } = useLocationData();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    polling_station: "",
    ward: "",
    dcp_votes: "",
    uda_votes: "",
    other_votes: "",
    total_votes_cast: "",
    registered_voters: "",
    notes: "",
    form_34a_image: null,
  });
  const availableStations = form.ward
    ? wardsWithCenters.find(w => w.name === form.ward)?.centers || []
    : [];

  const load = useCallback(async () => {
    setLoading(true);
    const { data: d } = await api.getTallies();
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async () => {
    if (!form.polling_station || !form.dcp_votes) {
      toast.error("Please fill in polling station and DCP votes.");
      return;
    }
    setSubmitting(true);
    let payload = form;
    if (form.form_34a_image) {
      payload = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined) {
          payload.append(key, form[key]);
        }
      });
    }

    const { error } = await api.submitTally(payload);
    if (error) { toast.error("Failed to submit tally."); }
    else { toast.success("Tally submitted! ✅"); setShowForm(false); load(); }
    setSubmitting(false);
  };

  const summary = data?.summary;
  const records = data?.records || [];
  const dcpLeading = summary && summary.dcp_total > summary.uda_total;

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className={`absolute inset-0 pointer-events-none ${dcpLeading ? "bg-[radial-gradient(circle_at_50%_0%,rgba(0,132,61,0.3)_0%,transparent_60%)]" : "bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.15)_0%,transparent_60%)]"}`} />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Parallel Vote Tabulation · Form 34A</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Live Results</h1>
              <p className="text-slate-400 text-sm mt-1">
                {summary ? `${summary.stations_reported} stations reported` : "Awaiting field reports..."}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {summary && summary.stations_reported > 0 && (
                <div className={`rounded-2xl px-6 py-3 border text-center ${dcpLeading ? "bg-dcp-green/20 border-dcp-green/30" : "bg-red-900/30 border-red-500/30"}`}>
                  <p className={`text-3xl font-black ${dcpLeading ? "text-dcp-green" : "text-red-400"}`}>
                    {dcpLeading ? "DCP 📈" : "UDA 📉"}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leading</p>
                </div>
              )}
              <button onClick={() => exportToCSV(records, `PVT_Tallies_${new Date().toISOString().split('T')[0]}`)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition shadow-lg">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => setShowForm(v => !v)}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 transition shadow-lg shadow-dcp-green/20">
                <Plus className="w-4 h-4" /> Submit Tally
              </button>
            </div>
          </div>
        </div>

        {/* Submit Form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-dcp-green/20 rounded-3xl p-6 shadow-md space-y-5 relative">
            <div className="absolute top-6 right-6">
              <LanguageToggle />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-dcp-green" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('pvt_header')}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
                <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value, polling_station: "" }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-dcp-green/50 transition appearance-none">
                  <option value="">— Select Ward —</option>
                  {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station</label>
                <select value={form.polling_station} onChange={e => setForm(f => ({ ...f, polling_station: e.target.value }))}
                  disabled={!form.ward}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-dcp-green/50 transition appearance-none disabled:opacity-50">
                  <option value="">— Select Station —</option>
                  {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {[
                { key: "dcp_votes", label: t('dcp_votes'), color: "focus:border-dcp-green/50" },
                { key: "uda_votes", label: t('uda_votes'), color: "focus:border-red-300" },
                { key: "other_votes", label: t('other_votes'), color: "" },
                { key: "total_votes_cast", label: t('total_votes'), color: "" },
                { key: "registered_voters", label: t('reg_voters'), color: "" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{f.label}</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={form[f.key] || ""}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none transition ${f.color || "focus:border-slate-400"}`} />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{t('notes')}</label>
                <textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-slate-400 transition resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{t('upload_34a')}</label>
                <input type="file" accept="image/*" capture="environment" onChange={e => setForm(f => ({ ...f, form_34a_image: e.target.files[0] }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-slate-400 transition" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSubmit} disabled={submitting}
                className="px-6 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 disabled:opacity-50 transition">
                {submitting ? "Submitting..." : t('btn_submit_results')}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">
                {t('btn_cancel')}
              </button>
            </div>
          </motion.div>
        )}

        {/* Aggregate Results */}
        {summary && summary.stations_reported > 0 && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aggregate Tally · All Stations</p>
            <div className="space-y-4">
              <TallyBar label="DCP" count={summary.dcp_total} total={summary.total_cast} color="bg-dcp-green" />
              <TallyBar label="UDA" count={summary.uda_total} total={summary.total_cast} color="bg-red-400" />
              <TallyBar label="Others" count={summary.other_total} total={summary.total_cast} color="bg-slate-300" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">{summary.total_cast.toLocaleString()}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Votes Cast</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-black ${dcpLeading ? "text-dcp-green" : "text-red-500"}`}>{summary.dcp_pct}%</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">DCP Share</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-slate-900">{summary.stations_reported}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stations In</p>
              </div>
            </div>
          </div>
        )}

        {/* Station Records */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Station-by-Station Returns</p>
          </div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="px-6 py-4 animate-pulse"><div className="h-4 bg-slate-200 rounded" /></div>)
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-400 uppercase tracking-tight">No results submitted yet</p>
              <p className="text-slate-300 text-xs mt-1">Agents at polling stations submit Form 34A tallies here</p>
            </div>
          ) : records.map((r, i) => {
            const dcpWin = r.dcp_votes >= r.uda_votes;
            return (
              <div key={r.id} className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 last:border-b-0 gap-4 ${dcpWin ? "bg-dcp-green/5" : "bg-red-50/30"}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-900 uppercase tracking-tight text-sm truncate">{r.polling_station}</p>
                    {r.form_34a_image && (
                      <a href={r.form_34a_image} target="_blank" rel="noreferrer" className="text-[9px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-600 font-bold uppercase tracking-widest hover:bg-blue-200">
                        View 34A
                      </a>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.ward}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-center">
                  <div>
                    <p className="text-lg font-black text-dcp-green">{r.dcp_votes}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase">DCP</p>
                  </div>
                  <div className="text-slate-300 font-black">vs</div>
                  <div>
                    <p className="text-lg font-black text-red-400">{r.uda_votes}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase">UDA</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${dcpWin ? "bg-dcp-green/10 text-dcp-green" : "bg-red-100 text-red-500"}`}>
                    {dcpWin ? "DCP ✓" : "UDA ✗"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
