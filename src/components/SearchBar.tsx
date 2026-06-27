interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="search">
      <svg
        className="search__icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        className="search__input"
        type="search"
        role="searchbox"
        placeholder="News durchsuchen…"
        aria-label="News durchsuchen"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
