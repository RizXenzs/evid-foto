'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, Check, X,
  Loader2, AlertTriangle, User, MapPin, Calendar, FolderOpen,
  ChevronDown, Image as ImageIcon
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Photo, ApprovalStatus } from '@/types'

interface ApprovalClientProps {
  initialPhotos: Photo[]
  adminId: string
}

type TabType = 'pending' | 'approved' | 'rejected'

const TAB_CONFIG: Record<TabType, { label: string; icon: React.ReactNode; color: string; emptyMsg: string }> = {
  pending: {
    label: 'Menunggu Review',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-yellow-400',
    emptyMsg: 'Tidak ada foto yang menunggu review.',
  },
  approved: {
    label: 'Sudah Disetujui',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'text-green-400',
    emptyMsg: 'Belum ada foto yang disetujui.',
  },
  rejected: {
    label: 'Ditolak',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-400',
    emptyMsg: 'Tidak ada foto yang ditolak.',
  },
}

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  if (status === 'pending') return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
      <Clock className="w-3 h-3" /> Menunggu
    </span>
  )
  if (status === 'approved') return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30 flex items-center gap-1">
      <CheckCircle2 className="w-3 h-3" /> Disetujui
    </span>
  )
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
      <XCircle className="w-3 h-3" /> Ditolak
    </span>
  )
}

export function ApprovalClient({ initialPhotos, adminId }: ApprovalClientProps) {
  const supabase = createClient()
  const { toast } = useToast()

  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [activeTab, setActiveTab] = useState<TabType>('pending')
  const [selected, setSelected] = useState<string[]>([])
  const [processing, setProcessing] = useState(false)

  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{ ids: string[] } | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from('photos')
      .select('*, uploader:profiles(full_name, email, avatar_url), folder:folders(name, color)')
      .eq('is_deleted', false)
      .order('upload_date', { ascending: false })
    if (data) setPhotos(data as Photo[])
  }, [supabase])

  const tabPhotos = photos.filter(p => p.approval_status === activeTab)

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  function selectAll() {
    const ids = tabPhotos.map(p => p.id)
    setSelected(prev => prev.length === ids.length ? [] : ids)
  }

  async function handleApprove(ids: string[]) {
    if (ids.length === 0) return
    setProcessing(true)
    try {
      const res = await fetch('/api/photos/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'approved' }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: '✅ Berhasil Disetujui', description: `${ids.length} foto telah disetujui.` })
      setSelected([])
      await fetchPhotos()
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    }
    setProcessing(false)
  }

  async function handleRejectConfirm() {
    if (!rejectModal) return
    setProcessing(true)
    try {
      const res = await fetch('/api/photos/approve', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: rejectModal.ids, status: 'rejected', note: rejectNote }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast({ title: '❌ Foto Ditolak', description: `${rejectModal.ids.length} foto telah ditolak.` })
      setSelected([])
      setRejectModal(null)
      setRejectNote('')
      await fetchPhotos()
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    }
    setProcessing(false)
  }

  const pendingCount = photos.filter(p => p.approval_status === 'pending').length
  const approvedCount = photos.filter(p => p.approval_status === 'approved').length
  const rejectedCount = photos.filter(p => p.approval_status === 'rejected').length

  const selectedInTab = selected.filter(id => tabPhotos.some(p => p.id === id))

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-400" />
            Approval Foto
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review dan setujui foto yang diupload oleh user
          </p>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-yellow-500/15 text-yellow-300 border border-yellow-500/25">
            🕐 {pendingCount} Pending
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-green-500/15 text-green-300 border border-green-500/25">
            ✅ {approvedCount} Disetujui
          </span>
          <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/15 text-red-300 border border-red-500/25">
            ❌ {rejectedCount} Ditolak
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl border border-border" style={{ background: 'hsl(var(--muted))' }}>
        {(Object.keys(TAB_CONFIG) as TabType[]).map(tab => {
          const count = tab === 'pending' ? pendingCount : tab === 'approved' ? approvedCount : rejectedCount
          const cfg = TAB_CONFIG[tab]
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelected([]) }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <span className={activeTab === tab ? cfg.color : ''}>{cfg.icon}</span>
              <span className="hidden sm:inline">{cfg.label}</span>
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                  tab === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                  tab === 'approved' ? 'bg-green-500/20 text-green-300' :
                  'bg-red-500/20 text-red-300'
                }`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bulk action bar */}
      {activeTab === 'pending' && tabPhotos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={selectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            {selectedInTab.length === tabPhotos.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </button>
          {selectedInTab.length > 0 && (
            <>
              <button
                onClick={() => handleApprove(selectedInTab)}
                disabled={processing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Setujui ({selectedInTab.length})
              </button>
              <button
                onClick={() => setRejectModal({ ids: selectedInTab })}
                disabled={processing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Tolak ({selectedInTab.length})
              </button>
            </>
          )}
        </div>
      )}

      {/* Photo grid */}
      {tabPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-card">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-foreground font-medium">{TAB_CONFIG[activeTab].emptyMsg}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tabPhotos.map(photo => {
            const isSelected = selected.includes(photo.id)
            return (
              <div
                key={photo.id}
                className={`glass-card overflow-hidden transition-all duration-200 ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  <img
                    src={photo.thumbnail_url || photo.file_url}
                    alt={photo.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Status badge overlay */}
                  <div className="absolute top-2 right-2">
                    <ApprovalBadge status={photo.approval_status} />
                  </div>
                  {/* Select checkbox (only pending) */}
                  {activeTab === 'pending' && (
                    <button
                      onClick={() => toggleSelect(photo.id)}
                      className={`absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'bg-primary border-primary' : 'border-white/60 bg-black/30'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="font-semibold text-foreground text-sm truncate">{photo.title}</p>
                  <div className="space-y-1">
                    {photo.uploader && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{photo.uploader.full_name || photo.uploader.email}</span>
                      </div>
                    )}
                    {photo.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{photo.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{formatDateTime(photo.upload_date)}</span>
                    </div>
                    {photo.folder && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FolderOpen className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{photo.folder.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Rejection note */}
                  {photo.approval_status === 'rejected' && photo.approval_note && (
                    <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-300 italic">"{photo.approval_note}"</p>
                    </div>
                  )}

                  {/* Action buttons (pending only) */}
                  {activeTab === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove([photo.id])}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors"
                      >
                        {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                        Setujui
                      </button>
                      <button
                        onClick={() => setRejectModal({ ids: [photo.id] })}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
                      >
                        <XCircle className="w-3 h-3" />
                        Tolak
                      </button>
                    </div>
                  )}

                  {/* Re-review actions for rejected/approved */}
                  {activeTab === 'rejected' && (
                    <button
                      onClick={() => handleApprove([photo.id])}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors mt-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Setujui Sekarang
                    </button>
                  )}
                  {activeTab === 'approved' && (
                    <button
                      onClick={() => setRejectModal({ ids: [photo.id] })}
                      disabled={processing}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-muted-foreground border border-border hover:border-red-500/50 hover:text-red-400 disabled:opacity-60 transition-colors mt-1"
                    >
                      <XCircle className="w-3 h-3" />
                      Batalkan Persetujuan
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !processing && setRejectModal(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl slide-up"
            style={{ background: 'hsl(var(--card))' }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Tolak Foto</h3>
                  <p className="text-muted-foreground text-xs mt-0.5">{rejectModal.ids.length} foto akan ditolak</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Alasan Penolakan (opsional)</label>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Jelaskan alasan penolakan..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRejectNote('') }}
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={processing}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Tolak
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
