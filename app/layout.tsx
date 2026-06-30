import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Toaster } from '@/components/ui/toaster'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'EvidFoto — Manajemen Foto Pekerjaan',
  description: 'Aplikasi penyimpanan dan manajemen foto bukti pekerjaan. Upload, kelola, dan unduh foto dengan mudah.',
  keywords: 'foto pekerjaan, evidence foto, manajemen foto, dokumentasi lapangan',
  metadataBase: new URL('https://evid-foto.vercel.app'),
  alternates: {
    canonical: 'https://evid-foto.vercel.app',
  },
  openGraph: {
    title: 'EvidFoto — Manajemen Foto Pekerjaan',
    description: 'Aplikasi penyimpanan dan manajemen foto bukti pekerjaan. Upload, kelola, dan unduh foto dengan mudah.',
    url: 'https://evid-foto.vercel.app',
    siteName: 'EvidFoto',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'EvidFoto — Manajemen Foto Pekerjaan',
    description: 'Aplikasi penyimpanan dan manajemen foto bukti pekerjaan.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.variable} font-poppins antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
