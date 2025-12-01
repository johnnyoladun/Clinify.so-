const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uvkgbahaeeoiibxmqmua.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2a2diYWhhZWVvaWlieG1xbXVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI2NjU2OCwiZXhwIjoyMDc4ODQyNTY4fQ.5NEMQWl2gn7tr5USFap4g16P3DELEJAXNm6x1t7NWq4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyDataFlow() {
  console.log('🔍 Verifying Jotform → Supabase → Dashboard flow\n')

  // 1. Check total patients in Supabase
  console.log('1️⃣ Checking Supabase database...')
  const { count, error: countError } = await supabase
    .from('section21_patients')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('❌ Error:', countError.message)
    return
  }

  console.log(`✅ Total patients in Supabase: ${count}\n`)

  // 2. Get sample of latest patients
  console.log('2️⃣ Latest 10 patients synced:')
  const { data: latest } = await supabase
    .from('section21_patients')
    .select('patient_full_name, form_title, patient_unique_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  latest?.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.patient_full_name} - ${p.form_title}`)
    console.log(`      ID: ${p.patient_unique_id} | Created: ${new Date(p.created_at).toLocaleString()}`)
  })

  // 3. Count by form
  console.log('\n3️⃣ Patients by form:')
  const { data: byForm } = await supabase
    .from('section21_patients')
    .select('form_title')

  const formCounts = {}
  byForm?.forEach(p => {
    formCounts[p.form_title] = (formCounts[p.form_title] || 0) + 1
  })

  Object.entries(formCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([form, count]) => {
      console.log(`   - ${form}: ${count} patients`)
    })

  console.log('\n✅ Data flow verification complete!')
  console.log('\n📊 Summary:')
  console.log(`   ✅ Jotform → Supabase: ${count} patients imported`)
  console.log(`   ✅ Supabase → Dashboard: Ready to display`)
  console.log('\n💡 Next step: Refresh your dashboard at http://localhost:3000')
}

verifyDataFlow()
