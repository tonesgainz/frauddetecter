import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fraud Analyzer — SNF × Premier League",
  description: "Real-time credit card fraud detection with AI-powered review",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans text-gray-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
