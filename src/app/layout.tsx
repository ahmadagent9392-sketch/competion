import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SitePilot AI — website audits that explain themselves",
  description: "Real, deterministic website checks with AI explanations and rewrites. Audit like an engineer, explain like a consultant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">{`try{var t=localStorage.getItem("sitepilot:v1:theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`}</Script>
        {children}
      </body>
    </html>
  );
}
