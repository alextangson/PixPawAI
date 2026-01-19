/**
 * Reports Client Component
 * 
 * Interactive UI for reviewing and taking action on reports
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Eye, 
  Trash2, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  XCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Report {
  id: string
  reporter_id: string
  generation_id: string
  reason: string
  status: 'pending' | 'reviewing' | 'action_taken' | 'dismissed'
  admin_notes: string | null
  created_at: string
  reporter: {
    id: string
    email: string
    full_name: string | null
  }
  generation: {
    id: string
    output_url: string
    style: string
    prompt: string | null
    user_id: string
    is_public: boolean
    created_at: string
    owner: {
      id: string
      email: string
      full_name: string | null
    }
  }
}

interface ReportsClientProps {
  initialReports: Report[]
}

export default function ReportsClient({ initialReports }: ReportsClientProps) {
  const [reports, setReports] = useState(initialReports)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [actionType, setActionType] = useState<'dismiss' | 'delete' | 'warn' | 'ban' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'reviewing'>('pending')

  const filteredReports = reports.filter(r => {
    if (filterStatus === 'all') return true
    return r.status === filterStatus
  })

  const handleOpenAction = (report: Report, action: typeof actionType) => {
    setSelectedReport(report)
    setActionType(action)
    setAdminNotes('')
  }

  const handleSubmitAction = async () => {
    if (!selectedReport || !actionType) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/moderate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          action: actionType,
          adminNotes: adminNotes.trim(),
          generationId: selectedReport.generation_id,
          contentOwnerId: selectedReport.generation.user_id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit action')
      }

      // Update local state
      setReports(prev => prev.map(r => 
        r.id === selectedReport.id 
          ? { ...r, status: 'action_taken' as const, admin_notes: adminNotes }
          : r
      ))

      // Close dialog
      setSelectedReport(null)
      setActionType(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Error submitting action:', error)
      alert('Failed to submit action. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>
      case 'reviewing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Reviewing</Badge>
      case 'action_taken':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Action Taken</Badge>
      case 'dismissed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Dismissed</Badge>
    }
  }

  const getActionIcon = (action: typeof actionType) => {
    switch (action) {
      case 'dismiss':
        return <XCircle className="h-4 w-4" />
      case 'delete':
        return <Trash2 className="h-4 w-4" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4" />
      case 'ban':
        return <Ban className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filterStatus === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('pending')}
          size="sm"
        >
          Pending ({reports.filter(r => r.status === 'pending').length})
        </Button>
        <Button
          variant={filterStatus === 'reviewing' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('reviewing')}
          size="sm"
        >
          Reviewing ({reports.filter(r => r.status === 'reviewing').length})
        </Button>
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterStatus('all')}
          size="sm"
        >
          All ({reports.length})
        </Button>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900">No {filterStatus} reports</p>
          <p className="text-gray-600">All caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div key={report.id} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex gap-6">
                {/* Image Preview */}
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={report.generation.output_url}
                      alt="Reported content"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Report Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">Report #{report.id.substring(0, 8)}</h3>
                      <p className="text-sm text-gray-500">
                        Reported {new Date(report.created_at).toLocaleDateString()} at {new Date(report.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {getStatusBadge(report.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Reason:</span>
                      <p className="text-sm text-gray-900 mt-1">{report.reason}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Reporter:</span>
                        <p className="text-gray-900">{report.reporter.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Content Owner:</span>
                        <p className="text-gray-900">{report.generation.owner.email}</p>
                      </div>
                    </div>

                    {report.generation.prompt && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Prompt:</span>
                        <p className="text-sm text-gray-600 italic">{report.generation.prompt}</p>
                      </div>
                    )}

                    {report.admin_notes && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                        <span className="text-sm font-medium text-blue-900">Admin Notes:</span>
                        <p className="text-sm text-blue-800">{report.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {report.status === 'pending' || report.status === 'reviewing' ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/gallery/${report.generation_id}`, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Full
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAction(report, 'dismiss')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 hover:text-orange-700"
                        onClick={() => handleOpenAction(report, 'warn')}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Warn User
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleOpenAction(report, 'delete')}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Content
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-800 hover:text-red-900"
                        onClick={() => handleOpenAction(report, 'ban')}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Ban User
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!selectedReport && !!actionType} onOpenChange={() => {
        setSelectedReport(null)
        setActionType(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getActionIcon(actionType)}
              {actionType === 'dismiss' && 'Dismiss Report'}
              {actionType === 'delete' && 'Delete Content'}
              {actionType === 'warn' && 'Warn User'}
              {actionType === 'ban' && 'Ban User'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'dismiss' && 'Mark this report as reviewed with no action needed.'}
              {actionType === 'delete' && 'Remove this content from the public gallery and mark user for review.'}
              {actionType === 'warn' && 'Issue a warning to the content owner. Repeated violations may result in a ban.'}
              {actionType === 'ban' && 'Permanently ban this user from creating new content.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add internal notes about this decision..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedReport(null)
                setActionType(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={isSubmitting}
              className={
                actionType === 'delete' || actionType === 'ban'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm {actionType === 'dismiss' ? 'Dismissal' : 'Action'}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
