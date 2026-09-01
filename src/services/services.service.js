// ---------------------------------------------------------------------
// Capa de SERVICE del recurso "services"
//
// ¿Por qué existe esta capa nueva? Hasta ahora teníamos:
//   controller  ->  manager
// El controller mezclaba dos cosas: hablar HTTP (leer req, elegir el
// status, armar la respuesta) Y las reglas de negocio (filtrar, decidir
// qué es un dato inválido, etc.). El manager, por su lado, a veces
// terminaba haciendo más que persistir.
//
// Con la capa de service la cadena queda:
//   controller  ->  service  ->  manager
//
//   controller -> SOLO HTTP: traduce req/res <-> llamadas al service.
//   service    -> reglas de NEGOCIO: qué operaciones existen, qué es
//                 válido, cómo se combinan los datos. NO conoce req ni
//                 res: recibe y devuelve objetos/valores de dominio.
//   manager    -> SOLO persistencia: leer/escribir el JSON (#read/#write)
//                 y CRUD sobre ese archivo.
//
// Este service instancia su propio ServiceManager y lo usa por dentro.
// Hacia afuera expone métodos de negocio (getServices, getServiceById,
// createService, ...) que devuelven datos de dominio o null.
// ---------------------------------------------------------------------

import { ServiceManager } from '../managers/ServiceManager.js';

class ServicesService {
  constructor() {
    // El service es dueño de su manager: nadie más lo instancia.
    this.serviceManager = new ServiceManager();
  }

  // Devuelve la lista de servicios. Regla de negocio: si llega un
  // filtro por categoría, se aplica acá (el controller solo nos pasa
  // lo que vino en la query string, no filtra nada).
  async getServices(filtro = {}) {
    const { category } = filtro;

    const servicios = await this.serviceManager.getServices();

    if (category) {
      return servicios.filter((servicio) => servicio.category === category);
    }

    return servicios;
  }

  // Devuelve el servicio con ese id, o null si no existe. La decisión
  // de "null -> 404" es del controller; acá solo informamos el hecho
  // de dominio "no existe".
  async getServiceById(id) {
    return this.serviceManager.getServiceById(id);
  }

  // Crea un servicio. La validación de FORMATO del request (campos
  // obligatorios) se queda en el controller porque es una regla del
  // protocolo HTTP; acá asumimos que los datos ya vienen completos y
  // solo orquestamos la persistencia.
  async createService(data) {
    return this.serviceManager.addService(data);
  }

  // Actualiza un servicio existente. Devuelve el servicio ya
  // actualizado, o null si no existía.
  async updateService(id, data) {
    return this.serviceManager.updateService(id, data);
  }

  // Elimina un servicio. Devuelve el servicio eliminado, o null si no
  // existía.
  async deleteService(id) {
    return this.serviceManager.deleteService(id);
  }
}

// Exportamos una única instancia (patrón singleton simple): todos los
// que importen este módulo comparten el mismo service y, por lo tanto,
// el mismo manager.
export const servicesService = new ServicesService();
