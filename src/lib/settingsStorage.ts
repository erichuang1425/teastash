import type { AppSettings } from '../types'

const LANGUAGE_KEY = 'teastash.language'
const ONBOARDING_KEY = 'teastash.hasCompletedOnboarding'

function detectDefaultLanguage(): AppSettings['language'] {
  const langs = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
  for (const lang of langs) {
    const lower = lang.toLowerCase()
    if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-mo')) {
      return 'zh-TW'
    }
  }
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
