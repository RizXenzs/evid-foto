import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// PATCH /api/photos/approve — admin only
export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang bisa melakukan approval' }, { status: 403 })
    }

    const body = await request.json()
    const { ids, status, note } = body as {
      ids: string[]
      status: 'approved' | 'rejected'
      note?: string
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids harus berupa array dan tidak boleh kosong' }, { status: 400 })
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status harus approved atau rejected' }, { status: 400 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const updatePayload: Record<string, any> = {
      approval_status: status,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    }

    if (status === 'rejected' && note) {
      updatePayload.approval_note = note
    } else if (status === 'approved') {
      updatePayload.approval_note = null
    }

    // Query uploader details for notifications
    const { data: photosToNotify } = await supabaseAdmin
      .from('photos')
      .select('id, title, uploaded_by')
      .in('id', ids)

    const { error } = await supabaseAdmin
      .from('photos')
      .update(updatePayload)
      .in('id', ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: status === 'approved' ? 'restore' : 'delete',
      target_type: 'photo',
      target_name: `${ids.length} foto (${status === 'approved' ? 'disetujui' : 'ditolak'})`,
      metadata: { ids, status, note },
    })

    // Kirim notifikasi ke masing-masing uploader
    if (photosToNotify && photosToNotify.length > 0) {
      const notifications = photosToNotify
        .filter(p => p.uploaded_by) // pastikan ada uploader-nya
        .map(p => ({
          user_id: p.uploaded_by,
          title: status === 'approved' ? 'Foto Anda Disetujui! ✅' : 'Foto Anda Ditolak ❌',
          message: status === 'approved'
            ? `Foto "${p.title}" telah disetujui oleh admin.`
            : `Foto "${p.title}" ditolak oleh admin.${note ? ` Alasan: "${note}"` : ''}`,
          type: 'approval',
          is_read: false,
          link: '/photos',
        }))

      if (notifications.length > 0) {
        await supabaseAdmin.from('notifications').insert(notifications)
      }
    }

    return NextResponse.json({ success: true, updated: ids.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
