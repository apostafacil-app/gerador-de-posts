import { NextResponse } from 'next/server'
import { readCompaniesData } from '@/lib/companies'

// Força sempre buscar dados frescos do Firestore (sem cache Next.js)
export const dynamic = 'force-dynamic'

// Rota pública (sem autenticação) — usada pela tela de seleção de empresa.
export async function GET() {
  try {
    const data = await readCompaniesData()
    const companies = data.companies.map(c => ({
      id: c.id,
      name: c.name,
      colors: c.colors,
      logoDark:  c.logos.darkBackground,
      logoWhite: c.logos.whiteBackground,
    }))
    return NextResponse.json({ activeCompanyId: data.activeCompanyId, companies })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[/api/companies/public]', msg)
    return NextResponse.json({ error: msg, companies: [] }, { status: 500 })
  }
}
