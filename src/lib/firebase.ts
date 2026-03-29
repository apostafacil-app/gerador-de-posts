/**
 * Firebase Admin SDK — singleton.
 * Inicializa uma única vez usando as variáveis de ambiente do Railway/servidor.
 *
 * Variáveis necessárias:
 *   FIREBASE_PROJECT_ID     — ID do projeto Firebase
 *   FIREBASE_CLIENT_EMAIL   — email da service account
 *   FIREBASE_PRIVATE_KEY    — chave privada da service account (com \n literal)
 */
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let _app: App | null = null
let _db: Firestore | null = null

function getApp(): App {
  if (_app) return _app
  if (getApps().length > 0) {
    _app = getApps()[0]
    return _app
  }

  const projectId    = process.env.FIREBASE_PROJECT_ID
  const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey   = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase não configurado. Defina FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL e FIREBASE_PRIVATE_KEY.'
    )
  }

  _app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
  return _app
}

export function getDb(): Firestore {
  if (_db) return _db
  getApp()
  _db = getFirestore()
  return _db
}

// ── Coleções ─────────────────────────────────────────────────────────────────
export const COLLECTIONS = {
  companies:    'companies',
  companyLogos: 'company_logos',  // logos separados para evitar limite 1 MB/doc
  system:       'system',         // documentos de configuração do sistema
} as const

// IDs dos documentos de sistema
export const SYSTEM_DOCS = {
  meta:        'meta',        // { activeCompanyId }
  credentials: 'credentials', // { username, passHash }
  aiConfig:    'ai_config',   // { provider, apiKey }
  settings:    'settings',    // { aiRules }
} as const
