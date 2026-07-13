import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, Clock, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

export default function SecurityCommand() {
  const [logs, setLogs] = useState([]);
  const [miaList, setMiaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, panic, routine
  
  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: logsData }, { data: miaData }] = await Promise.all([
      api.getSecurityLogs(),
      api.getSecurityMIA()
    ]);
    setLogs(logsData || []);
    setMiaList(miaData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Polling for panics
  useEffect(() => {
    const interval = setInterval(load, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [load]);

  const handleResolve = async (id, action) => {
    if(confirm("Mark this panic alert as resolved with action: " + action + "?")) {
      const { error } = await api.resolveSecurityLog(id, action);
      if (!error) {
        toast.success("Alert resolved.");
        load();
      }
    }
  };

  const panics = logs.filter(l => l.status === 'panic' && l.resolution_action === 'pending');
  const filteredLogs = logs.filter(l => {
    if (filter === 'panic') return l.status === 'panic';
    if (filter === 'routine') return l.status !== 'panic';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-slate-950 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-dcp-green mb-1">HQ Dashboard</p>
            <h1 className="text-3xl font-black text-white italic uppercase">Security Command</h1>
            <p className="text-slate-400 text-sm mt-1">Live threat map and guard status logs.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${filter === 'all' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>All</button>
            <button onClick={() => setFilter('panic')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${filter === 'panic' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}>Panics</button>
            <button onClick={() => setFilter('routine')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${filter === 'routine' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>Routine</button>
          </div>
        </div>
      </div>

      {/* MIA Banner */}
      <AnimatePresence>
        {miaList.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-amber-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 text-amber-500 rounded-full animate-pulse"><AlertTriangle size={24} /></div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest">Comms Lost (MIA)</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">The following personnel have failed to check in within the last 30 minutes.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {miaList.map(m => (
                <div key={m.id} className="bg-black/50 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-black text-white">{m.full_name}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">{m.security_rank.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-bold mb-1">{m.ward} {m.polling_station ? `- ${m.polling_station}` : ''}</p>
                  <a href={`tel:${m.phone}`} className="text-blue-400 text-xs font-bold hover:underline">📞 {m.phone}</a>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Panics Banner */}
      <AnimatePresence>
        {panics.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-red-600 rounded-3xl p-6 shadow-2xl shadow-red-600/20 text-white border-2 border-red-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-full animate-pulse"><AlertTriangle size={24} /></div>
              <h2 className="text-xl font-black uppercase tracking-widest">Active Panic Alerts</h2>
            </div>
            <div className="space-y-3">
              {panics.map(p => (
                <div key={p.id} className="bg-red-700/50 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-red-500/50">
                  <div>
                    <p className="font-black text-lg">{p.ward} - {p.polling_station}</p>
                    <p className="text-sm opacity-80">Triggered by {p.guard_name} ({p.guard_phone}) at {new Date(p.logged_at).toLocaleTimeString()}</p>
                    {p.notes && <p className="text-sm bg-red-800/50 p-2 rounded-lg mt-2 font-medium italic">"{p.notes}"</p>}
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 text-center mb-1">Resolve Action</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleResolve(p.id, 'dispatched_police')} className="px-3 py-2 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition">🚓 Police</button>
                      <button onClick={() => handleResolve(p.id, 'dispatched_qrt')} className="px-3 py-2 bg-dcp-green text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition">🛡️ QRT</button>
                      <button onClick={() => handleResolve(p.id, 'false_alarm')} className="px-3 py-2 bg-slate-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-500 transition">❌ False Alarm</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Log Feed */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-slate-200 animate-pulse rounded-3xl" />)
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
            <Shield className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="font-black text-slate-500 uppercase tracking-tight text-lg">No Logs Found</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <motion.div key={log.id} layout
              className={`bg-white border rounded-2xl p-5 transition-all ${log.status === 'panic' && log.resolution_action !== 'pending' ? 'opacity-60 border-slate-200' : log.status === 'panic' ? 'border-red-400 bg-red-50 shadow-md' : 'border-slate-100'}`}>
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    log.status === 'panic' ? 'bg-red-200 text-red-700' : 
                    log.status === 'all_clear' ? 'bg-dcp-green/10 text-dcp-green' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {log.status === 'panic' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-slate-900">{log.ward} {log.polling_station ? `- ${log.polling_station}` : ''}</p>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        log.status === 'panic' ? 'bg-red-600 text-white' : 
                        log.status === 'all_clear' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {log.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(log.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>·</span>
                      <span>Guard: {log.guard_name}</span>
                      {log.latitude && log.longitude && (
                        <>
                          <span>·</span>
                          <a href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                            <MapPin size={12} /> View GPS
                          </a>
                        </>
                      )}
                      {log.resolution_action && log.resolution_action !== 'pending' && (
                        <>
                          <span>·</span>
                          <span className="text-dcp-green">Resolved: {log.resolution_action.replace('_', ' ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {log.notes && (
                  <div className="md:max-w-md bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-sm font-medium text-slate-700">"{log.notes}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
