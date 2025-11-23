"use client"

import { useEffect, useState } from "react"
import { db, type BackupData } from "@/lib/db"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Download, Upload, Moon, Sun, Trash2 } from "lucide-react"

export default function SettingsScreen() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")

  useEffect(() => {
    // Load theme preference
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light")
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  const applyTheme = (newTheme: "light" | "dark") => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("theme", newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  const handleBackup = async () => {
    setLoading(true)
    try {
      await db.init()
      const backupData = await db.exportData()
      const jsonString = JSON.stringify(backupData, null, 2)
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `stockswift_backup_${new Date().toISOString().split("T")[0]}.json`
      a.click()
      alert("Backup criado com sucesso!")
    } catch (error) {
      console.error("Error creating backup:", error)
      alert("Erro ao criar backup")
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    try {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"

      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return

        setLoading(true)
        try {
          const text = await file.text()
          const backupData: BackupData = JSON.parse(text)

          // Validate backup structure
          if (!backupData.products || !backupData.sales) {
            throw new Error("Arquivo de backup inválido")
          }

          await db.init()
          await db.importData(backupData)
          alert("Backup restaurado com sucesso! Recarregue a página.")
          window.location.reload()
        } catch (error) {
          console.error("Error restoring backup:", error)
          alert("Erro ao restaurar backup: " + (error instanceof Error ? error.message : "Desconhecido"))
        } finally {
          setLoading(false)
        }
      }

      input.click()
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleClearAllData = async () => {
    if (deleteConfirmText !== "APAGAR") {
      alert('Digite "APAGAR" para confirmar')
      return
    }

    if (!confirm("Tem certeza? Todos os dados serão permanentemente deletados!")) {
      return
    }

    setLoading(true)
    try {
      await db.init()
      await db.clearAllData()
      alert("Todos os dados foram deletados!")
      setShowDeleteConfirm(false)
      setDeleteConfirmText("")
      window.location.reload()
    } catch (error) {
      console.error("Error clearing data:", error)
      alert("Erro ao deletar dados")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Theme */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Aparência</h3>

        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {theme === "light" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-blue-400" />
            )}
            <div>
              <p className="font-medium">Modo {theme === "light" ? "Claro" : "Escuro"}</p>
              <p className="text-sm text-muted-foreground">
                {theme === "light" ? "Sistema em modo claro" : "Sistema em modo escuro"}
              </p>
            </div>
          </div>
          <Button onClick={toggleTheme} variant="outline" size="sm">
            Alterar
          </Button>
        </div>
      </Card>

      {/* Backup & Restore */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Backup e Restauração</h3>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Faça backup de todos os seus dados (produtos e vendas) em um arquivo JSON.
          </p>

          <Button onClick={handleBackup} disabled={loading} className="w-full bg-accent">
            <Download className="w-4 h-4 mr-2" />
            Fazer Backup
          </Button>

          <Button onClick={handleRestore} disabled={loading} variant="outline" className="w-full bg-transparent">
            <Upload className="w-4 h-4 mr-2" />
            Restaurar Backup
          </Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-lg">Gerenciamento de Dados</h3>

        {!showDeleteConfirm ? (
          <Button onClick={() => setShowDeleteConfirm(true)} variant="destructive" className="w-full">
            <Trash2 className="w-4 h-4 mr-2" />
            Apagar Todos os Dados
          </Button>
        ) : (
          <div className="space-y-4 p-4 bg-destructive/10 rounded-lg border border-destructive/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-semibold text-destructive mb-2">Confirmação Necessária</p>
                <p className="text-sm mb-4">
                  Esta ação é irreversível. Todos os produtos, vendas e relatórios serão permanentemente deletados.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2">Digite "APAGAR" para confirmar:</label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Digite APAGAR..."
                    className="w-full p-2 border border-border rounded-lg bg-background mb-4"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeleteConfirmText("")
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleClearAllData}
                    variant="destructive"
                    className="flex-1"
                    disabled={deleteConfirmText !== "APAGAR" || loading}
                  >
                    {loading ? "Deletando..." : "Deletar Tudo"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* About */}
      <Card className="p-6 space-y-2 text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">StockSwift v1.0.0</p>
        <p>Controle de Estoque Local</p>
      </Card>
    </div>
  )
}
