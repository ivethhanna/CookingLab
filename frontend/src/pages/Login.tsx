import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, GraduationCap, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '../components/Badge';
import { SetNewPassword } from './SetNewPassword';

export function Login() {
  const { user, pendingNewPassword, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate replace to="/" />;
  }

  if (pendingNewPassword) {
    return (
      <section className="container auth-page">
        <SetNewPassword />
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container auth-page">
      <form className="card auth-panel" onSubmit={handleSubmit} style={{ padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
          <div className="brand-mark" style={{ width: '3.2rem', height: '3.2rem', marginBottom: '0.4rem' }}>
            <GraduationCap size={26} />
          </div>
          <Badge variant="accent">Acceso Privado</Badge>
          <h2>INGRESAR A COOKINGLAB</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Usa tus credenciales para inscribirte o administrar capacitaciones.
          </p>
        </div>

        {error && (
          <div className="alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <label className="input-group">
          <span>
            <Mail size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />
            Correo Electrónico
          </span>
          <input
            autoComplete="email"
            placeholder="tu-correo@ejemplo.com"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="input-group">
          <span>
            <Lock size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />
            Contraseña
          </span>
          <input
            autoComplete="current-password"
            placeholder="••••••••"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button className="btn-primary full-width" disabled={submitting} type="submit" style={{ padding: '0.85rem', marginTop: '0.5rem' }}>
          <ShieldCheck size={18} />
          <span>{submitting ? 'Verificando...' : 'Iniciar Sesión'}</span>
        </button>

        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <small style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
            Acceso seguro autenticado vía AWS Cognito.
          </small>
        </div>
      </form>
    </section>
  );
}
