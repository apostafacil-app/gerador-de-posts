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

// NOTA: Os arquétipos definem ESTRUTURA e LAYOUT — não o fundo.
// O fundo (background) é definido pelo SLOT de rotação — isso permite que o mesmo
// arquétipo apareça em fundos completamente diferentes entre sessões.
const ARCHETYPES = [
  {
    id: 'B', name: 'EDITORIAL',
    instruction: `ARQUÉTIPO B — EDITORIAL
Intenção: post denso e estruturado com benefícios claros. Aparência editorial profissional.
━ USA OBRIGATORIAMENTE a estrutura de 3 ZONAS do post (.p-header / .p-body / .p-footer)
━ ALINHAMENTO: À ESQUERDA — logo, headline, subtextos, benefits, CTA todos flush-left
━ CTA: SOLID_GRADIENT full-width — NUNCA pill centralizado
Estrutura HTML:
  .p-header → logo-row (logo à esquerda + eyebrow pill OPCIONAL align-self:flex-start)
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
━ CTA: PILL_BUTTON centralizado (border-radius:100px; max-width:700px; margin:0 auto)
Estrutura HTML:
  .p-header → img logo centralizada (height:90px; margin:0 auto)
  .p-body (justify-content:center; align-items:center) →
    h1 (font-size:120px; font-weight:900; line-height:0.95; letter-spacing:-3px;
        text-align:center; MÁXIMO 3 LINHAS — EM BLOCO ÚNICO — não dividir em 2 elementos)
    p.sub (30px; 500; text-align:center; opacity:0.72; max 2 linhas)
  .p-footer → CTA pill centralizado + slogan centralizado
Elemento decorativo obrigatório — dentro do #post, antes do .safe (z-index:0):
  span.ghost (position:absolute; top:45%; left:50%; transform:translate(-50%,-50%);
    font-size:480px; font-weight:900; color:[destaque]; opacity:0.04; white-space:nowrap;
    user-select:none; pointer-events:none; line-height:1)
⛔ PROIBIDO: headline dividida em 2 elementos, lista de benefícios, eyebrow pill, .spacer`,
  },
  {
    id: 'D', name: 'LISTA_STEPS',
    instruction: `ARQUÉTIPO D — LISTA STEPS
Intenção: passos numerados educam o leitor. Os números grandes são o elemento visual dominante.
━ USA OBRIGATORIAMENTE a estrutura de 3 ZONAS do post (.p-header / .p-body / .p-footer)
━ ALINHAMENTO: À ESQUERDA
Estrutura HTML:
  .p-header → logo-row (logo à esquerda + eyebrow pill OPCIONAL)
  .p-body (justify-content:center; gap:24px) →
    h1 (76px, 900, 2 linhas máx)
    div.steps (display:flex; flex-direction:column; gap:24px):
      4 × div.step (display:flex; align-items:flex-start; gap:24px):
        span.num (48px, 900, cor destaque, min-width:52px, flex-shrink:0)
        div: p.step-title(26px,800) + p.step-desc(20px,500,opacity:0.72,margin-top:4px)
        border-bottom:1px solid rgba(destaque,0.15) exceto último
  .p-footer → CTA ou slogan
⛔ PROIBIDO: ícones emoji nos steps, space-evenly`,
  },
  {
    id: 'F', name: 'QUOTE_CARD',
    instruction: `ARQUÉTIPO F — QUOTE CARD
Intenção: frase de impacto ou depoimento. Espaço negativo = elegância.
━ USA OBRIGATORIAMENTE a estrutura de 3 ZONAS do post (.p-header / .p-body / .p-footer)
━ ALINHAMENTO: CENTRALIZADO
Estrutura HTML:
  .p-header → logo centralizada (height:90px; margin:0 auto)
  .p-body (justify-content:center; position:relative) →
    span.q-marks (240px, 900, cor destaque, opacity:0.12, position:absolute, top:0, left:-10px, z-index:0)
    p.q-text (46-52px, 700, line-height:1.3, text-align:center, z-index:1, MÁXIMO 3 LINHAS)
    div (width:80px; height:4px; background:destaque; margin:24px auto)
    p.q-author (26px, 800, cor destaque, text-align:center)
    p.q-role (20px, 500, opacity:0.65, text-align:center)
  .p-footer → CTA centralizado ou apenas slogan
⛔ PROIBIDO: lista de benefícios, eyebrow pill`,
  },
  {
    id: 'C', name: 'STAT_CARD',
    instruction: `ARQUÉTIPO C — STAT CARD
Intenção: um número real e impactante domina visualmente o canvas como âncora.
━ USA OBRIGATORIAMENTE a estrutura de 3 ZONAS do post (.p-header / .p-body / .p-footer)
━ ALINHAMENTO: CENTRALIZADO
Estrutura HTML:
  .p-header → logo centralizada
  .p-body (justify-content:center; gap:20px) →
    span.stat (200-240px, 900, cor destaque, letter-spacing:-8px, text-align:center)
    p.stat-label (30px, 700, text-align:center)
    p.sub (26px, 500, opacity:0.72, text-align:center, 1 linha)
    div.divider (2px, gradiente)
    div.mini-cards (display:flex; gap:24px; justify-content:center):
      2 × div.card (bg glass; border-radius:16px; padding:24px; text-align:center)
  .p-footer → CTA centralizado
⛔ Só usar se o assunto contiver número real`,
  },
  {
    id: 'E', name: 'SPLIT_LAYOUT',
    instruction: `ARQUÉTIPO E — SPLIT LAYOUT
Intenção: contraste visual forte entre "antes" e "depois", dividindo o canvas em dois campos visuais.

LIBERDADE CRIATIVA NA DIVISÃO — escolha UMA das abordagens abaixo (ou crie sua própria):
  • DIAGONAL: clip-path no div superior criando corte inclinado (clássico)
  • CURVA: border-radius 0 0 60% 60% / 0 0 120px 120px no div colorido criando arco suave
  • BLOB: clip-path com SVG path bezier — forma orgânica irregular separando os dois lados
  • VERTICAL: dois divs lado a lado (50%/50%) com borda central de 4px cor destaque + gradiente bleeding entre eles
  • DIAGONAL INVERSA: div colorido no canto inferior direito, conteúdo claro no superior esquerdo
  • ARCO CENTRAL: círculo gigante 1400×1400px posicionado saindo do centro, metade roxa metade clara

Elementos obrigatórios:
  → Logo centralizada no topo (z-index:10, position:relative)
  → Labels MANUAL/SEM em um lado + APOSTEMAIS/COM no outro (20px, uppercase, weight:700)
  → Headline grande (68-80px) cruzando visualmente os dois campos
  → Métricas comparativas (ex: 30min × 2min) — uma de cada lado, números grandes 80-100px
  → CTA full-width na base
⛔ PROIBIDO: lista de benefícios verticais, eyebrow pill padrão`,
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

// Nomes batem exatamente com o addendum — a IA consulta a definição completa no addendum
const BG_STYLES_DARK = [
  'DEEP_GRADIENT',   // roxo vibrante saturado
  'MESH_GLOW',       // preto puro + glow radial centralizado
  'SPLIT_DARK',      // metade escuro/colorido + metade claro
  'RICH_DARK',       // quase preto + textura pontilhada + glow inferior
]

const BG_STYLES_LIGHT = [
  'CLEAN_WHITE',     // branco + círculos decorativos suaves
  'SOFT_TINT',       // tint primária encapsulando o conteúdo
  'CARD_SPLIT',      // faixa colorida forte no topo + corpo branco
  'GRADIENT_FADE',   // gradiente diagonal da marca → branco
]

// ─── SETS DE ROTAÇÃO ───────────────────────────────────────────────────────────
// Cada set define uma combinação DIFERENTE de arquétipos.
// A geração sorteia aleatoriamente um set — garantindo variedade entre sessões.
// A IA não escolhe: ela recebe o arquétipo obrigatório e aplica criatividade DENTRO dele.

interface SlotSpec { arch: string; bgDark: number; bgLight: number; cta: number; deco: number }

// FUNDOS DARK:  0=DEEP_GRADIENT(roxo vibrante)  1=MESH_GLOW(preto+glow)
//               2=SPLIT_DARK_LIGHT(escuro+branco)  3=RICH_DARK(escuro+dots)
// FUNDOS LIGHT: 0=CLEAN_WHITE  1=SOFT_TINT  2=CARD_SPLIT  3=GRADIENT_FADE
// Cada set varia deliberadamente os fundos — B nem sempre roxo, A nem sempre preto.

// Sets para 2 variações — 6 combinações com fundos rotacionando
const SETS_2: SlotSpec[][] = [
  [ // Set 0: Hero preto + Editorial roxo (clássico)
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:1 },
    { arch:'B', bgDark:0, bgLight:0, cta:0, deco:0 },
  ],
  [ // Set 1: Steps roxo + Hero preto
    { arch:'D', bgDark:0, bgLight:2, cta:2, deco:2 },
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:7 },
  ],
  [ // Set 2: Editorial dots-escuro + Split
    { arch:'B', bgDark:3, bgLight:1, cta:0, deco:6 },
    { arch:'E', bgDark:2, bgLight:2, cta:4, deco:3 },
  ],
  [ // Set 3: Hero ROXO (diferente!) + Steps dots
    { arch:'A', bgDark:0, bgLight:1, cta:1, deco:1 },
    { arch:'D', bgDark:3, bgLight:0, cta:2, deco:2 },
  ],
  [ // Set 4: Editorial dots + Hero preto
    { arch:'B', bgDark:3, bgLight:2, cta:3, deco:0 },
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:7 },
  ],
  [ // Set 5: Split + Editorial dots
    { arch:'E', bgDark:2, bgLight:2, cta:4, deco:3 },
    { arch:'B', bgDark:3, bgLight:1, cta:0, deco:6 },
  ],
]

