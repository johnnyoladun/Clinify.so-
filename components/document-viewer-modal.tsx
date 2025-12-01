"use client"

import { X } from 'lucide-react'
import { Button } from './ui/button'
import { useEffect, useState } from 'react'

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  documentUrl: string
  documentTitle: string
}

export function DocumentViewerModal({ isOpen, onClose, documentUrl, documentTitle }: DocumentViewerModalProps) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  
  useEffect(() => {
    if (!isOpen || !documentUrl) return
    
    // Load image dimensions for dynamic sizing
    const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(documentUrl)
    if (isImage) {
      const img = new Image()
      img.onload = () => {
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = documentUrl
    } else {
      setImageSize(null)
    }
  }, [isOpen, documentUrl])
  
  if (!isOpen) return null

  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(documentUrl)
  const isPdf = /\.pdf$/i.test(documentUrl)
  
  // Use Google Docs Viewer for PDFs - it's reliable and handles view-only perfectly
  const getPdfViewerUrl = () => {
    if (isPdf) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(documentUrl)}&embedded=true`
    }
    return documentUrl
  }
  
  const viewUrl = getPdfViewerUrl()

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" 
      onClick={onClose}
    >
      <div 
        className={`relative rounded-lg border border-border bg-card shadow-2xl ${
          isPdf ? 'h-[90vh] w-full max-w-7xl' : 
          isImage && imageSize ? 'h-fit max-h-[90vh]' : 
          'h-[90vh] w-full max-w-5xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-lg font-semibold truncate max-w-[90%]">{documentTitle}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className={`overflow-auto ${
          isPdf ? 'h-[calc(90vh-4rem)] p-0' : 'h-[calc(90vh-4rem)] p-4'
        }`}>
          {isImage ? (
            <div className="flex h-full items-center justify-center">
              <img 
                src={documentUrl} 
                alt={documentTitle}
                className="max-h-full max-w-full rounded-lg object-contain"
                style={{
                  width: 'auto',
                  height: 'auto',
                }}
              />
            </div>
          ) : isPdf ? (
            <div className="h-full w-full bg-gray-900">
              <iframe
                src={viewUrl}
                className="h-full w-full border-0"
                title={documentTitle}
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Unable to preview this document type
                </p>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
