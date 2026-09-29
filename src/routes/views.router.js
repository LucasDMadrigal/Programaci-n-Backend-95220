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
import { BookingService } from '../services/bookings.service.js';

const router = Router();

const serviceService = new ServiceService();
const bookingService = new BookingService();

// GET /services -> listado de servicios renderizado.
router.get('/services', async (req, res) => {
  const services = await serviceService.getServices();
  res.render('services', { services });
});

// GET /services/:sid -> detalle de un servicio.
// Si no existe, el service lanza un AppError 404 (la misma regla que usa
// la API); acá lo traducimos a una respuesta de texto simple.
router.get('/services/:sid', async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.sid);
    res.render('service-detail', { service });
  } catch (error) {
    res.status(404).send('Servicio no encontrado');
  }
});

// GET /bookings/:bid -> detalle de una reserva.
router.get('/bookings/:bid', async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bid);
    res.render('booking-detail', { booking });
  } catch (error) {
    res.status(404).send('Reserva no encontrada');
  }
});

// GET /realtime-services -> solo renderiza la página "vacía". Los datos
// NO se pasan acá: llegan después por WebSocket (ver server.js y
// src/public/js/realtime.js).
router.get('/realtime-services', (req, res) => {
  res.render('realtime-services', {});
});

export default router;
