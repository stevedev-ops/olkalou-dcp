import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from '../components/Hero';
import RegistrationForm from '../components/RegistrationForm';
import VoterLookup from '../components/VoterLookup';
import LoginForm from '../components/LoginForm';
import { api } from '../lib/api';
import { Lock } from "lucide-react";

export default function Landing({ onLogin, referrerId, inviteToken }) {
  const navigate = useNavigate();
  const [referrerName, setReferrerName] = useState(null);
  const [referrerValid, setReferrerValid] = useState(null); // null=checking, true=valid, false=invalid
  const [inviteValid, setInviteValid] = useState(null); // null=checking, true=valid, false=invalid

  // If they have a referrerId or inviteToken, they are probably a new user being invited
  const [authMode, setAuthMode] = useState((referrerId || inviteToken) ? 'register' : 'login');
  const [authStep, setAuthStep] = useState('lookup'); // 'lookup' | 'form'
  const [prefillData, setPrefillData] = useState(null);

  useEffect(() => {
    if (!referrerId) {
      setReferrerValid(false);
      return;
    }
    let cancelled = false;
    const fetchReferrerName = async () => {
      try {
        const { data, error } = await api.getMemberPublic(referrerId);

        if (!cancelled) {
          if (data) {
            setReferrerName(data.full_name);
            setReferrerValid(true);
          } else {
            setReferrerValid(false);
          }
        }
      } catch (err) {
        console.error("Referrer lookup error:", err);
        if (!cancelled) setReferrerValid(false);
      }
    };
    fetchReferrerName();
    return () => { cancelled = true; };
  }, [referrerId]);

  useEffect(() => {
    if (!inviteToken) {
      setInviteValid(false);
      return;
    }
    let cancelled = false;
    const validateInvite = async () => {
      try {
        const { data, error } = await api.getInvite(inviteToken);

        if (!cancelled) {
          if (data && !data.is_used) {
            setInviteValid(true);
          } else {
            setInviteValid(false);
          }
        }
      } catch (err) {
        console.error("Invite validation error:", err);
        if (!cancelled) setInviteValid(false);
      }
    };
    validateInvite();
    return () => { cancelled = true; };
  }, [inviteToken]);

  return (
    <div className="flex flex-col items-center bg-white min-h-screen">
      <Hero />
      
      <main className="w-full max-w-7xl mx-auto px-4 pb-12 pt-8">

        {/* Auth Mode Toggle */}
        {referrerId && (
          <div className="flex flex-col items-center gap-4 mb-8 relative z-40">
            {referrerName && (
              <div className="bg-white border-2 border-dcp-green px-6 py-3 rounded-2xl shadow-md flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-dcp-green animate-pulse shrink-0" />
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                  Invited by: <span className="text-dcp-green italic">{referrerName}</span>
                </p>
              </div>
            )}
            {inviteValid && (
              <div className="bg-slate-900 border-2 border-amber-400 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-xs font-black text-white uppercase tracking-widest">
                  Official <span className="text-amber-400 italic">Mobilizer Invitation</span> Accepted
                </p>
              </div>
            )}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 inline-flex">
              <button
                onClick={() => setAuthMode('login')}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Member Login
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthStep('lookup'); setPrefillData(null); }}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${authMode === 'register' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Enroll New Member
              </button>
            </div>
          </div>
        )}

        {authMode === 'register' && (referrerId || inviteToken) ? (
          (referrerValid === null && !inviteToken) || (inviteValid === null && inviteToken) ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-dcp-green/20 border-t-dcp-green rounded-full animate-spin" />
            </div>
          ) : (referrerValid || inviteValid) ? (
            authStep === 'lookup' ? (
              <div className="max-w-xl mx-auto w-full bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100">
                <VoterLookup 
                  onSelect={(formData) => {
                    setPrefillData(formData);
                    setAuthStep('form');
                  }}
                  onSkip={() => {
                    setPrefillData(null);
                    setAuthStep('form');
                  }}
                />
              </div>
            ) : (
              <RegistrationForm
                referrerId={referrerValid ? referrerId : null}
                inviteToken={inviteValid ? inviteToken : null}
                initialData={prefillData}
                onSuccess={(res) => { onLogin(res.member.id, res.token); navigate("/dashboard"); }}
              />
            )
          ) : (
            <div className="max-w-md mx-auto text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
                <Lock className="text-red-400 w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Invalid Invitation</h3>
              <p className="text-sm text-slate-500 font-bold">This {inviteToken ? 'one-time code has already been used or' : 'referral link'} is not valid. Contact HQ for a valid registration link.</p>
              <button onClick={() => setAuthMode('login')} className="mt-2 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition">
                Go to Login
              </button>
            </div>
          )
        ) : (
          <LoginForm onLogin={(id, token) => onLogin(id, token)} />
        )}

        <footer className="mt-12 text-center border-t border-slate-200 pt-8 pb-10">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
              © 2026 Democracy for Citizens Party (DCP) • Official Enrollment Portal
           </p>
           <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.3em] mt-2">
              SKIZA WAKENYA - Empowering The Grassroots
           </p>
        </footer>
      </main>
    </div>
  );
}
