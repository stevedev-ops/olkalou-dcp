import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "../lib/translations";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem("dcp_lang") || "en");

  useEffect(() => {
    localStorage.setItem("dcp_lang", lang);
  }, [lang]);

  const t = (key) => {
    if (!translations[lang]) return key;
    return translations[lang][key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
