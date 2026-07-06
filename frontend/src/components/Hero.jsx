import { motion } from "framer-motion";
import logo from "../assets/logo.png";
void motion;

export default function Hero() {
  return (
    <div className="relative w-full pt-10 pb-16 overflow-hidden bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
          className="mb-4 max-h-32 md:max-h-44 overflow-hidden flex items-center justify-center p-0"
        >
          <img 
            src={logo} 
            alt="Democracy for Citizens Party Official Logo" 
            className="w-48 md:w-64 object-contain pointer-events-none drop-shadow-sm scale-[1.3] translate-y-2" 
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-dcp-green" />
            Official Member Enrollment Portal
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Build the Future of <span className="text-dcp-green">Ol Kalou</span> With Us
          </h1>
          
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto pt-2">
            Join the Democracy for Citizens Party (DCP) and help us build a network of change, guided by H.E. Rigathi Gachagua.
          </p>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-6">
             <div className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 group-hover:bg-dcp-green/5 group-hover:border-dcp-green/30 transition-all">
                   <div className="w-1.5 h-1.5 rounded-full bg-dcp-green" />
                </div>
                <div className="text-left">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mission</div>
                   <div className="text-sm font-bold text-slate-700">Skiza Wakenya</div>
                </div>
             </div>
             <div className="w-px h-10 bg-slate-200 hidden md:block" />
             <div className="flex items-center gap-2 group text-left">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 group-hover:bg-dcp-green/5 group-hover:border-dcp-green/30 transition-all">
                   <div className="w-1.5 h-1.5 rounded-full bg-dcp-green" />
                </div>
                <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Goal</div>
                   <div className="text-sm font-bold text-slate-700 font-outfit">Citizen Empowerment</div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,132,61,1)_0%,transparent_50%)]" />
      </div>
    </div>
  );
}
