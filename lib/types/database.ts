// Database type definitions for Supabase tables

export type UserRole = 'admin' | 'user'

export type UserStatus = 'active' | 'inactive'

export type GMPStatus = 'active' | 'inactive'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  status: UserStatus
  assigned_gmp_ids?: string[] // Array of GMP IDs this user has access to
  gmp?: GMP // Joined GMP data for the user
  created_at: string
  updated_at: string
}

export interface GMP {
  id: string
  gmp_name: string
  gmp_license_number: string
  license_version_no?: string
  status: GMPStatus
  created_at: string
  updated_at: string
}

export interface Section21Patient {
  id: string
  patient_full_name: string
  patient_unique_id: string
  patient_id_document_url?: string
  dr_script_url?: string
  sahpra_invoice_url?: string
  outcome_letter_url?: string
  outcome_letter_uploaded_at?: string // When Section 21 was uploaded (for expiry calculation)
  gmp_id?: string
  form_id: string
  form_title: string // Human-readable form name/location
  // New fields for Control Centre integration
  organisation_id?: string
  location_id?: string
  name_prefix?: string
  first_name?: string
  last_name?: string
  // Joined fields from Control Centre
  organisations?: {
    id: string
    name: string
  }
  locations?: {
    id: string
    name: string
    organisation_id: string
  }
  created_at: string
  updated_at: string
}

// Form title mapping for Jotform
export interface FormTitleMapping {
  [formId: string]: string
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}
