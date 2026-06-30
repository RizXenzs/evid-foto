import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,       // Simpan sesi di localStorage
        autoRefreshToken: true,     // Otomatis refresh token agar tidak expired
        detectSessionInUrl: true,
      },
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 30,  // 30 hari sesi tersimpan
      },
    }
  )
}
