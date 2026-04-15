import { useStore } from '../store/useStore'
import { Download, ImageOff, ZoomIn } from 'lucide-react'
import { useState } from 'react'
import { ImageModal } from './ImageModal'

export function GenerationGallery() {
  const { categories } = useStore()
  const [modalImage, setModalImage] = useState<{ url: string; name: string } | null>(null)
  
  const hasImages = Object.values(categories).some(cat => cat.images.length > 0)
  
  if (!hasImages) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col items-center justify-center text-slate-400">
          <ImageOff className="w-12 h-12 mb-3" />
          <p className="text-sm">No images generated yet</p>
          <p className="text-xs mt-1">Configure your settings and click Generate</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Generated Images</h2>
      
      <div className="space-y-6">
        {Object.entries(categories)
          .filter(([, cat]) => cat.images.length > 0)
          .map(([type, cat]) => (
            <div key={type}>
              <h3 className="text-sm font-medium text-slate-600 mb-3">{cat.label}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {cat.images.map((img, index) => (
                  <div
                    key={img.id}
                    className={`relative ${type === 'aplus' ? '' : 'aspect-square'} rounded-lg overflow-hidden border border-slate-200 group fade-in cursor-pointer`}
                    style={
                      type === 'aplus'
                        ? {
                            aspectRatio: `${Math.floor(cat.size / 10000)}/${cat.size % 10000}`
                          }
                        : undefined
                    }
                  >
                    <img
                      src={img.url}
                      alt={`${cat.label} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onClick={() => setModalImage({ url: img.url, name: `amazon_${type}_${index + 1}.png` })}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setModalImage({ url: img.url, name: `amazon_${type}_${index + 1}.png` })}
                          className="px-3 py-2 bg-white rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                        >
                          <ZoomIn className="w-3 h-3" />
                          View
                        </button>
                        <a
                          href={img.url}
                          download={`amazon_${type}_${index + 1}.png`}
                          className="px-3 py-2 bg-white rounded-lg text-xs font-medium text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
      
      {modalImage && (
        <ImageModal
          imageUrl={modalImage.url}
          onClose={() => setModalImage(null)}
        />
      )}
    </div>
  )
}
