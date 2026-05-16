import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { TrpcProvider } from "@/lib/trpc-provider";

export const metadata: Metadata = {
  title: {
    default: "SMC Sudan MOBA Community",
    template: "%s | SMC Sudan",
  },
  description:
    "Sudan's premier MLBB leaderboard and player tracking platform. Track your rank, hero stats, and compete with the best players in Sudan.",
  keywords: ["MLBB", "Mobile Legends", "Sudan", "Leaderboard", "Esports", "SMC"],
  authors: [{ name: "SMC Sudan MOBA Community" }],
  creator: "SMC Sudan",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://smc-sudan.gg",
    siteName: "SMC Sudan MOBA Community",
    title: "SMC Sudan MOBA Community",
    description: "Sudan's premier MLBB leaderboard and player tracking platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "SMC Sudan MOBA Community",
    description: "Sudan's premier MLBB leaderboard and player tracking platform",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <div className="animated-bg" aria-hidden="true" />
        <TrpcProvider>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </TrpcProvider>
      </body>
    </html>
  );
}
