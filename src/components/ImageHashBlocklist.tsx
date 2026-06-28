/**
 * Image Hash Blocklist - Manage image hash blocklist for known illegal content
 */

import React, { useState, useEffect } from 'react'
import { Trash2, Plus, Search, Shield } from 'lucide-react'

interface HashEntry {
  id: string
  reason: string
  severity: string
  reportedCount: number
  createdAt: string
}

interface BlocklistStats {
  totalHashes: number
  byReason: Array<{ reason: string; count: number }>
  bySeverity: Array<{ severity: string; count: number }>
}

export function ImageHashBlocklist() {
  const [entries, setEntries] = useState<HashEntry[]>([])
  const [stats, setStats] = useState<BlocklistStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchReason, setSearchReason] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchBlocklist()
  }, [searchReason])

  const fetchBlocklist = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (searchReason) params.append('reason', searchReason)
      params.append('limit', '50')

      const response = await fetch(`/api/admin/image-hash/blocklist?${params}`)
      if (!response.ok) throw new Error('Failed to fetch blocklist')

      const data = await response.json()
      setEntries(data.entries)

      // Fetch stats
      const statsResponse = await fetch('/api/admin/image-hash/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveHash = async (hashId: string) => {
    if (!window.confirm('Are you sure you want to remove this hash from the blocklist?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/image-hash/${hashId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to remove hash')

      setEntries(entries.filter((e) => e.id !== hashId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove hash')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Image Hash Blocklist
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Hash
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-gray-600 text-sm">Total Hashes</p>
            <p className="text-3xl font-bold mt-2">{stats.totalHashes}</p>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <p className="text-gray-600 text-sm">By Severity</p>
            <div className="mt-3 space-y-1">
              {stats.bySeverity.map((s) => (
                <div key={s.severity} className="flex justify-between text-sm">
                  <span className="capitalize">{s.severity}</span>
                  <span className="font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <p className="text-gray-600 text-sm">By Reason</p>
            <div className="mt-3 space-y-1">
              {stats.byReason.slice(0, 3).map((r) => (
                <div key={r.reason} className="flex justify-between text-sm">
                  <span className="truncate capitalize">{r.reason.replace('_', ' ')}</span>
                  <span className="font-semibold">{r.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by reason..."
            value={searchReason}
            onChange={(e) => setSearchReason(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={fetchBlocklist}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {/* Blocklist Entries */}
      {loading ? (
        <div className="text-center py-8">Loading blocklist...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No entries found
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold capitalize">
                      {entry.reason.replace('_', ' ')}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-semibold ${
                        entry.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : entry.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {entry.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    ID: {entry.id.substring(0, 16)}...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Added: {new Date(entry.createdAt).toLocaleDateString()}
                    {entry.reportedCount > 0 && ` • Reported ${entry.reportedCount}x`}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveHash(entry.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="Remove from blocklist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Hash Form */}
      {showAddForm && (
        <AddHashForm onClose={() => setShowAddForm(false)} onAdded={fetchBlocklist} />
      )}
    </div>
  )
}

function AddHashForm({
  onClose,
  onAdded,
}: {
  onClose: () => void
  onAdded: () => void
}) {
  const [formData, setFormData] = useState({
    reason: 'illegal_content',
    severity: 'critical',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/image-hash/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to add hash')

      onAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add hash')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Add Image Hash</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reason-select" className="block text-sm font-medium mb-1">Reason</label>
            <select
              id="reason-select"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="illegal_content">Illegal Content</option>
              <option value="csam">CSAM</option>
              <option value="violent">Violent</option>
              <option value="hate_speech">Hate Speech</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label htmlFor="severity-select" className="block text-sm font-medium mb-1">Severity</label>
            <select
              id="severity-select"
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-700">
            Note: In production, you would upload an image file here. The hash would be calculated automatically.
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Adding...' : 'Add Hash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
