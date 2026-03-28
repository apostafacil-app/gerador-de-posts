import OpenAI from 'openai'

export async function generateWithOpenAI(apiKey: string, prompt: string): Promise<string> {
  const client = new OpenAI({ apiKey })
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })
  return completion.choices[0].message.content ?? ''
}
