import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Download, Package, Image } from 'lucide-react'
import { formatDateTime, formatBytes } from '@/lib/utils'

export const metadata = { title: 'Riwayat Unduhan — EvidFoto' }

export default async function DownloadsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: history } = await supabase
    .from('download_history')
    .select('*, photo:photos(title, file_url, thumbnail_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Riwayat Unduhan</h1>
        <p className="text-muted-foreground text-sm">{history?.length || 0} riwayat unduhan</p>
      </div>

      {!history || history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-card">
          <Download className="w-10 h-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Riwayat</h3>
          <p className="text-muted-foreground text-sm">Unduhan foto akan muncul di sini.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item: any) => (
            <div key={item.id} className="glass-card flex items-center gap-4 p-4">
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: item.download_type === 'bulk' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)' }}
              >
                {item.download_type === 'bulk'
                  ? <Package className="w-5 h-5 text-purple-400" />
                  : item.photo?.thumbnail_url
                    ? <img src={item.photo.thumbnail_url} className="w-12 h-12 rounded-xl object-cover" alt="" />
                    : <Image className="w-5 h-5 text-blue-400" />
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {item.download_type === 'bulk' ? (
                  <p className="font-medium text-foreground">
                    Bulk Download — {item.file_count} foto
                  </p>
                ) : (
                  <p className="font-medium text-foreground truncate">
                    {item.photo?.title || 'Foto dihapus'}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${item.download_type === 'bulk'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {item.download_type === 'bulk' ? 'ZIP Bulk' : 'Satuan'}
                  </span>
                  {item.file_names && item.file_names.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                      {item.file_names.slice(0, 2).join(', ')}{item.file_names.length > 2 ? ` +${item.file_names.length - 2} lainnya` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
