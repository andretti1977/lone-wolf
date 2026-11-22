import type { Rendition } from 'epubjs'
import { goToSection, sectionFromHref, type SectionIndex } from './sections'
import {
  showSection,
  docHasSection,
  prepareSections,
  injectInlineActions,
  appendContinuation,
  hasNumericHeading,
} from './sectionView'
import { useStore } from '../store'
import { translate } from '../i18n'

// Singleton NON reattivo che espone il controllo del reader ai pannelli
// (es. "vai alla sezione N") senza forzare re-render del Reader memoizzato.
// Popolato da App quando il rendition è pronto.

interface ReaderControl {
  rendition: Rendition | null
  sectionIndex: SectionIndex
}

const control: ReaderControl = { rendition: null, sectionIndex: {} }

// --- Stack di history per il pulsante "Indietro" -----------------------------
// Browser-like: quando si cambia SEZIONE (non a ogni micro-scroll), si registra
// la posizione che si sta lasciando. "Indietro" ci riporta lì.
const history: string[] = []
let currentHref: string | null = null
let currentCfi: string | null = null
let navigatingBack = false

// --- Vista a paragrafo singolo (EPUB con più paragrafi per file) --------------
// pendingSection: paragrafo richiesto ma non ancora mostrato (il file sta caricando).
// sectionHistory: stack dei paragrafi visitati, per "Indietro" fra paragrafi.
let pendingSection: string | null = null
let currentSection: string | null = null
let sectionBackNav = false
const sectionHistory: string[] = []
let lastDoc: Document | null = null

function setCurrentSection(n: string) {
  if (currentSection && currentSection !== n && !sectionBackNav) sectionHistory.push(currentSection)
  sectionBackNav = false
  if (currentSection === n) return
  currentSection = n
  useStore.getState().patchPlaythrough({ currentSection: n }, { debounce: true })
}

// Section.load di epub.js risolve con l'elemento <html> (documentElement), non col Document.
type SpineSection = { load: (req: unknown) => Promise<Element | Document> | Element | Document }

/** Carica il file successivo dello spine e ne copia la coda del paragrafo spezzato. */
async function addContinuation(doc: Document, index: number) {
  try {
    const book = (control.rendition as unknown as {
      book?: { spine: { get: (i: number) => SpineSection | null }; load: (u: string) => unknown }
    } | null)?.book
    if (!book) return
    // Fra un file e l'altro possono esserci pagine di sole illustrazioni (senza
    // titoli numerici): le saltiamo e prendiamo il primo file con paragrafi.
    for (let i = index + 1; i <= index + 3; i++) {
      const next = book.spine.get(i)
      if (!next) return
      const loaded = await next.load(book.load.bind(book))
      const nextDoc = 'body' in loaded ? loaded : loaded.ownerDocument
      if (!nextDoc || !hasNumericHeading(nextDoc)) continue
      if (appendContinuation(doc, nextDoc)) injectInlineActions(doc)
      return
    }
  } catch (err) {
    console.warn('[sections] continuazione non caricata:', err)
  }
}

/** Applica la vista a paragrafo singolo e le azioni nel testo a un documento renderizzato. */
function applyView(doc: Document, sectionIndex?: number) {
  lastDoc = doc
  if (sectionIndex != null && prepareSections(doc).length > 0) void addContinuation(doc, sectionIndex)
  const saved = useStore.getState().playthrough?.currentSection ?? null
  const shown = showSection(doc, pendingSection, currentSection ?? saved)
  pendingSection = null
  if (shown) setCurrentSection(shown)
  injectInlineActions(doc)
  if (!(doc as Document & { __lwLinks?: boolean }).__lwLinks) {
    ;(doc as Document & { __lwLinks?: boolean }).__lwLinks = true
    // Click su un rimando interno: mostra subito il paragrafo se è nello stesso
    // file (epub.js poi scorre all'ancora), altrimenti lo mostra al prossimo render.
    doc.addEventListener(
      'click',
      (e) => {
        const a = (e.target as Element | null)?.closest?.('a[href]')
        if (!a) return
        const n = sectionFromHref(a.getAttribute('href'), control.sectionIndex)
        if (!n) return
        // I link copiati dal file successivo (coda di un paragrafo spezzato) non
        // hanno l'handler di epub.js: lasciati al browser porterebbero l'iframe a
        // un URL relativo inesistente (404). Li gestiamo noi, registrando il salto.
        if (a.closest('[data-lw-cont]')) {
          e.preventDefault()
          e.stopPropagation()
          const st = useStore.getState()
          st.addWarLog({ type: 'navigation', text: translate(st.lang, 'log.linkSection', { n }), section: n })
          void navigateToSection(n)
          return
        }
        pendingSection = n
        if (docHasSection(doc, n)) {
          showSection(doc, n)
          setCurrentSection(n)
          pendingSection = null
        }
      },
      true,
    )
  }
}

