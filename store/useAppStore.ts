import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile, Photo, Folder, PhotoFilter, PhotoSort } from '@/types'

interface AppState {
  // Auth
  user: Profile | null
  setUser: (user: Profile | null) => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void

  // Photos
  selectedPhotos: string[]
  togglePhotoSelection: (id: string) => void
  selectAllPhotos: (ids: string[]) => void
  clearSelection: () => void

  // Filter & Sort
  photoFilter: PhotoFilter
  photoSort: PhotoSort
  setPhotoFilter: (filter: Partial<PhotoFilter>) => void
  setPhotoSort: (sort: PhotoSort) => void
  clearFilters: () => void

  // View mode
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void

  // Upload Modal
  uploadModalOpen: boolean
  setUploadModalOpen: (open: boolean) => void
  uploadTargetFolder: string | null
  setUploadTargetFolder: (id: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Theme
      theme: 'dark',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Photos
      selectedPhotos: [],
      togglePhotoSelection: (id) =>
        set((state) => ({
          selectedPhotos: state.selectedPhotos.includes(id)
            ? state.selectedPhotos.filter((p) => p !== id)
            : [...state.selectedPhotos, id],
        })),
      selectAllPhotos: (ids) => set({ selectedPhotos: ids }),
      clearSelection: () => set({ selectedPhotos: [] }),

      // Filter & Sort
      photoFilter: {},
      photoSort: { field: 'upload_date', direction: 'desc' },
      setPhotoFilter: (filter) =>
        set((state) => ({ photoFilter: { ...state.photoFilter, ...filter } })),
      setPhotoSort: (sort) => set({ photoSort: sort }),
      clearFilters: () =>
        set({ photoFilter: {}, photoSort: { field: 'upload_date', direction: 'desc' } }),

      // View mode
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Upload Modal
      uploadModalOpen: false,
      setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
      uploadTargetFolder: null,
      setUploadTargetFolder: (id) => set({ uploadTargetFolder: id }),
    }),
    {
      name: 'evidfoto-store',
      partialize: (state) => ({
        theme: state.theme,
        viewMode: state.viewMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
