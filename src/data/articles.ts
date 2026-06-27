import type { Article } from '../types'

/**
 * Sample editorial content for the GTA 6 News Hub.
 *
 * In a production setup this data would come from a CMS or API. It lives here
 * as a typed module so the UI, search and tests can rely on a stable shape.
 * Images use picsum.photos seeds so they resolve without external API keys.
 */
export const articles: Article[] = [
  {
    id: 'release-date-confirmed',
    title: 'Rockstar bestätigt: GTA 6 erscheint am 19. November 2026',
    excerpt:
      'Nach Monaten der Spekulation steht der Termin fest. Grand Theft Auto VI kommt zum Holiday-Window 2026.',
    body: 'Rockstar Games hat den finalen Release-Termin für Grand Theft Auto VI offiziell bestätigt: Das Spiel erscheint weltweit am 19. November 2026.\n\nDamit positioniert sich der Publisher klar im umsatzstarken Holiday-Window. Erste Vorbesteller-Editionen sollen kurz nach der Ankündigung verfügbar sein.\n\n"Wir können es kaum erwarten, Spielerinnen und Spielern Vice City in einem Maßstab zu zeigen, den es so noch nie gab", heißt es im offiziellen Statement.',
    category: 'release',
    date: '2026-05-06',
    source: 'Rockstar Newswire',
    sourceUrl: 'https://www.rockstargames.com/newswire',
    image: 'https://picsum.photos/seed/gta6-release/800/450',
    featured: true,
  },
  {
    id: 'trailer-2-breakdown',
    title: 'Trailer 2 ist da: Vice City bei Nacht in 4K',
    excerpt:
      'Der zweite offizielle Trailer zeigt eine lebendige Open World, dynamisches Wetter und die beiden Protagonisten Lucia und Jason.',
    body: 'Der mit Spannung erwartete zweite Trailer zu GTA 6 ist erschienen und sammelte innerhalb der ersten 24 Stunden Rekordaufrufe.\n\nGezeigt werden eine deutlich gewachsene Spielwelt rund um Vice City, ein neues Wettersystem mit Hurrikan-Vorboten sowie erste Gameplay-Andeutungen zum Duo Lucia und Jason.\n\nTechnisch setzt Rockstar laut eigener Aussage auf eine überarbeitete RAGE-Engine mit Raytracing-Beleuchtung.',
    category: 'trailer',
    date: '2026-04-18',
    source: 'Rockstar Games (YouTube)',
    sourceUrl: 'https://www.youtube.com/rockstargames',
    image: 'https://picsum.photos/seed/gta6-trailer2/800/450',
    featured: true,
  },
  {
    id: 'preorder-editions',
    title: 'Pre-Order gestartet: Das stecken in den Collector’s Editions',
    excerpt:
      'Standard, Deluxe und Collector’s Edition — wir vergleichen Boni, Preise und Plattformverfügbarkeit.',
    body: 'Mit dem bestätigten Release-Termin hat Rockstar auch die Vorbestellungen freigeschaltet.\n\nNeben der Standard Edition gibt es eine Deluxe Edition mit In-Game-Währung und eine physische Collector’s Edition inklusive Steelbook und Map.\n\nGTA 6 erscheint zunächst für PlayStation 5 und Xbox Series X|S. Eine PC-Version wurde noch nicht offiziell datiert.',
    category: 'release',
    date: '2026-05-07',
    source: 'PlayStation Blog',
    sourceUrl: 'https://blog.playstation.com',
    image: 'https://picsum.photos/seed/gta6-preorder/800/450',
  },
  {
    id: 'map-leak-vice-city',
    title: 'Leak: Angebliche Map zeigt Bundesstaat Leonida',
    excerpt:
      'Eine durchgesickerte Karte soll den fiktiven Bundesstaat Leonida mit Vice City und Umland zeigen. Rockstar äußert sich nicht.',
    body: 'In diversen Foren kursiert eine angeblich durchgesickerte Übersichtskarte von GTA 6.\n\nSie zeigt den fiktiven Bundesstaat Leonida, der an Florida angelehnt ist, mit Vice City im Zentrum sowie Sumpfgebieten und Stränden.\n\nWichtig: Diese Information ist unbestätigt. Rockstar Games hat sich zu der Karte nicht geäußert. Bis zu einer offiziellen Bestätigung sollten Details mit Vorsicht genossen werden.',
    category: 'leak',
    date: '2026-03-29',
    source: 'Community-Forum (unbestätigt)',
    image: 'https://picsum.photos/seed/gta6-map/800/450',
  },
  {
    id: 'official-newsroom-relaunch',
    title: 'Rockstar relauncht Newswire mit GTA-6-Bereich',
    excerpt:
      'Der offizielle Rockstar Newswire bekommt einen eigenen Hub für alle kommenden GTA-6-Ankündigungen.',
    body: 'Rockstar Games hat seinen Newswire überarbeitet und einen dedizierten GTA-6-Bereich eingerichtet.\n\nDort sollen künftig alle offiziellen Ankündigungen, Behind-the-Scenes-Inhalte und Pressematerialien gebündelt werden.\n\nFür Fans bedeutet das eine zentrale, verlässliche Quelle abseits von Gerüchten und Leaks.',
    category: 'official',
    date: '2026-02-14',
    source: 'Rockstar Newswire',
    sourceUrl: 'https://www.rockstargames.com/newswire',
    image: 'https://picsum.photos/seed/gta6-newswire/800/450',
  },
  {
    id: 'leak-dual-protagonist',
    title: 'Gerücht: Wechsel zwischen Lucia und Jason in Echtzeit',
    excerpt:
      'Angebliche Insider berichten von einem nahtlosen Charakterwechsel ähnlich GTA 5 — aber tiefer in die Story integriert.',
    body: 'Mehrere angebliche Insider-Quellen berichten übereinstimmend von einem Echtzeit-Wechsel zwischen den beiden Protagonisten Lucia und Jason.\n\nAnders als in GTA 5 soll der Wechsel laut den unbestätigten Berichten enger an Story-Entscheidungen geknüpft sein.\n\nDa es sich um einen Leak handelt, gilt: ohne offizielle Bestätigung durch Rockstar bleibt diese Information Spekulation.',
    category: 'leak',
    date: '2026-04-02',
    source: 'Branchen-Insider (unbestätigt)',
    image: 'https://picsum.photos/seed/gta6-protagonists/800/450',
  },
  {
    id: 'official-soundtrack-partners',
    title: 'Offiziell: Rockstar kündigt Radiosender-Partner an',
    excerpt:
      'Für den Soundtrack arbeitet Rockstar erneut mit zahlreichen Labels zusammen. Erste Sender wurden bestätigt.',
    body: 'Rockstar Games hat erste Details zum Soundtrack von GTA 6 bestätigt.\n\nWie schon in früheren Teilen wird es zahlreiche thematische Radiosender geben. Mehrere Labels und Kuratoren wurden offiziell als Partner genannt.\n\nWeitere Sender und Tracklisten sollen näher am Release enthüllt werden.',
    category: 'official',
    date: '2026-05-20',
    source: 'Rockstar Newswire',
    sourceUrl: 'https://www.rockstargames.com/newswire',
    image: 'https://picsum.photos/seed/gta6-radio/800/450',
  },
  {
    id: 'trailer-1-anniversary',
    title: 'Ein Jahr Trailer 1: Die wichtigsten Details im Rückblick',
    excerpt:
      'Wir blicken zurück auf den ersten Trailer und welche Hinweise sich rückblickend bestätigt haben.',
    body: 'Der erste GTA-6-Trailer brach Aufrufrekorde und legte den Grundstein für die Vice-City-Erwartungen.\n\nIm Rückblick lassen sich einige der gezeigten Details inzwischen mit späteren offiziellen Aussagen abgleichen — etwa der Setting-Fokus und das Protagonisten-Duo.\n\nAndere Fan-Theorien aus der Trailer-Analyse bleiben dagegen weiter unbestätigt.',
    category: 'trailer',
    date: '2026-01-10',
    source: 'GTA 6 News Hub',
    image: 'https://picsum.photos/seed/gta6-trailer1/800/450',
  },
]

/** Articles sorted newest-first — the default ordering for the feed. */
export const articlesByDateDesc = [...articles].sort((a, b) =>
  b.date.localeCompare(a.date),
)
