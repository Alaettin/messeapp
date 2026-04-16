import { useState, useEffect } from 'react';
import { Users, Check, User } from 'lucide-react';
import { Button, Card } from '../ui';
import { api } from '../../services/api';
import type { Contact } from '../../types';

interface StepContactsProps {
  identifier: string;
  onComplete: (contactIds: number[]) => void;
}

export default function StepContacts({ identifier: _identifier, onComplete }: StepContactsProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getContacts()
      .then(result => setContacts(result.contacts))
      .catch(err => {
        console.error('Load error:', err);
        setError('Fehler beim Laden der Ansprechpartner.');
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
          Lade Ansprechpartner...
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
          <Users className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-txt-primary">Ansprechpartner zuweisen</h3>
        </div>
        {contacts.length === 0 ? (
          <p className="text-sm text-txt-muted py-2">Keine Ansprechpartner konfiguriert.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {contacts.map(contact => {
              const selected = selectedIds.has(contact.id);
              return (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => toggle(contact.id)}
                  className={`relative flex items-center gap-3 w-full min-h-[56px] p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    selected
                      ? 'border-accent bg-accent-muted shadow-glow'
                      : 'border-border bg-bg-primary hover:border-border-hover active:scale-[0.98]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-accent' : 'bg-bg-surface border border-border'
                  }`}>
                    <User className={`w-5 h-5 ${selected ? 'text-white' : 'text-txt-muted'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selected ? 'text-accent' : 'text-txt-primary'}`}>
                      {contact.name}
                    </p>
                    {contact.role && (
                      <span className="text-xs text-txt-muted">{contact.role}</span>
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
