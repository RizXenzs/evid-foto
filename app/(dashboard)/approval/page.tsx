import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApprovalClient } from './ApprovalClient'

export const metadata = { title: 'Approval Foto — EvidFoto' }

export default async function ApprovalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single()

  // Hanya admin yang boleh akses
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: photos } = await supabase
    .from('photos')
    .select('*, uploader:profiles(full_name, email, avatar_url), folder:folders(name, color)')
    .eq('is_deleted', false)
    .order('upload_date', { ascending: false })

  return (
    <ApprovalClient
      initialPhotos={(photos || []) as any}
      adminId={user.id}
    />
  )
}
