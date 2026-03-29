import { getDb, COLLECTIONS, SYSTEM_DOCS } from './firebase'
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

export async function readCredentials(): Promise<Credentials> {
  // 1. Variáveis de ambiente têm prioridade (Railway)
  const envUser = process.env.ADMIN_USER
  const envHash = process.env.ADMIN_PASS_HASH
  if (envUser && envHash) {
    return { username: envUser, passHash: envHash }
  }

  // 2. Firestore
  try {
    const db = getDb()
    const snap = await db.collection(COLLECTIONS.system).doc(SYSTEM_DOCS.credentials).get()
    if (snap.exists) {
      const d = snap.data()!
      if (typeof d.username === 'string' && typeof d.passHash === 'string' && d.passHash.startsWith('$2')) {
        return { username: d.username, passHash: d.passHash }
      }
    }
  } catch {
    // Firebase não configurado ainda — usa padrão
  }

  // 3. Padrão hardcoded para primeiro acesso
  return DEFAULT_CREDENTIALS
}

export async function writeCredentials(username: string, passHash: string): Promise<void> {
  const db = getDb()
  await db.collection(COLLECTIONS.system).doc(SYSTEM_DOCS.credentials).set({ username, passHash })
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
