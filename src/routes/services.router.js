// ---------------------------------------------------------------------
// Router del recurso "services"
//
// ¿Qué resuelve express.Router()?
// Hasta la Semana 3 TODAS las rutas vivían apiladas dentro de app.js. A
// medida que la API crece (más recursos, más endpoints), ese archivo se
// vuelve gigante e imposible de leer. express.Router() nos da un
// "mini-app": un objeto donde registramos rutas de forma aislada
// (router.get, router.post, ...) y que después enchufamos en app.js con
// una sola línea:
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
// Después de la modularización, este archivo NO tiene lógica: solo
// conecta cada endpoint con la función del controller que lo resuelve.
// Se lee como un índice de la API.
// ---------------------------------------------------------------------

import { Router } from 'express';
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from '../controllers/services.controller.js';

const router = Router();

router.get('/', getServices);
router.get('/:sid', getServiceById);
// router.get('/:sname', getServiceByName); // TODO: endpoint opcional para buscar por nombre
router.post('/', createService);
router.put('/:sid', updateService);
router.delete('/:sid', deleteService);

// Exportamos el router ya configurado para que app.js lo monte bajo el
// prefijo /api/services.
export default router;
