import type { Lang } from '../i18n'

// Le 10 Discipline Kai della serie Kai (libri 1–5). Nel Libro 1 se ne scelgono 5;
// +1 per ogni libro successivo. Reso data-driven: l'utente le sceglie con un tocco
// nell'Action Chart (o le scrive a mano), l'app mostra solo un riferimento al numero
// atteso. I nomi seguono le edizioni: italiana, inglese (Project Aon) e tedesca
// (Mantikore, "Einsamer Wolf").

export interface Discipline {
  id: string
  names: Record<Lang, string>
}

export const KAI_DISCIPLINES: Discipline[] = [
  { id: 'camouflage', names: { de: 'Tarnung' } },
  { id: 'hunting', names: { de: 'Jagd' } },
  { id: 'sixth-sense', names: { de: 'Sechster Sinn' } },
  { id: 'tracking', names: { de: 'Spurensuche' } },
  { id: 'healing', names: { de: 'Heilung' } },
  { id: 'weaponskill', names: { de: 'Waffenkunde' } },
  { id: 'mindshield', names: { de: 'Gedankensperre' } },
  { id: 'mindblast', names: { de: 'Gedankenstrahl' } },
  { id: 'animal-kinship', names: { de: 'Tierverständnis' } },
  { id: 'mind-over-matter', names: { de: 'Geist über Materie' } },
]

/** Armi della tabella di Waffenkunde/Weaponskill (Libro 1), senza doppioni. */
export const WEAPONS: Array<{ id: string; names: Record<Lang, string> }> = [
  { id: 'dagger', names: { de: 'Dolch' } },
  { id: 'spear', names: { de: 'Speer' } },
  { id: 'mace', names: { de: 'Streitkolben' } },
  { id: 'short-sword', names: { de: 'Kurzschwert' } },
  { id: 'warhammer', names: { de: 'Kriegshammer' } },
  { id: 'sword', names: { de: 'Schwert' } },
  { id: 'axe', names: { de: 'Axt' } },
  { id: 'quarterstaff', names: { de: 'Kampfstab' } },
  { id: 'broadsword', names: { de: 'Breitschwert' } },
]

const norm = (s: string) => s.trim().toLowerCase()

/**
 * Indice della voce in `list` che corrisponde alla disciplina, in qualunque lingua.
 * Riconosce anche le varianti con l'arma, es. "Waffenkunde: Schwert".
 */
export function findDiscipline(list: string[], d: Discipline): number {
  const names = Object.values(d.names).map(norm)
  return list.findIndex((entry) => {
    const e = norm(entry)
    return names.some((n) => e === n || e.startsWith(n + ':') || e.startsWith(n + ' ('))
  })
}

/** Numero di discipline consigliato in base al numero del libro (1 = 5, poi +1). */
export function expectedDisciplines(bookNumber: number): number {
  return 5 + Math.max(0, bookNumber - 1)
}
