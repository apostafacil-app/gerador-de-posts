'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()

  if (pathname === '/login') return null

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const isHome = pathname === '/'
  const isSettings = pathname.startsWith('/settings')

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">G</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">Gerador de Posts</span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isHome
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Empresas
          </Link>
          <Link
            href="/settings"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isSettings
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            ⚙ Configurações
          </Link>
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}
