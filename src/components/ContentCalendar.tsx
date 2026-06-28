import { useState } from 'react';

interface Article {
  id: string;
  title: string;
  publishAt?: number;
}

interface Props {
  articles: Article[];
}

export function ContentCalendar({ articles }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const scheduledByDay: Record<number, Article[]> = {};
  articles.forEach(a => {
    if (a.publishAt) {
      const d = new Date(a.publishAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        scheduledByDay[day] = [...(scheduledByDay[day] || []), a];
      }
    }
  });

  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

  return (
    <div className="content-calendar" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button className="btn btn--ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setCurrentDate(new Date(year, month - 1))}>&#8592;</button>
        <h4 style={{ margin: 0 }}>{monthNames[month]} {year}</h4>
        <button className="btn btn--ghost" style={{ padding: '0.25rem 0.5rem' }} onClick={() => setCurrentDate(new Date(year, month + 1))}>&#8594;</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, fontSize: '0.75rem' }}>
        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '0.25rem' }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              padding: '0.25rem',
              borderRadius: 4,
              background: scheduledByDay[day] ? 'var(--accent)' : 'transparent',
              color: scheduledByDay[day] ? 'white' : 'inherit',
              cursor: scheduledByDay[day] ? 'pointer' : 'default',
            }}
            title={scheduledByDay[day]?.map(a => a.title).join(', ')}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
}
