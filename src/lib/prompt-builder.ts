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
━ USA OBRIGATORIAMENTE a estrutura de 3 ZONAS do post (.p-header / .p-body / .p-footer)
━ ALINHAMENTO: À ESQUERDA — logo, eyebrow, headline, subtexto, benefits, CTA flush-left
━ FUNDO OBRIGATÓRIO: DEEP_GRADIENT — NUNCA preto puro, NUNCA MESH_GLOW
━ CTA: SOLID_GRADIENT full-width — NUNCA pill centralizado
Estrutura HTML:
  .p-header → logo-row (logo + eyebrow pill align-self:flex-start)
  .p-body (justify-content:center; gap:28px) →
    h1 (88px, 900, 3 linhas máx, à esquerda)
    p.sub (30px, 500, 2 linhas)
    div.divider (height:2px; background:linear-gradient(90deg,[destaque],transparent))
    div.benefits (display:flex; flex-direction:column; gap:24px):
      3 × div.benefit (display:flex; align-items:center; gap:20px):
        div.icon (72×72px, bg glass, border-radius:16px, font-size:28px, flex-shrink:0)
        div: p.benefit-title(28px,800) + p.benefit-desc(21px,500,opacity:0.72,margin-top:4px)
  .p-footer → CTA full-width + slogan`,
  },
  {
    id: 'A', name: 'HERO_STATEMENT',
    instruction: `ARQUÉTIPO A — HERO STATEMENT
Intenção: headline de impacto centralizada verticalmente. Minimalismo com força visual.
━ USA OBRIGATORIAMENTE a estrutura de 3 ZONAS do post (.p-header / .p-body / .p-footer)
━ ALINHAMENTO: TUDO CENTRALIZADO — text-align:center; align-items:center em .p-body
━ FUNDO DARK: MESH_GLOW — background:#000000 PRETO PURO — NUNCA DEEP_GRADIENT
━ FUNDO LIGHT: background:#ffffff + 2 círculos decorativos (ver addendum LIGHT)
━ CTA: PILL_BUTTON centralizado (border-radius:100px; max-width:700px; margin:0 auto)

Estrutura HTML:
  .p-header → img logo centralizada (height:90px; margin:0 auto)
  .p-body   → [conteúdo abaixo, justify-content:center já centra verticalmente]
    h1 (font-size:120px; font-weight:900; line-height:0.95; letter-spacing:-3px;
        text-align:center; MÁXIMO 3 LINHAS — EM BLOCO ÚNICO — não dividir em 2 elementos)
    p.sub (30px; 500; text-align:center; opacity:0.72; max 2 linhas)
  .p-footer → CTA pill centralizado + slogan centralizado

Elemento decorativo obrigatório — dentro do #post, antes do .safe:
  span.ghost (position:absolute; top:45%; left:50%; transform:translate(-50%,-50%);
    font-size:480px; font-weight:900; color:[destaque]; opacity:0.04; white-space:nowrap;
    user-select:none; pointer-events:none; z-index:0; line-height:1)
⛔ PROIBIDO: headline dividida em 2 elementos separados, lista de benefícios, eyebrow pill
⛔ PROIBIDO: usar .spacer — o justify-content:center do .p-body já distribui o espaço`,
  },
  {
    id: 'D', name: 'LISTA_STEPS',
    instruction: `ARQUÉTIPO D — LISTA STEPS
Intenção: passos numerados educam o leitor. Os números grandes são o elemento visual dominante.
━ USA OBRIGATORIAMENTE a estrutura de 3 ZONAS do post (.p-header / .p-body / .p-footer)
━ ALINHAMENTO: À ESQUERDA
━ FUNDO OBRIGATÓRIO: RICH_DARK
Estrutura HTML:
  .p-header → logo-row (logo à esquerda + eyebrow pill)
  .p-body (justify-content:center; gap:24px) →
    h1 (76px, 900, 2 linhas máx)
    div.steps (display:flex; flex-direction:column; gap:24px):
      4 × div.step (display:flex; align-items:flex-start; gap:24px):
        span.num (48px, 900, cor destaque, min-width:52px, flex-shrink:0)
        div: p.step-title(26px,800) + p.step-desc(20px,500,opacity:0.72,margin-top:4px)
        + border-bottom:1px solid rgba(destaque,0.15) exceto último
  .p-footer → CTA ou slogan