// Sets para 4 variações — cada set tem fundos completamente diferentes
const SETS_4: SlotSpec[][] = [
  [ // Set 0: B(roxo) A(preto) D(dots) E(split)
    { arch:'B', bgDark:0, bgLight:0, cta:0, deco:0 },
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:1 },
    { arch:'D', bgDark:3, bgLight:1, cta:2, deco:2 },
    { arch:'E', bgDark:2, bgLight:2, cta:4, deco:3 },
  ],
  [ // Set 1: A(preto) D(roxo) E(split) B(dots) — fundos trocados!
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:1 },
    { arch:'D', bgDark:0, bgLight:2, cta:2, deco:2 },
    { arch:'E', bgDark:2, bgLight:2, cta:4, deco:3 },
    { arch:'B', bgDark:3, bgLight:1, cta:3, deco:6 },
  ],
  [ // Set 2: D(dots) B(roxo) A(roxo!) E(split) — SPLIT_DARK só para E
    { arch:'D', bgDark:3, bgLight:1, cta:2, deco:2 },
    { arch:'B', bgDark:0, bgLight:2, cta:0, deco:0 },
    { arch:'A', bgDark:1, bgLight:1, cta:1, deco:7 },
    { arch:'E', bgDark:2, bgLight:2, cta:4, deco:3 },
  ],
  [ // Set 3: E(split) A(preto) B(dots) D(roxo)
    { arch:'E', bgDark:2, bgLight:2, cta:4, deco:3 },
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:1 },
    { arch:'B', bgDark:3, bgLight:1, cta:3, deco:6 },
    { arch:'D', bgDark:0, bgLight:0, cta:2, deco:2 },
  ],
  [ // Set 4: B(roxo) E(split) A(dots-glow) D(preto-ish)
    { arch:'B', bgDark:0, bgLight:0, cta:0, deco:0 },
    { arch:'E', bgDark:2, bgLight:2, cta:4, deco:3 },
    { arch:'A', bgDark:3, bgLight:1, cta:1, deco:7 },
    { arch:'D', bgDark:1, bgLight:3, cta:2, deco:2 },
  ],
  [ // Set 5: A(roxo!) D(preto-glow) B(dots) E(split)
    { arch:'A', bgDark:0, bgLight:1, cta:1, deco:1 },
    { arch:'D', bgDark:1, bgLight:3, cta:2, deco:2 },
    { arch:'B', bgDark:3, bgLight:0, cta:0, deco:6 },
    { arch:'E', bgDark:2, bgLight:2, cta:4, deco:3 },
  ],
]

