interface Props {
  password: string;
}

function getStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: 'transparent' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, label: 'Schwach', color: '#e53e3e' };
  if (score === 2) return { level: 2, label: 'Mittel', color: '#dd6b20' };
  if (score === 3) return { level: 3, label: 'Stark', color: '#38a169' };
  return { level: 4, label: 'Sehr stark', color: '#2b6cb0' };
}

export function PasswordStrength({ password }: Props) {
  const { level, label, color } = getStrength(password);

  if (!password) return null;

  return (
    <div className="password-strength">
      <div className="password-strength__bar">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="password-strength__segment"
            style={{ backgroundColor: i <= level ? color : 'var(--surface)' }}
          />
        ))}
      </div>
      <span className="password-strength__label" style={{ color }}>
        {label}
      </span>
      <div className="password-strength__tips">
        {password.length < 8 && <div className="tip">• Mindestens 8 Zeichen</div>}
        {!/[A-Z]/.test(password) && <div className="tip">• Großbuchstaben hinzufügen</div>}
        {!/[0-9]/.test(password) && <div className="tip">• Zahl hinzufügen</div>}
        {!/[^A-Za-z0-9]/.test(password) && <div className="tip">• Sonderzeichen hinzufügen</div>}
      </div>
    </div>
  );
}
