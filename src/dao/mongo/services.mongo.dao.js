// ---------------------------------------------------------------------
// ServiceMongoDao: PERSISTENCIA PURA del recurso "services" sobre
// MongoDB, usando el model de Mongoose ServiceModel.
//
// Misma interfaz que ServiceFsDao (getAll/getById/create/update/delete):
// el repository no se entera de qué DAO está usando, solo llama a estos
// métodos. Esto es lo que permite migrar de FileSystem a Mongo con un
// cambio de una línea en services.repository.js.
// ---------------------------------------------------------------------

import mongoose from 'mongoose';
import { ServiceModel } from '../models/service.model.js';

export class ServiceMongoDao {
  async getAll() {
    return ServiceModel.find({ delete: false });
  }

  // Semana 8: versión paginada de getAll. Recibe el filtro de Mongo ya
  // armado (por ejemplo { category: 'salud', available: true }) y las
  // opciones de paginación ({ page, limit, sort }), y devuelve el
  // resultado de paginate: { docs, totalDocs, limit, page, totalPages,
  // hasPrevPage, hasNextPage, prevPage, nextPage, ... }.
  //
  // getAll() queda INTACTO: lo siguen usando las vistas y los sockets,
  // que necesitan la lista completa, no una página.
  async getPaginated(filter = {}, options = {}) {
    // Igual que getAll, nunca devolvemos servicios con borrado lógico.
    // Lo agregamos acá (persistencia) para que ninguna capa de arriba
    // tenga que acordarse de hacerlo.
    return ServiceModel.paginate({ ...filter, delete: false }, options);
  }

  async getById(id) {
    // Si el id no tiene el formato de un ObjectId de Mongo, ni siquiera
    // vale la pena consultar la base: Mongoose tiraría un CastError (un
    // error 500 feo). Devolvemos null acá para que la capa de arriba lo
    // traduzca en un 404 limpio, como si el id simplemente no existiera.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return ServiceModel.findById(id);
  }

  async create(data) {
    return ServiceModel.create(data);
  }

  async update(id, data) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    // { new: true } hace que findByIdAndUpdate devuelva el documento YA
    // actualizado; sin esa opción, Mongoose devuelve el documento como
    // estaba ANTES del update.
    return ServiceModel.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    // return ServiceModel.findByIdAndDelete(id);
    return ServiceModel.findByIdAndUpdate(id, { delete: true }, { new: true });
  }
}
