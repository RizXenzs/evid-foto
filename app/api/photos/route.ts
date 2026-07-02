import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const folderId = searchParams.get('folder_id')
  const isDeleted = searchParams.get('is_deleted') === 'true'

  let query = supabase
    .from('photos')
    .select('*, uploader:profiles(full_name, email), folder:folders(name, color)')
    .eq('is_deleted', isDeleted)
    .order('upload_date', { ascending: false })

  if (folderId) {
    query = query.eq('folder_id', folderId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: 'Konfigurasi server salah: SUPABASE_SERVICE_ROLE_KEY belum ditambahkan di Environment Variables Vercel Anda.' 
      }, { status: 500 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      caption,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      location,
      workDate,
      folderId,
      tags
    } = body

    if (!title || !fileUrl || !fileName) {
      return NextResponse.json({ error: 'title, fileUrl, dan fileName wajib diisi' }, { status: 400 })
    }

    // Buat admin client (bypass RLS)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const tagArray = typeof tags === 'string' 
      ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : Array.isArray(tags) ? tags : []

    // Ambil role user untuk menentukan approval_status
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profileData?.role === 'admin'
    const approvalStatus = isAdmin ? 'approved' : 'pending'

    // Insert data ke tabel public.photos (bypass RLS)
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('photos')
      .insert({
        title,
        caption: caption || '',
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize || 0,
        file_type: fileType || 'image/jpeg',
        location: location || '',
        work_date: workDate || new Date().toISOString().split('T')[0],
        uploaded_by: user.id,
        folder_id: folderId || null,
        tags: tagArray,
        approval_status: approvalStatus,
        approved_by: isAdmin ? user.id : null,
        approved_at: isAdmin ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'upload',
      target_type: 'photo',
      target_name: title,
      metadata: { file_name: fileName, file_size: fileSize },
    })

    // Kirim notifikasi jika status pending (untuk admin)
    if (approvalStatus === 'pending') {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')

      if (admins && admins.length > 0) {
        const uploaderName = profileData?.full_name || profileData?.email || 'User'
        const notificationsPayload = admins.map(adm => ({
          user_id: adm.id,
          title: 'Foto Baru Menunggu Review 📸',
          message: `${uploaderName} mengunggah foto "${title}" yang membutuhkan persetujuan Anda.`,
          type: 'upload',
          is_read: false,
          link: '/approval',
        }))

        await supabaseAdmin
          .from('notifications')
          .insert(notificationsPayload)
      }
    }

    return NextResponse.json({ success: true, photo: dbData })
  } catch (err: any) {
    console.error('Unexpected upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  const { ids } = await request.json()

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  // Jika bukan admin, pastikan user hanya hapus foto miliknya sendiri
  if (!isAdmin) {
    const { data: photos } = await supabase
      .from('photos')
      .select('id, uploaded_by')
      .in('id', ids)

    const unauthorized = photos?.some(p => p.uploaded_by !== user.id)
    if (unauthorized) {
      return NextResponse.json({ error: 'Tidak bisa menghapus foto milik orang lain' }, { status: 403 })
    }
  }

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('photos')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity
  await supabaseAdmin.from('activity_logs').insert({
    user_id: user.id,
    action: 'delete',
    target_type: 'photo',
    target_name: `${ids.length} foto`,
    metadata: { ids },
  })

  return NextResponse.json({ success: true })
}
