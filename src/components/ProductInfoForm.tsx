import { useStore } from '../store/useStore'

export function ProductInfoForm() {
  const { productInfo, setProductInfo } = useStore()
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Product Information</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Product Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={productInfo.name}
            onChange={(e) => setProductInfo({ name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            placeholder="Enter product name"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <input
            type="text"
            value={productInfo.category}
            onChange={(e) => setProductInfo({ category: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            placeholder="e.g., Electronics, Home & Kitchen"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Material</label>
          <input
            type="text"
            value={productInfo.material}
            onChange={(e) => setProductInfo({ material: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            placeholder="e.g., Stainless steel, Plastic"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dimensions</label>
          <input
            type="text"
            value={productInfo.dimensions}
            onChange={(e) => setProductInfo({ dimensions: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            placeholder="e.g., 10 x 5 x 3 cm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Use Case</label>
          <input
            type="text"
            value={productInfo.useCase}
            onChange={(e) => setProductInfo({ useCase: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            placeholder="e.g., Kitchen storage, Outdoor camping"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
          <input
            type="text"
            value={productInfo.targetAudience}
            onChange={(e) => setProductInfo({ targetAudience: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            placeholder="e.g., Home cooks, Outdoor enthusiasts"
          />
        </div>
      </div>
    </div>
  )
}