'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Shield, User, ToggleLeft, ToggleRight, Loader2, UserPlus, X } from 'lucide-react'
import { formatDateTime, getInitials } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Profile } from '@/types'

interface UsersClientProps {
  users: Profile[]
  currentUserId: string
}

export function UsersClient({ users: initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user')
  const [inviteName, setInviteName] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  async function toggleActive(user: Profile) {
    setLoading(user.id)
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: !user.is_active, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      toast({ title: 'Berhasil', description: `User ${!user.is_active ? 'diaktifkan' : 'dinonaktifkan'}.` })
    }
    setLoading(null)
  }

  async function changeRole(user: Profile, role: 'admin' | 'user') {
    setLoading(user.id + '-role')
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role } : u))
      toast({ title: 'Role diubah', description: `${user.full_name || user.email} sekarang ${role}.` })
    }
    setLoading(null)
  }

  async function handleInvite() {
    setLoading('invite')
    try {
      // Use admin API to create user (via service role key on API route)
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, password: invitePassword, full_name: inviteName, role: inviteRole }),
      })
      const result = await response.json()
      if (result.error) throw new Error(result.error)

      toast({ title: 'User dibuat', description: `${inviteEmail} berhasil didaftarkan.` })
      setShowInviteModal(false)
      setInviteEmail('')
      setInviteName('')
      setInvitePassword('')
      // Refresh user list
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (data) setUsers(data as Profile[])
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' })
    }
    setLoading(null)
  }

  async function handleDelete(user: Profile) {
    if (!confirm(`Hapus permanen akun "${user.full_name || user.email}"?\nTindakan ini tidak dapat dibatalkan.`)) return
    setLoading(user.id + '-del')
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.error) throw new Error(result.error)
      setUsers(prev => prev.filter(u => u.id !== user.id))
      toast({ title: 'User dihapus', description: `Akun ${user.full_name || user.email} telah dihapus permanen.`, variant: 'destructive' })
    } catch (err: any) {
      toast({ title: 'Gagal hapus', description: err.message, variant: 'destructive' })
    }
    setLoading(null)
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen User</h1>
          <p className="text-muted-foreground text-sm">{users.length} user terdaftar</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
            transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
        >
          <UserPlus className="w-4 h-4" />
          Tambah User
        </button>
      </div>

      {/* Users table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bergabung</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
                        {user.avatar_url
                          ? <img src={user.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                          : getInitials(user.full_name || user.email)
                        }
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.id !== currentUserId ? (
                      <select
                        value={user.role}
                        onChange={e => changeRole(user, e.target.value as 'admin' | 'user')}
                        disabled={loading === user.id + '-role'}
                        className="px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground text-xs outline-none
                          focus:border-primary transition-all cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                        ${user.role === 'admin' ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {user.role === 'admin' ? 'Admin' : 'User'}
                        <span className="text-muted-foreground ml-1">(Anda)</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium
                      ${user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDateTime(user.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    {user.id !== currentUserId && (
                      <div className="flex items-center gap-2">
                        {/* Aktifkan/Nonaktifkan */}
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={!!loading}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                            ${user.is_active
                              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                            }`}
                        >
                          {loading === user.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : user.is_active ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />
                          }
                          {user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        {/* Hapus Permanen */}
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={!!loading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                            bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-500/20"
                          title="Hapus permanen"
                        >
                          {loading === user.id + '-del'
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Trash2 className="w-3 h-3" />
                          }
                          Hapus
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowInviteModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 slide-up"
            style={{ background: 'hsl(var(--card))' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Tambah User Baru</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Lengkap</label>
                <input value={inviteName} onChange={e => setInviteName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                    outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  placeholder="email@perusahaan.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                    outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)}
                  placeholder="Min. 8 karakter"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                    outline-none focus:border-primary transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as 'admin' | 'user')}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                    outline-none focus:border-primary transition-all">
                  <option value="user">User (Lihat & Download)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm hover:bg-muted transition-colors">
                Batal
              </button>
              <button onClick={handleInvite}
                disabled={loading === 'invite' || !inviteEmail || !invitePassword}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white
                  disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                {loading === 'invite' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Buat Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
