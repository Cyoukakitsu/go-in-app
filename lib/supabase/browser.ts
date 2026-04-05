// lib/supabase/browser.ts
// ブラウザ（Client Component）用Supabaseクライアント
import { createBrowserClient as _createBrowserClient } from '@supabase/auth-helpers-nextjs'

export function createBrowserClient() {
  return _createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
