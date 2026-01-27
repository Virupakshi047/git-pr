import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PR Documenter | AI-Powered GitHub Documentation",
  description: "Transform your GitHub Pull Requests into comprehensive technical documentation using advanced AI analysis. Fast, accurate, and beautifully formatted.",
  keywords: ["GitHub", "PR", "AI", "Documentation", "Automation", "Developer Tools", "Code Review"],
  openGraph: {
    title: "PR Documenter | AI-Powered GitHub Documentation",
    description: "Transform GitHub PRs into beautiful technical docs with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased min-h-screen gradient-bg-noir noise-overlay relative`}
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        {/* Subtle grid pattern overlay */}
        <div className="fixed inset-0 grid-pattern pointer-events-none opacity-50" aria-hidden="true" />

        {/* Gradient orbs for atmosphere */}
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
