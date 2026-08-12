import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Workshop, WorkshopInput } from '@shared/types';
import { createWorkshop, deleteWorkshop, listWorkshops, updateWorkshop } from '../api/client';
import { useAuth } from '../auth/AuthContext';

const emptyWorkshop: WorkshopInput = {
  name: '',
  description: '',
  category: '',
  location: '',
  instructor: '',
  level: 'basico',
  modality: 'presencial',
  certificateOffered: false,
  ingredientsIncluded: false,
  price: 0,
  startAt: '',
  endAt: '',
  status: 'scheduled',
  capacity: 1,
};

function toDateTimeLocal(value: string): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 16);
}

function toIso(value: string): string {
  return value ? new Date(value).toISOString() : '';
}

export function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const [form, setForm] = useState<WorkshopInput>(emptyWorkshop);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const response = await listWorkshops({ limit: 50 });
    setWorkshops(response.items);
  }

  useEffect(() => {
    if (isAdmin) {
      void refresh().catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar talleres.'));
    }
  }, [isAdmin]);

  if (!loading && !isAdmin) {
    return <Navigate replace to="/" />;
  }

  function updateField<K extends keyof WorkshopInput>(key: K, value: WorkshopInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const payload: WorkshopInput = {
      ...form,
      startAt: toIso(form.startAt),
      endAt: toIso(form.endAt),
      price: Number(form.price),
      capacity: Number(form.capacity),
    };

    try {
      if (editingId) {
        await updateWorkshop(editingId, payload);
        setMessage('Taller actualizado.');
      } else {
        await createWorkshop(payload);
        setMessage('Taller creado.');
      }

      setForm(emptyWorkshop);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el taller.');
    }
  }

  function startEditing(workshop: Workshop) {
    setEditingId(workshop.id);
    setForm({
      name: workshop.name,
      description: workshop.description,
      category: workshop.category,
      location: workshop.location,
      instructor: workshop.instructor,
      level: workshop.level,
      modality: workshop.modality,
      certificateOffered: workshop.certificateOffered,
      ingredientsIncluded: workshop.ingredientsIncluded,
      price: workshop.price,
      startAt: toDateTimeLocal(workshop.startAt),
      endAt: toDateTimeLocal(workshop.endAt),
      status: workshop.status,
      capacity: workshop.capacity,
    });
  }

  async function cancelWorkshop(id: string) {
    setMessage(null);
    setError(null);

    try {
      await deleteWorkshop(id);
      setMessage('Taller cancelado.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar el taller.');
    }
  }

  return (
    <section className="container admin-layout">
      <form className="panel" onSubmit={handleSubmit}>
        <div className="section-heading">
          <p className="eyebrow">Administracion</p>
          <h1>{editingId ? 'Editar taller' : 'Crear taller'}</h1>
        </div>

        {message && <p className="alert success">{message}</p>}
        {error && <p className="alert error">{error}</p>}

        <div className="form-grid">
          <label>
            Nombre
            <input required minLength={3} value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </label>
          <label>
            Categoria
            <input required value={form.category} onChange={(event) => updateField('category', event.target.value)} />
          </label>
          <label className="span-2">
            Descripcion
            <textarea
              required
              minLength={10}
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>
          <label>
            Lugar
            <input required value={form.location} onChange={(event) => updateField('location', event.target.value)} />
          </label>
          <label>
            Instructor
            <input required value={form.instructor} onChange={(event) => updateField('instructor', event.target.value)} />
          </label>
          <label>
            Nivel
            <select value={form.level} onChange={(event) => updateField('level', event.target.value as WorkshopInput['level'])}>
              <option value="basico">Basico</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </label>
          <label>
            Modalidad
            <select
              value={form.modality}
              onChange={(event) => updateField('modality', event.target.value as WorkshopInput['modality'])}
            >
              <option value="presencial">Presencial</option>
              <option value="virtual">Virtual</option>
            </select>
          </label>
          <label>
            Precio
            <input
              min={1}
              required
              type="number"
              value={form.price}
              onChange={(event) => updateField('price', Number(event.target.value))}
            />
          </label>
          <label>
            Capacidad
            <input
              min={1}
              required
              type="number"
              value={form.capacity}
              onChange={(event) => updateField('capacity', Number(event.target.value))}
            />
          </label>
          <label>
            Inicio
            <input
              required
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => updateField('startAt', event.target.value)}
            />
          </label>
          <label>
            Fin
            <input
              required
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => updateField('endAt', event.target.value)}
            />
          </label>
          <label>
            Estado
            <select value={form.status} onChange={(event) => updateField('status', event.target.value as WorkshopInput['status'])}>
              <option value="scheduled">Scheduled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          <div className="check-row">
            <label>
              <input
                checked={form.certificateOffered}
                onChange={(event) => updateField('certificateOffered', event.target.checked)}
                type="checkbox"
              />
              Certificado
            </label>
            <label>
              <input
                checked={form.ingredientsIncluded}
                onChange={(event) => updateField('ingredientsIncluded', event.target.checked)}
                type="checkbox"
              />
              Ingredientes
            </label>
          </div>
        </div>

        <div className="actions">
          <button className="btn-primary" type="submit">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
          {editingId && (
            <button
              className="btn-secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyWorkshop);
              }}
              type="button"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      <section className="panel">
        <div className="section-heading">
          <p className="eyebrow">Inventario</p>
          <h2>Talleres existentes</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoria</th>
                <th>Cupos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map((workshop) => (
                <tr key={workshop.id}>
                  <td>{workshop.name}</td>
                  <td>{workshop.category}</td>
                  <td>
                    {workshop.registeredCount}/{workshop.capacity}
                  </td>
                  <td>{workshop.status}</td>
                  <td className="row-actions">
                    <button className="btn-secondary" onClick={() => startEditing(workshop)} type="button">
                      Editar
                    </button>
                    <button className="btn-danger" onClick={() => void cancelWorkshop(workshop.id)} type="button">
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
