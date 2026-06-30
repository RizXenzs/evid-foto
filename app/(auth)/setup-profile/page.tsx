'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Upload, User, Loader2, CheckCircle2, ArrowRight, X, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function SetupProfilePage() {
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Format tidak didukung', description: 'Hanya file gambar (JPG, PNG, WEBP) yang diizinkan.', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File terlalu besar', description: 'Maksimal ukuran foto adalah 5MB.', variant: 'destructive' })
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [])

  async function handleUpload() {
    if (!avatarFile) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const fd = new FormData()
      fd.append('file', avatarFile)
      fd.append('userId', user.id)

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload gagal')
      }

      setDone(true)
      toast({ title: 'Foto profil berhasil disimpan! 🎉' })

      setTimeout(() => router.push('/dashboard'), 1800)
    } catch (err: any) {
      toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' })
      setUploading(false)
    }
  }

  async function handleSkip() {
    router.push('/dashboard')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl" />

      <div className="relative w-full max-w-md slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 pulse-glow"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            <Camera className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EvidFoto</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Satu langkah lagi!</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/10 p-6 md:p-8"
          style={{ background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(20px)' }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
              style={{ background: 'rgba(249, 115, 22, 0.15)' }}>
              <User className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Pasang Foto Profil</h2>
            <p className="text-slate-400 text-sm mt-1">
              Tambahkan foto agar rekan tim bisa mengenali Anda
            </p>
          </div>

          {/* Upload area */}
          {!done ? (
            <div className="space-y-5">
              {/* Drop zone */}
              <div
                className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                  ${dragging
                    ? 'border-orange-400 bg-orange-500/10 scale-[1.02]'
                    : avatarPreview
                    ? 'border-white/20 bg-transparent'
                    : 'border-white/15 hover:border-white/30 hover:bg-white/5'
                  }`}
                style={{ minHeight: '200px' }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !avatarPreview && fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="w-full h-52 object-cover rounded-2xl"
                    />
                    {/* Overlay with change button */}
                    <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 hover:opacity-100
                      transition-all duration-200 flex flex-col items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                        style={{ background: 'rgba(249,115,22,0.9)' }}
                      >
                        <Upload className="w-4 h-4" />
                        Ganti Foto
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setAvatarFile(null); setAvatarPreview(null) }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                        style={{ background: 'rgba(239,68,68,0.8)' }}
                      >
                        <X className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10 gap-3">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium text-sm">
                        {dragging ? 'Lepaskan untuk upload' : 'Klik atau seret foto ke sini'}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">JPG, PNG, WEBP • Maks. 5MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                      className="mt-1 flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-medium
                        transition-all duration-200 hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                    >
                      <Upload className="w-4 h-4" />
                      Pilih Foto
                    </button>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* File info */}
              {avatarFile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
                  <CheckCircle2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-xs text-orange-300 truncate">{avatarFile.name}</p>
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    ({(avatarFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleUpload}
                  disabled={!avatarFile || uploading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm
                    flex items-center justify-center gap-2
                    transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30
                    hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                  style={{ background: uploading || !avatarFile ? '#6B7280' : 'linear-gradient(135deg, #F97316, #EA580C)' }}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Simpan Foto Profil
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkip}
                  disabled={uploading}
                  className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-400
                    hover:text-slate-200 hover:bg-white/5 transition-all duration-200
                    flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Lewati dulu
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Success state */
            <div className="flex flex-col items-center justify-center py-8 gap-5">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden"
                  style={{ border: '3px solid #F97316' }}>
                  {avatarPreview && (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-white font-bold text-lg">Foto Tersimpan! 🎉</h3>
                <p className="text-slate-400 text-sm mt-1">Mengalihkan ke dashboard...</p>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 border-t-orange-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Tip */}
        {!done && (
          <p className="text-center text-slate-600 text-xs mt-5">
            Foto profil dapat diubah kapan saja melalui halaman{' '}
            <span className="text-slate-500">Profil Saya</span>
          </p>
        )}
      </div>
    </div>
  )
}
