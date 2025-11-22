"use client"

import { useEffect, useState } from "react"
import { useProducts, useSales } from "@/lib/hooks"
import type { Product, SaleItem } from "@/lib/db"
import { Search, Plus, Minus, Trash2, Camera } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface SalesScreenProps {
  onBack: () => void
}

interface CartItem extends SaleItem {
  productId: string
  productName: string
}

export default function SalesScreen({ onBack }: SalesScreenProps) {
  const { products } = useProducts()
  const { addSale } = useSales()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [discountValue, setDiscountValue] = useState(0)
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed")
  const [useCostPrice, setUseCostPrice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const lowerQuery = searchQuery.toLowerCase()
    const results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery) ||
        p.internalCode.toLowerCase().includes(lowerQuery),
    )
    setSearchResults(results)
  }, [searchQuery, products])

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)

  const discount = discountType === "percentage" ? (subtotal * discountValue) / 100 : discountValue

  const total = Math.max(0, subtotal - discount)

  const costOfGoodsSold = cartItems.reduce((sum, item) => sum + item.costPrice * item.quantity, 0)

  // Add item to cart
  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }

      const salePrice = useCostPrice ? product.costPrice : product.salePrice

      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          salePrice,
          costPrice: product.costPrice,
        },
      ]
    })

    setSearchQuery("")
    setSearchResults([])
  }

  // Update quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find((p) => p.id === productId)
    if (product && newQuantity > product.quantity) {
      setError(`Apenas ${product.quantity} unidades disponíveis`)
      return
    }

    setCartItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity: newQuantity } : item)),
    )
    setError("")
  }

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  // Finalize sale
  const finalizeSale = async () => {
    if (cartItems.length === 0) {
      setError("Adicione produtos à venda")
      return
    }

    setLoading(true)
    setError("")

    try {
      await addSale({
        items: cartItems.map(({ productName, ...item }) => ({
          productId: item.productId,
          quantity: item.quantity,
          salePrice: item.salePrice,
          costPrice: item.costPrice,
        })),
        subtotal,
        discount,
        discountType,
        total,
        costOfGoodsSold,
        createdAt: Date.now(),
      })

      alert("Venda finalizada com sucesso!")
      setCartItems([])
      setDiscountValue(0)
      setUseCostPrice(false)
      onBack()
    } catch (err) {
      setError("Erro ao finalizar venda. Tente novamente.")
      console.error("Error finalizing sale:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Area */}
      <div className="p-4 border-b border-border bg-card space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <Camera className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-20 left-4 right-4 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="w-full text-left p-3 hover:bg-muted border-b border-border last:border-b-0 transition-colors"
              >
                <p className="font-semibold text-sm">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(useCostPrice ? product.costPrice : product.salePrice)}{" "}
                  - {product.quantity} und.
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {cartItems.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">Adicione produtos para iniciar a venda</Card>
        ) : (
          cartItems.map((item) => (
            <Card key={item.productId} className="p-3 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{item.productName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(item.salePrice)}
                    /und.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.productId)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.productId, Number.parseInt(e.target.value) || 0)}
                    className="w-16 text-center p-1 h-auto"
                  />
                  <Button variant="outline" size="sm" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-right font-semibold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.salePrice * item.quantity)}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Totals and Options */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-border bg-card space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={useCostPrice}
                onChange={(e) => setUseCostPrice(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Vender a preço de custo</span>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(subtotal)}
              </span>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">Desconto</label>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number.parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="flex-1"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")}
                    className="px-2 border border-border rounded-lg bg-background"
                  >
                    <option value="fixed">R$</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Final:</span>
                <span className="text-2xl font-bold text-success">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onBack} variant="outline" className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button
              onClick={finalizeSale}
              className="flex-1 bg-success text-success-foreground"
              disabled={loading || cartItems.length === 0}
            >
              {loading ? "Finalizando..." : "Finalizar Venda"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
