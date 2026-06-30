// Script untuk membuat akun admin EvidFoto
// Jalankan dengan: node scripts/create-admin.mjs

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oqjfxpnnqgqezgpzlafk.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// =============================================
// KONFIGURASI AKUN
// =============================================
const ADMIN_EMAIL = 'adminrizki@gmail.com'
const ADMIN_PASSWORD = 'Adminrizki123#'
const ADMIN_NAME = 'Admin Rizki'

const USER_EMAIL = 'userrizki@gmail.com'
const USER_PASSWORD = 'Userrizki123#'
const USER_NAME = 'User Rizki'
// =============================================

async function createUser(email, password, fullName, role) {
  console.log(`\n📝 Membuat akun ${role}: ${email}...`)

  // 1. Create auth user
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    if (data.message?.includes('already been registered') || data.message?.includes('already exists')) {
      console.log(`   ⚠️  Akun ${email} sudah ada, update role saja...`)
      // Get user ID first
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
        }
      })
      const listData = await listRes.json()
      const existingUser = listData.users?.[0]
      if (existingUser) {
        await updateProfile(existingUser.id, fullName, role)
        return existingUser
      }
    }
    console.error(`   ❌ Error: ${data.message || JSON.stringify(data)}`)
    return null
  }

  console.log(`   ✅ User dibuat dengan ID: ${data.id}`)

  // 2. Update profile role (trigger should auto-create profile)
  await new Promise(r => setTimeout(r, 1000)) // tunggu trigger
  await updateProfile(data.id, fullName, role)

  return data
}

async function updateProfile(userId, fullName, role) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ role, full_name: fullName }),
  })
  if (res.ok || res.status === 204) {
    console.log(`   ✅ Profile diupdate: role=${role}, nama=${fullName}`)
  } else {
    const err = await res.text()
    console.log(`   ⚠️  Update profile: ${err}`)
  }
}

async function main() {
  console.log('🚀 EvidFoto — Pembuatan Akun')
  console.log('================================\n')

  // Buat Admin
  await createUser(ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, 'admin')

  // Buat User biasa
  await createUser(USER_EMAIL, USER_PASSWORD, USER_NAME, 'user')

  console.log('\n================================')
  console.log('✅ Selesai! Kredensial login:\n')
  console.log('👑 ADMIN:')
  console.log(`   Email   : ${ADMIN_EMAIL}`)
  console.log(`   Password: ${ADMIN_PASSWORD}`)
  console.log('\n👤 USER:')
  console.log(`   Email   : ${USER_EMAIL}`)
  console.log(`   Password: ${USER_PASSWORD}`)
  console.log('\n🌐 Buka: http://localhost:3000/login')
  console.log('================================\n')
}

main().catch(console.error)
