/**
 * Video Moderation Panel - Review and manage video content analysis
 */

import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle } from 'lucide-react'

interface VideoAnalysis {
  id: string
  videoId: string
  status: string
  severity: string
  framesAnalyzed: number
  violationsFound: number
  flaggedForReview: boolean
  reviewReason: string
  completedAt: string
}

interface VideoViolation {
  frameNumber: number
  timestamp: string
  type: string
  confidence: number
}

export function VideoModerationPanel() {
  const [analyses, setAnalyses] = useState<VideoAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<VideoAnalysis | null>(null)
  const [analysisDetail, setAnalysisDetail] = useState<VideoAnalysis | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('flagged')

  useEffect(() => {
    fetchVideoAnalyses()
    const interval = setInterval(fetchVideoAnalyses, 30000)
    return () => clearInterval(interval)
  }, [filterStatus])

  const fetchVideoAnalyses = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      params.append('limit', '20')

      const response = await fetch(`/api/admin/video-moderation/queue?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analyses')

      const data = await response.json()
      setAnalyses(data.analyses)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalysisDetail = async (analysisId: string) => {
    try {
      const response = await fetch(`/api/admin/video-moderation/${analysisId}`)
      if (!response.ok) throw new Error('Failed to fetch analysis detail')

      const data = await response.json()
      setAnalysisDetail(data.report)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch detail')
    }
  }

  const handleSelectAnalysis = (analysis: VideoAnalysis) => {
    setSelectedAnalysis(analysis)
    fetchAnalysisDetail(analysis.id)
  }

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Video Content Moderation</h2>
        <button
          onClick={fetchVideoAnalyses}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-4 border-b">
        {['flagged', 'all', 'approved'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              filterStatus === status
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Analysis List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No analyses found</div>
          ) : (
            analyses.map((analysis) => (
              <button
                key={analysis.id}
                type="button"
                onClick={() => handleSelectAnalysis(analysis)}
                className={`border rounded-lg p-4 cursor-pointer transition text-left w-full ${
                  selectedAnalysis?.id === analysis.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">{analysis.videoId}</span>
                      {analysis.flaggedForReview && (
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded border ${getSeverityColor(
                          analysis.severity
                        )}`}
                      >
                        {analysis.severity || 'pending'}
                      </span>
                    </div>

                    <div className="flex gap-4 text-xs text-gray-600 mb-2">
                      <span>{analysis.framesAnalyzed} frames analyzed</span>
                      {analysis.violationsFound > 0 && (
                        <span className="text-red-600 font-semibold">
                          {analysis.violationsFound} violations
                        </span>
                      )}
                    </div>

                    {analysis.reviewReason && (
                      <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                        {analysis.reviewReason}
                      </p>
                    )}

                    {analysis.completedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(analysis.completedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {analysis.status === 'approved' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selectedAnalysis && analysisDetail && (
          <VideoAnalysisDetail analysis={analysisDetail} />
        )}
      </div>
    </div>
  )
}

function VideoAnalysisDetail({ analysis }: { analysis: VideoAnalysis }) {
  return (
    <div className="border rounded-lg p-6 space-y-4 sticky top-6">
      <h3 className="text-lg font-bold">Analysis Details</h3>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-gray-600">Video ID</p>
          <p className="font-semibold break-all">{analysis.videoId}</p>
        </div>

        <div>
          <p className="text-gray-600">Status</p>
          <p className="font-semibold capitalize">{analysis.status}</p>
        </div>

        {analysis.severity && (
          <div>
            <p className="text-gray-600">Severity</p>
            <p className="font-semibold capitalize">{analysis.severity}</p>
          </div>
        )}

        <div>
          <p className="text-gray-600">Frames Analyzed</p>
          <p className="font-semibold">{analysis.summary?.totalFramesAnalyzed}</p>
        </div>

        <div>
          <p className="text-gray-600">Violations Found</p>
          <p className="font-semibold text-red-600">{analysis.summary?.violationsFound}</p>
        </div>
      </div>

      {/* Violation Timeline */}
      {analysis.timeline && analysis.timeline.length > 0 && (
        <div className="pt-4 border-t space-y-3">
          <h4 className="font-semibold">Violations Timeline</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analysis.timeline.map((event: VideoViolation, idx: number) => (
              <div
                key={idx}
                className="bg-red-50 border border-red-200 rounded p-3 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold capitalize">
                    {event.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs bg-red-200 px-2 py-1 rounded">
                    {(event.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-gray-700">
                  Frame {event.frameNumber} • {event.timestamp}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <button
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          <CheckCircle className="w-4 h-4" />
          Approve
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          <AlertTriangle className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>
  )
}
