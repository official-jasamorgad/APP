import { createContext, useContext, useEffect, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "id");
  const [currency, setCurrency] = useState(() => localStorage.getItem("currency") || "IDR");

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);
  useEffect(() => {
    localStorage.setItem("currency", currency);
  }, [currency]);

  return (
    <AppContext.Provider value={{ lang, setLang, currency, setCurrency }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
