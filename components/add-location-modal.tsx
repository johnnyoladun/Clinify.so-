"use client"

import { useState } from 'react'
import { X, MapPin, FileText, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'

interface FieldMapping {
  patientName: string
  idDocument: string
  drScript: string
  outcomeLetters: string
}

interface JotformField {
  id: string
  name: string
  text: string
  type: string
}

interface AddLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  organisationId: string
}

export function AddLocationModal({ isOpen, onClose, onSuccess, organisationId }: AddLocationModalProps) {
  const [step, setStep] = useState(1)
  const [locationName, setLocationName] = useState('')
  const [tableId, setTableId] = useState('')
  const [formId, setFormId] = useState('')
  const [formFields, setFormFields] = useState<JotformField[]>([])
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({
    patientName: '',
    idDocument: '',
    drScript: '',
    outcomeLetters: '',
  })
  const [loadingFields, setLoadingFields] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchFormFields = async () => {
    if (!tableId.trim()) {
      setError('Table ID is required')
      return
    }

    setLoadingFields(true)
    setError('')
    try {
      const res = await fetch(`/api/jotform/table-fields/${tableId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setFormFields(data.fields || [])
        setFormId(data.formId || '')
        setStep(2)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to fetch table fields. Check the Table ID.')
      }
    } catch (err) {
      setError('Failed to fetch table fields. Please check the Table ID and try again.')
    } finally {
      setLoadingFields(false)
    }
  }

  const handleNext = () => {
    if (!locationName.trim()) {
      setError('Location name is required')
      return
    }
    if (!tableId.trim()) {
      setError('Table ID is required')
      return
    }
    fetchFormFields()
  }

  const handleBack = () => {
    setError('')
    setStep(1)
  }

  const handleSubmit = async () => {
    if (!fieldMapping.patientName || !fieldMapping.idDocument || 
        !fieldMapping.drScript || !fieldMapping.outcomeLetters) {
      setError('All field mappings are required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/organisations/${organisationId}/locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: locationName,
          tableId: tableId,
          formId: formId,
          fieldMappings: fieldMapping,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Trigger immediate sync
        console.log('Location created, triggering sync...')
        try {
          await fetch('/api/jotform/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ form_id: formId })
          })
          console.log('Initial sync completed')
        } catch (syncErr) {
          console.error('Initial sync failed:', syncErr)
        }
        
        // Reset form
        setStep(1)
        setLocationName('')
        setTableId('')
        setFormId('')
        setFormFields([])
        setFieldMapping({ patientName: '', idDocument: '', drScript: '', outcomeLetters: '' })
        onSuccess()
        onClose()
      } else {
        setError(data.error || 'Failed to add location')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setLocationName('')
    setTableId('')
    setFormId('')
    setFormFields([])
    setFieldMapping({ patientName: '', idDocument: '', drScript: '', outcomeLetters: '' })
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={handleClose}>
      <div className="relative w-full max-w-3xl rounded-lg border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h3 className="text-xl font-semibold">Add New Location</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Step {step} of 2: {step === 1 ? 'Location & Table ID' : 'Map Form Fields'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Step 1: Location & Table ID */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  Location Name
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Garden Route, Blue Hills"
                  className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Jotform Form/Table ID
                </label>
                <input
                  type="text"
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value)}
                  placeholder="e.g., 252506373739059"
                  className="w-full rounded-lg border border-input bg-black/20 px-3 py-2 text-sm font-mono focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the Form ID or Table/Report ID from Jotform
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Field Mapping */}
          {step === 2 && (
            <div>
              <p className="text-sm text-muted-foreground mb-6">
                Drag and drop Jotform fields from the left into the corresponding dashboard fields on the right
              </p>

              <div className="grid grid-cols-2 gap-6">
                {/* Left: Jotform Fields */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    Jotform Fields
                  </h4>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                    {formFields.map((field) => {
                      const isUsed = Object.values(fieldMapping).includes(field.id)
                      return (
                        <div
                          key={field.id}
                          draggable={!isUsed}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('fieldId', field.id)
                            e.dataTransfer.setData('fieldText', field.text || field.name)
                          }}
                          className={`rounded-lg border p-3 text-sm transition-all ${
                            isUsed
                              ? 'border-green-500/30 bg-green-500/5 opacity-50 cursor-not-allowed'
                              : 'border-border bg-black/20 cursor-move hover:border-blue-400 hover:bg-blue-500/5'
                          }`}
                        >
                          <p className="font-medium">{field.text || field.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{field.type}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right: Dashboard Fields (Drop Zones) */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Dashboard Fields</h4>
                  <div className="space-y-3">
                    {/* Patient Name */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const fieldId = e.dataTransfer.getData('fieldId')
                        setFieldMapping({ ...fieldMapping, patientName: fieldId })
                      }}
                      className={`rounded-lg border-2 border-dashed p-4 transition-all ${
                        fieldMapping.patientName ? 'border-green-500 bg-green-500/5' : 'border-border bg-black/10 hover:border-blue-400 hover:bg-blue-500/5'
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">Patient Full Name</p>
                      {fieldMapping.patientName ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{formFields.find(f => f.id === fieldMapping.patientName)?.text || 'Mapped'}</p>
                          <button onClick={() => setFieldMapping({ ...fieldMapping, patientName: '' })} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/50">Drop field here...</p>
                      )}
                    </div>

                    {/* ID Document */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const fieldId = e.dataTransfer.getData('fieldId')
                        const field = formFields.find(f => f.id === fieldId)
                        if (field?.type === 'control_fileupload') {
                          setFieldMapping({ ...fieldMapping, idDocument: fieldId })
                        }
                      }}
                      className={`rounded-lg border-2 border-dashed p-4 transition-all ${
                        fieldMapping.idDocument ? 'border-green-500 bg-green-500/5' : 'border-border bg-black/10 hover:border-yellow-400 hover:bg-yellow-500/5'
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">ID Document Upload</p>
                      {fieldMapping.idDocument ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{formFields.find(f => f.id === fieldMapping.idDocument)?.text || 'Mapped'}</p>
                          <button onClick={() => setFieldMapping({ ...fieldMapping, idDocument: '' })} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/50">Drop file upload field here...</p>
                      )}
                    </div>

                    {/* Doctor's Script */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const fieldId = e.dataTransfer.getData('fieldId')
                        const field = formFields.find(f => f.id === fieldId)
                        if (field?.type === 'control_fileupload') {
                          setFieldMapping({ ...fieldMapping, drScript: fieldId })
                        }
                      }}
                      className={`rounded-lg border-2 border-dashed p-4 transition-all ${
                        fieldMapping.drScript ? 'border-green-500 bg-green-500/5' : 'border-border bg-black/10 hover:border-green-400 hover:bg-green-500/5'
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">Doctor's Script Upload</p>
                      {fieldMapping.drScript ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{formFields.find(f => f.id === fieldMapping.drScript)?.text || 'Mapped'}</p>
                          <button onClick={() => setFieldMapping({ ...fieldMapping, drScript: '' })} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/50">Drop file upload field here...</p>
                      )}
                    </div>

                    {/* Outcome Letter */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault()
                        const fieldId = e.dataTransfer.getData('fieldId')
                        const field = formFields.find(f => f.id === fieldId)
                        if (field?.type === 'control_fileupload') {
                          setFieldMapping({ ...fieldMapping, outcomeLetters: fieldId })
                        }
                      }}
                      className={`rounded-lg border-2 border-dashed p-4 transition-all ${
                        fieldMapping.outcomeLetters ? 'border-green-500 bg-green-500/5' : 'border-border bg-black/10 hover:border-blue-400 hover:bg-blue-500/5'
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground mb-2">Section 21 Outcome Letter</p>
                      {fieldMapping.outcomeLetters ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{formFields.find(f => f.id === fieldMapping.outcomeLetters)?.text || 'Mapped'}</p>
                          <button onClick={() => setFieldMapping({ ...fieldMapping, outcomeLetters: '' })} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/50">Drop file upload field here...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border p-6">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="border-border hover:bg-accent">
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            {step < 2 ? (
              <Button 
                onClick={handleNext} 
                disabled={loadingFields}
                className="bg-white text-black hover:bg-gray-200"
              >
                {loadingFields ? 'Loading Fields...' : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-white text-black hover:bg-gray-200"
              >
                {loading ? 'Adding...' : 'Add Location'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
