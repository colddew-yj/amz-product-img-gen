import { useStore } from './store/useStore'
import { ProductInfoForm } from './components/ProductInfoForm'
import { ReferenceUploader } from './components/ReferenceUploader'
import { CategoryConfigurator } from './components/CategoryConfigurator'
import { GenerationGallery } from './components/GenerationGallery'
import { HistoryPanel } from './components/HistoryPanel'
import { Sparkles, History, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect } from 'react'

function App() {
  const { isGenerating, showHistory, toggleHistory, toastMessage, loadHistory } = useStore()

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Amazon Product Image Generator</h1>
              <p className="text-xs text-slate-500">AI-powered product photography</p>
            </div>
          </div>
          <button
            onClick={toggleHistory}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <History className="w-4 h-4" />
            History
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ProductInfoForm />
            <ReferenceUploader />
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            <CategoryConfigurator />
            <GenerationGallery />
          </div>
        </div>
      </main>

      {showHistory && <HistoryPanel />}

      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4">
          <div className="fade-in bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xl rounded-full px-4 py-2 text-sm font-semibold">
            {toastMessage}
          </div>
        </div>
      )}
      
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-medium text-slate-700">Generating images...</p>
            <p className="text-sm text-slate-500">Please wait, this may take a few minutes</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
