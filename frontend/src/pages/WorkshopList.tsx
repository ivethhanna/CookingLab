import { useEffect, useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Globe,
  GraduationCap,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { WORKSHOP_CATEGORIES, Workshop } from '@shared/types';
import { listWorkshops } from '../api/client';
import { Badge } from '../components/Badge';
import { WorkshopCard } from '../components/WorkshopCard';

export function WorkshopList() {
  const [items, setItems] = useState<Workshop[]>([]);
  const [category, setCategory] = useState('');
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(reset = false, categoryOverride = category) {
    setLoading(true);
    setError(null);

    try {
      const response = await listWorkshops({
        limit: 12,
        category: categoryOverride || undefined,
        nextToken: reset ? undefined : nextToken,
      });

      setItems((current) => (reset ? response.items : [...current, ...response.items]));
      setNextToken(response.nextToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los talleres desde la API.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(true);
  }, []);

  function applyCategoryFilter(value: string) {
    setCategory(value);
    void load(true, value);
  }

  function clearCategoryFilter() {
    applyCategoryFilter('');
  }

  const scheduledCount = items.filter((workshop) => workshop.status === 'scheduled').length;
  const availableSeats = items.reduce(
    (total, workshop) => total + Math.max(workshop.capacity - workshop.registeredCount, 0),
    0
  );

  return (
    <section className="container page-stack">
      <section className="hero-grid">
        <div className="hero-copy">
          <Badge variant="accent">
            <GraduationCap size={14} />
            Formacion Certificada
          </Badge>

          <h1>
            Aprendizaje Practico
            <span className="second-line">Con Mentores Lideres</span>
          </h1>

          <p style={{ fontSize: '1.1rem', lineHeight: '1.65' }}>
            Explora talleres presenciales y virtuales, revisa cupos en tiempo real e inscribete a capacitaciones
            certificadas con chefs y docentes expertos.
          </p>

          <div className="hero-actions">
            <a className="btn-primary" href="#catalogo">
              <span>Ver Talleres</span>
              <ChevronRight size={16} />
            </a>
            <a className="btn-secondary" href="#como-funciona">
              <span>Como Funciona</span>
            </a>
          </div>

          <div className="quick-stats-strip">
            <div className="quick-stat-item">
              <div className="quick-stat-icon">
                <Calendar size={18} />
              </div>
              <div>
                <span className="stat-kicker">PROXIMO TALLER</span>
                <strong className="stat-title">Agenda 2026 Abierta</strong>
              </div>
            </div>

            <div className="quick-stat-item">
              <div className="quick-stat-icon">
                <Globe size={18} />
              </div>
              <div>
                <span className="stat-kicker">MODALIDAD</span>
                <strong className="stat-title">Presencial & Online</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="collage-wrapper">
          <img
            alt="Capacitacion practica"
            className="collage-img"
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80"
          />

          <div className="stat-block">
            <strong>500+</strong>
            <span>Profesionales Capacitados</span>
          </div>

          <img
            alt="Taller gastronomico"
            className="collage-img tall"
            src="https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?auto=format&fit=crop&w=600&q=80"
            style={{ gridColumn: 'span 2' }}
          />
        </div>
      </section>

      <div className="section-divider" id="catalogo">
        <div className="divider-content">
          <BookOpen size={16} />
          <span>Agenda de Talleres Disponibles</span>
        </div>
      </div>

      <div className="toolbar-panel">
        <div className="filter-form">
          <div className="search-wrapper">
            <Search size={18} />
            <select
              aria-label="Categoria"
              className="search-input"
              disabled={loading}
              onChange={(event) => applyCategoryFilter(event.target.value)}
              value={category}
            >
              <option value="">Todas las categorias</option>
              {WORKSHOP_CATEGORIES.map((categoryOption) => (
                <option key={categoryOption} value={categoryOption}>
                  {categoryOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge>
            <Users size={12} />
            {availableSeats} Cupos Libres Totales
          </Badge>
          <Badge variant="accent">{scheduledCount} Programados</Badge>
        </div>
      </div>

      {error && (
        <div className="alert error">
          <span>{error}</span>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="workshop-grid" aria-label="Cargando talleres">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="skeleton-card" key={index}>
              <div className="skeleton-box" style={{ height: '28px', width: '40%' }} />
              <div className="skeleton-box" style={{ height: '32px', width: '80%' }} />
              <div className="skeleton-box" style={{ height: '60px', width: '100%' }} />
              <div className="skeleton-box" style={{ height: '80px', width: '100%' }} />
              <div className="skeleton-box" style={{ height: '42px', width: '100%', marginTop: 'auto' }} />
            </div>
          ))}
        </div>
      ) : (
        <div aria-busy={loading} className={`workshop-grid ${loading ? 'is-loading' : ''}`}>
          {items.map((workshop) => (
            <WorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card empty-state">
          <BookOpen size={48} style={{ color: 'var(--accent-orange)' }} />
          <h3>No encontramos talleres para mostrar</h3>
          <p>Prueba seleccionando otra categoria o borra el filtro actual.</p>

          {category && (
            <button className="btn-secondary inline-action" onClick={clearCategoryFilter} type="button">
              Ver todos los talleres
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        {nextToken && (
          <button className="btn-secondary" disabled={loading} onClick={() => void load()} type="button">
            <ChevronDown size={16} />
            <span>{loading ? 'Cargando...' : 'Cargar mas talleres'}</span>
          </button>
        )}
      </div>

      <section className="section-dark" id="como-funciona">
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
          <Badge variant="accent" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> METODOLOGIA
          </Badge>
          <h2>Como Funciona CookingLab</h2>
          <p>Un proceso sencillo estructurado para maximizar tu aprendizaje practico.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ backgroundColor: 'var(--bg-dark-card)', borderColor: 'var(--border-inverse)' }}>
            <div className="stat-block step-number">1</div>
            <h3>Explora y Elige</h3>
            <p>Filtra por tu especialidad de interes y revisa la fecha, instructor y temario del taller.</p>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--bg-dark-card)', borderColor: 'var(--border-inverse)' }}>
            <div className="stat-block step-number">2</div>
            <h3>Reserva Tu Cupo</h3>
            <p>Conectate con tu cuenta e inscribete de manera instantanea con cupos limitados asegurados.</p>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--bg-dark-card)', borderColor: 'var(--border-inverse)' }}>
            <div className="stat-block step-number">3</div>
            <h3>Aprende y Certificate</h3>
            <p>Asiste a la clase en vivo y recibe tu constancia digital respaldada por mentores certificados.</p>
          </div>
        </div>
      </section>
    </section>
  );
}
