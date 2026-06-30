'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { FolderOpen, Plus, Pencil, Trash2, ChevronRight, Image, X, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { FOLDER_COLORS } from '@/lib/utils'
import type { Folder } from '@/types'

interface FoldersClientProps {
  folders: Folder[]
  userRole: string
}

const FOLDER_ICONS_LIST = ['folder', 'image', 'camera', 'building', 'briefcase', 'archive', 'map-pin', 'star']

export function FoldersClient({ folders: initialFolders, userRole }: FoldersClientProps) {
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [showModal, setShowModal] = useState(false)
  const [editFolder, setEditFolder] = useState<Folder | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [parentId, setParentId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const rootFolders = folders.filter(f => !f.parent_id)
  const getChildren = (id: string) => folders.filter(f => f.parent_id === id)

  function openCreate(parentId?: string) {
    setEditFolder(null)
    setName('')
    setDescription('')
    setColor('#3B82F6')
    setParentId(parentId || '')
    setShowModal(true)
  }

  function openEdit(folder: Folder) {
    setEditFolder(folder)
    setName(folder.name)
    setDescription(folder.description || '')
    setColor(folder.color)
    setParentId(folder.parent_id || '')
    setShowModal(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (editFolder) {
      const { error } = await supabase.from('folders').update({
        name, description, color, parent_id: parentId || null, updated_at: new Date().toISOString()
      }).eq('id', editFolder.id)
      if (!error) {
        setFolders(prev => prev.map(f => f.id === editFolder.id ? { ...f, name, description, color } : f))
        toast({ title: 'Berhasil', description: 'Folder diperbarui.' })
      }
    } else {
      const { data, error } = await supabase.from('folders').insert({
        name, description, color, parent_id: parentId || null, created_by: user?.id
      }).select().single()
      if (!error && data) {
        setFolders(prev => [...prev, data as Folder])
        await supabase.from('activity_logs').insert({
          user_id: user?.id,
          action: 'create_folder',
          target_type: 'folder',
          target_name: name,
        })
        toast({ title: 'Berhasil', description: 'Folder baru dibuat.' })
      }
    }
    setLoading(false)
    setShowModal(false)
  }

  async function handleDelete(folder: Folder) {
    if (!confirm(`Hapus folder "${folder.name}"? Foto di dalam tidak akan terhapus.`)) return
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('folders').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', folder.id)
    await supabase.from('activity_logs').insert({
      user_id: user?.id, action: 'delete_folder', target_type: 'folder', target_name: folder.name
    })
    setFolders(prev => prev.filter(f => f.id !== folder.id))
    toast({ title: 'Folder dihapus', description: 'Folder dipindahkan ke sampah.' })
  }

  function toggleExpand(id: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function FolderNode({ folder, depth = 0 }: { folder: Folder, depth?: number }) {
    const children = getChildren(folder.id)
    const isExpanded = expandedFolders.has(folder.id)

    return (
      <div>
        <div
          className={`group flex items-center gap-3 px-4 py-3 rounded-xl border border-border
            hover:border-primary/30 transition-all duration-200 cursor-pointer glass-card mb-2`}
          style={{ marginLeft: depth * 20 }}
        >
          {/* Folder icon/color */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${folder.color}20`, border: `1px solid ${folder.color}40` }}
          >
            <FolderOpen className="w-5 h-5" style={{ color: folder.color }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0" onClick={() => router.push(`/folders/${folder.id}`)}>
            <p className="font-medium text-foreground truncate">{folder.name}</p>
            <p className="text-xs text-muted-foreground truncate">{folder.description || 'Tidak ada deskripsi'}</p>
          </div>

          {/* Photo count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Image className="w-3.5 h-3.5" />
            <span>{folder.photo_count || 0}</span>
          </div>

          {/* Expand children */}
          {children.length > 0 && (
            <button onClick={() => toggleExpand(folder.id)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          )}

          {/* Admin actions */}
          {userRole === 'admin' && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); openCreate(folder.id) }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Buat subfolder">
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); openEdit(folder) }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-blue-400 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(folder) }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && children.map(child => (
          <FolderNode key={child.id} folder={child} depth={depth + 1} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Folder</h1>
          <p className="text-muted-foreground text-sm">{folders.length} folder tersedia</p>
        </div>
        {userRole === 'admin' && (
          <button onClick={() => openCreate()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white
              transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}
          >
            <Plus className="w-4 h-4" />
            Buat Folder
          </button>
        )}
      </div>

      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Folder</h3>
          <p className="text-muted-foreground text-sm">Buat folder pertama untuk mengorganisir foto.</p>
        </div>
      ) : (
        <div>
          {rootFolders.map(folder => <FolderNode key={folder.id} folder={folder} />)}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-border shadow-2xl p-6 slide-up"
            style={{ background: 'hsl(var(--card))' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">
                {editFolder ? 'Edit Folder' : 'Buat Folder Baru'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nama Folder *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Contoh: Proyek Jalan 2024"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                    outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Deskripsi</label>
                <input value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Deskripsi singkat..."
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                    outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Warna</label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map(c => (
                    <button key={c.value} onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-full transition-all duration-200 ${color === c.value ? 'ring-2 ring-offset-2 ring-offset-card scale-110' : ''}`}
                      style={{ background: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
              {!editFolder && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Folder Induk (opsional)</label>
                  <select value={parentId} onChange={e => setParentId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm
                      outline-none focus:border-primary transition-all">
                    <option value="">Tidak ada (root)</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-foreground text-sm hover:bg-muted transition-colors">
                Batal
              </button>
              <button onClick={handleSave} disabled={loading || !name.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white
                  disabled:opacity-60 transition-all"
                style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editFolder ? 'Simpan' : 'Buat Folder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
