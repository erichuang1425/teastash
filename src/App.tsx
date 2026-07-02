import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { I18nProvider } from './i18n'
import { AppDataProvider } from './contexts/AppDataContext'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { OnboardingProvider } from './contexts/OnboardingContext'
import { InstallProvider } from './contexts/InstallContext'
import { BottomNav } from './components/BottomNav'
import { OnboardingTour } from './components/OnboardingTour'
import Home from './pages/Home'
import Inventory from './pages/Inventory'
import TeaDetail from './pages/TeaDetail'
import TeaForm from './pages/TeaForm'
import UsageForm from './pages/UsageForm'
import History from './pages/History'
import Reminders from './pages/Reminders'
import Settings from './pages/Settings'
import Feedback from './pages/Feedback'
import Account from './pages/Account'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AppShell() {
  return (
    <div className="relative mx-auto min-h-svh w-full max-w-lg bg-cream sm:border-x sm:border-ink/[0.06] sm:shadow-[0_0_60px_rgba(40,61,46,0.06)]">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/new" element={<TeaForm />} />
        <Route path="/inventory/:id" element={<TeaDetail />} />
        <Route path="/inventory/:id/edit" element={<TeaForm />} />
        <Route path="/usage/new" element={<UsageForm />} />
        <Route path="/usage/:recordId/edit" element={<UsageForm />} />
        <Route path="/history" element={<History />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <BottomNav />
      <OnboardingTour />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <SupabaseAuthProvider>
          <AppDataProvider>
            <OnboardingProvider>
              <InstallProvider>
                <HashRouter>
                  <AppShell />
                </HashRouter>
              </InstallProvider>
            </OnboardingProvider>
          </AppDataProvider>
        </SupabaseAuthProvider>
      </ToastProvider>
    </I18nProvider>
  )
}
