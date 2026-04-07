'use server'

import { createClient } from '@/lib/supabase/server'

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1500): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: unknown) {
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('503') ||
          error.message.includes('schema cache') ||
          error.message.includes('PGRST002'))

      if (isRetryable && attempt < maxRetries) {
        console.log(`[v0] Retry ${attempt}/${maxRetries} after transient error...`)
        await new Promise((r) => setTimeout(r, delayMs * attempt))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries reached')
}

export async function savePhotoUrl(device: string, photoUrl: string) {
  try {
    return await withRetry(async () => {
      const supabase = await createClient()

      // Get the latest inventory for this device
      const { data: latestInventory, error: fetchError } = await supabase
        .from('cleaning_inventories')
        .select('*')
        .eq('device', device)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError && fetchError.code !== 'PGRST116') {
        if (fetchError.message?.includes('schema cache') || fetchError.code === 'PGRST002') {
          throw new Error(`503 schema cache: ${fetchError.message}`)
        }
        return { success: false as const, error: `Error al cargar inventario: ${fetchError.message}` }
      }

      if (latestInventory) {
        // Update the latest inventory with the photo URL
        const { error: updateError } = await supabase
          .from('cleaning_inventories')
          .update({ photo_url: photoUrl })
          .eq('id', latestInventory.id)

        if (updateError) {
          if (updateError.message?.includes('schema cache') || updateError.code === 'PGRST002') {
            throw new Error(`503 schema cache: ${updateError.message}`)
          }
          return { success: false as const, error: `Error al guardar foto: ${updateError.message}` }
        }

        return { success: true as const, message: 'Foto guardada correctamente' }
      }

      return { success: false as const, error: 'No hay inventario registrado para este dispositivo' }
    })
  } catch (error) {
    console.error('[v0] Error in savePhotoUrl:', error)
    return { success: false as const, error: 'La base de datos no está disponible. Intenta de nuevo.' }
  }
}

export async function getPhotoUrl(device: string) {
  try {
    return await withRetry(async () => {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('cleaning_inventories')
        .select('photo_url')
        .eq('device', device)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        if (error.message?.includes('schema cache') || error.code === 'PGRST002') {
          throw new Error(`503 schema cache: ${error.message}`)
        }
        return { success: false as const, photoUrl: null }
      }

      return { success: true as const, photoUrl: data?.photo_url || null }
    })
  } catch (error) {
    console.error('[v0] Error in getPhotoUrl:', error)
    return { success: false as const, photoUrl: null }
  }
}

export async function deletePhotoUrl(device: string) {
  try {
    return await withRetry(async () => {
      const supabase = await createClient()

      const { error } = await supabase
        .from('cleaning_inventories')
        .update({ photo_url: null })
        .eq('device', device)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        if (error.message?.includes('schema cache') || error.code === 'PGRST002') {
          throw new Error(`503 schema cache: ${error.message}`)
        }
        return { success: false as const, error: `Error al eliminar foto: ${error.message}` }
      }

      return { success: true as const, message: 'Foto eliminada correctamente' }
    })
  } catch (error) {
    console.error('[v0] Error in deletePhotoUrl:', error)
    return { success: false as const, error: 'La base de datos no está disponible. Intenta de nuevo.' }
  }
}
