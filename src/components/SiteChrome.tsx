import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/checks", label: "Checks" },
  { href: "/security", label: "Security" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur" style={{ background: "color-mix(in srgb, var(--l-bg) 82%, transparent)", borderBottom: "1px solid var(--l-line)", color: "var(--l-fg)" }}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="whitespace-nowrap text-lg font-extrabold tracking-tight">
          <span style={{ color: "var(--brand)" }}>◆</span> SitePilot AI
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hidden text-sm font-medium hover:underline sm:inline" style={{ color: "var(--l-muted)" }}>
              {l.label}
            </Link>
          ))}
          <ThemeToggle surface="light" />
          <Link href="/dashboard" className="btn btn-light hidden sm:inline-flex" style={{ padding: "7px 14px" }}>Dashboard</Link>
          <Link href="/app" className="btn btn-primary" style={{ padding: "7px 12px" }}>Open<span className="hidden sm:inline">&nbsp;workspace</span></Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20" style={{ borderTop: "1px solid var(--l-line)" }}>
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between" style={{ color: "var(--l-muted)" }}>
        <span><strong style={{ color: "var(--l-fg)" }}>SitePilot AI</strong> · Audit like an engineer, explain like a consultant.</span>
        <nav className="flex flex-wrap gap-4">
          {[{ href: "/app", label: "Workspace" }, { href: "/dashboard", label: "Dashboard" }, { href: "/login", label: "Sign in" }, ...LINKS].map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">{l.label}</Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro: string }) {
  return (
    <section className="py-12 text-center sm:py-16">
      <span className="badge" style={{ background: "var(--brand-soft)", color: "var(--brand-strong)" }}>{eyebrow}</span>
      <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">{title}</h1>
      <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg" style={{ color: "var(--l-muted)" }}>{intro}</p>
    </section>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-6 ${className}`} style={{ background: "var(--l-card)", border: "1px solid var(--l-line)" }}>
      {children}
    </div>
  );
}

export const LIGHT_BG = { background: "radial-gradient(1200px 500px at 50% -120px, var(--glow) 0%, transparent 70%), var(--l-bg)" };
