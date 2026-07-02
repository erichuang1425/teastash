import type { AppSettings } from '../types'

const LANGUAGE_KEY = 'teastash.language'
const ONBOARDING_KEY = 'teastash.hasCompletedOnboarding'

const TRADITIONAL_CHINESE_REGIONS = new Set(['TW', 'HK', 'MO'])
const TRADITIONAL_CHINESE_TIME_ZONES = new Set(['Asia/Taipei', 'Asia/Hong_Kong', 'Asia/Macau'])

function regionFromLocale(locale: string): string | null {
  try {
    const parsed = new Intl.Locale(locale)
    return parsed.region?.toUpperCase() ?? null
  } catch {
    const match = locale.match(/[-_]([a-z]{2}|\d{3})(?:[-_]|$)/i)
    return match?.[1]?.toUpperCase() ?? null
  }
}

function detectDefaultLanguage(): AppSettings['language'] {
  const browserLangs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
  const intlLocale = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().locale : ''
  const timeZone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : ''
  const langs = [...browserLangs, intlLocale].filter(Boolean)

  for (const lang of langs) {
    const lower = lang.toLowerCase()
    const region = regionFromLocale(lang)
    if (lower.startsWith('zh') || (region && TRADITIONAL_CHINESE_REGIONS.has(region))) {
      return 'zh-TW'
    }
  }

  if (TRADITIONAL_CHINESE_TIME_ZONES.has(timeZone)) return 'zh-TW'

  return 'en'
}

export function loadLanguage(): AppSettings['language'] {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  if (stored === 'en' || stored === 'zh-TW') return stored
  return detectDefaultLanguage()
}

export function saveLanguage(language: AppSettings['language']): void {
  localStorage.setItem(LANGUAGE_KEY, language)
}

export function loadHasCompletedOnboarding(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === 'true'
}

export function saveHasCompletedOnboarding(value: boolean): void {
  localStorage.setItem(ONBOARDING_KEY, value ? 'true' : 'false')
}
