"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Language = "en" | "fr";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  ready: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [hasChoice, setHasChoice] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("spa-language") : null;
    if (stored === "en" || stored === "fr") {
      setLanguage(stored);
      setHasChoice(true);
      document.documentElement.lang = stored;
      return;
    }
    setShowDialog(true);
  }, []);

  useEffect(() => {
    if (showDialog) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [showDialog]);

  const persistLanguage = (lang: Language) => {
    setLanguage(lang);
    setHasChoice(true);
    setShowDialog(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("spa-language", lang);
      document.documentElement.lang = lang;
    }
  };

  const value = useMemo(
    () => ({ language, setLanguage: persistLanguage, ready: hasChoice }),
    [language, hasChoice]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}

      {hasChoice && (
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="fixed bottom-4 right-4 z-[60] rounded-full border border-amber-300/80 bg-white/80 px-4 py-2 text-sm font-semibold text-amber-800 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          🌐 {language === "en" ? "English" : "Français"}
        </button>
      )}

      {showDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur">
          <div className="max-w-md rounded-3xl bg-white/95 p-6 shadow-2xl ring-1 ring-amber-100">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">
              Choose language
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Pick your experience</h2>
            <p className="mt-2 text-sm text-slate-500">
              Select English or French to continue. You can change this anytime using the globe
              button.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                onClick={() => persistLanguage("en")}
                className="h-auto rounded-2xl bg-amber-600 px-5 py-4 text-base hover:bg-amber-700"
              >
                English
              </Button>
              <Button
                variant="outline"
                onClick={() => persistLanguage("fr")}
                className="h-auto rounded-2xl border-amber-200 px-5 py-4 text-base text-slate-800 hover:bg-amber-50"
              >
                Français
              </Button>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Nous enregistrons simplement votre préférence de langue pour améliorer votre visite.
            </p>
          </div>
        </div>
      )}
    </LanguageContext.Provider>
  );
}
