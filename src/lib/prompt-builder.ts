import type { Company, GeneratorFormData } from '@/types'
import { DEFAULT_AI_RULES, getModeAddendum } from './default-rules'

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
Intenção: post denso e estruturado com benefícios claros. Aparência editorial profissional.
━ ALINHAMENTO: estritamente À ESQUERDA — logo, eyebrow, headline, subtexto, benefits, CTA todos flush-left
━ FUNDO OBRIGATÓRIO: DEEP_GRADIENT (gradiente escuro e texturizado da marca) — NUNCA MESH_GLOW
━ CTA: botão full-width SOLID_GRADIENT — NUNCA pill centralizado
Sequência no .safe (top→bottom):
  logo-row (flush left) → eyebrow pill (align-self:flex-start) → h1 (88px, 900, 3 linhas, à esquerda)
  → subtexto (30px, 2 linhas) → divisor gradiente horizontal → 3 benefícios verticais
  → spacer → CTA full-width → slogan
Cada benefício: ícone 72×72px bg glass + título 28px 800 + desc 21px 500 — todos left-aligned
Resultado esperado: post denso, informativo, com hierarquia clara de cima a baixo`,
  },
  {
    id: 'A', name: 'HERO_STATEMENT',
    instruction: `ARQUÉTIPO A — HERO STATEMENT
