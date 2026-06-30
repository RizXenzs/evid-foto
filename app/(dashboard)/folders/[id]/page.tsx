import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { FolderDetailClient } from './FolderDetailClient'

export default async function FolderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const { data: folder } = await supabase.from('folders').select('*').eq('id', params.id).single()
  if (!folder || folder.is_deleted) notFound()

  const [photosResult, subfoldersResult, foldersResult] = await Promise.all([
    supabase
      .from('photos')
      .select('*, uploader:profiles(full_name)')
      .eq('folder_id', params.id)
      .eq('is_deleted', false)
      .order('upload_date', { ascending: false }),
    supabase
      .from('folders')
      .select('*')
      .eq('parent_id', params.id)
      .eq('is_deleted', false),
    supabase
      .from('folders')
      .select('*')
      .eq('is_deleted', false)
      .order('name'),
  ])

  return (
    <FolderDetailClient
      folder={folder}
      initialPhotos={photosResult.data || []}
      subfolders={subfoldersResult.data || []}
      folders={foldersResult.data || []}
      userRole={profile?.role || 'user'}
    />
  )
}
