import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PhotosClient } from './PhotosClient'

export const metadata = { title: 'Semua Foto — EvidFoto' }

export default async function PhotosPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  const [photosResult, foldersResult] = await Promise.all([
    supabase
      .from('photos')
      .select('*, uploader:profiles(full_name, email, avatar_url), folder:folders(name, color)')
      .eq('is_deleted', false)
      .order('upload_date', { ascending: false }),
    supabase.from('folders').select('*').eq('is_deleted', false).order('name'),
  ])

  return (
    <PhotosClient
      initialPhotos={(photosResult.data || []) as any}
      folders={foldersResult.data || []}
      userRole={profile?.role || 'user'}
      userId={user.id}
    />
  )
}
