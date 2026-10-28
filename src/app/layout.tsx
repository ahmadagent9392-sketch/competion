import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SitePilot AI — website audits that explain themselves",
  description: "Real, deterministic website checks with AI explanations and rewrites. Audit like an engineer, explain like a consultant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
