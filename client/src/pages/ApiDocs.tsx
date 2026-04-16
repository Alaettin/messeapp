import { useState } from 'react';
import { Copy, Check, Play, ChevronRight, BookOpen } from 'lucide-react';
import { Card, Button } from '../components/ui';

const API_BASE = '/api/connector';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  summary: string;
  description: string;
  responseExample: string;
  errorExamples?: { status: string; code: string; body: string }[];
  paramInput?: boolean;
  requestBody?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/Product/ids',
    summary: 'List all visitor IDs',
    description: 'Returns an array of all visitor (item) IDs.',
    responseExample: '["12kjo213asd", "abc456", "xyz789"]',
  },
  {
    method: 'GET',
    path: '/Product/hierarchies',
    summary: 'List hierarchies (reserved)',
    description: 'Returns an empty array. Reserved for future use.',
    responseExample: '[]',
  },
  {
    method: 'GET',
    path: '/Product/hierarchy/levels',
    summary: 'List hierarchy levels',
    description: 'Returns one level: "Asset".',
    responseExample: '[\n  { "level": 1, "name": "Asset" }\n]',
  },
  {
    method: 'GET',
    path: '/model',
    summary: 'List model datapoints',
    description: 'Returns all defined datapoints including visitor properties, documents, and contacts. Type 0 = Property, Type 1 = File.',
    responseExample: '[\n  { "id": "name", "name": "Name", "type": 0 },\n  { "id": "avatar", "name": "Avatar", "type": 1 },\n  { "id": "document_1", "name": "Produktkatalog", "type": 1 },\n  { "id": "contact_1_name", "name": "Ansprechpartner 1 - Name", "type": 0 }\n]',
  },
  {
    method: 'GET',
    path: '/Product/{itemId}/hierarchy',
    summary: 'Get hierarchy values for a visitor',
    description: 'Returns the hierarchy value for a specific visitor.',
    responseExample: '[\n  { "level": 1, "name": "Avatar" }\n]',
    errorExamples: [{ status: '404', code: 'status-error', body: '{ "error": "Asset not found" }' }],
    paramInput: true,
  },
  {
    method: 'POST',
    path: '/Product/{itemId}/values',
    summary: 'Get property values for a visitor',
    description: 'Returns property values for a specific visitor. Send empty arrays to get all values. Files return needsResolve: true — use /documents to resolve them.',
    responseExample: '[\n  {\n    "propertyId": "name",\n    "value": "Max Mustermann",\n    "valueLanguage": "en",\n    "needsResolve": false\n  },\n  {\n    "propertyId": "avatar",\n    "value": "avatar_12kjo213asd",\n    "mimeType": "image/png",\n    "filename": "avatar",\n    "needsResolve": true\n  }\n]',
    errorExamples: [{ status: '404', code: 'status-error', body: '{ "error": "Asset not found" }' }],
    paramInput: true,
    requestBody: '{\n  "propertiesWithLanguage": {\n    "languages": [],\n    "propertyIds": []\n  },\n  "propertiesWithoutLanguage": {\n    "propertyIds": []\n  }\n}',
  },
  {
    method: 'POST',
    path: '/Product/{itemId}/documents',
    summary: 'Resolve file content',
    description: 'Returns the full Base64-encoded file content for the requested document properties.',
    responseExample: '[\n  {\n    "propertyId": "avatar",\n    "value": "iVBORw0KGgo...",\n    "filename": "avatar",\n    "valueLanguage": "en",\n    "needsResolve": false\n  }\n]',
    errorExamples: [{ status: '404', code: 'status-error', body: '{ "error": "Asset not found" }' }],
    paramInput: true,
    requestBody: '{\n  "languages": ["en"],\n  "propertyIds": []\n}',
  },
];

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  const [itemId, setItemId] = useState('');
  const [body, setBody] = useState(endpoint.requestBody || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: number; method: string; url: string; body: string } | null>(null);

  async function handleTry() {
    if (endpoint.paramInput && !itemId.trim()) return;
    setLoading(true);
    const path = endpoint.path.replace('{itemId}', encodeURIComponent(itemId));
    const url = API_BASE + path;

    try {
      const opts: RequestInit = endpoint.method === 'POST'
        ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
        : {};
      const res = await fetch(url, opts);
      const text = await res.text();
      let formatted = text;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      setResult({ status: res.status, method: endpoint.method, url, body: formatted });
    } catch (err) {
      setResult({ status: 0, method: endpoint.method, url, body: `Request failed: ${(err as Error).message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padding="sm" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full p-3 text-left"
      >
        <ChevronRight className={`w-4 h-4 text-txt-muted flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
        <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
          endpoint.method === 'GET'
            ? 'bg-success/10 text-success border border-success/30'
            : 'bg-blue-50 text-blue-600 border border-blue-200'
        }`}>
          {endpoint.method}
        </span>
        <span className="font-mono text-sm font-semibold text-txt-primary">{endpoint.path}</span>
        <span className="ml-auto text-xs text-txt-muted hidden sm:inline">{endpoint.summary}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <p className="text-sm text-txt-secondary mb-3">{endpoint.description}</p>

          {endpoint.requestBody && (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-txt-muted mb-1">Request Body</p>
              <pre className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-3 text-xs overflow-x-auto mb-3 whitespace-pre-wrap">{endpoint.requestBody}</pre>
            </>
          )}

          <p className="text-xs font-bold uppercase tracking-wide text-txt-muted mb-1">
            Response <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-success/10 text-success border border-success/30">200 OK</span>
          </p>
          <pre className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-3 text-xs overflow-x-auto mb-3 whitespace-pre-wrap">{endpoint.responseExample}</pre>

          {endpoint.errorExamples?.map((err, i) => (
            <div key={i}>
              <p className="text-xs font-bold uppercase tracking-wide text-txt-muted mb-1">
                Error <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/30">{err.status}</span>
              </p>
              <pre className="bg-[#1e293b] text-[#e2e8f0] rounded-lg p-3 text-xs overflow-x-auto mb-3 whitespace-pre-wrap">{err.body}</pre>
            </div>
          ))}

          {/* Try it */}
          <div className="mt-4 pt-3 border-t border-border">
            {endpoint.paramInput && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-txt-muted">Item ID</span>
                <input
                  type="text"
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  placeholder="visitorId"
                  className="font-mono text-sm px-2 py-1.5 border border-border rounded-lg bg-bg-primary text-txt-primary w-48"
                />
              </div>
            )}

            {endpoint.requestBody && (
              <div className="mb-2">
                <span className="text-xs font-semibold text-txt-muted block mb-1">Request Body</span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  className="w-full font-mono text-xs px-3 py-2 border border-border rounded-lg bg-bg-primary text-txt-primary resize-y"
                />
              </div>
            )}

            <Button size="sm" onClick={handleTry} loading={loading} disabled={endpoint.paramInput && !itemId.trim()}>
              <Play className="w-3.5 h-3.5" /> Testen
            </Button>

            {result && (
              <div className="mt-3 border border-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-surface border-b border-border">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                    result.status === 200
                      ? 'bg-success/10 text-success border border-success/30'
                      : result.status === 404
                        ? 'bg-warning/10 text-warning border border-warning/30'
                        : 'bg-error/10 text-error border border-error/30'
                  }`}>
                    {result.status || 'ERR'} {result.status === 200 ? 'OK' : 'Error'}
                  </span>
                  <span className="text-xs text-txt-muted">{result.method} {result.url}</span>
                </div>
                <pre className="bg-[#1e293b] text-[#e2e8f0] p-3 text-xs overflow-x-auto whitespace-pre-wrap m-0 rounded-none">{result.body}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function ApiDocs() {
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin + API_BASE + '/';

  function handleCopy() {
    navigator.clipboard.writeText(baseUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-semibold text-txt-primary">Connector API</h1>
      </div>
      <p className="text-sm text-txt-secondary">REST API im Connector-Muster. Alle Endpunkte sind öffentlich (kein Login erforderlich).</p>

      {/* Base URL */}
      <Card padding="md">
        <p className="text-xs font-bold uppercase tracking-wide text-txt-muted mb-2">Base URL</p>
        <div className="flex items-center gap-2 bg-[#1e293b] rounded-lg px-3 py-2">
          <code className="text-sm text-[#e2e8f0] break-all flex-1">{baseUrl}</code>
          <button onClick={handleCopy} className="p-1.5 rounded text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-white/10 transition-colors flex-shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </Card>

      {/* Endpoints */}
      <h2 className="text-lg font-semibold text-txt-primary mt-2">Endpoints</h2>
      {ENDPOINTS.map((ep, i) => (
        <EndpointCard key={i} endpoint={ep} />
      ))}
    </div>
  );
}
