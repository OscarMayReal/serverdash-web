import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TRPCProvider } from "@/trpc/client"
import { cn } from "@workspace/ui/lib/utils";

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
