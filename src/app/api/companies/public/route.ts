import { NextResponse } from 'next/server'
import { readCompaniesData } from '@/lib/companies'

// Rota pública (sem autenticação) — usada pela tela de seleção de empresa.
export async function GET() {
  const data = await readCompaniesData()
  const companies = data.companies.map(c => ({
    id: c.id,
    name: c.name,
    colors: c.colors,
    logoDark:  c.logos.darkBackground,
    logoWhite: c.logos.whiteBackground,
  }))
  return NextResponse.json({ activeCompanyId: data.activeCompanyId, companies })
}
