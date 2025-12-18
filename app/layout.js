import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "../components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RCM Studio",
  description: "RCM revenue cycle management MVP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-slate-50 text-slate-900">
          {/* AppShell is client-side to manage auth-aware nav */}
          <AppShell>{children}</AppShell>
        </div>
      </body>
    </html>
  );
}
