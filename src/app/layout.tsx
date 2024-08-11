import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EvoluProvider } from "@evolu/react";
import { evolu } from "@/db/db";
import posthog from "posthog-js";
import PostHogPageView from "./PostHogPageView";
import { PHProvider } from "./providers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-svh" suppressHydrationWarning>
      <Suspense>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <PHProvider>
            <body
              className={
                (inter.className, "flex min-h-svh items-center justify-center")
              }
            >
              <PostHogPageView />
              {children}
            </body>
          </PHProvider>
        </ThemeProvider>
      </Suspense>
    </html>
  );
}
