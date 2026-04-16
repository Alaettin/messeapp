import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Capture from './pages/Capture';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Capture />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
    </Routes>
  );
}
