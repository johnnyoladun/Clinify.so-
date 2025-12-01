// Script to create admin user directly in Supabase
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcrypt')

const supabaseUrl = 'https://uvkgbahaeeoiibxmqmua.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2a2diYWhhZWVvaWlieG1xbXVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI2NjU2OCwiZXhwIjoyMDc4ODQyNTY4fQ.5NEMQWl2gn7tr5USFap4g16P3DELEJAXNm6x1t7NWq4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  console.log('🔍 Checking for existing admin user...')
  
  // Check if admin exists
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'admin@clinify.com')
    .single()

  if (existing) {
    console.log('⚠️  Admin user already exists. Deleting and recreating...')
    await supabase
      .from('users')
      .delete()
      .eq('email', 'admin@clinify.com')
  }

  // Generate password hash
  console.log('🔐 Hashing password...')
  const password_hash = await bcrypt.hash('admin123', 10)
  console.log('Hash:', password_hash)

  // Create admin user
  console.log('👤 Creating admin user...')
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      email: 'admin@clinify.com',
      password_hash,
      full_name: 'System Administrator',
      role: 'admin',
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating user:', error)
    process.exit(1)
  }

  console.log('✅ Admin user created successfully!')
  console.log('📧 Email: admin@clinify.com')
  console.log('🔑 Password: admin123')
  console.log('\n🎉 You can now login at http://localhost:3000/login')
}

createAdmin()
