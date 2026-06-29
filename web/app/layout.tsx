import type { Metadata } from "next";
import "./globals.css";
import "reactflow/dist/style.css";
import { MobileNav, Sidebar } from "@/components/Sidebar";
import { PluginHost } from "@/components/PluginHost";
import { YouAreHere } from "@/components/shared/YouAreHere";
import { AuthGate } from "@/components/AuthGate";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://userabbitholes.com"),
  title: "Rabbit Holes — Smart history for your research.",
  description: "Follow ideas, not tabs. Turn research browsing into maps, timelines, and summaries.",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Rabbit Holes — Smart history for your research.",
    description: "Follow ideas, not tabs. Turn research browsing into maps, timelines, and summaries.",
    url: "/",
    siteName: "Rabbit Holes",
    images: [
      {
        url: "/og/rabbit-holes-og.jpg",
        width: 1200,
        height: 630,
        alt: "Rabbit Holes wordmark with bunny ears replacing the o.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rabbit Holes — Smart history for your research.",
    description: "Follow ideas, not tabs. Turn research browsing into maps, timelines, and summaries.",
    images: ["/og/rabbit-holes-og.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="rabbit-dark scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("rabbit-hole-theme")==="light"){document.documentElement.classList.remove("rabbit-dark")}else{document.documentElement.classList.add("rabbit-dark")}}catch(e){document.documentElement.classList.add("rabbit-dark")}`,
          }}
        />
      </head>
      <body className="grain min-h-screen">
        <AuthGate>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="relative flex-1 overflow-x-hidden">
              {children}
            </main>
          </div>
          <YouAreHere />
          <MobileNav />
          <PluginHost />
        </AuthGate>
      </body>
    </html>
  );
}
