import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { useAuthStore } from '@todo/store'

export function useRequireAuth() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    }
  }, [user, router])

  return user
}
