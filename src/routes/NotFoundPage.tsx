import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'

export function NotFoundPage() {
  return (
    <div className="notfound">
      <Seo title="Seite nicht gefunden" path="/404" />
      <p className="notfound__code">404</p>
      <h1 className="notfound__title">Seite nicht gefunden</h1>
      <p>Diese Seite existiert nicht (mehr). Vielleicht ein Leak, der verschwand. 👀</p>
      <Link to="/" className="btn">
        Zurück zur Startseite
      </Link>
    </div>
  )
}
