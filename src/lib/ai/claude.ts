import Anthropic from '@anthropic-ai/sdk'

export async function generateWithClaude(apiKey: string, prompt: string): Promise<string> {
  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })
  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Claude retornou conteúdo não-texto')
  return block.text
}
