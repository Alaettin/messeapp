import { useState, useEffect } from 'react';
import { FileText, Check } from 'lucide-react';
import { Button, Card } from '../ui';
import { api } from '../../services/api';
import type { Document } from '../../types';

interface StepDocumentsProps {
  identifier: string;
  onComplete: (documentIds: number[]) => void;
}

export default function StepDocuments({ identifier: _identifier, onComplete }: StepDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDocuments()
      .then(result => setDocuments(result.documents))
      .catch(err => {
        console.error('Load error:', err);
        setError('Fehler beim Laden der Dokumente.');
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: number) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center gap-2 py-8 text-txt-secondary">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Lade Dokumente...
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      <Card padding="md">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-txt-primary">Dokumente zuweisen</h3>
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-txt-muted py-2">Keine Dokumente konfiguriert.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {documents.map(doc => {
              const selected = selectedIds.has(doc.id);
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggle(doc.id)}
                  className={`relative flex items-center gap-3 w-full min-h-[56px] p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selected
                      ? 'border-accent bg-accent-muted shadow-glow'
                      : 'border-border bg-bg-primary hover:border-border-hover active:scale-[0.98]'
                  }`}
                >
                  <FileText className={`w-5 h-5 flex-shrink-0 ${selected ? 'text-accent' : 'text-txt-muted'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selected ? 'text-accent' : 'text-txt-primary'}`}>
                      {doc.name}
                    </p>
                    {doc.category && (
                      <span className="text-xs text-txt-muted">{doc.category}</span>
                    )}
                  </div>
                  {selected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <Button fullWidth onClick={() => onComplete([...selectedIds])}>
        Bestätigen
      </Button>
    </div>
  );
}
