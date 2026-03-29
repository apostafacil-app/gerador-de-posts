import type { Company, GeneratorFormData } from '@/types'
import { DEFAULT_AI_RULES } from './default-rules'

/**
 * Placeholder usado no prompt para a logo.
 * O base64 real é injetado APÓS a IA retornar o HTML,
 * evitando enviar centenas de milhares de tokens desnecessários.
 */
export const LOGO_PLACEHOLDER = '__LOGO_BASE64_PLACEHOLDER__'

/** Retorna o base64 correto da logo conforme o tema */
export function getLogoForTheme(company: Company, theme: 'dark' | 'white'): string {
  return theme === 'dark' ? company.logos.darkBackground : company.logos.whiteBackground
}

/** Injeta o base64 real no HTML retornado pela IA */
export function injectLogo(html: string, logoBase64: string): string {
  return html.replaceAll(LOGO_PLACEHOLDER, logoBase64)
}

const writingStyleLabel: Record<string, string> = {
  direto: 'Direto (headline objetiva, zero rodeios)',
  educativo: 'Educativo (problema→solução, dados em destaque, autoridade)',
  provocativo: 'Provocativo (pergunta chocante, desafia o status quo)',
  empatico: 'Empático (reconhece dor do cliente, linguagem próxima)',
}

const emotionalToneLabel: Record<string, string> = {
  urgente: 'Urgente (temporalidade explícita, "Apenas hoje" / "Últimas vagas")',
  empolgante: 'Empolgante (exclamações, energia visual, dinamismo)',
  exclusivo: 'Exclusivo (seleção criteriosa, premium, diferenciado)',
  confiavel: 'Confiável (estatísticas, experiência, tom sóbrio e profissional)',
}

const persuasionLabel: Record<string, string> = {
  beneficio_direto: 'Benefício direto (headline = benefício + lista de 2-3 secundários)',
  escassez: 'Escassez (vagas/unidades limitadas visualmente destacadas)',
  curiosidade: 'Curiosidade (cliffhanger, promessa de revelação no CTA)',
  prova_social: 'Prova social (número de clientes, resultados, depoimento curto)',
}

// Tokens visuais para garantir diversidade entre variações
const CTA_STYLES = [
  'SOLID_GRADIENT: botão full-width, background:linear-gradient(135deg,[secundária],[destaque]), border-radius:22px, padding:40px 60px, box-shadow:0 12px 50px rgba(0,0,0,0.3)',
  'PILL_BUTTON: botão em pílula centralizado, border-radius:100px, padding:32px 72px, background:linear-gradient(90deg,[primária],[destaque]), max-width:700px, margin:0 auto, display:block',
  'OUTLINED_BUTTON: botão full-width, background:transparent, border:3px solid [destaque], color:[destaque] (tema claro) ou #fff (tema escuro), border-radius:20px, padding:36px 60px, font-weight:800',
  'GLASS_BUTTON: botão full-width, background:rgba(255,255,255,0.12), backdrop-filter:blur(12px), border:1.5px solid rgba(255,255,255,0.25), border-radius:22px, padding:38px 60px, color:#fff',
  'SPLIT_CTA: dois elementos em flex-row — bloco de texto à esquerda ("Pronto para começar?") + botão quadrado à direita (100px, gradiente, ícone →), align-items:center, gap:24px',
]

const BG_STYLES_DARK = [
  'DEEP_GRADIENT: background:linear-gradient(135deg,[secundária] 0%,[primária] 50%,#050010 100%) — gradiente profundo em 3 stops',
  'MESH_GLOW: fundo quase preto (#060010) + dois círculos de luz posicionados: um atrás da headline (cor destaque 20% opacity) e um no canto inferior oposto (cor primária 10% opacity)',
  'SPLIT_DARK_LIGHT: top 45% com gradiente escuro da marca, bottom 55% com #f8f8ff (branco azulado) — divisória diagonal (clip-path:polygon(0 0,100% 0,100% 85%,0 100%))',
  'RICH_DARK: fundo #0a0018 sólido + textura de linhas diagonais tênues (SVG repeating-linear-gradient 45deg, opacity 0.03) + orbe de luz roxo atrás do CTA',
]

const BG_STYLES_LIGHT = [
  'CLEAN_WHITE: fundo #ffffff puro com círculo decorativo neutro no canto superior direito',
  'SOFT_TINT: fundo muito claro da cor primária (~5% opacity) — ex: se primária #7b00d4, fundo #f9f0ff',
  'CARD_SPLIT: fundo branco com faixa colorida no topo (height:320px, gradiente da marca) e conteúdo sobreposto em card branco com border-radius e sombra',
  'GRADIENT_FADE: fundo linear-gradient(180deg, [primária com 8%] 0%, #ffffff 40%) — degrade suave de cima para baixo',
]

const BENEFITS_STYLES = [
  'ICON_LEFT: flex-direction:column, cada item display:flex + ícone-card 72px à esquerda + título/descrição à direita (layout padrão V1)',
  'CARD_ROW: flex-direction:row, 3 cards lado a lado (flex:1), cada card com ícone no topo, título e descrição (layout V2)',
  'NUMBERED: flex-direction:column, cada item com número grande (88px, font-weight:900, cor destaque, opacity:0.3) flutuando à esquerda + título/descrição à direita',
]

