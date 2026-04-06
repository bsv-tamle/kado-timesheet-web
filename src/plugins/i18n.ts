import { createI18n } from 'vue-i18n'
import en from '../locales/en'
import vi from '../locales/vi'
import ja from '../locales/ja'

export const SUPPORTED_LOCALES = ['vi', 'en', 'ja'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

const STORAGE_KEY = 'kado_locale'

function getInitialLocale(): AppLocale {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED_LOCALES.includes(saved as AppLocale)) {
    return saved as AppLocale
  }
  return 'vi'
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en',
  messages: {
    vi,
    en,
    ja,
  },
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}

