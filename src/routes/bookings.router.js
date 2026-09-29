// ---------------------------------------------------------------------
// Router del recurso "bookings" (reservas).
//
// Igual que services.router.js: un express.Router() que SOLO mapea
// endpoints a funciones del controller. Sin lógica acá adentro.
//
// El prefijo '/api/bookings' se pone en app.js con:
//   app.use('/api/bookings', bookingsRouter);
// por eso las rutas de acá son relativas.
// ---------------------------------------------------------------------

import { Router } from 'express';
import {
  createBooking,
  getBookingById,
  addServiceToBooking,
  updateBooking,
  getStatusReport,
} from '../controllers/bookings.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { bookingSchema } from '../validations/booking.validation.js';

const router = Router();

// POST /api/bookings              -> crear una reserva
// (el body se valida con Zod antes de llegar al controller)
router.post('/', validateBody(bookingSchema), createBooking);

// GET /api/bookings/report/status -> cantidad de reservas por estado
// Buena práctica: las rutas FIJAS van antes que las que tienen
// parámetros. Express prueba las rutas en el orden en que se registran;
// si existiera, por ejemplo, un GET '/:bid/:algo', se "comería" esta
// URL y tomaría "report" como si fuera un id de reserva.
router.get('/report/status', getStatusReport);

// GET /api/bookings/:bid          -> ver una reserva por id
router.get('/:bid', getBookingById);

// POST /api/bookings/:bid/services/:sid  -> agregar un servicio a la reserva
// La URL anida dos recursos: la reserva (:bid) y el servicio (:sid) que
// se le suma. Ambos llegan en req.params.
router.post('/:bid/services/:sid', addServiceToBooking);
router.put('/:bid', updateBooking);
export default router;
