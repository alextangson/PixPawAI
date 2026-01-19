/**
 * Style Library Management Page
 * 风格库管理页面
 * 
 * 功能：
 * - 查看所有风格
 * - 添加新风格
 * - 编辑现有风格
 * - 删除风格
 * - 启用/禁用风格
 * - 上传预览图
 * - 调整排序
 */

'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'

// Simple Button component for admin panel
function Button({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'default',
  className = '',
  disabled = false,
  title
}: { 
  children: React.ReactNode
  onClick?: () => void | Promise<void>
  variant?: 'default' | 'outline' | 'destructive'
  size?: 'default' | 'sm'
  className?: string
  disabled?: boolean
  title?: string
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  }
  
  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs'
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  )
}

interface Style {
  id: string
  name: string
  emoji?: string  // 可选，优先显示preview_image_url
  prompt_suffix: string
  negative_prompt?: string
  category?: string
  description?: string
  tags?: string[]
  tier?: number  // 1=写实, 2=轻艺术, 3=强艺术, 4=极致艺术
  expected_similarity?: string  // 预期相似度 (如 "85-90%")
  recommended_strength_min?: number
  recommended_strength_max?: number
  recommended_guidance?: number
  preview_image_url?: string
  example_image_url?: string
  sort_order: number
  is_enabled: boolean
  is_premium: boolean
  usage_count?: number
  created_at?: string
  updated_at?: string
}

