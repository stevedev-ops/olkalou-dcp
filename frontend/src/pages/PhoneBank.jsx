import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneCall, MapPin, ThumbsUp, HelpCircle, ThumbsDown, UserX, Loader2, Play, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

const SCRIPT = `
"Hello, am I speaking with [NAME]? 
My name is [YOUR NAME] and I am calling on behalf of the Democracy for Citizens Party (DCP). 
We are reaching out to voters in [WARD] ahead of the upcoming Ol Kalou by-election.
Are you planning to vote, and if so, can we count on your support for our candidate?"
`;

export default function PhoneBank() {
  const [target, setTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  const loadNext = useCallback(async () => {
    setLoading(true);
    setNotes("");
    const { data } = await api.getPhoneBankTarget();
    setTarget(data?.target || null);
    setLoading(false);
  }, []);

  useEffect(() => { loadNext(); }, [loadNext]);

  const handleOutcome = async (outcome) => {
    if (!target) return;
    setSubmitting(true);
    const { error } = await api.logCall({ target_id: target.id, outcome, notes });
    if (error) { toast.error("Failed to log call"); setSubmitting(false); return; }
    
    toast.success("Call logged! Loading next...");
    await loadNext();
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-dcp-green animate-spin mb-4" />
        <p className="font-black uppercase tracking-widest text-slate-400">Loading next voter...</p>
      </div>
    );
  }

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,132,61,0.2)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
              <PhoneCall className="text-dcp-green w-8 h-8" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">Remote Volunteer Hub</p>
            <h1 className="text-3xl font-black text-white italic uppercase">Virtual Phone Bank</h1>
          </div>
        </div>

        {!target ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm">
            <CheckCircle2 className="w-16 h-16 text-dcp-green mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 uppercase italic">Queue Empty!</h2>
            <p className="text-slate-500 mt-2">You have called all available targets in the queue. Great job!</p>
            <button onClick={loadNext}
              className="mt-6 px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">
              Refresh Queue
            </button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
            
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Target</p>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">{target.voter_name}</h2>
              <div className="flex items-center justify-center gap-3 text-sm font-bold text-slate-500">
                <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><PhoneCall className="w-4 h-4" /> {target.phone}</span>
                <span className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><MapPin className="w-4 h-4" /> {target.ward}</span>
              </div>
            </div>

            <div className="bg-dcp-green/5 border border-dcp-green/20 rounded-2xl p-6 relative">
              <p className="text-[10px] font-black uppercase tracking-widest text-dcp-green mb-3 flex items-center gap-2">
                <Play className="w-3 h-3" /> Reading Script
              </p>
              <p className="text-lg font-bold text-slate-700 leading-relaxed italic">
                {SCRIPT.replace('[NAME]', target.voter_name).replace('[WARD]', target.ward || 'Ol Kalou')}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Log Call Outcome</label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button disabled={submitting} onClick={() => handleOutcome('strong_dcp')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dcp-green/30 bg-dcp-green/5 text-dcp-green hover:bg-dcp-green hover:text-white transition group disabled:opacity-50">
                  <ThumbsUp className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-center">Strong DCP</span>
                </button>
                <button disabled={submitting} onClick={() => handleOutcome('undecided')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-200 transition disabled:opacity-50">
                  <HelpCircle className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-center">Undecided</span>
                </button>
                <button disabled={submitting} onClick={() => handleOutcome('uda')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-red-200 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50">
                  <ThumbsDown className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-center">Voting UDA</span>
                </button>
                <button disabled={submitting} onClick={() => handleOutcome('wrong_number')}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100 transition disabled:opacity-50">
                  <UserX className="w-6 h-6" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-center">No Answer / Wrong #</span>
                </button>
              </div>

              <textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                rows={2}
                placeholder="Optional notes (e.g. Needs transport, wants a t-shirt)..."
                className="w-full mt-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-slate-400 transition resize-none" 
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
