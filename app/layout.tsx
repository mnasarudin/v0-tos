import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "AdminHub - Dashboard",
  description: "Professional admin dashboard with authentication",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
