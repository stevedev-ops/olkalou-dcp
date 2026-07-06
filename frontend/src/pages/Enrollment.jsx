import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, UserPlus, CheckCircle2, ArrowRight, ArrowLeft, WifiOff } from "lucide-react";
import { toast } from "sonner";
import RegistrationForm from "../components/RegistrationForm";
import VoterLookup from "../components/VoterLookup";
import { useNavigate } from "react-router-dom";
import { useSync } from "../contexts/SyncContext";

// Steps: 'lookup' | 'form' | 'success'
export default function Enrollment({ memberId }) {
  const [step, setStep] = useState('lookup');
  const [prefill, setPrefill] = useState(null);
  const [selectedVoter, setSelectedVoter] = useState(null);
  const [lastEnrolled, setLastEnrolled] = useState(null);
  const navigate = useNavigate();
  const referralUrl = `${window.location.origin}/?ref=${memberId}`;

  const copyToClipboard = async () => {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(referralUrl);
        toast.success("Referral link copied to clipboard!");
      } catch (err) {
        toast.error("Unable to copy link. Please try manually.");
      }
    } else {
      toast.error("Clipboard API unavailable. Copy link manually.");
    }
  };

  const handleVoterSelect = (formData, voter) => {
    setPrefill(formData);
    setSelectedVoter(voter);
    setStep('form');
  };

  const handleSkipLookup = () => {
    setPrefill(null);
    setSelectedVoter(null);
    setStep('form');
  };

  const handleEnrolSuccess = (res) => {
    setLastEnrolled(res.member || res);
    setStep('success');
  };

  const resetAll = () => {
    setStep('lookup');
    setPrefill(null);
    setSelectedVoter(null);
    setLastEnrolled(null);
  };

  const { offlineCount } = useSync();

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-8">

        {/* Header Navigation */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => step === 'form' ? setStep('lookup') : navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-colors"
          >
            <ArrowLeft size={16} />
            {step === 'form' ? 'Back to Lookup' : 'Back to Dashboard'}
          </button>

          <div className="flex items-center gap-3">
            {/* Offline indicator */}
            {!navigator.onLine && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Offline Mode</span>
              </div>
            )}
            {/* Offline queue badge */}
            {offlineCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                  📤 {offlineCount} Pending Sync
                </span>
              </div>
            )}
            <div className="px-4 py-1.5 bg-dcp-green/10 border border-dcp-green/20 rounded-full text-dcp-green text-[10px] font-black uppercase tracking-widest leading-none">
              Recruitment Mode Active
            </div>
          </div>
        </div>

        {/* Step breadcrumb */}
        <div className="flex items-center gap-2">
          {['lookup', 'form', 'success'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                step === s
                  ? 'bg-slate-900 text-white border-slate-900'
                  : (step === 'form' && s === 'lookup') || step === 'success'
                    ? 'bg-dcp-green text-white border-dcp-green'
                    : 'bg-white text-slate-400 border-slate-200'
              }`}>{i + 1}</div>
              <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${
                step === s ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {s === 'lookup' ? 'Verify Voter' : s === 'form' ? 'Enroll' : 'Done'}
              </span>
              {i < 2 && <div className="w-8 h-px bg-slate-200 hidden sm:block" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Voter Lookup ── */}
          {step === 'lookup' && (
            <motion.div
              key="lookup"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8"
            >
              {/* Left side: QR & Share */}
              <div className="lg:col-span-2 space-y-6">
                <section className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-900 mb-6 font-black uppercase italic tracking-widest text-[10px]">
                    DCP
                  </div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight mb-2 uppercase">Your Personal QR</h4>
                  <p className="text-slate-500 text-[11px] font-medium mb-8 leading-relaxed">
                    Show this to the person you are recruiting for instant enrollment on their device.
                  </p>
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-xl">
                    <QRCodeSVG value={referralUrl} size={150} />
                  </div>
                </section>

                <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                      <Share2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest">Fast Share</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Send link via WhatsApp</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl break-all text-[10px] font-black text-slate-300 tracking-widest uppercase mb-4">
                      {referralUrl}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const message = encodeURIComponent(`Join me and become a member of the Democracy for Citizens Party (DCP)! Register here to join the movement: ${referralUrl}`);
                          window.open(`https://wa.me/?text=${message}`, '_blank');
                        }}
                        className="bg-[#25D366] text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg shadow-[#25D366]/20"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </button>

                      <button
                        onClick={copyToClipboard}
                        className="bg-white/10 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-white/20 transition-colors border border-white/10"
                      >
                        <Copy size={16} /> Copy Link
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right side: Voter Lookup */}
              <div className="lg:col-span-3">
                <VoterLookup onSelect={handleVoterSelect} onSkip={handleSkipLookup} />
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Enrollment Form ── */}
          {step === 'form' && (
            <motion.div
              key="form"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {selectedVoter && (
                <div className="mb-6 flex items-center gap-3 p-4 bg-dcp-green/10 border border-dcp-green/20 rounded-2xl">
                  <CheckCircle2 className="w-5 h-5 text-dcp-green shrink-0" />
                  <div>
                    <p className="text-xs font-black text-dcp-green uppercase tracking-widest">Voter Confirmed in 2022 Register</p>
                    <p className="text-sm font-bold text-slate-700 mt-0.5">{selectedVoter.full_name} · {selectedVoter.ward}</p>
                  </div>
                </div>
              )}
              <RegistrationForm
                referrerId={memberId}
                onSuccess={handleEnrolSuccess}
                initialData={prefill}
                selectedVoter={selectedVoter}
              />
            </motion.div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === 'success' && (
            <motion.div
              key="success"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="bg-white border border-slate-200 p-12 rounded-[40px] shadow-2xl text-center max-w-2xl mx-auto space-y-8"
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${lastEnrolled?.offline ? 'bg-amber-100 text-amber-500' : 'bg-dcp-green/10 text-dcp-green'}`}>
                {lastEnrolled?.offline
                  ? <WifiOff size={48} strokeWidth={2.5} />
                  : <CheckCircle2 size={48} strokeWidth={3} />
                }
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight italic">
                  {lastEnrolled?.offline ? 'Saved Offline!' : 'Successfully Enrolled!'}
                </h2>
                <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                  {lastEnrolled?.offline
                    ? 'Will auto-sync to HQ when internet returns'
                    : 'Database entry confirmed for HQ Audit.'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 text-left max-w-sm mx-auto">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-4 border-b border-slate-200 pb-2">New Member Details</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block">Full Name</label>
                    <p className="font-black text-slate-900 text-lg uppercase leading-none">{lastEnrolled?.full_name}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase block">Ward</label>
                    <p className="font-bold text-slate-700 uppercase tracking-widest">{lastEnrolled?.ward || lastEnrolled?.polling_station}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                  onClick={resetAll}
                  className="px-8 py-5 bg-dcp-green text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-dcp-green/20 hover:bg-dcp-green/90 transition-all flex items-center justify-center gap-3"
                >
                  <UserPlus size={18} /> Enrol Next Person
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                >
                  <ArrowRight size={18} /> Finish & View Stats
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
