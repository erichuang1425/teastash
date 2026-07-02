import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile'
import { AlertCircle, Leaf, LogIn, UserPlus } from 'lucide-react'
import { useI18n } from '../i18n'
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext'
import { useToast } from '../contexts/ToastContext'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Field, inputClass } from '../components/form/Field'

interface AuthPageProps {
  mode: 'login' | 'register'
}

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim()

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { t } = useI18n()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const turnstileRef = useRef<TurnstileInstance | null>(null)
  const { isConfigured, isLoading, user, signIn, signUp } = useSupabaseAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isTurnstileEnabled = Boolean(turnstileSiteKey)

  useEffect(() => {
    setFormError(null)
    setMessage(null)
    setCaptchaToken(null)
    turnstileRef.current?.reset()
  }, [mode])

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-cream px-5 text-center text-[15px] font-semibold text-ink/55">
        {t('common.loading')}
      </div>
    )
  }

  if (user) return <Navigate to="/app" replace />

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      setFormError(t('auth.credentialsRequired'))
      return
    }

    if (isTurnstileEnabled && !captchaToken) {
      setFormError('Please complete the security check before continuing.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)
    setMessage(null)

    try {
      if (mode === 'login') {
        await signIn(trimmedEmail, password, captchaToken ?? undefined)
        showToast(t('toast.signedIn'))
        navigate('/app', { replace: true })
      } else {
        const result = await signUp(trimmedEmail, password, captchaToken ?? undefined)
        if (result.sessionActive) {
          showToast(t('toast.accountCreated'))
          navigate('/app', { replace: true })
        } else {
          setMessage(t('auth.confirmEmail', { email: result.email ?? trimmedEmail }))
        }
      }
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setIsSubmitting(false)
      setCaptchaToken(null)
      turnstileRef.current?.reset()
    }
  }

  const isRegister = mode === 'register'

  return (
    <main className="flex min-h-svh items-center justify-center bg-cream px-4 py-8 text-ink">
      <div className="w-full max-w-md">
        <Link to="/" className="mx-auto mb-6 flex w-fit items-center gap-2 text-[18px] font-black">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-roast text-white">
            <Leaf size={22} strokeWidth={2.1} />
          </span>
          {t('common.appName')}
        </Link>

        <Card className="p-5 sm:p-6">
          <h1 className="text-[30px] font-black text-ink">{isRegister ? t('auth.createTitle') : t('auth.loginTitle')}</h1>
          <p className="mt-2 text-[14.5px] leading-6 text-ink/55">
            {isRegister ? t('auth.createBody') : t('auth.loginBody')}
          </p>

          {!isConfigured && (
            <div className="mt-5 rounded-[22px] bg-amber-50 p-4 text-amber-900">
              <div className="flex gap-3">
                <AlertCircle size={19} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">{t('auth.notConfiguredTitle')}</p>
                  <p className="mt-1 text-[13.5px] leading-5">{t('auth.notConfiguredBody')}</p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-5 space-y-4" onSubmit={submit}>
            <Field label={t('auth.email')}>
              <input
                className={inputClass}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field>
            <Field label={t('auth.password')} error={formError ?? undefined}>
              <input
                className={inputClass}
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>

            {isTurnstileEnabled && (
              <div className="overflow-hidden rounded-[18px]">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken(null)}
                  onError={() => setCaptchaToken(null)}
                />
              </div>
            )}

            {message && <p className="rounded-[18px] bg-leaf/10 px-4 py-3 text-[13.5px] font-semibold leading-5 text-leaf">{message}</p>}
            <Button fullWidth disabled={!isConfigured || isSubmitting || (isTurnstileEnabled && !captchaToken)} type="submit">
              {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
              {isRegister ? t('auth.register') : t('auth.login')}
            </Button>
          </form>
        </Card>

        <p className="mt-5 text-center text-[14px] text-ink/55">
          {isRegister ? t('auth.haveAccount') : t('auth.needAccount')}{' '}
          <Link className="font-black text-roast" to={isRegister ? '/login' : '/register'}>
            {isRegister ? t('auth.login') : t('auth.register')}
          </Link>
        </p>
      </div>
    </main>
  )
}
