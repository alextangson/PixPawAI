/**
 * Test Lab - AI Generation Testing Tool
 * 
 * Two-column layout:
 * - Left: Configuration panel (upload, style, params, generate)
 * - Right: Preview panel (image, analysis, prompt, results)
 * 
 * Auto-flow: Upload → Auto-analyze → Select style → Auto-build prompt
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Upload, 
  Loader2, 
  Image as ImageIcon, 
  Sparkles, 
  AlertCircle,
  Edit,
  Sliders,
  FlaskConical,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Star,
  Plus,
  Save,
  Info,
  Trash2
} from 'lucide-react'
import { useStyles } from '@/lib/hooks/use-styles'
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
    tier?: number
  }
  generatedAt: Date
  timeTaken: number
  rating?: number
  isBest?: boolean
}

interface TestSession {
  id: string
  styleId: string
  styleName: string
  testDate: string
  sourceImage: string
  result: GeneratedImage
  qwenAnalysis: QwenResult | null
}

export default function TestLabPage() {
  // Fetch styles from database
  const { styles: availableStyles, loading: loadingStyles } = useStyles()
  
  // Core state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [workMode, setWorkMode] = useState<'create' | 'optimize'>('create')
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [styleName, setStyleName] = useState<string>('')
  const [promptSuffix, setPromptSuffix] = useState<string>('')
  const [negativePrompt, setNegativePrompt] = useState<string>('')
  const [testPrompt, setTestPrompt] = useState<string>('')
  const [aspectRatio, setAspectRatio] = useState<string>('1:1')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Analysis state
  const [qwenResult, setQwenResult] = useState<QwenResult | null>(null)
  const [finalPrompt, setFinalPrompt] = useState<MergedPrompt | null>(null)
  const [promptDebugInfo, setPromptDebugInfo] = useState<any>(null)
  
  // Generation state
  const [genParams, setGenParams] = useState({
    strength: 0.45,
    guidance: 2.5,
    aspectRatio: '1:1'
  })
  const [abTestMode, setAbTestMode] = useState(false)
  const [abTestStrengthDelta, setAbTestStrengthDelta] = useState<number>(0)
  const [abTestGuidanceDelta, setAbTestGuidanceDelta] = useState<number>(0)
  const [abTestAspectRatios, setAbTestAspectRatios] = useState<string[]>([])
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0 })
  
  // Collapsible sections state
  const [showCustomPrompt, setShowCustomPrompt] = useState(false)
  const [showABTest, setShowABTest] = useState(false)
  const [showPromptPreview, setShowPromptPreview] = useState(true) // 默认展开，方便调试
  
  // Test History state
  const [testHistory, setTestHistory] = useState<TestSession[]>([])
  const [showHistory, setShowHistory] = useState(false)
  
  // Image Modal state
  const [selectedImageModal, setSelectedImageModal] = useState<GeneratedImage | null>(null)
  
  // API Request Log state
  const [lastApiRequest, setLastApiRequest] = useState<any>(null)
  
  // Original style data for Optimize mode
  const [originalStyleData, setOriginalStyleData] = useState<any>(null)
  
  // Auto-select first style when styles are loaded
  useEffect(() => {
    if (!loadingStyles && availableStyles.length > 0 && !selectedStyle) {
      setSelectedStyle(availableStyles[0].id)
    }
  }, [loadingStyles, availableStyles, selectedStyle])
  
  // Load test history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('testlab_history')
      if (saved) {
        const history = JSON.parse(saved)
        setTestHistory(history.sessions || [])
      }
    } catch (error) {
      console.error('Failed to load test history:', error)
    }
  }, [])
  
  // Auto-build prompt when prompts or Qwen result changes
  useEffect(() => {
    if (qwenResult && imagePreview) {
      handleBuildPromptFlow()
    }
  }, [promptSuffix, negativePrompt, qwenResult, workMode, originalStyleData])
  
  // Update generation params when style changes (for Optimize mode)
  useEffect(() => {
    if (!selectedStyle || availableStyles.length === 0 || workMode !== 'optimize') return
    
    const fetchStyleConfig = async () => {
      try {
        const response = await fetch(`/api/admin/styles/${selectedStyle}`)
        if (!response.ok) {
          console.error('Failed to fetch style config')
          return
        }
        
        const styleData = await response.json()
        
        setGenParams({
          strength: styleData.recommended_strength_min || 0.45,
          guidance: styleData.recommended_guidance || 2.5,
          aspectRatio: aspectRatio
        })
      } catch (error) {
        console.error('Error fetching style config:', error)
      }
    }
    
    fetchStyleConfig()
  }, [selectedStyle, availableStyles, workMode])
  
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
  
  // Build prompt flow
  async function handleBuildPromptFlow() {
    if (!qwenResult) {
      console.error('Missing Qwen result')
      return
    }
    
    try {
      // 在 Optimize 模式下，如果输入框为空，使用原始风格数据
      const effectivePromptSuffix = workMode === 'optimize' && !promptSuffix && originalStyleData 
        ? originalStyleData.prompt_suffix 
        : promptSuffix
      const effectiveNegativePrompt = workMode === 'optimize' && !negativePrompt && originalStyleData 
        ? originalStyleData.negative_prompt 
        : negativePrompt
      
      const { prompt, debug } = await buildPromptFromSources({
        userPrompt: testPrompt || '',
        qwenResult: qwenResult,
        stylePromptSuffix: effectivePromptSuffix,
        negativePrompt: effectiveNegativePrompt
      })
      
      setFinalPrompt(prompt)
      setPromptDebugInfo(debug)
      
      console.log('✅ Prompt Flow Built:', {
        hasStylePrompt: !!effectivePromptSuffix,
        hasNegativePrompt: !!effectiveNegativePrompt,
        finalPrompt: prompt,
        debug: debug
      })
    } catch (error) {
      console.error('❌ Prompt build error:', error)
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
        // 在 Optimize 模式下，如果输入框为空，使用原始风格数据
        const effectivePromptSuffix = workMode === 'optimize' && !promptSuffix && originalStyleData 
          ? originalStyleData.prompt_suffix 
          : promptSuffix
        const effectiveNegativePrompt = workMode === 'optimize' && !negativePrompt && originalStyleData 
          ? originalStyleData.negative_prompt 
          : negativePrompt
        
        // 构建 API 请求体
        const apiRequestBody = {
          imageUrl: imagePreview,
          // In "optimize" mode, pass existing style ID
          // In "create" mode, don't pass style (will use promptSuffix/negativePrompt directly)
          ...(workMode === 'optimize' && selectedStyle ? { style: selectedStyle } : {}),
          prompt: testPrompt || '',
          promptSuffix: effectivePromptSuffix || '',
          negativePrompt: effectiveNegativePrompt || '',
          petType: qwenResult?.petType || 'pet',
          // ✅ 传递完整的 Qwen 分析结果（避免第2次重复调用）
          detailedAnalysis: qwenResult ? {
            petType: qwenResult.petType,
            detectedColors: qwenResult.detectedColors || '',
            hasHeterochromia: qwenResult.hasHeterochromia || false,
            heterochromiaDetails: qwenResult.heterochromiaDetails || '',
            complexPattern: qwenResult.complexPattern || false,
            multiplePets: qwenResult.multiplePets || 1,
            breed: qwenResult.breed || 'unknown'
          } : undefined,
          aspectRatio: params.aspectRatio,
          strength: params.strength,
          guidance: params.guidance,
          testMode: true,
          // Pass style name for create mode (for logging/debugging)
          ...(workMode === 'create' && styleName ? { styleName: styleName } : {})
        }
        
        // 记录 API 请求用于调试
        setLastApiRequest(apiRequestBody)
        
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiRequestBody)
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
        
        const generatedImage: GeneratedImage = {
          id: crypto.randomUUID(),
          imageUrl: data.outputUrl,
          params: {
            ...params
          },
          generatedAt: new Date(),
          timeTaken
        }
        
        setGeneratedImages(prev => [...prev, generatedImage])
        
        // Save to history
        saveTestResult(generatedImage)
        
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
      return [{
        strength: genParams.strength,
        guidance: genParams.guidance,
        aspectRatio: genParams.aspectRatio
      }]
    }
    
    const variants: any[] = []
    const baseVariant = {
      strength: genParams.strength,
      guidance: genParams.guidance,
      aspectRatio: genParams.aspectRatio
    }
    
    // Always include base variant
    variants.push(baseVariant)
    
    // Strength variants
    if (abTestStrengthDelta > 0) {
      variants.push({
        ...baseVariant,
        strength: Math.max(0.15, genParams.strength - abTestStrengthDelta)
      })
      variants.push({
        ...baseVariant,
        strength: Math.min(0.95, genParams.strength + abTestStrengthDelta)
      })
    }
    
    // Guidance variants
    if (abTestGuidanceDelta > 0) {
      variants.push({
        ...baseVariant,
        guidance: Math.max(1.0, genParams.guidance - abTestGuidanceDelta)
      })
      variants.push({
        ...baseVariant,
        guidance: Math.min(5.0, genParams.guidance + abTestGuidanceDelta)
      })
    }
    
    // Aspect ratio variants
    if (abTestAspectRatios.length > 0) {
      abTestAspectRatios.forEach(ratio => {
        if (ratio !== genParams.aspectRatio) {
          variants.push({
            ...baseVariant,
            aspectRatio: ratio
          })
        }
      })
    }
    
    return variants
  }
  
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }
  
  // Save test result to history
  function saveTestResult(result: GeneratedImage) {
    const session: TestSession = {
      id: crypto.randomUUID(),
      styleId: selectedStyle,
      styleName: availableStyles.find(s => s.id === selectedStyle)?.label || '',
      testDate: new Date().toISOString(),
      sourceImage: imagePreview,
      result: result,
      qwenAnalysis: qwenResult
    }
    
    const updatedHistory = [session, ...testHistory].slice(0, 50) // Keep last 50
    setTestHistory(updatedHistory)
    
    try {
      localStorage.setItem('testlab_history', JSON.stringify({ sessions: updatedHistory }))
    } catch (error) {
      console.error('Failed to save test history:', error)
    }
  }
  
  // Rate image
  function rateImage(imageId: string, rating: number) {
    setGeneratedImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, rating } : img
      )
    )
  }
  
  // Mark image as best
  function markAsBest(imageId: string) {
    setGeneratedImages(prev => 
      prev.map(img => ({
        ...img,
        isBest: img.id === imageId
      }))
    )
  }
  
  // Apply params to style
  async function applyToStyle(params: GeneratedImage['params']) {
    if (!selectedStyle) return
    
    const styleName = availableStyles.find(s => s.id === selectedStyle)?.label || selectedStyle
    
    const confirmed = confirm(
      `应用这些参数到风格 "${styleName}"?\n\n` +
      `Strength: ${params.strength.toFixed(2)}\n` +
      `Guidance: ${params.guidance.toFixed(1)}\n\n` +
      `这将更新数据库中的风格配置。`
    )
    
    if (!confirmed) return
    
    try {
      const response = await fetch(`/api/admin/styles/${selectedStyle}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommended_strength_min: params.strength - 0.05,
          recommended_strength_max: params.strength + 0.05,
          recommended_guidance: params.guidance
        })
      })
      
      if (response.ok) {
        alert('✅ Style parameters updated successfully!\n\n风格参数已成功更新！')
      } else {
        alert('❌ Failed to update style / 更新失败')
      }
    } catch (error) {
      console.error('Error applying to style:', error)
      alert('❌ Error updating style / 更新出错')
    }
  }
  
  // Load session from history
  function loadSession(session: TestSession) {
    setSelectedStyle(session.styleId)
    setGenParams({
      strength: session.result.params.strength,
      guidance: session.result.params.guidance,
      aspectRatio: session.result.params.aspectRatio
    })
  }
  
  // Delete single history entry
  const deleteHistoryEntry = (sessionId: string) => {
    const updatedHistory = testHistory.filter(s => s.id !== sessionId)
    setTestHistory(updatedHistory)
    
    try {
      localStorage.setItem('testlab_history', JSON.stringify({ sessions: updatedHistory }))
      console.log('🗑️ Deleted history entry:', sessionId)
    } catch (error) {
      console.error('Failed to update test history:', error)
    }
  }

  // Clear all history
  const clearAllHistory = () => {
    if (!confirm('⚠️ 确认删除所有测试历史？这个操作不可逆！\n\nConfirm delete all test history? This action cannot be undone!')) {
      return
    }
    
    setTestHistory([])
    
    try {
      localStorage.removeItem('testlab_history')
      console.log('🗑️ Cleared all test history')
      alert('✅ All test history cleared / 已清空所有测试历史')
    } catch (error) {
      console.error('Failed to clear test history:', error)
      alert('❌ Failed to clear history / 清空失败')
    }
  }

  // Delete old history (older than X days)
  const deleteOldHistory = (days: number) => {
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000)
    const updatedHistory = testHistory.filter(s => new Date(s.testDate).getTime() > cutoffTime)
    
    const deletedCount = testHistory.length - updatedHistory.length
    
    if (deletedCount === 0) {
      alert(`ℹ️ No history older than ${days} days / 没有超过 ${days} 天的历史`)
      return
    }
    
    if (!confirm(`⚠️ 将删除 ${deletedCount} 条超过 ${days} 天的历史记录，确认？\n\nDelete ${deletedCount} history entries older than ${days} days?`)) {
      return
    }
    
    setTestHistory(updatedHistory)
    
    try {
      localStorage.setItem('testlab_history', JSON.stringify({ sessions: updatedHistory }))
      console.log(`🗑️ Deleted ${deletedCount} old history entries (>${days} days)`)
      alert(`✅ Deleted ${deletedCount} entries / 已删除 ${deletedCount} 条记录`)
    } catch (error) {
      console.error('Failed to delete old history:', error)
    }
  }
  
  // Load style for optimization mode
  async function loadStyleForOptimization(styleId: string) {
    try {
      const response = await fetch(`/api/admin/styles/${styleId}`)
      if (!response.ok) return
      
      const { style: styleData } = await response.json()
      
      // 保存原始数据
      setOriginalStyleData(styleData)
      
      setStyleName(styleData.name || '')
      setPromptSuffix(styleData.prompt_suffix || '')
      setNegativePrompt(styleData.negative_prompt || '')
      setGenParams({
        strength: styleData.recommended_strength_min || 0.45,
        guidance: styleData.recommended_guidance || 2.5,
        aspectRatio: aspectRatio
      })
      
      console.log('✅ Loaded style for optimization:', {
        name: styleData.name,
        promptSuffix: styleData.prompt_suffix,
        negativePrompt: styleData.negative_prompt,
        strength: styleData.recommended_strength_min,
        guidance: styleData.recommended_guidance
      })
    } catch (error) {
      console.error('Failed to load style:', error)
    }
  }
  
  // Save as new style
  async function saveAsNewStyle() {
    if (!styleName.trim()) {
      alert('Please enter a style name / 请输入风格名称')
      return
    }
    
    const avgRating = generatedImages.filter(img => img.rating).reduce((sum, img) => sum + (img.rating || 0), 0) / generatedImages.filter(img => img.rating).length || 0
    
    if (avgRating < 3 && !confirm('Average rating is low. Continue anyway? / 平均评分较低，仍然继续？')) {
      return
    }
    
    const confirmMsg = `将创建新风格 "${styleName}":\n\n` +
      `Strength: ${genParams.strength.toFixed(2)}\n` +
      `Guidance: ${genParams.guidance.toFixed(1)}\n\n` +
      `继续创建？`
    
    if (!confirm(confirmMsg)) return
    
    try {
      const response = await fetch('/api/admin/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: styleName,
          prompt_suffix: promptSuffix,
          negative_prompt: negativePrompt,
          recommended_strength_min: genParams.strength - 0.05,
          recommended_strength_max: genParams.strength + 0.05,
          recommended_guidance: genParams.guidance,
          category: 'custom',
          is_enabled: true,
          is_premium: false
        })
      })
      
      if (response.ok) {
        alert(`✅ Style "${styleName}" created successfully!\n\n风格 "${styleName}" 创建成功！`)
        // Reset form
        setStyleName('')
        setPromptSuffix('')
        setNegativePrompt('')
      } else {
        alert('❌ Failed to create style / 创建风格失败')
      }
    } catch (error) {
      console.error('Error creating style:', error)
      alert('❌ Error creating style / 创建风格出错')
    }
  }
  
  // Calculate statistics
  function calculateStats() {
    const styleHistory = testHistory.filter(s => s.styleId === selectedStyle)
    if (styleHistory.length === 0) {
      return {
        totalTests: 0,
        avgRating: 0,
        bestParams: null
      }
    }
    
    const rated = styleHistory.filter(s => s.result.rating)
    const avgRating = rated.length > 0 
      ? rated.reduce((sum, s) => sum + (s.result.rating || 0), 0) / rated.length
      : 0
    
    const bestSession = styleHistory
      .filter(s => s.result.rating)
      .sort((a, b) => (b.result.rating || 0) - (a.result.rating || 0))[0]
    
    return {
      totalTests: styleHistory.length,
      avgRating,
      bestParams: bestSession ? bestSession.result.params : null
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Test Lab</h1>
          <p className="text-sm text-gray-600 mt-1">AI Generation Testing Tool / AI 生成测试工具</p>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT PANEL - Configuration */}
          <div className="space-y-4">
            
            {/* 1. Upload Test Image */}
            <Card className="p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Test Image / 上传测试图片
              </h2>
              
              {!imagePreview ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 text-sm mb-1">Click or drag image / 点击或拖拽上传</p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP (max 10MB)</p>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageUpload(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative inline-block">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-48 h-48 rounded-lg border object-cover"
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
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-blue-600 text-sm bg-blue-50 p-2 rounded">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing... / 分析中...</span>
                    </div>
                  )}
                </div>
              )}
              
              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}
            </Card>
            
            {/* 2. Work Mode & Style Configuration */}
            <Card className="p-4 border-2 border-purple-200">
              <h2 className="font-semibold mb-3">Style Configuration / 风格配置</h2>
              
              {/* Work Mode Toggle */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    setWorkMode('create')
                    setSelectedStyle('')
                    setOriginalStyleData(null)
                    setStyleName('')
                    setPromptSuffix('')
                    setNegativePrompt('')
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    workMode === 'create' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Create New / 创建新风格
                </button>
                <button
                  onClick={() => {
                    setWorkMode('optimize')
                    setStyleName('')
                    setPromptSuffix('')
                    setNegativePrompt('')
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    workMode === 'optimize' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Optimize / 优化现有
                </button>
              </div>
              
              {/* Create Mode */}
              {workMode === 'create' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Style Name / 风格名称
                    </label>
                    <input
                      type="text"
                      value={styleName}
                      onChange={(e) => setStyleName(e.target.value)}
                      placeholder="e.g., Pixar Christmas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Prompt Suffix / 风格提示词
                    </label>
                    <textarea
                      value={promptSuffix}
                      onChange={(e) => setPromptSuffix(e.target.value)}
                      placeholder="e.g., Pixar style, 3D render, vibrant colors, studio lighting"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Negative Prompt / 负面提示词
                    </label>
                    <textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="e.g., blurry, low quality, distorted, ugly"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Select Style to Optimize / 选择要优化的风格
                    </label>
                    {loadingStyles ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin" />
                        Loading... / 加载中...
                      </div>
                    ) : (
                      <select
                        value={selectedStyle}
                        onChange={(e) => {
                          setSelectedStyle(e.target.value)
                          loadStyleForOptimization(e.target.value)
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select a style --</option>
                        {availableStyles.map(style => (
                          <option key={style.id} value={style.id}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {selectedStyle && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Prompt Suffix / 风格提示词
                        </label>
                        <textarea
                          value={promptSuffix}
                          onChange={(e) => setPromptSuffix(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Negative Prompt / 负面提示词
                        </label>
                        <textarea
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
            
            {/* 3. Custom Prompt (Collapsible) */}
            <Card className="p-4">
              <button
                onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="font-semibold flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Custom Prompt (Optional) / 自定义提示词（可选）
                </h2>
                {showCustomPrompt ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {showCustomPrompt && (
                <div className="mt-3">
                  <textarea
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    placeholder="Add enhancements like 'wearing sunglasses, at the beach'... / 添加增强描述..."
                    className="w-full h-20 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              )}
            </Card>
            
            {/* 4. Generation Parameters */}
            <Card className="p-4 border-2 border-blue-200">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Generation Parameters / 生成参数
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Strength / 强度</label>
                      <div className="group relative">
                        <Info className="w-3 h-3 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          低值 (0.15-0.40): 更像原图，忠实还原<br/>
                          中值 (0.40-0.65): 平衡风格与相似度<br/>
                          高值 (0.65-0.95): 更艺术化，风格强烈
                        </div>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={genParams.strength.toFixed(2)}
                      onChange={(e) => setGenParams({...genParams, strength: parseFloat(e.target.value) || 0.45})}
                      className="w-16 px-2 py-1 text-sm font-bold text-blue-600 border border-gray-300 rounded text-center"
                      step="0.01"
                      min={0.15}
                      max={0.95}
                    />
                  </div>
                  <input 
                    type="range" 
                    min={0.15} 
                    max={0.95} 
                    step={0.01}
                    value={genParams.strength}
                    onChange={(e) => setGenParams({...genParams, strength: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs mt-2">
                    <div className="text-left">
                      <div className="font-mono text-gray-600">0.15</div>
                      <div className="text-gray-500">More Similar</div>
                      <div className="text-gray-400">更相似原图</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gray-600">0.95</div>
                      <div className="text-gray-500">More Creative</div>
                      <div className="text-gray-400">更艺术化</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Guidance / 引导度</label>
                      <div className="group relative">
                        <Info className="w-3 h-3 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-56 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          低值 (1.0-2.0): AI 创意空间大<br/>
                          中值 (2.0-3.5): 平衡控制与创意<br/>
                          高值 (3.5-5.0): 严格遵循提示词
                        </div>
                      </div>
                    </div>
                    <input
                      type="number"
                      value={genParams.guidance.toFixed(1)}
                      onChange={(e) => setGenParams({...genParams, guidance: parseFloat(e.target.value) || 2.5})}
                      className="w-16 px-2 py-1 text-sm font-bold text-blue-600 border border-gray-300 rounded text-center"
                      step="0.1"
                      min={1.0}
                      max={5.0}
                    />
                  </div>
                  <input 
                    type="range" 
                    min={1.0} 
                    max={5.0} 
                    step={0.1}
                    value={genParams.guidance}
                    onChange={(e) => setGenParams({...genParams, guidance: parseFloat(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs mt-2">
                    <div className="text-left">
                      <div className="font-mono text-gray-600">1.0</div>
                      <div className="text-gray-500">More Freedom</div>
                      <div className="text-gray-400">AI 创意空间大</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gray-600">5.0</div>
                      <div className="text-gray-500">More Control</div>
                      <div className="text-gray-400">严格遵循提示词</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Aspect Ratio / 画面比例</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => {
                      setAspectRatio(e.target.value)
                      setGenParams({...genParams, aspectRatio: e.target.value})
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="1:1">1:1 Square / 方形</option>
                    <option value="3:4">3:4 Portrait / 竖版</option>
                    <option value="4:3">4:3 Landscape / 横版</option>
                    <option value="16:9">16:9 Wide / 宽屏</option>
                    <option value="9:16">9:16 Tall / 高屏</option>
                  </select>
                </div>
              </div>
            </Card>
            
            {/* 5. A/B Test Mode (Collapsible) */}
            <Card className="p-4 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  <h2 className="font-semibold">A/B Test Mode / A/B 测试</h2>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={abTestMode}
                    onChange={(e) => {
                      setAbTestMode(e.target.checked)
                      if (!e.target.checked) {
                        setAbTestStrengthDelta(0)
                        setAbTestGuidanceDelta(0)
                        setAbTestAspectRatios([])
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              {abTestMode && (
                <div className="space-y-4 pt-3 border-t">
                  {/* Base Parameters Info */}
                  <div className="bg-blue-50 p-3 rounded text-xs">
                    <div className="font-medium text-blue-900 mb-1">Base Parameters / 基准参数</div>
                    <div className="text-blue-700">
                      Strength: {genParams.strength.toFixed(2)} | 
                      Guidance: {genParams.guidance.toFixed(1)} | 
                      Ratio: {genParams.aspectRatio}
                    </div>
                  </div>
                  
                  {/* Strength Variants */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Strength Variants / 强度变体
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setAbTestStrengthDelta(abTestStrengthDelta === 0.05 ? 0 : 0.05)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          abTestStrengthDelta === 0.05
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ±0.05
                      </button>
                      <button
                        onClick={() => setAbTestStrengthDelta(abTestStrengthDelta === 0.10 ? 0 : 0.10)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          abTestStrengthDelta === 0.10
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ±0.10
                      </button>
                      <button
                        onClick={() => setAbTestStrengthDelta(abTestStrengthDelta === 0.15 ? 0 : 0.15)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          abTestStrengthDelta === 0.15
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ±0.15
                      </button>
                    </div>
                    {abTestStrengthDelta > 0 && (
                      <div className="mt-2 text-xs text-gray-600 bg-purple-50 p-2 rounded">
                        Will generate: {(genParams.strength - abTestStrengthDelta).toFixed(2)}, {genParams.strength.toFixed(2)}, {(genParams.strength + abTestStrengthDelta).toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  {/* Guidance Variants */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Guidance Variants / 引导度变体
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setAbTestGuidanceDelta(abTestGuidanceDelta === 0.5 ? 0 : 0.5)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          abTestGuidanceDelta === 0.5
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ±0.5
                      </button>
                      <button
                        onClick={() => setAbTestGuidanceDelta(abTestGuidanceDelta === 1.0 ? 0 : 1.0)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          abTestGuidanceDelta === 1.0
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ±1.0
                      </button>
                      <button
                        onClick={() => setAbTestGuidanceDelta(abTestGuidanceDelta === 1.5 ? 0 : 1.5)}
                        className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                          abTestGuidanceDelta === 1.5
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ±1.5
                      </button>
                    </div>
                    {abTestGuidanceDelta > 0 && (
                      <div className="mt-2 text-xs text-gray-600 bg-purple-50 p-2 rounded">
                        Will generate: {(genParams.guidance - abTestGuidanceDelta).toFixed(1)}, {genParams.guidance.toFixed(1)}, {(genParams.guidance + abTestGuidanceDelta).toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  {/* Aspect Ratio Variants */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Additional Aspect Ratios / 额外比例
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['1:1', '3:4', '4:3', '16:9', '9:16'].map(ratio => (
                        <label key={ratio} className="flex items-center text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={abTestAspectRatios.includes(ratio)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAbTestAspectRatios([...abTestAspectRatios, ratio])
                              } else {
                                setAbTestAspectRatios(abTestAspectRatios.filter(r => r !== ratio))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className={ratio === genParams.aspectRatio ? 'font-bold text-blue-600' : ''}>
                            {ratio} {ratio === genParams.aspectRatio && '(Base / 基准)'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Total Count */}
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="text-sm font-medium text-green-900">
                      Total Images to Generate / 总计将生成:
                      <span className="text-lg font-bold ml-2">{calculateVariants().length}</span> images
                    </div>
                  </div>
                </div>
              )}
            </Card>
            
            {/* 6. Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !imagePreview || !finalPrompt}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating / 生成中 {generationProgress.current}/{generationProgress.total}
                  </>
                ) : (
                  <>
                    <FlaskConical className="w-5 h-5 mr-2" />
                    Generate & Test / 生成测试
                  </>
                )}
              </Button>
              
              {/* Save Button */}
              {generatedImages.length > 0 && workMode === 'create' && (
                <Button
                  onClick={saveAsNewStyle}
                  disabled={!styleName.trim()}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold disabled:bg-gray-300 disabled:text-gray-500"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as New Style / 保存为新风格
                </Button>
              )}
              
              {/* Update Button */}
              {generatedImages.length > 0 && workMode === 'optimize' && selectedStyle && (
                <Button
                  onClick={() => applyToStyle(generatedImages.find(img => img.isBest)?.params || generatedImages[0].params)}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Style / 更新风格
                </Button>
              )}
            </div>
            
          </div>
          
          {/* RIGHT PANEL - Preview */}
          <div className="space-y-4">
            
            {/* 1. Image Analysis */}
            <Card className="p-4">
              <h2 className="font-semibold mb-3">1. Image Analysis / 图片分析</h2>
              
              {!imagePreview ? (
                <div className="text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">↑ Upload image on the left</p>
                  <p className="text-xs text-gray-400 mt-1">请在左侧上传图片</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {isAnalyzing ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
                      <p className="text-sm text-gray-600">Analyzing with Qwen AI...</p>
                      <p className="text-xs text-gray-500">使用 Qwen AI 分析中...</p>
                    </div>
                  ) : qwenResult ? (
                    <div className="flex gap-3">
                      {/* 左侧：小图 */}
                      <div className="flex-shrink-0">
                        <img 
                          src={imagePreview} 
                          alt="Uploaded" 
                          className="w-32 h-32 rounded-lg border object-cover"
                        />
                      </div>
                      
                      {/* 右侧：分析结果 */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">Qwen Analysis / 分析结果</h3>
                          {(qwenResult.petType === 'unknown' || qwenResult.quality === 'poor') && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                              ⚠️ 识别不完整
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500 text-xs">Pet Type / 宠物类型</div>
                            <div className="font-medium">{qwenResult.petType || 'Unknown'}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500 text-xs">Breed / 品种</div>
                            <div className="font-medium">{qwenResult.breed || 'Unknown'}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500 text-xs">Quality / 质量</div>
                            <div className="font-medium">{qwenResult.quality}</div>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="text-gray-500 text-xs">Pets Count / 宠物数量</div>
                            <div className="font-medium">{qwenResult.multiplePets || 1}</div>
                          </div>
                        </div>
                        {qwenResult.detectedColors && (
                          <div className="bg-blue-50 p-2 rounded text-xs">
                            <div className="text-gray-600 text-xs mb-1">Colors / 颜色</div>
                            <div className="text-gray-900">{qwenResult.detectedColors}</div>
                          </div>
                        )}
                        {qwenResult.hasHeterochromia && (
                          <div className="bg-purple-50 p-2 rounded text-xs">
                            <div className="text-gray-600 text-xs mb-1">Heterochromia / 异瞳</div>
                            <div className="text-gray-900">{qwenResult.heterochromiaDetails}</div>
                          </div>
                        )}
                        
                        {/* 识别失败警告 */}
                        {(qwenResult.petType === 'unknown' || qwenResult.petType === 'none') && (
                          <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded text-xs">
                            <div className="font-bold text-orange-900 mb-1 flex items-center gap-1">
                              ⚠️ Qwen 识别失败
                            </div>
                            <div className="text-orange-800 space-y-1">
                              <p>可能原因：</p>
                              <ul className="list-disc list-inside text-xs space-y-0.5 ml-2">
                                <li>图片分辨率过低或模糊</li>
                                <li>宠物不清晰或被遮挡</li>
                                <li>API 调用或解析失败</li>
                              </ul>
                              <p className="mt-2 font-medium">💡 建议：</p>
                              <ul className="list-disc list-inside text-xs space-y-0.5 ml-2">
                                <li>查看浏览器控制台（F12）的错误日志</li>
                                <li>在 Custom Prompt 中手动添加特征</li>
                                <li>尝试重新上传更清晰的图片</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Waiting for analysis... / 等待分析...
                    </div>
                  )}
                </div>
              )}
            </Card>
            
            {/* 2. Style Configuration - 只在 Optimize Mode + 已选择风格时显示 */}
            {workMode === 'optimize' && selectedStyle && (
              <Card className="p-4">
                <h2 className="font-semibold mb-3">2. Style Configuration / 风格配置</h2>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-500 text-xs mb-1">Current Strength / 当前强度</div>
                    <div className="text-lg font-semibold text-blue-600">{genParams.strength.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-gray-500 text-xs mb-1">Current Guidance / 当前引导度</div>
                    <div className="text-lg font-semibold text-blue-600">{genParams.guidance.toFixed(1)}</div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* 3. Prompt Preview */}
            <Card className="p-4">
              <button
                onClick={() => setShowPromptPreview(!showPromptPreview)}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  3. Prompt Preview / 提示词预览
                </h2>
                {showPromptPreview ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {!finalPrompt ? (
                <div className="mt-3 text-center py-12 bg-gray-50 rounded border-2 border-dashed border-gray-300">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">Waiting for prompt to build</p>
                  <p className="text-xs text-gray-400 mt-1">等待提示词生成</p>
                </div>
              ) : showPromptPreview ? (
                <div className="mt-3 space-y-3">
                  {/* Positive Prompt with Highlighting */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-gray-500 font-medium">Positive Prompt / 正向提示词</div>
                      {finalPrompt.positive.toLowerCase().includes('heterochromia') && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">
                          ✓ 包含异瞳特征
                        </span>
                      )}
                    </div>
                    <div className="bg-green-50 p-3 rounded text-sm text-gray-800 max-h-48 overflow-y-auto font-mono leading-relaxed">
                      {finalPrompt.positive.split(',').map((part, idx) => {
                        const trimmed = part.trim()
                        const isHeterochromia = trimmed.toLowerCase().includes('heterochromia')
                        const isKeyFeature = trimmed.toLowerCase().includes('eye') || 
                                            trimmed.toLowerCase().includes('breed') ||
                                            trimmed.toLowerCase().includes('color')
                        
                        return (
                          <span key={idx}>
                            <span 
                              className={
                                isHeterochromia 
                                  ? 'bg-purple-200 text-purple-900 px-1 rounded font-bold' 
                                  : isKeyFeature 
                                    ? 'bg-yellow-100 text-yellow-900 px-1 rounded'
                                    : ''
                              }
                            >
                              {trimmed}
                            </span>
                            {idx < finalPrompt.positive.split(',').length - 1 && ', '}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Negative Prompt */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1 font-medium">Negative Prompt / 负向提示词</div>
                    <div className="bg-red-50 p-3 rounded text-sm text-gray-800 max-h-32 overflow-y-auto">
                      {finalPrompt.negative || '(empty / 空)'}
                    </div>
                  </div>
                  
                  {/* Debug Info: Feature Sources */}
                  {promptDebugInfo && (
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-2 flex-wrap">
                        <span>🔍 Debug: Feature Sources / 特征来源分析</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          Total: {promptDebugInfo.cleanedFeatures?.length || 0} features
                        </span>
                        {promptDebugInfo.conflictCount > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                            {promptDebugInfo.conflictCount} conflicts resolved
                          </span>
                        )}
                        {promptDebugInfo.cleanedFeatures?.filter((f: any) => f.source === 'qwen').length === 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                            ❌ Qwen 未识别任何特征！
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                          <div className="font-medium text-blue-900 mb-1">
                            👤 User Input
                          </div>
                          <div className="text-blue-700">
                            {promptDebugInfo.cleanedFeatures?.filter((f: any) => f.source === 'user').length || 0} features
                          </div>
                        </div>
                        
                        <div className="bg-purple-50 p-2 rounded border border-purple-200">
                          <div className="font-medium text-purple-900 mb-1">
                            🤖 Qwen AI
                          </div>
                          <div className="text-purple-700">
                            {promptDebugInfo.cleanedFeatures?.filter((f: any) => f.source === 'qwen').length || 0} features
                          </div>
                          {promptDebugInfo.cleanedFeatures?.filter((f: any) => 
                            f.source === 'qwen' && f.value?.toLowerCase().includes('heterochromia')
                          ).length > 0 && (
                            <div className="mt-1 text-xs bg-purple-200 text-purple-900 px-1 py-0.5 rounded">
                              ✓ 异瞳已识别
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                          <div className="font-medium text-green-900 mb-1">
                            🎨 Style Prompt
                          </div>
                          <div className="text-green-700">
                            {promptDebugInfo.cleanedFeatures?.filter((f: any) => f.source === 'style').length || 0} features
                          </div>
                        </div>
                      </div>
                      
                      {/* Detailed Feature List */}
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800 font-medium">
                          ▶ View All Features / 查看所有特征 ({promptDebugInfo.cleanedFeatures?.length || 0})
                        </summary>
                        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                          {promptDebugInfo.cleanedFeatures?.map((feature: any, idx: number) => (
                            <div 
                              key={idx} 
                              className={`text-xs p-2 rounded ${
                                feature.source === 'qwen' ? 'bg-purple-50 border border-purple-200' :
                                feature.source === 'style' ? 'bg-green-50 border border-green-200' :
                                'bg-blue-50 border border-blue-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={`font-mono ${
                                  feature.value?.toLowerCase().includes('heterochromia') 
                                    ? 'font-bold text-purple-900' 
                                    : ''
                                }`}>
                                  {feature.normalized || feature.value}
                                </span>
                                <span className="text-xs opacity-60">
                                  [{feature.source}] p:{feature.priority}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}
                  
                  {/* 新增：完整参数显示 */}
                  <div className="border-t pt-3">
                    <div className="text-xs text-gray-500 mb-2 font-medium">
                      Generation Parameters / 生成参数
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs bg-blue-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Strength:</span>
                        <span className="font-medium">{genParams.strength.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Guidance:</span>
                        <span className="font-medium">{genParams.guidance.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Aspect Ratio:</span>
                        <span className="font-medium">{genParams.aspectRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Num Outputs:</span>
                        <span className="font-medium">{abTestMode ? calculateVariants().length : 1}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* API Request Body */}
                  {lastApiRequest && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500 font-medium">
                          API Request Body / API 请求体
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(lastApiRequest, null, 2))
                            alert('Copied to clipboard! / 已复制到剪贴板！')
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Copy / 复制
                        </button>
                      </div>
                      <div className="bg-gray-900 p-3 rounded text-xs text-green-400 max-h-48 overflow-y-auto font-mono">
                        <pre>{JSON.stringify(lastApiRequest, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-center py-4 text-sm text-gray-500">
                  Click to expand / 点击展开
                </div>
              )}
            </Card>
            
            {/* Placeholder for Generated Results */}
            {!isGenerating && generatedImages.length === 0 && (
              <Card className="p-6 border-2 border-dashed border-gray-300">
                <div className="text-center py-8">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-600 mb-2">Generated Results Will Appear Below</p>
                  <p className="text-sm text-gray-500">生成结果将显示在下方全宽区域</p>
                  <p className="text-xs text-gray-400 mt-2">↓ Scroll down after generation / 生成后向下滚动查看</p>
                </div>
              </Card>
            )}
            
          </div>
        </div>
        
        {/* FULL WIDTH SECTION - Generated Results */}
        {generatedImages.length > 0 && (
          <Card className="p-6 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ImageIcon className="w-6 h-6 text-blue-600" />
                Generated Results / 生成结果
                <span className="text-sm font-normal text-gray-500 ml-2">({generatedImages.length} {generatedImages.length === 1 ? 'image' : 'images'})</span>
              </h2>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Avg Rating:</span>
                  <span className="font-bold text-yellow-600">
                    {(() => {
                      const rated = generatedImages.filter(img => img.rating)
                      const avg = rated.length > 0 ? rated.reduce((sum, img) => sum + (img.rating || 0), 0) / rated.length : 0
                      return avg > 0 ? avg.toFixed(1) : '-'
                    })()}
                  </span>
                  <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-500" />
                </div>
                {generatedImages.find(img => img.isBest) && (
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <Star className="w-4 h-4 fill-green-500" />
                    Best Marked
                  </div>
                )}
              </div>
            </div>
            
            {/* Grid Layout for Results */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {generatedImages.map((img, index) => (
                <div key={img.id} className={`border-2 rounded-lg overflow-hidden transition-all hover:shadow-xl ${img.isBest ? 'border-green-500 shadow-lg ring-2 ring-green-200' : 'border-gray-200'}`}>
                  <div 
                    className="relative cursor-pointer group" 
                    onClick={() => setSelectedImageModal(img)}
                  >
                    <img 
                      src={img.imageUrl} 
                      alt={`Generated ${index + 1}`}
                      className="w-full aspect-square object-cover"
                    />
                    {img.isBest && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Star className="w-4 h-4 fill-white" />
                        Best
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white bg-black/70 px-4 py-2 rounded-lg text-sm font-medium transition-opacity">
                        Click to enlarge / 点击放大
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-white space-y-3">
                    {/* Parameters Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Strength:</span>
                        <span className="font-mono font-medium">{img.params.strength.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Guidance:</span>
                        <span className="font-mono font-medium">{img.params.guidance.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ratio:</span>
                        <span className="font-medium">{img.params.aspectRatio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium">{img.timeTaken}s</span>
                      </div>
                    </div>
                    
                    {/* Rating Stars */}
                    <div className="flex items-center justify-center gap-1 py-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={(e) => {
                            e.stopPropagation()
                            rateImage(img.id, star)
                          }}
                          className="transition-all hover:scale-125"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              (img.rating || 0) >= star 
                                ? 'fill-yellow-400 stroke-yellow-500' 
                                : 'fill-none stroke-gray-300 hover:stroke-gray-400'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsBest(img.id)
                        }}
                        disabled={img.isBest}
                        className={`flex-1 text-xs px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                          img.isBest 
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-green-50 hover:bg-green-100 text-green-700 hover:shadow-md'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${img.isBest ? 'fill-green-600' : ''}`} />
                        {img.isBest ? 'Best' : 'Mark'}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          applyToStyle(img.params)
                        }}
                        className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 hover:shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
      
      {/* Test History - Card Layout with Thumbnails */}
      {testHistory.length > 0 && (
        <Card className="p-6 mt-6">
          <div className="flex items-start justify-between mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-left"
            >
              <FileText className="w-6 h-6 text-gray-700" />
              <h2 className="text-xl font-bold flex items-center gap-2">
                Test History / 测试历史
                <span className="text-sm font-normal text-gray-500">({testHistory.length} sessions)</span>
              </h2>
              {showHistory ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </button>
            
            {/* History Management Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => deleteOldHistory(7)}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Delete history older than 7 days"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete 7d+
              </button>
              <button
                onClick={clearAllHistory}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                title="Clear all test history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All / 清空
              </button>
            </div>
          </div>
          
          {showHistory && (
            <div className="space-y-3">
              {testHistory.slice(0, 20).map((session) => (
                <div 
                  key={session.id} 
                  className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                >
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img 
                      src={session.result.imageUrl} 
                      alt="Result" 
                      className="w-28 h-28 rounded-lg border-2 border-gray-200 object-cover cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => setSelectedImageModal(session.result)}
                    />
                  </div>
                  
                  {/* Info Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{session.styleName || 'Custom Style'}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(session.testDate).toLocaleString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      
                      {/* Rating */}
                      <div className="flex gap-0.5">
                        {session.result.rating ? (
                          Array.from({length: session.result.rating}).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 stroke-yellow-500" />
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No rating</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Parameters Grid */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="bg-gray-50 px-3 py-2 rounded">
                        <div className="text-xs text-gray-500 mb-0.5">Strength</div>
                        <div className="font-mono font-semibold text-sm">{session.result.params.strength.toFixed(2)}</div>
                      </div>
                      <div className="bg-gray-50 px-3 py-2 rounded">
                        <div className="text-xs text-gray-500 mb-0.5">Guidance</div>
                        <div className="font-mono font-semibold text-sm">{session.result.params.guidance.toFixed(1)}</div>
                      </div>
                      <div className="bg-gray-50 px-3 py-2 rounded">
                        <div className="text-xs text-gray-500 mb-0.5">Ratio</div>
                        <div className="font-semibold text-sm">{session.result.params.aspectRatio}</div>
                      </div>
                      <div className="bg-gray-50 px-3 py-2 rounded">
                        <div className="text-xs text-gray-500 mb-0.5">Time</div>
                        <div className="font-semibold text-sm">{session.result.timeTaken}s</div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadSession(session)}
                        className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Load / 加载
                      </button>
                      <button
                        onClick={() => setSelectedImageModal(session.result)}
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <ImageIcon className="w-4 h-4" />
                        View / 查看
                      </button>
                      <button
                        onClick={() => deleteHistoryEntry(session.id)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        title="Delete this history entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {testHistory.length > 20 && (
                <div className="mt-4 text-center py-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Showing 20 of {testHistory.length} sessions / 显示 20 / {testHistory.length} 条记录
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Oldest sessions are automatically removed / 最旧的记录会自动清理
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
      
      {/* Image Detail Modal */}
      {selectedImageModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 大图显示 */}
            <div className="relative">
              <img 
                src={selectedImageModal.imageUrl} 
                alt="Generated" 
                className="w-full"
              />
              <button 
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
              >
                <X className="w-6 h-6" />
              </button>
              {selectedImageModal.isBest && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                  <Star className="w-4 h-4 fill-white" />
                  Best Result
                </div>
              )}
            </div>
            
            {/* 参数信息 */}
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold">Generation Details / 生成详情</h3>
              
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Strength / 强度</div>
                  <div className="text-lg font-semibold text-blue-600">{selectedImageModal.params.strength.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Guidance / 引导度</div>
                  <div className="text-lg font-semibold text-blue-600">{selectedImageModal.params.guidance.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Aspect Ratio / 比例</div>
                  <div className="text-lg font-semibold text-gray-700">{selectedImageModal.params.aspectRatio}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Generation Time / 生成时长</div>
                  <div className="text-lg font-semibold text-gray-700">{selectedImageModal.timeTaken}s</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-1">Generated At / 生成时间</div>
                  <div className="text-sm font-medium text-gray-700">{new Date(selectedImageModal.generatedAt).toLocaleTimeString()}</div>
                </div>
              </div>
              
              {/* 评分功能 */}
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <span className="font-medium text-gray-700">Quality Rating / 质量评分:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => rateImage(selectedImageModal.id, star)}
                      className="transition-all hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          (selectedImageModal.rating || 0) >= star 
                            ? 'fill-yellow-400 stroke-yellow-500' 
                            : 'fill-none stroke-gray-300 hover:stroke-gray-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    markAsBest(selectedImageModal.id)
                    setSelectedImageModal({...selectedImageModal, isBest: true})
                  }}
                  disabled={selectedImageModal.isBest}
                  className={`flex-1 ${
                    selectedImageModal.isBest 
                      ? 'bg-green-600 hover:bg-green-600 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <Star className="w-4 h-4 mr-2" />
                  {selectedImageModal.isBest ? 'Marked as Best / 已标记为最佳' : 'Mark as Best / 标记为最佳'}
                </Button>
                <Button 
                  onClick={() => {
                    applyToStyle(selectedImageModal.params)
                    setSelectedImageModal(null)
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Apply to Style / 应用到风格
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
