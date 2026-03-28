import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { readCredentials, verifyPassword } from '@/lib/credentials'

// Rate limiting simples para login (5 tentativas/min por IP)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const LOGIN_LIMIT = 5
const LOGIN_WINDOW_MS = 60 * 1000

function checkLoginRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    return true
  }
  if (entry.count >= LOGIN_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (!checkLoginRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde um minuto.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
  }

  const { username, password } = body as Record<string, unknown>

  if (
    typeof username !== 'string' || username.length > 100 ||
    typeof password !== 'string' || password.length > 200
  ) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    console.error('[auth/login] JWT_SECRET não configurado.')
    return NextResponse.json({ error: 'Servidor não configurado.' }, { status: 500 })
  }

  const credentials = readCredentials()

  // Comparação em tempo constante para evitar timing attacks
  // bcrypt.compare já é timing-safe por design
  const passwordMatch = await verifyPassword(password, credentials.passHash)
  const usernameMatch = username === credentials.username

  // Validar AMBOS antes de responder — evita enumerar usuários por tempo de resposta
  if (!usernameMatch || !passwordMatch) {
    return NextResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 })
  }

  const secret = new TextEncoder().encode(jwtSecret)
  const token = await new SignJWT({ sub: credentials.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/',
  })
  return res
}
