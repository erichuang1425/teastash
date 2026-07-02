import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Cloud, LogIn, LogOut, RefreshCw, UserPlus } from 'lucide-react'
import { useI18n } from '../i18n'
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext'
import { useAppData } from '../contexts/AppDataContext'
import { useToast } from '../contexts/ToastContext'
import { TopBar } from '../components/TopBar'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Field, inputClass } from '../components/form/Field'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export default function Account() {
  const { t, language } = useI18n()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const { isConfigured, isLoading, user, signIn, signUp, signOut } = useSupabaseAuth()
  const { syncStatus, syncNow } = useAppData()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const lastSyncedAt = syncStatus.lastSyncedAt
    ? new Intl.DateTimeFormat(language === 'zh-TW' ? 'zh-TW' : 'en', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(syncStatus.lastSyncedAt))
    : t('account.neverSynced')

  const syncLabel =
    syncStatus.state === 'syncing'
      ? t('account.statusSyncing')
      : syncStatus.state === 'synced'
        ? t('account.statusSynced')
        : syncStatus.state === 'error'
          ? t('account.statusError')
          : syncStatus.state === 'signedOut'
            ? t('account.statusGuest')
            : syncStatus.state === 'disabled'
              ? t('account.statusDisabled')
              : t('account.statusIdle')

  const requireFields = () => {
    if (!email.trim() || !password) {
      setFormError(t('account.credentialsRequired'))
      return false
    }
    setFormError(null)
    return true
  }

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!requireFields()) return
    setIsSubmitting(true)
    try {
      await signIn(email.trim(), password)
      showToast(t('toast.signedIn'))
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignUp = async () => {
    if (!requireFields()) return
    setIsSubmitting(true)
    try {
      await signUp(email.trim(), password)
      showToast(t('toast.accountCreated'))
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    setIsSubmitting(true)
    try {
      await signOut()
      showToast(t('toast.signedOut'))
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="pb-safe-nav">
      <TopBar title={t('account.title')} showBack />

      <div className="space-y-4 px-4 pt-4">
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Cloud size={20} className="mt-0.5 shrink-0 text-matcha" />
            <div className="min-w-0 flex-1">
              <h1 className="text-[20px] font-bold text-ink">{t('account.heading')}</h1>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink/60">{t('account.body')}</p>
            </div>
          </div>
        </Card>

        {!isConfigured && (
          <Card className="space-y-3 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-700" />
              <div>
                <h2 className="text-[15px] font-bold text-ink">{t('account.notConfiguredTitle')}</h2>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink/60">{t('account.notConfiguredBody')}</p>
              </div>
            </div>
            <div className="rounded-2xl bg-cream/70 p-3 text-[12.5px] font-mono leading-6 text-ink/70">
              VITE_SUPABASE_URL
              <br />
              VITE_SUPABASE_PUBLISHABLE_KEY
            </div>
          </Card>
        )}

        {isConfigured && isLoading && <Card className="p-4 text-[14px] text-ink/60">{t('common.loading')}</Card>}

        {isConfigured && !isLoading && !user && (
          <form className="space-y-4" onSubmit={handleSignIn}>
            <Card className="space-y-4 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-matcha" />
                <p className="text-[13.5px] leading-relaxed text-ink/60">{t('account.guestBody')}</p>
              </div>

              <Field label={t('account.emailLabel')}>
                <input
                  className={inputClass}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field label={t('account.passwordLabel')} error={formError ?? undefined}>
                <input
                  className={inputClass}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Field>
            </Card>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button type="submit" disabled={isSubmitting}>
                <LogIn size={18} /> {t('account.signIn')}
              </Button>
              <Button type="button" variant="secondary" disabled={isSubmitting} onClick={handleSignUp}>
                <UserPlus size={18} /> {t('account.createAccount')}
              </Button>
            </div>
            <Button type="button" variant="ghost" fullWidth onClick={() => navigate('/settings')}>
              {t('account.continueAsGuest')}
            </Button>
          </form>
        )}

        {isConfigured && !isLoading && user && (
          <>
            <Card className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-matcha" />
                <div className="min-w-0">
                  <p className="text-[13px] text-ink/50">{t('account.signedInAs')}</p>
                  <p className="truncate text-[15px] font-semibold text-ink">{user.email}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-cream/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-ink/50">{t('account.syncStatus')}</span>
                  <span className="text-[13.5px] font-semibold text-ink">{syncLabel}</span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[13px] text-ink/50">{t('account.lastSynced')}</span>
                  <span className="text-right text-[13.5px] text-ink/70">{lastSyncedAt}</span>
                </div>
                {syncStatus.error && <p className="mt-2 text-[12.5px] text-red-600">{syncStatus.error}</p>}
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button type="button" disabled={syncStatus.state === 'syncing'} onClick={() => void syncNow()}>
                <RefreshCw size={18} /> {t('account.syncNow')}
              </Button>
              <Button type="button" variant="ghost" disabled={isSubmitting} onClick={handleSignOut}>
                <LogOut size={18} /> {t('account.signOut')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
