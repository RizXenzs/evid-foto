'use client'

import { useState } from 'react'
import { Download, Calendar, MapPin, Tag, User, FolderOpen, X, ChevronLeft, ChevronRight, MessageCircle, Info } from 'lucide-react'
import { formatDate, formatDateTime, formatBytes } from '@/lib/utils'
import { PhotoComments } from './PhotoComments'
import type { Photo } from '@/types'

interface PhotoLightboxProps {
  photos: Photo[]
  initialIndex: number
  onClose: () => void
  onDownload: (photo: Photo) => void
  currentUserId?: string
  isAdmin?: boolean
}

export function PhotoLightbox({ photos, initialIndex, onClose, onDownload, currentUserId = '', isAdmin = false }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [activePanel, setActivePanel] = useState<'info' | 'comments'>('info')
  const photo = photos[currentIndex]

  function prev() {
    setCurrentIndex(i => (i - 1 + photos.length) % photos.length)
  }
  function next() {
    setCurrentIndex(i => (i + 1) % photos.length)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
    if (e.key === 'Escape') onClose()
  }

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ background: 'rgba(0,0,0,0.95)', outline: 'none' }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 
          flex items-center justify-center text-white transition-all z-10"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white/10 text-white text-sm">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Prev */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20
          flex items-center justify-center text-white transition-all z-10 disabled:opacity-30"
        disabled={photos.length <= 1}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Next */}
      <button
        onClick={next}
        className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20
          flex items-center justify-center text-white transition-all z-10 disabled:opacity-30"
        style={{ right: '320px' }}
        disabled={photos.length <= 1}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-12 pr-0">
        <img
          src={photo.file_url}
          alt={photo.title}
          className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
        />
      </div>

      {/* Right panel */}
      <div className="w-80 h-full flex flex-col border-l border-white/10"
        style={{ background: 'rgba(15, 23, 42, 0.95)' }}
      >
        {/* Panel tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setActivePanel('info')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activePanel === 'info'
                ? 'text-white border-b-2 border-orange-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Info className="w-4 h-4" />
            Info
          </button>
          <button
            onClick={() => setActivePanel('comments')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activePanel === 'comments'
                ? 'text-white border-b-2 border-orange-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Komentar
          </button>
        </div>

        {/* Info panel */}
        {activePanel === 'info' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-white">{photo.title}</h3>
              {photo.caption && (
                <p className="text-slate-400 text-sm mt-1">{photo.caption}</p>
              )}
            </div>

            <div className="space-y-3">
              {photo.location && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">Lokasi Pekerjaan</p>
                    <p className="text-slate-200">{photo.location}</p>
                  </div>
                </div>
              )}
              {photo.work_date && (
                <div className="flex items-start gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">Tanggal Pekerjaan</p>
                    <p className="text-slate-200">{formatDate(photo.work_date, 'dd MMMM yyyy')}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                <Calendar className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-slate-500 text-xs">Waktu Upload</p>
                  <p className="text-slate-200">{formatDateTime(photo.upload_date)}</p>
                </div>
              </div>
              {photo.uploader && (
                <div className="flex items-start gap-2 text-sm">
                  <User className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">Diupload oleh</p>
                    <p className="text-slate-200">{photo.uploader.full_name || photo.uploader.email}</p>
                  </div>
                </div>
              )}
              {photo.folder && (
                <div className="flex items-start gap-2 text-sm">
                  <FolderOpen className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">Folder</p>
                    <p className="text-slate-200">{photo.folder.name}</p>
                  </div>
                </div>
              )}
              {photo.file_size && (
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 text-xs">Ukuran File</p>
                    <p className="text-slate-200">{formatBytes(photo.file_size)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {photo.tags && photo.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs text-slate-500">Tag</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {photo.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Download button */}
            <button
              onClick={() => onDownload(photo)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white
                transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              <Download className="w-4 h-4" />
              Unduh Foto
            </button>
          </div>
        )}

        {/* Comments panel */}
        {activePanel === 'comments' && (
          <div className="flex-1 flex flex-col min-h-0">
            <PhotoComments
              photoId={photo.id}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </div>
    </div>
  )
}
