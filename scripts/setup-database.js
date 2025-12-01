// Script to set up all database tables in Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uvkgbahaeeoiibxmqmua.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2a2diYWhhZWVvaWlieG1xbXVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI2NjU2OCwiZXhwIjoyMDc4ODQyNTY4fQ.5NEMQWl2gn7tr5USFap4g16P3DELEJAXNm6x1t7NWq4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🔧 Setting up database tables...\n')

  // Check if tables exist by trying to query them
  console.log('1️⃣ Checking users table...')
  const { data: users, error: usersError } = await supabase.from('users').select('id').limit(1)
  if (usersError) {
    console.error('❌ Users table error:', usersError.message)
  } else {
    console.log('✅ Users table exists')
  }

  console.log('\n2️⃣ Checking gmps table...')
  const { data: gmps, error: gmpsError } = await supabase.from('gmps').select('id').limit(1)
  if (gmpsError) {
    console.error('❌ GMPs table error:', gmpsError.message)
    console.log('   Please run the SQL schema in Supabase SQL Editor')
  } else {
    console.log('✅ GMPs table exists')
  }

  console.log('\n3️⃣ Checking section21_patients table...')
  const { data: patients, error: patientsError } = await supabase.from('section21_patients').select('id').limit(1)
  if (patientsError) {
    console.error('❌ Section21_patients table error:', patientsError.message)
    console.log('   Please run the SQL schema in Supabase SQL Editor')
  } else {
    console.log('✅ Section21_patients table exists')
  }

  console.log('\n📊 Summary:')
  if (usersError || gmpsError || patientsError) {
    console.log('⚠️  Some tables are missing!')
    console.log('\n📝 Next steps:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to SQL Editor')
    console.log('4. Copy and paste the contents of supabase-schema.sql')
    console.log('5. Click Run')
  } else {
    console.log('✅ All tables exist! Database is ready.')
  }
}

setupDatabase()
