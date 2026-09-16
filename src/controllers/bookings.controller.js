// ---------------------------------------------------------------------
// Controller del recurso "bookings" (reservas).
//
// Misma responsabilidad que services.controller.js: SOLO HTTP. Recibe
// (req, res), lee req.params / req.body, llama al SERVICE y responde.
//
// Las reglas de negocio (validar que el servicio exista, la regla de
// quantity, etc.) NO están acá: viven en bookings.service.js, que
// lanza AppError con el statusCode que corresponde cuando algo falla.
// El catch de cada función es genérico: usa error.statusCode si vino,
// o 500 para cualquier error inesperado.
// ---------------------------------------------------------------------

import { bookingService } from '../services/bookings.service.js';

// POST /api/bookings
// Crea una reserva nueva. El body puede traer client y date; si no
// vienen, el service pone valores por defecto.
export const createBooking = async (req, res) => {
  try {
    const newBooking = await bookingService.createBooking(req.body);

    // 201 Created: se creó un recurso nuevo. Nace con services: [].
    res.status(201).json({ status: 'success', payload: newBooking });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};

// GET /api/bookings/:bid
// Devuelve una reserva puntual por id.
export const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bid);

    res.status(200).json({ status: 'success', payload: booking });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};

// POST /api/bookings/:bid/services/:sid
// Agrega el servicio :sid a la reserva :bid. Si el servicio ya estaba
// en la reserva, incrementa su quantity (esa regla vive en el service).
export const addServiceToBooking = async (req, res) => {
  try {
    const { bid, sid } = req.params;

    const updatedBooking = await bookingService.addServiceToBooking(bid, sid);

    res.status(200).json({ status: 'success', payload: updatedBooking });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const { bid } = req.params;
    const updatedBooking = await bookingService.updateBooking(bid, req.body);
    res.status(200).json({ status: 'success', payload: updatedBooking });
  } catch (error) {
    res.status(error.statusCode ?? 500).json({ status: 'error', message: error.message });
  }
};
