import { useState, useEffect, useCallback } from "react";
import { BarChart3, Users, MapPin, ShieldCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";

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
  const [members, setMembers] = useState([]);
  const [wardSummary, setWardSummary] = useState([]);
  const [pollingSummary, setPollingSummary] = useState([]);
  const [pollingSearch, setPollingSearch] = useState("");
  const [rootCount, setRootCount] = useState(0);
  const [delegateCount, setDelegateCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [wardChartPage, setWardChartPage] = useState(0);
  const [wardListPage, setWardListPage] = useState(0);
  const [pollingPage, setPollingPage] = useState(0);

  // Reset polling page when search changes
  useEffect(() => { setPollingPage(0); }, [pollingSearch]);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      let mainQuery = supabase.from("dcp_members").select("*").order("id", { ascending: false });
      if (memberId) mainQuery = mainQuery.eq("referred_by", memberId);

      const { data, error } = await mainQuery;

      if (!error && data) {
        setMembers(data);
        const wardMap = data.reduce((acc, member) => {
          const ward = member.ward || "Unknown";
          acc[ward] = (acc[ward] || 0) + 1;
          return acc;
        }, {});

        setWardSummary(
          Object.entries(wardMap)
            .map(([ward, count]) => ({ ward, count }))
            .sort((a, b) => b.count - a.count)
        );

        const pollingMap = data.reduce((acc, member) => {
          const station = member.polling_station || "Unknown";
          const ward = member.ward || "Unknown";
          const key = station;
          if (!acc[key]) acc[key] = { station, ward, count: 0 };
          acc[key].count += 1;
          return acc;
        }, {});
        setPollingSummary(
          Object.values(pollingMap).sort((a, b) => b.count - a.count)
        );

        if (memberId) {
          const directIds = data.map(m => m.id);
          let downlineCount = 0;
          if (directIds.length > 0) {
            let currentLayer = directIds;
            for (let i = 0; i < 3; i++) {
              try {
                const { data: children, error: childErr } = await supabase.from("dcp_members").select("id").in("referred_by", currentLayer);
                if (childErr || !children || children.length === 0) break;
                downlineCount += children.length;
                currentLayer = children.map(c => c.id);
              } catch { break; }
            }
          }
          setRootCount(data.length);
          setDelegateCount(downlineCount);
        } else {
          const [rootRes, delegateRes] = await Promise.all([
            supabase.from("dcp_members").select("id", { count: "exact", head: true }).is("referred_by", null),
            supabase.from("dcp_members").select("id", { count: "exact", head: true }).not("referred_by", "is", null),
          ]);
          setRootCount(rootRes?.count ?? 0);
          setDelegateCount(delegateRes?.count ?? 0);
        }
      }
    } catch (err) {
      console.error("Reports fetch error:", err);
      setMembers([]);
      setWardSummary([]);
      setPollingSummary([]);
      setRootCount(0);
      setDelegateCount(0);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

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
      <div className="max-w-6xl mx-auto px-4 space-y-8">
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

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-3">Total Registrations</p>
            <p className="text-4xl font-black text-slate-900">{members.length}</p>
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
                <h2 className="text-xl font-black text-slate-900">Registration by Ward</h2>
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
                    const pct = members.length > 0 ? Math.round((item.count / members.length) * 100) : 0;
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
                  const pct = members.length > 0 ? Math.round((item.count / members.length) * 100) : 0;
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
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest text-center py-6">No match for "{pollingSearch}"</p>
            ) : (
              <>
                {pollingSlice.map((item, idx) => {
                  const globalIdx = pollingPage * POLLING_PAGE_SIZE + idx;
                  const pct = members.length > 0 ? Math.round((item.count / members.length) * 100) : 0;
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
