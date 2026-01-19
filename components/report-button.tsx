/**
 * Report Button Component
 * 
 * Allows users to report inappropriate content in the gallery
 * Features:
 * - Only shows for other users' content (not own)
 * - Prevents duplicate reports
 * - Shows confirmation dialog
 * - Rate limiting feedback
 */

'use client'

import { useState } from 'react'
import { Flag, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface ReportButtonProps {
  generationId: string
  currentUserId?: string
  contentOwnerId: string
  variant?: 'icon' | 'text'
  size?: 'sm' | 'default' | 'lg'
}

export function ReportButton({
  generationId,
  currentUserId,
  contentOwnerId,
  variant = 'icon',
  size = 'sm'
}: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isReported, setIsReported] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Don't show button if:
  // 1. User is not logged in
  // 2. User is viewing their own content
  // 3. Content has already been reported
  if (!currentUserId || currentUserId === contentOwnerId || isReported) {
    return null
  }

  const handleSubmit = async () => {
    if (reason.trim().length < 10) {
      setError('Please provide a reason (at least 10 characters)')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/report-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generationId,
          reason: reason.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setError('You can only submit 10 reports per hour. Please try again later.')
        } else if (response.status === 409) {
          setError('You have already reported this content.')
          setIsReported(true)
        } else {
          setError(data.error || 'Failed to submit report')
        }
        return
      }

      // Success
      setSuccess(true)
      setIsReported(true)
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
        setReason('')
      }, 2000)
    } catch (error) {
      console.error('Report submission error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        onClick={() => setIsOpen(true)}
        className="text-gray-500 hover:text-red-600"
        title="Report inappropriate content"
      >
        <Flag className="h-4 w-4" />
        {variant === 'text' && <span className="ml-2">Report</span>}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Report Inappropriate Content</DialogTitle>
            <DialogDescription>
              Help us keep PixPaw AI safe for everyone. Please describe why this content violates our community guidelines.
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-600">
                Report Submitted
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Thank you for helping us maintain a safe community.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="reason" className="text-sm font-medium">
                    Reason for reporting *
                  </label>
                  <Textarea
                    id="reason"
                    placeholder="Please describe the issue (e.g., inappropriate content, offensive imagery, spam, etc.)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="resize-none"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    {reason.length}/500 characters (minimum 10)
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> False reports may result in account restrictions. 
                    Reports are reviewed by our moderation team within 24 hours.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || reason.trim().length < 10}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Flag className="mr-2 h-4 w-4" />
                      Submit Report
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
