/**
 * Gerencia credenciais de acesso ao sistema.
 * Prioridade: data/credentials.json > env vars > defaults
 */
import fs from 'fs'
import path from 'path'
import bcrypt from 'bcryptjs'

export interface Credentials {
  username: string
  passHash: string
}

// Credenciais padrão para primeiro acesso: admin / Gerador@2024
const DEFAULT_CREDENTIALS: Credentials = {
  username: 'admin',
  passHash: '$2b$12$t9dv2gmgELG6qQsIEvokIuSTTf4XToma8Be5cba3t1nW9S3JyyXPW',
}

const CREDENTIALS_FILE = path.join(process.cwd(), 'data', 'credentials.json')

export function readCredentials(): Credentials {
  // 1. Arquivo local (persistido após troca de senha)
  try {
    if (fs.existsSync(CREDENTIALS_FILE)) {
      const raw = fs.readFileSync(CREDENTIALS_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (
        typeof parsed.username === 'string' && parsed.username.length > 0 &&
        typeof parsed.passHash === 'string' && parsed.passHash.startsWith('$2')
      ) {
        return { username: parsed.username, passHash: parsed.passHash }
      }
    }
  } catch {
    // arquivo corrompido — cai para próxima fonte
  }

  // 2. Variáveis de ambiente (Railway)
  const envUser = process.env.ADMIN_USER
  const envHash = process.env.ADMIN_PASS_HASH
  if (envUser && envHash) {
    return { username: envUser, passHash: envHash }
  }

  // 3. Padrão hardcoded para primeiro acesso
  return DEFAULT_CREDENTIALS
}

export async function writeCredentials(username: string, passHash: string): Promise<void> {
  const dir = path.dirname(CREDENTIALS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ username, passHash }, null, 2), 'utf-8')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
