'use client'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sun, Moon, Upload, Search, Camera, Bell, Check, ExternalLink, MailOpen, BellOff } from 'lucide-react'
import { getInitials, timeAgo } from '@/lib/utils'
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

  const [notifications, setNotifications] = useState<any[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!profile) return
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const { data } = await res.json()
        setNotifications(data || [])
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    }
  }

  // Request notifications permission & Service Worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Realtime notifications subscription
  useEffect(() => {
    if (!profile) return
    fetchNotifications()

    const channel = supabase
      .channel(`realtime-notifications-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev])
            // Trigger native push popup
            if (Notification.permission === 'granted') {
              new Notification(payload.new.title, {
                body: payload.new.message,
                icon: '/icon-192.png',
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev =>
              prev.map(n => (n.id === payload.new.id ? payload.new : n))
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleNotificationClick(notif: any) {
    try {
      // Mark as read
      if (!notif.is_read) {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id })
        })
        setNotifications(prev =>
          prev.map(n => (n.id === notif.id ? { ...n, is_read: true } : n))
        )
      }
      setDropdownOpen(false)
      if (notif.link) {
        router.push(notif.link)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <header className="h-14 md:h-16 border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 bg-background/95 backdrop-blur-sm relative z-40">
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
      <div className="flex items-center gap-2 relative">
        {/* Mobile search icon */}
        <button
          onClick={() => router.push('/search')}
          className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground
            hover:text-foreground hover:bg-muted transition-all duration-200 border border-border"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Upload button - semua user bisa upload foto evident */}
        {profile && (
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

        {/* Notifications (Lonceng) */}
        {profile && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 border border-border relative"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-background animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-80 max-h-[30rem] flex flex-col rounded-2xl border border-border shadow-2xl overflow-hidden glass-card fade-in"
                style={{
                  background: 'hsl(var(--card))',
                }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                  <span className="text-sm font-semibold text-foreground">Notifikasi</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Semua Dibaca
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                      <BellOff className="w-8 h-8 text-muted-foreground/60" />
                      <p className="text-sm text-muted-foreground">Tidak ada notifikasi.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.slice(0, 15).map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-3 text-left cursor-pointer hover:bg-muted/40 transition-colors flex items-start gap-2.5 ${
                            !notif.is_read ? 'bg-primary/5 border-l-2 border-primary' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                            !notif.is_read ? 'bg-orange-500' : 'bg-transparent'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground leading-snug">{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-slate-500 block mt-1">{timeAgo(notif.created_at)}</span>
                          </div>
                          {notif.link && <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0 mt-1" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false)
                    router.push('/notifications')
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-muted-foreground border-t border-border hover:bg-muted/30 transition-colors"
                >
                  Lihat Semua Notifikasi
                </button>
              </div>
            )}
          </div>
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
