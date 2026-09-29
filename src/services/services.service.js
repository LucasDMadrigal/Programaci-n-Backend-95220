// ---------------------------------------------------------------------
// Capa de SERVICE del recurso "services"
//
// Con la capa de repository + DAO, la cadena queda:
//   controller  ->  service  ->  repository  ->  dao  ->  JSON
//
//   controller  -> SOLO HTTP: traduce req/res <-> llamadas al service.
//   service     -> reglas de NEGOCIO: qué es válido, cómo se combinan
//                  los datos. NO conoce req ni res, y NUNCA instancia un
//                  DAO directamente: solo conoce a su repository.
//   repository  -> puente hacia el DAO (inyección de dependencias).
//   dao         -> persistencia pura: leer/escribir el JSON.
//
// Antes, cuando algo no existía, esta capa devolvía `null` y el
// controller decidía "null -> 404" con un if. Ahora el service lanza un
// AppError con el mensaje y el status HTTP que corresponden; el
// controller solo necesita un catch genérico (ver services.controller.js).
// ---------------------------------------------------------------------

import { ServiceRepository } from '../repositories/services.repository.js';
import { AppError } from '../utils/AppError.js';

export class ServiceService {
  // Regla de DI: el service recibe el repository por constructor (con
  // un valor por defecto). Así nunca instancia el DAO directamente, y
  // en los tests se le puede inyectar un repository de mentira.
  constructor(repository = new ServiceRepository()) {
    this.repository = repository;
  }

  // Devuelve la lista de servicios. Regla de negocio: si llega un
  // filtro por categoría, se aplica acá (el controller solo nos pasa lo
  // que vino en la query string, no filtra nada).
  async getServices(filtro = {}) {
    const { category } = filtro;

    const servicios = await this.repository.getAll();

    if (category) {
      return servicios.filter((servicio) => servicio.category === category);
    }

    return servicios;
  }

  // Devuelve el servicio con ese id. Si no existe, lanza un AppError
  // 404: el controller lo atrapa y responde con ese mismo status.
  async getServiceById(id) {
    const servicio = await this.repository.getById(id);

    if (!servicio) {
      throw new AppError('Servicio no encontrado', 404);
    }

    return servicio;
  }

  // Crea un servicio. La validación de FORMATO del request (¿vino el
  // body?) queda en el controller; acá validamos la regla de NEGOCIO:
  // qué campos son obligatorios y qué valores son válidos para este
  // dominio (por ejemplo, precio negativo).
  async createService(data) {
    const { name, duration, price, category } = data;

    if (!name || !duration || !price || !category) {
      throw new AppError('Faltan campos obligatorios', 400);
    }

    if (price < 0) {
      throw new AppError('El precio no puede ser negativo', 400);
    }

    return this.repository.create(data);
  }

  // Actualiza un servicio existente. Si no existía, el repository
  // devuelve null y acá lo traducimos a un AppError 404.
  async updateService(id, data) {
    const updatedService = await this.repository.update(id, data);

    if (!updatedService) {
      throw new AppError('Servicio no encontrado', 404);
    }

    return updatedService;
  }

  // Elimina un servicio. Si no existía, AppError 404.
  async deleteService(id) {
    const deletedService = await this.repository.delete(id);

    if (!deletedService) {
      throw new AppError('Servicio no encontrado', 404);
    }

    return deletedService;
  }
}

// Exportamos una única instancia (patrón singleton simple): todos los
// que importen este módulo comparten el mismo service y, por lo tanto,
// el mismo repository.
export const serviceService = new ServiceService();
