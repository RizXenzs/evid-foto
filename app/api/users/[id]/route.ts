import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  // Cek apakah pemanggil adalah admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Jangan hapus diri sendiri
  if (params.id === user.id) {
    return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Hapus dari Supabase Auth (cascade ke profiles)
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${params.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey!,
    },
  })

  if (!res.ok && res.status !== 204) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 400 })
  }

  // Log aktivitas
  const { data: deletedProfile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', params.id)
    .single()

  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'delete',
    target_type: 'user',
    target_name: deletedProfile?.full_name || deletedProfile?.email || params.id,
  })

  return NextResponse.json({ success: true })
}
