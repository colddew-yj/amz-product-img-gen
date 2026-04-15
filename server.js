import express from 'express'
import multer from 'multer'
import cors from 'cors'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import axios from 'axios'
import dns from 'dns/promises'
import net from 'net'
import { spawn } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const upload = multer({ dest: path.join(__dirname, 'uploads/') })

const GENERATED_DIR = path.join(__dirname, 'public', 'generated')
if (!fs.existsSync(GENERATED_DIR)) {
  fs.mkdirSync(GENERATED_DIR, { recursive: true })
}

const UPLOADS_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1/'

console.log(`Server starting...`)
console.log(`Generated images directory: ${GENERATED_DIR}`)
console.log(`Uploads directory: ${UPLOADS_DIR}`)

const STYLE_PROFILES = new Set(['minimal_modern', 'japanese_soft', 'luxury_editorial'])
const IMAGE_TYPES = new Set(['main', 'scene', 'detail', 'aplus'])

function isPrivateIp(ip) {
  const family = net.isIP(ip)
  if (family === 4) {
    const parts = ip.split('.').map((n) => Number(n))
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true
    const [a, b] = parts
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    return false
  }
  if (family === 6) {
    const v = ip.toLowerCase()
    if (v === '::1') return true
    if (v.startsWith('fc') || v.startsWith('fd')) return true
    if (v.startsWith('fe80')) return true
    if (v === '::') return true
    return false
  }
  return true
}

async function validatePublicHttpsUrl(raw) {
  let parsed
  try {
    parsed = new URL(raw)
  } catch {
    throw new Error('Invalid URL')
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Only https:// URLs are allowed')
  }
  if (!parsed.hostname) {
    throw new Error('Invalid URL hostname')
  }
  const hostname = parsed.hostname.toLowerCase()
  if (hostname === 'localhost') {
    throw new Error('URL hostname is not allowed')
  }
  const addrs = await dns.lookup(hostname, { all: true })
  if (!addrs || addrs.length === 0) {
    throw new Error('URL hostname could not be resolved')
  }
  for (const addr of addrs) {
    if (isPrivateIp(addr.address)) {
      throw new Error('URL resolves to a private network address')
    }
  }
  return parsed.toString()
}

function extFromContentType(contentType) {
  const ct = String(contentType || '').toLowerCase().split(';')[0].trim()
  if (ct === 'image/jpeg' || ct === 'image/jpg') return '.jpg'
  if (ct === 'image/png') return '.png'
  if (ct === 'image/webp') return '.webp'
  if (ct === 'image/gif') return '.gif'
  return ''
}

async function downloadReferenceUrlToFile(url, baseName) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
      timeout: 10000,
      maxRedirects: 3,
      signal: controller.signal,
      validateStatus: (s) => s >= 200 && s < 300
    })
    const contentType = response.headers?.['content-type']
    if (!String(contentType || '').toLowerCase().startsWith('image/')) {
      throw new Error('URL is not an image')
    }
    const ext = extFromContentType(contentType) || '.img'
    const filePath = path.join(UPLOADS_DIR, `${baseName}${ext}`)
    const writer = fs.createWriteStream(filePath)
    const maxBytes = 10 * 1024 * 1024
    let bytes = 0
    return await new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        bytes += chunk.length
        if (bytes > maxBytes) {
          response.data.destroy(new Error('Image too large'))
        }
      })
      response.data.on('error', (err) => {
        try {
          writer.destroy()
        } catch {}
        reject(err)
      })
      writer.on('error', reject)
      writer.on('finish', () => resolve(filePath))
      response.data.pipe(writer)
    })
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeStyleProfile(value) {
  return STYLE_PROFILES.has(value) ? value : 'minimal_modern'
}

