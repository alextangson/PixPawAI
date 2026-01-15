'use client'

import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import { signOut } from '@/lib/auth/actions'
import { LogOut, User as UserIcon, CreditCard, Settings, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserMenuProps {
  user: User
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)

  // Fetch user credits from profiles table
  useEffect(() => {
    const fetchCredits = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (data && !error) {
        setCredits(data.credits)
      }
    }

    fetchCredits()
  }, [user.id])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
      setIsLoading(false)
    }
  }

  const getInitials = () => {
    const name = user.user_metadata?.full_name || user.email || 'U'
    return name.charAt(0).toUpperCase()
  }

  const getDisplayName = () => {
    return user.user_metadata?.full_name || user.email || 'User'
  }

  return (
    <div className="relative">
      {/* Avatar Button with Credits Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-br from-coral to-orange-600 rounded-full flex items-center justify-center text-white font-bold shadow-md group-hover:scale-105 transition-transform">
            {getInitials()}
          </div>
          {/* Credits Badge (Desktop Only) */}
          {credits !== null && (
            <div className="hidden md:flex absolute -bottom-1 -right-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 items-center justify-center shadow-md border-2 border-white">
              {credits > 99 ? '99+' : credits}
            </div>
          )}
        </div>
        {/* Credits Text (Desktop Only) */}
        {credits !== null && (
          <div className="hidden lg:flex flex-col items-start">
            <span className="text-xs text-gray-500 leading-tight">Credits</span>
            <span className="text-sm font-bold text-gray-900 leading-tight flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              {credits}
            </span>
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">
                {getDisplayName()}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
              {/* Credits Display */}
              {credits !== null && (
                <div className="mt-2 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" />
                    Credits
                  </span>
                  <span className="text-sm font-bold text-orange-600">
                    {credits}
                  </span>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                onClick={() => {
                  // TODO: Navigate to profile
                  setIsOpen(false)
                }}
              >
                <UserIcon className="w-4 h-4" />
                My Profile
              </button>

              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-orange-50 flex items-center justify-between group"
                onClick={() => {
                  // Navigate to pricing page to buy more credits
                  window.location.href = '/en/pricing'
                  setIsOpen(false)
                }}
              >
                <span className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 group-hover:text-coral" />
                  Buy More Credits
                </span>
                <span className="text-xs text-coral font-semibold">→</span>
              </button>

              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                onClick={() => {
                  // TODO: Navigate to settings
                  setIsOpen(false)
                }}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isLoading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
