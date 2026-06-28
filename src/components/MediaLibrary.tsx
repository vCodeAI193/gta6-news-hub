import { useState, useRef } from 'react';
import { readJSON, writeJSON } from '../services/storage';

interface MediaItem {
  id: string;
  name: string;
  dataUrl: string;
  uploadedAt: number;
}

interface Props {
  onInsert?: (url: string) => void;
}

export function MediaLibrary({ onInsert }: Props) {
  const [items, setItems] = useState<MediaItem[]>(() => readJSON<MediaItem[]>('media_library', []));
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const newItem: MediaItem = {
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl: ev.target?.result as string,
        uploadedAt: Date.now(),
      };
      const updated = [...items, newItem];
      setItems(updated);
      writeJSON('media_library', updated);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="media-library" style={{ background: 'var(--surface)', padding: '1rem', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Medien-Bibliothek</h4>
        <button className="btn btn--ghost" style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }} onClick={() => fileRef.current?.click()}>
          + Hochladen
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
      </div>
      {items.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>Noch keine Bilder hochgeladen.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => onInsert?.(item.dataUrl)}
              title={item.name}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
            >
              <img
                src={item.dataUrl}
                alt={item.name}
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 4 }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
