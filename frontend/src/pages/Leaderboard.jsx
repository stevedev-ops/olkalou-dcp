import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Star, MapPin, Crown, TrendingUp, Users, Flame, Snowflake } from "lucide-react";
import { api } from "../lib/api";
import { toast } from "sonner";

const TIER_ICONS = ["🥇", "🥈", "🥉"];
const RANK_COLORS = [
  "from-yellow-400 to-amber-500 text-white shadow-amber-300/30",
  "from-slate-300 to-slate-400 text-white shadow-slate-300/30",
  "from-amber-600 to-amber-700 text-white shadow-amber-600/20",
];

function MobilizerCard({ mobilizer, currentMemberId, isAdmin, onToggleStatus }) {
  const isMe = String(mobilizer.id) === String(currentMemberId);
  const isTop3 = mobilizer.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: mobilizer.rank * 0.04 }}
      className={`relative flex items-center gap-4 p-5 rounded-2xl border transition-all ${
        isMe
          ? "bg-dcp-green/10 border-dcp-green/30 shadow-md shadow-dcp-green/10"
          : isTop3
          ? "bg-slate-900 border-slate-700"
          : "bg-white border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Rank badge */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg ${
        isTop3
          ? `bg-gradient-to-br ${RANK_COLORS[mobilizer.rank - 1]} shadow-lg`
          : "bg-slate-100 text-slate-500 text-sm"
      }`}>
        {isTop3 ? TIER_ICONS[mobilizer.rank - 1] : `#${mobilizer.rank}`}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-black uppercase tracking-tight truncate ${isTop3 && !isMe ? "text-white" : "text-slate-900"}`}>
            {mobilizer.full_name}
          </p>

          {!mobilizer.is_active && (
            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-red-500 text-white rounded-full">
              Deactivated
            </span>
          )}

          {mobilizer.recent_recruits_count > 10 && (
            <span className="px-2 py-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-600 rounded-full border border-orange-500/30">
              <Flame size={10} /> Rising Star
            </span>
          )}

          {mobilizer.recent_recruits_count === 0 && mobilizer.direct_recruits > 5 && (
            <span className="px-2 py-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-600 rounded-full border border-blue-500/30">
              <Snowflake size={10} /> Stagnant
            </span>
          )}

          {isMe && (

            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-dcp-green text-white rounded-full">
              You
            </span>
          )}
          {mobilizer.is_root && (
            <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full ${isTop3 && !isMe ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"}`}>
              Root
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <MapPin className={`w-3 h-3 shrink-0 ${isTop3 && !isMe ? "text-slate-400" : "text-slate-400"}`} />
          <span className={`text-[10px] font-bold uppercase tracking-widest truncate ${isTop3 && !isMe ? "text-slate-400" : "text-slate-400"}`}>
            {mobilizer.ward}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className={`text-3xl font-black ${isTop3 && !isMe ? "text-white" : "text-slate-900"}`}>
          {mobilizer.direct_recruits}
        </p>
        <p className={`text-[9px] font-black uppercase tracking-widest ${isTop3 && !isMe ? "text-slate-400" : "text-slate-400"}`}>
          recruits
        </p>
      </div>

      {/* Admin Action */}
      {isAdmin && !isMe && (
        <div className="shrink-0 ml-4 border-l border-slate-200 pl-4">
          {mobilizer.is_active ? (
            <button 
              onClick={() => onToggleStatus(mobilizer.id)}
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition border border-red-100"
            >
              Demote
            </button>
          ) : (
            <button 
              onClick={() => onToggleStatus(mobilizer.id)}
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition border border-slate-200"
            >
              Reactivate
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function Leaderboard({ memberId, isAdmin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("mobilizers");

  useEffect(() => {
    api.getLeaderboard().then(({ data: d }) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  const totalRecruitsAll = data?.top_mobilizers?.reduce((a, m) => a + m.direct_recruits, 0) || 0;
  const maxWardCount = data?.ward_totals?.[0]?.count || 1;

  const handleToggleStatus = async (id) => {
    try {
      const { data, error } = await api.toggleMemberActive(id);
      if (error) throw error;
      
      // Update local state
      setData(prev => {
        const newTop = prev.top_mobilizers.map(m => m.id === id ? { ...m, is_active: data.is_active } : m);
        return { ...prev, top_mobilizers: newTop };
      });
      
      if (data.is_active) {
        toast.success("Member has been reactivated.");
      } else {
        toast.error("Member has been deactivated and locked out.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to change status.");
    }
  };


  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,132,61,0.7)_0%,transparent_70%)]" />
          </div>
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-dcp-green/20 border border-dcp-green/30 flex items-center justify-center">
              <Trophy className="text-dcp-green w-8 h-8" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">DCP Ol Kalou · By-Election</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Recruiter Leaderboard</h1>
              <p className="text-slate-400 text-sm mt-1">Top mobilizers powering the movement across all 5 wards</p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Top Mobilizer", value: loading ? "—" : data?.top_mobilizers?.[0]?.full_name?.split(' ')[0] || "—", icon: <Crown className="w-5 h-5 text-amber-400" /> },
            { label: "Total Top-20 Recruits", value: loading ? "—" : totalRecruitsAll, icon: <Users className="w-5 h-5 text-dcp-green" /> },
            { label: "Leading Ward", value: loading ? "—" : data?.ward_totals?.[0]?.ward || "—", icon: <TrendingUp className="w-5 h-5 text-blue-400" /> },
          ].map(c => (
            <div key={c.label} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">{c.icon}</div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</p>
                <p className="font-black text-slate-900 truncate mt-0.5">{c.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 flex gap-2">
          {[{ id: "mobilizers", label: "🏆 Top Mobilizers" }, { id: "wards", label: "📍 Ward Rankings" }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${tab === t.id ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "mobilizers" && (
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-200 animate-pulse rounded-2xl" />
              ))
            ) : data?.top_mobilizers?.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs font-black uppercase tracking-widest bg-white rounded-3xl border border-slate-200">
                No recruiters yet — be the first to enroll!
              </div>
            ) : (
              data.top_mobilizers.map(m => (
                <MobilizerCard key={m.id} mobilizer={m} currentMemberId={memberId} isAdmin={isAdmin} onToggleStatus={handleToggleStatus} />
              ))
            )}
          </div>
        )}

        {tab === "wards" && (
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-slate-200 animate-pulse rounded-2xl" />)
            ) : (
              data?.ward_totals?.map((w, i) => {
                const pct = Math.round((w.count / maxWardCount) * 100);
                return (
                  <motion.div key={w.ward} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                        <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight">{w.ward}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ward</p>
                        </div>
                      </div>
                      <span className="text-3xl font-black text-slate-900">{w.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-dcp-green h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
