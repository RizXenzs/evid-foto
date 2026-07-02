import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatistikClient } from './StatistikClient'

export const metadata = { title: 'Statistik Lanjutan — EvidFoto' }

export default async function StatistikPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Hanya admin yang bisa melihat data statistik lengkap
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all photos
  const { data: photos } = await supabase
    .from('photos')
    .select('id, file_size, upload_date, folder_id, uploaded_by, folder:folders(name)')
    .eq('is_deleted', false)

  // Fetch all profiles (users)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')

  // Fetch all folders
  const { data: folders } = await supabase
    .from('folders')
    .select('id, name, color')
    .eq('is_deleted', false)

  // Fetch upload/download/login activity logs
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*, user:profiles(id, full_name, email)')

  return (
    <StatistikClient
      photos={photos || []}
      profiles={profiles || []}
      folders={folders || []}
      logs={logs || []}
    />
  )
}
