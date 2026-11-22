import { useStore } from '../store'
import { translate, type TKey } from '../i18n'

// ---------------------------------------------------------------------------
// Vista "un paragrafo per pagina" + azioni nel testo.
//
// Molti EPUB (es. l'edizione tedesca di "Einsamer Wolf") mettono decine di
// paragrafi numerati nello stesso file: epub.js li mostrerebbe tutti uno sotto
// l'altro. Qui raggruppiamo i figli del contenitore per titolo numerico e ne
// mostriamo uno solo. I file di Project Aon (un paragrafo per file) restano
// invariati: con meno di 2 titoli numerici non tocchiamo nulla.
//
// Le azioni nel testo (−1 Resistenza, Combatti, Estrai) sono PULSANTI: l'app non
// applica mai nulla da sola, l'utente decide (principio "l'utente è l'arbitro").
// ---------------------------------------------------------------------------

const HEADING_NUM_RE = /^\s*(\d{1,4})\s*$/
const ATTR = 'data-lw-sect'
const HIDE = 'data-lw-hide'
const STYLE_ID = 'lw-section-style'

type Doc = Document & { __lwSections?: string[] }

function isNumericHeading(el: Element): string | null {
  if (!/^H[1-6]$/.test(el.tagName)) return null
  const m = (el.textContent || '').match(HEADING_NUM_RE)
  return m ? String(parseInt(m[1], 10)) : null
}

/** Raggruppa (una volta per documento) i blocchi per paragrafo. Ritorna i numeri trovati. */
export function prepareSections(doc: Document): string[] {
  const d = doc as Doc
  if (d.__lwSections) return d.__lwSections
  const headings = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter((h) => isNumericHeading(h))
  if (headings.length < 2 || !doc.body) {
    d.__lwSections = []
    return d.__lwSections
  }
  // Contenitore comune: il genitore del primo titolo, se li contiene tutti; altrimenti body.
  let container: Element = headings[0].parentElement ?? doc.body
  if (!headings.every((h) => h.parentElement === container)) container = doc.body
  const found: string[] = []
  let current: string | null = null
  for (const child of Array.from(container.children)) {
    const own = isNumericHeading(child)
    const inner = own ? null : child.querySelector('h1,h2,h3,h4,h5,h6')
    const n = own ?? (inner ? isNumericHeading(inner) : null)
    if (n) {
      current = n
      found.push(n)
    }
    child.setAttribute(ATTR, current ?? 'pre')
  }
  if (!doc.getElementById(STYLE_ID)) {
    const style = doc.createElement('style')
    style.id = STYLE_ID
    style.textContent = `[${HIDE}]{display:none !important}`
    doc.head?.appendChild(style)
  }
  d.__lwSections = found
  return found
}

/** Il documento contiene almeno un titolo numerico? (Sola lettura: non modifica il documento.) */
export function hasNumericHeading(doc: Document): boolean {
  return Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6')).some((h) => isNumericHeading(h))
}

/** Ultimo paragrafo del file (o null se il file non è a più paragrafi). */
export function lastSection(doc: Document): string | null {
  const list = prepareSections(doc)
  return list.length ? list[list.length - 1] : null
}

/**
 * Alcuni EPUB spezzano un paragrafo fra due file: la coda sta in testa al file
 * successivo, prima del suo primo titolo numerico. La copiamo in fondo a questo
 * documento, marcata come parte dell'ultimo paragrafo. Le immagini vengono
 * tralasciate (i loro percorsi relativi non si risolvono qui).
 */
export function appendContinuation(doc: Document, nextDoc: Document): boolean {
  const last = lastSection(doc)
  const d = doc as Doc & { __lwContinued?: boolean }
  if (!last || d.__lwContinued || !nextDoc.body) return false
  d.__lwContinued = true
  const firstHeading = Array.from(nextDoc.querySelectorAll('h1,h2,h3,h4,h5,h6')).find((h) => isNumericHeading(h))
  const container = firstHeading?.parentElement ?? nextDoc.body
  const tail: Element[] = []
  for (const child of Array.from(container.children)) {
    if (isNumericHeading(child) || child.querySelector('h1,h2,h3,h4,h5,h6')) break
    tail.push(child)
  }
  const anchor = Array.from(doc.querySelectorAll(`[${ATTR}="${last}"]`)).pop()
  if (!anchor || tail.length === 0) return false
  if (!tail.some((el) => (el.textContent || '').trim())) return false
  let after: Element = anchor
  for (const el of tail) {
    const copy = doc.importNode(el, true) as Element
    copy.querySelectorAll('img, svg, image').forEach((i) => i.remove())
    copy.setAttribute(ATTR, last)
    // Marcatore: i link qui dentro non hanno l'handler di epub.js (vedi readerControl).
    copy.setAttribute('data-lw-cont', '')
    const hidden = anchor.hasAttribute(HIDE)
    if (hidden) copy.setAttribute(HIDE, '')
    after.after(copy)
    after = copy
  }
  return true
}

/** Il documento contiene il paragrafo n (in modalità a più paragrafi)? */
export function docHasSection(doc: Document, n: string): boolean {
  return prepareSections(doc).includes(n)
}

/**
 * Mostra solo il paragrafo `n` (o, se assente, `fallback`, o il primo del file).
 * Ritorna il numero mostrato, oppure null se il file non è a più paragrafi.
 */
