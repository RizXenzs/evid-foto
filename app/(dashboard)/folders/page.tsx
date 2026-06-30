import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FoldersClient } from './FoldersClient'

export const metadata = { title: 'Folder — EvidFoto' }

export default async function FoldersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // Get folders with photo count
  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('is_deleted', false)
    .order('name')

  // Get photo counts per folder
  const { data: photoCounts } = await supabase
    .from('photos')
    .select('folder_id')
    .eq('is_deleted', false)
    .not('folder_id', 'is', null)

  const countMap = (photoCounts || []).reduce((acc: Record<string, number>, p) => {
    if (p.folder_id) acc[p.folder_id] = (acc[p.folder_id] || 0) + 1
    return acc
  }, {})

  const foldersWithCount = (folders || []).map(f => ({
    ...f,
    photo_count: countMap[f.id] || 0,
  }))

  return (
    <FoldersClient
      folders={foldersWithCount}
      userRole={profile?.role || 'user'}
    />
  )
}