function trackRelocated(loc: { start?: { href?: string; cfi?: string } }) {
  const href = loc?.start?.href ?? null
  const cfi = loc?.start?.cfi ?? null
  // Cambio di sezione → spingo nello stack la posizione che lascio
  if (currentHref && href && href !== currentHref && !navigatingBack && currentCfi) {
    history.push(currentCfi)
  }
  navigatingBack = false
  currentHref = href
  currentCfi = cfi
}

export function setReaderControl(rendition: Rendition | null, sectionIndex: SectionIndex) {
  control.rendition = rendition
  control.sectionIndex = sectionIndex
  // reset history quando si (ri)apre un libro
  history.length = 0
  sectionHistory.length = 0
  pendingSection = null
  currentSection = null
  lastDoc = null
  currentHref = null
  currentCfi = null
  navigatingBack = false
  if (rendition) {
    rendition.on('relocated', trackRelocated)
    // Inietta la barra di navigazione in coda a OGNI sezione renderizzata.
    // 'rendered' scatta a ogni cambio sezione → la barra è sempre presente.
    rendition.on('rendered', (section: { index?: number }, view: { document?: Document }) => {
      if (view?.document) {
        applyView(view.document, section?.index)
        injectPageNav(view.document)
        injectImageZoom(view.document)
      }
    })
    // La prima sezione può essere già stata renderizzata prima di questa chiamata
    // (es. quando la prima costruzione dell'indice sezioni scandisce tutto lo spine):
    // in quel caso 'rendered' è già scattato, quindi iniettiamo anche nei contenuti
    // attualmente visibili. injectPageNav/injectImageZoom sono idempotenti.
    try {
      const contents = (rendition as unknown as {
        getContents?: () => Array<{ document?: Document; sectionIndex?: number }>
      }).getContents?.()
      for (const c of contents ?? []) {
        if (c?.document) {
          applyView(c.document, c.sectionIndex)
          injectPageNav(c.document)
          injectImageZoom(c.document)
        }
      }
    } catch {
      /* rendition non ancora pronto: ci penserà 'rendered' */
    }
  }
}

export function getSectionIndex(): SectionIndex {
  return control.sectionIndex
}

export function isReaderReady(): boolean {
  return control.rendition !== null
}

/** Naviga alla sezione N. Ritorna true se il rendition era pronto e ha tentato. */
export async function navigateToSection(n: string): Promise<boolean> {
  if (!control.rendition) return false
  const key = String(parseInt(n, 10))
  pendingSection = key
  if (lastDoc && docHasSection(lastDoc, key)) {
    showSection(lastDoc, key)
    setCurrentSection(key)
    pendingSection = null
  }
  return goToSection(control.rendition, control.sectionIndex, key)
}

/** Il file corrente è in modalità "un paragrafo per pagina"? */
function inSectionMode(): boolean {
  return !!lastDoc && !!currentSection && prepareSections(lastDoc).length > 0
}

/** Paragrafo adiacente (±1) se esiste nell'indice. */
function adjacentSection(delta: number): string | null {
  if (!currentSection) return null
  const n = String(parseInt(currentSection, 10) + delta)
  return control.sectionIndex[n] ? n : null
}

/** Pagina successiva nell'ordine dell'EPUB (spine). No-op se il reader non è pronto. */
export async function nextPage(): Promise<boolean> {
  if (!control.rendition) return false
  const n = inSectionMode() ? adjacentSection(1) : null
  if (n) return navigateToSection(n)
  await control.rendition.next()
  return true
}

/** Pagina precedente nell'ordine dell'EPUB (spine). No-op se il reader non è pronto. */
export async function prevPage(): Promise<boolean> {
  if (!control.rendition) return false
  const n = inSectionMode() ? adjacentSection(-1) : null
  if (n) return navigateToSection(n)
  await control.rendition.prev()
  return true
}

/** Torna alla posizione precedente nello stack di history (browser-like). */
export async function goBack(): Promise<boolean> {
  if (!control.rendition) return false
  // Fra paragrafi (EPUB a più paragrafi per file) "Indietro" segue i paragrafi visitati.
  if (sectionHistory.length > 0) {
    sectionBackNav = true
    return navigateToSection(sectionHistory.pop()!)
  }
  if (history.length === 0) return false
  const cfi = history.pop()!
  navigatingBack = true // evita di ri-registrare questo salto nello stack
  await control.rendition.display(cfi)
  return true
}

export function canGoBack(): boolean {
  return history.length > 0 || sectionHistory.length > 0
}

/** CFI della posizione di lettura corrente (per creare un segnalibro). */
export function getCurrentCfi(): string | null {
  if (currentCfi) return currentCfi
  // Fallback best-effort dalla posizione live del rendition.
  const loc = control.rendition?.currentLocation() as unknown as { start?: { cfi?: string } } | undefined
  return loc?.start?.cfi ?? null
}

