import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LaporanClient } from './LaporanClient'

export const metadata = { title: 'Laporan PDF — EvidFoto' }

export default async function LaporanPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  const [foldersResult, uploadersResult] = await Promise.all([
    supabase.from('folders').select('id, name').eq('is_deleted', false).order('name'),
    supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name'),
  ])

  return (
    <LaporanClient
      folders={foldersResult.data || []}
      uploaders={uploadersResult.data || []}
      currentUser={{ name: profile?.full_name || profile?.email || 'Admin', role: profile?.role || 'user' }}
    />
  )
}
