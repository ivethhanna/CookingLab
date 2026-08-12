import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <nav className="navbar">
      <Link className="nav-brand" to="/">
        <span>CookingLab</span>
        <small>AWS Serverless</small>
      </Link>
      <div className="nav-links">
        <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">
          Talleres
        </NavLink>
        {isAdmin && (
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/admin">
            Admin
          </NavLink>
        )}
        {user ? (
          <button className="nav-link" onClick={signOut} type="button">
            Salir
          </button>
        ) : (
          <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/login">
            Login
          </NavLink>
        )}
      </div>
    </nav>
  );
}
