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
import { Upload, Loader2 } from 'lucide-react'
import { STYLES } from '@/lib/styles'

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
        const errorMsg = errorData.message || errorData.error || '上传失败'
        console.error('Upload error:', errorMsg)
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
      
      {/* 占位：后续Phase会添加的功能 */}
      {qwenResult && (
        <Card className="p-6 border-dashed">
          <h2 className="text-xl font-semibold mb-4 text-gray-400">
            Phase 2-5 功能预览（即将上线）
          </h2>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Phase 2: 用户提示词解析器</p>
            <p>Phase 3: promptSuffix 冲突清理器</p>
            <p>Phase 4: 风格库数据库管理</p>
            <p>Phase 5: 完整提示词构建流程展示</p>
          </div>
        </Card>
      )}
    </div>
  )
}
