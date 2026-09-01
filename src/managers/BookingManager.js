// ---------------------------------------------------------------------
// BookingManager: PERSISTENCIA PURA del recurso "bookings" (reservas).
//
// Mismo patrón que ServiceManager: toda la lógica de leer/escribir el
// archivo JSON queda encapsulada acá, con fs/promises (nativo de Node,
// no se instala nada).
//
// Esta clase NO tiene reglas de negocio: no valida que un servicio
// exista, no aplica la regla de "quantity", no sabe nada de HTTP. Todo
// eso vive ahora en src/services/bookings.service.js. El manager solo
// hace #read / #write y CRUD sobre el JSON, y devuelve datos o null.
// ---------------------------------------------------------------------

import fs from 'fs/promises';

// Ruta relativa al directorio desde donde se ejecuta Node (la raíz del
// proyecto), igual que en ServiceManager.
const PATH = './src/data/bookings.json';

export class BookingManager {
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
}
