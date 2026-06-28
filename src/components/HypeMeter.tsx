import { useMemo } from 'react'
import { useArticles } from '../hooks/useArticles'
import { computeHypeMeter } from '../lib/interactiveTools'

export function HypeMeter() {
  const { articles } = useArticles()
  const hype = useMemo(() => computeHypeMeter(articles), [articles])

  return (
    <div className="hype-meter">
      <div className="hype-meter__label">
        Community Hype: <strong>{hype.label}</strong>
      </div>
      <div className="hype-meter__bar-wrap">
        <div className="hype-meter__bar" style={{ width: `${hype.score}%` }} />
      </div>
      <div className="hype-meter__score">{hype.score}/100</div>
    </div>
  )
}
