import { useState } from 'react'
import { useT } from '../i18n/useT'

// Primitive UI condivise, mobile-first: target ≥44px, input 16px (niente zoom iOS),
// inputMode numerico per il tastierino. Tutto editabile a mano, sempre.

/** Stepper numerico con +/- ampi e input diretto. Consente qualunque valore (anche fuori limite). */
export function Stepper({
  label,
  value,
  onChange,
  hint,
  warn,
  min,
}: {
  label?: string
  value: number
  onChange: (v: number) => void
  hint?: string
  warn?: string
  min?: number
}) {
  const t = useT()
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-[var(--color-ink)]/80">{label}</span>
          {hint && <span className="text-xs text-[var(--color-gold-dim)]">{hint}</span>}
        </div>
      )}
      <div className="flex items-stretch gap-2">
        <button
          className="touch rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-xl active:bg-[var(--color-line)]"
          onClick={() => onChange(value - 1)}
          aria-label={t('common.decrease')}
        >
          −
        </button>
        <input
          className="touch w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-center text-lg text-[var(--color-ink)]"
          inputMode="numeric"
          pattern="-?[0-9]*"
          value={Number.isFinite(value) ? value : ''}
          onChange={(e) => {
            const raw = e.target.value.trim()
            if (raw === '' || raw === '-') {
              onChange(0)
              return
            }
            const n = parseInt(raw, 10)
            if (!Number.isNaN(n)) onChange(n)
          }}
        />
        <button
          className="touch rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-xl active:bg-[var(--color-line)]"
          onClick={() => onChange(value + 1)}
          aria-label={t('common.increase')}
        >
          +
        </button>
      </div>
      {warn && <span className="text-xs text-[var(--color-blood)]">{warn}</span>}
      {min !== undefined && value < min && (
        <span className="text-xs text-[var(--color-blood)]">{t('common.belowRef', { min })}</span>
      )}
    </div>
  )
}

/** Campo di testo generico. */
export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-sm text-[var(--color-ink)]/80">{label}</span>}
      <input
        className="touch w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-[var(--color-ink)]"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

/**
 * Lista di stringhe liberamente editabile: aggiungi / rinomina / rimuovi.
 * I limiti (es. max 2 armi) sono solo AVVISI, non bloccano l'inserimento.
 */
export function EditableList({
  title,
  items,
  onChange,
  softMax,
  addPlaceholder,
  suggestions,
}: {
  title: string
  items: string[]
  onChange: (items: string[]) => void
  softMax?: number
  addPlaceholder?: string
  /** Voci da aggiungere con un tocco (es. le armi standard). */
  suggestions?: string[]
}) {
  const t = useT()
  const [draft, setDraft] = useState('')
  const over = softMax !== undefined && items.length > softMax
  const placeholder = addPlaceholder ?? t('common.newItem')

  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...items, v])
    setDraft('')
  }

  return (
    <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="font-semibold text-[var(--color-gold)]">{title}</h3>
        {softMax !== undefined && (
          <span className={`text-xs ${over ? 'text-[var(--color-blood)]' : 'text-[var(--color-gold-dim)]'}`}>
            {items.length}/{softMax}
            {over && ` • ${t('common.overLimit')}`}
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            <input
              className="touch w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-[var(--color-ink)]"
              value={it}
              onChange={(e) => {
                const next = [...items]
                next[i] = e.target.value
                onChange(next)
              }}
            />
            <button
              className="touch rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 active:bg-[var(--color-line)]"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              aria-label={t('common.remove')}
            >
              🗑
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-[var(--color-ink)]/50">{t('common.noItems')}</li>}
      </ul>

      {suggestions && suggestions.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-[var(--color-gold-dim)]">{t('common.quickAdd')}</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((sug) => (
              <button
                key={sug}
                className="touch rounded-full border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm active:bg-[var(--color-line)]"
                onClick={() => onChange([...items, sug])}
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          className="touch w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3 text-[var(--color-ink)]"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
        />
        <button
          className="touch rounded-lg border border-[var(--color-gold-dim)] bg-[var(--color-panel-2)] px-4 font-semibold text-[var(--color-gold)] active:bg-[var(--color-line)]"
          onClick={add}
        >
          +
        </button>
      </div>
    </section>
  )
}
