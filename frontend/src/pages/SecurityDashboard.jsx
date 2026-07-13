import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle, Navigation, Clock, ShieldCheck, MapPin, EyeOff, Users, AlertTriangle, Building2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

export default function SecurityDashboard({ profile }) {
  const rank = profile?.security_rank || 'guard';

  if (rank === 'ward_commander') {
    return <WardCommanderView profile={profile} />;
  } else if (rank === 'station_commander') {
    return <StationCommanderView profile={profile} />;
  } else {
    return <GuardView profile={profile} />;
  }
}

function GuardView({ profile }) {
  const { wardsWithCenters } = useLocationData();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCovert, setIsCovert] = useState(false);
  const [panicLockedUntil, setPanicLockedUntil] = useState(() => {
    const stored = localStorage.getItem('dcp_panic_lock');
    return stored ? parseInt(stored) : null;
  });
  const [panicRemaining, setPanicRemaining] = useState(0);

  useEffect(() => {
    if (!panicLockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, panicLockedUntil - Date.now());
      setPanicRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setPanicLockedUntil(null);
        localStorage.removeItem('dcp_panic_lock');
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [panicLockedUntil]);
  
  const [form, setForm] = useState({ 
    ward: profile?.ward || "", 
    polling_station: profile?.polling_station || "", 
    status: "all_clear", 
    notes: "" 
  });
  
  const availableStations = form.ward ? wardsWithCenters.find(w => w.name === form.ward)?.centers || [] : [];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getSecurityLogs();
    setLogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (statusOverride = null) => {
    const finalStatus = statusOverride || form.status;
    if (!form.ward && finalStatus !== 'panic') {
      toast.error("Ward is required.");
      return;
    }
    
    let finalNotes = form.notes;
    if (finalStatus === 'panic' && !finalNotes) finalNotes = "EMERGENCY PANIC TRIGGERED";
    
    let payload = { ...form, status: finalStatus, notes: finalNotes };
    
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      payload.latitude = position.coords.latitude;
      payload.longitude = position.coords.longitude;
    } catch (e) {
      console.warn("Could not get GPS coordinates");
    }
    
    const { error } = await api.submitSecurityLog(payload);
    
    if (error && finalStatus === 'panic') {
      toast.error("Network failure. Triggering SMS Fallback...");
      const smsBody = `EMERGENCY-DCP-WARD:${form.ward || 'UNKNOWN'}-STATION:${form.polling_station || 'UNKNOWN'}-GPS:${payload.latitude || 'None'},${payload.longitude || 'None'}`;
      window.location.href = `sms:0700000000?body=${encodeURIComponent(smsBody)}`;
      return;
    }
    
    if (error) { toast.error(error.message || "Failed to submit log."); return; }
    
    if (finalStatus === 'panic') {
      toast.success("PANIC ALERT SENT TO HQ!");
      setIsCovert(false);
      const lockUntil = Date.now() + 3 * 60 * 1000;
      setPanicLockedUntil(lockUntil);
      localStorage.setItem('dcp_panic_lock', lockUntil.toString());
    } else {
      toast.success("SitRep logged successfully.");
    }
    
    setForm(f => ({ ...f, notes: "" }));
    load();
  };
  
  const [tapCount, setTapCount] = useState(0);
  useEffect(() => {
    if (tapCount >= 3) {
      handleSubmit('panic');
      setTapCount(0);
    }
    const timer = setTimeout(() => setTapCount(0), 1000);
    return () => clearTimeout(timer);
  }, [tapCount]);
  
  if (isCovert) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setTapCount(c => c + 1)}>
        <p className="text-slate-800 text-6xl font-black font-mono">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-6 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(16,185,129,0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-dcp-green/10 text-dcp-green flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rank: Guard</p>
            <h1 className="text-xl font-black text-white uppercase tracking-widest">Post Command</h1>
          </div>
          <button onClick={() => setIsCovert(true)} title="Covert Mode" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center shrink-0 transition">
            <EyeOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`rounded-3xl p-6 border text-center ${panicLockedUntil ? 'bg-slate-100 border-slate-200' : 'bg-red-50 border-red-200'}`}>
        <h3 className={`font-black uppercase tracking-widest mb-2 text-sm ${panicLockedUntil ? 'text-slate-500' : 'text-red-800'}`}>
          Emergency Escalation
        </h3>
        <button onClick={() => {
            if (panicLockedUntil) return;
            if(confirm("EMERGENCY: Are you sure you want to trigger a Panic Alert? This will instantly dispatch backup.")) {
              handleSubmit('panic');
            }
          }}
          disabled={!!panicLockedUntil}
          className={`w-full py-6 text-white rounded-[2rem] font-black text-lg shadow-xl transition transform flex items-center justify-center gap-3 ${
            panicLockedUntil 
              ? 'bg-slate-400 cursor-not-allowed shadow-none' 
              : 'bg-red-600 hover:bg-red-700 shadow-red-500/30 hover:scale-[1.02] active:scale-95'
          }`}>
          <ShieldAlert className="w-8 h-8" />
          {panicLockedUntil ? `PANIC LOCKED (${Math.floor(panicRemaining / 60)}:${(panicRemaining % 60).toString().padStart(2, '0')})` : 'TRIGGER PANIC'}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
            <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value, polling_station: "" }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green transition appearance-none">
              <option value="">— Select Ward —</option>
              {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Station</label>
            <select value={form.polling_station} onChange={e => setForm(f => ({ ...f, polling_station: e.target.value }))} disabled={!form.ward}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green transition appearance-none disabled:opacity-50">
              <option value="">— Select Station —</option>
              {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Current Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green transition appearance-none">
            <option value="all_clear">🟢 All Clear - Routine</option>
            <option value="crowd_building">🟡 Crowd Building</option>
            <option value="tense">🟠 Tense Situation</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Optional Notes</label>
          <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Anything to report?"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green transition" />
        </div>

        <button onClick={() => handleSubmit()}
          className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition">
          <CheckCircle className="w-4 h-4" /> Submit SitRep
        </button>
      </div>
    </div>
  );
}

