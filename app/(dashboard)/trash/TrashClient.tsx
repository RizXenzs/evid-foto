'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, RotateCcw, X, Loader2, Image, FolderOpen } from 'lucide-react'
import { formatDateTime, formatBytes } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Photo, Folder } from '@/types'

interface TrashClientProps {
  photos: Photo[]
  folders: Folder[]
}

export function TrashClient({ photos: initialPhotos, folders: initialFolders }: TrashClientProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [loading, setLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'photos' | 'folders'>('photos')
  const supabase = createClient()
  const { toast } = useToast()

  async function restorePhoto(photo: Photo) {
    setLoading(photo.id)
    await supabase.from('photos').update({ is_deleted: false, deleted_at: null }).eq('id', photo.id)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('activity_logs').insert({
      user_id: user?.id, action: 'restore', target_type: 'photo', target_id: photo.id, target_name: photo.title
    })
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    toast({ title: 'Foto dipulihkan', description: `"${photo.title}" telah dikembalikan.` })
    setLoading(null)
  }

  async function deletePhotoPermanent(photo: Photo) {
    if (!confirm(`Hapus permanen "${photo.title}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setLoading(photo.id + '-del')
    // Delete from storage
    const fileName = photo.file_url.split('/photos/')[1]
    if (fileName) await supabase.storage.from('photos').remove([fileName])
    await supabase.from('photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    toast({ title: 'Dihapus permanen', description: `"${photo.title}" telah dihapus selamanya.`, variant: 'destructive' })
    setLoading(null)
  }

  async function restoreFolder(folder: Folder) {
    setLoading(folder.id)
    await supabase.from('folders').update({ is_deleted: false, deleted_at: null }).eq('id', folder.id)
    setFolders(prev => prev.filter(f => f.id !== folder.id))
    toast({ title: 'Folder dipulihkan', description: `"${folder.name}" telah dikembalikan.` })
    setLoading(null)
  }

  async function deleteFolderPermanent(folder: Folder) {
    if (!confirm(`Hapus permanen folder "${folder.name}"?`)) return
    setLoading(folder.id + '-del')
    await supabase.from('folders').delete().eq('id', folder.id)
    setFolders(prev => prev.filter(f => f.id !== folder.id))
    toast({ title: 'Dihapus permanen', variant: 'destructive' })
    setLoading(null)
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sampah</h1>
        <p className="text-muted-foreground text-sm">Item yang dihapus otomatis terhapus permanen setelah 30 hari</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
        {[
          { key: 'photos', label: 'Foto', count: photos.length, icon: Image },
          { key: 'folders', label: 'Folder', count: folders.length, icon: FolderOpen },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'photos' | 'folders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${activeTab === tab.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full
              ${activeTab === tab.key ? 'bg-muted text-muted-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'photos' && (
        <div>
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 glass-card">
              <Trash2 className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">Sampah Foto Kosong</p>
              <p className="text-muted-foreground text-sm mt-1">Tidak ada foto yang dihapus.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {photos.map(photo => (
                <div key={photo.id} className="glass-card flex items-center gap-4 p-4 opacity-80">
                  <img src={photo.thumbnail_url || photo.file_url} alt={photo.title}
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 grayscale" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{photo.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Dihapus: {photo.deleted_at ? formatDateTime(photo.deleted_at) : '-'}
                      {photo.file_size && ` • ${formatBytes(photo.file_size)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restorePhoto(photo)}
                      disabled={!!loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                    >
                      {loading === photo.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Pulihkan
                    </button>
                    <button
                      onClick={() => deletePhotoPermanent(photo)}
                      disabled={!!loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      {loading === photo.id + '-del' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'folders' && (
        <div>
          {folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 glass-card">
              <Trash2 className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">Sampah Folder Kosong</p>
            </div>
          ) : (
            <div className="space-y-2">
              {folders.map(folder => (
                <div key={folder.id} className="glass-card flex items-center gap-4 p-4 opacity-80">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 grayscale"
                    style={{ background: `${folder.color}20` }}>
                    <FolderOpen className="w-5 h-5" style={{ color: folder.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Dihapus: {folder.deleted_at ? formatDateTime(folder.deleted_at) : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => restoreFolder(folder)} disabled={!!loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                      {loading === folder.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                      Pulihkan
                    </button>
                    <button onClick={() => deleteFolderPermanent(folder)} disabled={!!loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                      {loading === folder.id + '-del' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                      Hapus Permanen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
