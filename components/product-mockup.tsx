'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProductMockupProps {
  className?: string
  artworkUrl?: string
}

export function ProductMockup({ className, artworkUrl = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=600&fit=crop' }: ProductMockupProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Custom Pillow Mockup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative w-64 h-64 ml-auto"
      >
        {/* Pillow shape with shadow */}
        <div className="absolute inset-0 rounded-[40%] bg-gradient-to-br from-white to-gray-100 shadow-2xl transform rotate-12">
          {/* Pet artwork on pillow */}
          <div className="absolute inset-4 rounded-[35%] overflow-hidden border-4 border-white">
            <Image
              src={artworkUrl}
              alt="Custom pillow mockup"
              fill
              className="object-cover"
              sizes="256px"
            />
          </div>
          
          {/* Pillow stitching detail */}
          <div className="absolute inset-0 rounded-[40%] border-2 border-gray-200/50" />
        </div>

        {/* Price tag */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4, delay: 0.8, type: 'spring' }}
          className="absolute -top-2 -right-2 bg-coral text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg z-10 transform -rotate-12"
        >
          <div className="text-center">
            <div className="text-xs font-medium">From</div>
            <div className="text-lg font-bold">$49</div>
          </div>
        </motion.div>

        {/* Sparkle effects */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-4 left-4 text-3xl"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            delay: 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-4 right-8 text-2xl"
        >
          💫
        </motion.div>
      </motion.div>

      {/* Phone Case Mockup (smaller, in background) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="absolute -left-8 top-12 w-32 h-40 bg-white rounded-[2rem] shadow-xl transform -rotate-6 border-4 border-gray-200"
      >
        <div className="absolute inset-2 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-coral/20 to-orange-300/20">
          <Image
            src={artworkUrl}
            alt="Phone case mockup"
            fill
            className="object-cover opacity-80"
            sizes="128px"
          />
        </div>
        
        {/* Camera notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-6 bg-gray-800 rounded-full" />
      </motion.div>
    </div>
  )
}
