"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolvedTheme: "dark",
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("taskflow-theme") as Theme | null;
    if (saved) {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const applyTheme = (resolved: "light" | "dark") => {
      setResolvedTheme(resolved);
      const d = document.documentElement;
      if (resolved === "dark") {
        d.classList.add("dark");
        d.classList.remove("light");
        d.style.colorScheme = "dark";
      } else {
        d.classList.remove("dark");
        d.classList.add("light");
        d.style.colorScheme = "light";
      }
    };

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mq.matches ? "dark" : "light");

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? "dark" : "light");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme, mounted]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("taskflow-theme", t);
  };

  // Prevent flash - render children immediately
  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ── Theme Toggle Button Component ── */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const options: { value: Theme; label: string; emoji: string }[] = [
    { value: "light", label: "Light", emoji: "\u2600\ufe0f" },
    { value: "dark", label: "Dark", emoji: "\ud83c\udf19" },
    { value: "system", label: "System", emoji: "\ud83d\udcbb" },
  ];

  const current = options.find((o) => o.value === theme) || options[2];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-xl transition-all border ${
          compact
            ? "p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-transparent"
            : "px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
        }`}
        title="Theme"
      >
        <span className="text-base leading-none">{current.emoji}</span>
        {!compact && <span>{current.label}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 z-50 animate-scale-in">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                  theme === opt.value
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 font-medium"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                }`}
              >
                <span className="text-base leading-none">{opt.emoji}</span>
                {opt.label}
                {theme === opt.value && (
                  <svg className="w-3.5 h-3.5 ml-auto text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
