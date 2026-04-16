import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';

export default function AppShell() {
  const navigate = useNavigate();
  const username = localStorage.getItem('auth_user');

  function handleLogout() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch('/api/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/login', { replace: true });
  }

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
          <div className="flex items-center gap-1">
            {username && (
              <span className="px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-sm font-medium text-accent mr-2">
                {username}
              </span>
            )}
            <Link
              to="/admin"
              className="p-2 text-txt-muted hover:text-txt-primary transition-colors"
              title="Backoffice"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 text-txt-muted hover:text-error transition-colors"
              title="Abmelden"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
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
