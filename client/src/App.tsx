import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Capture from './pages/Capture';
import Admin from './pages/Admin';
import Login from './pages/Login';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('auth_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <AuthGuard>
            <AppShell />
          </AuthGuard>
        }
      >
        <Route path="/" element={<Capture />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
