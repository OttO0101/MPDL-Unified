import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  console.log("[v0] Creating Supabase client...")
  console.log("[v0] NEXT_PUBLIC_SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    console.error("[v0] URL:", supabaseUrl ? "present" : "missing")
    console.error("[v0] Key:", supabaseAnonKey ? "present" : "missing")
    throw new Error("Missing Supabase environment variables")
  }

  console.log("[v0] Supabase URL (first 20 chars):", supabaseUrl.substring(0, 20))
  console.log("[v0] Supabase client created successfully")
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
