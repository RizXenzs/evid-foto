import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: string | Date, fmt = 'dd MMM yyyy'): string {
  try {
    return format(new Date(date), fmt, { locale: id })
  } catch {
    return '-'
  }
}

export function formatDateTime(date: string | Date): string {
  try {
    return format(new Date(date), 'dd MMM yyyy, HH:mm', { locale: id })
  } catch {
    return '-'
  }
}

export function timeAgo(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: id })
  } catch {
    return '-'
  }
}

export function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const FOLDER_COLORS = [
  { label: 'Biru', value: '#3B82F6' },
  { label: 'Hijau', value: '#10B981' },
  { label: 'Oranye', value: '#F97316' },
  { label: 'Merah', value: '#EF4444' },
  { label: 'Ungu', value: '#8B5CF6' },
  { label: 'Kuning', value: '#F59E0B' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Abu', value: '#6B7280' },
]

export const ACTION_LABELS: Record<string, string> = {
  upload: 'Upload Foto',
  download: 'Unduh Foto',
  delete: 'Hapus',
  restore: 'Pulihkan',
  move: 'Pindah',
  login: 'Login',
  create_folder: 'Buat Folder',
  delete_folder: 'Hapus Folder',
  update_profile: 'Update Profil',
}
