'use client'

import { Images, FolderOpen, Users, HardDrive, TrendingUp, Upload } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatBytes, formatDateTime, timeAgo, ACTION_LABELS, getInitials } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import type { Profile, ActivityLog } from '@/types'

interface DashboardClientProps {
  profile: Profile | null
  stats: {
    total_photos: number
    total_folders: number
    total_users: number
    total_storage_bytes: number
    uploads_per_month: { month: string; count: number }[]
  }
  recentActivity: any[]
}

export function DashboardClient({ profile, stats, recentActivity }: DashboardClientProps) {
  const { setUploadModalOpen } = useAppStore()

  const statCards = [
    { label: 'Total Foto', value: stats.total_photos.toLocaleString(), icon: Images, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    { label: 'Total Folder', value: stats.total_folders.toLocaleString(), icon: FolderOpen, color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
    { label: 'Pengguna Aktif', value: stats.total_users.toLocaleString(), icon: Users, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Storage Terpakai', value: formatBytes(stats.total_storage_bytes), icon: HardDrive, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
  ]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-lg font-bold text-primary">{payload[0].value} foto</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Selamat datang, <span className="text-foreground font-medium">{profile?.full_name || 'Admin'}</span>!
          </p>
        </div>
        {profile?.role === 'admin' && (
          <button
            id="btn-upload-dashboard"
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            <Upload className="w-4 h-4" />
            Upload Foto
          </button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stats-card slide-up">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: card.bg }}
              >
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Upload chart */}
        <div className="glass-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-foreground">Upload per Bulan</h2>
            <span className="text-xs text-muted-foreground">6 bulan terakhir</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.uploads_per_month} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
              <Bar
                dataKey="count"
                fill="url(#blueGradient)"
                radius={[6, 6, 0, 0]}
              />
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity */}
        <div className="glass-card p-6 lg:col-span-2">
          <h2 className="font-semibold text-foreground mb-4">Aktivitas Terbaru</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada aktivitas</p>
            ) : (
              recentActivity.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
                  >
                    {getInitials(log.user?.full_name || log.user?.email || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <span className="font-medium">{log.user?.full_name || log.user?.email || 'Unknown'}</span>
                      {' '}<span className="text-muted-foreground">{ACTION_LABELS[log.action] || log.action}</span>
                      {log.target_name && <span className="font-medium"> "{log.target_name}"</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(log.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
