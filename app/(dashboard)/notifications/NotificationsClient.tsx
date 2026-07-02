'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Bell, Check, Trash2, MailOpen, BellOff, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface NotificationsClientProps {
  initialNotifications: any[]
  userId: string
}

export function NotificationsClient({ initialNotifications, userId }: NotificationsClientProps) {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<any[]>(initialNotifications)
  const [loading, setLoading] = useState(false)

  const unreadCount = notifications.filter(n => !n.is_read).length

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-notif-page-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new, ...prev])
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
  }, [userId])

  async function handleMarkAllAsRead() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        toast({ title: 'Berhasil', description: 'Semua notifikasi ditandai sebagai terbaca.' })
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleNotificationClick(notif: any) {
    try {
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
      if (notif.link) {
        router.push(notif.link)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 fade-in max-w-3xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6 text-orange-400" />
              Notifikasi Saya
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Riwayat notifikasi dan pembaruan sistem Anda
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Tandai Semua Dibaca
          </button>
        )}
      </div>

      {/* List */}
      <div className="glass-card divide-y divide-border overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <BellOff className="w-12 h-12 text-muted-foreground/40" />
            <h3 className="font-semibold text-foreground">Tidak Ada Notifikasi</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Semua notifikasi baru atau pembaruan status foto Anda akan muncul di sini.
            </p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 cursor-pointer hover:bg-muted/30 transition-all flex items-start gap-4 ${
                !notif.is_read ? 'bg-orange-500/5 border-l-4 border-orange-500' : ''
              }`}
            >
              {/* Type icon indicator */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                notif.type === 'approval' ? 'bg-green-500/10 text-green-400' :
                notif.type === 'comment' ? 'bg-blue-500/10 text-blue-400' :
                'bg-orange-500/10 text-orange-400'
              }`}>
                <Bell className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <h3 className={`text-sm font-semibold text-foreground ${!notif.is_read ? 'font-bold' : ''}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-slate-500 flex-shrink-0">{timeAgo(notif.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  {notif.message}
                </p>
                {!notif.is_read && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/25 mt-2">
                    Belum Dibaca
                  </span>
                )}
              </div>

              {notif.link && (
                <div className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