export function showSection(doc: Document, n: string | null, fallback?: string | null): string | null {
  const list = prepareSections(doc)
  if (list.length === 0) return null
  const target = n && list.includes(n) ? n : fallback && list.includes(fallback) ? fallback : list[0]
  doc.querySelectorAll(`[${ATTR}]`).forEach((el) => {
    if (el.getAttribute(ATTR) === target) el.removeAttribute(HIDE)
    else el.setAttribute(HIDE, '')
  })
  return target
}

// --- Azioni nel testo ---------------------------------------------------------

const LOSE_RES = [
  /verlierst\s+(\d+)\s+AUSDAUERPUNKT/gi,
  /Ziehe\s+dir\s+(\d+)\s+AUSDAUERPUNKTE?\s+ab/gi,
  /lose\s+(\d+)\s+ENDURANCE/gi,
  /Deduct\s+(\d+)\s+ENDURANCE/gi,
]
const GAIN_RES = [
  /(?:erhältst|gewinnst)\s+(\d+)\s+AUSDAUERPUNKTE?\s+zurück/gi,
  /\b(?:regain|restore)\s+(\d+)\s+ENDURANCE/gi,
]
const COMBAT_RES = [
  /^\s*(.+?)\s*:\s*KAMPFST(?:Ä|AE)RKE\s*(\d+)\s*AUSDAUER(?:PUNKTE)?\s*(\d+)/i,
  /^\s*(.+?)\s*:\s*COMBAT\s+SKILL\s*(\d+)\s*ENDURANCE\s*(\d+)/i,
]
const DRAW_RE = /Ermittle\s+eine\s+Zufallszahl|Pick\s+a\s+number\s+from\s+the\s+Random\s+Number\s+Table/i

function tr(key: TKey, vars?: Record<string, string | number>): string {
  return translate(useStore.getState().lang, key, vars)
}

function mkButton(doc: Document, label: string, onClick: (b: HTMLButtonElement) => void): HTMLButtonElement {
  const b = doc.createElement('button')
  b.type = 'button'
  b.textContent = label
  b.setAttribute(
    'style',
    [
      'display:inline-block',
      'margin:6px 8px 0 0',
      'min-height:40px',
      'padding:8px 14px',
      'font-size:15px',
      'font-family:inherit',
      'line-height:1.1',
      'color:inherit',
      'background:transparent',
      'border:1px solid currentColor',
      'border-radius:999px',
      'cursor:pointer',
      '-webkit-tap-highlight-color:transparent',
    ].join(';'),
  )
  b.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onClick(b)
  })
  return b
}

function changeEndurance(delta: number, b: HTMLButtonElement) {
  const st = useStore.getState()
  const chart = st.playthrough?.actionChart
  if (!chart) return
  const from = chart.endurance.current
  const to = delta > 0 ? Math.min(chart.endurance.max, from + delta) : from + delta
  st.setActionChart({ ...chart, endurance: { ...chart.endurance, current: to } })
  st.addWarLog({ type: 'note', text: tr('inline.log', { from, to }) })
  b.textContent = tr('inline.applied', { from, to })
  b.disabled = true
  b.style.opacity = '0.6'
}

/** Inserisce (una volta per documento) i pulsanti d'azione accanto ai passaggi riconosciuti. */
export function injectInlineActions(doc: Document) {
  if (!doc.body) return
  // Blocchi "foglia": paragrafi senza altri blocchi dentro. Ognuno viene esaminato
  // una sola volta (anche quando il testo viene aggiunto dopo, vedi appendContinuation).
  const blocks = Array.from(doc.body.querySelectorAll('p, li, td, div')).filter(
    (el) => !el.hasAttribute('data-lw-scanned') && !el.querySelector('p, li, td, div, h1, h2, h3, h4, h5, h6'),
  )
  for (const el of blocks) {
    el.setAttribute('data-lw-scanned', '')
    const text = el.textContent || ''
    if (!text.trim()) continue
    const buttons: HTMLButtonElement[] = []

    for (const re of COMBAT_RES) {
      const m = text.match(re)
      if (m) {
        const name = m[1].trim()
        const cs = parseInt(m[2], 10)
        const en = parseInt(m[3], 10)
        buttons.push(
          mkButton(doc, tr('inline.fight', { name }), () =>
            useStore.setState({ combatPrefill: { name, cs, en }, openPanel: 'combat' }),
          ),
        )
        break
      }
    }
    for (const re of LOSE_RES) {
      for (const m of text.matchAll(re)) {
        const n = parseInt(m[1], 10)
        buttons.push(mkButton(doc, tr('inline.lose', { n }), (b) => changeEndurance(-n, b)))
      }
    }
    for (const re of GAIN_RES) {
      for (const m of text.matchAll(re)) {
        const n = parseInt(m[1], 10)
        buttons.push(mkButton(doc, tr('inline.gain', { n }), (b) => changeEndurance(n, b)))
      }
    }
    if (DRAW_RE.test(text) && buttons.length === 0 && !el.closest('a')) {
      buttons.push(mkButton(doc, tr('inline.draw'), () => useStore.setState({ openPanel: 'number' })))
    }
    if (buttons.length) {
      const row = doc.createElement('span')
      row.setAttribute('data-lw-actions', '')
      row.setAttribute('style', 'display:block;margin-top:2px')
      buttons.forEach((b) => row.appendChild(b))
      el.appendChild(row)
    }
  }
}
