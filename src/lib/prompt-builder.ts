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

// ─── ARQUÉTIPOS ────────────────────────────────────────────────────────────────
// Cada arquétipo tem estrutura detalhada obrigatória.
// A rotação garante que variações nunca compartilhem o mesmo arquétipo.

const ARCHETYPES = [
  {
    id: 'B', name: 'EDITORIAL',
    instruction: `ARQUÉTIPO B — EDITORIAL
Estrutura obrigatória no .safe:
  logo-row (height:160px) → eyebrow pill → h1 (88px, 3 linhas, máx 18 chars/linha) → subtexto (2 linhas, 30px) → divisor gradiente → 3 benefícios VERTICAIS (icon-card 72px à esquerda, título 28px, desc 21px) → spacer → cta-wrap
Layout: LEFT_ALIGNED (align-items:flex-start; text-align:left)`,
  },
  {
    id: 'A', name: 'HERO_STATEMENT',
    instruction: `ARQUÉTIPO A — HERO STATEMENT
Estrutura obrigatória no .safe:
  logo-row (height:160px) → h1 OVERSIZED (120-160px, máx 3 linhas, 1-2 palavras por linha) → subtexto CURTO (1 linha, 30px) → spacer → cta-wrap
SEM eyebrow. SEM benefícios. SEM divisor. A headline É o conteúdo.
Layout: CENTERED (align-items:center; text-align:center)`,
  },
  {
    id: 'D', name: 'LISTA_STEPS',
    instruction: `ARQUÉTIPO D — LISTA STEPS
Estrutura obrigatória no .safe:
  logo-row (height:160px) → eyebrow pill → h1 (88px, 3 linhas) → .steps-list (3 passos: número 48px destaque + título 26px + desc 20px, gap:32px, separador entre passos) → spacer → cta-wrap
SEM benefícios com ícone-card. Os números SÃO os ícones visuais.
Layout: LEFT_ALIGNED`,
  },
  {
    id: 'F', name: 'QUOTE_CARD',
    instruction: `ARQUÉTIPO F — QUOTE CARD
Estrutura obrigatória no .safe:
  logo-row PEQUENA (height:100px) → .quote-wrap (flex:1, justify-content:center) com aspas decorativas 200px opacity:0.15 + frase 42px máx 3 linhas + atribuição 22px → spacer → cta-wrap
SEM benefícios. SEM eyebrow. A frase é o elemento âncora.
Layout: CENTERED`,
  },
  {
    id: 'C', name: 'STAT_CARD',
    instruction: `ARQUÉTIPO C — STAT CARD
Estrutura obrigatória no .safe:
  logo-row (height:120px) → .stat-number (font-size:220px, font-weight:900, cor destaque, line-height:0.85, letter-spacing:-8px) → .stat-label (32px abaixo do número) → subtexto (80px) → divisor → 2 benefícios HORIZONTAIS (flex-row, gap:20px, cards com borda) → spacer → cta-wrap
Se o assunto NÃO tiver dado numérico real: use dado simbólico como "3×" ou "10×" sem inventar — ou troque para Arquétipo B.
Layout: CENTERED`,
  },
  {
    id: 'E', name: 'SPLIT_LAYOUT',
    instruction: `ARQUÉTIPO E — SPLIT LAYOUT
Implementação: dois divs absolutos (left:0/right:0) dividindo o canvas verticalmente.
  Lado esquerdo (width:46%, problema): fundo escuro da marca + label "ANTES" ou "SEM [produto]" + ícone negativo
  Lado direito (width:54%, solução): fundo cor destaque vibrante + label "DEPOIS" ou "COM [produto]" + ícone positivo
  Headline: position:absolute, z-index:10, centralizada no canvas cruzando os dois lados, font-size:72px
  Logo: topo centralizada, z-index:10
  CTA: abaixo do split, posição absolute bottom:60px, largura total
SEM lista de benefícios convencional. O split É o conteúdo.`,
  },
]

// ─── DECORAÇÕES DE FUNDO ───────────────────────────────────────────────────────
const DECORATIONS = [
  'ORB_CENTRAL: radial-gradient(circle, [destaque 20% opacity] 0%, transparent 70%) centralizado, 800×800px',
  'GRADIENTE_MESH: 3 radial-gradients sobrepostos — ellipse em 20%/20%, 80%/80% e 60%/10% — cores da marca com 8-18% opacity',
  'GRID_PONTILHADO: SVG inline pattern dots, circle r:2.5, spacing:48px, opacity:0.12, cor destaque',
  'DIAGONAL: linear-gradient(135deg, [destaque 8%] → transparent) rotacionado 15deg, posição canto superior direito',
  'ARCO_CANTO: círculo 700×700px no canto superior direito, top:-180px right:-180px, fundo neutro, opacity:0.7',
  'LINHAS_PARALELAS: SVG inline pattern linhas horizontais, height:60px, opacity:0.05, cor destaque',
  'FORMA_GEOMETRICA: retângulo 500×500px, border-radius:40px, rotate(-20deg), bottom:-120px left:-80px, [destaque 7% opacity]',
  'ARCO_INFERIOR: círculo 1100×1100px, bottom:-300px, centralizado, radial-gradient [destaque 18% opacity]',
]

