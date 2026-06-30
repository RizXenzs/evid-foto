'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, LayoutGrid, List, Filter, SortAsc, Check, Upload, X, Loader2 } from 'lucide-react'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import { UploadModal } from '@/components/photos/UploadModal'
import { useAppStore } from '@/store/useAppStore'
import { formatDate, formatBytes } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Photo, Folder } from '@/types'

interface PhotosClientProps {
  initialPhotos: Photo[]
  folders: Folder[]
  userRole: string
  userId: string
}

export function PhotosClient({ initialPhotos, folders, userRole, userId }: PhotosClientProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [filterFolder, setFilterFolder] = useState('')
  const [sortBy, setSortBy] = useState('upload_date_desc')
  const [searchTag, setSearchTag] = useState('')
  const { viewMode, setViewMode, selectedPhotos, togglePhotoSelection, selectAllPhotos, clearSelection, uploadModalOpen } = useAppStore()
  const supabase = createClient()
  const { toast } = useToast()

  const fetchPhotos = useCallback(async () => {
    let query = supabase
      .from('photos')
      .select('*, uploader:profiles(full_name, email, avatar_url), folder:folders(name, color)')
      .eq('is_deleted', false)

    if (filterFolder) query = query.eq('folder_id', filterFolder)
    if (searchTag) query = query.contains('tags', [searchTag])

    const [field, dir] = sortBy.split('_desc')
    const isDesc = sortBy.includes('_desc')
    if (field === 'upload') query = query.order('upload_date', { ascending: !isDesc })
    else if (field === 'title') query = query.order('title', { ascending: !isDesc })
    else query = query.order('upload_date', { ascending: false })

    const { data } = await query
    if (data) setPhotos(data as Photo[])
  }, [filterFolder, sortBy, searchTag])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  async function handleDownload(photo: Photo) {
    const { data: { user } } = await supabase.auth.getUser()
    const response = await fetch(photo.file_url)
    const blob = await response.blob()
    saveAs(blob, photo.file_name)

    if (user) {
      await supabase.from('download_history').insert({
        user_id: user.id,
        photo_id: photo.id,
        download_type: 'single',
        file_count: 1,
        file_names: [photo.file_name],
      })
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'download',
        target_type: 'photo',
        target_id: photo.id,
        target_name: photo.title,
      })
    }
  }

  async function handleBulkDownload() {
    if (selectedPhotos.length === 0) return
    setDownloading(true)
    try {
      const zip = new JSZip()
      const selectedPhotoData = photos.filter(p => selectedPhotos.includes(p.id))

      await Promise.all(
        selectedPhotoData.map(async (photo) => {
          const response = await fetch(photo.file_url)
          const blob = await response.blob()
          zip.file(photo.file_name, blob)
        })
      )

      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `EvidFoto-${new Date().toISOString().split('T')[0]}.zip`)

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('download_history').insert({
          user_id: user.id,
          download_type: 'bulk',
          file_count: selectedPhotoData.length,
          file_names: selectedPhotoData.map(p => p.file_name),
        })
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'download',
          target_type: 'photo',
          target_name: `${selectedPhotoData.length} foto (bulk)`,
          metadata: { count: selectedPhotoData.length },
        })
      }
      clearSelection()
      toast({ title: 'Berhasil', description: `${selectedPhotoData.length} foto berhasil diunduh.` })
    } catch (err) {
      toast({ title: 'Gagal', description: 'Terjadi kesalahan saat mengunduh.', variant: 'destructive' })
    }
    setDownloading(false)
  }

  const isSelected = (id: string) => selectedPhotos.includes(id)

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Semua Foto</h1>
          <p className="text-muted-foreground text-sm">{photos.length} foto ditemukan</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPhotos.length > 0 && (
            <button
              onClick={handleBulkDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white
                transition-all bg-green-600 hover:bg-green-700 disabled:opacity-60"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Unduh ZIP ({selectedPhotos.length})
            </button>
          )}
          {selectedPhotos.length > 0 && (
            <button onClick={clearSelection} className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-xl border transition-colors ${viewMode === 'grid' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl border transition-colors ${viewMode === 'list' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterFolder}
          onChange={e => setFilterFolder(e.target.value)}
          className="px-4 py-2 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-all"
        >
          <option value="">Semua Folder</option>
          {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <input
          value={searchTag}
          onChange={e => setSearchTag(e.target.value)}
          placeholder="Filter tag..."
          className="px-4 py-2 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-all"
        />

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="px-4 py-2 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-all"
        >
          <option value="upload_date_desc">Terbaru Diupload</option>
          <option value="upload_date">Terlama Diupload</option>
          <option value="title">Nama A-Z</option>
          <option value="title_desc">Nama Z-A</option>
        </select>

        {photos.length > 0 && (
          <button
            onClick={() => selectedPhotos.length === photos.length ? clearSelection() : selectAllPhotos(photos.map(p => p.id))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Check className="w-4 h-4" />
            {selectedPhotos.length === photos.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </button>
        )}
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Foto</h3>
          <p className="text-muted-foreground text-sm">
            {userRole === 'admin' ? 'Upload foto pertama Anda menggunakan tombol Upload.' : 'Belum ada foto yang diupload.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className={`photo-card aspect-square ${isSelected(photo.id) ? 'ring-2 ring-primary' : ''}`}
            >
              <img
                src={photo.thumbnail_url || photo.file_url}
                alt={photo.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onClick={() => setLightboxIndex(index)}
              />
              <div className="photo-card-overlay" onClick={() => setLightboxIndex(index)}>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-medium truncate">{photo.title}</p>
                  {photo.work_date && (
                    <p className="text-white/70 text-xs">{formatDate(photo.work_date)}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDownload(photo) }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/20 text-white text-xs hover:bg-white/30 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Unduh
                    </button>
                  </div>
                </div>
              </div>
              {/* Select checkbox */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePhotoSelection(photo.id) }}
                className={`absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center
                  transition-all duration-200 ${isSelected(photo.id)
                    ? 'bg-primary border-primary'
                    : 'border-white/60 bg-black/30 opacity-0 group-hover:opacity-100'
                  }`}
              >
                {isSelected(photo.id) && <Check className="w-3 h-3 text-white" />}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`glass-card flex items-center gap-4 p-4 cursor-pointer
                hover:border-primary/30 transition-all duration-200
                ${isSelected(photo.id) ? 'border-primary/50 bg-primary/5' : ''}`}
              onClick={() => setLightboxIndex(photos.indexOf(photo))}
            >
              <input
                type="checkbox"
                checked={isSelected(photo.id)}
                onChange={() => togglePhotoSelection(photo.id)}
                onClick={e => e.stopPropagation()}
                className="w-4 h-4 rounded accent-primary"
              />
              <img src={photo.thumbnail_url || photo.file_url} alt={photo.title}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{photo.title}</p>
                <p className="text-xs text-muted-foreground">{photo.location || 'Tanpa lokasi'}</p>
              </div>
              <div className="hidden sm:block text-xs text-muted-foreground">
                {photo.work_date ? formatDate(photo.work_date) : '-'}
              </div>
              <div className="hidden md:block text-xs text-muted-foreground">
                {photo.file_size ? formatBytes(photo.file_size) : '-'}
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDownload(photo) }}
                className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDownload={handleDownload}
        />
      )}

      {/* Upload Modal */}
      <UploadModal folders={folders} onSuccess={fetchPhotos} />
    </div>
  )
}
