'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { FolderOpen, ArrowLeft, Upload, ImageIcon, Download } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { UploadModal } from '@/components/photos/UploadModal'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import { formatDate } from '@/lib/utils'
import type { Folder } from '@/types'

interface FolderDetailClientProps {
  folder: any
  initialPhotos: any[]
  subfolders: any[]
  folders: Folder[]
  userRole: string
}

export function FolderDetailClient({ folder, initialPhotos, subfolders, folders, userRole }: FolderDetailClientProps) {
  const [photos, setPhotos] = useState<any[]>(initialPhotos)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { setUploadModalOpen, setUploadTargetFolder } = useAppStore()
  const supabase = createClient()

  function handleOpenUpload() {
    setUploadTargetFolder(folder.id)
    setUploadModalOpen(true)
  }

  const handleUploadSuccess = useCallback(async () => {
    // Re-fetch photos for this folder after successful upload
    const { data } = await supabase
      .from('photos')
      .select('*, uploader:profiles(full_name)')
      .eq('folder_id', folder.id)
      .eq('is_deleted', false)
      .order('upload_date', { ascending: false })
    if (data) setPhotos(data)
  }, [folder.id, supabase])

  async function handleDownload(photo: any) {
    try {
      const res = await fetch(photo.file_url)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.file_name || `${photo.title}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(photo.file_url, '_blank')
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/folders" className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${folder.color}20`, border: `1px solid ${folder.color}40` }}>
              <FolderOpen className="w-5 h-5" style={{ color: folder.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{folder.name}</h1>
              {folder.description && <p className="text-muted-foreground text-sm">{folder.description}</p>}
            </div>
          </div>
        </div>

        {/* Upload button for this folder - izinkan semua user upload foto evident ke folder */}
        <button
          onClick={handleOpenUpload}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
            transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
        >
          <Upload className="w-4 h-4" />
          Upload ke Folder Ini
        </button>
      </div>

      {/* Subfolders */}
      {subfolders && subfolders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Subfolder</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {subfolders.map(sf => (
              <Link key={sf.id} href={`/folders/${sf.id}`}
                className="glass-card p-4 flex items-center gap-3 hover:border-primary/30 transition-all duration-200">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${sf.color}20` }}>
                  <FolderOpen className="w-4 h-4" style={{ color: sf.color }} />
                </div>
                <span className="font-medium text-foreground text-sm truncate">{sf.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Foto ({photos.length})
        </h2>
        {photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center glass-card">
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Belum ada foto di folder ini</p>
             <button
               onClick={handleOpenUpload}
               className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
                 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30"
               style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
             >
               <Upload className="w-4 h-4" />
               Upload Foto Pertama
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="photo-card aspect-square cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={photo.thumbnail_url || photo.file_url}
                  alt={photo.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="photo-card-overlay">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-medium truncate">{photo.title}</p>
                    {photo.work_date && <p className="text-white/70 text-xs">{formatDate(photo.work_date)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal folders={folders} onSuccess={handleUploadSuccess} />

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}
