import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, newPlaythrough, type BookRecord, type Playthrough } from '../db'
import { useStore } from '../store'
import type { PersistState } from '../hooks/usePersistence'
import { useT } from '../i18n/useT'
import { LOCALES } from '../i18n'
import { applyPendingBookmarks, relinkOrphanPlaythroughs } from '../utils/saveExport'

// Schermata iniziale: libreria dei libri salvati in IndexedDB + caricamento EPUB.
export function Library({ persist }: { persist: PersistState }) {
  const t = useT()
  const books = useLiveQuery(() => db.books.orderBy('addedAt').reverse().toArray(), [], [] as BookRecord[])
  const openReader = useStore((s) => s.openReader)
  const lang = useStore((s) => s.lang)
  const setPanel = useStore((s) => s.setPanel)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  // Libro SORGENTE selezionato per "copia personaggio su un altro libro".
  const [copyFrom, setCopyFrom] = useState<BookRecord | null>(null)
  const [copyMsg, setCopyMsg] = useState<string | null>(null)

  const onFile = async (file: File) => {
    setBusy(true)
    try {
      const title = file.name.replace(/\.epub$/i, '')
      // Un File È già un Blob: lo salviamo direttamente.
      const bookId = await db.books.add({ title, blob: file, addedAt: Date.now() })
      // Ri-aggancia eventuali salvataggi importati e rimasti orfani per questo
      // titolo, e applica i segnalibri "parcheggiati" da un import di backup.
      await relinkOrphanPlaythroughs(bookId, title)
      await applyPendingBookmarks(bookId, title)
    } finally {
      setBusy(false)
    }
  }

  const open = async (bookId: number) => {
    let pt: Playthrough | undefined = await db.playthroughs
      .where('bookId')
      .equals(bookId)
      .reverse()
      .sortBy('updatedAt')
      .then((a) => a[0])
    if (!pt) {
      const existing = await db.playthroughs.where('bookId').equals(bookId).count()
      const id = await db.playthroughs.add(newPlaythrough(bookId, t('lib.playthroughName', { n: existing + 1 })))
      pt = await db.playthroughs.get(id)
    }
    if (pt?.id != null) await openReader(bookId, pt.id)
  }

  // Nuova partita: azione DISTRUTTIVA → conferma esplicita. Se si procede,
  // i playthrough esistenti di QUESTO libro vengono cancellati e se ne crea uno pulito.
  const startNewGame = async (bookId: number) => {
    const ok = window.confirm(t('lib.newGameConfirm'))
    if (!ok) return
    await db.playthroughs.where('bookId').equals(bookId).delete()
    const id = await db.playthroughs.add(newPlaythrough(bookId, t('lib.playthroughName', { n: 1 })))
    await openReader(bookId, id)
  }

  // Copia personaggio: prende la partita più recente del libro sorgente e crea
  // una NUOVA partita sul libro scelto con Action Chart, zaino, oro e note.
  // NON copia: segnalibri (sono del libro), posizione di lettura, registro di
  // guerra e combattimento in corso (legati alle sezioni del libro originale).
  const copyCharacter = async (source: BookRecord, target: BookRecord) => {
    if (source.id == null || target.id == null) return
    const src = await db.playthroughs
      .where('bookId')
      .equals(source.id)
      .reverse()
      .sortBy('updatedAt')
      .then((a) => a[0])
    if (!src) {
      setCopyMsg(t('lib.copyNoSave', { title: source.title }))
      setCopyFrom(null)
      return
    }
    const existing = await db.playthroughs.where('bookId').equals(target.id).count()
    const id = await db.playthroughs.add({
      bookId: target.id,
      name: t('lib.playthroughName', { n: existing + 1 }),
      currentLocation: null,
      actionChart: structuredClone(src.actionChart),
      activeCombat: null,
      warLog: [{ ts: Date.now(), type: 'note', text: t('lib.copyLogNote', { from: source.title }) }],
      notes: src.notes ?? '',
      updatedAt: Date.now(),
    })
    setCopyFrom(null)
    setCopyMsg(null)
    await openReader(target.id, id)
  }

  const removeBook = async (bookId: number) => {
    await db.transaction('rw', db.books, db.playthroughs, async () => {
      await db.playthroughs.where('bookId').equals(bookId).delete()
      await db.books.delete(bookId)
    })
  }

  const persistNote =
    persist === 'denied' ? t('lib.persistDenied') : persist === 'granted' ? t('lib.persistGranted') : null

  return (
    <div className="min-h-app flex flex-col pt-safe pb-safe">
      <header className="px-4 pt-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-2xl font-bold text-[var(--color-gold)]">Kai-Chronik</h1>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="touch flex items-center justify-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm font-semibold text-[var(--color-ink)] active:bg-[var(--color-line)]"
              onClick={() => setPanel('instructions')}
            >
              ❓ {t('help.button')}
            </button>
            <button
              className="touch flex items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 active:bg-[var(--color-line)]"
              onClick={() => setPanel('settings')}
              aria-label={t('lib.settings')}
            >
              ⚙️
            </button>
          </div>
        </div>
        {/* Marcatore di build: cambia a ogni deploy → conferma di non essere in cache. */}
        <p className="font-mono text-[10px] text-[var(--color-gold-dim)]">build {__BUILD_ID__}</p>
        <p className="text-sm text-[var(--color-ink)]/60">{t('lib.subtitle')}</p>
        {persistNote && <p className="mt-1 text-xs text-[var(--color-gold-dim)]">{persistNote}</p>}
      </header>

      <div className="px-4 py-4">
        <button
          className="touch w-full rounded-xl border border-[var(--color-gold-dim)] bg-[var(--color-panel-2)] px-4 py-3 text-lg font-semibold text-[var(--color-gold)] active:bg-[var(--color-line)] disabled:opacity-50"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          {busy ? t('lib.loading') : `＋ ${t('lib.load')}`}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".epub,application/epub+zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void onFile(f)
            e.target.value = ''
          }}
        />
      </div>

      <div className="scroll-area flex-1 px-4">
        {books.length === 0 && (
          <p className="py-12 text-center text-sm text-[var(--color-ink)]/50">{t('lib.empty')}</p>
        )}

        {/* Selettore del libro di DESTINAZIONE per la copia del personaggio. */}
        {copyFrom && (
          <div className="mb-3 rounded-xl border border-[var(--color-gold-dim)] bg-[var(--color-panel)] p-3">
            <p className="font-semibold text-[var(--color-gold)]">
              🧳 {t('lib.copyTo', { title: copyFrom.title })}
            </p>
            <p className="mt-1 text-xs text-[var(--color-ink)]/60">{t('lib.copyHint')}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {books
                .filter((b) => b.id !== copyFrom.id)
                .map((b) => (
                  <li key={b.id}>
                    <button
                      className="touch w-full truncate rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2 text-left font-semibold text-[var(--color-ink)] active:bg-[var(--color-line)]"
                      onClick={() => void copyCharacter(copyFrom, b)}
                    >
                      📖 {b.title}
                    </button>
                  </li>
                ))}
              {books.length < 2 && (
                <li className="text-sm text-[var(--color-ink)]/50">{t('lib.copyNoTarget')}</li>
              )}
            </ul>
            <button
              className="touch mt-3 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2 text-sm active:bg-[var(--color-line)]"
              onClick={() => setCopyFrom(null)}
            >
              {t('lib.copyCancel')}
            </button>
          </div>
        )}
        {copyMsg && <p className="mb-3 text-xs text-[var(--color-gold-dim)]">{copyMsg}</p>}
        <ul className="flex flex-col gap-3">
          {books.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] text-2xl">
                  📖
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-[var(--color-ink)]">{b.title}</div>
                  <div className="text-xs text-[var(--color-ink)]/40">
                    {new Date(b.addedAt).toLocaleDateString(LOCALES[lang])}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  className="touch flex-1 rounded-lg border border-[var(--color-gold-dim)] bg-[var(--color-panel-2)] px-3 font-semibold text-[var(--color-gold)] active:bg-[var(--color-line)]"
                  onClick={() => b.id != null && open(b.id)}
                >
                  {t('lib.open')}
                </button>
                <button
                  className="touch rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm active:bg-[var(--color-line)]"
                  onClick={() => b.id != null && startNewGame(b.id)}
                >
                  {t('lib.newGame')}
                </button>
                <button
                  className={`touch rounded-lg border px-3 active:bg-[var(--color-line)] ${
                    copyFrom?.id === b.id
                      ? 'border-[var(--color-gold)] bg-[var(--color-line)]'
                      : 'border-[var(--color-line)] bg-[var(--color-panel-2)]'
                  }`}
                  onClick={() => {
                    setCopyMsg(null)
                    setCopyFrom(copyFrom?.id === b.id ? null : b)
                  }}
                  aria-label={t('lib.copyChar', { title: b.title })}
                >
                  🧳
                </button>
                <button
                  className="touch rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 active:bg-[var(--color-line)]"
                  onClick={() => b.id != null && removeBook(b.id)}
                  aria-label={t('lib.removeBook')}
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
