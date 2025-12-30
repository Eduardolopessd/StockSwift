import { NextResponse } from "next/server"

// In-memory storage for default products (in production, use a database)
let defaultProducts: any[] = []

export async function GET() {
  return NextResponse.json({ products: defaultProducts })
}

export async function POST(request: Request) {
  try {
    const { password, product } = await request.json()

    // Verify admin password
    if (password !== "r[dDbzPfQW") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (product) {
      // Add new default product
      const newProduct = {
        ...product,
        id: `default_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        isDefault: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      defaultProducts.push(newProduct)
      return NextResponse.json({ success: true, product: newProduct })
    }

    return NextResponse.json({ error: "No product provided" }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { password, productId } = await request.json()

    // Verify admin password
    if (password !== "r[dDbzPfQW") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    defaultProducts = defaultProducts.filter((p) => p.id !== productId)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
