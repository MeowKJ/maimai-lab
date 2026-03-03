import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { MaimaiBackground } from '@/components/background/MaimaiBackground'
import { AppShell } from '@/components/layout/AppShell'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'maimai Hub',
  description: 'maimai DX 成绩查询 & 工具箱',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      data-accent="blue"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-[family-name:var(--font-geist-sans)] antialiased">
        <Providers>
          <MaimaiBackground />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
