// ---------------------------------------------------------------------
// Router del recurso "services"
//
// ¿Qué resuelve express.Router()?
// Hasta ahora TODAS las rutas vivían apiladas dentro de app.js. A medida
// que la API crece (más recursos, más endpoints), ese archivo se vuelve
// gigante e imposible de leer. express.Router() nos da un "mini-app":
// un objeto donde registramos rutas de forma aislada (router.get,
// router.post, ...) y que después enchufamos en app.js con una sola
// línea:
//
//   app.use('/api/services', servicesRouter);
//
// Ese prefijo '/api/services' se pone UNA sola vez en app.js. Por eso acá
// las rutas se escriben RELATIVAS al recurso:
//   router.get('/')      ->  GET /api/services
//   router.get('/:sid')  ->  GET /api/services/:sid
//
// Router() ya viene incluido en Express: no hay que instalar nada.
//
// NOTA (Etapa 1 de la modularización): por ahora la lógica de cada ruta
// sigue escrita acá adentro. En el próximo paso la vamos a mover a un
// "controller", y este archivo va a quedar solo con el mapeo
// endpoint -> función.
// ---------------------------------------------------------------------

import { Router } from 'express';
import { ServiceManager } from '../managers/ServiceManager.js';

const router = Router();

// Instanciamos el manager una sola vez para todo el router. El manager
// encapsula la persistencia en archivo (fs/promises): las rutas solo le
// piden datos y deciden qué responder.
const serviceManager = new ServiceManager();

// Convención de respuestas de toda la API:
//   éxito -> { status: 'success', payload }
//   error -> { status: 'error', message }

// GET /api/services
// Lista todos los servicios. Acepta un filtro opcional por query string:
// /api/services?category=salud
//
// req.query trae lo que va después del "?" en la URL; req.params trae los
// valores capturados de la propia ruta (por ejemplo :sid más abajo).
router.get('/', async (req, res) => {
  const { category } = req.query;

  const allServices = await serviceManager.getServices();

  const payload = category
    ? allServices.filter((service) => service.category === category)
    : allServices;

  res.status(200).json({ status: 'success', payload });
});

// GET /api/services/:sid
// Busca un servicio puntual por id.
router.get('/:sid', async (req, res) => {
  const service = await serviceManager.getServiceById(req.params.sid);

  if (!service) {
    // 404 Not Found: el recurso pedido no existe. Esta decisión (qué
    // código HTTP corresponde a un null) queda en la ruta, no en el
    // manager: el manager solo dice "no está" devolviendo null.
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  res.status(200).json({ status: 'success', payload: service });
});

// POST /api/services
// Crea un servicio nuevo a partir del body de la petición.
router.post('/', async (req, res) => {
  const { name, duration, price, category } = req.body;

  // Validación mínima: si falta algún campo obligatorio, no seguimos.
  // El ServiceManager no valida nada, solo persiste lo que le llega.
  if (!name || !duration || !price || !category) {
    // 400 Bad Request: la petición está mal formada (culpa del cliente),
    // a diferencia del 404 que es "no encontré lo que pediste".
    return res
      .status(400)
      .json({ status: 'error', message: 'Faltan campos obligatorios' });
  }

  const newService = await serviceManager.addService(req.body);

  // 201 Created: la petición creó un recurso nuevo.
  res.status(201).json({ status: 'success', payload: newService });
});

// PUT /api/services/:sid
// Actualiza (reemplaza campos de) un servicio existente.
router.put('/:sid', async (req, res) => {
  const updatedService = await serviceManager.updateService(
    req.params.sid,
    req.body
  );

  if (!updatedService) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  res.status(200).json({ status: 'success', payload: updatedService });
});

// DELETE /api/services/:sid
// Elimina un servicio del archivo de datos.
router.delete('/:sid', async (req, res) => {
  const deletedService = await serviceManager.deleteService(req.params.sid);

  if (!deletedService) {
    return res
      .status(404)
      .json({ status: 'error', message: 'Servicio no encontrado' });
  }

  res.status(200).json({ status: 'success', payload: deletedService });
});

// Exportamos el router ya configurado para que app.js lo monte bajo el
// prefijo /api/services.
export default router;
