// ---------------------------------------------------------------------
// ServiceRepository: puente entre el SERVICE (reglas de negocio) y el
// DAO (persistencia). No aplica ninguna regla de negocio: solo delega.
//
// ¿Para qué sirve esta capa si "solo delega"? Por INYECCIÓN DE
// DEPENDENCIAS: el repository recibe el DAO por constructor, con un
// valor por defecto. Esto significa que:
//   - El service NUNCA instancia un DAO directamente; solo conoce al
//     repository.
//   - El día que migremos a MongoDB, alcanza con crear
//     "services.mongo.dao.js" y cambiar acá qué DAO se instancia por
//     defecto (o pasar otro en el constructor, por ejemplo en los
//     tests). El service no se entera del cambio.
// ---------------------------------------------------------------------

// import { ServiceFsDao } from '../dao/fileSystem/services.fs.dao.js';
import { ServiceMongoDao } from '../dao/mongo/services.mongo.dao.js';

export class ServiceRepository {
  // Semana 6: cambiamos el DAO por defecto de FileSystem a MongoDB.
  // La línea de arriba queda comentada a propósito, para mostrar que la
  // persistencia anterior sigue existiendo: alcanzaría con volver a
  // cambiar este default (o inyectar new ServiceFsDao() a mano) para
  // volver atrás sin tocar el resto de la app.
  constructor(dao = new ServiceMongoDao()) {
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

  async delete(id) {
    return this.dao.delete(id);
  }
}
