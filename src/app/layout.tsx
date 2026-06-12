import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SpeedInsights } from "@vercel/speed-insights/next"

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
        className={`${outfit.variable} ${jetbrainsMono.variable} antialiased min-h-screen gradient-bg-noir relative`}
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        {/* Dot grid */}
        <div className="fixed inset-0 dot-grid pointer-events-none opacity-60" aria-hidden="true" />

        {/* Ambient violet glow — top center */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-500/[0.055] rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
        {/* Subtle amber tint — bottom right */}
        <div className="fixed bottom-0 right-0 w-[400px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[100px] pointer-events-none" aria-hidden="true" />

        <div className="relative z-10">
          <Providers>
            {children}
            <SpeedInsights />
          </Providers>
        </div>
      </body>
    </html>
  );
}
