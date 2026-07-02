import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import en, { type Dictionary } from './en'
import zhTW from './zh-TW'
import { loadLanguage, saveLanguage } from '../lib/settingsStorage'

export type Language = 'en' | 'zh-TW'

const dictionaries: Record<Language, Dictionary> = { en, 'zh-TW': zhTW}

type Path<T, Prefix extends string = ''> = T extends string
  ? never
  : {
      [K in keyof T & string]: T[K] extends string
        ? `${Prefix}${K}`
        : Path<T[K], `${Prefix}${K}.`>
    }[keyof T & string]

export type TranslationKey = Path<Dictionary>

function resolve(dict: Dictionary, path: string): string {
  const parts = path.split('.')
  let cur: unknown = dict
  for (const part of parts) {
    if (typeof cur !== 'object' || cur === null) return path
    cur = (cur as Record<string, unknown>)[part]
  }
  return typeof cur === 'string' ? cur : path
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_match, key) => (key in vars ? String(vars[key]) : `{{${key}}}`))
}

interface I18nContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => loadLanguage())

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[language]
    const setLanguage = (lang: Language) => {
      setLanguageState(lang)
      saveLanguage(lang)
    }
    return {
      language,
      setLanguage,
      t: (key, vars) => interpolate(resolve(dict, key), vars),
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
