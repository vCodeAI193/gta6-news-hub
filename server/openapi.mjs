export const API_VERSION = '1.0.0'

/** Handgepflegte OpenAPI-3-Spezifikation der wichtigsten Endpunkte. */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'GTA 6 News Hub API',
    version: API_VERSION,
    description: 'REST-API für Artikel, Konten, Community, Moderation und Echtzeit.',
  },
  servers: [{ url: '/api/v1' }, { url: '/api' }],
  tags: [
    { name: 'System' },
    { name: 'Auth' },
    { name: 'Articles' },
    { name: 'Community' },
    { name: 'Moderation' },
  ],
  paths: {
    '/health': { get: { tags: ['System'], summary: 'Health-Check', responses: { 200: { description: 'OK' } } } },
    '/metrics': { get: { tags: ['System'], summary: 'Request-Metriken & Uptime', responses: { 200: { description: 'OK' } } } },
    '/flags': { get: { tags: ['System'], summary: 'Aktive Feature-Flags', responses: { 200: { description: 'OK' } } } },
    '/openapi.json': { get: { tags: ['System'], summary: 'Diese Spezifikation', responses: { 200: { description: 'OK' } } } },
    '/auth/register': { post: { tags: ['Auth'], summary: 'Konto anlegen (erster Nutzer = Admin)', responses: { 201: { description: 'Erstellt' }, 409: { description: 'E-Mail vergeben' } } } },
    '/auth/login': { post: { tags: ['Auth'], summary: 'Anmelden → JWT', responses: { 200: { description: 'OK' }, 401: { description: 'Falsche Daten' } } } },
    '/auth/me': { get: { tags: ['Auth'], summary: 'Aktueller Nutzer', security: [{ bearer: [] }], responses: { 200: { description: 'OK' }, 401: { description: 'Nicht auth.' } } } },
    '/articles': {
      get: { tags: ['Articles'], summary: 'Veröffentlichte Artikel', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Articles'], summary: 'Artikel anlegen (author+)', security: [{ bearer: [] }], responses: { 201: { description: 'Erstellt' } } },
    },
    '/articles/{id}': { get: { tags: ['Articles'], summary: 'Artikel-Detail', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: { description: 'Nicht gefunden' } } } },
    '/articles/{id}/comments': {
      get: { tags: ['Community'], summary: 'Kommentare', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      post: { tags: ['Community'], summary: 'Kommentieren (Login)', security: [{ bearer: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 201: { description: 'Erstellt' } } },
    },
    '/comments/{id}/vote': { post: { tags: ['Community'], summary: 'Kommentar up/down voten', security: [{ bearer: [] }], responses: { 200: { description: 'OK' } } } },
    '/submissions': { post: { tags: ['Community'], summary: 'News einreichen', security: [{ bearer: [] }], responses: { 201: { description: 'Erstellt' } } } },
    '/leaderboard': { get: { tags: ['Community'], summary: 'Reputations-Rangliste', responses: { 200: { description: 'OK' } } } },
    '/users/{id}/profile': { get: { tags: ['Community'], summary: 'Öffentliches Profil', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
    '/moderation/comments': { get: { tags: ['Moderation'], summary: 'Pending-Kommentare (moderator+)', security: [{ bearer: [] }], responses: { 200: { description: 'OK' } } } },
    '/moderation/submissions': { get: { tags: ['Moderation'], summary: 'Offene Einreichungen', security: [{ bearer: [] }], responses: { 200: { description: 'OK' } } } },
    '/broadcast/breaking': { post: { tags: ['Moderation'], summary: 'Eilmeldung senden (author+)', security: [{ bearer: [] }], responses: { 201: { description: 'Gesendet' } } } },
    '/admin/backup': { get: { tags: ['System'], summary: 'Inhalts-Backup (admin)', security: [{ bearer: [] }], responses: { 200: { description: 'OK' } } } },
  },
  components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
}
