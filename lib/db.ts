export interface Product {
  id: string
  sku: string
  internalCode: string
  name: string
  quantity: number
  costPrice: number
  salePrice: number
  expiryDate: string
  description?: string
  image?: string
  createdAt: number
  updatedAt: number
}

export interface SaleItem {
  productId: string
  quantity: number
  salePrice: number
  costPrice: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  discount: number
  discountType: "fixed" | "percentage"
  total: number
  costOfGoodsSold: number
  createdAt: number
}

export interface BackupData {
  products: Product[]
  sales: Sale[]
  exportedAt: number
}

class StockSwiftDB {
  private dbName = "StockSwiftDB"
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains("products")) {
          const productStore = db.createObjectStore("products", { keyPath: "id" })
          productStore.createIndex("sku", "sku", { unique: true })
          productStore.createIndex("internalCode", "internalCode", { unique: true })
        }

        if (!db.objectStoreNames.contains("sales")) {
          db.createObjectStore("sales", { keyPath: "id" })
        }
      }
    })
  }

  async addProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const fullProduct: Product = {
      ...product,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["products"], "readwrite")
      const store = tx.objectStore("products")
      const request = store.add(fullProduct)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(fullProduct)
    })
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["products"], "readonly")
      const store = tx.objectStore("products")
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAllProducts(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["products"], "readonly")
      const store = tx.objectStore("products")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async searchProducts(query: string): Promise<Product[]> {
    const allProducts = await this.getAllProducts()
    const lowerQuery = query.toLowerCase()

    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery) ||
        p.internalCode.toLowerCase().includes(lowerQuery),
    )
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id)
    if (!product) throw new Error("Product not found")

    const updated: Product = {
      ...product,
      ...updates,
      updatedAt: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["products"], "readwrite")
      const store = tx.objectStore("products")
      const request = store.put(updated)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(updated)
    })
  }

  async deleteProduct(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["products"], "readwrite")
      const store = tx.objectStore("products")
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async addSale(sale: Omit<Sale, "id">): Promise<Sale> {
    const fullSale: Sale = {
      ...sale,
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }

    // Update product quantities
    for (const item of sale.items) {
      const product = await this.getProduct(item.productId)
      if (product) {
        await this.updateProduct(item.productId, {
          quantity: product.quantity - item.quantity,
        })
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["sales"], "readwrite")
      const store = tx.objectStore("sales")
      const request = store.add(fullSale)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(fullSale)
    })
  }

  async getAllSales(): Promise<Sale[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["sales"], "readonly")
      const store = tx.objectStore("sales")
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getSalesByMonth(year: number, month: number): Promise<Sale[]> {
    const allSales = await this.getAllSales()
    return allSales.filter((sale) => {
      const date = new Date(sale.createdAt)
      return date.getFullYear() === year && date.getMonth() === month
    })
  }

  async clearAllData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["products", "sales"], "readwrite")

      const clearProducts = tx.objectStore("products").clear()
      const clearSales = tx.objectStore("sales").clear()

      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  }

  async exportData(): Promise<BackupData> {
    const products = await this.getAllProducts()
    const sales = await this.getAllSales()

    return {
      products,
      sales,
      exportedAt: Date.now(),
    }
  }

  async importData(data: BackupData): Promise<void> {
    await this.clearAllData()

    const tx = this.db!.transaction(["products", "sales"], "readwrite")

    const productStore = tx.objectStore("products")
    for (const product of data.products) {
      productStore.add(product)
    }

    const saleStore = tx.objectStore("sales")
    for (const sale of data.sales) {
      saleStore.add(sale)
    }

    return new Promise((resolve, reject) => {
      tx.onerror = () => reject(tx.error)
      tx.oncomplete = () => resolve()
    })
  }
}

export const db = new StockSwiftDB()