⛔ PROIBIDO: ícones emoji nos steps, space-evenly nas listas`,
  },
  {
    id: 'F', name: 'QUOTE_CARD',
    instruction: `ARQUÉTIPO F — QUOTE CARD
Intenção: frase de impacto ou depoimento. Espaço negativo = elegância.
━ USA OBRIGATORIAMENTE a estrutura de 3 ZONAS do post (.p-header / .p-body / .p-footer)
━ ALINHAMENTO: CENTRALIZADO
━ FUNDO OBRIGATÓRIO: MESH_GLOW
Estrutura HTML:
  .p-header → logo centralizada (height:90px; margin:0 auto)
  .p-body (justify-content:center; position:relative) →
    span.q-marks (240px, 900, cor destaque, opacity:0.12, position:absolute, top:0, left:-10px, z-index:0)
    p.q-text (46-52px, 700, line-height:1.3, text-align:center, z-index:1, MÁXIMO 3 LINHAS)
    div (width:80px; height:4px; background:destaque; margin:24px auto)
    p.q-author (26px, 800, cor destaque, text-align:center)
    p.q-role (20px, 500, opacity:0.65, text-align:center)
  .p-footer → CTA centralizado ou apenas slogan
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

// ─── MENU DE OPÇÕES PARA A IA ──────────────────────────────────────────────────
// A IA escolhe livremente os melhores arquétipos para o conteúdo.
// Não há pré-atribuição — isso garante variações genuinamente diferentes.

function buildArchetypeMenu(): string {
  return ARCHETYPES.map(a => `▸ ${a.id} — ${a.name}\n${a.instruction}`).join('\n\n')
}

function buildBgMenu(theme: string): string {
  const list = theme === 'dark' ? BG_STYLES_DARK : BG_STYLES_LIGHT
  return list.map((b, i) => `  ${i + 1}) ${b}`).join('\n')
}

function buildCtaMenu(): string {
  return CTA_STYLES.map((c, i) => `  ${i + 1}) ${c}`).join('\n')
}

function buildDecorationMenu(): string {
  return DECORATIONS.map((d, i) => `  ${i + 1}) ${d}`).join('\n')
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

  // Menu de opções criativas — a IA escolhe a melhor combinação para o conteúdo
  const archetypeMenu = buildArchetypeMenu()
  const bgMenu = buildBgMenu(form.theme)
  const ctaMenu = buildCtaMenu()
  const decorationMenu = buildDecorationMenu()

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
## SUA MISSÃO CRIATIVA

Crie ${form.variations} variações VISUALMENTE DISTINTAS. Para cada variação, você escolhe livremente
o arquétipo, fundo, CTA e decoração que melhor servem o conteúdo — desde que nenhuma repita outra.

🎲 SEMENTE CRIATIVA: ${visualSeed}
   Use para diversificar: ângulo do copy, posição de elementos, emoji, tom do slogan.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARQUÉTIPOS DISPONÍVEIS — escolha os que melhor servem o conteúdo:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${archetypeMenu}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNDOS DISPONÍVEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${bgMenu}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CTAs DISPONÍVEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${ctaMenu}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DECORAÇÕES DISPONÍVEIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${decorationMenu}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REGRAS DE CRIATIVIDADE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Cada variação usa um arquétipo DIFERENTE
✅ Cada variação usa um fundo DIFERENTE
✅ Varie alinhamentos: misture centralizadas e à esquerda
✅ Varie densidade: uma densa (B), uma minimalista (A ou F), uma estruturada (D)
✅ O eyebrow pill é OPCIONAL — use só quando acrescentar valor, não por padrão
❌ PROIBIDO: dois arquétipos iguais na mesma geração
❌ PROIBIDO: arquétipo F (Quote) sem depoimento real fornecido — invente copy próprio em vez
❌ PROIBIDO: inventar números, estatísticas ou urgência falsa
❌ PROIBIDO: arquétipo C (Stat) sem número real no assunto

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
