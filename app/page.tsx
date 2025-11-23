"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Menu, Plus, BarChart3, Settings, Package, Trash2, Wifi, WifiOff } from "lucide-react"
import Image from "next/image"
import Dashboard from "@/components/dashboard"
import ProductSearch from "@/components/product-search"
import AddProduct from "@/components/add-product"
import RemoveProduct from "@/components/remove-product"
import SalesScreen from "@/components/sales-screen"
import ReportScreen from "@/components/report-screen"
import SettingsScreen from "@/components/settings-screen"

type Screen = "dashboard" | "search" | "add" | "remove" | "sales" | "report" | "settings"

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard")
  const [menuOpen, setMenuOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    setIsLoading(false)

    const handleOnline = () => {
      console.log("[App] Online")
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log("[App] Offline")
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "SYNC_ONLINE") {
          console.log("[App] Dados sincronizados")
          setIsOnline(event.data.online)
        }
      })
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Image src="/logo.png" alt="StockSwift Logo" width={150} height={150} priority className="mb-4 mx-auto" />
          <p className="text-foreground/70">Carregando StockSwift...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-sidebar-border flex flex-col items-center gap-3">
            <Image src="/logo.png" alt="StockSwift Logo" width={80} height={80} className="object-contain" />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-sidebar-primary">StockSwift</h1>
              <p className="text-sm text-sidebar-foreground/70">Controle Offline</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <NavItem
              icon={<Package className="w-5 h-5" />}
              label="Buscar Produto"
              onClick={() => {
                setCurrentScreen("search")
                setMenuOpen(false)
              }}
              active={currentScreen === "search"}
            />
            <NavItem
              icon={<Plus className="w-5 h-5" />}
              label="Adicionar Produto"
              onClick={() => {
                setCurrentScreen("add")
                setMenuOpen(false)
              }}
              active={currentScreen === "add"}
            />
            <NavItem
              icon={<Trash2 className="w-5 h-5" />}
              label="Remover Produto"
              onClick={() => {
                setCurrentScreen("remove")
                setMenuOpen(false)
              }}
              active={currentScreen === "remove"}
            />
            <NavItem
              icon={<BarChart3 className="w-5 h-5" />}
              label="Relatório"
              onClick={() => {
                setCurrentScreen("report")
                setMenuOpen(false)
              }}
              active={currentScreen === "report"}
            />
            <NavItem
              icon={<Settings className="w-5 h-5" />}
              label="Configurações"
              onClick={() => {
                setCurrentScreen("settings")
                setMenuOpen(false)
              }}
              active={currentScreen === "settings"}
            />
          </nav>

          <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
            <p>v1.0.0 - Offline First</p>
          </div>
        </div>
      </div>

      {/* Overlay para fechar menu em mobile */}
      {menuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 p-4 bg-card border-b border-border md:pl-0">
          <button className="md:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setMenuOpen(!menuOpen)}>
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold flex-1 md:flex-none">
            {currentScreen === "dashboard" && "Dashboard"}
            {currentScreen === "search" && "Buscar Produto"}
            {currentScreen === "add" && "Adicionar Produto"}
            {currentScreen === "remove" && "Remover Produto"}
            {currentScreen === "sales" && "Venda (PDV)"}
            {currentScreen === "report" && "Relatório"}
            {currentScreen === "settings" && "Configurações"}
          </h2>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <Wifi className="w-4 h-4" />
                <span className="hidden sm:inline">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600 text-sm">
                <WifiOff className="w-4 h-4" />
                <span className="hidden sm:inline">Offline</span>
              </div>
            )}
            <button className="md:hidden p-2 hover:bg-muted rounded-lg" onClick={() => setCurrentScreen("dashboard")}>
              Home
            </button>
          </div>
        </header>

        {/* Screen Content */}
        <div className="flex-1 overflow-y-auto">
          {currentScreen === "dashboard" && <Dashboard onStartSale={() => setCurrentScreen("sales")} />}
          {currentScreen === "search" && <ProductSearch />}
          {currentScreen === "add" && <AddProduct onComplete={() => setCurrentScreen("search")} />}
          {currentScreen === "remove" && <RemoveProduct />}
          {currentScreen === "sales" && <SalesScreen onBack={() => setCurrentScreen("dashboard")} />}
          {currentScreen === "report" && <ReportScreen />}
          {currentScreen === "settings" && <SettingsScreen />}
        </div>
      </div>
    </div>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  active: boolean
}

function NavItem({ icon, label, onClick, active }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}
