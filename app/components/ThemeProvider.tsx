"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useMemo,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  isHydrated: boolean;
}

interface ThemeState {
  theme: Theme;
  isHydrated: boolean;
}

type ThemeAction =
  | { type: "SET_THEME"; theme: Theme }
  | { type: "HYDRATE"; theme: Theme };

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case "SET_THEME":
      return { ...state, theme: action.theme };
    case "HYDRATE":
      return {
        theme: action.theme,
        isHydrated: true,
      };
    default:
      return state;
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
}) {
  const [state, dispatch] = useReducer(themeReducer, {
    theme: defaultTheme,
    isHydrated: false,
  });

  const resolvedTheme = useMemo(() => {
    return state.theme;
  }, [state.theme]);

  const handleSetTheme = (newTheme: Theme) => {
    dispatch({ type: "SET_THEME", theme: newTheme });
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
    }
  };

  // Single effect to handle all client-side initialization
  useEffect(() => {
    // Get stored theme preference
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const finalTheme =
      storedTheme && (storedTheme === "light" || storedTheme === "dark")
        ? storedTheme
        : defaultTheme;

    // Hydrate with actual values
    dispatch({
      type: "HYDRATE",
      theme: finalTheme,
    });
  }, [defaultTheme]);

  useEffect(() => {
    // Apply theme to document only after hydration
    if (!state.isHydrated) return;

    const root = document.documentElement;

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  }, [resolvedTheme, state.isHydrated]);

  return (
    <ThemeContext.Provider
      value={{
        theme: state.theme,
        setTheme: handleSetTheme,
        resolvedTheme,
        isHydrated: state.isHydrated,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
