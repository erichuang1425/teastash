import { NavLink } from 'react-router-dom'
import { ChartNoAxesCombined, CupSoda, Settings } from 'lucide-react'
import { useI18n } from '../i18n'

const tabs = [
  { to: '/app', icon: CupSoda, labelKey: 'nav.drinks', end: true },
  { to: '/app/statistics', icon: ChartNoAxesCombined, labelKey: 'nav.statistics', end: false },
  { to: '/app/settings', icon: Settings, labelKey: 'nav.settings', end: false },
] as const

export function BottomNav() {
  const { t } = useI18n()
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-ink/10 bg-white/94 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {tabs.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[58px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold ${
                isActive ? 'text-roast' : 'text-ink/45'
              }`
            }
          >
            <Icon size={22} strokeWidth={2.1} />
            <span>{t(labelKey as never)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
