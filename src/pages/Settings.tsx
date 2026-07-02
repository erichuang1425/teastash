import { useRef, useState, type ReactNode } from 'react'
import {
  Globe,
  Download,
  Upload,
  FileSpreadsheet,
  RotateCcw,
  Trash2,
  HelpCircle,
  Smartphone,
  Info,
  ChevronRight,
  Check,
} from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useToast } from '../contexts/ToastContext'
import { useOnboarding } from '../contexts/OnboardingContext'
import { useInstall } from '../contexts/InstallContext'
import { useI18n, type Language } from '../i18n'
import { Card } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { InstallHelpModal } from '../components/InstallHelp'
import { buildBackup, downloadJson, parseBackupFile, triggerDownload } from '../lib/backup'
import { usageRecordsToCsv } from '../lib/csv'

function SettingsRow({
  icon: Icon,
  label,
  onClick,
  danger,
  right,
}: {
  icon: typeof Globe
  label: string
  onClick?: () => void
  danger?: boolean
  right?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full min-h-[52px] items-center gap-3 px-4 py-3 text-left disabled:opacity-60 ${danger ? 'text-red-600' : 'text-ink'}`}
    >
      <Icon size={18} className={danger ? 'text-red-500' : 'text-matcha'} />
      <span className="flex-1 text-[14.5px] font-medium">{label}</span>
      {right ?? (onClick && <ChevronRight size={16} className="text-ink/25" />)}
    </button>
  )
}

export default function Settings() {
  const { teas, usageRecords, importBackup, resetToSampleData, clearAllData } = useAppData()
  const { t, language, setLanguage } = useI18n()
  const { showToast } = useToast()
  const { restartTour } = useOnboarding()
  const { isStandalone, isIOS, canPromptNative, promptNativeInstall } = useInstall()
  const importInputRef = useRef<HTMLInputElement>(null)

  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installVariant, setInstallVariant] = useState<'ios' | 'generic'>('ios')

  const handleExportBackup = () => {
    const backup = buildBackup(teas, usageRecords)
    downloadJson(backup, `teastash-backup-${Date.now()}.json`)
    showToast(t('toast.backupExported'))
  }

  const handleExportCsv = () => {
    const teasById = new Map(teas.map((tea) => [tea.id, tea]))
    const csv = usageRecordsToCsv(usageRecords, teasById)
    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `teastash-usage-${Date.now()}.csv`)
    showToast(t('toast.csvExported'))
  }

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const backup = parseBackupFile(text)
      await importBackup(backup.teas, backup.usageRecords)
      showToast(t('toast.backupImported'))
    } catch {
      showToast(t('toast.invalidFile'))
    } finally {
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  const handleInstallClick = () => {
    if (canPromptNative) {
      promptNativeInstall()
      return
    }
    setInstallVariant(isIOS ? 'ios' : 'generic')
    setShowInstallModal(true)
  }

  return (
    <div className="pb-safe-nav">
      <header className="safe-top px-4 pt-5">
        <h1 className="text-[26px] font-bold text-ink">{t('settings.title')}</h1>
      </header>

      <div className="mt-4 space-y-5 px-4">
        <section>
          <h3 className="mb-2 px-1 text-[12.5px] font-semibold uppercase tracking-wide text-ink/40">
            {t('settings.language')}
          </h3>
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
                right={language === lang ? <Check size={18} className="text-matcha" /> : undefined}
              />
            ))}
          </Card>
        </section>

        <section>
          <h3 className="mb-2 px-1 text-[12.5px] font-semibold uppercase tracking-wide text-ink/40">
            {t('settings.dataSection')}
          </h3>
          <Card className="divide-y divide-ink/6 overflow-hidden">
            <SettingsRow icon={Download} label={t('settings.exportBackup')} onClick={handleExportBackup} />
            <SettingsRow icon={Upload} label={t('settings.importBackup')} onClick={() => importInputRef.current?.click()} />
            <SettingsRow icon={FileSpreadsheet} label={t('settings.exportCsv')} onClick={handleExportCsv} />
            <SettingsRow icon={RotateCcw} label={t('settings.resetDemoData')} onClick={() => setConfirmReset(true)} />
            <SettingsRow icon={Trash2} label={t('settings.clearAllData')} onClick={() => setConfirmClear(true)} danger />
          </Card>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
        </section>

        <section>
          <h3 className="mb-2 px-1 text-[12.5px] font-semibold uppercase tracking-wide text-ink/40">
            {t('settings.tourSection')}
          </h3>
          <Card className="overflow-hidden">
            <SettingsRow icon={HelpCircle} label={t('settings.restartTour')} onClick={restartTour} />
          </Card>
        </section>

        <section>
          <h3 className="mb-2 px-1 text-[12.5px] font-semibold uppercase tracking-wide text-ink/40">
            {t('settings.installSection')}
          </h3>
          <Card className="overflow-hidden">
            {isStandalone ? (
              <SettingsRow icon={Smartphone} label={t('settings.alreadyInstalled')} right={<Check size={18} className="text-matcha" />} />
            ) : (
              <SettingsRow icon={Smartphone} label={t('settings.addToHomeScreen')} onClick={handleInstallClick} />
            )}
          </Card>
        </section>

        <section>
          <h3 className="mb-2 px-1 text-[12.5px] font-semibold uppercase tracking-wide text-ink/40">
            {t('settings.aboutSection')}
          </h3>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Info size={18} className="mt-0.5 shrink-0 text-matcha" />
              <div>
                <p className="text-[13.5px] leading-relaxed text-ink/70">{t('settings.aboutBody')}</p>
                <p className="mt-2 text-[12px] text-ink/40">{t('settings.version')} 1.0.0</p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={t('settings.resetDemoData')}
        body={t('settings.resetDemoDataBody')}
        confirmLabel={t('common.reset')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await resetToSampleData()
          setConfirmReset(false)
          showToast(t('toast.dataReset'))
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title={t('settings.clearAllData')}
        body={t('settings.clearAllDataBody')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={async () => {
          await clearAllData()
          setConfirmClear(false)
          showToast(t('toast.dataCleared'))
        }}
      />

      <InstallHelpModal open={showInstallModal} onClose={() => setShowInstallModal(false)} variant={installVariant} />
    </div>
  )
}
