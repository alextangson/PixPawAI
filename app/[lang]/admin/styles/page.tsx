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
import { Button } from '@/components/ui/card'
import { Card } from '@/components/ui/card'
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X } from 'lucide-react'

interface Style {
  id: string
  name: string
  emoji?: string
  prompt_suffix: string
  base_prompt?: string
  negative_prompt?: string
  category?: string
  description?: string
  tags?: string[]
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
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<Style>>({
    id: '',
    name: '',
    emoji: '',
    prompt_suffix: '',
    base_prompt: '',
    category: 'artistic',
    description: '',
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
      setStyles(data.styles || [])
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
      
      const res = await fetch('/api/admin/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create style')
      }
      
      // 重新加载列表
      await loadStyles()
      
      // 重置表单
      setShowAddForm(false)
      setFormData({
        id: '',
        name: '',
        emoji: '',
        prompt_suffix: '',
        base_prompt: '',
        category: 'artistic',
        description: '',
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
                Prompt Suffix * (高优先级提示词)
              </label>
              <textarea
                value={formData.prompt_suffix}
                onChange={(e) => setFormData({...formData, prompt_suffix: e.target.value})}
                className="w-full h-24 px-3 py-2 border rounded-lg"
                placeholder="watercolor style, soft colors, dreamy atmosphere"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">
                Base Prompt (可选，低优先级提示词)
              </label>
              <textarea
                value={formData.base_prompt}
                onChange={(e) => setFormData({...formData, base_prompt: e.target.value})}
                className="w-full h-24 px-3 py-2 border rounded-lg"
                placeholder="high quality, detailed"
              />
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
                  <label className="block text-xs font-medium mb-1">Prompt Suffix</label>
                  <textarea
                    value={style.prompt_suffix}
                    onChange={(e) => updateStyle(style.id, { prompt_suffix: e.target.value })}
                    className="w-full h-20 px-2 py-1 border rounded text-sm"
                  />
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
                    <span className="text-2xl">{style.emoji}</span>
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
    </div>
  )
}
