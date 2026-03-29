import fs from 'fs'
import path from 'path'
import type { Company, CompaniesData } from '@/types'
import { getDefaultSettings } from './storage'

const COMPANIES_FILE = path.join(process.cwd(), 'data', 'companies.json')
const LEGACY_SETTINGS_FILE = path.join(process.cwd(), 'data', 'app-settings.json')

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function getDefaultCompany(): Company {
  const s = getDefaultSettings()
  // Try to migrate from legacy app-settings.json
  try {
    if (fs.existsSync(LEGACY_SETTINGS_FILE)) {
      const legacy = JSON.parse(fs.readFileSync(LEGACY_SETTINGS_FILE, 'utf-8'))
      return {
        id: 'default',
        name: legacy.company?.name || s.company.name || 'Minha Empresa',
        description: legacy.company?.description || s.company.description || '',
        websiteUrl: legacy.company?.websiteUrl || s.company.websiteUrl || '',
        colors: { ...s.colors, ...(legacy.colors || {}) },
        logos: { ...s.logos, ...(legacy.logos || {}) },
        aiRules: legacy.aiRules || s.aiRules,
        createdAt: new Date().toISOString(),
      }
    }
  } catch {}
  return {
    id: 'default',
    name: s.company.name || 'Minha Empresa',
    description: s.company.description || '',
    websiteUrl: s.company.websiteUrl || '',
    colors: s.colors,
    logos: s.logos,
    aiRules: s.aiRules,
    createdAt: new Date().toISOString(),
  }
}

export function readCompaniesData(): CompaniesData {
  try {
    if (fs.existsSync(COMPANIES_FILE)) {
      return JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf-8')) as CompaniesData
    }
  } catch {}
  const defaultCompany = getDefaultCompany()
  return {
    activeCompanyId: defaultCompany.id,
    companies: [defaultCompany],
  }
}

export function writeCompaniesData(data: CompaniesData): void {
  const dir = path.dirname(COMPANIES_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(COMPANIES_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export function getActiveCompany(): Company | null {
  const data = readCompaniesData()
  return (
    data.companies.find(c => c.id === data.activeCompanyId) ??
    data.companies[0] ??
    null
  )
}

export function createCompany(partial: Omit<Company, 'id' | 'createdAt'>): Company {
  const company: Company = { ...partial, id: generateId(), createdAt: new Date().toISOString() }
  const data = readCompaniesData()
  data.companies.push(company)
  writeCompaniesData(data)
  return company
}

export function updateCompany(id: string, partial: Partial<Omit<Company, 'id' | 'createdAt'>>): Company | null {
  const data = readCompaniesData()
  const idx = data.companies.findIndex(c => c.id === id)
  if (idx === -1) return null
  data.companies[idx] = { ...data.companies[idx], ...partial }
  writeCompaniesData(data)
  return data.companies[idx]
}

export function deleteCompany(id: string): boolean {
  const data = readCompaniesData()
  const idx = data.companies.findIndex(c => c.id === id)
  if (idx === -1) return false
  data.companies.splice(idx, 1)
  if (data.activeCompanyId === id) {
    data.activeCompanyId = data.companies[0]?.id ?? ''
  }
  writeCompaniesData(data)
  return true
}

export function setActiveCompany(id: string): boolean {
  const data = readCompaniesData()
  if (!data.companies.find(c => c.id === id)) return false
  data.activeCompanyId = id
  writeCompaniesData(data)
  return true
}
