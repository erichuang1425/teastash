import { NavLink } from 'react-router-dom'
import { Home, Package, Bell, BarChart3, Settings } from 'lucide-react'
import { useI18n } from '../i18n'

const tabs = [
  { to: '/', icon: Home, labelKey: 'nav.home', end: true },
  { to: '/inventory', icon: Package, labelKey: 'nav.inventory', end: false },
  { to: '/history', icon: BarChart3, labelKey: 'nav.history', end: false },
  { to: '/reminders', icon: Bell, labelKey: 'nav.reminders', end: false },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings', end: false },
] as const

export function BottomNav() {
  const { t } = useI18n()
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 border-t border-ink/10 bg-white/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {tabs.map(({ to, icon: Icon, labelKey, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? 'text-matcha' : 'text-ink/45'
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
