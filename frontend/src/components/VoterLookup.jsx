import { useState, useRef, useCallback } from "react";
import { Search, User, MapPin, ShieldCheck, ArrowRight, Loader2, AlertCircle, Fingerprint } from "lucide-react";
import { api } from "../lib/api";

function useDebounce(fn, delay) {
  const timer = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function VoterLookup({ onSelect, onSkip }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiErr } = await api.lookupVoter(q.trim());
      if (apiErr) throw new Error(apiErr.message);
      setResults(data || []);
      setSearched(true);
    } catch (err) {
      setError("Could not search. Check your connection.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(doSearch, 500);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  };

  // Parse a voter record's full_name (e.g. "JOHN - KAMAU NJOROGE") into
  // firstName, secondName, lastName for the registration form
  const parseVoterToFormData = (voter) => {
    const raw = voter.full_name || "";
    // Remove dash/hyphen separators used in IEBC names
    const cleaned = raw.replace(/\s*-\s*/g, " ").trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    const [firstName = "", secondName = "", ...rest] = parts;
    const lastName = rest.join(" ");
    return {
      firstName: toTitleCase(firstName),
      secondName: toTitleCase(secondName),
      lastName: toTitleCase(lastName),
      ward: voter.ward || "",
      pollingCenter: voter.polling_station || "",
      // nationalId is intentionally NOT pre-filled — the agent must type it
      // The raw voter object is passed separately as selectedVoter for comparison
    };
  };

  const toTitleCase = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-dcp-green/20 border border-dcp-green/30 flex items-center justify-center">
            <Fingerprint className="text-dcp-green w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              IEBC 2022 Voter Register · Ol Kalou Constituency
            </p>
            <h3 className="text-white font-black text-sm uppercase tracking-widest">
              Pre-Verify Supporter
            </h3>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dcp-green animate-spin" />
          )}
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Type full name (e.g. Kamau John)..."
            className="w-full pl-11 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium text-white placeholder-slate-500 outline-none focus:border-dcp-green/50 focus:ring-2 focus:ring-dcp-green/20 transition-all"
            autoComplete="off"
          />
        </div>

        <p className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          💡 Tip: Type at least 3 characters. Search by Official Name.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {results.length === 0
              ? "No voter record found"
              : `${results.length} record${results.length !== 1 ? "s" : ""} found — Select to pre-fill enrollment`}
          </p>

          {results.map((voter) => (
            <div
              key={voter.id}
              className="group bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-dcp-green/40 hover:shadow-md hover:shadow-dcp-green/5 transition-all cursor-pointer"
              onClick={() => onSelect(parseVoterToFormData(voter), voter)}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-slate-400 group-hover:text-dcp-green transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 uppercase tracking-tight truncate group-hover:text-dcp-green transition-colors">
                    {voter.full_name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <MapPin className="w-3 h-3" />
                      {voter.ward}
                    </span>
                    {voter.polling_station && (
                      <>
                        <span className="text-slate-200">·</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                          {voter.polling_station}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-dcp-green/10 border border-dcp-green/20 rounded-xl">
                  <ShieldCheck className="w-3.5 h-3.5 text-dcp-green" />
                  <span className="text-[10px] font-black text-dcp-green uppercase tracking-widest">
                    Registered
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-dcp-green group-hover:border-dcp-green transition-all">
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            </div>
          ))}

          {/* Not in register notice */}
          {results.length === 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-2">
              <p className="text-sm font-black text-red-800 uppercase tracking-tight">
                ⚠️ Not found in 2022 Register
              </p>
              <p className="text-xs text-red-700 leading-relaxed font-medium">
                To maintain the integrity of the Democracy for Citizens Party (DCP), all members MUST be verified voters in Ol Kalou. If their name is spelled differently, try searching again. They cannot be enrolled if they are not in the register.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
