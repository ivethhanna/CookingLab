import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  CheckCircle2,
  ChefHat,
  Globe,
  GraduationCap,
  MapPin,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import { Workshop } from '@shared/types';
import { getWorkshop, registerToWorkshop } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '../components/Badge';

function formatDate(value: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
}

const statusLabels: Record<Workshop['status'], string> = {
  scheduled: 'Programado',
  cancelled: 'Cancelado',
  finished: 'Finalizado',
};

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
      setMessage('¡Inscripción confirmada con éxito! Te esperamos en la clase.');
      setWorkshop((current) =>
        current ? { ...current, registeredCount: current.registeredCount + 1 } : current
      );
    } catch (err) {
      const title = err instanceof Error ? err.message : '';
      if (title === 'Already registered') {
        setError('Ya estás inscrito en este taller.');
      } else if (title === 'Capacity exceeded') {
        setError('El taller ya no tiene cupos disponibles.');
      } else {
        setError(title || 'No se pudo completar la inscripción.');
      }
    }
  }

  if (loading) {
    return (
      <section className="container page-stack">
        <div className="skeleton-card" style={{ height: '400px' }}>
          <div className="skeleton-box" style={{ height: '28px', width: '30%' }} />
          <div className="skeleton-box" style={{ height: '40px', width: '70%' }} />
          <div className="skeleton-box" style={{ height: '120px', width: '100%' }} />
        </div>
      </section>
    );
  }

  if (!workshop) {
    return (
      <section className="container page-stack" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div className="alert error inline-action" style={{ margin: '0 auto 1.5rem' }}>
          <AlertCircle size={18} />
          <span>{error || 'Taller no encontrado.'}</span>
        </div>
        <div>
          <Link className="btn-secondary inline-action" to="/">
            <ArrowLeft size={16} />
            <span>Volver al catálogo</span>
          </Link>
        </div>
      </section>
    );
  }

  const available = Math.max(workshop.capacity - workshop.registeredCount, 0);
  const registrationClosed = workshop.status === 'cancelled' || workshop.status === 'finished';
  const fillPercent = Math.min(100, Math.round((workshop.registeredCount / workshop.capacity) * 100));

  return (
    <section className="container page-stack">
      {/* Top Navigation */}
      <div>
        <Link className="btn-secondary inline-action" to="/" style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}>
          <ArrowLeft size={16} />
          <span>Volver a talleres</span>
        </Link>
      </div>

      <div className="detail-layout">
        {/* Main Info Card */}
        <article className="card" style={{ padding: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Badge variant="accent">
              <Tag size={14} />
              {workshop.category}
            </Badge>
            <Badge variant={workshop.status}>
              {statusLabels[workshop.status]}
            </Badge>
          </div>

          <h1 style={{ marginTop: '0.75rem', fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}>
            {workshop.name}
          </h1>

          <p style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-muted)' }}>
            {workshop.description}
          </p>

          <div className="section-divider">
            <div className="divider-content">
              <Sparkles size={14} />
              <span>Detalles del Taller</span>
            </div>
          </div>

          {/* Info Tiles Grid */}
          <div className="detail-grid-info">
            <div className="info-tile">
              <div className="info-tile-icon">
                <ChefHat size={20} />
              </div>
              <div className="info-tile-content">
                <label>Instructor</label>
                <span>{workshop.instructor}</span>
              </div>
            </div>

            <div className="info-tile">
              <div className="info-tile-icon">
                <Calendar size={20} />
              </div>
              <div className="info-tile-content">
                <label>Fecha y Hora</label>
                <span style={{ fontSize: '0.92rem' }}>{formatDate(workshop.startAt)}</span>
              </div>
            </div>

            <div className="info-tile">
              <div className="info-tile-icon">
                {workshop.modality === 'virtual' ? <Globe size={20} /> : <MapPin size={20} />}
              </div>
              <div className="info-tile-content">
                <label>Lugar / Ubicación</label>
                <span>{workshop.location}</span>
              </div>
            </div>

            <div className="info-tile">
              <div className="info-tile-icon">
                <Award size={20} />
              </div>
              <div className="info-tile-content">
                <label>Nivel de Exigencia</label>
                <span style={{ textTransform: 'capitalize' }}>{workshop.level}</span>
              </div>
            </div>
          </div>

          {/* Perks & Included Box */}
          <div style={{ backgroundColor: 'var(--bg-cream)', padding: '1.25rem', borderRadius: 'var(--radius-card)', border: '1.5px solid var(--border-dark)', marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GraduationCap size={16} style={{ color: 'var(--accent-orange)' }} />
              Beneficios Incluidos
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={16} style={{ color: workshop.ingredientsIncluded ? 'var(--accent-emerald)' : 'var(--text-dim)' }} />
                <span>{workshop.ingredientsIncluded ? 'Ingredientes e insumos incluidos' : 'Lista de insumos enviada por correo'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={16} style={{ color: workshop.certificateOffered ? 'var(--accent-emerald)' : 'var(--text-dim)' }} />
                <span>{workshop.certificateOffered ? 'Certificado de asistencia oficial' : 'Constancia digital de participación'}</span>
              </div>
            </div>
          </div>
        </article>

        {/* Sidebar Summary Card */}
        <aside className="summary-box">
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
              PRECIO DE INSCRIPCIÓN
            </span>
            <div className="price-tag-big" style={{ marginTop: '0.2rem' }}>
              ${workshop.price.toLocaleString('es-CO')}
            </div>
          </div>

          {/* Seat Capacity Gauge */}
          <div className="capacity-meter">
            <div className="meter-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Users size={14} /> Disponibilidad de Cupos
              </span>
              <strong style={{ color: available === 0 ? 'var(--accent-rose)' : 'var(--accent-orange)' }}>
                {available} disponible{available === 1 ? '' : 's'}
              </strong>
            </div>
            <div className="meter-bar-track" style={{ height: '8px' }}>
              <div
                className="meter-bar-fill"
                style={{
                  width: `${fillPercent}%`,
                  backgroundColor: available === 0 ? 'var(--accent-rose)' : 'var(--accent-orange)'
                }}
              />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textAlign: 'right' }}>
              {workshop.registeredCount} de {workshop.capacity} plazas reservadas
            </span>
          </div>

          {message && (
            <div className="alert success">
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="alert error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {registrationClosed && (
            <div className="alert error" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
              <AlertCircle size={18} />
              <span>Las inscripciones para este taller ya finalizaron o fueron canceladas.</span>
            </div>
          )}

          {user ? (
            <button
              className="btn-primary full-width"
              disabled={registrationClosed || available === 0}
              onClick={handleRegister}
              type="button"
              style={{ padding: '0.85rem' }}
            >
              <span>{available === 0 ? 'Sin Cupos Disponibles' : 'Confirmar Inscripción'}</span>
            </button>
          ) : (
            <Link className="btn-primary full-width" to="/login" style={{ padding: '0.85rem', textDecoration: 'none' }}>
              <span>Iniciar Sesión para Registrarme</span>
            </Link>
          )}

          <div style={{ textAlign: 'center' }}>
            <small style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              Reserva inmediata respaldada por tu cuenta CookingLab.
            </small>
          </div>
        </aside>
      </div>
    </section>
  );
}
