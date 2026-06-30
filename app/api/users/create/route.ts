import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { email, password, full_name, role } = await request.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password diperlukan' }, { status: 400 })
  }

  // Create user via Supabase admin (requires service role key)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey!,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    }),
  })

  const result = await response.json()
  if (!response.ok) {
    return NextResponse.json({ error: result.message || 'Gagal membuat user' }, { status: 400 })
  }

  // Update profile role (trigger should create profile, but we update role)
  await supabase.from('profiles').update({ role, full_name }).eq('id', result.id)

  return NextResponse.json({ success: true, user: result })
}
