import { useStore, HistoryRecord } from '../store/useStore'
import { X, Download, Clock, ChevronRight, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ImageModal } from './ImageModal'

export function HistoryPanel() {
  const { history, showHistory, toggleHistory, loadHistory } = useStore()
  const [modalImage, setModalImage] = useState<{ url: string; name: string } | null>(null)
  
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    if (!showHistory) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [showHistory])
  
  if (!showHistory) return null
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  const recentHistory = history.slice(0, 10)
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-30 h-[40vh] flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Generation History (最近10次)
          </h3>
          <button
            onClick={toggleHistory}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        {recentHistory.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No history yet</p>
        ) : (
          <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin pr-1">
            <div className="space-y-3">
              {recentHistory.map((record: HistoryRecord) => (
                <div key={record.id} className="border border-slate-200 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">{record.productInfo.name}</span>
                      <span className="text-xs text-slate-400">{formatDate(record.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span>{record.referenceCount} refs</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{record.categories.reduce((sum, cat) => sum + cat.images.length, 0)} images</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
                    {record.categories.flatMap(cat => cat.images).slice(0, 6).map((img) => (
                      <div 
                        key={img.id} 
                        className="relative w-16 h-16 rounded-md overflow-hidden border border-slate-200 group flex-shrink-0 cursor-pointer"
                        onClick={() => setModalImage({ url: img.url, name: `history_${img.id}.png` })}
                      >
                        <img
                          src={img.url}
                          alt="History image"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <ZoomIn className="w-3 h-3 text-white" />
                          <a
                            href={img.url}
                            download
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-3 h-3 text-white" />
                          </a>
                        </div>
                      </div>
                    ))}
                    {record.categories.flatMap(cat => cat.images).length > 6 && (
                      <div className="w-16 h-16 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-slate-500">
                          +{record.categories.flatMap(cat => cat.images).length - 6}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
