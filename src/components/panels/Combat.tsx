import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../Sheet'
import { Stepper, TextField } from '../ui'
import { useStore } from '../../store'
import { useT } from '../../i18n/useT'
import type { TFunc } from '../../i18n'
import type { CombatState } from '../../db'
import { crtIsPopulated } from '../../data/crt'
import {
  combatRatio,
  proposeRound,
  newCombat,
  applyLoss,
  roundEntry,
  manualEntry,
  describeEntry,
  fmtRatio,
} from '../../utils/combat'

// ===========================================================================
// Helper di combattimento — ASSISTENTE, non giudice.
//  • Opera su una COPIA (CombatState). L'Action Chart non è mai toccata in auto.
//  • Sync col registro SOLO su click ("Aggiorna resistenza nel registro").
//  • Ogni valore (LW e nemico) è editabile a mano; le modifiche compaiono nello
//    storico come righe 'manual' con from→to (batch via debounce per non spammare).
//  • CRT scavalcabile: se non compilata, inserimento danni a mano.
//  • Fuga/abbandono sempre disponibili; si può uscire senza chiudere lo scontro.
// ===========================================================================

type FieldKey = 'lwEndurance' | 'lwCombatSkill' | 'enemyEndurance' | 'enemyCombatSkill'

const FIELD_META: Record<FieldKey, { target: 'lw' | 'enemy'; field: 'endurance' | 'combatSkill' }> = {
  lwEndurance: { target: 'lw', field: 'endurance' },
  lwCombatSkill: { target: 'lw', field: 'combatSkill' },
  enemyEndurance: { target: 'enemy', field: 'endurance' },
  enemyCombatSkill: { target: 'enemy', field: 'combatSkill' },
}

export function Combat({ onClose }: { onClose: () => void }) {
  const combat = useStore((s) => s.playthrough?.activeCombat ?? null)
  const chart = useStore((s) => s.playthrough?.actionChart ?? null)
  const setCombat = useStore((s) => s.setCombat)
  const setChart = useStore((s) => s.setActionChart)
  const addWarLog = useStore((s) => s.addWarLog)

  if (!combat) {
    return <StartCombat onClose={onClose} />
  }
  return (
    <ActiveCombat
      onClose={onClose}
      combat={combat}
      setCombat={setCombat}
      addWarLog={addWarLog}
      syncToChart={() => {
        if (!chart) return
        setChart({ ...chart, endurance: { ...chart.endurance, current: combat.lwEndurance } })
      }}
    />
  )
}

// --- Schermata di avvio -----------------------------------------------------

function StartCombat({ onClose }: { onClose: () => void }) {
  const t = useT()
  const chart = useStore((s) => s.playthrough?.actionChart ?? null)
  const setCombat = useStore((s) => s.setCombat)
  const addWarLog = useStore((s) => s.addWarLog)

  const prefill = useStore((s) => s.combatPrefill)
  const [importFromChart, setImportFromChart] = useState(true)
  const [enemyName, setEnemyName] = useState(prefill?.name ?? '')
  const [enemyCS, setEnemyCS] = useState(prefill?.cs ?? 0)
  const [enemyEN, setEnemyEN] = useState(prefill?.en ?? 0)
  const [lwCS, setLwCS] = useState(chart?.combatSkill ?? 0)
  const [lwEN, setLwEN] = useState(chart?.endurance.current ?? 0)

  const start = () => {
    const base = newCombat(chart, importFromChart)
    const state: CombatState = {
      ...base,
      enemyName: enemyName.trim() || t('combat.enemyDefault'),
      enemyCombatSkill: enemyCS,
      enemyEndurance: enemyEN,
      lwCombatSkill: importFromChart && chart ? chart.combatSkill : lwCS,
      lwEndurance: importFromChart && chart ? chart.endurance.current : lwEN,
    }
    setCombat(state)
    useStore.setState({ combatPrefill: null })
    addWarLog({ type: 'combat', text: t('combat.logStart', { name: state.enemyName }) })
  }

  return (
    <Sheet title={t('combat.newTitle')} icon="⚔️" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-2 font-semibold text-[var(--color-gold)]">{t('combat.lwData')}</h3>
          <label className="mb-3 flex items-center gap-3">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={importFromChart}
              onChange={(e) => setImportFromChart(e.target.checked)}
            />
            <span className="text-sm">{t('combat.importFromChart')}</span>
          </label>
          {!importFromChart && (
            <div className="grid grid-cols-2 gap-3">
              <Stepper label={t('chart.combatSkill')} value={lwCS} onChange={setLwCS} />
              <Stepper label={t('chart.endurance')} value={lwEN} onChange={setLwEN} />
            </div>
          )}
          {importFromChart && chart && (
            <p className="text-sm text-[var(--color-ink)]/60">
              {t('combat.fromChart', { cs: chart.combatSkill, en: chart.endurance.current })}
            </p>
          )}
        </section>

        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-2 font-semibold text-[var(--color-gold)]">{t('combat.enemyData')}</h3>
          <div className="flex flex-col gap-3">
            <TextField
              label={t('combat.name')}
              value={enemyName}
              onChange={setEnemyName}
              placeholder={t('combat.enemyNamePlaceholder')}
            />
            <div className="grid grid-cols-2 gap-3">
              <Stepper label={t('chart.combatSkill')} value={enemyCS} onChange={setEnemyCS} />
              <Stepper label={t('chart.endurance')} value={enemyEN} onChange={setEnemyEN} />
            </div>
          </div>
        </section>

        <button
          onClick={start}
          className="touch rounded-xl border border-[var(--color-gold-dim)] bg-[var(--color-panel-2)] px-6 py-3 text-lg font-semibold text-[var(--color-gold)] active:bg-[var(--color-line)]"
        >
          {t('combat.start')}
        </button>
        <p className="text-center text-xs text-[var(--color-ink)]/50">{t('combat.allEditableNote')}</p>
      </div>
    </Sheet>
  )
}

