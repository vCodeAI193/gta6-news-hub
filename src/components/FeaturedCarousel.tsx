import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { categoryMap } from '../data/categories'
import { usePrefersReducedMotion } from '../hooks/useMediaQuery'
import type { Article } from '../types'

/** Auto-rotierendes Hero-Karussell für hervorgehobene Top-News. */
export function FeaturedCarousel({ articles }: { articles: Article[] }) {
  const [index, setIndex] = useState(0)
  const reduceMotion = usePrefersReducedMotion()
  const count = articles.length

  useEffect(() => {
    if (reduceMotion || count <= 1) return
    const id = setInterval(() => setIndex((i) => (i + 1) % count), 6000)
    return () => clearInterval(id)
  }, [count, reduceMotion])

  if (count === 0) return null
  const current = articles[index]

  return (
    <div className="carousel" aria-roledescription="carousel" aria-label="Top-News">
      <Link to={`/news/${current.id}`} className="carousel__slide">
        <img src={current.image} alt="" className="carousel__img" />
        <div className="carousel__overlay">
          <span className={`card__tag tag--${current.category}`}>
            {categoryMap[current.category]?.label}
          </span>
          <h2 className="carousel__title">{current.title}</h2>
          <p className="carousel__excerpt">{current.excerpt}</p>
        </div>
      </Link>
      {count > 1 && (
        <div className="carousel__dots" role="tablist">
          {articles.map((a, i) => (
            <button
              key={a.id}
              type="button"
              className={`carousel__dot${i === index ? ' carousel__dot--active' : ''}`}
              aria-label={`Slide ${i + 1}`}
              aria-selected={i === index}
              role="tab"
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