// Sets para 1 ou 3 variações — fallback simples
const SETS_1: SlotSpec[][] = [
  [{ arch:'B', bgDark:0, bgLight:0, cta:0, deco:0 }],
  [{ arch:'A', bgDark:1, bgLight:3, cta:1, deco:1 }],
  [{ arch:'D', bgDark:3, bgLight:1, cta:2, deco:2 }],
  [{ arch:'E', bgDark:2, bgLight:1, cta:4, deco:3 }],
]

const SETS_3: SlotSpec[][] = [
  [
    { arch:'B', bgDark:0, bgLight:0, cta:0, deco:0 },
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:1 },
    { arch:'D', bgDark:3, bgLight:1, cta:2, deco:2 },
  ],
  [
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:1 },
    { arch:'D', bgDark:3, bgLight:1, cta:2, deco:2 },
    { arch:'E', bgDark:2, bgLight:1, cta:4, deco:3 },
  ],
  [
    { arch:'D', bgDark:3, bgLight:1, cta:2, deco:2 },
    { arch:'B', bgDark:0, bgLight:0, cta:0, deco:0 },
    { arch:'E', bgDark:2, bgLight:1, cta:4, deco:3 },
  ],
  [
    { arch:'E', bgDark:2, bgLight:1, cta:4, deco:3 },
    { arch:'A', bgDark:1, bgLight:3, cta:1, deco:1 },
    { arch:'B', bgDark:0, bgLight:2, cta:3, deco:6 },
  ],
]

