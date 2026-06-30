'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { X, Upload, Image, Loader2, Check, AlertCircle, FolderOpen, Tag } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useToast } from '@/components/ui/use-toast'
import type { Folder } from '@/types'

interface UploadFile {
  file: File
  preview: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

interface UploadModalProps {
  folders: Folder[]
  onSuccess?: () => void
}

export function UploadModal({ folders, onSuccess }: UploadModalProps) {
  const { uploadModalOpen, setUploadModalOpen, uploadTargetFolder, setUploadTargetFolder } = useAppStore()
  const [files, setFiles] = useState<UploadFile[]>([])
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedFolder, setSelectedFolder] = useState(uploadTargetFolder || '')

  // Sync selectedFolder whenever the modal opens with a target folder
  useEffect(() => {
    if (uploadModalOpen) {
      setSelectedFolder(uploadTargetFolder || '')
    }
  }, [uploadModalOpen, uploadTargetFolder])
  const [tags, setTags] = useState('')
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending' as const,
    }))
    setFiles(prev => [...prev, ...newFiles])
    if (!title && acceptedFiles[0]) {
      setTitle(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''))
    }
  }, [title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'] },
    maxSize: 50 * 1024 * 1024,
  })

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function handleUpload() {
    if (files.length === 0) return
    setUploading(true)

    let doneCount = 0

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i]
      setFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading', progress: 30 } : f
      ))

      try {
        const fileTitle = files.length === 1 ? title : `${title} (${i + 1})`
        const fd = new FormData()
        fd.append('file', uploadFile.file)
        fd.append('title', fileTitle)
        fd.append('caption', caption)
        fd.append('location', location)
        fd.append('workDate', workDate)
        fd.append('folderId', selectedFolder || '')
        fd.append('tags', tags)

        const res = await fetch('/api/photos', {
          method: 'POST',
          body: fd,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload gagal')
        }

        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'done', progress: 100 } : f
        ))
        doneCount++
      } catch (err: any) {
        setFiles(prev => prev.map((f, idx) =>
          idx === i ? { ...f, status: 'error', error: err.message } : f
        ))
        toast({
          title: 'Gagal Upload',
          description: `File "${fileTitle}": ${err.message}`,
          variant: 'destructive',
        })
      }
    }

    setUploading(false)
    if (doneCount > 0) {
      toast({ title: 'Upload Selesai', description: `${doneCount} foto berhasil diupload.` })
      onSuccess?.()
      handleClose()
    }
  }


  function handleClose() {
    setUploadModalOpen(false)
    setUploadTargetFolder(null)
    setFiles([])
    setTitle('')
    setCaption('')
    setLocation('')
    setTags('')
    setWorkDate(new Date().toISOString().split('T')[0])
  }

  if (!uploadModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal - full bottom sheet on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl slide-up overflow-hidden"
        style={{ background: 'hsl(var(--card))' }}
      >
        {/* Mobile handle */}
        <div className="flex sm:hidden justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base md:text-lg font-semibold text-foreground">Upload Foto</h2>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-5">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
              ${isDragActive
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
              }`}
          >
            <input {...getInputProps()} />
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="font-medium text-foreground">
              {isDragActive ? 'Lepaskan foto di sini!' : 'Drag & drop foto ke sini'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">atau klik untuk pilih file</p>
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG, WEBP • Maks. 50MB per file</p>
          </div>

          {/* File previews */}
          {files.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {files.map((f, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden aspect-square group">
                  <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  {f.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin mb-1" />
                      <div className="w-full px-3">
                        <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-300 rounded-full"
                            style={{ width: `${f.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {f.status === 'done' && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  {f.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                  )}
                  {f.status === 'pending' && (
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white
                        opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Metadata form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Judul Foto *</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Pekerjaan Pemasangan Pipa RT 05"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                  outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-foreground mb-1.5 block">Keterangan</label>
              <textarea
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Deskripsi singkat pekerjaan..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                  outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Lokasi Pekerjaan</label>
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Contoh: Jl. Merdeka No. 5, Jakarta"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                  outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Tanggal Pekerjaan</label>
              <input
                type="date"
                value={workDate}
                onChange={e => setWorkDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                  outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5" /> Folder Tujuan
              </label>
              <select
                value={selectedFolder}
                onChange={e => setSelectedFolder(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                  outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="">Tanpa Folder</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tag
              </label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="renovasi, instalasi, jalan (pisahkan koma)"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                  outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-t border-border flex-shrink-0"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <p className="text-sm text-muted-foreground">{files.length} file dipilih</p>
          <div className="flex gap-2 md:gap-3">
            <button onClick={handleClose} className="px-3 md:px-4 py-2 rounded-xl border border-border text-foreground text-sm hover:bg-muted transition-colors">
              Batal
            </button>
            <button
              id="btn-start-upload"
              onClick={handleUpload}
              disabled={uploading || files.length === 0 || !title}
              className="flex items-center gap-2 px-4 md:px-5 py-2 rounded-xl text-sm font-semibold text-white
                transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                hover:shadow-lg hover:shadow-orange-500/30"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" />Upload...</> : <><Upload className="w-4 h-4" />Upload {files.length > 0 ? `(${files.length})` : ''}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
