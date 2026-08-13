import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'La contrasena debe tener al menos 8 caracteres.';
  }

  if (!/[a-z]/.test(password)) {
    return 'La contrasena debe incluir una letra minuscula.';
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contrasena debe incluir una letra mayuscula.';
  }

  if (!/[0-9]/.test(password)) {
    return 'La contrasena debe incluir un digito.';
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
      setError(err instanceof Error ? err.message : 'No se pudo establecer la nueva contrasena.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="panel auth-panel" onSubmit={handleSubmit}>
      <div className="section-heading">
        <p className="eyebrow">Acceso</p>
        <h1>Establecer contrasena</h1>
      </div>
      {error && <p className="alert error">{error}</p>}
      <label>
        Nueva contrasena
        <input
          autoComplete="new-password"
          required
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <button className="btn-primary full-width" disabled={submitting} type="submit">
        {submitting ? 'Guardando...' : 'Establecer contrasena'}
      </button>
    </form>
  );
}
