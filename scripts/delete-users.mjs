// Script untuk menghapus akun nonaktif
// Jalankan dengan: node scripts/delete-users.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqjfxpnnqgqezgpzlafk.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Akun yang akan dihapus
const EMAILS_TO_DELETE = [
  'admin@evidfoto.com',    // Administrator (nonaktif)
  'user@evidfoto.com',     // Pengguna Umum (nonaktif)
]

async function getAllUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    }
  })
  const data = await res.json()
  return data.users || []
}

async function deleteUser(userId, email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    }
  })

  if (res.ok || res.status === 204) {
    console.log(`   ✅ Berhasil dihapus: ${email}`)
  } else {
    const err = await res.text()
    console.log(`   ❌ Gagal hapus ${email}: ${err}`)
  }
}

async function main() {
  console.log('🗑️  EvidFoto — Hapus Akun Nonaktif')
  console.log('=====================================\n')

  // Ambil semua user
  const allUsers = await getAllUsers()
  console.log(`📋 Total user ditemukan: ${allUsers.length}`)

  for (const email of EMAILS_TO_DELETE) {
    const user = allUsers.find(u => u.email === email)
    if (!user) {
      console.log(`\n⚠️  Akun tidak ditemukan: ${email}`)
      continue
    }
    console.log(`\n🗑️  Menghapus: ${email} (ID: ${user.id})`)
    await deleteUser(user.id, email)
  }

  console.log('\n=====================================')
  console.log('✅ Selesai! Akun yang tersisa:')
  console.log('   👑 Admin Rizki  - adminrizki@gmail.com')
  console.log('   👤 User Rizki   - userrizki@gmail.com')
  console.log('=====================================\n')
}

main().catch(console.error)
