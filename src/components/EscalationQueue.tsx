/**
 * Escalation Queue - Shows pending escalations for moderators
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Escalation {
  id: string
  targetType: string
  targetId: string
  severity: number
  category: string
  status: string
  priority: string
  assignedTo: string | null
  createdAt: string
}

interface EscalationQueueProps {
  limit?: number
  priority?: string
}

export function EscalationQueue({ limit = 20, priority }: EscalationQueueProps) {
  const [escalations, setEscalations] = useState<Escalation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const params = new URLSearchParams()
        params.append('limit', String(limit))
        if (priority) params.append('priority', priority)

        const response = await fetch(`/api/admin/escalations/pending?${params}`)
        if (!response.ok) throw new Error('Failed to fetch escalations')

        const data = await response.json()
        setEscalations(data.escalations)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetch()
    const interval = setInterval(fetch, 15000) // Refresh every 15s

    return () => clearInterval(interval)
  }, [limit, priority])

  const fetchEscalations = async () => {
    try {
      const params = new URLSearchParams()
      params.append('limit', String(limit))
      if (priority) params.append('priority', priority)

      const response = await fetch(`/api/admin/escalations/pending?${params}`)
      if (!response.ok) throw new Error('Failed to fetch escalations')

      const data = await response.json()
      setEscalations(data.escalations)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (escalationId: string, moderatorId: string) => {
    try {
      const response = await fetch(`/api/admin/escalations/${escalationId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderatorId }),
      })

      if (!response.ok) throw new Error('Failed to assign')

      // Refresh list
      fetchEscalations()
      setSelectedEscalation(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign')
    }
  }

  const handleResolve = async (escalationId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/escalations/${escalationId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) throw new Error('Failed to resolve')

      fetchEscalations()
      setSelectedEscalation(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve')
    }
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 9) return 'bg-red-100 text-red-800'
    if (severity >= 7) return 'bg-orange-100 text-orange-800'
    if (severity >= 4) return 'bg-yellow-100 text-yellow-800'
    return 'bg-blue-100 text-blue-800'
  }

  const getPriorityIcon = (priority: string) => {
    if (priority === 'critical') return <AlertTriangle className="w-4 h-4" />
    if (priority === 'high') return <Clock className="w-4 h-4" />
    return <Clock className="w-4 h-4 opacity-50" />
  }

  if (loading) {
    return <div className="text-center py-8">Loading escalations...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Escalation Queue</h2>
        <div className="text-sm text-gray-600">
          {escalations.length} pending
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {escalations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No escalations pending
          </div>
        ) : (
          escalations.map((esc) => (
            <button
              key={esc.id}
              type="button"
              className="bg-white border rounded-lg p-4 hover:shadow-md transition cursor-pointer text-left w-full"
              onClick={() => setSelectedEscalation(esc)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getPriorityIcon(esc.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{esc.targetType}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getSeverityColor(esc.severity)}`}>
                        {esc.severity.toFixed(1)}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                        {esc.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{esc.targetId}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(esc.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {esc.assignedTo ? (
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Assigned
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-orange-600 text-sm">
                      <Clock className="w-4 h-4" />
                      Unassigned
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail Panel */}
      {selectedEscalation && (
        <EscalationDetail
          escalation={selectedEscalation}
          onAssign={handleAssign}
          onResolve={handleResolve}
          onClose={() => setSelectedEscalation(null)}
        />
      )}
    </div>
  )
}

interface EscalationDetailProps {
  escalation: Escalation
  onAssign: (escalationId: string, moderatorId: string) => Promise<void>
  onResolve: (escalationId: string, action: string) => Promise<void>
  onClose: () => void
}

function EscalationDetail({ escalation, onAssign, onResolve, onClose }: EscalationDetailProps) {
  const [assigning, setAssigning] = useState(false)

  const handleAssignClick = async () => {
    setAssigning(true)
    try {
      await onAssign(escalation.id, 'current-moderator')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full max-w-md rounded-t-lg shadow-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Escalation Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <p className="text-gray-600">Target</p>
            <p className="font-semibold">
              {escalation.targetType}: {escalation.targetId}
            </p>
          </div>

          <div>
            <p className="text-gray-600">Severity</p>
            <p className="font-semibold">{escalation.severity.toFixed(1)} / 10</p>
          </div>

          <div>
            <p className="text-gray-600">Category</p>
            <p className="font-semibold capitalize">{escalation.category.replace('_', ' ')}</p>
          </div>

          <div>
            <p className="text-gray-600">Created</p>
            <p className="font-semibold">
              {new Date(escalation.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!escalation.assignedTo && (
            <button
              onClick={handleAssignClick}
              disabled={assigning}
              className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {assigning ? 'Assigning...' : 'Assign to Me'}
            </button>
          )}

          <button
            onClick={() => onResolve(escalation.id, 'approved')}
            disabled={assigning}
            className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Approve
          </button>

          <button
            onClick={() => onResolve(escalation.id, 'rejected')}
            disabled={assigning}
            className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
          >
            <XCircle className="w-4 h-4 inline mr-2" />
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
