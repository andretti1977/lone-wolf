import { create } from 'zustand'
import {
  db,
  type Playthrough,
  type ActionChart,
  type CombatState,
  type WarLogEntry,
} from './db'
import { detectLang, type Lang } from './i18n'

// ---------------------------------------------------------------------------
// Stato globale (Zustand). Sorgente di verità in-memory del playthrough attivo;
// ogni mutazione viene persistita su Dexie. La location del reader è persistita
// con debounce (vedi persist()/scheduleSave) per non scrivere ad ogni scroll.
// ---------------------------------------------------------------------------

export type PanelId =
  | 'number'
  | 'chart'
  | 'inventory'
  | 'warlog'
  | 'combat'
  | 'goto'
  | 'settings'
  | 'instructions'
  | null

interface AppState {
  view: 'library' | 'reader'
  bookId: number | null
  playthrough: Playthrough | null
  openPanel: PanelId
  darkMode: boolean
  fontSize: number // percentuale per il reader
  lightboxSrc: string | null // immagine aperta a tutto schermo (object URL)
  lang: Lang // lingua UI (solo tedesco)
  // Dati del nemico letti dal testo ("⚔️ Combatti"): precompilano il pannello
  // Nuovo combattimento, restano modificabili e vengono azzerati all'avvio.
  combatPrefill: { name: string; cs: number; en: number } | null

  // navigazione app
  openReader: (bookId: number, playthroughId: number) => Promise<void>
  goLibrary: () => void
  setPanel: (p: PanelId) => void
  toggleDark: () => void
  setFontSize: (f: number) => void
  openLightbox: (src: string) => void
  closeLightbox: () => void

  // mutazioni del playthrough (tutte persistono)
  patchPlaythrough: (patch: Partial<Playthrough>, opts?: { debounce?: boolean }) => void
  setActionChart: (chart: ActionChart) => void
  setCombat: (combat: CombatState | null) => void
  setLocation: (cfi: string) => void
  addWarLog: (entry: Omit<WarLogEntry, 'ts'>) => void
}

// --- Preferenze UI persistite in localStorage -----------------------------
// fontSize e darkMode sono impostazioni dell'app (non del playthrough): vanno
// salvate qui, altrimenti ogni riavvio della PWA le riporta ai default.
const LS_DARK = 'lupo-dark'
const LS_FONT = 'lupo-font'

function loadDark(): boolean {
  try {
    const v = localStorage.getItem(LS_DARK)
    return v == null ? true : v === '1'
  } catch {
    return true
  }
}

function loadFont(): number {
  try {
    const v = Number(localStorage.getItem(LS_FONT))
    return Number.isFinite(v) && v > 0 ? v : 100
  } catch {
    return 100
  }
}

function saveDark(dark: boolean) {
  try {
    localStorage.setItem(LS_DARK, dark ? '1' : '0')
  } catch {
    /* localStorage non disponibile: la preferenza resta solo in memoria */
  }
}

function saveFont(f: number) {
  try {
    localStorage.setItem(LS_FONT, String(f))
  } catch {
    /* idem */
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

async function persistNow(pt: Playthrough) {
  if (pt.id == null) return
  await db.playthroughs.put(pt)
}

function scheduleSave(pt: Playthrough, debounce: boolean) {
  if (!debounce) {
    void persistNow(pt)
    return
  }
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void persistNow(pt), 500)
}

export const useStore = create<AppState>((set, get) => ({
  view: 'library',
  bookId: null,
  playthrough: null,
  openPanel: null,
  darkMode: loadDark(),
  fontSize: loadFont(),
  lightboxSrc: null,
  lang: detectLang(),
  combatPrefill: null,

  openReader: async (bookId, playthroughId) => {
    const pt = await db.playthroughs.get(playthroughId)
    if (!pt) return
    set({ view: 'reader', bookId, playthrough: pt, openPanel: null })
  },

  goLibrary: () => set({ view: 'library', openPanel: null }),

  setPanel: (p) => set((s) => ({ openPanel: s.openPanel === p ? null : p })),

  toggleDark: () =>
    set((s) => {
      const darkMode = !s.darkMode
      saveDark(darkMode)
      return { darkMode }
    }),

  setFontSize: (f) => {
    const fontSize = Math.max(70, Math.min(180, f))
    saveFont(fontSize)
    set({ fontSize })
  },


  openLightbox: (src) =>
    set((s) => {
      // Revoca un eventuale URL precedente prima di sostituirlo (no leak).
      if (s.lightboxSrc && s.lightboxSrc.startsWith('blob:')) URL.revokeObjectURL(s.lightboxSrc)
      return { lightboxSrc: src }
    }),

  closeLightbox: () =>
    set((s) => {
      if (s.lightboxSrc && s.lightboxSrc.startsWith('blob:')) URL.revokeObjectURL(s.lightboxSrc)
      return { lightboxSrc: null }
    }),

  patchPlaythrough: (patch, opts) => {
    const cur = get().playthrough
    if (!cur) return
    const next: Playthrough = { ...cur, ...patch, updatedAt: Date.now() }
    set({ playthrough: next })
    scheduleSave(next, opts?.debounce ?? false)
  },

  setActionChart: (chart) => get().patchPlaythrough({ actionChart: chart }),

  setCombat: (combat) => get().patchPlaythrough({ activeCombat: combat }),

  setLocation: (cfi) => get().patchPlaythrough({ currentLocation: cfi }, { debounce: true }),

  addWarLog: (entry) => {
    const cur = get().playthrough
    if (!cur) return
    const full: WarLogEntry = { ...entry, ts: Date.now() }
    get().patchPlaythrough({ warLog: [...cur.warLog, full] })
  },
}))
