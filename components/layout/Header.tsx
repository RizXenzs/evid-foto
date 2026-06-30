'use client'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, Upload, Search, Camera } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import type { Profile } from '@/types'

interface HeaderProps {
  profile: Profile | null
}

export function Header({ profile }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { setUploadModalOpen } = useAppStore()
  const router = useRouter()
  const supabase = createClient()

  return (
    <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 bg-background/95 backdrop-blur-sm">
      {/* Left: Logo on mobile, search on desktop */}
      <div className="flex items-center gap-3">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base">EvidFoto</span>
        </div>

        {/* Desktop search */}
        <button
          onClick={() => router.push('/search')}
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-muted-foreground border border-border
            hover:border-primary/50 hover:text-foreground transition-all duration-200 bg-muted/50"
        >
          <Search className="w-4 h-4" />
          <span>Cari foto, folder, tag...</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Mobile search icon */}
        <button
          onClick={() => router.push('/search')}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground
            hover:text-foreground hover:bg-muted transition-all duration-200 border border-border"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Upload button (admin only) */}
        {profile?.role === 'admin' && (
          <button
            id="btn-upload-header"
            onClick={() => setUploadModalOpen(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-medium text-white
              transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden md:block">Upload Foto</span>
          </button>
        )}

        {/* Theme toggle */}
        <button
          id="btn-theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground
            hover:text-foreground hover:bg-muted transition-all duration-200 border border-border"
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Avatar */}
        {profile && (
          <div className="relative">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
              onClick={() => router.push(profile.avatar_url ? '/profile' : '/setup-profile')}
              title={profile.avatar_url ? 'Profil Saya' : 'Upload Foto Profil'}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                : getInitials(profile.full_name || profile.email)
              }
            </div>
            {/* Dot orange jika belum punya foto profil */}
            {!profile.avatar_url && (
              <div
                className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-orange-500 border-2"
                style={{ borderColor: 'hsl(var(--background))' }}
                title="Upload foto profil"
              />
            )}
          </div>
        )}
      </div>
    </header>
  )
}
