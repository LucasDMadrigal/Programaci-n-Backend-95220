// ---------------------------------------------------------------------
// Schema de Zod para validar el BODY de POST /api/bookings (Semana 8).
// Ver service.validation.js para la diferencia entre Zod y Mongoose.
// ---------------------------------------------------------------------

import { z } from 'zod';

export const bookingSchema = z.object({
  clientName: z.string().min(1, 'El nombre del cliente es obligatorio'),
  clientEmail: z.string().email('El email no es válido'),
  // La fecha llega como string en el JSON (por ejemplo "2026-09-01");
  // Mongoose la convierte a Date al guardar.
  date: z.string().optional(),
  // Los servicios se agregan después con
  // POST /api/bookings/:bid/services/:sid, por eso es opcional.
  services: z.array(z.any()).optional(),
});
