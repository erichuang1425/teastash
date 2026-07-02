import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { I18nProvider, useI18n } from './i18n'
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext'
import { DrinkDataProvider } from './contexts/DrinkDataContext'
import { ToastProvider } from './contexts/ToastContext'
import { BottomNav } from './components/BottomNav'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import TrackerDashboard from './pages/TrackerDashboard'
import DayDetail from './pages/DayDetail'
import AddDrink from './pages/AddDrink'
import Statistics from './pages/Statistics'
import TrackerSettings from './pages/TrackerSettings'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function AuthLoading() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-svh items-center justify-center bg-cream px-5 text-center text-[15px] font-semibold text-ink/55">
      {t('common.loading')}
    </div>
  )
}

function ProtectedAppShell() {
  const { user, isLoading } = useSupabaseAuth()

  if (isLoading) return <AuthLoading />
  if (!user) return <Navigate to="/" replace />

  return (
    <div className="relative mx-auto min-h-svh w-full max-w-lg bg-cream sm:border-x sm:border-ink/[0.06] sm:shadow-[0_0_60px_rgba(80,61,38,0.08)]">
      <Outlet />
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <ToastProvider>
        <SupabaseAuthProvider>
          <DrinkDataProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route element={<ProtectedAppShell />}>
                  <Route path="/app" element={<TrackerDashboard />} />
                  <Route path="/app/day/:date" element={<DayDetail />} />
                  <Route path="/app/drinks/new" element={<AddDrink />} />
                  <Route path="/app/drinks/:recordId/edit" element={<AddDrink />} />
                  <Route path="/app/statistics" element={<Statistics />} />
                  <Route path="/app/settings" element={<TrackerSettings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </DrinkDataProvider>
        </SupabaseAuthProvider>
      </ToastProvider>
    </I18nProvider>
  )
}
