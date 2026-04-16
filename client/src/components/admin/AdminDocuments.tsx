import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Eye, EyeOff } from 'lucide-react';
import { Button, Card, Input, ConfirmDialog } from '../ui';
import { api } from '../../services/api';
import type { Document } from '../../types';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadDocuments(); }, []);

  async function loadDocuments() {
    try {
      const result = await api.adminGetDocuments();
      setDocuments(result.documents);
    } catch (err) {
      console.error(err);
      setError('Fehler beim Laden.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formFile) return;
    setSaving(true);
    setError(null);
    try {
      await api.adminCreateDocument(formFile, formName || formFile.name, formCategory);
      setShowForm(false);
      setFormName('');
      setFormCategory('');
      setFormFile(null);
      await loadDocuments();
    } catch (err) {
      console.error(err);
      setError('Fehler beim Hochladen.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(doc: Document) {
    try {
      await api.adminUpdateDocument(doc.id, { active: !doc.active });
      await loadDocuments();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.adminDeleteDocument(deleteTarget.id);
      setDeleteTarget(null);
      await loadDocuments();
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

      <Button onClick={() => setShowForm(!showForm)}>
        <Plus className="w-4 h-4" /> Neues Dokument
      </Button>

      {showForm && (
        <Card padding="md">
          <div className="flex flex-col gap-3">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setFormFile(f);
                  if (f && !formName) setFormName(f.name.replace(/\.[^.]+$/, ''));
                }}
                className="hidden"
              />
              <Button
                variant="secondary"
                fullWidth
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                {formFile ? formFile.name : 'Datei auswählen'}
              </Button>
            </div>
            <Input
              label="Anzeigename"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <Input
              label="Kategorie (optional)"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              placeholder="z.B. Produktinfo, Datenblatt"
            />
            <div className="flex gap-2">
              <Button variant="ghost" fullWidth onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
              <Button fullWidth onClick={handleCreate} loading={saving} disabled={!formFile}>
                Hochladen
              </Button>
            </div>
          </div>
        </Card>
      )}

      {documents.length === 0 ? (
        <Card padding="lg">
          <p className="text-center text-txt-muted py-4">Keine Dokumente vorhanden.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {documents.map(doc => (
            <Card key={doc.id} padding="sm">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${doc.active ? 'text-txt-primary' : 'text-txt-muted line-through'}`}>
                    {doc.name}
                  </p>
                  <div className="flex items-center gap-2">
                    {doc.category && (
                      <span className="text-xs text-txt-muted">{doc.category}</span>
                    )}
                    <span className="text-xs text-txt-muted">{doc.filename}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(doc)}
                  className={`p-2 rounded-lg transition-colors ${
                    doc.active ? 'text-accent hover:bg-accent-muted' : 'text-txt-muted hover:bg-bg-surface'
                  }`}
                  title={doc.active ? 'Deaktivieren' : 'Aktivieren'}
                >
                  {doc.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setDeleteTarget(doc)}
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
          title="Dokument löschen"
          message={`"${deleteTarget.name}" wird unwiderruflich gelöscht.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
