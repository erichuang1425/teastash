import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'

interface SupabaseAuthContextValue {
  client: SupabaseClient | null
  isConfigured: boolean
  isLoading: boolean
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null)

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => getSupabaseClient())
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!client) {
      setIsLoading(false)
      return undefined
    }

    let mounted = true

    client.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [client])

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error('supabase-not-configured')
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    [client],
  )

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!client) throw new Error('supabase-not-configured')
      const { error } = await client.auth.signUp({ email, password })
      if (error) throw error
    },
    [client],
  )

  const signOut = useCallback(async () => {
    if (!client) return
    const { error } = await client.auth.signOut()
    if (error) throw error
  }, [client])

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      client,
      isConfigured: isSupabaseConfigured,
      isLoading,
      session,
      user: session?.user ?? null,
      signIn,
      signUp,
      signOut,
    }),
    [client, isLoading, session, signIn, signOut, signUp],
  )

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>
}

export function useSupabaseAuth(): SupabaseAuthContextValue {
  const ctx = useContext(SupabaseAuthContext)
  if (!ctx) throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider')
  return ctx
}
