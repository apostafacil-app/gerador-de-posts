import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/shared/Navbar'

export const metadata: Metadata = {
  title: 'Gerador de Posts',
  description: 'Gerador de posts e stories para Instagram com IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
