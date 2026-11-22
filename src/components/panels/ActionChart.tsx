import { Sheet } from '../Sheet'
import { EditableList, Stepper } from '../ui'
import { useStore } from '../../store'
import { useT } from '../../i18n/useT'
import type { Lang } from '../../i18n'
import type { ActionChart as Chart } from '../../db'
import { KAI_DISCIPLINES, WEAPONS, findDiscipline } from '../../data/disciplines'

// Action Chart: TUTTO sempre modificabile a mano (principio "l'utente è l'arbitro").
// I limiti classici sono mostrati come riferimento/avviso, mai come blocco.
export function ActionChart({ onClose }: { onClose: () => void }) {
  const t = useT()
  const chart = useStore((s) => s.playthrough?.actionChart)
  const notes = useStore((s) => s.playthrough?.notes ?? '')
  const setChart = useStore((s) => s.setActionChart)
  const patchPlaythrough = useStore((s) => s.patchPlaythrough)
  const lang = useStore((s) => s.lang)
  if (!chart) return null

  const patch = (p: Partial<Chart>) => setChart({ ...chart, ...p })

  const rollInitial = (kind: 'cs' | 'en') => {
    const n = Math.floor(Math.random() * 10)
    if (kind === 'cs') patch({ combatSkill: 10 + n })
    else patch({ endurance: { current: 20 + n, max: 20 + n } })
  }

  return (
    <Sheet title={t('chart.title')} icon="📋" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* Combat Skill — MAI read-only definitivo. */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-gold)]">{t('chart.combatSkill')}</h3>
            <button
              className="touch rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm active:bg-[var(--color-line)]"
              onClick={() => rollInitial('cs')}
            >
              🎲 10 + (0–9)
            </button>
          </div>
          <Stepper value={chart.combatSkill} onChange={(v) => patch({ combatSkill: v })} hint={t('chart.csHint')} />
        </section>

        {/* Endurance — corrente e max, può salire o scendere a mano. */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-gold)]">{t('chart.endurance')}</h3>
            <button
              className="touch rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm active:bg-[var(--color-line)]"
              onClick={() => rollInitial('en')}
            >
              🎲 20 + (0–9)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label={t('chart.enduranceCurrent')}
              value={chart.endurance.current}
              onChange={(v) => patch({ endurance: { ...chart.endurance, current: v } })}
              warn={chart.endurance.current <= 0 ? t('chart.enduranceCritical') : undefined}
            />
            <Stepper
              label={t('chart.enduranceMax')}
              value={chart.endurance.max}
              onChange={(v) => patch({ endurance: { ...chart.endurance, max: v } })}
            />
          </div>
        </section>

        {/* Kai Disciplines — si scelgono con un tocco (in qualunque lingua sia
            scritta la voce); la lista sotto resta liberamente editabile per voci
            personalizzate (es. Magnakai) o correzioni a mano. */}
        <DisciplinePicker
          list={chart.kaiDisciplines}
          lang={lang}
          onChange={(kaiDisciplines) => patch({ kaiDisciplines })}
        />
        <EditableList
          title={t('chart.kaiList')}
          items={chart.kaiDisciplines}
          onChange={(kaiDisciplines) => patch({ kaiDisciplines })}
          addPlaceholder={t('chart.kaiPlaceholder')}
        />

        {/* Note libere — persistite nel playthrough, incluse in export/import
            e nella copia del personaggio su un altro libro. */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-2 font-semibold text-[var(--color-gold)]">📝 {t('chart.notes')}</h3>
          <textarea
            className="min-h-32 w-full resize-y rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] p-3 text-[var(--color-ink)]"
            value={notes}
            placeholder={t('chart.notesPlaceholder')}
            onChange={(e) => patchPlaythrough({ notes: e.target.value }, { debounce: true })}
          />
        </section>

        <p className="text-center text-xs text-[var(--color-ink)]/50">{t('chart.itemsNote')}</p>
      </div>
    </Sheet>
  )
}

/** Le 10 discipline Kai come pulsanti on/off, con la scelta dell'arma per Waffenkunde. */
function DisciplinePicker({
  list,
  lang,
  onChange,
}: {
  list: string[]
  lang: Lang
  onChange: (list: string[]) => void
}) {
  const t = useT()
  const known = KAI_DISCIPLINES.filter((d) => findDiscipline(list, d) >= 0).length
  const weaponskill = KAI_DISCIPLINES.find((d) => d.id === 'weaponskill')!
  const wsIndex = findDiscipline(list, weaponskill)
  const wsName = weaponskill.names[lang]
  const wsWeapon = wsIndex >= 0 ? list[wsIndex].split(/[:(]/)[1]?.replace(')', '').trim() : undefined

  const toggle = (i: number) => {
    const d = KAI_DISCIPLINES[i]
    const at = findDiscipline(list, d)
    if (at >= 0) onChange(list.filter((_, j) => j !== at))
    else onChange([...list, d.names[lang]])
  }

  const pickWeapon = (weapon: string) => {
    const next = [...list]
    next[wsIndex] = `${wsName}: ${weapon}`
    onChange(next)
  }

  return (
    <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="font-semibold text-[var(--color-gold)]">{t('chart.kai')}</h3>
        <span className={`text-xs ${known > 5 ? 'text-[var(--color-gold)]' : 'text-[var(--color-gold-dim)]'}`}>
          {t('chart.kaiPick', { n: known, max: 5 })}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {KAI_DISCIPLINES.map((d, i) => {
          const on = findDiscipline(list, d) >= 0
          return (
            <button
              key={d.id}
              aria-pressed={on}
              onClick={() => toggle(i)}
              className={`touch rounded-lg border px-2 text-sm leading-tight ${
                on
                  ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/15 font-semibold text-[var(--color-gold)]'
                  : 'border-[var(--color-line)] bg-[var(--color-panel-2)] text-[var(--color-ink)]/80'
              } active:bg-[var(--color-line)]`}
            >
              {on ? '✓ ' : ''}
              {d.names[lang]}
            </button>
          )
        })}
      </div>
      {wsIndex >= 0 && (
        <div className="mt-3">
          <p className="mb-2 text-sm text-[var(--color-ink)]/80">{t('chart.kaiWeapon', { name: wsName })}</p>
          <div className="flex flex-wrap gap-2">
            {WEAPONS.map((w) => {
              const name = w.names[lang]
              const on = wsWeapon?.toLowerCase() === name.toLowerCase()
              return (
                <button
                  key={w.id}
                  aria-pressed={on}
                  onClick={() => pickWeapon(name)}
                  className={`touch rounded-full border px-3 text-sm ${
                    on
                      ? 'border-[var(--color-gold)] bg-[var(--color-gold)]/15 font-semibold text-[var(--color-gold)]'
                      : 'border-[var(--color-line)] bg-[var(--color-panel-2)]'
                  } active:bg-[var(--color-line)]`}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
