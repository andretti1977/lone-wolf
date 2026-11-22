import type { Book, Rendition } from 'epubjs'

// ---------------------------------------------------------------------------
// Navigazione per SEZIONE (non per pagina). Negli EPUB di Project Aon ogni
// sezione numerata è tipicamente un file dello spine tipo "sect217.xhtml" e/o
// un'ancora con id "sect217". Costruiamo un indice numero->href alla prima
// apertura e lo cachiamo nel record del libro.
// ---------------------------------------------------------------------------

export type SectionIndex = Record<string, string> // "217" -> href (eventualmente "file.xhtml#ancora")

const SECT_RE = /sect(\d+)/i
// Ancore che contengono direttamente il numero di sezione: "sect217" (Project Aon)
// o "lev217" (edizione tedesca Mantikore di "Einsamer Wolf").
const ANCHOR_RE = /^(?:sect|lev)(\d{1,4})$/i
// Titolo di sezione composto solo dal numero (es. <h3>217</h3>).
const HEADING_NUM_RE = /^\s*(\d{1,4})\s*$/

type SpineItem = {
  href?: string
  idref?: string
  load?: (request: unknown) => Promise<Document> | Document
  unload?: () => void
}

/**
 * Costruisce l'indice sezione->href.
 *
 * 1. Schema Project Aon: un file dello spine per sezione ("sect217.xhtml").
 * 2. Se lo schema non c'è (es. edizioni commerciali come quella tedesca, dove
 *    molte sezioni stanno nello stesso file), scandisce i documenti dello spine
 *    e cerca i titoli composti solo da un numero (<h3>217</h3>) e/o le ancore
 *    "sectN"/"levN", producendo href del tipo "file.xhtml#ancora".
 *
 * Robusto: se nulla corrisponde, l'indice resta vuoto e la navigazione per
 * sezione semplicemente non troverà corrispondenze (ma il reader funziona comunque).
 */
export async function buildSectionIndex(book: Book): Promise<SectionIndex> {
  const index: SectionIndex = {}
  try {
    await book.ready
    // epubjs: lo spine espone spineItems con href/idref.
    const spine = (book.spine as unknown as { spineItems?: SpineItem[] }).spineItems
    if (!Array.isArray(spine)) return index
    for (const item of spine) {
      const candidate = item.href || item.idref || ''
      const m = candidate.match(SECT_RE)
      if (m) {
        const n = String(parseInt(m[1], 10))
        if (!(n in index)) index[n] = item.href || candidate
      }
    }
    // Schema a file-per-sezione trovato (≥ 20 sezioni): basta così.
    if (Object.keys(index).length >= 20) return index

    const loader = (book as unknown as { load: (url: string) => unknown }).load.bind(book)
    for (const item of spine) {
      if (!item.href || typeof item.load !== 'function') continue
      try {
        const doc = await item.load(loader)
        scanDocument(doc, item.href, index)
      } catch (err) {
        console.warn('[sections] scansione fallita per', item.href, err)
      } finally {
        try {
          item.unload?.()
        } catch {
          /* ignora */
        }
      }
    }
  } catch (err) {
    console.warn('[sections] buildSectionIndex fallito:', err)
  }
  return index
}

/** Cerca sezioni numerate in un documento dello spine e le aggiunge all'indice. */
function scanDocument(doc: Document, href: string, index: SectionIndex): void {
  // a) Titoli "solo numero": il più affidabile (vale per Project Aon e per l'edizione tedesca).
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    const m = (h.textContent || '').match(HEADING_NUM_RE)
    if (!m) return
    const n = String(parseInt(m[1], 10))
    if (n in index) return
    const id = h.id || h.querySelector('[id]')?.id || precedingAnchorId(h)
    index[n] = id ? `${href}#${id}` : href
  })
  // b) Ancore "sectN"/"levN" senza titolo numerico.
  doc.querySelectorAll('[id]').forEach((el) => {
    const m = el.id.match(ANCHOR_RE)
    if (!m) return
    const n = String(parseInt(m[1], 10))
    if (!(n in index)) index[n] = `${href}#${el.id}`
  })
}

/** Id di un'ancora vuota subito prima del titolo (<a id="x"></a><h3>12</h3>). */
function precedingAnchorId(el: Element): string | null {
  const prev = el.previousElementSibling
  if (prev && prev.id && !(prev.textContent || '').trim()) return prev.id
  return null
}

/** Risolve il target di navigazione per una sezione N. Prova indice, poi fallback. */
export function targetForSection(index: SectionIndex, n: string): string | null {
  const key = String(parseInt(n, 10))
  if (index[key]) return index[key]
  // Fallback: tenta l'ancora classica di Project Aon.
  return null
}

/** Naviga il rendition a una sezione N (o a un href/CFI grezzo). Ritorna true se tentato. */
export async function goToSection(
  rendition: Rendition,
  index: SectionIndex,
  n: string,
): Promise<boolean> {
  const target = targetForSection(index, n)
  const dest = target ?? guessHref(n)
  try {
    await rendition.display(dest)
    return true
  } catch (err) {
    console.warn('[sections] goToSection fallita per', dest, err)
    return false
  }
}

/** Ipotesi di href quando l'indice non copre la sezione (schema Project Aon). */
function guessHref(n: string): string {
  const num = String(parseInt(n, 10))
  return `sect${num}.xhtml`
}

/** Nome file + ancora, senza cartelle: "../xhtml/c3.html#lev2" -> "c3.html#lev2". */
function normalizeHref(href: string): string {
  const [path, hash] = href.split('#')
  const file = decodeURIComponent(path.split('/').pop() || '')
  return hash ? `${file}#${hash}` : file
}

/**
 * Estrae il numero di sezione da un href. Prova prima l'indice (copre gli EPUB
 * con più sezioni per file), poi gli schemi "sectN"/"levN".
 * Es. "…/sect217.xhtml" -> "217", "chapter03aaa.html#lev392" -> "392".
 */
export function sectionFromHref(href: string | undefined | null, index?: SectionIndex): string | null {
  if (!href) return null
  if (index) {
    const target = normalizeHref(href)
    for (const [n, h] of Object.entries(index)) {
      if (normalizeHref(h) === target) return n
    }
  }
  const hash = href.split('#')[1]
  const a = hash?.match(ANCHOR_RE)
  if (a) return String(parseInt(a[1], 10))
  const m = href.match(SECT_RE)
  return m ? String(parseInt(m[1], 10)) : null
}

/**
 * Registra un intercettatore sui click ai link interni del rendition, per
 * LOGGARE i salti nel war log. NON impedisce la navigazione: epub.js gestisce
 * comunque lo spostamento; noi osserviamo soltanto.
 */
export function attachLinkInterceptor(
  rendition: Rendition,
  onInternalLink: (info: { section: string | null; href: string }) => void,
  index?: SectionIndex,
): void {
  try {
    // hooks.content: viene eseguito per ogni documento renderizzato.
    const hooks = (rendition as unknown as {
      hooks?: { content?: { register: (fn: (contents: { document: Document }) => void) => void } }
    }).hooks
    hooks?.content?.register((contents) => {
      const doc = contents.document
      doc.querySelectorAll('a[href]').forEach((a) => {
        a.addEventListener('click', () => {
          const href = (a as HTMLAnchorElement).getAttribute('href') || ''
          onInternalLink({ section: sectionFromHref(href, index), href })
        })
      })
    })
  } catch (err) {
    console.warn('[sections] attachLinkInterceptor fallito:', err)
  }
}
