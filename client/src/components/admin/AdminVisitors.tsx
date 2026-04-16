import { useState, useEffect } from 'react';
import { Search, Trash2, ArrowLeft, Save, Building2, Mail, Phone, Globe, MapPin, Briefcase, StickyNote } from 'lucide-react';
import { Button, Card, Input, ConfirmDialog } from '../ui';
import { api } from '../../services/api';
import type { Visitor, VisitorFull } from '../../types';

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorFull | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string | null } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState<Partial<Visitor>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadVisitors(); }, []);

  async function loadVisitors() {
    try {
      const result = await api.adminGetVisitors(search || undefined);
      setVisitors(result.visitors);
    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    setLoading(true);
    await loadVisitors();
  }

  async function openDetail(id: string) {
    try {
      const visitor = await api.getVisitor(id);
      setSelectedVisitor(visitor);
      setEditData({
        name: visitor.name || '',
        company: visitor.company || '',
        position: visitor.position || '',
        address: visitor.address || '',
        email: visitor.email || '',
        phone: visitor.phone || '',
        website: visitor.website || '',
        notes: visitor.notes || '',
      });
    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden des Besuchers.');
    }
  }

  async function handleSave() {
    if (!selectedVisitor) return;
    setSaving(true);
    setError(null);
    try {
      await api.adminUpdateVisitor(selectedVisitor.id, editData);
      await openDetail(selectedVisitor.id);
    } catch (err) {
      console.error(err);
      setError('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.adminDeleteVisitor(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedVisitor(null);
      setLoading(true);
      await loadVisitors();
    } catch (err) {
      console.error(err);
      setError('Fehler beim Löschen.');
    } finally {
      setDeleting(false);
    }
  }

  function updateField(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditData(prev => ({ ...prev, [field]: e.target.value }));
  }

  // Detail view
  if (selectedVisitor) {
    return (
      <><div className="flex flex-col gap-4">
        <Button variant="ghost" onClick={() => setSelectedVisitor(null)} className="self-start">
          <ArrowLeft className="w-4 h-4" /> Zurück zur Liste
        </Button>

        {error && (
          <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            {error}
          </div>
        )}

        {/* Avatar + Business Card */}
        <div className="flex gap-4">
          {selectedVisitor.avatar_path && (
            <Card padding="sm" className="flex-1">
              <p className="text-xs text-txt-muted mb-2">Avatar</p>
              <img
                src={`/api/storage/avatars/${selectedVisitor.id}.png`}
                alt="Avatar"
                className="w-full rounded-lg"
              />
            </Card>
          )}
          {selectedVisitor.business_card_path && (
            <Card padding="sm" className="flex-1">
              <p className="text-xs text-txt-muted mb-2">Visitenkarte</p>
              <img
                src={`/api/storage/business-cards/${selectedVisitor.id}.jpg`}
                alt="Visitenkarte"
                className="w-full rounded-lg"
              />
            </Card>
          )}
        </div>

        {/* Edit form */}
        <Card padding="md">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-txt-muted font-mono">ID: {selectedVisitor.id}</p>
            <Input label="Name" value={editData.name as string || ''} onChange={updateField('name')} />
            <Input label="Firma" value={editData.company as string || ''} onChange={updateField('company')} />
            <Input label="Position" value={editData.position as string || ''} onChange={updateField('position')} />
            <Input label="Adresse" value={editData.address as string || ''} onChange={updateField('address')} />
            <Input label="E-Mail" type="email" value={editData.email as string || ''} onChange={updateField('email')} />
            <Input label="Telefon" type="tel" value={editData.phone as string || ''} onChange={updateField('phone')} />
            <Input label="Website" value={editData.website as string || ''} onChange={updateField('website')} />
            <div>
              <label className="block text-sm text-txt-secondary mb-1.5">Notizen</label>
              <textarea
                value={editData.notes as string || ''}
                onChange={updateField('notes')}
                rows={3}
                className="w-full px-4 py-3 bg-bg-input border border-border rounded-lg text-txt-primary focus:outline-none focus:ring-1 focus:border-accent focus:ring-accent transition-colors resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Assigned documents + contacts */}
        {selectedVisitor.documents.length > 0 && (
          <Card padding="md">
            <p className="text-sm font-medium text-txt-secondary mb-2">Zugewiesene Dokumente</p>
            {selectedVisitor.documents.map(doc => (
              <p key={doc.id} className="text-sm text-txt-primary">{doc.name}</p>
            ))}
          </Card>
        )}
        {selectedVisitor.contacts.length > 0 && (
          <Card padding="md">
            <p className="text-sm font-medium text-txt-secondary mb-2">Zugewiesene Ansprechpartner</p>
            {selectedVisitor.contacts.map(c => (
              <p key={c.id} className="text-sm text-txt-primary">{c.name}{c.role ? ` — ${c.role}` : ''}</p>
            ))}
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={() => setDeleteTarget({ id: selectedVisitor.id, name: selectedVisitor.name })}
          >
            <Trash2 className="w-4 h-4" /> Löschen
          </Button>
          <Button fullWidth onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Speichern
          </Button>
        </div>
      </div>
      {deleteTarget && (
        <ConfirmDialog
          title="Besucher löschen"
          message={`"${deleteTarget.name || deleteTarget.id}" wird unwiderruflich gelöscht, inklusive Avatar und Visitenkarte.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
      </>
    );
  }

  // List view
  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
          {error}
        </div>
      )}

      {/* Search */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        className="flex gap-2"
      >
        <div className="flex-1">
          <Input
            placeholder="Name, Firma oder ID suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {loading ? (
        <Card padding="lg">
          <div className="flex items-center justify-center gap-2 py-8 text-txt-secondary">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            Lade Besucher...
          </div>
        </Card>
      ) : visitors.length === 0 ? (
        <Card padding="lg">
          <p className="text-center text-txt-muted py-4">
            {search ? 'Keine Besucher gefunden.' : 'Noch keine Besucher erfasst.'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {visitors.map(v => (
            <Card
              key={v.id}
              variant="interactive"
              padding="sm"
              onClick={() => openDetail(v.id)}
            >
              <div className="flex items-center gap-3">
                {/* Avatar thumbnail */}
                {v.avatar_path ? (
                  <img
                    src={`/api/storage/avatars/${v.id}.png`}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <span className="text-txt-muted text-xs">{(v.name || v.id).charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-txt-primary truncate">
                    {v.name || v.id}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-txt-muted">
                    {v.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> {v.company}
                      </span>
                    )}
                    {v.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {v.email}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-txt-muted flex-shrink-0">
                  {v.created_at ? new Date(v.created_at).toLocaleDateString('de-DE') : ''}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
}
