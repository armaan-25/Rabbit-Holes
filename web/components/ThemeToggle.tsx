"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem("rabbit-hole-theme") as Theme | null;
    const initial = saved === "dark" || saved === "light" ? saved : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("rabbit-dark", initial === "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem("rabbit-hole-theme", next);
    document.documentElement.classList.toggle("rabbit-dark", next === "dark");
  }

  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="rh-surface grid h-10 w-10 shrink-0 place-items-center rounded-[11px] border text-[16px] rh-muted transition hover:text-[var(--rh-ink)]"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
