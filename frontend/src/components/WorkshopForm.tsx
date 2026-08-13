import { FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Edit2, PlusCircle } from 'lucide-react';
import { WorkshopInput } from '@shared/types';

type WorkshopFormProps = {
  form: WorkshopInput;
  editingId: string | null;
  message: string | null;
  error: string | null;
  submitting?: boolean;
  onUpdateField: <K extends keyof WorkshopInput>(key: K, value: WorkshopInput[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit: () => void;
};

export function WorkshopForm({
  form,
  editingId,
  message,
  error,
  submitting,
  onUpdateField,
  onSubmit,
  onCancelEdit,
}: WorkshopFormProps) {
  return (
    <form className="card" onSubmit={onSubmit} style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem' }}>
            {editingId ? <Edit2 size={20} style={{ color: 'var(--accent-orange)' }} /> : <PlusCircle size={20} style={{ color: 'var(--accent-orange)' }} />}
            {editingId ? 'EDITAR TALLER' : 'CREAR NUEVO TALLER'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            La información se sincronizará inmediatamente con el catálogo general.
          </p>
        </div>

        {editingId && (
          <button className="btn-secondary" onClick={onCancelEdit} type="button" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Cancelar Edición
          </button>
        )}
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

      <div className="form-grid">
        <label className="input-group">
          Nombre del Taller
          <input
            required
            minLength={3}
            placeholder="ej. Masterclass de Pasta Fresca"
            value={form.name}
            onChange={(e) => onUpdateField('name', e.target.value)}
          />
        </label>

        <label className="input-group">
          Categoría
          <input
            required
            placeholder="ej. Pastelería, Cocina Italiana..."
            value={form.category}
            onChange={(e) => onUpdateField('category', e.target.value)}
          />
        </label>

        <label className="input-group span-2">
          Descripción Detallada
          <textarea
            required
            minLength={10}
            placeholder="Describe lo que aprenderán los estudiantes, recetas y dinámicas..."
            value={form.description}
            onChange={(e) => onUpdateField('description', e.target.value)}
          />
        </label>

        <label className="input-group">
          Ubicación / Lugar
          <input
            required
            placeholder="ej. Sede Poblado o Enlace Zoom"
            value={form.location}
            onChange={(e) => onUpdateField('location', e.target.value)}
          />
        </label>

        <label className="input-group">
          Instructor / Chef
          <input
            required
            placeholder="ej. Chef Marco Rossi"
            value={form.instructor}
            onChange={(e) => onUpdateField('instructor', e.target.value)}
          />
        </label>

        <label className="input-group">
          Nivel
          <select value={form.level} onChange={(e) => onUpdateField('level', e.target.value as WorkshopInput['level'])}>
            <option value="basico">Básico</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzado">Avanzado</option>
          </select>
        </label>

        <label className="input-group">
          Modalidad
          <select value={form.modality} onChange={(e) => onUpdateField('modality', e.target.value as WorkshopInput['modality'])}>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
          </select>
        </label>

        <label className="input-group">
          Precio ($ COP)
          <input
            min={1}
            required
            type="number"
            value={form.price || ''}
            onChange={(e) => onUpdateField('price', Number(e.target.value))}
          />
        </label>

        <label className="input-group">
          Capacidad (Cupos Máximos)
          <input
            min={1}
            required
            type="number"
            value={form.capacity || ''}
            onChange={(e) => onUpdateField('capacity', Number(e.target.value))}
          />
        </label>

        <label className="input-group">
          Fecha y Hora Inicio
          <input
            required
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => onUpdateField('startAt', e.target.value)}
          />
        </label>

        <label className="input-group">
          Fecha y Hora Fin
          <input
            required
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => onUpdateField('endAt', e.target.value)}
          />
        </label>

        <label className="input-group">
          Estado del Taller
          <select value={form.status} onChange={(e) => onUpdateField('status', e.target.value as WorkshopInput['status'])}>
            <option value="scheduled">Programado</option>
            <option value="cancelled">Cancelado</option>
            <option value="finished">Finalizado</option>
          </select>
        </label>

        <div className="span-2" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', paddingTop: '0.5rem' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', textTransform: 'none' }}>
            <input
              checked={form.ingredientsIncluded}
              onChange={(e) => onUpdateField('ingredientsIncluded', e.target.checked)}
              type="checkbox"
              style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--accent-orange)' }}
            />
            <span>Incluye Ingredientes e Insumos</span>
          </label>

          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', textTransform: 'none' }}>
            <input
              checked={form.certificateOffered}
              onChange={(e) => onUpdateField('certificateOffered', e.target.checked)}
              type="checkbox"
              style={{ width: '1.1rem', height: '1.1rem', accentColor: 'var(--accent-orange)' }}
            />
            <span>Ofrece Certificado Oficial</span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className="btn-primary" disabled={submitting} type="submit">
          {editingId ? <Edit2 size={16} /> : <PlusCircle size={16} />}
          <span>{submitting ? 'Guardando...' : editingId ? 'Actualizar Taller' : 'Crear Taller'}</span>
        </button>
      </div>
    </form>
  );
}
