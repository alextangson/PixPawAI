'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PolaroidCard {
  petName: string
  imageUrl: string
}

interface InfiniteMarqueeProps {
  className?: string
}

const petCards: PolaroidCard[] = [
  { petName: 'Luna', imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop' },
  { petName: 'Cooper', imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop' },
  { petName: 'Bella', imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop' },
  { petName: 'Max', imageUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop' },
  { petName: 'Daisy', imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop' },
  { petName: 'Charlie', imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop' },
  { petName: 'Lucy', imageUrl: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=400&h=400&fit=crop' },
  { petName: 'Milo', imageUrl: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&h=400&fit=crop' },
]

function PolaroidCard({ petName, imageUrl }: PolaroidCard) {
  return (
    <div className="relative flex-shrink-0 w-36 sm:w-40 md:w-48 mx-3 sm:mx-4">
      {/* Polaroid frame with shadow */}
      <div className="bg-white p-3 pb-12 shadow-md rounded-sm transform rotate-2 hover:rotate-0 transition-transform duration-300">
        {/* Photo */}
        <div className="relative w-full aspect-square overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={`${petName}'s photo`}
            fill
            className="object-cover"
            sizes="192px"
          />
        </div>
        
        {/* Handwritten-style name */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <p 
            className="text-darkgray text-lg font-medium"
            style={{ 
              fontFamily: "'Caveat', cursive",
              textShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            {petName} ✨
          </p>
        </div>
      </div>
    </div>
  )
}

export function InfiniteMarquee({ className }: InfiniteMarqueeProps) {
  // Duplicate cards 4 times for seamless infinite loop on wide screens
  const duplicatedCards = [...petCards, ...petCards, ...petCards, ...petCards]

  return (
    <div className={cn('relative w-full overflow-hidden py-12 bg-gradient-to-b from-transparent via-orange-50/30 to-transparent', className)}>
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-cream to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-cream to-transparent z-10" />
      
      {/* Scrolling container */}
      <motion.div
        className="flex"
        animate={{
          x: [0, -3840], // Adjusted for 4x duplication
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 55,
            ease: "linear",
          },
        }}
      >
        {duplicatedCards.map((card, index) => (
          <PolaroidCard key={`${card.petName}-${index}`} {...card} />
        ))}
      </motion.div>

      {/* Scroll hint text - REMOVED redundant text */}
    </div>
  )
}
