import { useState } from 'react';
import { flagSpoiler } from '../services/moderationService';

interface Props {
  text: string;
}

export function SpoilerText({ text }: Props) {
  const [revealed, setRevealed] = useState(false);

  if (!flagSpoiler(text)) {
    return <span>{text}</span>;
  }

  return (
    <span className="spoiler-wrapper">
      {revealed ? (
        <span>{text}</span>
      ) : (
        <button
          className="spoiler-blur btn btn--ghost"
          onClick={() => setRevealed(true)}
          title="Spoiler anzeigen"
        >
          <span className="spoiler-content">{text}</span>
          <span className="spoiler-label">Spoiler anzeigen</span>
        </button>
      )}
    </span>
  );
}
