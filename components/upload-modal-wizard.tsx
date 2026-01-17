'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Loader2, CheckCircle, ArrowLeft, Image as ImageIcon, Sparkles, Grid3x3, LogIn, AlertCircle, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { STYLES } from '@/lib/styles'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { uploadUserImage } from '@/lib/supabase/storage'
import type { User } from '@supabase/supabase-js'
import NextImage from 'next/image'
import { ResultModal } from '@/components/result-modal'
import { LoginButton } from '@/components/auth/login-button'

interface UploadModalWizardProps {
  isOpen: boolean
  onClose: () => void
  selectedStyle?: string | null
}

type Step = 'upload' | 'quality-check' | 'configure' | 'generating'

interface QualityCheckResult {
  hasPet: boolean
  petType: string // 'dog' | 'cat' | 'other'
  quality: 'excellent' | 'good' | 'poor' | 'unusable'
  issues: string[]
  hasHeterochromia: boolean
  heterochromiaDetails: string
  breed: string
  complexPattern: boolean
  multiplePets: number
  detectedColors: string
}

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
  const [errorType, setErrorType] = useState<'credits' | 'storage' | 'api' | 'general' | 'auth'>('general')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [messageIndex, setMessageIndex] = useState<number>(0)
  const [strength, setStrength] = useState<number>(0.92) // Image preservation strength (0.1-1.0) - Very high to preserve exact animal features
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [aspectRatio, setAspectRatio] = useState<string>('1:1') // Aspect ratio selection
  const [generationId, setGenerationId] = useState<string>('')
  
  // New states for quality check and pet name
  const [petName, setPetName] = useState<string>('')
  const [qualityCheckResult, setQualityCheckResult] = useState<QualityCheckResult | null>(null)
  const [showQualityWarning, setShowQualityWarning] = useState(false)
  const [isCheckingQuality, setIsCheckingQuality] = useState(false)

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
        setStrength(0.92) // Default to 92% for optimal quality
        setShowAdvanced(false)
        setAspectRatio('1:1')
        setGenerationId('')
        setPetName('')
        setQualityCheckResult(null)
        setShowQualityWarning(false)
        setIsCheckingQuality(false)
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
  
  // Aspect ratio options with visual icons
  const aspectRatios = [
    {
      value: '1:1',
      label: 'Square',
      dimensions: '1024×1024',
      icon: 'w-8 h-8',
      style: { width: '32px', height: '32px' }
    },
    {
      value: '9:16',
      label: 'Portrait',
      dimensions: '768×1344',
      icon: 'w-6 h-9',
      style: { width: '24px', height: '36px' }
    },
    {
      value: '16:9',
      label: 'Landscape',
      dimensions: '1344×768',
      icon: 'w-9 h-6',
      style: { width: '36px', height: '24px' }
    },
    {
      value: '4:5',
      label: 'Instagram',
      dimensions: '1024×1280',
      icon: 'w-7 h-9',
      style: { width: '28px', height: '35px' }
    }
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

  // Progress is managed by handleGenerate function during generation

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
      // Advance to quality-check step instead of configure
      setStep('quality-check')
      // Trigger quality check
      performQualityCheck(objectUrl)
    }
    img.onerror = () => {
      setError('Failed to load image')
    }
    img.src = objectUrl
  }
  
  // Quality check function
  const performQualityCheck = async (imageUrl: string) => {
    setIsCheckingQuality(true)
    setShowQualityWarning(false)
    
    try {
      // Upload image to get public URL for Qwen
      if (!user) {
        // Skip quality check if not logged in, proceed to configure
        setTimeout(() => {
          setStep('configure')
        }, 500)
        return
      }
      
      const uploadResult = await uploadUserImage(uploadedFile!, user.id)
      
      if ('error' in uploadResult) {
        throw new Error('Failed to upload image for analysis')
      }
      
      // Call Qwen quality check API
      const response = await fetch('/api/check-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadResult.url })
      })
      
      if (!response.ok) {
        throw new Error('Quality check failed')
      }
      
      const result: QualityCheckResult = await response.json()
      setQualityCheckResult(result)
      setIsCheckingQuality(false)
      
      // Auto-proceed if quality is good/excellent
      if (result.quality === 'excellent' || result.quality === 'good') {
        setTimeout(() => {
          setStep('configure')
        }, 1500) // Short delay to show success
      } else {
        // Show warning for poor/unusable quality
        setShowQualityWarning(true)
      }
    } catch (error) {
      console.error('Quality check error:', error)
      setIsCheckingQuality(false)
      // On error, proceed anyway
      setTimeout(() => {
        setStep('configure')
      }, 1000)
    }
  }
  
  // Handle user decision to continue despite quality warning
  const handleContinueAnyway = () => {
    setShowQualityWarning(false)
    setStep('configure')
  }
  
  // Handle reupload
  const handleReupload = () => {
    setStep('upload')
    setUploadedFile(null)
    setPreviewUrl('')
    setQualityCheckResult(null)
    setShowQualityWarning(false)
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
    if (!uploadedFile || !selectedStyle) {
      setError('Please upload a photo and select a style')
      return
    }

    if (!user) {
      // Guest user - show error prompting to log in
      setError('You need to log in to create your AI pet portrait. Your uploaded photo will be saved!')
      setErrorType('auth')
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
          petName: petName.trim(), // Pet name for Art Card title
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
      // Success: ResultModal will be shown based on generatedImageUrl and generationId

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
      <div className="bg-white shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col max-w-3xl rounded-3xl p-4">
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
              <h2 className="text-2xl font-serif font-bold text-gray-900">
                {step === 'upload' && 'Upload Your Photo'}
                {step === 'quality-check' && 'Checking Photo Quality'}
                {step === 'configure' && 'Configure Your Portrait'}
                {step === 'generating' && 'Creating Your Portrait...'}
              </h2>
              <p className="text-sm text-gray-600 font-sans">
                {step === 'upload' && 'Start by uploading a photo of your pet'}
                {step === 'quality-check' && 'Making sure your photo is ready for the best results'}
                {step === 'configure' && 'Customize the style and prompt'}
                {step === 'generating' && 'This may take 10-30 seconds...'}
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
        <div className="flex-1 overflow-hidden overflow-y-auto p-6">
          {/* Error Display */}
          {error && (
            <div className={`mb-6 rounded-xl p-6 ${
              errorType === 'credits' 
                ? 'bg-orange-50 border border-orange-200' 
                : errorType === 'auth'
                ? 'bg-blue-50 border border-blue-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-4">
                {errorType === 'credits' ? (
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-orange-600" />
                  </div>
                ) : errorType === 'auth' ? (
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-blue-600" />
                  </div>
                ) : (
                  <X className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                )}
                
                <div className="flex-1">
                  <h3 className={`font-bold text-lg mb-2 ${
                    errorType === 'credits' ? 'text-orange-900' : errorType === 'auth' ? 'text-blue-900' : 'text-red-900'
                  }`}>
                    {errorType === 'credits' && 'Credits Required'}
                    {errorType === 'auth' && 'Login Required 🔐'}
                    {errorType === 'storage' && 'Storage Error'}
                    {errorType === 'api' && 'AI Service Error'}
                    {errorType === 'general' && 'Generation Failed'}
                  </h3>
                  
                  <p className={`text-sm mb-4 ${
                    errorType === 'credits' ? 'text-orange-700' : errorType === 'auth' ? 'text-blue-700' : 'text-red-700'
                  }`}>
                    {error}
                  </p>

                  {/* Auth 错误 - 显示登录按钮 */}
                  {errorType === 'auth' && (
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-gray-700 mb-3">
                          ✨ <strong>Why log in?</strong> Save your creations, get 2 free credits, and access all your portraits anytime!
                        </p>
                        <div className="flex gap-2">
                          <LoginButton redirectTo={typeof window !== 'undefined' ? window.location.pathname + '#upload' : '/#upload'}>
                            <Button
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                            >
                              <LogIn className="w-4 h-4 mr-2" />
                              Log In to Continue
                            </Button>
                          </LoginButton>
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

          {/* STEP A.5: QUALITY CHECK */}
          {step === 'quality-check' && (
            <div className="space-y-6">
              {/* Checking State */}
              {isCheckingQuality && (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="w-12 h-12 text-coral animate-spin mb-4" />
                  <p className="text-lg font-medium text-gray-900">Analyzing your pet photo...</p>
                  <p className="text-sm text-gray-500 mt-1">This takes just 3-5 seconds</p>
                </div>
              )}

              {/* Quality Check Failed/Warning */}
              {!isCheckingQuality && showQualityWarning && qualityCheckResult && (
                <div className="max-w-md mx-auto p-6">
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
                    <div className="text-center mb-4">
                      <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-amber-900">
                        Photo Quality Needs Improvement
                      </h3>
                    </div>
                    
                    <div className="mb-4">
                      <img src={previewUrl} className="rounded-lg opacity-60 w-full" alt="Preview" />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="font-semibold text-amber-900">Detected Issues:</p>
                      {qualityCheckResult.issues.map((issue, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span>
                            {issue === 'blurry' && 'Photo is blurry - hard to see details'}
                            {issue === 'too_small' && 'Pet is too small in frame (less than 30%)'}
                            {issue === 'poor_lighting' && 'Lighting is too dark or overexposed'}
                            {issue === 'obstructed' && 'Pet face is blocked (sunglasses, hat, etc.)'}
                            {issue === 'no_pet' && 'No pet detected in this photo'}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-4 mb-4">
                      <p className="font-semibold text-blue-900 mb-2">💡 Tips for Better Results:</p>
                      <ul className="text-sm space-y-1 text-blue-800">
                        <li>✓ Good lighting (natural light works best)</li>
                        <li>✓ Pet takes up 50%+ of the frame</li>
                        <li>✓ Eyes are clearly visible</li>
                        <li>✓ Sharp focus (not blurry)</li>
                      </ul>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button onClick={handleReupload} className="flex-1">
                        📷 Upload Better Photo
                      </Button>
                      <Button 
                        onClick={handleContinueAnyway} 
                        variant="outline"
                        className="flex-1"
                      >
                        ⚠️ Continue Anyway
                      </Button>
                    </div>
                    
                    <p className="text-xs text-amber-700 mt-2 text-center">
                      ⚠️ Continuing will use 1 credit, but results may be poor
                    </p>
                  </div>
                </div>
              )}

              {/* Quality Check Success (Auto-proceeding) */}
              {!isCheckingQuality && !showQualityWarning && qualityCheckResult && (
                <div className="flex flex-col items-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-medium text-gray-900">Photo looks great!</p>
                  <p className="text-sm text-gray-500 mt-1">Proceeding to configuration...</p>
                </div>
              )}
            </div>
          )}

          {/* STEP B: CONFIGURE - Double Column Layout */}
          {step === 'configure' && (
            <div className="flex flex-col lg:flex-row h-full min-h-[600px] -m-6">
              
              {/* LEFT PANEL: Image Preview + Pet Name (50%) */}
              <div className="lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-8 flex flex-col items-center justify-center">
                
                {/* Image Preview */}
                <div className="relative w-full max-w-md mb-6">
                  <img 
                    src={previewUrl} 
                    className="rounded-2xl shadow-2xl w-full"
                    alt="Your pet"
                  />
                  
                  {/* Size Label */}
                  {imageDimensions && (
                    <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {imageDimensions.width} × {imageDimensions.height}
                    </div>
                  )}
                  
                  {/* Change Photo Button */}
                  <button
                    onClick={() => setStep('upload')}
                    className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg"
                  >
                    Change Photo
                  </button>
                </div>
                
                {/* Heterochromia Detection Alert (if detected) */}
                {qualityCheckResult?.hasHeterochromia && (
                  <div className="w-full max-w-md mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Eye className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 text-sm">
                          AI Detected: Heterochromia
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {qualityCheckResult.heterochromiaDetails}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          💡 Tip: Use 95% strength for best preservation
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Pet Name Input */}
                <div className="w-full max-w-md">
                  <label className="block mb-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      🐾 Your Pet's Name
                      <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </span>
                  </label>
                  <Input
                    value={petName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPetName(e.target.value)}
                    placeholder="e.g., Max, Luna, Bella..."
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 This name will appear on your art card
                  </p>
                </div>
              </div>
              
              {/* RIGHT PANEL: Style + Configuration (50%) */}
              <div className="lg:w-1/2 bg-white p-6 lg:p-8 overflow-y-auto max-h-[600px]">
                
                {/* Style Selector */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Choose a Style</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={cn(
                          "relative rounded-xl overflow-hidden border-2 transition-all aspect-square",
                          selectedStyle === style.id 
                            ? "border-coral ring-2 ring-coral/20" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <img src={style.src} className="w-full h-full object-cover" alt={style.label} />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs font-medium truncate">{style.label}</p>
                        </div>
                        {selectedStyle === style.id && (
                          <div className="absolute top-2 right-2 bg-coral text-white rounded-full p-1">
                            <CheckCircle className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aspect Ratio Selector - New Visual Design */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Output Size</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {aspectRatios.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => setAspectRatio(ratio.value)}
                        className={cn(
                          "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
                          aspectRatio === ratio.value 
                            ? "border-coral bg-coral/5" 
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {/* Visual Rectangle Icon */}
                        <div 
                          className="border-2 border-gray-400 mb-2"
                          style={ratio.style}
                        />
                        <span className="text-xs font-semibold">{ratio.label}</span>
                        <span className="text-[10px] text-gray-500">{ratio.dimensions}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input */}
                <div className="mb-6">
                  <label className="block mb-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Your Prompt (Optional)
                    </span>
                  </label>
                  <Input
                    value={userPrompt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserPrompt(e.target.value)}
                    placeholder="e.g., wearing sunglasses, at the beach..."
                    className="h-11"
                  />
                </div>
                
                {/* Style Strength - Prominent (not hidden in Advanced) */}
                <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-coral" />
                      Style Strength
                    </label>
                    <span className="text-lg font-bold text-coral bg-white px-3 py-1 rounded-full shadow-sm">
                      {Math.round(strength * 100)}%
                    </span>
                  </div>
                  
                  {/* Quick Preset Buttons */}
                  <div className="flex gap-2 mb-3">
                    {[0.85, 0.90, 0.92, 0.95].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setStrength(preset)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                          strength === preset
                            ? "bg-coral text-white"
                            : "bg-white border border-gray-300 text-gray-700 hover:border-coral"
                        )}
                      >
                        {Math.round(preset * 100)}%
                        {preset === 0.92 && <span className="ml-1">⭐</span>}
                      </button>
                    ))}
                  </div>
                  
                  <Slider
                    min={0.7}
                    max={0.95}
                    step={0.01}  // Fine-grained control
                    value={[strength]}
                    onValueChange={(value) => setStrength(value[0])}
                    className="w-full mb-2"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-600 px-1">
                    <span className="flex items-center gap-1">
                      <span>🎨</span>
                      <span className="font-medium">More Creative</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">More Realistic</span>
                      <span>📸</span>
                    </span>
                  </div>
                  
                  {/* Dynamic Recommendation */}
                  <div className={cn(
                    "text-xs rounded-lg p-3 border mt-3",
                    strength >= 0.9 
                      ? "bg-green-50 border-green-200 text-green-800" 
                      : strength >= 0.80 
                      ? "bg-blue-50 border-blue-200 text-blue-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  )}>
                    {strength >= 0.9 ? (
                      <>✅ <strong>Recommended:</strong> High accuracy preserves unique features</>
                    ) : strength >= 0.80 ? (
                      <>⚖️ <strong>Balanced:</strong> Good mix of style and accuracy</>
                    ) : (
                      <>🎨 <strong>Creative:</strong> More artistic, features may change</>
                    )}
                  </div>
                </div>
                
                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate}
                  className="w-full h-12 text-lg"
                  disabled={!selectedStyle}
                >
                  ✨ Generate Portrait
                </Button>
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

          {/* SUCCESS: Show Result Modal when generation is complete */}
          {generatedImageUrl && generationId && (
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
                  Sign in to Generate (2 Free Credits)
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
