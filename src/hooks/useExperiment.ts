import { useEffect, useState } from 'react'
import { getAssignments, trackAb } from '../services/experiments'

/**
 * Liefert die zugewiesene Variante eines A/B-Experiments und protokolliert die
 * Ansicht. `convert()` meldet eine Conversion.
 */
export function useExperiment(experiment: string) {
  const [variant, setVariant] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getAssignments().then((a) => {
      if (!active) return
      const v = a[experiment] ?? null
      setVariant(v)
      if (v) trackAb(experiment, v, 'view')
    })
    return () => {
      active = false
    }
  }, [experiment])

  return {
    variant,
    convert: () => variant && trackAb(experiment, variant, 'convert'),
  }
}
