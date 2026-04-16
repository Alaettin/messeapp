import { useState, useEffect } from 'react';
import { CheckCircle2, UserPlus, Building2, Mail, Phone } from 'lucide-react';
import { Button, Card } from '../ui';
import { api } from '../../services/api';
import type { VisitorFull } from '../../types';

interface StepCompleteProps {
  identifier: string;
  onReset: () => void;
}

export default function StepComplete({ identifier, onReset }: StepCompleteProps) {
  const [visitor, setVisitor] = useState<VisitorFull | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVisitor(identifier)
      .then(setVisitor)
      .catch(err => console.error('Load visitor error:', err))
      .finally(() => setLoading(false));
  }, [identifier]);

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center gap-2 py-8 text-txt-secondary">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Lade Zusammenfassung...
        </div>
      </Card>
    );
  }

  if (!visitor) {
    return (
      <Card padding="lg">
        <p className="text-center text-txt-secondary">Besucher nicht gefunden.</p>
        <Button fullWidth onClick={onReset} className="mt-4">
          Neuen Besucher erfassen
        </Button>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Success header */}
      <div className="flex flex-col items-center gap-2 py-4">
        <CheckCircle2 className="w-16 h-16 text-success" />
        <h2 className="text-xl font-semibold text-txt-primary">Erfassung abgeschlossen</h2>
      </div>

      {/* Visitor info */}
      <Card padding="lg">
        <div className="flex flex-col items-center gap-4">
          {/* Avatar */}
          {visitor.avatar_path && (
            <img
              src={`/api/storage/avatars/${identifier}.png`}
              alt="Avatar"
              className="w-24 h-24 rounded-full shadow-glow object-cover"
            />
          )}

          {/* Name + Company */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-txt-primary">
              {visitor.name || identifier}
            </h3>
            {visitor.company && (
              <div className="flex items-center justify-center gap-1 text-txt-secondary mt-1">
                <Building2 className="w-4 h-4" />
                {visitor.company}
              </div>
            )}
            {visitor.position && (
              <p className="text-sm text-txt-muted">{visitor.position}</p>
            )}
          </div>

          {/* Contact details */}
          <div className="flex flex-col gap-1 w-full">
            {visitor.email && (
              <div className="flex items-center gap-2 text-sm text-txt-secondary">
                <Mail className="w-4 h-4 flex-shrink-0" />
                {visitor.email}
              </div>
            )}
            {visitor.phone && (
              <div className="flex items-center gap-2 text-sm text-txt-secondary">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {visitor.phone}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Assigned documents */}
      {visitor.documents.length > 0 && (
        <Card padding="md">
          <h4 className="text-sm font-medium text-txt-secondary mb-2">
            Zugewiesene Dokumente ({visitor.documents.length})
          </h4>
          <div className="flex flex-col gap-1">
            {visitor.documents.map(doc => (
              <p key={doc.id} className="text-sm text-txt-primary">{doc.name}</p>
            ))}
          </div>
        </Card>
      )}

      {/* Assigned contacts */}
      {visitor.contacts.length > 0 && (
        <Card padding="md">
          <h4 className="text-sm font-medium text-txt-secondary mb-2">
            Zugewiesene Ansprechpartner ({visitor.contacts.length})
          </h4>
          <div className="flex flex-col gap-1">
            {visitor.contacts.map(contact => (
              <div key={contact.id} className="text-sm">
                <span className="text-txt-primary">{contact.name}</span>
                {contact.role && (
                  <span className="text-txt-muted"> — {contact.role}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reset button */}
      <Button fullWidth onClick={onReset}>
        <UserPlus className="w-5 h-5" /> Neuen Besucher erfassen
      </Button>
    </div>
  );
}
