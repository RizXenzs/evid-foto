'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Images, FolderOpen, Calendar, Search,
  Download, Users, Trash2, User, Settings, Camera,
  LogOut, Menu, X, Upload, ChevronRight, UserCircle
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import type { Profile } from '@/types'

interface MobileNavProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/photos', label: 'Foto', icon: Images },
  { href: '/folders', label: 'Folder', icon: FolderOpen },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
  { href: '/search', label: 'Cari', icon: Search },
]

const adminNavItems = [
  { href: '/users', label: 'Users', icon: Users },
  { href: '/trash', label: 'Sampah', icon: Trash2 },
]

export function MobileNav({ profile }: MobileNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const supabase = createClient()
  const { setUploadModalOpen } = useAppStore()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const bottomTabs = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/photos', label: 'Foto', icon: Images },
    { href: '/search', label: 'Cari', icon: Search },
    { href: '/downloads', label: 'Unduh', icon: Download },
  ]

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 flex md:hidden"
        style={{ background: 'linear-gradient(180deg, #0F172A 0%, #0A0F1E 100%)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {bottomTabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200',
              isActive(item.href)
                ? 'text-orange-400'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
        {/* Avatar / Menu button */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-200',
            'text-slate-500 hover:text-slate-300'
          )}
        >
          {profile ? (
            <div className="relative">
              <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
              >
                {profile.avatar_url
                  ? <img src={profile.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                  : getInitials(profile.full_name || profile.email)
                }
              </div>
              {/* Dot indicator jika belum ada foto profil */}
              {!profile.avatar_url && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 border border-[#0F172A]" />
              )}
            </div>
          ) : (
            <Menu className="w-5 h-5" />
          )}
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Drawer panel */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden rounded-t-3xl transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, #0A0F1E 100%)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-white font-bold text-base">EvidFoto</h2>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        {profile && (
          <div className="mx-4 mt-4 p-3 rounded-2xl border border-white/5 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="relative w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                : getInitials(profile.full_name || profile.email)
              }
              {/* Dot jika belum ada foto */}
              {!profile.avatar_url && (
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-orange-500 border-2 border-[#0F172A] z-10" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{profile.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{profile.email}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profile.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {profile.role === 'admin' ? 'Admin' : 'User'}
            </span>
          </div>
        )}

        {/* Banner upload foto untuk user yang belum punya foto profil */}
        {profile && !profile.avatar_url && (
          <div className="mx-4 mt-3">
            <button
              onClick={() => { router.push('/setup-profile'); setDrawerOpen(false) }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.1))', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(249,115,22,0.2)' }}
              >
                <UserCircle className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-orange-300">Foto profil belum dipasang</p>
                <p className="text-[11px] text-orange-400/70 mt-0.5">Tap untuk upload foto profil</p>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Upload button - semua user bisa upload foto evident/laporan */}
        {profile && (
          <div className="px-4 mt-3">
            <button
              onClick={() => { setUploadModalOpen(true); setDrawerOpen(false) }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              <Upload className="w-4 h-4" />
              Upload Foto Laporan
            </button>
          </div>
        )}

        {/* Nav items */}
        <div className="px-4 py-3 space-y-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 pb-1">Menu Utama</p>
          {[
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { href: '/photos', label: 'Semua Foto', icon: Images },
            { href: '/folders', label: 'Folder', icon: FolderOpen },
            { href: '/calendar', label: 'Kalender', icon: Calendar },
            { href: '/search', label: 'Pencarian', icon: Search },
            { href: '/downloads', label: 'Unduhan Saya', icon: Download },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive(item.href)
                  ? 'text-white bg-blue-500/20 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive(item.href) && <ChevronRight className="w-4 h-4 text-blue-400" />}
            </Link>
          ))}
        </div>

        {/* Admin nav */}
        {profile?.role === 'admin' && (
          <div className="px-4 pb-3 space-y-1">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 pb-1">Administrasi</p>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive(item.href)
                    ? 'text-white bg-orange-500/20 border border-orange-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom actions */}
        <div className="px-4 pb-6 space-y-1 border-t border-white/5 pt-3">
          <Link
            href="/profile"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <User className="w-5 h-5" />
            Profil Saya
          </Link>
          <Link
            href="/settings"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Settings className="w-5 h-5" />
            Pengaturan
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </div>
    </>
  )
}
