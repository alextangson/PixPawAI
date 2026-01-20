'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface QualityCheckResult {
  isSafe: boolean
  unsafeReason: 'none' | 'nudity' | 'gore' | 'hate' | 'violence'
  hasPet: boolean
  petType: string
  quality: 'excellent' | 'good' | 'poor' | 'unusable'
  issues: string[]
  hasHeterochromia: boolean
  heterochromiaDetails: string
  breed: string
  complexPattern: boolean
  multiplePets: number
  detectedColors: string
}

export default function TestQwenPage() {
  const [imageUrl, setImageUrl] = useState('https://gukjzngfmkbnkxckwbqk.supabase.co/storage/v1/object/public/guest-uploads/test-lab/test-1768838871839-d9wo8v.jpg')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QualityCheckResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!imageUrl) {
      setError('请输入图片URL')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/check-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      })

      if (!response.ok) {
        throw new Error(`API错误: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-900">
          🐾 Qwen 宠物识别测试
        </h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              图片 URL
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="输入图片URL..."
            />
          </div>

          {imageUrl && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预览
              </label>
              <img 
                src={imageUrl} 
                alt="Preview" 
                className="max-w-full h-auto rounded-lg border-2 border-gray-200"
                style={{ maxHeight: '400px' }}
              />
            </div>
          )}

          <Button
            onClick={handleTest}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 rounded-lg transition-all transform hover:scale-[1.02]"
          >
            {loading ? '🔄 识别中...' : '🚀 开始识别'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-red-900 mb-2">❌ 错误</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">
              ✨ Qwen 识别结果
            </h2>

            <div className="space-y-4">
              {/* 安全检查 */}
              <div className={`p-4 rounded-lg ${result.isSafe ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">安全检查:</span>
                  <span className={`text-lg ${result.isSafe ? 'text-green-600' : 'text-red-600'}`}>
                    {result.isSafe ? '✅ 安全' : `❌ 不安全 (${result.unsafeReason})`}
                  </span>
                </div>
              </div>

              {/* 宠物检测 */}
              <div className={`p-4 rounded-lg ${result.hasPet ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">是否有宠物:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {result.hasPet ? '✅ 是' : '❌ 否'}
                  </span>
                </div>
              </div>

              {result.hasPet && (
                <>
                  {/* 宠物类型 */}
                  <div className="p-4 rounded-lg bg-purple-50">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">宠物类型:</span>
                      <span className="text-lg font-bold text-purple-600">{result.petType}</span>
                    </div>
                  </div>

                  {/* 品种 */}
                  {result.breed && result.breed !== 'unknown' && (
                    <div className="p-4 rounded-lg bg-pink-50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">品种:</span>
                        <span className="text-lg font-bold text-pink-600">{result.breed}</span>
                      </div>
                    </div>
                  )}

                  {/* 颜色 */}
                  {result.detectedColors && (
                    <div className="p-4 rounded-lg bg-yellow-50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">颜色:</span>
                        <span className="text-lg text-yellow-700">{result.detectedColors}</span>
                      </div>
                    </div>
                  )}

                  {/* 异瞳 */}
                  {result.hasHeterochromia && (
                    <div className="p-4 rounded-lg bg-indigo-50">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">异瞳症:</span>
                          <span className="text-lg font-bold text-indigo-600">✨ 是</span>
                        </div>
                        <div className="text-sm text-indigo-700">
                          {result.heterochromiaDetails}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 图案 */}
                  <div className="p-4 rounded-lg bg-orange-50">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">复杂图案:</span>
                      <span className="text-lg text-orange-600">
                        {result.complexPattern ? '✅ 是' : '❌ 否'}
                      </span>
                    </div>
                  </div>

                  {/* 多只宠物 */}
                  {result.multiplePets > 1 && (
                    <div className="p-4 rounded-lg bg-teal-50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">宠物数量:</span>
                        <span className="text-lg font-bold text-teal-600">{result.multiplePets}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 质量 */}
              <div className={`p-4 rounded-lg ${
                result.quality === 'excellent' ? 'bg-green-50' :
                result.quality === 'good' ? 'bg-blue-50' :
                result.quality === 'poor' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">图片质量:</span>
                  <span className="text-lg font-bold">
                    {result.quality === 'excellent' && '🌟 优秀'}
                    {result.quality === 'good' && '👍 良好'}
                    {result.quality === 'poor' && '⚠️ 较差'}
                    {result.quality === 'unusable' && '❌ 无法使用'}
                  </span>
                </div>
                {result.issues.length > 0 && (
                  <div className="mt-2 text-sm text-gray-600">
                    问题: {result.issues.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* 原始JSON */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">📋 原始 JSON 数据</h3>
              <pre className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
