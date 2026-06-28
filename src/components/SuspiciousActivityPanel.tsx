/**
 * Suspicious Activity Panel - Shows anomalies and repeat offenders
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, TrendingUp, Users } from 'lucide-react'

interface Offender {
  id: string
  displayName: string
  email: string
  violationCount: number
  resolvedCount: number
  latestViolation: string
  violationCategories: string[]
}

interface Anomaly {
  id: string
  userId: string
  anomalyType: string
  severity: string
  riskLevel: string
  details: string
  status: string
  createdAt: string
}

interface RiskProfile {
  userId: string
  displayName: string
  riskScore: number
  riskLevel: string
  factors: string[]
  metrics: {
    violationCount: number
    reportCount: number
    accountAgeDays: number
    recentActivityCount: number
  }
}

export function SuspiciousActivityPanel() {
  const [activeTab, setActiveTab] = useState<'offenders' | 'anomalies' | 'trends'>('offenders')
  const [offenders, setOffenders] = useState<Offender[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<RiskProfile | null>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)

        if (activeTab === 'offenders') {
          const response = await fetch('/api/admin/suspicious-activity/repeat-offenders')
          if (!response.ok) throw new Error('Failed to fetch offenders')
          const data = await response.json()
          setOffenders(data.offenders)
        } else if (activeTab === 'anomalies') {
          const response = await fetch('/api/admin/suspicious-activity/anomalies')
          if (!response.ok) throw new Error('Failed to fetch anomalies')
          const data = await response.json()
          setAnomalies(data.anomalies)
        }

        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetch()
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [activeTab])


  const fetchUserRiskProfile = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/suspicious-activity/user/${userId}/risk`)
      if (!response.ok) throw new Error('Failed to fetch risk profile')
      const data = await response.json()
      setSelectedUser(data.profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch risk profile')
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b">
        {(['offenders', 'anomalies', 'trends'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : activeTab === 'offenders' ? (
        <RepeatOffendersTab offenders={offenders} onSelectUser={fetchUserRiskProfile} />
      ) : activeTab === 'anomalies' ? (
        <AnomaliesTab anomalies={anomalies} getRiskColor={getRiskColor} />
      ) : (
        <TrendsTab />
      )}

      {selectedUser && (
        <RiskProfileModal
          profile={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

function RepeatOffendersTab({
  offenders,
  onSelectUser,
}: {
  offenders: Offender[]
  onSelectUser: (userId: string) => void
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Users className="w-5 h-5" />
        Repeat Offenders (30 days)
      </h3>

      {offenders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No repeat offenders detected</div>
      ) : (
        <div className="space-y-2">
          {offenders.map((offender) => (
            <button
              key={offender.id}
              type="button"
              className="bg-white border rounded-lg p-4 hover:shadow-md text-left w-full"
              onClick={() => onSelectUser(offender.id)}
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{offender.displayName}</span>
                    <span className="text-xs text-gray-500">{offender.email}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {offender.violationCategories.map((cat) => (
                      <span key={cat} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-600">{offender.violationCount}</div>
                  <p className="text-xs text-gray-600">violations</p>
                  {offender.resolvedCount > 0 && (
                    <p className="text-xs text-green-600">{offender.resolvedCount} resolved</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AnomaliesTab({ anomalies, getRiskColor }: { anomalies: Anomaly[]; getRiskColor: (level: string) => string }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Detected Anomalies
      </h3>

      {anomalies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No anomalies detected</div>
      ) : (
        <div className="space-y-2">
          {anomalies.map((anomaly) => (
            <div
              key={anomaly.id}
              className={`border rounded-lg p-4 ${getRiskColor(anomaly.riskLevel)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold capitalize">{anomaly.anomalyType.replace('_', ' ')}</p>
                  <p className="text-sm opacity-75">{anomaly.details}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {new Date(anomaly.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase px-2 py-1 bg-black bg-opacity-10 rounded">
                  {anomaly.riskLevel}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface TrendData {
  summary: {
    totalEscalations: number
    highSeverityCount: number
  }
  data: Array<{
    date: string
    total: number
  }>
}

function TrendsTab() {
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const response = await fetch('/api/admin/suspicious-activity/trends')
        if (!response.ok) throw new Error('Failed to fetch trends')
        const data = await response.json()
        setTrends(data.trends)
      } finally {
        setLoading(false)
      }
    }

    fetchTrends()
  }, [])

  if (loading) return <div>Loading trends...</div>

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Trend Analysis
      </h3>

      {trends && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 text-sm">Total Escalations (7 days)</p>
              <p className="text-3xl font-bold">{trends.summary.totalEscalations}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">High Severity</p>
              <p className="text-3xl font-bold text-orange-600">
                {trends.summary.highSeverityCount}
              </p>
            </div>
          </div>

          <div>
            <p className="text-gray-600 text-sm mb-3">Daily Activity</p>
            <div className="space-y-2">
              {trends.data.slice(0, 7).map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-20">{day.date}</span>
                  <div className="flex-1 bg-gray-200 rounded h-6">
                    <div
                      className="bg-blue-600 h-6 rounded"
                      style={{
                        width: `${(day.total / (trends.data[0]?.total || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-8 text-right">{day.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RiskProfileModal({
  profile,
  onClose,
}: {
  profile: RiskProfile
  onClose: () => void
}) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-blue-600 bg-blue-100'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Risk Profile</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div>
          <p className="text-gray-600 text-sm">User</p>
          <p className="font-semibold">{profile.displayName}</p>
        </div>

        <div className="bg-gray-50 rounded p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Risk Score</p>
            <p className={`text-2xl font-bold ${getRiskColor(profile.riskLevel)}`}>
              {profile.riskScore}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                profile.riskLevel === 'critical' ? 'bg-red-600' :
                profile.riskLevel === 'high' ? 'bg-orange-600' :
                profile.riskLevel === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'
              }`}
              style={{ width: `${profile.riskScore}%` }}
            />
          </div>
        </div>

        <div>
          <p className="text-gray-600 text-sm mb-2">Risk Factors</p>
          <div className="space-y-1">
            {profile.factors.map((factor) => (
              <div key={factor} className="text-sm text-gray-700">
                • {factor.replace('_', ' ')}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-gray-600">Violations</p>
            <p className="text-2xl font-bold">{profile.metrics.violationCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Account Age</p>
            <p className="text-2xl font-bold">{profile.metrics.accountAgeDays}d</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  )
}
