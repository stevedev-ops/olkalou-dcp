import { useState, useEffect, useCallback } from "react";
import {
  Search,
  User,
  MapPin,
  Smartphone,
  Hash,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function Members({ memberId, isAdmin = false }) {
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMembersPage = useCallback(async (pageIdx) => {
    if (pageIdx === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data, error } = await api.getMembers({ 
        referred_by: memberId,
        page: pageIdx + 1
      });

      if (error) {
        if (error.message?.includes('401') || error.message?.includes('403')) {
          // If in a real app, we'd redirect or refresh
          console.warn("Unauthorized access to member list");
        }
        throw error;
      }

      const list = data.results || [];
      if (pageIdx === 0) setMembers(list);
      else setMembers(prev => [...prev, ...list]);
      
      setHasMore(!!data.next);
      setPage(pageIdx);
    } catch (err) {
      console.error("Members fetch failed:", err);
      toast.error("Unable to load network members right now.");
      if (pageIdx === 0) setMembers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (memberId) {
      fetchMembersPage(0);
    }
  }, [memberId, fetchMembersPage]);

  const filtered = members.filter(
    (member) =>
      isAdmin
        ? member.full_name?.toLowerCase().includes(query.toLowerCase()) ||
          member.phone?.includes(query) ||
          member.national_id?.includes(query) ||
          member.referral_code?.toLowerCase().includes(query.toLowerCase())
        : true, // Search disabled or focused on Ward/Stats for users
  );

  // Group by ward for numerical display
  const wardStats = members.reduce((acc, m) => {
    const w = m.ward || "Unknown";
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});

  const sortedWards = Object.entries(wardStats)
    .map(([ward, count]) => ({ ward, count }))
    .sort((a, b) => b.count - a.count);

  if (selectedMember) {
    return (
      <div className="relative overflow-hidden selection:bg-dcp-green/30">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(0,132,61,0.15)_0%,transparent_70%)] pointer-events-none" />

        <div className="w-full space-y-12 relative z-10 pt-8">
          <button
            onClick={() => setSelectedMember(null)}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors font-black uppercase tracking-widest text-[11px]"
          >
            ← Back to Network
          </button>

          <header className="space-y-6">
            <div className="w-24 h-24 bg-dcp-green rounded-[32px] flex items-center justify-center text-white shadow-2xl shadow-dcp-green/20">
              <User size={40} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-dcp-green text-[10px] font-black uppercase tracking-[0.4em] mb-3">
                Recruit Profile
              </p>
              <h1 className="text-5xl font-black uppercase italic tracking-tight leading-none mb-4">
                {selectedMember.full_name}
              </h1>
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-xl w-fit">
                <div className="w-2 h-2 rounded-full bg-dcp-green animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Status: Verified Member
                </span>
              </div>
            </div>
          </header>

          <section className="grid gap-6">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Hash size={12} /> National Identity
                  </label>
                  <p className="text-lg font-bold tracking-[0.2em]">
                    {selectedMember.national_id}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Smartphone size={12} /> Contact Line
                  </label>
                  <p className="text-lg font-bold">{selectedMember.phone}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <MapPin size={12} /> Ward Division
                  </label>
                  <p className="text-lg font-bold uppercase">
                    {selectedMember.ward}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <MapPin size={12} /> Polling Station
                  </label>
                  <p className="text-lg font-bold uppercase">
                    {selectedMember.polling_station}
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Mobilization Code
                    </p>
                    <p className="text-xl font-black text-white tracking-widest uppercase">
                      {selectedMember.referral_code || "NO CODE"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                      Joined
                    </p>
                    <p className="text-sm font-bold text-slate-300">
                      {new Date(selectedMember.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-dcp-green/10 border border-dcp-green/20 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-dcp-green flex items-center justify-center text-white">
                <CheckCircle size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest">
                  HQ Verification Active
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  This member is eligible for tiered rewards.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400 mb-2">
                My Network Impact
              </p>
              <h1 className="text-3xl font-black text-slate-900 leading-tight italic">
                Registration Statistics
              </h1>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl">
                {isAdmin
                  ? "Full intelligence directory of all registered members."
                  : "Numerical breakdown of your recruitment impact across the constituency."}
              </p>
            </div>
            {isAdmin && (
              <div className="min-w-[280px] w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('mem_search')}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl outline-none focus:border-dcp-green focus:ring-4 focus:ring-dcp-green/10 text-sm font-bold uppercase tracking-widest"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-3">
                Total Registered
              </p>
              <p className="text-4xl font-black text-slate-900">
                {members.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-3">
                Wards Covered
              </p>
              <p className="text-4xl font-black text-slate-900">
                {sortedWards.length}
              </p>
            </div>
          </div>

          {!isAdmin && (
            <div className="grid gap-6">
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">
                    Geographic Yield
                  </h3>
                  <MapPin size={18} className="text-slate-400" />
                </div>
                <div className="divide-y divide-slate-100">
                  {sortedWards.map(({ ward, count }) => (
                    <div
                      key={ward}
                      className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <span className="font-black text-slate-700 uppercase text-xs tracking-widest">
                        {ward}
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="w-32 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-dcp-green h-full"
                            style={{
                              width: `${(count / members.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-black text-slate-900 text-sm">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                  {sortedWards.length === 0 && (
                    <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No registrations to analyze yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <div className="grid grid-cols-4 gap-0 text-[10px] uppercase tracking-[0.35em] text-slate-500 bg-slate-50 border-b border-slate-200 px-6 py-4 font-black min-w-[480px]">
              <div className="col-span-2">{t('mem_name')}</div>
              <div>Contact</div>
              <div className="hidden md:block text-right">{t('mem_location')}</div>
            </div>
            <div className="divide-y divide-slate-200">
              {loading ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-4">
                  <div className="w-8 h-8 border-2 border-dcp-green/20 border-t-dcp-green rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Decoding Network...
                  </p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
                  No direct recruits yet.
                </div>
              ) : (
                filtered.map((member) => (
                  <div
                    key={member.id}
                    className="grid grid-cols-4 gap-0 items-center px-6 py-6 hover:bg-slate-50 transition-colors cursor-pointer group min-w-[480px]"
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="col-span-2 space-y-1 min-w-0">
                      <p className="font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-dcp-green transition-colors">
                        {member.full_name}
                      </p>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 flex flex-wrap gap-2 font-bold">
                        <span>Code: {member.referral_code || "N/A"}</span>
                        <span className="text-slate-300">|</span>
                        <span>ID: {member.national_id}</span>
                      </div>
                    </div>
                    <div className="text-slate-600 text-[12px] font-black tracking-tight">
                      {member.phone}
                    </div>
                    <div className="hidden md:block text-right text-slate-400 text-[11px] font-black uppercase tracking-widest group-hover:text-slate-900 transition-colors">
                      {member.ward}
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8 pb-8">
                <button
                  onClick={() => fetchMembersPage(page + 1)}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.3em] border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load More Recruits"}
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
