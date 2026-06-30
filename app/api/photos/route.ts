import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { ids } = await request.json()

  if (!ids || !Array.isArray(ids)) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
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
