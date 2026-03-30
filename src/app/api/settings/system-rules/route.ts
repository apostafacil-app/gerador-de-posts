import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { readAllRules, writeRuleSection, type ModeKey } from '@/lib/system-settings'

const VALID_SECTIONS: ModeKey[] = ['base', 'post_dark', 'post_light', 'story_dark', 'story_light']

async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return false
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-gerador-de-posts-local-32chars-ok')
    await jwtVerify(token, secret)
    return true
  } catch { return false }
}

export async function GET(req: NextRequest) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const allRules = await readAllRules()
  return NextResponse.json(allRules)
}

export async function POST(req: NextRequest) {
  if (!(await verifyAuth(req))) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await req.json()

  const section = body.section as ModeKey
  const rules   = body.rules as string

  if (!VALID_SECTIONS.includes(section)) {
    return NextResponse.json({ error: `Seção inválida. Use: ${VALID_SECTIONS.join(', ')}` }, { status: 400 })
  }
  if (typeof rules !== 'string' || rules.length < 20) {
    return NextResponse.json({ error: 'Regras inválidas (muito curtas).' }, { status: 400 })
  }

  await writeRuleSection(section, rules)
  return NextResponse.json({ ok: true })
}
