// Script to add sample patient data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://uvkgbahaeeoiibxmqmua.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2a2diYWhhZWVvaWlieG1xbXVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzI2NjU2OCwiZXhwIjoyMDc4ODQyNTY4fQ.5NEMQWl2gn7tr5USFap4g16P3DELEJAXNm6x1t7NWq4'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSampleData() {
  console.log('🔧 Adding sample data...\n')

  // Add sample GMP
  console.log('1️⃣ Adding sample GMP...')
  const { data: gmp, error: gmpError } = await supabase
    .from('gmps')
    .upsert({
      gmp_name: 'SATIVA Hibiscus',
      gmp_license_number: 'GMP-2024-001',
      status: 'active'
    }, {
      onConflict: 'gmp_license_number'
    })
    .select()
    .single()

  if (gmpError) {
    console.error('❌ Error adding GMP:', gmpError.message)
  } else {
    console.log('✅ GMP added:', gmp)
  }

  // Add sample patients
  console.log('\n2️⃣ Adding sample patients...')
  
  const samplePatients = [
    {
      patient_full_name: 'John Doe',
      patient_unique_id: 'PATIENT-001',
      patient_id_document_url: 'https://example.com/id1.pdf',
      dr_script_url: 'https://example.com/script1.pdf',
      outcome_letter_url: 'https://example.com/outcome1.pdf',
      form_id: '123456789',
      form_title: 'SATIVA Hibiscus Cape Town'
    },
    {
      patient_full_name: 'Jane Smith',
      patient_unique_id: 'PATIENT-002',
      patient_id_document_url: 'https://example.com/id2.pdf',
      dr_script_url: 'https://example.com/script2.pdf',
      sahpra_invoice_url: 'https://example.com/invoice2.pdf',
      outcome_letter_url: 'https://example.com/outcome2.pdf',
      form_id: '987654321',
      form_title: 'Bassani Johannesburg'
    },
    {
      patient_full_name: 'Bob Johnson',
      patient_unique_id: 'PATIENT-003',
      patient_id_document_url: 'https://example.com/id3.pdf',
      outcome_letter_url: 'https://example.com/outcome3.pdf',
      form_id: '123456789',
      form_title: 'SATIVA Hibiscus Cape Town'
    }
  ]

  for (const patient of samplePatients) {
    const { error: patientError } = await supabase
      .from('section21_patients')
      .upsert(patient, {
        onConflict: 'patient_unique_id'
      })

    if (patientError) {
      console.error(`❌ Error adding patient ${patient.patient_full_name}:`, patientError.message)
    } else {
      console.log(`✅ Patient added: ${patient.patient_full_name}`)
    }
  }

  console.log('\n🎉 Sample data added successfully!')
  console.log('Refresh your dashboard to see the patients.')
}

addSampleData()
