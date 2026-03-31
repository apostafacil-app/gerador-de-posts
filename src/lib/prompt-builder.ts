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
Intenção: post informativo com benefícios claros. Hierarquia editorial limpa.
Sequência no .safe (top→bottom): logo → eyebrow pill → headline 3 linhas (76-88px) → subtexto 1-2 linhas (28px) → divisor gradiente → 2 ou 3 benefícios verticais (ícone 64px + título + desc) → spacer → [CTA se conversão] → slogan
Layout: alinhado à esquerda.
Regra de espaço: se 3 benefícios, use fonte 24px/18px. Se 2 benefícios, use 28px/21px.
CTA: obrigatório apenas se o tom for "urgente" ou "exclusivo". Caso contrário: só slogan.`,
  },
  {
    id: 'A', name: 'HERO_STATEMENT',
    instruction: `ARQUÉTIPO A — HERO STATEMENT
Intenção: impacto máximo com mínimo de elementos. A headline gigante É o post.
Sequência no .safe: logo pequena (100px) → headline oversized (120-150px, 2-3 linhas, 1-3 palavras/linha) → subtexto curto (1 linha, 30px) → spacer → slogan ou CTA pill
Layout: centralizado.
Criatividade: adicione elemento tipográfico fantasma atrás da headline (palavra em 280px, opacity:0.05-0.07, cor destaque) para profundidade.
CTA: pill centralizado pequeno — ou apenas slogan. Nunca botão full-width aqui.`,
  },
  {
    id: 'D', name: 'LISTA_STEPS',
    instruction: `ARQUÉTIPO D — LISTA STEPS
Intenção: educar o leitor com passos claros. Os números grandes são o elemento visual.
Sequência no .safe: logo → eyebrow → headline 2-3 linhas (76px) → 3 steps numerados → spacer → slogan ou CTA
Cada step: número em 48px cor destaque + título em 26px bold + descrição em 20px (máx 2 linhas).
Separador sutil entre steps (border-bottom 1px destaque 15% opacity).
Cores texto: SEMPRE escuro no tema claro (#0f0f1a / #4a4a6a). NUNCA branco em fundo branco.
CTA: opcional. Posts educativos funcionam bem só com slogan.`,
  },
  {
    id: 'F', name: 'QUOTE_CARD',
    instruction: `ARQUÉTIPO F — QUOTE CARD
Intenção: prova social ou frase de impacto. As aspas gigantes criam drama visual.
Sequência no .safe: logo pequena (90px) → bloco central (flex:1) com aspas decorativas + frase + atribuição → spacer → CTA ou slogan
Aspas decorativas: div/span com conteúdo " (aspas) em 240-280px, font-weight:900, cor destaque vibrante, opacity:0.15-0.20, position:absolute top-left.
Frase principal: 46-56px, font-weight:800, máx 3 linhas, z-index:1 acima das aspas.
Linha divisora colorida (4px, 80px largura) entre frase e atribuição.
Atribuição: nome em 26px bold destaque + cargo/contexto em 20px suporte.
Layout: centralizado. Muito espaço negativo = elegância.`,
  },
  {
    id: 'C', name: 'STAT_CARD',
    instruction: `ARQUÉTIPO C — STAT CARD
Intenção: um dado numérico impactante domina o canvas como âncora visual.
Sequência no .safe: logo (110px) → número/stat gigante (200-240px, cor destaque, letter-spacing:-8px) → label do stat (30px) → subtexto (1 linha, 28px) → divisor → 2 cards horizontais com dados de apoio → spacer → CTA
Só use se o assunto do post contiver número real. Se não tiver: troque por Arquétipo B.
Layout: centralizado.`,
  },
  {
    id: 'E', name: 'SPLIT_LAYOUT',
    instruction: `ARQUÉTIPO E — SPLIT LAYOUT
Intenção: contraste visual direto entre problema e solução (antes/depois).
Implementação: canvas dividido ao meio — lado esquerdo (problema, fundo escuro/neutro) e lado direito (solução, fundo cor destaque vibrante).
Logo centralizada no topo (z-index alto). Headline grande cruzando ambos os lados (position:absolute, centralizada, font-size:68-80px). Labels "ANTES/DEPOIS" ou "SEM/COM" em cada lado. CTA full-width na base.
Nenhuma lista de benefícios — o split visual É o argumento.`,
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

⚠️ REGRAS ABSOLUTAS:
❌ PROIBIDO usar o mesmo arquétipo em duas variações.
❌ PROIBIDO ignorar a estrutura do arquétipo e criar layout livre.
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
