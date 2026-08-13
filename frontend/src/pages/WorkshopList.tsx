import { FormEvent, useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Filter,
  Globe,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { Workshop } from '@shared/types';
import { listWorkshops } from '../api/client';
import { Badge } from '../components/Badge';
import { WorkshopCard } from '../components/WorkshopCard';

const popularCategories = ['Todas', 'Pastelería', 'Cocina Italiana', 'Panadería', 'Asados', 'Coctelería'];

export function WorkshopList() {
  const [items, setItems] = useState<Workshop[]>([]);
  const [category, setCategory] = useState('');
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(reset = false) {
    setLoading(true);
    setError(null);

    try {
      const response = await listWorkshops({
        limit: 12,
        category: category || undefined,
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

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load(true);
  }

  function handleCategoryChipClick(selectedCat: string) {
    const val = selectedCat === 'Todas' ? '' : selectedCat;
    setCategory(val);
    void listWorkshops({
      limit: 12,
      category: val || undefined,
    }).then((res) => {
      setItems(res.items);
      setNextToken(res.nextToken);
    });
  }

  const scheduledCount = items.filter((w) => w.status === 'scheduled').length;
  const availableSeats = items.reduce(
    (total, w) => total + Math.max(w.capacity - w.registeredCount, 0),
    0
  );

  return (
    <section className="container page-stack">
      {/* Hero Section — 2 Columns with Image Collage */}
      <section className="hero-grid">
        <div className="hero-copy">
          <Badge variant="accent">
            <GraduationCap size={14} />
            Formación Certificada
          </Badge>

          <h1>
            Aprendizaje Práctico
            <span className="second-line">Con Mentores Líderes</span>
          </h1>

          <p style={{ fontSize: '1.1rem', lineHeight: '1.65' }}>
            Explora talleres presenciales y virtuales, revisa cupos en tiempo real e inscríbete a capacitaciones certificadas con chefs y docentes expertos.
          </p>

          <div className="hero-actions">
            <a className="btn-primary" href="#catalogo">
              <span>Ver Talleres</span>
              <ChevronRight size={16} />
            </a>
            <a className="btn-secondary" href="#como-funciona">
              <span>Cómo Funciona</span>
            </a>
          </div>

          {/* Quick Stats Strip */}
          <div className="quick-stats-strip">
            <div className="quick-stat-item">
              <div className="quick-stat-icon">
                <Calendar size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>PRÓXIMO TALLER</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>Agenda 2026 Abierta</strong>
              </div>
            </div>

            <div className="quick-stat-item">
              <div className="quick-stat-icon">
                <Globe size={18} />
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>MODALIDAD</span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>Presencial & Online</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Asymmetrical Collage + Highlight Stat Block */}
        <div className="collage-wrapper">
          <img
            alt="Capacitación práctica"
            className="collage-img"
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=600&q=80"
          />

          <div className="stat-block">
            <strong>500+</strong>
            <span>Profesionales Capacitados</span>
          </div>

          <img
            alt="Taller gastronómico"
            className="collage-img tall"
            src="https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?auto=format&fit=crop&w=600&q=80"
            style={{ gridColumn: 'span 2' }}
          />
        </div>
      </section>

      {/* Section Divider */}
      <div className="section-divider" id="catalogo">
        <div className="divider-content">
          <BookOpen size={16} />
          <span>Agenda de Talleres Disponibles</span>
        </div>
      </div>

      {/* Filter & Toolbar */}
      <div className="toolbar-panel">
        <form className="filter-form" onSubmit={handleFilter}>
          <div className="search-wrapper">
            <Search size={18} />
            <input
              className="search-input"
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Buscar por categoría (ej. Pastelería, Italiana)..."
              value={category}
            />
          </div>
          <button className="btn-secondary" disabled={loading} type="submit">
            <Filter size={16} />
            <span>{loading ? 'Filtrando...' : 'Filtrar'}</span>
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Badge>
            <Users size={12} />
            {availableSeats} Cupos Libres Totales
          </Badge>
          <Badge variant="accent">
            {scheduledCount} Programados
          </Badge>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', marginRight: '0.4rem' }}>
          Categorías:
        </span>
        {popularCategories.map((cat) => {
          const isActive = (cat === 'Todas' && !category) || category.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              onClick={() => handleCategoryChipClick(cat)}
              type="button"
              className={`nav-link ${isActive ? 'active' : ''}`}
              style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="alert error">
          <span>{error}</span>
        </div>
      )}

      {/* Workshop Grid / Skeleton Loaders */}
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
        <div className="workshop-grid">
          {items.map((workshop) => (
            <WorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card empty-state">
          <BookOpen size={48} style={{ color: 'var(--accent-orange)' }} />
          <h3>No encontramos talleres para mostrar</h3>
          <p>Prueba buscando otra categoría o borra el filtro actual.</p>

          {category && (
            <button className="btn-secondary inline-action" onClick={() => handleCategoryChipClick('Todas')} type="button">
              Ver todos los talleres
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        {nextToken && (
          <button className="btn-secondary" disabled={loading} onClick={() => void load()} type="button">
            <ChevronDown size={16} />
            <span>{loading ? 'Cargando...' : 'Cargar más talleres'}</span>
          </button>
        )}
      </div>

      {/* How it Works Section — Alternating Dark Background */}
      <section className="section-dark" id="como-funciona">
        <div style={{ textAlign: 'center', maxWidth: '650px', margin: '0 auto 2.5rem' }}>
          <Badge variant="accent" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> METODOLOGÍA
          </Badge>
          <h2>¿Cómo Funciona CookingLab?</h2>
          <p>Un proceso sencillo estructurado para maximizar tu aprendizaje práctico.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ backgroundColor: 'var(--bg-dark-card)', borderColor: 'var(--border-inverse)' }}>
            <div className="stat-block" style={{ width: '2.5rem', height: '2.5rem', padding: 0, fontSize: '1.2rem', marginBottom: '0.5rem' }}>1</div>
            <h3>Explora y Elige</h3>
            <p>Filtra por tu especialidad de interés y revisa la fecha, instructor y temario del taller.</p>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--bg-dark-card)', borderColor: 'var(--border-inverse)' }}>
            <div className="stat-block" style={{ width: '2.5rem', height: '2.5rem', padding: 0, fontSize: '1.2rem', marginBottom: '0.5rem' }}>2</div>
            <h3>Reserva Tu Cupo</h3>
            <p>Conéctate con tu cuenta e inscríbete de manera instantánea con cupos limitados asegurados.</p>
          </div>

          <div className="card" style={{ backgroundColor: 'var(--bg-dark-card)', borderColor: 'var(--border-inverse)' }}>
            <div className="stat-block" style={{ width: '2.5rem', height: '2.5rem', padding: 0, fontSize: '1.2rem', marginBottom: '0.5rem' }}>3</div>
            <h3>Aprende y Certifícate</h3>
            <p>Asiste a la clase en vivo y recibe tu constancia digital respaldada por mentores certificados.</p>
          </div>
        </div>
      </section>
    </section>
  );
}
