'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, Send, Trash2, CornerDownRight, Loader2, X } from 'lucide-react'
import { timeAgo, getInitials } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { PhotoComment } from '@/types'

interface PhotoCommentsProps {
  photoId: string
  currentUserId: string
  isAdmin: boolean
}

function Avatar({ user }: { user?: PhotoComment['user'] }) {
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
  }
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
    >
      {getInitials(user?.full_name || user?.email || '?')}
    </div>
  )
}

export function PhotoComments({ photoId, currentUserId, isAdmin }: PhotoCommentsProps) {
  const supabase = createClient()
  const { toast } = useToast()
  const bottomRef = useRef<HTMLDivElement>(null)

  const [comments, setComments] = useState<PhotoComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<PhotoComment | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch comments on mount
  async function fetchComments() {
    setLoading(true)
    const res = await fetch(`/api/comments?photo_id=${photoId}`)
    if (res.ok) {
      const { data } = await res.json()
      setComments(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [photoId])

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`photo-comments-${photoId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photo_comments',
          filter: `photo_id=eq.${photoId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch fresh data to get user relations
            fetchComments()
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [photoId])

  // Scroll to bottom on new comments
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments.length, loading])

  async function handleSubmit() {
    const text = newComment.trim()
    if (!text || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo_id: photoId,
          comment: text,
          parent_id: replyTo?.id || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setNewComment('')
      setReplyTo(null)
      // Realtime will handle refresh, but also fetch manually for reliability
      await fetchComments()
    } catch (err: any) {
      toast({ title: 'Gagal kirim', description: err.message, variant: 'destructive' })
    }
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      setComments(prev => prev.filter(c => c.id !== id && c.parent_id !== id))
    } catch (err: any) {
      toast({ title: 'Gagal hapus', description: err.message, variant: 'destructive' })
    }
    setDeletingId(null)
  }

  // Separate top-level and replies
  const topLevel = comments.filter(c => !c.parent_id)
  const getReplies = (id: string) => comments.filter(c => c.parent_id === id)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 flex-shrink-0">
        <MessageCircle className="w-4 h-4 text-orange-400" />
        <span className="text-sm font-semibold text-white">Komentar</span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/70">
          {comments.length}
        </span>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : topLevel.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageCircle className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-slate-500 text-sm">Belum ada komentar.</p>
            <p className="text-slate-600 text-xs mt-1">Jadilah yang pertama berkomentar!</p>
          </div>
        ) : (
          topLevel.map(comment => {
            const replies = getReplies(comment.id)
            const canDelete = isAdmin || comment.user_id === currentUserId
            return (
              <div key={comment.id} className="space-y-2">
                {/* Top-level comment */}
                <div className="flex gap-2.5 group">
                  <Avatar user={comment.user} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">
                        {comment.user?.full_name || comment.user?.email || 'User'}
                      </span>
                      <span className="text-[10px] text-slate-500">{timeAgo(comment.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-300 mt-0.5 break-words">{comment.comment}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => setReplyTo(replyTo?.id === comment.id ? null : comment)}
                        className="text-[11px] text-slate-500 hover:text-orange-400 transition-colors font-medium"
                      >
                        {replyTo?.id === comment.id ? 'Batal Balas' : 'Balas'}
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          disabled={deletingId === comment.id}
                          className="text-[11px] text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          {deletingId === comment.id
                            ? <Loader2 className="w-3 h-3 animate-spin inline" />
                            : <Trash2 className="w-3 h-3 inline" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div className="ml-10 space-y-2 border-l border-white/5 pl-3">
                    {replies.map(reply => {
                      const canDeleteReply = isAdmin || reply.user_id === currentUserId
                      return (
                        <div key={reply.id} className="flex gap-2 group">
                          <Avatar user={reply.user} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 flex-wrap">
                              <CornerDownRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                              <span className="text-xs font-semibold text-white">
                                {reply.user?.full_name || reply.user?.email || 'User'}
                              </span>
                              <span className="text-[10px] text-slate-500">{timeAgo(reply.created_at)}</span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5 break-words">{reply.comment}</p>
                            {canDeleteReply && (
                              <button
                                onClick={() => handleDelete(reply.id)}
                                disabled={deletingId === reply.id}
                                className="mt-0.5 text-[11px] text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                {deletingId === reply.id
                                  ? <Loader2 className="w-3 h-3 animate-spin inline" />
                                  : <Trash2 className="w-3 h-3 inline" />
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div className="mx-4 mb-1 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
          <span className="text-xs text-orange-300">
            Membalas <strong>{replyTo.user?.full_name || 'komentar'}</strong>
          </span>
          <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="flex gap-2">
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder={replyTo ? `Balas ${replyTo.user?.full_name || ''}...` : 'Tulis komentar...'}
            rows={2}
            className="flex-1 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-500
              outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!newComment.trim() || submitting}
            className="w-9 h-9 mt-auto flex items-center justify-center rounded-xl text-white disabled:opacity-40 transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-1">Enter untuk kirim · Shift+Enter untuk baris baru</p>
      </div>
    </div>
  )
}
