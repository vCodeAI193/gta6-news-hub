import { Seo } from '../components/Seo'
import { commentLeaderboard } from '../services/commentsService'

export function AboutPage() {
  const leaders = commentLeaderboard()
  return (
    <>
      <Seo title="Über uns" path="/about" />
      <header className="page-head">
        <h1 className="page-head__title">Über den GTA 6 News Hub</h1>
      </header>
      <div className="prose">
        <p>
          Der <strong>GTA 6 News Hub</strong> ist ein community-getriebenes Fan-Projekt, das
          offizielle News, Trailer, Leaks und Release-Infos rund um Grand Theft Auto VI bündelt.
        </p>
        <p>
          Wir kennzeichnen jede Meldung mit einer Verlässlichkeitsstufe und trennen klar zwischen
          bestätigten Ankündigungen und Gerüchten. Dieses Projekt steht in keiner Verbindung zu
          Rockstar Games oder Take-Two Interactive.
        </p>

        <h2>Community-Bestenliste</h2>
        {leaders.length === 0 ? (
          <p>Noch keine Kommentare — sei die/der Erste in einem Artikel!</p>
        ) : (
          <ol className="leaderboard">
            {leaders.map((l) => (
              <li key={l.author}>
                <span>{l.author}</span>
                <span className="leaderboard__count">{l.count} Kommentare</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  )
}

export function PrivacyPage() {
  return (
    <>
      <Seo title="Datenschutz" path="/datenschutz" />
      <header className="page-head">
        <h1 className="page-head__title">Datenschutz</h1>
      </header>
      <div className="prose">
        <p>
          Diese Demo-Plattform speichert ausschließlich lokal in deinem Browser (localStorage) —
          z. B. Lesezeichen, Kommentare, Reaktionen und Einstellungen. Es werden keine Daten an
          einen Server übertragen.
        </p>
        <p>
          Optionale, anonyme Statistik wird nur nach ausdrücklicher Zustimmung aktiviert und
          verwendet keine Cookies und keine personenbezogenen Daten.
        </p>
        <p>Du kannst all deine lokalen Daten jederzeit unter „Einstellungen" löschen.</p>
      </div>
    </>
  )
}

export function ImprintPage() {
  return (
    <>
      <Seo title="Impressum" path="/impressum" />
      <header className="page-head">
        <h1 className="page-head__title">Impressum</h1>
      </header>
      <div className="prose">
        <p>
          Angaben gemäß § 5 TMG (Beispiel-/Demo-Inhalt):
          <br />
          GTA 6 News Hub (Fan-Projekt)
          <br />
          Kontakt: kontakt@gta6-news-hub.example
        </p>
        <p>
          Alle Marken- und Spielrechte liegen bei den jeweiligen Inhabern (Rockstar Games,
          Take-Two Interactive). Dies ist ein inoffizielles Fan-Projekt.
        </p>
      </div>
    </>
  )
}
