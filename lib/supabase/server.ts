// lib/supabase/server.ts
// サーバー（Server Component）用Supabaseクライアント
import { createServerClient as _createServerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()
  return _createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Componentからの呼び出しではsetは無視される
          }
        },
      },
    }
  )
}
