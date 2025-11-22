"use client"

import type React from "react"

import { useState } from "react"
import { useProducts } from "@/lib/hooks"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertCircle, Camera } from "lucide-react"

interface AddProductProps {
  onComplete: () => void
}

export default function AddProduct({ onComplete }: AddProductProps) {
  const { addProduct } = useProducts()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    quantity: 0,
    costPrice: 0,
    salePrice: 0,
    expiryDate: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!formData.sku || !formData.name || !formData.expiryDate) {
        throw new Error("SKU, Nome e Validade são obrigatórios")
      }

      if (formData.costPrice <= 0 || formData.salePrice <= 0) {
        throw new Error("Preços devem ser maiores que zero")
      }

      await addProduct({
        ...formData,
        internalCode: `INT_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      })

      // Reset form
      setFormData({
        sku: "",
        name: "",
        quantity: 0,
        costPrice: 0,
        salePrice: 0,
        expiryDate: "",
        description: "",
      })

      alert("Produto adicionado com sucesso!")
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar produto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">SKU / Código de Barras *</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="EAN ou código do produto"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
              <Button type="button" variant="outline" size="icon">
                <Camera className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nome do Produto *</label>
            <Input
              type="text"
              placeholder="Ex: Água Mineral Natural 500ml"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Quantidade Inicial</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Validade *</label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Preço de Custo (R$) *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Preço de Venda (R$) *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: Number.parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição (Opcional)</label>
            <textarea
              placeholder="Informações adicionais do produto"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-border rounded-lg bg-background"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full bg-success" disabled={loading}>
            {loading ? "Adicionando..." : "Adicionar Produto"}
          </Button>
        </form>
      </Card>

      <Card className="p-4 bg-accent/10">
        <p className="text-sm text-muted-foreground">
          O código interno será gerado automaticamente após adicionar o produto.
        </p>
      </Card>
    </div>
  )
}
