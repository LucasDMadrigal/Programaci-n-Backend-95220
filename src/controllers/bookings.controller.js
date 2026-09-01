// ---------------------------------------------------------------------
// Controller del recurso "bookings" (reservas).
//
// Misma responsabilidad que services.controller.js: traducir HTTP <->
// lógica de negocio. Recibe (req, res), le pide el trabajo al
// BookingManager y decide el status code + el cuerpo de la respuesta.
//
// Todas las funciones van en try/catch: ante un error INESPERADO
// respondemos 500 en vez de tirar abajo el servidor.
// ---------------------------------------------------------------------

import { BookingManager } from '../managers/BookingManager.js';

// Instanciamos el manager una sola vez para todo el controller.
const bookingManager = new BookingManager();

// POST /api/bookings
// Crea una reserva nueva. El body puede traer client y date; si no
// vienen, el manager pone valores por defecto ('Anónimo' / null).
export const createBooking = async (req, res) => {
  try {
    const newBooking = await bookingManager.createBooking(req.body);

    // 201 Created: se creó un recurso nuevo. Nace con services: [].
    res.status(201).json({ status: 'success', payload: newBooking });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// GET /api/bookings/:bid
// Devuelve una reserva puntual por id.
export const getBookingById = async (req, res) => {
  try {
    const booking = await bookingManager.getBookingById(req.params.bid);

    if (!booking) {
      // 404: el manager devolvió null -> la reserva no existe.
      return res
        .status(404)
        .json({ status: 'error', message: 'Reserva no encontrada' });
    }

    res.status(200).json({ status: 'success', payload: booking });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// POST /api/bookings/:bid/services/:sid
// Agrega el servicio :sid a la reserva :bid. Si el servicio ya estaba
// en la reserva, incrementa su quantity.
export const addServiceToBooking = async (req, res) => {
  try {
    const { bid, sid } = req.params;

    const result = await bookingManager.addServiceToBooking(bid, sid);

    // El manager nos devuelve un objeto que describe qué pasó. Acá lo
    // traducimos a códigos HTTP.
    if (result.error === 'SERVICE_NOT_FOUND') {
      return res
        .status(404)
        .json({ status: 'error', message: 'Servicio no encontrado' });
    }

    if (result.error === 'BOOKING_NOT_FOUND') {
      return res
        .status(404)
        .json({ status: 'error', message: 'Reserva no encontrada' });
    }

    // Éxito: devolvemos la reserva ya actualizada.
    res.status(200).json({ status: 'success', payload: result.booking });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
