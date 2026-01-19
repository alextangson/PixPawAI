/**
 * Test Lab - Enhanced with AI Generation
 * 
 * Features:
 * - Tab 1: Setup (Upload, Style, Prompt)
 * - Tab 2: Analysis (Qwen Results)
 * - Tab 3: Prompt Flow (Parser, Cleaner, Builder)
 * - Tab 4: Generate (Parameters, A/B Test, Results)
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, Loader2, Code, Download, Image as ImageIcon, Sparkles, Settings, ChevronRight, AlertCircle } from 'lucide-react'
import { STYLES, type Style } from '@/lib/styles'
import { useStyles } from '@/lib/hooks/use-styles'
import { getStyleTierConfig, getDefaultTierConfig, type StyleTierConfig } from '@/lib/style-tiers'
import { parseUserPrompt, parseQwenFeatures, parseStylePrompt } from '@/lib/prompt-system/parser'
import { cleanConflicts, sortFeatures } from '@/lib/prompt-system/conflict-cleaner'
import { buildPrompt, buildPromptFromSources } from '@/lib/prompt-system/prompt-builder'
import { ParsedFeature, PromptConflict, MergedPrompt } from '@/lib/prompt-system/types'

interface QwenResult {
  hasPet: boolean
  petType: string
  quality: string
  issues: string[]
  hasHeterochromia: boolean
  heterochromiaDetails: string
  breed: string
  complexPattern: boolean
  patternDetails: string
  multiplePets: number
  detectedColors: string
  keyFeatures?: string
}

interface GeneratedImage {
  id: string
  imageUrl: string
  params: {
    strength: number
    guidance: number
    aspectRatio: string
  }
  generatedAt: Date
  timeTaken: number
}

type TabType = 'setup' | 'analysis' | 'prompt' | 'generate'

export default function TestLabPage() {
  // Tab control
  const [activeTab, setActiveTab] = useState<TabType>('setup')
  
  // Fetch styles from database
  const { styles: availableStyles, loading: loadingStyles } = useStyles()
  
  // Setup tab state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [testPrompt, setTestPrompt] = useState<string>('')
  const [aspectRatio, setAspectRatio] = useState<string>('1:1')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Analysis tab state
  const [qwenResult, setQwenResult] = useState<QwenResult | null>(null)
  
  // Prompt Flow tab state
  const [parsedFeatures, setParsedFeatures] = useState<ParsedFeature[]>([])
  const [cleanedFeatures, setCleanedFeatures] = useState<ParsedFeature[]>([])
  const [conflicts, setConflicts] = useState<PromptConflict[]>([])
  const [finalPrompt, setFinalPrompt] = useState<MergedPrompt | null>(null)
  
  // Generate tab state
  const [genParams, setGenParams] = useState({
    strength: 0.45,
    guidance: 2.5,
    aspectRatio: '1:1'
  })
  const [abTestMode, setAbTestMode] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<string[]>(['default'])
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  const [tierConfig, setTierConfig] = useState<StyleTierConfig>(getDefaultTierConfig())
  
  // Auto-select first style when styles are loaded
  useEffect(() => {
    if (!loadingStyles && availableStyles.length > 0 && !selectedStyle) {
      setSelectedStyle(availableStyles[0].id)
    }
  }, [loadingStyles, availableStyles, selectedStyle])
  
  // Update generation params and tier config when style changes
  useEffect(() => {
    async function loadTierConfig() {
      if (!selectedStyle) return
      
      // Try to fetch tier config from database first
      try {
        const res = await fetch(`/api/admin/styles/${selectedStyle}`)
        if (res.ok) {
          const { style } = await res.json()
          if (style && style.tier) {
            // Use database config
            const dbTierConfig: StyleTierConfig = {
              tier: style.tier,
              strength: style.recommended_strength_min || 0.35,
              guidance: style.recommended_guidance || 2.5,
              description: getTierDescription(style.tier),
              expectedSimilarity: style.expected_similarity || '70-80%',
              numVariants: { free: 1, starter: 1, pro: 3, master: 5 }
            }
            setTierConfig(dbTierConfig)
            setGenParams(prev => ({
              ...prev,
              strength: dbTierConfig.strength,
              guidance: dbTierConfig.guidance
            }))
            return
          }
        }
      } catch (err) {
        console.error('Failed to load tier config from database:', err)
      }
      
      // Fallback to hardcoded config
      const fallbackConfig = getStyleTierConfig(selectedStyle) || getDefaultTierConfig()
      setTierConfig(fallbackConfig)
      setGenParams(prev => ({
        ...prev,
        strength: fallbackConfig.strength,
        guidance: fallbackConfig.guidance
      }))
    }
    
    loadTierConfig()
  }, [selectedStyle])
  
  function getTierDescription(tier: number): string {
    switch (tier) {
      case 1: return '写实增强'
      case 2: return '轻艺术'
      case 3: return '强艺术'
      case 4: return '极致艺术'
      default: return '默认配置'
    }
  }
  
  // Auto-run prompt flow when moving to prompt tab
  useEffect(() => {
    if (activeTab === 'prompt' && qwenResult && !finalPrompt) {
      handleBuildPromptFlow()
    }
  }, [activeTab])
  
  // Upload and analyze image
  async function handleImageUpload(file: File) {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file)) // For preview only
    setQwenResult(null)
    setError('')
    setIsAnalyzing(true)
    
    try {
      // Upload to temp storage to get public URL
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await fetch('/api/upload-temp', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image')
      }
      
      const { imageUrl } = await uploadResponse.json()
      console.log('✅ Image uploaded to temp storage:', imageUrl)
      
      // Update preview with public URL
      setImagePreview(imageUrl)
      
      // Analyze using public URL
      await analyzeImage(file, imageUrl)
    } catch (error: any) {
      console.error('❌ Upload failed:', error)
      setError('Failed to upload image: ' + error.message)
      setIsAnalyzing(false)
    }
  }
  
  async function analyzeImage(file: File, imageUrl: string) {
    try {
      const analyzeRes = await fetch('/api/check-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })
      
      if (!analyzeRes.ok) {
        const analyzeError = await analyzeRes.json().catch(() => ({}))
        throw new Error(analyzeError.error || 'Analysis failed')
      }
      
      const result = await analyzeRes.json()
      setQwenResult(result)
      console.log('✅ Image analyzed:', result)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
      console.error('❌ Analysis error:', err)
      throw err
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  // Build complete prompt flow
  async function handleBuildPromptFlow() {
    try {
      // Try to get style from database first, fallback to hardcoded
      let style = availableStyles.find(s => s.id === selectedStyle)
      if (!style) {
        style = STYLES.find(s => s.id === selectedStyle)
      }
      
      // Try to fetch negative_prompt from database
      let negativePrompt = ''
      try {
        const res = await fetch(`/api/admin/styles/${selectedStyle}`)
        if (res.ok) {
          const { style: dbStyle } = await res.json()
          if (dbStyle?.negative_prompt) {
            negativePrompt = dbStyle.negative_prompt
          }
        }
      } catch (err) {
        console.error('Failed to load negative prompt:', err)
      }
      
      const { prompt, debug } = await buildPromptFromSources({
        userPrompt: testPrompt || undefined,
        qwenResult: qwenResult || undefined,
        stylePromptSuffix: style?.promptSuffix,
        negativePrompt: negativePrompt || undefined
      })
      
      setParsedFeatures(debug.parsedFeatures)
      setCleanedFeatures(debug.cleanedFeatures)
      setFinalPrompt(prompt)
      
      console.log('✅ Prompt Flow Built:', {
        styleId: selectedStyle,
        hasStylePrompt: !!style?.promptSuffix,
        hasNegativePrompt: !!negativePrompt,
        totalFeatures: debug.parsedFeatures.length,
        prompt
      })
    } catch (error: any) {
      console.error('Prompt flow error:', error)
      alert(`Failed to build prompt: ${error.message}`)
    }
  }
  
  // Generate images
  async function handleGenerate() {
    if (!imagePreview || !finalPrompt) {
      alert('Please complete setup and prompt flow first')
      return
    }
    
    setIsGenerating(true)
    setGeneratedImages([])
    
    const variantsToGenerate = calculateVariants()
    setGenerationProgress({ current: 0, total: variantsToGenerate.length })
    
    for (let i = 0; i < variantsToGenerate.length; i++) {
      const params = variantsToGenerate[i]
      const startTime = Date.now()
      
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: imagePreview,
            style: selectedStyle,
            prompt: testPrompt || '',
            petType: qwenResult?.petType || 'pet',
            aspectRatio: params.aspectRatio,
            strength: params.strength,
            guidance: params.guidance,
            testMode: true
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error,
            message: errorData.message,
            fullError: errorData
          })
          throw new Error(errorData.message || errorData.error || 'Generation failed')
        }
        
        const data = await response.json()
        const timeTaken = Math.round((Date.now() - startTime) / 1000)
        
        setGeneratedImages(prev => [...prev, {
          id: crypto.randomUUID(),
          imageUrl: data.outputUrl,
          params,
          generatedAt: new Date(),
          timeTaken
        }])
        
        setGenerationProgress(prev => ({ ...prev, current: prev.current + 1 }))
      } catch (error: any) {
        console.error('Generation error:', error)
        alert(`Variant ${i + 1} failed: ${error.message}`)
      }
    }
    
    setIsGenerating(false)
  }
  
  function calculateVariants() {
    if (!abTestMode) {
      return [genParams]
    }
    
    const variants: typeof genParams[] = []
    
    if (selectedVariants.includes('default')) {
      variants.push(genParams)
    }
    if (selectedVariants.includes('lower_strength')) {
      variants.push({ ...genParams, strength: genParams.strength - 0.05 })
    }
    if (selectedVariants.includes('higher_strength')) {
      variants.push({ ...genParams, strength: genParams.strength + 0.05 })
    }
    if (selectedVariants.includes('lower_guidance')) {
      variants.push({ ...genParams, guidance: genParams.guidance - 0.5 })
    }
    
    return variants
  }
  
  function toggleVariant(variant: string) {
    setSelectedVariants(prev => 
      prev.includes(variant) 
        ? prev.filter(v => v !== variant)
        : [...prev, variant]
    )
  }
  
  function downloadImage(imageUrl: string) {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `test-generation-${Date.now()}.png`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }
  
  const canProceedToAnalysis = qwenResult !== null
  const canProceedToPrompt = canProceedToAnalysis && finalPrompt !== null
  const canProceedToGenerate = canProceedToPrompt
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Test Lab - AI Generation</h1>
        <p className="text-gray-600">
          Test prompt optimization and AI generation with parameter tuning
        </p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'setup'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          1. Setup
        </button>
        <button
          onClick={() => canProceedToAnalysis && setActiveTab('analysis')}
          disabled={!canProceedToAnalysis}
          className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'analysis'
              ? 'border-blue-600 text-blue-600'
              : canProceedToAnalysis
              ? 'border-transparent text-gray-600 hover:text-gray-900'
              : 'border-transparent text-gray-400 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          2. Analysis
        </button>
        <button
          onClick={() => canProceedToPrompt && setActiveTab('prompt')}
          disabled={!canProceedToPrompt}
          className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'prompt'
              ? 'border-blue-600 text-blue-600'
              : canProceedToPrompt
              ? 'border-transparent text-gray-600 hover:text-gray-900'
              : 'border-transparent text-gray-400 cursor-not-allowed'
          }`}
        >
          <Code className="w-4 h-4" />
          3. Prompt Flow
        </button>
        <button
          onClick={() => canProceedToGenerate && setActiveTab('generate')}
          disabled={!canProceedToGenerate}
          className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'generate'
              ? 'border-blue-600 text-blue-600'
              : canProceedToGenerate
              ? 'border-transparent text-gray-600 hover:text-gray-900'
              : 'border-transparent text-gray-400 cursor-not-allowed'
          }`}
        >
          <Settings className="w-4 h-4" />
          4. Generate
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="min-h-[600px]">
        {/* TAB 1: Setup */}
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Test Image</h2>
              
              {!imagePreview ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Click or drag image to upload</p>
                  <p className="text-sm text-gray-400">JPG, PNG, WebP (max 10MB)</p>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="max-w-md rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setImagePreview('')
                        setImageFile(null)
                        setQwenResult(null)
                        setFinalPrompt(null)
                        setGeneratedImages([])
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
              
              {isAnalyzing && (
                <div className="mt-4 flex items-center gap-2 text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with Qwen AI...</span>
                </div>
              )}
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Error</div>
                    <div className="text-sm">{error}</div>
                  </div>
                </div>
              )}
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Select Style</h2>
              {loadingStyles ? (
                <div className="p-3 text-center text-gray-500">
                  Loading styles...
                </div>
              ) : availableStyles.length === 0 ? (
                <div className="p-3 text-center text-red-500">
                  No styles available. Please create styles in the Styles Management page.
                </div>
              ) : (
                <>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    {availableStyles.map((style) => (
                      <option key={style.id} value={style.id}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 text-xs text-green-600">
                    ✅ Loaded {availableStyles.length} style(s) from database
                  </div>
                </>
              )}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                <div className="font-medium text-blue-900 mb-1">Style Info</div>
                <div className="text-blue-700 space-y-1">
                  <div>Tier: {tierConfig.tier} ({tierConfig.description})</div>
                  <div>Default Strength: {tierConfig.strength.toFixed(2)}</div>
                  <div>Default Guidance: {tierConfig.guidance.toFixed(1)}</div>
                  <div>Expected Similarity: {tierConfig.expectedSimilarity}</div>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Custom Prompt (Optional)</h2>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Add custom enhancements like 'wearing sunglasses, at the beach'..."
                className="w-full h-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </Card>
            
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Aspect Ratio</h2>
              <div className="grid grid-cols-5 gap-3">
                {['1:1', '3:4', '4:3', '16:9', '9:16'].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`p-4 border-2 rounded-lg font-medium transition-colors ${
                      aspectRatio === ratio
                        ? 'border-blue-600 bg-blue-50 text-blue-600'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </Card>
            
            {qwenResult && (
              <div className="flex justify-end">
                <Button
                  onClick={() => setActiveTab('analysis')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next: View Analysis
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* TAB 2: Analysis */}
        {activeTab === 'analysis' && qwenResult && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Qwen AI Analysis Results</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Pet Type</div>
                  <div className="text-2xl font-bold text-green-900">{qwenResult.petType}</div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Quality</div>
                  <div className={`text-2xl font-bold ${
                    qwenResult.quality === 'good' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {qwenResult.quality}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold mb-3">Detected Features</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>Breed:</strong> {qwenResult.breed || 'Unknown'}
                  </div>
                  <div>
                    <strong>Colors:</strong> {qwenResult.detectedColors || 'Unknown'}
                  </div>
                  <div>
                    <strong>Heterochromia:</strong> {
                      qwenResult.hasHeterochromia 
                        ? `Yes (${qwenResult.heterochromiaDetails})` 
                        : 'No'
                    }
                  </div>
                  <div>
                    <strong>Complex Pattern:</strong> {
                      qwenResult.complexPattern 
                        ? `Yes (${qwenResult.patternDetails})` 
                        : 'No'
                    }
                  </div>
                  <div>
                    <strong>Multiple Pets:</strong> {qwenResult.multiplePets}
                  </div>
                  {qwenResult.keyFeatures && (
                    <div className="col-span-2">
                      <strong>Key Features:</strong> {qwenResult.keyFeatures}
                    </div>
                  )}
                </div>
              </div>
              
              <details className="mt-4 p-4 bg-gray-50 rounded-lg">
                <summary className="cursor-pointer font-medium text-sm text-gray-700">
                  View Raw JSON Data
                </summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {JSON.stringify(qwenResult, null, 2)}
                </pre>
              </details>
            </Card>
            
            <div className="flex justify-between">
              <Button
                onClick={() => setActiveTab('setup')}
                variant="outline"
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  handleBuildPromptFlow()
                  setActiveTab('prompt')
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next: Build Prompts
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
        
        {/* TAB 3: Prompt Flow */}
        {activeTab === 'prompt' && (
          <div className="space-y-6">
            {!finalPrompt && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Building prompt flow...</span>
              </div>
            )}
            
            {finalPrompt && (
              <>
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Step 1: Parsed Features</h2>
                  <div className="text-sm text-gray-600 mb-4">
                    Total: {parsedFeatures.length} features from all sources
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {parsedFeatures.map((feature, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-white rounded border-l-4"
                        style={{
                          borderLeftColor: 
                            feature.source === 'user' ? '#3b82f6' :
                            feature.source === 'qwen' ? '#10b981' :
                            feature.source === 'style' ? '#f59e0b' : '#6b7280'
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{feature.type}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              feature.source === 'user' ? 'bg-blue-100 text-blue-700' :
                              feature.source === 'qwen' ? 'bg-green-100 text-green-700' :
                              feature.source === 'style' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {feature.source}
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                              Priority: {feature.priority}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">{feature.normalized}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Step 2: Cleaned Features</h2>
                  <div className="text-sm text-gray-600 mb-4">
                    After conflict resolution: {cleanedFeatures.length} features
                    {conflicts.length > 0 && ` (${conflicts.length} conflicts resolved)`}
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {cleanedFeatures.map((feature, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-white rounded border-l-4"
                        style={{
                          borderLeftColor: 
                            feature.source === 'user' ? '#3b82f6' :
                            feature.source === 'qwen' ? '#10b981' :
                            feature.source === 'style' ? '#f59e0b' : '#6b7280'
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{feature.type}</span>
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                            {feature.priority}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mt-1">{feature.normalized}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Step 3: Final Prompts</h2>
                  
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border-2 border-green-300">
                    <h4 className="font-semibold mb-2 text-sm text-green-700">
                      Positive Prompt:
                    </h4>
                    <div className="text-sm text-gray-800 leading-relaxed">
                      {finalPrompt.positive}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Length: {finalPrompt.positive.length} characters
                    </div>
                  </div>
                  
                  <div className="mb-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
                    <h4 className="font-semibold mb-2 text-sm text-red-700">
                      Negative Prompt:
                    </h4>
                    <div className="text-sm text-gray-800">
                      {finalPrompt.negative}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold mb-2 text-sm">Metadata:</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">User Features:</span>
                        <span className="ml-2 font-semibold text-blue-600">
                          {finalPrompt.metadata.userFeaturesCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Qwen Features:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {finalPrompt.metadata.qwenFeaturesCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Style Features:</span>
                        <span className="ml-2 font-semibold text-yellow-600">
                          {finalPrompt.metadata.styleFeaturesCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Conflicts Resolved:</span>
                        <span className="ml-2 font-semibold text-red-600">
                          {finalPrompt.metadata.conflictsResolved}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <div className="flex justify-between">
                  <Button
                    onClick={() => setActiveTab('analysis')}
                    variant="outline"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setActiveTab('generate')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next: Generate Images
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* TAB 4: Generate */}
        {activeTab === 'generate' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left: Parameters */}
            <div className="col-span-1 space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Generation Parameters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="flex justify-between text-sm font-medium mb-2">
                      <span>Strength</span>
                      <span className="text-blue-600">{genParams.strength.toFixed(2)}</span>
                    </label>
                    <input 
                      type="range" 
                      min={Math.max(0.25, tierConfig.strength - 0.10)} 
                      max={Math.min(0.80, tierConfig.strength + 0.10)} 
                      step={0.01}
                      value={genParams.strength}
                      onChange={(e) => setGenParams({...genParams, strength: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{(tierConfig.strength - 0.10).toFixed(2)}</span>
                      <span className="font-medium">{tierConfig.strength.toFixed(2)}</span>
                      <span>{(tierConfig.strength + 0.10).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="flex justify-between text-sm font-medium mb-2">
                      <span>Guidance</span>
                      <span className="text-blue-600">{genParams.guidance.toFixed(1)}</span>
                    </label>
                    <input 
                      type="range" 
                      min={Math.max(1.5, tierConfig.guidance - 1.0)} 
                      max={Math.min(4.0, tierConfig.guidance + 1.0)} 
                      step={0.1}
                      value={genParams.guidance}
                      onChange={(e) => setGenParams({...genParams, guidance: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{(tierConfig.guidance - 1.0).toFixed(1)}</span>
                      <span className="font-medium">{tierConfig.guidance.toFixed(1)}</span>
                      <span>{(tierConfig.guidance + 1.0).toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Aspect Ratio</label>
                    <div className="text-lg font-semibold text-blue-600">{aspectRatio}</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">A/B Test Mode</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={abTestMode}
                      onChange={(e) => setAbTestMode(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {abTestMode && (
                  <div className="space-y-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedVariants.includes('default')}
                        onChange={() => toggleVariant('default')}
                        className="mr-2"
                      />
                      <span>Default (str={genParams.strength.toFixed(2)})</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedVariants.includes('lower_strength')}
                        onChange={() => toggleVariant('lower_strength')}
                        className="mr-2"
                      />
                      <span>Lower Strength (-0.05)</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedVariants.includes('higher_strength')}
                        onChange={() => toggleVariant('higher_strength')}
                        className="mr-2"
                      />
                      <span>Higher Strength (+0.05)</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={selectedVariants.includes('lower_guidance')}
                        onChange={() => toggleVariant('lower_guidance')}
                        className="mr-2"
                      />
                      <span>Lower Guidance (-0.5)</span>
                    </label>
                  </div>
                )}
              </Card>
              
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating {generationProgress.current}/{generationProgress.total}...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate {abTestMode ? `${selectedVariants.length} Variants` : 'Image'}
                  </>
                )}
              </Button>
            </div>
            
            {/* Right: Results */}
            <div className="col-span-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Generated Results</h3>
                
                {generatedImages.length === 0 && !isGenerating && (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No images generated yet</p>
                    <p className="text-sm">Configure parameters and click Generate</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {generatedImages.map((img) => (
                    <Card key={img.id} className="p-4 bg-gray-50">
                      <div className="relative group">
                        <img 
                          src={img.imageUrl} 
                          alt="Generated" 
                          className="w-full h-auto rounded-lg cursor-pointer"
                        />
                        <Button 
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                          size="sm"
                          onClick={() => downloadImage(img.imageUrl)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Strength:</span>
                          <span className="font-semibold">{img.params.strength.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Guidance:</span>
                          <span className="font-semibold">{img.params.guidance.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time:</span>
                          <span className="font-semibold">{img.timeTaken}s</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
      
      {/* Legend */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>User Input</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Qwen Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Style Template</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
