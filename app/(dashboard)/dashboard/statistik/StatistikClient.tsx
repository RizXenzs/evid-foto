'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts'
import {
  TrendingUp, TrendingDown, HardDrive, User, FolderOpen, Images, BarChart3,
  Calendar, CalendarDays, Filter
} from 'lucide-react'
import { formatBytes } from '@/lib/utils'

interface StatistikClientProps {
  photos: any[]
  profiles: any[]
  folders: any[]
  logs: any[]
}

const COLORS = ['#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899', '#6B7280']

export function StatistikClient({ photos, profiles, folders, logs }: StatistikClientProps) {
  const router = useRouter()

  // Filter States
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('')
  const [selectedUserFilter, setSelectedUserFilter] = useState('')

  // 1. KARTU REKAP BULANAN
  const rekapBulanan = useMemo(() => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const lastMonthDate = new Date()
    lastMonthDate.setMonth(now.getMonth() - 1)
    const lastMonth = lastMonthDate.getMonth()
    const lastMonthYear = lastMonthDate.getFullYear()

    // Filter photos for this month and last month
    const thisMonthPhotos = photos.filter(p => {
      const d = new Date(p.upload_date)
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })

    const lastMonthPhotos = photos.filter(p => {
      const d = new Date(p.upload_date)
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
    })

    // Percentage change
    const diff = thisMonthPhotos.length - lastMonthPhotos.length
    const pctChange = lastMonthPhotos.length > 0
      ? (diff / lastMonthPhotos.length) * 100
      : thisMonthPhotos.length > 0 ? 100 : 0

    // Storage used this month
    const storageThisMonth = thisMonthPhotos.reduce((sum, p) => sum + (p.file_size || 0), 0)

    // User most active this month (by upload count)
    const userUploadCounts: Record<string, number> = {}
    thisMonthPhotos.forEach(p => {
      if (p.uploaded_by) {
        userUploadCounts[p.uploaded_by] = (userUploadCounts[p.uploaded_by] || 0) + 1
      }
    })
    let topUserId = ''
    let maxUploads = 0
    Object.entries(userUploadCounts).forEach(([uId, count]) => {
      if (count > maxUploads) {
        maxUploads = count
        topUserId = uId
      }
    })
    const topUser = profiles.find(u => u.id === topUserId)
    const topUserName = topUser ? (topUser.full_name || topUser.email) : '-'

    // Folder with most photos overall
    const folderPhotoCounts: Record<string, number> = {}
    photos.forEach(p => {
      if (p.folder_id) {
        folderPhotoCounts[p.folder_id] = (folderPhotoCounts[p.folder_id] || 0) + 1
      }
    })
    let topFolderId = ''
    let maxFolderPhotos = 0
    Object.entries(folderPhotoCounts).forEach(([fId, count]) => {
      if (count > maxFolderPhotos) {
        maxFolderPhotos = count
        topFolderId = fId
      }
    })
    const topFolder = folders.find(f => f.id === topFolderId)
    const topFolderName = topFolder ? topFolder.name : '-'

    return {
      thisMonthTotal: thisMonthPhotos.length,
      pctChange,
      storageThisMonth,
      topUserName,
      topFolderName,
    }
  }, [photos, profiles, folders])

  // 2. GRAFIK UPLOAD PER BULAN (12 Bulan terakhir, Tahun ini vs Tahun lalu)
  const chartMonthlyData = useMemo(() => {
    const data = []
    const now = new Date()

    // Generate 12 months array
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = targetDate.toLocaleString('id-ID', { month: 'short' })
      const m = targetDate.getMonth()
      const yThis = targetDate.getFullYear()
      const yLast = yThis - 1

      // Filter photos based on Folder & User filter selection
      const filteredPhotos = photos.filter(p => {
        if (selectedFolderFilter && p.folder_id !== selectedFolderFilter) return false
        if (selectedUserFilter && p.uploaded_by !== selectedUserFilter) return false
        return true
      })

      // Count for this year period
      const countThisYear = filteredPhotos.filter(p => {
        const d = new Date(p.upload_date)
        return d.getMonth() === m && d.getFullYear() === yThis
      }).length

      // Count for last year period
      const countLastYear = filteredPhotos.filter(p => {
        const d = new Date(p.upload_date)
        return d.getMonth() === m && d.getFullYear() === yLast
      }).length

      data.push({
        name: label,
        'Tahun Ini': countThisYear,
        'Tahun Lalu': countLastYear,
      })
    }

    return data
  }, [photos, selectedFolderFilter, selectedUserFilter])

  // 3. GRAFIK UPLOAD PER HARI DALAM SEMINGGU
  const chartDayOfWeekData = useMemo(() => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
    const dayCounts = Array(7).fill(0)

    photos.forEach(p => {
      const d = new Date(p.upload_date)
      dayCounts[d.getDay()]++
    })

    return days.map((day, idx) => ({
      day,
      Aktivitas: dayCounts[idx]
    }))
  }, [photos])

  // 4. PIE CHART DISTRIBUSI FOLDER
  const chartFolderDistribution = useMemo(() => {
    const folderCounts: Record<string, { name: string; count: number; id: string }> = {}

    // Populate all folders
    folders.forEach(f => {
      folderCounts[f.id] = { name: f.name, count: 0, id: f.id }
    })

    // Fallback for "Tanpa Folder"
    folderCounts['none'] = { name: 'Tanpa Folder', count: 0, id: '' }

    photos.forEach(p => {
      const fId = p.folder_id || 'none'
      if (folderCounts[fId]) {
        folderCounts[fId].count++
      }
    })

    return Object.values(folderCounts).filter(item => item.count > 0)
  }, [photos, folders])

  // 5. LINE CHART: TOP 5 USER PALING AKTIF (Upload + Download)
  const chartActiveUsers = useMemo(() => {
    const userStats: Record<string, { id: string; name: string; Uploads: number; Downloads: number }> = {}

    // Track uploads
    photos.forEach(p => {
      if (p.uploaded_by) {
        const user = profiles.find(pr => pr.id === p.uploaded_by)
        const name = user ? (user.full_name || user.email) : 'Unknown'
        if (!userStats[p.uploaded_by]) {
          userStats[p.uploaded_by] = { id: p.uploaded_by, name, Uploads: 0, Downloads: 0 }
        }
        userStats[p.uploaded_by].Uploads++
      }
    })

    // Track downloads
    logs.forEach(l => {
      if (l.action === 'download' && l.user_id) {
        const user = profiles.find(pr => pr.id === l.user_id)
        const name = user ? (user.full_name || user.email) : 'Unknown'
        if (!userStats[l.user_id]) {
          userStats[l.user_id] = { id: l.user_id, name, Uploads: 0, Downloads: 0 }
        }
        userStats[l.user_id].Downloads++
      }
    })

    // Sort by total activities (Uploads + Downloads) and take top 5
    return Object.values(userStats)
      .map(item => ({
        ...item,
        total: item.Uploads + item.Downloads
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
  }, [photos, logs, profiles])

  // 6. HEATMAP KALENDER AKTIVITAS (GitHub contribution graph style for last 6 months)
  const calendarHeatmap = useMemo(() => {
    const now = new Date()
    const startDate = new Date()
    startDate.setMonth(now.getMonth() - 5)
    startDate.setDate(1) // Start of 6 months ago

    // Get counts per day
    const dateCounts: Record<string, number> = {}
    photos.forEach(p => {
      const dateStr = new Date(p.upload_date).toISOString().split('T')[0]
      dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1
    })

    const daysArray = []
    const tempDate = new Date(startDate)

    // Generate dates until today
    while (tempDate <= now) {
      const dateStr = tempDate.toISOString().split('T')[0]
      daysArray.push({
        dateStr,
        dateObj: new Date(tempDate),
        count: dateCounts[dateStr] || 0
      })
      tempDate.setDate(tempDate.getDate() + 1)
    }

    return daysArray
  }, [photos])

  const getHeatmapColorClass = (count: number) => {
    if (count === 0) return 'bg-slate-800 text-slate-800'
    if (count <= 2) return 'bg-orange-500/30 text-orange-200 border-orange-500/20'
    if (count <= 5) return 'bg-orange-500/60 text-white'
    return 'bg-orange-500 text-white font-bold'
  };

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-orange-400" />
          Statistik & Laporan Lanjutan
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Visualisasi data, pertumbuhan media, dan log performa tim
        </p>
      </div>

      {/* 1. Rekap Bulanan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Foto Bulan Ini */}
        <div className="stats-card p-5 slide-up">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Foto Bulan Ini</span>
            {rekapBulanan.pctChange >= 0 ? (
              <span className="text-xs text-green-400 flex items-center gap-0.5 bg-green-500/10 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                {rekapBulanan.pctChange.toFixed(0)}%
              </span>
            ) : (
              <span className="text-xs text-red-400 flex items-center gap-0.5 bg-red-500/10 px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3 h-3" />
                {Math.abs(rekapBulanan.pctChange).toFixed(0)}%
              </span>
            )}
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-bold text-white">{rekapBulanan.thisMonthTotal}</h3>
            <p className="text-xs text-slate-500 mt-1">Total foto diunggah bulan ini</p>
          </div>
        </div>

        {/* Storage Terpakai Bulan Ini */}
        <div className="stats-card p-5 slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Storage Baru</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-bold text-white">{formatBytes(rekapBulanan.storageThisMonth)}</h3>
            <p className="text-xs text-slate-500 mt-1">Penyimpanan dihabiskan bulan ini</p>
          </div>
        </div>

        {/* User Teraktif Bulan Ini */}
        <div className="stats-card p-5 slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">User Teraktif</span>
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-white truncate">{rekapBulanan.topUserName}</h3>
            <p className="text-xs text-slate-500 mt-1.5">Paling banyak upload bulan ini</p>
          </div>
        </div>

        {/* Folder Terpadat */}
        <div className="stats-card p-5 slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Proyek Terpadat</span>
            <FolderOpen className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-3">
            <h3 className="text-lg font-bold text-white truncate">{rekapBulanan.topFolderName}</h3>
            <p className="text-xs text-slate-500 mt-1.5">Folder dengan akumulasi foto terbanyak</p>
          </div>
        </div>
      </div>

      {/* Main Stats Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Grafik Upload per Bulan */}
        <div className="glass-card p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-semibold text-foreground">Pertumbuhan Unggahan Bulanan</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Bandingkan 2 periode tahun ini vs tahun lalu</p>
            </div>
            
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedFolderFilter}
                onChange={e => setSelectedFolderFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-muted text-xs text-foreground outline-none"
              >
                <option value="">Semua Folder</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select
                value={selectedUserFilter}
                onChange={e => setSelectedUserFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-muted text-xs text-foreground outline-none"
              >
                <option value="">Semua User</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="Tahun Ini" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Tahun Lalu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Grafik Upload per Hari dalam Seminggu */}
        <div className="glass-card p-6 flex flex-col">
          <div>
            <h2 className="font-semibold text-foreground">Distribusi Aktivitas Harian</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Melihat hari paling produktif untuk upload dokumen</p>
          </div>

          <div className="flex-1 min-h-[250px] mt-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={chartDayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="day" type="category" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Bar dataKey="Aktivitas" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Pie Chart Distribusi Folder */}
        <div className="glass-card p-6 flex flex-col">
          <div>
            <h2 className="font-semibold text-foreground">Penyebaran Folder Kerja</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Persentase foto terdaftar di tiap proyek (Klik legend untuk memfilter galeri)</p>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-6 mt-6">
            <div className="w-[180px] h-[180px] flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartFolderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {chartFolderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-1.5 w-full max-h-[220px] overflow-y-auto pr-2">
              {chartFolderDistribution.map((item, index) => {
                const total = photos.length
                const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0'
                return (
                  <button
                    key={item.name}
                    onClick={() => router.push(item.id ? `/photos?folder_id=${item.id}` : `/photos`)}
                    className="w-full flex items-center justify-between text-left p-1.5 rounded-lg hover:bg-muted/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs text-slate-300 font-medium group-hover:text-white truncate max-w-[150px]">{item.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground group-hover:text-orange-400 font-semibold">
                      {item.count} ({pct}%)
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 4. Grafik Aktivitas User */}
        <div className="glass-card p-6 flex flex-col">
          <div>
            <h2 className="font-semibold text-foreground">Top 5 Pengguna Paling Aktif</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Integrasi performa upload & download dalam satu grafik</p>
          </div>

          <div className="flex-1 min-h-[250px] mt-6">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartActiveUsers}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Uploads" stroke="#f97316" strokeWidth={2} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Downloads" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 5. Heatmap Kalender Aktivitas (GitHub contribution graph) */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-orange-400" />
          <div>
            <h2 className="font-semibold text-foreground">Heatmap Kontribusi Foto</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Grafik log upload foto 6 bulan terakhir. Klik tanggal untuk memfilter galeri.</p>
          </div>
        </div>

        {/* Heatmap Container */}
        <div className="pt-2 overflow-x-auto">
          <div className="flex flex-wrap gap-1 min-w-[650px] pb-2">
            {calendarHeatmap.map(day => (
              <button
                key={day.dateStr}
                onClick={() => router.push(`/photos?work_date=${day.dateStr}`)}
                className={`w-[12px] h-[12px] rounded-[2px] transition-all border border-transparent hover:border-white/40 ${getHeatmapColorClass(day.count)}`}
                title={`${day.dateStr}: ${day.count} foto diunggah`}
              />
            ))}
          </div>

          {/* Color Code Legend */}
          <div className="flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground pt-3 border-t border-white/5">
            <span>Kurang</span>
            <div className="w-[10px] h-[10px] rounded-[1px] bg-slate-800" />
            <div className="w-[10px] h-[10px] rounded-[1px] bg-orange-500/30" />
            <div className="w-[10px] h-[10px] rounded-[1px] bg-orange-500/60" />
            <div className="w-[10px] h-[10px] rounded-[1px] bg-orange-500" />
            <span>Banyak</span>
          </div>
        </div>
      </div>
    </div>
  )
}
