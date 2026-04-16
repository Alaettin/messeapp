import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Pencil, X } from 'lucide-react';
import { Button, Card, Input, ConfirmDialog } from '../ui';
import { api } from '../../services/api';
import type { Contact } from '../../types';

export default function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadContacts(); }, []);

  async function loadContacts() {
    try {
      const result = await api.adminGetContacts();
      setContacts(result.contacts);
    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ name: '', role: '', email: '', phone: '' });
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(contact: Contact) {
    setFormData({
      name: contact.name,
      role: contact.role || '',
      email: contact.email || '',
      phone: contact.phone || '',
    });
    setEditingId(contact.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api.adminUpdateContact(editingId, formData);
      } else {
        await api.adminCreateContact(formData);
      }
      resetForm();
      await loadContacts();
    } catch (err) {
      console.error(err);
      setError('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(contact: Contact) {
    try {
      await api.adminUpdateContact(contact.id, { active: !contact.active });
      await loadContacts();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.adminDeleteContact(deleteTarget.id);
      setDeleteTarget(null);
      await loadContacts();
    } catch (err) {
      console.error(err);
      setError('Fehler beim Löschen.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center gap-2 py-8 text-txt-secondary">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Lade Kontakte...
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

      <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
        <Plus className="w-4 h-4" /> Neuer Ansprechpartner
      </Button>

      {showForm && (
        <Card padding="md">
          <div className="flex flex-col gap-3">
            <Input label="Name *" value={formData.name} onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))} />
            <Input label="Rolle" value={formData.role} onChange={(e) => setFormData(d => ({ ...d, role: e.target.value }))} placeholder="z.B. Sales Manager" />
            <Input label="E-Mail" type="email" value={formData.email} onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))} />
            <Input label="Telefon" type="tel" value={formData.phone} onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))} />
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={resetForm}>
                Abbrechen
              </Button>
              <Button fullWidth onClick={handleSave} loading={saving} disabled={!formData.name.trim()}>
                {editingId ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {contacts.length === 0 ? (
        <Card padding="lg">
          <p className="text-center text-txt-muted py-4">Keine Ansprechpartner vorhanden.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map(contact => (
            <Card key={contact.id} padding="sm">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${contact.active ? 'text-txt-primary' : 'text-txt-muted line-through'}`}>
                    {contact.name}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {contact.role && <span className="text-xs text-txt-muted">{contact.role}</span>}
                    {contact.email && <span className="text-xs text-txt-muted">{contact.email}</span>}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(contact)}
                  className="p-2 rounded-lg text-txt-muted hover:text-txt-primary hover:bg-bg-surface transition-colors"
                  title="Bearbeiten"
                >
                  {editingId === contact.id ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleToggleActive(contact)}
                  className={`p-2 rounded-lg transition-colors ${
                    contact.active ? 'text-accent hover:bg-accent-muted' : 'text-txt-muted hover:bg-bg-surface'
                  }`}
                  title={contact.active ? 'Deaktivieren' : 'Aktivieren'}
                >
                  {contact.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setDeleteTarget(contact)}
                  className="p-2 rounded-lg text-error/60 hover:text-error hover:bg-error/10 transition-colors"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Ansprechpartner löschen"
          message={`"${deleteTarget.name}" wird unwiderruflich gelöscht.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
