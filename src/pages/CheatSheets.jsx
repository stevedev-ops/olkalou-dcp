import { Printer, ShieldCheck, AlertTriangle, Send } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function CheatSheets() {
  const { t } = useLanguage();
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Non-printable header */}
      <div className="print:hidden flex items-center justify-between mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">{t('cs_title')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('cs_desc')}</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition"
        >
          <Printer size={18} />
          {t('cs_print')}
        </button>
      </div>

      {/* Printable Area - Guide 1 */}
      <div className="print-page bg-white p-10 border border-slate-200 rounded-2xl shadow-sm mb-12">
        <div className="border-b-4 border-dcp-green pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">{t('cs_g1_title')}</h1>
            <p className="text-lg font-bold text-slate-500 uppercase tracking-widest mt-1">{t('cs_g1_sub')}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-dcp-green/10 flex items-center justify-center border border-dcp-green/20">
            <ShieldCheck size={32} className="text-dcp-green" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0">1</div>
            <div>
              <h3 className="text-xl font-black uppercase">{t('cs_g1_s1')}</h3>
              <p className="text-slate-600 text-lg mt-1">{t('cs_g1_d1')}</p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0">2</div>
            <div>
              <h3 className="text-xl font-black uppercase">{t('cs_g1_s2')}</h3>
              <p className="text-slate-600 text-lg mt-1">{t('cs_g1_d2')}</p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0">3</div>
            <div>
              <h3 className="text-xl font-black uppercase">{t('cs_g1_s3')}</h3>
              <p className="text-slate-600 text-lg mt-1">{t('cs_g1_d3')}</p>
              <div className="mt-4 p-4 border-2 border-slate-200 rounded-xl bg-slate-50">
                <p className="font-bold text-slate-500 text-sm uppercase tracking-widest mb-2">Example Screen:</p>
                <div className="grid grid-cols-2 gap-4 opacity-70 pointer-events-none">
                  <div className="bg-white p-3 border border-slate-200 rounded">
                    <p className="text-[10px] font-bold text-slate-400">DCP VOTES</p>
                    <p className="text-lg font-black text-dcp-green">342</p>
                  </div>
                  <div className="bg-white p-3 border border-slate-200 rounded">
                    <p className="text-[10px] font-bold text-slate-400">UDA VOTES</p>
                    <p className="text-lg font-black text-red-500">114</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0">4</div>
            <div>
              <h3 className="text-xl font-black uppercase">{t('cs_g1_s4')}</h3>
              <p className="text-slate-600 text-lg mt-1">{t('cs_g1_d4')}</p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xl shrink-0">5</div>
            <div>
              <h3 className="text-xl font-black uppercase">{t('cs_g1_s5')}</h3>
              <p className="text-slate-600 text-lg mt-1">{t('cs_g1_d5')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Area - Guide 2 */}
      <div className="print-page bg-white p-10 border border-slate-200 rounded-2xl shadow-sm">
        <div className="border-b-4 border-red-500 pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900">{t('cs_g2_title')}</h1>
            <p className="text-lg font-bold text-slate-500 uppercase tracking-widest mt-1">{t('cs_g2_sub')}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center border border-red-200">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
        </div>

        <div className="space-y-8">
          <p className="text-xl font-bold leading-relaxed text-slate-700 bg-red-50 p-6 rounded-xl border-l-4 border-red-500">
            {t('cs_g2_desc')}
          </p>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-xl shrink-0">1</div>
            <div>
              <h3 className="text-xl font-black uppercase text-red-600">{t('cs_g2_s1')}</h3>
              <p className="text-slate-600 text-lg mt-1">{t('cs_g2_d1')}</p>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-xl shrink-0">2</div>
            <div>
              <h3 className="text-xl font-black uppercase text-red-600">{t('cs_g2_s2')}</h3>
              <p className="text-slate-600 text-lg mt-1">{t('cs_g2_d2')}</p>
              
              <div className="mt-6 p-6 border-2 border-slate-200 rounded-xl bg-slate-900 flex justify-center max-w-sm">
                 <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-500 text-white text-sm font-black uppercase tracking-widest shadow-lg pointer-events-none">
                    <AlertTriangle size={18} /> WIPE DEVICE
                 </button>
              </div>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-xl shrink-0">3</div>
            <div>
              <h3 className="text-xl font-black uppercase text-red-600">{t('cs_g2_s3')}</h3>
              <p className="text-slate-600 text-lg mt-1">{t('cs_g2_d3')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
