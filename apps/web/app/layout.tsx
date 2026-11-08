import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TRPCProvider } from "@/trpc/client"
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "ServerDash — Linux Server Dashboard",
    template: "%s | ServerDash",
  },
  description: "A web dashboard for managing and accessing a Linux server.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans")}
      style={{ "--font-sans": "Arial, Helvetica, sans-serif", "--font-mono": "ui-monospace, SFMono-Regular, Menlo, monospace" } as React.CSSProperties}
    >
      <body>
        <ThemeProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
