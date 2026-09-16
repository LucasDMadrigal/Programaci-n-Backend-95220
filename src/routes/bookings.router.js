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
  updateBooking
} from '../controllers/bookings.controller.js';

const router = Router();

// POST /api/bookings              -> crear una reserva
router.post('/', createBooking);

// GET /api/bookings/:bid          -> ver una reserva por id
router.get('/:bid', getBookingById);

// POST /api/bookings/:bid/services/:sid  -> agregar un servicio a la reserva
// La URL anida dos recursos: la reserva (:bid) y el servicio (:sid) que
// se le suma. Ambos llegan en req.params.
router.post('/:bid/services/:sid', addServiceToBooking);
router.put('/:bid', updateBooking);
export default router;
