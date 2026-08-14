import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Edit2,
  GraduationCap,
  LayoutDashboard,
  RefreshCw,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { Workshop, WorkshopInput } from '@shared/types';
import { createWorkshop, deleteWorkshop, listWorkshops, updateWorkshop } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Badge } from '../components/Badge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { WorkshopForm } from '../components/WorkshopForm';

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
  capacity: 10,
};

function toDateTimeLocal(value: string): string {
  if (!value) return '';
  return value.slice(0, 16);
}

function toIso(value: string): string {
  return value ? new Date(value).toISOString() : '';
}

const statusLabels: Record<Workshop['status'], string> = {
  scheduled: 'Programado',
  cancelled: 'Cancelado',
  finished: 'Finalizado',
};

export function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const [form, setForm] = useState<WorkshopInput>(emptyWorkshop);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workshopToCancel, setWorkshopToCancel] = useState<Workshop | null>(null);

  async function refresh() {
    setRefreshing(true);
    try {
      const response = await listWorkshops({ limit: 50, includeCancelled: true });
      setWorkshops(response.items);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      void refresh().catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los talleres desde la API.'));
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
    setSubmitting(true);

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
        setMessage('Taller actualizado correctamente.');
      } else {
        await createWorkshop(payload);
        setMessage('Taller creado e ingresado a la agenda.');
      }

      setForm(emptyWorkshop);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el taller.');
    } finally {
      setSubmitting(false);
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

    window.scrollTo({ top: 250, behavior: 'smooth' });
  }

  async function cancelWorkshop(workshop: Workshop) {
    setWorkshopToCancel(null);

    setMessage(null);
    setError(null);

    try {
      await deleteWorkshop(workshop.id);
      setMessage('Taller cancelado correctamente.');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cancelar el taller.');
    }
  }

  const totalCapacity = workshops.reduce((sum, w) => sum + w.capacity, 0);
  const totalRegistered = workshops.reduce((sum, w) => sum + w.registeredCount, 0);
  const scheduledCount = workshops.filter((w) => w.status === 'scheduled').length;

  return (
    <section className="container admin-layout">
      {/* Header Section */}
      <section className="section-dark">
        <Badge variant="accent" style={{ marginBottom: '0.75rem' }}>
          <LayoutDashboard size={14} /> PANEL DE ADMINISTRACIÓN Y CONTROL
        </Badge>
        <h2>GESTIÓN DE LA AGENDA Y CUPOS</h2>
        <p style={{ marginTop: '0.5rem' }}>
          Crea, actualiza o elimina talleres en tiempo real directamente en la API de producción.
        </p>

        <div className="admin-stats-grid" style={{ marginTop: '2rem' }}>
          <div className="stat-card">
            <div className="stat-icon">
              <GraduationCap size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>TALLERES TOTALES</span>
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', display: 'block', color: 'var(--text-primary)' }}>
                {workshops.length}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--accent-orange)' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>PROGRAMADOS</span>
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', display: 'block', color: 'var(--text-primary)' }}>
                {scheduledCount}
              </strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <Users size={22} />
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>INSCRIPCIONES TOTALES</span>
              <strong style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', display: 'block', color: 'var(--text-primary)' }}>
                {totalRegistered} / {totalCapacity}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Form Component */}
      <WorkshopForm
        editingId={editingId}
        error={error}
        form={form}
        message={message}
        onCancelEdit={() => {
          setEditingId(null);
          setForm(emptyWorkshop);
        }}
        onSubmit={handleSubmit}
        onUpdateField={updateField}
        submitting={submitting}
      />

      {/* Existing Workshops Table Section */}
      <section className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem' }}>CATÁLOGO REGISTRADO ({workshops.length})</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Lista de talleres almacenados en la base de datos de producción.
            </p>
          </div>

          <button className="btn-secondary" disabled={refreshing} onClick={() => void refresh()} type="button" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <RefreshCw size={15} />
            <span>{refreshing ? 'Actualizando...' : 'Refrescar Lista'}</span>
          </button>
        </div>

        <div className="table-wrap" style={{ marginTop: '1.25rem' }}>
          <table>
            <thead>
              <tr>
                <th>Taller</th>
                <th>Categoría</th>
                <th>Instructor</th>
                <th>Cupos (Ocupados/Total)</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {workshops.map((w) => {
                const fillPercent = Math.min(100, Math.round((w.registeredCount / w.capacity) * 100));

                return (
                  <tr key={w.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{w.name}</strong>
                      <small style={{ color: 'var(--text-muted)' }}>${w.price.toLocaleString('es-CO')}</small>
                    </td>
                    <td>
                      <Badge>{w.category}</Badge>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{w.instructor}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: '120px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                          {w.registeredCount} / {w.capacity}
                        </span>
                        <div className="meter-bar-track" style={{ height: '5px' }}>
                          <div className="meter-bar-fill" style={{ width: `${fillPercent}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant={w.status}>
                        {statusLabels[w.status]}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button className="btn-secondary" onClick={() => startEditing(w)} type="button" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                          <Edit2 size={13} />
                          <span>Editar</span>
                        </button>
                        <button className="btn-danger" onClick={() => setWorkshopToCancel(w)} type="button">
                          <Trash2 size={13} />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        confirmLabel="Cancelar taller"
        description={
          <>
            Los usuarios inscritos dejaran de verlo en el catalogo, pero la informacion de{' '}
            <strong>{workshopToCancel?.name}</strong> se conserva en el sistema.
          </>
        }
        onCancel={() => setWorkshopToCancel(null)}
        onConfirm={() => {
          if (workshopToCancel) {
            void cancelWorkshop(workshopToCancel);
          }
        }}
        open={Boolean(workshopToCancel)}
        title="Cancelar taller"
      />
    </section>
  );
}
