'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

interface ProfileClientProps {
  profile: Profile
}

export function ProfileClient({ profile: initialProfile }: ProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [fullName, setFullName] = useState(initialProfile.full_name || '')
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [deleteAvatarConfirm, setDeleteAvatarConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const { toast } = useToast()

  async function handleSaveProfile() {
    setLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (!error) {
      setProfile(prev => ({ ...prev, full_name: fullName }))
      await supabase.from('activity_logs').insert({
        user_id: profile.id, action: 'update_profile', target_type: 'user', target_name: fullName
      })
      toast({ title: 'Profil diperbarui', description: 'Informasi profil Anda telah disimpan.' })
    } else {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' })
    }
    setLoading(false)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File terlalu besar', description: 'Maksimal ukuran foto profil 5MB.', variant: 'destructive' })
      return
    }

    setAvatarLoading(true)

    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('userId', profile.id)

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: fd,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal upload')
      }

      const { publicUrl } = await res.json()
      const urlWithCache = `${publicUrl}?t=${Date.now()}`
      setProfile(prev => ({ ...prev, avatar_url: urlWithCache }))
      toast({ title: 'Foto profil diperbarui ✓' })
    } catch (err: any) {
      toast({ title: 'Gagal upload', description: err.message, variant: 'destructive' })
    }

    setAvatarLoading(false)
  }

  async function handleDeleteAvatar() {
    setAvatarLoading(true)
    const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id)
    if (!error) {
      setProfile(prev => ({ ...prev, avatar_url: null }))
      toast({ title: 'Foto profil dihapus' })
    } else {
      toast({ title: 'Gagal hapus', description: error.message, variant: 'destructive' })
    }
    setAvatarLoading(false)
    setDeleteAvatarConfirm(false)
  }

  return (
    <div className="space-y-4 md:space-y-6 fade-in max-w-2xl">
      <h1 className="text-xl md:text-2xl font-bold text-foreground">Profil Saya</h1>

      {/* Avatar Card */}
      <div className="glass-card p-5 md:p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Foto Profil</h2>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar display */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl flex items-center justify-center text-2xl font-bold text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                : getInitials(profile.full_name || profile.email)
              }
            </div>
            {/* Loading overlay */}
            {avatarLoading && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full text-white
                flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>

          {/* Avatar info and actions */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-foreground">{profile.full_name || 'Belum diisi'}</h3>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2
              ${profile.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {profile.role === 'admin' ? '🛡️ Administrator' : '👤 User'}
            </span>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white
                  transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
              >
                <Camera className="w-4 h-4" />
                {profile.avatar_url ? 'Ganti Foto' : 'Upload Foto'}
              </button>
              {profile.avatar_url && (
                <button
                  onClick={() => setDeleteAvatarConfirm(true)}
                  disabled={avatarLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus Foto
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Format: JPG, PNG, WEBP • Maks. 5MB</p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="glass-card p-5 md:p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Informasi Profil</h2>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Lengkap</label>
          <input
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Nama lengkap Anda"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
              outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
          <input
            value={profile.email}
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">Email tidak dapat diubah</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
          <input
            value={profile.role === 'admin' ? 'Administrator' : 'User (Pengguna Biasa)'}
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground mt-1">Role ditentukan oleh administrator</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Bergabung Sejak</label>
          <input
            value={new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            disabled
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed"
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
            transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Perubahan
        </button>
      </div>

      {/* Delete avatar confirmation */}
      {deleteAvatarConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteAvatarConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl slide-up"
            style={{ background: 'hsl(var(--card))' }}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Hapus Foto Profil?</h3>
                <p className="text-muted-foreground text-sm mt-1">Foto profil Anda akan dihapus dan tidak dapat dikembalikan.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setDeleteAvatarConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteAvatar}
                  disabled={avatarLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                >
                  {avatarLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
