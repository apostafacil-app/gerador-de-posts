import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { readCredentials, writeCredentials, hashPassword, verifyPassword } from '@/lib/credentials'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    return NextResponse.json({ error: 'Servidor não configurado.' }, { status: 500 })
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(jwtSecret))
  } catch {
    return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const { currentPassword, newUsername, newPassword } = body as Record<string, unknown>

  if (
    typeof currentPassword !== 'string' || currentPassword.length === 0 ||
    typeof newUsername !== 'string' || newUsername.length < 3 || newUsername.length > 50 ||
    typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 200
  ) {
    return NextResponse.json(
      { error: 'Dados inválidos. Usuário: 3–50 chars. Senha: mínimo 8 chars.' },
      { status: 400 }
    )
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
    return NextResponse.json(
      { error: 'Usuário deve conter apenas letras, números, _ ou -.' },
      { status: 400 }
    )
  }

  const current = await readCredentials()
  const valid = await verifyPassword(currentPassword, current.passHash)
  if (!valid) {
    return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
  }

  const newHash = await hashPassword(newPassword)
  await writeCredentials(newUsername, newHash)

  return NextResponse.json({ ok: true })
}