function escapePromptText(value) {
  if (value == null) return ''
  return String(value).replace(/[\r\n]+/g, ' ').replace(/"/g, '\\"').trim()
}

const TYPOGRAPHY_VARIANTS = {
  minimal_modern: [
    'modern geometric sans-serif headline, slightly condensed, clean letterforms, high readability, medium weight, not cursive, not handwritten',
    'modern geometric sans-serif headline, slightly condensed, clean letterforms, high readability, bold weight, not cursive, not handwritten',
    'neo-grotesque sans-serif title (Swiss modern), clean grid typography, medium weight, not cursive, not handwritten',
    'neo-grotesque sans-serif title (Swiss modern), clean grid typography, bold weight, not cursive, not handwritten',
    'ultra-minimal condensed sans-serif headline, wide tracking, clean modern, medium weight, not cursive, not handwritten',
    'ultra-minimal condensed sans-serif headline, wide tracking, clean modern, bold weight, not cursive, not handwritten',
    'restrained modern serif small-caps headline, editorial minimal, medium weight, not cursive, not handwritten',
    'restrained modern serif small-caps headline, editorial minimal, bold weight, not cursive, not handwritten'
  ],
  japanese_soft: [
    'soft handwritten pen lettering, gentle thin-to-medium strokes, warm and subtle, not exaggerated',
    'rounded minimal sans-serif with a soft friendly feel, warm tone, subtle',
    'delicate brush lettering with minimal texture, soft and clean, not heavy ink',
    'light modern serif with gentle handwritten vibe, warm and minimal'
  ],
  luxury_editorial: [
    'high-contrast modern serif headline (editorial), premium and restrained, bold weight',
    'luxury editorial serif small-caps headline, clean hierarchy, minimal effects, medium weight',
    'luxury editorial serif small-caps headline, clean hierarchy, minimal effects, bold weight',
    'premium condensed serif display headline, elegant proportions, editorial feel',
    'modern editorial sans-serif headline with refined proportions, premium minimal, bold weight'
  ]
}

function pickTypographyVariant(styleProfile) {
  const variants = TYPOGRAPHY_VARIANTS[styleProfile] || TYPOGRAPHY_VARIANTS.minimal_modern
  return variants[Math.floor(Math.random() * variants.length)]
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateAmazonPrompt(productInfo, imageType, description, styleProfile, typographyOverride) {
  const productName = escapePromptText(productInfo?.name) || 'product'
  const category = escapePromptText(productInfo?.category)
  const material = escapePromptText(productInfo?.material)
  const dimensions = escapePromptText(productInfo?.dimensions)
  const safeCopy = description == null ? '' : String(description).replace(/\r/g, '').replace(/"/g, '\\"').trim()
  const normalizedStyleProfile = normalizeStyleProfile(styleProfile)
  const typography = typographyOverride || pickTypographyVariant(normalizedStyleProfile)

  const categoryText = category || 'the category'
  const sizeRule = dimensions
    ? `follow this size: ${dimensions}.`
    : 'if dimensions are not provided, infer a realistic size from the reference image, category, and usage context; avoid exaggerating the size.'

  const basePrompts = {
    main: `Based on the reference image, create an Amazon white background main product photo. The reference image shows ${productName}${category ? `, a ${category}` : ''}${material ? `, made of ${material}` : ''}. Keep the exact same product identity and appearance from the reference image (same object, same shape, same color, same material, same details). Do NOT change it into any other product. Tight framing: the product should fill at least 85% of the image area, minimal white margins, subtle natural shadow only. Pure white background (#FFFFFF), professional studio lighting, high-end e-commerce photography, ultra sharp focus. No text, no logo, no watermark.`,

    scene: `Based on the reference image showing ${productName}${category ? `, a ${category}` : ''}${material ? `, made of ${material}` : ''}, create an Amazon lifestyle product photo. Place this exact product (same identity and appearance from reference) in a real, natural lifestyle scene with coherent lighting and perspective. Product is the hero element, realistic environment, premium atmosphere. Real-world scale rule: the product size must be realistic for ${categoryText} and the usage scene; ${sizeRule} Add natural scale cues (e.g., fridge handle, mug, hand) and keep proportions believable. Full-bleed, edge-to-edge composition: the scene must fill 100% of the canvas. No screenshot, no UI, no webpage layout, no poster mockup, no inset image, no padding, no border, no frame, no white margins, no header bar, no top title strip. If text is provided via the CRITICAL TEXT TO RENDER block, render ONLY that text and follow the typesetting spec; otherwise render no text. No logo, no watermark.`,

    detail: `Based on the reference image showing ${productName}${material ? `, made of ${material}` : ''}, create an Amazon product detail close-up. Extreme macro / close-up shot with tight crop: focus on the most important detail area and show fine texture and craftsmanship. The detail subject should fill 60–80% of the frame. Do NOT do wide shot, do NOT show the full product, do NOT use a lifestyle scene composition. Real-life background (tabletop, home interior, studio set) is allowed but must be strongly blurred with bokeh and shallow depth of field; keep the background minimal and unobtrusive. Premium lighting, ultra sharp focus on the detail. If text is provided via the CRITICAL TEXT TO RENDER block, render ONLY that text and follow the typesetting spec; otherwise render no text. No logo, no watermark.`,

    aplus: `Based on the reference image showing ${productName}${category ? `, a ${category}` : ''}, create an Amazon A+ marketing poster image. Feature this exact product (same identity and appearance from reference) in a premium lifestyle scene with cohesive composition and strong marketing mood, full-frame content, no empty side panels, no split panels. Real-world scale rule: the product size must be realistic for ${categoryText} and the usage scene; ${sizeRule} Add natural scale cues and keep proportions believable. If text is provided via the CRITICAL TEXT TO RENDER block, render ONLY that text and follow the typesetting spec; otherwise render no text. No logo, no watermark.`
  }

  const prompt = basePrompts[imageType] || basePrompts.main
  if (!safeCopy || imageType === 'main') return prompt

  const textAnchor = `CRITICAL CANVAS RULES (HIGHEST PRIORITY)\n- Output must be true 1:1 full-bleed.\n- No black bars, no letterboxing, no borders, no padding.\n- Fill the entire canvas with real scene content (top and bottom edges must contain image content, not empty bands).\n\nCRITICAL TEXT TO RENDER (EXACT, HIGHEST PRIORITY)\nTEXT_TO_RENDER_BEGIN\n${safeCopy}\nTEXT_TO_RENDER_END\nRules:\n- Render the text EXACTLY as provided, character-by-character, including capitalization, spacing, punctuation, and line breaks.\n- Do NOT translate, paraphrase, shorten, or extend.\n- Do NOT add, remove, or change any punctuation.\n- Do NOT insert line breaks unless they already exist in the text.\n- Render it as ONE single contiguous text block (one placement). Do NOT split into multiple separate text blocks.\n- Render it exactly once. Do NOT repeat any subset as a secondary headline or title.\n- No other text anywhere in the image.\nTypography must follow: ${typography}.\n\n=== TYPESETTING TASK (HIGHEST PRIORITY) ===\nYou are a professional typesetter (layout designer), not a copywriter.\nYour job is to place the provided text EXACTLY as-is, with correct spelling.\nDo NOT create alternative copy, do NOT shorten, do NOT summarize.\n\n=== TYPESETTING SPEC ===\n[TEXT_SOURCE] Use ONLY the text inside CRITICAL TEXT TO RENDER block.\n[TEXT_BLOCKS] Exactly 1 text block total (no extra headline/subtitle).\n[ANCHOR] Prefer top-right corner negative space; if not available, pick the cleanest corner (top-left / top-right / bottom-left / bottom-right).\n[SAFE_MARGIN] 8% of image width.\n[MAX_WIDTH] 45% of image width.\n[ALIGNMENT] Right aligned when using a right-side corner; otherwise left aligned.\n[HYPHENATION] Off; do not hyphenate.\n[LETTERING] Crisp, vector-like, uniform stroke, consistent kerning; no painterly texture.\n[EFFECTS] Minimal: none; optional subtle shadow only if needed for readability.\n`

  return `${textAnchor}\n${prompt}\n\nTEXT_TO_RENDER_REPEAT (FOR VERIFICATION ONLY, DO NOT RENDER): ${safeCopy}`
}

function parseSize(sizeValue, imageType) {
  if (imageType === 'aplus') {
    const width = Math.floor(sizeValue / 10000)
    const height = sizeValue % 10000
    return `${width}*${height}`
  }
  return `${sizeValue}*${sizeValue}`
}

async function uploadToOSS(filePath) {
  const skillPath = path.join(process.env.HOME || '', '.trae', 'skills', 'wan2.7-image-skill', 'scripts', 'file_to_oss.py')
  
  try {
    const result = await execPythonScript(skillPath, ['--file', filePath, '--model', 'wan2.7-image'])
    const ossUrl = result.trim()
    if (ossUrl.startsWith('oss://')) {
      return ossUrl
    }
    throw new Error(`Invalid OSS URL: ${ossUrl}`)
  } catch (error) {
    console.error('OSS upload failed:', error)
    throw error
  }
}

async function execPythonScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, ...args], {
      env: { ...process.env, DASHSCOPE_API_KEY, DASHSCOPE_BASE_URL }
    })
    
    let stdout = ''
    let stderr = ''
    
    python.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    python.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        const stdoutTrimmed = stdout.trim()
        const stderrTrimmed = stderr.trim()
        const detail = [stderrTrimmed, stdoutTrimmed].filter(Boolean).join('\n')
        reject(new Error(`Python script failed with code ${code}:${detail ? `\n${detail}` : ''}`))
      }
    })
    
    python.on('error', (err) => {
      reject(err)
    })
  })
}

