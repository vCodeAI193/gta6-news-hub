import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Seo } from '../components/Seo'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { TextToSpeech } from '../components/TextToSpeech'
import { loreEntries, loreById, type LoreType } from '../data/lore'
import { NotFoundPage } from './NotFoundPage'

const TYPE_LABEL: Record<LoreType, string> = {
  character: 'Charaktere',
  location: 'Orte',
  faction: 'Fraktionen',
}

export function LorePage() {
  const groups = (['character', 'location', 'faction'] as LoreType[])
    .map((type) => ({ type, entries: loreEntries.filter((e) => e.type === type) }))
    .filter((g) => g.entries.length > 0)

  return (
    <>
      <Seo title="Lore-Wiki" path="/lore" />
      <header className="page-head">
        <h1 className="page-head__title">📖 Charaktere & Lore</h1>
        <p className="page-head__desc">Strukturiertes Wiki zur Welt von GTA 6 — Figuren, Orte und mehr.</p>
      </header>

      {groups.map((g) => (
        <section key={g.type}>
          <h2 className="section-title">{TYPE_LABEL[g.type]}</h2>
          <div className="lore-grid">
            {g.entries.map((e) => (
              <Link key={e.id} to={`/lore/${e.id}`} className="lore-card">
                <img src={e.image} alt="" className="lore-card__img" loading="lazy" />
                <div className="lore-card__body">
                  <h3 className="lore-card__name">{e.name}</h3>
                  <p className="lore-card__summary">{e.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

export function LoreDetailPage() {
  const { id = '' } = useParams()
  const entry = loreById[id]
  if (!entry) return <NotFoundPage />

  return (
    <article className="lore-detail">
      <Seo title={entry.name} description={entry.summary} path={`/lore/${entry.id}`} image={entry.image} />
      <Breadcrumbs items={[{ label: 'Lore', to: '/lore' }, { label: entry.name }]} />

      <div className="lore-detail__head">
        <img src={entry.image} alt="" className="lore-detail__img" />
        <div>
          <h1 className="lore-detail__name">{entry.name}</h1>
          <p className="badge badge--muted">{entry.type}</p>
          <dl className="lore-facts">
            {entry.facts.map((f) => (
              <div key={f.label} className="lore-facts__row">
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
          <TextToSpeech text={`${entry.name}. ${entry.summary} ${entry.body}`} />
        </div>
      </div>

      <div className="article__body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.body}</ReactMarkdown>
      </div>

      <p className="taglist">
        {entry.tags.map((t) => (
          <span key={t} className="tag-chip">#{t}</span>
        ))}
      </p>
    </article>
  )
}
