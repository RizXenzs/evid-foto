'use client'

import { useState, useTransition } from 'react'
import { Search, Loader2, Image, Tag, MapPin, FolderOpen, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatBytes } from '@/lib/utils'
import { PhotoLightbox } from '@/components/photos/PhotoLightbox'
import { saveAs } from 'file-saver'
import type { Photo } from '@/types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Photo[]>([])
  const [searched, setSearched] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()
  const supabase = createClient()

  async function handleSearch(q: string) {
    setQuery(q)
    if (!q.trim()) {
      setResults([])
      setSearched(false)
      return
    }

    startTransition(async () => {
      const { data } = await supabase
        .from('photos')
        .select('*, uploader:profiles(full_name, email), folder:folders(name, color)')
        .eq('is_deleted', false)
        .or(`title.ilike.%${q}%,caption.ilike.%${q}%,location.ilike.%${q}%`)
        .order('upload_date', { ascending: false })
        .limit(50)

      setResults((data || []) as Photo[])
      setSearched(true)
    })
  }

  async function handleDownload(photo: Photo) {
    const response = await fetch(photo.file_url)
    const blob = await response.blob()
    saveAs(blob, photo.file_name)
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pencarian</h1>
        <p className="text-muted-foreground text-sm">Cari foto berdasarkan judul, keterangan, lokasi, atau tag</p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          id="search-input"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Ketik untuk mencari foto..."
          autoFocus
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-border bg-muted text-foreground text-base
            outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {isPending && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Results */}
      {searched && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {results.length === 0
              ? `Tidak ada hasil untuk "${query}"`
              : `${results.length} foto ditemukan untuk "${query}"`
            }
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 glass-card">
              <Image className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">Foto tidak ditemukan</p>
              <p className="text-muted-foreground text-sm mt-1">Coba kata kunci lain</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((photo, index) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(index)}
                  className="glass-card flex items-center gap-4 p-4 cursor-pointer hover:border-primary/30 transition-all duration-200"
                >
                  <img src={photo.thumbnail_url || photo.file_url} alt={photo.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{photo.title}</p>
                    {photo.caption && <p className="text-sm text-muted-foreground truncate">{photo.caption}</p>}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {photo.location && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />{photo.location}
                        </span>
                      )}
                      {photo.folder && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FolderOpen className="w-3 h-3" />{(photo.folder as any).name}
                        </span>
                      )}
                      {photo.tags && photo.tags.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Tag className="w-3 h-3" />{photo.tags.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{formatDate(photo.upload_date)}</p>
                    {photo.file_size && <p className="text-xs text-muted-foreground">{formatBytes(photo.file_size)}</p>}
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
        </div>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center py-16 text-center glass-card">
          <Search className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-foreground font-medium">Mulai Pencarian</p>
          <p className="text-muted-foreground text-sm mt-1">Ketik judul, lokasi, atau tag untuk mencari foto</p>
        </div>
      )}

      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={results}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}
