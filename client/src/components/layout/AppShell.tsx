import { Outlet, Link } from 'react-router-dom';
import { Settings } from 'lucide-react';

export default function AppShell() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-bg-primary border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/neoception-logo.png"
              alt="Neoception"
              className="h-7"
            />
            <span className="text-lg font-semibold text-accent tracking-tight">
              Passport
            </span>
          </Link>
          <Link
            to="/admin"
            className="p-2 text-txt-muted hover:text-txt-primary transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
