import type { Visitor, Document, Contact, AvatarOption, OcrResult, VisitorFull } from '../types';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...options?.headers,
  };

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Sitzung abgelaufen');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `API error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  checkVisitor(id: string) {
    return request<{ exists: boolean; visitor?: Partial<Visitor> }>(`/visitors/${encodeURIComponent(id)}/exists`);
  },

  createVisitor(id: string) {
    return request<{ id: string }>('/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  },

  uploadBusinessCard(id: string, photo: Blob) {
    const form = new FormData();
    form.append('photo', photo, `${id}.jpg`);
    return request<{ ocr: OcrResult }>(`/visitors/${encodeURIComponent(id)}/business-card`, {
      method: 'POST',
      body: form,
    });
  },

  updateVisitor(id: string, data: Partial<Visitor>) {
    return request<Visitor>(`/visitors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  getDocuments() {
    return request<{ documents: Document[] }>('/documents?active=true');
  },

  getContacts() {
    return request<{ contacts: Contact[] }>('/contacts?active=true');
  },

  saveSelections(id: string, documentIds: number[], contactIds: number[]) {
    return request<{ success: boolean }>(`/visitors/${encodeURIComponent(id)}/selections`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds, contactIds }),
    });
  },

  getAvatarOptions() {
    return request<{ options: Record<string, AvatarOption[]> }>('/avatar-options');
  },

  generateAvatar(id: string, selections: Record<string, string>, freeText: string) {
    return request<{ avatarUrl: string; prompt: string }>(`/visitors/${encodeURIComponent(id)}/avatar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selections, freeText }),
    });
  },

  getVisitor(id: string) {
    return request<VisitorFull>(`/visitors/${encodeURIComponent(id)}`);
  },

  // Admin
  adminGetDocuments() {
    return request<{ documents: Document[] }>('/admin/documents');
  },
  adminCreateDocument(file: File, name: string, category: string) {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    form.append('category', category);
    return request<Document>('/admin/documents', { method: 'POST', body: form });
  },
  adminUpdateDocument(id: number, data: Partial<Document>) {
    return request<Document>(`/admin/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  adminDeleteDocument(id: number) {
    return request<{ success: boolean }>(`/admin/documents/${id}`, { method: 'DELETE' });
  },

  adminGetContacts() {
    return request<{ contacts: Contact[] }>('/admin/contacts');
  },
  adminCreateContact(data: Partial<Contact>) {
    return request<Contact>('/admin/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  adminUpdateContact(id: number, data: Partial<Contact>) {
    return request<Contact>(`/admin/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  adminDeleteContact(id: number) {
    return request<{ success: boolean }>(`/admin/contacts/${id}`, { method: 'DELETE' });
  },

  adminGetVisitors(search?: string) {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ visitors: Visitor[] }>(`/admin/visitors${q}`);
  },
  adminUpdateVisitor(id: string, data: Partial<Visitor>) {
    return request<Visitor>(`/admin/visitors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
  adminDeleteVisitor(id: string) {
    return request<{ success: boolean }>(`/admin/visitors/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  adminGetSettings() {
    return request<{ settings: Record<string, string> }>('/admin/settings');
  },
  adminUpdateSettings(data: Record<string, string>) {
    return request<{ success: boolean }>('/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};
