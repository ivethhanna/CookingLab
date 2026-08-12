import { z } from 'zod';
import { WorkshopInput } from '../../../shared/types';

const workshopBaseSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripcion debe tener al menos 10 caracteres'),
  category: z.string().min(1, 'La categoria es requerida'),
  location: z.string().min(1, 'La ubicacion es requerida'),
  startAt: z.string().datetime({ message: 'startAt debe ser un ISO 8601 valido' }),
  endAt: z.string().datetime({ message: 'endAt debe ser un ISO 8601 valido' }),
  status: z.enum(['scheduled', 'cancelled']),
  capacity: z.number().int().positive('La capacidad debe ser un numero entero positivo'),
  instructor: z.string().min(1, 'El instructor es requerido'),
  level: z.enum(['basico', 'intermedio', 'avanzado']),
  modality: z.enum(['presencial', 'virtual']),
  certificateOffered: z.boolean(),
  ingredientsIncluded: z.boolean(),
  price: z.number().positive('El precio debe ser positivo'),
});

export const workshopInputSchema = workshopBaseSchema
  .refine((data) => new Date(data.endAt).getTime() > new Date(data.startAt).getTime(), {
    path: ['endAt'],
    message: 'endAt debe ser posterior a startAt',
  }) satisfies z.ZodType<WorkshopInput>;

export const workshopUpdateSchema = workshopBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debe incluir al menos un campo para actualizar',
  })
  .refine((data) => {
    if (!data.startAt || !data.endAt) {
      return true;
    }

    return new Date(data.endAt).getTime() > new Date(data.startAt).getTime();
  }, {
    path: ['endAt'],
    message: 'endAt debe ser posterior a startAt',
  });

export type CreateWorkshopInput = z.infer<typeof workshopInputSchema>;
export type UpdateWorkshopInput = z.infer<typeof workshopUpdateSchema>;
