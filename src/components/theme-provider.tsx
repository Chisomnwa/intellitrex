"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const THEME_KEY = "intellitrex-theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: "light", toggle: () => {} });

function subscribeToTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("intellitrex-theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("intellitrex-theme-change", callback);
  };
}

function getThemeSnapshot(): Theme {
  return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    window.dispatchEvent(new Event("intellitrex-theme-change"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
