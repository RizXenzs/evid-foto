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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null
    const caption = formData.get('caption') as string || ''
    const location = formData.get('location') as string || ''
    const workDate = formData.get('workDate') as string || new Date().toISOString().split('T')[0]
    const folderId = formData.get('folderId') as string || null
    const tagsString = formData.get('tags') as string || ''

    if (!file || !title) {
      return NextResponse.json({ error: 'file dan title wajib diisi' }, { status: 400 })
    }

    // Buat admin client (bypass RLS)
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload file ke storage bucket 'photos'
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('photos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // Dapatkan public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('photos')
      .getPublicUrl(fileName)

    const tagArray = tagsString.split(',').map(t => t.trim()).filter(Boolean)

    // Insert data ke tabel public.photos (bypass RLS)
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('photos')
      .insert({
        title,
        caption,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        location,
        work_date: workDate,
        uploaded_by: user.id,
        folder_id: folderId || null,
        tags: tagArray,
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
      metadata: { file_name: file.name, file_size: file.size },
    })

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

  const { error } = await supabase
    .from('photos')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: user.id,
    action: 'delete',
    target_type: 'photo',
    target_name: `${ids.length} foto`,
    metadata: { ids },
  })

  return NextResponse.json({ success: true })
}
