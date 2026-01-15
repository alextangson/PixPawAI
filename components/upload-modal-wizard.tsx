'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Loader2, CheckCircle, ArrowLeft, Image as ImageIcon, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STYLES } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { uploadUserImage } from '@/lib/supabase/storage'
import type { User } from '@supabase/supabase-js'

interface UploadModalWizardProps {
  isOpen: boolean
  onClose: () => void
  selectedStyle?: string | null
}

type Step = 'upload' | 'configure' | 'generating' | 'success'

export function UploadModalWizard({ isOpen, onClose, selectedStyle: initialStyle }: UploadModalWizardProps) {
  // State
  const [step, setStep] = useState<Step>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [userPrompt, setUserPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string>(initialStyle || '')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string>('')
  const [errorType, setErrorType] = useState<'credits' | 'storage' | 'api' | 'general'>('general')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    if (isOpen) {
      checkUser()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation
      setTimeout(() => {
        setStep('upload')
        setUploadedFile(null)
        setPreviewUrl('')
        setUserPrompt('')
        setSelectedStyle(initialStyle || '')
        setError('')
        setErrorType('general')
        setGeneratedImageUrl('')
      }, 300)
    }
  }, [isOpen, initialStyle])

  if (!isOpen) return null

  // ============================================
  // STEP A: UPLOAD
  // ============================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    setUploadedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError('')
    
    // Auto-advance to configure step
    setStep('configure')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as any
      handleFileSelect(fakeEvent)
    }
  }

  // ============================================
  // STEP B: CONFIGURE - Generate Logic
  // ============================================
  const handleGenerate = async () => {
    if (!user) {
      // Guest user - redirect to sign in
      window.location.href = '/en'
      return
    }

    if (!uploadedFile || !selectedStyle || !userPrompt.trim()) {
      setError('Please complete all fields')
      return
    }

    setStep('generating')
    setError('')

    try {
      // 1. Upload image to Supabase Storage
      const uploadResult = await uploadUserImage(uploadedFile, user.id)

      if ('error' in uploadResult) {
        throw new Error(uploadResult.error)
      }

      // 2. Call generation API (prompt construction happens on server)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: uploadResult.url,
          style: selectedStyle,
          prompt: userPrompt.trim(),
          petType: 'pet',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 402) {
          setErrorType('credits')
          throw new Error('Insufficient credits')
        }
        if (result.error?.includes('storage') || result.error?.includes('upload')) {
          setErrorType('storage')
        } else if (result.error?.includes('API') || result.error?.includes('Replicate')) {
          setErrorType('api')
        }
        throw new Error(result.error || result.message || 'Generation failed')
      }

      // 5. Success
      setGeneratedImageUrl(result.outputUrl)
      setRemainingCredits(result.remainingCredits)
      setStep('success')

    } catch (err: any) {
      console.error('Generation error:', err)
      setError(err.message || 'Failed to generate image')
      // 如果不是 credits 错误，回到 configure 步骤
      if (errorType !== 'credits') {
        setStep('configure')
      } else {
        // Credits 不足，停留在 generating 步骤显示充值提示
        setStep('configure')
      }
    }
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {step === 'configure' && (
              <button
                onClick={() => setStep('upload')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 'upload' && 'Upload Your Photo'}
                {step === 'configure' && 'Configure Your Portrait'}
                {step === 'generating' && 'Creating Your Portrait...'}
                {step === 'success' && 'Your Portrait is Ready!'}
              </h2>
              <p className="text-sm text-gray-600">
                {step === 'upload' && 'Start by uploading a photo of your pet'}
                {step === 'configure' && 'Customize the style and prompt'}
                {step === 'generating' && 'This may take 10-30 seconds...'}
                {step === 'success' && `${remainingCredits} credits remaining`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={step === 'generating'}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Display */}
          {error && (
            <div className={`mb-6 rounded-xl p-6 ${
              errorType === 'credits' 
                ? 'bg-orange-50 border border-orange-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-4">
                {errorType === 'credits' ? (
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-orange-600" />
                  </div>
                ) : (
                  <X className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                )}
                
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-2 ${
                    errorType === 'credits' ? 'text-orange-900' : 'text-red-900'
                  }`}>
                    {errorType === 'credits' && 'Credits Required'}
                    {errorType === 'storage' && 'Storage Error'}
                    {errorType === 'api' && 'AI Service Error'}
                    {errorType === 'general' && 'Generation Failed'}
                  </h3>
                  
                  <p className={`text-sm mb-4 ${
                    errorType === 'credits' ? 'text-orange-700' : 'text-red-700'
                  }`}>
                    {error}
                  </p>

                  {/* Credits 错误 - 显示充值按钮 */}
                  {errorType === 'credits' && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <p className="text-sm text-gray-700 mb-3">
                          💡 <strong>Good news:</strong> You can purchase more credits to continue creating amazing portraits!
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => window.location.href = '/en/pricing'}
                            className="flex-1 bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            View Pricing Plans
                          </Button>
                          <Button
                            onClick={() => {
                              setError('')
                              setErrorType('general')
                            }}
                            variant="outline"
                            className="px-4"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Storage 错误 - 显示帮助 */}
                  {errorType === 'storage' && (
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-gray-700">
                        <strong>Possible causes:</strong>
                      </p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1 ml-4">
                        <li>• Storage buckets not configured properly</li>
                        <li>• File size too large (&gt;10MB)</li>
                        <li>• Network connection issue</li>
                      </ul>
                      <Button
                        onClick={() => {
                          setError('')
                          setStep('upload')
                        }}
                        className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* API 错误 - 显示重试 */}
                  {errorType === 'api' && (
                    <div className="bg-white rounded-lg p-4 border border-red-200">
                      <p className="text-sm text-gray-700 mb-3">
                        The AI service encountered an error. This is usually temporary.
                      </p>
                      <Button
                        onClick={handleGenerate}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        Retry Generation
                      </Button>
                    </div>
                  )}

                  {/* 一般错误 - 显示重试 */}
                  {errorType === 'general' && (
                    <Button
                      onClick={() => {
                        setError('')
                        setStep('upload')
                      }}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Start Over
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP A: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative border-2 border-dashed border-gray-300 rounded-2xl p-12 hover:border-coral hover:bg-coral/5 transition-all cursor-pointer group"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4 group-hover:text-coral transition-colors" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Drop your pet's photo here
                  </h3>
                  <p className="text-gray-600 mb-4">
                    or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG up to 10MB
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📸 Tips for best results:</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Clear, well-lit photos work best</li>
                  <li>• Face should be visible and in focus</li>
                  <li>• Avoid blurry or dark images</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP B: CONFIGURE */}
          {step === 'configure' && (
            <div className="space-y-6">
              {/* Preview Thumbnail */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{uploadedFile?.name}</p>
                  <p className="text-sm text-gray-600">
                    {uploadedFile && (uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-sm text-coral hover:bg-coral/10 rounded-lg transition-colors font-medium"
                >
                  Change
                </button>
              </div>

              {/* User Prompt */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  What do you want to see?
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g., a majestic portrait of my golden retriever"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral transition-all resize-none"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Describe what you'd like to see in your portrait
                </p>
              </div>

              {/* Style Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Choose a Style
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-3 transition-all ${
                        selectedStyle === style.id
                          ? 'border-coral ring-2 ring-coral/50 scale-105'
                          : 'border-gray-200 hover:border-coral/50'
                      }`}
                    >
                      <img
                        src={style.src}
                        alt={style.label}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 flex items-end p-2 bg-gradient-to-t from-black/60 to-transparent ${
                        selectedStyle === style.id ? 'from-coral/60' : ''
                      }`}>
                        <span className="text-xs font-semibold text-white">
                          {style.label}
                        </span>
                      </div>
                      {selectedStyle === style.id && (
                        <div className="absolute top-2 right-2 bg-coral text-white rounded-full p-1">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP C: GENERATING */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-coral animate-spin" />
                <Sparkles className="w-8 h-8 text-orange-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">
                Creating your masterpiece...
              </h3>
              <p className="text-gray-600 text-center max-w-md">
                Our AI is transforming your pet into beautiful art. This usually takes 10-30 seconds.
              </p>
              
              {/* Progress Steps */}
              <div className="mt-8 space-y-3 w-full max-w-md">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Image uploaded</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Loader2 className="w-5 h-5 text-coral animate-spin" />
                  <span>AI processing...</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  <span>Finalizing results</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP D: SUCCESS */}
          {step === 'success' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Your Portrait is Ready! 🎉
                </h3>
                <p className="text-gray-600">
                  {remainingCredits} credits remaining
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden border-2 border-gray-200">
                <img
                  src={generatedImageUrl}
                  alt="Generated portrait"
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => window.open(generatedImageUrl, '_blank')}
                  className="flex-1 bg-coral hover:bg-orange-600 text-white font-semibold"
                >
                  Download
                </Button>
                <Button
                  onClick={() => {
                    setStep('upload')
                    setUploadedFile(null)
                    setPreviewUrl('')
                    setUserPrompt('')
                    setGeneratedImageUrl('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Create Another
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Generate Button (only show in configure step) */}
        {step === 'configure' && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Button
              onClick={handleGenerate}
              disabled={!userPrompt.trim() || !selectedStyle}
              className="w-full bg-coral hover:bg-orange-600 text-white font-semibold h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user ? (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Portrait
                </>
              ) : (
                <>
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Sign in to Generate (5 Free Credits)
                </>
              )}
            </Button>
            {!user && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Create an account to start generating
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
