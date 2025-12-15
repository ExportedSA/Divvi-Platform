'use client'

/**
 * KYC Review Queue
 * 
 * Admin interface for reviewing and approving/rejecting KYC documents.
 */

import { useEffect, useState } from 'react'

interface KYCRequest {
  id: string
  userId: string
  userName: string
  userEmail: string
  documentType: string
  documentUrl: string
  submittedAt: string
}

interface RequestDetails {
  id: string
  userId: string
  documentType: string
  documentNumber: string | null
  documentExpiry: string | null
  documentUrl: string
  additionalUrls: string[]
  status: string
  submittedAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    country: string
    region: string
  }
}

export default function KYCReviewPage() {
  const [requests, setRequests] = useState<KYCRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<RequestDetails | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [notes, setNotes] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    try {
      const response = await fetch('/api/kyc/admin')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.pending || [])
      }
    } catch (error) {
      console.error('Failed to fetch KYC requests:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRequestDetails(id: string) {
    try {
      const response = await fetch(`/api/kyc/admin?id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedRequest(data)
      }
    } catch (error) {
      console.error('Failed to fetch request details:', error)
    }
  }

  async function handleApprove() {
    if (!selectedRequest) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/kyc/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: 'approve',
          notes,
        }),
      })

      if (response.ok) {
        setSelectedRequest(null)
        setNotes('')
        fetchRequests()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to approve')
      }
    } catch (error) {
      console.error('Failed to approve:', error)
      alert('Failed to approve verification')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!selectedRequest || !rejectionReason) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/kyc/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: 'reject',
          reason: rejectionReason,
        }),
      })

      if (response.ok) {
        setSelectedRequest(null)
        setRejectionReason('')
        setShowRejectModal(false)
        fetchRequests()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to reject')
      }
    } catch (error) {
      console.error('Failed to reject:', error)
      alert('Failed to reject verification')
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDocType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">KYC Review Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and verify user identity documents
        </p>
      </div>

      <div className="flex gap-6">
        {/* Request List */}
        <div className="w-1/3">
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-sm font-medium text-gray-900">
                Pending Requests ({requests.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {requests.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No pending requests
                </div>
              ) : (
                requests.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => fetchRequestDetails(request.id)}
                    className={`w-full text-left p-4 hover:bg-gray-50 ${
                      selectedRequest?.id === request.id ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.userName}
                        </p>
                        <p className="text-sm text-gray-500">{request.userEmail}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        {formatDocType(request.documentType)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(request.submittedAt)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="flex-1">
          {selectedRequest ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Verification Request Details
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {/* User Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">User Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">
                        {selectedRequest.user.firstName} {selectedRequest.user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium">{selectedRequest.user.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Role</p>
                      <p className="font-medium">{selectedRequest.user.role}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium">
                        {selectedRequest.user.region}, {selectedRequest.user.country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Document Info */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Document Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Document Type</p>
                      <p className="font-medium">{formatDocType(selectedRequest.documentType)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="font-medium">{formatDate(selectedRequest.submittedAt)}</p>
                    </div>
                    {selectedRequest.documentNumber && (
                      <div>
                        <p className="text-xs text-gray-500">Document Number</p>
                        <p className="font-medium">{selectedRequest.documentNumber}</p>
                      </div>
                    )}
                    {selectedRequest.documentExpiry && (
                      <div>
                        <p className="text-xs text-gray-500">Expiry Date</p>
                        <p className="font-medium">
                          {new Date(selectedRequest.documentExpiry).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Preview */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Document Preview</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <a
                      href={selectedRequest.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Document
                    </a>
                    {selectedRequest.additionalUrls?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {selectedRequest.additionalUrls.map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 flex items-center text-sm"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Additional Document {index + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">
                    Review Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    rows={3}
                    placeholder="Add any notes about this verification..."
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Select a request to review</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reject Verification</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for rejection. This will be sent to the user.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason('')
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