/** Salta a un CFI preciso (segnalibro). Ritorna true se il reader era pronto. */
export async function goToCfi(cfi: string): Promise<boolean> {
  if (!control.rendition) return false
  await control.rendition.display(cfi)
  return true
}

// --- Iniezione della barra di navigazione in coda al testo -------------------
// I bottoni vivono DENTRO il contenuto (sotto il testo): li si incontra
// scrollando fino in fondo alla sezione. Colori ereditati dal tema (currentColor),
// così seguono automaticamente dark/light senza ricalcoli.

const NAV_ID = 'lupo-pagenav'

function injectPageNav(doc: Document) {
  if (!doc.body || doc.getElementById(NAV_ID)) return

  const bar = doc.createElement('div')
  bar.id = NAV_ID
  bar.setAttribute(
    'style',
    [
      'display:flex',
      'flex-direction:column',
      'gap:8px',
      'margin:32px 0 0',
      // Spazio dal fondo via PADDING (non margin): il margin-bottom dell'ultimo
      // elemento non viene incluso nell'altezza del contenuto da epub.js e verrebbe
      // tagliato → la barra resterebbe a ridosso della toolbar. Il padding invece è
      // sempre incluso, quindi lo spazio si vede e non si rischia di premere la toolbar.
      'padding:16px 0 56px',
      'border-top:1px solid currentColor',
      'opacity:0.95',
      'font-family:system-ui,-apple-system,sans-serif',
    ].join(';'),
  )

  const mkRow = () => {
    const r = doc.createElement('div')
    r.setAttribute('style', 'display:flex;align-items:stretch;gap:8px')
    return r
  }

  const mkBtn = (label: string, aria: string, onClick: () => void) => {
    const b = doc.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.setAttribute('aria-label', aria)
    b.setAttribute(
      'style',
      [
        'flex:1 1 0',
        'min-height:44px',
        'padding:10px 12px',
        'font-size:16px',
        'line-height:1',
        'color:inherit',
        'background:transparent',
        'border:1px solid currentColor',
        'border-radius:10px',
        'cursor:pointer',
        '-webkit-tap-highlight-color:transparent',
      ].join(';'),
    )
    b.addEventListener('click', (e) => {
      e.preventDefault()
      onClick()
    })
    return b
  }

  // Etichette nella lingua UI corrente (lette al momento dell'iniezione).
  const lang = useStore.getState().lang

  // Riga 1: Precedente | Successiva
  const row1 = mkRow()
  row1.appendChild(mkBtn(translate(lang, 'pagenav.prev'), translate(lang, 'pagenav.prevAria'), () => prevPage()))
  row1.appendChild(mkBtn(translate(lang, 'pagenav.next'), translate(lang, 'pagenav.nextAria'), () => nextPage()))

  // Riga 2: Indietro | Sezione (apre il pannello "vai alla sezione")
  const row2 = mkRow()
  row2.appendChild(mkBtn(translate(lang, 'pagenav.back'), translate(lang, 'pagenav.backAria'), () => goBack()))
  row2.appendChild(
    mkBtn(translate(lang, 'pagenav.section'), translate(lang, 'pagenav.sectionAria'), () =>
      useStore.getState().setPanel('goto'),
    ),
  )

  bar.appendChild(row1)
  bar.appendChild(row2)
  doc.body.appendChild(bar)
}

// --- Tap sulle immagini → apertura nel lightbox a tutto schermo --------------
// Le immagini dell'EPUB sono <img> dentro l'iframe. Al tap ne ricaviamo un URL
// utilizzabile dal parent (fetch del blob → object URL; fallback canvas → dataURL)
// e lo passiamo allo store, che mostra il lightbox React.

async function imageToParentUrl(img: HTMLImageElement, doc: Document): Promise<string | null> {
  const src = img.currentSrc || img.src
  try {
    const blob = await fetch(src).then((r) => r.blob())
    return URL.createObjectURL(blob)
  } catch {
    // Fallback: ridisegna su canvas (same-origin → non tainted) e usa un dataURL.
    try {
      const canvas = doc.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')?.drawImage(img, 0, 0)
      return canvas.toDataURL('image/png')
    } catch {
      return null
    }
  }
}

function injectImageZoom(doc: Document) {
  const imgs = doc.querySelectorAll<HTMLImageElement>('img:not([data-lupo-zoom])')
  imgs.forEach((img) => {
    img.dataset.lupoZoom = '1'
    img.style.cursor = 'zoom-in'
    img.addEventListener('click', async (e) => {
      // Apriamo lo zoom invece di seguire un eventuale link che avvolge l'immagine.
      e.preventDefault()
      e.stopPropagation()
      const url = await imageToParentUrl(img, doc)
      if (url) useStore.getState().openLightbox(url)
    })
  })
}
