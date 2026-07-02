export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'user'
export type ActionType = 'upload' | 'download' | 'delete' | 'restore' | 'move' | 'login' | 'create_folder' | 'delete_folder' | 'update_profile'
export type TargetType = 'photo' | 'folder' | 'user'
export type DownloadType = 'single' | 'bulk'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Folder {
  id: string
  name: string
  description: string | null
  parent_id: string | null
  color: string
  icon: string
  created_by: string | null
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  // Relations
  creator?: Profile
  children?: Folder[]
  photo_count?: number
}

export interface Photo {
  id: string
  title: string
  caption: string | null
  file_url: string
  thumbnail_url: string | null
  file_name: string
  file_size: number | null
  file_type: string | null
  location: string | null
  work_date: string | null
  upload_date: string
  uploaded_by: string | null
  folder_id: string | null
  tags: string[]
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  // Approval
  approval_status: ApprovalStatus
  approval_note: string | null
  approved_by: string | null
  approved_at: string | null
  // Relations
  uploader?: Profile
  folder?: Folder
}

export interface ActivityLog {
  id: string
  user_id: string | null
  action: ActionType
  target_type: TargetType | null
  target_id: string | null
  target_name: string | null
  metadata: Json
  created_at: string
  // Relations
  user?: Profile
}

export interface DownloadHistory {
  id: string
  user_id: string
  photo_id: string | null
  download_type: DownloadType
  file_count: number
  file_names: string[] | null
  created_at: string
  // Relations
  user?: Profile
  photo?: Photo
}

export interface DashboardStats {
  total_photos: number
  total_folders: number
  total_users: number
  total_storage_bytes: number
  photos_this_month: number
  uploads_per_month: { month: string; count: number }[]
}

export interface PhotoFilter {
  folder_id?: string | null
  date_from?: string
  date_to?: string
  tags?: string[]
  uploader_id?: string
  search?: string
}

export interface PhotoSort {
  field: 'upload_date' | 'work_date' | 'title' | 'file_size'
  direction: 'asc' | 'desc'
}

export interface PhotoComment {
  id: string
  photo_id: string
  user_id: string | null
  comment: string
  parent_id: string | null
  created_at: string
  updated_at: string
  // Relations
  user?: Profile
  replies?: PhotoComment[]
}
