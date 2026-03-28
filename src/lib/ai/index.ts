import type { AIProvider } from '@/types'
import { generateWithClaude } from './claude'
import { generateWithOpenAI } from './openai'
import { generateWithGemini } from './gemini'

export async function generateWithAI(
  provider: AIProvider,
  apiKey: string,
  prompt: string
): Promise<string> {
  switch (provider) {
    case 'claude':
      return generateWithClaude(apiKey, prompt)
    case 'openai':
      return generateWithOpenAI(apiKey, prompt)
    case 'gemini':
      return generateWithGemini(apiKey, prompt)
    default:
      throw new Error(`Provider desconhecido: ${provider}`)
  }
}
