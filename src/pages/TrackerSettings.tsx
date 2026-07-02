import { useState, type ReactNode } from 'react'
import { Check, ChevronRight, Cloud, Globe, LogOut, RefreshCw, Trash2, UserRound } from 'lucide-react'
import { useI18n, type Language } from '../i18n'
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext'
import { useDrinkData } from '../contexts/DrinkDataContext'
import { useToast } from '../contexts/ToastContext'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { ConfirmDialog } from '../components/ConfirmDialog'

function SettingsRow({
  icon: Icon,
  label,
  sublabel,
  right,
  danger,
  onClick,
}: {
  icon: typeof Globe
  label: string
  sublabel?: string
  right?: ReactNode
  danger?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full min-h-[58px] items-center gap-3 px-4 py-3 text-left disabled:opacity-80 ${
        danger ? 'text-red-600' : 'text-ink'
      }`}
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-red-50 text-red-600' : 'bg-cream text-roast'}`}>
        <Icon size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-black">{label}</span>
        {sublabel && <span className="mt-0.5 block truncate text-[13px] font-medium text-ink/42">{sublabel}</span>}
      </span>
      {right ?? (onClick ? <ChevronRight size={17} className="text-ink/22" /> : null)}
    </button>
  )
}

export default function TrackerSettings() {
  const { t, language, setLanguage } = useI18n()
  const { showToast } = useToast()
  const { user, signOut } = useSupabaseAuth()
  const { records, syncStatus, syncNow, clearAllDrinkRecords } = useDrinkData()
  const [confirmClear, setConfirmClear] = useState(false)
  const [isWorking, setIsWorking] = useState(false)

  const lastSyncedAt = syncStatus.lastSyncedAt
    ? new Intl.DateTimeFormat(language === 'zh-TW' ? 'zh-TW' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(syncStatus.lastSyncedAt))
    : t('settings.neverSynced')

  const syncLabel =
    syncStatus.state === 'syncing'
      ? t('settings.syncing')
      : syncStatus.state === 'synced'
        ? t('settings.synced')
        : syncStatus.state === 'error'
          ? t('settings.syncError')
          : syncStatus.state === 'disabled'
            ? t('settings.syncDisabled')
            : t('settings.ready')

  const logout = async () => {
    setIsWorking(true)
    try {
      await signOut()
      showToast(t('toast.signedOut'))
    } finally {
      setIsWorking(false)
    }
  }

  const clearRecords = async () => {
    setIsWorking(true)
    try {
      await clearAllDrinkRecords()
      showToast(t('toast.dataCleared'))
    } finally {
      setConfirmClear(false)
      setIsWorking(false)
    }
  }

  return (
    <div className="pb-safe-nav">
      <header className="safe-top px-5 pt-5">
        <h1 className="text-[42px] font-black leading-none text-ink">{t('settings.title')}</h1>
        <p className="mt-2 text-[15px] font-semibold text-ink/45">{t('settings.subtitle')}</p>
      </header>

      <div className="mt-6 space-y-6 px-5">
        <section>
          <h2 className="mb-2 px-1 text-[13px] font-black uppercase tracking-[0.16em] text-ink/35">{t('settings.accountSync')}</h2>
          <Card className="divide-y divide-ink/6 overflow-hidden">
            <SettingsRow icon={UserRound} label={user?.email ?? t('settings.signedIn')} sublabel={t('settings.signedInAs')} />
            <SettingsRow icon={Cloud} label={syncLabel} sublabel={`${t('settings.lastSynced')}: ${lastSyncedAt}`} />
            {syncStatus.error && <p className="px-4 pb-3 text-[13px] font-semibold text-red-600">{syncStatus.error}</p>}
          </Card>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button type="button" disabled={syncStatus.state === 'syncing' || isWorking} onClick={() => void syncNow()}>
              <RefreshCw size={18} /> {t('settings.syncNow')}
            </Button>
            <Button type="button" variant="ghost" disabled={isWorking} onClick={logout}>
              <LogOut size={18} /> {t('settings.logout')}
            </Button>
          </div>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-black uppercase tracking-[0.16em] text-ink/35">{t('settings.language')}</h2>
          <Card className="divide-y divide-ink/6 overflow-hidden">
            {(['en', 'zh-TW'] as Language[]).map((lang) => (
              <SettingsRow
                key={lang}
                icon={Globe}
                label={lang === 'en' ? t('settings.languageEnglish') : t('settings.languageZhTw')}
                onClick={() => {
                  setLanguage(lang)
                  showToast(t('toast.languageChanged'))
                }}
                right={language === lang ? <Check size={19} className="text-roast" /> : undefined}
              />
            ))}
          </Card>
        </section>

        <section>
          <h2 className="mb-2 px-1 text-[13px] font-black uppercase tracking-[0.16em] text-ink/35">{t('settings.dataSection')}</h2>
          <Card className="overflow-hidden">
            <SettingsRow
              icon={Trash2}
              label={t('settings.clearAllData')}
              sublabel={t('settings.recordCount', { count: records.length })}
              danger
              onClick={() => setConfirmClear(true)}
            />
          </Card>
        </section>
      </div>

      <ConfirmDialog
        open={confirmClear}
        title={t('settings.clearAllData')}
        body={t('settings.clearAllDataBody')}
        confirmLabel={t('common.delete')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearRecords}
      />
    </div>
  )
}
