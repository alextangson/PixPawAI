'use client'

import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth/actions'

interface SettingsTabProps {
  user: User
  profile: any
}

export function SettingsTab({ user, profile }: SettingsTabProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Account Info */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Account Information</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-900">{user.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Since
            </label>
            <p className="text-gray-900">
              {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tier
            </label>
            <p className="text-gray-900 capitalize">{profile?.tier || 'Free'}</p>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates about your generations</p>
            </div>
            <input
              type="checkbox"
              defaultChecked
              className="w-5 h-5 text-coral focus:ring-coral rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Marketing Emails</p>
              <p className="text-sm text-gray-600">Get tips and special offers</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 text-coral focus:ring-coral rounded"
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-red-200">
        <h3 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h3>
        
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
            onClick={async () => {
              if (confirm('Are you sure you want to sign out?')) {
                await signOut()
              }
            }}
          >
            Sign Out
          </Button>

          <Button
            variant="outline"
            className="w-full border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => {
              if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                alert('Account deletion feature coming soon. Please contact support.')
              }
            }}
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  )
}
