// ---------------------------------------------------------------------
// Schema de Zod para validar el BODY de POST /api/services (Semana 8).
//
// ¿No alcanzaba con el schema de Mongoose? Son dos cosas distintas:
//   - Zod valida la ENTRADA HTTP, antes de llegar al service: si el
//     cliente manda basura, respondemos 400 con un detalle de qué campo
//     está mal, sin tocar la base.
//   - El schema de Mongoose describe cómo se GUARDA el documento; es la
//     última red de seguridad dentro de la capa de persistencia.
//
// Importante: Zod NO castea. Si "price" llega como string ("8000"),
// z.number() falla. Es justamente lo que queremos en una API JSON: el
// cliente tiene que mandar los tipos correctos.
// ---------------------------------------------------------------------

import { z } from 'zod';

export const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  duration: z.number().positive('La duración debe ser mayor a 0'),
  price: z.number().nonnegative('El precio no puede ser negativo'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  available: z.boolean().optional(),
});
