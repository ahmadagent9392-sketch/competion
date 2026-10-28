"use client";

import { setTheme, useHydrated, useTheme } from "@/lib/store";

/** `surface` is the page's natural look, used when the visitor has not chosen a theme yet. */
export function ThemeToggle({ surface }: { surface: "light" | "dark" }) {
  const chosen = useTheme();
  const hydrated = useHydrated();
  const current = chosen || surface;
  const next = current === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="btn"
      style={{ padding: "6px 10px", border: "1px solid color-mix(in srgb, currentColor 22%, transparent)", color: "inherit", background: "transparent", minWidth: 38 }}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      <span aria-hidden>{hydrated ? (current === "dark" ? "☀" : "☾") : "☾"}</span>
    </button>
  );
}
