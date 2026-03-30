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
  logo-row (height:140px) → h1 OVERSIZED → subtexto CURTO (1 linha, 32px) → spacer → cta-wrap
SEM eyebrow. SEM benefícios. SEM divisor. A headline É o conteúdo visual dominante.
Layout: CENTERED (align-items:center; text-align:center)

HEADLINE OVERSIZED — detalhamento obrigatório:
  font-size: 130-160px; font-weight:900; line-height:0.92; letter-spacing:-4px;
  máx 3 linhas, 1-2 palavras por linha;
  Linha 1: cor texto principal (branca no dark, #0f0f1a no claro);
  Linha 2: cor destaque VIBRANTE (nunca escura — deve contrastar com o fundo);
  Linha 3: cor texto principal;
  A headline deve ocupar ~55% da altura útil do canvas.

IMPACTO VISUAL obrigatório:
  → Adicionar elemento decorativo de ALTO CONTRASTE atrás da headline:
    palavra ou letra inicial em font-size:300px, font-weight:900, color:[destaque], opacity:0.06,
    position:absolute, top:50%, left:50%, transform:translate(-50%,-50%), z-index:0, pointer-events:none
  → Todo conteúdo do .safe em z-index:1 acima deste elemento`,
  },
  {
    id: 'D', name: 'LISTA_STEPS',
    instruction: `ARQUÉTIPO D — LISTA STEPS
Estrutura obrigatória no .safe:
  logo-row (height:140px) → eyebrow pill → h1 (88px, 3 linhas) → .steps-list → spacer → cta-wrap
SEM benefícios com ícone-card. Os números SÃO os ícones visuais.
Layout: LEFT_ALIGNED (align-items:flex-start; text-align:left)

STEPS-LIST — detalhamento obrigatório:
  .steps-list { display:flex; flex-direction:column; gap:36px; margin-top:40px; }
  .step { display:flex; align-items:flex-start; gap:24px; padding-bottom:36px;
    border-bottom:1px solid rgba([destaque],0.15); }
  .step:last-child { border-bottom:none; }
  .step-num { font-size:52px; font-weight:900; color:[destaque vibrante];
    line-height:1; min-width:56px; flex-shrink:0; }
  .step-title { font-size:28px; font-weight:800;
    color: TEMA ESCURO=#ffffff / TEMA CLARO=#0f0f1a; }
  .step-desc  { font-size:21px; font-weight:500; line-height:1.4; margin-top:6px;
    color: TEMA ESCURO=rgba(255,255,255,0.70) / TEMA CLARO=#4a4a6a; }

⚠️ TEMA CLARO: .step-title DEVE ser #0f0f1a e .step-desc DEVE ser #4a4a6a — NUNCA branco.`,
  },
  {
    id: 'F', name: 'QUOTE_CARD',
    instruction: `ARQUÉTIPO F — QUOTE CARD
Estrutura obrigatória no .safe:
  logo-row PEQUENA (height:100px) → .quote-wrap (flex:1, display:flex, flex-direction:column, justify-content:center, position:relative) → .spacer → cta-wrap

DETALHAMENTO OBRIGATÓRIO do .quote-wrap:
  .quote-marks {
    position:absolute; top:-20px; left:-10px;
    font-size:260px; font-weight:900; line-height:1;
    color:[destaque vibrante]; opacity:0.18;
    font-family:'Poppins',sans-serif; user-select:none;
    content:'"';
  }
  .quote-text {
    font-size:52px; font-weight:800; line-height:1.25;
    letter-spacing:-1px; color:[texto principal];
    position:relative; z-index:1;
    max 3 linhas, máx 28 chars/linha;
  }
  .quote-divider {
    width:80px; height:4px; border-radius:4px;
    background:[destaque]; margin:32px 0; opacity:0.8;
  }
  .attribution {
    font-size:28px; font-weight:700;
    color:[destaque vibrante]; margin-top:0;
  }
  .attribution-sub {
    font-size:22px; font-weight:500;
    color:[texto suporte]; margin-top:8px;
  }

CTA: texto de ação relacionado à prova social ("Quero o Mesmo Resultado")
SEM benefícios. SEM eyebrow. As aspas + frase são o elemento âncora dominante.
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

Gere EXATAMENTE ${form.variations} variação(ões) de HTML.
Cada variação usa os tokens visuais definidos acima — copy, layout e estilo visual DIFERENTES entre si.
Separe cada variação com os marcadores exatos:
<!-- VARIACAO_START -->
[HTML completo aqui]
<!-- VARIACAO_END -->
${captionInstruction}

Retorne APENAS os blocos HTML (e legendas se solicitado) com os marcadores. Sem explicações, sem markdown, sem \`\`\`html.`
}
