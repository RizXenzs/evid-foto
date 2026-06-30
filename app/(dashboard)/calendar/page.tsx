import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CalendarClient } from './CalendarClient'

export const metadata = { title: 'Kalender Evident — EvidFoto' }

export default async function CalendarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: photos } = await supabase
    .from('photos')
    .select('id, title, file_url, thumbnail_url, work_date, upload_date, location')
    .eq('is_deleted', false)
    .order('work_date', { ascending: false })

  return <CalendarClient photos={(photos || []) as any} />
}
