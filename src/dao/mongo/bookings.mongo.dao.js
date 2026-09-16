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

    return BookingModel.findById(id);
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