// ---------------------------------------------------------------------
// BookingManager: persistencia del recurso "bookings" (reservas).
//
// Mismo patrón que ServiceManager: toda la lógica de leer/escribir el
// archivo JSON queda encapsulada acá, con fs/promises (nativo de Node,
// no se instala nada). El controller solo le pide trabajo y traduce el
// resultado a HTTP.
//
// Novedad respecto de ServiceManager: una reserva se RELACIONA con
// servicios. Para validar que un servicio existe antes de agregarlo a
// una reserva, este manager usa un ServiceManager por dentro.
// ---------------------------------------------------------------------

import fs from 'fs/promises';
import { ServiceManager } from './ServiceManager.js';

// Ruta relativa al directorio desde donde se ejecuta Node (la raíz del
// proyecto), igual que en ServiceManager.
const PATH = './src/data/bookings.json';

export class BookingManager {
  constructor() {
    // Instanciamos un ServiceManager para poder preguntarle "¿existe el
    // servicio con este id?" cuando alguien quiere sumarlo a una reserva.
    // Así reutilizamos la persistencia de services sin duplicar código.
    this.serviceManager = new ServiceManager();
  }

  // -----------------------------------------------------------------
  // Auxiliares privados de acceso al archivo (el # los hace privados:
  // solo se llaman desde adentro de esta clase).
  // -----------------------------------------------------------------

  // Lee el archivo completo y lo devuelve parseado como array. Si el
  // archivo no existe o tiene JSON inválido, devolvemos [] en vez de
  // romper la app.
  async #read() {
    try {
      const content = await fs.readFile(PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  // Recibe el array completo de reservas y lo escribe, reemplazando todo
  // el contenido anterior. El tercer argumento de JSON.stringify (2)
  // indenta el archivo para que sea legible al abrirlo a mano.
  async #write(bookings) {
    await fs.writeFile(PATH, JSON.stringify(bookings, null, 2));
  }

  // -----------------------------------------------------------------
  // Operaciones del recurso
  // -----------------------------------------------------------------

  // GET /api/bookings/:bid
  // Devuelve la reserva con ese id, o null si no existe (el controller
  // decide qué status HTTP corresponde a ese null).
  async getBookingById(id) {
    const bookings = await this.#read();
    const booking = bookings.find((b) => b.id === Number(id));
    return booking ?? null;
  }

  // POST /api/bookings
  // Flujo: leer todo -> calcular el próximo id -> armar la reserva con
  // valores por defecto -> guardar -> devolver la reserva creada.
  async createBooking(data) {
    const bookings = await this.#read();

    // Id incremental: mayor id existente + 1. Si el archivo está vacío,
    // arrancamos en 1.
    const maxId = bookings.reduce((max, b) => Math.max(max, b.id), 0);

    const newBooking = {
      id: maxId + 1,
      // Si el cliente no manda "client", guardamos 'Anónimo'. El operador
      // ?? usa el valor de la derecha solo si el de la izquierda es
      // null o undefined.
      client: data.client ?? 'Anónimo',
      date: data.date ?? null,
      // Toda reserva nace "pendiente"; el cambio de estado es tema de
      // otra clase.
      status: 'pending',
      // La reserva arranca SIN servicios; se agregan después con
      // addServiceToBooking.
      services: [],
    };

    bookings.push(newBooking);
    await this.#write(bookings);

    return newBooking;
  }

  // Persistencia pura: busca la reserva por id, le mezcla los campos
  // que llegan en data (preservando el id) y reescribe el archivo.
  // Devuelve la reserva actualizada, o null si no existe. NO aplica
  // ninguna regla de negocio: quien llama ya decidió qué guardar.
  async updateBooking(id, data) {
    const bookings = await this.#read();
    const index = bookings.findIndex((b) => b.id === Number(id));

    if (index === -1) {
      return null;
    }

    const updatedBooking = { ...bookings[index], ...data, id: bookings[index].id };
    bookings[index] = updatedBooking;
    await this.#write(bookings);

    return updatedBooking;
  }

  // POST /api/bookings/:bid/services/:sid
  // Agrega un servicio a una reserva existente.
  //
  // Devuelve un objeto que describe el resultado, y el controller lo
  // traduce a HTTP:
  //   { error: 'SERVICE_NOT_FOUND' } -> 404
  //   { error: 'BOOKING_NOT_FOUND' } -> 404
  //   { booking }                    -> 200 (reserva actualizada)
  async addServiceToBooking(bid, sid) {
    // 1) ¿Existe el servicio? Se lo preguntamos al ServiceManager.
    //    Si no existe, no tiene sentido seguir.
    const service = await this.serviceManager.getServiceById(sid);
    if (!service) {
      return { error: 'SERVICE_NOT_FOUND' };
    }

    // 2) ¿Existe la reserva? Leemos el archivo y la buscamos.
    const bookings = await this.#read();
    const index = bookings.findIndex((b) => b.id === Number(bid));
    if (index === -1) {
      return { error: 'BOOKING_NOT_FOUND' };
    }

    const booking = bookings[index];

    // 3) ¿El servicio YA está en la reserva?
    //
    //    IMPORTANTE: en booking.services NO guardamos el objeto completo
    //    del servicio (name, price, duration...), solo su REFERENCIA: el
    //    id. ¿Por qué?
    //      - Evitamos duplicar datos: el nombre/precio del servicio vive
    //        en un solo lugar (services.json). Si mañana cambia el
    //        precio, no hay copias viejas desperdigadas en cada reserva.
    //      - Evitamos inconsistencias: una sola fuente de verdad.
    //    Cuando haga falta mostrar el detalle, se "resuelve" la
    //    referencia pidiéndole el servicio al ServiceManager por ese id.
    const item = booking.services.find((s) => s.service === Number(sid));

    if (item) {
      // Ya estaba: en vez de hacer push de un segundo item repetido
      // (que dejaría la lista con dos entradas del mismo servicio y
      // obligaría a sumar cantidades al leer), incrementamos su
      // quantity. Una entrada por servicio + un contador: más simple
      // de leer y de mostrar.
      item.quantity += 1;
    } else {
      // No estaba: lo agregamos como referencia + cantidad inicial 1.
      // Number(sid) porque los :params de la URL siempre llegan como
      // string y queremos guardar un número.
      booking.services.push({ service: Number(sid), quantity: 1 });
    }

    // 4) Guardamos el array completo y devolvemos la reserva actualizada.
    bookings[index] = booking;
    await this.#write(bookings);

    return { booking };
  }
}
