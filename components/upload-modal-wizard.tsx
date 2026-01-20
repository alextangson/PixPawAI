'use client'

import { useState, useEffect } from 'react'
import { X, Upload, Loader2, CheckCircle, ArrowLeft, ArrowRight, Image as ImageIcon, Sparkles, Grid3x3, LogIn, AlertCircle, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { STYLES } from '@/lib/styles'
import { useStyles } from '@/lib/hooks/use-styles'
import { FUN_FACTS } from '@/lib/constants/fun-facts'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { uploadUserImage } from '@/lib/supabase/storage'
import type { User } from '@supabase/supabase-js'
import NextImage from 'next/image'
import { ResultModal } from '@/components/result-modal'
import { LoginButton } from '@/components/auth/login-button'
import { GuestLoginModal } from '@/components/guest-login-modal'

interface UploadModalWizardProps {
  isOpen: boolean
  onClose: () => void
  selectedStyle?: string | null
  isRemixMode?: boolean  // ✨ New: Indicates Remix flow from Gallery
}

type Step = 'upload' | 'quality-check' | 'configure' | 'generating'

interface QualityCheckResult {
  isSafe?: boolean
  unsafeReason?: 'none' | 'nudity' | 'gore' | 'hate' | 'violence'
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

export function UploadModalWizard({ isOpen, onClose, selectedStyle: initialStyle, isRemixMode = false }: UploadModalWizardProps) {
  const router = useRouter()
  
  // State
  const [step, setStep] = useState<Step>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('') // Supabase URL after upload
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [userPrompt, setUserPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<string>(initialStyle || '')
  const [isStyleLocked, setIsStyleLocked] = useState<boolean>(isRemixMode)  // Lock style in Remix mode
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string>('')
  const [errorType, setErrorType] = useState<'credits' | 'storage' | 'api' | 'general' | 'auth'>('general')
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('')
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)
  const [showGuestLoginModal, setShowGuestLoginModal] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [messageIndex, setMessageIndex] = useState<number>(0)
  const [strength, setStrength] = useState<number>(0.92) // Image preservation strength (0.1-1.0) - Very high to preserve exact animal features
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [aspectRatio, setAspectRatio] = useState<string>('1:1') // Aspect ratio selection
  const [generationId, setGenerationId] = useState<string>('')
  const [isRefunded, setIsRefunded] = useState<boolean>(false)
  
  // New states for quality check and pet name
  const [petName, setPetName] = useState<string>('')
  const [qualityCheckResult, setQualityCheckResult] = useState<QualityCheckResult | null>(null)
  const [showQualityWarning, setShowQualityWarning] = useState(false)
  const [isCheckingQuality, setIsCheckingQuality] = useState(false)
  
  // 🎯 Smart Analysis Strategy: Track both quick and detailed results
  const [quickAnalysisResult, setQuickAnalysisResult] = useState<{hasPet: boolean; isClear: boolean; petType: string; quality: string} | null>(null)
  
  // Detailed analysis state tracking (for race condition fix)
  const [isDetailedAnalysisRunning, setIsDetailedAnalysisRunning] = useState(false)
  const [detailedAnalysisCompleted, setDetailedAnalysisCompleted] = useState(false)
  
  // Style rotation for "Shuffle"
  const [styleRotationIndex, setStyleRotationIndex] = useState(0)
  
  // Rate limiting & anti-spam states
  const [lastUploadTime, setLastUploadTime] = useState<number>(0)
  const [isUploadBlocked, setIsUploadBlocked] = useState(false)
  const [uploadCooldown, setUploadCooldown] = useState<number>(0)
  
  // Auth checking state to prevent race conditions
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  // Check user authentication
  useEffect(() => {
    const checkUser = async () => {
      setIsCheckingAuth(true)
      
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        console.log('[UploadModalWizard] User:', user ? `${user.email} (${user.id})` : 'Not logged in')
        
        setUser(user)
        
        // If user just logged in, restore saved configuration
        if (user) {
          const savedConfig = localStorage.getItem('pixpaw_pending_generation')
          
          if (savedConfig) {
            try {
              const config = JSON.parse(savedConfig)
              const age = Date.now() - config.timestamp
              const ageMinutes = Math.floor(age / 60000)
              
              console.log('[UploadModalWizard] Found saved config:', {
                age: `${ageMinutes} minutes`,
                hasImageUrl: !!config.uploadedImageUrl,
                hasStyle: !!config.selectedStyle,
                hasPetName: !!config.petName
              })
              
              // Only restore if saved within last 10 minutes
              if (age < 10 * 60 * 1000) {
                console.log('[UploadModalWizard] ✅ Restoring configuration:', {
                  imageUrl: config.uploadedImageUrl?.substring(0, 50) + '...',
                  style: config.selectedStyle,
                  petName: config.petName
                })
                
                setUploadedImageUrl(config.uploadedImageUrl || '')
                setPreviewUrl(config.uploadedImageUrl || config.previewUrl || '')
                setSelectedStyle(config.selectedStyle || '')
                setAspectRatio(config.aspectRatio || '1:1')
                setStrength(config.strength || 0.92)
                setUserPrompt(config.userPrompt || '')
                setPetName(config.petName || '')
                
                // Important: Mark that we have an uploaded file (even though we don't have the File object)
                // The uploadedImageUrl is enough for generation
                if (config.uploadedImageUrl) {
                  setStep('configure')
                } else {
                  console.warn('[UploadModalWizard] ⚠️ No image URL in saved config')
                }
              } else {
                console.log('[UploadModalWizard] ⚠️ Config expired:', ageMinutes, 'minutes old')
              }
              localStorage.removeItem('pixpaw_pending_generation')
            } catch (error) {
              console.error('[UploadModalWizard] ❌ Failed to restore configuration:', error)
            }
          } else {
            console.log('[UploadModalWizard] No saved configuration found')
          }
        }
      } finally {
        setIsCheckingAuth(false)
      }
    }
    
    if (isOpen) {
      checkUser()
    }
  }, [isOpen])


  // Listen to Supabase auth state changes to update user in real-time
  useEffect(() => {
    const supabase = createClient()
    
    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, 'User ID:', session?.user?.id || 'none')
      
      // Update user state for any event that has a session
      if (session?.user) {
        console.log('✅ Setting user from auth state change:', session.user.email)
        setUser(session.user)
        
        // Only restore config on SIGNED_IN event
        if (event === 'SIGNED_IN') {
          const savedConfig = localStorage.getItem('pixpaw_pending_generation')
          if (savedConfig) {
            try {
              const config = JSON.parse(savedConfig)
              if (Date.now() - config.timestamp < 10 * 60 * 1000) {
                console.log('✅ Restoring configuration after sign in')
                setUploadedImageUrl(config.uploadedImageUrl || '')
                setPreviewUrl(config.uploadedImageUrl || config.previewUrl || '')
                setSelectedStyle(config.selectedStyle || '')
                setAspectRatio(config.aspectRatio || '1:1')
                setStrength(config.strength || 0.92)
                setUserPrompt(config.userPrompt || '')
                setPetName(config.petName || '')
              }
              localStorage.removeItem('pixpaw_pending_generation')
            } catch (error) {
              console.error('Failed to restore configuration:', error)
            }
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 User signed out, clearing user state')
        setUser(null)
      } else if (event === 'INITIAL_SESSION' && !session) {
        console.log('⚠️ Initial session is empty, user not logged in')
        setUser(null)
      }
    })
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Cooldown timer effect
  useEffect(() => {
    if (uploadCooldown > 0) {
      const timer = setTimeout(() => {
        setUploadCooldown(uploadCooldown - 1)
        if (uploadCooldown === 1) {
          setIsUploadBlocked(false)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [uploadCooldown])

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
        setLastUploadTime(0)
        setIsUploadBlocked(false)
        setUploadCooldown(0)
        setGenerationId('')
        setPetName('')
        setQualityCheckResult(null)
        setShowQualityWarning(false)
        setIsCheckingQuality(false)
        setIsCheckingAuth(false)
        // Note: Share-related states removed (now handled by ResultModal)
      }, 300)
    }
  }, [isOpen, initialStyle])

  // Fun messages to rotate during generation - dynamic based on pet type
  const petTypeLabel = qualityCheckResult?.petType === 'cat' ? 'cat' : 
                       qualityCheckResult?.petType === 'dog' ? 'dog' : 'pet'
  
  const funMessages = [
    `Analyzing your ${petTypeLabel}'s unique features...`,
    `Capturing ${petTypeLabel === 'cat' ? 'whiskers and grace' : petTypeLabel === 'dog' ? 'playful spirit' : 'adorable charm'}...`,
    `Preserving those adorable ${petTypeLabel} eyes...`,
    'Applying artistic magic...',
    'Almost there! Adding final touches...',
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
      value: '3:4',
      label: 'Photo Portrait',
      dimensions: '768×1024',
      icon: 'w-6 h-8',
      style: { width: '24px', height: '32px' }
    },
    {
      value: '4:3',
      label: 'Photo Landscape',
      dimensions: '1024×768',
      icon: 'w-8 h-6',
      style: { width: '32px', height: '24px' }
    },
    {
      value: '4:5',
      label: 'Instagram',
      dimensions: '1024×1280',
      icon: 'w-7 h-9',
      style: { width: '28px', height: '35px' }
    },
    {
      value: '9:16',
      label: 'Story',
      dimensions: '768×1344',
      icon: 'w-5 h-9',
      style: { width: '20px', height: '36px' }
    },
    {
      value: '16:9',
      label: 'Widescreen',
      dimensions: '1344×768',
      icon: 'w-9 h-5',
      style: { width: '36px', height: '20px' }
    }
  ]
  
  // Fetch styles from database
  const { styles: databaseStyles, loading: stylesLoading } = useStyles()
  
  // Display all available styles from database
  const displayedStyles = databaseStyles

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

    // Rotate messages every 5 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % funMessages.length)
    }, 5000)

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

    // 🛡️ Rate limiting: Prevent rapid uploads (5 seconds cooldown)
    const now = Date.now()
    const timeSinceLastUpload = now - lastUploadTime
    const COOLDOWN_MS = 5000 // 5 seconds
    
    if (timeSinceLastUpload < COOLDOWN_MS && lastUploadTime > 0) {
      const remainingSeconds = Math.ceil((COOLDOWN_MS - timeSinceLastUpload) / 1000)
      setError(`Please wait ${remainingSeconds} seconds before uploading again`)
      setErrorType('general')
      setIsUploadBlocked(true)
      setUploadCooldown(remainingSeconds)
      
      // Reset file input
      e.target.value = ''
      return
    }

    // 🛡️ Prevent duplicate uploads
    if (isCheckingQuality) {
      setError('Upload in progress, please wait')
      setErrorType('general')
      e.target.value = ''
      return
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    // Update last upload time
    setLastUploadTime(now)

    setUploadedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setError('')
    setIsUploadBlocked(false)
    setUploadCooldown(0)
    
    // Get image dimensions (use window.Image to avoid conflict with Next.js Image component)
    const img = new window.Image()
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height })
      // Advance to quality-check step instead of configure
      setStep('quality-check')
      // Trigger quality check - pass file directly
      performQualityCheck(objectUrl, file)
    }
    img.onerror = () => {
      setError('Failed to load image')
    }
    img.src = objectUrl
  }
  
  // Quality check function - Fast check first, then detailed analysis in background
  const performQualityCheck = async (imageUrl: string, file: File) => {
    setIsCheckingQuality(true)
    setShowQualityWarning(false)
    
    try {
      // Upload image to get public URL for Qwen
      // Support guest users with anonymous ID
      const userId = user?.id || `guest-${Date.now()}`
      const uploadResult = await uploadUserImage(file, userId)

      if ('error' in uploadResult) {
        throw new Error('Failed to upload image for analysis')
      }
      
      // Save the uploaded image URL for later use
      setUploadedImageUrl(uploadResult.url)
      
      // STEP 1: Quick quality check (1-2 seconds)
      console.log('⚡ Starting quick quality check with URL:', uploadResult.url)
      
      const quickResponse = await fetch('/api/quick-quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadResult.url })
      })
      
      if (!quickResponse.ok) {
        const errorText = await quickResponse.text()
        console.error('❌ Quick quality check API error:', quickResponse.status, errorText)
        throw new Error(`Quick quality check failed: ${quickResponse.status} ${errorText.substring(0, 100)}`)
      }
      
      const quickResult = await quickResponse.json()
      console.log('✅ Quick quality check response:', quickResult)
      
      // 💾 Save quick analysis result for potential fallback
      setQuickAnalysisResult(quickResult)
      console.log('⚡ Quick Check Result:', quickResult)
      
      // Check if no pet detected or quality is poor
      if (!quickResult.hasPet || quickResult.quality === 'poor') {
        setIsCheckingQuality(false)
        setShowQualityWarning(true)
        // Store basic result for now
        setQualityCheckResult({
          hasPet: quickResult.hasPet,
          petType: quickResult.petType,
          quality: quickResult.quality,
          issues: quickResult.hasPet ? ['low_resolution'] : ['no_pet_detected'],
          hasHeterochromia: false,
          heterochromiaDetails: '',
          breed: 'unknown',
          complexPattern: false,
          multiplePets: 0,
          detectedColors: ''
        })
        return
      }
      
      // STEP 2: Quick check passed - proceed to configure immediately
      setIsCheckingQuality(false)
      setIsDetailedAnalysisRunning(true)  // 🔥 Mark detailed analysis as starting
      setStep('configure')
      
      // STEP 3: Detailed analysis in background (doesn't block UI)
      performDetailedAnalysis(uploadResult.url, quickResult.petType)
      
    } catch (error) {
      console.error('❌ Quality check error:', error)
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
      
      setIsCheckingQuality(false)
      
      // Show a user-friendly error message
      setError('Quality check temporarily unavailable. Proceeding with upload...')
      
      // On error, proceed anyway after a brief delay
      setTimeout(() => {
        setError('')
        setStep('configure')
      }, 2000)
    }
  }
  
  // Detailed analysis function - runs in background
  const performDetailedAnalysis = async (imageUrl: string, petType: string) => {
    try {
      console.log('🔍 Starting detailed analysis in background...')
      
      const response = await fetch('/api/check-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })
      
      if (!response.ok) {
        console.warn('Detailed quality check failed, using basic info')
        return
      }
      
      const result: QualityCheckResult = await response.json()
      
      console.log('✅ Detailed Analysis Complete:', result)
      
      // 🚨 NSFW CHECK: Block if unsafe content detected
      if (result.isSafe === false) {
        setIsDetailedAnalysisRunning(false)
        setError(`Content policy violation: This image contains inappropriate content (${result.unsafeReason}). Please upload a different image.`)
        setStep('upload')
        setUploadedFile(null)
        setPreviewUrl('')
        return
      }
      
      // Update with detailed result (will trigger re-render in configure step)
      setQualityCheckResult(result)
      setDetailedAnalysisCompleted(true)  // 🔥 Mark as completed
      
    } catch (error) {
      console.error('Detailed analysis error:', error)
      // Not critical - user can still proceed
    } finally {
      setIsDetailedAnalysisRunning(false)  // 🔥 Always mark as finished (success or failure)
    }
  }
  
  // Handle user decision to continue despite quality warning
  const handleContinueAnyway = () => {
    setShowQualityWarning(false)
    setStep('configure')
  }
  
  // Handle reupload
  const handleReupload = (targetStep: Step = 'upload') => {
    setStep(targetStep)
    setUploadedFile(null)
    setPreviewUrl('')
    setQualityCheckResult(null)
    setShowQualityWarning(false)
  }

  // 🎯 Smart waiting function for detailed analysis
  const waitForDetailedAnalysis = (maxWaitMs: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const checkInterval = setInterval(() => {
        // Success: analysis completed
        if (detailedAnalysisCompleted) {
          clearInterval(checkInterval)
          console.log('✅ Detailed analysis completed')
          resolve(true)
          return
        }
        
        // Timeout: exceeded max wait time
        if (Date.now() - startTime > maxWaitMs) {
          clearInterval(checkInterval)
          console.warn(`⏱️ Detailed analysis timeout after ${maxWaitMs}ms`)
          resolve(false)
          return
        }
      }, 500) // Check every 500ms
    })
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
    // Check if we have an image (either File object or uploaded URL) and style
    if ((!uploadedFile && !uploadedImageUrl) || !selectedStyle) {
      setError('Please upload a photo and select a style')
      console.error('[handleGenerate] Missing required data:', {
        hasFile: !!uploadedFile,
        hasImageUrl: !!uploadedImageUrl,
        hasStyle: !!selectedStyle
      })
      return
    }

    // 🎯 SMART WAIT: Intelligently wait for detailed analysis
    let analysisStatus: 'detailed' | 'quick' | 'none' = 'none'
    
    if (detailedAnalysisCompleted) {
      // Case A: Detailed analysis already completed
      console.log('✅ Using completed detailed analysis')
      analysisStatus = 'detailed'
    } else if (isDetailedAnalysisRunning) {
      // Case B: Detailed analysis in progress, wait for it
      console.log('⏳ Detailed analysis in progress, waiting up to 10 seconds...')
      setError('正在分析宠物特征，请稍候...')
      
      const success = await waitForDetailedAnalysis(10000) // Wait max 10 seconds
      
      if (success) {
        console.log('✅ Detailed analysis completed during wait')
        analysisStatus = 'detailed'
        setError('')
      } else {
        // Case C: Timeout, will use quick analysis fallback
        console.warn('⚠️ Detailed analysis timeout, will use quick analysis fallback')
        analysisStatus = 'quick'
        setError('使用快速分析结果生成（可能略不准确）')
        setTimeout(() => setError(''), 3000)
      }
    } else if (quickAnalysisResult) {
      // Case D: Detailed analysis failed/skipped, use quick result
      console.warn('⚠️ No detailed analysis available, using quick analysis')
      analysisStatus = 'quick'
    }
    
    // Log final analysis status
    console.log('📊 Analysis Status:', {
      status: analysisStatus,
      hasDetailed: detailedAnalysisCompleted,
      hasQuick: !!quickAnalysisResult,
      detailedRunning: isDetailedAnalysisRunning
    })

    // Check authentication status
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    // Update state if user is logged in
    if (currentUser && !user) {
      setUser(currentUser)
    }

    // Show login modal if not logged in
    if (!currentUser) {
      // Save current configuration to localStorage before login
      const configState = {
        uploadedImageUrl, // Supabase URL (still valid after login)
        previewUrl, // Local preview (for UI)
        selectedStyle,
        aspectRatio,
        strength,
        userPrompt,
        petName,
        timestamp: Date.now()
      }
      
      console.log('[UploadModalWizard] 💾 Saving config before login:', {
        hasImageUrl: !!uploadedImageUrl,
        imageUrlPreview: uploadedImageUrl?.substring(0, 50) + '...',
        style: selectedStyle,
        petName: petName,
        aspectRatio,
        strength
      })
      
      localStorage.setItem('pixpaw_pending_generation', JSON.stringify(configState))
      
      // Show beautiful login modal
      setShowGuestLoginModal(true)
      return
    }
    
    // Default prompt if user leaves it empty
    const finalUserPrompt = userPrompt.trim() || 'my pet'

    setStep('generating')
    setError('')

    try {
      // 1. Upload image to Supabase Storage (or use existing upload)
      let imageUrl = uploadedImageUrl
      
      if (!imageUrl && uploadedFile) {
        console.log('📤 Uploading file...')
      const uploadResult = await uploadUserImage(uploadedFile, currentUser.id)

      if ('error' in uploadResult) {
        throw new Error(uploadResult.error)
        }
        
        imageUrl = uploadResult.url
      } else if (imageUrl) {
        console.log('✅ Using pre-uploaded image')
      } else {
        throw new Error('No image available')
      }

      // 2. Call generation API (prompt construction happens on server)
      console.log('🎨 Starting image generation...', {
        style: selectedStyle,
        aspectRatio: aspectRatio,
        petName: petName,
        note: 'Strength will be auto-calculated by backend based on style tier'
      })
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 180000) // 3 minutes timeout
      
      let result
      try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          style: selectedStyle,
          prompt: finalUserPrompt,  // Use finalUserPrompt (defaults to 'my pet' if empty)
          petType: qualityCheckResult?.petType || quickAnalysisResult?.petType || 'pet',
          aspectRatio: aspectRatio,
          // strength removed - backend will use tier-based calculation
          petName: petName.trim(), // Pet name for Art Card title
          // 🎯 THREE-TIER STRATEGY: Pass both detailed and quick analysis
          // Backend will use: detailed (best) → quick (fallback) → backend analysis (last resort)
          detailedAnalysis: qualityCheckResult ? {
            petType: qualityCheckResult.petType,
            breed: qualityCheckResult.breed,
            detectedColors: qualityCheckResult.detectedColors,
            hasHeterochromia: qualityCheckResult.hasHeterochromia,
            heterochromiaDetails: qualityCheckResult.heterochromiaDetails,
            complexPattern: qualityCheckResult.complexPattern,
            multiplePets: qualityCheckResult.multiplePets
          } : null,
          // 🆕 NEW: Pass quick analysis as fallback
          quickAnalysis: quickAnalysisResult ? {
            hasPet: quickAnalysisResult.hasPet,
            isClear: quickAnalysisResult.isClear,
            petType: quickAnalysisResult.petType,
            quality: quickAnalysisResult.quality
          } : null
        }),
        signal: controller.signal
      })

        clearTimeout(timeoutId)

        result = await response.json()
        
        console.log('✅ Generation API response:', {
          status: response.status,
          ok: response.ok,
          hasResult: !!result
        })

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
        
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        if (fetchError instanceof Error) {
          if (fetchError.name === 'AbortError') {
            console.error('❌ Generation timeout after 3 minutes')
            throw new Error('Generation took too long. Please try again with a simpler style.')
          }
          console.error('❌ Generation fetch error:', fetchError.message)
        }
        throw fetchError
      }

      // 5. Success - jump progress to 100%
      setProgress(100)
      setGeneratedImageUrl(result.outputUrl)
      setRemainingCredits(result.remainingCredits)
      setGenerationId(result.generationId || '')
      
      // Fetch is_refunded status from database
      if (result.generationId) {
        try {
          const supabase = createClient()
          const { data: genData } = await supabase
            .from('generations')
            .select('is_refunded')
            .eq('id', result.generationId)
            .single()
          
          if (genData) {
            setIsRefunded(genData.is_refunded || false)
          }
        } catch (error) {
          console.error('Failed to fetch is_refunded status:', error)
        }
      }
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white shadow-2xl w-full max-h-[98vh] overflow-hidden flex flex-col max-w-7xl rounded-t-3xl sm:rounded-3xl p-4 sm:p-6">
        {/* Header with Progress Indicator */}
        <div className="bg-white border-b border-gray-200">
          {/* Progress Steps - Mobile Only */}
          <div className="sm:hidden px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              {['upload', 'quality-check', 'configure', 'generating'].map((s, idx) => {
                const stepIndex = ['upload', 'quality-check', 'configure', 'generating'].indexOf(step)
                const currentStepIndex = ['upload', 'quality-check', 'configure', 'generating'].indexOf(s)
                const isActive = currentStepIndex === stepIndex
                const isCompleted = currentStepIndex < stepIndex
                
                return (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isActive ? 'bg-coral text-white scale-110' : 
                      isCompleted ? 'bg-green-500 text-white' : 
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    {idx < 3 && (
                      <div className={`flex-1 h-1 mx-1 rounded-full transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {step === 'configure' && (
                <button
                  onClick={() => setStep('upload')}
                  className="p-3 sm:p-2 touch-target hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-gray-900 truncate">
                  {step === 'upload' && 'Upload Your Photo'}
                  {step === 'quality-check' && 'Checking Photo Quality'}
                  {step === 'configure' && 'Configure Your Portrait'}
                  {step === 'generating' && 'Creating Your Portrait...'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 font-sans hidden sm:block">
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
              className="p-3 sm:p-2 touch-target hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
            >
              <X className="w-6 h-6 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content - Unified Background */}
        <div className="flex-1 overflow-hidden overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-white to-gray-50">
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
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Rate Limit Warning */}
              {isUploadBlocked && uploadCooldown > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                      Please wait {uploadCooldown} second{uploadCooldown > 1 ? 's' : ''} before uploading again
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      This helps us prevent spam and keeps the service fast for everyone
                    </p>
                  </div>
                </div>
              )}
              
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={cn(
                  "relative border-2 border-dashed rounded-2xl p-12 transition-all",
                  isUploadBlocked || isCheckingQuality
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                    : "border-gray-300 hover:border-coral hover:bg-coral/5 cursor-pointer group"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploadBlocked || isCheckingQuality}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="text-center">
                  <Upload className="w-12 sm:w-16 h-12 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4 group-hover:text-coral transition-colors" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Drop your pet's photo here
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    or click to browse
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    JPG, PNG up to 10MB
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-50 rounded-xl p-3 sm:p-4">
                <h4 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">Tips for best results:</h4>
                <ul className="space-y-1 text-xs sm:text-sm text-blue-800">
                  <li>• Clear, well-lit photos work best</li>
                  <li>• Face should be visible and in focus</li>
                  <li>• Avoid blurry or dark images</li>
                </ul>
              </div>
            </div>
          )}

          {/* STEP A.5: QUALITY CHECK */}
          {step === 'quality-check' && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              {/* Checking State */}
              {isCheckingQuality && (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="w-12 h-12 text-coral animate-spin mb-4" />
                  <p className="text-lg font-medium text-gray-900">Analyzing your pet photo...</p>
                  <p className="text-sm text-gray-500 mt-1">This takes just 3-5 seconds</p>
                </div>
              )}

              {/* Quality Check Failed/Warning - Redesigned V2 */}
              {!isCheckingQuality && showQualityWarning && qualityCheckResult && (
                <div className="max-w-3xl mx-auto">
                  {/* Alert Banner */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-bold text-amber-900 mb-1">
                          Photo Quality Issue Detected
                        </h3>
                        <p className="text-sm text-amber-800">
                          Your photo may not produce optimal results. Consider uploading a better one.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
                    <div className="grid md:grid-cols-[300px_1fr] divide-x divide-gray-200">
                      {/* Left: Image Preview */}
                      <div className="relative bg-gray-50 p-4">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 relative">
                <img
                  src={previewUrl}
                            className="w-full h-full object-cover" 
                            alt="Uploaded photo" 
                          />
                          <div className="absolute inset-0 bg-black/10"></div>
                        </div>
                        <div className="mt-3 text-center">
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                            <X className="w-3 h-3" />
                            Not Recommended
                          </span>
                        </div>
                      </div>

                      {/* Right: Issues & Tips */}
                      <div className="p-6 space-y-5">
                        {/* Detected Issues */}
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                              <X className="w-5 h-5 text-red-600" />
                            </div>
                            <h4 className="font-bold text-gray-900">Detected Issues</h4>
                          </div>
                          <ul className="space-y-2">
                            {qualityCheckResult.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                                <span>
                                  {issue === 'blurry' && 'Photo is blurry or out of focus'}
                                  {issue === 'too_small' && 'Pet is too small in the frame'}
                                  {issue === 'poor_lighting' && 'Poor lighting conditions'}
                                  {issue === 'obstructed' && 'Pet face is partially obstructed'}
                                  {issue === 'no_pet' && 'No pet detected in this photo'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tips */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <h4 className="font-semibold text-blue-900 text-sm">
                              Tips for Better Results
                            </h4>
                          </div>
                          <ul className="text-xs text-blue-800 space-y-1.5">
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              Good lighting (natural light works best)
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              Pet takes up 50%+ of the frame
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              Eyes are clearly visible
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              Sharp focus, not blurry
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => handleReupload('upload')} 
                      className="flex-1 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Better Photo
                    </Button>
                    <Button 
                      onClick={handleContinueAnyway} 
                      variant="outline"
                      className="flex-1 h-12 text-base border-2 hover:bg-gray-50"
                    >
                      Continue Anyway
                    </Button>
                  </div>

                  {/* Warning Footer */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      Continuing will use 1 credit, but generation quality may be significantly affected
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

          {/* STEP B: CONFIGURE - Optimized Layout */}
          {step === 'configure' && (
            <div className="flex flex-col overflow-hidden -m-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* MOBILE: Pet Name at Top */}
              <div className="lg:hidden bg-gradient-to-b from-white to-gray-50 px-4 py-3 border-b border-gray-100">
                <label className="block mb-2">
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                    Your Pet's Name
                    <span className="text-[10px] sm:text-xs font-normal text-gray-500">(Optional)</span>
                  </span>
                </label>
                <Input
                  value={petName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPetName(e.target.value)}
                  placeholder="e.g., Max, Luna, Bella..."
                  className="text-sm sm:text-base h-11"
                />
              </div>
              
              <div className="flex flex-col lg:flex-row overflow-hidden flex-1">
              
              {/* LEFT PANEL: Image Preview (Desktop includes Pet Name) */}
              <div className="lg:w-1/2 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center overflow-y-auto lg:overflow-visible">
                
                {/* Image Preview */}
                <div className="relative w-full max-w-md mb-4 lg:mb-6">
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

                {/* Pet Name Input - Desktop Only */}
                <div className="hidden lg:block w-full max-w-md">
                  <label className="block mb-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      Your Pet's Name
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
                    This name will appear on your art card
                </p>
                </div>
              </div>
              
              {/* RIGHT PANEL: Style + Configuration (50%) */}
              <div className="lg:w-1/2 bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6 lg:p-8 overflow-y-auto flex-1 lg:max-h-[700px] xl:max-h-[750px] 2xl:max-h-[800px]">

              {/* Style Selector */}
                <div className="mb-4 sm:mb-6">
                  {isStyleLocked && selectedStyle ? (
                    // Remix Mode: Show locked style with elegant display
                    <div>
                      <h3 className="text-base sm:text-lg font-bold mb-3">Selected Style (Locked for Remix)</h3>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-4">
                        {(() => {
                          const style = STYLES.find(s => s.id === selectedStyle);
                          return style ? (
                            <div className="flex items-center gap-4">
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-lg flex-shrink-0">
                                <img 
                                  src={style.src} 
                                  className="w-full h-full object-cover" 
                                  alt={style.label}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg font-bold text-gray-900 mb-1">
                                  {style.label}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-orange-600" />
                                  Style locked for remix
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-600">Style not found</p>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    // Normal Mode: Full style selector
                    <>
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <h3 className="text-base sm:text-lg font-bold">Choose a Style</h3>
                        {/* Removed Shuffle button - only 5 styles, all visible */}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {displayedStyles.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setSelectedStyle(style.id)}
                            className={cn(
                              "relative rounded-xl overflow-hidden border-2 transition-all duration-300 aspect-[4/3] active:scale-95",
                              selectedStyle === style.id 
                                ? "border-coral ring-2 ring-coral/20 shadow-lg scale-105" 
                                : "border-gray-200 hover:border-coral/30 shadow-md hover:shadow-lg"
                            )}
                          >
                            {style.src && style.src.trim() !== '' ? (
                              <img src={style.src} className="w-full h-full object-cover" alt={style.label} />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No preview</span>
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                              <p className="text-white text-[10px] sm:text-xs font-semibold truncate drop-shadow-lg">{style.label}</p>
                            </div>
                            {selectedStyle === style.id && (
                              <div className="absolute top-2 right-2 bg-gradient-to-br from-coral to-orange-600 text-white rounded-full p-1 shadow-lg animate-in zoom-in-50 duration-200">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
              </div>

                {/* Aspect Ratio Selector - Responsive Grid */}
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3">Output Size</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2">
                    {aspectRatios.map((ratio) => (
                <button
                        key={ratio.value}
                        onClick={() => setAspectRatio(ratio.value)}
                        className={cn(
                          "flex flex-col items-center p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 active:scale-95",
                          aspectRatio === ratio.value 
                            ? "border-coral bg-gradient-to-br from-coral/10 to-orange/5 shadow-md" 
                            : "border-gray-200 hover:border-coral/30 hover:shadow-sm"
                        )}
                      >
                        <div
                          className={cn(
                            "bg-gray-200 rounded mb-2",
                            ratio.icon
                          )}
                          style={ratio.style}
                        />
                        <span className={cn(
                          "text-[10px] sm:text-xs font-medium text-center",
                          aspectRatio === ratio.value ? "text-coral" : "text-gray-700"
                        )}>
                          {ratio.label}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">
                          {ratio.dimensions}
                        </span>
                </button>
                    ))}
                  </div>
                </div>

                {/* AI Detection Results - Show Qwen Analysis */}
                {qualityCheckResult && (
                  <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border-2 border-green-200">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-1">
                          🎯 AI Photo Analysis Complete
                        </h4>
                        <div className="space-y-1.5 sm:space-y-2 text-xs text-gray-700">
                          <div className="flex items-start gap-2">
                            <span className="text-green-600 font-semibold shrink-0">Pet:</span>
                            <span className="break-words">
                              {qualityCheckResult.petType === 'dog' ? '🐕 Dog' : qualityCheckResult.petType === 'cat' ? '🐈 Cat' : '🐾 Pet'}
                              {qualityCheckResult.breed && qualityCheckResult.breed !== 'unknown' && ` - ${qualityCheckResult.breed}`}
                            </span>
                          </div>
                          {qualityCheckResult.detectedColors && (
                            <div className="flex items-start gap-2">
                              <span className="text-green-600 font-semibold shrink-0">Colors:</span>
                              <span className="break-words">{qualityCheckResult.detectedColors}</span>
                            </div>
                          )}
                          {qualityCheckResult.complexPattern && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-semibold">Pattern:</span>
                              <span>Complex fur pattern detected</span>
                            </div>
                          )}
                          {qualityCheckResult.multiplePets > 1 && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-semibold">Pets:</span>
                              <span>{qualityCheckResult.multiplePets} pets in photo</span>
                            </div>
                          )}
                          <div className="mt-2 bg-white rounded-lg p-2 text-center">
                            <span className="text-[10px] sm:text-xs text-gray-600">Parameters optimized for </span>
                            <span className="text-[10px] sm:text-xs font-bold text-green-600">best accuracy</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Prompt Input */}
                <div className="mb-4 sm:mb-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 border border-gray-200">
                  <label className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-coral" />
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">
                      Customize Scene & Style
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500 font-normal">(Optional)</span>
                  </label>
                  <Input
                    value={userPrompt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserPrompt(e.target.value)}
                    placeholder="e.g., wearing a hat, on the beach, close-up portrait..."
                    className="text-sm sm:text-base h-11 border-gray-300 focus:border-coral bg-white"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5 sm:mt-2">
                    Add accessories, change background, or adjust composition. Your pet's features stay the same!
                  </p>
                </div>

                {/* AI Detected Features */}
                {qualityCheckResult?.hasHeterochromia && (
                  <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                    <div className="flex items-start gap-2">
                      <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-900">AI Detected: Heterochromia</p>
                        <p className="text-xs text-blue-700 mt-1">
                          {qualityCheckResult.heterochromiaDetails}
                        </p>
                        <p className="text-xs text-blue-600 mt-1 italic">
                          Our system will automatically optimize parameters to preserve this unique feature.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

          {/* STEP C: GENERATING */}
          {step === 'generating' && (
            <>
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-center justify-center lg:h-[500px] xl:h-[550px] py-4 lg:py-0 animate-in fade-in zoom-in-95 duration-500">
              {/* LEFT PANEL: Original Image with Magic Effect */}
              <div className="lg:w-1/2 flex items-center justify-center">
              <div className="w-full max-w-xs lg:max-w-sm rounded-2xl overflow-hidden border-2 border-coral/30 shadow-xl">
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
              </div>

              {/* RIGHT PANEL: Progress + Fun Facts */}
              <div className="lg:w-1/2 flex flex-col justify-center space-y-2 lg:space-y-3 px-4">
                {/* Logo */}
                <div className="flex justify-center">
                  <img 
                    src="/brand/logo-orange.svg" 
                    alt="PixPaw AI"
                    className="h-10 lg:h-12 opacity-90"
                  />
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1.5 lg:space-y-2">
                  <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-coral to-orange-600 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-lg lg:text-xl font-serif font-bold text-gray-900">{Math.round(progress)}%</p>
                    <p className="text-sm lg:text-base text-gray-700 mt-1 font-sans">
                      {funMessages[messageIndex]}
                    </p>
                  </div>
                </div>

                {/* Fun Facts Section */}
                <div className="bg-gradient-to-br from-coral/10 to-orange-100/50 rounded-lg p-2.5 lg:p-3 border border-coral/20">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 bg-coral rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 mb-1">Did you know?</h4>
                      <p className="text-xs text-gray-700 leading-snug">
                        {FUN_FACTS[messageIndex % FUN_FACTS.length]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Summary */}
                <div className="bg-white rounded-lg p-2 lg:p-3 border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Style</span>
                    <span className="font-medium text-gray-900 truncate ml-2">{STYLES.find(s => s.id === selectedStyle)?.label || selectedStyle}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Format</span>
                    <span className="font-medium text-gray-900">{aspectRatio}</span>
                  </div>
                  {qualityCheckResult && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Pet</span>
                      <span className="font-medium text-gray-900 truncate ml-2">
                        {qualityCheckResult.petType === 'dog' ? 'Dog' : qualityCheckResult.petType === 'cat' ? 'Cat' : 'Pet'}
                        {qualityCheckResult.breed && qualityCheckResult.breed !== 'unknown' && ` - ${qualityCheckResult.breed}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Warning Text */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 max-w-md mx-auto mt-2 lg:mt-4">
              <p className="text-xs text-amber-800 text-center">
                ⚠️ <strong>Keep this tab open.</strong> Good art takes time!
              </p>
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
            </>
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
              isRefunded={isRefunded}
              petName={petName}
              onShareSuccess={() => {
                // Refresh credits or update UI if needed
                console.log('✅ Share successful')
              }}
              onReupload={() => {
                // Reset to upload step
                setStep('upload')
                setGeneratedImageUrl('')
                setGenerationId('')
              }}
              generationMetadata={{
                hasHeterochromia: qualityCheckResult?.hasHeterochromia,
                heterochromiaDetails: qualityCheckResult?.heterochromiaDetails,
                style: selectedStyle,
                strength: strength
              }}
            />
          )}
        </div>

        {/* Footer - Generate Button (only show in configure step) */}
        {step === 'configure' && (
          <div className="border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 bg-white">
            <Button
              onClick={handleGenerate}
              disabled={!selectedStyle || isCheckingAuth || isDetailedAnalysisRunning}
              className="w-full bg-gradient-to-r from-coral to-orange-600 hover:from-orange-600 hover:to-coral text-white font-semibold h-12 sm:h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-300"
            >
              {isDetailedAnalysisRunning ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing pet features...
                </>
              ) : isCheckingAuth ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Checking login status...
                </>
              ) : user ? (
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
            {isDetailedAnalysisRunning && (
              <p className="text-xs text-center text-gray-500 mt-2 animate-pulse">
                🔍 Analyzing pet features for best results...
              </p>
            )}
            {!user && !isCheckingAuth && !isDetailedAnalysisRunning && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Create an account to start generating
              </p>
            )}
          </div>
        )}
      </div>

      {/* Guest Login Modal */}
      <GuestLoginModal
        isOpen={showGuestLoginModal}
        onClose={() => setShowGuestLoginModal(false)}
      />
    </div>
  )
}