function pickSet(numVar: number, seed: number): SlotSpec[] {
  const map: Record<number, SlotSpec[][]> = { 1: SETS_1, 2: SETS_2, 3: SETS_3, 4: SETS_4 }
  const sets = map[numVar] ?? SETS_4
  return sets[seed % sets.length]
}

function buildSlotSpec(slot: SlotSpec, theme: string): string {
  const arch = ARCHETYPES.find(a => a.id === slot.arch)!
  const bg = theme === 'dark' ? BG_STYLES_DARK[slot.bgDark] : BG_STYLES_LIGHT[slot.bgLight]
  const cta = CTA_STYLES[slot.cta]
  const deco = DECORATIONS[Math.min(slot.deco, DECORATIONS.length - 1)]
  return `🏗  ARQUÉTIPO → ${arch.id} — ${arch.name}
${arch.instruction}
🎨  FUNDO → ${bg}
✨  DECORAÇÃO → ${deco}
🔘  CTA → ${cta}`
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

  // Sorteia o set de rotação — garante combinações diferentes a cada geração
  const rotationSet = pickSet(form.variations, visualSeed)
  const variationSpecs = rotationSet.map((slot, i) =>
    `━━ VARIAÇÃO ${i + 1} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${buildSlotSpec(slot, form.theme)}`
  ).join('\n\n')

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
## ESPECIFICAÇÃO VISUAL — SEGUIR OBRIGATORIAMENTE

🎲 SEMENTE: ${visualSeed} — use para variar copy, emoji, posição de elementos, tom do slogan.

${variationSpecs}

⚠️ REGRAS:
❌ PROIBIDO trocar o arquétipo atribuído — execute exatamente o que está especificado.
❌ PROIBIDO inventar números, estatísticas ou urgência falsa.
✅ O eyebrow pill é OPCIONAL — use só se agregar contexto, não por padrão.
✅ Cada variação deve ter copy e ângulo de mensagem DIFERENTES entre si.

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
