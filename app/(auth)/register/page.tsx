'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Camera, Loader2, UserPlus, User, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File terlalu besar', description: 'Maksimal ukuran foto 5MB.', variant: 'destructive' })
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

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

    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
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

    // Upload avatar via API route (pakai service role, tidak perlu session)
    if (avatarFile && authData.user) {
      try {
        const fd = new FormData()
        fd.append('file', avatarFile)
        fd.append('userId', authData.user.id)

        const res = await fetch('/api/upload-avatar', {
          method: 'POST',
          body: fd,
        })

        if (!res.ok) {
          // Avatar upload gagal — tidak critical, lanjutkan saja
          console.warn('Avatar upload failed:', await res.text())
        }
      } catch (avatarErr) {
        // Non-critical: user bisa upload avatar dari halaman Profil nanti
        console.warn('Avatar upload error:', avatarErr)
      }
    }

    toast({
      title: 'Pendaftaran Berhasil! 🎉',
      description: 'Akun Anda telah dibuat. Silakan masuk.',
    })

    setTimeout(() => router.push('/login'), 1500)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
    >
      {/* Blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-md px-4 slide-up">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 pulse-glow"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            <Camera className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EvidFoto</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Manajemen Foto Pekerjaan</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 p-6 md:p-8"
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
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                  style={{ background: avatarPreview ? 'transparent' : 'rgba(15, 23, 42, 0.8)', border: '2px dashed rgba(255,255,255,0.15)' }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <User className="w-8 h-8 text-slate-500" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full text-white
                    flex items-center justify-center hover:opacity-90 transition-opacity shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-slate-500">
                {avatarFile ? avatarFile.name : 'Foto profil (opsional)'}
              </p>
            </div>

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
              {/* Password strength indicator */}
              {password && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        password.length >= level * 2
                          ? level <= 1 ? 'bg-red-500' : level <= 2 ? 'bg-orange-500' : level <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              )}
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
                className={`w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm
                  border outline-none transition-all duration-200 ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-white/10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                }`}
                style={{ background: 'rgba(15, 23, 42, 0.8)' }}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Password tidak cocok</p>
              )}
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
          © 2026{' '}
          <a
            href="https://evid-foto.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors"
          >
            evid-foto.vercel.app
          </a>
          {' '}— All rights reserved.
        </p>
      </div>
    </div>
  )
}
