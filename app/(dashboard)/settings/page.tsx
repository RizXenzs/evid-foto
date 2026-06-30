'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { Sun, Moon, Lock, Loader2, Save, Shield } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Password baru tidak cocok.', variant: 'destructive' })
      return
    }
    if (newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password minimal 8 karakter.', variant: 'destructive' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Password diperbarui', description: 'Password berhasil diubah.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 fade-in max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>

      {/* Appearance */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sun className="w-4 h-4 text-orange-400" />
          Tampilan
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
              ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
              <Moon className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm font-medium text-foreground">Mode Gelap</span>
            {theme === 'dark' && <span className="text-xs text-primary">Aktif</span>}
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
              ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'}`}
          >
            <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
              <Sun className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-sm font-medium text-foreground">Mode Terang</span>
            {theme === 'light' && <span className="text-xs text-primary">Aktif</span>}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-400" />
          Ganti Password
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Password Baru</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="Min. 8 karakter"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Konfirmasi Password Baru</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>
          <button onClick={handleChangePassword} disabled={loading || !newPassword || !confirmPassword}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Ganti Password
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-6 border-orange-500/20">
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-orange-400" />
          Informasi Keamanan
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Sesi login diverifikasi secara otomatis
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Data tersimpan aman di Supabase (enkripsi TLS)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Akses dikontrol berdasarkan role
          </li>
        </ul>
      </div>
    </div>
  )
}
