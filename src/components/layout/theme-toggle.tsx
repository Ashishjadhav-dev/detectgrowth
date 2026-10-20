"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("detectgrowth-theme", next ? "dark" : "light");
    setDark(next);
  };

  return <Button variant="ghost" className="h-10 w-10 shrink-0 p-0" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} aria-pressed={dark} onClick={toggle}>{dark ? <Sun className="size-5" /> : <Moon className="size-5" />}</Button>;
}
