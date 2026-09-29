// ---------------------------------------------------------------------
// Capa de SERVICE del recurso "bookings" (reservas)
//
// Acá vive TODA la regla de negocio de reservas:
//   - validar que el servicio exista antes de agregarlo a una reserva
//     (para eso este service COMPONE al ServiceService: un service
//     puede apoyarse en otro, y por eso recibe también un
//     serviceRepository para consultar servicios sin pasar por el
//     controller);
//   - la regla de "quantity": si el servicio ya está en la reserva se
//     incrementa su cantidad; si no, se agrega { service, quantity: 1 };
//   - lanzar AppError con el status HTTP que corresponde cuando algo no
//     existe. El controller solo necesita un catch genérico.
//
// El BookingRepository (y su BookingFsDao) quedan como PERSISTENCIA
// PURA: no saben nada de servicios ni de la regla de quantity.
//
// Este service NO conoce req ni res.
// ---------------------------------------------------------------------

import { BookingRepository } from '../repositories/bookings.repository.js';
import { ServiceRepository } from '../repositories/services.repository.js';
import { AppError } from '../utils/AppError.js';

export class BookingService {
  // Regla de DI: recibe AMBOS repositories por constructor, con valores
  // por defecto. Nunca instancia un DAO directamente.
  constructor(
    bookingRepository = new BookingRepository(),
    serviceRepository = new ServiceRepository()
  ) {
    this.bookingRepository = bookingRepository;
    this.serviceRepository = serviceRepository;
  }

  // Devuelve la reserva con ese id. Si no existe, AppError 404.
  async getBookingById(id) {
    const booking = await this.bookingRepository.getById(id);

    if (!booking) {
      throw new AppError('Reserva no encontrada', 404);
    }

    return booking;
  }

  // Crea una reserva nueva. Acá se arman los valores por defecto: el
  // repository/dao solo persiste lo que reciben, no deciden estas
  // reglas (eso es una regla de negocio, no de persistencia).
  //
  // Semana 6: status ya no se manda acá; el schema de BookingModel le
  // pone 'pending' por defecto (ver src/dao/models/booking.model.js).
  async createBooking(data) {
    const newBooking = {
      clientName: data.clientName ?? 'Anónimo',
      clientEmail: data.clientEmail,
      date: data.date,
      // La reserva arranca SIN servicios; se agregan después con
      // addServiceToBooking.
      services: [],
    };

    return this.bookingRepository.create(newBooking);
  }

  // Agrega el servicio :sid a la reserva :bid.
  async addServiceToBooking(bid, sid) {
    // 1) Regla de negocio: no se puede agregar un servicio que no
    //    existe. Se lo preguntamos al serviceRepository.
    const servicio = await this.serviceRepository.getById(sid);
    if (!servicio) {
      throw new AppError('Servicio no encontrado', 404);
    }

    // 2) La reserva tiene que existir.
    const booking = await this.bookingRepository.getById(bid);
    if (!booking) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // 3) Regla de "quantity".
    //
    //    En booking.services NO guardamos el objeto completo del
    //    servicio, solo su REFERENCIA (el ObjectId) + una cantidad.
    //    Motivos:
    //      - Sin duplicación: nombre/precio/duración viven solo en la
    //        colección "services". Si cambia el precio, no hay copias
    //        viejas.
    //      - Sin inconsistencias: una única fuente de verdad.
    //
    //    Si el servicio YA está en la reserva, incrementamos su
    //    quantity en vez de hacer un segundo push del mismo id: así la
    //    lista tiene una entrada por servicio + un contador, más fácil
    //    de leer y de mostrar que varias entradas repetidas.
    //
    //    Semana 6: s.service ahora es un ObjectId de Mongo (no un
    //    number), así que comparamos convirtiendo ambos lados a string.
    const item = booking.services.find((s) => String(s.service) === String(sid));

    if (item) {
      item.quantity += 1;
    } else {
      // Mongoose castea automáticamente el string sid a ObjectId al
      // guardar, gracias al tipo declarado en el schema.
      booking.services.push({ service: sid, quantity: 1 });
    }

    // 4) Persistimos el cambio: le pedimos al repository que guarde la
    //    nueva lista de servicios de esta reserva. El repository/dao
    //    solo escribe; la regla de cómo quedó la lista ya la aplicamos
    //    acá.
    return this.bookingRepository.update(bid, { services: booking.services });
  }

  async updateBooking(bid, data) {
    return this.bookingRepository.update(bid, data);
  }
}


// Instancia única compartida por todos los que importen este módulo.
export const bookingService = new BookingService();
