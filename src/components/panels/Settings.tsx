import { useRef, useState } from 'react'
import { Sheet } from '../Sheet'
import { useStore } from '../../store'
import { useT } from '../../i18n/useT'
import type { TKey } from '../../i18n'
import type { PersistState } from '../../hooks/usePersistence'
import { exportAllPlaythroughs, importAllPlaythroughs } from '../../utils/saveExport'

// Mappa lo stato di persistenza → pallino + chiavi i18n (etichetta + spiegazione).
const STORAGE_INFO: Record<PersistState, { dot: string; label: TKey; hint: TKey }> = {
  granted: { dot: '🟢', label: 'settings.storageGranted', hint: 'settings.storageHintGranted' },
  denied: { dot: '🟡', label: 'settings.storageDenied', hint: 'settings.storageHintDenied' },
  unsupported: { dot: '⚪️', label: 'settings.storageUnsupported', hint: 'settings.storageHintUnsupported' },
  unknown: { dot: '⏳', label: 'settings.storageUnknown', hint: 'settings.storageHintUnknown' },
}

// Impostazioni: lingua UI + tema + backup salvataggi + stato archiviazione.
// Raggiungibile da Libreria e da Reader.
export function Settings({ onClose, persist }: { onClose: () => void; persist: PersistState }) {
  const t = useT()
  const darkMode = useStore((s) => s.darkMode)
  const toggleDark = useStore((s) => s.toggleDark)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const onExport = async () => {
    const n = await exportAllPlaythroughs()
    setMsg(n === 0 ? t('settings.exportEmpty') : t('settings.exportDone', { n }))
  }

  const onImport = async (file: File) => {
    try {
      const res = await importAllPlaythroughs(file)
      let m = t('settings.importDone', { n: res.imported, linked: res.linked })
      if (res.missingTitles.length > 0) {
        m += ' ' + t('settings.importMissing', { titles: res.missingTitles.join(', ') })
      }
      setMsg(m)
    } catch (e) {
      setMsg(t('settings.importFailed', { err: String(e) }))
    }
  }

  return (
    <Sheet title={t('settings.title')} icon="⚙️" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Tema */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-3 font-semibold text-[var(--color-gold)]">{t('settings.theme')}</h3>
          <Segmented
            value={darkMode ? 'dark' : 'light'}
            options={[
              { value: 'dark', label: `🌙 ${t('settings.themeDark')}` },
              { value: 'light', label: `☀️ ${t('settings.themeLight')}` },
            ]}
            onChange={(v) => {
              if ((v === 'dark') !== darkMode) toggleDark()
            }}
          />
        </section>

        {/* Backup salvataggi — export/import di tutti i playthrough (no EPUB). */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-2 font-semibold text-[var(--color-gold)]">{t('settings.backup')}</h3>
          <p className="mb-3 text-xs text-[var(--color-ink)]/60">{t('settings.backupHint')}</p>
          <div className="flex flex-col gap-2">
            <button
              className="touch w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2 text-sm font-semibold active:bg-[var(--color-line)]"
              onClick={() => void onExport()}
            >
              {t('settings.export')}
            </button>
            <button
              className="touch w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2 text-sm font-semibold active:bg-[var(--color-line)]"
              onClick={() => fileRef.current?.click()}
            >
              {t('settings.import')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void onImport(f)
                e.target.value = ''
              }}
            />
          </div>
          {msg && <p className="mt-3 text-xs text-[var(--color-gold-dim)]">{msg}</p>}
        </section>

        {/* Archiviazione: stato della persistenza storage (spostato qui dall'header). */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-2 font-semibold text-[var(--color-gold)]">{t('settings.storage')}</h3>
          <p className="mb-2 text-xs text-[var(--color-ink)]/60">{t('settings.storageIntro')}</p>
          <div className="mb-2 flex items-center gap-2">
            <span aria-hidden className="text-base">
              {STORAGE_INFO[persist].dot}
            </span>
            <span className="font-semibold text-[var(--color-ink)]">{t(STORAGE_INFO[persist].label)}</span>
          </div>
          <p className="text-xs text-[var(--color-ink)]/60">{t(STORAGE_INFO[persist].hint)}</p>
        </section>
      </div>
    </Sheet>
  )
}

// Selettore a segmenti (toggle) generico, target tattili ampi.
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`touch flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
              active
                ? 'border-[var(--color-gold)] bg-[var(--color-panel-2)] text-[var(--color-gold)]'
                : 'border-[var(--color-line)] bg-[var(--color-panel-2)]/50 text-[var(--color-ink)]/70 active:bg-[var(--color-line)]'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
