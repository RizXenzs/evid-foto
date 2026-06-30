'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Camera, Loader2, UserPlus } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({ title: 'Password tidak cocok', description: 'Pastikan kedua password sama.', variant: 'destructive' })
      return
    }
    if (password.length < 8) {
      toast({ title: 'Password terlalu pendek', description: 'Password minimal 8 karakter.', variant: 'destructive' })
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Semua pendaftar baru SELALU mendapat role 'user' (lihat & download saja)
        data: { full_name: fullName, role: 'user' },
      },
    })

    if (error) {
      toast({
        title: 'Pendaftaran Gagal',
        description: error.message === 'User already registered'
          ? 'Email ini sudah terdaftar. Silakan login.'
          : error.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    toast({
      title: 'Pendaftaran Berhasil! 🎉',
      description: 'Akun Anda telah dibuat dengan akses Pengguna (lihat & download foto).',
    })

    setTimeout(() => router.push('/login'), 1500)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
    >
      {/* Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-md px-4 slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 pulse-glow"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EvidFoto</h1>
          <p className="text-slate-400 mt-1 text-sm">Manajemen Foto Pekerjaan</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 p-8"
          style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-semibold text-white">Daftar Akun Baru</h2>
          </div>

          {/* Info akses */}
          <div className="mb-5 px-3 py-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 text-sm">ℹ️</span>
            <p className="text-xs text-blue-300">
              Akun baru mendapat akses <strong>Pengguna</strong> — hanya bisa melihat dan mengunduh foto.
              Untuk akses Admin, hubungi administrator.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nama Lengkap</label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama lengkap Anda"
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm
                  border border-white/10 outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                  transition-all duration-200"
                style={{ background: 'rgba(15, 23, 42, 0.8)' }}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm
                  border border-white/10 outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                  transition-all duration-200"
                style={{ background: 'rgba(15, 23, 42, 0.8)' }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 karakter"
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-slate-500 text-sm
                    border border-white/10 outline-none
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                    transition-all duration-200"
                  style={{ background: 'rgba(15, 23, 42, 0.8)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Konfirmasi Password</label>
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password"
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm
                  border border-white/10 outline-none
                  focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                  transition-all duration-200"
                style={{ background: 'rgba(15, 23, 42, 0.8)' }}
              />
            </div>

            {/* Submit */}
            <button
              id="btn-register"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm mt-2
                flex items-center justify-center gap-2
                transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30
                hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: loading ? '#6B7280' : 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Daftar Sekarang
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 EvidFoto. All rights reserved.
        </p>
      </div>
    </div>
  )
}
