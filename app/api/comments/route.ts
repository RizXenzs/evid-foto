import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// GET /api/comments?photo_id=xxx
export async function GET(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const photoId = searchParams.get('photo_id')
  if (!photoId) return NextResponse.json({ error: 'photo_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('photo_comments')
    .select('*, user:profiles(id, full_name, email, avatar_url)')
    .eq('photo_id', photoId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// POST /api/comments
export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { photo_id, comment, parent_id } = body

    if (!photo_id || !comment?.trim()) {
      return NextResponse.json({ error: 'photo_id dan comment wajib diisi' }, { status: 400 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin
      .from('photo_comments')
      .insert({
        photo_id,
        user_id: user.id,
        comment: comment.trim(),
        parent_id: parent_id || null,
      })
      .select('*, user:profiles(id, full_name, email, avatar_url)')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, comment: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/comments?id=xxx
export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('id')
    if (!commentId) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // Verify ownership (unless admin)
    if (!isAdmin) {
      const { data: comment } = await supabase
        .from('photo_comments')
        .select('user_id')
        .eq('id', commentId)
        .single()

      if (comment?.user_id !== user.id) {
        return NextResponse.json({ error: 'Tidak bisa menghapus komentar orang lain' }, { status: 403 })
      }
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabaseAdmin
      .from('photo_comments')
      .delete()
      .eq('id', commentId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