// ─── CTAs ──────────────────────────────────────────────────────────────────────
const CTA_STYLES = [
  'SOLID_GRADIENT: botão full-width, background:linear-gradient(135deg,[secundária],[destaque]), border-radius:22px, padding:40px 60px, box-shadow:0 12px 50px rgba(0,0,0,0.3)',
  'PILL_BUTTON: botão em pílula centralizado, border-radius:100px, padding:32px 72px, background:linear-gradient(90deg,[primária],[destaque]), max-width:700px, margin:0 auto, display:block',
  'OUTLINED_BUTTON: botão full-width, background:transparent, border:3px solid [destaque], color:[destaque] (tema claro) ou #fff (tema escuro), border-radius:20px, padding:36px 60px, font-weight:800',
  'GLASS_BUTTON: botão full-width, background:rgba(255,255,255,0.12), backdrop-filter:blur(12px), border:1.5px solid rgba(255,255,255,0.25), border-radius:22px, padding:38px 60px, color:#fff',
  'SPLIT_CTA: flex-row — texto à esquerda ("Pronto para começar?") + botão quadrado 100px com ícone → à direita, align-items:center, gap:24px',
]

const BG_STYLES_DARK = [
  'DEEP_GRADIENT: linear-gradient(135deg,[secundária] 0%,[primária] 50%,#050010 100%)',
  'MESH_GLOW: fundo #060010 + círculo de luz destaque 20% opacity atrás da headline + círculo primária 10% opacity no canto inferior',
  'SPLIT_DARK_LIGHT: top 45% gradiente escuro da marca, bottom 55% #f8f8ff — divisória clip-path:polygon(0 0,100% 0,100% 85%,0 100%)',
  'RICH_DARK: fundo #0a0018 + SVG repeating-linear-gradient diagonal 45deg opacity:0.03 + orbe roxo atrás do CTA',
]

const BG_STYLES_LIGHT = [
  'CLEAN_WHITE: fundo #ffffff + círculo decorativo neutro canto superior direito',
  'SOFT_TINT: fundo cor primária 5% opacity (ex: primária #7b00d4 → fundo #f9f0ff)',
  'CARD_SPLIT: fundo branco + faixa colorida topo height:320px gradiente da marca + card branco sobreposto com sombra',
  'GRADIENT_FADE: linear-gradient(180deg,[primária 8%] 0%,#ffffff 40%) — degrade suave top→bottom',
]

// ─── CONFIGURAÇÕES POR VARIAÇÃO ────────────────────────────────────────────────
// Cada slot combina arquétipo + decoração que funcionam bem juntos.
// A rotação garante que variações 1 e 2 SEMPRE usem arquétipos diferentes.
const VARIATION_SLOTS = [
  { archetypeIdx: 0, decorationIdx: 0, ctaIdx: 0 }, // B Editorial   + Orb     + SolidGradient
  { archetypeIdx: 1, decorationIdx: 1, ctaIdx: 1 }, // A Hero        + Mesh    + PillButton
  { archetypeIdx: 2, decorationIdx: 2, ctaIdx: 2 }, // D Steps       + Grid    + OutlinedButton
  { archetypeIdx: 3, decorationIdx: 4, ctaIdx: 3 }, // F Quote       + Arco    + GlassButton
  { archetypeIdx: 4, decorationIdx: 3, ctaIdx: 4 }, // C Stat        + Diagonal+ SplitCTA
  { archetypeIdx: 5, decorationIdx: 6, ctaIdx: 0 }, // E Split       + Shape   + SolidGradient
]

function pickStyles(variationIndex: number, _totalVariations: number, theme: string) {
  const slot = VARIATION_SLOTS[variationIndex % VARIATION_SLOTS.length]
  const bgArr = theme === 'dark' ? BG_STYLES_DARK : BG_STYLES_LIGHT
  return {
    archetype: ARCHETYPES[slot.archetypeIdx],
    decoration: DECORATIONS[slot.decorationIdx],
    cta: CTA_STYLES[slot.ctaIdx],
    bg: bgArr[slot.archetypeIdx % bgArr.length],
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

  // Gera especificação visual única e OBRIGATÓRIA por variação
  const variationSpecs = Array.from({ length: form.variations }, (_, i) => {
    const styles = pickStyles(i, form.variations, form.theme)
    return `━━ VARIAÇÃO ${i + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🏗  ARQUÉTIPO OBRIGATÓRIO → ${styles.archetype.id} — ${styles.archetype.name}
${styles.archetype.instruction}
  🎨  FUNDO BASE → ${styles.bg}
  ✨  DECORAÇÃO OBRIGATÓRIA → ${styles.decoration}
  🔘  CTA OBRIGATÓRIO → ${styles.cta}`
  }).join('\n\n')

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
## ESPECIFICAÇÃO VISUAL POR VARIAÇÃO — SEGUIR À RISCA

Cada variação tem arquétipo, decoração e CTA pré-definidos. NUNCA trocar ou misturar entre variações.

${variationSpecs}

⚠️ REGRA ABSOLUTA: cada variação DEVE implementar exatamente o arquétipo designado.
❌ PROIBIDO usar Arquétipo B em duas variações.
❌ PROIBIDO ignorar a estrutura do arquétipo e criar layout livre.
✅ Copy diferente + arquétipo diferente + decoração diferente = variações realmente distintas.

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
