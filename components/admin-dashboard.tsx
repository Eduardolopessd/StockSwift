"use client"

import type React from "react"

import { useState } from "react"
import { useProducts } from "@/lib/hooks"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogOut, Plus, Search, Trash2, Package, AlertCircle, Edit2, Save, X } from "lucide-react"
import type { Product } from "@/lib/db"

interface AdminDashboardProps {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { products, addProduct, deleteProduct, updateProduct, loading } = useProducts()
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.internalCode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      if (!formData.sku || !formData.name || !formData.expiryDate) {
        throw new Error("SKU, Nome e Validade são obrigatórios")
      }

      if (formData.costPrice <= 0 || formData.salePrice <= 0) {
        throw new Error("Preços devem ser maiores que zero")
      }

      if (editingId) {
        await updateProduct(editingId, formData)
        alert("Produto atualizado com sucesso!")
        setEditingId(null)
      } else {
        await addProduct({
          ...formData,
          internalCode: `GLOBAL_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        })
        alert("Produto global adicionado com sucesso!")
      }

      setFormData({
        sku: "",
        name: "",
        quantity: 0,
        costPrice: 0,
        salePrice: 0,
        expiryDate: "",
        description: "",
      })
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar produto")
    }
  }

  const handleEdit = (product: Product) => {
    setFormData({
      sku: product.sku,
      name: product.name,
      quantity: product.quantity,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      expiryDate: product.expiryDate,
      description: product.description || "",
    })
    setEditingId(product.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja remover "${name}"?`)) {
      await deleteProduct(id)
      alert("Produto removido com sucesso!")
    }
  }

  const handleCancel = () => {
    setFormData({
      sku: "",
      name: "",
      quantity: 0,
      costPrice: 0,
      salePrice: 0,
      expiryDate: "",
      description: "",
    })
    setEditingId(null)
    setShowAddForm(false)
    setError("")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-success" />
            <div>
              <h1 className="text-xl font-bold">Administração - StockSwift</h1>
              <p className="text-sm text-muted-foreground">Gerenciar Produtos Globais</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-gradient-to-br from-success/20 to-success/5">
            <p className="text-sm text-muted-foreground">Total de Produtos</p>
            <p className="text-3xl font-bold">{products.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-primary/20 to-primary/5">
            <p className="text-sm text-muted-foreground">Em Estoque</p>
            <p className="text-3xl font-bold">{products.filter((p) => p.quantity > 0).length}</p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-destructive/20 to-destructive/5">
            <p className="text-sm text-muted-foreground">Sem Estoque</p>
            <p className="text-3xl font-bold">{products.filter((p) => p.quantity === 0).length}</p>
          </Card>
        </div>

        {/* Search and Add */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome, SKU ou código interno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm)
              setEditingId(null)
              setError("")
            }}
            className="bg-success"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">{editingId ? "Editar Produto" : "Adicionar Novo Produto"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">SKU / Código de Barras *</label>
                  <Input
                    type="text"
                    placeholder="EAN ou código do produto"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nome do Produto *</label>
                  <Input
                    type="text"
                    placeholder="Ex: Água Mineral 500ml"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

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
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Preço de Custo (R$) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number.parseFloat(e.target.value) || 0 })}
                    required
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
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição (Opcional)</label>
                <textarea
                  placeholder="Informações adicionais"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-border rounded-lg bg-background"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-success flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? "Salvar Alterações" : "Adicionar"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Products List */}
        <Card className="p-4">
          <h2 className="text-lg font-bold mb-4">Produtos Cadastrados ({filteredProducts.length})</h2>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>SKU: {product.sku}</p>
                      <p>Código: {product.internalCode}</p>
                      <p>
                        Estoque: {product.quantity} | Custo: R$ {product.costPrice.toFixed(2)} | Venda: R${" "}
                        {product.salePrice.toFixed(2)}
                      </p>
                      <p>Validade: {new Date(product.expiryDate).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => handleEdit(product)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
