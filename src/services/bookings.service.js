// ---------------------------------------------------------------------
// Capa de SERVICE del recurso "bookings" (reservas)
//
// Acá vive TODA la regla de negocio de reservas que antes estaba
// metida dentro de BookingManager:
//
//   - validar que el servicio exista antes de agregarlo a una reserva
//     (para eso este service COMPONE al services.service: un service
//     puede apoyarse en otro);
//   - la regla de "quantity": si el servicio ya está en la reserva se
//     incrementa su cantidad; si no, se agrega { service, quantity: 1 };
//   - devolver resultados de DOMINIO: la reserva, o un error de dominio
//     como { error: 'SERVICE_NOT_FOUND' } / { error: 'BOOKING_NOT_FOUND' }.
//     El controller después traduce esos resultados a códigos HTTP.
//
// El BookingManager queda como PERSISTENCIA PURA: leer/escribir el JSON
// y CRUD sobre él. No sabe nada de servicios ni de reglas.
//
// Este service NO conoce req ni res.
// ---------------------------------------------------------------------

import { BookingManager } from '../managers/BookingManager.js';
import { servicesService } from './services.service.js';

class BookingsService {
  constructor() {
    // Dueño de su manager de persistencia.
    this.bookingManager = new BookingManager();
    // Reutilizamos el service de "services" para validar servicios:
    // un service puede componer a otro service.
    this.servicesService = servicesService;
  }

  // Devuelve la reserva con ese id, o null si no existe.
  async getBookingById(id) {
    return this.bookingManager.getBookingById(id);
  }

  // Crea una reserva nueva a partir de los datos que llegaron. Los
  // valores por defecto (client 'Anónimo', date null, status 'pending',
  // services []) los arma el manager al persistir.
  async createBooking(data) {
    return this.bookingManager.createBooking(data);
  }

  // Agrega el servicio :sid a la reserva :bid.
  //
  // Resultados de dominio posibles:
  //   { error: 'SERVICE_NOT_FOUND' }  -> el servicio no existe
  //   { error: 'BOOKING_NOT_FOUND' }  -> la reserva no existe
  //   { booking }                     -> reserva actualizada y persistida
  async addServiceToBooking(bid, sid) {
    // 1) Regla de negocio: no se puede agregar un servicio que no
    //    existe. Se lo preguntamos al services.service.
    const servicio = await this.servicesService.getServiceById(sid);
    if (!servicio) {
      return { error: 'SERVICE_NOT_FOUND' };
    }

    // 2) La reserva tiene que existir. Le pedimos al manager que la
    //    lea del archivo.
    const booking = await this.bookingManager.getBookingById(bid);
    if (!booking) {
      return { error: 'BOOKING_NOT_FOUND' };
    }

    // 3) Regla de "quantity".
    //
    //    En booking.services NO guardamos el objeto completo del
    //    servicio, solo su REFERENCIA (el id) + una cantidad. Motivos:
    //      - Sin duplicación: nombre/precio/duración viven solo en
    //        services.json. Si cambia el precio, no hay copias viejas.
    //      - Sin inconsistencias: una única fuente de verdad.
    //
    //    Si el servicio YA está en la reserva, incrementamos su
    //    quantity en vez de hacer un segundo push del mismo id: así la
    //    lista tiene una entrada por servicio + un contador, más fácil
    //    de leer y de mostrar que varias entradas repetidas.
    const item = booking.services.find((s) => s.service === Number(sid));

    if (item) {
      item.quantity += 1;
    } else {
      // Number(sid) porque los :params de la URL siempre llegan como
      // string y queremos guardar un número.
      booking.services.push({ service: Number(sid), quantity: 1 });
    }

    // 4) Persistimos el cambio: le pedimos al manager que guarde la
    //    nueva lista de servicios de esta reserva. El manager solo
    //    escribe; la regla de cómo quedó la lista ya la aplicamos acá.
    const bookingActualizada = await this.bookingManager.updateBooking(bid, {
      services: booking.services,
    });

    return { booking: bookingActualizada };
  }
}

// Instancia única compartida por todos los que importen este módulo.
export const bookingsService = new BookingsService();
