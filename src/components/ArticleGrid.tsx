import type { Article } from '../types'
import { ArticleCard } from './ArticleCard'

interface ArticleGridProps {
  articles: Article[]
  query?: string
}

export function ArticleGrid({ articles, query }: ArticleGridProps) {
  return (
    <div className="grid">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} query={query} />
      ))}
    </div>
  )
}
