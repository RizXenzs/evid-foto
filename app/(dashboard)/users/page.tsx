import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersClient } from './UsersClient'

export const metadata = { title: 'Manajemen User — EvidFoto' }

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <UsersClient users={(users || []) as any} currentUserId={user.id} />
}
