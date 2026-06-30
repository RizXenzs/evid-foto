'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Images, FolderOpen, Calendar, Search,
  Download, Users, Trash2, User, Settings, Camera,
  ChevronLeft, ChevronRight, LogOut, UserCircle, Upload
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import type { Profile } from '@/types'

interface SidebarProps {
  profile: Profile | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/photos', label: 'Semua Foto', icon: Images },
  { href: '/folders', label: 'Folder', icon: FolderOpen },
  { href: '/calendar', label: 'Kalender', icon: Calendar },
  { href: '/search', label: 'Pencarian', icon: Search },
  { href: '/downloads', label: 'Unduhan Saya', icon: Download },
]

const adminNavItems = [
  { href: '/users', label: 'Manajemen User', icon: Users },
  { href: '/trash', label: 'Sampah', icon: Trash2 },
]

const bottomNavItems = [
  { href: '/profile', label: 'Profil', icon: User },
  { href: '/settings', label: 'Pengaturan', icon: Settings },
]

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-screen transition-all duration-300 ease-in-out relative z-30',
        'border-r border-white/5',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
      style={{ background: 'linear-gradient(180deg, #0A0F1E 0%, #0F172A 100%)' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-white/5', collapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center pulse-glow"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
        >
          <Camera className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-white font-bold text-lg leading-none">EvidFoto</h1>
            <p className="text-slate-500 text-xs">Manajemen Foto</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* Main nav */}
        <div className="space-y-0.5">
          {!collapsed && (
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 pb-2">Menu Utama</p>
          )}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'nav-item',
                isActive(item.href) && 'active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        {/* Admin nav */}
        {profile?.role === 'admin' && (
          <div className="space-y-0.5 pt-4">
            {!collapsed && (
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 pb-2">Administrasi</p>
            )}
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'nav-item',
                  isActive(item.href) && 'active',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-white/5 pt-3">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'nav-item',
              isActive(item.href) && 'active',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {/* Banner upload foto untuk user yang belum punya foto profil (expanded) */}
        {!collapsed && profile && !profile.avatar_url && (
          <button
            onClick={() => router.push('/setup-profile')}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mt-2 text-left transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(234,88,12,0.08))', border: '1px solid rgba(249,115,22,0.25)' }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249,115,22,0.2)' }}
            >
              <Upload className="w-3.5 h-3.5 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-orange-300 leading-tight">Pasang foto profil</p>
              <p className="text-[10px] text-orange-400/60 mt-0.5">Klik untuk upload foto</p>
            </div>
          </button>
        )}

        {/* User info */}
        {!collapsed && profile && (
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl mt-2 border border-white/5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 cursor-pointer overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
              onClick={() => router.push(profile.avatar_url ? '/profile' : '/setup-profile')}
              title={profile.avatar_url ? 'Profil Saya' : 'Upload Foto Profil'}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                : getInitials(profile.full_name || profile.email)
              }
              {/* Orange dot indicator */}
              {!profile.avatar_url && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 border border-[#0A0F1E]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile.full_name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{profile.role}</p>
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Collapsed mode: dot indicator + logout */}
        {collapsed && profile && (
          <div className="flex flex-col items-center gap-1 mt-2">
            {/* Avatar dengan dot indicator jika belum punya foto */}
            <button
              onClick={() => router.push(profile.avatar_url ? '/profile' : '/setup-profile')}
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden mb-1"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
              title={profile.avatar_url ? 'Profil Saya' : 'Upload Foto Profil'}
            >
              {profile.avatar_url
                ? <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                : getInitials(profile.full_name || profile.email)
              }
              {!profile.avatar_url && (
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-orange-500 border border-[#0A0F1E]" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="nav-item justify-center px-2 w-full hover:text-red-400"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full border border-white/10 flex items-center justify-center
          text-slate-400 hover:text-white transition-colors z-40"
        style={{ background: '#1E293B' }}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )
}
