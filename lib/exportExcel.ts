import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import type { Photo } from '@/types'

/**
 * Exports an array of photos to an Excel (.xlsx) file using SheetJS.
 * Columns: No | Judul Foto | Lokasi | Tanggal Pekerjaan | Jam Upload | Uploader | Folder | Tag | Keterangan | URL Foto
 */
export function exportToExcel(photos: Photo[], filenamePrefix = 'EvidFoto_Export'): void {
  const dateStr = format(new Date(), 'yyyyMMdd', { locale: id })
  const filename = `${filenamePrefix}_${dateStr}.xlsx`

  // Build rows
  const rows = photos.map((photo, index) => ({
    No: index + 1,
    'Judul Foto': photo.title,
    Lokasi: photo.location || '-',
    'Tanggal Pekerjaan': photo.work_date
      ? (() => { try { return format(new Date(photo.work_date), 'dd MMM yyyy', { locale: id }) } catch { return photo.work_date } })()
      : '-',
    'Jam Upload': (() => {
      try { return format(new Date(photo.upload_date), 'dd MMM yyyy, HH:mm', { locale: id }) } catch { return photo.upload_date }
    })(),
    Uploader: photo.uploader?.full_name || photo.uploader?.email || '-',
    Folder: photo.folder?.name || '-',
    Tag: (photo.tags || []).join(', ') || '-',
    Keterangan: photo.caption || '-',
    'URL Foto': photo.file_url,
  }))

  // Create workbook & worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Auto column widths
  const colWidths = [
    { wch: 5 },   // No
    { wch: 30 },  // Judul Foto
    { wch: 28 },  // Lokasi
    { wch: 20 },  // Tanggal Pekerjaan
    { wch: 22 },  // Jam Upload
    { wch: 22 },  // Uploader
    { wch: 20 },  // Folder
    { wch: 22 },  // Tag
    { wch: 35 },  // Keterangan
    { wch: 60 },  // URL Foto
  ]
  ws['!cols'] = colWidths

  // Style header row (bold) — SheetJS CE doesn't support rich styling,
  // but we set the range for reference
  XLSX.utils.book_append_sheet(wb, ws, 'Data Foto')

  // Add metadata sheet
  const meta = [
    ['Laporan EvidFoto'],
    ['Digenerate pada', format(new Date(), "dd MMM yyyy 'pukul' HH:mm", { locale: id })],
    ['Total Foto', photos.length],
  ]
  const wsMeta = XLSX.utils.aoa_to_sheet(meta)
  XLSX.utils.book_append_sheet(wb, wsMeta, 'Info')

  // Download
  XLSX.writeFile(wb, filename)
}
