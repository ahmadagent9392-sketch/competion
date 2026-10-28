"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signIn, useHydrated, useUser } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const user = useUser();
  const hydrated = useHydrated();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn(name)) {
      setError("Please enter a name to continue.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div
      className="light-page flex min-h-screen flex-col items-center justify-center px-4"
      style={{ background: "radial-gradient(900px 480px at 50% -80px, var(--glow) 0%, transparent 70%), var(--l-bg)" }}
    >
      <div className="absolute right-4 top-4" style={{ color: "var(--l-fg)" }}><ThemeToggle surface="light" /></div>
      <Link href="/" className="mb-6 text-xl font-extrabold tracking-tight">
        <span style={{ color: "var(--brand)" }}>◆</span> SitePilot AI
      </Link>

      <div className="w-full max-w-md rounded-2xl p-7 shadow-sm" style={{ background: "var(--l-card)", border: "1px solid var(--l-line)" }}>
        {hydrated && user ? (
          <>
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome back, {user.name}</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--l-muted)" }}>You are signed in on this browser.</p>
            <div className="mt-6 grid gap-3">
              <Link href="/dashboard" className="btn btn-primary" style={{ padding: "12px 18px" }}>Open dashboard</Link>
              <Link href="/app" className="btn btn-light" style={{ padding: "12px 18px" }}>Open workspace</Link>
            </div>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--l-muted)" }}>
              Enter your name to open your dashboard. No password and no email needed.
            </p>
            <label htmlFor="name" className="mt-6 block text-sm font-semibold">Your name</label>
            <input
              id="name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }}
              placeholder="e.g. Ahmad" maxLength={40} autoFocus autoComplete="nickname"
              aria-invalid={error ? true : undefined} aria-describedby={error ? "name-error" : undefined}
              className="mt-2 w-full rounded-lg px-4 py-3 text-base outline-none"
              style={{ background: "var(--l-bg)", border: `1px solid ${error ? "#dc2626" : "var(--l-line)"}`, color: "var(--l-fg)" }}
            />
            {error && <p id="name-error" role="alert" className="mt-2 text-sm" style={{ color: "#b91c1c" }}>{error}</p>}
            <button type="submit" className="btn btn-primary mt-5 w-full" style={{ padding: "12px 18px", fontSize: 16 }}>Continue</button>
            <Link href="/app" className="mt-3 block text-center text-sm font-medium hover:underline" style={{ color: "var(--l-muted)" }}>
              Continue as guest →
            </Link>
          </form>
        )}
      </div>

      <p className="mt-5 max-w-md text-center text-xs" style={{ color: "var(--l-muted)" }}>
        This is a local profile, not an account. Your name and scan history are stored only in this browser and are never sent to a server.
      </p>
    </div>
  );
}
