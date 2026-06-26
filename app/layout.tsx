import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { cn } from "@/lib/utils";
import AgentationWrapper from "@/components/shared/AgentationWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "PersonaForge — AI Synthetic User Research",
  description:
    "Simulate diverse user archetypes, surface friction points, and predict real-world reactions — before a single user test.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <html
        lang="en"
        suppressHydrationWarning
        className={cn(inter.variable, playfair.variable)}
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('pf-theme');if(t){document.documentElement.classList.toggle('dark',t==='dark')}else{var d=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',d)}}catch(e){}})()`,
            }}
          />
        </head>
        <body className="min-h-screen bg-background text-foreground">
          <ThemeProvider>
            {children}
            <AgentationWrapper />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
