import { useState, useEffect } from 'react';
import { Search, Trash2, ArrowLeft, Save, Building2, Mail, FileText, Users, Check, User } from 'lucide-react';
import { Button, Card, Input, ConfirmDialog } from '../ui';
import { api } from '../../services/api';
import type { Visitor, VisitorFull, Document, Contact } from '../../types';

export default function AdminVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorFull | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string | null } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editData, setEditData] = useState<Partial<Visitor>>({});
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<number>>(new Set());
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
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
      const [visitor, docsResult, contactsResult] = await Promise.all([
        api.getVisitor(id),
        api.adminGetDocuments(),
        api.adminGetContacts(),
      ]);
      setSelectedVisitor(visitor);
      setAllDocuments(docsResult.documents);
      setAllContacts(contactsResult.contacts);
      setSelectedDocIds(new Set(visitor.documents.map(d => d.id)));
      setSelectedContactIds(new Set(visitor.contacts.map(c => c.id)));
      setEditData({
        name: visitor.name || '',
        company: visitor.company || '',
        position: visitor.position || '',
        address: visitor.address || '',
        email: visitor.email || '',
        phone: visitor.phone || '',
        website: visitor.website || '',
        notes: visitor.notes || '',
        weather_enabled: visitor.weather_enabled ?? '1',
        news_enabled: visitor.news_enabled ?? '1',
      });
    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden des Besuchers.');
    }
  }

  function toggleDoc(id: number) {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleContact(id: number) {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!selectedVisitor) return;
    setSaving(true);
    setError(null);
    try {
      await api.adminUpdateVisitor(selectedVisitor.id, editData);
      await api.saveSelections(selectedVisitor.id, [...selectedDocIds], [...selectedContactIds]);
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

        {/* Feature toggles */}
        <Card padding="md">
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.weather_enabled !== '0' && editData.weather_enabled !== 0}
                onChange={(e) => setEditData(prev => ({ ...prev, weather_enabled: e.target.checked ? '1' : '0' }))}
                className="w-5 h-5 accent-[#00A587]"
              />
              <div>
                <p className="text-sm font-medium text-txt-primary">Wetterdaten aktiv</p>
                <p className="text-xs text-txt-muted">Wetter für die Adresse dieses Besuchers im API-Call abrufen</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={editData.news_enabled !== '0' && editData.news_enabled !== 0}
                onChange={(e) => setEditData(prev => ({ ...prev, news_enabled: e.target.checked ? '1' : '0' }))}
                className="w-5 h-5 accent-[#00A587]"
              />
              <div>
                <p className="text-sm font-medium text-txt-primary">News aktiv</p>
                <p className="text-xs text-txt-muted">Top 5 lokale News für den Standort dieses Besuchers</p>
              </div>
            </label>
          </div>
        </Card>

        {/* Documents assignment */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-txt-primary">Dokumente zuweisen</h3>
          </div>
          {allDocuments.length === 0 ? (
            <p className="text-sm text-txt-muted py-2">Keine Dokumente konfiguriert.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {allDocuments.filter(d => d.active).map(doc => {
                const selected = selectedDocIds.has(doc.id);
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleDoc(doc.id)}
                    className={`relative flex items-center gap-3 w-full min-h-[48px] p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      selected
                        ? 'border-accent bg-accent-muted'
                        : 'border-border bg-bg-primary hover:border-border-hover'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-accent border-accent' : 'border-border'
                    }`}>
                      {selected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${selected ? 'text-accent' : 'text-txt-primary'}`}>
                        {doc.name}
                      </p>
                      {doc.category && (
                        <span className="text-xs text-txt-muted">{doc.category}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Contacts assignment */}
        <Card padding="md">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-txt-primary">Ansprechpartner zuweisen</h3>
          </div>
          {allContacts.length === 0 ? (
            <p className="text-sm text-txt-muted py-2">Keine Ansprechpartner konfiguriert.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {allContacts.filter(c => c.active).map(contact => {
                const selected = selectedContactIds.has(contact.id);
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleContact(contact.id)}
                    className={`relative flex items-center gap-3 w-full min-h-[48px] p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      selected
                        ? 'border-accent bg-accent-muted'
                        : 'border-border bg-bg-primary hover:border-border-hover'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-accent' : 'bg-bg-surface border border-border'
                    }`}>
                      <User className={`w-4 h-4 ${selected ? 'text-white' : 'text-txt-muted'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${selected ? 'text-accent' : 'text-txt-primary'}`}>
                        {contact.name}
                      </p>
                      <span className="text-xs text-txt-muted">
                        {[contact.company, contact.role].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

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
