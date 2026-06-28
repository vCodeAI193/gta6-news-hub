interface Props {
  score: number;
}

export function ModerationBadge({ score }: Props) {
  let color = '🔴';
  let label = 'Niedrig';
  if (score >= 70) { color = '🟢'; label = 'Hoch'; }
  else if (score >= 40) { color = '🟡'; label = 'Mittel'; }

  return (
    <span className="moderation-badge chip" title={`Trust-Score: ${score}/100`}>
      {color} {label} ({score})
    </span>
  );
}
