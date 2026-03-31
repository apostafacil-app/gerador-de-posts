import { NextRequest, NextResponse } from 'next/server'
import { getDb, COLLECTIONS } from '@/lib/firebase'
import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore'
import type { PostFormat, PostTheme } from '@/types'

const MAX_ENTRIES_PER_COMPANY = 50
const RETENTION_DAYS = 30

interface HistoryDoc {
  companyId: string
  subject: string
  format: PostFormat
  theme: PostTheme
  variations: string[]
  captions?: string[]
  createdAt: Timestamp
  expiresAt: Timestamp
}

// ── GET /api/history?companyId=X ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get('companyId')
  if (!companyId) {
    return NextResponse.json({ error: 'companyId obrigatório' }, { status: 400 })
  }

  try {
    const db = getDb()
    const now = Timestamp.now()

    const snap = await db
      .collection(COLLECTIONS.history)
      .where('companyId', '==', companyId)
      .where('expiresAt', '>', now)
      .orderBy('expiresAt', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(MAX_ENTRIES_PER_COMPANY)
      .get()

    const entries = snap.docs.map((doc: QueryDocumentSnapshot) => {
      const d = doc.data() as HistoryDoc
      return {
        id: doc.id,
        companyId: d.companyId,
        subject: d.subject,
        format: d.format,
        theme: d.theme,
        variations: d.variations,
        captions: d.captions,
        createdAt: d.createdAt.toDate().toISOString(),
        expiresAt: d.expiresAt.toDate().toISOString(),
      }
    })

    return NextResponse.json({ entries })
  } catch (err) {
    console.error('[GET /api/history]', err)
    return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
  }
}

// ── POST /api/history ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { companyId, subject, format, theme, variations, captions } = body as Partial<HistoryDoc> & { companyId?: string }

  if (!companyId || !subject || !format || !theme || !Array.isArray(variations)) {
    return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
  }

  try {
    const db = getDb()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000)

    const doc: HistoryDoc = {
      companyId,
      subject,
      format,
      theme,
      variations,
      ...(captions ? { captions } : {}),
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
    }

    await db.collection(COLLECTIONS.history).add(doc)

    // Cleanup: remove excess entries beyond the limit (oldest first)
    const allSnap = await db
      .collection(COLLECTIONS.history)
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'asc')
      .get()

    if (allSnap.size > MAX_ENTRIES_PER_COMPANY) {
      const toDelete = allSnap.docs.slice(0, allSnap.size - MAX_ENTRIES_PER_COMPANY)
      const batch = db.batch()
      toDelete.forEach((d: QueryDocumentSnapshot) => batch.delete(d.ref))
      await batch.commit()
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/history]', err)
    return NextResponse.json({ error: 'Erro ao salvar histórico' }, { status: 500 })
  }
}

// ── DELETE /api/history?id=X  ou  ?companyId=X&all=true ──────────────────────
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const companyId = req.nextUrl.searchParams.get('companyId')
  const all = req.nextUrl.searchParams.get('all')

  try {
    const db = getDb()

    if (id) {
      // Delete single entry
      await db.collection(COLLECTIONS.history).doc(id).delete()
      return NextResponse.json({ ok: true })
    }

    if (companyId && all === 'true') {
      // Delete all entries for this company
      const snap = await db
        .collection(COLLECTIONS.history)
        .where('companyId', '==', companyId)
        .get()
      const batch = db.batch()
      snap.docs.forEach((d: QueryDocumentSnapshot) => batch.delete(d.ref))
      await batch.commit()
      return NextResponse.json({ ok: true, deleted: snap.size })
    }

    return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
  } catch (err) {
    console.error('[DELETE /api/history]', err)
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 })
  }
}
