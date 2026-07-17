import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Toaster } from "react-hot-toast";

const poppins = Poppins({ 
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"], 
  variable: "--font-sans" 
});

export const metadata: Metadata = {
  title: "SMART — Correspondence Management",
  description: "Professional correspondence management system. Create, manage, and validate business correspondence with customizable templates."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen bg-slate-50 font-sans" suppressHydrationWarning>
        <Toaster position="top-right" />

        <Sidebar />

        <main className="lg:pl-64 min-h-screen relative z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-6 max-w-7xl mx-auto">
            <Header />
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
