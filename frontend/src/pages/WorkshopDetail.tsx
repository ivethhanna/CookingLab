import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Workshop } from '@shared/types';
import { getWorkshop, registerToWorkshop } from '../api/client';
import { useAuth } from '../auth/AuthContext';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function WorkshopDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    getWorkshop(id)
      .then(setWorkshop)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el taller.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleRegister() {
    if (!id) {
      return;
    }

    setMessage(null);
    setError(null);

    try {
      await registerToWorkshop(id);
      setMessage('Inscripcion confirmada.');
      setWorkshop((current) =>
        current ? { ...current, registeredCount: current.registeredCount + 1 } : current
      );
    } catch (err) {
      const title = err instanceof Error ? err.message : '';
      if (title === 'Already registered') {
        setError('Ya estabas inscrito en este taller.');
      } else if (title === 'Capacity exceeded') {
        setError('El taller ya no tiene cupos disponibles.');
      } else {
        setError(title || 'No se pudo completar la inscripcion.');
      }
    }
  }

  if (loading) {
    return <p className="container muted">Cargando taller...</p>;
  }

  if (!workshop) {
    return (
      <section className="container page-stack">
        <p className="alert error">{error || 'Taller no encontrado.'}</p>
        <Link className="btn-secondary inline-action" to="/">
          Volver
        </Link>
      </section>
    );
  }

  const available = Math.max(workshop.capacity - workshop.registeredCount, 0);

  return (
    <section className="container detail-layout">
      <article className="detail-main">
        <p className="eyebrow">{workshop.category}</p>
        <h1>{workshop.name}</h1>
        <p className="description">{workshop.description}</p>

        <dl className="detail-grid">
          <div>
            <dt>Instructor</dt>
            <dd>{workshop.instructor}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{formatDate(workshop.startAt)}</dd>
          </div>
          <div>
            <dt>Lugar</dt>
            <dd>{workshop.location}</dd>
          </div>
          <div>
            <dt>Nivel</dt>
            <dd>{workshop.level}</dd>
          </div>
          <div>
            <dt>Modalidad</dt>
            <dd>{workshop.modality}</dd>
          </div>
          <div>
            <dt>Incluye ingredientes</dt>
            <dd>{workshop.ingredientsIncluded ? 'Si' : 'No'}</dd>
          </div>
        </dl>
      </article>

      <aside className="summary-box">
        <span className={`status ${workshop.status}`}>{workshop.status}</span>
        <div className="price-tag">${workshop.price.toLocaleString('es-CO')}</div>
        <p>
          Cupos disponibles: <strong>{available}</strong>
        </p>
        {message && <p className="alert success">{message}</p>}
        {error && <p className="alert error">{error}</p>}
        {user ? (
          <button className="btn-primary full-width" disabled={available === 0} onClick={handleRegister} type="button">
            Inscribirme
          </button>
        ) : (
          <Link className="btn-primary full-width" to="/login">
            Iniciar sesion
          </Link>
        )}
      </aside>
    </section>
  );
}
