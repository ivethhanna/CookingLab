import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container auth-page">
      <form className="panel auth-panel" onSubmit={handleSubmit}>
        <div className="section-heading">
          <p className="eyebrow">Acceso</p>
          <h1>Iniciar sesion</h1>
        </div>
        {error && <p className="alert error">{error}</p>}
        <label>
          Email
          <input autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input
            autoComplete="current-password"
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="btn-primary full-width" disabled={submitting} type="submit">
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </section>
  );
}
