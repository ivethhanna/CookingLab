import { Link } from 'react-router-dom';
import { Award, Calendar, ChefHat, ChevronRight, Globe, MapPin, Tag } from 'lucide-react';
import { Workshop } from '@shared/types';
import { Badge } from './Badge';

function formatDate(value: string): string {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

const statusLabels: Record<Workshop['status'], string> = {
  scheduled: 'Programado',
  cancelled: 'Cancelado',
  finished: 'Finalizado',
};

type WorkshopCardProps = {
  workshop: Workshop;
};

export function WorkshopCard({ workshop }: WorkshopCardProps) {
  const available = Math.max(workshop.capacity - workshop.registeredCount, 0);
  const fillPercent = Math.min(100, Math.round((workshop.registeredCount / workshop.capacity) * 100));
  const isFull = available === 0;

  return (
    <article className="card card-hover">
      {/* Header Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Badge variant="accent">
          <Tag size={12} />
          {workshop.category}
        </Badge>
        <Badge variant={workshop.status}>
          {statusLabels[workshop.status]}
        </Badge>
      </div>

      {/* Workshop Title & Description */}
      <div>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
          {workshop.name}
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {workshop.description}
        </p>
      </div>

      {/* Details Grid */}
      <div className="details-meta">
        <div className="meta-item">
          <Calendar size={15} />
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>FECHA</span>
            <strong style={{ fontSize: '0.82rem' }}>{formatDate(workshop.startAt).split(',')[0]}</strong>
          </div>
        </div>

        <div className="meta-item">
          <ChefHat size={15} />
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>INSTRUCTOR</span>
            <strong style={{ fontSize: '0.82rem' }}>{workshop.instructor}</strong>
          </div>
        </div>

        <div className="meta-item">
          {workshop.modality === 'virtual' ? <Globe size={15} /> : <MapPin size={15} />}
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>MODALIDAD</span>
            <strong style={{ fontSize: '0.82rem' }}>{workshop.modality}</strong>
          </div>
        </div>

        <div className="meta-item">
          <Award size={15} />
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>NIVEL</span>
            <strong style={{ fontSize: '0.82rem', textTransform: 'capitalize' }}>{workshop.level}</strong>
          </div>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="capacity-meter">
        <div className="meter-header">
          <span style={{ color: 'var(--text-muted)' }}>Ocupación de la clase</span>
          <strong style={{ color: isFull ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
            {workshop.registeredCount}/{workshop.capacity} inscritos ({available} cupo{available === 1 ? '' : 's'})
          </strong>
        </div>
        <div className="meter-bar-track">
          <div
            className="meter-bar-fill"
            style={{
              width: `${fillPercent}%`,
              backgroundColor: isFull ? 'var(--accent-rose)' : available <= 3 ? 'var(--accent-amber)' : 'var(--accent-orange)'
            }}
          />
        </div>
      </div>

      {/* Footer Price & CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1.5px solid var(--border-subtle)', marginTop: '0.25rem' }}>
        <div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>INVERSIÓN</span>
          <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', color: 'var(--accent-orange)' }}>
            ${workshop.price.toLocaleString('es-CO')}
          </strong>
        </div>

        <Link className="btn-primary" to={`/workshops/${workshop.id}`} style={{ padding: '0.55rem 1.1rem', fontSize: '0.88rem' }}>
          <span>Ver Taller</span>
          <ChevronRight size={15} />
        </Link>
      </div>
    </article>
  );
}