// --- Combattimento attivo ---------------------------------------------------

function ActiveCombat({
  onClose,
  combat,
  setCombat,
  addWarLog,
  syncToChart,
}: {
  onClose: () => void
  combat: CombatState
  setCombat: (c: CombatState | null) => void
  addWarLog: (e: { type: 'combat'; text: string }) => void
  syncToChart: () => void
}) {
  const t = useT()
  const ratio = combatRatio(combat.lwCombatSkill, combat.enemyCombatSkill, combat.lwBonus)
  const crtReady = crtIsPopulated()

  // --- logging debounced delle modifiche manuali (batch from→to) ---
  const lastLogged = useRef<Record<FieldKey, number>>({
    lwEndurance: combat.lwEndurance,
    lwCombatSkill: combat.lwCombatSkill,
    enemyEndurance: combat.enemyEndurance,
    enemyCombatSkill: combat.enemyCombatSkill,
  })
  const timers = useRef<Partial<Record<FieldKey, ReturnType<typeof setTimeout>>>>({})

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((t) => t && clearTimeout(t))
    }
  }, [])

  const setField = (key: FieldKey, value: number) => {
    setCombat({ ...useStore.getState().playthrough!.activeCombat!, [key]: value })
    if (timers.current[key]) clearTimeout(timers.current[key])
    timers.current[key] = setTimeout(() => {
      const cur = useStore.getState().playthrough?.activeCombat
      if (!cur) return
      const from = lastLogged.current[key]
      const to = cur[key] as number
      if (from === to) return
      const meta = FIELD_META[key]
      const entry = manualEntry(meta.target, meta.field, from, to)
      lastLogged.current[key] = to
      setCombat({ ...cur, history: [...cur.history, entry] })
      addWarLog({ type: 'combat', text: describeEntry(entry, t) })
    }, 1100)
  }

  const setBonus = (v: number) => setCombat({ ...combat, lwBonus: v })
  const setEnemyName = (v: string) => setCombat({ ...combat, enemyName: v })

  // --- round ---
  const [num, setNum] = useState<number | ''>('')
  const [manualLw, setManualLw] = useState(0)
  const [manualEnemy, setManualEnemy] = useState(0)
  const proposal = typeof num === 'number' ? proposeRound(combat, num) : null
  const usingManual = !crtReady || (proposal?.needsManual ?? true)

  const applyRound = () => {
    const cur = useStore.getState().playthrough?.activeCombat
    if (!cur) return
    const lwLoss = usingManual ? manualLw : proposal?.lwLoss ?? 0
    const enemyLoss = usingManual ? manualEnemy : proposal?.enemyLoss ?? 0
    const lwAfter = applyLoss(cur.lwEndurance, lwLoss)
    const enemyAfter = applyLoss(cur.enemyEndurance, enemyLoss)
    const entry = roundEntry(
      typeof num === 'number' ? num : null,
      ratio,
      lwLoss,
      enemyLoss,
      lwAfter,
      enemyAfter,
    )
    // Aggiorna le snapshot per non rilevare il round come modifica manuale.
    lastLogged.current.lwEndurance = lwAfter
    lastLogged.current.enemyEndurance = enemyAfter
    setCombat({ ...cur, lwEndurance: lwAfter, enemyEndurance: enemyAfter, history: [...cur.history, entry] })
    addWarLog({ type: 'combat', text: describeEntry(entry, t) })
    setNum('')
    setManualLw(0)
    setManualEnemy(0)
  }

  const sync = () => {
    const cur = useStore.getState().playthrough?.activeCombat
    if (!cur) return
    syncToChart()
    const entry = { kind: 'sync' as const, ts: Date.now() }
    setCombat({ ...cur, history: [...cur.history, entry] })
    addWarLog({ type: 'combat', text: describeEntry(entry, t) })
  }

  // --- fuga / fine ---
  const [evadeLoss, setEvadeLoss] = useState(0)
  const [evadeSection, setEvadeSection] = useState('')
  const evade = () => {
    const cur = useStore.getState().playthrough?.activeCombat
    if (!cur) return
    const lwAfter = applyLoss(cur.lwEndurance, evadeLoss)
    const entry = { kind: 'evade' as const, ts: Date.now(), lwLoss: evadeLoss, toSection: evadeSection || undefined }
    addWarLog({ type: 'combat', text: describeEntry(entry, t) })
    addWarLog({ type: 'combat', text: t('combat.logEvadeEnd', { name: cur.enemyName }) })
    // Aggiorna l'Endurance corrente nello scontro e chiude lo scontro.
    setCombat({ ...cur, lwEndurance: lwAfter, open: false, history: [...cur.history, entry] })
    finish('fled')
  }

  const finish = (outcome: 'won' | 'fled' | 'lw-down' | 'closed') => {
    const cur = useStore.getState().playthrough?.activeCombat
    if (!cur) return
    if (outcome !== 'fled') {
      const outMap = {
        won: t('clog.outcomeWon'),
        fled: t('clog.outcomeFled'),
        'lw-down': t('clog.outcomeLwDown'),
        closed: t('clog.outcomeClosed'),
      } as const
      addWarLog({ type: 'combat', text: t('combat.logEnd', { name: cur.enemyName, outcome: outMap[outcome] }) })
    }
    setCombat(null) // chiude lo scontro; il war log conserva il riassunto
    // Chiude il pannello e torna al reader (pagina da cui si era aperto il
    // combattimento): NON ricade nella schermata "Nuovo combattimento".
    onClose()
  }

  const history = [...combat.history].reverse()

  return (
    <Sheet
      title={t('combat.title', { name: combat.enemyName })}
      icon="⚔️"
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <button
            className="touch flex-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm active:bg-[var(--color-line)]"
            onClick={onClose}
          >
            {t('combat.exitResume')}
          </button>
          <button
            className="touch flex-1 rounded-lg border border-[var(--color-gold-dim)] bg-[var(--color-panel-2)] px-3 text-sm font-semibold text-[var(--color-gold)] active:bg-[var(--color-line)]"
            onClick={() => finish('won')}
          >
            {t('combat.finish')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Stato corrente */}
        <div className="grid grid-cols-2 gap-3">
          <Combatant
            t={t}
            title={t('combat.lwName')}
            en={combat.lwEndurance}
            cs={combat.lwCombatSkill}
            onEn={(v) => setField('lwEndurance', v)}
            onCs={(v) => setField('lwCombatSkill', v)}
          />
          <Combatant
            t={t}
            title={combat.enemyName || t('combat.enemyDefault')}
            en={combat.enemyEndurance}
            cs={combat.enemyCombatSkill}
            onEn={(v) => setField('enemyEndurance', v)}
            onCs={(v) => setField('enemyCombatSkill', v)}
            nameValue={combat.enemyName}
            onName={setEnemyName}
          />
        </div>

        {(combat.lwEndurance <= 0 || combat.enemyEndurance <= 0) && (
          <div className="rounded-lg border border-[var(--color-blood)] bg-[var(--color-blood)]/10 px-3 py-2 text-sm">
            {combat.enemyEndurance <= 0 && t('combat.enemyDown')}
            {combat.lwEndurance <= 0 && t('combat.lwDown')}
            {t('combat.decide')}
          </div>
        )}

        {/* Combat Ratio + bonus */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-semibold text-[var(--color-gold)]">{t('combat.ratio')}</h3>
            <span className="text-2xl font-bold text-[var(--color-gold)]">{fmtRatio(ratio)}</span>
          </div>
          <Stepper label={t('combat.bonus')} value={combat.lwBonus} onChange={setBonus} />
        </section>

        {/* Round */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-2 font-semibold text-[var(--color-gold)]">{t('combat.round')}</h3>
          <div className="mb-3 flex items-end gap-2">
            <div className="flex-1">
              <Stepper
                label={t('combat.drawnNumber')}
                value={typeof num === 'number' ? num : 0}
                onChange={(v) => setNum(Math.max(0, Math.min(9, v)))}
              />
            </div>
            <button
              className="touch rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 text-sm active:bg-[var(--color-line)]"
              onClick={() => setNum(Math.floor(Math.random() * 10))}
            >
              🎲 {t('combat.drawBtn')}
            </button>
          </div>

          {!crtReady && (
            <p className="mb-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-panel-2)] px-3 py-2 text-xs text-[var(--color-gold-dim)]">
              {t('combat.crtMissing')}
            </p>
          )}

          {usingManual ? (
            <div className="grid grid-cols-2 gap-3">
              <Stepper label={t('combat.lwLoss')} value={manualLw} onChange={setManualLw} />
              <Stepper label={t('combat.enemyLoss')} value={manualEnemy} onChange={setManualEnemy} />
            </div>
          ) : (
            <p className="text-sm text-[var(--color-ink)]/70">
              {t('combat.crtProposal', {
                lw: isFinite(proposal?.lwLoss ?? 0) ? `−${proposal?.lwLoss}` : t('combat.death'),
                enemy: isFinite(proposal?.enemyLoss ?? 0) ? `−${proposal?.enemyLoss}` : t('combat.death'),
              })}
            </p>
          )}

          <button
            className="touch mt-3 w-full rounded-lg border border-[var(--color-gold-dim)] bg-[var(--color-panel-2)] px-4 py-2 font-semibold text-[var(--color-gold)] active:bg-[var(--color-line)]"
            onClick={applyRound}
          >
            {t('combat.applyRound')}
          </button>
        </section>

        {/* Sync */}
        <button
          className="touch w-full rounded-lg border border-[var(--color-gold)] bg-[var(--color-panel-2)] px-4 py-3 font-semibold text-[var(--color-gold)] active:bg-[var(--color-line)]"
          onClick={sync}
        >
          {t('combat.sync')}
        </button>

        {/* Fuga */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-2 font-semibold text-[var(--color-gold)]">{t('combat.evadeTitle')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <Stepper label={t('combat.evadeLoss')} value={evadeLoss} onChange={setEvadeLoss} />
            <TextField label={t('combat.evadeSection')} value={evadeSection} onChange={setEvadeSection} placeholder="es. 217" />
          </div>
          <button
            className="touch mt-3 w-full rounded-lg border border-[var(--color-blood)] px-4 py-2 font-semibold text-[var(--color-ink)] active:bg-[var(--color-blood)]/20"
            onClick={evade}
          >
            {t('combat.evadeBtn')}
          </button>
        </section>

        {/* Storico-diario */}
        <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
          <h3 className="mb-2 font-semibold text-[var(--color-gold)]">{t('combat.historyTitle')}</h3>
          <ul className="flex flex-col gap-1">
            {history.map((e, i) => (
              <li key={i} className="text-sm text-[var(--color-ink)]/80">
                • {describeEntry(e, t)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-[var(--color-ink)]/40">{t('combat.historyNote')}</p>
        </section>
      </div>
    </Sheet>
  )
}

function Combatant({
  t,
  title,
  en,
  cs,
  onEn,
  onCs,
  nameValue,
  onName,
}: {
  t: TFunc
  title: string
  en: number
  cs: number
  onEn: (v: number) => void
  onCs: (v: number) => void
  nameValue?: string
  onName?: (v: string) => void
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-3">
      {onName ? (
        <input
          className="mb-2 w-full bg-transparent font-semibold text-[var(--color-gold)] outline-none"
          value={nameValue ?? ''}
          onChange={(e) => onName(e.target.value)}
        />
      ) : (
        <h3 className="mb-2 font-semibold text-[var(--color-gold)]">{title}</h3>
      )}
      <div className="flex flex-col gap-2">
        <Stepper label={t('chart.endurance')} value={en} onChange={onEn} />
        <Stepper label={t('chart.combatSkill')} value={cs} onChange={onCs} />
      </div>
    </div>
  )
}
