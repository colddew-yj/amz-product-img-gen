import { useStore, type StyleProfile } from '../store/useStore'
import { Minus, Plus, Sparkles } from 'lucide-react'

const sizeOptions = [1024, 1600, 2048]

const aplusSizeOptions = [
  { width: 1464, height: 600, label: '1464×600 (Premium桌面)' },
  { width: 1200, height: 600, label: '1200×600 (横幅)' },
  { width: 970, height: 600, label: '970×600 (标准横幅)' },
  { width: 800, height: 800, label: '800×800 (方形)' },
]

const styleProfileOptions = [
  { key: 'minimal_modern', label: '简约' },
  { key: 'japanese_soft', label: '日系' },
  { key: 'luxury_editorial', label: '轻奢' }
] as const satisfies ReadonlyArray<{ key: StyleProfile; label: string }>

export function CategoryConfigurator() {
  const { categories, setCategoryCount, setCategorySize, setCategoryDescriptions, startGeneration, isGenerating, productInfo, referenceImages, styleProfile, setStyleProfile } = useStore()
  
  const canGenerate = Boolean(productInfo.name.trim()) && referenceImages.length > 0 && !isGenerating
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Image Categories</h2>

      <div className="border border-slate-200 bg-white rounded-lg p-2 flex gap-2 mb-4" role="group" aria-label="Style profile">
        {styleProfileOptions.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setStyleProfile(opt.key)}
            disabled={isGenerating}
            aria-pressed={styleProfile === opt.key}
            className={`flex-1 py-2 rounded-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              styleProfile === opt.key
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 font-medium hover:bg-slate-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      <div className="space-y-4">
        {Object.entries(categories).map(([type, cat]) => (
          <div key={type} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">{cat.label}</span>
                {type === 'main' && <span className="text-xs text-red-500">*</span>}
                {type === 'main' && <span className="text-xs text-slate-400">(白底图)</span>}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryCount(type, Math.max(cat.minCount, cat.count - 1))}
                  disabled={cat.count <= cat.minCount}
                  className="w-7 h-7 rounded-md border border-slate-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                >
                  <Minus className="w-4 h-4 text-slate-600" />
                </button>
                
                <span className="w-8 text-center font-medium text-slate-700">{cat.count}</span>
                
                <button
                  type="button"
                  onClick={() => setCategoryCount(type, Math.min(cat.maxCount, cat.count + 1))}
                  disabled={cat.count >= cat.maxCount}
                  className="w-7 h-7 rounded-md border border-slate-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>
            
            {type !== 'aplus' && (
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Size (1:1 ratio)</label>
                <div className="flex gap-2">
                  {sizeOptions.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCategorySize(type, size)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        cat.size === size
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-slate-300 text-slate-600 hover:border-orange-400'
                      }`}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {type === 'aplus' && (
              <div className="mb-3">
                <label className="block text-xs text-slate-500 mb-1">Size (Amazon A+ compatible)</label>
                <div className="flex gap-2 flex-wrap">
                  {aplusSizeOptions.map(sizeOpt => (
                    <button
                      key={sizeOpt.label}
                      type="button"
                      onClick={() => setCategorySize(type, sizeOpt.width * 10000 + sizeOpt.height)}
                      className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                        cat.size === sizeOpt.width * 10000 + sizeOpt.height
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-slate-300 text-slate-600 hover:border-orange-400'
                      }`}
                    >
                      {sizeOpt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">生成后可裁剪至亚马逊A+标准尺寸</p>
              </div>
            )}
            
            {type !== 'main' && cat.count > 0 && (
              <div className="space-y-2">
                <label className="block text-xs text-slate-500">Descriptions (每张图对应一段描述)</label>
                {Array.from({ length: cat.count }).map((_, index) => (
                  <div key={index}>
                    <label className="block text-xs text-slate-400 mb-1">图 {index + 1} 描述</label>
                    <input
                      type="text"
                      value={cat.descriptions?.[index] || ''}
                      onChange={(e) => {
                        const newDescriptions = [...(cat.descriptions || [])]
                        newDescriptions[index] = e.target.value
                        setCategoryDescriptions(type, newDescriptions)
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      placeholder={`第 ${index + 1} 张图的描述文字...`}
                    />
                  </div>
                ))}
                <p className="text-xs text-slate-400">描述文字会显示在生成的图片上</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button
        onClick={startGeneration}
        disabled={!canGenerate}
        type="button"
        className={`w-full mt-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
          canGenerate
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-md'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        {isGenerating ? 'Generating...' : 'Generate Images'}
      </button>
      
      {!productInfo.name.trim() && (
        <p className="text-xs text-orange-500 text-center mt-2">Product name is required</p>
      )}
      {productInfo.name.trim() && referenceImages.length === 0 && (
        <p className="text-xs text-orange-500 text-center mt-2">At least 1 reference image required</p>
      )}
    </div>
  )
}
