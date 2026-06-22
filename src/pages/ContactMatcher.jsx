import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, Users, UserPlus, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

export default function ContactMatcher() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (query.trim().length < 3) {
      toast.error("Please enter at least 3 characters.");
      return;
    }
    setLoading(true);
    const { data } = await api.searchContacts(query);
    setResults(data?.results || data || []);
    setSearched(true);
    setLoading(false);
  };

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(0,132,61,0.2)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Friends & Family Network</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Contact Matcher</h1>
              <p className="text-slate-400 text-sm mt-1">Search the Ol Kalou voter roll for relatives to recruit.</p>
            </div>
            <div className="w-16 h-16 rounded-3xl bg-dcp-green/20 border border-dcp-green/30 flex items-center justify-center">
              <Users className="text-dcp-green w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter a surname (e.g. Kariuki, Njoroge)..."
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold outline-none focus:border-dcp-green/50 transition"
              />
            </div>
            <button type="submit" disabled={loading}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search Roll"}
            </button>
          </form>
        </div>

        {/* Results */}
        <AnimatePresence>
          {searched && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">
                {results.length} Matches Found
              </p>
              
              {results.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                  No registered voters found matching "{query}"
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {results.map(v => (
                    <div key={v.id} className={`flex items-start justify-between p-4 rounded-2xl border ${v.is_member ? 'bg-dcp-green/5 border-dcp-green/20' : 'bg-slate-50 border-slate-200'}`}>
                      <div>
                        <p className={`font-black uppercase tracking-tight text-sm ${v.is_member ? 'text-dcp-green' : 'text-slate-900'}`}>
                          {v.full_name}
                        </p>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 space-y-0.5">
                          <p>ID: {v.id_number || 'N/A'}</p>
                          <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {v.ward} · {v.polling_station}</p>
                        </div>
                      </div>
                      
                      {v.is_member ? (
                        <div className="flex flex-col items-center justify-center bg-dcp-green/10 text-dcp-green rounded-xl p-2 px-3">
                          <CheckCircle2 className="w-5 h-5 mb-1" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Enrolled</span>
                        </div>
                      ) : (
                        <Link to={`/enroll?q=${encodeURIComponent(v.id_number || v.full_name)}`}
                          className="flex flex-col items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl p-2 px-3 hover:bg-slate-100 transition shadow-sm">
                          <UserPlus className="w-5 h-5 mb-1 text-amber-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Recruit</span>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
