import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users, MapPin, ShieldCheck, Search, ChevronLeft, ChevronRight, AlertTriangle, Target } from "lucide-react";
import { api } from "../lib/api";

const WARD_CHART_PAGE_SIZE = 5;
const WARD_LIST_PAGE_SIZE = 10;
const POLLING_PAGE_SIZE = 10;

function Pagination({ page, totalPages, onPrev, onNext, totalItems, pageSize }) {
  if (totalPages <= 1) return null;
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, totalItems);
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {from}–{to} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={12} /> Prev
        </button>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {page + 1} / {totalPages}
        </span>
        <button
          onClick={onNext}
          disabled={page >= totalPages - 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          Next <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

export default function Reports({ memberId }) {
  const [reportMode, setReportMode] = useState('all'); // all | verified | unverified
  const [totalMembers, setTotalMembers] = useState(0);
  const [wardSummary, setWardSummary] = useState([]);
  const [pollingSummary, setPollingSummary] = useState([]);
  const [pollingSearch, setPollingSearch] = useState("");
  const [rootCount, setRootCount] = useState(0);
  const [delegateCount, setDelegateCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [demographics, setDemographics] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [saturation, setSaturation] = useState({ secured: [], at_risk: [] });


  // Pagination states
  const [wardChartPage, setWardChartPage] = useState(0);
  const [wardListPage, setWardListPage] = useState(0);
  const [pollingPage, setPollingPage] = useState(0);

  // Reset pages when mode or search changes
  useEffect(() => { setPollingPage(0); setWardChartPage(0); setWardListPage(0); }, [reportMode]);
  useEffect(() => { setPollingPage(0); }, [pollingSearch]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: statsData, error: statsError } = await api.getReportStats(memberId, reportMode);

      if (!memberId) {
        setDemoLoading(true);
        try {
          const { data: demo } = await api.getDemographicInsights();
          if (demo) setDemographics(demo);
        } catch (err) { console.error(err); }
        finally { setDemoLoading(false); }
      }


      if (!statsError && statsData) {
        setWardSummary(statsData.ward_summary || []);
        setPollingSummary(statsData.polling_summary || []);
        setTotalMembers(statsData.total || 0);

        if (memberId) {
          const { data: insights } = await api.getInsights(memberId);
          if (insights) {
            setRootCount(insights.direct_invites);
            setDelegateCount(insights.network_size - insights.direct_invites);
          }
        } else {
          const { data: stats } = await api.getStats();
          if (stats) {
            setRootCount(stats.total_roots);
            setDelegateCount(stats.total_registered - stats.total_roots);
          }
        }
      }
    } catch (err) {
      console.error("Reports fetch error:", err);
      setTotalMembers(0);
      setWardSummary([]);
      setPollingSummary([]);
      setRootCount(0);
      setDelegateCount(0);
    } finally {
      setLoading(false);
    }
  }, [memberId, reportMode]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Derived paginated slices
  const wardChartTotalPages = Math.ceil(wardSummary.length / WARD_CHART_PAGE_SIZE);
  const wardChartSlice = wardSummary.slice(
    wardChartPage * WARD_CHART_PAGE_SIZE,
    (wardChartPage + 1) * WARD_CHART_PAGE_SIZE
  );

  const wardListTotalPages = Math.ceil(wardSummary.length / WARD_LIST_PAGE_SIZE);
  const wardListSlice = wardSummary.slice(
    wardListPage * WARD_LIST_PAGE_SIZE,
    (wardListPage + 1) * WARD_LIST_PAGE_SIZE
  );

  const filteredPolling = pollingSummary.filter(item =>
    item.station.toLowerCase().includes(pollingSearch.toLowerCase()) ||
    item.ward.toLowerCase().includes(pollingSearch.toLowerCase())
  );
  const pollingTotalPages = Math.ceil(filteredPolling.length / POLLING_PAGE_SIZE);
  const pollingSlice = filteredPolling.slice(
    pollingPage * POLLING_PAGE_SIZE,
    (pollingPage + 1) * POLLING_PAGE_SIZE
  );

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400 mb-2">
                Recruitment Analytics
              </p>
              <h1 className="text-3xl font-black text-slate-900">My Network Insights</h1>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                Official tracking of members manually recruited via your referral link.
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-50 border border-slate-200 px-5 py-4">
              <ShieldCheck className="text-dcp-green w-6 h-6" />
              <span className="text-sm font-bold uppercase tracking-[0.28em] text-slate-700">Official Report</span>
            </div>
          </div>
        </div>

        {/* ── Three-Mode Intelligence Toggle ── */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-2 flex flex-col sm:flex-row gap-2">
          {[
            { id: 'all', label: '📋 All Registrants', desc: 'Self-reported location' },
            { id: 'verified', label: '✅ IEBC Verified Voters', desc: 'Official IEBC ward names' },
            { id: 'unverified', label: '🆕 Unverified / New', desc: 'Not in 2022 register' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setReportMode(tab.id)}
              className={`flex-1 text-center py-3 px-4 rounded-2xl transition-all ${
                reportMode === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <p className="text-xs font-black uppercase tracking-wider">{tab.label}</p>
              <p className={`text-[9px] font-bold mt-0.5 ${
                reportMode === tab.id ? 'text-slate-300' : 'text-slate-400'
              }`}>{tab.desc}</p>
            </button>
          ))}
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-3">Total Registrations</p>
            <p className="text-4xl font-black text-slate-900">{totalMembers}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-3">{memberId ? "Direct Recruits" : "Root Mobilizers"}</p>
            <p className="text-4xl font-black text-slate-900">{rootCount}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-3">{memberId ? "Network Downline" : "Delegates & Members"}</p>
            <p className="text-4xl font-black text-slate-900">{delegateCount}</p>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
          {/* Registration by Ward — paginated chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Most Active Wards</p>
                <h2 className="text-xl font-black text-slate-900">
                  {reportMode === 'verified' ? 'IEBC Official Ward Breakdown' : reportMode === 'unverified' ? 'Unverified Members by Ward' : 'All Registrants by Ward'}
                </h2>
              </div>
              <BarChart3 className="w-6 h-6 text-slate-600" />
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Loading ward summary…</p>
            ) : wardSummary.length === 0 ? (
              <p className="text-sm text-slate-500">No ward data available.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {wardChartSlice.map((item) => {
                    const pct = totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0;
                    return (
                      <div key={item.ward} className="p-4 bg-slate-50 rounded-3xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-black text-slate-900">{item.ward}</p>
                          <span className="text-sm font-black text-slate-700">{item.count} <span className="text-slate-400 font-bold text-xs">({pct}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-dcp-green h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Pagination
                  page={wardChartPage}
                  totalPages={wardChartTotalPages}
                  onPrev={() => setWardChartPage(p => p - 1)}
                  onNext={() => setWardChartPage(p => p + 1)}
                  totalItems={wardSummary.length}
                  pageSize={WARD_CHART_PAGE_SIZE}
                />
              </>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-900">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Quick Breakdown</p>
                <h2 className="text-xl font-black text-slate-900">Member Distribution</h2>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-black text-slate-900 uppercase tracking-[0.28em]">
                <span>{memberId ? "Direct Recruits" : "Root Mobilizers"}</span>
                <span>{rootCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 uppercase tracking-[0.28em]">
                <span>{memberId ? "Network Downline" : "Delegates"}</span>
                <span>{delegateCount}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm font-black text-dcp-green uppercase tracking-[0.28em]">
                <span>Total Network</span>
                <span>{rootCount + delegateCount}</span>
              </div>
            </div>
          </div>
        </section>

        

        
        {/* Demographics AI Insights */}
        {!memberId && (
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
             <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Users className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-400 font-black">AI Demographics</p>
                  <h2 className="text-xl font-black text-slate-900">Member Analytics</h2>
               </div>
             </div>
             
             {demoLoading ? (
               <p className="text-sm text-slate-500">Generating AI demographic insights...</p>
             ) : demographics ? (
               <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Gender Distribution</p>
                     <div className="flex items-center gap-4">
                       <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                         <p className="text-2xl font-black text-slate-800">{demographics.gender.male}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Male</p>
                       </div>
                       <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
                         <p className="text-2xl font-black text-slate-800">{demographics.gender.female}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Female</p>
                       </div>
                     </div>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Age Buckets</p>
                     <div className="flex items-center gap-2">
                       <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                         <p className="text-lg font-black text-slate-800">{demographics.age_buckets.youth}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Youths</p>
                       </div>
                       <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                         <p className="text-lg font-black text-slate-800">{demographics.age_buckets.adult}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Adults</p>
                       </div>
                       <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                         <p className="text-lg font-black text-slate-800">{demographics.age_buckets.elder}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Elders</p>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden">
                   <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" /> Algorithmic Insights
                   </p>
                   <div className="space-y-4 relative z-10">
                     {demographics.insights.map((insight, idx) => (
                       <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                         <p className="text-sm font-bold leading-relaxed">{insight}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             ) : (
               <p className="text-sm text-slate-500">Failed to load demographics.</p>
             )}
          </section>
        )}


        {/* AI Fraud Detection Panel */}
        {fraudAlerts.length > 0 && (
          <section className="bg-white border border-red-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl" />
             <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-red-400 font-black">AI Security Alert</p>
                  <h2 className="text-xl font-black text-slate-900">Fraud Anomalies Detected</h2>
               </div>
             </div>
             <div className="grid gap-3 relative z-10">
                {fraudAlerts.map((alert, idx) => (
                  <div key={idx} className="bg-red-50/50 border border-red-100 rounded-2xl p-4 flex gap-4">
                     <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                     <div>
                        <p className="text-sm font-black text-slate-900">{alert.message}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Mobilizer: {alert.mobilizer_name} (ID: {alert.mobilizer_id})</p>
                     </div>
                  </div>
                ))}
             </div>
          </section>
        )}

        {/* GOTV Saturation Prediction */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-5">
               <div className="w-10 h-10 rounded-xl bg-dcp-green/10 text-dcp-green flex items-center justify-center">
                  <Target className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">GOTV Prediction</p>
                  <h2 className="text-sm font-black text-slate-900">Top Secured Stations</h2>
               </div>
             </div>
             <div className="space-y-3">
                {saturation.secured.length === 0 ? <p className="text-xs text-slate-400 font-bold uppercase">No stations over 50% saturation</p> : saturation.secured.map((s, idx) => (
                   <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                         <p className="text-xs font-black text-slate-900 truncate max-w-[200px]">{s.polling_station}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.recruits} / {s.total_registered} voters</p>
                      </div>
                      <div className="text-right">
                         <span className="text-sm font-black text-dcp-green">{s.saturation_percent}%</span>
                      </div>
                   </div>
                ))}
             </div>
           </div>

           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-5">
               <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Target className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">GOTV Prediction</p>
                  <h2 className="text-sm font-black text-slate-900">At-Risk Stations</h2>
               </div>
             </div>
             <div className="space-y-3">
                {saturation.at_risk.length === 0 ? <p className="text-xs text-slate-400 font-bold uppercase">No at-risk stations</p> : saturation.at_risk.map((s, idx) => (
                   <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                         <p className="text-xs font-black text-slate-900 truncate max-w-[200px]">{s.polling_station}</p>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{s.recruits} / {s.total_registered} voters</p>
                      </div>
                      <div className="text-right">
                         <span className="text-sm font-black text-amber-500">{s.saturation_percent}%</span>
                      </div>
                   </div>
                ))}
             </div>
           </div>
        </section>

        {/* All Wards — paginated list */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <MapPin className="w-6 h-6 text-slate-600" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Ward Summary</p>
              <h2 className="text-lg font-black text-slate-900">All Wards</h2>
            </div>
          </div>
          <div className="grid gap-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading ward list…</p>
            ) : wardSummary.length === 0 ? (
              <p className="text-sm text-slate-500">No wards found.</p>
            ) : (
              <>
                {wardListSlice.map((item, idx) => {
                  const globalIdx = wardListPage * WARD_LIST_PAGE_SIZE + idx;
                  const pct = totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0;
                  return (
                    <div key={item.ward} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 w-5 shrink-0">#{globalIdx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="font-black text-slate-900 truncate">{item.ward}</p>
                          <span className="text-sm font-black text-slate-700 ml-3 shrink-0">{item.count} <span className="text-slate-400 font-bold text-xs">({pct}%)</span></span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-slate-700 h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  page={wardListPage}
                  totalPages={wardListTotalPages}
                  onPrev={() => setWardListPage(p => p - 1)}
                  onNext={() => setWardListPage(p => p + 1)}
                  totalItems={wardSummary.length}
                  pageSize={WARD_LIST_PAGE_SIZE}
                />
              </>
            )}
          </div>
        </section>

        {/* All Polling Stations — paginated + searchable */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <MapPin className="w-6 h-6 text-slate-600" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400">Polling Station Breakdown</p>
                <h2 className="text-lg font-black text-slate-900">All Polling Stations</h2>
              </div>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={pollingSearch}
                onChange={e => setPollingSearch(e.target.value)}
                placeholder="Filter by station or ward..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:border-dcp-green/50 focus:ring-2 focus:ring-dcp-green/10 transition-all"
              />
            </div>
          </div>
          <div className="grid gap-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading polling stations…</p>
            ) : pollingSummary.length === 0 ? (
              <p className="text-sm text-slate-500">No polling station data found.</p>
            ) : filteredPolling.length === 0 ? (
              <p className="text-sm text-slate-500 font-bold uppercase tracking-widest text-center py-6">No match for "{pollingSearch}"</p>
            ) : (
              <>
                {pollingSlice.map((item, idx) => {
                  const globalIdx = pollingPage * POLLING_PAGE_SIZE + idx;
                  const pct = totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0;
                  return (
                    <div key={item.station} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-black text-slate-400 w-5 shrink-0">#{globalIdx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="min-w-0">
                            <p className="font-black text-slate-900 truncate text-sm">{item.station}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.ward}</p>
                          </div>
                          <span className="text-sm font-black text-slate-700 ml-3 shrink-0">
                            {item.count} <span className="text-slate-400 font-bold text-xs">({pct}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div className="bg-dcp-green h-1 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Pagination
                  page={pollingPage}
                  totalPages={pollingTotalPages}
                  onPrev={() => setPollingPage(p => p - 1)}
                  onNext={() => setPollingPage(p => p + 1)}
                  totalItems={filteredPolling.length}
                  pageSize={POLLING_PAGE_SIZE}
                />
              </>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
