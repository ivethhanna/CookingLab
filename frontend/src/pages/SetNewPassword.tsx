import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '../components/Badge';

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir una letra minúscula.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir una letra mayúscula.';
  }

  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir un dígito numérico.';
  }

  return null;
}

export function SetNewPassword() {
  const { completeNewPassword } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      await completeNewPassword(newPassword);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo establecer la nueva contraseña.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card auth-panel" onSubmit={handleSubmit} style={{ padding: '2.5rem' }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
        <div className="brand-mark" style={{ width: '3.2rem', height: '3.2rem', marginBottom: '0.4rem' }}>
          <KeyRound size={26} />
        </div>
        <Badge variant="accent">Actualizar Acceso</Badge>
        <h2>NUEVA CONTRASEÑA</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Por seguridad, debes definir una contraseña nueva en tu primera sesión.
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
          <Lock size={13} style={{ display: 'inline', marginRight: '0.3rem' }} />
          Nueva Contraseña
        </span>
        <input
          autoComplete="new-password"
          placeholder="••••••••"
          required
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>

      <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <li>Mínimo 8 caracteres</li>
        <li>Al menos 1 letra mayúscula y 1 minúscula</li>
        <li>Al menos 1 número</li>
      </ul>

      <button className="btn-primary full-width" disabled={submitting} type="submit" style={{ padding: '0.85rem' }}>
        <ShieldCheck size={18} />
        <span>{submitting ? 'Guardando...' : 'Establecer Contraseña'}</span>
      </button>
    </form>
  );
}
