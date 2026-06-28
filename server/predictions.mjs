/**
 * Tippspiel-Fragen zum GTA-6-Release. Statisch definiert; Stimmen werden in der
 * DB gezählt. Die Auflösung (Punktevergabe) erfolgt nach dem Release.
 */
export const predictionQuestions = [
  {
    id: 'on-time',
    question: 'Erscheint GTA 6 pünktlich am 19. November 2026?',
    options: ['Ja, pünktlich', 'Verschiebung 2027', 'Noch später'],
  },
  {
    id: 'platform',
    question: 'Welche Plattform führt bei den Verkäufen?',
    options: ['PlayStation 5', 'Xbox Series X|S', 'PC (nachgereicht)'],
  },
  {
    id: 'metacritic',
    question: 'Welchen Metascore knackt GTA 6?',
    options: ['95+', '90–94', 'Unter 90'],
  },
]

export const predictionById = Object.fromEntries(predictionQuestions.map((q) => [q.id, q]))
