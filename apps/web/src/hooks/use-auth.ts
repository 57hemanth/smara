"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"

interface UseAuthReturn {
  isAuthenticated: boolean
  userId: string | null
  isLoading: boolean
}

export function useAuth(redirectTo: string = "/login"): UseAuthReturn {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const storedUserId = localStorage.getItem("smara_user_id")
    const storedToken = localStorage.getItem("smara_token")
    
    if (storedUserId && storedToken) {
      setUserId(storedUserId)
      setIsAuthenticated(true)
      apiClient.setUserId(storedUserId)
      setIsLoading(false)
    } else {
      setIsLoading(false)
      router.push(redirectTo)
    }
  }, [router, redirectTo])

  return { isAuthenticated, userId, isLoading }
}

