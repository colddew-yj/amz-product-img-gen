import { X } from 'lucide-react'
import type { MouseEvent } from 'react'

interface ImageModalProps {
  imageUrl: string
  onClose: () => void
}

export function ImageModal({ imageUrl, onClose }: ImageModalProps) {
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-full max-h-full">
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 p-2 bg-white rounded-full shadow-lg hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>
        
        <img
          src={imageUrl}
          alt="Full size image"
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
    </div>
  )
}
