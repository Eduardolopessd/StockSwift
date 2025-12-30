"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AdminDashboard from "@/components/admin-dashboard"

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = localStorage.getItem("adminSession")
    if (session) {
      try {
        const sessionData = JSON.parse(session)
        if (sessionData.expiresAt > Date.now()) {
          setIsAuthenticated(true)
        } else {
          localStorage.removeItem("adminSession")
          router.push("/admin/login")
        }
      } catch {
        router.push("/admin/login")
      }
    } else {
      router.push("/admin/login")
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminSession")
    router.push("/admin/login")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <AdminDashboard onLogout={handleLogout} />
}
