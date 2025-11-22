"use client"

import { useEffect, useState } from "react"
import { useProducts } from "@/lib/hooks"
import type { Product } from "@/lib/db"
import { Search, Camera, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function ProductSearch() {
  const { products, searchProducts } = useProducts()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Product[]>(products)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    const search = async () => {
      const searchResults = await searchProducts(query)
      setResults(searchResults)
    }
    search()
  }, [query, searchProducts])

  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} />
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por SKU, nome ou código..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Camera className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-2">
        {results.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            {query ? "Nenhum produto encontrado" : "Digite para buscar produtos"}
          </Card>
        ) : (
          results.map((product) => (
            <Card
              key={product.id}
              className="p-4 cursor-pointer hover:bg-muted transition-colors"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold">{product.name}</h4>
                  <div className="text-sm text-muted-foreground space-y-1 mt-1">
                    <p>SKU: {product.sku}</p>
                    <p>Código: {product.internalCode}</p>
                    <p>Estoque: {product.quantity} und.</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

interface ProductDetailProps {
  product: Product
  onBack: () => void
}

function ProductDetail({ product, onBack }: ProductDetailProps) {
  const { updateProduct, deleteProduct } = useProducts()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(product)

  const handleSave = async () => {
    try {
      await updateProduct(product.id, formData)
      setIsEditing(false)
    } catch (error) {
      console.error("Error saving product:", error)
    }
  }

  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja deletar este produto?")) {
      try {
        await deleteProduct(product.id)
        onBack()
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }

  return (
    <div className="p-4 space-y-4">
      <Button variant="outline" onClick={onBack}>
        Voltar
      </Button>

      <Card className="p-6 space-y-4">
        <h2 className="text-2xl font-bold">{product.name}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">SKU</label>
            {isEditing ? (
              <Input value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
            ) : (
              <p className="font-semibold">{product.sku}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Código Interno</label>
            <p className="font-semibold">{product.internalCode}</p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Quantidade</label>
            {isEditing ? (
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) })}
              />
            ) : (
              <p className="font-semibold">{product.quantity} und.</p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Validade</label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            ) : (
              <p className="font-semibold">{new Date(product.expiryDate).toLocaleDateString("pt-BR")}</p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Preço de Custo</label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number.parseFloat(e.target.value) })}
              />
            ) : (
              <p className="font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(product.costPrice)}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Preço de Venda</label>
            {isEditing ? (
              <Input
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: Number.parseFloat(e.target.value) })}
              />
            ) : (
              <p className="font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(product.salePrice)}
              </p>
            )}
          </div>
        </div>

        {product.description && (
          <div>
            <label className="text-sm text-muted-foreground">Descrição</label>
            {isEditing ? (
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border border-border rounded-lg bg-background"
              />
            ) : (
              <p>{product.description}</p>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex-1 bg-success">
                Salvar
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} className="flex-1">
                Editar
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="flex-1">
                Deletar
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}
