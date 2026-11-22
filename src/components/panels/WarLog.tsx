import { useRef, useState } from 'react'
import { Sheet } from '../Sheet'
import { useStore } from '../../store'
import { useT } from '../../i18n/useT'
import { LOCALES } from '../../i18n'
import type { WarLogEntry } from '../../db'
import { exportPlaythrough, importPlaythrough } from '../../utils/saveExport'
import { navigateToSection, goToCfi } from '../../utils/readerControl'

const ICONS: Record<WarLogEntry['type'], string> = {
  navigation: '🧭',
  combat: '⚔️',
  roll: '🎲',
  note: '📝',
}

function fmtTime(ts: number, locale: string): string {
  const d = new Date(ts)
  return d.toLocaleString(locale, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

export function WarLog({ onClose }: { onClose: () => void }) {
  const t = useT()
  const lang = useStore((s) => s.lang)
  const locale = LOCALES[lang]
  const playthrough = useStore((s) => s.playthrough)
  const addWarLog = useStore((s) => s.addWarLog)
  const [note, setNote] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  if (!playthrough) return null
  const entries = [...playthrough.warLog].reverse() // più recenti in alto

  const addNote = () => {
    const v = note.trim()
    if (!v) return
    addWarLog({ type: 'note', text: v })
    setNote('')
  }

  // Naviga al bersaglio di un evento (se presente) e chiude il registro.
  const goEntry = async (e: WarLogEntry) => {
    let ok = false
    if (e.section) ok = await navigateToSection(e.section)
    else if (e.cfi) ok = await goToCfi(e.cfi)
    if (ok) onClose()
  }

  const onImportFile = async (file: File) => {
    try {
      const res = await importPlaythrough(file)
      setMsg(res.bookKnown ? t('log.importedNew') : t('log.importedFallback'))
    } catch (e) {
      setMsg(t('log.importFailed', { err: String(e) }))
    }
  }

  return (
    <Sheet
      title={t('log.title')}
      icon="📜"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              className="touch w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-[var(--color-ink)]"
              placeholder={t('log.notePlaceholder')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button
              className="touch rounded-lg border border-[var(--color-gold-dim)] bg-[var(--color-panel-2)] px-4 font-semibold text-[var(--color-gold)] active:bg-[var(--color-line)]"
              onClick={addNote}
            >
              {t('log.add')}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="touch flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm active:bg-[var(--color-line)]"
              onClick={() => exportPlaythrough(playthrough)}
            >
              ⬇︎ {t('log.export')}
            </button>
            <button
              className="touch flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm active:bg-[var(--color-line)]"
              onClick={() => fileRef.current?.click()}
            >
              ⬆︎ {t('log.import')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onImportFile(f)
                e.target.value = ''
              }}
            />
          </div>
          {msg && <p className="text-center text-xs text-[var(--color-gold-dim)]">{msg}</p>}
        </div>
      }
    >
      <ul className="flex flex-col gap-2">
        {entries.length === 0 && (
          <li className="py-8 text-center text-sm text-[var(--color-ink)]/50">{t('log.empty')}</li>
        )}
        {entries.map((e, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)]/50 px-3 py-2"
          >
            <span aria-hidden>{ICONS[e.type]}</span>
            <div className="flex-1">
              {e.section || e.cfi ? (
                <button
                  className="touch -my-1 text-left text-sm font-medium text-[var(--color-gold)] underline decoration-dotted underline-offset-2 active:text-[var(--color-gold-dim)]"
                  onClick={() => void goEntry(e)}
                  aria-label={t('log.goToAria', { text: e.text })}
                >
                  {e.text} ›
                </button>
              ) : (
                <div className="text-sm text-[var(--color-ink)]">{e.text}</div>
              )}
              <div className="text-xs text-[var(--color-ink)]/40">{fmtTime(e.ts, locale)}</div>
            </div>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
