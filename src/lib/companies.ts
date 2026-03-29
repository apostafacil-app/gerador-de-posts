import { getDb, COLLECTIONS, SYSTEM_DOCS } from './firebase'
import type { Company, CompaniesData } from '@/types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── Helpers internos ─────────────────────────────────────────────────────────

async function getActiveCompanyId(): Promise<string> {
  const db = getDb()
  const snap = await db.collection(COLLECTIONS.system).doc(SYSTEM_DOCS.meta).get()
  return snap.exists ? (snap.data()?.activeCompanyId ?? '') : ''
}

async function setActiveCompanyId(id: string): Promise<void> {
  const db = getDb()
  await db.collection(COLLECTIONS.system).doc(SYSTEM_DOCS.meta).set({ activeCompanyId: id }, { merge: true })
}

/** Lê os logos de uma empresa (documento separado para evitar limite 1 MB/doc) */
async function getLogos(id: string): Promise<{ darkBackground: string; whiteBackground: string }> {
  const db = getDb()
  const snap = await db.collection(COLLECTIONS.companyLogos).doc(id).get()
  if (!snap.exists) return { darkBackground: '', whiteBackground: '' }
  const d = snap.data()!
  return {
    darkBackground:  d.darkBackground  ?? '',
    whiteBackground: d.whiteBackground ?? '',
  }
}

/** Salva logos de uma empresa */
async function saveLogos(id: string, logos: { darkBackground: string; whiteBackground: string }): Promise<void> {
  const db = getDb()
  await db.collection(COLLECTIONS.companyLogos).doc(id).set(logos)
}

/** Converte documento Firestore → objeto Company (sem logos — use getCompanyWithLogos) */
function docToCompany(id: string, data: FirebaseFirestore.DocumentData): Omit<Company, 'logos'> {
  return {
    id,
    name:        data.name        ?? '',
    description: data.description ?? '',
    websiteUrl:  data.websiteUrl  ?? '',
    colors: {
      primary:   data.colors?.primary   ?? '#7b00d4',
      secondary: data.colors?.secondary ?? '#2d0055',
      accent:    data.colors?.accent    ?? '#b388f0',
    },
    aiRules:   data.aiRules   ?? '',
    createdAt: data.createdAt ?? new Date().toISOString(),
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

export async function readCompaniesData(): Promise<CompaniesData> {
  const db = getDb()
  const [snapshot, activeId] = await Promise.all([
    db.collection(COLLECTIONS.companies).get(),   // sem orderBy — evita problema de índice
    getActiveCompanyId(),
  ])

  const companies = await Promise.all(
    snapshot.docs.map(async doc => {
      const logos = await getLogos(doc.id)
      return { ...docToCompany(doc.id, doc.data()), logos } as Company
    })
  )

  return {
    activeCompanyId: activeId || companies[0]?.id || '',
    companies,
  }
}

export async function getActiveCompany(): Promise<Company | null> {
  const db = getDb()
  const activeId = await getActiveCompanyId()

  if (activeId) {
    const snap = await db.collection(COLLECTIONS.companies).doc(activeId).get()
    if (snap.exists) {
      const logos = await getLogos(activeId)
      return { ...docToCompany(snap.id, snap.data()!), logos }
    }
  }

  // Fallback: primeira empresa
  const snap = await db.collection(COLLECTIONS.companies).orderBy('createdAt', 'asc').limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const logos = await getLogos(doc.id)
  return { ...docToCompany(doc.id, doc.data()), logos }
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const db = getDb()
  const snap = await db.collection(COLLECTIONS.companies).doc(id).get()
  if (!snap.exists) return null
  const logos = await getLogos(id)
  return { ...docToCompany(snap.id, snap.data()!), logos }
}

export async function createCompany(partial: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
  const db = getDb()
  const id = generateId()
  const createdAt = new Date().toISOString()

  const { logos, ...rest } = partial
  await Promise.all([
    db.collection(COLLECTIONS.companies).doc(id).set({ ...rest, createdAt }),
    saveLogos(id, logos),
  ])

  // Se for a primeira empresa, define como ativa
  const activeId = await getActiveCompanyId()
  if (!activeId) await setActiveCompanyId(id)

  return { ...partial, id, createdAt }
}

export async function updateCompany(id: string, partial: Partial<Omit<Company, 'id' | 'createdAt'>>): Promise<Company | null> {
  const db = getDb()
  const snap = await db.collection(COLLECTIONS.companies).doc(id).get()
  if (!snap.exists) return null

  const { logos, ...rest } = partial

  const updates: Promise<unknown>[] = []
  if (Object.keys(rest).length > 0) {
    updates.push(db.collection(COLLECTIONS.companies).doc(id).update(rest))
  }
  if (logos) {
    updates.push(saveLogos(id, logos))
  }
  await Promise.all(updates)

  return getCompanyById(id)
}

export async function deleteCompany(id: string): Promise<boolean> {
  const db = getDb()
  const snap = await db.collection(COLLECTIONS.companies).doc(id).get()
  if (!snap.exists) return false

  await Promise.all([
    db.collection(COLLECTIONS.companies).doc(id).delete(),
    db.collection(COLLECTIONS.companyLogos).doc(id).delete(),
  ])

  // Se era a empresa ativa, passa para a próxima
  const activeId = await getActiveCompanyId()
  if (activeId === id) {
    const next = await db.collection(COLLECTIONS.companies).orderBy('createdAt', 'asc').limit(1).get()
    await setActiveCompanyId(next.empty ? '' : next.docs[0].id)
  }

  return true
}

export async function setActiveCompany(id: string): Promise<boolean> {
  const db = getDb()
  const snap = await db.collection(COLLECTIONS.companies).doc(id).get()
  if (!snap.exists) return false
  await setActiveCompanyId(id)
  return true
}
