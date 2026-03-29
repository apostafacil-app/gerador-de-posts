import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { readCompaniesData, updateCompany, deleteCompany, setActiveCompany } from '@/lib/companies'

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-gerador-de-posts-local-32chars-ok')
    await jwtVerify(token, secret)
    return true
  } catch { return false }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const data = readCompaniesData()
  const company = data.companies.find(c => c.id === params.id)
  if (!company) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  return NextResponse.json(company)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  const updated = updateCompany(params.id, body)
  if (!updated) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const data = readCompaniesData()
  if (data.companies.length <= 1) return NextResponse.json({ error: 'Não é possível deletar a única empresa.' }, { status: 400 })
  const ok = deleteCompany(params.id)
  if (!ok) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()
  if (body.activate) {
    const ok = setActiveCompany(params.id)
    if (!ok) return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}
