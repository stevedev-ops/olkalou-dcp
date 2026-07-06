import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, MapPin, Phone, CheckCircle2, Clock, Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

const STATUS_CONFIG = {
  pending:   { label: "Needs Rider",  color: "bg-red-100 text-red-600 border-red-200",    icon: "🔴" },
  assigned:  { label: "Rider Assigned", color: "bg-amber-100 text-amber-700 border-amber-200", icon: "🟡" },
  completed: { label: "Transported",  color: "bg-green-100 text-green-700 border-green-200", icon: "🟢" },
};

function RideCard({ ride, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [rider, setRider] = useState(ride.rider_name || "");
  const [riderPhone, setRiderPhone] = useState(ride.rider_phone || "");
  const cfg = STATUS_CONFIG[ride.status] || STATUS_CONFIG.pending;
  const nextStatus = ride.status === "pending" ? "assigned" : ride.status === "assigned" ? "completed" : "pending";

  const handleStatusChange = async () => {
    setLoading(true);
    const updates = { status: nextStatus };
    if (nextStatus === "assigned" && rider) {
      updates.rider_name = rider;
      updates.rider_phone = riderPhone;
    }
    await api.updateTransport(ride.id, updates);
    onUpdate(ride.id, updates);
    setLoading(false);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-2xl p-5 space-y-4 ${ride.status === 'completed' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black text-slate-900 uppercase tracking-tight text-sm">{ride.member_name}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Phone className="w-3 h-3" />{ride.phone}
            </span>
            <span className="text-slate-200">·</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <MapPin className="w-3 h-3" />{ride.ward}
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-start gap-2">
           <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
           <div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pickup Point</p>
             <p className="font-bold text-slate-700 text-sm">{ride.pickup_location}</p>
           </div>
        </div>
        <div className="flex items-start gap-2 sm:ml-4">
           <div className="w-4 h-4 shrink-0 sm:hidden" />
           <div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
             <p className="font-bold text-slate-700 text-sm">{ride.polling_station || ride.ward}</p>
           </div>
        </div>
      </div>

      {ride.status === "pending" && (
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assign Rider Name</label>
          <input value={rider} onChange={e => setRider(e.target.value)}
            placeholder="Boda rider's name"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold outline-none focus:border-dcp-green/50 transition mb-3" />
          
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assign Rider Phone</label>
          <input value={riderPhone} onChange={e => setRiderPhone(e.target.value)}
            placeholder="07XX XXX XXX"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-bold outline-none focus:border-dcp-green/50 transition" />
        </div>
      )}
      {ride.status === "assigned" && ride.rider_name && (
        <div className="flex flex-col gap-1 text-sm font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <Bike className="w-4 h-4 text-amber-500" />
            Rider: <span className="text-slate-900">{ride.rider_name}</span>
          </div>
          {ride.rider_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-500" />
              Phone: <span className="text-slate-900">{ride.rider_phone}</span>
            </div>
          )}
        </div>
      )}

      {ride.status !== "completed" && (
        <button onClick={handleStatusChange} disabled={loading}
          className={`w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 ${
            ride.status === "pending"
              ? "bg-amber-500 text-white hover:bg-amber-600"
              : "bg-dcp-green text-white hover:bg-dcp-green/90"
          }`}>
          {loading ? "..." : ride.status === "pending" ? "✅ Mark Rider Assigned" : "🏁 Mark Completed — Voted!"}
        </button>
      )}
    </motion.div>
  );
}

export default function Transport({ memberId, isAdmin = false }) {
  const { wardsWithCenters } = useLocationData();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wardFilter, setWardFilter] = useState("");
  const [showRequest, setShowRequest] = useState(false);
  const [form, setForm] = useState({ pickup_location: "", ward: "", polling_station: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getTransport(wardFilter);
    setRides(data?.results || data || []);
    setLoading(false);
  }, [wardFilter]);

  useEffect(() => { load(); }, [load]);

  const handleRequest = async () => {
    if (!form.pickup_location) { toast.error("Please enter your pickup location."); return; }
    const { data, error } = await api.requestTransport(form);
    if (error) { toast.error("Failed to request transport."); return; }
    toast.success("Transport request submitted!");
    setShowRequest(false);
    load();
  };

  const handleUpdate = (id, updates) => {
    setRides(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const pendingCount = rides.filter(r => r.status === "pending").length;
  const assignedCount = rides.filter(r => r.status === "assigned").length;
  const doneCount = rides.filter(r => r.status === "completed").length;

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(251,146,60,0.15)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Election Day · Boda-Boda Network</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Transport Coordinator</h1>
              <p className="text-slate-400 text-sm mt-1">Get every DCP voter to the polls — no one left behind</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <div className="grid grid-cols-3 gap-2">
                {[{ label: "Need Ride", v: pendingCount, c: "text-red-400" }, { label: "Assigned", v: assignedCount, c: "text-amber-400" }, { label: "Done", v: doneCount, c: "text-dcp-green" }].map(s => (
                  <div key={s.label} className="bg-white/10 rounded-xl px-3 py-2 text-center border border-white/10">
                    <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowRequest(v => !v)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition shadow-lg w-full sm:w-auto mt-2 sm:mt-0">
                <Plus className="w-4 h-4" /> Need Ride
              </button>
            </div>
          </div>
        </div>

        {/* Request Ride Form */}
        <AnimatePresence>
          {showRequest && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Request a Ride to the Polls</p>
              <div className="grid sm:grid-cols-3 gap-3">
                <input value={form.pickup_location} onChange={e => setForm(f => ({ ...f, pickup_location: e.target.value }))}
                  placeholder="Your pickup location / village"
                  className="px-4 py-3 bg-white border border-amber-200 rounded-2xl text-sm font-bold outline-none focus:border-amber-400 transition" />
                <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))}
                  className="px-4 py-3 bg-white border border-amber-200 rounded-2xl text-sm font-bold outline-none focus:border-amber-400 transition appearance-none">
                  <option value="">My Ward</option>
                  {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
                </select>
                <button onClick={handleRequest}
                  className="px-4 py-3 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition">
                  Submit Request
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ward Filter */}
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

        {/* Rides Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-44 bg-slate-200 animate-pulse rounded-2xl" />)}
          </div>
        ) : rides.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
            <Bike className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="font-black text-slate-500 uppercase tracking-tight text-lg">No Transport Requests</p>
            <p className="text-slate-400 text-sm mt-2">Supporters needing rides will appear here on election day.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {rides.map(r => <RideCard key={r.id} ride={r} onUpdate={handleUpdate} />)}
          </div>
        )}
      </div>
    </div>
  );
}
