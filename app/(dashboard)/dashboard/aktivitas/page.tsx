import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AktivitasClient } from './AktivitasClient'

export const metadata = { title: 'Riwayat Aktivitas — EvidFoto' }

export default async function AktivitasPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Hanya admin yang bisa melihat log aktivitas global
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch profiles for the dropdown filter
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')

  // Fetch initial activity logs
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*, user:profiles(id, full_name, email)')
    .order('created_at', { ascending: false })

  return (
    <AktivitasClient
      initialLogs={logs || []}
      profiles={profiles || []}
    />
  )
}
