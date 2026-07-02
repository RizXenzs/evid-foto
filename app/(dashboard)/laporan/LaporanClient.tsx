'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Filter, Calendar, User, FolderOpen,
  Download, Loader2, AlertTriangle, Camera, CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import type { Photo, Folder } from '@/types'

interface LaporanClientProps {
  folders: Pick<Folder, 'id' | 'name'>[]
  uploaders: { id: string; full_name: string | null; email: string }[]
  currentUser: { name: string; role: string }
}

function fmtDate(dateStr: string) {
  try { return format(new Date(dateStr), 'dd MMM yyyy', { locale: idLocale }) } catch { return dateStr }
}
function fmtDateTime(dateStr: string) {
  try { return format(new Date(dateStr), "dd MMM yyyy '|' HH:mm 'WIB'", { locale: idLocale }) } catch { return dateStr }
}
function fmtPrintDate() {
  return format(new Date(), "dd MMMM yyyy, HH:mm 'WIB'", { locale: idLocale })
}

export function LaporanClient({ folders, uploaders, currentUser }: LaporanClientProps) {
  const supabase = createClient()

  const [filterFolder, setFilterFolder] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterUploader, setFilterUploader] = useState('')
  const [generating, setGenerating] = useState(false)
  const [previewPhotos, setPreviewPhotos] = useState<Photo[] | null>(null)
  const [error, setError] = useState('')

  async function fetchPhotos(): Promise<Photo[]> {
    let query = supabase
      .from('photos')
      .select('*, uploader:profiles(full_name, email, avatar_url), folder:folders(name, color)')
      .eq('is_deleted', false)
      .order('upload_date', { ascending: false })

    if (filterFolder) query = query.eq('folder_id', filterFolder)
    if (filterUploader) query = query.eq('uploaded_by', filterUploader)
    if (dateFrom) query = query.gte('upload_date', new Date(dateFrom).toISOString())
    if (dateTo) {
      const end = new Date(dateTo)
      end.setHours(23, 59, 59, 999)
      query = query.lte('upload_date', end.toISOString())
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []) as Photo[]
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    setPreviewPhotos(null)
    try {
      const photos = await fetchPhotos()
      if (photos.length === 0) {
        setError('Tidak ada foto yang ditemukan dengan filter tersebut.')
        setGenerating(false)
        return
      }
      setPreviewPhotos(photos)
      await generatePDF(photos)
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat generate laporan.')
    }
    setGenerating(false)
  }

  async function generatePDF(photos: Photo[]) {
    // Dynamic imports to avoid SSR issues
    const jsPDFModule = await import('jspdf')
    const html2canvasModule = await import('html2canvas')
    const jsPDF = jsPDFModule.default
    const html2canvas = html2canvasModule.default

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = 210
    const pageH = 297
    const margin = 15
    const contentW = pageW - margin * 2

    const folderLabel = filterFolder
      ? folders.find(f => f.id === filterFolder)?.name || 'Folder Tertentu'
      : 'Semua Folder'
    const uploaderLabel = filterUploader
      ? uploaders.find(u => u.id === filterUploader)?.full_name || uploaders.find(u => u.id === filterUploader)?.email || 'Uploader Tertentu'
      : 'Semua Uploader'
    const dateRangeLabel = dateFrom || dateTo
      ? `${dateFrom ? fmtDate(dateFrom) : 'Awal'} s/d ${dateTo ? fmtDate(dateTo) : 'Sekarang'}`
      : 'Semua Waktu'
    const printDate = fmtPrintDate()

    // ── HALAMAN COVER ──────────────────────────────────────────
    // Background gradient (dark)
    doc.setFillColor(10, 15, 30)
    doc.rect(0, 0, pageW, pageH, 'F')

    // Orange accent bar top
    doc.setFillColor(249, 115, 22)
    doc.rect(0, 0, pageW, 4, 'F')

    // Logo area
    doc.setFillColor(249, 115, 22)
    doc.roundedRect(margin, 30, 16, 16, 3, 3, 'F')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('EF', margin + 8, 41, { align: 'center' })

    // App name
    doc.setFontSize(22)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('EvidFoto', margin + 20, 42)

    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text('Manajemen Foto Laporan Kerja', margin + 20, 48)

    // Divider
    doc.setDrawColor(249, 115, 22)
    doc.setLineWidth(0.5)
    doc.line(margin, 58, pageW - margin, 58)

    // Report title
    doc.setFontSize(26)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN FOTO', pageW / 2, 80, { align: 'center' })
    doc.text('DOKUMENTASI KERJA', pageW / 2, 92, { align: 'center' })

    // Orange underline decoration
    doc.setFillColor(249, 115, 22)
    doc.rect(pageW / 2 - 20, 96, 40, 2, 'F')

    // Info box
    doc.setFillColor(15, 23, 42)
    doc.setDrawColor(30, 41, 59)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, 110, contentW, 70, 4, 4, 'FD')

    const infoY = 125
    const infoLabelColor: [number, number, number] = [100, 116, 139]
    const infoValueColor: [number, number, number] = [255, 255, 255]

    const infoItems = [
      { label: 'Folder', value: folderLabel },
      { label: 'Rentang Waktu', value: dateRangeLabel },
      { label: 'Uploader', value: uploaderLabel },
      { label: 'Total Foto', value: `${photos.length} foto` },
      { label: 'Pembuat Laporan', value: currentUser.name },
      { label: 'Tanggal Cetak', value: printDate },
    ]

    infoItems.forEach((item, i) => {
      const y = infoY + i * 10
      doc.setFontSize(8)
      doc.setTextColor(...infoLabelColor)
      doc.setFont('helvetica', 'normal')
      doc.text(item.label + ':', margin + 6, y)
      doc.setFontSize(9)
      doc.setTextColor(...infoValueColor)
      doc.setFont('helvetica', 'bold')
      doc.text(item.value, margin + 45, y)
    })

    // Bottom decoration
    doc.setFillColor(249, 115, 22)
    doc.rect(0, pageH - 4, pageW, 4, 'F')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text('EvidFoto — Sistem Manajemen Foto Laporan Kerja', pageW / 2, pageH - 8, { align: 'center' })

    // ── HALAMAN FOTO ───────────────────────────────────────────
    const photosPerPage = 4 // 2x2 grid per halaman
    const gridCols = 2
    const colW = (contentW - 6) / gridCols
    const cardH = 80

    let photoPage = 0
    let pageNum = 1

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      const posInPage = i % photosPerPage
      const col = posInPage % gridCols
      const row = Math.floor(posInPage / gridCols)

      if (posInPage === 0) {
        // New page
        doc.addPage()
        pageNum++
        photoPage++

        // Dark background
        doc.setFillColor(10, 15, 30)
        doc.rect(0, 0, pageW, pageH, 'F')

        // Page header
        doc.setFillColor(249, 115, 22)
        doc.rect(0, 0, pageW, 4, 'F')
        doc.setFontSize(9)
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.text('EvidFoto', margin, 12)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.text('Laporan Foto Dokumentasi', margin, 18)

        // Page divider
        doc.setDrawColor(30, 41, 59)
        doc.setLineWidth(0.3)
        doc.line(margin, 22, pageW - margin, 22)
      }

      const cardX = margin + col * (colW + 6)
      const cardY = 28 + row * (cardH + 6)

      // Card background
      doc.setFillColor(15, 23, 42)
      doc.setDrawColor(30, 41, 59)
      doc.setLineWidth(0.3)
      doc.roundedRect(cardX, cardY, colW, cardH, 3, 3, 'FD')

      // Try to embed thumbnail image
      try {
        const imgUrl = photo.thumbnail_url || photo.file_url
        const imgResp = await fetch(imgUrl)
        const imgBlob = await imgResp.blob()
        const imgBase64 = await new Promise<string>((res, rej) => {
          const reader = new FileReader()
          reader.onload = () => res(reader.result as string)
          reader.onerror = rej
          reader.readAsDataURL(imgBlob)
        })
        const imgH = 35
        const imgW = colW - 6
        doc.addImage(imgBase64, 'JPEG', cardX + 3, cardY + 3, imgW, imgH, undefined, 'FAST')

        // Orange bottom of image area
        doc.setFillColor(249, 115, 22)
        doc.rect(cardX + 3, cardY + imgH - 1, imgW, 1.5, 'F')
      } catch {
        // Fallback: grey placeholder
        doc.setFillColor(30, 41, 59)
        doc.roundedRect(cardX + 3, cardY + 3, colW - 6, 35, 2, 2, 'F')
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        doc.text('[Gambar]', cardX + colW / 2, cardY + 22, { align: 'center' })
      }

      // Photo info text
      const txtX = cardX + 4
      let txtY = cardY + 43

      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      const titleText = doc.splitTextToSize(photo.title, colW - 8)[0]
      doc.text(titleText, txtX, txtY)

      txtY += 6
      doc.setFontSize(6.5)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      if (photo.location) {
        doc.text(`📍 ${photo.location}`.slice(0, 38), txtX, txtY)
        txtY += 5
      }
      doc.text(`🕐 ${fmtDateTime(photo.upload_date)}`, txtX, txtY)
      txtY += 5
      const uploaderName = photo.uploader?.full_name || photo.uploader?.email || '-'
      doc.text(`👤 ${uploaderName}`.slice(0, 38), txtX, txtY)
      if (photo.caption) {
        txtY += 5
        doc.setTextColor(71, 85, 105)
        const captionText = doc.splitTextToSize(photo.caption, colW - 8)[0]
        doc.text(captionText, txtX, txtY)
      }

      // Footer for page
      if (posInPage === photosPerPage - 1 || i === photos.length - 1) {
        doc.setDrawColor(30, 41, 59)
        doc.setLineWidth(0.3)
        doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        doc.setFont('helvetica', 'normal')
        doc.text('EvidFoto — Laporan Foto Dokumentasi', margin, pageH - 7)
        doc.text(`Halaman ${pageNum}`, pageW - margin, pageH - 7, { align: 'right' })
      }
    }

    // ── HALAMAN PENUTUP ────────────────────────────────────────
    doc.addPage()
    pageNum++

    doc.setFillColor(10, 15, 30)
    doc.rect(0, 0, pageW, pageH, 'F')
    doc.setFillColor(249, 115, 22)
    doc.rect(0, 0, pageW, 4, 'F')

    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('PENUTUP', pageW / 2, 50, { align: 'center' })

    doc.setFillColor(249, 115, 22)
    doc.rect(pageW / 2 - 12, 54, 24, 1.5, 'F')

    // Summary box
    doc.setFillColor(15, 23, 42)
    doc.setDrawColor(30, 41, 59)
    doc.roundedRect(margin, 64, contentW, 40, 4, 4, 'FD')

    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text('Laporan ini berisi dokumentasi foto pekerjaan yang dihasilkan oleh', pageW / 2, 76, { align: 'center' })
    doc.text('sistem EvidFoto secara otomatis berdasarkan filter yang dipilih.', pageW / 2, 83, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(249, 115, 22)
    doc.setFont('helvetica', 'bold')
    doc.text(`Total: ${photos.length} Foto`, pageW / 2, 96, { align: 'center' })

    // Signature area
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Tanda Tangan & Stempel', pageW / 2, 130, { align: 'center' })

    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text(printDate, pageW / 2, 137, { align: 'center' })

    // Signature box
    doc.setDrawColor(30, 41, 59)
    doc.setLineWidth(0.5)
    doc.setFillColor(15, 23, 42)
    doc.roundedRect(pageW / 2 - 35, 143, 70, 35, 3, 3, 'FD')

    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text('(Tanda tangan di sini)', pageW / 2, 175, { align: 'center' })

    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text(currentUser.name, pageW / 2, 185, { align: 'center' })

    // Bottom
    doc.setFillColor(249, 115, 22)
    doc.rect(0, pageH - 4, pageW, 4, 'F')
    doc.setDrawColor(30, 41, 59)
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
    doc.setFontSize(7)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.text('EvidFoto — Sistem Manajemen Foto Laporan Kerja', margin, pageH - 7)
    doc.text(`Halaman ${pageNum}`, pageW - margin, pageH - 7, { align: 'right' })

    // Save PDF
    const fileDate = format(new Date(), 'yyyyMMdd_HHmm', { locale: idLocale })
    doc.save(`EvidFoto_Laporan_${fileDate}.pdf`)
  }

  const folderLabel = filterFolder
    ? folders.find(f => f.id === filterFolder)?.name
    : 'Semua Folder'
  const dateRangeLabel = dateFrom || dateTo
    ? `${dateFrom ? fmtDate(dateFrom) : 'Awal'} s/d ${dateTo ? fmtDate(dateTo) : 'Sekarang'}`
    : null

  return (
    <div className="space-y-6 fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-orange-400" />
          Laporan PDF
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate laporan foto dalam format PDF berdasarkan filter yang Anda pilih
        </p>
      </div>

      {/* Filter Card */}
      <div className="glass-card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-4 h-4 text-orange-400" />
          <h2 className="font-semibold text-foreground">Filter Laporan</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Folder */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" /> Folder
            </label>
            <select
              value={filterFolder}
              onChange={e => setFilterFolder(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-all"
            >
              <option value="">Semua Folder</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Uploader */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Uploader (opsional)
            </label>
            <select
              value={filterUploader}
              onChange={e => setFilterUploader(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-all"
            >
              <option value="">Semua Uploader</option>
              {uploaders.map(u => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Date To */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Active filters summary */}
        {(filterFolder || filterUploader || dateFrom || dateTo) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {filterFolder && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-orange-500/15 text-orange-300 border border-orange-500/25">
                📁 {folderLabel}
              </span>
            )}
            {dateRangeLabel && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-blue-500/15 text-blue-300 border border-blue-500/25">
                🗓️ {dateRangeLabel}
              </span>
            )}
            {filterUploader && (
              <span className="px-2.5 py-1 rounded-full text-xs bg-purple-500/15 text-purple-300 border border-purple-500/25">
                👤 {uploaders.find(u => u.id === filterUploader)?.full_name || 'Uploader'}
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold text-white
            transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sedang Generate PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate &amp; Download Laporan PDF
            </>
          )}
        </button>
      </div>

      {/* Success state */}
      {previewPhotos && !generating && (
        <div className="glass-card p-5 flex items-start gap-3 border-green-500/25"
          style={{ borderColor: 'rgba(34,197,94,0.25)' }}
        >
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground text-sm">Laporan berhasil di-generate!</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              {previewPhotos.length} foto telah dimasukkan ke dalam PDF dan otomatis terunduh.
            </p>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Camera className="w-4 h-4 text-orange-400" />
          Isi Laporan PDF
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            '📄 Halaman Cover — Judul laporan, logo EvidFoto, rentang tanggal, pembuat, tanggal cetak',
            '🖼️ Grid Foto 2 Kolom — Thumbnail + judul, lokasi, tanggal upload, uploader, keterangan',
            '✍️ Halaman Penutup — Total foto & area tanda tangan kosong',
            '📑 Footer — Nama aplikasi & nomor halaman di setiap halaman',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
