import { de } from './de'

// i18n leggero e tipizzato. L'app è solo in tedesco: un unico dizionario
// bundlato (niente rete, offline-first), chiavi verificate a compile-time.
// Interpolazione semplice con {segnaposto}. La struttura resta pronta per
// aggiungere lingue in futuro (Lang, dictionaries).

export type Lang = 'de'
export type TKey = keyof typeof de

export const LANGS: Lang[] = ['de']

export const dictionaries: Record<Lang, Record<TKey, string>> = { de }

/** Traduce una chiave con interpolazione {var}. */
export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let s = dictionaries[lang]?.[key] ?? dictionaries.de[key] ?? key
  if (vars) {
    for (const k of Object.keys(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]))
    }
  }
  return s
}

/** Lingua dell'interfaccia: sempre tedesco. */
export function detectLang(): Lang {
  return 'de'
}

export type TFunc = (key: TKey, vars?: Record<string, string | number>) => string

/** Locale BCP 47 per formattare date/ore nella lingua dell'interfaccia. */
export const LOCALES: Record<Lang, string> = { de: 'de-DE' }
