"use server"

import { createClient } from "@/lib/supabase/server"
import { LAC_SUB_UNITS_FOR_SUM } from "@/lib/constants"

interface ProductQuantity {
  productId: string
  quantity: string
}

interface CleaningInventory {
  id?: number
  device: string
  products: ProductQuantity[]
  reported_by: string
  date: string
  created_at?: string
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1500): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("503") ||
          error.message.includes("schema cache") ||
          error.message.includes("PGRST002") ||
          error.message.includes("Failed to fetch"))

      if (isRetryable && attempt < maxRetries) {
        console.log(`[v0] Retry ${attempt}/${maxRetries} after transient error...`)
        await new Promise((r) => setTimeout(r, delayMs * attempt))
        continue
      }
      throw error
    }
  }
  throw new Error("Max retries reached")
}

export async function getLatestInventory(device: string) {
  try {
    return await withRetry(async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("cleaning_inventories")
        .select("products, created_at")
        .eq("device", device)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return { success: true as const, quantities: {} as Record<string, string>, createdAt: null }
        }
        if (error.message?.includes("schema cache") || error.code === "PGRST002") {
          throw new Error(`503 schema cache: ${error.message}`)
        }
        return { success: false as const, error: `Error al cargar: ${error.message}` }
      }

      if (data) {
        const quantities: Record<string, string> = {}
        if (Array.isArray(data.products)) {
          data.products.forEach((p: ProductQuantity) => {
            quantities[p.productId] = p.quantity
          })
        }
        return { success: true as const, quantities, createdAt: data.created_at }
      }

      return { success: true as const, quantities: {} as Record<string, string>, createdAt: null }
    })
  } catch (error) {
    console.error("[v0] Error in getLatestInventory:", error)
    return { success: false as const, error: "La base de datos no esta disponible en este momento. Intentalo de nuevo en unos segundos." }
  }
}

export async function getLacConsolidated() {
  try {
    return await withRetry(async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("cleaning_inventories")
        .select("device, products")
        .in("device", LAC_SUB_UNITS_FOR_SUM)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.message?.includes("schema cache") || error.code === "PGRST002") {
          throw new Error(`503 schema cache: ${error.message}`)
        }
        return { success: false as const, error: `Error al cargar datos LAC: ${error.message}` }
      }

      const latestByDevice = new Map<string, CleaningInventory>()
      data?.forEach((inv: CleaningInventory) => {
        if (!latestByDevice.has(inv.device)) {
          latestByDevice.set(inv.device, inv)
        }
      })

      const summedQuantities: Record<string, number> = {}

      Array.from(latestByDevice.values()).forEach((inventory) => {
        if (Array.isArray(inventory.products)) {
          inventory.products.forEach((prodQty) => {
            if (prodQty.productId !== "cp014") {
              const quantity = Number.parseInt(prodQty.quantity, 10)
              if (!isNaN(quantity)) {
                summedQuantities[prodQty.productId] = (summedQuantities[prodQty.productId] || 0) + quantity
              }
            }
          })
        }
      })

      return { success: true as const, quantities: summedQuantities }
    })
  } catch (error) {
    console.error("[v0] Error in getLacConsolidated:", error)
    return { success: false as const, error: "La base de datos no esta disponible. Intentalo de nuevo." }
  }
}

export async function saveInventory(device: string, products: ProductQuantity[]) {
  try {
    return await withRetry(async () => {
      const supabase = await createClient()

      const inventory = {
        device,
        products,
        reported_by: "Usuario MPDL",
        date: new Date().toISOString().split("T")[0],
      }

      const { data, error } = await supabase.from("cleaning_inventories").insert([inventory]).select()

      if (error) {
        if (error.message?.includes("schema cache") || error.code === "PGRST002") {
          throw new Error(`503 schema cache: ${error.message}`)
        }
        return { success: false as const, error: `Error al guardar: ${error.message}` }
      }

      return { success: true as const, data }
    })
  } catch (error) {
    console.error("[v0] Error in saveInventory:", error)
    return { success: false as const, error: "La base de datos no esta disponible. Intentalo de nuevo." }
  }
}
