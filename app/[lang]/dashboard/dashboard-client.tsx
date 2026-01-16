'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GalleryTabRefactored as GalleryTab } from '@/components/dashboard/gallery-tab-refactored'
import { CreditsTab } from '@/components/dashboard/credits-tab'
import { SettingsTab } from '@/components/dashboard/settings-tab'

interface DashboardClientProps {
  user: User
  profile: any
  generations: any[]
}

export function DashboardClient({ user, profile, generations }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState('gallery')
  const router = useRouter()

  const handleGenerationsUpdate = () => {
    // Refresh the server component data
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-cream py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user.email}
          </p>
        </div>

        {/* Credits Display */}
        <div className="bg-gradient-to-r from-coral to-orange-600 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Available Credits</p>
              <p className="text-4xl font-bold">{profile?.credits || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm mb-1">Total Generations</p>
              <p className="text-2xl font-bold">{profile?.total_generations || 0}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="gallery">My Gallery</TabsTrigger>
            <TabsTrigger value="credits">Get Credits</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery">
            <GalleryTab 
              generations={generations} 
              onGenerationsUpdate={handleGenerationsUpdate}
            />
          </TabsContent>

          <TabsContent value="credits">
            <CreditsTab currentCredits={profile?.credits || 0} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab user={user} profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