async function generateSingleImage(prompt, inputImages, size) {
  const skillPath = path.join(process.env.HOME || '', '.trae', 'skills', 'wan2.7-image-skill', 'scripts', 'image-generation-editing.py')
  
  const args = [
    '--user_requirement', prompt,
    '--n', '1',
    '--size', size
  ]
  
  if (inputImages.length > 0) {
    args.push('--input_images', ...inputImages)
  }
  
  const maxRetries = 2
  const retryDelaysMs = [1200, 2400]
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await execPythonScript(skillPath, args)
      
      const urls = []
      const lines = result.split('\n')
      
      for (const line of lines) {
        if (line.includes('result No.') || line.startsWith('http') || line.startsWith('https')) {
          const urlMatch = line.match(/(https?:\/\/[^\s]+)/)
          if (urlMatch) {
            urls.push(urlMatch[1])
          }
        }
      }
      
      return urls[0] || null
    } catch (error) {
      if (attempt >= maxRetries) {
        console.error('Image generation failed:', error)
        throw error
      }
      
      console.warn(`Image generation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`)
      await sleepMs(retryDelaysMs[attempt] ?? 2400)
    }
  }
  
  return null
}

async function downloadAndSaveImage(url, filename) {
  const filePath = path.join(GENERATED_DIR, filename)
  
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream'
  })
  
  const writer = fs.createWriteStream(filePath)
  response.data.pipe(writer)
  
  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(filePath))
    writer.on('error', reject)
  })
}

