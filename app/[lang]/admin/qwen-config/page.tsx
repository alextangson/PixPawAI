'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, RotateCcw, TestTube2 } from 'lucide-react'

interface QwenConfig {
  temperature: number
  max_tokens: number
  top_p: number
  system_prompt: string
  features: {
    heterochromia_detection: boolean
    breed_recognition: boolean
    pattern_analysis: boolean
    multiple_pets: boolean
  }
}

export default function QwenConfigPage() {
  const [config, setConfig] = useState<QwenConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    try {
      const response = await fetch('/api/admin/qwen-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveConfig() {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/qwen-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        setHasChanges(false)
        alert('Configuration saved successfully!')
      } else {
        alert('Failed to save configuration')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  function resetToDefaults() {
    if (!confirm('Are you sure you want to reset to default configuration?')) return

    setConfig({
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 0.9,
      system_prompt: 'You are a pet image analysis expert. Your task is to analyze pet images and provide detailed, accurate information about the pet\'s appearance, breed, colors, patterns, and notable features.',
      features: {
        heterochromia_detection: true,
        breed_recognition: true,
        pattern_analysis: true,
        multiple_pets: false
      }
    })
    setHasChanges(true)
  }

  function updateConfig(updates: Partial<QwenConfig>) {
    setConfig(prev => prev ? { ...prev, ...updates } : null)
    setHasChanges(true)
  }

  function updateFeature(feature: keyof QwenConfig['features'], value: boolean) {
    if (!config) return
    setConfig({
      ...config,
      features: {
        ...config.features,
        [feature]: value
      }
    })
    setHasChanges(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-coral"></div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load configuration</p>
        <Button onClick={fetchConfig} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Qwen Configuration</h1>
          <p className="text-gray-600">Configure AI model parameters and analysis features</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={resetToDefaults} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveConfig} 
            disabled={!hasChanges || saving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            You have unsaved changes. Click "Save Changes" to apply them.
          </p>
        </div>
      )}

      {/* Model Parameters */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Model Parameters</h2>
        <div className="space-y-6">
          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Temperature</label>
              <span className="text-sm text-gray-600">{config.temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.temperature}
              onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-1">
              Controls randomness. Lower values (0.1-0.3) are more focused and deterministic, higher values (0.7-1.0) are more creative and diverse.
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Max Tokens</label>
              <span className="text-sm text-gray-600">{config.max_tokens}</span>
            </div>
            <input
              type="range"
              min="500"
              max="2000"
              step="100"
              value={config.max_tokens}
              onChange={(e) => updateConfig({ max_tokens: parseInt(e.target.value) })}
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-1">
              Maximum length of the AI's response. Higher values allow more detailed analysis but cost more.
            </p>
          </div>

          {/* Top P */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Top P</label>
              <span className="text-sm text-gray-600">{config.top_p.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={config.top_p}
              onChange={(e) => updateConfig({ top_p: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-sm text-gray-600 mt-1">
              Nucleus sampling threshold. 0.9 means consider tokens that make up 90% of the probability mass.
            </p>
          </div>
        </div>
      </Card>

      {/* System Prompt */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">System Prompt</h2>
        <textarea
          value={config.system_prompt}
          onChange={(e) => updateConfig({ system_prompt: e.target.value })}
          className="w-full px-4 py-3 border rounded-lg font-mono text-sm"
          rows={6}
          placeholder="Enter the system prompt that defines how Qwen should analyze pet images..."
        />
        <p className="text-sm text-gray-600 mt-2">
          This prompt defines the AI's role and behavior. Be specific about what information you want it to extract.
        </p>
      </Card>

      {/* Analysis Features */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Analysis Features</h2>
        <div className="space-y-4">
          <FeatureToggle
            label="Heterochromia Detection"
            description="Detect and analyze different colored eyes"
            enabled={config.features.heterochromia_detection}
            onChange={(value) => updateFeature('heterochromia_detection', value)}
          />
          <FeatureToggle
            label="Breed Recognition"
            description="Identify pet breed from the image"
            enabled={config.features.breed_recognition}
            onChange={(value) => updateFeature('breed_recognition', value)}
          />
          <FeatureToggle
            label="Pattern Analysis"
            description="Analyze fur patterns (stripes, spots, etc.)"
            enabled={config.features.pattern_analysis}
            onChange={(value) => updateFeature('pattern_analysis', value)}
          />
          <FeatureToggle
            label="Multiple Pets (Experimental)"
            description="Detect and analyze multiple pets in one image"
            enabled={config.features.multiple_pets}
            onChange={(value) => updateFeature('multiple_pets', value)}
            experimental
          />
        </div>
      </Card>

      {/* Test Configuration */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <TestTube2 className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold mb-2">Test Configuration</h3>
            <p className="text-sm text-gray-700 mb-4">
              To test your configuration changes, go to the <strong>Test Lab</strong> and upload a test image. 
              The system will use these settings for the analysis.
            </p>
            <a 
              href="/en/admin/test-lab"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <TestTube2 className="w-4 h-4" />
              Go to Test Lab
            </a>
          </div>
        </div>
      </Card>

      {/* Important Notes */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold mb-2">Important Notes</h3>
        <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
          <li>Changes take effect immediately for new generations</li>
          <li>Lowering temperature makes responses more consistent but less creative</li>
          <li>Increasing max tokens will increase API costs</li>
          <li>Disabling features will speed up analysis but may miss important details</li>
          <li>Always test configuration changes before deploying to production</li>
        </ul>
      </Card>
    </div>
  )
}

function FeatureToggle({ 
  label, 
  description, 
  enabled, 
  onChange, 
  experimental = false 
}: {
  label: string
  description: string
  enabled: boolean
  onChange: (value: boolean) => void
  experimental?: boolean
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{label}</span>
          {experimental && (
            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
              Experimental
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 ml-4 ${
          enabled ? 'bg-coral' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
