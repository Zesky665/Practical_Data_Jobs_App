import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  title: "Practical Data Jobs",
  description: "AI-matched data roles for the Practical Data Community.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Root layout stays session-free on purpose: the public subtree (/, /auth/*)
  // shouldn't pay an auth round-trip. Session reads happen in app/page.tsx
  // (adaptive CTA) and app/app/layout.tsx (gated chrome).
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
