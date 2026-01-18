'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Eye, EyeOff, Save, X, TestTube } from 'lucide-react'

interface PromptTemplate {
  id: string
  name: string
  category: 'base' | 'style_suffix' | 'negative'
  template: string
  description?: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  base: 'Base Prompts',
  style_suffix: 'Style Suffixes',
  negative: 'Negative Prompts'
}

const CATEGORY_COLORS: Record<string, string> = {
  base: 'bg-blue-50 border-blue-200',
  style_suffix: 'bg-purple-50 border-purple-200',
  negative: 'bg-red-50 border-red-200'
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<PromptTemplate>>({})
  const [isCreating, setIsCreating] = useState(false)
  const [testPrompt, setTestPrompt] = useState('')
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    fetchPrompts()
  }, [])

  async function fetchPrompts() {
    try {
      const response = await fetch('/api/admin/prompts')
      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
      }
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createPrompt() {
    try {
      const response = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        await fetchPrompts()
        setIsCreating(false)
        setEditForm({})
      }
    } catch (error) {
      console.error('Failed to create prompt:', error)
    }
  }

  async function updatePrompt(id: string) {
    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        await fetchPrompts()
        setEditingId(null)
        setEditForm({})
      }
    } catch (error) {
      console.error('Failed to update prompt:', error)
    }
  }

  async function deletePrompt(id: string) {
    if (!confirm('Are you sure you want to delete this prompt template?')) return

    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchPrompts()
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }

  async function toggleActive(prompt: PromptTemplate) {
    try {
      const response = await fetch(`/api/admin/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !prompt.is_active })
      })

      if (response.ok) {
        await fetchPrompts()
      }
    } catch (error) {
      console.error('Failed to toggle active:', error)
    }
  }

  function testPromptTemplate(template: string) {
    const testData = {
      petType: 'dog',
      breed: 'Golden Retriever',
      detectedColors: 'golden fur with white patches',
      style: 'Watercolor'
    }

    let result = template
    Object.entries(testData).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    })

    setTestResult(result)
  }

  function startEdit(prompt: PromptTemplate) {
    setEditingId(prompt.id)
    setEditForm(prompt)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  function startCreate() {
    setIsCreating(true)
    setEditForm({
      name: '',
      category: 'base',
      template: '',
      description: '',
      variables: [],
      is_active: true
    })
  }

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = []
    }
    acc[prompt.category].push(prompt)
    return acc
  }, {} as Record<string, PromptTemplate[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prompt Templates</h1>
          <p className="text-gray-600">Manage prompt templates with variable support</p>
        </div>
        <Button onClick={startCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="p-6 border-2 border-blue-500">
          <h3 className="text-lg font-semibold mb-4">Create New Template</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={editForm.category || 'base'}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="base">Base Prompt</option>
                <option value="style_suffix">Style Suffix</option>
                <option value="negative">Negative Prompt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Template</label>
              <textarea
                value={editForm.template || ''}
                onChange={(e) => setEditForm({ ...editForm, template: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                rows={4}
                placeholder="Use {petType}, {breed}, {detectedColors}, {style} as variables"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <input
                type="text"
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createPrompt} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Create
              </Button>
              <Button onClick={() => { setIsCreating(false); setEditForm({}) }} className="flex items-center gap-2 bg-gray-500">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Prompt Templates by Category */}
      {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
        <div key={category}>
          <h2 className="text-xl font-semibold mb-3">{CATEGORY_LABELS[category] || category} ({categoryPrompts.length})</h2>
          <div className="space-y-3">
            {categoryPrompts.map((prompt) => (
              <Card key={prompt.id} className={`p-6 ${CATEGORY_COLORS[category]}`}>
                {editingId === prompt.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Template</label>
                      <textarea
                        value={editForm.template || ''}
                        onChange={(e) => setEditForm({ ...editForm, template: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <input
                        type="text"
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => updatePrompt(prompt.id)} size="sm">
                        <Save className="w-4 h-4" />
                        Save
                      </Button>
                      <Button onClick={cancelEdit} size="sm" className="bg-gray-500">
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{prompt.name}</h3>
                          {!prompt.is_active && (
                            <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Inactive</span>
                          )}
                        </div>
                        {prompt.description && (
                          <p className="text-sm text-gray-600 mb-2">{prompt.description}</p>
                        )}
                        <div className="bg-white bg-opacity-50 p-3 rounded border">
                          <pre className="text-sm font-mono whitespace-pre-wrap break-words">{prompt.template}</pre>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          onClick={() => testPromptTemplate(prompt.template)} 
                          size="sm" 
                          variant="outline"
                          title="Test with sample data"
                        >
                          <TestTube className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => startEdit(prompt)} size="sm" variant="outline">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => toggleActive(prompt)} 
                          size="sm" 
                          variant="outline"
                          title={prompt.is_active ? 'Disable' : 'Enable'}
                        >
                          {prompt.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button onClick={() => deletePrompt(prompt.id)} size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Test Result */}
      {testResult && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">Test Result</h3>
            <Button onClick={() => setTestResult('')} size="sm" variant="outline">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="bg-white p-4 rounded border">
            <pre className="text-sm whitespace-pre-wrap break-words">{testResult}</pre>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Variables replaced with sample data: petType=dog, breed=Golden Retriever, detectedColors=golden fur with white patches, style=Watercolor
          </p>
        </Card>
      )}

      {/* Usage Guide */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2">Variable System</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>Available variables you can use in templates:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><code className="bg-white px-2 py-0.5 rounded">&#123;petType&#125;</code> - Type of pet (dog, cat, etc.)</li>
            <li><code className="bg-white px-2 py-0.5 rounded">&#123;breed&#125;</code> - Breed identified by Qwen</li>
            <li><code className="bg-white px-2 py-0.5 rounded">&#123;detectedColors&#125;</code> - Colors detected by Qwen</li>
            <li><code className="bg-white px-2 py-0.5 rounded">&#123;style&#125;</code> - Selected style name</li>
            <li><code className="bg-white px-2 py-0.5 rounded">&#123;userPrompt&#125;</code> - User's custom input</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
