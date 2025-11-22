"use client"

import { useProducts } from "@/lib/hooks"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, ShoppingCart } from "lucide-react"

interface DashboardProps {
  onStartSale: () => void
}

export default function Dashboard({ onStartSale }: DashboardProps) {
  const { products, loading } = useProducts()

  // Get products expiring in next 30 days
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const expiringProducts = products.filter((p) => {
    if (!p.expiryDate) return false
    const expiryDate = new Date(p.expiryDate)
    return expiryDate >= now && expiryDate <= thirtyDaysFromNow
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-accent to-accent/80 text-accent-foreground">
          <h3 className="font-semibold mb-2">Produtos em Estoque</h3>
          <p className="text-3xl font-bold">{products.length}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-success to-success/80 text-success-foreground">
          <h3 className="font-semibold mb-2">Valor Total do Estoque</h3>
          <p className="text-3xl font-bold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0))}
          </p>
        </Card>
      </div>

      {expiringProducts.length > 0 && (
        <Card className="p-6 border-destructive/50 bg-destructive/10">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-3">Produtos Vencendo em 30 Dias</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {expiringProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center text-sm bg-background/50 p-2 rounded"
                  >
                    <span>{product.name}</span>
                    <span className="text-muted-foreground">
                      Vence em {new Date(product.expiryDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          onClick={onStartSale}
          size="lg"
          className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Iniciar Venda
        </Button>
      </div>
    </div>
  )
}
