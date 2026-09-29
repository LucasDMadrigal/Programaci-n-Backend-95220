// ---------------------------------------------------------------------
// BookingFsDao: PERSISTENCIA PURA del recurso "bookings" sobre FileSystem.
//
// Reemplaza a src/managers/BookingManager.js, con el mismo patrón que
// ServiceFsDao (ver ese archivo para el porqué del nombre ".fs.dao.js").
// No tiene reglas de negocio: no valida que un servicio exista, no
// aplica la regla de "quantity". Todo eso vive en bookings.service.js.
// ---------------------------------------------------------------------

import fs from 'fs/promises';

export class BookingFsDao {
  PATH = './src/data/bookings.json';

  async #readAll() {
    try {
      const content = await fs.readFile(this.PATH, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return [];
    }
  }

  async #writeAll(bookings) {
    await fs.writeFile(this.PATH, JSON.stringify(bookings, null, 2));
  }

  // Devuelve el array completo de reservas.
  async getAll() {
    return this.#readAll();
  }

  // Busca la reserva por id. Devuelve la reserva, o null si no existe.
  async getById(id) {
    const bookings = await this.#readAll();
    const booking = bookings.find((b) => b.id === Number(id));
    return booking ?? null;
  }

  // Flujo: leer todo -> calcular el próximo id -> armar el objeto nuevo
  // -> agregarlo al array -> escribir todo de nuevo en el archivo.
  async create(data) {
    const bookings = await this.#readAll();

    const maxId = bookings.reduce((max, b) => Math.max(max, b.id), 0);

    const newBooking = { id: maxId + 1, ...data };

    bookings.push(newBooking);
    await this.#writeAll(bookings);

    return newBooking;
  }

  // Flujo: leer todo -> buscar el índice -> si no existe, devolver null
  // -> si existe, mezclar los campos actuales con los nuevos
  // (preservando el id original) -> escribir todo de nuevo.
  async update(id, data) {
    const bookings = await this.#readAll();
    const index = bookings.findIndex((b) => b.id === Number(id));

    if (index === -1) {
      return null;
    }

    const updatedBooking = { ...bookings[index], ...data, id: bookings[index].id };
    bookings[index] = updatedBooking;
    await this.#writeAll(bookings);

    return updatedBooking;
  }
}
