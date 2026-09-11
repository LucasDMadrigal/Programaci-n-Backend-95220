// ---------------------------------------------------------------------
// BookingRepository: puente entre el SERVICE y el DAO de "bookings".
// Mismo patrón que ServiceRepository (ver ese archivo para el porqué de
// la inyección de dependencias con valor por defecto).
// ---------------------------------------------------------------------

import { BookingFsDao } from '../dao/fileSystem/bookings.fs.dao.js';

export class BookingRepository {
  constructor(dao = new BookingFsDao()) {
    this.dao = dao;
  }

  async getAll() {
    return this.dao.getAll();
  }

  async getById(id) {
    return this.dao.getById(id);
  }

  async create(data) {
    return this.dao.create(data);
  }

  async update(id, data) {
    return this.dao.update(id, data);
  }
}
