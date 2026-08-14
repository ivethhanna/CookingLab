import { Link, NavLink } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <header className="navbar">
      <Link className="nav-brand" to="/">
        <div className="brand-mark" aria-hidden="true">
          <GraduationCap size={22} />
        </div>
        <div className="brand-copy">
          <strong>CookingLab</strong>
          <small>Formación Profesional</small>
        </div>
      </Link>

      <nav className="nav-links">
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">
          <GraduationCap size={16} />
          <span>Talleres</span>
        </NavLink>

        {isAdmin && (
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/admin">
            <LayoutDashboard size={16} />
            <span>Admin</span>
          </NavLink>
        )}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="badge" style={{ backgroundColor: 'var(--bg-cream-card)' }} title={user.email}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', display: 'inline-block' }} />
              <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
            </div>
            <button className="nav-link" onClick={signOut} type="button" title="Cerrar sesión">
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        ) : (
          <NavLink className="btn-primary" to="/login" style={{ padding: '0.5rem 1.1rem', fontSize: '0.88rem' }}>
            <LogIn size={16} />
            <span>Acceso</span>
          </NavLink>
        )}
      </nav>
    </header>
  );
}
