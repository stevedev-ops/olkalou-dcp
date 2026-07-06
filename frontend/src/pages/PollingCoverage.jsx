import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MapPin, Search, ShieldCheck, AlertTriangle, Users, BarChart3, CheckCircle } from "lucide-react";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";


function CoverageBar({ count, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;
  const color = count === 0 ? "bg-red-400" : count < 3 ? "bg-amber-400" : "bg-dcp-green";
  return (
    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
      <div className={`${color} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusBadge({ count }) {
  if (count === 0)
    return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-600 rounded-full border border-red-200">🔴 Zero</span>;
  if (count < 3)
    return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 rounded-full border border-amber-200">🟡 Weak</span>;
  return <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-green-100 text-green-700 rounded-full border border-green-200">🟢 Active</span>;
}

export default function PollingCoverage() {
  const { wardsWithCenters } = useLocationData();
  
  const ALL_STATIONS = useMemo(() => {
    if (!wardsWithCenters) return [];
    return wardsWithCenters.flatMap(w =>
      w.centers.map(c => ({ station: c, ward: w.name }))
    );
  }, [wardsWithCenters]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("all");
  const [view, setView] = useState("stations"); // stations | wards

  useEffect(() => {
    api.getPollingCoverage().then(({ data: d }) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  // Merge known stations with live DB counts
  const merged = ALL_STATIONS.map(({ station, ward }) => {
    const match = data?.station_all?.find(
      s => s.station.toLowerCase().includes(station.toLowerCase()) ||
           station.toLowerCase().includes(s.station.toLowerCase().split(' ')[0])
    );
    return { station, ward, count: match?.count || 0 };
  });

  const maxCount = Math.max(...merged.map(s => s.count), 1);

  const filtered = merged.filter(s => {
    const matchSearch = !search ||
      s.station.toLowerCase().includes(search.toLowerCase()) ||
      s.ward.toLowerCase().includes(search.toLowerCase());
    const matchWard = wardFilter === "all" || s.ward === wardFilter;
    return matchSearch && matchWard;
  });

  const zeroCount = merged.filter(s => s.count === 0).length;
  const weakCount = merged.filter(s => s.count > 0 && s.count < 3).length;
  const activeCount = merged.filter(s => s.count >= 3).length;

  const wardSummary = wardsWithCenters.map(w => ({
    ward: w.name,
    total: w.centers.length,
    members: data?.ward_summary?.find(ws => ws.ward === w.name)?.count || 0,
    zeroCenters: merged.filter(s => s.ward === w.name && s.count === 0).length,
  }));

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400 mb-1">
                HQ Intelligence · Ol Kalou Constituency
              </p>
              <h1 className="text-3xl font-black text-slate-900 italic">Polling Station Coverage</h1>
              <p className="text-sm text-slate-500 mt-1">142 stations across 5 wards — see where DCP has zero presence</p>
            </div>
            <div className="flex gap-2">
              {['stations', 'wards'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition ${view === v ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Members", value: loading ? "—" : data?.total || 0, icon: <Users className="w-5 h-5" />, color: "text-slate-900" },
            { label: "🔴 Zero Coverage", value: loading ? "—" : zeroCount, sub: "stations need agents", color: "text-red-600" },
            { label: "🟡 Weak (< 3)", value: loading ? "—" : weakCount, sub: "stations at risk", color: "text-amber-600" },
            { label: "🟢 Active Stations", value: loading ? "—" : activeCount, sub: "stations secured", color: "text-dcp-green" },
          ].map(card => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{card.label}</p>
              <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
              {card.sub && <p className="text-[10px] text-slate-400 mt-1">{card.sub}</p>}
            </motion.div>
          ))}
        </div>

        {view === 'stations' && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search polling station or ward..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-dcp-green/50 transition" />
              </div>
              <select value={wardFilter} onChange={e => setWardFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-dcp-green/50 transition appearance-none">
                <option value="all">All Wards</option>
                {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
              </select>
            </div>

            {/* Station List */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
              <div className="grid grid-cols-12 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[520px]">
                <div className="col-span-1">#</div>
                <div className="col-span-5">Polling Station</div>
                <div className="col-span-3">Ward</div>
                <div className="col-span-2 text-center">Members</div>
                <div className="col-span-1 text-right">Status</div>
              </div>
              <div className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="px-6 py-4 animate-pulse flex gap-4 min-w-[520px]">
                      <div className="h-3 bg-slate-200 rounded flex-1" />
                      <div className="h-3 bg-slate-200 rounded w-20" />
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest">
                    No stations match your filter
                  </div>
                ) : filtered.map((s, i) => (
                  <div key={s.station} className={`grid grid-cols-12 items-center px-6 py-4 gap-2 hover:bg-slate-50 transition min-w-[520px] ${s.count === 0 ? 'bg-red-50/30' : ''}`}>
                    <div className="col-span-1 text-[10px] font-black text-slate-400">#{i + 1}</div>
                    <div className="col-span-5">
                      <p className="font-black text-slate-900 text-sm truncate">{s.station}</p>
                      <CoverageBar count={s.count} max={maxCount} />
                    </div>
                    <div className="col-span-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />{s.ward}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`text-2xl font-black ${s.count === 0 ? 'text-red-400' : s.count < 3 ? 'text-amber-500' : 'text-dcp-green'}`}>{s.count}</span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <StatusBadge count={s.count} />
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </>
        )}

        {view === 'wards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wardSummary.map(w => (
              <motion.div key={w.ward} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ward</p>
                  <h3 className="text-xl font-black text-slate-900 uppercase">{w.ward}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-2xl font-black text-slate-900">{w.members}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Members</p>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <p className="text-2xl font-black text-slate-900">{w.total}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Stations</p>
                  </div>
                  <div className={`rounded-2xl p-3 ${w.zeroCenters > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    <p className={`text-2xl font-black ${w.zeroCenters > 0 ? 'text-red-500' : 'text-dcp-green'}`}>{w.zeroCenters}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Gap Zones</p>
                  </div>
                </div>
                {w.zeroCenters > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                      {w.zeroCenters} station{w.zeroCenters !== 1 ? 's' : ''} need urgent agents
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
