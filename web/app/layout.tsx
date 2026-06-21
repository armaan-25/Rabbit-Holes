import type { Metadata } from "next";
import "./globals.css";
import "reactflow/dist/style.css";
import { Sidebar } from "@/components/Sidebar";
import { PluginHost } from "@/components/PluginHost";
import { YouAreHere } from "@/components/shared/YouAreHere";

export const metadata: Metadata = {
  title: "Rabbit Holes — Follow ideas, not tabs.",
  description: "Your browsing, understood as investigations.",
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
        <PluginHost />
      </body>
    </html>
  );
}
