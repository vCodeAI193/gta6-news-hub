/**
 * Moderation Dashboard - Main admin panel for moderating content
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, TrendingUp, Users } from 'lucide-react'

interface DashboardStats {
  escalations: {
    today: number
    last24h: number
    pending: number
    critical: number
  }
  anomalies: {
    detected24h: number
    critical: number
  }
  topCategories: Array<{ category: string; count: number }>
  repeatOffenders: number
}

export function ModerationDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
    const interval = setInterval(fetchDashboardStats, 30000) // Refresh every 30s

    return () => clearInterval(interval)
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/moderation/dashboard')
      if (!response.ok) throw new Error('Failed to fetch dashboard stats')

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error}
        </div>
      )}

      {stats && (
        <>
          {/* Escalation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Today's Escalations"
              value={stats.escalations.today}
              icon={<TrendingUp className="w-6 h-6" />}
              color="blue"
            />
            <StatCard
              title="Last 24h"
              value={stats.escalations.last24h}
              icon={<Clock className="w-6 h-6" />}
              color="orange"
            />
            <StatCard
              title="Pending Review"
              value={stats.escalations.pending}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="yellow"
            />
            <StatCard
              title="Critical"
              value={stats.escalations.critical}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="red"
            />
          </div>

          {/* Anomaly Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Detected Anomalies (24h)"
              value={stats.anomalies.detected24h}
              icon={<Users className="w-6 h-6" />}
              color="purple"
            />
            <StatCard
              title="Critical Risk Users"
              value={stats.anomalies.critical}
              icon={<AlertTriangle className="w-6 h-6" />}
              color="red"
            />
          </div>

          {/* Top Categories */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Top Violation Categories</h2>
            <div className="space-y-3">
              {stats.topCategories.map((cat) => (
                <div key={cat.category} className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize">{cat.category.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-48 bg-gray-200 rounded h-2">
                      <div
                        className="bg-blue-600 h-2 rounded"
                        style={{
                          width: `${(cat.count / (stats.topCategories[0]?.count || 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-gray-600 font-medium min-w-12 text-right">{cat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Repeat Offenders */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Repeat Offenders (7 days)
            </h2>
            <p className="text-2xl font-bold text-red-600">{stats.repeatOffenders}</p>
            <p className="text-gray-600 text-sm">Users with 3+ violations</p>
          </div>
        </>
      )}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'orange' | 'yellow' | 'red' | 'purple'
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    orange: 'text-orange-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  }

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={iconColorClasses[color]}>{icon}</div>
      </div>
    </div>
  )
}
