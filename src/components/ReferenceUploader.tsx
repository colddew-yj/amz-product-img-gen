import { useStore, ReferenceImage } from '../store/useStore'
import { Upload, X, ImagePlus } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

export function ReferenceUploader() {
  const { referenceImages, addReferenceImage, removeReferenceImage } = useStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    const remainingSlots = 3 - referenceImages.length
    const filesToAdd = Array.from(files).slice(0, remainingSlots)
    
    filesToAdd.forEach(file => {
      const preview = URL.createObjectURL(file)
      const newImage: ReferenceImage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        preview
      }
      addReferenceImage(newImage)
    })
    
    e.target.value = ''
  }, [referenceImages.length, addReferenceImage])
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (!files) return
    
    const remainingSlots = 3 - referenceImages.length
    const filesToAdd = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, remainingSlots)
    
    filesToAdd.forEach(file => {
      const preview = URL.createObjectURL(file)
      const newImage: ReferenceImage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        preview
      }
      addReferenceImage(newImage)
    })
    
    e.dataTransfer.clearData()
  }, [referenceImages.length, addReferenceImage])
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])
  
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleAddUrl = useCallback(() => {
    const raw = urlInput.trim()
    if (!raw) return
    if (!raw.startsWith('https://')) {
      alert('Only https:// image URLs are supported')
      return
    }
    if (referenceImages.length >= 3) return
    const newImage: ReferenceImage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file: null,
      preview: raw,
      sourceUrl: raw
    }
    addReferenceImage(newImage)
    setUrlInput('')
  }, [urlInput, referenceImages.length, addReferenceImage])
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Reference Images</h2>
      <p className="text-xs text-slate-500 mb-4">
        Upload 1-3 reference images <span className="text-red-500">*</span>
      </p>

      <div className="flex gap-2 mb-3">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddUrl()
            }
          }}
          placeholder="Paste https:// image URL"
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
          disabled={referenceImages.length >= 3}
        />
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={referenceImages.length >= 3}
          className="px-3 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-3">
        {referenceImages.map((img) => (
          <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
            <img
              src={img.preview}
              alt="Reference"
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => {
                if (img.preview.startsWith('blob:')) {
                  URL.revokeObjectURL(img.preview)
                }
                removeReferenceImage(img.id)
              }}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        {referenceImages.length < 3 && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={handleUploadClick}
            className="aspect-square rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
            {referenceImages.length === 0 ? (
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
            ) : (
              <ImagePlus className="w-6 h-6 text-slate-400 mb-1" />
            )}
            <span className="text-xs text-slate-400">
              {referenceImages.length === 0 ? 'Upload' : 'Add more'}
            </span>
          </div>
        )}
      </div>
      
      {referenceImages.length === 0 && (
        <p className="text-xs text-orange-500 text-center">At least 1 reference image required</p>
      )}
      
      {referenceImages.length > 0 && referenceImages.length < 3 && (
        <p className="text-xs text-slate-400 text-center">
          {3 - referenceImages.length} more slots available
        </p>
      )}
    </div>
  )
}
