import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { ArticleGrid } from '../components/ArticleGrid'
import { Pagination } from '../components/Pagination'
import { SkeletonGrid } from '../components/Skeleton'
import { categoryBySlug } from '../data/categories'
import { useArticles } from '../hooks/useArticles'
import { filterArticles } from '../lib/filterArticles'
import { NotFoundPage } from './NotFoundPage'

const PAGE_SIZE = 6

export function CategoryPage() {
  const { slug = '' } = useParams()
  const category = categoryBySlug[slug]
  const { articles, loading } = useArticles()
  const [page, setPage] = useState(1)

  const list = useMemo(
    () => (category ? filterArticles(articles, { category: category.id }) : []),
    [articles, category],
  )

  if (!category) return <NotFoundPage />

  const pageCount = Math.ceil(list.length / PAGE_SIZE)
  const pageItems = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <>
      <Seo title={category.label} description={category.description} path={`/kategorie/${slug}`} />
      <Breadcrumbs items={[{ label: 'Start', to: '/' }, { label: category.label }]} />

      <header className="page-head">
        <h1 className="page-head__title">{category.label}</h1>
        <p className="page-head__desc">{category.description}</p>
      </header>

      {loading ? (
        <SkeletonGrid />
      ) : list.length === 0 ? (
        <div className="empty">
          <p className="empty__title">Noch keine Artikel</p>
          <p>In dieser Kategorie gibt es aktuell keine Beiträge.</p>
        </div>
      ) : (
        <>
          <ArticleGrid articles={pageItems} />
          <Pagination
            page={page}
            pageCount={pageCount}
            onChange={(p) => {
              setPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </>
  )
}
