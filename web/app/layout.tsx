import type { Metadata } from "next";
import "./globals.css";
import "reactflow/dist/style.css";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import { PluginHost } from "@/components/PluginHost";
import { YouAreHere } from "@/components/shared/YouAreHere";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://userabbitholes.com"),
  title: "Rabbit Holes — Smart history for your research.",
  description: "Your browsing, understood as investigations.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="grain min-h-screen">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="relative flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
        <YouAreHere />
        <MobileNav />
        <PluginHost />
      </body>
    </html>
  );
}
