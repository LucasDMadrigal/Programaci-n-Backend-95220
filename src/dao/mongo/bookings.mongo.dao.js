// ---------------------------------------------------------------------
// BookingMongoDao: PERSISTENCIA PURA del recurso "bookings" sobre
// MongoDB, usando el model de Mongoose BookingModel.
//
// Misma interfaz que BookingFsDao (getAll/getById/create/update). Ver
// services.mongo.dao.js para el porqué del chequeo de isValid(id).
// ---------------------------------------------------------------------

import mongoose from 'mongoose';
import { BookingModel } from '../models/booking.model.js';

export class BookingMongoDao {
  async getAll() {
    return BookingModel.find();
  }

  async getById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    // Semana 8: populate. En la base, cada item de booking.services
    // guarda solo { service: <ObjectId>, quantity }. .populate() hace
    // una segunda consulta a la colección "services" (la del ref del
    // schema) y REEMPLAZA cada ObjectId por el documento completo del
    // servicio. Es el equivalente a un JOIN de SQL, pero resuelto por
    // Mongoose. La base no cambia: solo cambia lo que devolvemos.
   // populate('nombreDelArrayQueEsReferencia.nombreDelCampoQueEsReferencia')
   // es la sintaxis para poblar un array de subdocumentos que a su vez tiene un campo que es referencia a otra colección.
    return BookingModel.findById(id).populate('services.service');
  }

  async create(data) {
    return BookingModel.create(data);
  }

  async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    // { new: true } hace que findByIdAndUpdate devuelva el documento ya
    // actualizado, en vez del que había antes del update.
    return BookingModel.findByIdAndUpdate(id, data, { new: true });
  }

  // Semana 8 (reto): cantidad de reservas por estado, con el
  // AGGREGATION PIPELINE de MongoDB. Un pipeline es una lista de
  // "etapas" por las que pasan los documentos, una detrás de otra:
  //
  //   $group -> agrupa por el campo status (el "_id" del grupo) y, por
  //             cada documento del grupo, suma 1 en "total".
  //   $sort  -> ordena los grupos de mayor a menor total.
  //
  // Es el equivalente Mongo de este GROUP BY de SQL:
  //   SELECT status, COUNT(*) AS total FROM bookings
  //   GROUP BY status ORDER BY total DESC;
  //
  // Resultado: [{ _id: 'pending', total: 5 }, { _id: 'confirmed', total: 2 }, ...]
  async countByStatus() {
    return BookingModel.aggregate(
      [
      { $group: { _id: '$status', total: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]
  );
  }
}


/**
 * class auto() {
 *  constructor() {
 *    this.marca = "Ford";
 *    this.modelo = "Fiesta";
 *  }
 * 
 * const miAuto = new auto();
 */