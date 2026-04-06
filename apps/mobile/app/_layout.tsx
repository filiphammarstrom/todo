import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@todo/store'
import { SupabaseProvider, useSupabase } from '../src/context/SupabaseContext'

const queryClient = new QueryClient()

function AuthListener() {
  const supabase = useSupabase()
  const setSession = useAuthStore((s) => s.setSession)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [supabase, setSession])

  return null
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <AuthListener />
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="task/[id]"
            options={{ presentation: 'modal', title: 'Uppgift' }}
          />
          <Stack.Screen
            name="project/[id]"
            options={{ title: 'Projekt' }}
          />
          <Stack.Screen
            name="area/[id]"
            options={{ title: 'Område' }}
          />
        </Stack>
      </SupabaseProvider>
    </QueryClientProvider>
  )
}
