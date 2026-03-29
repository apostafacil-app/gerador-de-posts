import { NextResponse } from 'next/server'
import { readCompaniesData } from '@/lib/companies'

// Public (no-auth) endpoint — used by the generator page to list companies.
// Returns only the data needed to render company selector cards.

export async function GET() {
  const data = readCompaniesData()
  const companies = data.companies.map(c => ({
    id: c.id,
    name: c.name,
    colors: c.colors,
    logoDark: c.logos.darkBackground,
    logoWhite: c.logos.whiteBackground,
  }))
  return NextResponse.json({ activeCompanyId: data.activeCompanyId, companies })
}