function StationCommanderView({ profile }) {
  const [logs, setLogs] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  
  useEffect(() => {
    api.getSecurityLogs().then(({data}) => setLogs(data || []));
    api.getSecurityPersonnel().then(({data}) => setPersonnel(data || []));
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-blue-400 mb-1">Station Commander</p>
            <h1 className="text-2xl font-black text-white italic uppercase">{profile.polling_station || "Station Command"}</h1>
            <p className="text-slate-400 text-xs mt-1">Manage your team of 9 guards and oversee station security.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
            <h2 className="font-black uppercase tracking-widest text-slate-800">Station Roster</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">You are responsible for ensuring your 9 assigned guards submit their SitReps.</p>
          <div className="space-y-3">
             {personnel.length === 0 ? (
               <p className="text-sm text-slate-400">No guards enrolled at this station yet.</p>
             ) : (
               personnel.map(p => (
                 <div key={p.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                   <div>
                     <p className="font-bold text-slate-700 text-sm">{p.full_name}</p>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guard</p>
                   </div>
                   <a href={`tel:${p.phone}`} className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition">
                     <PhoneCall size={12} /> {p.phone}
                   </a>
                 </div>
               ))
             )}
          </div>
          <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Station Check-ins</p>
             {logs.slice(0, 5).map(l => (
               <div key={l.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                 <div>
                   <p className="font-bold text-slate-700 text-sm">{l.guard_name}</p>
                   <p className="text-[10px] text-slate-500">{new Date(l.logged_at).toLocaleTimeString()}</p>
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${l.status === 'panic' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{l.status.replace('_', ' ')}</span>
               </div>
             ))}
          </div>
        </div>

        <div className="space-y-6">
          <GuardView profile={profile} />
        </div>
      </div>
    </div>
  );
}

function WardCommanderView({ profile }) {
  const [logs, setLogs] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  
  useEffect(() => {
    api.getSecurityLogs().then(({data}) => setLogs(data || []));
    api.getSecurityPersonnel().then(({data}) => setPersonnel(data || []));
  }, []);

  const panics = logs.filter(l => l.status === 'panic' && l.resolution_action === 'pending');

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(168,85,247,0.15)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <MapPin className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-400 mb-1">Ward Commander</p>
              <h1 className="text-2xl font-black text-white italic uppercase">{profile.ward || "Ward Command"}</h1>
              <p className="text-slate-400 text-sm mt-1">Overseeing all polling stations and station commanders in this ward.</p>
            </div>
          </div>
        </div>
      </div>

      {panics.length > 0 && (
        <div className="bg-red-600 rounded-3xl p-6 shadow-2xl text-white border border-red-500">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={24} className="animate-pulse" />
            <h2 className="text-xl font-black uppercase tracking-widest">Active Ward Panics</h2>
          </div>
          <div className="space-y-3">
            {panics.map(p => (
              <div key={p.id} className="bg-red-800/50 p-4 rounded-xl">
                <p className="font-bold">{p.polling_station}</p>
                <p className="text-sm">Triggered by {p.guard_name}</p>
                <p className="text-xs opacity-75">{new Date(p.logged_at).toLocaleTimeString()}</p>
              </div>
            ))}
            <p className="text-xs text-white/80 mt-2 italic">Note: Only HQ can resolve panic alerts. You must coordinate the response.</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
         <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Users size={20} /></div>
           <h2 className="font-black uppercase tracking-widest text-slate-800">Ward Personnel Roster</h2>
         </div>
         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
           {personnel.length === 0 ? (
             <p className="text-sm text-slate-400">No personnel enrolled in this ward yet.</p>
           ) : (
             personnel.map(p => (
               <div key={p.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                 <div>
                   <p className="font-bold text-slate-700 text-sm">{p.full_name}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     {p.security_rank.replace('_', ' ')} · {p.polling_station || 'No Station'}
                   </p>
                 </div>
                 <a href={`tel:${p.phone}`} className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition shrink-0">
                   <PhoneCall size={14} />
                 </a>
               </div>
             ))
           )}
         </div>

         <h2 className="font-black uppercase tracking-widest text-slate-800 mb-4 pt-6 border-t border-slate-100">Recent Station Check-ins</h2>
         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {logs.slice(0, 15).map(l => (
             <div key={l.id} className={`p-4 rounded-2xl border ${l.status === 'panic' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
               <div className="flex justify-between items-start mb-2">
                 <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                   l.status === 'panic' ? 'bg-red-600 text-white' : 
                   l.status === 'all_clear' ? 'bg-dcp-green/10 text-dcp-green' : 'bg-amber-100 text-amber-800'
                 }`}>
                   {l.status.replace('_', ' ')}
                 </span>
                 <span className="text-[10px] text-slate-400 font-bold">{new Date(l.logged_at).toLocaleTimeString()}</span>
               </div>
               <p className="text-sm font-bold text-slate-700">{l.polling_station}</p>
               <p className="text-xs text-slate-500">Logged by: {l.guard_name}</p>
             </div>
           ))}
         </div>
      </div>
    </div>
  );
}
