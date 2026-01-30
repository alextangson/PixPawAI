'use client'

import { cn } from '@/lib/utils'
import { BRANDING } from '@/lib/constants/branding'

interface WatermarkProps {
  /**
   * Whether the user has paid subscription
   * If true, no watermark is shown
   */
  isPaidUser: boolean
  
  /**
   * Position of the watermark
   * @default 'bottom-right'
   */
  position?: 'bottom-right' | 'bottom-center'
  
  /**
   * Size of the watermark logo
   * @default 'small'
   */
  size?: 'small' | 'medium' | 'large'
  
  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Watermark component for non-paid users
 * Displays PixPaw AI logo at specified position with specified size
 * Automatically hidden for paid users
 */
export function Watermark({ 
  isPaidUser, 
  position = 'bottom-right', 
  size = 'small',
  className
}: WatermarkProps) {
  // Don't render anything for paid users
  if (isPaidUser) return null
  
  const positionClasses = position === 'bottom-right' 
    ? BRANDING.watermark.position.bottomRight
    : BRANDING.watermark.position.bottomCenter
  
  const sizeClass = BRANDING.watermark.size[size]
  
  return (
    <div 
      className={cn(
        "absolute z-10 pointer-events-none",
        positionClasses,
        className
      )}
      style={{ opacity: BRANDING.watermark.opacity }}
    >
      <img 
        src={BRANDING.logos.color} 
        alt="PixPaw AI"
        className={cn(sizeClass, "select-none")}
        draggable={false}
      />
    </div>
  )
}
