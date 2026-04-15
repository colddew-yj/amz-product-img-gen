import { create } from 'zustand'

export interface ReferenceImage {
  id: string
  file: File | null
  preview: string
  sourceUrl?: string
  ossUrl?: string
}

export type StyleProfile = 'minimal_modern' | 'japanese_soft' | 'luxury_editorial'

export interface ProductInfo {
  name: string
  category: string
  material: string
  dimensions: string
  useCase: string
  targetAudience: string
}

export interface ImageCategory {
  type: 'main' | 'scene' | 'detail' | 'aplus'
  label: string
  count: number
  minCount: number
  maxCount: number
  size: number
  descriptions: string[]
  images: GeneratedImage[]
  isGenerating: boolean
}

export interface GeneratedImage {
  id: string
  url: string
  localPath?: string
  timestamp?: number
  prompt?: string
  description?: string
}

export interface HistoryRecord {
  id: string
  timestamp: number
  productInfo: ProductInfo
  referenceCount: number
  categories: {
    type: string
    count: number
    images: {
      id: string
      url: string
      timestamp?: number
    }[]
  }[]
}

let toastTimeout: ReturnType<typeof setTimeout> | null = null

interface StoreState {
  productInfo: ProductInfo
  referenceImages: ReferenceImage[]
  categories: Record<string, ImageCategory>
  isGenerating: boolean
  toastMessage: string | null
  showHistory: boolean
  history: HistoryRecord[]
  styleProfile: StyleProfile
  
  setProductInfo: (info: Partial<ProductInfo>) => void
  addReferenceImage: (image: ReferenceImage) => void
  removeReferenceImage: (id: string) => void
  setCategoryCount: (type: string, count: number) => void
  setCategorySize: (type: string, size: number) => void
  setCategoryDescriptions: (type: string, descriptions: string[]) => void
  setStyleProfile: (profile: StyleProfile) => void
  setToastMessage: (message: string | null) => void
  startGeneration: () => Promise<void>
  toggleHistory: () => void
  loadHistory: () => void
  clearCurrentGeneration: () => void
}

const initialCategories: Record<string, ImageCategory> = {
  main: {
    type: 'main',
    label: 'White Background Main Image',
    count: 1,
    minCount: 1,
    maxCount: 2,
    size: 1600,
    descriptions: [],
    images: [],
    isGenerating: false
  },
  scene: {
    type: 'scene',
    label: 'Scene Image',
    count: 0,
    minCount: 0,
    maxCount: 4,
    size: 1600,
    descriptions: [],
    images: [],
    isGenerating: false
  },
  detail: {
    type: 'detail',
    label: 'Detail Image',
    count: 0,
    minCount: 0,
    maxCount: 4,
    size: 1600,
    descriptions: [],
    images: [],
    isGenerating: false
  },
  aplus: {
    type: 'aplus',
    label: 'A+ Image',
    count: 0,
    minCount: 0,
    maxCount: 4,
    size: 12000600,
    descriptions: [],
    images: [],
    isGenerating: false
  }
}

