"use client";

import { useMemo, useSyncExternalStore } from "react";
import { z } from "zod";
import type { ScanResult } from "./types";
import type { HistoryEntry } from "./stats";

/*
 * Local profile + scan history, kept in this browser's localStorage only.
 * This is NOT authentication: there is no password and nothing leaves the device.
 */

const USER_KEY = "sitepilot:v1:user";
const HIST_KEY = "sitepilot:v1:history";
const EVENT = "sitepilot:store";
const MAX_HISTORY = 50;

export interface User { name: string; createdAt: string }

const UserSchema = z.object({ name: z.string().min(1).max(40), createdAt: z.string() });
const Score = z.number().min(0).max(100);
const HistorySchema = z.array(
  z.object({
    id: z.string().max(80),
    url: z.string().max(2048),
    status: z.enum(["complete", "partial", "failed", "demo"]),
    scannedAt: z.string(),
    scores: z.object({ overall: Score, seo: Score, content: Score, accessibility: Score, provisional: z.boolean() }),
    findings: z.array(
      z.object({
        id: z.string().max(60),
        severity: z.enum(["critical", "warning", "info"]),
        category: z.enum(["seo", "content", "accessibility"]),
        title: z.string().max(300),
      }),
    ),
  }),
);

function read(key: string): string {
  try {
    return localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
function write(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* storage blocked: the app still works, history just won't persist */
  }
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}
const useRaw = (key: string) => useSyncExternalStore(subscribe, () => read(key), () => "");

function parseJson<T>(raw: string, schema: z.ZodType<T>): T | null {
  if (!raw) return null;
  try {
    const r = schema.safeParse(JSON.parse(raw));
    return r.success ? r.data : null;
  } catch {
    return null;
  }
}

/** true once running in the browser; lets pages avoid flashing a signed-out state while hydrating */
export const useHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export function useUser(): User | null {
  const raw = useRaw(USER_KEY);
  return useMemo(() => parseJson(raw, UserSchema), [raw]);
}
export function useHistory(): HistoryEntry[] {
  const raw = useRaw(HIST_KEY);
  return useMemo(() => parseJson(raw, HistorySchema) ?? [], [raw]);
}

export function signIn(name: string): boolean {
  const clean = name.replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, 40);
  if (!clean) return false;
  write(USER_KEY, JSON.stringify({ name: clean, createdAt: new Date().toISOString() } satisfies User));
  return true;
}
export const signOut = () => write(USER_KEY, "");

/** Saves a scored scan (failed scans have no score and are skipped). */
export function recordScan(scan: ScanResult) {
  if (!scan.scores || scan.status === "failed") return;
  const prev = parseJson(read(HIST_KEY), HistorySchema) ?? [];
  const entry: HistoryEntry = {
    id: `${scan.scannedAt}-${Math.random().toString(36).slice(2, 7)}`,
    url: scan.url,
    status: scan.status,
    scannedAt: scan.scannedAt,
    scores: scan.scores,
    findings: scan.findings.map((f) => ({ id: f.id, severity: f.severity, category: f.category, title: f.title })),
  };
  write(HIST_KEY, JSON.stringify([entry, ...prev].slice(0, MAX_HISTORY)));
}
export const clearHistory = () => write(HIST_KEY, "");
