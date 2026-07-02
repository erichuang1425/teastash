import { Link, Navigate } from 'react-router-dom'
import { ChartNoAxesCombined, CupSoda, Leaf, ShieldCheck } from 'lucide-react'
import { useI18n } from '../i18n'
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext'

function ShowcaseCalendar() {
  const { t } = useI18n()
  const tiles = [
    { label: '12', tone: 'bg-leaf/12 text-leaf', icon: Leaf },
    { label: '13', tone: 'bg-tan text-roast', icon: CupSoda },
    { label: '14', tone: 'bg-white text-ink/35', icon: null },
    { label: '15', tone: 'bg-roast/12 text-roast', icon: ChartNoAxesCombined },
    { label: '16', tone: 'bg-white text-ink/35', icon: null },
    { label: '17', tone: 'bg-leaf/12 text-leaf', icon: Leaf },
  ]

  return (
    <div className="rounded-[32px] bg-white p-4 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-ink/35">{t('landing.previewTitle')}</p>
          <p className="mt-1 text-[22px] font-black text-ink">{t('empty.noDrinksShort')}</p>
        </div>
        <div className="rounded-full bg-cream px-3 py-1 text-[13px] font-bold text-roast">{t('landing.previewBadge')}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {tiles.map(({ label, tone, icon: Icon }) => (
          <div key={label} className={`aspect-square rounded-[22px] ${tone} flex flex-col items-center justify-center gap-1`}>
            {Icon ? <Icon size={25} strokeWidth={1.9} /> : <span className="text-[18px] font-black">{label}</span>}
            {Icon && <span className="text-[12px] font-black">{label}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Landing() {
  const { t } = useI18n()
  const { user, isLoading } = useSupabaseAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-cream px-5 text-center text-[15px] font-semibold text-ink/55">
        {t('common.loading')}
      </div>
    )
  }

  if (!isLoading && user) return <Navigate to="/app" replace />

  return (
    <main className="min-h-svh bg-cream text-ink">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-[18px] font-black text-ink">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-roast text-white">
            <Leaf size={22} strokeWidth={2.1} />
          </span>
          {t('common.appName')}
        </Link>
        <div className="flex items-center gap-2">
          <Link className="rounded-full px-4 py-2 text-[14px] font-bold text-roast" to="/login">
            {t('auth.login')}
          </Link>
          <Link className="rounded-full bg-roast px-4 py-2 text-[14px] font-bold text-white shadow-soft" to="/register">
            {t('auth.register')}
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-9 px-5 pb-12 pt-6 sm:grid-cols-[1.04fr_0.96fr] sm:px-8 sm:pb-20 sm:pt-12">
        <div>
          <p className="text-[13px] font-black uppercase tracking-[0.2em] text-roast/70">{t('landing.kicker')}</p>
          <h1 className="mt-4 max-w-xl text-[46px] font-black leading-[0.95] tracking-normal text-ink sm:text-[72px]">
            {t('landing.title')}
          </h1>
          <p className="mt-5 max-w-xl text-[18px] leading-8 text-ink/62">{t('landing.body')}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-roast px-6 text-[16px] font-black text-white shadow-card" to="/register">
              {t('landing.primaryCta')}
            </Link>
            <Link className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-roast/20 bg-white px-6 text-[16px] font-black text-roast" to="/login">
              {t('landing.secondaryCta')}
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { icon: CupSoda, label: t('landing.pointOne') },
              { icon: ChartNoAxesCombined, label: t('landing.pointTwo') },
              { icon: ShieldCheck, label: t('landing.pointThree') },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-2 rounded-[22px] bg-white/72 p-3 shadow-soft">
                <Icon size={18} className="mt-0.5 text-roast" />
                <p className="text-[13.5px] font-semibold leading-5 text-ink/66">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-[42px] bg-leaf/10" />
          <div className="relative rounded-[38px] bg-[#f8f5ee] p-4 shadow-[0_22px_70px_rgba(80,61,38,0.16)]">
            <ShowcaseCalendar />
            <div className="mt-4 rounded-[30px] bg-white p-5 shadow-soft">
              <p className="text-[13px] font-bold text-ink/45">{t('landing.showcaseLabel')}</p>
              <p className="mt-1 text-[30px] font-black text-roast">0 / 400 mg</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-cream">
                <div className="h-full w-0 rounded-full bg-roast" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
