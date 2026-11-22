import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { EpubView } from 'react-reader'
import type { Rendition, Book } from 'epubjs'
import { useStore } from '../store'
import { translate } from '../i18n'

// ---------------------------------------------------------------------------
// Reader: wrapper SOTTILE e MEMOIZZATO attorno a EpubView (NON ReactReader).
//
// Vincoli critici implementati qui:
//  • Usa EpubView per avere solo il pannello di rendering (header custom altrove).
//  • È avvolto in React.memo: gli aggiornamenti dell'Action Chart (che ri-renderano
//    App) NON propagano qui, quindi l'iframe di epub.js non viene distrutto/ricreato
//    e la posizione di lettura non si resetta.
//  • La location è gestita LOCALMENTE: inizializzata dal playthrough, aggiornata da
//    locationChanged. Non viene "ri-spinta" dall'esterno → niente salti di scroll.
//    La navigazione per sezione avviene via rendition.display() (callback onReady).
//  • Flow "scrolled" reflowable + tema scuro applicato al rendition.
//
// IMPORTANTE: tutte le callback passate da App devono avere identità STABILE
// (azioni zustand / ref), altrimenti React.memo non protegge l'iframe.
// ---------------------------------------------------------------------------

export interface ReaderProps {
  // ArrayBuffer (non blob URL): epub.js riconosce il binario e lo decomprime.
  // Vedi la nota in hooks/useBookUrl.ts per il perché del blob URL evitato.
  url: ArrayBuffer
  initialLocation: string | null
  darkMode: boolean
  fontSize: number // percentuale, es. 100
  onLocationChange: (cfi: string) => void
  onReady: (rendition: Rendition, book: Book) => void
}

function applyTheme(rendition: Rendition, dark: boolean, fontSize: number) {
  const ink = dark ? '#e8ddc7' : '#1a1206'
  const bg = dark ? '#1a1206' : '#f4ecd8'
  rendition.themes.register('lupo', {
    body: {
      color: ink,
      background: bg,
      'padding-left': '16px',
      'padding-right': '16px',
      'line-height': '1.6',
      'overscroll-behavior': 'contain',
    },
    a: { color: dark ? '#c9a24c' : '#8a5a12' },
    'a:link': { color: dark ? '#c9a24c' : '#8a5a12' },
    p: { 'margin-top': '0.6em', 'margin-bottom': '0.6em' },
  })
  rendition.themes.select('lupo')
  rendition.themes.fontSize(`${fontSize}%`)
}

function ReaderImpl({ url, initialLocation, darkMode, fontSize, onLocationChange, onReady }: ReaderProps) {
  // Location controllata LOCALMENTE (vedi nota sopra).
  // Senza posizione salvata partiamo dal primo elemento dello spine (0) invece di
  // lasciar scegliere a react-reader la prima voce del TOC: in alcuni EPUB (es.
  // l'edizione tedesca di "Einsamer Wolf") quella voce punta a un file fuori dallo
  // spine e epub.js fallisce con "No Section Found", lasciando il reader vuoto.
  const [location, setLocation] = useState<string | number | null>(initialLocation ?? 0)
  const renditionRef = useRef<Rendition | null>(null)

  const handleLocationChanged = useCallback(
    (cfi: string) => {
      setLocation(cfi)
      onLocationChange(cfi)
    },
    [onLocationChange],
  )

  const handleGetRendition = useCallback(
    (rendition: Rendition) => {
      renditionRef.current = rendition
      applyTheme(rendition, darkMode, fontSize)
      // book è raggiungibile da rendition.book
      const book = (rendition as unknown as { book: Book }).book
      onReady(rendition, book)
    },
    // darkMode/fontSize gestiti dall'effetto sotto; qui vogliamo identità stabile
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onReady],
  )

  // Ri-applica tema/font quando cambiano, SENZA ricreare l'iframe.
  useEffect(() => {
    if (renditionRef.current) applyTheme(renditionRef.current, darkMode, fontSize)
  }, [darkMode, fontSize])

  return (
    <div className="h-full w-full">
      <EpubView
        url={url}
        location={location}
        locationChanged={handleLocationChanged}
        getRendition={handleGetRendition}
        epubOptions={{
          flow: 'scrolled-doc',
          width: '100%',
          height: '100%',
          allowScriptedContent: true,
        }}
        loadingView={
          <div className="flex h-full items-center justify-center text-[var(--color-gold-dim)]">
            {translate(useStore.getState().lang, 'reader.bookLoading')}
          </div>
        }
      />
    </div>
  )
}

// React.memo con comparatore esplicito: l'iframe sopravvive ai re-render esterni.
// Si ricrea SOLO se cambia l'url (= cambia libro).
export const Reader = memo(ReaderImpl, (prev, next) => {
  return (
    prev.url === next.url &&
    prev.darkMode === next.darkMode &&
    prev.fontSize === next.fontSize &&
    prev.onLocationChange === next.onLocationChange &&
    prev.onReady === next.onReady
  )
})