Intenção: uma headline gigante no centro. Tudo o mais é secundário. Máximo impacto, mínimo de ruído.
━ ALINHAMENTO: TUDO CENTRALIZADO — text-align:center em todo o .safe, logo centralizada, headline centralizada
━ FUNDO OBRIGATÓRIO: MESH_GLOW (fundo quase preto #060010 com glow radial vibrante atrás da headline) — NUNCA DEEP_GRADIENT
━ CTA: PILL_BUTTON centralizado (border-radius:100px, max-width:700px, margin:0 auto) — NUNCA botão full-width
Sequência no .safe:
  logo centralizada (height:100px, display:block, margin:0 auto)
  → headline oversized (140-160px, 900, MÁXIMO 3 linhas, 1-2 palavras/linha, text-align:center)
  → subtexto curto (1 linha, 30px, text-align:center)
  → spacer
  → CTA pill centralizado → slogan centralizado
Elemento obrigatório: palavra fantasma position:absolute (280px, opacity:0.05, cor destaque) atrás da headline
⛔ PROIBIDO: lista de benefícios, eyebrow pill, headline abaixo de 120px, qualquer elemento à esquerda
Resultado esperado: post minimalista, headline domina 50-60% do canvas, muito espaço negativo`,
  },
  {
    id: 'D', name: 'LISTA_STEPS',
    instruction: `ARQUÉTIPO D — LISTA STEPS
Intenção: passos numerados educam o leitor. Os números grandes são o elemento visual dominante.
━ ALINHAMENTO: À ESQUERDA
━ FUNDO OBRIGATÓRIO: RICH_DARK (quase preto, contraste máximo para os números)
━ CTA: apenas slogan; botão só se tom "urgente"
Sequência no .safe: logo-row → eyebrow → h1 (76px, 2 linhas) → 4 steps numerados → spacer → slogan
Cada step (display:flex, align-items:flex-start, gap:24px):
  número (48px, 900, cor destaque, min-width:52px) + título (26px, 800) + desc (20px, 500, 2 linhas)
  separador sutil border-bottom 1px rgba(destaque, 0.15) exceto o último
⛔ PROIBIDO: ícones emoji nos steps (os números SÃO os ícones)`,
  },
  {
    id: 'F', name: 'QUOTE_CARD',
    instruction: `ARQUÉTIPO F — QUOTE CARD
Intenção: frase de impacto ou depoimento no centro. Espaço negativo = elegância.
━ ALINHAMENTO: CENTRALIZADO — tudo centralizado, frase com text-align:center
━ FUNDO OBRIGATÓRIO: MESH_GLOW — a frase flutua sobre o escuro
Sequência no .safe:
  logo pequena centralizada (height:90px, margin:0 auto)
  → bloco central flex:1 com aspas decorativas (240px, opacity:0.15, position:absolute, top-left) + frase (46-52px, 700, 2-3 linhas, centralizada) + linha colorida 80px×4px + atribuição centralizada
  → spacer → CTA ou slogan centralizado
⛔ PROIBIDO: lista de benefícios, eyebrow pill, qualquer elemento à esquerda`,
  },
  {
    id: 'C', name: 'STAT_CARD',
    instruction: `ARQUÉTIPO C — STAT CARD
Intenção: um número real e impactante domina visualmente o canvas como âncora.
━ ALINHAMENTO: CENTRALIZADO
━ FUNDO OBRIGATÓRIO: DEEP_GRADIENT — o número flutua sobre o gradiente profundo
Sequência no .safe: logo centralizada (110px) → número gigante (200-240px, 900, cor destaque, letter-spacing:-8px) → label do stat (30px) → subtexto (1 linha) → divisor → 2 cards horizontais → spacer → CTA centralizado
⛔ Só usar se o assunto contiver número real. Caso contrário: usar Arquétipo B.`,
  },
  {
    id: 'E', name: 'SPLIT_LAYOUT',
    instruction: `ARQUÉTIPO E — SPLIT LAYOUT
Intenção: contraste visual direto entre problema (esquerda) e solução (direita).
━ FUNDO: o split é o fundo — metade escuro, metade cor destaque vibrante
Implementação: 2 divs absolutos side-by-side (45% escuro + 55% destaque) + clip-path diagonal.
Logo centralizada no topo (z-index:10). Headline cruzando ambos os lados (position:absolute, centralizada, 68-80px).
Labels "ANTES/SEM" à esquerda + "DEPOIS/COM" à direita. CTA full-width na base.
⛔ PROIBIDO: lista de benefícios, eyebrow pill, fundo decorativo adicional`,
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
// bgDark / bgLight: índice ESPECÍFICO por arquétipo — nunca ciclico.
// Garante que o fundo seja compatível com o layout do arquétipo.
const VARIATION_SLOTS = [
  { archetypeIdx: 0, decorationIdx: 0, ctaIdx: 0, bgDark: 0, bgLight: 0 }, // B Editorial + DEEP_GRADIENT  / CLEAN_WHITE
  { archetypeIdx: 1, decorationIdx: 1, ctaIdx: 1, bgDark: 1, bgLight: 3 }, // A Hero      + MESH_GLOW      / GRADIENT_FADE
  { archetypeIdx: 2, decorationIdx: 2, ctaIdx: 2, bgDark: 3, bgLight: 1 }, // D Steps     + RICH_DARK      / SOFT_TINT
  { archetypeIdx: 3, decorationIdx: 4, ctaIdx: 3, bgDark: 1, bgLight: 3 }, // F Quote     + MESH_GLOW      / GRADIENT_FADE
  { archetypeIdx: 4, decorationIdx: 3, ctaIdx: 4, bgDark: 0, bgLight: 0 }, // C Stat      + DEEP_GRADIENT  / CLEAN_WHITE
  { archetypeIdx: 5, decorationIdx: 6, ctaIdx: 0, bgDark: 2, bgLight: 1 }, // E Split     + SPLIT_DARK     / SOFT_TINT
]

function pickStyles(variationIndex: number, _totalVariations: number, theme: string) {
  const slot = VARIATION_SLOTS[variationIndex % VARIATION_SLOTS.length]
  const bgArr = theme === 'dark' ? BG_STYLES_DARK : BG_STYLES_LIGHT
  return {
    archetype: ARCHETYPES[slot.archetypeIdx],
    decoration: DECORATIONS[slot.decorationIdx],
    cta: CTA_STYLES[slot.ctaIdx],
    bg: bgArr[theme === 'dark' ? slot.bgDark : slot.bgLight],
  }
}

export function buildPrompt(
  company: Company,
  form: GeneratorFormData,
  websiteContext?: string,
  baseRules?: string,
  modeAddendum?: string
): string {
  // Semente visual aleatória — força a IA a tomar decisões criativas diferentes a cada geração
  const visualSeed = Math.floor(Math.random() * 9000) + 1000

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

  const resolvedBase = baseRules || DEFAULT_AI_RULES
  const resolvedAddendum = modeAddendum || getModeAddendum(form.format, form.theme)

  return `${resolvedBase}

${resolvedAddendum}

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

🎲 SEMENTE VISUAL: ${visualSeed}
  Use este número para variar detalhes criativos: posição do elemento decorativo, número exato de linhas
  na headline, tom do copy, emoji escolhido nos ícones, texto do slogan. Nunca repita os mesmos detalhes
  de uma geração anterior — esta semente garante unicidade.

⚠️ REGRAS ABSOLUTAS:
❌ PROIBIDO usar o mesmo arquétipo em duas variações.
❌ PROIBIDO ignorar a estrutura do arquétipo e criar layout livre.
❌ PROIBIDO misturar alinhamentos: se o arquétipo é CENTRALIZADO, tudo centralizado; se À ESQUERDA, tudo à esquerda.
❌ PROIBIDO inventar números, percentuais ou estatísticas (ex: "93% do tempo", "12 horas", "1.875x").
   → Se o assunto não tiver dado numérico real, use afirmações qualitativas.
❌ PROIBIDO adicionar urgência falsa ("Últimas horas", "Apenas hoje") se o assunto não mencionar isso.
   → Tom urgente só se o parâmetro "Tom emocional" for "Urgente".
✅ Copy diferente + arquétipo diferente + decoração diferente = variações realmente distintas.

---
## INSTRUÇÃO FINAL

**CTA (botão de ação):**
${form.showCta === false
  ? '⛔ CTA DESATIVADO pelo usuário: NÃO incluir botão CTA em NENHUMA variação. Usar apenas slogan no rodapé. Ignorar qualquer instrução de arquétipo que diga CTA obrigatório.'
  : `- Tom "urgente" ou "exclusivo" → CTA botão obrigatório
- Tom "empolgante" ou "confiável" → CTA ou só slogan (escolha o que for mais elegante)
- Post educativo/informativo → apenas slogan rodapé, sem botão
- Nunca force um CTA que deixe o post esmagado ou corte elementos`
}

**Espaço e respiração:**
- Prefira MENOS elementos bem espaçados a MAIS elementos apertados
- Se o conteúdo não couber com elegância → corte um benefício, encurte o subtexto
- O slogan rodapé é sempre presente. O CTA botão é condicional.

Gere EXATAMENTE ${form.variations} variação(ões) de HTML.
Cada variação usa os tokens visuais definidos acima — copy, layout e estilo visual DIFERENTES entre si.
Separe cada variação com os marcadores exatos:
<!-- VARIACAO_START -->
[HTML completo aqui]
<!-- VARIACAO_END -->
${captionInstruction}

Retorne APENAS os blocos HTML (e legendas se solicitado) com os marcadores. Sem explicações, sem markdown, sem \`\`\`html.`
}
