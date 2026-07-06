import { Globe2 } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageToggle({ className = "" }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit ${className}`}>
      <Globe2 size={14} className="text-slate-400 ml-1" />
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-md transition-all ${
          lang === "en" ? "bg-white text-dcp-green shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("sw")}
        className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-md transition-all ${
          lang === "sw" ? "bg-white text-dcp-green shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        SW
      </button>
      <button
        type="button"
        onClick={() => setLang("ki")}
        className={`px-3 py-1 text-[10px] font-black tracking-widest uppercase rounded-md transition-all ${
          lang === "ki" ? "bg-white text-dcp-green shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        KI
      </button>
    </div>
  );
}
