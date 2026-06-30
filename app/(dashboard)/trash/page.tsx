import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrashClient } from './TrashClient'

export const metadata = { title: 'Sampah — EvidFoto' }

export default async function TrashPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [photosResult, foldersResult] = await Promise.all([
    supabase.from('photos').select('*, uploader:profiles(full_name)').eq('is_deleted', true).order('deleted_at', { ascending: false }),
    supabase.from('folders').select('*, creator:profiles(full_name)').eq('is_deleted', true).order('deleted_at', { ascending: false }),
  ])

  return (
    <TrashClient
      photos={(photosResult.data || []) as any}
      folders={(foldersResult.data || []) as any}
    />
  )
}
