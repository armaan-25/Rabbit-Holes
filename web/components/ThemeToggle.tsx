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
      className="rh-surface mt-3 flex w-full items-center justify-between rounded-[13px] border px-4 py-3 text-[14px] transition"
    >
      <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
      <span className="rh-surface-2 rounded-full border px-2 py-0.5 text-[12px] rh-muted">
        {theme === "dark" ? "On" : "Off"}
      </span>
    </button>
  );
}
