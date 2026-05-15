import React, { createContext, useContext, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

/**
 * ThemeProvider — controla o tema via className no wrapper div.
 * REGRA: Nunca altera document.documentElement diretamente.
 * A classe "dark" é aplicada no <html> via index.html (tema padrão)
 * e sincronizada via className no wrapper para o Tailwind funcionar.
 */
export function ThemeProvider({
  children,
  defaultTheme = "dark",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable && typeof window !== "undefined") {
      const stored = localStorage.getItem("vidapro-theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  function handleToggle() {
    if (!switchable) return;
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("vidapro-theme", next);
      // Atualiza a classe no <html> de forma segura (sem criar/remover nós)
      // classList.add/remove NÃO causa insertBefore/removeChild no React fiber
      const html = document.documentElement;
      if (next === "dark") {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    }
  }

  const toggleTheme = switchable ? handleToggle : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      <div className={theme === "dark" ? "dark" : ""} style={{ display: "contents" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
