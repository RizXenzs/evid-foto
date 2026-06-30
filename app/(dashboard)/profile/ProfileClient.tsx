'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, User, Save } from 'lucide-react'
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
    setAvatarLoading(true)

    const ext = file.name.split('.').pop()
    const fileName = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true })
    if (uploadError) {
      toast({ title: 'Gagal', description: uploadError.message, variant: 'destructive' })
      setAvatarLoading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    if (!error) {
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
      toast({ title: 'Avatar diperbarui' })
    }
    setAvatarLoading(false)
  }

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Profil Saya</h1>

      <div className="glass-card p-6 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-xl font-bold text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                : getInitials(profile.full_name || profile.email)
              }
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarLoading}
              className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-orange-500 text-white
                flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg"
            >
              {avatarLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{profile.full_name || 'Belum diisi'}</h2>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1
              ${profile.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {profile.role === 'admin' ? 'Administrator' : 'User'}
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4 pt-2 border-t border-border">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Lengkap</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Nama lengkap Anda"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <input value={profile.email} disabled
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-muted-foreground text-sm cursor-not-allowed" />
            <p className="text-xs text-muted-foreground mt-1">Email tidak dapat diubah</p>
          </div>
          <button onClick={handleSaveProfile} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  )
}
