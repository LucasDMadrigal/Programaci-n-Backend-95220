// ---------------------------------------------------------------------
// Middleware validateBody(schema) (Semana 8)
//
// Es una FUNCIÓN QUE DEVUELVE UN MIDDLEWARE: recibe un schema de Zod y
// devuelve el (req, res, next) que Express va a ejecutar. Así el mismo
// middleware sirve para cualquier recurso:
//
//   router.post('/', validateBody(serviceSchema), createService);
//
// Se ejecuta ANTES del controller. Si el body no cumple el schema,
// cortamos acá con un 400 y el controller (y la base) ni se enteran.
// ---------------------------------------------------------------------

export const validateBody = (schema) => (req, res, next) => {
  // safeParse NO lanza excepción: devuelve { success, data } o
  // { success, error }. (parse, en cambio, tiraría un error.)
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Cada issue trae el path del campo (un array, por ejemplo
    // ['price']) y un mensaje. Los convertimos en strings legibles:
    // "price: Invalid input: expected number, received string".
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`
    );

    return res.status(400).json({ status: 'error', message: 'Datos inválidos', errors });
  }

  // result.data es el body YA validado y "limpio": Zod descarta las
  // propiedades que no están en el schema. Lo que sigue en la cadena
  // (controller -> service) recibe solo datos confiables.
  req.body = result.data;
  next();
};
