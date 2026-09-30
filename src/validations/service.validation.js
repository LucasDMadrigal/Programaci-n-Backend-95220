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
  name: z.string().min(5, 'El nombre es obligatorio y debe tener al menos 5 caracteres'), // min(5) para que no sea un string vacío ni de 1-4 caracteres
  description: z.string().optional(), // puede faltar, y si viene, puede ser string vacío
  duration: z.number().positive('La duración debe ser mayor a 0'), // > 0 para que no sea 0 ni negativo
  price: z.number().nonnegative('El precio no puede ser negativo'), // >= 0 para que no sea negativo
  category: z.string().min(5, 'La categoría es obligatoria y debe tener al menos 5 caracteres'), // min(5) para que no sea un string vacío
  available: z.boolean().optional(), // false o true, "False", 0, 1, "true", "false" son todos "truthy" en JS; el cliente tiene que mandar un booleano real
});
