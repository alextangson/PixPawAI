/**
 * Test Lab - 基础版
 * 
 * 功能（Phase 1）：
 * - 上传测试图片
 * - 选择风格
 * - 显示 Qwen 识别结果
 * - 显示当前系统生成的提示词
 * 
 * 后续扩展（Phase 2-5）：
 * - 显示解析器结果
 * - 显示清理器结果
 * - 显示完整构建流程
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, Loader2, Code } from 'lucide-react'
import { STYLES } from '@/lib/styles'
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
}

export default function TestLabPage() {
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [selectedStyle, setSelectedStyle] = useState<string>('Watercolor-Dream')
  const [qwenResult, setQwenResult] = useState<QwenResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string>('')
  
  // Parser 测试状态
  const [testPrompt, setTestPrompt] = useState<string>('')
  const [parsedFeatures, setParsedFeatures] = useState<ParsedFeature[]>([])
  const [showParserTest, setShowParserTest] = useState(false)
  
  // Conflict Cleaner 测试状态
  const [cleanedFeatures, setCleanedFeatures] = useState<ParsedFeature[]>([])
  const [conflicts, setConflicts] = useState<PromptConflict[]>([])
  const [showCleanerTest, setShowCleanerTest] = useState(false)
  
  // Prompt Builder 测试状态
  const [finalPrompt, setFinalPrompt] = useState<MergedPrompt | null>(null)
  const [showBuilderTest, setShowBuilderTest] = useState(false)
  
  // 测试 Parser
  function handleTestParser() {
    if (!testPrompt.trim()) {
      setParsedFeatures([])
      return
    }
    
    const parsed = parseUserPrompt(testPrompt)
    setParsedFeatures(parsed.features)
    
    console.log('Parser Test Result:', {
      original: parsed.original,
      language: parsed.detectedLanguage,
      hasNegative: parsed.hasNegativePrompt,
      features: parsed.features
    })
  }
  
  // 测试 Qwen Features Parser
  function handleTestQwenParser() {
    if (!qwenResult) {
      alert('请先上传图片并获取 Qwen 分析结果')
      return
    }
    
    const qwenFeatures = parseQwenFeatures(qwenResult)
    setParsedFeatures(qwenFeatures)
    
    console.log('Qwen Features:', qwenFeatures)
  }
  
  // 测试 Style Parser
  function handleTestStyleParser() {
    const style = STYLES.find(s => s.id === selectedStyle)
    if (!style || !style.promptSuffix) {
      alert('当前风格没有 promptSuffix')
      return
    }
    
    const styleFeatures = parseStylePrompt(style.promptSuffix, 'suffix')
    setParsedFeatures(styleFeatures)
    
    console.log('Style Features:', styleFeatures)
  }
  
  // 测试冲突清理器
  function handleTestCleaner() {
    if (parsedFeatures.length === 0) {
      alert('请先解析提示词获得特征列表')
      return
    }
    
    const { cleaned, conflicts: detectedConflicts } = cleanConflicts(parsedFeatures)
    const sorted = sortFeatures(cleaned)
    
    setCleanedFeatures(sorted)
    setConflicts(detectedConflicts)
    setShowCleanerTest(true)
    
    console.log('Conflict Cleaner Result:', {
      original: parsedFeatures.length,
      cleaned: cleaned.length,
      conflicts: detectedConflicts.length
    })
  }
  
  // 测试完整流程（Parser + Cleaner）
  function handleTestFullFlow() {
    if (!testPrompt.trim() && !qwenResult) {
      alert('请输入提示词或上传图片')
      return
    }
    
    // 收集所有特征
    const allFeatures: ParsedFeature[] = []
    
    // 1. 用户提示词
    if (testPrompt.trim()) {
      const userParsed = parseUserPrompt(testPrompt)
      allFeatures.push(...userParsed.features)
    }
    
    // 2. Qwen 特征
    if (qwenResult) {
      const qwenFeatures = parseQwenFeatures(qwenResult)
      allFeatures.push(...qwenFeatures)
    }
    
    // 3. 风格特征
    const style = STYLES.find(s => s.id === selectedStyle)
    if (style?.promptSuffix) {
      const styleFeatures = parseStylePrompt(style.promptSuffix, 'suffix')
      allFeatures.push(...styleFeatures)
    }
    
    // 解析
    setParsedFeatures(allFeatures)
    
    // 清理
    const { cleaned, conflicts: detectedConflicts } = cleanConflicts(allFeatures)
    const sorted = sortFeatures(cleaned)
    
    setCleanedFeatures(sorted)
    setConflicts(detectedConflicts)
    setShowCleanerTest(true)
    
    console.log('Full Flow Result:', {
      total: allFeatures.length,
      cleaned: sorted.length,
      conflicts: detectedConflicts.length
    })
  }
  
  // 测试 Prompt Builder
  async function handleTestBuilder() {
    if (cleanedFeatures.length === 0) {
      alert('请先运行完整流程或冲突清理器')
      return
    }
    
    const prompt = buildPrompt(cleanedFeatures)
    setFinalPrompt(prompt)
    setShowBuilderTest(true)
    
    console.log('Final Prompt:', prompt)
  }
  
  // 测试完整构建流程（一键）
  async function handleTestCompleteFlow() {
    try {
      const style = STYLES.find(s => s.id === selectedStyle)
      
      const { prompt, debug } = await buildPromptFromSources({
        userPrompt: testPrompt || undefined,
        qwenResult: qwenResult || undefined,
        stylePromptSuffix: style?.promptSuffix
      })
      
      // 更新所有状态
      setParsedFeatures(debug.parsedFeatures)
      setCleanedFeatures(debug.cleanedFeatures)
      setConflicts([]) // buildPromptFromSources 返回的 debug 中没有 conflicts
      setFinalPrompt(prompt)
      
      setShowCleanerTest(true)
      setShowBuilderTest(true)
      
      console.log('Complete Flow Result:', { prompt, debug })
    } catch (error: any) {
      console.error('Complete flow error:', error)
      alert(`流程执行失败: ${error.message}`)
    }
  }
  
  // 上传图片
  async function handleImageUpload(file: File) {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setQwenResult(null)
    setError('')
    
    // 自动调用 Qwen 分析
    await analyzeImage(file)
  }
  
  // 调用 Qwen 分析（使用现有的 check-quality API）
  async function analyzeImage(file: File) {
    setIsAnalyzing(true)
    setError('')
    
    try {
      // 清理文件名（移除特殊字符）
      const cleanFileName = file.name.replace(/[^\w\s.-]/g, '_')
      const cleanedFile = new File([file], cleanFileName, { type: file.type })
      
      // 上传到 Supabase Storage
      const formData = new FormData()
      formData.append('file', cleanedFile)
      
      console.log('Uploading file:', cleanFileName, 'Size:', (file.size / 1024).toFixed(2), 'KB')
      
      const uploadRes = await fetch('/api/upload-temp', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}))
        const errorMsg = errorData.details || errorData.message || errorData.error || '上传失败'
        console.error('Upload error details:', errorData)
        throw new Error(`上传失败: ${errorMsg}`)
      }
      
      const { imageUrl } = await uploadRes.json()
      console.log('Upload success, analyzing with Qwen...')
      
      // 调用 Qwen 分析
      const analyzeRes = await fetch('/api/check-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })
      
      if (!analyzeRes.ok) {
        const analyzeError = await analyzeRes.json().catch(() => ({}))
        const analyzeMsg = analyzeError.error || analyzeError.message || '分析失败'
        console.error('Analysis error:', analyzeMsg)
        throw new Error(`AI分析失败: ${analyzeMsg}`)
      }
      
      const result = await analyzeRes.json()
      console.log('Analysis result:', result)
      setQwenResult(result)
    } catch (err: any) {
      const errorMessage = err.message || '未知错误，请重试'
      setError(errorMessage)
      console.error('Complete error:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  // 文件拖拽上传
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Test Lab - 基础版</h1>
        <p className="text-gray-600">
          测试提示词构建流程的每一步（Phase 1: 基础功能）
        </p>
      </div>
      
      {/* Step 1: 上传图片 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">1. 上传测试图片</h2>
        
        {!imagePreview ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">点击或拖拽图片到此处上传</p>
            <p className="text-sm text-gray-400">支持 JPG, PNG, WebP（最大 10MB）</p>
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
                className="max-w-xs rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImagePreview('')
                  setImageFile(null)
                  setQwenResult(null)
                }}
              >
                删除
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              <p>文件名: {imageFile?.name}</p>
              <p>大小: {((imageFile?.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        )}
        
        {isAnalyzing && (
          <div className="mt-4 flex items-center gap-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>正在使用 Qwen AI 分析图片...</span>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            错误: {error}
          </div>
        )}
      </Card>
      
      {/* Step 2: 选择风格 */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">2. 选择风格</h2>
        <select
          value={selectedStyle}
          onChange={(e) => setSelectedStyle(e.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          {STYLES.map((style) => (
            <option key={style.id} value={style.id}>
              {style.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">
          当前选择: <strong>{STYLES.find(s => s.id === selectedStyle)?.label}</strong>
        </p>
      </Card>
      
      {/* Step 3: Qwen 识别结果 */}
      {qwenResult && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Qwen AI 识别结果</h2>
          
          <div className="space-y-4">
            {/* 基础信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">宠物类型</div>
                <div className="text-lg font-semibold">{qwenResult.petType}</div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">图片质量</div>
                <div className={`text-lg font-semibold ${
                  qwenResult.quality === 'good' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {qwenResult.quality}
                </div>
              </div>
            </div>
            
            {/* 详细特征 */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-3">详细特征</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <strong>品种:</strong> {qwenResult.breed || '未识别'}
                </div>
                <div>
                  <strong>毛色:</strong> {qwenResult.detectedColors || '未识别'}
                </div>
                <div>
                  <strong>异瞳:</strong> {
                    qwenResult.hasHeterochromia 
                      ? `是 (${qwenResult.heterochromiaDetails})` 
                      : '否'
                  }
                </div>
                <div>
                  <strong>复杂花纹:</strong> {
                    qwenResult.complexPattern 
                      ? `是 (${qwenResult.patternDetails})` 
                      : '否'
                  }
                </div>
                <div>
                  <strong>宠物数量:</strong> {qwenResult.multiplePets}
                </div>
              </div>
            </div>
            
            {/* JSON 原始数据（可折叠） */}
            <details className="p-4 bg-gray-50 rounded-lg">
              <summary className="cursor-pointer font-medium text-sm text-gray-700">
                查看完整 JSON 数据
              </summary>
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(qwenResult, null, 2)}
              </pre>
            </details>
          </div>
        </Card>
      )}
      
      {/* Phase 1: Prompt Parser 测试 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">3. Prompt Parser 测试 (Phase 1)</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowParserTest(!showParserTest)}
          >
            <Code className="w-4 h-4 mr-2" />
            {showParserTest ? '隐藏' : '显示'} Parser
          </Button>
        </div>
        
        {showParserTest && (
          <div className="space-y-4">
            {/* 测试输入 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                输入测试提示词（支持中英文）
              </label>
              <textarea
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="例如: golden retriever, blue eyes, running in garden, negative: blurry"
                className="w-full h-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* 测试按钮 */}
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleTestParser} variant="default">
                解析用户提示词
              </Button>
              <Button 
                onClick={handleTestQwenParser} 
                variant="outline"
                disabled={!qwenResult}
              >
                解析 Qwen 结果
              </Button>
              <Button 
                onClick={handleTestStyleParser} 
                variant="outline"
              >
                解析风格提示词
              </Button>
              <Button 
                onClick={handleTestCompleteFlow} 
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
              >
                测试完整流程 (All-in-One + Builder)
              </Button>
            </div>
            
            {/* 解析结果 */}
            {parsedFeatures.length > 0 && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">解析结果（共 {parsedFeatures.length} 个特征）</h3>
                    <Button 
                      onClick={handleTestCleaner}
                      size="sm"
                      variant="default"
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      运行冲突清理器
                    </Button>
                  </div>
                  <div className="space-y-2">
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
                          <span className="font-medium text-sm">
                            {feature.type}
                          </span>
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
                              优先级: {feature.priority}
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="text-gray-500">原始:</span> {feature.value}
                        </div>
                        <div className="text-sm text-gray-700">
                          <span className="text-gray-500">标准化:</span> {feature.normalized}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* 冲突清理结果 */}
                {showCleanerTest && (
                  <div className="border rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold mb-3">
                      清理后结果（共 {cleanedFeatures.length} 个特征，解决了 {conflicts.length} 个冲突）
                    </h3>
                    
                    {/* 冲突详情 */}
                    {conflicts.length > 0 && (
                      <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-2">检测到的冲突:</h4>
                        <div className="space-y-2">
                          {conflicts.map((conflict, index) => (
                            <div key={index} className="p-2 bg-white rounded text-sm">
                              <div className="font-medium text-red-700">
                                {conflict.conflictType} 冲突
                              </div>
                              <div className="text-gray-700 mt-1">
                                <span className="line-through">{conflict.feature1.value}</span>
                                {' vs '}
                                {conflict.winner === conflict.feature1 ? (
                                  <span className="font-semibold text-green-600">{conflict.feature2.value}</span>
                                ) : (
                                  <span className="line-through">{conflict.feature2.value}</span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                胜出: {conflict.winner.value} (优先级: {conflict.winner.priority}, {conflict.resolution})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 清理后的特征 */}
                    <div className="space-y-2">
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
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {feature.type}
                            </span>
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
                                优先级: {feature.priority}
                              </span>
                            </div>
                          </div>
                          <div className="text-sm text-gray-700">
                            {feature.normalized}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 构建最终提示词按钮 */}
                    <div className="mt-4 flex justify-center">
                      <Button 
                        onClick={handleTestBuilder}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        构建最终提示词 (Prompt Builder)
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Prompt Builder 结果 */}
                {showBuilderTest && finalPrompt && (
                  <div className="mt-4 border rounded-lg p-4 bg-purple-50">
                    <h3 className="font-semibold mb-3 text-purple-900">
                      最终构建结果 (Phase 4: Prompt Builder)
                    </h3>
                    
                    {/* 正面提示词 */}
                    <div className="mb-4 p-4 bg-white rounded border-2 border-purple-300">
                      <h4 className="font-semibold mb-2 text-sm text-purple-700">
                        正面提示词 (Positive Prompt):
                      </h4>
                      <div className="text-sm text-gray-800 leading-relaxed">
                        {finalPrompt.positive}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        长度: {finalPrompt.positive.length} 字符
                      </div>
                    </div>
                    
                    {/* 负面提示词 */}
                    <div className="mb-4 p-4 bg-white rounded border-2 border-red-200">
                      <h4 className="font-semibold mb-2 text-sm text-red-700">
                        负面提示词 (Negative Prompt):
                      </h4>
                      <div className="text-sm text-gray-800">
                        {finalPrompt.negative}
                      </div>
                    </div>
                    
                    {/* 元数据 */}
                    <div className="p-4 bg-white rounded border">
                      <h4 className="font-semibold mb-2 text-sm">构建统计:</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">用户特征:</span>
                          <span className="ml-2 font-semibold text-blue-600">
                            {finalPrompt.metadata.userFeaturesCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Qwen 特征:</span>
                          <span className="ml-2 font-semibold text-green-600">
                            {finalPrompt.metadata.qwenFeaturesCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">风格特征:</span>
                          <span className="ml-2 font-semibold text-yellow-600">
                            {finalPrompt.metadata.styleFeaturesCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">冲突解决:</span>
                          <span className="ml-2 font-semibold text-red-600">
                            {finalPrompt.metadata.conflictsResolved}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">总优先级得分:</span>
                          <span className="ml-2 font-semibold text-purple-600">
                            {finalPrompt.metadata.totalPriority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 提示信息 */}
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              <strong>说明:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>蓝色标签 = 用户输入（优先级最高）</li>
                <li>绿色标签 = Qwen 识别（优先级中等）</li>
                <li>黄色标签 = 风格模板（优先级较低）</li>
                <li>优先级数值越高，冲突时越优先保留</li>
              </ul>
            </div>
          </div>
        )}
      </Card>
      
      {/* 占位：后续Phase会添加的功能 */}
      {qwenResult && (
        <Card className="p-6 border-dashed">
          <h2 className="text-xl font-semibold mb-4 text-gray-400">
            Phase 2-5 功能预览（即将上线）
          </h2>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Phase 2: Conflict Cleaner - 冲突清理器</p>
            <p>Phase 3: Style Library Database - 风格库数据库集成</p>
            <p>Phase 4: Prompt Builder - 最终提示词构建器</p>
            <p>Phase 5: API Integration - 完整生成流程集成</p>
          </div>
        </Card>
      )}
    </div>
  )
}
