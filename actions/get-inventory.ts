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

export async function getLatestInventory(device: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("cleaning_inventories")
      .select("products, created_at")
      .eq("device", device)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("[v0] Error fetching latest inventory:", error)
      return { success: false, error: "Error al cargar el inventario anterior." }
    }

    if (data) {
      const quantities: Record<string, string> = {}
      if (Array.isArray(data.products)) {
        data.products.forEach((p: ProductQuantity) => {
          quantities[p.productId] = p.quantity
        })
      }
      return { success: true, quantities, createdAt: data.created_at }
    }

    return { success: true, quantities: {}, createdAt: null }
  } catch (error) {
    console.error("[v0] Error in getLatestInventory:", error)
    return { success: false, error: "Error inesperado al cargar el inventario." }
  }
}

export async function getLacConsolidated() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("cleaning_inventories")
      .select("device, products")
      .in("device", LAC_SUB_UNITS_FOR_SUM)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching LAC inventories:", error)
      return { success: false, error: "Error al cargar datos consolidados de LAC." }
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
            // Not "Otros"
            const quantity = Number.parseInt(prodQty.quantity, 10)
            if (!isNaN(quantity)) {
              summedQuantities[prodQty.productId] = (summedQuantities[prodQty.productId] || 0) + quantity
            }
          }
        })
      }
    })

    return { success: true, quantities: summedQuantities }
  } catch (error) {
    console.error("[v0] Error in getLacConsolidated:", error)
    return { success: false, error: "Error inesperado al cargar datos de LAC." }
  }
}

export async function saveInventory(device: string, products: ProductQuantity[]) {
  try {
    const supabase = await createClient()

    const inventory = {
      device,
      products,
      reported_by: "Usuario MPDL",
      date: new Date().toISOString().split("T")[0],
    }

    const { data, error } = await supabase.from("cleaning_inventories").insert([inventory]).select()

    if (error) {
      console.error("[v0] Error saving inventory:", error)
      return { success: false, error: `Error al guardar: ${error.message}` }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in saveInventory:", error)
    return { success: false, error: "Error inesperado al guardar el inventario." }
  }
}
