'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, ArrowLeft, Mail } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })

    if (error) {
      toast({
        title: 'Gagal',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative w-full max-w-md px-4 slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EvidFoto</h1>
        </div>

        <div className="rounded-2xl border border-white/10 p-8"
          style={{ background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(20px)' }}
        >
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Email Terkirim!</h2>
              <p className="text-slate-400 text-sm mb-6">
                Periksa inbox email <strong className="text-white">{email}</strong> untuk instruksi reset password.
              </p>
              <Link href="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                Kembali ke halaman login
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <Link href="/login" className="text-slate-400 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <h2 className="text-xl font-semibold text-white">Lupa Password</h2>
              </div>
              <p className="text-slate-400 text-sm mb-6">
                Masukkan email Anda dan kami akan kirimkan link untuk reset password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                    required
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm
                      border border-white/10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                      transition-all duration-200"
                    style={{ background: 'rgba(15, 23, 42, 0.8)' }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm
                    flex items-center justify-center gap-2 transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Mengirim...</> : 'Kirim Link Reset'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
