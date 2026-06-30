'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Camera, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast({
        title: 'Login Gagal',
        description: error.message === 'Invalid login credentials'
          ? 'Email atau password salah. Periksa kembali.'
          : error.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    // Log activity + cek avatar untuk user baru
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'login',
        target_type: 'user',
        target_name: email,
      })

      // Cek apakah user sudah punya foto profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single()

      // Jika belum ada foto profil, arahkan ke halaman setup
      if (!profile?.avatar_url) {
        router.push('/setup-profile')
        router.refresh()
        return
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2" />

      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center flex-1 px-16 xl:px-24">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center pulse-glow"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">EvidFoto</h1>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Kelola foto<br />
            <span style={{ background: 'linear-gradient(90deg, #F97316, #FB923C)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              pekerjaan Anda
            </span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Platform manajemen foto pekerjaan yang mudah, aman, dan bisa diakses kapan saja.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-4">
            {[
              { emoji: '📸', text: 'Upload & organisir foto dengan mudah' },
              { emoji: '📁', text: 'Kelola folder berdasarkan proyek' },
              { emoji: '⬇️', text: 'Download foto kapanpun dibutuhkan' },
              { emoji: '👥', text: 'Kolaborasi dengan tim Anda' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{f.emoji}</span>
                <span className="text-slate-300 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex items-center justify-center w-full lg:w-[480px] xl:w-[520px] flex-shrink-0 px-4 py-8">
        <div className="w-full max-w-md slide-up">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 pulse-glow"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
            >
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">EvidFoto</h1>
            <p className="text-slate-400 mt-1 text-sm">Manajemen Foto Pekerjaan</p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-white/10 p-6 md:p-8"
            style={{ background: 'rgba(30, 41, 59, 0.85)', backdropFilter: 'blur(20px)' }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Masuk ke Akun Anda</h2>
              <p className="text-slate-400 text-sm mt-1">Selamat datang kembali 👋</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm
                    border border-white/10 outline-none
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                    transition-all duration-200"
                  style={{ background: 'rgba(15, 23, 42, 0.8)' }}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    autoComplete="current-password"
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

              {/* Forgot Password */}
              <div className="flex justify-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Lupa password?
                </Link>
              </div>

              {/* Submit */}
              <button
                id="btn-login"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white text-sm
                  flex items-center justify-center gap-2
                  transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30
                  hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: loading ? '#6B7280' : 'linear-gradient(135deg, #F97316, #EA580C)' }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            {/* Register link */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center space-y-3">
              <p className="text-sm text-slate-400">
                Belum punya akun?{' '}
                <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  Daftar di sini
                </Link>
              </p>
              <p className="text-xs text-slate-600">
                Hanya pengguna terdaftar yang dapat mengakses sistem ini.
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
    </div>
  )
}
