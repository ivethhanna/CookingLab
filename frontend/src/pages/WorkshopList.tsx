import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Workshop } from '@shared/types';
import { listWorkshops } from '../api/client';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

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
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los talleres.');
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

  return (
    <section className="container page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">Talleres disponibles</p>
          <h1>CookingLab</h1>
        </div>
        <form className="filter-form" onSubmit={handleFilter}>
          <input
            aria-label="Categoria"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Categoria"
            value={category}
          />
          <button className="btn-secondary" type="submit">
            Filtrar
          </button>
        </form>
      </header>

      {error && <p className="alert error">{error}</p>}

      <div className="workshop-grid">
        {items.map((workshop) => {
          const available = workshop.capacity - workshop.registeredCount;

          return (
            <article className="card" key={workshop.id}>
              <div className="card-badge">{workshop.category}</div>
              <h2>{workshop.name}</h2>
              <p className="description">{workshop.description}</p>
              <dl className="details-list">
                <div>
                  <dt>Fecha</dt>
                  <dd>{formatDate(workshop.startAt)}</dd>
                </div>
                <div>
                  <dt>Precio</dt>
                  <dd>${workshop.price.toLocaleString('es-CO')}</dd>
                </div>
                <div>
                  <dt>Cupos</dt>
                  <dd>{Math.max(available, 0)} disponibles</dd>
                </div>
              </dl>
              <div className="card-footer">
                <span className={`status ${workshop.status}`}>{workshop.status}</span>
                <Link className="btn-primary" to={`/workshops/${workshop.id}`}>
                  Ver detalle
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && items.length === 0 && <p className="empty-state">No hay talleres para mostrar.</p>}

      <div className="load-more">
        {nextToken && (
          <button className="btn-secondary" disabled={loading} onClick={() => void load()} type="button">
            {loading ? 'Cargando...' : 'Cargar mas'}
          </button>
        )}
        {loading && !nextToken && <p className="muted">Cargando talleres...</p>}
      </div>
    </section>
  );
}