function pickStyles(variationIndex: number, totalVariations: number, theme: string) {
  // Distribui os estilos ciclicamente para garantir variedade
  const ctaIdx = variationIndex % CTA_STYLES.length
  const bgIdx = variationIndex % (theme === 'dark' ? BG_STYLES_DARK.length : BG_STYLES_LIGHT.length)
  const benefitsIdx = variationIndex % BENEFITS_STYLES.length
  return {
    cta: CTA_STYLES[ctaIdx],
    bg: theme === 'dark' ? BG_STYLES_DARK[bgIdx] : BG_STYLES_LIGHT[bgIdx],
    benefits: BENEFITS_STYLES[benefitsIdx],
    layout: variationIndex % 2 === 0 ? 'LEFT_ALIGNED (align-items:flex-start, text-align:left)' : 'CENTERED (align-items:center, text-align:center)',
  }
}

export function buildPrompt(company: Company, form: GeneratorFormData, websiteContext?: string, systemRules?: string): string {
  const dimensions = form.format === 'post' ? '1080x1350px' : '1080x1920px'
  const [width, height] = form.format === 'post' ? [1080, 1350] : [1080, 1920]
  const hasLogo = Boolean(getLogoForTheme(company, form.theme))

  const logoInstruction = hasLogo
    ? `Logo fornecida — usar exatamente src="${LOGO_PLACEHOLDER}" na tag <img alt="${company.name || 'Logo'}"> (❌ NUNCA gere URL ou base64 diferente — use literalmente: ${LOGO_PLACEHOLDER})`
    : `Logo NÃO fornecida — exibir o nome "${company.name || 'Empresa'}" em tipografia estilizada`

  const websiteSection = websiteContext
    ? `\n---\n## CONTEÚDO DO SITE DA EMPRESA\n\n${websiteContext}\n`
    : ''

  const captionInstruction = form.generateCaption
    ? `\nApós os blocos HTML, gere também ${form.variations} legenda(s) para Instagram.
Cada legenda deve ter:
- 3-5 linhas de texto persuasivo relacionado ao post
- 5 hashtags relevantes ao nicho da empresa
- Tom consistente com o estilo do post
Separe cada legenda com os marcadores:
<!-- CAPTION_START -->
[texto da legenda aqui]

#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
<!-- CAPTION_END -->`
    : ''

  // Gera especificação visual única por variação
  const variationSpecs = Array.from({ length: form.variations }, (_, i) => {
    const styles = pickStyles(i, form.variations, form.theme)
    return `  Variação ${i + 1}:
    • CTA_STYLE: ${styles.cta}
    • BG_STYLE: ${styles.bg}
    • BENEFITS_STYLE: ${styles.benefits}
    • LAYOUT: ${styles.layout}`
  }).join('\n')

  const rules = systemRules || DEFAULT_AI_RULES

  return `${rules}

---
## DADOS DA EMPRESA

Nome: ${company.name || '(não informado)'}
Descrição: ${company.description || '(não informado)'}
Website: ${company.websiteUrl || '(não informado)'}
Cor primária: ${company.colors.primary}
Cor secundária: ${company.colors.secondary}
Cor de destaque: ${company.colors.accent}
${logoInstruction}
${websiteSection}
---
## PARÂMETROS DO POST

Dimensão exata: ${dimensions} (body: width:${width}px; height:${height}px; overflow:hidden)
Tema: ${form.theme === 'dark' ? 'Escuro — usar gradiente com as cores da empresa' : 'Claro — fundo branco, texto escuro, destaques coloridos'}
Assunto do post: ${form.subject}
Estilo de escrita: ${writingStyleLabel[form.writingStyle] ?? 'direto'}
Tom emocional: ${emotionalToneLabel[form.emotionalTone] ?? 'empolgante'}
Técnica de persuasão: ${persuasionLabel[form.persuasionTechnique] ?? 'beneficio_direto'}
Usar imagem/arte visual: ${form.useImage ? `Sim — estilo desejado: ${form.imageStyle || 'premium, abstrato geométrico'}` : 'Não — usar apenas tipografia e gradientes'}

---
## TOKENS VISUAIS — OBRIGATÓRIO (cada variação TEM que usar o seu token)

${variationSpecs}

⚠️ Os tokens acima são OBRIGATÓRIOS. Implementar fielmente o CTA_STYLE, BG_STYLE e BENEFITS_STYLE indicados para cada variação.
Não usar o mesmo estilo de CTA ou fundo em duas variações diferentes.

---
## INSTRUÇÃO FINAL

Gere EXATAMENTE ${form.variations} variação(ões) de HTML.
Cada variação usa os tokens visuais definidos acima — copy, layout e estilo visual DIFERENTES entre si.
Separe cada variação com os marcadores exatos:
<!-- VARIACAO_START -->
[HTML completo aqui]
<!-- VARIACAO_END -->
${captionInstruction}

Retorne APENAS os blocos HTML (e legendas se solicitado) com os marcadores. Sem explicações, sem markdown, sem \`\`\`html.`
}
