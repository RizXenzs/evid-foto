import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Fetch stats
  const [photosResult, foldersResult, usersResult, logsResult] = await Promise.all([
    supabase.from('photos').select('id, file_size, upload_date, created_at').eq('is_deleted', false),
    supabase.from('folders').select('id').eq('is_deleted', false),
    supabase.from('profiles').select('id').eq('is_active', true),
    supabase.from('activity_logs').select('*, user:profiles(full_name, email, avatar_url)').order('created_at', { ascending: false }).limit(10),
  ])

  const photos = photosResult.data || []
  const totalStorage = photos.reduce((sum, p) => sum + (p.file_size || 0), 0)

  // Monthly upload data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const month = date.toLocaleString('id-ID', { month: 'short', year: '2-digit' })
    const count = photos.filter(p => {
      const d = new Date(p.upload_date || p.created_at)
      return d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
    }).length
    return { month, count }
  })

  const stats = {
    total_photos: photos.length,
    total_folders: foldersResult.data?.length || 0,
    total_users: usersResult.data?.length || 0,
    total_storage_bytes: totalStorage,
    uploads_per_month: monthlyData,
  }

  return (
    <DashboardClient
      profile={profile}
      stats={stats}
      recentActivity={logsResult.data || []}
    />
  )
}
