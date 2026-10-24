import type { Metadata } from "next";
import "@fontsource-variable/fraunces/index.css";
import "@fontsource-variable/fraunces/wght-italic.css";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-sans/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaRegister } from "@/components/providers/pwa-register";

export const metadata: Metadata = {
  title: "CostPacket — Job-Costed Expense Packets",
  description:
    "Receipt parsing, expense approvals, and payout packets for small contractors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={
        {
          "--font-fraunces": '"Fraunces Variable"',
          "--font-plex-sans": '"IBM Plex Sans"',
          "--font-plex-mono": '"IBM Plex Mono"',
        } as React.CSSProperties
      }
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          themes={["light", "dark", "oled"]}
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster theme="system" position="bottom-right" />
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
