// src/app/Authentication-supabase/lib/supabase/provider.tsx
'use client'

import createClient from './client'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

type SupabaseContext = {
  supabase: SupabaseClient
  session: Session | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
  session,
}: {
  children: ReactNode
  session: Session | null
}) {
  const [supabase] = useState<SupabaseClient>(createClient)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== localStorage.getItem('access_token')) {
        router.refresh()
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [supabase, router])

  return (
    <Context.Provider value={{ supabase, session }}>
      {children}
    </Context.Provider>
  )
}

export function useSupabase() {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}