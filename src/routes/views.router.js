// ---------------------------------------------------------------------
// Router de VISTAS (Semana 7)
//
// A diferencia de los routers de /api, acá no respondemos JSON sino HTML
// renderizado en el servidor con Handlebars: res.render('vista', datos).
//
// IMPORTANTE: las vistas usan la MISMA capa de service que la API
// (ServiceService / BookingService). No acceden a Mongo ni a un DAO
// directo: así las reglas de negocio (filtros, validaciones, errores
// 404) son las mismas se pida HTML o JSON.
// ---------------------------------------------------------------------

import { Router } from 'express';
import { ServiceService } from '../services/services.service.js';

const router = Router();

const serviceService = new ServiceService();

// GET /services -> listado de servicios renderizado.
router.get('/services', async (req, res) => {
  const services = await serviceService.getServices();
  res.render('services', { services });
});

export default router;