app.post('/api/generate', upload.array('references'), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : []
  const tempFiles = []
  try {
    let productInfo = {}
    try {
      productInfo = JSON.parse(req.body.productInfo || '{}')
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid productInfo' })
    }

    let categories = []
    try {
      categories = JSON.parse(req.body.categories || '[]')
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid categories' })
    }

    const styleProfile = normalizeStyleProfile(req.body.styleProfile)
    const typographyVariant = pickTypographyVariant(styleProfile)

    let referenceUrls = []
    if (req.body.referenceUrls) {
      try {
        const parsed = JSON.parse(req.body.referenceUrls)
        if (!Array.isArray(parsed)) {
          return res.status(400).json({ success: false, error: 'Invalid referenceUrls' })
        }
        referenceUrls = parsed
          .filter((u) => typeof u === 'string')
          .map((u) => u.trim())
          .filter(Boolean)
          .slice(0, 3)
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid referenceUrls' })
      }
    }
    
    console.log('Received generation request:', {
      productInfo,
      categories,
      styleProfile,
      typographyVariant,
      fileCount: files.length,
      referenceUrlCount: referenceUrls.length
    })
    
    if (!productInfo?.name) {
      return res.status(400).json({ success: false, error: 'Product name is required' })
    }
    
    const totalReferences = files.length + referenceUrls.length
    if (totalReferences === 0) {
      return res.status(400).json({ success: false, error: 'At least one reference image is required' })
    }
    if (totalReferences > 3) {
      return res.status(400).json({ success: false, error: 'At most 3 reference images are allowed' })
    }
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, error: 'Invalid categories' })
    }

    if (!DASHSCOPE_API_KEY) {
      return res.status(500).json({ success: false, error: 'DASHSCOPE_API_KEY is not configured' })
    }
    
    const ossUrls = []
    for (const file of files) {
      console.log('Uploading file to OSS:', file.path)
      const ossUrl = await uploadToOSS(file.path)
      ossUrls.push(ossUrl)
      console.log('OSS URL:', ossUrl)
    }

    for (let i = 0; i < referenceUrls.length; i++) {
      const rawUrl = referenceUrls[i]
      const validatedUrl = await validatePublicHttpsUrl(rawUrl)
      const baseName = `ref_url_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`
      console.log('Downloading reference URL:', validatedUrl)
      const localPath = await downloadReferenceUrlToFile(validatedUrl, baseName)
      tempFiles.push(localPath)
      console.log('Uploading downloaded URL to OSS:', localPath)
      const ossUrl = await uploadToOSS(localPath)
      ossUrls.push(ossUrl)
      console.log('OSS URL:', ossUrl)
    }
    
    const generatedImages = []
    const generatedPrompts = []
    
    for (const category of categories) {
      const { type, count, size, descriptions } = category || {}
      if (!IMAGE_TYPES.has(type)) continue
      const countValue = Math.max(0, Math.min(Number(count) || 0, 10))
      
      console.log(`\n=== Generating ${type} images ===`)
      
      const sizeStr = parseSize(Number(size), type)
      
      console.log(`Size: ${sizeStr}`)
      console.log(`Count: ${countValue}`)
      console.log(`Descriptions: ${JSON.stringify(descriptions)}`)
      
      const images = []
      
      for (let i = 0; i < countValue; i++) {
        const description = Array.isArray(descriptions) ? descriptions?.[i] || '' : ''
        const prompt = generateAmazonPrompt(productInfo, type, description, styleProfile, typographyVariant)
        
        console.log(`Generating image ${i + 1} of ${countValue} for ${type}`)
        console.log(`Prompt: ${prompt}`)
        
        generatedPrompts.push({
          type,
          index: i,
          prompt,
          description
        })
        
        const url = await generateSingleImage(prompt, ossUrls, sizeStr)
        
        if (url) {
          const timestamp = Date.now()
          const filename = `amazon_${type}_${timestamp}_${i}.png`
          
          console.log('Downloading and saving:', filename)
          const localPath = await downloadAndSaveImage(url, filename)
          console.log('Saved to:', localPath)
          
          images.push({
            id: `${type}_${timestamp}_${i}`,
            url: `/generated/${filename}`,
            localPath,
            timestamp,
            prompt,
            description
          })
        }
      }
      
      generatedImages.push({ type, images })
    }

    console.log('\n=== Generation complete ===')
    console.log('Generated images:', generatedImages.map(g => ({ type: g.type, count: g.images.length })))
    
    res.json({
      success: true,
      generatedImages,
      generatedPrompts,
      message: 'Images generated successfully'
    })
    
  } catch (error) {
    console.error('Generation error:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  } finally {
    for (const file of files) {
      try {
        fs.unlinkSync(file.path)
      } catch {}
    }
    for (const filePath of tempFiles) {
      try {
        fs.unlinkSync(filePath)
      } catch {}
    }
  }
})

app.use('/generated', express.static(GENERATED_DIR))

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Generated images will be saved to: ${GENERATED_DIR}`)
})
