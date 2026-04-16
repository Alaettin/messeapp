import { useState } from 'react';
import { FileText, Users, UserSearch } from 'lucide-react';
import AdminDocuments from '../components/admin/AdminDocuments';
import AdminContacts from '../components/admin/AdminContacts';
import AdminVisitors from '../components/admin/AdminVisitors';

type Tab = 'documents' | 'contacts' | 'visitors';

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'documents', label: 'Dokumente', icon: <FileText className="w-4 h-4" /> },
  { key: 'contacts', label: 'Kontakte', icon: <Users className="w-4 h-4" /> },
  { key: 'visitors', label: 'Besucher', icon: <UserSearch className="w-4 h-4" /> },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('visitors');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-txt-primary">Backoffice</h1>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-bg-surface rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium flex-1 justify-center transition-all ${
              activeTab === tab.key
                ? 'bg-accent text-white shadow-glow'
                : 'text-txt-secondary hover:text-txt-primary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'documents' && <AdminDocuments />}
      {activeTab === 'contacts' && <AdminContacts />}
      {activeTab === 'visitors' && <AdminVisitors />}
    </div>
  );
}
