// Script to remove sample patient data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uvkgbahaeeoiibxmqmua.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2a2diYWhhZWVvaWlieG1xbXVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI2NjU2OCwiZXhwIjoyMDc4ODQyNTY4fQ.5NEMQWl2gn7tr5USFap4g16P3DELEJAXNm6x1t7NWq4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function removeSamples() {
  console.log('🗑️  Removing sample data...\n')

  // Delete sample patients
  const { error } = await supabase
    .from('section21_patients')
    .delete()
    .in('patient_unique_id', ['PATIENT-001', 'PATIENT-002', 'PATIENT-003'])

  if (error) {
    console.error('❌ Error:', error.message)
  } else {
    console.log('✅ Sample patients removed')
  }

  console.log('\n🎉 Done! Refresh your dashboard.')
}

removeSamples()
