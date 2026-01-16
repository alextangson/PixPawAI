'use client'

import Image from 'next/image'
import { Download, Share2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GalleryTabProps {
  generations: any[]
}

export function GalleryTab({ generations }: GalleryTabProps) {
  const succeededGenerations = generations.filter(g => g.status === 'succeeded')

  if (succeededGenerations.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg mb-4">
          You haven't created any portraits yet.
        </p>
        <Button
          onClick={() => window.location.href = '/en'}
          className="bg-coral hover:bg-orange-600 text-white"
        >
          Create Your First Portrait
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {succeededGenerations.map((generation) => (
        <div
          key={generation.id}
          className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="relative aspect-square">
            <Image
              src={generation.output_url}
              alt={generation.title || 'Generated portrait'}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">
                {new Date(generation.created_at).toLocaleDateString()}
              </span>
              {generation.is_public && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Shared
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {generation.title || generation.prompt?.substring(0, 100)}
            </p>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => window.open(generation.output_url, '_blank')}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              
              {!generation.is_public && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Implement share functionality
                    alert('Share functionality coming soon!')
                  }}
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
