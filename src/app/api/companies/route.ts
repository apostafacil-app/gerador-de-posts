import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { readCompaniesData, createCompany, setActiveCompany } from '@/lib/companies'
import type { Company } from '@/types'

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-gerador-de-posts-local-32chars-ok')
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const data = readCompaniesData()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json() as Partial<Company>

  // Handle activate action
  if (body.id && Object.keys(body).length === 1) {
    const ok = setActiveCompany(body.id)
    if (!ok) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    return NextResponse.json({ ok: true })
  }

  const { name, description = '', websiteUrl = '', colors, logos, aiRules = '' } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 })

  const s = {
    name: name.trim(),
    description,
    websiteUrl,
    colors: colors || { primary: '#7b00d4', secondary: '#2d0055', accent: '#b388f0' },
    logos: logos || { darkBackground: '', whiteBackground: '' },
    aiRules,
  }
  const company = createCompany(s)
  return NextResponse.json(company, { status: 201 })
}
