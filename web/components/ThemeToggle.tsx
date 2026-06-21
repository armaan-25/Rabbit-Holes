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
      className="mt-3 flex w-full items-center justify-between rounded-[13px] border border-[#785a3224] bg-[#fbf6ec] px-4 py-3 text-[14px] text-[#5a4a38] transition hover:text-[#2a2018] rh-theme-toggle"
    >
      <span>{theme === "dark" ? "Dark mode" : "Light mode"}</span>
      <span className="rounded-full border border-[#785a3224] bg-white px-2 py-0.5 text-[12px] text-[#8a7860] rh-theme-pill">
        {theme === "dark" ? "On" : "Off"}
      </span>
    </button>
  );
}