export const useStore = create<StoreState>((set, get) => ({
  productInfo: {
    name: '',
    category: '',
    material: '',
    dimensions: '',
    useCase: '',
    targetAudience: ''
  },
  referenceImages: [],
  categories: initialCategories,
  isGenerating: false,
  toastMessage: null,
  showHistory: false,
  history: [],
  styleProfile: 'minimal_modern',
  
  setProductInfo: (info) => set((state) => ({
    productInfo: { ...state.productInfo, ...info }
  })),
  
  addReferenceImage: (image) => set((state) => ({
    referenceImages: [...state.referenceImages, image]
  })),
  
  removeReferenceImage: (id) => set((state) => ({
    referenceImages: state.referenceImages.filter(img => img.id !== id)
  })),
  
  setCategoryCount: (type, count) => set((state) => ({
    categories: {
      ...state.categories,
      [type]: { 
        ...state.categories[type], 
        count,
        descriptions: Array.from({ length: count }).map((_, i) => state.categories[type].descriptions?.[i] || '')
      }
    }
  })),
  
  setCategorySize: (type, size) => set((state) => ({
    categories: {
      ...state.categories,
      [type]: { ...state.categories[type], size }
    }
  })),
  
  setCategoryDescriptions: (type, descriptions) => set((state) => ({
    categories: {
      ...state.categories,
      [type]: { ...state.categories[type], descriptions }
    }
  })),

  setStyleProfile: (styleProfile) => set({ styleProfile }),

  setToastMessage: (message) => set({ toastMessage: message }),
  
  startGeneration: async () => {
    const state = get()
    
    if (!state.productInfo.name.trim()) {
      alert('Product name is required')
      return
    }
    
    if (state.referenceImages.length === 0) {
      alert('At least one reference image is required')
      return
    }
    
    const hasImagesToGenerate = Object.values(state.categories).some(cat => cat.count > 0)
    if (!hasImagesToGenerate) {
      alert('Please select at least one image category to generate')
      return
    }
    
    set({ isGenerating: true })
    
    try {
      const formData = new FormData()
      formData.append('productInfo', JSON.stringify(state.productInfo))
      formData.append('styleProfile', state.styleProfile)
      
      state.referenceImages.forEach((img) => {
        if (img.file) {
          formData.append('references', img.file)
        }
      })

      const referenceUrls = state.referenceImages
        .filter((img) => !img.file && img.sourceUrl)
        .map((img) => img.sourceUrl as string)
        .slice(0, 3)

      if (referenceUrls.length > 0) {
        formData.append('referenceUrls', JSON.stringify(referenceUrls))
      }
      
      const categoriesToGenerate = Object.entries(state.categories)
        .filter(([, cat]) => cat.count > 0)
        .map(([type, cat]) => ({
          type,
          count: cat.count,
          size: cat.size,
          descriptions: cat.descriptions
        }))
      
      formData.append('categories', JSON.stringify(categoriesToGenerate))
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        let message = `Generation request failed (HTTP ${response.status})`
        try {
          const data = await response.json()
          if (data?.error) {
            message = String(data.error)
          }
        } catch {
          try {
            const text = await response.text()
            if (text.trim()) {
              message = text
            }
          } catch {
          }
        }
        throw new Error(message)
      }
      
      const result = await response.json()
      
      if (result.success) {
        const newCategories = { ...state.categories }
        
        result.generatedImages.forEach((genResult: { type: string; images: GeneratedImage[] }) => {
          if (newCategories[genResult.type]) {
            newCategories[genResult.type] = {
              ...newCategories[genResult.type],
              images: genResult.images,
              isGenerating: false
            }
          }
        })
        
        set({ categories: newCategories })
        
        const historyRecord: HistoryRecord = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          productInfo: state.productInfo,
          referenceCount: state.referenceImages.length,
          categories: Object.entries(newCategories)
            .filter(([, cat]) => cat.images.length > 0)
            .map(([type, cat]) => ({
              type,
              count: cat.count,
              images: cat.images.map((img) => ({ id: img.id, url: img.url, timestamp: img.timestamp }))
            }))
        }
        
        const nextHistory = [historyRecord, ...get().history].slice(0, 10)
        set({ history: nextHistory })
        localStorage.setItem('amazon_image_history', JSON.stringify(nextHistory))

        const summaryParts: string[] = []
        const typeLabels: Record<string, string> = { main: '主图', scene: '场景', detail: '细节', aplus: 'A+' }
        result.generatedImages.forEach((g: { type: string; images: GeneratedImage[] }) => {
          const label = typeLabels[g.type] || g.type
          summaryParts.push(`${label}${g.images?.length || 0}`)
        })
        const toast = `生成完成：${summaryParts.join(' / ')}`
        if (toastTimeout) {
          clearTimeout(toastTimeout)
        }
        set({ toastMessage: toast })
        toastTimeout = setTimeout(() => {
          set({ toastMessage: null })
          toastTimeout = null
        }, 3000)
      } else {
        throw new Error(result.error || 'Generation failed')
      }
    } catch (error) {
      console.error('Generation error:', error)
      alert(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      set({ isGenerating: false })
    }
  },
  
  toggleHistory: () => set((state) => ({ showHistory: !state.showHistory })),
  
  loadHistory: () => {
    const saved = localStorage.getItem('amazon_image_history')
    if (saved) {
      try {
        const history = JSON.parse(saved).slice(0, 10)
        set({ history })
      } catch (e) {
        console.error('Failed to load history:', e)
      }
    }
  },
  
  clearCurrentGeneration: () => set({
    categories: initialCategories
  })
}))
