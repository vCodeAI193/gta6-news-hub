/**
 * Map Heatmap Service
 * Visualize data density and geographic patterns on maps
 */

export interface HeatmapPoint {
  lat: number
  lng: number
  value: number // intensity 0-1
  label?: string
  data?: Record<string, unknown>
}

export interface HeatmapCluster {
  lat: number
  lng: number
  count: number
  intensity: number
  points: HeatmapPoint[]
}

export interface HeatmapOptions {
  radius: number // pixels
  blur: number // pixels
  maxIntensity: number // 0-1
  gradient: {
    [key: number]: string // position: color
  }
}

export interface LocationData {
  location: { lat: number; lng: number }
  metrics: Record<string, number>
  timestamp: number
}

class MapHeatmapService {
  private static readonly DEFAULT_RADIUS = 20
  private static readonly DEFAULT_BLUR = 15
  private static readonly DEFAULT_GRADIENT = {
    0: '#3357ff',
    0.25: '#35ffff',
    0.5: '#35ff35',
    0.75: '#ffff35',
    1: '#ff3535',
  }

  /**
   * Generate heatmap from location data
   */
  generateHeatmap(
    points: HeatmapPoint[],
    options: Partial<HeatmapOptions> = {}
  ): {
    points: HeatmapPoint[]
    clusters: HeatmapCluster[]
    bounds: {
      north: number
      south: number
      east: number
      west: number
    }
  } {
    const heatmapOptions: HeatmapOptions = {
      radius: options.radius || MapHeatmapService.DEFAULT_RADIUS,
      blur: options.blur || MapHeatmapService.DEFAULT_BLUR,
      maxIntensity: options.maxIntensity || 1,
      gradient: options.gradient || MapHeatmapService.DEFAULT_GRADIENT,
    }

    const clusters = this.clusterPoints(points)
    const bounds = this.calculateBounds(points)

    return {
      points: this.normalizeIntensities(points, heatmapOptions.maxIntensity),
      clusters,
      bounds,
    }
  }

  /**
   * Cluster points based on proximity
   */
  clusterPoints(points: HeatmapPoint[], distance: number = 0.1): HeatmapCluster[] {
    const clusters: HeatmapCluster[] = []
    const used = new Set<number>()

    for (let i = 0; i < points.length; i++) {
      if (used.has(i)) continue

      const cluster: HeatmapPoint[] = [points[i]!]
      used.add(i)

      for (let j = i + 1; j < points.length; j++) {
        if (used.has(j)) continue

        const dist = this.calculateDistance(points[i]!, points[j]!)
        if (dist < distance) {
          cluster.push(points[j]!)
          used.add(j)
        }
      }

      const avgLat = cluster.reduce((sum, p) => sum + p.lat, 0) / cluster.length
      const avgLng = cluster.reduce((sum, p) => sum + p.lng, 0) / cluster.length
      const avgValue = cluster.reduce((sum, p) => sum + p.value, 0) / cluster.length

      clusters.push({
        lat: avgLat,
        lng: avgLng,
        count: cluster.length,
        intensity: avgValue,
        points: cluster,
      })
    }

    return clusters
  }

  /**
   * Get heatmap for specific metric
   */
  async getMetricHeatmap(
    metric: string,
    dateRange: { start: number; end: number }
  ): Promise<HeatmapPoint[]> {
    try {
      const response = await fetch('/api/heatmap/metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric, dateRange }),
      })

      if (!response.ok) return []
      const data = await response.json()
      return data.points || []
    } catch {
      return []
    }
  }

  /**
   * Get user activity heatmap
   */
  async getUserActivityHeatmap(userId: string): Promise<HeatmapPoint[]> {
    try {
      const response = await fetch(`/api/heatmap/user-activity/${userId}`)
      if (!response.ok) return []
      const data = await response.json()
      return data.points || []
    } catch {
      return []
    }
  }

  /**
   * Get geographic distribution of content
   */
  async getContentDistributionHeatmap(): Promise<HeatmapPoint[]> {
    try {
      const response = await fetch('/api/heatmap/content-distribution')
      if (!response.ok) return []
      const data = await response.json()
      return data.points || []
    } catch {
      return []
    }
  }

  /**
   * Get heatmap of article engagement
   */
  async getEngagementHeatmap(): Promise<HeatmapPoint[]> {
    try {
      const response = await fetch('/api/heatmap/engagement')
      if (!response.ok) return []
      const data = await response.json()
      return data.points || []
    } catch {
      return []
    }
  }

  /**
   * Calculate distance between two points (haversine formula)
   */
  calculateDistance(point1: HeatmapPoint, point2: HeatmapPoint): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Get statistics for heatmap data
   */
  getHeatmapStats(points: HeatmapPoint[]): {
    totalPoints: number
    minValue: number
    maxValue: number
    averageValue: number
    medianValue: number
  } {
    if (points.length === 0) {
      return {
        totalPoints: 0,
        minValue: 0,
        maxValue: 0,
        averageValue: 0,
        medianValue: 0,
      }
    }

    const values = points.map(p => p.value).sort((a, b) => a - b)

    return {
      totalPoints: points.length,
      minValue: values[0]!,
      maxValue: values[values.length - 1]!,
      averageValue: values.reduce((a, b) => a + b, 0) / values.length,
      medianValue: values[Math.floor(values.length / 2)]!,
    }
  }

  /**
   * Get color for intensity value
   */
  getColorForValue(value: number, gradient: Record<number, string> = MapHeatmapService.DEFAULT_GRADIENT): string {
    const normalized = Math.max(0, Math.min(1, value))
    const keys = Object.keys(gradient)
      .map(Number)
      .sort((a, b) => a - b)

    if (normalized <= keys[0]!) return gradient[keys[0]!]!
    if (normalized >= keys[keys.length - 1]!) return gradient[keys[keys.length - 1]!]!

    for (let i = 0; i < keys.length - 1; i++) {
      if (normalized >= keys[i]! && normalized <= keys[i + 1]!) {
        return gradient[keys[i]!]!
      }
    }

    return gradient[keys[0]!]!
  }

  /**
   * Analyze heatmap trends
   */
  analyzeTrends(historicalData: HeatmapPoint[][]): {
    growth: number // percentage
    hotspots: Array<{ lat: number; lng: number; trend: number }>
    coldspotsBecomingHot: Array<{ lat: number; lng: number }>
  } {
    if (historicalData.length < 2) {
      return { growth: 0, hotspots: [], coldspotsBecomingHot: [] }
    }

    const current = historicalData[historicalData.length - 1]!
    const previous = historicalData[historicalData.length - 2]!

    const currentTotal = current.reduce((sum, p) => sum + p.value, 0)
    const previousTotal = previous.reduce((sum, p) => sum + p.value, 0)
    const growth = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0

    return { growth, hotspots: [], coldspotsBecomingHot: [] }
  }

  private calculateBounds(points: HeatmapPoint[]): {
    north: number
    south: number
    east: number
    west: number
  } {
    if (points.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 }
    }

    const lats = points.map(p => p.lat)
    const lngs = points.map(p => p.lng)

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    }
  }

  private normalizeIntensities(points: HeatmapPoint[], maxIntensity: number): HeatmapPoint[] {
    const values = points.map(p => p.value)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1

    return points.map(point => ({
      ...point,
      value: ((point.value - min) / range) * maxIntensity,
    }))
  }
}

export const mapHeatmapService = new MapHeatmapService()
