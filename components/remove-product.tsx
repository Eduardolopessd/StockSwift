"use client"

import { useEffect, useState } from "react"
import { useProducts } from "@/lib/hooks"
import type { Product } from "@/lib/db"
import { Search, Trash2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function RemoveProduct() {
  const { products, searchProducts, deleteProduct } = useProducts()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>(products)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [confirmText, setConfirmText] = useState("")

  useEffect(() => {
    const search = async () => {
      const searchResults = await searchProducts(query)
      setResults(searchResults)
    }
    search()
  }, [query, searchProducts])

  const handleDelete = async () => {
    if (confirmText !== "APAGAR") {
      alert('Digite "APAGAR" para confirmar')
      return
    }

    try {
      await deleteProduct(selectedProduct!.id)
      setSelectedProduct(null)
      setConfirmText("")
      alert("Produto removido com sucesso!")
    } catch (error) {
      console.error("Error deleting product:", error)
    }
  }

  if (selectedProduct) {
    return (
      <div className="p-4 space-y-4">
        <Button variant="outline" onClick={() => setSelectedProduct(null)}>
          Voltar
        </Button>

        <Card className="p-6 border-destructive/50 bg-destructive/10">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-destructive mb-4">Confirmar Exclusão</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-muted-foreground">Produto</label>
                  <p className="font-semibold">{selectedProduct.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">SKU</label>
                    <p className="font-semibold">{selectedProduct.sku}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Estoque</label>
                    <p className="font-semibold">{selectedProduct.quantity} und.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Digite "APAGAR" para confirmar</label>
                <Input
                  type="text"
                  placeholder="Digite APAGAR..."
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="mb-4"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setSelectedProduct(null)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="flex-1"
                  disabled={confirmText !== "APAGAR"}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar Produto
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar produto para remover..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-2">
        {results.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {query ? "Nenhum produto encontrado" : "Digite para buscar produtos"}
          </Card>
        ) : (
          results.map((product) => (
            <Card key={product.id} className="p-4 flex items-center justify-between hover:bg-muted transition-colors">
              <div>
                <h4 className="font-semibold">{product.name}</h4>
                <p className="text-sm text-muted-foreground">{product.sku}</p>
              </div>
              <Button onClick={() => setSelectedProduct(product)} variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
