"use client"

import { useEffect, useState } from "react"
import { db, type Product, type Sale } from "./db"

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        await db.init()
        const allProducts = await db.getAllProducts()
        setProducts(allProducts.sort((a, b) => b.createdAt - a.createdAt))
      } catch (error) {
        console.error("Error loading products:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const addProduct = async (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newProduct = await db.addProduct(product)
      setProducts((prev) => [newProduct, ...prev])
      return newProduct
    } catch (error) {
      console.error("Error adding product:", error)
      throw error
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await db.updateProduct(id, updates)
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      return updated
    } catch (error) {
      console.error("Error updating product:", error)
      throw error
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      await db.deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error("Error deleting product:", error)
      throw error
    }
  }

  const searchProducts = async (query: string) => {
    try {
      if (!query.trim()) {
        const allProducts = await db.getAllProducts()
        return allProducts.sort((a, b) => b.createdAt - a.createdAt)
      }
      return await db.searchProducts(query)
    } catch (error) {
      console.error("Error searching products:", error)
      return []
    }
  }

  return { products, loading, addProduct, updateProduct, deleteProduct, searchProducts }
}

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([])

  const addSale = async (sale: Omit<Sale, "id">) => {
    try {
      const newSale = await db.addSale(sale)
      setSales((prev) => [newSale, ...prev])
      return newSale
    } catch (error) {
      console.error("Error adding sale:", error)
      throw error
    }
  }

  const getSalesByMonth = async (year: number, month: number) => {
    try {
      return await db.getSalesByMonth(year, month)
    } catch (error) {
      console.error("Error getting sales:", error)
      return []
    }
  }

  return { sales, addSale, getSalesByMonth }
}