export default function StylesManagementPage() {
  const [styles, setStyles] = useState<Style[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null) // styleId being uploaded
  const [imagePreview, setImagePreview] = useState<string>('')
  
  // 版本历史相关状态
  const [versionHistoryStyleId, setVersionHistoryStyleId] = useState<string | null>(null)
  const [versionHistory, setVersionHistory] = useState<any[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null)
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<Style>>({
    id: '',
    name: '',
    emoji: '',
    prompt_suffix: '',
    negative_prompt: '',
    category: 'artistic',
    description: '',
    tier: 2,  // 默认 Tier 2 (轻艺术)
    expected_similarity: '70-80%',
    recommended_strength_min: 0.33,
    recommended_strength_max: 0.37,
    recommended_guidance: 2.5,
    sort_order: 999,
    is_enabled: true,
    is_premium: false
  })
  
  // 加载风格列表
  async function loadStyles() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/styles?includeDisabled=true')
      
      if (!res.ok) {
        throw new Error('Failed to load styles')
      }
      
      const data = await res.json()
      
      // 排序：启用的在前，未启用的在后；同组内按 sort_order 排序
      const sortedStyles = (data.styles || []).sort((a: Style, b: Style) => {
        // 先按启用状态排序（启用的在前）
        if (a.is_enabled !== b.is_enabled) {
          return a.is_enabled ? -1 : 1
        }
        // 同状态下按 sort_order 排序
        return a.sort_order - b.sort_order
      })
      
      setStyles(sortedStyles)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    loadStyles()
  }, [])
  
  // 创建新风格
  async function handleCreate() {
    try {
      if (!formData.id || !formData.name || !formData.prompt_suffix) {
        alert('请填写必需字段：ID, Name, Prompt Suffix')
        return
      }
      
      // 准备数据（不包含base64图片）
      const dataToSend = { ...formData }
      delete dataToSend.preview_image_url // 先不发送图片URL
      
      const res = await fetch('/api/admin/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create style')
      }
      
      // 如果有图片，上传图片
      if (imagePreview && imagePreview.startsWith('data:')) {
        try {
          // 将base64转为File对象
          const response = await fetch(imagePreview)
          const blob = await response.blob()
          const file = new File([blob], `${formData.id}.jpg`, { type: 'image/jpeg' })
          
          await handleImageUpload(file, formData.id!)
        } catch (imgErr: any) {
          console.error('Image upload error:', imgErr)
          alert(`风格创建成功，但图片上传失败: ${imgErr.message}`)
        }
      }
      
      // 重新加载列表
      await loadStyles()
      
      // 重置表单
      setShowAddForm(false)
      setImagePreview('')
      setFormData({
        id: '',
        name: '',
        emoji: '',
        prompt_suffix: '',
        negative_prompt: '',
        category: 'artistic',
        description: '',
        tier: 2,
        expected_similarity: '70-80%',
        recommended_strength_min: 0.33,
        recommended_strength_max: 0.37,
        recommended_guidance: 2.5,
        sort_order: 999,
        is_enabled: true,
        is_premium: false
      })
      
      alert('风格创建成功！')
    } catch (err: any) {
      alert(`创建失败: ${err.message}`)
    }
  }
  
  // 更新风格
  async function handleUpdate(id: string) {
    try {
      const style = styles.find(s => s.id === id)
      if (!style) return
      
      const res = await fetch(`/api/admin/styles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(style)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update style')
      }
      
      setEditingId(null)
      alert('更新成功！')
    } catch (err: any) {
      alert(`更新失败: ${err.message}`)
    }
  }
  
  // 删除风格
  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个风格吗？此操作不可恢复。')) {
      return
    }
    
    try {
      const res = await fetch(`/api/admin/styles/${id}`, {
        method: 'DELETE'
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete style')
      }
      
      await loadStyles()
      alert('删除成功！')
    } catch (err: any) {
      alert(`删除失败: ${err.message}`)
    }
  }
  
  // 获取版本历史
  async function loadVersionHistory(styleId: string) {
    try {
      setLoadingVersions(true)
      setVersionHistoryStyleId(styleId)
      
      const res = await fetch(`/api/admin/styles/${styleId}/versions`)
      
      if (!res.ok) {
        throw new Error('Failed to load version history')
      }
      
      const data = await res.json()
      setVersionHistory(data.versions || [])
    } catch (err: any) {
      alert(`获取版本历史失败: ${err.message}`)
      setVersionHistoryStyleId(null)
    } finally {
      setLoadingVersions(false)
    }
  }
  
  // 恢复到指定版本
  async function handleRestoreVersion(styleId: string, versionNumber: number) {
    const version = versionHistory.find(v => v.version_number === versionNumber)
    if (!version) return
    
    const confirmed = confirm(
      `确定要恢复到版本 ${versionNumber} 吗？\n\n` +
      `当前配置将被保存为新版本。\n\n` +
      `版本 ${versionNumber} 参数:\n` +
      `Strength: ${version.recommended_strength_min?.toFixed(2) || 'N/A'} - ${version.recommended_strength_max?.toFixed(2) || 'N/A'}\n` +
      `Guidance: ${version.recommended_guidance?.toFixed(1) || 'N/A'}`
    )
    
    if (!confirmed) return
    
    try {
      const res = await fetch(`/api/admin/styles/${styleId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_number: versionNumber })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to restore version')
      }
      
      const data = await res.json()
      alert(`✅ 成功恢复到版本 ${versionNumber}！\n\n当前配置已保存为版本 ${data.backupVersion}`)
      
      // 重新加载风格列表和版本历史
      await loadStyles()
      await loadVersionHistory(styleId)
    } catch (err: any) {
      alert(`恢复版本失败: ${err.message}`)
    }
  }
  
  // 切换启用状态
  async function toggleEnabled(id: string) {
    const style = styles.find(s => s.id === id)
    if (!style) return
    
    try {
      const res = await fetch(`/api/admin/styles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_enabled: !style.is_enabled })
      })
      
      if (!res.ok) {
        throw new Error('Failed to toggle status')
      }
      
      await loadStyles()
    } catch (err: any) {
      alert(`操作失败: ${err.message}`)
    }
  }
  
  // 更新本地状态
  function updateStyle(id: string, updates: Partial<Style>) {
    setStyles(styles.map(s => s.id === id ? { ...s, ...updates } : s))
  }
  
  // 上传图片
  async function handleImageUpload(file: File, styleId: string) {
    try {
      setUploadingImage(styleId)
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('styleId', styleId)
      
      const res = await fetch('/api/admin/upload-style-image', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Upload failed')
      }
      
      const { imageUrl } = await res.json()
      
      // 更新风格的预览图URL
      const updateRes = await fetch(`/api/admin/styles/${styleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preview_image_url: imageUrl })
      })
      
      if (!updateRes.ok) {
        throw new Error('Failed to update style with image URL')
      }
      
      // 重新加载列表
      await loadStyles()
      alert('图片上传成功！')
    } catch (err: any) {
      alert(`上传失败: ${err.message}`)
    } finally {
      setUploadingImage(null)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">加载中...</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Style Library Management</h1>
          <p className="text-gray-600 mt-1">
            管理所有可用的图片风格 ({styles.length} 个)
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          添加新风格
        </Button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          错误: {error}
        </div>
      )}
      
      {/* 添加表单 */}
      {showAddForm && (
        <Card className="p-6 border-2 border-blue-200">
          <h2 className="text-xl font-semibold mb-4">添加新风格</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                ID * (唯一标识，如: My-Style)
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="My-Style"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                名称 * (显示名称)
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="My Style"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Emoji (可选)
              </label>
              <input
                type="text"
                value={formData.emoji}
                onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="🎨"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                分类
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="artistic">Artistic</option>
                <option value="3d">3D</option>
                <option value="photo">Photo</option>
                <option value="modern">Modern</option>
                <option value="futuristic">Futuristic</option>
                <option value="craft">Craft</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Prompt Suffix * (风格提示词)
              </label>
              <textarea
                value={formData.prompt_suffix}
                onChange={(e) => setFormData({...formData, prompt_suffix: e.target.value})}
                className="w-full h-32 px-3 py-2 border rounded-lg"
                placeholder="watercolor style, soft colors, dreamy atmosphere, high quality, detailed"
              />
              <p className="text-xs text-gray-500 mt-1">
                描述风格特征和质量要求（系统会自动处理与宠物特征的融合）
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Negative Prompt (可选，负面提示词)
              </label>
              <textarea
                value={formData.negative_prompt}
                onChange={(e) => setFormData({...formData, negative_prompt: e.target.value})}
                className="w-full h-20 px-3 py-2 border rounded-lg"
                placeholder="blurry, low quality, distorted, deformed, bad anatomy"
              />
              <p className="text-xs text-gray-500 mt-1">
                用于告诉AI避免生成的特征（如模糊、低质量等）
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                描述
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Soft watercolor art with dreamy vibes"
              />
            </div>
            
            {/* 预览图上传 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                预览图片 (可选)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    // 显示预览
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string)
                      setFormData({...formData, preview_image_url: reader.result as string})
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">
                推荐尺寸: 400x400px，最大5MB
              </p>
            </div>
            
            {/* Tier 配置 Section */}
            <div className="col-span-2">
              <div className="border-t pt-4 mt-2">
                <h3 className="text-md font-semibold mb-3 text-blue-900">🎯 生成参数配置</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tier 等级 *
                    </label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({...formData, tier: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value={1}>Tier 1 - 写实增强 (85-90%相似度)</option>
                      <option value={2}>Tier 2 - 轻艺术 (70-80%相似度)</option>
                      <option value={3}>Tier 3 - 强艺术 (60-70%相似度)</option>
                      <option value={4}>Tier 4 - 极致艺术 (50-60%相似度)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      决定写实度和风格化程度
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      预期相似度
                    </label>
                    <input
                      type="text"
                      value={formData.expected_similarity}
                      onChange={(e) => setFormData({...formData, expected_similarity: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="70-80%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Strength Min (最小)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.20"
                      max="0.80"
                      value={formData.recommended_strength_min}
                      onChange={(e) => setFormData({...formData, recommended_strength_min: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      0.25-0.30 (写实) | 0.35-0.42 (轻艺术)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Strength Max (最大)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.20"
                      max="0.80"
                      value={formData.recommended_strength_max}
                      onChange={(e) => setFormData({...formData, recommended_strength_max: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      0.50-0.60 (强艺术) | 0.65-0.75 (极致)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Guidance (引导强度)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.5"
                      max="5.0"
                      value={formData.recommended_guidance}
                      onChange={(e) => setFormData({...formData, recommended_guidance: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      2.0 (写实) | 2.5 (平衡) | 3.5 (强引导)
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                排序顺序 (越小越靠前)
              </label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({...formData, is_enabled: e.target.checked})}
                  className="mr-2"
                />
                启用
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_premium}
                  onChange={(e) => setFormData({...formData, is_premium: e.target.checked})}
                  className="mr-2"
                />
                高级风格
              </label>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              创建
            </Button>
            <Button onClick={() => setShowAddForm(false)} variant="outline">
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
          </div>
        </Card>
      )}
      
      {/* 风格列表 */}
      <div className="grid gap-4">
        {styles.map((style) => (
          <Card 
            key={style.id} 
            className={`p-4 ${!style.is_enabled ? 'opacity-60 bg-gray-50' : ''}`}
          >
            {editingId === style.id ? (
              /* 编辑模式 */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">名称</label>
                    <input
                      type="text"
                      value={style.name}
                      onChange={(e) => updateStyle(style.id, { name: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Emoji</label>
                    <input
                      type="text"
                      value={style.emoji || ''}
                      onChange={(e) => updateStyle(style.id, { emoji: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Prompt Suffix (风格提示词)</label>
                  <textarea
                    value={style.prompt_suffix}
                    onChange={(e) => updateStyle(style.id, { prompt_suffix: e.target.value })}
                    className="w-full h-24 px-2 py-1 border rounded text-sm"
                    placeholder="watercolor style, soft colors, high quality"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Negative Prompt (可选)</label>
                  <textarea
                    value={style.negative_prompt || ''}
                    onChange={(e) => updateStyle(style.id, { negative_prompt: e.target.value })}
                    className="w-full h-16 px-2 py-1 border rounded text-sm"
                    placeholder="blurry, low quality, distorted"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">预览图片</label>
                  {style.preview_image_url && (
                    <img 
                      src={style.preview_image_url} 
                      alt={style.name}
                      className="w-20 h-20 rounded object-cover border mb-2"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        await handleImageUpload(file, style.id)
                      }
                    }}
                    disabled={uploadingImage === style.id}
                    className="w-full px-2 py-1 border rounded text-xs"
                  />
                  {uploadingImage === style.id && (
                    <p className="text-xs text-blue-600 mt-1">上传中...</p>
                  )}
                </div>
                <div className="border-t pt-3 mt-2">
                  <p className="text-xs font-semibold text-blue-900 mb-2">生成参数配置</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Tier</label>
                      <select
                        value={style.tier || 2}
                        onChange={(e) => updateStyle(style.id, { tier: parseInt(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value={1}>T1-写实</option>
                        <option value={2}>T2-轻艺术</option>
                        <option value={3}>T3-强艺术</option>
                        <option value={4}>T4-极致</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Strength Min</label>
                      <input
                        type="number"
                        step="0.01"
                        value={style.recommended_strength_min || 0.35}
                        onChange={(e) => updateStyle(style.id, { recommended_strength_min: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Strength Max</label>
                      <input
                        type="number"
                        step="0.01"
                        value={style.recommended_strength_max || 0.40}
                        onChange={(e) => updateStyle(style.id, { recommended_strength_max: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Guidance</label>
                      <input
                        type="number"
                        step="0.1"
                        value={style.recommended_guidance || 2.5}
                        onChange={(e) => updateStyle(style.id, { recommended_guidance: parseFloat(e.target.value) })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleUpdate(style.id)}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    保存
                  </Button>
                  <Button 
                    onClick={() => setEditingId(null)}
                    size="sm"
                    variant="outline"
                  >
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              /* 显示模式 */
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* 优先显示图片，其次emoji，最后默认图标 */}
                    {style.preview_image_url ? (
                      <img 
                        src={style.preview_image_url} 
                        alt={style.name}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      />
                    ) : style.emoji ? (
                      <span className="text-2xl">{style.emoji}</span>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        🎨
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{style.name}</h3>
                      <p className="text-sm text-gray-500">
                        ID: {style.id} | Category: {style.category} | Order: {style.sort_order}
                      </p>
                    </div>
                    {style.is_premium && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                        Premium
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 mb-2">
                    <strong>Prompt Suffix:</strong> {style.prompt_suffix}
                  </div>
                  {style.description && (
                    <p className="text-sm text-gray-600">{style.description}</p>
                  )}
                  {/* Tier 配置信息 */}
                  {(style.tier || style.recommended_strength_min || style.recommended_guidance) && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                      <p className="font-medium text-blue-900 mb-1">🎯 生成参数</p>
                      <div className="grid grid-cols-2 gap-1 text-blue-700">
                        {style.tier && (
                          <div>Tier: {style.tier} ({
                            style.tier === 1 ? '写实增强' :
                            style.tier === 2 ? '轻艺术' :
                            style.tier === 3 ? '强艺术' : '极致艺术'
                          })</div>
                        )}
                        {style.expected_similarity && (
                          <div>相似度: {style.expected_similarity}</div>
                        )}
                        {style.recommended_strength_min !== undefined && (
                          <div>Strength: {style.recommended_strength_min.toFixed(2)}-{(style.recommended_strength_max || 0).toFixed(2)}</div>
                        )}
                        {style.recommended_guidance && (
                          <div>Guidance: {style.recommended_guidance.toFixed(1)}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {style.usage_count !== undefined && (
                    <p className="text-xs text-gray-500 mt-2">
                      使用次数: {style.usage_count}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => toggleEnabled(style.id)}
                    size="sm"
                    variant="outline"
                    title={style.is_enabled ? '禁用' : '启用'}
                  >
                    {style.is_enabled ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    onClick={() => setEditingId(style.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => loadVersionHistory(style.id)}
                    size="sm"
                    variant="outline"
                    title="Version History / 版本历史"
                    className="text-purple-600 hover:bg-purple-50"
                  >
                    📜
                  </Button>
                  <Button
                    onClick={() => handleDelete(style.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {styles.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          暂无风格，点击上方按钮添加新风格
        </div>
      )}
      
      {/* Version History Modal */}
      {versionHistoryStyleId && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setVersionHistoryStyleId(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                📜 Version History / 版本历史
                <span className="text-sm font-normal text-gray-500">
                  ({styles.find(s => s.id === versionHistoryStyleId)?.name})
                </span>
              </h2>
              <button 
                onClick={() => setVersionHistoryStyleId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {loadingVersions ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading versions / 加载中...</p>
                </div>
              ) : versionHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">暂无版本历史</p>
                  <p className="text-sm">第一次更新风格参数后将自动创建版本记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Current Version */}
                  {(() => {
                    const currentStyle = styles.find(s => s.id === versionHistoryStyleId)
                    if (!currentStyle) return null
                    
                    return (
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                              Current / 当前版本
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(currentStyle.updated_at || currentStyle.created_at || '').toLocaleString('zh-CN')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          <div className="bg-white p-3 rounded">
                            <div className="text-gray-500 text-xs mb-1">Strength Range</div>
                            <div className="font-mono font-semibold">
                              {currentStyle.recommended_strength_min?.toFixed(2) || 'N/A'} - 
                              {currentStyle.recommended_strength_max?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-gray-500 text-xs mb-1">Guidance</div>
                            <div className="font-mono font-semibold">
                              {currentStyle.recommended_guidance?.toFixed(1) || 'N/A'}
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded">
                            <div className="text-gray-500 text-xs mb-1">Tier</div>
                            <div className="font-semibold">
                              {currentStyle.tier || 'N/A'}
                            </div>
                          </div>
                        </div>
                        
                        {expandedVersion === -1 && (
                          <div className="mt-3 pt-3 border-t space-y-2">
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1">Prompt Suffix:</div>
                              <div className="bg-white p-2 rounded text-sm">
                                {currentStyle.prompt_suffix}
                              </div>
                            </div>
                            {currentStyle.negative_prompt && (
                              <div>
                                <div className="text-xs font-medium text-gray-600 mb-1">Negative Prompt:</div>
                                <div className="bg-white p-2 rounded text-sm">
                                  {currentStyle.negative_prompt}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <button
                          onClick={() => setExpandedVersion(expandedVersion === -1 ? null : -1)}
                          className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {expandedVersion === -1 ? '▼ Hide Details / 隐藏详情' : '▶ View Details / 查看详情'}
                        </button>
                      </div>
                    )
                  })()}
                  
                  {/* Historical Versions */}
                  {versionHistory.map((version) => (
                    <div 
                      key={version.id} 
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                            v{version.version_number}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(version.created_at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRestoreVersion(versionHistoryStyleId, version.version_number)}
                          className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          ↻ Restore / 恢复
                        </button>
                      </div>
                      
                      {version.notes && (
                        <div className="mb-3 text-sm text-gray-600 italic bg-yellow-50 p-2 rounded">
                          📝 {version.notes}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-gray-500 text-xs mb-1">Strength Range</div>
                          <div className="font-mono font-semibold">
                            {version.recommended_strength_min?.toFixed(2) || 'N/A'} - 
                            {version.recommended_strength_max?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-gray-500 text-xs mb-1">Guidance</div>
                          <div className="font-mono font-semibold">
                            {version.recommended_guidance?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-gray-500 text-xs mb-1">Created By</div>
                          <div className="font-semibold text-xs truncate">
                            {version.created_by?.slice(0, 8) || 'System'}
                          </div>
                        </div>
                      </div>
                      
                      {expandedVersion === version.version_number && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          <div>
                            <div className="text-xs font-medium text-gray-600 mb-1">Prompt Suffix:</div>
                            <div className="bg-gray-50 p-2 rounded text-sm">
                              {version.prompt_suffix}
                            </div>
                          </div>
                          {version.negative_prompt && (
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1">Negative Prompt:</div>
                              <div className="bg-gray-50 p-2 rounded text-sm">
                                {version.negative_prompt}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => setExpandedVersion(expandedVersion === version.version_number ? null : version.version_number)}
                        className="mt-3 text-xs text-gray-600 hover:text-gray-800 font-medium"
                      >
                        {expandedVersion === version.version_number ? '▼ Hide Details / 隐藏详情' : '▶ View Details / 查看详情'}
                      </button>
                    </div>
                  ))}
                  
                  {versionHistory.length > 10 && (
                    <div className="text-center py-4 text-sm text-gray-500">
                      Showing all {versionHistory.length} versions / 显示全部 {versionHistory.length} 个版本
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
