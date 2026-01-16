'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Loader2, CheckCircle, ArrowLeft, Image as ImageIcon, Sparkles, Grid3x3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { STYLES } from '@/lib/styles'
import { createClient } from '@/lib/supabase/client'
import { uploadUserImage } from '@/lib/supabase/storage'
import type { User } from '@supabase/supabase-js'
import NextImage from 'next/image'
import { ResultModal } from '@/components/result-modal'

interface UploadModalWizardProps {
  isOpen: boolean
  onClose: () => void
  selectedStyle?: string | null
}

type Step = 'upload' | 'configure' | 'generating' | 'success'

export function UploadModalWizard({ isOpen, onClose, selectedStyle: initialStyle }: UploadModalWizardProps) {
  const router = useRouter()
  
  // State
  const [step, setStep] = useState<Step>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string>(initialStyle || '')
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string>('')
  const [errorType, setErrorType] = useState<'credits' | 'storage' | 'api' | 'general'>('general')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [messageIndex, setMessageIndex] = useState<number>(0)
  const [strength, setStrength] = useState<number>(0.92) // Image preservation strength (0.1-1.0) - Very high to preserve exact animal features
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [aspectRatio, setAspectRatio] = useState<string>('1:1') // Aspect ratio selection
  const [generationId, setGenerationId] = useState<string>('')

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
        setProgress(0)
        setMessageIndex(0)
        setStrength(0.95)
        setShowAdvanced(false)
        setAspectRatio('1:1')
        setGenerationId('')
        // Note: Share-related states removed (now handled by ResultModal)
      }, 300)
    }
  }, [isOpen, initialStyle])

  // Fun messages to rotate during generation
  const funMessages = [
    '🎨 AI is mixing the colors...',
    '🐶 Teaching the dog to pose...',
    '✨ Adding some Pixar magic...',
    '🦴 Fetching the pixels...',
    '🖌️ Almost there, applying final touches...',
  ]

  // Animate progress bar from 0% to 90% over 25 seconds
  useEffect(() => {
    if (step !== 'generating') {
      setProgress(0)
      setMessageIndex(0)
      return
    }

    // Start progress animation: 90% over 25 seconds = 3.6% per second
    // Update every 100ms, so increment by 0.36% per interval
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.36
        if (next >= 90) {
          return 90
        }
        return next
      })
    }, 100) // Update every 100ms for smooth animation

    // Rotate messages every 3.5 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % funMessages.length)
    }, 3500)

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [step, funMessages.length])

  // Jump to 100% when generation completes
  useEffect(() => {
    if (step === 'success' && progress < 100) {
      setProgress(100)
    }
  }, [step, progress])

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
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setError('')
    
    // Get image dimensions (use window.Image to avoid conflict with Next.js Image component)
    const img = new window.Image()
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height })
      // Auto-advance to configure step
      setStep('configure')
    }
    img.onerror = () => {
      setError('Failed to load image')
    }
    img.src = objectUrl
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

    if (!uploadedFile || !selectedStyle) {
      setError('Please upload a photo and select a style')
      return
    }
    
    // Default prompt if user leaves it empty
    const finalUserPrompt = userPrompt.trim() || 'my pet'

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
          prompt: finalUserPrompt,  // Use finalUserPrompt (defaults to 'my pet' if empty)
          petType: 'pet',
          aspectRatio: aspectRatio,
          strength: strength,
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

      // 5. Success - jump progress to 100%
      setProgress(100)
      setGeneratedImageUrl(result.outputUrl)
      setRemainingCredits(result.remainingCredits)
      setGenerationId(result.generationId || '')
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className={`bg-white shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col ${
        step === 'success' ? 'max-w-6xl h-[85vh] rounded-none' : 'max-w-3xl rounded-3xl p-4'
      }`}>
        {/* Header */}
        {step !== 'success' && (
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
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {step === 'upload' && 'Upload Your Photo'}
                {step === 'configure' && 'Configure Your Portrait'}
                {step === 'generating' && 'Creating Your Portrait...'}
                {step === 'success' && 'Your Portrait is Ready!'}
              </h2>
              <p className="text-sm text-gray-600 font-sans">
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
        )}

        {/* Content */}
        <div className={`flex-1 overflow-hidden ${step === 'success' ? '' : 'overflow-y-auto p-6'}`}>
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
                  Describe your pet <span className="text-xs text-gray-500 font-normal">(Optional - AI will reference your photo)</span>
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g., my fluffy white dog, my orange cat, my pet rabbit... (Keep it simple - the AI will preserve your pet's exact appearance from the photo!)"
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
                  
                  {/* More Styles Button */}
                  <button
                    onClick={() => {
                      onClose()
                      router.push('/en/gallery')
                    }}
                    className="relative aspect-square rounded-xl overflow-hidden border-3 border-dashed border-gray-300 hover:border-coral/50 transition-all bg-gradient-to-br from-gray-50 to-gray-100 hover:from-coral/5 hover:to-coral/10"
                  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <Grid3x3 className="w-6 h-6 text-gray-400" />
                      <span className="text-xs font-semibold text-gray-600">
                        More Styles
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Output Aspect Ratio
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: '1:1', label: 'Square', dimensions: '1024×1024', icon: '⬜' },
                    { id: '3:4', label: 'Portrait', dimensions: '768×1024', badge: 'Best for Print', icon: '📄' },
                    { id: '9:16', label: 'Vertical', dimensions: '576×1024', badge: 'Wallpaper', icon: '📱' },
                    { id: '4:3', label: 'Landscape', dimensions: '1024×768', icon: '🖼️' },
                    { id: '16:9', label: 'Cinematic', dimensions: '1024×576', icon: '🎬' },
                  ].map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`relative p-3 rounded-xl border-2 transition-all ${
                        aspectRatio === ratio.id
                          ? 'border-coral bg-coral/10 ring-2 ring-coral/30'
                          : 'border-gray-200 hover:border-coral/50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl mb-1">{ratio.icon}</div>
                        <div className="text-xs font-semibold text-gray-900">{ratio.label}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{ratio.id}</div>
                        {ratio.badge && (
                          <div className="mt-1 text-[9px] font-bold text-coral bg-coral/10 rounded px-1 py-0.5">
                            {ratio.badge}
                          </div>
                        )}
                      </div>
                      {aspectRatio === ratio.id && (
                        <div className="absolute top-1 right-1 bg-coral text-white rounded-full p-0.5">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Choose the aspect ratio that best fits your needs. Dimensions are optimized for AI generation.
                </p>
              </div>

              {/* Advanced Settings */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-sm font-semibold text-gray-700">
                    ⚙️ Advanced Settings
                  </span>
                  <span className="text-gray-400 text-sm">
                    {showAdvanced ? '▼' : '▶'}
                  </span>
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-3">
                    <div>
                      <label className="flex items-center justify-between text-sm font-medium text-gray-700 mb-2">
                        <span>Image Similarity</span>
                        <span className="text-coral font-bold">{Math.round(strength * 100)}%</span>
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={strength}
                        onChange={(e) => setStrength(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coral"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>More Creative</span>
                        <span>More Similar</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 bg-blue-50 rounded-lg p-2 border border-blue-100">
                      💡 <strong>Recommended:</strong> 90-95% to keep your pet's exact appearance. Lower values (70-85%) allow more artistic interpretation but may change features.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP C: GENERATING */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              {/* Progress Bar */}
              <div className="w-full max-w-md space-y-4">
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-coral to-orange-600 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-2xl font-serif font-bold text-gray-900">{Math.round(progress)}%</p>
                  <p className="text-lg text-gray-700 mt-2 min-h-[28px] font-sans">
                    {funMessages[messageIndex]}
                  </p>
                  {/* Show selected aspect ratio */}
                  <div className="mt-3 inline-flex items-center gap-2 bg-coral/10 text-coral px-3 py-1.5 rounded-full text-sm font-medium">
                    <span>Creating in {aspectRatio} format</span>
                  </div>
                </div>
              </div>

              {/* Original Image with Magic Effect */}
              <div className="w-full max-w-md rounded-2xl overflow-hidden border-2 border-coral/30 shadow-xl">
                <div 
                  className="relative overflow-hidden"
                  style={{
                    aspectRatio: aspectRatio === '1:1' ? '1/1' : 
                                aspectRatio === '3:4' ? '3/4' : 
                                aspectRatio === '9:16' ? '9/16' : 
                                aspectRatio === '4:3' ? '4/3' : 
                                aspectRatio === '16:9' ? '16/9' : '1/1'
                  }}
                >
                  {/* User's Original Photo */}
                  <img 
                    src={previewUrl} 
                    alt="Your pet" 
                    className="w-full h-full object-cover opacity-70"
                  />
                  
                  {/* Magic Overlay Effect - Animated Scan */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-coral/30 to-transparent animate-shimmer" 
                       style={{
                         backgroundSize: '200% 100%',
                         animation: 'shimmer 2s infinite'
                       }}
                  />
                  
                  {/* Sparkle Particles */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" />
                    <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-coral rounded-full animate-ping" style={{ animationDelay: '0.6s' }} />
                    <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.9s' }} />
                  </div>
                  
                  {/* Center Icon with Glow */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-coral rounded-full blur-xl opacity-60 animate-pulse" />
                      <Sparkles className="w-16 h-16 text-white relative z-10 animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add keyframe animation for shimmer */}
              <style jsx>{`
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
                .animate-shimmer {
                  animation: shimmer 2s infinite;
                  background: linear-gradient(
                    90deg,
                    transparent 0%,
                    rgba(255, 140, 66, 0.3) 50%,
                    transparent 100%
                  );
                  background-size: 200% 100%;
                }
              `}</style>

              {/* Warning Text */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-md">
                <p className="text-sm text-amber-800 text-center">
                  ⚠️ <strong>Please keep this tab open.</strong> Good art takes time!
                </p>
              </div>
            </div>
          )}

          {/* STEP D: SUCCESS - Gallery Reveal (NEW COMPONENT) */}
          {step === 'success' && generatedImageUrl && generationId && (
            <ResultModal
              isOpen={true}
              onClose={onClose}
              generatedImageUrl={generatedImageUrl}
              generationId={generationId}
              remainingCredits={remainingCredits}
              isRewarded={false}
              onShareSuccess={() => {
                // Refresh credits or update UI if needed
                console.log('✅ Share successful')
              }}
            />
          )}
        </div>

        {/* Footer - Generate Button (only show in configure step) */}
        {step === 'configure' && (
          <div className="border-t border-gray-200 px-6 py-4">
            <Button
              onClick={handleGenerate}
              disabled={!selectedStyle}
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
