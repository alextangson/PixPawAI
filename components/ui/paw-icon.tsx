import Image from 'next/image'

interface PawIconProps {
  variant?: 'orange' | 'black' | 'white'
  size?: number
  className?: string
}

export function PawIcon({ 
  variant = 'orange', 
  size = 20, 
  className = '' 
}: PawIconProps) {
  return (
    <div 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={`/brand/paw-${variant}.svg`}
        alt="Paw"
        fill
        className="object-contain"
      />
    </div>
  )
}
