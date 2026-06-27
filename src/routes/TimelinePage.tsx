import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { BeforeAfter } from '../components/BeforeAfter'
import { Hotspots } from '../components/Hotspots'
import { SocialEmbed } from '../components/SocialEmbed'
import { useArticles } from '../hooks/useArticles'
import { categoryMap } from '../data/categories'
import { buildTimeline, groupByYear } from '../lib/timeline'
import { formatDate } from '../lib/filterArticles'

const TRAILER_HOTSPOTS = [
  { id: 'h1', x: 30, y: 40, label: 'Vice City Skyline', detail: 'Die Neon-Skyline im Hintergrund verweist auf das Downtown-Setting.' },
  { id: 'h2', x: 64, y: 58, label: 'Lucia & Jason', detail: 'Das Protagonisten-Duo im Zentrum der Szene.' },
  { id: 'h3', x: 82, y: 30, label: 'Wetter-System', detail: 'Wolkenformationen deuten das dynamische Hurrikan-Wetter an.' },
]

export function TimelinePage() {
  const { articles } = useArticles()
  const grouped = useMemo(() => groupByYear(buildTimeline(articles)), [articles])

  return (
    <>
      <Seo title="Release-Timeline" path="/timeline" />
      <header className="page-head">
        <h1 className="page-head__title">🕒 Release-Timeline</h1>
        <p className="page-head__desc">Alle Ankündigungen chronologisch bis zum Release am 19. November 2026.</p>
      </header>

      <div className="timeline">
        {grouped.map(({ year, events }) => (
          <section key={year} className="timeline__year">
            <h2 className="timeline__year-label">{year}</h2>
            <ol className="timeline__list">
              {events.map((e, i) => (
                <li key={`${e.date}-${i}`} className={`timeline__item timeline__item--${e.kind}`}>
                  <span className="timeline__dot" aria-hidden="true" />
                  <time className="timeline__date" dateTime={e.date}>{formatDate(e.date)}</time>
                  <div className="timeline__body">
                    {e.kind === 'milestone' ? (
                      <strong className="timeline__milestone">🏁 {e.title}</strong>
                    ) : (
                      <Link to={`/news/${e.id}`}>
                        <span className={`card__tag tag--${e.category}`}>{categoryMap[e.category!]?.label}</span> {e.title}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section className="trailer-analysis">
        <h2 className="section-title">Trailer-Analyse</h2>
        <p className="page-head__desc">Vergleich und annotierte Standbilder aus den Trailern.</p>
        <div className="trailer-analysis__grid">
          <div>
            <h3>Trailer 1 → Trailer 2</h3>
            <BeforeAfter
              beforeSrc="https://picsum.photos/seed/gta6-trailer1/800/450"
              afterSrc="https://picsum.photos/seed/gta6-trailer2/800/450"
              beforeLabel="Trailer 1"
              afterLabel="Trailer 2"
            />
          </div>
          <div>
            <h3>Frame-Analyse</h3>
            <Hotspots
              image="https://picsum.photos/seed/gta6-frame/800/450"
              hotspots={TRAILER_HOTSPOTS}
              caption="Klicke die Marker für Details zur Szene."
            />
          </div>
        </div>

        <h3 className="section-title">Community-Reaktion</h3>
        <SocialEmbed
          platform="X (Twitter)"
          author="@GTA6Fans"
          preview="Trailer 2 in 4K bei Nacht ist einfach unfassbar — Vice City sieht lebendiger aus als je zuvor! 🌴🔥"
          url="https://twitter.com"
        />
      </section>
    </>
  )
}
